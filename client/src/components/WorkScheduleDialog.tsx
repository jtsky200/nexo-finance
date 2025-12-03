import { useState, useEffect, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

const SCHEDULE_TYPES = [
  { value: 'full', label: 'Vollzeit', icon: Briefcase, bg: 'bg-slate-700', text: 'text-white' },
  { value: 'half-am', label: 'Morgen', icon: Sun, bg: 'bg-slate-500', text: 'text-white' },
  { value: 'half-pm', label: 'Nachmittag', icon: Moon, bg: 'bg-slate-600', text: 'text-white' },
  { value: 'off', label: 'Frei', icon: Coffee, bg: 'bg-slate-400', text: 'text-white' },
];

export default function WorkScheduleDialog({ open, onOpenChange, onDataChanged }: WorkScheduleDialogProps) {
  const { data: people = [], isLoading: peopleLoading } = usePeople();
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
      console.error('Error fetching schedules:', error);
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
      toast.error('Bitte wähle zuerst Tage aus');
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
      toast.success(`${selectedDates.size} Tage aktualisiert`);
      setSelectedDates(new Set());
      fetchSchedules();
      if (onDataChanged) onDataChanged();
    } catch (error) {
      console.error('Error saving schedules:', error);
      toast.error('Fehler beim Speichern');
    }
  };

  const deleteSchedule = async (scheduleId: string) => {
    try {
      const deleteScheduleFunc = httpsCallable(functions, 'deleteWorkSchedule');
      await deleteScheduleFunc({ id: scheduleId });
      fetchSchedules();
      if (onDataChanged) onDataChanged();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Fehler beim Löschen');
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

  const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[98vw] max-h-[95vh] overflow-y-auto p-0">
        {/* Header */}
        <DialogHeader className="px-8 py-6 border-b">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <Briefcase className="w-6 h-6" />
            Arbeitszeiten planen
          </DialogTitle>
        </DialogHeader>

        {peopleLoading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
          </div>
        ) : householdMembers.length === 0 ? (
          <div className="text-center py-16 px-8">
            <Users className="w-14 h-14 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-lg text-muted-foreground">Keine Haushaltsmitglieder gefunden</p>
            <p className="text-muted-foreground mt-1">Füge Personen auf der Personen-Seite hinzu.</p>
          </div>
        ) : (
          <div className="p-8">
            {/* Top Row: Person Selection + Stats */}
            <div className="flex flex-wrap items-start justify-between gap-6 mb-8">
              {/* Person Selection */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-3 block">Person auswählen</label>
                <div className="flex gap-2">
                  {householdMembers.map(person => (
                    <Button
                      key={person.id}
                      variant={selectedPerson === person.id ? 'default' : 'outline'}
                      onClick={() => setSelectedPerson(person.id)}
                      className="min-w-[100px]"
                    >
                      {person.name}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Stats Cards */}
              <div className="flex gap-4">
                <Card className="min-w-[120px]">
                  <CardContent className="p-4 text-center">
                    <Briefcase className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-2xl font-bold">{stats.workDays}</div>
                    <div className="text-xs text-muted-foreground">Arbeitstage</div>
                  </CardContent>
                </Card>
                <Card className="min-w-[120px]">
                  <CardContent className="p-4 text-center">
                    <Clock className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-2xl font-bold">{stats.hours}h</div>
                    <div className="text-xs text-muted-foreground">Stunden</div>
                  </CardContent>
                </Card>
                <Card className="min-w-[120px]">
                  <CardContent className="p-4 text-center">
                    <Coffee className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-2xl font-bold">{stats.freeDays}</div>
                    <div className="text-xs text-muted-foreground">Freie Tage</div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Controls Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Month Navigation */}
              <Card>
                <CardContent className="p-4">
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Monat</label>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="flex-1 text-center font-medium">
                      {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </span>
                    <Button variant="outline" size="icon" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Type Selection */}
              <Card>
                <CardContent className="p-4">
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Arbeitstyp</label>
                  <div className="flex gap-2">
                    {SCHEDULE_TYPES.map(type => {
                      const Icon = type.icon;
                      return (
                        <Button
                          key={type.value}
                          variant={selectedType === type.value ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedType(type.value)}
                          className="flex-1"
                        >
                          <Icon className="w-4 h-4 mr-1" />
                          {type.label}
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Select */}
              <Card>
                <CardContent className="p-4">
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Schnellauswahl</label>
                  <div className="flex flex-wrap gap-1">
                    <Button variant="outline" size="sm" onClick={selectWorkWeek}>Mo-Fr</Button>
                    {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day, idx) => (
                      <Button key={day} variant="ghost" size="sm" className="px-2" onClick={() => selectAllWeekdays(idx === 6 ? 0 : idx + 1)}>
                        {day}
                      </Button>
                    ))}
                    {selectedDates.size > 0 && (
                      <Button variant="outline" size="sm" onClick={clearSelection} className="ml-auto">
                        <Trash2 className="w-3 h-3 mr-1" />
                        {selectedDates.size}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Calendar */}
            <Card className="mb-6">
              <CardContent className="p-0">
                {/* Header */}
                <div className="grid grid-cols-7 border-b">
                  {['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'].map(day => (
                    <div key={day} className="p-4 text-center text-sm font-medium text-muted-foreground bg-muted/30">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Days */}
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
                          min-h-[100px] p-3 border-b border-r cursor-pointer transition-all
                          ${day.isCurrentMonth ? 'bg-background hover:bg-muted/30' : 'bg-muted/20 text-muted-foreground/50'}
                          ${isToday(day.date) ? 'ring-2 ring-inset ring-primary' : ''}
                          ${isSelected ? 'bg-primary/10' : ''}
                        `}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm font-medium ${isToday(day.date) ? 'text-primary' : ''}`}>
                            {day.date.getDate()}
                          </span>
                          {isSelected && !schedule && <Check className="w-4 h-4 text-primary" />}
                        </div>
                        
                        {schedule && typeInfo && (
                          <div className={`text-xs px-2 py-1.5 rounded ${typeInfo.bg} ${typeInfo.text} flex items-center justify-between group`}>
                            <span className="font-medium">{typeInfo.label}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); if (schedule.id) deleteSchedule(schedule.id); }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Apply Button */}
            {selectedDates.size > 0 && (
              <Button onClick={applyToSelected} size="lg" className="w-full">
                <Check className="w-5 h-5 mr-2" />
                {getTypeInfo(selectedType).label} auf {selectedDates.size} Tage anwenden
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
