import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ArrowUp, 
  ArrowDown, 
  Plus,
  X
} from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import { useFinanceEntries, createFinanceEntry, updateFinanceEntry } from '@/lib/firebaseHooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

type TabType = 'all' | 'income' | 'expenses';

const categories = {
  income: ['Gehalt', 'Freelance', 'Investitionen', 'Geschenk', 'Sonstiges'],
  expense: ['Lebensmittel', 'Transport', 'Wohnen', 'Unterhaltung', 'Gesundheit', 'Kleidung', 'Bildung', 'Rechnung', 'Sonstiges']
};

export default function MobileFinance() {
  const { t } = useTranslation();
  const { data: allEntries = [], isLoading, refetch } = useFinanceEntries();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [entryType, setEntryType] = useState<'einnahme' | 'ausgabe'>('ausgabe');
  
  const [newEntry, setNewEntry] = useState({
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    paymentMethod: 'Karte'
  });

  const incomeEntries = useMemo(
    () => allEntries.filter(e => e.type === 'einnahme'),
    [allEntries]
  );

  const expenseEntries = useMemo(
    () => allEntries.filter(e => e.type === 'ausgabe'),
    [allEntries]
  );

  const totalIncome = useMemo(
    () => incomeEntries.reduce((sum, e) => sum + e.amount, 0) / 100,
    [incomeEntries]
  );

  const totalExpenses = useMemo(
    () => expenseEntries
      .filter(e => (e as any).status === 'paid')
      .reduce((sum, e) => sum + e.amount, 0) / 100,
    [expenseEntries]
  );

  const balance = totalIncome - totalExpenses;

  const displayedEntries = useMemo(() => {
    switch (activeTab) {
      case 'income':
        return incomeEntries;
      case 'expenses':
        return expenseEntries;
      default:
        return allEntries;
    }
  }, [activeTab, allEntries, incomeEntries, expenseEntries]);

  const formatAmount = (amount: number) => `CHF ${(amount / 100).toFixed(2)}`;

  const formatDate = (date: any) => {
    try {
      const d = date?.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  const handleStatusChange = async (entryId: string, newStatus: string) => {
    try {
      await updateFinanceEntry(entryId, { status: newStatus } as any);
      toast.success(newStatus === 'paid' ? 'Als bezahlt markiert' : 'Status geändert');
      await refetch();
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    }
  };

  const handleAddEntry = async () => {
    if (!newEntry.category || !newEntry.amount) {
      toast.error('Bitte Kategorie und Betrag eingeben');
      return;
    }

    try {
      await createFinanceEntry({
        type: entryType,
        category: newEntry.category,
        amount: Math.round(parseFloat(newEntry.amount) * 100),
        currency: 'CHF',
        date: new Date(newEntry.date),
        paymentMethod: newEntry.paymentMethod,
        notes: newEntry.notes,
        status: entryType === 'ausgabe' ? 'open' : undefined,
      } as any);

      toast.success(entryType === 'einnahme' ? 'Einnahme hinzugefügt' : 'Ausgabe hinzugefügt');
      setShowAddDialog(false);
      setNewEntry({
        category: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        paymentMethod: 'Karte'
      });
      await refetch();
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    }
  };

  const openAddDialog = (type: 'einnahme' | 'ausgabe') => {
    setEntryType(type);
    setNewEntry({
      category: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      paymentMethod: 'Karte'
    });
    setShowAddDialog(true);
  };

  return (
    <MobileLayout title={t('nav.finance', 'Finanzen')}>
      {/* Summary Cards - Clean design */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="mobile-card text-center py-3">
          <p className="text-xs text-muted-foreground">{t('finance.income', 'Einnahmen')}</p>
          <p className="text-lg font-semibold status-success mt-0.5">
            {totalIncome.toFixed(0)}
          </p>
        </div>
        <div className="mobile-card text-center py-3">
          <p className="text-xs text-muted-foreground">{t('finance.expenses', 'Ausgaben')}</p>
          <p className="text-lg font-semibold status-error mt-0.5">
            {totalExpenses.toFixed(0)}
          </p>
        </div>
        <div className="mobile-card text-center py-3">
          <p className="text-xs text-muted-foreground">{t('finance.balance', 'Saldo')}</p>
          <p className={`text-lg font-semibold mt-0.5 ${balance >= 0 ? 'status-success' : 'status-error'}`}>
            {balance.toFixed(0)}
          </p>
        </div>
      </div>

      {/* Quick Add Buttons - Clean style */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => openAddDialog('einnahme')}
          className="flex-1 mobile-card flex items-center justify-center gap-2 py-3 border-l-2 border-l-green-600 active:opacity-80 transition-opacity"
        >
          <ArrowUp className="w-5 h-5 status-success" />
          <span className="font-medium text-sm">Einnahme</span>
        </button>
        <button
          onClick={() => openAddDialog('ausgabe')}
          className="flex-1 mobile-card flex items-center justify-center gap-2 py-3 border-l-2 border-l-red-600 active:opacity-80 transition-opacity"
        >
          <ArrowDown className="w-5 h-5 status-error" />
          <span className="font-medium text-sm">Ausgabe</span>
        </button>
      </div>

      {/* Tab Buttons - Clean pills */}
      <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar">
        {[
          { key: 'all', label: t('finance.all', 'Alle') },
          { key: 'income', label: t('finance.income', 'Einnahmen') },
          { key: 'expenses', label: t('finance.expenses', 'Ausgaben') },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as TabType)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Entry List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          {t('common.loading', 'Laden...')}
        </div>
      ) : displayedEntries.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {t('finance.noEntries', 'Keine Einträge')}
        </div>
      ) : (
        <div className="space-y-2">
          {displayedEntries.map((entry) => {
            const isIncome = entry.type === 'einnahme';
            const isPaid = (entry as any).status === 'paid';
            
            return (
              <div
                key={entry.id}
                className={`mobile-card flex items-center justify-between ${
                  isIncome ? 'border-l-2 border-l-green-600' : 'border-l-2 border-l-red-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isIncome ? 'bg-status-success' : 'bg-status-error'
                  }`}>
                    {isIncome ? (
                      <ArrowUp className="w-5 h-5 status-success" />
                    ) : (
                      <ArrowDown className="w-5 h-5 status-error" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{entry.category}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(entry.date)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${isIncome ? 'status-success' : 'status-error'}`}>
                    {isIncome ? '+' : '-'}{formatAmount(entry.amount)}
                  </p>
                  {!isIncome && (
                    <button
                      onClick={() => handleStatusChange(entry.id, isPaid ? 'open' : 'paid')}
                      className={`text-xs px-2 py-0.5 rounded mt-1 ${
                        isPaid
                          ? 'bg-status-success status-success'
                          : 'bg-status-warning status-warning'
                      }`}
                    >
                      {isPaid ? t('finance.paid', 'Bezahlt') : t('finance.open', 'Offen')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Entry Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
          <div className="bg-background w-full rounded-t-2xl p-6 safe-bottom animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">
                {entryType === 'einnahme' ? 'Neue Einnahme' : 'Neue Ausgabe'}
              </h2>
              <button
                onClick={() => setShowAddDialog(false)}
                className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Kategorie</Label>
                <Select
                  value={newEntry.category}
                  onValueChange={(value) => setNewEntry({ ...newEntry, category: value })}
                >
                  <SelectTrigger className="mobile-input mt-1">
                    <SelectValue placeholder="Kategorie wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {(entryType === 'einnahme' ? categories.income : categories.expense).map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Betrag (CHF)</Label>
                <Input
                  type="number"
                  value={newEntry.amount}
                  onChange={(e) => setNewEntry({ ...newEntry, amount: e.target.value })}
                  placeholder="0.00"
                  className="mobile-input mt-1"
                  step="0.01"
                />
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Datum</Label>
                <Input
                  type="date"
                  value={newEntry.date}
                  onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                  className="mobile-input mt-1"
                />
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Zahlungsmethode</Label>
                <Select
                  value={newEntry.paymentMethod}
                  onValueChange={(value) => setNewEntry({ ...newEntry, paymentMethod: value })}
                >
                  <SelectTrigger className="mobile-input mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Karte">Karte</SelectItem>
                    <SelectItem value="Bar">Bar</SelectItem>
                    <SelectItem value="Überweisung">Überweisung</SelectItem>
                    <SelectItem value="Twint">Twint</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Notizen (optional)</Label>
                <Input
                  value={newEntry.notes}
                  onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
                  placeholder="Zusätzliche Infos..."
                  className="mobile-input mt-1"
                />
              </div>

              <Button
                onClick={handleAddEntry}
                className={`w-full mobile-btn mt-4 ${
                  entryType === 'einnahme' 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {entryType === 'einnahme' ? 'Einnahme hinzufügen' : 'Ausgabe hinzufügen'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      {!showAddDialog && (
        <button 
          onClick={() => openAddDialog('ausgabe')}
          className="fixed right-4 bottom-20 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:opacity-80 transition-opacity safe-bottom"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </MobileLayout>
  );
}
