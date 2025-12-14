import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import { 
  ArrowUp, 
  ArrowDown, 
  Wallet,
  ShoppingCart,
  Bell,
  ChevronRight,
  FileText,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import { useFinanceEntries, useReminders, useShoppingList } from '@/lib/firebaseHooks';
import { Skeleton } from '@/components/ui/skeleton';

export default function MobileDashboard() {
  const { t } = useTranslation();
  const { data: financeEntries = [], isLoading: financeLoading } = useFinanceEntries();
  const { data: reminders = [], isLoading: remindersLoading } = useReminders({ status: 'offen' });
  const { data: shoppingItems = [], isLoading: shoppingLoading } = useShoppingList();

  // Calculate totals
  const { totalIncome, totalExpenses, balance, monthlyTrend } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Current month totals
    const currentMonthIncome = financeEntries
      .filter(e => {
        const date = e.date?.toDate ? e.date.toDate() : new Date(e.date);
        return e.type === 'einnahme' && 
               date.getMonth() === currentMonth && 
               date.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + e.amount, 0) / 100;

    const currentMonthExpenses = financeEntries
      .filter(e => {
        const date = e.date?.toDate ? e.date.toDate() : new Date(e.date);
        return e.type === 'ausgabe' && 
               (e as any).status === 'paid' &&
               date.getMonth() === currentMonth && 
               date.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + e.amount, 0) / 100;

    // Last month totals
    const lastMonthIncome = financeEntries
      .filter(e => {
        const date = e.date?.toDate ? e.date.toDate() : new Date(e.date);
        return e.type === 'einnahme' && 
               date.getMonth() === lastMonth && 
               date.getFullYear() === lastMonthYear;
      })
      .reduce((sum, e) => sum + e.amount, 0) / 100;

    const lastMonthExpenses = financeEntries
      .filter(e => {
        const date = e.date?.toDate ? e.date.toDate() : new Date(e.date);
        return e.type === 'ausgabe' && 
               (e as any).status === 'paid' &&
               date.getMonth() === lastMonth && 
               date.getFullYear() === lastMonthYear;
      })
      .reduce((sum, e) => sum + e.amount, 0) / 100;

    // All time totals
    const income = financeEntries
      .filter(e => e.type === 'einnahme')
      .reduce((sum, e) => sum + e.amount, 0) / 100;
    
    const expenses = financeEntries
      .filter(e => e.type === 'ausgabe' && (e as any).status === 'paid')
      .reduce((sum, e) => sum + e.amount, 0) / 100;

    // Calculate trends
    const incomeTrend = lastMonthIncome > 0 
      ? ((currentMonthIncome - lastMonthIncome) / lastMonthIncome) * 100 
      : 0;
    const expenseTrend = lastMonthExpenses > 0 
      ? ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 
      : 0;

    return {
      totalIncome: income,
      totalExpenses: expenses,
      balance: income - expenses,
      monthlyTrend: {
        income: incomeTrend,
        expenses: expenseTrend,
        currentMonthIncome,
        currentMonthExpenses,
      }
    };
  }, [financeEntries]);

  const openReminders = reminders.filter(r => r.status === 'offen').length;
  const openShoppingItems = shoppingItems.filter(i => !i.bought).length;

  const formatAmount = (amount: number) => {
    return `CHF ${amount.toFixed(2)}`;
  };

  const isLoading = financeLoading || remindersLoading || shoppingLoading;

  return (
    <MobileLayout title="Übersicht" showSidebar={true}>
      {isLoading ? (
        <>
          {/* Loading Skeleton for Balance Card */}
          <div className="mobile-card mb-4 bg-primary text-primary-foreground">
            <Skeleton className="h-4 w-20 mb-2 bg-primary-foreground/20" />
            <Skeleton className="h-9 w-32 mb-4 bg-primary-foreground/20" />
            <div className="flex gap-6 mt-4 pt-4 border-t border-primary-foreground/20">
              <div className="flex-1">
                <Skeleton className="h-3 w-16 mb-1 bg-primary-foreground/20" />
                <Skeleton className="h-6 w-24 bg-primary-foreground/20" />
              </div>
              <div className="flex-1">
                <Skeleton className="h-3 w-16 mb-1 bg-primary-foreground/20" />
                <Skeleton className="h-6 w-24 bg-primary-foreground/20" />
              </div>
            </div>
          </div>

          {/* Loading Skeleton for Quick Stats */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>

          {/* Loading Skeleton for Quick Actions */}
          <Skeleton className="h-4 w-24 mb-4" />
          <div className="flex flex-col gap-6">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        </>
      ) : (
        <>
          {/* Balance Card - Clean, no gradient */}
          <div className="mobile-card mb-4 bg-primary text-primary-foreground">
            <p className="text-sm opacity-70 mb-2">{t('finance.balance', 'Saldo')}</p>
            <p className={`text-3xl font-semibold mb-4`}>
              {formatAmount(balance)}
            </p>
        <div className="flex gap-6 mt-4 pt-4 border-t border-primary-foreground/20">
          <div className="flex-1">
            <p className="text-xs opacity-60 mb-1">{t('finance.income', 'Einnahmen')}</p>
            <p className="text-lg font-medium flex items-center gap-1.5">
              <ArrowUp className="w-5 h-5 opacity-70" />
              {formatAmount(totalIncome)}
            </p>
            {monthlyTrend.income !== 0 && (
              <p className={`text-xs mt-1 flex items-center gap-1 ${
                monthlyTrend.income > 0 ? 'text-green-300' : 'text-red-300'
              }`}>
                {monthlyTrend.income > 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {Math.abs(monthlyTrend.income).toFixed(1)}% vs. Vormonat
              </p>
            )}
          </div>
          <div className="flex-1">
            <p className="text-xs opacity-60 mb-1">{t('finance.expenses', 'Ausgaben')}</p>
            <p className="text-lg font-medium flex items-center gap-1.5">
              <ArrowDown className="w-5 h-5 opacity-70" />
              {formatAmount(totalExpenses)}
            </p>
            {monthlyTrend.expenses !== 0 && (
              <p className={`text-xs mt-1 flex items-center gap-1 ${
                monthlyTrend.expenses < 0 ? 'text-green-300' : 'text-red-300'
              }`}>
                {monthlyTrend.expenses < 0 ? (
                  <TrendingDown className="w-3 h-3" />
                ) : (
                  <TrendingUp className="w-3 h-3" />
                )}
                {Math.abs(monthlyTrend.expenses).toFixed(1)}% vs. Vormonat
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link href="/reminders">
          <div className="mobile-card flex items-center gap-3 active:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-lg bg-status-warning flex items-center justify-center">
              <Bell className="w-5 h-5 status-warning" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{openReminders}</p>
              <p className="text-xs text-muted-foreground">{t('reminders.open', 'Offen')}</p>
            </div>
          </div>
        </Link>

        <Link href="/shopping">
          <div className="mobile-card flex items-center gap-3 active:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-lg bg-status-success flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 status-success" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{openShoppingItems}</p>
              <p className="text-xs text-muted-foreground">{t('shopping.items', 'Artikel')}</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <p className="text-xs font-medium text-muted-foreground mb-4 uppercase tracking-wider">
        {t('dashboard.quickActions', 'Schnellzugriff')}
      </p>
      
      <div className="flex flex-col gap-6">
        <Link href="/finance" className="block">
          <div className="mobile-card flex items-center justify-between active:opacity-80 transition-opacity py-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <Wallet className="w-6 h-6 text-foreground" />
              </div>
              <div>
                <p className="font-medium text-base">{t('nav.finance', 'Finanzen')}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {financeEntries.length} {t('finance.entries', 'Einträge')}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 ml-2" />
          </div>
        </Link>

        <Link href="/bills" className="block">
          <div className="mobile-card flex items-center justify-between active:opacity-80 transition-opacity py-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-foreground" />
              </div>
              <div>
                <p className="font-medium text-base">{t('nav.bills', 'Rechnungen')}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('bills.manage', 'Verwalten')}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 ml-2" />
          </div>
        </Link>

        <Link href="/shopping" className="block">
          <div className="mobile-card flex items-center justify-between active:opacity-80 transition-opacity py-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <ShoppingCart className="w-6 h-6 text-foreground" />
              </div>
              <div>
                <p className="font-medium text-base">{t('nav.shopping', 'Einkaufsliste')}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {openShoppingItems} {t('shopping.itemsOpen', 'offen')}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 ml-2" />
          </div>
        </Link>
      </div>
        </>
      )}
    </MobileLayout>
  );
}
