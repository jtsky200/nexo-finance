import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  AlertTriangle, Bell, Clock, CheckCircle, ArrowDownLeft, ArrowUpRight,
  FileText, Filter
} from 'lucide-react';
import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';

interface CalendarEvent {
  id: string;
  type: 'due' | 'reminder' | 'appointment';
  title: string;
  date: string;
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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'month' | 'week' | 'list'>('month');
  const [filterType, setFilterType] = useState<string>('all');

  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const getEventsFunc = httpsCallable(functions, 'getCalendarEvents');
      
      // Get events for current month +/- 1 month
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0);
      
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

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return day === 0 ? 6 : day - 1; // Convert to Monday-based
  };

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days: { date: Date; isCurrentMonth: boolean; events: CalendarEvent[] }[] = [];

    // Previous month days
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const daysInPrevMonth = getDaysInMonth(prevMonth);
    for (let i = firstDay - 1; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, daysInPrevMonth - i);
      days.push({ date, isCurrentMonth: false, events: [] });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.toDateString() === date.toDateString();
      });
      days.push({ date, isCurrentMonth: true, events: dayEvents });
    }

    // Next month days to fill the grid
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i);
      days.push({ date, isCurrentMonth: false, events: [] });
    }

    return days;
  }, [currentDate, events]);

  // Filtered events for list view
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

  // Statistics
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

  return (
    <Layout title="Kalender">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
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
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={view} onValueChange={(v: any) => setView(v)}>
              <SelectTrigger className="w-[130px]">
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
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">Gesamt</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className={stats.overdue > 0 ? 'border-red-500' : ''}>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">Überfällig</p>
              <p className={`text-2xl font-bold ${stats.overdue > 0 ? 'text-red-600' : ''}`}>{stats.overdue}</p>
            </CardContent>
          </Card>
          <Card className="border-orange-200">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">Fälligkeiten</p>
              <p className="text-2xl font-bold text-orange-600">{stats.dueThisMonth}</p>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">Erinnerungen</p>
              <p className="text-2xl font-bold text-blue-600">{stats.reminders}</p>
            </CardContent>
          </Card>
          <Card className="border-green-200">
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
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map(day => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    className={`min-h-[100px] p-2 border rounded-lg ${
                      day.isCurrentMonth ? 'bg-background' : 'bg-muted/30'
                    } ${isToday(day.date) ? 'border-primary border-2' : 'border-border'}`}
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
                          className={`text-xs px-1 py-0.5 rounded truncate ${getEventColor(event)}`}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                      {day.events.length > 3 && (
                        <div className="text-xs text-muted-foreground">
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
                      className={`flex items-center justify-between p-4 rounded-lg border ${
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
                            {event.direction && (
                              <Badge variant="outline" className="text-xs">
                                {event.direction === 'incoming' ? (
                                  <span className="flex items-center gap-1 text-green-600">
                                    <ArrowDownLeft className="w-3 h-3" /> Forderung
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-red-600">
                                    <ArrowUpRight className="w-3 h-3" /> Verbindlichkeit
                                  </span>
                                )}
                              </Badge>
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
                  <p className="text-muted-foreground">Keine Events in diesem Monat</p>
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
                      <div key={index} className="min-h-[300px]">
                        <div className={`text-center p-2 rounded-t-lg ${
                          isToday(day.date) ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}>
                          <div className="text-sm font-medium">{dayNames[index]}</div>
                          <div className="text-lg font-bold">{day.date.getDate()}</div>
                        </div>
                        <div className="border border-t-0 rounded-b-lg p-2 space-y-2 min-h-[250px]">
                          {day.events.map(event => (
                            <div
                              key={event.id}
                              className={`text-xs p-2 rounded ${getEventColor(event)}`}
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Anstehende Fälligkeiten (nächste 7 Tage)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const today = new Date();
              const nextWeek = new Date(today);
              nextWeek.setDate(today.getDate() + 7);

              const upcomingEvents = events
                .filter(event => {
                  const eventDate = new Date(event.date);
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
                    <div key={event.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${getEventColor(event)}`}>
                          {getEventIcon(event)}
                        </div>
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(event.date)} • {event.personName}
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
    </Layout>
  );
}

