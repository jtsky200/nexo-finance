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
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, Trash2, Check, ShoppingCart, ShoppingBag, Package, 
  Clock, Copy, Share2, Download, Settings, Edit2, Camera, 
  Upload, FileText, Store, X, AlertTriangle, Wallet, Save, Video, VideoOff,
  RotateCcw, ListChecks, Tag, Banknote, ScanLine,
  Apple, Home as HomeIcon, Shirt, Cpu, Heart, MoreHorizontal, ChevronRight
} from 'lucide-react';
import { useShoppingList, createShoppingItem, deleteShoppingItem, markShoppingItemAsBought, createFinanceEntry, useStores, useStoreItems, useReceipts } from '@/lib/firebaseHooks';
import { toast } from 'sonner';
import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
// Animations removed for better performance
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

// Receipt data interfaces
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
  'Elektronik': { icon: Cpu, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30', chartColor: '#ca8a04' },
  'Kleidung': { icon: Shirt, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30', chartColor: '#9333ea' },
  'Sonstiges': { icon: Package, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-900/30', chartColor: '#6b7280' },
};

// Quick add template type
interface QuickAddTemplate {
  id: string;
  name: string;
  category: string;
  price: number;
}

// Default quick add templates
const defaultQuickAddTemplates: QuickAddTemplate[] = [
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
  const { data: userStores = [] } = useStores();
  const { data: receipts = [] } = useReceipts(10);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Store item suggestions state
  const [selectedStoreForSuggestions, setSelectedStoreForSuggestions] = useState<string>('');
  const { data: storeItems = [] } = useStoreItems(undefined, selectedStoreForSuggestions);
  
  // Budget state
  const [budget, setBudget] = useState(() => {
    const saved = localStorage.getItem(BUDGET_KEY);
    return saved ? JSON.parse(saved) : { amount: 0, isSet: false };
  });
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  
  // Quick add templates state
  const [quickAddTemplates, setQuickAddTemplates] = useState<QuickAddTemplate[]>(() => {
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
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [scannedReceiptItems, setScannedReceiptItems] = useState<ReceiptItem[]>([]);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [showReceiptStore, setShowReceiptStore] = useState(true);
  const [showReceiptItems, setShowReceiptItems] = useState(true);
  const [showReceiptPayment, setShowReceiptPayment] = useState(true);
  
  // Confirm dialog state
  const [showFinanceConfirm, setShowFinanceConfirm] = useState(false);
  const [pendingFinanceAmount, setPendingFinanceAmount] = useState(0);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [deleteQuickAddId, setDeleteQuickAddId] = useState<string | null>(null);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  
  // Shopping list scanner & archive state
  const [showListScanner, setShowListScanner] = useState(false);
  const [listScannerMode, setListScannerMode] = useState<'scan' | 'archive'>('scan');
  const [isListScanning, setIsListScanning] = useState(false);
  const [scannedListItems, setScannedListItems] = useState<Array<{ name: string; quantity?: number; unit?: string; category?: string; selected: boolean }>>([]);
  const [scannedListImage, setScannedListImage] = useState<string | null>(null);
  const [savedTemplates, setSavedTemplates] = useState<Array<{ id: string; name: string; items: any[]; usageCount: number; createdAt: string }>>([]);
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const listScannerFileRef = useRef<HTMLInputElement>(null);

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
  const [showItemSuggestions, setShowItemSuggestions] = useState(false);
  const itemInputRef = useRef<HTMLInputElement>(null);

  const categories = ['Lebensmittel', 'Haushalt', 'Hygiene', 'Elektronik', 'Kleidung', 'Sonstiges'];

  // Save budget to localStorage
  useEffect(() => {
    localStorage.setItem(BUDGET_KEY, JSON.stringify(budget));
  }, [budget]);

  // Sync store selection for item suggestions
  useEffect(() => {
    const storeName = stores.find(s => s.id === newItem.store)?.name || '';
    setSelectedStoreForSuggestions(storeName);
  }, [newItem.store]);

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

  // Filtered item suggestions based on input
  const filteredSuggestions = useMemo(() => {
    if (!newItem.item.trim() || newItem.item.length < 2) return [];
    const searchTerm = newItem.item.toLowerCase();
    return storeItems
      .filter(item => item.name.toLowerCase().includes(searchTerm))
      .slice(0, 5);
  }, [newItem.item, storeItems]);

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
    setDeleteQuickAddId(id);
  };

  const confirmDeleteQuickAdd = () => {
    if (!deleteQuickAddId) return;
    setQuickAddTemplates(prev => prev.filter(t => t.id !== deleteQuickAddId));
    toast.success('Artikel entfernt');
    setDeleteQuickAddId(null);
  };

  const handleResetQuickAdd = () => {
    setQuickAddTemplates(defaultQuickAddTemplates);
    toast.success('Schnell-Artikel zurückgesetzt');
  };

  // ============================================
  // SHOPPING LIST SCANNER FUNCTIONS
  // ============================================
  
  // Load saved templates
  const loadTemplates = async () => {
    try {
      const getTemplates = httpsCallable(functions, 'getShoppingListTemplates');
      const result = await getTemplates({});
      setSavedTemplates((result.data as any).templates || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  // Scan shopping list from image
  const handleScanShoppingList = async (file: File) => {
    if (!file) return;
    
    setIsListScanning(true);
    setScannedListItems([]);
    
    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        setScannedListImage(reader.result as string);
        
        // Call analyze function
        const analyzeList = httpsCallable(functions, 'analyzeShoppingList');
        const result = await analyzeList({
          fileData: base64,
          fileType: file.type,
          fileName: file.name,
        });
        
        const data = result.data as any;
        
        if (data.success && data.items.length > 0) {
          setScannedListItems(data.items.map((item: any) => ({ ...item, selected: true })));
          toast.success(`${data.items.length} Artikel erkannt!`);
        } else {
          toast.error('Keine Artikel erkannt. Versuche ein anderes Bild.');
        }
        
        setIsListScanning(false);
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      toast.error('Fehler beim Scannen: ' + error.message);
      setIsListScanning(false);
    }
  };

  // Add scanned items to shopping list
  const handleAddScannedItems = async () => {
    const selectedItems = scannedListItems.filter(item => item.selected);
    if (selectedItems.length === 0) {
      toast.error('Bitte mindestens einen Artikel auswählen');
      return;
    }
    
    try {
      for (const item of selectedItems) {
        await createShoppingItem({
          item: item.name,
          quantity: item.quantity || 1,
          category: item.category || 'Sonstiges',
          estimatedPrice: 0,
          currency: 'CHF',
          store: '',
        });
      }
      
      toast.success(`${selectedItems.length} Artikel hinzugefügt!`);
      refetch();
      
      // Show save template dialog
      setShowSaveTemplateDialog(true);
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    }
  };

  // Save scanned list as template
  const handleSaveTemplate = async () => {
    if (!newTemplateName.trim()) {
      toast.error('Bitte Namen eingeben');
      return;
    }
    
    const selectedItems = scannedListItems.filter(item => item.selected);
    if (selectedItems.length === 0) {
      toast.error('Keine Artikel zum Speichern');
      return;
    }
    
    try {
      const saveTemplate = httpsCallable(functions, 'saveShoppingListTemplate');
      await saveTemplate({
        name: newTemplateName,
        items: selectedItems.map(item => ({
          name: item.name,
          quantity: item.quantity || 1,
          unit: item.unit,
          category: item.category || 'Sonstiges',
        })),
        sourceImage: scannedListImage,
      });
      
      toast.success('Liste im Archiv gespeichert!');
      setShowSaveTemplateDialog(false);
      setNewTemplateName('');
      setShowListScanner(false);
      setScannedListItems([]);
      setScannedListImage(null);
      loadTemplates();
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    }
  };

  // Use template from archive
  const handleUseTemplate = async (templateId: string) => {
    try {
      const useTemplate = httpsCallable(functions, 'useShoppingListTemplate');
      const result = await useTemplate({ templateId });
      const data = result.data as any;
      
      toast.success(`${data.addedCount} Artikel hinzugefügt!`);
      refetch();
      loadTemplates();
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    }
  };

  // Delete template
  const handleDeleteTemplate = (templateId: string) => {
    setDeleteTemplateId(templateId);
  };

  const confirmDeleteTemplate = async () => {
    if (!deleteTemplateId) return;
    try {
      const deleteTemplate = httpsCallable(functions, 'deleteShoppingListTemplate');
      await deleteTemplate({ templateId: deleteTemplateId });
      toast.success('Liste aus Archiv gelöscht');
      loadTemplates();
      setDeleteTemplateId(null);
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
      setDeleteTemplateId(null);
    }
  };

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);

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

  const handleDelete = (itemId: string) => {
    setDeleteItemId(itemId);
  };

  const confirmDeleteItem = async () => {
    if (!deleteItemId) return;
    try {
      await deleteShoppingItem(deleteItemId);
      toast.success('Artikel entfernt');
      refetch();
      setDeleteItemId(null);
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
      setDeleteItemId(null);
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
        notes: `Einkauf (${boughtItems.length} Artikel)`,
        paymentMethod: 'Karte',
        isRecurring: false,
      });
      toast.success(`CHF ${pendingFinanceAmount.toFixed(2)} zu Finanzen hinzugefügt`);
      setShowFinanceConfirm(false);
      
      // Update budget
      if (budget.isSet) {
        setBudget((prev: { amount: number; isSet: boolean }) => ({
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

  // Export list as PDF
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup blockiert');
      return;
    }

    const totalPrice = notBoughtItems.reduce((sum, i) => sum + (i.estimatedPrice * i.quantity), 0) / 100;
    const groupedByCategory: Record<string, typeof notBoughtItems> = {};
    notBoughtItems.forEach(item => {
      if (!groupedByCategory[item.category]) groupedByCategory[item.category] = [];
      groupedByCategory[item.category].push(item);
    });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Einkaufsliste</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
          h1 { font-size: 20px; margin-bottom: 5px; }
          .date { color: #666; font-size: 12px; margin-bottom: 20px; }
          .category { font-weight: bold; margin-top: 15px; padding: 5px 0; border-bottom: 1px solid #ddd; }
          .item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dotted #eee; }
          .item-name { flex: 1; }
          .item-qty { color: #666; margin: 0 10px; }
          .item-price { font-weight: 500; }
          .total { margin-top: 20px; padding-top: 10px; border-top: 2px solid #333; font-weight: bold; display: flex; justify-content: space-between; }
          .checkbox { width: 14px; height: 14px; border: 1px solid #333; margin-right: 10px; display: inline-block; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        <h1>Einkaufsliste</h1>
        <p class="date">${new Date().toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        ${Object.entries(groupedByCategory).map(([category, items]) => `
          <div class="category">${category}</div>
          ${items.map(item => `
            <div class="item">
              <span class="checkbox"></span>
              <span class="item-name">${item.item}</span>
              <span class="item-qty">${item.quantity}x</span>
              <span class="item-price">CHF ${(item.estimatedPrice * item.quantity / 100).toFixed(2)}</span>
            </div>
          `).join('')}
        `).join('')}
        <div class="total">
          <span>Total (${notBoughtItems.length} Artikel)</span>
          <span>CHF ${totalPrice.toFixed(2)}</span>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `);
    printWindow.document.close();
    toast.success('PDF wird erstellt');
  };

  // Delete all not bought items
  const handleClearAllItems = async () => {
    if (notBoughtItems.length === 0) {
      toast.error('Keine Artikel zum Löschen');
      return;
    }
    
    try {
      for (const item of notBoughtItems) {
        await deleteShoppingItem(item.id);
      }
      toast.success(`${notBoughtItems.length} Artikel gelöscht`);
      refetch();
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    }
  };

  // Re-add bought items back to list
  const handleReAddBoughtItems = async () => {
    if (boughtItems.length === 0) {
      toast.error('Keine gekauften Artikel vorhanden');
      return;
    }
    
    try {
      for (const item of boughtItems) {
        await createShoppingItem({
          item: item.item,
          quantity: item.quantity,
          category: item.category,
          estimatedPrice: item.estimatedPrice,
          currency: 'CHF',
          store: (item as any).store || '',
        });
      }
      toast.success(`${boughtItems.length} Artikel wieder hinzugefügt`);
      refetch();
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    }
  };

  // Receipt Scanner Functions
  // Scanner state for auto-detection
  const [scannerStatus, setScannerStatus] = useState<'idle' | 'scanning' | 'detected' | 'capturing'>('idle');
  const [detectionProgress, setDetectionProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  
  // Auto-detected corners (percentage based)
  const [detectedCorners, setDetectedCorners] = useState({
    topLeft: { x: 10, y: 10 },
    topRight: { x: 90, y: 10 },
    bottomLeft: { x: 10, y: 90 },
    bottomRight: { x: 90, y: 90 }
  });
  
  const startCamera = async () => {
    try {
      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Kamera wird nicht unterstützt. Bitte Bild hochladen.');
        return;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      setCameraStream(stream);
      setIsCameraActive(true);
      setScannerStatus('scanning');
      
      // Attach stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        toast.success('Scanner aktiv - Quittung im Rahmen positionieren');
        
        // Start edge detection loop
        startEdgeDetection();
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Kamera-Berechtigung verweigert. Bitte in Browsereinstellungen erlauben.');
      } else if (error.name === 'NotFoundError') {
        toast.error('Keine Kamera gefunden. Bitte Bild hochladen.');
      } else {
        toast.error('Kamera-Fehler: ' + error.message);
      }
    }
  };
  
  // Simple and reliable receipt corner detection
  // No auto-detection - fixed frame in center
  const startEdgeDetection = () => {
    // Set fixed frame position (center of screen with good margins)
    setDetectedCorners({
      topLeft: { x: 15, y: 10 },
      topRight: { x: 85, y: 10 },
      bottomLeft: { x: 15, y: 85 },
      bottomRight: { x: 85, y: 85 }
    });
    setScannerStatus('scanning');
    setDetectionProgress(0);
  };

  const stopCamera = () => {
    // Stop animation frame
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
    setScannerStatus('idle');
    setDetectionProgress(0);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      
      // Check if video has actual content
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        toast.error('Kamera noch nicht bereit. Bitte warten...');
        setScannerStatus('scanning');
        return;
      }
      
      // Stop detection loop
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      
      setScannerStatus('capturing');
      
      const canvas = document.createElement('canvas');
      // Use higher resolution for better OCR
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Draw with image smoothing disabled for sharper text
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(video, 0, 0);
        
        toast.success('Foto aufgenommen!');
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'receipt.jpg', { type: 'image/jpeg' });
            stopCamera();
            processReceipt(file);
          } else {
            toast.error('Fehler beim Erstellen des Bildes');
            setScannerStatus('scanning');
            startEdgeDetection();
          }
        }, 'image/jpeg', 0.95); // Higher quality
      }
    } else {
      toast.error('Video-Element nicht verfügbar');
    }
  };

  // Cleanup camera on dialog close
  useEffect(() => {
    if (!showReceiptScanner) {
      if (cameraStream) {
        stopCamera();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }
  }, [showReceiptScanner]);
  
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processReceipt(file);
    }
  };

  const processReceipt = async (file: File) => {
    setIsScanning(true);
    setReceiptData(null);
    setScannedReceiptItems([]);
    
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          setReceiptImage(reader.result as string);
          
          toast.info('Analysiere Quittung mit OCR...');
          
          // Use intelligent receipt analyzer
          const analyzeReceiptFn = httpsCallable(functions, 'analyzeReceipt');
          const result = await analyzeReceiptFn({
            fileData: base64,
            fileType: file.type || 'image/jpeg',
            fileName: file.name || 'photo.jpg',
          });
          
          const data = result.data as any;
          
          if (data.success && data.items && data.items.length > 0) {
            setReceiptData({
              store: data.store || { name: 'Unbekannt' },
              purchase: data.purchase || {},
              items: data.items,
              totals: data.totals || { total: 0 },
              confidence: data.confidence || 50,
            });
            setScannedReceiptItems(data.items.map((item: ReceiptItem) => ({ ...item, selected: true })));
            toast.success(`${data.items.length} Artikel erkannt (${data.confidence || 50}% Konfidenz)`);
          } else if (data.rawText) {
            // Show raw text for debugging
            toast.error(`Keine Artikel erkannt. Text gefunden: "${data.rawText.substring(0, 100)}..."`);
          } else {
            toast.error(data.error || 'Keine Artikel erkannt. Versuche bessere Bildqualität.');
          }
        } catch (innerError: any) {
          console.error('Receipt processing error:', innerError);
          toast.error('Analysefehler: ' + (innerError.message || 'Unbekannter Fehler'));
        }
        
        setIsScanning(false);
      };
      reader.onerror = () => {
        toast.error('Fehler beim Lesen der Datei');
        setIsScanning(false);
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('File read error:', error);
      toast.error('Fehler: ' + error.message);
      setIsScanning(false);
    }
  };

  // Categorize item based on name
  const categorizeReceiptItem = (name: string): string => {
    const lowerName = name.toLowerCase();
    const categories: Record<string, string[]> = {
      'Getränke': ['bier', 'wein', 'saft', 'wasser', 'cola', 'fanta', 'sprite', 'energy', 'shot', 'drink'],
      'Lebensmittel': ['apfel', 'orange', 'banane', 'tomate', 'salat', 'gurke', 'karotte', 'bio oran', 'gemüse', 'milch', 'joghurt', 'käse', 'butter', 'sahne', 'quark', 'naturejog', 'fleisch', 'steak', 'wurst', 'schinken', 'poulet', 'brot', 'brötchen', 'toast'],
      'Süsswaren': ['schoko', 'bonbon', 'gummi', 'chips', 'zucker', 'gelatine'],
      'Haushalt': ['waschmittel', 'spülmittel', 'reiniger', 'papier', 'müll', 'tüte'],
      'Hygiene': ['shampoo', 'duschgel', 'seife', 'zahnpasta', 'deo', 'creme'],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(kw => lowerName.includes(kw))) {
        return category;
      }
    }
    return 'Lebensmittel';
  };

  const handleAddReceiptScannedItems = async () => {
    const selected = scannedReceiptItems.filter(i => i.selected);
    if (selected.length === 0) {
      toast.error('Bitte mindestens einen Artikel auswählen');
      return;
    }
    
    try {
      for (const item of selected) {
        await createShoppingItem({
          item: item.name,
          quantity: item.quantity,
          category: categorizeReceiptItem(item.name),
          estimatedPrice: Math.round(item.unitPrice * 100),
          currency: 'CHF',
          store: receiptData?.store?.name || '',
        });
      }
      toast.success(`${selected.length} Artikel hinzugefügt`);
      closeReceiptScanner();
      refetch();
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    }
  };

  const handleSaveReceipt = async () => {
    if (!receiptData) return;
    
    try {
      const saveReceiptFn = httpsCallable(functions, 'saveReceipt');
      await saveReceiptFn({ receiptData });
      toast.success('Quittung gespeichert!');
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    }
  };

  const handleAddReceiptToFinance = async () => {
    if (!receiptData) return;
    
    try {
      await createFinanceEntry({
        type: 'ausgabe',
        amount: Math.round(receiptData.totals.total * 100),
        category: 'Lebensmittel',
        notes: `Einkauf bei ${receiptData.store.name}`,
        date: receiptData.purchase.date || new Date().toISOString().split('T')[0],
        paymentMethod: receiptData.purchase.paymentMethod || 'Karte',
        status: 'bezahlt',
        currency: 'CHF',
        isRecurring: false,
      });
      toast.success('Zu Finanzen hinzugefügt!');
      closeReceiptScanner();
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    }
  };

  const closeReceiptScanner = () => {
    stopCamera();
    setShowReceiptScanner(false);
    setScannedReceiptItems([]);
    setReceiptData(null);
    setReceiptImage(null);
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
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => setShowBudgetDialog(true)}>
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Budget bearbeiten</TooltipContent>
                    </UITooltip>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={handleClearBudget}>
                          <X className="w-3 h-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Budget löschen</TooltipContent>
                    </UITooltip>
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
                    className={`h-3 ${isOverBudget ? '[&>div]:bg-red-500' : '[&>div]:bg-primary'}`} 
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
                          isAnimationActive={false}
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
            Quittung
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => { setShowListScanner(true); setListScannerMode('scan'); }}
          >
            <FileText className="w-4 h-4 mr-2" />
            Liste scannen
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => { setShowListScanner(true); setListScannerMode('archive'); loadTemplates(); }}
          >
            <Copy className="w-4 h-4 mr-2" />
            Archiv ({savedTemplates.length})
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
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExportPDF}
          >
            <Download className="w-4 h-4 mr-2" />
            PDF
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
              <div className="flex-1 relative">
                <Label className="text-xs text-muted-foreground">Artikel</Label>
                <Input
                  ref={itemInputRef}
                  value={newItem.item}
                  onChange={(e) => {
                    setNewItem({ ...newItem, item: e.target.value });
                    setShowItemSuggestions(true);
                  }}
                  onFocus={() => setShowItemSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowItemSuggestions(false), 200)}
                  placeholder="z.B. Bio-Milch"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                />
                {/* Item suggestions dropdown */}
                {showItemSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {filteredSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        type="button"
                        className="w-full px-3 py-2 text-left hover:bg-muted flex items-center justify-between text-sm"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setNewItem({ 
                            ...newItem, 
                            item: suggestion.name,
                            estimatedPrice: suggestion.lastPrice,
                            category: suggestion.category || 'Lebensmittel'
                          });
                          setShowItemSuggestions(false);
                        }}
                      >
                        <span className="truncate">{suggestion.name}</span>
                        <span className="text-muted-foreground ml-2 shrink-0">
                          CHF {suggestion.lastPrice.toFixed(2)}
                        </span>
                      </button>
                    ))}
                    {selectedStoreForSuggestions && (
                      <div className="px-3 py-1.5 text-xs text-muted-foreground border-t bg-muted/50">
                        Vorschläge von {selectedStoreForSuggestions}
                      </div>
                    )}
                  </div>
                )}
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
            <SelectTrigger className="w-[160px] h-9">
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
            <SelectTrigger className="w-[160px] h-9">
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
          {notBoughtItems.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => {
                if (confirm(`Alle ${notBoughtItems.length} Artikel löschen?`)) {
                  handleClearAllItems();
                }
              }}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Alle löschen
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
                {Object.entries(groupedItems).map(([category, categoryItems]) => {
                  const config = categoryConfig[category] || categoryConfig['Sonstiges'];
                  const Icon = config.icon;
                  return (
                    <Card key={category}>
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
                              <div
                                key={item.id}
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 group"
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
                                  className="opacity-0 group-hover:opacity-100 h-8 w-8"
                                  onClick={() => handleDelete(item.id)}
                                >
                                  <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
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
                    <div className="flex gap-2 mt-2">
                      <Button 
                        className="flex-1" 
                        size="sm"
                        onClick={handleSyncToFinance}
                      >
                        <Banknote className="w-4 h-4 mr-1" />
                        Zu Finanzen
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={handleReAddBoughtItems}
                        title="Artikel erneut zur Liste hinzufügen"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </div>
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
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        size="icon" 
                        onClick={handleSaveQuickAdd} 
                        disabled={!newQuickAdd.name.trim()}
                        aria-label="Schnell-Artikel hinzufügen"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Schnell-Artikel hinzufügen</TooltipContent>
                  </UITooltip>
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
                      <UITooltip>
                        <TooltipTrigger asChild>
                          <Button size="icon" variant="ghost" onClick={handleSaveQuickAdd} aria-label="Speichern">
                            <Save className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Speichern</TooltipContent>
                      </UITooltip>
                      <UITooltip>
                        <TooltipTrigger asChild>
                          <Button size="icon" variant="ghost" onClick={() => setEditingQuickAdd(null)} aria-label="Abbrechen">
                            <X className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Abbrechen</TooltipContent>
                      </UITooltip>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm">{template.name}</span>
                      <Badge variant="secondary">{template.category}</Badge>
                      <span className="text-sm text-muted-foreground">CHF {template.price.toFixed(2)}</span>
                      <UITooltip>
                        <TooltipTrigger asChild>
                          <Button size="icon" variant="ghost" onClick={() => setEditingQuickAdd(template)} aria-label="Bearbeiten">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Bearbeiten</TooltipContent>
                      </UITooltip>
                      <UITooltip>
                        <TooltipTrigger asChild>
                          <Button size="icon" variant="ghost" onClick={() => handleDeleteQuickAdd(template.id)} aria-label="Löschen">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Löschen</TooltipContent>
                      </UITooltip>
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
      <Dialog open={showReceiptScanner} onOpenChange={(open) => !open && closeReceiptScanner()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pr-8">
            <DialogTitle className="flex items-center gap-2">
              <ScanLine className="w-5 h-5" />
              Quittung scannen
            </DialogTitle>
            <DialogDescription>
              Lade ein Foto deiner Quittung hoch oder scanne sie mit der Kamera
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Upload/Camera Toggle - Only show when no results yet */}
            {!receiptData && (
              <>
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
                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label="Datei hochladen"
                  >
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Klicke hier oder ziehe ein Bild hierher
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG, PDF oder HEIC
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </div>
                )}

                {/* Camera View */}
                {scannerMode === 'camera' && (
                  <div className="space-y-3">
                    <div className="border rounded-lg overflow-hidden bg-black aspect-[3/4] relative">
                      {isCameraActive ? (
                        <>
                          <video 
                            ref={videoRef}
                            autoPlay 
                            playsInline 
                            muted
                            className="w-full h-full object-cover"
                          />
                          {/* Hidden canvas for processing */}
                          <canvas ref={canvasRef} className="hidden" />
                          
                          {/* Scanner overlay with auto-detected corners */}
                          <div className="absolute inset-0 pointer-events-none">
                            {/* SVG overlay for detected corners */}
                            <svg className="absolute inset-0 w-full h-full">
                              {/* Dark overlay with cutout for detected area */}
                              <defs>
                                <mask id="receiptMask">
                                  <rect width="100%" height="100%" fill="white" />
                                  <polygon 
                                    points={`
                                      ${detectedCorners.topLeft.x}%,${detectedCorners.topLeft.y}% 
                                      ${detectedCorners.topRight.x}%,${detectedCorners.topRight.y}% 
                                      ${detectedCorners.bottomRight.x}%,${detectedCorners.bottomRight.y}% 
                                      ${detectedCorners.bottomLeft.x}%,${detectedCorners.bottomLeft.y}%
                                    `}
                                    fill="black"
                                  />
                                </mask>
                              </defs>
                              <rect width="100%" height="100%" fill="rgba(0,0,0,0.5)" mask="url(#receiptMask)" />
                              
                              {/* Detected area outline */}
                              <polygon 
                                points={`
                                  ${detectedCorners.topLeft.x}%,${detectedCorners.topLeft.y}% 
                                  ${detectedCorners.topRight.x}%,${detectedCorners.topRight.y}% 
                                  ${detectedCorners.bottomRight.x}%,${detectedCorners.bottomRight.y}% 
                                  ${detectedCorners.bottomLeft.x}%,${detectedCorners.bottomLeft.y}%
                                `}
                                fill="none"
                                stroke={scannerStatus === 'detected' || scannerStatus === 'capturing' ? '#22c55e' : '#ffffff'}
                                strokeWidth="3"
                                className="transition-colors duration-200"
                              />
                            </svg>
                            
                            {/* Corner markers */}
                            <div 
                              className={`absolute w-6 h-6 border-t-4 border-l-4 rounded-tl-lg transition-colors ${scannerStatus === 'detected' ? 'border-green-500' : 'border-white'}`}
                              style={{ left: `${detectedCorners.topLeft.x}%`, top: `${detectedCorners.topLeft.y}%`, transform: 'translate(-50%, -50%)' }}
                            />
                            <div 
                              className={`absolute w-6 h-6 border-t-4 border-r-4 rounded-tr-lg transition-colors ${scannerStatus === 'detected' ? 'border-green-500' : 'border-white'}`}
                              style={{ left: `${detectedCorners.topRight.x}%`, top: `${detectedCorners.topRight.y}%`, transform: 'translate(-50%, -50%)' }}
                            />
                            <div 
                              className={`absolute w-6 h-6 border-b-4 border-l-4 rounded-bl-lg transition-colors ${scannerStatus === 'detected' ? 'border-green-500' : 'border-white'}`}
                              style={{ left: `${detectedCorners.bottomLeft.x}%`, top: `${detectedCorners.bottomLeft.y}%`, transform: 'translate(-50%, -50%)' }}
                            />
                            <div 
                              className={`absolute w-6 h-6 border-b-4 border-r-4 rounded-br-lg transition-colors ${scannerStatus === 'detected' ? 'border-green-500' : 'border-white'}`}
                              style={{ left: `${detectedCorners.bottomRight.x}%`, top: `${detectedCorners.bottomRight.y}%`, transform: 'translate(-50%, -50%)' }}
                            />
                            
                            {/* Status text */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
                              <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                                scannerStatus === 'capturing' ? 'bg-green-500 text-white' :
                                scannerStatus === 'detected' ? 'bg-green-500/80 text-white' :
                                'bg-black/60 text-white'
                              }`}>
                                {scannerStatus === 'capturing' && 'Aufnahme...'}
                                {scannerStatus === 'detected' && `Erkannt! Halte still... ${Math.round(detectionProgress)}%`}
                                {scannerStatus === 'scanning' && 'Suche Quittung...'}
                              </div>
                            </div>
                            
                            {/* Progress indicator */}
                            {scannerStatus === 'detected' && (
                              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[60%]">
                                <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-green-500 transition-all duration-100"
                                    style={{ width: `${detectionProgress}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-4">
                            <Camera className="w-10 h-10 text-white/60" />
                          </div>
                          <p className="text-white/80 text-base font-medium">Scanner bereit</p>
                          <p className="text-white/50 text-sm mt-1">Tippe auf "Scanner starten"</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Instructions */}
                    {isCameraActive && (
                      <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
                        <p className="font-medium flex items-center gap-2">
                          <ScanLine className="w-4 h-4 text-primary" />
                          Automatischer Scanner aktiv
                        </p>
                        <ul className="text-muted-foreground text-xs space-y-0.5 ml-6">
                          <li>• Quittung flach halten</li>
                          <li>• Gute Beleuchtung sicherstellen</li>
                          <li>• Quittung im Rahmen positionieren</li>
                          <li>• Foto wird automatisch aufgenommen</li>
                        </ul>
                      </div>
                    )}
                    
                    <div className="flex gap-2 justify-center">
                      {!isCameraActive ? (
                        <Button onClick={startCamera} className="flex-1 h-12 text-base">
                          <ScanLine className="w-5 h-5 mr-2" />
                          Scanner starten
                        </Button>
                      ) : (
                        <>
                          <Button onClick={stopCamera} variant="outline" className="h-10">
                            <VideoOff className="w-4 h-4 mr-2" />
                            Stoppen
                          </Button>
                          <Button onClick={capturePhoto} className="flex-1 h-10">
                            <Camera className="w-4 h-4 mr-2" />
                            Manuell aufnehmen
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Loading State */}
            {isScanning && (
              <div className="text-center py-8">
                <div className="animate-spin w-10 h-10 border-3 border-primary border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-muted-foreground">Analysiere Quittung mit KI...</p>
              </div>
            )}

            {/* Structured Receipt Results */}
            {receiptData && scannedReceiptItems.length > 0 && (
              <div className="space-y-4">
                {/* Store Section */}
                <div className="bg-muted rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowReceiptStore(!showReceiptStore)}
                    className="w-full p-4 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Store className="w-5 h-5 text-primary" />
                      <span className="font-semibold">Geschäft</span>
                    </div>
                    {showReceiptStore ? <ChevronRight className="w-5 h-5 rotate-90" /> : <ChevronRight className="w-5 h-5" />}
                  </button>
                  {showReceiptStore && (
                    <div className="px-4 pb-4 pt-0 space-y-1">
                      <p className="text-xl font-bold">{receiptData.store.name}</p>
                      {receiptData.store.address && (
                        <p className="text-sm text-muted-foreground">{receiptData.store.address}</p>
                      )}
                      {receiptData.store.city && (
                        <p className="text-sm text-muted-foreground">
                          {receiptData.store.postalCode} {receiptData.store.city}
                        </p>
                      )}
                      <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
                        {receiptData.purchase.date && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {new Date(receiptData.purchase.date).toLocaleDateString('de-CH')}
                          </span>
                        )}
                        {receiptData.purchase.time && (
                          <span>{receiptData.purchase.time} Uhr</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Items Section */}
                <div className="bg-muted rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowReceiptItems(!showReceiptItems)}
                    className="w-full p-4 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-3">
                      <ShoppingCart className="w-5 h-5 text-primary" />
                      <span className="font-semibold">Artikel ({scannedReceiptItems.length})</span>
                      <Badge variant="secondary">
                        {scannedReceiptItems.filter(i => i.selected).length} ausgewählt
                      </Badge>
                    </div>
                    {showReceiptItems ? <ChevronRight className="w-5 h-5 rotate-90" /> : <ChevronRight className="w-5 h-5" />}
                  </button>
                  {showReceiptItems && (
                    <div className="px-4 pb-4 pt-0">
                      <div className="flex justify-end mb-3">
                        <button
                          onClick={() => setScannedReceiptItems(items => items.map(i => ({ ...i, selected: !scannedReceiptItems.every(x => x.selected) })))}
                          className="text-sm text-primary hover:underline"
                        >
                          {scannedReceiptItems.every(i => i.selected) ? 'Alle abwählen' : 'Alle auswählen'}
                        </button>
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {scannedReceiptItems.map((item, idx) => (
                          <div 
                            key={idx}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                              item.selected 
                                ? 'bg-background border-primary' 
                                : 'bg-background/50 border-border hover:border-muted-foreground'
                            }`}
                            onClick={() => setScannedReceiptItems(items => 
                              items.map((i, j) => j === idx ? { ...i, selected: !i.selected } : i)
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                                item.selected ? 'bg-primary border-primary' : 'border-muted-foreground'
                              }`}>
                                {item.selected && <Check className="w-3 h-3 text-primary-foreground" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{item.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {item.articleNumber && <span className="mr-2">#{item.articleNumber}</span>}
                                  {item.quantity}x à CHF {item.unitPrice.toFixed(2)}
                                </p>
                              </div>
                              <p className="font-bold shrink-0">
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
                    onClick={() => setShowReceiptPayment(!showReceiptPayment)}
                    className="w-full p-4 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Wallet className="w-5 h-5 text-primary" />
                      <span className="font-semibold">Zahlung</span>
                    </div>
                    {showReceiptPayment ? <ChevronRight className="w-5 h-5 rotate-90" /> : <ChevronRight className="w-5 h-5" />}
                  </button>
                  {showReceiptPayment && (
                    <div className="px-4 pb-4 pt-0 space-y-2">
                      {receiptData.totals.subtotal && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Zwischensumme</span>
                          <span>CHF {receiptData.totals.subtotal.toFixed(2)}</span>
                        </div>
                      )}
                      {receiptData.totals.rounding && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Rundung</span>
                          <span>CHF {receiptData.totals.rounding.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xl font-bold pt-2 border-t">
                        <span>Total</span>
                        <span>CHF {receiptData.totals.total.toFixed(2)}</span>
                      </div>
                      {receiptData.purchase.paymentMethod && (
                        <p className="text-sm text-muted-foreground">
                          Bezahlt mit: {receiptData.purchase.paymentMethod}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Confidence Indicator */}
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    receiptData.confidence >= 70 ? 'bg-green-500' : 
                    receiptData.confidence >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  Erkennungsqualität: {receiptData.confidence}%
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-2">
                  <Button
                    onClick={handleAddReceiptScannedItems}
                    className="w-full"
                    size="lg"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    {scannedReceiptItems.filter(i => i.selected).length} Artikel zur Liste hinzufügen
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" onClick={handleSaveReceipt}>
                      <Save className="w-4 h-4 mr-2" />
                      Speichern
                    </Button>
                    <Button variant="outline" onClick={handleAddReceiptToFinance}>
                      <Banknote className="w-4 h-4 mr-2" />
                      Zu Finanzen
                    </Button>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => {
                      setReceiptData(null);
                      setScannedReceiptItems([]);
                      setReceiptImage(null);
                    }}
                  >
                    Neue Quittung scannen
                  </Button>
                </div>
              </div>
            )}
          </div>
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

      {/* Delete Shopping Item Confirmation */}
      <AlertDialog open={!!deleteItemId} onOpenChange={(open) => !open && setDeleteItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Artikel löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Dieser Artikel wird aus der Einkaufsliste entfernt. Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteItem} className="bg-red-600 hover:bg-red-700">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Quick Add Template Confirmation */}
      <AlertDialog open={!!deleteQuickAddId} onOpenChange={(open) => !open && setDeleteQuickAddId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Schnell-Artikel löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Dieser Schnell-Artikel wird entfernt. Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteQuickAdd} className="bg-red-600 hover:bg-red-700">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Template Confirmation */}
      <AlertDialog open={!!deleteTemplateId} onOpenChange={(open) => !open && setDeleteTemplateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Liste aus Archiv löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese gespeicherte Liste wird dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTemplate} className="bg-red-600 hover:bg-red-700">
              Löschen
            </AlertDialogAction>
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

      {/* Shopping List Scanner & Archive Dialog */}
      <Dialog open={showListScanner} onOpenChange={setShowListScanner}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-2">
              {listScannerMode === 'scan' ? (
                <>
                  <FileText className="w-5 h-5" />
                  Einkaufsliste scannen
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Listen-Archiv
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {listScannerMode === 'scan' 
                ? 'Scanne ein Foto deiner Einkaufsliste und füge alle Artikel hinzu'
                : 'Verwende gespeicherte Listen wieder'
              }
            </DialogDescription>
          </DialogHeader>
          
          {/* Mode Toggle */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={listScannerMode === 'scan' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setListScannerMode('scan')}
            >
              <ScanLine className="w-4 h-4 mr-2" />
              Scannen
            </Button>
            <Button
              variant={listScannerMode === 'archive' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setListScannerMode('archive'); loadTemplates(); }}
            >
              <Copy className="w-4 h-4 mr-2" />
              Archiv ({savedTemplates.length})
            </Button>
          </div>

          {listScannerMode === 'scan' ? (
            <div className="space-y-4">
              {/* Upload Area */}
              {!scannedListImage && (
                <div
                  className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-slate-400 transition-colors"
                  onClick={() => listScannerFileRef.current?.click()}
                >
                  <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  <p className="font-medium">Einkaufsliste hochladen</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    JPG, PNG oder PDF - handgeschrieben oder gedruckt
                  </p>
                  <input
                    ref={listScannerFileRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleScanShoppingList(e.target.files[0])}
                  />
                </div>
              )}

              {/* Scanning Progress */}
              {isListScanning && (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">Analysiere Einkaufsliste...</p>
                </div>
              )}

              {/* Scanned Image Preview */}
              {scannedListImage && !isListScanning && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Gescannte Liste</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setScannedListImage(null); setScannedListItems([]); }}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Neu scannen
                    </Button>
                  </div>
                  <img 
                    src={scannedListImage} 
                    alt="Scanned list" 
                    className="max-h-40 w-auto mx-auto rounded-lg border"
                  />
                </div>
              )}

              {/* Scanned Items */}
              {scannedListItems.length > 0 && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      Erkannte Artikel ({scannedListItems.filter(i => i.selected).length}/{scannedListItems.length})
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setScannedListItems(items => items.map(i => ({ ...i, selected: !scannedListItems.every(x => x.selected) })))}
                    >
                      {scannedListItems.every(i => i.selected) ? 'Alle abwählen' : 'Alle auswählen'}
                    </Button>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-3">
                    {scannedListItems.map((item, idx) => (
                      <div 
                        key={idx}
                        className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
                          item.selected ? 'bg-green-50 dark:bg-green-900/20' : 'bg-slate-50 dark:bg-slate-800'
                        }`}
                      >
                        <Checkbox
                          checked={item.selected}
                          onCheckedChange={(checked) => {
                            setScannedListItems(items => items.map((i, j) => 
                              j === idx ? { ...i, selected: !!checked } : i
                            ));
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium">{item.name}</span>
                          {item.quantity && item.quantity > 1 && (
                            <span className="text-sm text-muted-foreground ml-2">
                              ×{item.quantity} {item.unit || ''}
                            </span>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {item.category || 'Sonstiges'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Archive View */
            <div className="space-y-4">
              {savedTemplates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Copy className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>Noch keine Listen im Archiv</p>
                  <p className="text-sm mt-1">Scanne eine Liste und speichere sie für später</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedTemplates.map((template) => (
                    <div 
                      key={template.id}
                      className="border rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{template.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {template.items.length} Artikel · {template.usageCount}× verwendet
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUseTemplate(template.id)}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Verwenden
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteTemplate(template.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {template.items.slice(0, 6).map((item: any, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {item.name}
                          </Badge>
                        ))}
                        {template.items.length > 6 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.items.length - 6} mehr
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setShowListScanner(false)}>
              Schliessen
            </Button>
            {listScannerMode === 'scan' && scannedListItems.length > 0 && (
              <Button onClick={handleAddScannedItems}>
                <Plus className="w-4 h-4 mr-2" />
                {scannedListItems.filter(i => i.selected).length} Artikel hinzufügen
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Template Dialog */}
      <Dialog open={showSaveTemplateDialog} onOpenChange={setShowSaveTemplateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="w-5 h-5" />
              Liste im Archiv speichern
            </DialogTitle>
            <DialogDescription>
              Speichere diese Liste für späteren Gebrauch
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name der Liste</Label>
              <Input
                placeholder="z.B. Wocheneinkauf, Party-Einkauf..."
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
              />
            </div>
            
            <div className="text-sm text-muted-foreground">
              {scannedListItems.filter(i => i.selected).length} Artikel werden gespeichert
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveTemplateDialog(false)}>
              Überspringen
            </Button>
            <Button onClick={handleSaveTemplate}>
              <Save className="w-4 h-4 mr-2" />
              Im Archiv speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
