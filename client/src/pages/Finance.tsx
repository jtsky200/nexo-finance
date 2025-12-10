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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, ArrowUp, ArrowDown, Users, ShoppingCart, Trash2, Eye, Filter, X, Download, BarChart3 } from 'lucide-react';
import { useFinanceEntries, usePeople, usePersonDebts, createPerson, deletePerson, updateFinanceEntry, deleteFinanceEntry } from '@/lib/firebaseHooks';
import AddFinanceEntryDialog from '@/components/AddFinanceEntryDialog';
import ShoppingListModal from '@/components/ShoppingListModal';
import PersonInvoicesDialog from '@/components/PersonInvoicesDialog';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Finance() {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [showAddPersonDialog, setShowAddPersonDialog] = useState(false);
  const [showPersonInvoicesDialog, setShowPersonInvoicesDialog] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [defaultType, setDefaultType] = useState<'einnahme' | 'ausgabe'>('ausgabe');
  const [newPerson, setNewPerson] = useState({ name: '', email: '', phone: '', currency: 'CHF', type: 'household' as const });
  const [activeTab, setActiveTab] = useState('overview');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [deletePersonId, setDeletePersonId] = useState<string | null>(null);
  const [statusChangeConfirm, setStatusChangeConfirm] = useState<{
    entryId: string;
    entry: any;
    newStatus: string;
  } | null>(null);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const { data: allEntries = [], isLoading, refetch } = useFinanceEntries();

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
  const { data: people = [], isLoading: peopleLoading, refetch: refetchPeople } = usePeople();

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

  // Only count PAID expenses in total (status === 'paid')
  const totalExpenses = useMemo(
    () => expenseEntries
      .filter(e => (e as any).status === 'paid')
      .reduce((sum, e) => sum + e.amount, 0) / 100,
    [expenseEntries]
  );

  // Calculate open/pending expenses separately
  const openExpenses = useMemo(
    () => expenseEntries
      .filter(e => (e as any).status !== 'paid')
      .reduce((sum, e) => sum + e.amount, 0) / 100,
    [expenseEntries]
  );

  const balance = totalIncome - totalExpenses;

  // Monthly data for chart
  const monthlyData = useMemo(() => {
    const months: { [key: string]: { month: string, income: number, expenses: number } } = {};
    const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    
    // Initialize last 6 months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months[key] = {
        month: monthNames[date.getMonth()],
        income: 0,
        expenses: 0
      };
    }

    // Aggregate data - only count PAID expenses
    allEntries.forEach(entry => {
      try {
        const entryDate = (entry.date as any)?.toDate ? (entry.date as any).toDate() : new Date(entry.date);
        if (isNaN(entryDate.getTime())) return;
        
        const key = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}`;
        if (months[key]) {
          if (entry.type === 'einnahme') {
            months[key].income += entry.amount / 100;
          } else if ((entry as any).status === 'paid') {
            // Only count paid expenses
            months[key].expenses += entry.amount / 100;
          }
        }
      } catch {
        // Skip invalid dates
      }
    });

    return Object.values(months);
  }, [allEntries]);

  // Category breakdown for pie chart - only PAID expenses
  const categoryData = useMemo(() => {
    const categories: { [key: string]: number } = {};
    
    // Only count paid expenses in the chart
    expenseEntries
      .filter(e => (e as any).status === 'paid')
      .forEach(entry => {
        const cat = entry.category || 'Sonstiges';
        categories[cat] = (categories[cat] || 0) + entry.amount / 100;
      });

    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenseEntries]);

  // Colors for pie chart
  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];

  // Clear all entries function
  const handleClearAllEntries = async () => {
    if (allEntries.length === 0) {
      toast.info(t('finance.noEntriesToDelete', 'Keine Einträge zum Löschen vorhanden'));
      setShowClearAllDialog(false);
      return;
    }

    setIsClearing(true);
    try {
      // Delete all entries one by one
      for (const entry of allEntries) {
        await deleteFinanceEntry(entry.id);
      }
      
      // Reset filters
      setCategoryFilter('all');
      setActiveTab('overview');
      
      // Refresh data
      await refetch();
      
      toast.success(t('finance.allEntriesDeleted', `${allEntries.length} Einträge gelöscht`));
    } catch (error: any) {
      toast.error(t('finance.clearError', 'Fehler beim Löschen: ') + error.message);
    } finally {
      setIsClearing(false);
      setShowClearAllDialog(false);
    }
  };

  // Export functions
  const exportToCSV = () => {
    const headers = ['Datum', 'Typ', 'Kategorie', 'Betrag', 'Währung', 'Zahlungsmethode', 'Status', 'Notizen'];
    const rows = allEntries.map(entry => {
      const date = (entry.date as any)?.toDate ? (entry.date as any).toDate() : new Date(entry.date);
      const dateStr = isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('de-CH');
      const isIncome = entry.type === 'einnahme';
      // Status nur für Ausgaben, bei Einnahmen leer
      const statusText = isIncome ? '' : ((entry as any).status === 'paid' ? 'Bezahlt' : 'Offen');
      return [
        dateStr,
        isIncome ? 'Einnahme' : 'Ausgabe',
        entry.category || '',
        (entry.amount / 100).toFixed(2),
        entry.currency || 'CHF',
        entry.paymentMethod || '',
        statusText,
        (entry.notes || '').replace(/,/g, ';').replace(/\n/g, ' ')
      ].join(',');
    });
    
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finanzen_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('finance.exportSuccess', 'Export erfolgreich'));
  };

  const exportToPDF = () => {
    const totalIncomeFormatted = formatAmount(totalIncome * 100);
    const totalExpensesFormatted = formatAmount(totalExpenses * 100);
    const balanceFormatted = formatAmount(balance * 100);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Finanzübersicht - Nexo Finance</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
          h1 { color: #1a1a1a; border-bottom: 2px solid #1a1a1a; padding-bottom: 10px; font-size: 28px; }
          .summary { display: flex; gap: 20px; margin: 20px 0; }
          .summary-card { background: #f8fafc; padding: 15px 25px; border-radius: 8px; flex: 1; }
          .summary-card h3 { margin: 0 0 5px 0; font-size: 12px; color: #64748b; text-transform: uppercase; }
          .summary-card p { margin: 0; font-size: 24px; font-weight: bold; }
          .income { color: #16a34a; }
          .expense { color: #dc2626; }
          .balance { color: ${balance >= 0 ? '#16a34a' : '#dc2626'}; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
          th { background: #f1f5f9; font-weight: 600; }
          tr:hover { background: #f8fafc; }
          .type-einnahme { color: #16a34a; }
          .type-ausgabe { color: #dc2626; }
          .footer { margin-top: 40px; text-align: center; color: #94a3b8; font-size: 12px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>Finanzübersicht</h1>
        <p style="color: #64748b;">Exportiert am ${new Date().toLocaleDateString('de-CH', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        
        <div class="summary">
          <div class="summary-card">
            <h3>Einnahmen</h3>
            <p class="income">${totalIncomeFormatted}</p>
          </div>
          <div class="summary-card">
            <h3>Ausgaben</h3>
            <p class="expense">${totalExpensesFormatted}</p>
          </div>
          <div class="summary-card">
            <h3>Saldo</h3>
            <p class="balance">${balanceFormatted}</p>
          </div>
        </div>

        <h2>Alle Transaktionen (${allEntries.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Datum</th>
              <th>Typ</th>
              <th>Kategorie</th>
              <th>Betrag</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${allEntries.map(entry => {
              const date = (entry.date as any)?.toDate ? (entry.date as any).toDate() : new Date(entry.date);
              const dateStr = isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('de-CH');
              const isIncome = entry.type === 'einnahme';
              // Status nur für Ausgaben anzeigen, nicht für Einnahmen
              const statusText = isIncome ? '-' : ((entry as any).status === 'paid' ? '✓ Bezahlt' : '○ Offen');
              // Konsistente Klasse basierend auf isIncome
              const typeClass = isIncome ? 'type-einnahme' : 'type-ausgabe';
              return `
                <tr>
                  <td>${dateStr}</td>
                  <td class="${typeClass}">${isIncome ? '↑ Einnahme' : '↓ Ausgabe'}</td>
                  <td>${entry.category || '-'}</td>
                  <td class="${typeClass}">${formatAmount(entry.amount, entry.currency)}</td>
                  <td>${statusText}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p>Nexo Finance • ${new Date().getFullYear()}</p>
        </div>
        
      </body>
      </html>
    `;

    // Create blob and open in new window with proper URL
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    
    if (!printWindow) {
      toast.error(t('finance.exportError', 'Export fehlgeschlagen'));
      URL.revokeObjectURL(url);
      return;
    }
    
    // Print and cleanup
    printWindow.onload = () => {
      printWindow.print();
      // Revoke URL after a delay to allow printing
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    
    toast.success(t('finance.exportSuccess', 'Export erfolgreich'));
  };

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
      setNewPerson({ name: '', email: '', phone: '', currency: 'CHF', type: 'household' as const });
      setShowAddPersonDialog(false);
    } catch (error: any) {
      toast.error(t('common.error') + ': ' + error.message);
    }
  };

  const handleDeletePerson = async () => {
    if (!deletePersonId) return;
    
    try {
      await deletePerson(deletePersonId);
      toast.success(t('finance.personDeleted'));
      setDeletePersonId(null);
      // Reload page to refresh data
      window.location.reload();
    } catch (error: any) {
      toast.error(t('common.error') + ': ' + error.message);
    }
  };

  const handleStatusChangeRequest = (entryId: string, entry: any, newStatus: string) => {
    // Only show confirmation when changing to "paid"
    if (newStatus === 'paid' && (entry.status || 'open') !== 'paid') {
      setStatusChangeConfirm({ entryId, entry, newStatus });
    } else {
      // Direct change for reopening
      confirmStatusChange(entryId, newStatus);
    }
  };

  const confirmStatusChange = async (entryId: string, newStatus: string) => {
    try {
      await updateFinanceEntry(entryId, { status: newStatus } as any);
      toast.success(newStatus === 'paid' ? 'Als bezahlt markiert ✓' : 'Status aktualisiert');
      setStatusChangeConfirm(null);
      // Force immediate refetch
      await refetch();
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
          // Determine entry type - check entry.type first, then fallback to passed type
          const isExpense = entry.type === 'ausgabe' || type === 'ausgabe';
          const isIncome = entry.type === 'einnahme' || type === 'einnahme';
          const entryType = entry.type || type || 'ausgabe'; // Default to ausgabe if unknown
          
          return (
            <div
              key={entry.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors gap-2"
            >
              <div className="flex items-start gap-3 flex-1">
                <div className={`mt-1 ${isIncome ? 'text-green-500' : 'text-red-500'}`}>
                  {isIncome ? (
                    <ArrowUp className="w-4 h-4" />
                  ) : (
                    <ArrowDown className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-medium text-foreground">{entry.category}</p>
                    {entry.paymentMethod && (
                      <Badge variant="outline" className="text-xs">{entry.paymentMethod}</Badge>
                    )}
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
                <p className={`font-semibold text-base sm:text-lg ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                  {isIncome ? '+' : '-'}
                  {formatAmount(entry.amount, entry.currency)}
                </p>
                {/* Status dropdown for all expenses */}
                {!isIncome && (
                  <Select
                    value={(entry as any).status || 'open'}
                    onValueChange={(value) => handleStatusChangeRequest(entry.id, entry, value)}
                  >
                    <SelectTrigger className={`h-8 text-xs w-[110px] ${
                      (entry as any).status === 'paid' 
                        ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' 
                        : 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400'
                    }`}>
                      <SelectValue>
                        <span className="flex items-center gap-2">
                          <span 
                            className="w-2 h-2 rounded-full shrink-0" 
                            style={{ backgroundColor: (entry as any).status === 'paid' ? '#22c55e' : '#f97316' }}
                          />
                          {(entry as any).status === 'paid' ? t('finance.paid') : t('finance.open')}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: '#f97316' }} />
                          {t('finance.open')}
                        </span>
                      </SelectItem>
                      <SelectItem value="paid">
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: '#22c55e' }} />
                          {t('finance.paid')}
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
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
                {t('finance.totalExpenses')} ({t('finance.paid')})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl sm:text-2xl font-bold text-red-600">
                {formatAmount(totalExpenses * 100)}
              </p>
              {openExpenses > 0 && (
                <p className="text-xs text-orange-600 mt-1">
                  + CHF {openExpenses.toFixed(2)} {t('finance.open')}
                </p>
              )}
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

        {/* Monthly Overview Chart */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-muted-foreground" />
                <CardTitle className="text-base sm:text-lg">{t('finance.monthlyOverview', 'Monatsübersicht')}</CardTitle>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportToCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  CSV
                </Button>
                <Button variant="outline" size="sm" onClick={exportToPDF}>
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowClearAllDialog(true)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  disabled={allEntries.length === 0}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('finance.clearAll', 'Alle löschen')}
                </Button>
              </div>
            </div>
            <CardDescription>{t('finance.last6Months', 'Einnahmen vs. Ausgaben der letzten 6 Monate')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                  <Tooltip 
                    formatter={(value: number) => [`CHF ${value.toFixed(2)}`, '']}
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Bar 
                    dataKey="income" 
                    name={t('finance.income')} 
                    fill="#22c55e" 
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={false}
                  />
                  <Bar 
                    dataKey="expenses" 
                    name={t('finance.expenses')} 
                    fill="#ef4444" 
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Charts Row - Pie Chart for Categories */}
        {categoryData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">
                {t('finance.categoryBreakdown', 'Ausgaben nach Kategorie')}
              </CardTitle>
              <CardDescription>
                {t('finance.totalExpenses')}: {formatAmount(totalExpenses * 100)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row items-center gap-6">
                <div className="h-[250px] w-full lg:w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        isAnimationActive={false}
                      >
                        {categoryData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [`CHF ${value.toFixed(2)}`, '']}
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full lg:w-1/2 space-y-2">
                  {categoryData.slice(0, 6).map((cat, index) => {
                    const percentage = totalExpenses > 0 ? (cat.value / totalExpenses * 100) : 0;
                    return (
                      <div key={cat.name} className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full shrink-0" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium truncate">{cat.name}</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                            <div 
                              className="h-1.5 rounded-full transition-all" 
                              style={{ 
                                width: `${percentage}%`,
                                backgroundColor: COLORS[index % COLORS.length]
                              }}
                            />
                          </div>
                        </div>
                        <span className="text-sm font-medium w-20 text-right">
                          CHF {cat.value.toFixed(0)}
                        </span>
                      </div>
                    );
                  })}
                  {categoryData.length > 6 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      +{categoryData.length - 6} weitere Kategorien
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
            {/* Quick Link to Full People Page */}
            <Card className="bg-muted/30 border-dashed">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-lg">{t('finance.peopleOverview', 'Personen & Schulden')}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t('finance.peopleDescription', 'Detaillierte Verwaltung von Personen und deren Rechnungen')}
                    </p>
                  </div>
                  <Button asChild>
                    <a href="/people">
                      <Users className="w-4 h-4 mr-2" />
                      {t('finance.openPeoplePage', 'Zur Personen-Seite')}
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between items-center">
              <h2 className="text-lg sm:text-xl font-semibold">{t('finance.quickOverview', 'Schnellübersicht')}</h2>
            </div>

            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {peopleLoading ? (
                <p className="text-center text-muted-foreground col-span-full py-8">{t('common.loading')}</p>
              ) : people.length > 0 ? (
                people.map((person: any) => (
                  <Card key={person.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-sm font-semibold text-primary">
                            {person.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        {person.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {person.email && (
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{person.email}</p>
                      )}
                      <div>
                        <p className="text-xs text-muted-foreground">{t('finance.openInvoices')}</p>
                        <p className="text-lg sm:text-xl font-bold text-red-600">
                          CHF {((person.totalOwed || 0) / 100).toFixed(2)}
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
                          onClick={() => setDeletePersonId(person.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="col-span-full">
                  <CardContent className="py-8 text-center">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground mb-4">
                      {t('finance.noPeople')}
                    </p>
                    <Button onClick={() => setShowAddPersonDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      {t('finance.addFirstPerson', 'Erste Person hinzufügen')}
                    </Button>
                  </CardContent>
                </Card>
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
          onDataChanged={refetchPeople}
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

      {/* Delete Person Confirmation Dialog */}
      <AlertDialog open={!!deletePersonId} onOpenChange={(open) => !open && setDeletePersonId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('finance.confirmDeletePersonTitle', 'Person löschen?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('finance.confirmDeletePersonDesc', 'Diese Person und alle zugehörigen Rechnungen werden dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Abbrechen')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePerson} className="bg-red-600 hover:bg-red-700">
              {t('common.delete', 'Löschen')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Change Confirmation Dialog */}
      <AlertDialog open={!!statusChangeConfirm} onOpenChange={(open) => !open && setStatusChangeConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              Ausgabe als bezahlt markieren?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <div className="bg-muted/50 rounded-lg p-3 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">
                    {statusChangeConfirm?.entry?.category || 'Ausgabe'}
                  </span>
                  <span className="text-sm font-bold text-red-600">
                    -{formatAmount(statusChangeConfirm?.entry?.amount || 0, statusChangeConfirm?.entry?.currency || 'CHF')}
                  </span>
                </div>
                {statusChangeConfirm?.entry?.notes && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {statusChangeConfirm.entry.notes}
                  </p>
                )}
              </div>
              <p className="text-sm">
                Diese Ausgabe wird als <span className="font-medium text-green-600">bezahlt</span> markiert.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => statusChangeConfirm && confirmStatusChange(statusChangeConfirm.entryId, statusChangeConfirm.newStatus)}
              className="bg-green-600 hover:bg-green-700"
            >
              Als bezahlt markieren
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear All Entries Confirmation Dialog */}
      <AlertDialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              {t('finance.clearAllTitle', 'Alle Einträge löschen?')}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                {t('finance.clearAllWarning', 'Diese Aktion kann nicht rückgängig gemacht werden.')}
              </p>
              <p className="font-medium text-foreground">
                {t('finance.clearAllCount', `Es werden ${allEntries.length} Einträge gelöscht.`)}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearing}>
              {t('common.cancel', 'Abbrechen')}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleClearAllEntries}
              className="bg-red-600 hover:bg-red-700"
              disabled={isClearing}
            >
              {isClearing ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  {t('common.deleting', 'Löschen...')}
                </>
              ) : (
                t('finance.clearAllConfirm', 'Ja, alle löschen')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
