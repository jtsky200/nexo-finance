import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, TrendingUp, TrendingDown, Users, ShoppingCart, Trash2, Eye, Filter, X } from 'lucide-react';
import { useFinanceEntries, usePeople, usePersonDebts, createPerson, deletePerson, updateFinanceEntry } from '@/lib/firebaseHooks';
import AddFinanceEntryDialog from '@/components/AddFinanceEntryDialog';
import ShoppingListModal from '@/components/ShoppingListModal';
import PersonInvoicesDialog from '@/components/PersonInvoicesDialog';
import { toast } from 'sonner';

export default function Finance() {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [showAddPersonDialog, setShowAddPersonDialog] = useState(false);
  const [showPersonInvoicesDialog, setShowPersonInvoicesDialog] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [defaultType, setDefaultType] = useState<'einnahme' | 'ausgabe'>('ausgabe');
  const [newPerson, setNewPerson] = useState({ name: '', email: '', phone: '', currency: 'CHF' });
  const [activeTab, setActiveTab] = useState('overview');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const { data: allEntries = [], isLoading } = useFinanceEntries();

  // Get unique categories from all entries
  const categories = useMemo(() => {
    const cats = new Set(allEntries.map(e => e.category));
    return Array.from(cats).filter(Boolean).sort();
  }, [allEntries]);

  // Filter entries by category
  const filteredEntries = useMemo(() => {
    if (categoryFilter === 'all') return allEntries;
    return allEntries.filter(e => e.category === categoryFilter);
  }, [allEntries, categoryFilter]);
  const { data: people = [], isLoading: peopleLoading } = usePeople();

  const formatDate = (date: Date | any) => {
    if (!date) return 'N/A';
    try {
      const d = date?.toDate ? date.toDate() : new Date(date);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleDateString('de-CH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  const formatAmount = (amount: number, currency: string = 'CHF') => {
    return `${currency} ${(amount / 100).toFixed(2)}`;
  };

  const incomeEntries = useMemo(
    () => filteredEntries.filter(e => e.type === 'einnahme'),
    [filteredEntries]
  );

  const expenseEntries = useMemo(
    () => filteredEntries.filter(e => e.type === 'ausgabe'),
    [filteredEntries]
  );

  const totalIncome = useMemo(
    () => incomeEntries.reduce((sum, e) => sum + e.amount, 0) / 100,
    [incomeEntries]
  );

  const totalExpenses = useMemo(
    () => expenseEntries.reduce((sum, e) => sum + e.amount, 0) / 100,
    [expenseEntries]
  );

  const balance = totalIncome - totalExpenses;

  const openDialog = (type: 'einnahme' | 'ausgabe') => {
    setDefaultType(type);
    setDialogOpen(true);
  };

  const handleAddPerson = async () => {
    if (!newPerson.name) {
      toast.error(t('finance.errors.nameRequired'));
      return;
    }

    try {
      await createPerson(newPerson);
      toast.success(t('finance.personAdded'));
      setNewPerson({ name: '', email: '', phone: '', currency: 'CHF' });
      setShowAddPersonDialog(false);
    } catch (error: any) {
      toast.error(t('common.error') + ': ' + error.message);
    }
  };

  const handleDeletePerson = async (personId: string) => {
    if (!confirm(t('finance.confirmDeletePerson'))) return;
    
    try {
      await deletePerson(personId);
      toast.success(t('finance.personDeleted'));
      // Reload page to refresh data
      window.location.reload();
    } catch (error: any) {
      console.error('Error deleting person:', error);
      toast.error(t('common.error') + ': ' + error.message);
    }
  };

  const handleStatusChange = async (entryId: string, newStatus: string) => {
    try {
      await updateFinanceEntry(entryId, { status: newStatus } as any);
      toast.success(t('finance.statusUpdated'));
      // Reload page to refresh data
      window.location.reload();
    } catch (error: any) {
      toast.error(t('common.error') + ': ' + error.message);
    }
  };

  const renderEntryList = (entries: typeof allEntries, type?: 'einnahme' | 'ausgabe') => {
    if (isLoading) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          {t('common.loading')}
        </div>
      );
    }

    if (entries.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          {type === 'einnahme' ? t('finance.noIncome') : type === 'ausgabe' ? t('finance.noExpenses') : t('finance.noEntries')}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {entries.map((entry) => {
          const entryType = entry.type || type;
          return (
            <div
              key={entry.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors gap-2"
            >
              <div className="flex items-start gap-3 flex-1">
                <div className={`mt-1 ${entryType === 'einnahme' ? 'text-green-500' : 'text-red-500'}`}>
                  {entryType === 'einnahme' ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-medium text-foreground">{entry.category}</p>
                    <Badge variant="outline" className="text-xs">{entry.paymentMethod || 'N/A'}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(entry.date)}
                  </p>
                  {entry.notes && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {entry.notes.includes('Status:') 
                        ? entry.notes.replace('Status: paid', t('finance.paid')).replace('Status: open', t('finance.open'))
                        : entry.notes
                      }
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                <p className={`font-semibold text-base sm:text-lg ${entryType === 'einnahme' ? 'text-green-600' : 'text-red-600'}`}>
                  {entryType === 'einnahme' ? '+' : '-'}
                  {formatAmount(entry.amount, entry.currency)}
                </p>
                <Select
                  value={(entry as any).status || 'open'}
                  onValueChange={(value) => handleStatusChange(entry.id, value)}
                >
                  <SelectTrigger className="h-7 text-xs w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">{t('finance.open')}</SelectItem>
                    <SelectItem value="paid">{t('finance.paid')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Layout title={t('finance.title')}>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <p className="text-sm sm:text-base text-muted-foreground">
            {t('finance.description')}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setShowShoppingList(true)} variant="outline" size="sm">
              <ShoppingCart className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{t('shopping.title')}</span>
            </Button>
            <Button onClick={() => openDialog('ausgabe')} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              {t('finance.add')}
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                {t('finance.totalIncome')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl sm:text-2xl font-bold text-green-600">
                {formatAmount(totalIncome * 100)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                {t('finance.totalExpenses')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl sm:text-2xl font-bold text-red-600">
                {formatAmount(totalExpenses * 100)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                {t('finance.balance')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-xl sm:text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatAmount(balance * 100)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="space-y-4">
          {/* Custom Tab Buttons */}
          <div className="grid w-full grid-cols-4 gap-2 bg-muted p-1 rounded-lg">
            <Button
              variant={activeTab === 'overview' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('overview')}
              className="text-xs sm:text-sm"
            >
              {t('finance.overview')}
            </Button>
            <Button
              variant={activeTab === 'income' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('income')}
              className="text-xs sm:text-sm"
            >
              {t('finance.income')}
            </Button>
            <Button
              variant={activeTab === 'expenses' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('expenses')}
              className="text-xs sm:text-sm"
            >
              {t('finance.expenses')}
            </Button>
            <Button
              variant={activeTab === 'people' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('people')}
              className="text-xs sm:text-sm"
            >
              {t('finance.people')}
            </Button>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <CardTitle className="text-base sm:text-lg">{t('finance.allEntries')}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-[180px] h-8 text-sm">
                        <SelectValue placeholder={t('finance.filterByCategory', 'Nach Kategorie filtern')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('finance.allCategories', 'Alle Kategorien')}</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {categoryFilter !== 'all' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setCategoryFilter('all')}
                        className="h-8 px-2"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                {categoryFilter !== 'all' && (
                  <CardDescription className="mt-2">
                    {t('finance.showingCategory', 'Zeigt')}: <Badge variant="secondary">{categoryFilter}</Badge>
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {renderEntryList(filteredEntries)}
              </CardContent>
            </Card>
          )}

          {/* Income Tab */}
          {activeTab === 'income' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-lg">{t('finance.income')}</CardTitle>
                  <Button size="sm" onClick={() => openDialog('einnahme')}>
                    <Plus className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">{t('finance.addIncome')}</span>
                    <span className="sm:hidden">+</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {renderEntryList(incomeEntries, 'einnahme')}
              </CardContent>
            </Card>
          )}

          {/* Expenses Tab */}
          {activeTab === 'expenses' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base sm:text-lg">{t('finance.expenses')}</CardTitle>
                  <Button size="sm" onClick={() => openDialog('ausgabe')}>
                    <Plus className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">{t('finance.addExpense')}</span>
                    <span className="sm:hidden">+</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {renderEntryList(expenseEntries, 'ausgabe')}
              </CardContent>
            </Card>
          )}

          {/* People Tab */}
          {activeTab === 'people' && (<div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg sm:text-xl font-semibold">{t('finance.people')}</h2>
              <Button size="sm" onClick={() => setShowAddPersonDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">{t('finance.addPerson')}</span>
                <span className="sm:hidden">+</span>
              </Button>
            </div>

            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {peopleLoading ? (
                <p className="text-center text-muted-foreground col-span-full py-8">{t('common.loading')}</p>
              ) : people.length > 0 ? (
                people.map((person: any) => (
                  <Card key={person.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Users className="h-4 w-4" />
                        {person.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {person.email && (
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{person.email}</p>
                      )}
                      <div>
                        <p className="text-xs text-muted-foreground">{t('finance.openAmount')}</p>
                        <p className="text-lg sm:text-xl font-bold text-red-600">
                          CHF {person.totalOwed?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs"
                          onClick={() => {
                            setSelectedPerson(person);
                            setShowPersonInvoicesDialog(true);
                          }}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          {t('finance.viewDetails')}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeletePerson(person.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8 col-span-full">
                  {t('finance.noPeople')}
                </p>
              )}
            </div></div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <AddFinanceEntryDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        defaultType={defaultType}
      />
      <ShoppingListModal open={showShoppingList} onClose={() => setShowShoppingList(false)} />
      {selectedPerson && (
        <PersonInvoicesDialog
          person={selectedPerson}
          open={showPersonInvoicesDialog}
          onOpenChange={setShowPersonInvoicesDialog}
        />
      )}

      {/* Add Person Dialog */}
      <Dialog open={showAddPersonDialog} onOpenChange={setShowAddPersonDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('finance.addPerson')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('finance.personName')} *</Label>
              <Input
                value={newPerson.name}
                onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })}
                placeholder={t('finance.namePlaceholder')}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={newPerson.email}
                onChange={(e) => setNewPerson({ ...newPerson, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <Label>{t('finance.phone')}</Label>
              <Input
                value={newPerson.phone}
                onChange={(e) => setNewPerson({ ...newPerson, phone: e.target.value })}
                placeholder="+41 79 123 45 67"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddPerson} className="w-full">
              {t('common.add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
