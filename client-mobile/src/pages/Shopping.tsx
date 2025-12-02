import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus,
  Check,
  Trash2,
  ShoppingCart
} from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import { useShoppingList, createShoppingItem, markShoppingItemAsBought, deleteShoppingItem } from '@/lib/firebaseHooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function MobileShopping() {
  const { t } = useTranslation();
  const { data: items = [], isLoading, refetch } = useShoppingList();
  const [newItemName, setNewItemName] = useState('');
  const [showInput, setShowInput] = useState(false);

  const openItems = items.filter(i => !i.bought);
  const boughtItems = items.filter(i => i.bought);

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;
    
    try {
      await createShoppingItem({
        item: newItemName.trim(),
        quantity: 1,
        category: 'Sonstiges',
        bought: false,
      });
      setNewItemName('');
      setShowInput(false);
      toast.success('Artikel hinzugefügt');
      refetch();
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    }
  };

  const handleMarkAsBought = async (itemId: string) => {
    try {
      await markShoppingItemAsBought(itemId, 0, false);
      toast.success('Erledigt ✓');
      refetch();
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      await deleteShoppingItem(itemId);
      toast.success('Gelöscht');
      refetch();
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    }
  };

  return (
    <MobileLayout title={t('nav.shopping', 'Einkaufsliste')}>
      {/* Stats */}
      <div className="flex gap-3 mb-4">
        <div className="mobile-card flex-1 text-center py-3">
          <p className="text-2xl font-bold text-primary">{openItems.length}</p>
          <p className="text-xs text-muted-foreground">{t('shopping.open', 'Offen')}</p>
        </div>
        <div className="mobile-card flex-1 text-center py-3">
          <p className="text-2xl font-bold text-green-600">{boughtItems.length}</p>
          <p className="text-xs text-muted-foreground">{t('shopping.bought', 'Gekauft')}</p>
        </div>
      </div>

      {/* Quick Add Input */}
      {showInput && (
        <div className="mobile-card mb-4 flex gap-2">
          <Input
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="Artikel eingeben..."
            className="mobile-input flex-1"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
          />
          <Button onClick={handleAddItem} className="mobile-btn">
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* Open Items */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          {t('common.loading', 'Laden...')}
        </div>
      ) : openItems.length === 0 ? (
        <div className="mobile-card text-center py-8">
          <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-muted-foreground">{t('shopping.empty', 'Liste ist leer')}</p>
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          {openItems.map((item) => (
            <div
              key={item.id}
              className="mobile-card flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleMarkAsBought(item.id)}
                  className="w-8 h-8 rounded-full border-2 border-primary flex items-center justify-center active:scale-95 transition-transform"
                >
                  <Check className="w-4 h-4 text-primary opacity-0 hover:opacity-50" />
                </button>
                <div>
                  <p className="font-medium">{item.item}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity}x • {item.category}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(item.id)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive active:scale-95 transition-all"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Bought Items */}
      {boughtItems.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            {t('shopping.bought', 'Eingekauft')} ({boughtItems.length})
          </h3>
          <div className="space-y-2 opacity-60">
            {boughtItems.map((item) => (
              <div
                key={item.id}
                className="mobile-card flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="font-medium line-through">{item.item}</p>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* FAB */}
      <button 
        onClick={() => setShowInput(!showInput)}
        className="fixed right-4 bottom-20 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition-transform safe-bottom"
      >
        <Plus className={`w-6 h-6 transition-transform ${showInput ? 'rotate-45' : ''}`} />
      </button>
    </MobileLayout>
  );
}

