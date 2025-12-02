import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, DollarSign, CheckSquare } from 'lucide-react';
import { useReminders } from '@/lib/firebaseHooks';
import AddReminderDialog from '@/components/AddReminderDialog';

export default function Reminders() {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: reminders = [], isLoading } = useReminders();

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
    return `${currency} ${(amount / 100).toFixed(2)}`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'termin':
        return <Calendar className="w-4 h-4" />;
      case 'zahlung':
        return <DollarSign className="w-4 h-4" />;
      case 'aufgabe':
        return <CheckSquare className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      offen: 'default',
      erledigt: 'secondary',
      überfällig: 'destructive',
    };
    return (
      <Badge variant={variants[status] || 'default'}>
        {t(`reminders.status.${status}`)}
      </Badge>
    );
  };

  return (
    <Layout title={t('reminders.title')}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            Verwalten Sie Ihre Termine, Zahlungen und Aufgaben
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            {t('reminders.add')}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Alle Erinnerungen</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                {t('common.loading')}
              </div>
            ) : reminders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Noch keine Erinnerungen vorhanden
              </div>
            ) : (
              <div className="space-y-3">
                {reminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-primary">
                        {getTypeIcon(reminder.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-foreground">{reminder.title}</p>
                          {getStatusBadge(reminder.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(reminder.dueDate)}
                        </p>
                        {reminder.notes && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {reminder.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    {reminder.amount && (
                      <div className="text-right">
                        <p className="font-semibold text-foreground">
                          {formatAmount(reminder.amount, reminder.currency || 'CHF')}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AddReminderDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </Layout>
  );
}
