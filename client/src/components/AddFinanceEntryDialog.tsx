import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { createFinanceEntry } from '@/lib/firebaseHooks';
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
import { Checkbox } from '@/components/ui/checkbox';
import { RefreshCw } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const financeSchema = z.object({
  date: z.string().min(1, 'Datum ist erforderlich'),
  type: z.enum(['einnahme', 'ausgabe']),
  category: z.string().min(1, 'Kategorie ist erforderlich'),
  amount: z.string().min(1, 'Betrag ist erforderlich'),
  currency: z.string(),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurrenceRule: z.string().optional(),
});

type FinanceFormData = z.infer<typeof financeSchema>;

interface AddFinanceEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: 'einnahme' | 'ausgabe';
  onSuccess?: () => void;
}

export default function AddFinanceEntryDialog({ 
  open, 
  onOpenChange,
  defaultType = 'ausgabe',
  onSuccess
}: AddFinanceEntryDialogProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState('monthly');

  const form = useForm<FinanceFormData>({
    resolver: zodResolver(financeSchema),
    defaultValues: {
      type: defaultType,
      currency: 'CHF',
      date: new Date().toISOString().slice(0, 16),
      isRecurring: false,
      recurrenceRule: 'monthly',
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

  const entryType = watch('type');

  const onSubmit = async (data: FinanceFormData) => {
    try {
      setIsSubmitting(true);
      const date = new Date(data.date);
      const amount = Math.round(parseFloat(data.amount) * 100);

      await createFinanceEntry({
        date: date.toISOString(),
        type: data.type,
        category: data.category,
        amount,
        currency: data.currency,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        isRecurring: isRecurring,
        recurrenceRule: isRecurring ? recurrenceRule : undefined,
      });

      toast.success('Eintrag erfolgreich erstellt');
      reset();
      onOpenChange(false);
      // Call onSuccess callback to refresh data
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast.error('Fehler beim Erstellen des Eintrags: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = entryType === 'einnahme' 
    ? ['Gehalt', 'Bonus', 'Investitionen', 'Geschenke', 'Sonstiges']
    : ['Miete', 'Lebensmittel', 'Transport', 'Versicherungen', 'Unterhaltung', 'Gesundheit', 'Sonstiges'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('finance.add')}</DialogTitle>
          <DialogDescription>
            Erfassen Sie eine neue Einnahme oder Ausgabe
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Typ *</Label>
            <Select
              value={entryType}
              onValueChange={(value) => setValue('type', value as 'einnahme' | 'ausgabe')}
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="einnahme">{t('finance.income')}</SelectItem>
                <SelectItem value="ausgabe">{t('finance.expenses')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">{t('finance.category')} *</Label>
            <Select
              onValueChange={(value) => setValue('category', value)}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Kategorie wählen" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">{t('finance.amount')} *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                {...register('amount')}
                placeholder="0.00"
              />
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Währung</Label>
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

          <div className="space-y-2">
            <Label htmlFor="date">{t('finance.date')} *</Label>
            <Input
              id="date"
              type="datetime-local"
              {...register('date')}
            />
            {errors.date && (
              <p className="text-sm text-destructive">{errors.date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">{t('finance.paymentMethod')}</Label>
            <Input
              id="paymentMethod"
              {...register('paymentMethod')}
              placeholder="z.B. Kreditkarte, Banküberweisung"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t('finance.notes')}</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Optionale Notizen..."
              rows={3}
            />
          </div>

          {/* Recurring Entry Section */}
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="isRecurring"
                checked={isRecurring}
                onCheckedChange={(checked) => setIsRecurring(checked === true)}
              />
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="isRecurring" className="cursor-pointer font-medium">
                  {t('finance.recurring')}
                </Label>
              </div>
            </div>
            
            {isRecurring && (
              <div className="space-y-2 pt-2">
                <Label>{t('finance.recurrenceRule')}</Label>
                <Select value={recurrenceRule} onValueChange={setRecurrenceRule}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">{t('finance.daily')}</SelectItem>
                    <SelectItem value="weekly">{t('finance.weekly')}</SelectItem>
                    <SelectItem value="monthly">{t('finance.monthly')}</SelectItem>
                    <SelectItem value="yearly">{t('finance.yearly')}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t('finance.recurringHint')}
                </p>
              </div>
            )}
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
