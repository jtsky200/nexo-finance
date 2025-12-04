import { useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ShoppingCart, 
  Plus, 
  Check,
  X,
  Trash2,
  Camera,
  ScanLine,
  Upload,
  FileText,
  Store,
  Calendar,
  Clock,
  CreditCard,
  Receipt,
  ChevronDown,
  ChevronUp,
  Save,
  Banknote
} from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import { useShoppingList, createShoppingItem, markShoppingItemAsBought, deleteShoppingItem, createFinanceEntry } from '@/lib/firebaseHooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';

interface ReceiptItem {
  name: string;
  articleNumber?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxCategory?: string;
  selected?: boolean;
}

interface ReceiptData {
  store: {
    name: string;
    address?: string;
    city?: string;
    postalCode?: string;
  };
  purchase: {
    date?: string;
    time?: string;
    paymentMethod?: string;
  };
  items: ReceiptItem[];
  totals: {
    subtotal?: number;
    rounding?: number;
    total: number;
    itemCount?: number;
  };
  confidence: number;
}

const categories = [
  'Lebensmittel',
  'Getränke',
  'Haushalt',
  'Hygiene',
  'Tierbedarf',
  'Sonstiges'
];

export default function MobileShopping() {
  const { t } = useTranslation();
  const { data: items = [], isLoading, refetch } = useShoppingList();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: '1',
    category: 'Lebensmittel',
    store: ''
  });

  // Scanner state
  const [showScanner, setShowScanner] = useState(false);
  const [scannerMode, setScannerMode] = useState<'camera' | 'upload'>('camera');
  const [isScanning, setIsScanning] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [scannedItems, setScannedItems] = useState<ReceiptItem[]>([]);
  const [showStoreSection, setShowStoreSection] = useState(true);
  const [showItemsSection, setShowItemsSection] = useState(true);
  const [showPaymentSection, setShowPaymentSection] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const openItems = useMemo(
    () => items.filter(i => !i.bought),
    [items]
  );

  const boughtItems = useMemo(
    () => items.filter(i => i.bought),
    [items]
  );

  const handleAddItem = async () => {
    if (!newItem.name.trim()) {
      toast.error('Bitte Artikelname eingeben');
      return;
    }

    try {
      await createShoppingItem({
        name: newItem.name.trim(),
        quantity: parseInt(newItem.quantity) || 1,
        category: newItem.category,
        store: newItem.store || undefined,
        bought: false
      });
      
      toast.success('Artikel hinzugefügt');
      setShowAddDialog(false);
      setNewItem({ name: '', quantity: '1', category: 'Lebensmittel', store: '' });
      await refetch();
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    }
  };

  const handleToggleBought = async (itemId: string, currentBought: boolean) => {
    try {
      await markShoppingItemAsBought(itemId, !currentBought);
      await refetch();
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteShoppingItem(itemId);
      await refetch();
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    }
  };

  const handleClearBought = async () => {
    try {
      for (const item of boughtItems) {
        await deleteShoppingItem(item.id);
      }
      toast.success('Eingekaufte Artikel gelöscht');
      await refetch();
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    }
  };

  // Camera functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Kamera konnte nicht gestartet werden. Bitte Berechtigung erteilen.');
      setScannerMode('upload');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      canvas.toBlob(async (blob) => {
        if (blob) {
          stopCamera();
          const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
          await analyzeShoppingList(file);
        }
      }, 'image/jpeg', 0.8);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await analyzeShoppingList(file);
    }
  };

  const analyzeShoppingList = async (file: File) => {
    setIsScanning(true);
    setScannedItems([]);
    setReceiptData(null);
    
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        
        // Use the intelligent receipt analyzer
        const analyzeReceipt = httpsCallable(functions, 'analyzeReceipt');
        const result = await analyzeReceipt({
          fileData: base64,
          fileType: file.type,
          fileName: file.name,
        });
        
        const data = result.data as any;
        
        if (data.success && data.items && data.items.length > 0) {
          // Store full receipt data
          setReceiptData({
            store: data.store,
            purchase: data.purchase,
            items: data.items,
            totals: data.totals,
            confidence: data.confidence,
          });
          // Mark all items as selected
          setScannedItems(data.items.map((item: ReceiptItem) => ({ ...item, selected: true })));
          toast.success(`${data.items.length} Artikel erkannt (${data.confidence}% Konfidenz)`);
        } else {
          toast.error(data.error || 'Keine Artikel erkannt');
        }
        
        setIsScanning(false);
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
      setIsScanning(false);
    }
  };

  const handleAddScannedItems = async () => {
    const selected = scannedItems.filter(i => i.selected);
    if (selected.length === 0) {
      toast.error('Bitte mindestens einen Artikel auswählen');
      return;
    }

    try {
      for (const item of selected) {
        await createShoppingItem({
          name: item.name,
          quantity: item.quantity || 1,
          category: categorizeItem(item.name),
          store: receiptData?.store?.name || '',
          bought: false
        });
      }
      
      toast.success(`${selected.length} Artikel hinzugefügt!`);
      closeScanner();
      await refetch();
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    }
  };

  // Save receipt and add to finance
  const handleSaveReceipt = async () => {
    if (!receiptData) return;

    try {
      // Save receipt to database
      const saveReceipt = httpsCallable(functions, 'saveReceipt');
      await saveReceipt({
        receiptData,
      });

      toast.success('Quittung gespeichert!');
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    }
  };

  // Add receipt total to finance as expense
  const handleAddToFinance = async () => {
    if (!receiptData) return;

    try {
      await createFinanceEntry({
        type: 'expense',
        amount: receiptData.totals.total * 100, // Convert to cents
        category: 'Lebensmittel',
        description: `Einkauf bei ${receiptData.store.name}`,
        date: receiptData.purchase.date || new Date().toISOString().split('T')[0],
        paymentMethod: receiptData.purchase.paymentMethod || 'Karte',
        status: 'bezahlt',
      });

      toast.success('Zu Finanzen hinzugefügt!');
      closeScanner();
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    }
  };

  // Helper function to categorize items
  const categorizeItem = (name: string): string => {
    const lowerName = name.toLowerCase();
    const categories: Record<string, string[]> = {
      'Getränke': ['bier', 'wein', 'saft', 'wasser', 'cola', 'fanta', 'sprite', 'energy', 'shot', 'drink'],
      'Obst & Gemüse': ['apfel', 'orange', 'banane', 'tomate', 'salat', 'gurke', 'karotte', 'bio oran', 'gemüse'],
      'Milchprodukte': ['milch', 'joghurt', 'käse', 'butter', 'sahne', 'quark', 'naturejog'],
      'Fleisch': ['fleisch', 'steak', 'wurst', 'schinken', 'poulet', 'rind', 'schwein', 'ragout'],
      'Backwaren': ['brot', 'brötchen', 'toast', 'croissant', 'kuchen', 'keks', 'butterkeks'],
      'Süsswaren': ['schoko', 'bonbon', 'gummi', 'chips', 'zucker', 'gelatine'],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(kw => lowerName.includes(kw))) {
        return category;
      }
    }
    return 'Lebensmittel';
  };

  const openScanner = () => {
    setShowScanner(true);
    setScannedItems([]);
    setScannerMode('camera');
    setTimeout(() => startCamera(), 100);
  };

  const closeScanner = () => {
    stopCamera();
    setShowScanner(false);
    setScannedItems([]);
    setReceiptData(null);
  };

  return (
    <MobileLayout title={t('nav.shopping', 'Einkaufsliste')}>
      {/* Summary - Clean design */}
      <div className="mobile-card mb-4 bg-primary text-primary-foreground">
        <div className="flex items-center gap-3 mb-2">
          <ShoppingCart className="w-5 h-5 opacity-70" />
          <p className="text-sm opacity-70">{t('shopping.list', 'Einkaufsliste')}</p>
        </div>
        <p className="text-3xl font-semibold">{openItems.length}</p>
        <p className="text-sm opacity-60 mt-1">
          {t('shopping.itemsOpen', 'Artikel offen')}
        </p>
      </div>

      {/* Open Items */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          {t('common.loading', 'Laden...')}
        </div>
      ) : openItems.length === 0 ? (
        <div className="mobile-card text-center py-8">
          <Check className="w-10 h-10 mx-auto status-success mb-2" />
          <p className="text-muted-foreground">{t('shopping.empty', 'Liste ist leer')}</p>
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          {openItems.map((item) => (
            <div
              key={item.id}
              className="mobile-card flex items-center gap-3"
            >
              <button
                onClick={() => handleToggleBought(item.id, item.bought)}
                className="w-6 h-6 rounded border-2 border-border flex items-center justify-center shrink-0"
              >
                {/* Empty checkbox */}
              </button>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.quantity > 1 && `${item.quantity}x • `}
                  {item.category}
                  {item.store && ` • ${item.store}`}
                </p>
              </div>
              <button
                onClick={() => handleDeleteItem(item.id)}
                className="w-10 h-10 rounded-lg flex items-center justify-center text-muted-foreground active:opacity-80"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Bought Items */}
      {boughtItems.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t('shopping.bought', 'Eingekauft')} ({boughtItems.length})
            </p>
            <button
              onClick={handleClearBought}
              className="text-xs status-error active:opacity-80"
            >
              {t('shopping.clearBought', 'Löschen')}
            </button>
          </div>
          <div className="space-y-2 opacity-60">
            {boughtItems.map((item) => (
              <div
                key={item.id}
                className="mobile-card flex items-center gap-3"
              >
                <button
                  onClick={() => handleToggleBought(item.id, item.bought)}
                  className="w-6 h-6 rounded bg-status-success flex items-center justify-center shrink-0"
                >
                  <Check className="w-4 h-4 status-success" />
                </button>
                <p className="font-medium line-through flex-1 truncate">{item.name}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add Item Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
          <div className="bg-background w-full rounded-t-2xl p-6 safe-bottom animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Artikel hinzufügen</h2>
              <button
                onClick={() => setShowAddDialog(false)}
                className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <Input
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="Artikelname"
                  className="mobile-input"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <div className="w-20">
                  <Input
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                    placeholder="1"
                    className="mobile-input text-center"
                    min="1"
                  />
                </div>
                <div className="flex-1">
                  <Select
                    value={newItem.category}
                    onValueChange={(value) => setNewItem({ ...newItem, category: value })}
                  >
                    <SelectTrigger className="mobile-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Select
                  value={newItem.store || 'none'}
                  onValueChange={(value) => setNewItem({ ...newItem, store: value === 'none' ? '' : value })}
                >
                  <SelectTrigger className="mobile-input">
                    <SelectValue placeholder="Laden (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Kein Laden</SelectItem>
                    <SelectItem value="Migros">Migros</SelectItem>
                    <SelectItem value="Coop">Coop</SelectItem>
                    <SelectItem value="Aldi">Aldi</SelectItem>
                    <SelectItem value="Lidl">Lidl</SelectItem>
                    <SelectItem value="Denner">Denner</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleAddItem}
                className="w-full mobile-btn bg-primary text-primary-foreground mt-4"
              >
                Hinzufügen
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Scanner Dialog */}
      {showScanner && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-black/50">
            <h2 className="text-white font-semibold">Liste scannen</h2>
            <button
              onClick={closeScanner}
              className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2 px-4 py-2">
            <button
              onClick={() => { setScannerMode('camera'); startCamera(); }}
              className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 ${
                scannerMode === 'camera' ? 'bg-white text-black' : 'bg-white/20 text-white'
              }`}
            >
              <Camera className="w-4 h-4" />
              Kamera
            </button>
            <button
              onClick={() => { setScannerMode('upload'); stopCamera(); }}
              className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 ${
                scannerMode === 'upload' ? 'bg-white text-black' : 'bg-white/20 text-white'
              }`}
            >
              <Upload className="w-4 h-4" />
              Hochladen
            </button>
          </div>

          {/* Camera View */}
          {scannerMode === 'camera' && scannedItems.length === 0 && (
            <div className="flex-1 relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Capture Button */}
              <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                <button
                  onClick={capturePhoto}
                  disabled={isScanning}
                  className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center active:opacity-80"
                >
                  {isScanning ? (
                    <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-8 h-8 text-gray-800" />
                  )}
                </button>
              </div>

              {/* Guide */}
              <div className="absolute top-4 left-4 right-4">
                <div className="bg-black/50 rounded-lg p-3 text-center">
                  <p className="text-white text-sm">
                    Richte die Kamera auf deine Einkaufsliste
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Upload View */}
          {scannerMode === 'upload' && scannedItems.length === 0 && (
            <div className="flex-1 flex items-center justify-center p-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-sm p-8 border-2 border-dashed border-white/30 rounded-xl text-center"
              >
                <FileText className="w-12 h-12 mx-auto text-white/50 mb-4" />
                <p className="text-white font-medium">Foto auswählen</p>
                <p className="text-white/50 text-sm mt-2">JPG, PNG oder PDF</p>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                capture="environment"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          )}

          {/* Scanning Progress */}
          {isScanning && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white">Analysiere Liste...</p>
              </div>
            </div>
          )}

          {/* Structured Receipt Results */}
          {receiptData && scannedItems.length > 0 && (
            <div className="flex-1 bg-background overflow-y-auto">
              <div className="p-4 space-y-4">
                
                {/* Store Section */}
                <div className="bg-muted rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowStoreSection(!showStoreSection)}
                    className="w-full p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-primary" />
                      <span className="font-medium">Geschäft</span>
                    </div>
                    {showStoreSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {showStoreSection && (
                    <div className="px-3 pb-3 space-y-1">
                      <p className="font-semibold text-lg">{receiptData.store.name}</p>
                      {receiptData.store.address && (
                        <p className="text-sm text-muted-foreground">{receiptData.store.address}</p>
                      )}
                      {receiptData.store.city && (
                        <p className="text-sm text-muted-foreground">
                          {receiptData.store.postalCode} {receiptData.store.city}
                        </p>
                      )}
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        {receiptData.purchase.date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(receiptData.purchase.date).toLocaleDateString('de-CH')}
                          </span>
                        )}
                        {receiptData.purchase.time && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {receiptData.purchase.time}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Items Section */}
                <div className="bg-muted rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowItemsSection(!showItemsSection)}
                    className="w-full p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-primary" />
                      <span className="font-medium">Artikel ({scannedItems.length})</span>
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                        {scannedItems.filter(i => i.selected).length} ausgewählt
                      </span>
                    </div>
                    {showItemsSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {showItemsSection && (
                    <div className="px-3 pb-3">
                      <div className="flex justify-end mb-2">
                        <button
                          onClick={() => setScannedItems(items => items.map(i => ({ ...i, selected: !scannedItems.every(x => x.selected) })))}
                          className="text-xs text-primary"
                        >
                          {scannedItems.every(i => i.selected) ? 'Alle abwählen' : 'Alle auswählen'}
                        </button>
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {scannedItems.map((item, idx) => (
                          <div 
                            key={idx}
                            className={`p-2.5 rounded-lg border ${item.selected ? 'bg-background border-primary' : 'bg-background/50 border-border'}`}
                            onClick={() => setScannedItems(items => items.map((i, j) => j === idx ? { ...i, selected: !i.selected } : i))}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-5 h-5 rounded border-2 ${item.selected ? 'bg-primary border-primary' : 'border-border'} flex items-center justify-center shrink-0`}>
                                {item.selected && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{item.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {item.articleNumber && <span className="mr-2">#{item.articleNumber}</span>}
                                  {item.quantity}x à CHF {item.unitPrice.toFixed(2)}
                                </p>
                              </div>
                              <p className="font-semibold text-sm shrink-0">
                                CHF {item.totalPrice.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Section */}
                <div className="bg-muted rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowPaymentSection(!showPaymentSection)}
                    className="w-full p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-primary" />
                      <span className="font-medium">Zahlung</span>
                    </div>
                    {showPaymentSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {showPaymentSection && (
                    <div className="px-3 pb-3 space-y-2">
                      {receiptData.totals.subtotal && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Zwischensumme</span>
                          <span>CHF {receiptData.totals.subtotal.toFixed(2)}</span>
                        </div>
                      )}
                      {receiptData.totals.rounding && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Rundung</span>
                          <span>CHF {receiptData.totals.rounding.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                        <span>Total</span>
                        <span>CHF {receiptData.totals.total.toFixed(2)}</span>
                      </div>
                      {receiptData.purchase.paymentMethod && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CreditCard className="w-3 h-3" />
                          {receiptData.purchase.paymentMethod}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Confidence indicator */}
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <div className={`w-2 h-2 rounded-full ${receiptData.confidence >= 70 ? 'bg-green-500' : receiptData.confidence >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                  Erkennungsqualität: {receiptData.confidence}%
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2">
                  <Button
                    onClick={handleAddScannedItems}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {scannedItems.filter(i => i.selected).length} Artikel zur Liste
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleSaveReceipt}
                      className="flex-1"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      Speichern
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleAddToFinance}
                      className="flex-1"
                    >
                      <Banknote className="w-4 h-4 mr-1" />
                      Zu Finanzen
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FABs */}
      {!showAddDialog && !showScanner && (
        <div className="fixed right-4 bottom-20 flex flex-col gap-3 safe-bottom">
          <button 
            onClick={openScanner}
            className="w-12 h-12 rounded-full bg-secondary text-secondary-foreground shadow-lg flex items-center justify-center active:opacity-80 transition-opacity"
          >
            <ScanLine className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setShowAddDialog(true)}
            className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:opacity-80 transition-opacity"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      )}
    </MobileLayout>
  );
}
