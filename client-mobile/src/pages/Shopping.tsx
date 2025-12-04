import { useState, useMemo, useRef, useEffect } from 'react';
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
  const [scannerType, setScannerType] = useState<'receipt' | 'single'>('receipt'); // NEW: receipt vs single item
  const [isScanning, setIsScanning] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [scannedItems, setScannedItems] = useState<ReceiptItem[]>([]);
  const [liveScannedItems, setLiveScannedItems] = useState<ReceiptItem[]>([]); // NEW: for live scanning
  const [liveTotal, setLiveTotal] = useState(0); // NEW: running total
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

  // Scanner state
  const [scannerStatus, setScannerStatus] = useState<'idle' | 'scanning' | 'detected' | 'capturing' | 'adjusting'>('idle');
  const [detectionProgress, setDetectionProgress] = useState(0);
  const animationRef = useRef<number | null>(null);
  
  // Corner points for manual adjustment (percentage based)
  const [corners, setCorners] = useState({
    topLeft: { x: 10, y: 15 },
    topRight: { x: 90, y: 15 },
    bottomLeft: { x: 10, y: 75 },
    bottomRight: { x: 90, y: 75 }
  });
  const [activeCorner, setActiveCorner] = useState<string | null>(null);
  const [showManualMode, setShowManualMode] = useState(false);

  // Camera functions with auto-detection
  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Kamera wird nicht unterstützt');
        setScannerMode('upload');
        return;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', 
          width: { ideal: 3840 },  // 4K für bessere OCR
          height: { ideal: 2160 } 
        }
      });
      setCameraStream(stream);
      setScannerStatus('scanning');
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        toast.success('Scanner aktiv');
        startEdgeDetection();
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Kamera-Berechtigung verweigert');
      } else {
        toast.error('Kamera-Fehler: ' + error.message);
      }
      setScannerMode('upload');
    }
  };

  const stopCamera = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setScannerStatus('idle');
    setDetectionProgress(0);
  };

  // No auto-detection - fixed frame in center
  const startEdgeDetection = () => {
    // Set fixed frame position (center of screen with good margins)
    setCorners({
      topLeft: { x: 15, y: 10 },
      topRight: { x: 85, y: 10 },
      bottomLeft: { x: 15, y: 85 },
      bottomRight: { x: 85, y: 85 }
    });
    setScannerStatus('scanning');
    setDetectionProgress(0);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    setScannerStatus('capturing');
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(video, 0, 0);
      toast.success('Foto aufgenommen!');
      
      // Maximale Qualität für bessere OCR-Erkennung
      canvas.toBlob(async (blob) => {
        if (blob) {
          stopCamera();
          console.log(`Photo size: ${blob.size} bytes`);
          const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
          await analyzeShoppingList(file);
        }
      }, 'image/jpeg', 1.0);
    }
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  // Handle corner dragging
  const handleCornerMove = (e: React.TouchEvent | React.MouseEvent, cornerName: string) => {
    if (!activeCorner || activeCorner !== cornerName) return;
    
    const container = (e.target as HTMLElement).closest('.scanner-container');
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const x = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(5, Math.min(95, ((clientY - rect.top) / rect.height) * 100));
    
    setCorners(prev => ({
      ...prev,
      [cornerName]: { x, y }
    }));
  };
  
  const handleCornerStart = (cornerName: string) => {
    setActiveCorner(cornerName);
    setScannerStatus('adjusting');
  };
  
  const handleCornerEnd = () => {
    setActiveCorner(null);
    if (cameraStream) {
      setScannerStatus('scanning');
    }
  };
  
  // Reset corners to default
  const resetCorners = () => {
    setCorners({
      topLeft: { x: 10, y: 15 },
      topRight: { x: 90, y: 15 },
      bottomLeft: { x: 10, y: 75 },
      bottomRight: { x: 90, y: 75 }
    });
  };
  
  // Capture with perspective correction
  const captureWithPerspective = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    setScannerStatus('capturing');
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Calculate pixel coordinates from percentages
    const srcWidth = video.videoWidth;
    const srcHeight = video.videoHeight;
    
    const pts = {
      tl: { x: (corners.topLeft.x / 100) * srcWidth, y: (corners.topLeft.y / 100) * srcHeight },
      tr: { x: (corners.topRight.x / 100) * srcWidth, y: (corners.topRight.y / 100) * srcHeight },
      bl: { x: (corners.bottomLeft.x / 100) * srcWidth, y: (corners.bottomLeft.y / 100) * srcHeight },
      br: { x: (corners.bottomRight.x / 100) * srcWidth, y: (corners.bottomRight.y / 100) * srcHeight }
    };
    
    // Calculate output dimensions
    const width = Math.max(
      Math.sqrt(Math.pow(pts.tr.x - pts.tl.x, 2) + Math.pow(pts.tr.y - pts.tl.y, 2)),
      Math.sqrt(Math.pow(pts.br.x - pts.bl.x, 2) + Math.pow(pts.br.y - pts.bl.y, 2))
    );
    const height = Math.max(
      Math.sqrt(Math.pow(pts.bl.x - pts.tl.x, 2) + Math.pow(pts.bl.y - pts.tl.y, 2)),
      Math.sqrt(Math.pow(pts.br.x - pts.tr.x, 2) + Math.pow(pts.br.y - pts.tr.y, 2))
    );
    
    canvas.width = Math.round(width);
    canvas.height = Math.round(height);
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // For now, just crop to the bounding box (simple approach)
      const minX = Math.min(pts.tl.x, pts.bl.x);
      const minY = Math.min(pts.tl.y, pts.tr.y);
      const maxX = Math.max(pts.tr.x, pts.br.x);
      const maxY = Math.max(pts.bl.y, pts.br.y);
      
      ctx.drawImage(
        video,
        minX, minY, maxX - minX, maxY - minY,
        0, 0, canvas.width, canvas.height
      );
      
      toast.success('Foto aufgenommen!');
      
      canvas.toBlob(async (blob) => {
        if (blob) {
          stopCamera();
          const file = new File([blob], 'receipt.jpg', { type: 'image/jpeg' });
          await analyzeShoppingList(file);
        }
      }, 'image/jpeg', 0.95);
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
        try {
          const base64 = (reader.result as string).split(',')[1];
          
          toast.info('Analysiere mit OCR...');
          
          // Use the intelligent receipt analyzer
          const analyzeReceipt = httpsCallable(functions, 'analyzeReceipt');
          const result = await analyzeReceipt({
            fileData: base64,
            fileType: file.type || 'image/jpeg',
            fileName: file.name || 'photo.jpg',
          });
          
          const data = result.data as any;
          console.log('OCR Result:', data);
          
          if (data.success && data.items && data.items.length > 0) {
            // Store full receipt data
            setReceiptData({
              store: data.store || { name: 'Unbekannt' },
              purchase: data.purchase || {},
              items: data.items,
              totals: data.totals || { total: 0 },
              confidence: data.confidence || 50,
            });
            // Mark all items as selected
            setScannedItems(data.items.map((item: ReceiptItem) => ({ ...item, selected: true })));
            toast.success(`${data.items.length} Artikel erkannt!`);
          } else {
            // Better error messages
            if (data.error?.includes('Vision API') || data.error?.includes('PERMISSION_DENIED')) {
              toast.error(
                'OCR nicht verfügbar. Google Cloud Vision API muss aktiviert werden.',
                { duration: 5000 }
              );
            } else if (data.error?.includes('billing')) {
              toast.error('Google Cloud Billing erforderlich', { duration: 5000 });
            } else if (data.rawText) {
              toast.error(`Text erkannt aber keine Artikel gefunden. Versuche bessere Bildqualität.`, { duration: 4000 });
              console.log('Raw text:', data.rawText);
            } else {
              toast.error(data.error || 'Keine Artikel erkannt. Bitte bessere Bildqualität verwenden.', { duration: 4000 });
            }
          }
        } catch (innerError: any) {
          console.error('Analysis error:', innerError);
          toast.error('Analysefehler: ' + (innerError.message || 'Unbekannt'));
        }
        
        setIsScanning(false);
      };
      reader.onerror = () => {
        toast.error('Datei konnte nicht gelesen werden');
        setIsScanning(false);
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('File read error:', error);
      toast.error('Fehler: ' + error.message);
      setIsScanning(false);
    }
  };

  // NEW: Scan single item for live scanning
  const scanSingleItem = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsScanning(true);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            const reader = new FileReader();
            reader.onload = async () => {
              try {
                const base64 = (reader.result as string).split(',')[1];
                
                // Use single line analyzer
                const analyzeSingleLine = httpsCallable(functions, 'analyzeSingleLine');
                const result = await analyzeSingleLine({
                  fileData: base64,
                  fileType: 'image/jpeg',
                });
                
                const data = result.data as any;
                console.log('Single item result:', data);
                
                if (data.success && data.item) {
                  // Add to live scanned items
                  const newItem: ReceiptItem = {
                    name: data.item.name,
                    articleNumber: data.item.articleNumber,
                    quantity: data.item.quantity || 1,
                    unitPrice: data.item.price,
                    totalPrice: data.item.price * (data.item.quantity || 1),
                    selected: true
                  };
                  
                  setLiveScannedItems(prev => [...prev, newItem]);
                  setLiveTotal(prev => prev + newItem.totalPrice);
                  
                  // Vibration feedback
                  if (navigator.vibrate) {
                    navigator.vibrate(100);
                  }
                  
                  toast.success(`${newItem.name} - CHF ${newItem.totalPrice.toFixed(2)}`);
                } else {
                  toast.error('Artikel nicht erkannt');
                  if (navigator.vibrate) {
                    navigator.vibrate([50, 50, 50]);
                  }
                }
              } catch (innerError: any) {
                console.error('Single scan error:', innerError);
                toast.error('Scan-Fehler');
              }
              setIsScanning(false);
            };
            reader.readAsDataURL(blob);
          } catch (error: any) {
            console.error('Blob read error:', error);
            setIsScanning(false);
          }
        }
      }, 'image/jpeg', 1.0);
    }
  };

  // NEW: Remove a live scanned item
  const removeLiveItem = (index: number) => {
    setLiveScannedItems(prev => {
      const item = prev[index];
      setLiveTotal(t => t - item.totalPrice);
      return prev.filter((_, i) => i !== index);
    });
  };

  // NEW: Add all live scanned items to shopping list
  const addLiveItemsToList = async () => {
    if (liveScannedItems.length === 0) {
      toast.error('Keine Artikel gescannt');
      return;
    }

    try {
      for (const item of liveScannedItems) {
        await createShoppingItem({
          name: item.name,
          quantity: item.quantity || 1,
          category: categorizeItem(item.name),
          store: receiptData?.store?.name || '',
          bought: false
        });
      }
      
      toast.success(`${liveScannedItems.length} Artikel hinzugefügt!`);
      setLiveScannedItems([]);
      setLiveTotal(0);
      closeScanner();
      await refetch();
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
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
    setLiveScannedItems([]); // Reset live scanner
    setLiveTotal(0);
    setScannerType('receipt'); // Reset to receipt mode
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

          {/* Scanner Type Toggle */}
          <div className="flex gap-2 px-4 py-2">
            <button
              onClick={() => { setScannerType('receipt'); setScannerMode('camera'); startCamera(); }}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 text-sm ${
                scannerType === 'receipt' && scannerMode === 'camera' ? 'bg-white text-black' : 'bg-white/20 text-white'
              }`}
            >
              <Receipt className="w-4 h-4" />
              Quittung
            </button>
            <button
              onClick={() => { setScannerType('single'); setScannerMode('camera'); startCamera(); setLiveScannedItems([]); setLiveTotal(0); }}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 text-sm ${
                scannerType === 'single' ? 'bg-white text-black' : 'bg-white/20 text-white'
              }`}
            >
              <ScanLine className="w-4 h-4" />
              Einzeln
            </button>
            <button
              onClick={() => { setScannerType('receipt'); setScannerMode('upload'); stopCamera(); }}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 text-sm ${
                scannerMode === 'upload' ? 'bg-white text-black' : 'bg-white/20 text-white'
              }`}
            >
              <Upload className="w-4 h-4" />
              Upload
            </button>
          </div>

          {/* Receipt Camera View */}
          {scannerMode === 'camera' && scannerType === 'receipt' && scannedItems.length === 0 && (
            <div className="flex-1 relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Simple guide overlay */}
              {cameraStream && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-8 border-2 border-white/60 rounded-lg" />
                  <div className="absolute top-8 left-8 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl" />
                  <div className="absolute top-8 right-8 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr" />
                  <div className="absolute bottom-8 left-8 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl" />
                  <div className="absolute bottom-8 right-8 w-6 h-6 border-b-4 border-r-4 border-white rounded-br" />
                </div>
              )}
              
              {/* Status */}
              <div className="absolute top-4 left-4 right-4 z-20">
                <div className="bg-black/60 rounded-lg p-3 text-center">
                  <p className="text-white text-sm font-medium">
                    {isScanning ? 'Analysiere...' : 'Quittung fotografieren'}
                  </p>
                </div>
              </div>
              
              {/* Bottom Controls */}
              <div className="absolute bottom-8 left-0 right-0 z-20">
                {!cameraStream ? (
                  <div className="flex justify-center">
                    <button
                      onClick={startCamera}
                      className="px-6 py-3 rounded-full bg-white shadow-lg flex items-center justify-center gap-2 active:opacity-80"
                    >
                      <Camera className="w-5 h-5 text-gray-800" />
                      <span className="font-medium text-gray-800">Kamera starten</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-center items-center gap-4">
                    <button
                      onClick={closeScanner}
                      className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center active:opacity-80"
                    >
                      <X className="w-6 h-6 text-white" />
                    </button>
                    
                    <button
                      onClick={capturePhoto}
                      disabled={isScanning}
                      className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center active:opacity-80 border-4 border-white/50"
                    >
                      {isScanning ? (
                        <div className="w-8 h-8 border-3 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-white" />
                      )}
                    </button>
                    
                    <div className="w-12 h-12" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* LIVE SINGLE ITEM SCANNER */}
          {scannerMode === 'camera' && scannerType === 'single' && (
            <div className="flex-1 flex flex-col">
              {/* Camera - Upper half */}
              <div className="flex-1 relative min-h-[40%]">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Scan line guide */}
                {cameraStream && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-[90%] h-16 border-2 border-green-400 rounded-lg bg-green-400/10 flex items-center justify-center">
                      <div className="w-full h-0.5 bg-green-400 animate-pulse" />
                    </div>
                  </div>
                )}
                
                {/* Status */}
                <div className="absolute top-2 left-2 right-2 z-20">
                  <div className="bg-black/60 rounded-lg p-2 text-center">
                    <p className="text-white text-xs font-medium">
                      {isScanning ? 'Scanne...' : 'Artikel-Zeile anvisieren'}
                    </p>
                  </div>
                </div>
                
                {/* Scan Button */}
                {cameraStream && (
                  <div className="absolute bottom-2 left-0 right-0 z-20 flex justify-center">
                    <button
                      onClick={scanSingleItem}
                      disabled={isScanning}
                      className="px-6 py-3 rounded-full bg-green-500 shadow-lg flex items-center justify-center gap-2 active:opacity-80"
                    >
                      {isScanning ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <ScanLine className="w-5 h-5 text-white" />
                      )}
                      <span className="font-medium text-white">Scannen</span>
                    </button>
                  </div>
                )}
                
                {/* Start camera button if not active */}
                {!cameraStream && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                    <button
                      onClick={startCamera}
                      className="px-6 py-3 rounded-full bg-white shadow-lg flex items-center justify-center gap-2"
                    >
                      <Camera className="w-5 h-5 text-gray-800" />
                      <span className="font-medium text-gray-800">Kamera starten</span>
                    </button>
                  </div>
                )}
              </div>
              
              {/* Scanned Items List - Lower half */}
              <div className="flex-1 bg-background overflow-y-auto">
                <div className="p-3">
                  {/* Running Total */}
                  <div className="flex items-center justify-between mb-3 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Gescannt: {liveScannedItems.length}</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">CHF {liveTotal.toFixed(2)}</span>
                  </div>
                  
                  {/* Scanned items list */}
                  {liveScannedItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ScanLine className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Noch keine Artikel gescannt</p>
                      <p className="text-xs mt-1">Visiere eine Artikel-Zeile an und drücke "Scannen"</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {liveScannedItems.map((item, idx) => (
                        <div 
                          key={idx}
                          className="p-3 bg-muted rounded-lg flex items-center justify-between"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantity}x à CHF {item.unitPrice.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">CHF {item.totalPrice.toFixed(2)}</span>
                            <button
                              onClick={() => removeLiveItem(idx)}
                              className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center"
                            >
                              <X className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Action buttons */}
                  {liveScannedItems.length > 0 && (
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => { setLiveScannedItems([]); setLiveTotal(0); }}
                        className="flex-1 py-3 rounded-lg bg-muted flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Löschen
                      </button>
                      <button
                        onClick={addLiveItemsToList}
                        className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Zur Liste
                      </button>
                    </div>
                  )}
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
