import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  ShoppingCart,
  Bell,
  ChevronRight,
  Receipt
} from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import { useFinanceEntries, useReminders, useShoppingList } from '@/lib/firebaseHooks';

export default function MobileDashboard() {
  const { t } = useTranslation();
  const { data: financeEntries = [], isLoading: financeLoading } = useFinanceEntries();
  const { data: reminders = [], isLoading: remindersLoading } = useReminders({ status: 'offen' });
  const { data: shoppingItems = [], isLoading: shoppingLoading } = useShoppingList();

  // Calculate totals
  const { totalIncome, totalExpenses, balance } = useMemo(() => {
    const income = financeEntries
      .filter(e => e.type === 'einnahme')
      .reduce((sum, e) => sum + e.amount, 0) / 100;
    
    const expenses = financeEntries
      .filter(e => e.type === 'ausgabe' && (e as any).status === 'paid')
      .reduce((sum, e) => sum + e.amount, 0) / 100;

    return {
      totalIncome: income,
      totalExpenses: expenses,
      balance: income - expenses
    };
  }, [financeEntries]);

  const openReminders = reminders.filter(r => r.status === 'offen').length;
  const openShoppingItems = shoppingItems.filter(i => !i.bought).length;

  const formatAmount = (amount: number) => {
    return `CHF ${amount.toFixed(2)}`;
  };

  return (
    <MobileLayout title="Dashboard">
      {/* Balance Card */}
      <div className="mobile-card mb-4 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <p className="text-sm opacity-90">{t('finance.balance', 'Saldo')}</p>
        <p className={`text-3xl font-bold mt-1 ${balance >= 0 ? '' : 'text-red-200'}`}>
          {formatAmount(balance)}
        </p>
        <div className="flex gap-6 mt-4">
          <div>
            <p className="text-xs opacity-75">{t('finance.income', 'Einnahmen')}</p>
            <p className="text-lg font-semibold flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              {formatAmount(totalIncome)}
            </p>
          </div>
          <div>
            <p className="text-xs opacity-75">{t('finance.expenses', 'Ausgaben')}</p>
            <p className="text-lg font-semibold flex items-center gap-1">
              <TrendingDown className="w-4 h-4" />
              {formatAmount(totalExpenses)}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Link href="/reminders">
          <div className="mobile-card flex items-center gap-3 active:scale-98 transition-transform">
            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Bell className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{openReminders}</p>
              <p className="text-xs text-muted-foreground">{t('reminders.open', 'Offen')}</p>
            </div>
          </div>
        </Link>

        <Link href="/shopping">
          <div className="mobile-card flex items-center gap-3 active:scale-98 transition-transform">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{openShoppingItems}</p>
              <p className="text-xs text-muted-foreground">{t('shopping.items', 'Artikel')}</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
        {t('dashboard.quickActions', 'Schnellzugriff')}
      </h2>
      
      <div className="space-y-2">
        <Link href="/finance">
          <div className="mobile-card flex items-center justify-between active:scale-98 transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">{t('nav.finance', 'Finanzen')}</p>
                <p className="text-xs text-muted-foreground">
                  {financeEntries.length} {t('finance.entries', 'Einträge')}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </Link>

        <Link href="/bills">
          <div className="mobile-card flex items-center justify-between active:scale-98 transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">{t('nav.bills', 'Rechnungen')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('bills.manage', 'Verwalten')}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </Link>

        <Link href="/shopping">
          <div className="mobile-card flex items-center justify-between active:scale-98 transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">{t('nav.shopping', 'Einkaufsliste')}</p>
                <p className="text-xs text-muted-foreground">
                  {openShoppingItems} {t('shopping.itemsOpen', 'offen')}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </Link>
      </div>
    </MobileLayout>
  );
}

