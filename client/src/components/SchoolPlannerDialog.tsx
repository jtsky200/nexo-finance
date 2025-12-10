import { useState, useEffect, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ChevronLeft, ChevronRight, GraduationCap, Home, Coffee, 
  Trash2, Users, Check, Clock, Plus
} from 'lucide-react';
import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { usePeople } from '@/lib/firebaseHooks';
import { toast } from 'sonner';

interface SchoolSchedule {
  id?: string;
  childId: string;
  childName: string;
  date: string;
  schoolType: 'full' | 'half' | 'off' | 'holiday';
  hortType: 'full' | 'lunch' | 'afternoon' | 'none';
  startTime?: string;
  endTime?: string;
  notes?: string;
}

interface SchoolPlannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDataChanged?: () => void;
}

const SCHOOL_TYPES = [
  { value: 'full', label: 'Ganzer Tag', icon: GraduationCap, color: 'bg-purple-600 text-white' },
  { value: 'half', label: 'Halbtag', icon: Clock, color: 'bg-purple-400 text-white' },
  { value: 'off', label: 'Schulfrei', icon: Coffee, color: 'bg-gray-400 text-white' },
  { value: 'holiday', label: 'Ferien', icon: Home, color: 'bg-cyan-500 text-white' },
];

const HORT_TYPES = [
  { value: 'full', label: 'Ganztag' },
  { value: 'lunch', label: 'Mittag' },
  { value: 'afternoon', label: 'Nachmittag' },
  { value: 'none', label: 'Kein Hort' },
];

export default function SchoolPlannerDialog({ open, onOpenChange, onDataChanged }: SchoolPlannerDialogProps) {
  const { data: people = [], isLoading: peopleLoading, refetch: refetchPeople } = usePeople();
  const [schedules, setSchedules] = useState<SchoolSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedSchoolType, setSelectedSchoolType] = useState<string>('full');
  const [selectedHortType, setSelectedHortType] = useState<string>('none');
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [showAddChildDialog, setShowAddChildDialog] = useState(false);
  const [newChildName, setNewChildName] = useState('');

  // Filter only children (type === 'child')
  const children = useMemo(() => 
    people.filter(p => p.type === 'child'), 
    [people]
  );

  useEffect(() => {
    if (children.length > 0 && !selectedChild) {
      setSelectedChild(children[0].id);
    }
  }, [children, selectedChild]);

  const fetchSchedules = useCallback(async () => {
    try {
      setIsLoading(true);
      const getSchedulesFunc = httpsCallable(functions, 'getSchoolSchedules');
      const result = await getSchedulesFunc({});
      const data = result.data as { schedules: SchoolSchedule[] };
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

  const getScheduleForDate = useCallback((date: Date, childId: string) => {
    const dateStr = date.toISOString().split('T')[0];
    return schedules.find(s => s.childId === childId && s.date === dateStr);
  }, [schedules]);

  const getSchoolTypeInfo = (type: string) => SCHOOL_TYPES.find(t => t.value === type) || SCHOOL_TYPES[0];

  const handleDateClick = (date: Date) => {
    if (!date || !selectedChild) return;
    const dateStr = date.toISOString().split('T')[0];
    setSelectedDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dateStr)) newSet.delete(dateStr);
      else newSet.add(dateStr);
      return newSet;
    });
  };

  const applyToSelected = async () => {
    if (selectedDates.size === 0 || !selectedChild) {
      toast.error('Bitte wähle zuerst Tage aus');
      return;
    }

    const child = children.find(c => c.id === selectedChild);
    if (!child) return;

    try {
      const createScheduleFunc = httpsCallable(functions, 'createSchoolSchedule');
      const promises = Array.from(selectedDates).map(dateStr => 
        createScheduleFunc({
          childId: selectedChild,
          childName: child.name,
          date: dateStr,
          schoolType: selectedSchoolType,
          hortType: selectedHortType,
          startTime: selectedSchoolType === 'full' ? '08:00' : selectedSchoolType === 'half' ? '08:00' : null,
          endTime: selectedSchoolType === 'full' ? '15:30' : selectedSchoolType === 'half' ? '12:00' : null,
        })
      );
      await Promise.all(promises);
      toast.success(`${selectedDates.size} Tage aktualisiert`);
      setSelectedDates(new Set());
      fetchSchedules();
      if (onDataChanged) onDataChanged();
    } catch (error) {
      toast.error('Fehler beim Speichern');
    }
  };

  const deleteSchedule = async (scheduleId: string) => {
    try {
      const deleteScheduleFunc = httpsCallable(functions, 'deleteSchoolSchedule');
      await deleteScheduleFunc({ id: scheduleId });
      fetchSchedules();
      if (onDataChanged) onDataChanged();
    } catch (error) {
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

  const selectSchoolWeek = () => {
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

  const handleAddChild = async () => {
    if (!newChildName.trim()) {
      toast.error('Name ist erforderlich');
      return;
    }

    try {
      const createPersonFunc = httpsCallable(functions, 'createPerson');
      const result = await createPersonFunc({
        name: newChildName.trim(),
        type: 'child',
      });
      const newChild = (result.data as any);
      
      setNewChildName('');
      setShowAddChildDialog(false);
      
      // Close and reopen dialog to refresh
      onOpenChange(false);
      toast.success('Kind hinzugefügt - bitte Schulplaner erneut öffnen');
      
      if (onDataChanged) onDataChanged();
    } catch (error) {
      toast.error('Fehler beim Hinzufügen');
    }
  };

  const stats = useMemo(() => {
    if (!selectedChild) return { schoolDays: 0, hortDays: 0, freeDays: 0 };
    const childSchedules = schedules.filter(s => s.childId === selectedChild);
    const currentMonthSchedules = childSchedules.filter(s => {
      const date = new Date(s.date);
      return date.getMonth() === currentMonth.getMonth() && date.getFullYear() === currentMonth.getFullYear();
    });

    let schoolDays = 0, hortDays = 0, freeDays = 0;
    currentMonthSchedules.forEach(s => {
      if (s.schoolType === 'off' || s.schoolType === 'holiday') freeDays++;
      else schoolDays++;
      if (s.hortType !== 'none') hortDays++;
    });
    return { schoolDays, hortDays, freeDays };
  }, [schedules, selectedChild, currentMonth]);

  const isToday = (date: Date) => date.toDateString() === new Date().toDateString();
  const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;

  const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!max-w-[95vw] !w-[1400px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <GraduationCap className="w-5 h-5" />
              Schulplaner
            </DialogTitle>
          </DialogHeader>

          {peopleLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            </div>
          ) : children.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">Keine Kinder gefunden</p>
              <Button onClick={() => setShowAddChildDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Kind hinzufügen
              </Button>
            </div>
          ) : (
            <div className="pt-6">
              {/* Top Controls */}
              <div className="flex items-center gap-8 mb-6 flex-wrap">
                {/* Child Selection */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">Kind:</span>
                  <div className="flex gap-2">
                    {children.map(child => (
                      <Button
                        key={child.id}
                        variant={selectedChild === child.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedChild(child.id)}
                      >
                        {child.name}
                      </Button>
                    ))}
                    <Button variant="ghost" size="sm" onClick={() => setShowAddChildDialog(true)}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 border-l pl-8">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-purple-600" />
                    <span className="font-bold">{stats.schoolDays}</span>
                    <span className="text-muted-foreground text-sm">Schule</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-pink-600" />
                    <span className="font-bold">{stats.hortDays}</span>
                    <span className="text-muted-foreground text-sm">Hort</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Coffee className="w-4 h-4 text-muted-foreground" />
                    <span className="font-bold">{stats.freeDays}</span>
                    <span className="text-muted-foreground text-sm">Frei</span>
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

              {/* Type Selection */}
              <div className="flex items-center gap-8 mb-6 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">Schule:</span>
                  <div className="flex gap-2">
                    {SCHOOL_TYPES.map(type => {
                      const Icon = type.icon;
                      return (
                        <Button
                          key={type.value}
                          variant={selectedSchoolType === type.value ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedSchoolType(type.value)}
                          className={selectedSchoolType === type.value ? type.color : ''}
                        >
                          <Icon className="w-4 h-4 mr-1.5" />
                          {type.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-3 border-l pl-8">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">Hort:</span>
                  <Select value={selectedHortType} onValueChange={setSelectedHortType}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HORT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quick Select */}
                <div className="flex items-center gap-3 border-l pl-8">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">Schnell:</span>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={selectSchoolWeek}>Mo-Fr</Button>
                    {['Mo', 'Di', 'Mi', 'Do', 'Fr'].map((day, idx) => (
                      <Button key={day} variant="ghost" size="sm" className="px-2" onClick={() => selectAllWeekdays(idx + 1)}>
                        {day}
                      </Button>
                    ))}
                  </div>
                </div>

                {selectedDates.size > 0 && (
                  <div className="flex items-center gap-2 border-l pl-8">
                    <span className="text-sm font-medium">{selectedDates.size} ausgewählt</span>
                    <Button variant="ghost" size="sm" onClick={clearSelection}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Calendar */}
              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-7">
                  {['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'].map(day => (
                    <div key={day} className="p-3 text-center text-sm font-medium bg-muted/50 border-b">{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {calendarDays.map((day, index) => {
                    const dateStr = day.date.toISOString().split('T')[0];
                    const schedule = getScheduleForDate(day.date, selectedChild);
                    const isSelected = selectedDates.has(dateStr);
                    const typeInfo = schedule ? getSchoolTypeInfo(schedule.schoolType) : null;
                    const weekend = isWeekend(day.date);

                    return (
                      <div
                        key={index}
                        onClick={() => day.isCurrentMonth && !weekend && handleDateClick(day.date)}
                        className={`
                          h-[90px] p-2 border-b border-r transition-colors
                          ${day.isCurrentMonth && !weekend ? 'bg-background hover:bg-muted/30 cursor-pointer' : 'bg-muted/20 text-muted-foreground/50'}
                          ${isToday(day.date) ? 'ring-2 ring-inset ring-primary' : ''}
                          ${isSelected ? 'bg-primary/10' : ''}
                          ${weekend ? 'bg-muted/40' : ''}
                        `}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm font-medium ${isToday(day.date) ? 'text-primary' : ''}`}>
                            {day.date.getDate()}
                          </span>
                          {isSelected && !schedule && <Check className="w-4 h-4 text-primary" />}
                        </div>
                        
                        {schedule && typeInfo && (
                          <div className="space-y-1">
                            <div className={`text-xs px-2 py-1 rounded ${typeInfo.color} flex items-center justify-between group`}>
                              <span className="font-medium truncate">{typeInfo.label}</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); if (schedule.id) deleteSchedule(schedule.id); }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                            {schedule.hortType !== 'none' && (
                              <div className="text-xs px-2 py-0.5 rounded bg-pink-500 text-white truncate">
                                <Home className="w-3 h-3 inline mr-1" />
                                {HORT_TYPES.find(t => t.value === schedule.hortType)?.label}
                              </div>
                            )}
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
                  {getSchoolTypeInfo(selectedSchoolType).label} auf {selectedDates.size} Tage anwenden
                </Button>
              )}

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
                <span className="text-muted-foreground">Legende:</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-purple-600" />
                  <span>Ganzer Schultag</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-purple-400" />
                  <span>Halbtag</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-gray-400" />
                  <span>Schulfrei</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-pink-500" />
                  <span>Hort</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Child Dialog */}
      <Dialog open={showAddChildDialog} onOpenChange={setShowAddChildDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Kind hinzufügen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Name des Kindes</Label>
              <Input
                value={newChildName}
                onChange={(e) => setNewChildName(e.target.value)}
                placeholder="z.B. Caven"
                className="mt-2"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddChildDialog(false)}>Abbrechen</Button>
            <Button onClick={handleAddChild}>Hinzufügen</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

