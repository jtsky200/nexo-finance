import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useShoppingList, createShoppingItem, updateShoppingItem, deleteShoppingItem, markShoppingItemAsBought } from '@/lib/firebaseHooks';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { Plus, Trash2, Check, ShoppingCart } from 'lucide-react';

interface ShoppingListModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ShoppingListModal({ open, onClose }: ShoppingListModalProps) {
  const { t } = useTranslation();
  const { data: items, isLoading } = useShoppingList();
  const [newItem, setNewItem] = useState({
    item: '',
    quantity: 1,
    category: 'Lebensmittel',
    estimatedPrice: 0,
    currency: 'CHF',
  });

  const categories = [
    t('shopping.categories.groceries', 'Lebensmittel'),
    t('shopping.categories.household', 'Haushalt'),
    t('shopping.categories.hygiene', 'Hygiene'),
    t('shopping.categories.electronics', 'Elektronik'),
    t('shopping.categories.clothing', 'Kleidung'),
    t('shopping.categories.other', 'Sonstiges')
  ];

  const handleAddItem = async () => {
    if (!newItem.item) {
      toast.error(t('shopping.enterItem', 'Bitte Artikel eingeben'));
      return;
    }

    try {
      await createShoppingItem(newItem);
      toast.success(t('shopping.itemAdded', 'Artikel hinzugefügt'));
      setNewItem({
        item: '',
        quantity: 1,
        category: 'Lebensmittel',
        estimatedPrice: 0,
        currency: 'CHF',
      });
    } catch (error: any) {
      toast.error(t('common.error', 'Fehler') + ': ' + error.message);
    }
  };

  const handleMarkAsBought = async (itemId: string, estimatedPrice: number) => {
    try {
      await markShoppingItemAsBought(itemId, estimatedPrice, true);
      toast.success(t('shopping.markedAsBought', 'Als eingekauft markiert und Ausgabe erstellt'));
    } catch (error: any) {
      toast.error(t('common.error', 'Fehler') + ': ' + error.message);
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      await deleteShoppingItem(itemId);
      toast.success(t('shopping.itemDeleted', 'Artikel gelöscht'));
    } catch (error: any) {
      toast.error(t('common.error', 'Fehler') + ': ' + error.message);
    }
  };

  const notBoughtItems = items?.filter(i => i.status === 'not_bought') || [];
  const boughtItems = items?.filter(i => i.status === 'bought') || [];
  const totalBudget = notBoughtItems.reduce((sum, i) => sum + i.estimatedPrice, 0);
  const totalSpent = boughtItems.reduce((sum, i) => sum + (i.actualPrice || i.estimatedPrice), 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {t('shopping.title')}
          </DialogTitle>
        </DialogHeader>

        {/* Budget Overview */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">{t('shopping.totalBudget')}</p>
            <p className="text-2xl font-bold">CHF {totalBudget.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('shopping.spent')}</p>
            <p className="text-2xl font-bold text-red-600">CHF {totalSpent.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t('shopping.remaining')}</p>
            <p className="text-2xl font-bold text-green-600">CHF {(totalBudget - totalSpent).toFixed(2)}</p>
          </div>
        </div>

        {/* Add New Item */}
        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="font-semibold">{t('shopping.addItem')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>{t('shopping.item')}</Label>
              <Input
                value={newItem.item}
                onChange={(e) => setNewItem({ ...newItem, item: e.target.value })}
                placeholder={t('shopping.itemPlaceholder', 'z.B. Milch')}
              />
            </div>
            <div>
              <Label>{t('shopping.quantity')}</Label>
              <Input
                type="number"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                min={1}
              />
            </div>
            <div>
              <Label>{t('shopping.category')}</Label>
              <Select value={newItem.category} onValueChange={(value) => setNewItem({ ...newItem, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('shopping.estimatedPrice')}</Label>
              <Input
                type="number"
                value={newItem.estimatedPrice}
                onChange={(e) => setNewItem({ ...newItem, estimatedPrice: parseFloat(e.target.value) || 0 })}
                min={0}
                step={0.1}
                placeholder="0.00"
              />
            </div>
          </div>
          <Button onClick={handleAddItem} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            {t('common.add')}
          </Button>
        </div>

        {/* Not Bought Items */}
        <div className="space-y-3">
          <h3 className="font-semibold">{t('shopping.notBought')} ({notBoughtItems.length})</h3>
          {notBoughtItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t('shopping.noItems')}</p>
          ) : (
            <div className="space-y-2">
              {notBoughtItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{item.item}</p>
                      <Badge variant="outline">{item.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity}x · CHF {item.estimatedPrice.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleMarkAsBought(item.id, item.estimatedPrice)}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      {t('shopping.bought', 'Eingekauft')}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bought Items */}
        {boughtItems.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">{t('shopping.bought')} ({boughtItems.length})</h3>
            <div className="space-y-2">
              {boughtItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium line-through text-muted-foreground">{item.item}</p>
                      <Badge variant="secondary">{item.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity}x · CHF {(item.actualPrice || item.estimatedPrice).toFixed(2)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
