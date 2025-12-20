import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Cloud, CloudRain, Sun, CloudSun, Wind, CalendarPlus, Bell, Wallet, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import WeatherWidget from './WeatherWidget';
import { useWeather, useUserSettings, useReminders, createReminder, createFinanceEntry } from '@/lib/firebaseHooks';
import { normalizeEventDate, formatDateLocal, formatTime, formatDateGerman, parseDateGerman } from '@/lib/dateTimeUtils';

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
  const [showCreateReminderModal, setShowCreateReminderModal] = useState(false);
  const [showCreateFinanceModal, setShowCreateFinanceModal] = useState(false);
  
  // Date display states for German format (DD.MM.YYYY)
  const [reminderDateDisplay, setReminderDateDisplay] = useState(formatDateGerman(new Date()));
  const [financeDateDisplay, setFinanceDateDisplay] = useState(formatDateGerman(new Date()));
  
  // Get reminders directly
  const { data: reminders = [] } = useReminders();
  
  // Get weather data for selected date - normalize to avoid timezone issues
  const { settings } = useUserSettings();
  const location = settings?.weatherLocation || 'Zurich, CH';
  const weatherDate = selectedDate ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()) : null;
  const { data: weather, isLoading: weatherLoading } = useWeather(weatherDate, location);
  
  // Set today as default selected date
  useEffect(() => {
    if (!selectedDate) {
      // Normalize to midnight in local timezone
      const today = new Date();
      const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      setSelectedDate(normalizedToday);
    }
  }, []);

  const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 
                      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
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

  // Get start of week (Monday)
  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - (day === 0 ? 6 : day - 1); // Adjust to Monday
    return new Date(d.setDate(diff));
  };

  // Get week days (Monday to Sunday)
  const weekDays = useMemo(() => {
    const startOfWeek = getStartOfWeek(currentDate);
    const days: { date: Date; events: CalendarEvent[] }[] = [];
    
    // Helper function to get events for a date (including reminders)
    const getEventsForDate = (date: Date): CalendarEvent[] => {
      const dateStr = formatDateLocal(date);
      
      // Filter events
      const filtered = events.filter(e => {
        if (!e.date) return false;
        let eventDateStr = normalizeEventDate(e.date);
        if (!eventDateStr && typeof e.date === 'string') {
          const datePart = e.date.split('T')[0];
          if (datePart.match(/^\d{4}-\d{2}-\d{2}/)) {
            eventDateStr = datePart;
          }
        }
        return eventDateStr === dateStr;
      });
      
      // Also check reminders
      const remindersForDate = reminders.filter(r => {
        if (!r.dueDate) return false;
        let dueDateObj: Date;
        if (r.dueDate instanceof Date) {
          dueDateObj = r.dueDate;
        } else if (typeof r.dueDate === 'string') {
          dueDateObj = new Date(r.dueDate);
        } else {
          return false;
        }
        if (isNaN(dueDateObj.getTime())) return false;
        const reminderDateStr = formatDateLocal(dueDateObj);
        return reminderDateStr === dateStr;
      });
      
      // Convert reminders to events
      const reminderEvents: CalendarEvent[] = remindersForDate.map(r => {
        let eventType: CalendarEvent['type'] = 'appointment';
        if (r.type === 'termin') {
          eventType = 'appointment';
        } else if (r.type === 'zahlung') {
          eventType = 'due';
        } else if (r.type === 'aufgabe') {
          eventType = 'reminder';
        }
        
        let dueDateObj: Date;
        if (r.dueDate instanceof Date) {
          dueDateObj = r.dueDate;
        } else if (typeof r.dueDate === 'string') {
          dueDateObj = new Date(r.dueDate);
        } else {
          throw new Error(`Invalid dueDate for reminder ${r.id}`);
        }
        
        return {
          id: `reminder-${r.id}`,
          type: eventType,
          title: r.title,
          date: formatDateLocal(dueDateObj),
          time: r.isAllDay ? undefined : formatTime(dueDateObj),
          description: r.notes || undefined,
          status: r.status
        };
      });
      
      // Merge and avoid duplicates
      const allEvents = [...filtered];
      for (const reminderEvent of reminderEvents) {
        if (!allEvents.some(e => e.id === reminderEvent.id)) {
          allEvents.push(reminderEvent);
        }
      }
      
      return allEvents;
    };
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dayEvents = getEventsForDate(date);
      days.push({
        date,
        events: dayEvents
      });
    }
    
    return days;
  }, [currentDate, events, reminders]);

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const handleDayClick = (date: Date) => {
    // Create a new date object at midnight to avoid timezone issues
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    console.log('[SidebarCalendar] handleDayClick:', {
      originalDate: date.toISOString(),
      normalizedDate: normalizedDate.toISOString(),
      dateStr: formatDateLocal(normalizedDate)
    });
    setSelectedDate(normalizedDate);
    setShowDayDialog(true);
  };

  // Update selected date when clicking on a day (without opening dialog)
  const handleDaySelect = (date: Date) => {
    // Normalize to midnight in local timezone to avoid timezone issues
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    setSelectedDate(normalizedDate);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventDialog(true);
  };

  const dayEvents = useMemo(() => {
    if (!selectedDate) {
      console.log('[SidebarCalendar] dayEvents - no selectedDate');
      return [];
    }
    
    // Normalize selectedDate to midnight in local timezone
    const normalizedSelectedDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    // Format as YYYY-MM-DD using GLOBAL utility (LOCAL timezone)
    const dateStr = formatDateLocal(normalizedSelectedDate);
    
    console.log('[SidebarCalendar] dayEvents filter - START:', {
      selectedDate: selectedDate.toISOString(),
      normalizedSelectedDate: normalizedSelectedDate.toISOString(),
      dateStr,
      totalEvents: events.length,
      totalReminders: reminders.length
    });
    
    // Filter events from events array
    const filtered = events.filter(e => {
      if (!e.date) {
        console.log('[SidebarCalendar] Event skipped - no date:', e.title);
        return false;
      }
      
      // Normalize event date using GLOBAL utility (LOCAL timezone)
      let eventDateStr = normalizeEventDate(e.date);
      
      // Fallback: if normalization fails, try to extract date from ISO string
      if (!eventDateStr && typeof e.date === 'string') {
        const datePart = e.date.split('T')[0];
        if (datePart.match(/^\d{4}-\d{2}-\d{2}/)) {
          eventDateStr = datePart;
          console.log('[SidebarCalendar] Using fallback date extraction for filter:', eventDateStr);
        }
      }
      
      if (!eventDateStr) {
        console.log('[SidebarCalendar] Event skipped - invalid date:', e.title, e.date);
        return false;
      }
      
      const matches = eventDateStr === dateStr;
      
      if (matches) {
        console.log('[SidebarCalendar] Event matched:', {
          eventTitle: e.title,
          eventDate: e.date,
          eventDateStr,
          selectedDateStr: dateStr
        });
      }
      
      return matches;
    });
    
    // ALWAYS check reminders directly as well
    const remindersForDate = reminders.filter(r => {
      if (!r.dueDate) return false;
      
      // Convert dueDate to Date if it's a string
      let dueDateObj: Date;
      if (r.dueDate instanceof Date) {
        dueDateObj = r.dueDate;
      } else if (typeof r.dueDate === 'string') {
        dueDateObj = new Date(r.dueDate);
      } else {
        return false;
      }
      
      if (isNaN(dueDateObj.getTime())) return false;
      
      const reminderDateStr = formatDateLocal(dueDateObj);
      return reminderDateStr === dateStr;
    });
    
    console.log('[SidebarCalendar] Reminders for date:', {
      dateStr,
      remindersForDate: remindersForDate.length,
      reminders: remindersForDate.map(r => ({ id: r.id, title: r.title, dueDate: r.dueDate }))
    });
    
    // Convert reminders to events and merge with filtered events
    const reminderEvents: CalendarEvent[] = remindersForDate.map(r => {
      // Map reminder types to calendar event types
      let eventType: CalendarEvent['type'] = 'appointment';
      if (r.type === 'termin') {
        eventType = 'appointment';
      } else if (r.type === 'zahlung') {
        eventType = 'due';
      } else if (r.type === 'aufgabe') {
        eventType = 'reminder';
      }
      
      // Convert dueDate to Date if it's a string
      let dueDateObj: Date;
      if (r.dueDate instanceof Date) {
        dueDateObj = r.dueDate;
      } else if (typeof r.dueDate === 'string') {
        dueDateObj = new Date(r.dueDate);
      } else {
        throw new Error(`Invalid dueDate for reminder ${r.id}`);
      }
      
      return {
        id: `reminder-${r.id}`,
        type: eventType,
        title: r.title,
        date: formatDateLocal(dueDateObj),
        time: r.isAllDay ? undefined : formatTime(dueDateObj),
        description: r.notes || undefined,
        status: r.status
      };
    });
    
    // Merge filtered events with reminder events, avoiding duplicates
    const allDayEvents = [...filtered];
    for (const reminderEvent of reminderEvents) {
      if (!allDayEvents.some(e => e.id === reminderEvent.id)) {
        allDayEvents.push(reminderEvent);
      }
    }
    
    console.log('[SidebarCalendar] dayEvents filter - RESULT:', {
      selectedDate: normalizedSelectedDate.toISOString(),
      dateStr,
      filteredFromEvents: filtered.length,
      fromReminders: reminderEvents.length,
      totalDayEvents: allDayEvents.length,
      allDayEvents: allDayEvents.map(e => ({ 
        id: e.id,
        title: e.title, 
        date: e.date,
        type: e.type 
      }))
    });
    
    return allDayEvents;
  }, [selectedDate, events, reminders]);

  const getEventColor = (type: string) => {
    switch (type) {
      case 'due': return 'bg-pink-500'; // Rechnungen - pink
      case 'reminder': 
      case 'appointment': 
      case 'termin': return 'bg-orange-500'; // Termine - orange
      case 'work': return 'bg-slate-400'; // Arbeit - light grey/blue
      case 'vacation': 
      case 'frei': return 'bg-emerald-400'; // Frei - mint green
      case 'school-holiday': return 'bg-sky-400'; // Ferien - light blue
      case 'school': return 'bg-purple-400'; // Schule - light purple
      case 'hort': return 'bg-fuchsia-500'; // Hort - hot pink
      default: return 'bg-gray-500';
    }
  };

  return (
    <>
      <div className="p-2 border-b border-border">
        {/* Week Navigation - Kompakter */}
        <div className="flex items-center justify-between mb-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPreviousWeek}
            className="h-5 w-5 p-0 min-w-0"
          >
            <ChevronLeft className="w-3 h-3" />
          </Button>
          
          <div className="flex-1 text-center px-1">
            <h3 className="text-[11px] font-semibold leading-tight">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextWeek}
            className="h-5 w-5 p-0 min-w-0"
          >
            <ChevronRight className="w-3 h-3" />
          </Button>
        </div>

        {/* Day Headers and Dates - Kompakt und perfekt ausgerichtet, enger zusammen */}
        <div className="grid grid-cols-7 gap-0">
          {dayNames.map((day, i) => {
            const dayData = weekDays[i];
            const isTodayDate = dayData ? isToday(dayData.date) : false;
            return (
              <div key={i} className="flex flex-col items-center">
                {/* Day Header */}
                <div className="text-center text-[10px] font-medium text-muted-foreground mb-1 w-full">
                  {day}
                </div>
                {/* Date Button */}
                {dayData && (
                  <button
                    onClick={() => {
                      handleDaySelect(dayData.date);
                      handleDayClick(dayData.date);
                    }}
                    className={cn(
                      "w-full aspect-square min-h-[28px] max-h-[30px] rounded-sm transition-colors flex flex-col items-center justify-center relative",
                      'text-foreground',
                      selectedDate && dayData.date.toDateString() === selectedDate.toDateString() 
                        ? 'bg-primary/20 ring-1 ring-primary' 
                        : isTodayDate 
                        ? 'bg-primary text-primary-foreground font-semibold' 
                        : 'hover:bg-muted/50'
                    )}
                  >
                    <span className="text-[12px] leading-none font-medium">{dayData.date.getDate()}</span>
                    {dayData.events.length > 0 && (
                      <div className="absolute bottom-0.5 left-0 right-0 flex gap-0.5 justify-center">
                        {dayData.events.slice(0, 2).map((event, j) => (
                          <div
                            key={j}
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
                )}
              </div>
            );
          })}
        </div>

        {/* Today Button - Kompakter */}
        <Button
          variant="ghost"
          size="sm"
          onClick={goToToday}
          className="w-full h-6 mt-1.5 text-[10px]"
        >
          Heute
        </Button>
      </div>

      {/* Weather Widget - Zeigt Wetter für ausgewählten Tag */}
      <WeatherWidget selectedDate={selectedDate} />

      {/* Day Events Dialog */}
      <Dialog open={showDayDialog} onOpenChange={setShowDayDialog}>
        <DialogContent className="!fixed !top-[50%] !left-[50%] !right-auto !bottom-auto !translate-x-[-50%] !translate-y-[-50%] !w-[85vw] !max-w-sm !max-h-[85vh] !rounded-3xl !m-0 !overflow-y-auto !shadow-2xl">
          <DialogHeader className="px-5 pt-5 pb-3 sticky top-0 bg-background z-10 border-b border-border">
            <DialogDescription className="sr-only">
              Details für den ausgewählten Tag mit Wetter, Terminen und Schnellaktionen
            </DialogDescription>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold">
                {selectedDate?.toLocaleDateString('de-CH', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long',
                  year: 'numeric'
                })}
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDayDialog(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="space-y-4 px-5 pb-2">
            {/* Weather Section */}
            <div className="bg-muted/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Cloud className="w-4 h-4" />
                  Wetter
                </h3>
              </div>
              
              {weatherLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="text-xs text-muted-foreground">Lädt Wetterdaten...</div>
                </div>
              ) : weather ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    {weather.icon === 'sun' && <Sun className="w-6 h-6 text-yellow-500" />}
                    {weather.icon === 'cloud-sun' && <CloudSun className="w-6 h-6 text-gray-500" />}
                    {weather.icon === 'cloud' && <Cloud className="w-6 h-6 text-gray-500" />}
                    {weather.icon === 'rain' && <CloudRain className="w-6 h-6 text-blue-500" />}
                    <div className="flex-1">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">{weather.temperature}°</span>
                        <span className="text-sm text-muted-foreground">C</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{weather.condition}</div>
                    </div>
                  </div>
                  
                  {(weather.humidity !== undefined || weather.windSpeed !== undefined) && (
                    <div className="flex gap-4 text-xs text-muted-foreground pt-2 border-t border-border/50">
                      {weather.windSpeed !== undefined && (
                        <div className="flex items-center gap-1">
                          <Wind className="w-3 h-3" />
                          <span>{weather.windSpeed} km/h</span>
                        </div>
                      )}
                      {weather.humidity !== undefined && (
                        <div>
                          <span>Luftfeuchtigkeit: {weather.humidity}%</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground text-center py-2">
                  Keine Wetterdaten verfügbar
                </div>
              )}
            </div>

            {/* Events Section */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Termine & Events</h3>
              {dayEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4 bg-muted/30 rounded-lg">
                  Keine Events an diesem Tag
                </p>
              ) : (
                <div className="space-y-2">
                  {dayEvents.map((event) => (
                    <Card key={event.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => {
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
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Schnellaktionen</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateReminderModal(true);
                  }}
                  className="h-auto py-3 flex flex-col items-center gap-2 rounded-xl"
                >
                  <CalendarPlus className="w-5 h-5" />
                  <span className="text-xs">Termin erstellen</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateFinanceModal(true);
                  }}
                  className="h-auto py-3 flex flex-col items-center gap-2 rounded-xl"
                >
                  <Wallet className="w-5 h-5" />
                  <span className="text-xs">Finanz-Eintrag</span>
                </Button>
              </div>
            </div>
          </div>
          
          <DialogFooter className="px-5 pb-3 pt-2 sticky bottom-0 bg-background border-t border-border">
            <Button 
              variant="outline" 
              onClick={() => {
                try {
                  setShowDayDialog(false);
                  // Small delay to ensure dialog closes before navigation
                  setTimeout(() => {
                    try {
                      setLocation('/calendar');
                    } catch (error) {
                      console.error('Navigation error:', error);
                      toast.error('Fehler beim Navigieren zum Kalender');
                    }
                  }, 100);
                } catch (error) {
                  console.error('Dialog close error:', error);
                  toast.error('Fehler beim Schliessen des Dialogs');
                }
              }}
              className="h-11 min-h-[44px] flex-1 rounded-xl text-sm font-medium"
            >
              Zum Kalender
            </Button>
            <Button 
              variant="default" 
              onClick={() => setShowDayDialog(false)}
              className="h-11 min-h-[44px] flex-1 rounded-xl text-sm font-medium"
            >
              Schliessen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Reminder Modal */}
      <Dialog open={showCreateReminderModal} onOpenChange={(open) => {
        setShowCreateReminderModal(open);
        if (open) {
          // Update date when dialog opens
          const dateToUse = selectedDate || new Date();
          setReminderDateDisplay(formatDateGerman(dateToUse));
        }
      }}>
        <DialogContent className="!fixed !top-[50%] !left-[50%] !right-auto !bottom-auto !translate-x-[-50%] !translate-y-[-50%] !w-[85vw] !max-w-sm !max-h-fit !rounded-3xl !m-0 !overflow-visible !shadow-2xl">
          <DialogHeader className="px-5 pt-5 pb-3">
            <DialogTitle className="text-lg font-semibold">Termin erstellen</DialogTitle>
            <DialogDescription className="sr-only">
              Erstellen Sie einen neuen Termin mit Titel, Datum, Uhrzeit und optionalen Notizen
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-5 pb-2 space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Titel</label>
              <input
                type="text"
                id="reminder-title"
                placeholder="z.B. Arzttermin"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Datum</label>
              <input
                type="text"
                id="reminder-date"
                placeholder="DD.MM.YYYY"
                value={reminderDateDisplay}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  setReminderDateDisplay(inputValue);
                }}
                onBlur={(e) => {
                  // Validate and format on blur
                  const parsed = parseDateGerman(e.target.value);
                  if (parsed) {
                    setReminderDateDisplay(formatDateGerman(parsed));
                  } else if (e.target.value && selectedDate) {
                    // If invalid, use selectedDate
                    setReminderDateDisplay(formatDateGerman(selectedDate));
                  }
                }}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Uhrzeit (optional)</label>
              <input
                type="time"
                id="reminder-time"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Notizen (optional)</label>
              <textarea
                id="reminder-notes"
                placeholder="Weitere Details..."
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm resize-none"
              />
            </div>
          </div>
          
          <DialogFooter className="px-5 pb-3 pt-2">
            <Button 
              variant="outline" 
              onClick={() => setShowCreateReminderModal(false)}
              className="h-11 min-h-[44px] flex-1 rounded-xl text-sm font-medium"
            >
              Abbrechen
            </Button>
            <Button 
              variant="default" 
              onClick={async () => {
                try {
                  const titleInput = document.getElementById('reminder-title') as HTMLInputElement;
                  const dateInput = document.getElementById('reminder-date') as HTMLInputElement;
                  const timeInput = document.getElementById('reminder-time') as HTMLInputElement;
                  const notesInput = document.getElementById('reminder-notes') as HTMLTextAreaElement;
                  
                  if (!titleInput.value.trim()) {
                    toast.error('Bitte gib einen Titel ein');
                    return;
                  }
                  
                  // Parse German date format (DD.MM.YYYY)
                  const parsedDate = parseDateGerman(dateInput.value);
                  if (!parsedDate) {
                    toast.error('Bitte gib ein gültiges Datum ein (DD.MM.YYYY)');
                    return;
                  }
                  
                  const dueDate = new Date(parsedDate);
                  if (timeInput.value) {
                    const [hours, minutes] = timeInput.value.split(':');
                    dueDate.setHours(parseInt(hours), parseInt(minutes));
                  } else {
                    dueDate.setHours(12, 0); // Default to noon if no time specified
                  }
                  
                  await createReminder({
                    title: titleInput.value.trim(),
                    type: 'termin',
                    dueDate: dueDate,
                    isAllDay: !timeInput.value,
                    notes: notesInput.value.trim() || null,
                  });
                  
                  toast.success('Termin erstellt');
                  setShowCreateReminderModal(false);
                  setShowDayDialog(false);
                  fetchEvents();
                } catch (error: any) {
                  toast.error(error.message || 'Fehler beim Erstellen des Termins');
                }
              }}
              className="h-11 min-h-[44px] flex-1 rounded-xl text-sm font-medium"
            >
              Erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Finance Entry Modal */}
      <Dialog open={showCreateFinanceModal} onOpenChange={(open) => {
        setShowCreateFinanceModal(open);
        if (open) {
          // Update date when dialog opens
          const dateToUse = selectedDate || new Date();
          setFinanceDateDisplay(formatDateGerman(dateToUse));
        }
      }}>
        <DialogContent className="!fixed !top-[50%] !left-[50%] !right-auto !bottom-auto !translate-x-[-50%] !translate-y-[-50%] !w-[85vw] !max-w-sm !max-h-fit !rounded-3xl !m-0 !overflow-visible !shadow-2xl">
          <DialogHeader className="px-5 pt-5 pb-3">
            <DialogTitle className="text-lg font-semibold">Finanz-Eintrag erstellen</DialogTitle>
            <DialogDescription className="sr-only">
              Erstellen Sie einen neuen Finanz-Eintrag mit Beschreibung, Betrag, Typ und Datum
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-5 pb-2 space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Beschreibung</label>
              <input
                type="text"
                id="finance-description"
                placeholder="z.B. Einkauf, Gehalt"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Betrag (CHF)</label>
              <input
                type="number"
                id="finance-amount"
                placeholder="0.00"
                step="0.01"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Typ</label>
              <select
                id="finance-type"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm"
              >
                <option value="einnahme">Einnahme</option>
                <option value="ausgabe">Ausgabe</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Datum</label>
              <input
                type="text"
                id="finance-date"
                placeholder="DD.MM.YYYY"
                value={financeDateDisplay}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  setFinanceDateDisplay(inputValue);
                }}
                onBlur={(e) => {
                  // Validate and format on blur
                  const parsed = parseDateGerman(e.target.value);
                  if (parsed) {
                    setFinanceDateDisplay(formatDateGerman(parsed));
                  } else if (e.target.value && selectedDate) {
                    // If invalid, use selectedDate
                    setFinanceDateDisplay(formatDateGerman(selectedDate));
                  }
                }}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm"
              />
            </div>
          </div>
          
          <DialogFooter className="px-5 pb-3 pt-2">
            <Button 
              variant="outline" 
              onClick={() => setShowCreateFinanceModal(false)}
              className="h-11 min-h-[44px] flex-1 rounded-xl text-sm font-medium"
            >
              Abbrechen
            </Button>
            <Button 
              variant="default" 
              onClick={async () => {
                try {
                  const descriptionInput = document.getElementById('finance-description') as HTMLInputElement;
                  const amountInput = document.getElementById('finance-amount') as HTMLInputElement;
                  const typeInput = document.getElementById('finance-type') as HTMLSelectElement;
                  const dateInput = document.getElementById('finance-date') as HTMLInputElement;
                  
                  if (!descriptionInput.value.trim()) {
                    toast.error('Bitte gib eine Beschreibung ein');
                    return;
                  }
                  
                  // Parse German date format (DD.MM.YYYY)
                  const parsedDate = parseDateGerman(dateInput.value);
                  if (!parsedDate) {
                    toast.error('Bitte gib ein gültiges Datum ein (DD.MM.YYYY)');
                    return;
                  }
                  
                  if (!amountInput.value || parseFloat(amountInput.value) <= 0) {
                    toast.error('Bitte gib einen gültigen Betrag ein');
                    return;
                  }
                  
                  await createFinanceEntry({
                    description: descriptionInput.value.trim(),
                    amount: Math.round(parseFloat(amountInput.value) * 100), // Convert to Rappen
                    type: typeInput.value as 'einnahme' | 'ausgabe',
                    date: new Date(parsedDate),
                    category: 'Sonstiges',
                    currency: 'CHF',
                    isRecurring: false,
                  });
                  
                  toast.success('Finanz-Eintrag erstellt');
                  setShowCreateFinanceModal(false);
                  setShowDayDialog(false);
                } catch (error: any) {
                  toast.error(error.message || 'Fehler beim Erstellen des Finanz-Eintrags');
                }
              }}
              className="h-11 min-h-[44px] flex-1 rounded-xl text-sm font-medium"
            >
              Erstellen
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
            <DialogDescription className="sr-only">
              Detaillierte Informationen zum ausgewählten Event
            </DialogDescription>
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
              Schliessen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
