import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import MobileLayout from '@/components/MobileLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Plus, X, AlertTriangle, Bell, Clock, CheckCircle
} from 'lucide-react';
import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { useReminders } from '@/lib/firebaseHooks';
import { toast } from 'sonner';

interface CalendarEvent {
  id: string;
  type: 'due' | 'reminder' | 'appointment' | 'work' | 'school' | 'hort' | 'school-holiday';
  title: string;
  date: string;
  time?: string;
  amount?: number;
  status?: string;
  direction?: 'incoming' | 'outgoing';
  personId?: string;
  personName?: string;
  isOverdue?: boolean;
  description?: string;
}

export default function MobileCalendar() {
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showDayDialog, setShowDayDialog] = useState(false);

  const { data: reminders = [] } = useReminders();

  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const getEventsFunc = httpsCallable(functions, 'getCalendarEvents');
      
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0);
      
      const eventsResult = await getEventsFunc({ 
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      
      const eventsData = eventsResult.data as { events: CalendarEvent[] };
      setEvents(eventsData.events || []);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching calendar events:', error);
      }
      toast.error('Fehler beim Laden der Events');
    } finally {
      setIsLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 
                      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

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

    // Previous month days
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 0);
    const daysInPrevMonth = prevMonth.getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, daysInPrevMonth - i);
      const dateStr = date.toISOString().split('T')[0];
      days.push({
        date,
        isCurrentMonth: false,
        events: events.filter(e => e.date === dateStr)
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      const dateStr = date.toISOString().split('T')[0];
      days.push({
        date,
        isCurrentMonth: true,
        events: events.filter(e => e.date === dateStr)
      });
    }

    // Next month days (fill to 42 = 6 weeks)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i);
      const dateStr = date.toISOString().split('T')[0];
      days.push({
        date,
        isCurrentMonth: false,
        events: events.filter(e => e.date === dateStr)
      });
    }

    return days;
  }, [currentDate, events]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setShowDayDialog(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventDialog(true);
  };

  const dayEvents = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = selectedDate.toISOString().split('T')[0];
    return events.filter(e => e.date === dateStr);
  }, [selectedDate, events]);

  const getEventColor = (type: string) => {
    switch (type) {
      case 'due': return 'bg-red-500';
      case 'reminder': return 'bg-blue-500';
      case 'appointment': return 'bg-green-500';
      case 'work': return 'bg-purple-500';
      case 'school': return 'bg-yellow-500';
      case 'hort': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <MobileLayout title="Kalender" showSidebar={true}>
      {/* Month Navigation */}
      <div className="mobile-card mb-4">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousMonth}
            className="h-10 min-h-[44px] px-3"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex-1 text-center">
            <h2 className="text-lg font-semibold">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextMonth}
            className="h-10 min-h-[44px] px-3"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={goToToday}
          className="w-full h-10 min-h-[44px]"
        >
          Heute
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="mobile-card">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((day, i) => (
            <div key={i} className="text-center text-xs font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        {isLoading ? (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 42 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square min-h-[44px] rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              const isTodayDate = isToday(day.date);
              return (
                <button
                  key={index}
                  onClick={() => handleDayClick(day.date)}
                  className={`
                    aspect-square min-h-[44px] p-1 rounded-lg text-sm transition-colors
                    ${!day.isCurrentMonth ? 'text-muted-foreground/40' : 'text-foreground'}
                    ${isTodayDate ? 'bg-primary text-primary-foreground font-bold' : 'hover:bg-muted'}
                  `}
                >
                  <div className="text-xs font-medium mb-1">{day.date.getDate()}</div>
                  <div className="flex flex-col gap-0.5">
                    {day.events.slice(0, 2).map((event, i) => (
                      <div
                        key={i}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(event);
                        }}
                        className={`h-1 rounded ${getEventColor(event.type)}`}
                        title={event.title}
                      />
                    ))}
                    {day.events.length > 2 && (
                      <div className="text-[10px] text-muted-foreground">
                        +{day.events.length - 2}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Day Events Dialog */}
      <Dialog open={showDayDialog} onOpenChange={setShowDayDialog}>
        <DialogContent className="!fixed !top-[50%] !left-[50%] !right-auto !bottom-auto !translate-x-[-50%] !translate-y-[-50%] !w-[85vw] !max-w-sm !max-h-fit !rounded-3xl !m-0 !overflow-visible !shadow-2xl">
          <DialogHeader className="px-5 pt-5 pb-3">
            <DialogTitle className="text-lg font-semibold">
              {selectedDate?.toLocaleDateString('de-CH', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long',
                year: 'numeric'
              })}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-2 px-5 pb-2">
            {dayEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Keine Events an diesem Tag
              </p>
            ) : (
              dayEvents.map((event) => (
                <Card key={event.id} className="cursor-pointer" onClick={() => {
                  setShowDayDialog(false);
                  handleEventClick(event);
                }}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-3 h-3 rounded-full mt-1 ${getEventColor(event.type)}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{event.title}</p>
                        {event.time && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {event.time}
                          </p>
                        )}
                        {event.personName && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {event.personName}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Event Detail Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-3">
              {selectedEvent.date && (
                <div>
                  <Label className="text-xs text-muted-foreground">Datum</Label>
                  <p className="text-sm">
                    {new Date(selectedEvent.date).toLocaleDateString('de-CH', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              )}
              
              {selectedEvent.time && (
                <div>
                  <Label className="text-xs text-muted-foreground">Uhrzeit</Label>
                  <p className="text-sm">{selectedEvent.time}</p>
                </div>
              )}
              
              {selectedEvent.description && (
                <div>
                  <Label className="text-xs text-muted-foreground">Beschreibung</Label>
                  <p className="text-sm">{selectedEvent.description}</p>
                </div>
              )}
              
              {selectedEvent.amount && (
                <div>
                  <Label className="text-xs text-muted-foreground">Betrag</Label>
                  <p className="text-sm">CHF {(selectedEvent.amount / 100).toFixed(2)}</p>
                </div>
              )}
              
              {selectedEvent.personName && (
                <div>
                  <Label className="text-xs text-muted-foreground">Person</Label>
                  <p className="text-sm">{selectedEvent.personName}</p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEventDialog(false)} className="h-10 min-h-[44px]">
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
}

