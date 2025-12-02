import { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, Trash2, Check, ShoppingCart, ShoppingBag, Package, 
  Clock, Copy, Share2, Download, Settings, Edit2, Camera, 
  Upload, FileText, Store, X, AlertTriangle, Wallet, Save, Video, VideoOff,
  Lightbulb, RotateCcw, ListChecks, Tag, Banknote, ScanLine,
  Apple, Home as HomeIcon, Shirt, Zap, Heart, MoreHorizontal, ChevronRight
} from 'lucide-react';
import { useShoppingList, createShoppingItem, deleteShoppingItem, markShoppingItemAsBought, createFinanceEntry } from '@/lib/firebaseHooks';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

// Swiss stores
const stores = [
  { id: 'migros', name: 'Migros', color: 'bg-orange-500' },
  { id: 'coop', name: 'Coop', color: 'bg-orange-600' },
  { id: 'aldi', name: 'Aldi', color: 'bg-blue-600' },
  { id: 'lidl', name: 'Lidl', color: 'bg-yellow-500' },
  { id: 'denner', name: 'Denner', color: 'bg-red-600' },
  { id: 'spar', name: 'Spar', color: 'bg-green-600' },
  { id: 'volg', name: 'Volg', color: 'bg-red-500' },
  { id: 'manor', name: 'Manor', color: 'bg-purple-600' },
  { id: 'other', name: 'Andere', color: 'bg-gray-500' },
];

// Category icons and colors
const categoryConfig: Record<string, { icon: any; color: string; bg: string; chartColor: string }> = {
  'Lebensmittel': { icon: Apple, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', chartColor: '#16a34a' },
  'Haushalt': { icon: HomeIcon, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', chartColor: '#2563eb' },
  'Hygiene': { icon: Heart, color: 'text-pink-600', bg: 'bg-pink-100 dark:bg-pink-900/30', chartColor: '#db2777' },
  'Elektronik': { icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30', chartColor: '#ca8a04' },
  'Kleidung': { icon: Shirt, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30', chartColor: '#9333ea' },
  'Sonstiges': { icon: Package, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-900/30', chartColor: '#6b7280' },
};

// Default quick add templates
const defaultQuickAddTemplates = [
  { id: '1', name: 'Milch', category: 'Lebensmittel', price: 1.80 },
  { id: '2', name: 'Brot', category: 'Lebensmittel', price: 3.50 },
  { id: '3', name: 'Eier (6er)', category: 'Lebensmittel', price: 4.20 },
  { id: '4', name: 'Butter', category: 'Lebensmittel', price: 2.90 },
  { id: '5', name: 'Käse', category: 'Lebensmittel', price: 5.50 },
  { id: '6', name: 'Bananen', category: 'Lebensmittel', price: 2.50 },
  { id: '7', name: 'Äpfel', category: 'Lebensmittel', price: 3.90 },
  { id: '8', name: 'Toilettenpapier', category: 'Haushalt', price: 8.90 },
  { id: '9', name: 'Waschmittel', category: 'Haushalt', price: 12.90 },
  { id: '10', name: 'Zahnpasta', category: 'Hygiene', price: 3.50 },
  { id: '11', name: 'Shampoo', category: 'Hygiene', price: 5.90 },
  { id: '12', name: 'Duschgel', category: 'Hygiene', price: 4.50 },
];

// Shopping list templates
const listTemplates = [
  { 
    name: 'Wocheneinkauf Basics', 
    icon: ShoppingCart,
    items: ['Milch', 'Brot', 'Eier (6er)', 'Butter', 'Käse', 'Joghurt', 'Obst', 'Gemüse'] 
  },
  { 
    name: 'Party / Gäste', 
    icon: ShoppingBag,
    items: ['Chips', 'Getränke', 'Dips', 'Servietten', 'Snacks', 'Dessert'] 
  },
  { 
    name: 'Haushalts-Nachfüllung', 
    icon: HomeIcon,
    items: ['Toilettenpapier', 'Küchenrolle', 'Müllbeutel', 'Spülmittel', 'Waschmittel'] 
  },
];

// Local storage keys
const BUDGET_KEY = 'shopping_budget';
const QUICK_ADD_KEY = 'shopping_quick_add';

export default function Shopping() {
  const { t } = useTranslation();
  const { data: items = [], isLoading, refetch } = useShoppingList();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Budget state
  const [budget, setBudget] = useState(() => {
    const saved = localStorage.getItem(BUDGET_KEY);
    return saved ? JSON.parse(saved) : { amount: 0, isSet: false };
  });
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  
  // Quick add templates state
  const [quickAddTemplates, setQuickAddTemplates] = useState(() => {
    const saved = localStorage.getItem(QUICK_ADD_KEY);
    return saved ? JSON.parse(saved) : defaultQuickAddTemplates;
  });
  const [showQuickAddManager, setShowQuickAddManager] = useState(false);
  const [editingQuickAdd, setEditingQuickAdd] = useState<typeof quickAddTemplates[0] | null>(null);
  const [newQuickAdd, setNewQuickAdd] = useState({ name: '', category: 'Lebensmittel', price: 0 });
  
  // Store state
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [filterStore, setFilterStore] = useState<string>('all');
  
  // Receipt scanner state
  const [showReceiptScanner, setShowReceiptScanner] = useState(false);
  const [scannerMode, setScannerMode] = useState<'upload' | 'camera'>('upload');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedItems, setScannedItems] = useState<Array<{ name: string; price: number; quantity: number }>>([]);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  
  // Confirm dialog state
  const [showFinanceConfirm, setShowFinanceConfirm] = useState(false);
  const [pendingFinanceAmount, setPendingFinanceAmount] = useState(0);

  const [newItem, setNewItem] = useState({
    item: '',
    quantity: 1,
    category: 'Lebensmittel',
    estimatedPrice: 0,
    currency: 'CHF',
    store: '',
  });
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<typeof listTemplates[0] | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'price' | 'store'>('category');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showAllQuickAdd, setShowAllQuickAdd] = useState(false);

  const categories = ['Lebensmittel', 'Haushalt', 'Hygiene', 'Elektronik', 'Kleidung', 'Sonstiges'];

  // Save budget to localStorage
  useEffect(() => {
    localStorage.setItem(BUDGET_KEY, JSON.stringify(budget));
  }, [budget]);

  // Save quick add templates to localStorage
  useEffect(() => {
    localStorage.setItem(QUICK_ADD_KEY, JSON.stringify(quickAddTemplates));
  }, [quickAddTemplates]);

  // Computed values
  const notBoughtItems = useMemo(() => {
    let filtered = items.filter(i => i.status === 'not_bought');
    if (filterCategory !== 'all') {
      filtered = filtered.filter(i => i.category === filterCategory);
    }
    if (filterStore !== 'all') {
      filtered = filtered.filter(i => (i as any).store === filterStore);
    }
    return filtered.sort((a, b) => {
      if (sortBy === 'name') return a.item.localeCompare(b.item);
      if (sortBy === 'category') return a.category.localeCompare(b.category);
      if (sortBy === 'price') return b.estimatedPrice - a.estimatedPrice;
      if (sortBy === 'store') return ((a as any).store || '').localeCompare((b as any).store || '');
      return 0;
    });
  }, [items, filterCategory, filterStore, sortBy]);

  const boughtItems = useMemo(() => 
    items.filter(i => i.status === 'bought'), [items]);

  const totalEstimated = notBoughtItems.reduce((sum, i) => sum + (i.estimatedPrice * i.quantity), 0) / 100;
  const totalSpent = boughtItems.reduce((sum, i) => sum + ((i.actualPrice || i.estimatedPrice) * i.quantity), 0) / 100;
  
  const budgetRemaining = budget.isSet ? budget.amount - totalSpent : 0;
  const budgetProgress = budget.isSet && budget.amount > 0 ? (totalSpent / budget.amount) * 100 : 0;
  const isOverBudget = budget.isSet && totalSpent > budget.amount;

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, typeof notBoughtItems> = {};
    notBoughtItems.forEach(item => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [notBoughtItems]);

  // Chart data for category breakdown
  const categoryChartData = useMemo(() => {
    const allItems = [...notBoughtItems, ...boughtItems];
    const categoryTotals: Record<string, number> = {};
    
    allItems.forEach(item => {
      const price = (item.actualPrice || item.estimatedPrice) * item.quantity / 100;
      categoryTotals[item.category] = (categoryTotals[item.category] || 0) + price;
    });

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({
        name,
        value: Math.round(value * 100) / 100,
        color: categoryConfig[name]?.chartColor || '#6b7280'
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [notBoughtItems, boughtItems]);

  // Budget handlers
  const handleSetBudget = () => {
    const amount = parseFloat(budgetInput);
    if (amount > 0) {
      setBudget({ amount, isSet: true });
      setShowBudgetDialog(false);
      setBudgetInput('');
      toast.success(`Budget auf CHF ${amount.toFixed(2)} gesetzt`);
    }
  };

  const handleClearBudget = () => {
    setBudget({ amount: 0, isSet: false });
    toast.success('Budget zurückgesetzt');
  };

  // Quick Add Management
  const handleSaveQuickAdd = () => {
    if (editingQuickAdd) {
      setQuickAddTemplates(prev => 
        prev.map(t => t.id === editingQuickAdd.id ? editingQuickAdd : t)
      );
      toast.success('Artikel aktualisiert');
    } else if (newQuickAdd.name.trim()) {
      setQuickAddTemplates(prev => [
        ...prev,
        { ...newQuickAdd, id: Date.now().toString() }
      ]);
      setNewQuickAdd({ name: '', category: 'Lebensmittel', price: 0 });
      toast.success('Artikel hinzugefügt');
    }
    setEditingQuickAdd(null);
  };

  const handleDeleteQuickAdd = (id: string) => {
    setQuickAddTemplates(prev => prev.filter(t => t.id !== id));
    toast.success('Artikel entfernt');
  };

  const handleResetQuickAdd = () => {
    setQuickAddTemplates(defaultQuickAddTemplates);
    toast.success('Schnell-Artikel zurückgesetzt');
  };

  const handleAddItem = async () => {
    if (!newItem.item.trim()) {
      toast.error('Bitte Artikel eingeben');
      return;
    }

    try {
      await createShoppingItem({
        ...newItem,
        estimatedPrice: newItem.estimatedPrice * 100, // Convert to cents
      });
      toast.success('Artikel hinzugefügt');
      setNewItem({
        item: '',
        quantity: 1,
        category: 'Lebensmittel',
        estimatedPrice: 0,
        currency: 'CHF',
        store: '',
      });
      refetch();
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    }
  };

  const handleQuickAdd = async (template: typeof quickAddTemplates[0]) => {
    try {
      await createShoppingItem({
        item: template.name,
        quantity: 1,
        category: template.category,
        estimatedPrice: template.price * 100,
        currency: 'CHF',
      });
      toast.success(`${template.name} hinzugefügt`);
      refetch();
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    }
  };

  const handleMarkAsBought = async (itemId: string, estimatedPrice: number) => {
    try {
      await markShoppingItemAsBought(itemId, estimatedPrice, true);
      toast.success('Als eingekauft markiert ✓');
      refetch();
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      await deleteShoppingItem(itemId);
      toast.success('Artikel entfernt');
      refetch();
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    }
  };

  const handleApplyTemplate = async () => {
    if (!selectedTemplate) return;
    
    try {
      for (const itemName of selectedTemplate.items) {
        const template = quickAddTemplates.find(t => t.name === itemName);
        await createShoppingItem({
          item: itemName,
          quantity: 1,
          category: template?.category || 'Lebensmittel',
          estimatedPrice: (template?.price || 0) * 100,
          currency: 'CHF',
        });
      }
      toast.success(`${selectedTemplate.items.length} Artikel hinzugefügt`);
      setShowTemplateDialog(false);
      setSelectedTemplate(null);
      refetch();
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
      refetch();
      setShowClearConfirm(false);
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    }
  };

  // Finance integration
  const handleSyncToFinance = () => {
    if (totalSpent > 0) {
      setPendingFinanceAmount(totalSpent);
      setShowFinanceConfirm(true);
    } else {
      toast.error('Keine Ausgaben zum Synchronisieren');
    }
  };

  const confirmSyncToFinance = async () => {
    try {
      await createFinanceEntry({
        date: new Date().toISOString(),
        type: 'ausgabe',
        category: 'Lebensmittel',
        amount: Math.round(pendingFinanceAmount * 100),
        currency: 'CHF',
        description: `Einkauf (${boughtItems.length} Artikel)`,
        paymentMethod: 'Karte',
      });
      toast.success(`CHF ${pendingFinanceAmount.toFixed(2)} zu Finanzen hinzugefügt`);
      setShowFinanceConfirm(false);
      
      // Update budget
      if (budget.isSet) {
        setBudget(prev => ({
          ...prev,
          amount: Math.max(0, prev.amount - pendingFinanceAmount)
        }));
      }
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    }
  };

  const handleShareList = () => {
    const listText = notBoughtItems
      .map(i => `☐ ${i.item} (${i.quantity}x) - CHF ${(i.estimatedPrice / 100).toFixed(2)}`)
      .join('\n');
    
    if (navigator.share) {
      navigator.share({
        title: 'Meine Einkaufsliste',
        text: listText,
      });
    } else {
      navigator.clipboard.writeText(listText);
      toast.success('Liste in Zwischenablage kopiert');
    }
  };

  // Receipt Scanner Functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setCameraStream(stream);
      setIsCameraActive(true);
      
      // Attach stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Kamera konnte nicht gestartet werden. Bitte Berechtigung erteilen.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        setReceiptImage(imageData);
        stopCamera();
        setScannerMode('upload');
        processReceipt(imageData);
      }
    }
  };

  // Cleanup camera on dialog close
  useEffect(() => {
    if (!showReceiptScanner && cameraStream) {
      stopCamera();
    }
  }, [showReceiptScanner]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setReceiptImage(e.target?.result as string);
        processReceipt(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const processReceipt = async (imageData: string) => {
    setIsScanning(true);
    
    // Simulate OCR processing - in production, you would use a real OCR API
    // like Google Cloud Vision, AWS Textract, or Tesseract.js
    setTimeout(() => {
      // Demo: Extract some sample items from "receipt"
      const demoItems = [
        { name: 'Milch 1L', price: 1.85, quantity: 1 },
        { name: 'Vollkornbrot', price: 3.90, quantity: 1 },
        { name: 'Bio-Eier 6er', price: 4.50, quantity: 1 },
        { name: 'Butter', price: 2.95, quantity: 1 },
      ];
      setScannedItems(demoItems);
      setIsScanning(false);
      toast.success('Quittung analysiert - Bitte Artikel überprüfen');
    }, 2000);
  };

  const handleAddScannedItems = async () => {
    try {
      for (const item of scannedItems) {
        await createShoppingItem({
          item: item.name,
          quantity: item.quantity,
          category: 'Lebensmittel',
          estimatedPrice: item.price * 100,
          currency: 'CHF',
        });
      }
      toast.success(`${scannedItems.length} Artikel hinzugefügt`);
      setShowReceiptScanner(false);
      setScannedItems([]);
      setReceiptImage(null);
      refetch();
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    }
  };

  const formatPrice = (cents: number) => `CHF ${(cents / 100).toFixed(2)}`;

  return (
    <Layout title={t('shopping.title')}>
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Budget */}
          <Card className="col-span-1">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${isOverBudget ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                  <Wallet className={`w-5 h-5 ${isOverBudget ? 'text-red-600' : 'text-blue-600'}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Budget</p>
                  {budget.isSet ? (
                    <p className="text-lg font-bold">CHF {budget.amount.toFixed(0)}</p>
                  ) : (
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-sm font-semibold text-blue-600"
                      onClick={() => setShowBudgetDialog(true)}
                    >
                      Setzen →
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Spent */}
          <Card className="col-span-1">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${isOverBudget ? 'bg-red-100 dark:bg-red-900/30' : 'bg-orange-100 dark:bg-orange-900/30'}`}>
                  <Banknote className={`w-5 h-5 ${isOverBudget ? 'text-red-600' : 'text-orange-600'}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Ausgegeben</p>
                  <p className={`text-lg font-bold ${isOverBudget ? 'text-red-600' : 'text-orange-600'}`}>
                    CHF {totalSpent.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Open Items */}
          <Card className="col-span-1">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                  <ShoppingCart className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Offen</p>
                  <p className="text-lg font-bold">{notBoughtItems.length} <span className="text-sm font-normal text-muted-foreground">Artikel</span></p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bought Items */}
          <Card className="col-span-1">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-green-100 dark:bg-green-900/30">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Eingekauft</p>
                  <p className="text-lg font-bold">{boughtItems.length} <span className="text-sm font-normal text-muted-foreground">Artikel</span></p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Budget Progress & Category Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Budget Progress */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Budget-Übersicht</CardTitle>
                {budget.isSet && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setShowBudgetDialog(true)}>
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleClearBudget}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {budget.isSet ? (
                <div className="space-y-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-bold">CHF {budgetRemaining.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">
                        {isOverBudget ? 'über Budget' : 'verbleibend'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {Math.round(budgetProgress)}% verwendet
                      </p>
                    </div>
                  </div>
                  <Progress 
                    value={Math.min(budgetProgress, 100)} 
                    className={`h-3 ${isOverBudget ? '[&>div]:bg-red-500' : '[&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-blue-600'}`} 
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>CHF {totalSpent.toFixed(2)} ausgegeben</span>
                    <span>CHF {budget.amount.toFixed(2)} Budget</span>
                  </div>
                  {totalSpent > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full"
                      onClick={handleSyncToFinance}
                    >
                      <Banknote className="w-4 h-4 mr-2" />
                      CHF {totalSpent.toFixed(2)} zu Finanzen hinzufügen
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Wallet className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">Kein Budget gesetzt</p>
                  <Button onClick={() => setShowBudgetDialog(true)}>
                    Budget setzen
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Nach Kategorie</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryChartData.length > 0 ? (
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={25}
                          outerRadius={40}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {categoryChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-1">
                    {categoryChartData.slice(0, 4).map((cat) => (
                      <div key={cat.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="truncate max-w-[80px]">{cat.name}</span>
                        </div>
                        <span className="font-medium">CHF {cat.value.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-muted-foreground">Noch keine Artikel</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowTemplateDialog(true)}
          >
            <ListChecks className="w-4 h-4 mr-2" />
            Vorlagen
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowReceiptScanner(true)}
          >
            <ScanLine className="w-4 h-4 mr-2" />
            Quittung scannen
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowQuickAddManager(true)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Schnell-Artikel
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleShareList}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Teilen
          </Button>
          {boughtItems.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowClearConfirm(true)}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Aufräumen
            </Button>
          )}
        </div>

        {/* Quick Add Section */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Schnell hinzufügen</CardTitle>
              <div className="flex items-center gap-2">
                {quickAddTemplates.length > 8 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowAllQuickAdd(!showAllQuickAdd)}
                  >
                    {showAllQuickAdd ? 'Weniger' : `Alle ${quickAddTemplates.length} anzeigen`}
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowQuickAddManager(true)}
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  Bearbeiten
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(showAllQuickAdd ? quickAddTemplates : quickAddTemplates.slice(0, 8)).map((template) => {
                const config = categoryConfig[template.category] || categoryConfig['Sonstiges'];
                return (
                  <Button
                    key={template.id}
                    variant="outline"
                    size="sm"
                    className="h-auto py-2 px-3 gap-2 hover:bg-primary/10 hover:border-primary/50 transition-colors"
                    onClick={() => handleQuickAdd(template)}
                  >
                    <span className={`w-2 h-2 rounded-full ${config.color.replace('text-', 'bg-')}`} />
                    {template.name}
                    <span className="text-muted-foreground text-xs">
                      CHF {template.price.toFixed(2)}
                    </span>
                  </Button>
                );
              })}
            </div>
            {!showAllQuickAdd && quickAddTemplates.length > 8 && (
              <Button
                variant="link"
                size="sm"
                className="mt-2 p-0 h-auto text-xs"
                onClick={() => setShowAllQuickAdd(true)}
              >
                + {quickAddTemplates.length - 8} weitere Artikel anzeigen
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Add New Item Form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Neuer Artikel
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Row 1: Artikel + Menge */}
            <div className="flex gap-3 mb-3">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Artikel</Label>
                <Input
                  value={newItem.item}
                  onChange={(e) => setNewItem({ ...newItem, item: e.target.value })}
                  placeholder="z.B. Bio-Milch"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                />
              </div>
              <div className="w-20">
                <Label className="text-xs text-muted-foreground">Menge</Label>
                <Input
                  type="number"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                  min={1}
                />
              </div>
            </div>
            
            {/* Row 2: Kategorie + Laden + Preis + Button */}
            <div className="flex flex-wrap gap-4 items-end">
              <div className="w-[160px]">
                <Label className="text-xs text-muted-foreground">Kategorie</Label>
                <Select value={newItem.category} onValueChange={(value) => setNewItem({ ...newItem, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => {
                      const config = categoryConfig[cat];
                      const Icon = config?.icon || Package;
                      return (
                        <SelectItem key={cat} value={cat}>
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${config?.color}`} />
                            {cat}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[140px]">
                <Label className="text-xs text-muted-foreground">Laden</Label>
                <Select value={newItem.store} onValueChange={(value) => setNewItem({ ...newItem, store: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Kein Laden</SelectItem>
                    {stores.map(store => (
                      <SelectItem key={store.id} value={store.id}>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${store.color}`} />
                          {store.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[100px]">
                <Label className="text-xs text-muted-foreground">Preis (CHF)</Label>
                <Input
                  type="number"
                  value={newItem.estimatedPrice || ''}
                  onChange={(e) => setNewItem({ ...newItem, estimatedPrice: parseFloat(e.target.value) || 0 })}
                  min={0}
                  step={0.1}
                  placeholder="0.00"
                />
              </div>
              <Button onClick={handleAddItem} className="h-10">
                <Plus className="w-4 h-4 mr-1" />
                Hinzufügen
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center mb-4">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px] h-9">
              <Tag className="w-4 h-4 mr-2 shrink-0" />
              <SelectValue placeholder="Kategorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Kategorien</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStore} onValueChange={setFilterStore}>
            <SelectTrigger className="w-[160px] h-9">
              <Store className="w-4 h-4 mr-2 shrink-0" />
              <SelectValue placeholder="Laden" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Läden</SelectItem>
              {stores.map(store => (
                <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="w-[170px] h-9">
              <SelectValue placeholder="Sortieren" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="category">Nach Kategorie</SelectItem>
              <SelectItem value="name">Nach Name</SelectItem>
              <SelectItem value="price">Nach Preis</SelectItem>
              <SelectItem value="store">Nach Laden</SelectItem>
            </SelectContent>
          </Select>
          {(filterCategory !== 'all' || filterStore !== 'all') && (
            <Button variant="ghost" size="sm" onClick={() => { setFilterCategory('all'); setFilterStore('all'); }}>
              Filter zurücksetzen
            </Button>
          )}
        </div>

        {/* Shopping List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Main List */}
          <div className="lg:col-span-2">
            {/* Items grouped by category */}
            {isLoading ? (
              <Card className="h-full">
                <CardContent className="py-8 text-center text-muted-foreground h-full flex items-center justify-center">
                  Wird geladen...
                </CardContent>
              </Card>
            ) : notBoughtItems.length === 0 ? (
              <Card className="h-full">
                <CardContent className="py-8 text-center h-full flex flex-col items-center justify-center">
                  <ShoppingBag className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground text-sm">Deine Einkaufsliste ist leer</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Füge Artikel hinzu oder nutze eine Vorlage
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {Object.entries(groupedItems).map(([category, categoryItems]) => {
                    const config = categoryConfig[category] || categoryConfig['Sonstiges'];
                    const Icon = config.icon;
                    return (
                      <motion.div
                        key={category}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                      >
                        <Card>
                          <CardHeader className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-lg ${config.bg}`}>
                                <Icon className={`w-4 h-4 ${config.color}`} />
                              </div>
                              <CardTitle className="text-sm font-medium">{category}</CardTitle>
                              <Badge variant="secondary" className="ml-auto">
                                {categoryItems.length}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="py-0 px-2 pb-2">
                            <div className="space-y-1">
                              {categoryItems.map((item) => {
                                const store = stores.find(s => s.id === (item as any).store);
                                return (
                                  <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0, x: -100 }}
                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 group transition-colors"
                                  >
                                    <Checkbox
                                      checked={false}
                                      onCheckedChange={() => handleMarkAsBought(item.id, item.estimatedPrice)}
                                      className="h-5 w-5"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <p className="font-medium truncate">{item.item}</p>
                                        {store && (
                                          <Badge variant="outline" className="text-xs shrink-0">
                                            <span className={`w-1.5 h-1.5 rounded-full ${store.color} mr-1`} />
                                            {store.name}
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        {item.quantity > 1 && `${item.quantity}x · `}
                                        {formatPrice(item.estimatedPrice)}
                                      </p>
                                    </div>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                                      onClick={() => handleDelete(item.id)}
                                    >
                                      <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                                    </Button>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Sidebar - Bought Items */}
          <div>
            <Card className="h-full flex flex-col">
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    Eingekauft ({boughtItems.length})
                  </CardTitle>
                  {boughtItems.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setShowClearConfirm(true)}>
                      Leeren
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="py-0 pb-3 flex-1 flex flex-col">
                {boughtItems.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">
                      Noch nichts eingekauft
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-[300px] overflow-y-auto">
                    {boughtItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-muted/50 group"
                      >
                        <Check className="w-4 h-4 text-green-600 shrink-0" />
                        <span className="flex-1 text-sm line-through text-muted-foreground truncate">
                          {item.item}
                        </span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatPrice(item.actualPrice || item.estimatedPrice)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                
                {boughtItems.length > 0 && (
                  <div className="mt-auto pt-3 border-t">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Gesamt:</span>
                      <span className="font-bold">CHF {totalSpent.toFixed(2)}</span>
                    </div>
                    <Button 
                      className="w-full mt-2" 
                      size="sm"
                      onClick={handleSyncToFinance}
                    >
                      <Banknote className="w-4 h-4 mr-2" />
                      Zu Finanzen hinzufügen
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Budget Dialog */}
      <Dialog open={showBudgetDialog} onOpenChange={setShowBudgetDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Budget setzen
            </DialogTitle>
            <DialogDescription>
              Setze ein Budget für deinen Einkauf
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Budget (CHF)</Label>
              <Input
                type="number"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                placeholder="z.B. 100.00"
                min={0}
                step={10}
              />
            </div>
            
            <div className="flex gap-2">
              {[50, 100, 150, 200].map(amount => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => setBudgetInput(amount.toString())}
                >
                  {amount}
                </Button>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBudgetDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSetBudget}>
              Budget setzen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Add Manager Dialog */}
      <Dialog open={showQuickAddManager} onOpenChange={setShowQuickAddManager}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Schnell-Artikel verwalten
            </DialogTitle>
            <DialogDescription>
              Bearbeite Preise oder füge neue Artikel hinzu
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Add new item */}
            <div className="p-3 border rounded-lg space-y-3">
              <p className="text-sm font-medium">Neuer Artikel</p>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="Name"
                  value={newQuickAdd.name}
                  onChange={(e) => setNewQuickAdd({ ...newQuickAdd, name: e.target.value })}
                />
                <Select 
                  value={newQuickAdd.category} 
                  onValueChange={(v) => setNewQuickAdd({ ...newQuickAdd, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-1">
                  <Input
                    type="number"
                    placeholder="Preis"
                    value={newQuickAdd.price || ''}
                    onChange={(e) => setNewQuickAdd({ ...newQuickAdd, price: parseFloat(e.target.value) || 0 })}
                    step={0.1}
                  />
                  <Button size="icon" onClick={handleSaveQuickAdd} disabled={!newQuickAdd.name.trim()}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Existing items */}
            <div className="space-y-2">
              {quickAddTemplates.map((template) => (
                <div key={template.id} className="flex items-center gap-2 p-2 border rounded-lg">
                  {editingQuickAdd?.id === template.id ? (
                    <>
                      <Input
                        value={editingQuickAdd.name}
                        onChange={(e) => setEditingQuickAdd({ ...editingQuickAdd, name: e.target.value })}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={editingQuickAdd.price}
                        onChange={(e) => setEditingQuickAdd({ ...editingQuickAdd, price: parseFloat(e.target.value) || 0 })}
                        className="w-20"
                        step={0.1}
                      />
                      <Button size="icon" variant="ghost" onClick={handleSaveQuickAdd}>
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setEditingQuickAdd(null)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm">{template.name}</span>
                      <Badge variant="secondary">{template.category}</Badge>
                      <span className="text-sm text-muted-foreground">CHF {template.price.toFixed(2)}</span>
                      <Button size="icon" variant="ghost" onClick={() => setEditingQuickAdd(template)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDeleteQuickAdd(template.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleResetQuickAdd}>
              Zurücksetzen
            </Button>
            <Button onClick={() => setShowQuickAddManager(false)}>
              Fertig
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Scanner Dialog */}
      <Dialog open={showReceiptScanner} onOpenChange={setShowReceiptScanner}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanLine className="w-5 h-5" />
              Quittung scannen
            </DialogTitle>
            <DialogDescription>
              Lade ein Foto deiner Quittung hoch oder scanne sie mit der Kamera
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Upload/Camera Toggle */}
            <div className="flex gap-2">
              <Button
                variant={scannerMode === 'upload' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setScannerMode('upload')}
              >
                <Upload className="w-4 h-4 mr-2" />
                Hochladen
              </Button>
              <Button
                variant={scannerMode === 'camera' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setScannerMode('camera')}
              >
                <Camera className="w-4 h-4 mr-2" />
                Kamera
              </Button>
            </div>

            {/* Upload Area */}
            {scannerMode === 'upload' && (
              <div 
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {receiptImage ? (
                  <div className="space-y-3">
                    <img src={receiptImage} alt="Quittung" className="max-h-48 mx-auto rounded" />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setReceiptImage(null);
                        setScannedItems([]);
                      }}
                    >
                      Anderes Bild wählen
                    </Button>
                  </div>
                ) : (
                  <>
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Klicke hier oder ziehe ein Bild hierher
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG oder HEIC
                    </p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            )}

            {/* Camera View */}
            {scannerMode === 'camera' && (
              <div className="space-y-3">
                <div className="border rounded-lg overflow-hidden bg-black aspect-video relative">
                  {isCameraActive ? (
                    <video 
                      ref={videoRef}
                      autoPlay 
                      playsInline 
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <Camera className="w-12 h-12 text-white/40 mb-3" />
                      <p className="text-white/60 text-sm">Kamera nicht aktiv</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 justify-center">
                  {!isCameraActive ? (
                    <Button onClick={startCamera} className="flex-1">
                      <Video className="w-4 h-4 mr-2" />
                      Kamera starten
                    </Button>
                  ) : (
                    <>
                      <Button onClick={stopCamera} variant="outline">
                        <VideoOff className="w-4 h-4 mr-2" />
                        Stoppen
                      </Button>
                      <Button onClick={capturePhoto} className="flex-1">
                        <Camera className="w-4 h-4 mr-2" />
                        Foto aufnehmen
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Loading State */}
            {isScanning && (
              <div className="text-center py-4">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Analysiere Quittung...</p>
              </div>
            )}

            {/* Scanned Items */}
            {scannedItems.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Erkannte Artikel:</p>
                {scannedItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 border rounded-lg">
                    <span className="flex-1 text-sm">{item.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {item.quantity}x CHF {item.price.toFixed(2)}
                    </span>
                    <Button 
                      size="icon" 
                      variant="ghost"
                      onClick={() => setScannedItems(prev => prev.filter((_, i) => i !== idx))}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm font-medium">Gesamt:</span>
                  <span className="font-bold">
                    CHF {scannedItems.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowReceiptScanner(false);
              setScannedItems([]);
              setReceiptImage(null);
            }}>
              Abbrechen
            </Button>
            {scannedItems.length > 0 && (
              <Button onClick={handleAddScannedItems}>
                {scannedItems.length} Artikel hinzufügen
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Finance Confirmation Dialog */}
      <AlertDialog open={showFinanceConfirm} onOpenChange={setShowFinanceConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5" />
              Ausgabe zu Finanzen hinzufügen?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du CHF {pendingFinanceAmount.toFixed(2)} als Ausgabe in deinen Finanzen erfassen?
              {budget.isSet && (
                <span className="block mt-2 text-orange-600">
                  Dein verbleibendes Budget wird entsprechend reduziert.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSyncToFinance}>
              Ja, hinzufügen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear Confirmation Dialog */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eingekaufte Artikel löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Alle {boughtItems.length} eingekauften Artikel werden aus der Liste entfernt. Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearBought}>Löschen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListChecks className="w-5 h-5" />
              Vorlagen
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Wähle eine Vorlage, um schnell mehrere Artikel hinzuzufügen
            </p>
            
            <div className="grid gap-3">
              {listTemplates.map((template) => {
                const Icon = template.icon;
                const isSelected = selectedTemplate?.name === template.name;
                return (
                  <button
                    key={template.name}
                    onClick={() => setSelectedTemplate(template)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      isSelected 
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary/20' : 'bg-muted'}`}>
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{template.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {template.items.length} Artikel
                        </p>
                      </div>
                      {isSelected && <Check className="w-5 h-5 text-primary" />}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {template.items.slice(0, 5).map((item) => (
                        <Badge key={item} variant="secondary" className="text-xs">
                          {item}
                        </Badge>
                      ))}
                      {template.items.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{template.items.length - 5} mehr
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Add Items */}
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-3">Oder einzelne Artikel:</p>
              <div className="flex flex-wrap gap-2">
                {quickAddTemplates.slice(0, 8).map((template) => (
                  <Button
                    key={template.id}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleQuickAdd(template);
                      setShowTemplateDialog(false);
                    }}
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleApplyTemplate} disabled={!selectedTemplate}>
              {selectedTemplate ? `${selectedTemplate.items.length} Artikel hinzufügen` : 'Vorlage wählen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
