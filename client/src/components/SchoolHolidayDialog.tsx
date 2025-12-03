import { useState, useEffect, useCallback } from 'react';
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

const HOLIDAY_TYPES = [
  { value: 'herbst', label: 'Herbstferien' },
  { value: 'winter', label: 'Winterferien' },
  { value: 'sport', label: 'Sportferien' },
  { value: 'fruehling', label: 'Frühlingsferien' },
  { value: 'sommer', label: 'Sommerferien' },
  { value: 'auffahrt', label: 'Auffahrt' },
  { value: 'pfingsten', label: 'Pfingsten' },
  { value: 'andere', label: 'Andere' },
];

const CANTONS = [
  { value: 'zh', label: 'Zürich' },
  { value: 'be', label: 'Bern' },
  { value: 'bs', label: 'Basel-Stadt' },
  { value: 'bl', label: 'Basel-Land' },
  { value: 'ag', label: 'Aargau' },
  { value: 'so', label: 'Solothurn' },
  { value: 'lu', label: 'Luzern' },
  { value: 'sg', label: 'St. Gallen' },
  { value: 'andere', label: 'Andere' },
];

export default function SchoolHolidayDialog({ open, onOpenChange, onDataChanged }: SchoolHolidayDialogProps) {
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
      console.error('Error fetching holidays:', error);
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
      toast.error('Alle Felder sind erforderlich');
      return;
    }

    if (new Date(formEndDate) < new Date(formStartDate)) {
      toast.error('Enddatum muss nach Startdatum sein');
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
      toast.success('Ferien hinzugefügt');
      resetForm();
      setShowAddDialog(false);
      fetchHolidays();
      if (onDataChanged) onDataChanged();
    } catch (error) {
      console.error('Error creating holiday:', error);
      toast.error('Fehler beim Erstellen');
    }
  };

  const deleteHoliday = async (id: string) => {
    try {
      const deleteHolidayFunc = httpsCallable(functions, 'deleteSchoolHoliday');
      await deleteHolidayFunc({ id });
      toast.success('Ferien gelöscht');
      fetchHolidays();
      if (onDataChanged) onDataChanged();
    } catch (error) {
      console.error('Error deleting holiday:', error);
      toast.error('Fehler beim Löschen');
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
              Schulferien
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
                  <span className="text-muted-foreground">{sortedHolidays.length} Ferien</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span className="font-medium">{totalDays} Tage frei</span>
                </div>
              </div>

              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Ferien hinzufügen
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
                <p className="text-muted-foreground mb-4">Keine Ferien für {currentYear} eingetragen</p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Erste Ferien hinzufügen
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
                            <span>{days} {days === 1 ? 'Tag' : 'Tage'}</span>
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
                <h4 className="font-medium mb-4">Ferienübersicht {currentYear}</h4>
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
                  {['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'].map(m => (
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
            <DialogTitle>Schulferien hinzufügen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ferientyp</Label>
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
                <Label>Kanton (Optional)</Label>
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
              <Label>Name</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="z.B. Herbstferien"
                className="mt-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Von</Label>
                <Input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Bis</Label>
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
            <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>Abbrechen</Button>
            <Button onClick={handleAddHoliday}>
              <Plus className="w-4 h-4 mr-2" />
              Hinzufügen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

