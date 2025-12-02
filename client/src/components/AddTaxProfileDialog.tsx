import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { TaxProfile } from '@/lib/firebaseHooks';

interface AddTaxProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<TaxProfile>) => Promise<void>;
  editProfile?: TaxProfile | null;
}

const swissCantons = [
  { code: 'ZH', name: 'Zürich' },
  { code: 'BE', name: 'Bern' },
  { code: 'LU', name: 'Luzern' },
  { code: 'UR', name: 'Uri' },
  { code: 'SZ', name: 'Schwyz' },
  { code: 'OW', name: 'Obwalden' },
  { code: 'NW', name: 'Nidwalden' },
  { code: 'GL', name: 'Glarus' },
  { code: 'ZG', name: 'Zug' },
  { code: 'FR', name: 'Freiburg' },
  { code: 'SO', name: 'Solothurn' },
  { code: 'BS', name: 'Basel-Stadt' },
  { code: 'BL', name: 'Basel-Landschaft' },
  { code: 'SH', name: 'Schaffhausen' },
  { code: 'AR', name: 'Appenzell Ausserrhoden' },
  { code: 'AI', name: 'Appenzell Innerrhoden' },
  { code: 'SG', name: 'St. Gallen' },
  { code: 'GR', name: 'Graubünden' },
  { code: 'AG', name: 'Aargau' },
  { code: 'TG', name: 'Thurgau' },
  { code: 'TI', name: 'Tessin' },
  { code: 'VD', name: 'Waadt' },
  { code: 'VS', name: 'Wallis' },
  { code: 'NE', name: 'Neuenburg' },
  { code: 'GE', name: 'Genf' },
  { code: 'JU', name: 'Jura' },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

export default function AddTaxProfileDialog({
  open,
  onOpenChange,
  onSubmit,
  editProfile,
}: AddTaxProfileDialogProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    taxYear: editProfile?.taxYear || currentYear,
    canton: editProfile?.canton || '',
    maritalStatus: editProfile?.maritalStatus || '',
    numberOfChildren: editProfile?.numberOfChildren || 0,
    grossIncome: editProfile?.grossIncome || '',
    otherIncome: editProfile?.otherIncome || '',
    deductions: editProfile?.deductions || '',
    notes: editProfile?.notes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit({
        ...formData,
        grossIncome: formData.grossIncome ? Number(formData.grossIncome) : null,
        otherIncome: formData.otherIncome ? Number(formData.otherIncome) : null,
        deductions: formData.deductions ? Number(formData.deductions) : null,
      });
      onOpenChange(false);
      // Reset form
      setFormData({
        taxYear: currentYear,
        canton: '',
        maritalStatus: '',
        numberOfChildren: 0,
        grossIncome: '',
        otherIncome: '',
        deductions: '',
        notes: '',
      });
    } catch (error) {
      console.error('Error submitting tax profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editProfile ? t('taxes.editProfile', 'Steuerprofil bearbeiten') : t('taxes.addProfile', 'Neues Steuerprofil')}
          </DialogTitle>
          <DialogDescription>
            {t('taxes.profileDescription', 'Erfassen Sie Ihre Steuerdaten für das gewählte Jahr')}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taxYear">{t('taxes.year', 'Steuerjahr')}</Label>
              <Select
                value={formData.taxYear.toString()}
                onValueChange={(value) => setFormData({ ...formData, taxYear: parseInt(value) })}
              >
                <SelectTrigger id="taxYear">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="canton">{t('taxes.canton', 'Kanton')}</Label>
              <Select
                value={formData.canton}
                onValueChange={(value) => setFormData({ ...formData, canton: value })}
              >
                <SelectTrigger id="canton">
                  <SelectValue placeholder={t('taxes.selectCanton', 'Kanton wählen')} />
                </SelectTrigger>
                <SelectContent>
                  {swissCantons.map((canton) => (
                    <SelectItem key={canton.code} value={canton.code}>
                      {canton.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Personal Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maritalStatus">{t('taxes.maritalStatus', 'Zivilstand')}</Label>
              <Select
                value={formData.maritalStatus}
                onValueChange={(value) => setFormData({ ...formData, maritalStatus: value })}
              >
                <SelectTrigger id="maritalStatus">
                  <SelectValue placeholder={t('taxes.selectMaritalStatus', 'Wählen')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">{t('taxes.single', 'Ledig')}</SelectItem>
                  <SelectItem value="married">{t('taxes.married', 'Verheiratet')}</SelectItem>
                  <SelectItem value="divorced">{t('taxes.divorced', 'Geschieden')}</SelectItem>
                  <SelectItem value="widowed">{t('taxes.widowed', 'Verwitwet')}</SelectItem>
                  <SelectItem value="registered_partnership">{t('taxes.registeredPartnership', 'Eingetragene Partnerschaft')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="numberOfChildren">{t('taxes.children', 'Anzahl Kinder')}</Label>
              <Input
                id="numberOfChildren"
                type="number"
                min="0"
                value={formData.numberOfChildren}
                onChange={(e) => setFormData({ ...formData, numberOfChildren: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* Income */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              {t('taxes.incomeSection', 'Einkommen')}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grossIncome">{t('taxes.grossIncome', 'Bruttoeinkommen (CHF)')}</Label>
                <Input
                  id="grossIncome"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.grossIncome}
                  onChange={(e) => setFormData({ ...formData, grossIncome: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="otherIncome">{t('taxes.otherIncome', 'Andere Einkünfte (CHF)')}</Label>
                <Input
                  id="otherIncome"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.otherIncome}
                  onChange={(e) => setFormData({ ...formData, otherIncome: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              {t('taxes.deductionsSection', 'Abzüge')}
            </h3>
            <div className="space-y-2">
              <Label htmlFor="deductions">{t('taxes.totalDeductions', 'Gesamtabzüge (CHF)')}</Label>
              <Input
                id="deductions"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.deductions}
                onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">{t('taxes.notes', 'Notizen')}</Label>
            <Textarea
              id="notes"
              placeholder={t('taxes.notesPlaceholder', 'Zusätzliche Informationen...')}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel', 'Abbrechen')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t('common.loading', 'Wird geladen...') : t('common.save', 'Speichern')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

