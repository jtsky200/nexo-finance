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
  FileText
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
    <MobileLayout title="Übersicht">
      {/* Balance Card - Clean, no gradient */}
      <div className="mobile-card mb-4 bg-primary text-primary-foreground">
        <p className="text-sm opacity-70">{t('finance.balance', 'Saldo')}</p>
        <p className={`text-3xl font-semibold mt-1`}>
          {formatAmount(balance)}
        </p>
        <div className="flex gap-8 mt-4 pt-4 border-t border-primary-foreground/20">
          <div>
            <p className="text-xs opacity-60">{t('finance.income', 'Einnahmen')}</p>
            <p className="text-lg font-medium flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-4 h-4 opacity-70" />
              {formatAmount(totalIncome)}
            </p>
          </div>
          <div>
            <p className="text-xs opacity-60">{t('finance.expenses', 'Ausgaben')}</p>
            <p className="text-lg font-medium flex items-center gap-1 mt-0.5">
              <TrendingDown className="w-4 h-4 opacity-70" />
              {formatAmount(totalExpenses)}
            </p>
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
      <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
        {t('dashboard.quickActions', 'Schnellzugriff')}
      </p>
      
      <div className="space-y-2">
        <Link href="/finance">
          <div className="mobile-card flex items-center justify-between active:opacity-80 transition-opacity">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Wallet className="w-5 h-5 text-foreground" />
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
          <div className="mobile-card flex items-center justify-between active:opacity-80 transition-opacity">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <FileText className="w-5 h-5 text-foreground" />
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
          <div className="mobile-card flex items-center justify-between active:opacity-80 transition-opacity">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-foreground" />
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
