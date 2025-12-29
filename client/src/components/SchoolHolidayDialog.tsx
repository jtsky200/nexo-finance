import { useState, useEffect, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar as CalendarIcon, Trash2, Plus, Sun, ChevronLeft, ChevronRight
} from 'lucide-react';
import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

interface SchoolHoliday {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  type: string;
  canton?: string;
}

interface SchoolHolidayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDataChanged?: () => void;
}

export default function SchoolHolidayDialog({ open, onOpenChange, onDataChanged }: SchoolHolidayDialogProps) {
  const { t } = useTranslation();
  
  const HOLIDAY_TYPES = useMemo(() => [
    { value: 'herbst', label: t('schoolHolidays.types.herbst') },
    { value: 'winter', label: t('schoolHolidays.types.winter') },
    { value: 'sport', label: t('schoolHolidays.types.sport') },
    { value: 'fruehling', label: t('schoolHolidays.types.fruehling') },
    { value: 'sommer', label: t('schoolHolidays.types.sommer') },
    { value: 'auffahrt', label: t('schoolHolidays.types.auffahrt') },
    { value: 'pfingsten', label: t('schoolHolidays.types.pfingsten') },
    { value: 'andere', label: t('schoolHolidays.types.andere') },
  ], [t]);

  const CANTONS = useMemo(() => [
    { value: 'zh', label: t('schoolHolidays.cantons.zh') },
    { value: 'be', label: t('schoolHolidays.cantons.be') },
    { value: 'bs', label: t('schoolHolidays.cantons.bs') },
    { value: 'bl', label: t('schoolHolidays.cantons.bl') },
    { value: 'ag', label: t('schoolHolidays.cantons.ag') },
    { value: 'so', label: t('schoolHolidays.cantons.so') },
    { value: 'lu', label: t('schoolHolidays.cantons.lu') },
    { value: 'sg', label: t('schoolHolidays.cantons.sg') },
    { value: 'andere', label: t('schoolHolidays.cantons.andere') },
  ], [t]);
  const [holidays, setHolidays] = useState<SchoolHoliday[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  // Add form state
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('andere');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formCanton, setFormCanton] = useState('zh');

  const fetchHolidays = useCallback(async () => {
    try {
      setIsLoading(true);
      const getHolidaysFunc = httpsCallable(functions, 'getSchoolHolidays');
      const result = await getHolidaysFunc({});
      const data = result.data as { holidays: SchoolHoliday[] };
      setHolidays(data.holidays || []);
    } catch (error) {
      // Silently fail - holidays will be empty
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchHolidays();
    }
  }, [open, fetchHolidays]);

  const handleAddHoliday = async () => {
    if (!formName || !formStartDate || !formEndDate) {
      toast.error(t('schoolHolidays.allFieldsRequired'));
      return;
    }

    if (new Date(formEndDate) < new Date(formStartDate)) {
      toast.error(t('schoolHolidays.endDateAfterStartDate'));
      return;
    }

    try {
      const createHolidayFunc = httpsCallable(functions, 'createSchoolHoliday');
      await createHolidayFunc({
        name: formName,
        startDate: formStartDate,
        endDate: formEndDate,
        type: formType,
        canton: formCanton,
      });
      toast.success(t('schoolHolidays.holidayAdded'));
      resetForm();
      setShowAddDialog(false);
      fetchHolidays();
      if (onDataChanged) onDataChanged();
    } catch (error) {
      toast.error(t('schoolHolidays.createError'));
    }
  };

  const deleteHoliday = async (id: string) => {
    try {
      const deleteHolidayFunc = httpsCallable(functions, 'deleteSchoolHoliday');
      await deleteHolidayFunc({ id });
      toast.success(t('schoolHolidays.holidayDeleted'));
      fetchHolidays();
      if (onDataChanged) onDataChanged();
    } catch (error) {
      toast.error(t('schoolHolidays.deleteError'));
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormType('andere');
    setFormStartDate('');
    setFormEndDate('');
  };

  const handleTypeChange = (type: string) => {
    setFormType(type);
    const typeLabel = HOLIDAY_TYPES.find(t => t.value === type)?.label;
    if (typeLabel) {
      setFormName(typeLabel);
    }
  };

  const filteredHolidays = holidays.filter(h => {
    const year = new Date(h.startDate).getFullYear();
    return year === currentYear;
  });

  const sortedHolidays = [...filteredHolidays].sort((a, b) => 
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  const totalDays = sortedHolidays.reduce((acc, h) => {
    return acc + differenceInDays(new Date(h.endDate), new Date(h.startDate)) + 1;
  }, 0);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sun className="w-5 h-5 text-amber-500" />
              {t('schoolHolidays.title')}
            </DialogTitle>
          </DialogHeader>

          <div className="pt-6">
            {/* Year Navigation + Stats */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentYear(currentYear - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="font-medium text-lg w-[60px] text-center">{currentYear}</span>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentYear(currentYear + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('schoolHolidays.holidayCount', { count: sortedHolidays.length })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span className="font-medium">{t('schoolHolidays.freeDays', { count: totalDays })}</span>
                </div>
              </div>

              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                {t('schoolHolidays.addHoliday')}
              </Button>
            </div>

            {/* Holidays List */}
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              </div>
            ) : sortedHolidays.length === 0 ? (
              <div className="text-center py-12 bg-muted/20 rounded-lg">
                <Sun className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">{t('schoolHolidays.noHolidaysForYear', { year: currentYear })}</p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('schoolHolidays.addFirstHoliday')}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedHolidays.map(holiday => {
                  const days = differenceInDays(new Date(holiday.endDate), new Date(holiday.startDate)) + 1;
                  return (
                    <div
                      key={holiday.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                          <Sun className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{holiday.name}</h4>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>
                              {format(new Date(holiday.startDate), 'dd. MMM', { locale: de })} - {format(new Date(holiday.endDate), 'dd. MMM yyyy', { locale: de })}
                            </span>
                            <span className="text-muted-foreground/60">•</span>
                            <span>{t('schoolHolidays.days', { count: days })}</span>
                            {holiday.canton && (
                              <>
                                <span className="text-muted-foreground/60">•</span>
                                <span>{CANTONS.find(c => c.value === holiday.canton)?.label}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteHoliday(holiday.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Timeline Visualization */}
            {sortedHolidays.length > 0 && (
              <div className="mt-8 p-4 bg-muted/20 rounded-lg">
                <h4 className="font-medium mb-4">{t('schoolHolidays.overview', { year: currentYear })}</h4>
                <div className="relative h-12 bg-muted rounded overflow-hidden">
                  {sortedHolidays.map((holiday, idx) => {
                    const startOfYear = new Date(currentYear, 0, 1);
                    const endOfYear = new Date(currentYear, 11, 31);
                    const totalDaysInYear = differenceInDays(endOfYear, startOfYear) + 1;
                    
                    const start = Math.max(0, differenceInDays(new Date(holiday.startDate), startOfYear));
                    const end = differenceInDays(new Date(holiday.endDate), startOfYear);
                    
                    const leftPercent = (start / totalDaysInYear) * 100;
                    const widthPercent = Math.max(1, ((end - start + 1) / totalDaysInYear) * 100);

                    const colors = ['bg-amber-400', 'bg-orange-400', 'bg-yellow-400', 'bg-lime-400', 'bg-emerald-400'];
                    
                    return (
                      <div
                        key={holiday.id}
                        className={`absolute h-full ${colors[idx % colors.length]} flex items-center justify-center`}
                        style={{
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                        }}
                        title={`${holiday.name}: ${format(new Date(holiday.startDate), 'dd.MM')} - ${format(new Date(holiday.endDate), 'dd.MM')}`}
                      >
                        {widthPercent > 8 && (
                          <span className="text-xs font-medium text-white/90 truncate px-1">
                            {holiday.name}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  {[
                    t('calendar.months.january').substring(0, 3),
                    t('calendar.months.february').substring(0, 3),
                    t('calendar.months.march').substring(0, 3),
                    t('calendar.months.april').substring(0, 3),
                    t('calendar.months.may').substring(0, 3),
                    t('calendar.months.june').substring(0, 3),
                    t('calendar.months.july').substring(0, 3),
                    t('calendar.months.august').substring(0, 3),
                    t('calendar.months.september').substring(0, 3),
                    t('calendar.months.october').substring(0, 3),
                    t('calendar.months.november').substring(0, 3),
                    t('calendar.months.december').substring(0, 3)
                  ].map(m => (
                    <span key={m}>{m}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Holiday Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('schoolHolidays.addHoliday')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('schoolHolidays.holidayType')}</Label>
                <Select value={formType} onValueChange={handleTypeChange}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOLIDAY_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('schoolHolidays.cantonOptional')}</Label>
                <Select value={formCanton} onValueChange={setFormCanton}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CANTONS.map(canton => (
                      <SelectItem key={canton.value} value={canton.value}>{canton.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>{t('common.name')}</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t('schoolHolidays.namePlaceholder')}
                className="mt-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('common.from')}</Label>
                <Input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>{t('common.to')}</Label>
                <Input
                  type="date"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>{t('common.cancel')}</Button>
            <Button onClick={handleAddHoliday}>
              <Plus className="w-4 h-4 mr-2" />
              {t('common.add')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

