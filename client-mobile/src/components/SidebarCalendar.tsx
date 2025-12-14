import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';

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

export default function SidebarCalendar() {
  const [, setLocation] = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showDayDialog, setShowDayDialog] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);

  const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 
                      'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const getEventsFunc = httpsCallable(functions, 'getCalendarEvents');
      const getVacationsFunc = httpsCallable(functions, 'getVacations');
      const getSchoolSchedulesFunc = httpsCallable(functions, 'getSchoolSchedules');
      const getSchoolHolidaysFunc = httpsCallable(functions, 'getSchoolHolidays');
      
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0);
      
      // Fetch all data in parallel
      const [eventsResult, vacationsResult, schoolSchedulesResult, schoolHolidaysResult] = await Promise.all([
        getEventsFunc({ 
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }).catch(() => ({ data: { events: [] } })),
        getVacationsFunc({ 
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }).catch(() => ({ data: { vacations: [] } })),
        getSchoolSchedulesFunc({ 
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }).catch(() => ({ data: { schedules: [] } })),
        getSchoolHolidaysFunc({ 
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }).catch(() => ({ data: { holidays: [] } }))
      ]);
      
      const eventsData = eventsResult.data as { events: CalendarEvent[] };
      const vacationsData = vacationsResult.data as { vacations: any[] };
      const schoolSchedulesData = schoolSchedulesResult.data as { schedules: any[] };
      const schoolHolidaysData = schoolHolidaysResult.data as { holidays: any[] };
      
      // Combine all events
      const allEvents: CalendarEvent[] = [
        ...(eventsData.events || []),
        ...(vacationsData.vacations || []).map((v: any) => ({
          id: `vacation-${v.id}`,
          type: 'work' as const,
          title: v.title || 'Ferien',
          date: v.startDate,
          description: v.description
        })),
        ...(schoolSchedulesData.schedules || []).map((s: any) => ({
          id: `school-${s.id}`,
          type: 'school' as const,
          title: s.childName ? `${s.childName} - Schule` : 'Schule',
          date: s.date,
          schoolType: s.type
        })),
        ...(schoolHolidaysData.holidays || []).map((h: any) => ({
          id: `holiday-${h.id}`,
          type: 'school-holiday' as const,
          title: h.title || 'Schulferien',
          date: h.date
        }))
      ];
      
      setEvents(allEvents);
    } catch (error: any) {
      const isDev = typeof (globalThis as any).process !== 'undefined' && (globalThis as any).process?.env?.NODE_ENV === 'development';
      if (isDev) {
        console.error('Error fetching calendar events:', error);
      }
      // Silently fail - don't show error toast in sidebar
    } finally {
      setIsLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

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
    <>
      <div className="p-3 border-b border-border">
        {/* Month Navigation - Kompakter */}
        <div className="flex items-center justify-between mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPreviousMonth}
            className="h-6 w-6 p-0 min-w-0"
          >
            <ChevronLeft className="w-3 h-3" />
          </Button>
          
          <div className="flex-1 text-center">
            <h3 className="text-xs font-semibold">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextMonth}
            className="h-6 w-6 p-0 min-w-0"
          >
            <ChevronRight className="w-3 h-3" />
          </Button>
        </div>

        {/* Day Headers - Kompakter */}
        <div className="grid grid-cols-7 gap-0 mb-0.5">
          {dayNames.map((day, i) => (
            <div key={i} className="text-center text-[9px] font-medium text-muted-foreground py-0.5">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid - Viel kompakter */}
        <div className="grid grid-cols-7 gap-0.5">
          {calendarDays.map((day, index) => {
            const isTodayDate = isToday(day.date);
            return (
              <button
                key={index}
                onClick={() => handleDayClick(day.date)}
                className={cn(
                  "aspect-square min-h-[20px] max-h-[24px] p-0 rounded-sm transition-colors flex flex-col items-center justify-center relative",
                  !day.isCurrentMonth ? 'text-muted-foreground/20' : 'text-foreground',
                  isTodayDate ? 'bg-primary text-primary-foreground font-semibold' : 'hover:bg-muted/50'
                )}
              >
                <span className="text-[10px] leading-none">{day.date.getDate()}</span>
                {day.events.length > 0 && (
                  <div className="absolute bottom-0.5 left-0 right-0 flex gap-0.5 justify-center">
                    {day.events.slice(0, 2).map((event, i) => (
                      <div
                        key={i}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(event);
                        }}
                        className={cn("h-0.5 w-0.5 rounded-full", getEventColor(event.type))}
                        title={event.title}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Today Button - Kompakter */}
        <Button
          variant="ghost"
          size="sm"
          onClick={goToToday}
          className="w-full h-7 mt-1.5 text-[10px]"
        >
          Heute
        </Button>
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
                      <div className={cn("w-3 h-3 rounded-full mt-1 flex-shrink-0", getEventColor(event.type))} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{event.title}</p>
                        {event.time && (
                          <p className="text-xs text-muted-foreground mt-1">
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
          
          <DialogFooter className="px-5 pb-3 pt-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDayDialog(false);
                setLocation('/calendar');
              }}
              className="h-11 min-h-[44px] w-full rounded-xl text-sm font-medium"
            >
              Zum Kalender
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowDayDialog(false)}
              className="h-11 min-h-[44px] w-full rounded-xl text-sm font-medium"
            >
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Details Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="!fixed !top-[50%] !left-[50%] !right-auto !bottom-auto !translate-x-[-50%] !translate-y-[-50%] !w-[85vw] !max-w-sm !max-h-fit !rounded-3xl !m-0 !overflow-visible !shadow-2xl">
          <DialogHeader className="px-5 pt-5 pb-3">
            <DialogTitle className="text-lg font-semibold">
              {selectedEvent?.title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 px-5 pb-2">
            {selectedEvent?.date && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Datum</p>
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
            {selectedEvent?.time && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Uhrzeit</p>
                <p className="text-sm">{selectedEvent.time}</p>
              </div>
            )}
            {selectedEvent?.description && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Beschreibung</p>
                <p className="text-sm">{selectedEvent.description}</p>
              </div>
            )}
            {selectedEvent?.personName && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Person</p>
                <p className="text-sm">{selectedEvent.personName}</p>
              </div>
            )}
            {selectedEvent?.amount && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Betrag</p>
                <p className="text-sm">CHF {selectedEvent.amount.toFixed(2)}</p>
              </div>
            )}
          </div>
          
          <DialogFooter className="px-5 pb-3 pt-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowEventDialog(false);
                setLocation('/calendar');
              }}
              className="h-11 min-h-[44px] w-full rounded-xl text-sm font-medium"
            >
              Zum Kalender
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowEventDialog(false)}
              className="h-11 min-h-[44px] w-full rounded-xl text-sm font-medium"
            >
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
