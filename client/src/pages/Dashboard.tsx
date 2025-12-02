import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Plus, TrendingUp, TrendingDown, FileText } from 'lucide-react';
import { useReminders, useFinanceEntries, getTaxProfileByYear } from '@/lib/firebaseHooks';
import AddReminderDialog from '@/components/AddReminderDialog';
import AddFinanceEntryDialog from '@/components/AddFinanceEntryDialog';
import { useLocation } from 'wouter';
import { useEffect } from 'react';

export default function Dashboard() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [financeDialogOpen, setFinanceDialogOpen] = useState(false);
  const [taxProfile, setTaxProfile] = useState<any>(null);

  // Fetch upcoming reminders
  const now = useMemo(() => new Date(), []);
  const { data: reminders = [], isLoading: remindersLoading } = useReminders({
    startDate: now,
    status: 'offen',
  });

  // Fetch current month finance data
  const startOfMonth = useMemo(() => {
    const date = new Date();
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const endOfMonth = useMemo(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    date.setDate(0);
    date.setHours(23, 59, 59, 999);
    return date;
  }, []);

  const { data: financeEntries = [], isLoading: financeLoading } = useFinanceEntries({
    startDate: startOfMonth,
    endDate: endOfMonth,
  });

  // Fetch current year tax profile
  const currentYear = new Date().getFullYear();
  
  useEffect(() => {
    const fetchTaxProfile = async () => {
      const profile = await getTaxProfileByYear(currentYear);
      setTaxProfile(profile);
    };
    fetchTaxProfile();
  }, [currentYear]);

  // Calculate totals
  const totalIncome = financeEntries
    .filter(e => e.type === 'einnahme')
    .reduce((sum, e) => sum + e.amount, 0) / 100;

  const totalExpenses = financeEntries
    .filter(e => e.type === 'ausgabe')
    .reduce((sum, e) => sum + e.amount, 0) / 100;

  const balance = totalIncome - totalExpenses;

  // Get next 3 upcoming reminders
  const upcomingReminders = reminders
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  const formatDate = (date: Date | any) => {
    if (!date) return 'N/A';
    try {
      const d = date?.toDate ? date.toDate() : new Date(date);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleDateString('de-CH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  const formatAmount = (amount: number, currency: string = 'CHF') => {
    return `${currency} ${amount.toFixed(2)}`;
  };

  return (
    <Layout title={t('dashboard.title')}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Upcoming Reminders Widget */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                <CardTitle>{t('dashboard.upcomingReminders')}</CardTitle>
              </div>
              <Button size="sm" variant="outline" onClick={() => setReminderDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                {t('dashboard.addReminder')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {remindersLoading ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                {t('common.loading')}
              </div>
            ) : upcomingReminders.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                {t('dashboard.noReminders')}
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingReminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => setLocation('/reminders')}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{reminder.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(reminder.dueDate)}
                      </p>
                    </div>
                    {reminder.amount && (
                      <div className="text-right">
                        <p className="font-semibold text-foreground">
                          {formatAmount(reminder.amount / 100, reminder.currency || 'CHF')}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tax Status Widget */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <CardTitle>{t('dashboard.taxStatus')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t('taxes.year')} {currentYear}
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {taxProfile ? t(`taxes.status.${taxProfile.status}`) : t('taxes.status.unvollständig')}
                </p>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full"
                onClick={() => setLocation('/taxes')}
              >
                {t('dashboard.viewTaxProfile')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Finance Overview Widget */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>{t('dashboard.financeOverview')}</CardTitle>
            <CardDescription>
              {new Date().toLocaleDateString('de-CH', { month: 'long', year: 'numeric' })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {financeLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('common.loading')}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Total Income */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span>{t('finance.totalIncome')}</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {formatAmount(totalIncome)}
                    </p>
                  </div>

                  {/* Total Expenses */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingDown className="w-4 h-4 text-red-500" />
                      <span>{t('finance.totalExpenses')}</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {formatAmount(totalExpenses)}
                    </p>
                  </div>

                  {/* Balance */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{t('finance.balance')}</span>
                    </div>
                    <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatAmount(balance)}
                    </p>
                  </div>
                </div>
                <div className="mt-6">
                  <Button size="sm" variant="outline" onClick={() => setFinanceDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t('dashboard.addEntry')}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions Widget */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>{t('dashboard.quickActions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2"
                onClick={() => setReminderDialogOpen(true)}
              >
                <Plus className="w-5 h-5" />
                <span className="text-sm">{t('reminders.add')}</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2"
                onClick={() => setFinanceDialogOpen(true)}
              >
                <Plus className="w-5 h-5" />
                <span className="text-sm">{t('finance.add')}</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2"
                onClick={() => setLocation('/taxes')}
              >
                <FileText className="w-5 h-5" />
                <span className="text-sm">{t('taxes.title')}</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex flex-col gap-2"
                onClick={() => setLocation('/reminders')}
              >
                <Bell className="w-5 h-5" />
                <span className="text-sm">{t('reminders.title')}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <AddReminderDialog open={reminderDialogOpen} onOpenChange={setReminderDialogOpen} />
      <AddFinanceEntryDialog open={financeDialogOpen} onOpenChange={setFinanceDialogOpen} />
    </Layout>
  );
}
