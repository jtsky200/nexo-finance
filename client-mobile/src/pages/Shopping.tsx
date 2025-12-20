import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
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
  Banknote,
  RotateCcw,
  Barcode,
  Package
} from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import { useShoppingList, useShoppingLists, createShoppingList, updateShoppingList, deleteShoppingList, createShoppingItem, markShoppingItemAsBought, deleteShoppingItem, createFinanceEntry, updateShoppingItem, type ShoppingItem } from '@/lib/firebaseHooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { hapticSuccess, hapticError, hapticSelection } from '@/lib/hapticFeedback';
import { formatErrorForDisplay } from '@/lib/errorHandler';

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
  
  // Add scan line animation style
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes scan-line {
        0% { transform: translateY(0); opacity: 0.3; }
        50% { transform: translateY(100%); opacity: 1; }
        100% { transform: translateY(0); opacity: 0.3; }
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);
  
  // Shopping Lists Management
  const { data: lists = [], isLoading: listsLoading } = useShoppingLists();
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [showListDialog, setShowListDialog] = useState(false);
  const [showCreateListDialog, setShowCreateListDialog] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [editingListId, setEditingListId] = useState<string | null>(null);
  
  // Initialize with default list
  useEffect(() => {
    if (lists.length > 0 && !selectedListId) {
      const defaultList = lists.find(l => l.isDefault) || lists[0];
      if (defaultList) {
        setSelectedListId(defaultList.id);
      }
    }
  }, [lists, selectedListId]);
  
  const { data: items = [], isLoading, refetch } = useShoppingList(selectedListId || undefined);
  const [optimisticItems, setOptimisticItems] = useState<ShoppingItem[]>([]);
  const [isDeleting, setIsDeleting] = useState<Set<string>>(new Set());
  
  // Sync optimistic items with actual items
  useEffect(() => {
    if (items.length > 0 || optimisticItems.length === 0) {
      setOptimisticItems(items);
    }
  }, [items]);
  
  // Use optimistic items for display
  const displayItems = optimisticItems.length > 0 ? optimisticItems : items;
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showMultiAddDialog, setShowMultiAddDialog] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: '1',
    category: 'Lebensmittel',
    store: ''
  });
  
  // Multi-Item State: Gruppiert nach Laden
  interface StoreGroup {
    store: string;
    items: Array<{
      id: string;
      name: string;
      quantity: string;
      category: string;
      price?: string;
      articleNumber?: string;
      productInfo?: any;
      saveToDatabase?: boolean;
    }>;
  }
  const [storeGroups, setStoreGroups] = useState<StoreGroup[]>([]);

  // Scanner state
  const [showScanner, setShowScanner] = useState(false);
  const [scannerMode, setScannerMode] = useState<'camera' | 'upload'>('camera');
  const [scannerType, setScannerType] = useState<'receipt' | 'single'>('receipt');
  const [isScanning, setIsScanning] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [scannedItems, setScannedItems] = useState<ReceiptItem[]>([]);
  const [liveScannedItems, setLiveScannedItems] = useState<ReceiptItem[]>([]);
  const [liveTotal, setLiveTotal] = useState(0);
  
  // NEW: Pending item for confirmation
  const [pendingItem, setPendingItem] = useState<ReceiptItem | null>(null);
  const [pendingQuantity, setPendingQuantity] = useState(1);
  const [showStoreSection, setShowStoreSection] = useState(true);
  const [showItemsSection, setShowItemsSection] = useState(true);
  const [showPaymentSection, setShowPaymentSection] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Barcode Scanner state for individual items
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [barcodeScannerTarget, setBarcodeScannerTarget] = useState<{groupIndex: number, itemId: string} | null>(null);
  const [barcodeScanning, setBarcodeScanning] = useState(false);
  const barcodeVideoRef = useRef<HTMLVideoElement>(null);
  const barcodeCanvasRef = useRef<HTMLCanvasElement>(null);
  const [barcodeCameraStream, setBarcodeCameraStream] = useState<MediaStream | null>(null);
  const barcodeScanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Product Info Scanner state
  const [showProductInfoScanner, setShowProductInfoScanner] = useState(false);
  const [productInfoScannerTarget, setProductInfoScannerTarget] = useState<{groupIndex: number, itemId: string} | null>(null);
  const [productInfoScanning, setProductInfoScanning] = useState(false);
  const productInfoVideoRef = useRef<HTMLVideoElement>(null);
  const productInfoCanvasRef = useRef<HTMLCanvasElement>(null);
  const [productInfoCameraStream, setProductInfoCameraStream] = useState<MediaStream | null>(null);

  const openItems = useMemo(
    () => items.filter(i => i.status === 'not_bought'),
    [items]
  );

  const boughtItems = useMemo(
    () => items.filter(i => i.status === 'bought'),
    [items]
  );

  // Multi-select state for deletion
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  const handleAddItem = async () => {
    if (!newItem.name.trim()) {
      toast.error('Bitte Artikelname eingeben');
      return;
    }

    try {
      await createShoppingItem({
        listId: selectedListId || undefined,
        item: newItem.name.trim(),
        quantity: parseInt(newItem.quantity) || 1,
        category: newItem.category,
        estimatedPrice: 0,
        currency: 'CHF',
        store: newItem.store || null
      });
      
      toast.success('Artikel hinzugefügt');
      hapticSuccess();
      setShowAddDialog(false);
      setNewItem({ name: '', quantity: '1', category: 'Lebensmittel', store: '' });
      await refetch();
    } catch (error) {
      toast.error('Fehler: ' + formatErrorForDisplay(error));
      hapticError();
    }
  };

  // Multi-Item Handler Functions
  const addStoreGroup = () => {
    const newGroup: StoreGroup = {
      store: '',
      items: []
    };
    setStoreGroups([...storeGroups, newGroup]);
  };

  const removeStoreGroup = (index: number) => {
    setStoreGroups(storeGroups.filter((_, i) => i !== index));
  };

  const updateStoreGroup = (index: number, store: string) => {
    const updated = [...storeGroups];
    updated[index].store = store;
    setStoreGroups(updated);
  };

  const addItemToStoreGroup = (groupIndex: number) => {
    const updated = [...storeGroups];
    updated[groupIndex].items.push({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: '',
      quantity: '1',
      category: 'Lebensmittel',
      price: '',
      articleNumber: '',
      productInfo: null,
      saveToDatabase: false
    });
    setStoreGroups(updated);
  };

  const removeItemFromStoreGroup = (groupIndex: number, itemId: string) => {
    const updated = [...storeGroups];
    updated[groupIndex].items = updated[groupIndex].items.filter(item => item.id !== itemId);
    setStoreGroups(updated);
  };

  const updateItemInStoreGroup = (groupIndex: number, itemId: string, field: string, value: any) => {
    const updated = [...storeGroups];
    const itemIndex = updated[groupIndex].items.findIndex(item => item.id === itemId);
    if (itemIndex !== -1) {
      (updated[groupIndex].items[itemIndex] as any)[field] = value;
      setStoreGroups(updated);
    }
  };

  // Barcode Scanner Functions
  const openBarcodeScanner = (groupIndex: number, itemId: string) => {
    setBarcodeScannerTarget({ groupIndex, itemId });
    setShowBarcodeScanner(true);
    setTimeout(() => startBarcodeCamera(), 100);
  };

  const startBarcodeCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Kamera wird nicht unterstützt');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setBarcodeCameraStream(stream);
      if (barcodeVideoRef.current) {
        barcodeVideoRef.current.srcObject = stream;
        await barcodeVideoRef.current.play();
      }
      setBarcodeScanning(true);
      startBarcodeDetection();
      hapticSuccess();
    } catch (error) {
      toast.error('Kamera-Fehler: ' + formatErrorForDisplay(error));
      hapticError();
    }
  };

  const startBarcodeDetection = () => {
    if (!('BarcodeDetector' in window)) {
      toast.error('Barcode-Erkennung nicht unterstützt');
      return;
    }

    const barcodeDetector = new (window as any).BarcodeDetector({
      formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e']
    });

    barcodeScanIntervalRef.current = setInterval(async () => {
      if (!barcodeVideoRef.current || !barcodeCanvasRef.current || !barcodeScanning) return;

      const video = barcodeVideoRef.current;
      const canvas = barcodeCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx || video.readyState !== 4) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      try {
        const barcodes = await barcodeDetector.detect(canvas);
        if (barcodes.length > 0) {
          const barcode = barcodes[0].rawValue;
          stopBarcodeCamera();
          if (barcodeScannerTarget) {
            updateItemInStoreGroup(barcodeScannerTarget.groupIndex, barcodeScannerTarget.itemId, 'articleNumber', barcode);
            toast.success(`Barcode gescannt: ${barcode}`);
            hapticSuccess();
            // Try to fetch product info
            await fetchProductInfoByBarcode(barcodeScannerTarget.groupIndex, barcodeScannerTarget.itemId, barcode);
          }
          setShowBarcodeScanner(false);
          setBarcodeScannerTarget(null);
        }
      } catch (err) {
        // Silently ignore scan errors
      }
    }, 500);
  };

  const stopBarcodeCamera = () => {
    if (barcodeScanIntervalRef.current) {
      clearInterval(barcodeScanIntervalRef.current);
      barcodeScanIntervalRef.current = null;
    }
    if (barcodeCameraStream) {
      barcodeCameraStream.getTracks().forEach(track => track.stop());
      setBarcodeCameraStream(null);
    }
    if (barcodeVideoRef.current) {
      barcodeVideoRef.current.srcObject = null;
    }
    setBarcodeScanning(false);
  };

  const closeBarcodeScanner = () => {
    stopBarcodeCamera();
    setShowBarcodeScanner(false);
    setBarcodeScannerTarget(null);
  };

  // Product Info Scanner Functions
  const openProductInfoScanner = (groupIndex: number, itemId: string) => {
    setProductInfoScannerTarget({ groupIndex, itemId });
    setShowProductInfoScanner(true);
    setTimeout(() => startProductInfoCamera(), 100);
  };

  const startProductInfoCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Kamera wird nicht unterstützt');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setProductInfoCameraStream(stream);
      if (productInfoVideoRef.current) {
        productInfoVideoRef.current.srcObject = stream;
        await productInfoVideoRef.current.play();
      }
      hapticSuccess();
    } catch (error) {
      toast.error('Kamera-Fehler: ' + formatErrorForDisplay(error));
      hapticError();
    }
  };

  const captureProductImage = async () => {
    if (!productInfoVideoRef.current || !productInfoCanvasRef.current || !productInfoScannerTarget) return;

    setProductInfoScanning(true);
    try {
      const video = productInfoVideoRef.current;
      const canvas = productInfoCanvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        
        // Analyze product image
        await analyzeProductImage(productInfoScannerTarget.groupIndex, productInfoScannerTarget.itemId, imageData);
        
        stopProductInfoCamera();
        setShowProductInfoScanner(false);
        setProductInfoScannerTarget(null);
      }
    } catch (error) {
      toast.error('Fehler beim Erfassen: ' + formatErrorForDisplay(error));
      hapticError();
    } finally {
      setProductInfoScanning(false);
    }
  };

  const stopProductInfoCamera = () => {
    if (productInfoCameraStream) {
      productInfoCameraStream.getTracks().forEach(track => track.stop());
      setProductInfoCameraStream(null);
    }
    if (productInfoVideoRef.current) {
      productInfoVideoRef.current.srcObject = null;
    }
  };

  const closeProductInfoScanner = () => {
    stopProductInfoCamera();
    setShowProductInfoScanner(false);
    setProductInfoScannerTarget(null);
  };

  // Fetch product info by barcode
  const fetchProductInfoByBarcode = async (groupIndex: number, itemId: string, barcode: string) => {
    try {
      const item = storeGroups[groupIndex]?.items.find(i => i.id === itemId);
      if (!item) return;

      const store = storeGroups[groupIndex]?.store || '';
      const searchProductFunc = httpsCallable(functions, 'searchProductInfo');
      const result = await searchProductFunc({ articleNumber: barcode, store });
      
      if (result.data && (result.data as any).productInfo) {
        updateItemInStoreGroup(groupIndex, itemId, 'productInfo', (result.data as any).productInfo);
        toast.success('Produktinformationen gefunden');
      }
    } catch (error) {
      // Silently fail - product info is optional
      console.log('Product info fetch failed:', error);
    }
  };

  // Analyze product image
  const analyzeProductImage = async (groupIndex: number, itemId: string, imageData: string) => {
    try {
      const item = storeGroups[groupIndex]?.items.find(i => i.id === itemId);
      if (!item) return;

      const store = storeGroups[groupIndex]?.store || '';
      const analyzeProductFunc = httpsCallable(functions, 'analyzeProductImage');
      const result = await analyzeProductFunc({ imageData, store, articleNumber: item.articleNumber });
      
      if (result.data && (result.data as any).productInfo) {
        updateItemInStoreGroup(groupIndex, itemId, 'productInfo', (result.data as any).productInfo);
        if ((result.data as any).articleNumber && !item.articleNumber) {
          updateItemInStoreGroup(groupIndex, itemId, 'articleNumber', (result.data as any).articleNumber);
        }
        toast.success('Produktinformationen erkannt');
        hapticSuccess();
      } else {
        toast.info('Keine Produktinformationen erkannt');
      }
    } catch (error) {
      toast.error('Fehler bei Analyse: ' + formatErrorForDisplay(error));
      hapticError();
    }
  };

  const handleScanItemBarcode = async (groupIndex: number, itemId: string) => {
    openBarcodeScanner(groupIndex, itemId);
  };

  const handleScanProductInfo = async (groupIndex: number, itemId: string) => {
    openProductInfoScanner(groupIndex, itemId);
  };

  const handleSaveMultiItems = async () => {
    try {
      let totalItems = 0;
      for (const group of storeGroups) {
        if (!group.store) {
          toast.error('Bitte Laden für alle Gruppen angeben');
          return;
        }
        for (const item of group.items) {
          if (!item.name.trim()) {
            toast.error('Bitte Artikelname für alle Artikel eingeben');
            return;
          }
          
          await createShoppingItem({
            listId: selectedListId || undefined,
            item: item.name.trim(),
            quantity: parseInt(item.quantity) || 1,
            category: item.category,
            estimatedPrice: parseFloat(item.price || '0') * 100, // In Rappen speichern
            currency: 'CHF',
            store: group.store,
            articleNumber: item.articleNumber || null,
            productInfo: item.productInfo || null,
            saveToDatabase: item.saveToDatabase || false
          });
          totalItems++;
        }
      }
      
      toast.success(`${totalItems} Artikel hinzugefügt`);
      hapticSuccess();
      setShowMultiAddDialog(false);
      setStoreGroups([]);
      await refetch();
    } catch (error) {
      toast.error('Fehler: ' + formatErrorForDisplay(error));
      hapticError();
    }
  };

  // List Management Handlers
  const handleCreateList = async () => {
    if (!newListName.trim()) {
      toast.error('Bitte Listenname eingeben');
      return;
    }
    try {
      const result = await createShoppingList(newListName.trim(), lists.length === 0);
      toast.success('Liste erstellt');
      hapticSuccess();
      setShowCreateListDialog(false);
      setNewListName('');
      setSelectedListId((result as any).id);
    } catch (error) {
      toast.error('Fehler: ' + formatErrorForDisplay(error));
      hapticError();
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (lists.length <= 1) {
      toast.error('Mindestens eine Liste muss vorhanden sein');
      return;
    }
    try {
      await deleteShoppingList(listId);
      toast.success('Liste gelöscht');
      hapticSuccess();
      if (selectedListId === listId) {
        const remainingList = lists.find(l => l.id !== listId);
        setSelectedListId(remainingList?.id || null);
      }
    } catch (error) {
      toast.error('Fehler: ' + formatErrorForDisplay(error));
      hapticError();
    }
  };

  const handleUpdateList = async (listId: string, name: string, isDefault?: boolean) => {
    try {
      await updateShoppingList(listId, { name, isDefault });
      toast.success('Liste aktualisiert');
      hapticSuccess();
      setEditingListId(null);
    } catch (error) {
      toast.error('Fehler: ' + formatErrorForDisplay(error));
      hapticError();
    }
  };

  const handleToggleBought = useCallback(async (itemId: string, currentStatus: 'not_bought' | 'bought') => {
    const newStatus = currentStatus === 'bought' ? 'not_bought' : 'bought';
    
    // Optimistic update
    setOptimisticItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, status: newStatus, boughtAt: newStatus === 'bought' ? new Date() : null }
        : item
    ));
    hapticSelection();
    
    try {
      if (newStatus === 'bought') {
        await markShoppingItemAsBought(itemId);
      } else {
        await updateShoppingItem(itemId, { status: 'not_bought' });
      }
      // Refetch in background
      setTimeout(() => refetch(), 100);
    } catch (error) {
      // Rollback on error
      refetch();
      toast.error(formatErrorForDisplay(error));
      hapticError();
    }
  }, [refetch]);

  const handleDeleteItem = useCallback(async (itemId: string) => {
    // Optimistic update - remove immediately
    setOptimisticItems(prev => prev.filter(item => item.id !== itemId));
    setIsDeleting(prev => new Set(prev).add(itemId));
    hapticSuccess();
    
    try {
      await deleteShoppingItem(itemId);
      // Refetch in background
      setTimeout(() => refetch(), 100);
    } catch (error) {
      // Rollback on error
      refetch();
      toast.error(formatErrorForDisplay(error));
      hapticError();
    } finally {
      setIsDeleting(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  }, [refetch]);

  const handleDeleteMultipleItems = useCallback(async () => {
    if (selectedItemIds.size === 0) {
      toast.error('Bitte wählen Sie mindestens einen Artikel aus');
      return;
    }

    const idsToDelete = Array.from(selectedItemIds);
    
    // Optimistic update - remove immediately
    setOptimisticItems(prev => prev.filter(item => !selectedItemIds.has(item.id)));
    setIsDeleting(prev => {
      const newSet = new Set(prev);
      idsToDelete.forEach(id => newSet.add(id));
      return newSet;
    });
    
    // Clear selection immediately for better UX
    setSelectedItemIds(new Set());
    setSelectionMode(false);
    hapticSuccess();

    try {
      // Delete in background
      const deletePromises = idsToDelete.map(id => deleteShoppingItem(id));
      await Promise.all(deletePromises);
      toast.success(`${idsToDelete.length} Artikel gelöscht`);
      // Refetch in background
      setTimeout(() => refetch(), 100);
    } catch (error) {
      // Rollback on error
      refetch();
      toast.error(formatErrorForDisplay(error));
      hapticError();
    } finally {
      setIsDeleting(prev => {
        const newSet = new Set(prev);
        idsToDelete.forEach(id => newSet.delete(id));
        return newSet;
      });
    }
  }, [selectedItemIds, refetch]);

  const toggleItemSelection = useCallback((itemId: string) => {
    setSelectedItemIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
    hapticSelection();
  }, []);

  const toggleSelectAll = useCallback(() => {
    const allItemIds = new Set([...openItems.map(i => i.id), ...boughtItems.map(i => i.id)]);
    if (selectedItemIds.size === allItemIds.size) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(allItemIds);
    }
    hapticSelection();
  }, [openItems, boughtItems, selectedItemIds.size]);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedItemIds(new Set());
  }, []);

  const handleClearBought = useCallback(async () => {
    const boughtItemIds = boughtItems.map(item => item.id);
    
    // Optimistic update
    setOptimisticItems(prev => prev.filter(item => !boughtItemIds.includes(item.id)));
    setIsDeleting(prev => {
      const newSet = new Set(prev);
      boughtItemIds.forEach(id => newSet.add(id));
      return newSet;
    });
    hapticSuccess();
    
    try {
      // Delete in parallel for better performance
      const deletePromises = boughtItemIds.map(id => deleteShoppingItem(id));
      await Promise.all(deletePromises);
      toast.success('Eingekaufte Artikel gelöscht');
      // Refetch in background
      setTimeout(() => refetch(), 100);
    } catch (error) {
      // Rollback on error
      refetch();
      toast.error(formatErrorForDisplay(error));
      hapticError();
    } finally {
      setIsDeleting(prev => {
        const newSet = new Set(prev);
        boughtItemIds.forEach(id => newSet.delete(id));
        return newSet;
      });
    }
  }, [boughtItems, refetch]);

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
      // Check for camera support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Kamera wird nicht unterstützt');
        setScannerMode('upload');
        return;
      }

      // Stop existing stream first (with delay to ensure cleanup)
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => {
          track.stop();
        });
        setCameraStream(null);
        // Small delay to ensure stream is fully stopped
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Clear video element
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      // HIGH RESOLUTION CONSTRAINTS for precision scanning
      // Try maximum resolution first, then fallback
      let stream: MediaStream | null = null;
      let constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment', // Back camera
          width: { ideal: 3840 }, // 4K for maximum precision
          height: { ideal: 2160 },
          aspectRatio: { ideal: 16/9 },
        },
        audio: false,
      };

      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (process.env.NODE_ENV === 'development') {
          console.log('[Camera] High resolution stream started');
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[Camera] High resolution failed, trying fallback:', error);
        }
        // Fallback to Full HD
        constraints = {
          video: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        };
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (process.env.NODE_ENV === 'development') {
            console.log('[Camera] Fallback resolution stream started');
          }
        } catch (fallbackError) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[Camera] Fallback failed, using basic constraints:', fallbackError);
          }
          // Last resort: basic constraints
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false,
          });
        }
      }

      if (!stream || stream.getVideoTracks().length === 0) {
        throw new Error('Kein Kamera-Stream erhalten');
      }

      // Set stream to state first
      setCameraStream(stream);
      setScannerStatus('scanning');
      
      // Wait a bit for state to update
      await new Promise(resolve => setTimeout(resolve, 50));
      
      if (videoRef.current) {
        const video = videoRef.current;
        
        // Set stream
        video.srcObject = stream;
        
        // Wait for video metadata to load
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Video-Timeout'));
          }, 5000);

          const onLoadedMetadata = () => {
            clearTimeout(timeout);
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            resolve();
          };

          const onError = (e: Event) => {
            clearTimeout(timeout);
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            reject(new Error('Video-Fehler'));
          };

          // Check if already loaded
          if (video.readyState >= 2) {
            clearTimeout(timeout);
            resolve();
            return;
          }

          video.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
          video.addEventListener('error', onError, { once: true });
        });

        // Start playing
        try {
          await video.play();
          toast.success('Kamera aktiv');
          startEdgeDetection();
        } catch (playError) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Video play error:', playError);
          }
          // Don't throw - video might still work
          toast.success('Kamera aktiv');
          startEdgeDetection();
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Camera error:', error);
      }
      
      // Stop any partial stream
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      const err = error as any;
      let errorMessage = 'Kamera-Fehler';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMessage = 'Kamera-Berechtigung verweigert. Bitte in den Browser-Einstellungen erlauben.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMessage = 'Keine Kamera gefunden';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorMessage = 'Kamera wird bereits verwendet';
      } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
        errorMessage = 'Kamera-Unterstützung nicht verfügbar';
      } else if (err.message === 'Video-Timeout') {
        errorMessage = 'Kamera-Initialisierung zu langsam';
      } else {
        errorMessage = `Kamera-Fehler: ${err.message || err.name}`;
      }
      
      toast.error(errorMessage);
      setScannerMode('upload');
      setScannerStatus('idle');
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
          if (process.env.NODE_ENV === 'development') {
            console.log(`Photo size: ${blob.size} bytes`);
          }
          const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
          await analyzeShoppingList(file);
        }
      }, 'image/jpeg', 1.0);
    }
  };
  
  // Handle video element cleanup when stream changes (only cleanup, no auto-play)
  useEffect(() => {
    return () => {
      // Only cleanup when stream is removed
      if (!cameraStream && videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    };
  }, [cameraStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
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
          if (process.env.NODE_ENV === 'development') {
            console.log('OCR Result:', data);
          }
          
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
              if (process.env.NODE_ENV === 'development') {
                console.log('Raw text:', data.rawText);
              }
          } else {
            toast.error(data.error || 'Keine Artikel erkannt. Bitte bessere Bildqualität verwenden.', { duration: 4000 });
            }
          }
        } catch (innerError) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Analysis error:', innerError);
          }
          toast.error(formatErrorForDisplay(innerError));
          hapticError();
        }
        
        setIsScanning(false);
      };
      reader.onerror = () => {
        toast.error('Datei konnte nicht gelesen werden');
        hapticError();
        setIsScanning(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('File read error:', error);
      }
      toast.error(formatErrorForDisplay(error));
      hapticError();
      setIsScanning(false);
    }
  };

  // State for scan error message
  const [scanError, setScanError] = useState<string | null>(null);
  const [autoScanEnabled, setAutoScanEnabled] = useState(false);
  const [autoScanInterval, setAutoScanInterval] = useState<NodeJS.Timeout | null>(null);
  const [lastScanTime, setLastScanTime] = useState(0);
  
  // Track scanned positions to prevent duplicates
  const [scannedPositions, setScannedPositions] = useState<Set<string>>(new Set());
  const [scanHistory, setScanHistory] = useState<Array<{item: ReceiptItem, position: string, timestamp: number}>>([]);

  // LIVE FULL-SCREEN SCANNER - High Resolution & Continuous
  const scanAllItemsInFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    if (isScanning) return; // Prevent multiple scans
    
    const now = Date.now();
    if (now - lastScanTime < 1500) return; // Throttle: max 1 scan per 1.5 seconds for live scanning
    setLastScanTime(now);
    
    setIsScanning(true);
    setScanError(null);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // FULL SCREEN CAPTURE - Maximum resolution for precision
    // Use full video dimensions for best OCR quality
    const videoWidth = video.videoWidth || 1920; // Fallback to high res
    const videoHeight = video.videoHeight || 1080;
    
    // Set canvas to high resolution (minimum 1920x1080 for precision)
    const targetWidth = Math.max(videoWidth, 1920);
    const targetHeight = Math.max(videoHeight, 1080);
    
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d', { 
      willReadFrequently: true,
      alpha: false 
    });
    
    if (ctx) {
      // Draw FULL SCREEN at maximum quality
      ctx.drawImage(
        video,
        0, 0, videoWidth, videoHeight, // Source: full video
        0, 0, targetWidth, targetHeight // Destination: high-res canvas
      );
      
      // Convert to blob with maximum quality
      // Maximum quality for precision OCR
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            const reader = new FileReader();
            reader.onload = async () => {
              const base64 = (reader.result as string).split(',')[1];
              
              if (process.env.NODE_ENV === 'development') {
                console.log(`[Live Scanner] Captured image: ${blob.size} bytes, Resolution: ${targetWidth}x${targetHeight}`);
              }
              
              try {
                // Use full receipt analyzer for multiple items with high precision
                const analyzeReceipt = httpsCallable(functions, 'analyzeReceipt');
                const result = await analyzeReceipt({
                  fileData: base64,
                  fileType: 'image/jpeg',
                  fileName: 'live-scan-full.jpg',
                });
                
                const data = result.data as any;
                if (process.env.NODE_ENV === 'development') {
                  console.log('[Live Scanner] Full-screen scan result:', {
                    success: data.success,
                    itemsCount: data.items?.length || 0,
                    hasError: !!data.error,
                    rawTextLength: data.rawText?.length || 0
                  });
                }
                
                if (data.success && data.items && data.items.length > 0) {
                  // Create position-based IDs for each item
                  const rawText = data.rawText || '';
                  const lines = rawText.split(/[\n\r]+/);
                  
                  // Find items with robust position signatures
                  const itemsWithPositions = data.items.map((item: any, idx: number) => {
                    const itemName = (item.name || 'Unbekannt').toLowerCase().trim();
                    const itemPrice = (item.unitPrice || item.totalPrice || 0).toFixed(2);
                    const articleNum = item.articleNumber || '';
                    
                    // Find line number where this item appears
                    let lineIndex = -1;
                    for (let i = 0; i < lines.length; i++) {
                      if (lines[i].includes(item.name || '') || 
                          (articleNum && lines[i].includes(articleNum))) {
                        lineIndex = i;
                        break;
                      }
                    }
                    
                    // Create robust position ID: name + price + articleNumber + lineIndex + itemIndex
                    // This ensures uniqueness even if same item appears multiple times
                    const positionId = `${itemName}_${itemPrice}_${articleNum}_${lineIndex >= 0 ? lineIndex : idx}_${idx}`;
                    
                    return {
                      item: {
                        name: item.name || 'Unbekannt',
                        articleNumber: item.articleNumber,
                        quantity: item.quantity || 1,
                        unitPrice: item.unitPrice || item.totalPrice || 0,
                        totalPrice: item.totalPrice || (item.unitPrice * (item.quantity || 1)),
                        selected: true
                      },
                      positionId
                    };
                  });
                  
                  // Filter out already scanned positions
                  const newItemsToAdd = itemsWithPositions.filter(({ positionId }: { positionId: string }) => {
                    return !scannedPositions.has(positionId);
                  });
                  
                  if (newItemsToAdd.length > 0) {
                    // Add new positions to scanned set
                    const newPositions = new Set(scannedPositions);
                    newItemsToAdd.forEach(({ positionId }: { positionId: string }) => {
                      newPositions.add(positionId);
                    });
                    setScannedPositions(newPositions);
                    
                    // Add items to list - STRICT duplicate prevention
                    setLiveScannedItems(prev => {
                      // Create signature set for existing items
                      const existingSignatures = new Set(
                        prev.map(item => {
                          const name = item.name.toLowerCase().trim();
                          const price = item.unitPrice.toFixed(2);
                          const articleNum = item.articleNumber || '';
                          return `${name}_${price}_${articleNum}`;
                        })
                      );
                      
                      const merged = [...prev];
                      let addedCount = 0;
                      
                      newItemsToAdd.forEach(({ item: newItem, positionId }: { item: ReceiptItem; positionId: string }) => {
                        const name = newItem.name.toLowerCase().trim();
                        const price = newItem.unitPrice.toFixed(2);
                        const articleNum = newItem.articleNumber || '';
                        const signature = `${name}_${price}_${articleNum}`;
                        
                        // Check if already in list (by signature)
                        if (existingSignatures.has(signature)) {
                          // Already exists - skip completely
                          return;
                        }
                        
                        // Check if articleNumber matches any existing item
                        if (articleNum && prev.some(item => item.articleNumber === articleNum)) {
                          return; // Same article number already exists
                        }
                        
                        // Check if name+price matches (even without articleNumber)
                        const namePriceMatch = prev.some(item => 
                          item.name.toLowerCase().trim() === name &&
                          Math.abs(item.unitPrice - newItem.unitPrice) < 0.01
                        );
                        
                        if (namePriceMatch) {
                          return; // Same item already exists
                        }
                        
                        // Truly new item - add it
                        merged.push(newItem);
                        addedCount++;
                        existingSignatures.add(signature); // Prevent duplicates in this batch
                      });
                      
                      // Recalculate total
                      const newTotal = merged.reduce((sum, item) => sum + item.totalPrice, 0);
                      setLiveTotal(newTotal);
                      
                      if (addedCount > 0) {
                        toast.success(`${addedCount} neue Artikel erkannt!`, { duration: 1500 });
                        
                        // Vibration feedback
                        if (navigator.vibrate) {
                          navigator.vibrate(200);
                        }
                      } else if (newItemsToAdd.length > 0) {
                        // Items were found but all are duplicates
                        if (!autoScanEnabled) {
                          toast.info('Alle Artikel bereits in Liste', { duration: 1000 });
                        }
                      }
                      
                      return merged;
                    });
                  } else {
                    // All items already scanned
                    if (!autoScanEnabled) {
                      toast.info('Alle Artikel bereits erkannt', { duration: 1000 });
                    }
                  }
                } else {
                  // No items found - don't show error if auto-scan (it's normal)
                  if (!autoScanEnabled) {
                    setScanError('Keine Artikel erkannt');
                  }
                }
              } catch (innerError) {
                if (process.env.NODE_ENV === 'development') {
                  console.error('Frame scan error:', innerError);
                }
                if (!autoScanEnabled) {
                  const errorMsg = formatErrorForDisplay(innerError);
                  setScanError(errorMsg);
                }
                hapticError();
              }
              setIsScanning(false);
            };
            reader.readAsDataURL(blob);
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.error('Blob read error:', error);
            }
            hapticError();
            setIsScanning(false);
          }
        }
      }, 'image/jpeg', 0.95); // Maximum quality (0.95) for precision OCR
    }
  };

  // LIVE CONTINUOUS SCANNING - Full screen, high resolution
  useEffect(() => {
    if (autoScanEnabled && cameraStream && scannerType === 'single') {
      // Scan immediately when enabled
      const immediateTimeout = setTimeout(() => {
        if (!isScanning && cameraStream) {
          scanAllItemsInFrame();
        }
      }, 500); // Start scanning after 500ms
      
      // Continuous scanning every 2 seconds for live updates
      const interval = setInterval(() => {
        if (!isScanning && cameraStream) {
          scanAllItemsInFrame();
        }
      }, 2000); // Scan every 2 seconds for live scanning
      
      setAutoScanInterval(interval);
      
      return () => {
        clearInterval(interval);
        clearTimeout(immediateTimeout);
        setAutoScanInterval(null);
      };
    } else {
      if (autoScanInterval) {
        clearInterval(autoScanInterval);
        setAutoScanInterval(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoScanEnabled, cameraStream, scannerType, isScanning]);

  // NEW: Manual scan all items
  const scanAllItems = async () => {
    await scanAllItemsInFrame();
  };

  // NEW: Simplified scan - shows item for confirmation (kept for manual single item scan)
  const scanSingleItem = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsScanning(true);
    setScanError(null);
    setPendingItem(null);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Capture full frame for better OCR
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
                
                const analyzeSingleLine = httpsCallable(functions, 'analyzeSingleLine');
                const result = await analyzeSingleLine({
                  fileData: base64,
                  fileType: 'image/jpeg',
                });
                
                const data = result.data as any;
                if (process.env.NODE_ENV === 'development') {
                  console.log('Single item result:', data);
                }
                
                if (data.success && data.item) {
                  // Set as pending for user confirmation
                  const newItem: ReceiptItem = {
                    name: data.item.name,
                    articleNumber: data.item.articleNumber,
                    quantity: 1,
                    unitPrice: data.item.price,
                    totalPrice: data.item.price,
                    selected: true
                  };
                  
                  setPendingItem(newItem);
                  setPendingQuantity(1);
                  
                  hapticSuccess();
                } else {
                  const errorMsg = data.error || 'Artikel nicht erkannt';
                  setScanError(errorMsg);
                  toast.error(errorMsg, { duration: 2000 });
                  hapticError();
                }
              } catch (innerError) {
                if (process.env.NODE_ENV === 'development') {
                  console.error('Single scan error:', innerError);
                }
                const errorMsg = formatErrorForDisplay(innerError);
                setScanError(errorMsg);
                toast.error(errorMsg, { duration: 2000 });
                hapticError();
              }
              setIsScanning(false);
            };
            reader.readAsDataURL(blob);
          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.error('Blob read error:', error);
            }
            hapticError();
            setIsScanning(false);
          }
        }
      }, 'image/jpeg', 0.95);
    }
  };

  // Add pending item to list with selected quantity
  const confirmPendingItem = () => {
    if (!pendingItem) return;
    
    const itemToAdd: ReceiptItem = {
      ...pendingItem,
      quantity: pendingQuantity,
      totalPrice: pendingItem.unitPrice * pendingQuantity
    };
    
    setLiveScannedItems(prev => [...prev, itemToAdd]);
    setLiveTotal(prev => prev + itemToAdd.totalPrice);
    setPendingItem(null);
    setPendingQuantity(1);
    toast.success(`${itemToAdd.name} (${pendingQuantity}x) hinzugefügt`);
    hapticSuccess();
  };

  // Cancel pending item
  const cancelPendingItem = () => {
    setPendingItem(null);
    setPendingQuantity(1);
  };

  // NEW: Remove a live scanned item
  const removeLiveItem = (index: number) => {
    setLiveScannedItems(prev => {
      const item = prev[index];
      setLiveTotal(t => t - item.totalPrice);
      return prev.filter((_, i) => i !== index);
    });
  };

  // NEW: Update item quantity
  const updateItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) {
      removeLiveItem(index);
      return;
    }
    
    setLiveScannedItems(prev => {
      const updated = [...prev];
      const item = updated[index];
      const oldTotal = item.totalPrice;
      
      updated[index] = {
        ...item,
        quantity: newQuantity,
        totalPrice: item.unitPrice * newQuantity
      };
      
      setLiveTotal(t => t - oldTotal + updated[index].totalPrice);
      return updated;
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
          listId: selectedListId || undefined,
          item: item.name,
          quantity: item.quantity || 1,
          category: categorizeItem(item.name),
          estimatedPrice: (item.totalPrice || item.unitPrice || 0) * 100,
          currency: 'CHF',
          store: receiptData?.store?.name || null
        });
      }
      
      toast.success(`${liveScannedItems.length} Artikel hinzugefügt!`);
      setLiveScannedItems([]);
      setLiveTotal(0);
      closeScanner();
      await refetch();
    } catch (error) {
      toast.error('Fehler: ' + (error as any).message);
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
          listId: selectedListId || undefined,
          item: item.name,
          quantity: item.quantity || 1,
          category: categorizeItem(item.name),
          estimatedPrice: (item.totalPrice || item.unitPrice || 0) * 100,
          currency: 'CHF',
          store: receiptData?.store?.name || null
        });
      }
      
      toast.success(`${selected.length} Artikel hinzugefügt!`);
      closeScanner();
      await refetch();
    } catch (error) {
      toast.error('Fehler: ' + (error as any).message);
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
    } catch (error) {
      toast.error('Fehler: ' + (error as any).message);
    }
  };

  // Add receipt total to finance as expense
  const handleAddToFinance = async () => {
    if (!receiptData) return;

    try {
      await createFinanceEntry({
        type: 'ausgabe',
        amount: receiptData.totals.total * 100, // Convert to cents
        category: 'Lebensmittel',
        notes: `Einkauf bei ${receiptData.store.name}`,
        date: receiptData.purchase.date || new Date().toISOString().split('T')[0],
        paymentMethod: receiptData.purchase.paymentMethod || 'Karte',
        currency: 'CHF',
        isRecurring: false,
      });

      toast.success('Zu Finanzen hinzugefügt!');
      hapticSuccess();
      closeScanner();
    } catch (error) {
      toast.error(formatErrorForDisplay(error));
      hapticError();
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
    setLiveScannedItems([]);
    setLiveTotal(0);
    setScannerType('receipt');
    setPendingItem(null);
    setPendingQuantity(1);
    setScanError(null);
    setAutoScanEnabled(false);
    setScannedPositions(new Set()); // Reset position tracking
    setScanHistory([]);
    if (autoScanInterval) {
      clearInterval(autoScanInterval);
      setAutoScanInterval(null);
    }
  };

  return (
    <MobileLayout title={t('nav.shopping', 'Einkaufsliste')} showSidebar={true}>
      {/* List Selector */}
      <div className="mb-4 flex items-center gap-2">
        {!selectionMode ? (
          <>
            <Select
              value={selectedListId || ''}
              onValueChange={(value) => setSelectedListId(value)}
              disabled={listsLoading}
            >
              <SelectTrigger className="flex-1 h-11">
                <SelectValue placeholder="Liste wählen" />
              </SelectTrigger>
              <SelectContent>
                {lists.map((list) => (
                  <SelectItem key={list.id} value={list.id}>
                    {list.name} {list.isDefault && '(Standard)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowListDialog(true)}
              className="h-11 w-11"
            >
              <FileText className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectionMode(true)}
              className="h-11 w-11"
            >
              <Check className="w-5 h-5" />
            </Button>
          </>
        ) : (
          <>
            <div className="flex-1 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
                className="h-11"
              >
                {selectedItemIds.size === openItems.length + boughtItems.length ? 'Alle abwählen' : 'Alle auswählen'}
              </Button>
              <span className="text-sm text-muted-foreground">
                {selectedItemIds.size} ausgewählt
              </span>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={exitSelectionMode}
              className="h-11 w-11"
            >
              <X className="w-5 h-5" />
            </Button>
            {selectedItemIds.size > 0 && (
              <Button
                variant="destructive"
                size="icon"
                onClick={handleDeleteMultipleItems}
                className="h-11 w-11"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            )}
          </>
        )}
      </div>

      {/* Summary - Clean design */}
      <div className="mobile-card mb-4 bg-primary text-primary-foreground">
        <div className="flex items-center gap-3 mb-3">
          <ShoppingCart className="w-6 h-6 opacity-70" />
          <p className="text-sm opacity-70 font-medium">
            {lists.find(l => l.id === selectedListId)?.name || t('shopping.list', 'Einkaufsliste')}
          </p>
        </div>
        <p className="text-3xl font-semibold mb-2">{openItems.length}</p>
        <p className="text-sm opacity-60">
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
        <div className="space-y-3 mb-4">
          {openItems.map((item) => (
            <div
              key={item.id}
              className={`mobile-card flex items-center gap-4 py-3 ${selectionMode && selectedItemIds.has(item.id) ? 'ring-2 ring-primary' : ''}`}
              onClick={selectionMode ? () => toggleItemSelection(item.id) : undefined}
            >
              {selectionMode ? (
                <div className="w-6 h-6 rounded border-2 border-border flex items-center justify-center shrink-0">
                  {selectedItemIds.has(item.id) && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </div>
              ) : (
                <button
                  onClick={() => handleToggleBought(item.id, item.status)}
                  className="w-6 h-6 rounded border-2 border-border flex items-center justify-center shrink-0"
                >
                  {/* Empty checkbox */}
                </button>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.item}</p>
                <p className="text-xs text-muted-foreground">
                  {item.quantity > 1 && `${item.quantity}x • `}
                  {item.category}
                  {item.store && ` • ${item.store}`}
                </p>
              </div>
              {!selectionMode && (
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-muted-foreground active:opacity-80"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
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
            {!selectionMode && (
              <button
                onClick={handleClearBought}
                className="text-xs status-error active:opacity-80"
              >
                {t('shopping.clearBought', 'Löschen')}
              </button>
            )}
          </div>
          <div className="space-y-3 opacity-60">
            {boughtItems.map((item) => (
              <div
                key={item.id}
                className={`mobile-card flex items-center gap-4 py-3 ${selectionMode && selectedItemIds.has(item.id) ? 'ring-2 ring-primary opacity-100' : ''}`}
                onClick={selectionMode ? () => toggleItemSelection(item.id) : undefined}
              >
                {selectionMode ? (
                  <div className="w-6 h-6 rounded border-2 border-border flex items-center justify-center shrink-0">
                    {selectedItemIds.has(item.id) && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => handleToggleBought(item.id, item.status)}
                    className="w-6 h-6 rounded bg-status-success flex items-center justify-center shrink-0"
                  >
                    <Check className="w-4 h-4 status-success" />
                  </button>
                )}
                <p className="font-medium line-through flex-1 truncate">{item.item}</p>
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
                className="w-auto mx-auto mobile-btn bg-primary text-primary-foreground mt-4"
              >
                Hinzufügen
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Item Dialog */}
      <Dialog open={showMultiAddDialog} onOpenChange={setShowMultiAddDialog}>
        <DialogContent className="!fixed !top-[50%] !left-[50%] !right-auto !bottom-auto !translate-x-[-50%] !translate-y-[-50%] !w-[90vw] !max-w-2xl !max-h-[90vh] !rounded-3xl !m-0 !overflow-hidden !shadow-2xl !flex !flex-col">
          <DialogHeader className="px-5 pt-5 pb-3 flex-shrink-0">
            <DialogTitle className="text-lg font-semibold">Mehrere Artikel hinzufügen</DialogTitle>
            <DialogDescription className="sr-only">
              Fügen Sie mehrere Artikel gruppiert nach Laden hinzu
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-5 pb-2 overflow-y-auto flex-1 min-h-0 space-y-4">
            {storeGroups.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Store className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Keine Laden-Gruppen vorhanden</p>
                <p className="text-sm mt-1">Klicken Sie auf "Laden hinzufügen" um zu beginnen</p>
              </div>
            )}

            {storeGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="border rounded-xl p-4 space-y-3 bg-muted/30">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-muted-foreground" />
                  <Select
                    value={group.store || 'none'}
                    onValueChange={(value) => updateStoreGroup(groupIndex, value === 'none' ? '' : value)}
                  >
                    <SelectTrigger className="flex-1 h-9">
                      <SelectValue placeholder="Laden wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Laden wählen</SelectItem>
                      <SelectItem value="Migros">Migros</SelectItem>
                      <SelectItem value="Coop">Coop</SelectItem>
                      <SelectItem value="Aldi">Aldi</SelectItem>
                      <SelectItem value="Lidl">Lidl</SelectItem>
                      <SelectItem value="Denner">Denner</SelectItem>
                      <SelectItem value="Volg">Volg</SelectItem>
                      <SelectItem value="Spar">Spar</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeStoreGroup(groupIndex)}
                    className="h-9 w-9 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  {group.items.map((item) => (
                    <div key={item.id} className="bg-background rounded-lg p-3 space-y-2 border">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 space-y-2">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Artikelname *"
                              value={item.name}
                              onChange={(e) => updateItemInStoreGroup(groupIndex, item.id, 'name', e.target.value)}
                              className="flex-1 h-9"
                            />
                            <Input
                              type="number"
                              placeholder="Menge"
                              value={item.quantity}
                              onChange={(e) => updateItemInStoreGroup(groupIndex, item.id, 'quantity', e.target.value)}
                              className="w-20 h-9"
                              min="1"
                            />
                          </div>
                          
                          <div className="flex gap-2">
                            <Select
                              value={item.category}
                              onValueChange={(value) => updateItemInStoreGroup(groupIndex, item.id, 'category', value)}
                            >
                              <SelectTrigger className="flex-1 h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((cat) => (
                                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Preis (CHF)"
                              value={item.price}
                              onChange={(e) => updateItemInStoreGroup(groupIndex, item.id, 'price', e.target.value)}
                              className="w-24 h-9"
                            />
                          </div>

                          <div className="flex gap-2">
                            <Input
                              placeholder="Artikelnummer (EAN/Barcode)"
                              value={item.articleNumber}
                              onChange={(e) => updateItemInStoreGroup(groupIndex, item.id, 'articleNumber', e.target.value)}
                              className="flex-1 h-9"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleScanItemBarcode(groupIndex, item.id)}
                              className="h-9"
                              title="Barcode scannen"
                            >
                              <Barcode className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleScanProductInfo(groupIndex, item.id)}
                              className="h-9"
                              title="Produktinfo scannen"
                            >
                              <Camera className="w-4 h-4" />
                            </Button>
                          </div>

                          {item.productInfo && (
                            <div className="bg-muted/50 rounded p-2 text-xs space-y-1">
                              {item.productInfo.brand && <p><strong>Marke:</strong> {item.productInfo.brand}</p>}
                              {item.productInfo.description && <p><strong>Beschreibung:</strong> {item.productInfo.description}</p>}
                              {item.productInfo.price && <p><strong>Preis:</strong> CHF {item.productInfo.price}</p>}
                              {item.productInfo.imageUrl && (
                                <img src={item.productInfo.imageUrl} alt="Produkt" className="w-full h-24 object-contain mt-2 rounded" />
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <Switch
                              checked={item.saveToDatabase || false}
                              onCheckedChange={(checked) => updateItemInStoreGroup(groupIndex, item.id, 'saveToDatabase', checked)}
                            />
                            <Label className="text-xs">Für zukünftige Käufe speichern</Label>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItemFromStoreGroup(groupIndex, item.id)}
                          className="h-9 w-9 p-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addItemToStoreGroup(groupIndex)}
                    className="w-full h-9"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Artikel hinzufügen
                  </Button>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              onClick={addStoreGroup}
              className="w-full"
            >
              <Store className="w-4 h-4 mr-2" />
              Laden hinzufügen
            </Button>
          </div>

          <DialogFooter className="px-5 pb-3 pt-2 gap-2.5 flex-shrink-0">
            <Button variant="outline" onClick={() => {
              setShowMultiAddDialog(false);
              setStoreGroups([]);
            }} className="h-11 min-h-[44px] flex-1 rounded-xl text-sm font-medium">
              Abbrechen
            </Button>
            <Button 
              onClick={handleSaveMultiItems}
              disabled={storeGroups.length === 0 || storeGroups.every(g => g.items.length === 0)}
              className="h-11 min-h-[44px] flex-1 rounded-xl text-sm font-medium"
            >
              {storeGroups.reduce((sum, g) => sum + g.items.length, 0)} Artikel hinzufügen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              onClick={async () => { 
                setScannerType('single'); 
                setScannerMode('camera'); 
                setLiveScannedItems([]); 
                setLiveTotal(0);
                setScannedPositions(new Set());
                setPendingItem(null);
                setScanError(null);
                await startCamera(); 
              }}
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
                preload="auto"
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

          {/* COMPLETELY REBUILT CAMERA UI FROM SCRATCH - MODERN & USER FRIENDLY */}
          {scannerMode === 'camera' && scannerType === 'single' && (
            <div className="flex-1 flex flex-col bg-background w-full h-full overflow-hidden">
              {/* Modern Top Bar */}
              <div className="w-full px-4 py-3 bg-background/95 backdrop-blur-sm border-b border-border/50 flex-shrink-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${cameraStream ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                      <p className="text-xs font-medium text-muted-foreground">
                        {cameraStream ? 'Kamera aktiv' : 'Kamera inaktiv'}
                      </p>
                    </div>
                    <p className="text-sm font-bold truncate">
                      {isScanning ? 'Analysiere...' : 
                       autoScanEnabled ? `${scannedPositions.size} Positionen erkannt` : 
                       liveScannedItems.length > 0 ? `${liveScannedItems.length} Artikel gescannt` :
                       'Bereit zum Scannen'}
                    </p>
                  </div>
                  <button
                    onClick={() => setAutoScanEnabled(!autoScanEnabled)}
                    disabled={!cameraStream}
                    className={`px-3 py-2 rounded-lg flex items-center gap-1.5 flex-shrink-0 transition-all ${
                      autoScanEnabled && cameraStream
                        ? 'bg-green-500 text-white shadow-lg' 
                        : 'bg-muted text-muted-foreground'
                    } ${!cameraStream ? 'opacity-50' : ''}`}
                  >
                    <div className={`w-2 h-2 rounded-full ${autoScanEnabled && cameraStream ? 'bg-white' : 'bg-foreground/50'}`} />
                    <span className="text-xs font-semibold">Auto</span>
                  </button>
                </div>
              </div>

              {/* LIVE FULL-SCREEN CAMERA - No Window, Maximum Resolution */}
              <div className="flex-1 flex flex-col w-full overflow-hidden min-h-0 relative">
                {/* Camera Preview - FULL SCREEN, High Resolution */}
                <div className="relative bg-black w-full flex-1 flex-shrink-0 min-h-0">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    preload="auto"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ 
                      // Force high resolution for better OCR
                      minWidth: '100%',
                      minHeight: '100%'
                    }}
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {/* Live Scanning Indicator - Minimal Overlay */}
                  {cameraStream && autoScanEnabled && (
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Subtle scanning animation */}
                      {isScanning && (
                        <div 
                          className="absolute left-0 right-0 h-1 bg-green-500/50"
                          style={{
                            top: '50%',
                            animation: 'scan-line 1.5s ease-in-out infinite',
                            boxShadow: '0 0 20px rgba(16, 185, 129, 0.6)',
                            transform: 'translateY(-50%)'
                          }}
                        />
                      )}
                      
                      {/* Status indicator - Top center */}
                      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
                        <div className="bg-green-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 shadow-lg">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                          {isScanning ? 'Analysiere...' : `Live-Scan (${liveScannedItems.length} Artikel)`}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Manual scan hint when auto-scan is off */}
                  {cameraStream && !autoScanEnabled && (
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
                      <div className="bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-full text-xs font-medium">
                        Quittung vollständig sichtbar machen
                      </div>
                    </div>
                  )}
                  
                  {/* Modern Camera Controls */}
                  {cameraStream && !pendingItem && (
                    <div className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                      <button
                        onClick={scanAllItems}
                        disabled={isScanning}
                        className={`w-full py-4 rounded-xl shadow-2xl flex items-center justify-center gap-3 transition-all transform ${
                          isScanning 
                            ? 'bg-gray-600/90' 
                            : 'bg-green-500 hover:bg-green-600 active:scale-95'
                        }`}
                      >
                        {isScanning ? (
                          <>
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span className="font-bold text-white text-lg">Analysiere...</span>
                          </>
                        ) : (
                          <>
                            <ScanLine className="w-6 h-6 text-white" />
                            <span className="font-bold text-white text-lg">ALLE SCANNEN</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                  
                  {/* Start Camera - Modern Design */}
                  {!cameraStream && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-black/90 to-black/70">
                      <div className="text-center mb-8">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                          <Camera className="w-10 h-10 text-white" />
                        </div>
                        <p className="text-white text-lg font-semibold mb-2">Kamera starten</p>
                        <p className="text-white/70 text-sm">Für das Scannen von Quittungen</p>
                      </div>
                      <button
                        onClick={startCamera}
                        className="px-8 py-4 rounded-xl bg-white shadow-2xl flex items-center justify-center gap-3 hover:bg-gray-50 active:scale-95 transition-all"
                      >
                        <Camera className="w-6 h-6 text-gray-800" />
                        <span className="font-bold text-gray-800 text-base">Kamera aktivieren</span>
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Items List & Controls - Modern Scrollable Design */}
                <div className="flex-1 overflow-y-auto bg-background w-full p-4 min-h-0">
                  {/* Error Message - Modern Design */}
                  {scanError && !pendingItem && (
                    <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl backdrop-blur-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <p className="text-red-600 font-semibold text-sm">Fehler</p>
                      </div>
                      <p className="text-red-600 font-medium text-center text-sm">{scanError}</p>
                      <p className="text-red-500/70 text-xs text-center mt-1">Quittung näher halten und erneut scannen</p>
                    </div>
                  )}
                  
                  {/* PENDING ITEM - Modern Confirmation Card */}
                  {pendingItem && (
                    <div className="mb-4 p-5 bg-green-500/10 border border-green-500/40 rounded-xl backdrop-blur-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <p className="text-green-600 font-bold text-sm">ERKANNT</p>
                      </div>
                      
                      <div className="bg-background/80 backdrop-blur-sm rounded-lg p-4 mb-4 border border-border/50">
                        <p className="font-bold text-base mb-1">{pendingItem.name}</p>
                        <p className="text-xs text-muted-foreground">CHF {pendingItem.unitPrice.toFixed(2)} pro Stück</p>
                      </div>
                      
                      {/* Quantity Selector - Modern */}
                      <div className="flex items-center justify-center gap-4 mb-4">
                        <button
                          onClick={() => setPendingQuantity(q => Math.max(1, q - 1))}
                          className="w-11 h-11 rounded-full bg-muted flex items-center justify-center text-xl font-bold active:scale-95 transition-transform"
                        >
                          −
                        </button>
                        <div className="w-16 h-11 rounded-lg bg-background border border-border flex items-center justify-center">
                          <span className="text-2xl font-bold">{pendingQuantity}</span>
                        </div>
                        <button
                          onClick={() => setPendingQuantity(q => q + 1)}
                          className="w-11 h-11 rounded-full bg-muted flex items-center justify-center text-xl font-bold active:scale-95 transition-transform"
                        >
                          +
                        </button>
                      </div>
                      
                      <div className="text-center mb-4 p-3 bg-background/50 rounded-lg border border-border/50">
                        <p className="text-xs text-muted-foreground mb-1">Total</p>
                        <p className="text-xl font-bold">CHF {(pendingItem.unitPrice * pendingQuantity).toFixed(2)}</p>
                      </div>
                      
                      {/* Action Buttons - Modern */}
                      <div className="flex gap-2">
                        <button
                          onClick={cancelPendingItem}
                          className="flex-1 py-3 rounded-lg bg-muted flex items-center justify-center gap-2 text-sm font-semibold active:scale-95 transition-transform"
                        >
                          <X className="w-4 h-4" />
                          Abbrechen
                        </button>
                        <button
                          onClick={confirmPendingItem}
                          className="flex-1 py-3 rounded-lg bg-green-500 text-white flex items-center justify-center gap-2 text-sm font-semibold shadow-lg active:scale-95 transition-transform"
                        >
                          <Check className="w-4 h-4" />
                          Hinzufügen
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Instructions - Modern Empty State */}
                  {!pendingItem && liveScannedItems.length === 0 && !scanError && (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                        <ScanLine className="w-8 h-8 text-muted-foreground/40" />
                      </div>
                      <p className="text-base font-bold text-foreground mb-2">Artikel scannen</p>
                      <p className="text-xs text-muted-foreground/70 px-4">
                        {autoScanEnabled ? (
                          <>Auto-Scan aktiv: Quittung in den Rahmen halten</>
                        ) : (
                          <>Quittung in den Rahmen halten und "ALLE SCANNEN" drücken</>
                        )}
                      </p>
                    </div>
                  )}
                  
                  {/* Scanned Items List - Modern Design */}
                  {liveScannedItems.length > 0 && (
                    <div>
                      {/* Summary Header - Modern */}
                      <div className="flex items-center justify-between mb-3 p-3 bg-green-500/10 rounded-xl border border-green-500/30 backdrop-blur-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                            <ShoppingCart className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Gesamt</p>
                            <p className="font-bold text-sm">{liveScannedItems.reduce((sum, i) => sum + i.quantity, 0)} Artikel</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="text-xl font-bold text-green-600">CHF {liveTotal.toFixed(2)}</p>
                        </div>
                      </div>
                      
                      {/* Items List - Modern Cards */}
                      <div className="space-y-2.5 mb-3">
                        {liveScannedItems.map((item, idx) => (
                          <div 
                            key={idx}
                            className="p-3 bg-muted/80 backdrop-blur-sm rounded-xl border border-border/50"
                          >
                            <div className="flex items-start justify-between mb-2.5">
                              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                <div className="w-9 h-9 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 shadow-sm">
                                  {item.quantity}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-sm mb-0.5 truncate">{item.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    CHF {item.unitPrice.toFixed(2)} pro Stück
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => removeLiveItem(idx)}
                                className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
                              >
                                <X className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                            
                            {/* Quantity Controls - Modern */}
                            <div className="flex items-center justify-between pt-2 border-t border-border/50">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => updateItemQuantity(idx, item.quantity - 1)}
                                  className="w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center text-lg font-bold active:scale-95 transition-transform"
                                >
                                  −
                                </button>
                                <div className="w-10 h-9 rounded-lg bg-background border border-border flex items-center justify-center">
                                  <span className="text-lg font-bold">{item.quantity}</span>
                                </div>
                                <button
                                  onClick={() => updateItemQuantity(idx, item.quantity + 1)}
                                  className="w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center text-lg font-bold active:scale-95 transition-transform"
                                >
                                  +
                                </button>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Total</p>
                                <p className="font-bold text-base">CHF {item.totalPrice.toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Action Buttons - Modern */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => { 
                            setScannedPositions(new Set()); 
                            toast.success('Positionen zurückgesetzt');
                          }}
                          className="px-3 py-2.5 rounded-lg bg-muted flex items-center justify-center gap-1.5 text-xs font-semibold active:scale-95 transition-transform"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Reset
                        </button>
                        <button
                          onClick={() => { 
                            setLiveScannedItems([]); 
                            setLiveTotal(0); 
                            setScannedPositions(new Set());
                          }}
                          className="flex-1 py-2.5 rounded-lg bg-muted flex items-center justify-center gap-1.5 text-xs font-semibold active:scale-95 transition-transform"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Alle löschen
                        </button>
                        <button
                          onClick={addLiveItemsToList}
                          className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground flex items-center justify-center gap-1.5 text-xs font-semibold shadow-lg active:scale-95 transition-transform"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Fertig
                        </button>
                      </div>
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

      {/* Barcode Scanner Dialog */}
      {showBarcodeScanner && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          <div className="flex items-center justify-between p-4 bg-black/50">
            <h2 className="text-white font-semibold">Barcode scannen</h2>
            <button
              onClick={closeBarcodeScanner}
              className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
          <div className="flex-1 relative flex items-center justify-center">
            <video
              ref={barcodeVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <canvas ref={barcodeCanvasRef} className="hidden" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-32 border-2 border-white rounded-lg" />
            </div>
            {barcodeScanning && (
              <div className="absolute bottom-20 left-0 right-0 text-center">
                <p className="text-white bg-black/50 px-4 py-2 rounded-lg inline-block">
                  Barcode in den Rahmen positionieren
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Product Info Scanner Dialog */}
      {showProductInfoScanner && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
          <div className="flex items-center justify-between p-4 bg-black/50">
            <h2 className="text-white font-semibold">Produkt fotografieren</h2>
            <button
              onClick={closeProductInfoScanner}
              className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
          <div className="flex-1 relative flex items-center justify-center">
            <video
              ref={productInfoVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <canvas ref={productInfoCanvasRef} className="hidden" />
            {productInfoScanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center">
                  <div className="w-12 h-12 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-white">Analysiere Produkt...</p>
                </div>
              </div>
            )}
          </div>
          <div className="p-4 bg-black/50">
            <Button
              onClick={captureProductImage}
              disabled={productInfoScanning}
              className="w-full bg-primary text-primary-foreground"
            >
              {productInfoScanning ? 'Analysiere...' : 'Foto aufnehmen'}
            </Button>
          </div>
        </div>
      )}

      {/* Lists Management Dialog */}
      <Dialog open={showListDialog} onOpenChange={setShowListDialog}>
        <DialogContent className="!fixed !top-[50%] !left-[50%] !right-auto !bottom-auto !translate-x-[-50%] !translate-y-[-50%] !w-[85vw] !max-w-sm !max-h-[90vh] !rounded-3xl !m-0 !overflow-hidden !shadow-2xl !flex !flex-col">
          <DialogHeader className="px-5 pt-5 pb-3 flex-shrink-0">
            <DialogTitle className="text-lg font-semibold">Einkaufslisten</DialogTitle>
            <DialogDescription className="sr-only">
              Verwalten Sie Ihre Einkaufslisten
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-5 pb-2 overflow-y-auto flex-1 min-h-0 space-y-2">
            {lists.map((list) => (
              <div key={list.id} className="flex items-center gap-2 p-3 border rounded-lg">
                {editingListId === list.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <Input
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      className="flex-1 h-9"
                      placeholder="Listenname"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={() => handleUpdateList(list.id, newListName)}
                      className="h-9"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingListId(null);
                        setNewListName('');
                      }}
                      className="h-9"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1">
                      <p className="font-medium">{list.name}</p>
                      {list.isDefault && (
                        <p className="text-xs text-muted-foreground">Standard</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingListId(list.id);
                        setNewListName(list.name);
                      }}
                      className="h-9 w-9 p-0"
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                    {!list.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteList(list.id)}
                        className="h-9 w-9 p-0 text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          <DialogFooter className="px-5 pb-3 pt-2 gap-2.5 flex-shrink-0">
            <Button variant="outline" onClick={() => setShowListDialog(false)} className="h-11 min-h-[44px] flex-1 rounded-xl text-sm font-medium">
              Schließen
            </Button>
            <Button onClick={() => {
              setShowListDialog(false);
              setShowCreateListDialog(true);
            }} className="h-11 min-h-[44px] flex-1 rounded-xl text-sm font-medium">
              <Plus className="w-4 h-4 mr-2" />
              Neue Liste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create List Dialog */}
      <Dialog open={showCreateListDialog} onOpenChange={setShowCreateListDialog}>
        <DialogContent className="!fixed !top-[50%] !left-[50%] !right-auto !bottom-auto !translate-x-[-50%] !translate-y-[-50%] !w-[85vw] !max-w-sm !max-h-fit !rounded-3xl !m-0 !overflow-visible !shadow-2xl !flex !flex-col">
          <DialogHeader className="px-5 pt-5 pb-3 flex-shrink-0">
            <DialogTitle className="text-lg font-semibold">Neue Liste erstellen</DialogTitle>
            <DialogDescription className="sr-only">
              Erstellen Sie eine neue Einkaufsliste
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 px-5 pb-2 overflow-y-auto flex-1 min-h-0">
            <div className="w-full">
              <Label className="text-sm font-medium">Listenname *</Label>
              <Input
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="z.B. Wochenendeinkauf"
                className="h-11 min-h-[44px] mt-1.5 rounded-xl w-full"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateList();
                  }
                }}
              />
            </div>
          </div>

          <DialogFooter className="px-5 pb-3 pt-2 gap-2.5 flex-shrink-0">
            <Button variant="outline" onClick={() => {
              setShowCreateListDialog(false);
              setNewListName('');
            }} className="h-11 min-h-[44px] flex-1 rounded-xl text-sm font-medium">
              Abbrechen
            </Button>
            <Button onClick={handleCreateList} disabled={!newListName.trim()} className="h-11 min-h-[44px] flex-1 rounded-xl text-sm font-medium">
              Erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FABs */}
      {!showAddDialog && !showScanner && !showMultiAddDialog && !showBarcodeScanner && !showProductInfoScanner && !selectionMode && (
        <div className="fixed right-4 bottom-20 flex flex-col gap-3 safe-bottom">
          <button 
            onClick={openScanner}
            className="w-12 h-12 rounded-full bg-secondary text-secondary-foreground shadow-lg flex items-center justify-center active:opacity-80 transition-opacity"
          >
            <ScanLine className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setShowMultiAddDialog(true)}
            className="w-12 h-12 rounded-full bg-secondary text-secondary-foreground shadow-lg flex items-center justify-center active:opacity-80 transition-opacity"
            title="Mehrere Artikel hinzufügen"
          >
            <Package className="w-5 h-5" />
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
