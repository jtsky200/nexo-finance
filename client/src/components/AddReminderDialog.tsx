import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { createReminder } from '@/lib/firebaseHooks';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const reminderSchema = z.object({
  title: z.string().min(1),
  type: z.enum(['termin', 'zahlung', 'aufgabe']),
  dueDate: z.string().min(1),
  isAllDay: z.boolean(),
  amount: z.string().optional(),
  currency: z.string(),
  notes: z.string().optional(),
});

type ReminderFormData = z.infer<typeof reminderSchema>;

interface AddReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function AddReminderDialog({ open, onOpenChange, onSuccess }: AddReminderDialogProps) {
  const { t } = useTranslation();
  const [isPayment, setIsPayment] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ReminderFormData>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      type: 'termin',
      isAllDay: false,
      currency: 'CHF',
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = form;

  const reminderType = watch('type') as 'termin' | 'zahlung' | 'aufgabe';

  const onSubmit = async (data: ReminderFormData) => {
    try {
      setIsSubmitting(true);
      const dueDate = new Date(data.dueDate);
      const amount = data.amount ? Math.round(parseFloat(data.amount) * 100) : undefined;

      await createReminder({
        title: data.title,
        type: data.type,
        dueDate,
        isAllDay: data.isAllDay,
        amount,
        currency: data.currency,
        notes: data.notes,
      });

      toast.success(t('reminders.created', 'Erinnerung erfolgreich erstellt'));
      reset();
      onOpenChange(false);
      // Call onSuccess callback to refresh data
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast.error(t('reminders.createError', 'Fehler beim Erstellen der Erinnerung') + ': ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('reminders.add')}</DialogTitle>
          <DialogDescription>
            {t('reminders.addDescription', 'Erstellen Sie eine neue Erinnerung für Termine, Zahlungen oder Aufgaben')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t('reminders.title', 'Titel')} *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder={t('reminders.titlePlaceholder', 'z.B. Zahnarzttermin')}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">{t('reminders.type')} *</Label>
            <Select
              value={reminderType}
              onValueChange={(value) => {
                setValue('type', value as 'termin' | 'zahlung' | 'aufgabe');
                setIsPayment(value === 'zahlung');
              }}
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="termin">{t('reminders.types.termin')}</SelectItem>
                <SelectItem value="zahlung">{t('reminders.types.zahlung')}</SelectItem>
                <SelectItem value="aufgabe">{t('reminders.types.aufgabe')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">{t('reminders.dueDate')} *</Label>
            <Input
              id="dueDate"
              type="datetime-local"
              {...register('dueDate')}
            />
            {errors.dueDate && (
              <p className="text-sm text-destructive">{errors.dueDate.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isAllDay"
              onCheckedChange={(checked) => setValue('isAllDay', checked)}
            />
            <Label htmlFor="isAllDay">{t('reminders.allDay', 'Ganztägig')}</Label>
          </div>

          {isPayment && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">{t('reminders.amount')}</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  {...register('amount')}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">{t('finance.currency', 'Währung')}</Label>
                <Select
                  defaultValue="CHF"
                  onValueChange={(value) => setValue('currency', value)}
                >
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CHF">CHF</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">{t('finance.notes')}</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder={t('common.optionalNotes', 'Optionale Notizen...')}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('common.loading') : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
