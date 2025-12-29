import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, ChevronRight, Briefcase, Coffee, Moon, Sun, 
  Trash2, Users, Check, Clock
} from 'lucide-react';
import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { usePeople } from '@/lib/firebaseHooks';
import { toast } from 'sonner';

interface WorkSchedule {
  id?: string;
  personId: string;
  personName: string;
  date: string;
  type: 'full' | 'half-am' | 'half-pm' | 'off';
  startTime?: string;
  endTime?: string;
}

interface WorkScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDataChanged?: () => void;
}

// SCHEDULE_TYPES will be defined inside the component to use t()

export default function WorkScheduleDialog({ open, onOpenChange, onDataChanged }: WorkScheduleDialogProps) {
  const { t } = useTranslation();
  const { data: people = [], isLoading: peopleLoading } = usePeople();
  
  const SCHEDULE_TYPES = useMemo(() => [
    { value: 'full', label: t('calendar.workSchedule.types.full', 'Vollzeit'), icon: Briefcase, bg: 'bg-slate-700', text: 'text-white' },
    { value: 'half-am', label: t('calendar.workSchedule.types.morning', 'Morgen'), icon: Sun, bg: 'bg-amber-600', text: 'text-white' },
    { value: 'half-pm', label: t('calendar.workSchedule.types.afternoon', 'Nachmittag'), icon: Moon, bg: 'bg-indigo-600', text: 'text-white' },
    { value: 'off', label: t('calendar.workSchedule.types.off', 'Frei'), icon: Coffee, bg: 'bg-emerald-600', text: 'text-white' },
  ], [t]);
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedType, setSelectedType] = useState<string>('full');
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());

  const householdMembers = useMemo(() => 
    people.filter(p => p.type === 'household' || !p.type), 
    [people]
  );

  useEffect(() => {
    if (householdMembers.length > 0 && !selectedPerson) {
      setSelectedPerson(householdMembers[0].id);
    }
  }, [householdMembers, selectedPerson]);

  const fetchSchedules = useCallback(async () => {
    try {
      setIsLoading(true);
      const getSchedulesFunc = httpsCallable(functions, 'getWorkSchedules');
      const result = await getSchedulesFunc({});
      const data = result.data as { schedules: WorkSchedule[] };
      setSchedules(data.schedules || []);
    } catch (error) {
      // Silently fail - schedules will be empty
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchSchedules();
      setSelectedDates(new Set());
    }
  }, [open, fetchSchedules]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    
    const days: { date: Date; isCurrentMonth: boolean }[] = [];
    
    const prevMonth = new Date(year, month, 0);
    const daysInPrevMonth = prevMonth.getDate();
    for (let i = adjustedStartDay - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month - 1, daysInPrevMonth - i), isCurrentMonth: false });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    
    return days;
  }, [currentMonth]);

  const getScheduleForDate = useCallback((date: Date, personId: string) => {
    const dateStr = date.toISOString().split('T')[0];
    return schedules.find(s => s.personId === personId && s.date === dateStr);
  }, [schedules]);

  const getTypeInfo = (type: string) => SCHEDULE_TYPES.find(t => t.value === type) || SCHEDULE_TYPES[0];

  const handleDateClick = (date: Date) => {
    if (!date || !selectedPerson) return;
    const dateStr = date.toISOString().split('T')[0];
    setSelectedDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dateStr)) newSet.delete(dateStr);
      else newSet.add(dateStr);
      return newSet;
    });
  };

  const applyToSelected = async () => {
    if (selectedDates.size === 0 || !selectedPerson) {
      toast.error(t('calendar.workSchedule.selectDaysFirst', 'Bitte wähle zuerst Tage aus'));
      return;
    }

    const person = householdMembers.find(p => p.id === selectedPerson);
    if (!person) return;

    try {
      const createScheduleFunc = httpsCallable(functions, 'createWorkSchedule');
      const promises = Array.from(selectedDates).map(dateStr => 
        createScheduleFunc({
          personId: selectedPerson,
          personName: person.name,
          date: dateStr,
          type: selectedType,
          startTime: selectedType === 'full' ? '08:00' : selectedType === 'half-am' ? '08:00' : '13:00',
          endTime: selectedType === 'full' ? '17:00' : selectedType === 'half-am' ? '12:00' : '17:00',
        })
      );
      await Promise.all(promises);
      toast.success(t('calendar.workSchedule.daysUpdated', '{{count}} Tage aktualisiert', { count: selectedDates.size }));
      setSelectedDates(new Set());
      fetchSchedules();
      if (onDataChanged) onDataChanged();
    } catch (error) {
      toast.error(t('calendar.workSchedule.saveError', 'Fehler beim Speichern'));
    }
  };

  const deleteSchedule = async (scheduleId: string) => {
    try {
      const deleteScheduleFunc = httpsCallable(functions, 'deleteWorkSchedule');
      await deleteScheduleFunc({ id: scheduleId });
      fetchSchedules();
      if (onDataChanged) onDataChanged();
    } catch (error) {
      toast.error(t('calendar.workSchedule.deleteError', 'Fehler beim Löschen'));
    }
  };

  const selectAllWeekdays = (dayOfWeek: number) => {
    const newDates = new Set(selectedDates);
    calendarDays.forEach(day => {
      if (day.isCurrentMonth && day.date.getDay() === dayOfWeek) {
        newDates.add(day.date.toISOString().split('T')[0]);
      }
    });
    setSelectedDates(newDates);
  };

  const selectWorkWeek = () => {
    const newDates = new Set<string>();
    calendarDays.forEach(day => {
      const dow = day.date.getDay();
      if (day.isCurrentMonth && dow >= 1 && dow <= 5) {
        newDates.add(day.date.toISOString().split('T')[0]);
      }
    });
    setSelectedDates(newDates);
  };

  const clearSelection = () => setSelectedDates(new Set());

  const stats = useMemo(() => {
    if (!selectedPerson) return { workDays: 0, hours: 0, freeDays: 0 };
    const personSchedules = schedules.filter(s => s.personId === selectedPerson);
    const currentMonthSchedules = personSchedules.filter(s => {
      const date = new Date(s.date);
      return date.getMonth() === currentMonth.getMonth() && date.getFullYear() === currentMonth.getFullYear();
    });

    let workDays = 0, hours = 0, freeDays = 0;
    currentMonthSchedules.forEach(s => {
      if (s.type === 'off') freeDays++;
      else {
        workDays++;
        hours += s.type === 'full' ? 8 : 4;
      }
    });
    return { workDays, hours, freeDays };
  }, [schedules, selectedPerson, currentMonth]);

  const isToday = (date: Date) => date.toDateString() === new Date().toDateString();

  const monthNames = useMemo(() => [
    t('calendar.months.january'),
    t('calendar.months.february'),
    t('calendar.months.march'),
    t('calendar.months.april'),
    t('calendar.months.may'),
    t('calendar.months.june'),
    t('calendar.months.july'),
    t('calendar.months.august'),
    t('calendar.months.september'),
    t('calendar.months.october'),
    t('calendar.months.november'),
    t('calendar.months.december'),
  ], [t]);
  
  const weekdayNames = useMemo(() => [
    t('calendar.fullDays.monday'),
    t('calendar.fullDays.tuesday'),
    t('calendar.fullDays.wednesday'),
    t('calendar.fullDays.thursday'),
    t('calendar.fullDays.friday'),
    t('calendar.fullDays.saturday'),
    t('calendar.fullDays.sunday'),
  ], [t]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[95vw] !w-[1400px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Briefcase className="w-5 h-5" />
            {t('calendar.workSchedule.title', 'Arbeitszeiten planen')}
          </DialogTitle>
        </DialogHeader>

        {peopleLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          </div>
        ) : householdMembers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">{t('calendar.workSchedule.noHouseholdMembers', 'Keine Haushaltsmitglieder gefunden')}</p>
          </div>
        ) : (
          <div className="pt-6">
            {/* Top Controls - ALL IN ONE ROW */}
            <div className="flex items-center gap-8 mb-6 flex-wrap">
              {/* Person */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground whitespace-nowrap">{t('calendar.workSchedule.person', 'Person')}:</span>
                <div className="flex gap-2">
                  {householdMembers.map(person => (
                    <Button
                      key={person.id}
                      variant={selectedPerson === person.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedPerson(person.id)}
                    >
                      {person.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 border-l pl-8">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                  <span className="font-bold">{stats.workDays}</span>
                  <span className="text-muted-foreground text-sm">{t('calendar.workSchedule.days', 'Tage')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="font-bold">{stats.hours}h</span>
                </div>
                <div className="flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-muted-foreground" />
                  <span className="font-bold">{stats.freeDays}</span>
                  <span className="text-muted-foreground text-sm">{t('calendar.workSchedule.free', 'Frei')}</span>
                </div>
              </div>

              {/* Month Navigation */}
              <div className="flex items-center gap-2 border-l pl-8">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="font-medium w-[140px] text-center">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </span>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Type + Quick Select - SECOND ROW */}
            <div className="flex items-center gap-8 mb-6 flex-wrap">
              {/* Type Selection */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground whitespace-nowrap">{t('calendar.workSchedule.type', 'Typ')}:</span>
                <div className="flex gap-2">
                  {SCHEDULE_TYPES.map(type => {
                    const Icon = type.icon;
                    return (
                      <Button
                        key={type.value}
                        variant={selectedType === type.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedType(type.value)}
                      >
                        <Icon className="w-4 h-4 mr-1.5" />
                        {type.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Select */}
              <div className="flex items-center gap-3 border-l pl-8">
                <span className="text-sm text-muted-foreground whitespace-nowrap">{t('calendar.workSchedule.quick', 'Schnell')}:</span>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={selectWorkWeek}>{t('calendar.days.monday')}-{t('calendar.days.friday')}</Button>
                  {[t('calendar.days.monday'), t('calendar.days.tuesday'), t('calendar.days.wednesday'), t('calendar.days.thursday'), t('calendar.days.friday'), t('calendar.days.saturday'), t('calendar.days.sunday')].map((day, idx) => (
                    <Button key={day} variant="ghost" size="sm" className="px-2" onClick={() => selectAllWeekdays(idx === 6 ? 0 : idx + 1)}>
                      {day}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Selection Info */}
              {selectedDates.size > 0 && (
                <div className="flex items-center gap-2 border-l pl-8">
                  <span className="text-sm font-medium">{t('calendar.workSchedule.selected', '{{count}} ausgewählt', { count: selectedDates.size })}</span>
                  <Button variant="ghost" size="sm" onClick={clearSelection}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Calendar - FULL WIDTH */}
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-7">
                {weekdayNames.map(day => (
                  <div key={day} className="p-3 text-center text-sm font-medium bg-muted/50 border-b">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {calendarDays.map((day, index) => {
                  const dateStr = day.date.toISOString().split('T')[0];
                  const schedule = getScheduleForDate(day.date, selectedPerson);
                  const isSelected = selectedDates.has(dateStr);
                  const typeInfo = schedule ? getTypeInfo(schedule.type) : null;

                  return (
                    <div
                      key={index}
                      onClick={() => day.isCurrentMonth && handleDateClick(day.date)}
                      className={`
                        h-[90px] p-2 border-b border-r cursor-pointer transition-colors
                        ${day.isCurrentMonth ? 'bg-background hover:bg-muted/30' : 'bg-muted/20 text-muted-foreground/50'}
                        ${isToday(day.date) ? 'ring-2 ring-inset ring-primary' : ''}
                        ${isSelected ? 'bg-primary/10' : ''}
                      `}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium ${isToday(day.date) ? 'text-primary' : ''}`}>
                          {day.date.getDate()}
                        </span>
                        {isSelected && !schedule && <Check className="w-4 h-4 text-primary" />}
                      </div>
                      
                      {schedule && typeInfo && (
                        <div className={`text-xs px-2 py-1.5 rounded ${typeInfo.bg} ${typeInfo.text} flex items-center justify-between group`}>
                          <span className="font-medium truncate">{typeInfo.label}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); if (schedule.id) deleteSchedule(schedule.id); }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Apply Button */}
            {selectedDates.size > 0 && (
              <Button onClick={applyToSelected} size="lg" className="w-full mt-6">
                <Check className="w-5 h-5 mr-2" />
                {t('calendar.workSchedule.applyToDays', '{{type}} auf {{count}} Tage anwenden', { type: getTypeInfo(selectedType).label, count: selectedDates.size })}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
