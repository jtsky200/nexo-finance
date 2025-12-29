import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { RefreshCw } from 'lucide-react';
import { 
  ArrowUp, 
  ArrowDown, 
  Plus,
  X,
  BarChart3,
  TrendingUp,
  Repeat,
  Search,
  Filter,
  ChevronRight,
  Download
} from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import { useFinanceEntries, createFinanceEntry, updateFinanceEntry, deleteFinanceEntry } from '@/lib/firebaseHooks';
import ContextMenu from '@/components/ContextMenu';
import { Edit2, Copy, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { hapticSuccess, hapticError, hapticSelection } from '@/lib/hapticFeedback';
import { formatErrorForDisplay } from '@/lib/errorHandler';
import { exportFinanceToCSV, exportFinanceToPDF } from '@/lib/exportUtils';
import { formatDateLocal, formatDateGerman, parseDateGerman } from '@/lib/dateTimeUtils';

type TabType = 'all' | 'income' | 'expenses';

// Categories will be loaded from i18n
const getCategories = (t: any) => ({
  income: [
    t('finance.categories.income.salary'),
    t('finance.categories.income.freelance'),
    t('finance.categories.income.investment'),
    t('finance.categories.income.gift'),
    t('finance.categories.income.other'),
  ],
  expense: [
    t('finance.categories.expense.food'),
    t('finance.categories.expense.transport'),
    t('finance.categories.expense.housing'),
    t('finance.categories.expense.entertainment'),
    t('finance.categories.expense.health'),
    t('finance.categories.expense.clothing'),
    t('finance.categories.expense.education'),
    t('finance.categories.expense.bill'),
    t('finance.categories.expense.other'),
  ],
});

export default function MobileFinance() {
  const { t } = useTranslation();
  const { data: allEntries = [], isLoading, refetch } = useFinanceEntries();
  const categories = getCategories(t);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [entryType, setEntryType] = useState<'einnahme' | 'ausgabe'>('ausgabe');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | 'week' | 'month' | 'year'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Pull to refresh
  const { containerRef, isRefreshing, pullProgress, shouldShowIndicator } = usePullToRefresh({
    onRefresh: async () => {
      await refetch();
    },
    disabled: isLoading,
  });
  
  const [newEntry, setNewEntry] = useState({
    category: '',
    amount: '',
    date: formatDateLocal(new Date()), // Internal format: YYYY-MM-DD
    notes: '',
    paymentMethod: t('finance.paymentMethods.card'),
    isRecurring: false,
    recurrenceRule: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly'
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

  // Monthly data for chart (last 6 months)
  const monthlyData = useMemo(() => {
    const months: { [key: string]: { income: number; expenses: number } } = {};
    const now = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months[key] = { income: 0, expenses: 0 };
    }

    // Aggregate entries by month
    allEntries.forEach(entry => {
      const date = (entry.date && typeof entry.date === 'object' && 'toDate' in entry.date) 
        ? (entry.date as any).toDate() 
        : new Date(entry.date as string | Date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (months[key]) {
        const amount = entry.amount / 100;
        if (entry.type === 'einnahme') {
          months[key].income += amount;
        } else if (entry.type === 'ausgabe' && (entry as any).status === 'paid') {
          months[key].expenses += amount;
        }
      }
    });

    return Object.entries(months).map(([key, values]) => {
      const [year, month] = key.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return {
        month: date.toLocaleDateString('de-CH', { month: 'short', year: '2-digit' }),
        income: Math.round(values.income * 100) / 100,
        expenses: Math.round(values.expenses * 100) / 100,
      };
    });
  }, [allEntries]);

  // Category breakdown for pie chart
  const categoryData = useMemo(() => {
    const categoryMap: { [key: string]: number } = {};
    
    expenseEntries
      .filter(e => (e as any).status === 'paid')
      .forEach(entry => {
        const amount = entry.amount / 100;
        categoryMap[entry.category] = (categoryMap[entry.category] || 0) + amount;
      });

    return Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 categories
  }, [expenseEntries]);

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];

  // Get unique categories for filter
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    allEntries.forEach(e => {
      if (e.category) cats.add(e.category);
    });
    return Array.from(cats).sort();
  }, [allEntries]);

  // Filter and search entries
  const displayedEntries = useMemo(() => {
    let filtered = allEntries;

    // Tab filter
    switch (activeTab) {
      case 'income':
        filtered = incomeEntries;
        break;
      case 'expenses':
        filtered = expenseEntries;
        break;
      default:
        filtered = allEntries;
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(e => e.category === selectedCategory);
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      
      switch (dateRange) {
        case 'week':
          cutoff.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoff.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          cutoff.setFullYear(now.getFullYear() - 1);
          break;
      }

      filtered = filtered.filter(e => {
        const entryDate = (e.date && typeof e.date === 'object' && 'toDate' in e.date)
          ? (e.date as any).toDate()
          : new Date(e.date as string | Date);
        return entryDate >= cutoff;
      });
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        e.category?.toLowerCase().includes(query) ||
        e.notes?.toLowerCase().includes(query) ||
        e.paymentMethod?.toLowerCase().includes(query)
      );
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => {
      const dateA = (a.date && typeof a.date === 'object' && 'toDate' in a.date)
        ? (a.date as any).toDate()
        : new Date(a.date as string | Date);
      const dateB = (b.date && typeof b.date === 'object' && 'toDate' in b.date)
        ? (b.date as any).toDate()
        : new Date(b.date as string | Date);
      return dateB.getTime() - dateA.getTime();
    });
  }, [activeTab, allEntries, incomeEntries, expenseEntries, selectedCategory, dateRange, searchQuery]);

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
      toast.success(newStatus === 'paid' ? t('finance.markedAsPaid') : t('finance.statusChanged'));
      await refetch();
    } catch (error) {
      toast.error(t('finance.error') + (error as any).message);
    }
  };

  const handleAddEntry = async () => {
    if (!newEntry.category || !newEntry.amount) {
      toast.error(t('finance.categoryAndAmountRequired'));
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
        isRecurring: newEntry.isRecurring,
        recurrenceRule: newEntry.isRecurring ? newEntry.recurrenceRule : undefined,
      } as any);

      toast.success(entryType === 'einnahme' ? 'Einnahme hinzugefügt' : 'Ausgabe hinzugefügt');
      hapticSuccess();
      setShowAddDialog(false);
      setNewEntry({
        category: '',
        amount: '',
        date: formatDateLocal(new Date()),
        notes: '',
        paymentMethod: t('finance.paymentMethods.card'),
        isRecurring: false,
        recurrenceRule: 'monthly'
      });
      await refetch();
    } catch (error) {
      toast.error(formatErrorForDisplay(error));
      hapticError();
    }
  };

  const openAddDialog = (type: 'einnahme' | 'ausgabe') => {
    setEntryType(type);
      setNewEntry({
        category: '',
        amount: '',
        date: formatDateLocal(new Date()),
        notes: '',
        paymentMethod: t('finance.paymentMethods.card'),
        isRecurring: false,
        recurrenceRule: 'monthly'
      });
      setShowAddDialog(true);
    };

  return (
    <MobileLayout title={t('nav.finance', 'Finanzen')} showSidebar={true}>
      {/* Pull to Refresh Indicator */}
      {shouldShowIndicator && (
        <div 
          className="fixed top-16 left-0 right-0 flex items-center justify-center z-40 transition-all duration-200 pointer-events-none"
          style={{
            transform: `translateY(${Math.max(-60, pullProgress * 60 - 60)}px)`,
            opacity: Math.min(pullProgress * 1.5, 1),
          }}
        >
          <div className="bg-background border border-border shadow-lg rounded-lg px-4 py-2 flex items-center gap-2">
            <RefreshCw 
              className={`w-5 h-5 text-primary transition-transform ${isRefreshing ? 'animate-spin' : ''}`}
              style={{
                transform: `rotate(${pullProgress * 180}deg)`,
              }}
            />
            <span className="text-sm font-medium">
              {isRefreshing ? t('finance.refreshing') : pullProgress >= 1 ? t('finance.releaseToRefresh') : t('finance.pullToRefresh')}
            </span>
          </div>
        </div>
      )}

      <div ref={containerRef} className="h-full overflow-y-auto">
      {/* Summary Cards - Clean design */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="mobile-card text-center py-4">
          <p className="text-xs text-muted-foreground mb-1.5">{t('finance.income', 'Einnahmen')}</p>
          <p className="text-lg font-semibold status-success">
            {totalIncome.toFixed(0)}
          </p>
        </div>
        <div className="mobile-card text-center py-4">
          <p className="text-xs text-muted-foreground mb-1.5">{t('finance.expenses', 'Ausgaben')}</p>
          <p className="text-lg font-semibold status-error">
            {totalExpenses.toFixed(0)}
          </p>
        </div>
        <div className="mobile-card text-center py-4">
          <p className="text-xs text-muted-foreground mb-1.5">{t('finance.balance', 'Saldo')}</p>
          <p className={`text-lg font-semibold ${balance >= 0 ? 'status-success' : 'status-error'}`}>
            {balance.toFixed(0)}
          </p>
        </div>
      </div>

      {/* Quick Add Buttons - Clean style */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => {
            hapticSelection();
            openAddDialog('einnahme');
          }}
          className="flex-1 mobile-card flex items-center justify-center gap-2 py-4 border-l-2 border-l-green-600 active:opacity-80 transition-opacity min-h-[56px]"
        >
          <ArrowUp className="w-5 h-5 status-success" />
          <span className="font-medium text-sm">{t('finance.addIncome')}</span>
        </button>
        <button
          onClick={() => {
            hapticSelection();
            openAddDialog('ausgabe');
          }}
          className="flex-1 mobile-card flex items-center justify-center gap-2 py-4 border-l-2 border-l-red-600 active:opacity-80 transition-opacity min-h-[56px]"
        >
          <ArrowDown className="w-5 h-5 status-error" />
          <span className="font-medium text-sm">{t('finance.addExpense')}</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-4 space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('finance.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 mobile-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
              aria-label={t('finance.clearSearch')}
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => {
            hapticSelection();
            setShowFilters(!showFilters);
          }}
          className="w-full mobile-card flex items-center justify-between py-3 active:opacity-80 transition-opacity"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium text-sm">Filter</span>
            {(selectedCategory !== 'all' || dateRange !== 'all') && (
              <span className="w-2 h-2 rounded-full bg-primary"></span>
            )}
          </div>
          <ChevronRight 
            className={`w-5 h-5 text-muted-foreground transition-transform ${showFilters ? 'rotate-90' : ''}`}
          />
        </button>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mobile-card p-4 space-y-4 animate-in slide-in-from-top-2">
            {/* Category Filter */}
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">Kategorie</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="mobile-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Kategorien</SelectItem>
                  {availableCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Filter */}
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">Zeitraum</Label>
              <Select value={dateRange} onValueChange={(v: 'all' | 'week' | 'month' | 'year') => setDateRange(v)}>
                <SelectTrigger className="mobile-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Zeit</SelectItem>
                  <SelectItem value="week">Letzte 7 Tage</SelectItem>
                  <SelectItem value="month">Letzter Monat</SelectItem>
                  <SelectItem value="year">Letztes Jahr</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            {(selectedCategory !== 'all' || dateRange !== 'all') && (
              <button
                onClick={() => {
                  hapticSelection();
                  setSelectedCategory('all');
                  setDateRange('all');
                }}
                className="w-full py-2 px-4 rounded-lg bg-muted text-foreground font-medium active:opacity-80 transition-opacity"
              >
                Filter zurücksetzen
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tab Buttons - Clean pills */}
      <div className="flex gap-3 mb-4 overflow-x-auto hide-scrollbar">
            {[
              { key: 'all', label: t('finance.all', 'Alle') },
              { key: 'income', label: t('finance.income', 'Einnahmen') },
              { key: 'expenses', label: t('finance.expenses', 'Ausgaben') },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  hapticSelection();
                  setActiveTab(tab.key as TabType);
                }}
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

      {/* Monthly Overview Chart */}
      {monthlyData.length > 0 && (
        <div className="mobile-card mb-4 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold text-base">{t('finance.monthlyOverview', 'Monatsübersicht')}</h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  hapticSelection();
                  exportFinanceToCSV(displayedEntries);
                  hapticSuccess();
                }}
                className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                aria-label="Als CSV exportieren"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  hapticSelection();
                  exportFinanceToPDF(displayedEntries, { income: totalIncome, expenses: totalExpenses, balance });
                  hapticSuccess();
                }}
                className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                aria-label="Als PDF exportieren"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="month" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip 
                  formatter={(value: number) => [`CHF ${value.toFixed(2)}`, '']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    fontSize: '12px'
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  iconType="circle"
                />
                <Bar 
                  dataKey="income" 
                  name={t('finance.income', 'Einnahmen')} 
                  fill="#22c55e" 
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={true}
                />
                <Bar 
                  dataKey="expenses" 
                  name={t('finance.expenses', 'Ausgaben')} 
                  fill="#ef4444" 
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={true}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Category Breakdown Chart */}
      {categoryData.length > 0 && activeTab === 'expenses' && (
        <div className="mobile-card mb-4 p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold text-base">{t('finance.categoryBreakdown', 'Ausgaben nach Kategorie')}</h3>
          </div>
          <div className="flex flex-col gap-4">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    isAnimationActive={true}
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`CHF ${value.toFixed(2)}`, '']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
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
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: COLORS[index % COLORS.length]
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium text-foreground min-w-[60px] text-right">
                          CHF {cat.value.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
        <div className="space-y-3">
          {displayedEntries.map((entry) => {
            const isIncome = entry.type === 'einnahme';
            const isPaid = (entry as any).status === 'paid';
            
            // Build context menu actions
            const contextMenuActions = [
              {
                id: 'duplicate',
                label: t('common.duplicate', 'Duplizieren'),
                icon: <Copy className="w-4 h-4" />,
                onClick: async () => {
                  hapticSelection();
                  try {
                    await createFinanceEntry({
                      ...entry,
                      date: new Date(),
                    } as any);
                    toast.success(t('common.duplicated', 'Dupliziert'));
                    hapticSuccess();
                    await refetch();
                  } catch (error) {
                    toast.error(formatErrorForDisplay(error));
                    hapticError();
                  }
                },
              },
              {
                id: 'delete',
                label: t('common.delete', 'Löschen'),
                icon: <Trash2 className="w-4 h-4" />,
                onClick: async () => {
                  hapticSelection();
                  if (confirm(t('common.confirmDelete', 'Möchten Sie wirklich löschen?'))) {
                    try {
                      await deleteFinanceEntry(entry.id);
                      toast.success(t('common.deleted', 'Gelöscht'));
                      hapticSuccess();
                      await refetch();
                    } catch (error) {
                      toast.error(formatErrorForDisplay(error));
                      hapticError();
                    }
                  }
                },
                variant: 'destructive' as const,
              },
            ];
            
            return (
              <ContextMenu key={entry.id} actions={contextMenuActions}>
                <div
                  className={`mobile-card flex items-center justify-between py-3 ${
                    isIncome ? 'border-l-2 border-l-green-600' : 'border-l-2 border-l-red-600'
                  }`}
                >
                <div className="flex items-center gap-4">
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
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{entry.category}</p>
                      {(entry as any).isRecurring && (
                        <Repeat className="w-3 h-3 text-muted-foreground" aria-label="Wiederkehrend" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{formatDate(entry.date)}</p>
                    {(entry as any).isRecurring && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Wiederholt: {((entry as any).recurrenceRule === 'daily' ? 'Täglich' : 
                                     (entry as any).recurrenceRule === 'weekly' ? 'Wöchentlich' :
                                     (entry as any).recurrenceRule === 'monthly' ? 'Monatlich' :
                                     (entry as any).recurrenceRule === 'yearly' ? 'Jährlich' : '')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${isIncome ? 'status-success' : 'status-error'}`}>
                    {isIncome ? '+' : '-'}{formatAmount(entry.amount)}
                  </p>
                  {!isIncome && (
                    <button
                      onClick={() => {
                        hapticSelection();
                        handleStatusChange(entry.id, isPaid ? 'open' : 'paid');
                      }}
                      className={`text-xs px-2 py-0.5 rounded mt-1 ${
                        isPaid
                          ? 'bg-status-success status-success'
                          : 'bg-status-warning status-warning'
                      }`}
                      aria-label={`Status für ${entry.category} ändern`}
                      aria-pressed={isPaid}
                    >
                      {isPaid ? t('finance.paid', 'Bezahlt') : t('finance.open', 'Offen')}
                    </button>
                  )}
                </div>
              </div>
              </ContextMenu>
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
                  type="text"
                  placeholder="DD.MM.YYYY"
                  value={formatDateGerman(newEntry.date)}
                  onChange={(e) => {
                    const parsed = parseDateGerman(e.target.value);
                    if (parsed) {
                      setNewEntry({ ...newEntry, date: parsed });
                    }
                  }}
                  onBlur={(e) => {
                    const parsed = parseDateGerman(e.target.value);
                    if (!parsed && newEntry.date) {
                      // If invalid, keep current date
                      e.target.value = formatDateGerman(newEntry.date);
                    }
                  }}
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
                    <SelectItem value={t('finance.paymentMethods.card')}>{t('finance.paymentMethods.card')}</SelectItem>
                    <SelectItem value={t('finance.paymentMethods.cash')}>{t('finance.paymentMethods.cash')}</SelectItem>
                    <SelectItem value={t('finance.paymentMethods.transfer')}>{t('finance.paymentMethods.transfer')}</SelectItem>
                    <SelectItem value={t('finance.paymentMethods.twint')}>{t('finance.paymentMethods.twint')}</SelectItem>
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

              {/* Recurring Entry Toggle */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Repeat className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <Label className="text-sm font-medium">Wiederkehrend</Label>
                    <p className="text-xs text-muted-foreground">Automatisch wiederholen</p>
                  </div>
                </div>
                <Switch
                  checked={newEntry.isRecurring}
                  onCheckedChange={(checked) => setNewEntry({ ...newEntry, isRecurring: checked })}
                />
              </div>

              {/* Recurrence Rule Selection */}
              {newEntry.isRecurring && (
                <div>
                  <Label className="text-sm text-muted-foreground">Wiederholung</Label>
                  <Select
                    value={newEntry.recurrenceRule}
                    onValueChange={(value: 'daily' | 'weekly' | 'monthly' | 'yearly') => 
                      setNewEntry({ ...newEntry, recurrenceRule: value })
                    }
                  >
                    <SelectTrigger className="mobile-input mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Täglich</SelectItem>
                      <SelectItem value="weekly">Wöchentlich</SelectItem>
                      <SelectItem value="monthly">Monatlich</SelectItem>
                      <SelectItem value="yearly">Jährlich</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button
                onClick={handleAddEntry}
                className={`w-auto mx-auto mobile-btn mt-4 ${
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
          onClick={() => {
            hapticSelection();
            openAddDialog('ausgabe');
          }}
          className="fixed right-4 bottom-20 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:opacity-80 transition-opacity safe-bottom"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
      </div>
    </MobileLayout>
  );
}
