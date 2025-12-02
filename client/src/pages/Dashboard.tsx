import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, Plus, TrendingUp, TrendingDown, FileText, Calendar, 
  Banknote, Clock, AlertTriangle, CheckCircle2, ClipboardList,
  CalendarClock, CheckSquare
} from 'lucide-react';
import { useReminders, useFinanceEntries, getTaxProfileByYear } from '@/lib/firebaseHooks';
import AddReminderDialog from '@/components/AddReminderDialog';
import AddFinanceEntryDialog from '@/components/AddFinanceEntryDialog';
import { useLocation } from 'wouter';

export default function Dashboard() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [financeDialogOpen, setFinanceDialogOpen] = useState(false);
  const [taxProfile, setTaxProfile] = useState<any>(null);

  // Fetch all open reminders
  const now = useMemo(() => new Date(), []);
  const { data: allReminders = [], isLoading: remindersLoading, refetch: refetchReminders } = useReminders({
    status: 'offen',
  });
  
  // Separate appointments (termine/aufgaben) and bills (zahlungen)
  const { appointments, bills, overdueCount } = useMemo(() => {
    const upcoming = allReminders.filter(r => {
      const dueDate = new Date(r.dueDate);
      return dueDate >= now || r.status === 'offen';
    });
    
    const appointments = upcoming
      .filter(r => r.type === 'termin' || r.type === 'aufgabe')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 3);
    
    const bills = upcoming
      .filter(r => r.type === 'zahlung')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 3);
    
    const overdueCount = allReminders.filter(r => {
      const dueDate = new Date(r.dueDate);
      return dueDate < now && r.status === 'offen';
    }).length;
    
    return { appointments, bills, overdueCount };
  }, [allReminders, now]);

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

  const { data: financeEntries = [], isLoading: financeLoading, refetch: refetchFinance } = useFinanceEntries({
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

  // Calculate totals - only count PAID expenses (consistent with Finance page)
  const totalIncome = financeEntries
    .filter(e => e.type === 'einnahme')
    .reduce((sum, e) => sum + e.amount, 0) / 100;

  const totalExpenses = financeEntries
    .filter(e => e.type === 'ausgabe' && (e as any).status === 'paid')
    .reduce((sum, e) => sum + e.amount, 0) / 100;

  const balance = totalIncome - totalExpenses;

  // Calculate total pending bills
  const totalPendingBills = bills.reduce((sum, b) => sum + (b.amount || 0), 0) / 100;

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

  const getDaysUntilDue = (dueDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'termin':
        return <Calendar className="w-4 h-4" />;
      case 'aufgabe':
        return <CheckSquare className="w-4 h-4" />;
      case 'zahlung':
        return <ClipboardList className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <Layout title={t('dashboard.title')}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Upcoming Appointments Widget */}
        <Card className="col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                <CardTitle className="text-base">{t('dashboard.appointments', 'Termine & Aufgaben')}</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {remindersLoading ? (
              <div className="text-sm text-muted-foreground text-center py-6">
                {t('common.loading')}
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-6">
                {t('dashboard.noAppointments', 'Keine anstehenden Termine')}
              </div>
            ) : (
              <div className="space-y-2">
                {appointments.map((item) => {
                  const daysUntil = getDaysUntilDue(item.dueDate);
                  const isOverdue = daysUntil < 0;
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer ${isOverdue ? 'bg-red-50 dark:bg-red-900/20' : ''}`}
                      onClick={() => setLocation('/reminders')}
                    >
                      <div className={`p-1.5 rounded ${item.type === 'termin' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                        {getTypeIcon(item.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(item.dueDate)}
                        </p>
                      </div>
                      {isOverdue && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {Math.abs(daysUntil)}d
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full mt-3 text-muted-foreground"
              onClick={() => setLocation('/reminders')}
            >
              {t('dashboard.viewAll', 'Alle anzeigen')}
            </Button>
          </CardContent>
        </Card>

        {/* Pending Bills Widget */}
        <Card className="col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-green-500" />
                <CardTitle className="text-base">{t('dashboard.pendingBills', 'Offene Rechnungen')}</CardTitle>
              </div>
              {overdueCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {overdueCount} überfällig
                </Badge>
              )}
            </div>
            {totalPendingBills > 0 && (
              <p className="text-lg font-bold text-green-600 mt-1">
                {formatAmount(totalPendingBills)}
              </p>
            )}
          </CardHeader>
          <CardContent>
            {remindersLoading ? (
              <div className="text-sm text-muted-foreground text-center py-6">
                {t('common.loading')}
              </div>
            ) : bills.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-6">
                {t('dashboard.noBills', 'Keine offenen Rechnungen')}
              </div>
            ) : (
              <div className="space-y-2">
                {bills.map((bill) => {
                  const daysUntil = getDaysUntilDue(bill.dueDate);
                  const isOverdue = daysUntil < 0;
                  const isDueSoon = daysUntil >= 0 && daysUntil <= 7;
                  return (
                    <div
                      key={bill.id}
                      className={`flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer ${isOverdue ? 'bg-red-50 dark:bg-red-900/20' : isDueSoon ? 'bg-orange-50 dark:bg-orange-900/20' : ''}`}
                      onClick={() => setLocation('/bills')}
                    >
                      <div className="p-1.5 rounded bg-green-100 text-green-600">
                        <ClipboardList className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{bill.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {isOverdue 
                            ? `${Math.abs(daysUntil)} Tage überfällig` 
                            : daysUntil === 0 
                              ? 'Heute fällig'
                              : `Fällig in ${daysUntil} Tagen`
                          }
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">
                          {formatAmount((bill.amount || 0) / 100, bill.currency || 'CHF')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full mt-3 text-muted-foreground"
              onClick={() => setLocation('/bills')}
            >
              {t('dashboard.viewAll', 'Alle anzeigen')}
            </Button>
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

      <AddReminderDialog 
        open={reminderDialogOpen} 
        onOpenChange={setReminderDialogOpen} 
        onSuccess={refetchReminders}
      />
      <AddFinanceEntryDialog 
        open={financeDialogOpen} 
        onOpenChange={setFinanceDialogOpen}
        onSuccess={refetchFinance}
      />
    </Layout>
  );
}
