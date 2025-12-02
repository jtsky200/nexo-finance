import { useState, useMemo } from 'react';
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
import { 
  Plus, Trash2, Check, ShoppingCart, ShoppingBag, Package, 
  Clock, Copy, Share2, Download,
  Lightbulb, RotateCcw, ListChecks, Tag, Banknote,
  Apple, Home as HomeIcon, Shirt, Zap, Heart, MoreHorizontal
} from 'lucide-react';
import { useShoppingList, createShoppingItem, deleteShoppingItem, markShoppingItemAsBought } from '@/lib/firebaseHooks';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// Category icons and colors
const categoryConfig: Record<string, { icon: any; color: string; bg: string }> = {
  'Lebensmittel': { icon: Apple, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
  'Haushalt': { icon: HomeIcon, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  'Hygiene': { icon: Heart, color: 'text-pink-600', bg: 'bg-pink-100 dark:bg-pink-900/30' },
  'Elektronik': { icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  'Kleidung': { icon: Shirt, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  'Sonstiges': { icon: Package, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-900/30' },
};

// Quick add templates
const quickAddTemplates = [
  { name: 'Milch', category: 'Lebensmittel', price: 1.80 },
  { name: 'Brot', category: 'Lebensmittel', price: 3.50 },
  { name: 'Eier (6er)', category: 'Lebensmittel', price: 4.20 },
  { name: 'Butter', category: 'Lebensmittel', price: 2.90 },
  { name: 'Käse', category: 'Lebensmittel', price: 5.50 },
  { name: 'Bananen', category: 'Lebensmittel', price: 2.50 },
  { name: 'Äpfel', category: 'Lebensmittel', price: 3.90 },
  { name: 'Toilettenpapier', category: 'Haushalt', price: 8.90 },
  { name: 'Waschmittel', category: 'Haushalt', price: 12.90 },
  { name: 'Zahnpasta', category: 'Hygiene', price: 3.50 },
  { name: 'Shampoo', category: 'Hygiene', price: 5.90 },
  { name: 'Duschgel', category: 'Hygiene', price: 4.50 },
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

export default function Shopping() {
  const { t } = useTranslation();
  const { data: items = [], isLoading, refetch } = useShoppingList();
  const [newItem, setNewItem] = useState({
    item: '',
    quantity: 1,
    category: 'Lebensmittel',
    estimatedPrice: 0,
    currency: 'CHF',
  });
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<typeof listTemplates[0] | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'price'>('category');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const categories = ['Lebensmittel', 'Haushalt', 'Hygiene', 'Elektronik', 'Kleidung', 'Sonstiges'];

  // Computed values
  const notBoughtItems = useMemo(() => {
    let filtered = items.filter(i => i.status === 'not_bought');
    if (filterCategory !== 'all') {
      filtered = filtered.filter(i => i.category === filterCategory);
    }
    return filtered.sort((a, b) => {
      if (sortBy === 'name') return a.item.localeCompare(b.item);
      if (sortBy === 'category') return a.category.localeCompare(b.category);
      if (sortBy === 'price') return b.estimatedPrice - a.estimatedPrice;
      return 0;
    });
  }, [items, filterCategory, sortBy]);

  const boughtItems = useMemo(() => 
    items.filter(i => i.status === 'bought'), [items]);

  const totalBudget = notBoughtItems.reduce((sum, i) => sum + (i.estimatedPrice * i.quantity), 0);
  const totalSpent = boughtItems.reduce((sum, i) => sum + ((i.actualPrice || i.estimatedPrice) * i.quantity), 0);
  const budgetProgress = totalBudget > 0 ? (totalSpent / (totalBudget + totalSpent)) * 100 : 0;

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, typeof notBoughtItems> = {};
    notBoughtItems.forEach(item => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [notBoughtItems]);

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

  const formatPrice = (cents: number) => `CHF ${(cents / 100).toFixed(2)}`;

  return (
    <Layout title={t('shopping.title')}>
      <div className="space-y-6">
        {/* Header with stats */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Budget Overview Card */}
          <Card className="flex-1">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-lg">
                    <Banknote className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Budget</p>
                    <p className="text-xl font-bold">{formatPrice(totalBudget * 100)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Ausgegeben</p>
                  <p className="text-xl font-bold text-orange-600">{formatPrice(totalSpent * 100)}</p>
                </div>
              </div>
              <Progress value={budgetProgress} className="h-2" />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>{notBoughtItems.length} Artikel offen</span>
                <span>{boughtItems.length} eingekauft</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="lg:w-80">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  className="h-auto py-3 flex-col gap-1"
                  onClick={() => setShowTemplateDialog(true)}
                >
                  <ListChecks className="w-5 h-5" />
                  <span className="text-xs">Vorlagen</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-3 flex-col gap-1"
                  onClick={handleShareList}
                >
                  <Share2 className="w-5 h-5" />
                  <span className="text-xs">Teilen</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-3 flex-col gap-1"
                  onClick={() => setShowClearConfirm(true)}
                  disabled={boughtItems.length === 0}
                >
                  <RotateCcw className="w-5 h-5" />
                  <span className="text-xs">Aufräumen</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-3 flex-col gap-1"
                  onClick={() => {
                    const csv = notBoughtItems.map(i => `${i.item},${i.quantity},${i.category},${formatPrice(i.estimatedPrice)}`).join('\n');
                    navigator.clipboard.writeText(`Artikel,Menge,Kategorie,Preis\n${csv}`);
                    toast.success('Als CSV kopiert');
                  }}
                >
                  <Download className="w-5 h-5" />
                  <span className="text-xs">Export</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Add Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Schnell hinzufügen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {quickAddTemplates.slice(0, 8).map((template) => {
                const config = categoryConfig[template.category] || categoryConfig['Sonstiges'];
                return (
                  <Button
                    key={template.name}
                    variant="outline"
                    size="sm"
                    className="h-auto py-2 px-3 gap-2"
                    onClick={() => handleQuickAdd(template)}
                  >
                    <span className={`w-2 h-2 rounded-full ${config.bg}`} />
                    {template.name}
                    <span className="text-muted-foreground text-xs">
                      CHF {template.price.toFixed(2)}
                    </span>
                  </Button>
                );
              })}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto py-2 px-3"
                onClick={() => setShowTemplateDialog(true)}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
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
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 min-w-0">
                <Label className="text-xs text-muted-foreground">Artikel</Label>
                <Input
                  value={newItem.item}
                  onChange={(e) => setNewItem({ ...newItem, item: e.target.value })}
                  placeholder="z.B. Bio-Milch"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                />
              </div>
              <div className="w-20 shrink-0">
                <Label className="text-xs text-muted-foreground">Menge</Label>
                <Input
                  type="number"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                  min={1}
                />
              </div>
              <div className="w-36 shrink-0">
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
              <div className="w-28 shrink-0">
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
              <div className="shrink-0 self-end">
                <Button onClick={handleAddItem} size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shopping List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-2 items-center">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[160px] h-9">
                  <Tag className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Kategorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Kategorien</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Sortieren" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="category">Nach Kategorie</SelectItem>
                  <SelectItem value="name">Nach Name</SelectItem>
                  <SelectItem value="price">Nach Preis</SelectItem>
                </SelectContent>
              </Select>
              {filterCategory !== 'all' && (
                <Button variant="ghost" size="sm" onClick={() => setFilterCategory('all')}>
                  Filter zurücksetzen
                </Button>
              )}
            </div>

            {/* Items grouped by category */}
            {isLoading ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Wird geladen...
                </CardContent>
              </Card>
            ) : notBoughtItems.length === 0 ? (
              <Card className="h-fit">
                <CardContent className="py-8 text-center">
                  <ShoppingBag className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground text-sm">Deine Einkaufsliste ist leer</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Füge Artikel hinzu oder nutze eine Vorlage
                  </p>
                </CardContent>
              </Card>
            ) : (
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
                            {categoryItems.map((item) => (
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
                                  <p className="font-medium truncate">{item.item}</p>
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
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>

          {/* Sidebar - Bought Items */}
          <div className="space-y-4">
            {/* Spacer to align with filters on the left */}
            <div className="h-9" />
            
            <Card className="h-fit">
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
              <CardContent className="py-0 pb-3">
                {boughtItems.length === 0 ? (
                  <div className="flex items-center justify-center min-h-[120px]">
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
              </CardContent>
            </Card>

            {/* Tips Card - only visible on hover */}
            <Card className="bg-amber-50/50 dark:bg-amber-950/10 border-amber-200/30 opacity-0 hover:opacity-100 transition-opacity duration-300">
              <CardContent className="py-3 px-4">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Tippe auf die Checkbox, um einen Artikel als eingekauft zu markieren.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

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
                {quickAddTemplates.map((template) => (
                  <Button
                    key={template.name}
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

