import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  AlertTriangle, Bell, Clock, CheckCircle, ArrowDownLeft, ArrowUpRight,
  FileText, Filter, Plus, X, Edit2, Trash2, RefreshCw, Eye,
  Briefcase, Palmtree
} from 'lucide-react';
import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { useReminders, createReminder, updateReminder, deleteReminder } from '@/lib/firebaseHooks';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import WorkScheduleDialog from '@/components/WorkScheduleDialog';
import VacationPlannerDialog from '@/components/VacationPlannerDialog';

interface CalendarEvent {
  id: string;
  type: 'due' | 'reminder' | 'appointment' | 'work';
  title: string;
  date: string;
  time?: string;
  amount?: number;
  status?: string;
  direction?: 'incoming' | 'outgoing';
  personId?: string;
  personName?: string;
  invoiceId?: string;
  isOverdue?: boolean;
  dueDate?: string;
  description?: string;
  category?: string;
  priority?: string;
  completed?: boolean;
}

export default function Calendar() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'month' | 'week' | 'list'>('month');
  const [filterType, setFilterType] = useState<string>('all');
  const [upcomingFilter, setUpcomingFilter] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showDayDialog, setShowDayDialog] = useState(false);
  const [showWorkScheduleDialog, setShowWorkScheduleDialog] = useState(false);
  const [showVacationDialog, setShowVacationDialog] = useState(false);
  const [vacations, setVacations] = useState<any[]>([]);

  // New event form
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    category: 'general',
    priority: 'medium',
  });

  // Get reminders
  const { data: reminders = [], refetch: refetchReminders } = useReminders();

  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const getEventsFunc = httpsCallable(functions, 'getCalendarEvents');
      const getVacationsFunc = httpsCallable(functions, 'getVacations');
      
      // Get events for a much wider range (6 months before and after)
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 6, 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 6, 0);
      
      // Fetch both events and vacations in parallel
      const [eventsResult, vacationsResult] = await Promise.all([
        getEventsFunc({ 
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }),
        getVacationsFunc({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })
      ]);
      
      const eventsData = eventsResult.data as { events: CalendarEvent[] };
      const vacationsData = vacationsResult.data as { vacations: any[] };
      
      setEvents(eventsData.events || []);
      setVacations(vacationsData.vacations || []);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      toast.error('Fehler beim Laden der Events');
    } finally {
      setIsLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Refresh all data
  const refreshAll = async () => {
    await Promise.all([fetchEvents(), refetchReminders()]);
    toast.success('Kalender aktualisiert');
  };

  // Calendar navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Calendar helpers
  const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 
                      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  const fullDayNames = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  // Helper to check if a date is within a vacation period
  const getVacationsForDate = useCallback((date: Date) => {
    return vacations.filter(v => {
      const start = new Date(v.startDate);
      const end = new Date(v.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      const checkDate = new Date(date);
      checkDate.setHours(12, 0, 0, 0);
      return checkDate >= start && checkDate <= end;
    });
  }, [vacations]);

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days: { date: Date; isCurrentMonth: boolean; events: CalendarEvent[]; vacations: any[] }[] = [];

    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const daysInPrevMonth = getDaysInMonth(prevMonth);
    for (let i = firstDay - 1; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, daysInPrevMonth - i);
      days.push({ date, isCurrentMonth: false, events: [], vacations: getVacationsForDate(date) });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.toDateString() === date.toDateString();
      });
      days.push({ date, isCurrentMonth: true, events: dayEvents, vacations: getVacationsForDate(date) });
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i);
      days.push({ date, isCurrentMonth: false, events: [], vacations: getVacationsForDate(date) });
    }

    return days;
  }, [currentDate, events, getVacationsForDate]);

  const filteredEvents = useMemo(() => {
    let filtered = events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getMonth() === currentDate.getMonth() && 
             eventDate.getFullYear() === currentDate.getFullYear();
    });

    if (filterType !== 'all') {
      filtered = filtered.filter(event => event.type === filterType);
    }

    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events, currentDate, filterType]);

  const stats = useMemo(() => {
    const monthEvents = events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getMonth() === currentDate.getMonth() && 
             eventDate.getFullYear() === currentDate.getFullYear();
    });

    return {
      total: monthEvents.length,
      overdue: monthEvents.filter(e => e.isOverdue).length,
      dueThisMonth: monthEvents.filter(e => e.type === 'due').length,
      reminders: monthEvents.filter(e => e.type === 'reminder').length,
      appointments: monthEvents.filter(e => e.type === 'appointment').length,
    };
  }, [events, currentDate]);

  const formatAmount = (amount: number) => `CHF ${(amount / 100).toFixed(2)}`;
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  const formatFullDate = (date: Date) => {
    const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
    return `${fullDayNames[dayIndex]}, ${date.getDate()}. ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  };

  const getEventColor = (event: CalendarEvent) => {
    // Dezente, professionelle Farben
    if (event.isOverdue) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
    
    // Arbeitszeiten
    if (event.type === 'work') {
      const workType = (event as any).workType;
      if (workType === 'off') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200';
      if (workType === 'half-am') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200';
      if (workType === 'half-pm') return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200';
      return 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
    }
    
    // Rechnungen/Fälligkeiten
    if (event.type === 'due') {
      if (event.status === 'paid') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200';
    }
    
    // Erinnerungen
    if (event.type === 'reminder') return 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-200';
    
    // Termine/Aufgaben
    if (event.type === 'appointment') {
      if (event.completed) return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200';
    }
    
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  const getEventBorderColor = (_event: CalendarEvent) => {
    // Dezentes Design ohne farbige Ränder
    return '';
  };

  const getEventIcon = (event: CalendarEvent) => {
    if (event.isOverdue) return <AlertTriangle className="w-4 h-4" />;
    if (event.type === 'work') return <Briefcase className="w-4 h-4" />;
    if (event.type === 'due') return <FileText className="w-4 h-4" />;
    if (event.type === 'reminder') return <Bell className="w-4 h-4" />;
    if (event.type === 'appointment') {
      if (event.category === 'aufgabe') return <CheckCircle className="w-4 h-4" />;
      return <CalendarIcon className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const getEventTypeLabel = (event: CalendarEvent) => {
    if (event.type === 'work') {
      const workType = (event as any).workType;
      if (workType === 'off') return 'Frei';
      if (workType === 'half-am') return 'Morgen';
      if (workType === 'half-pm') return 'Nachmittag';
      return 'Arbeit';
    }
    if (event.type === 'due') return 'Rechnung';
    if (event.type === 'reminder') return 'Erinnerung';
    if (event.type === 'appointment') {
      if (event.category === 'termin') return 'Termin';
      if (event.category === 'aufgabe') return 'Aufgabe';
      if (event.category === 'zahlung') return 'Zahlung';
      return 'Termin';
    }
    return 'Event';
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Handle day click
  const handleDayClick = (day: { date: Date; events: CalendarEvent[] }) => {
    setSelectedDate(day.date);
    setShowDayDialog(true);
  };

  // Handle event click
  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setShowEventDialog(true);
  };

  // Add new appointment
  const handleAddEvent = async () => {
    if (!newEvent.title.trim()) {
      toast.error('Titel ist erforderlich');
      return;
    }

    try {
      await createReminder({
        title: newEvent.title,
        description: newEvent.description,
        date: new Date(newEvent.date + (newEvent.time ? `T${newEvent.time}` : 'T12:00')),
        category: newEvent.category,
        priority: newEvent.priority,
        completed: false,
      });

      toast.success('Termin erstellt');
      setNewEvent({ title: '', description: '', date: new Date().toISOString().split('T')[0], time: '', category: 'general', priority: 'medium' });
      setShowAddDialog(false);
      await refreshAll();
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    }
  };

  // Navigate to related page
  const navigateToEvent = (event: CalendarEvent) => {
    if (event.type === 'appointment') {
      setLocation('/reminders');
    } else if (event.personId) {
      setLocation('/people');
    } else {
      setLocation('/bills');
    }
    setShowEventDialog(false);
  };

  return (
    <Layout title="Kalender">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-xl font-bold min-w-[200px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <Button variant="outline" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" onClick={goToToday}>Heute</Button>
            <Button variant="outline" size="icon" onClick={refreshAll} title="Aktualisieren">
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => {
              setNewEvent({ ...newEvent, date: new Date().toISOString().split('T')[0] });
              setShowAddDialog(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Neuer Termin
            </Button>

            <Button variant="outline" onClick={() => setShowWorkScheduleDialog(true)}>
              <Briefcase className="w-4 h-4 mr-2" />
              Arbeitszeiten
            </Button>

            <Button variant="outline" onClick={() => setShowVacationDialog(true)}>
              <Palmtree className="w-4 h-4 mr-2" />
              Ferien
            </Button>

            <Button variant="outline" onClick={() => setLocation('/bills')}>
              <FileText className="w-4 h-4 mr-2" />
              Rechnungen
            </Button>
            
            <Select value={view} onValueChange={(v: any) => setView(v)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Monat</SelectItem>
                <SelectItem value="week">Woche</SelectItem>
                <SelectItem value="list">Liste</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Events</SelectItem>
                <SelectItem value="due">Rechnungen</SelectItem>
                <SelectItem value="reminder">Erinnerungen</SelectItem>
                <SelectItem value="appointment">Termine</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <Card 
            className={`cursor-pointer transition-all hover:bg-accent ${filterType === 'all' ? 'bg-accent' : ''}`} 
            onClick={() => setFilterType('all')}
          >
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">Gesamt</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card 
            className="cursor-pointer transition-all hover:bg-accent"
            onClick={() => setFilterType('all')}
          >
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">Überfällig</p>
              <p className={`text-2xl font-bold ${stats.overdue > 0 ? 'text-red-600' : ''}`}>{stats.overdue}</p>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-all hover:bg-accent ${filterType === 'due' ? 'bg-accent' : ''}`} 
            onClick={() => setFilterType('due')}
          >
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">Rechnungen</p>
              <p className="text-2xl font-bold">{stats.dueThisMonth}</p>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-all hover:bg-accent ${filterType === 'reminder' ? 'bg-accent' : ''}`} 
            onClick={() => setFilterType('reminder')}
          >
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">Erinnerungen</p>
              <p className="text-2xl font-bold">{stats.reminders}</p>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-all hover:bg-accent ${filterType === 'appointment' ? 'bg-accent' : ''}`} 
            onClick={() => setFilterType('appointment')}
          >
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">Termine</p>
              <p className="text-2xl font-bold">{stats.appointments}</p>
            </CardContent>
          </Card>
        </div>

        {/* Calendar View */}
        {view === 'month' && (
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map(day => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    onClick={() => handleDayClick(day)}
                    className={`min-h-[100px] p-2 border rounded-lg cursor-pointer transition-colors
                      ${day.isCurrentMonth ? 'bg-background hover:bg-accent' : 'bg-muted/30 hover:bg-muted/50'}
                      ${isToday(day.date) ? 'border-primary border-2' : 'border-border'}
                    `}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      day.isCurrentMonth ? '' : 'text-muted-foreground'
                    } ${isToday(day.date) ? 'text-primary' : ''}`}>
                      {day.date.getDate()}
                    </div>
                    
                    <div className="space-y-1">
                      {/* Vacations first */}
                      {day.vacations.slice(0, 1).map((vacation: any) => (
                        <div
                          key={vacation.id}
                          className="text-xs px-1 py-0.5 rounded truncate bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-200"
                          title={`${vacation.personName}: ${vacation.title}`}
                        >
                          <Palmtree className="w-3 h-3 inline mr-1" />
                          {vacation.personName}
                        </div>
                      ))}
                      {/* Events */}
                      {day.events.slice(0, day.vacations.length > 0 ? 2 : 3).map(event => (
                        <div
                          key={event.id}
                          onClick={(e) => handleEventClick(event, e)}
                          className={`text-xs px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80 ${getEventColor(event)}`}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                      {(day.events.length + day.vacations.length) > 3 && (
                        <div className="text-xs text-muted-foreground font-medium">
                          +{day.events.length + day.vacations.length - 3} mehr
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* List View */}
        {view === 'list' && (
          <Card>
            <CardHeader>
              <CardTitle>Alle Events im {monthNames[currentDate.getMonth()]}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center py-8 text-muted-foreground">Laden...</p>
              ) : filteredEvents.length > 0 ? (
                <div className="space-y-3">
                  {filteredEvents.map(event => (
                    <div
                      key={event.id}
                      onClick={() => { setSelectedEvent(event); setShowEventDialog(true); }}
                      className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer hover:bg-accent transition-colors ${getEventBorderColor(event)} ${
                        event.isOverdue ? 'bg-red-50 dark:bg-red-900/20' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${getEventColor(event)}`}>
                          {getEventIcon(event)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{event.title}</h4>
                            <Badge variant="secondary" className="text-xs">
                              {getEventTypeLabel(event)}
                            </Badge>
                            {event.isOverdue && (
                              <Badge className="bg-red-600 text-white">Überfällig</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{formatDate(event.date)}</span>
                            {event.time && (
                              <>
                                <span>•</span>
                                <span>{event.time} Uhr</span>
                              </>
                            )}
                            {event.personName && (
                              <>
                                <span>•</span>
                                <span>{event.personName}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {event.amount ? (
                          <>
                            <p className="font-bold">{formatAmount(event.amount)}</p>
                            {event.status && (
                              <Badge variant="outline" className={
                                event.status === 'paid' ? 'text-green-600 border-green-600' :
                                event.status === 'open' ? 'text-orange-600 border-orange-600' : 'text-yellow-600 border-yellow-600'
                              }>
                                {event.status === 'paid' ? 'Bezahlt' :
                                 event.status === 'open' ? 'Offen' : 'Verschoben'}
                              </Badge>
                            )}
                          </>
                        ) : (
                          event.completed !== undefined && (
                            <Badge variant="outline" className={event.completed ? 'text-green-600 border-green-600' : 'text-muted-foreground'}>
                              {event.completed ? 'Erledigt' : 'Ausstehend'}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">Keine Events in diesem Monat</p>
                  <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Termin erstellen
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Week View */}
        {view === 'week' && (
          <Card>
            <CardContent className="pt-6">
              {(() => {
                const today = new Date();
                const startOfWeek = new Date(today);
                const dayOfWeek = today.getDay();
                const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                startOfWeek.setDate(today.getDate() + diff);

                const weekDays = Array.from({ length: 7 }, (_, i) => {
                  const date = new Date(startOfWeek);
                  date.setDate(startOfWeek.getDate() + i);
                  const dayEvents = events.filter(event => {
                    const eventDate = new Date(event.date);
                    return eventDate.toDateString() === date.toDateString();
                  });
                  return { date, events: dayEvents };
                });

                return (
                  <div className="grid grid-cols-7 gap-2">
                    {weekDays.map((day, index) => (
                      <div 
                        key={index} 
                        className="min-h-[300px] cursor-pointer"
                        onClick={() => handleDayClick(day)}
                      >
                        <div className={`text-center p-2 rounded-t-lg ${
                          isToday(day.date) ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}>
                          <div className="text-sm font-medium">{dayNames[index]}</div>
                          <div className="text-lg font-bold">{day.date.getDate()}</div>
                        </div>
                        <div className="border border-t-0 rounded-b-lg p-2 space-y-2 min-h-[250px] hover:bg-accent/50 transition-colors">
                          {day.events.map(event => (
                            <div
                              key={event.id}
                              onClick={(e) => handleEventClick(event, e)}
                              className={`text-xs p-2 rounded cursor-pointer hover:opacity-80 ${getEventColor(event)}`}
                            >
                              <div className="font-medium truncate">{event.title}</div>
                              {event.amount && (
                                <div className="opacity-90">{formatAmount(event.amount)}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {/* Upcoming Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Anstehend (nächste 7 Tage)
            </CardTitle>
            <Select 
              value={upcomingFilter}
              onValueChange={setUpcomingFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle anzeigen</SelectItem>
                <SelectItem value="due">Nur Rechnungen</SelectItem>
                <SelectItem value="appointment">Nur Termine</SelectItem>
                <SelectItem value="overdue">Nur Überfällige</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {(() => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const nextWeek = new Date(today);
              nextWeek.setDate(today.getDate() + 7);

              // Filter events - EXCLUDE work schedules (except free days, limit to 3)
              let freeCount = 0;
              const upcomingEvents = events
                .filter(event => {
                  const eventDate = new Date(event.date);
                  eventDate.setHours(0, 0, 0, 0);
                  
                  // SKIP all work schedules except "off" days
                  if (event.type === 'work') {
                    const workType = (event as any).workType;
                    // Skip work days completely
                    if (workType !== 'off') return false;
                    // Only show max 3 free days
                    if (freeCount >= 3) return false;
                    const isInRange = eventDate >= today && eventDate <= nextWeek;
                    if (isInRange) freeCount++;
                    return isInRange;
                  }
                  
                  // Date filter
                  const isInRange = eventDate >= today && eventDate <= nextWeek;
                  const isNotPaid = event.status !== 'paid';
                  
                  // Type filter
                  if (upcomingFilter === 'due') {
                    return isInRange && isNotPaid && event.type === 'due';
                  } else if (upcomingFilter === 'appointment') {
                    return isInRange && event.type === 'appointment';
                  } else if (upcomingFilter === 'overdue') {
                    return event.isOverdue && isNotPaid;
                  }
                  
                  return isInRange && (isNotPaid || event.type === 'appointment');
                })
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

              // Group vacations into date ranges for display
              const upcomingVacations = vacations
                .filter(v => {
                  const start = new Date(v.startDate);
                  const end = new Date(v.endDate);
                  return end >= today && start <= nextWeek;
                })
                .slice(0, 3);

              const hasItems = upcomingEvents.length > 0 || upcomingVacations.length > 0;

              if (!hasItems) {
                return (
                  <div className="text-center py-6 text-muted-foreground">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    {upcomingFilter === 'all' 
                      ? 'Keine Einträge in den nächsten 7 Tagen'
                      : upcomingFilter === 'due'
                        ? 'Keine Rechnungen fällig'
                        : upcomingFilter === 'appointment'
                          ? 'Keine Termine'
                          : 'Keine überfälligen Einträge'}
                  </div>
                );
              }

              const formatShortDate = (d: string) => {
                const date = new Date(d);
                return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}`;
              };

              return (
                <div className="space-y-3">
                  {/* Vacations as grouped ranges */}
                  {upcomingVacations.map((vacation: any) => (
                    <div 
                      key={vacation.id} 
                      className="flex items-center justify-between p-3 rounded-lg border bg-cyan-50 dark:bg-cyan-900/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-200">
                          <Palmtree className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium">{vacation.title || 'Ferien'}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatShortDate(vacation.startDate)} - {formatShortDate(vacation.endDate)} • {vacation.personName}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Regular events (no work days) */}
                  {upcomingEvents.slice(0, 8).map(event => (
                    <div 
                      key={event.id} 
                      className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => { setSelectedEvent(event); setShowEventDialog(true); }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${getEventColor(event)}`}>
                          {getEventIcon(event)}
                        </div>
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(event.date)} {event.personName && `• ${event.personName}`}
                          </p>
                        </div>
                      </div>
                      {event.amount && (
                        <p className="font-bold">{formatAmount(event.amount)}</p>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Add Event Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Neuer Termin</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div>
              <Label>Titel *</Label>
              <Input
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="z.B. Arzttermin, Meeting..."
                className="mt-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Datum *</Label>
                <Input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Uhrzeit</Label>
                <Input
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Kategorie</Label>
                <Select value={newEvent.category} onValueChange={(v) => setNewEvent({ ...newEvent, category: v })}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Allgemein</SelectItem>
                    <SelectItem value="work">Arbeit</SelectItem>
                    <SelectItem value="personal">Persönlich</SelectItem>
                    <SelectItem value="health">Gesundheit</SelectItem>
                    <SelectItem value="finance">Finanzen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priorität</Label>
                <Select value={newEvent.priority} onValueChange={(v) => setNewEvent({ ...newEvent, priority: v })}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Niedrig</SelectItem>
                    <SelectItem value="medium">Mittel</SelectItem>
                    <SelectItem value="high">Hoch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Beschreibung</Label>
              <Textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="Optionale Beschreibung..."
                className="mt-2"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Abbrechen</Button>
            <Button onClick={handleAddEvent}>Erstellen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Day Detail Dialog */}
      <Dialog open={showDayDialog} onOpenChange={setShowDayDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedDate && formatFullDate(selectedDate)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {selectedDate && (() => {
              const dayEvents = events.filter(event => {
                const eventDate = new Date(event.date);
                return eventDate.toDateString() === selectedDate.toDateString();
              });

              return (
                <>
                  {/* Events Section */}
                  {dayEvents.length === 0 ? (
                    <div className="text-center py-4 bg-muted/30 rounded-lg">
                      <CalendarIcon className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-muted-foreground text-sm">Keine Events an diesem Tag</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">{dayEvents.length} {dayEvents.length === 1 ? 'Event' : 'Events'}</p>
                      {dayEvents.map(event => (
                        <div
                          key={event.id}
                          className={`p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors ${
                            event.isOverdue ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : ''
                          }`}
                          onClick={() => {
                            setShowDayDialog(false);
                            setSelectedEvent(event);
                            setShowEventDialog(true);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${getEventColor(event)}`}>
                                {getEventIcon(event)}
                              </div>
                              <div>
                                <h4 className="font-medium text-sm">{event.title}</h4>
                                <p className="text-xs text-muted-foreground">
                                  {getEventTypeLabel(event)}
                                  {event.personName && ` • ${event.personName}`}
                                </p>
                              </div>
                            </div>
                            {event.amount && (
                              <p className="font-semibold text-sm">{formatAmount(event.amount)}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-muted-foreground mb-3">Schnellaktionen</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        className="h-auto py-3 flex-col gap-1"
                        onClick={() => {
                          setNewEvent({ ...newEvent, date: selectedDate.toISOString().split('T')[0] });
                          setShowDayDialog(false);
                          setShowAddDialog(true);
                        }}
                      >
                        <CalendarIcon className="w-4 h-4" />
                        <span className="text-xs">Termin erstellen</span>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="h-auto py-3 flex-col gap-1"
                        onClick={() => {
                          setShowDayDialog(false);
                          setLocation('/people');
                          toast.info('Wähle eine Person und füge eine Rechnung hinzu');
                        }}
                      >
                        <FileText className="w-4 h-4" />
                        <span className="text-xs">Rechnung hinzufügen</span>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="h-auto py-3 flex-col gap-1"
                        onClick={() => {
                          setShowDayDialog(false);
                          setLocation('/finance');
                          toast.info('Erfasse eine neue Ausgabe oder Einnahme');
                        }}
                      >
                        <ArrowDownLeft className="w-4 h-4" />
                        <span className="text-xs">Ausgabe erfassen</span>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="h-auto py-3 flex-col gap-1"
                        onClick={() => {
                          setShowDayDialog(false);
                          setLocation('/reminders');
                          toast.info('Erstelle eine neue Erinnerung');
                        }}
                      >
                        <Bell className="w-4 h-4" />
                        <span className="text-xs">Erinnerung</span>
                      </Button>
                    </div>
                  </div>

                  {/* Quick Navigation */}
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-muted-foreground mb-3">Navigation</p>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => { setShowDayDialog(false); setLocation('/bills'); }}
                      >
                        Rechnungen
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => { setShowDayDialog(false); setLocation('/people'); }}
                      >
                        Personen
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => { setShowDayDialog(false); setLocation('/finance'); }}
                      >
                        Finanzen
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => { setShowDayDialog(false); setLocation('/reminders'); }}
                      >
                        Erinnerungen
                      </Button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Event Detail Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedEvent && (
                <>
                  <div className={`p-2.5 rounded-full ${getEventColor(selectedEvent)}`}>
                    {getEventIcon(selectedEvent)}
                  </div>
                  <div>
                    <span className="block">{selectedEvent.title}</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {getEventTypeLabel(selectedEvent)}
                    </span>
                  </div>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4 mt-2">
              {/* Überfällig-Warnung */}
              {selectedEvent.isOverdue && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-300 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="text-red-600 font-medium">Diese Rechnung ist überfällig!</p>
                    <p className="text-sm text-red-500">Bitte so schnell wie möglich bearbeiten.</p>
                  </div>
                </div>
              )}

              {/* Hauptinformationen */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Datum</p>
                  <p className="font-medium">{formatDate(selectedEvent.date)}</p>
                  {selectedEvent.time && (
                    <p className="text-sm text-muted-foreground">{selectedEvent.time} Uhr</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Typ</p>
                  <Badge className={getEventColor(selectedEvent)}>
                    {getEventTypeLabel(selectedEvent)}
                  </Badge>
                </div>
              </div>

              {/* Person */}
              {selectedEvent.personName && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Person</p>
                    <p className="font-medium">{selectedEvent.personName}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => {
                    setShowEventDialog(false);
                    setLocation('/people');
                  }}>
                    Zur Person
                  </Button>
                </div>
              )}

              {/* Betrag und Status */}
              {selectedEvent.amount && (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Betrag</p>
                      <p className="text-2xl font-bold">{formatAmount(selectedEvent.amount)}</p>
                    </div>
                    {selectedEvent.status && (
                      <Badge 
                        variant="outline" 
                        className={`text-base px-3 py-1 ${
                          selectedEvent.status === 'paid' ? 'text-green-600 border-green-600 bg-green-50' :
                          selectedEvent.status === 'open' ? 'text-orange-600 border-orange-600 bg-orange-50' : 
                          'text-yellow-600 border-yellow-600 bg-yellow-50'
                        }`}
                      >
                        {selectedEvent.status === 'paid' ? 'Bezahlt' :
                         selectedEvent.status === 'open' ? 'Offen' : 'Verschoben'}
                      </Badge>
                    )}
                  </div>
                  
                  {selectedEvent.direction && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-muted-foreground mb-1">Richtung</p>
                      {selectedEvent.direction === 'incoming' ? (
                        <span className="flex items-center gap-2 text-green-600">
                          <ArrowDownLeft className="w-4 h-4" /> 
                          <span>Forderung (Person schuldet mir)</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 text-red-600">
                          <ArrowUpRight className="w-4 h-4" /> 
                          <span>Verbindlichkeit (Ich schulde Person)</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Beschreibung */}
              {selectedEvent.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Beschreibung</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">{selectedEvent.description}</p>
                </div>
              )}

              {/* Status für Termine */}
              {selectedEvent.type === 'appointment' && selectedEvent.completed !== undefined && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span>Status</span>
                  <Badge variant="outline" className={selectedEvent.completed ? 'text-green-600 border-green-600' : 'text-muted-foreground'}>
                    {selectedEvent.completed ? 'Erledigt' : 'Ausstehend'}
                  </Badge>
                </div>
              )}

              {/* Quick Actions */}
              <div className="border-t pt-4 mt-4">
                <p className="text-sm font-medium text-muted-foreground mb-3">Schnellaktionen</p>
                <div className="grid grid-cols-2 gap-2">
                  {selectedEvent.type === 'due' && selectedEvent.personId && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setShowEventDialog(false);
                          setLocation('/people');
                          toast.info('Öffne Person um Rechnung zu bearbeiten');
                        }}
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Rechnung bearbeiten
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setShowEventDialog(false);
                          setLocation('/finance');
                          toast.info('Erfasse die Zahlung als Ausgabe');
                        }}
                      >
                        <ArrowUpRight className="w-4 h-4 mr-2" />
                        Als Ausgabe erfassen
                      </Button>
                    </>
                  )}
                  {selectedEvent.type === 'appointment' && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setShowEventDialog(false);
                          setLocation('/reminders');
                          toast.info('Öffne Erinnerungen zum Bearbeiten');
                        }}
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Bearbeiten
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full"
                        onClick={async () => {
                          try {
                            const reminderId = selectedEvent.id.replace('appointment-', '');
                            await updateReminder(reminderId, { status: selectedEvent.completed ? 'ausstehend' : 'erledigt' });
                            toast.success(selectedEvent.completed ? 'Als ausstehend markiert' : 'Als erledigt markiert');
                            setShowEventDialog(false);
                            fetchEvents();
                          } catch (error) {
                            toast.error('Fehler beim Aktualisieren');
                          }
                        }}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {selectedEvent.completed ? 'Als ausstehend' : 'Als erledigt'}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Navigation Links */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => { setShowEventDialog(false); setLocation('/bills'); }}
                >
                  Alle Rechnungen
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => { setShowEventDialog(false); setLocation('/people'); }}
                >
                  Personen
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => { setShowEventDialog(false); setLocation('/finance'); }}
                >
                  Finanzen
                </Button>
              </div>
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowEventDialog(false)}>
              Schliessen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Work Schedule Dialog */}
      <WorkScheduleDialog
        open={showWorkScheduleDialog}
        onOpenChange={setShowWorkScheduleDialog}
        onDataChanged={fetchEvents}
      />

      {/* Vacation Planner Dialog */}
      <VacationPlannerDialog
        open={showVacationDialog}
        onOpenChange={setShowVacationDialog}
        onDataChanged={fetchEvents}
      />
    </Layout>
  );
}
