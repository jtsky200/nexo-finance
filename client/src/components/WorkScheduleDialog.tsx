import { useState, useEffect, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, ChevronRight, Briefcase, Coffee, Moon, Sun, 
  Trash2, Users, Check
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
  { value: 'full', label: 'Vollzeit', icon: Briefcase, color: 'bg-blue-600 hover:bg-blue-700', lightColor: 'bg-blue-100 text-blue-800' },
  { value: 'half-am', label: 'Morgen', icon: Sun, color: 'bg-amber-500 hover:bg-amber-600', lightColor: 'bg-amber-100 text-amber-800' },
  { value: 'half-pm', label: 'Nachmittag', icon: Moon, color: 'bg-purple-600 hover:bg-purple-700', lightColor: 'bg-purple-100 text-purple-800' },
  { value: 'off', label: 'Frei', icon: Coffee, color: 'bg-green-600 hover:bg-green-700', lightColor: 'bg-green-100 text-green-800' },
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
      days.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        isCurrentMonth: false
      });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    
    return days;
  }, [currentMonth]);

  const getScheduleForDate = useCallback((date: Date, personId: string) => {
    const dateStr = date.toISOString().split('T')[0];
    return schedules.find(s => s.personId === personId && s.date === dateStr);
  }, [schedules]);

  const getTypeInfo = (type: string) => {
    return SCHEDULE_TYPES.find(t => t.value === type) || SCHEDULE_TYPES[0];
  };

  const handleDateClick = (date: Date) => {
    if (!date || !selectedPerson) return;
    const dateStr = date.toISOString().split('T')[0];
    
    setSelectedDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dateStr)) {
        newSet.delete(dateStr);
      } else {
        newSet.add(dateStr);
      }
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

  const clearSelection = () => {
    setSelectedDates(new Set());
  };

  const stats = useMemo(() => {
    if (!selectedPerson) return { workDays: 0, hours: 0, freeDays: 0 };
    
    const personSchedules = schedules.filter(s => s.personId === selectedPerson);
    const currentMonthSchedules = personSchedules.filter(s => {
      const date = new Date(s.date);
      return date.getMonth() === currentMonth.getMonth() && 
             date.getFullYear() === currentMonth.getFullYear();
    });

    let workDays = 0;
    let hours = 0;
    let freeDays = 0;

    currentMonthSchedules.forEach(s => {
      if (s.type === 'off') {
        freeDays++;
      } else {
        workDays++;
        if (s.type === 'full') hours += 8;
        else hours += 4;
      }
    });

    return { workDays, hours, freeDays };
  }, [schedules, selectedPerson, currentMonth]);

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 
                      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Arbeitszeiten planen
          </DialogTitle>
        </DialogHeader>

        {peopleLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          </div>
        ) : householdMembers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Keine Haushaltsmitglieder gefunden</p>
            <p className="text-sm text-muted-foreground">Füge Personen auf der Personen-Seite hinzu.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Top Row: Person + Stats */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Person:</span>
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
              <div className="flex-1" />
              <div className="flex gap-3 text-center">
                <div className="px-3 py-1 bg-blue-50 rounded-lg">
                  <span className="text-lg font-bold text-blue-600">{stats.workDays}</span>
                  <span className="text-xs text-muted-foreground ml-1">Tage</span>
                </div>
                <div className="px-3 py-1 bg-amber-50 rounded-lg">
                  <span className="text-lg font-bold text-amber-600">{stats.hours}h</span>
                </div>
                <div className="px-3 py-1 bg-green-50 rounded-lg">
                  <span className="text-lg font-bold text-green-600">{stats.freeDays}</span>
                  <span className="text-xs text-muted-foreground ml-1">Frei</span>
                </div>
              </div>
            </div>

            {/* Month + Type Row */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="font-medium min-w-[140px] text-center">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </span>
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <div className="h-6 w-px bg-border" />
              {SCHEDULE_TYPES.map(type => {
                const Icon = type.icon;
                return (
                  <Button
                    key={type.value}
                    variant={selectedType === type.value ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedType(type.value)}
                    className={selectedType === type.value ? type.color + ' text-white' : ''}
                  >
                    <Icon className="w-4 h-4 mr-1" />
                    {type.label}
                  </Button>
                );
              })}
            </div>

            {/* Quick Select */}
            <div className="flex flex-wrap items-center gap-1 text-sm">
              <span className="text-muted-foreground mr-2">Schnell:</span>
              <Button variant="outline" size="sm" className="h-7 px-2" onClick={selectWorkWeek}>Mo-Fr</Button>
              {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day, idx) => {
                const dow = idx === 6 ? 0 : idx + 1;
                return (
                  <Button key={day} variant="ghost" size="sm" className="h-7 px-2" onClick={() => selectAllWeekdays(dow)}>
                    {day}
                  </Button>
                );
              })}
              {selectedDates.size > 0 && (
                <Button variant="destructive" size="sm" className="h-7 px-2 ml-2" onClick={clearSelection}>
                  <Trash2 className="w-3 h-3 mr-1" />
                  {selectedDates.size}
                </Button>
              )}
            </div>

            {/* Calendar */}
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-7 bg-muted text-xs font-medium">
                {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
                  <div key={day} className="p-2 text-center border-b">{day}</div>
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
                        h-16 p-1 border-b border-r cursor-pointer transition-colors relative
                        ${day.isCurrentMonth ? 'bg-background hover:bg-accent/50' : 'bg-muted/40 text-muted-foreground'}
                        ${isToday(day.date) ? 'ring-2 ring-primary ring-inset' : ''}
                        ${isSelected ? 'bg-primary/15' : ''}
                      `}
                    >
                      <span className="text-xs font-medium">{day.date.getDate()}</span>
                      
                      {schedule && typeInfo && (
                        <div className={`mt-1 text-[10px] px-1.5 py-0.5 rounded ${typeInfo.lightColor} font-medium flex items-center justify-between group`}>
                          <span>{typeInfo.label}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); if (schedule.id) deleteSchedule(schedule.id); }}
                            className="opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}

                      {isSelected && !schedule && (
                        <div className="absolute top-0.5 right-0.5">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Apply Button */}
            {selectedDates.size > 0 && (
              <Button onClick={applyToSelected} className="w-full">
                <Check className="w-4 h-4 mr-2" />
                {getTypeInfo(selectedType).label} auf {selectedDates.size} Tage anwenden
              </Button>
            )}

            {/* Legend */}
            <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
              {SCHEDULE_TYPES.map(type => {
                const Icon = type.icon;
                return (
                  <span key={type.value} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${type.lightColor}`}>
                    <Icon className="w-3 h-3" />
                    {type.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
