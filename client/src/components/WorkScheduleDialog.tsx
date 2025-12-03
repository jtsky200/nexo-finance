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
  { value: 'full', label: 'Vollzeit', shortLabel: 'V', icon: Briefcase, color: 'bg-blue-600 hover:bg-blue-700', lightColor: 'bg-blue-100 text-blue-800' },
  { value: 'half-am', label: 'Morgen', shortLabel: 'M', icon: Sun, color: 'bg-amber-500 hover:bg-amber-600', lightColor: 'bg-amber-100 text-amber-800' },
  { value: 'half-pm', label: 'Nachmittag', shortLabel: 'N', icon: Moon, color: 'bg-purple-600 hover:bg-purple-700', lightColor: 'bg-purple-100 text-purple-800' },
  { value: 'off', label: 'Frei', shortLabel: 'F', icon: Coffee, color: 'bg-green-600 hover:bg-green-700', lightColor: 'bg-green-100 text-green-800' },
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
      <DialogContent className="w-[95vw] max-w-[1400px] h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-10 pb-8 border-b bg-muted/30">
          <DialogTitle className="flex items-center gap-4 text-3xl font-bold">
            <Briefcase className="w-9 h-9" />
            Arbeitszeiten planen
          </DialogTitle>
        </DialogHeader>

        {peopleLoading ? (
          <div className="text-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          </div>
        ) : householdMembers.length === 0 ? (
          <div className="text-center py-24 px-10">
            <Users className="w-20 h-20 mx-auto text-muted-foreground/50 mb-8" />
            <p className="text-xl text-muted-foreground mb-3">Keine Haushaltsmitglieder gefunden</p>
            <p className="text-lg text-muted-foreground">
              Füge zuerst Personen als "Haushalt" auf der Personen-Seite hinzu.
            </p>
          </div>
        ) : (
          <div className="p-10 space-y-10">
            {/* Person Selector */}
            <div className="flex flex-wrap items-center gap-6">
              <span className="text-lg font-semibold">Person:</span>
              <div className="flex flex-wrap gap-4">
                {householdMembers.map(person => (
                  <Button
                    key={person.id}
                    variant={selectedPerson === person.id ? 'default' : 'outline'}
                    onClick={() => setSelectedPerson(person.id)}
                    className="text-lg px-8 py-6 h-auto"
                  >
                    <div className="w-9 h-9 rounded-full bg-primary-foreground text-primary flex items-center justify-center text-base font-bold mr-4">
                      {person.name.charAt(0).toUpperCase()}
                    </div>
                    {person.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-3 gap-8">
              <Card className="border-2">
                <CardContent className="py-8 px-10 text-center">
                  <p className="text-5xl font-bold text-blue-600">{stats.workDays}</p>
                  <p className="text-lg text-muted-foreground mt-3">Arbeitstage</p>
                </CardContent>
              </Card>
              <Card className="border-2">
                <CardContent className="py-8 px-10 text-center">
                  <p className="text-5xl font-bold text-amber-600">{stats.hours}h</p>
                  <p className="text-lg text-muted-foreground mt-3">Stunden</p>
                </CardContent>
              </Card>
              <Card className="border-2">
                <CardContent className="py-8 px-10 text-center">
                  <p className="text-5xl font-bold text-green-600">{stats.freeDays}</p>
                  <p className="text-lg text-muted-foreground mt-3">Freie Tage</p>
                </CardContent>
              </Card>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center justify-center gap-8">
              <Button variant="outline" className="h-14 w-14" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>
                <ChevronLeft className="w-7 h-7" />
              </Button>
              <h3 className="text-3xl font-bold min-w-[300px] text-center">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h3>
              <Button variant="outline" className="h-14 w-14" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>
                <ChevronRight className="w-7 h-7" />
              </Button>
            </div>

            {/* Type Selector */}
            <div className="flex flex-wrap items-center gap-6 p-8 bg-muted/50 rounded-xl">
              <span className="text-lg font-semibold">Arbeitstyp:</span>
              <div className="flex flex-wrap gap-4">
                {SCHEDULE_TYPES.map(type => {
                  const Icon = type.icon;
                  return (
                    <Button
                      key={type.value}
                      variant={selectedType === type.value ? 'default' : 'outline'}
                      onClick={() => setSelectedType(type.value)}
                      className={`text-lg px-8 py-6 h-auto ${selectedType === type.value ? type.color + ' text-white' : ''}`}
                    >
                      <Icon className="w-6 h-6 mr-3" />
                      {type.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Quick Select Buttons */}
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-lg font-semibold">Schnellauswahl:</span>
              <Button variant="outline" className="text-lg px-8 py-5 h-auto" onClick={selectWorkWeek}>
                Mo-Fr
              </Button>
              <div className="h-10 w-px bg-border" />
              {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day, idx) => {
                const dow = idx === 6 ? 0 : idx + 1;
                return (
                  <Button 
                    key={day} 
                    variant="ghost" 
                    className="text-lg px-6 py-5 h-auto"
                    onClick={() => selectAllWeekdays(dow)}
                  >
                    {day}
                  </Button>
                );
              })}
              {selectedDates.size > 0 && (
                <>
                  <div className="h-10 w-px bg-border" />
                  <Button variant="destructive" className="text-lg px-8 py-5 h-auto" onClick={clearSelection}>
                    <Trash2 className="w-6 h-6 mr-3" />
                    Löschen ({selectedDates.size})
                  </Button>
                </>
              )}
            </div>

            {/* Calendar Grid */}
            <div className="border-2 rounded-xl overflow-hidden flex-1">
              {/* Day Headers */}
              <div className="grid grid-cols-7 bg-muted">
                {['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'].map(day => (
                  <div key={day} className="p-5 text-center text-lg font-bold border-b-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
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
                        min-h-[120px] p-4 border-b border-r cursor-pointer transition-all relative
                        ${day.isCurrentMonth ? 'bg-background hover:bg-accent/50' : 'bg-muted/30'}
                        ${isToday(day.date) ? 'ring-2 ring-primary ring-inset' : ''}
                        ${isSelected ? 'bg-primary/20' : ''}
                      `}
                    >
                      <div className={`text-xl font-bold mb-3 ${day.isCurrentMonth ? '' : 'text-muted-foreground'}`}>
                        {day.date.getDate()}
                      </div>
                      
                      {schedule && typeInfo && (
                        <div 
                          className={`text-base px-4 py-3 rounded-lg ${typeInfo.lightColor} flex items-center justify-between group font-semibold`}
                        >
                          <span>{typeInfo.label}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (schedule.id) deleteSchedule(schedule.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      )}

                      {isSelected && (
                        <div className="absolute top-3 right-3">
                          <Check className="w-7 h-7 text-primary" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Apply Button */}
            {selectedDates.size > 0 && (
              <Button onClick={applyToSelected} className="w-full h-16 text-xl">
                <Check className="w-7 h-7 mr-4" />
                {getTypeInfo(selectedType).label} auf {selectedDates.size} Tage anwenden
              </Button>
            )}

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-6 pt-6 border-t-2">
              <span className="text-lg font-semibold">Legende:</span>
              {SCHEDULE_TYPES.map(type => {
                const Icon = type.icon;
                return (
                  <Badge key={type.value} variant="outline" className={`${type.lightColor} text-base px-5 py-3`}>
                    <Icon className="w-5 h-5 mr-3" />
                    {type.label}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
