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
  FileText, Filter, Plus, X, Edit2, Trash2, RefreshCw, Eye
} from 'lucide-react';
import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { useReminders, createReminder, updateReminder, deleteReminder } from '@/lib/firebaseHooks';
import { toast } from 'sonner';
import { useLocation } from 'wouter';

interface CalendarEvent {
  id: string;
  type: 'due' | 'reminder' | 'appointment';
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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showDayDialog, setShowDayDialog] = useState(false);

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
      
      // Get events for a wider range
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 3, 0);
      
      const result = await getEventsFunc({ 
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      
      const data = result.data as { events: CalendarEvent[] };
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
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

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days: { date: Date; isCurrentMonth: boolean; events: CalendarEvent[] }[] = [];

    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const daysInPrevMonth = getDaysInMonth(prevMonth);
    for (let i = firstDay - 1; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, daysInPrevMonth - i);
      days.push({ date, isCurrentMonth: false, events: [] });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.toDateString() === date.toDateString();
      });
      days.push({ date, isCurrentMonth: true, events: dayEvents });
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i);
      days.push({ date, isCurrentMonth: false, events: [] });
    }

    return days;
  }, [currentDate, events]);

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
    if (event.isOverdue) return 'bg-red-500 text-white';
    if (event.type === 'due') return 'bg-orange-500 text-white';
    if (event.type === 'reminder') return 'bg-blue-500 text-white';
    if (event.type === 'appointment') return 'bg-green-500 text-white';
    return 'bg-gray-500 text-white';
  };

  const getEventIcon = (event: CalendarEvent) => {
    if (event.isOverdue) return <AlertTriangle className="w-4 h-4" />;
    if (event.type === 'due') return <Clock className="w-4 h-4" />;
    if (event.type === 'reminder') return <Bell className="w-4 h-4" />;
    if (event.type === 'appointment') return <CalendarIcon className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
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
          
          <div className="flex items-center gap-2">
            <Button onClick={() => {
              setNewEvent({ ...newEvent, date: new Date().toISOString().split('T')[0] });
              setShowAddDialog(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Neuer Termin
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
              <SelectTrigger className="w-[140px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="due">Fälligkeiten</SelectItem>
                <SelectItem value="reminder">Erinnerungen</SelectItem>
                <SelectItem value="appointment">Termine</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <Card className="cursor-pointer hover:border-primary" onClick={() => setFilterType('all')}>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">Gesamt</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className={`cursor-pointer hover:border-primary ${stats.overdue > 0 ? 'border-red-500' : ''}`}>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">Überfällig</p>
              <p className={`text-2xl font-bold ${stats.overdue > 0 ? 'text-red-600' : ''}`}>{stats.overdue}</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary border-orange-200" onClick={() => setFilterType('due')}>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">Fälligkeiten</p>
              <p className="text-2xl font-bold text-orange-600">{stats.dueThisMonth}</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary border-blue-200" onClick={() => setFilterType('reminder')}>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">Erinnerungen</p>
              <p className="text-2xl font-bold text-blue-600">{stats.reminders}</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary border-green-200" onClick={() => setFilterType('appointment')}>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">Termine</p>
              <p className="text-2xl font-bold text-green-600">{stats.appointments}</p>
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
                      {day.events.slice(0, 3).map(event => (
                        <div
                          key={event.id}
                          onClick={(e) => handleEventClick(event, e)}
                          className={`text-xs px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80 ${getEventColor(event)}`}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                      {day.events.length > 3 && (
                        <div className="text-xs text-muted-foreground font-medium">
                          +{day.events.length - 3} mehr
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
                      className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer hover:bg-accent transition-colors ${
                        event.isOverdue ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${getEventColor(event)}`}>
                          {getEventIcon(event)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{event.title}</h4>
                            {event.isOverdue && (
                              <Badge className="bg-red-500 text-white">Überfällig</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{formatDate(event.date)}</span>
                            {event.personName && (
                              <>
                                <span>•</span>
                                <span>{event.personName}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {event.amount && (
                        <div className="text-right">
                          <p className="font-bold">{formatAmount(event.amount)}</p>
                          {event.status && (
                            <Badge variant="outline" className={
                              event.status === 'paid' ? 'text-green-600' :
                              event.status === 'open' ? 'text-red-600' : 'text-orange-600'
                            }>
                              {event.status === 'paid' ? 'Bezahlt' :
                               event.status === 'open' ? 'Offen' : 'Verschoben'}
                            </Badge>
                          )}
                        </div>
                      )}
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
              Anstehende Fälligkeiten (nächste 7 Tage)
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setLocation('/bills')}>
              Alle Rechnungen
            </Button>
          </CardHeader>
          <CardContent>
            {(() => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const nextWeek = new Date(today);
              nextWeek.setDate(today.getDate() + 7);

              const upcomingEvents = events
                .filter(event => {
                  const eventDate = new Date(event.date);
                  eventDate.setHours(0, 0, 0, 0);
                  return eventDate >= today && eventDate <= nextWeek && event.status !== 'paid';
                })
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

              if (upcomingEvents.length === 0) {
                return (
                  <div className="text-center py-6 text-muted-foreground">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    Keine Fälligkeiten in den nächsten 7 Tagen
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {upcomingEvents.slice(0, 5).map(event => (
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
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Neuer Termin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedDate && formatFullDate(selectedDate)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedDate && (() => {
              const dayEvents = events.filter(event => {
                const eventDate = new Date(event.date);
                return eventDate.toDateString() === selectedDate.toDateString();
              });

              if (dayEvents.length === 0) {
                return (
                  <div className="text-center py-8">
                    <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground mb-4">Keine Events an diesem Tag</p>
                    <Button onClick={() => {
                      setNewEvent({ ...newEvent, date: selectedDate.toISOString().split('T')[0] });
                      setShowDayDialog(false);
                      setShowAddDialog(true);
                    }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Termin erstellen
                    </Button>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {dayEvents.map(event => (
                    <div
                      key={event.id}
                      className={`p-4 rounded-lg border cursor-pointer hover:bg-accent transition-colors ${
                        event.isOverdue ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''
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
                            <h4 className="font-medium">{event.title}</h4>
                            {event.personName && (
                              <p className="text-sm text-muted-foreground">{event.personName}</p>
                            )}
                          </div>
                        </div>
                        {event.amount && (
                          <p className="font-bold">{formatAmount(event.amount)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setNewEvent({ ...newEvent, date: selectedDate.toISOString().split('T')[0] });
                      setShowDayDialog(false);
                      setShowAddDialog(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Weiteren Termin hinzufügen
                  </Button>
                </div>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Event Detail Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEvent && (
                <>
                  <div className={`p-2 rounded-full ${getEventColor(selectedEvent)}`}>
                    {getEventIcon(selectedEvent)}
                  </div>
                  {selectedEvent.title}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Datum</p>
                  <p className="font-medium">{formatDate(selectedEvent.date)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Typ</p>
                  <Badge className={getEventColor(selectedEvent)}>
                    {selectedEvent.type === 'due' ? 'Fälligkeit' :
                     selectedEvent.type === 'reminder' ? 'Erinnerung' : 'Termin'}
                  </Badge>
                </div>
              </div>

              {selectedEvent.personName && (
                <div>
                  <p className="text-sm text-muted-foreground">Person</p>
                  <p className="font-medium">{selectedEvent.personName}</p>
                </div>
              )}

              {selectedEvent.amount && (
                <div>
                  <p className="text-sm text-muted-foreground">Betrag</p>
                  <p className="text-xl font-bold">{formatAmount(selectedEvent.amount)}</p>
                </div>
              )}

              {selectedEvent.status && (
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant="outline" className={
                    selectedEvent.status === 'paid' ? 'text-green-600' :
                    selectedEvent.status === 'open' ? 'text-red-600' : 'text-orange-600'
                  }>
                    {selectedEvent.status === 'paid' ? 'Bezahlt' :
                     selectedEvent.status === 'open' ? 'Offen' : 'Verschoben'}
                  </Badge>
                </div>
              )}

              {selectedEvent.direction && (
                <div>
                  <p className="text-sm text-muted-foreground">Richtung</p>
                  <Badge variant="outline">
                    {selectedEvent.direction === 'incoming' ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <ArrowDownLeft className="w-3 h-3" /> Forderung
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600">
                        <ArrowUpRight className="w-3 h-3" /> Verbindlichkeit
                      </span>
                    )}
                  </Badge>
                </div>
              )}

              {selectedEvent.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Beschreibung</p>
                  <p>{selectedEvent.description}</p>
                </div>
              )}

              {selectedEvent.isOverdue && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200">
                  <p className="text-red-600 font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Diese Rechnung ist überfällig!
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowEventDialog(false)}>Schliessen</Button>
            <Button onClick={() => navigateToEvent(selectedEvent!)}>
              <Eye className="w-4 h-4 mr-2" />
              Details anzeigen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
