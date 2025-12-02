import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Receipt,
  Plus,
  Check,
  Clock,
  AlertCircle
} from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import { useReminders, updateReminder } from '@/lib/firebaseHooks';
import { toast } from 'sonner';

export default function MobileBills() {
  const { t } = useTranslation();
  const { data: allReminders = [], isLoading, refetch } = useReminders({});

  // Filter only payment reminders
  const bills = useMemo(() => 
    allReminders.filter(r => r.type === 'zahlung'),
    [allReminders]
  );

  const openBills = bills.filter(b => b.status === 'offen');
  const paidBills = bills.filter(b => b.status === 'erledigt');

  const totalOpen = openBills.reduce((sum, b) => sum + (b.amount || 0), 0) / 100;

  const formatAmount = (amount: number) => `CHF ${(amount / 100).toFixed(2)}`;

  const formatDate = (date: any) => {
    try {
      const d = date?.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit' });
    } catch {
      return 'N/A';
    }
  };

  const handleMarkAsPaid = async (billId: string) => {
    try {
      await updateReminder(billId, { status: 'erledigt' as any });
      toast.success('Als bezahlt markiert ✓');
      await refetch();
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    }
  };

  const isOverdue = (date: any) => {
    try {
      const d = date?.toDate ? date.toDate() : new Date(date);
      return d < new Date();
    } catch {
      return false;
    }
  };

  return (
    <MobileLayout title={t('nav.bills', 'Rechnungen')}>
      {/* Summary */}
      <div className="mobile-card mb-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Receipt className="w-6 h-6" />
          <p className="text-sm opacity-90">{t('bills.openAmount', 'Offene Rechnungen')}</p>
        </div>
        <p className="text-3xl font-bold">CHF {totalOpen.toFixed(2)}</p>
        <p className="text-sm opacity-75 mt-1">
          {openBills.length} {t('bills.bills', 'Rechnungen')}
        </p>
      </div>

      {/* Open Bills */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          {t('common.loading', 'Laden...')}
        </div>
      ) : openBills.length === 0 ? (
        <div className="mobile-card text-center py-8">
          <Check className="w-12 h-12 mx-auto text-green-500 mb-2" />
          <p className="text-muted-foreground">{t('bills.allPaid', 'Alle Rechnungen bezahlt!')}</p>
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          {openBills.map((bill) => {
            const overdue = isOverdue(bill.dueDate);
            
            return (
              <div
                key={bill.id}
                className={`mobile-card flex items-center justify-between ${
                  overdue ? 'border-red-300 dark:border-red-800' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    overdue 
                      ? 'bg-red-100 dark:bg-red-900/30' 
                      : 'bg-orange-100 dark:bg-orange-900/30'
                  }`}>
                    {overdue ? (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-orange-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{bill.title}</p>
                    <p className={`text-xs ${overdue ? 'text-red-600' : 'text-muted-foreground'}`}>
                      {overdue ? 'Überfällig • ' : ''}{formatDate(bill.dueDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-red-600">
                    {formatAmount(bill.amount || 0)}
                  </p>
                  <button
                    onClick={() => handleMarkAsPaid(bill.id)}
                    className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 active:scale-95 transition-transform"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Paid Bills */}
      {paidBills.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
            {t('bills.paid', 'Bezahlt')} ({paidBills.length})
          </h3>
          <div className="space-y-2 opacity-60">
            {paidBills.slice(0, 5).map((bill) => (
              <div
                key={bill.id}
                className="mobile-card flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="font-medium line-through">{bill.title}</p>
                </div>
                <p className="text-muted-foreground">
                  {formatAmount(bill.amount || 0)}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* FAB */}
      <button className="fixed right-4 bottom-20 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition-transform safe-bottom">
        <Plus className="w-6 h-6" />
      </button>
    </MobileLayout>
  );
}

