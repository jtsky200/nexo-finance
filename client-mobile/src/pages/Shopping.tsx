import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ShoppingCart, 
  Plus, 
  Check,
  X,
  Trash2
} from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import { useShoppingList, createShoppingItem, markShoppingItemAsBought, deleteShoppingItem } from '@/lib/firebaseHooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

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

      {/* FAB */}
      {!showAddDialog && (
        <button 
          onClick={() => setShowAddDialog(true)}
          className="fixed right-4 bottom-20 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:opacity-80 transition-opacity safe-bottom"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </MobileLayout>
  );
}
