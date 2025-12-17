import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import MobileLayout from '@/components/MobileLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  X, AlertTriangle, Bell, Clock, CheckCircle, Cloud, CloudRain, Sun, CloudSun, Wind, CalendarPlus, Wallet
} from 'lucide-react';
import { functions, auth } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { useReminders, useFinanceEntries, usePeople, useWeather, useUserSettings, createReminder, createFinanceEntry } from '@/lib/firebaseHooks';
import { normalizeEventDate, formatDateLocal, formatTime, formatDateGerman, parseDateGerman } from '@/lib/dateTimeUtils';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useLocation } from 'wouter';

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
  const [, setLocation] = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showDayDialog, setShowDayDialog] = useState(false);
  const [showCreateReminderModal, setShowCreateReminderModal] = useState(false);
  const [showCreateFinanceModal, setShowCreateFinanceModal] = useState(false);
  
  // Date display states for German format (DD.MM.YYYY)
  const [reminderDateDisplay, setReminderDateDisplay] = useState(formatDateGerman(new Date()));
  const [financeDateDisplay, setFinanceDateDisplay] = useState(formatDateGerman(new Date()));

  const { data: reminders = [] } = useReminders();
  const { data: financeEntries = [] } = useFinanceEntries();
  const { data: people = [] } = usePeople();
  
  // Get user settings for weather location
  const { settings } = useUserSettings();
  const location = settings?.weatherLocation || 'Zurich, CH';
  
  // Get weather for selected date - ensure we use the correct date
  // Normalize date to avoid timezone issues and memoize to prevent unnecessary re-renders
  const weatherDate = useMemo(() => {
    if (!selectedDate) return null;
    return new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
  }, [selectedDate?.getFullYear(), selectedDate?.getMonth(), selectedDate?.getDate()]);
  
  const { data: weather, isLoading: weatherLoading, error: weatherError } = useWeather(weatherDate, location);
  
  // Refetch events when data changes (real-time sync)
  // Track previous counts to detect changes - use JSON.stringify to detect any changes, not just count
  const prevDataRef = useRef<string>('');
  
  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Check if functions is available
      if (!functions) {
        console.error('[Calendar] Firebase functions not available');
        setEvents([]);
        return;
      }
      
      // Check if user is authenticated
      if (!auth.currentUser) {
        console.warn('[Calendar] User not authenticated');
        setEvents([]);
        return;
      }
      
      const getEventsFunc = httpsCallable(functions, 'getCalendarEvents');
      
      // Get events for a wider range (6 months before and 6 months after) to match web version
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 6, 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 6, 0);
      
      try {
        console.log('[Calendar] Calling getCalendarEvents with:', {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
        
        const eventsResult = await getEventsFunc({ 
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
        
        console.log('[Calendar] Raw eventsResult:', eventsResult);
        console.log('[Calendar] eventsResult.data:', eventsResult.data);
        
        const eventsData = eventsResult.data as { events: CalendarEvent[] };
        const loadedEvents = eventsData.events || [];
        
        console.log('[Calendar] loadedEvents count:', loadedEvents.length);
        console.log('[Calendar] loadedEvents sample:', loadedEvents.slice(0, 3));
        
        // Normalize date format - use GLOBAL utility function (LOCAL timezone)
        // IMPORTANT: Don't skip events if normalization fails - use original date as fallback
        const normalizedEvents = loadedEvents.map(event => {
          try {
            if (!event.date) {
              console.warn('[Calendar] Event has no date:', event);
              return null;
            }
            
            const normalizedDate = normalizeEventDate(event.date);
            if (!normalizedDate) {
              // Fallback: try to use the original date string if it's already in YYYY-MM-DD format
              if (typeof event.date === 'string' && event.date.match(/^\d{4}-\d{2}-\d{2}/)) {
                console.warn('[Calendar] Normalization failed, using original date string:', event.date);
                return {
                  ...event,
                  date: event.date.split('T')[0] // Extract just the date part
                };
              }
              // Try to extract from ISO string
              if (typeof event.date === 'string' && event.date.includes('T')) {
                const datePart = event.date.split('T')[0];
                if (datePart.match(/^\d{4}-\d{2}-\d{2}/)) {
                  console.warn('[Calendar] Using fallback ISO date extraction:', datePart);
                  return {
                    ...event,
                    date: datePart
                  };
                }
              }
              console.warn('[Calendar] Event with invalid date skipped:', event);
              return null;
            }
            return {
              ...event,
              date: normalizedDate
            };
          } catch (dateErr) {
            console.error('[Calendar] Error normalizing event date:', dateErr, event);
            // Fallback: try to extract date from ISO string
            if (typeof event.date === 'string') {
              try {
                const datePart = event.date.split('T')[0];
                if (datePart.match(/^\d{4}-\d{2}-\d{2}/)) {
                  console.warn('[Calendar] Using fallback date extraction:', datePart);
                  return {
                    ...event,
                    date: datePart
                  };
                }
              } catch (fallbackErr) {
                console.error('[Calendar] Fallback also failed:', fallbackErr);
              }
            }
            return null;
          }
        }).filter((e): e is CalendarEvent => e !== null);
        
        console.log('[Calendar] normalizedEvents count:', normalizedEvents.length);
        console.log('[Calendar] normalizedEvents sample (first 5):', normalizedEvents.slice(0, 5).map(e => ({
          id: e.id,
          title: e.title,
          date: e.date,
          type: e.type
        })));
        
        // Log if events were lost during normalization
        if (normalizedEvents.length < loadedEvents.length) {
          console.warn(`[Calendar] WARNING: Lost ${loadedEvents.length - normalizedEvents.length} events during normalization!`);
          const lostEvents = loadedEvents.filter(e => {
            const normalized = normalizedEvents.find(ne => ne.id === e.id);
            return !normalized;
          });
          console.warn('[Calendar] Lost events:', lostEvents.map(e => ({ title: e.title, date: e.date })));
        }
        
        // ALWAYS add reminders directly as events - don't rely on Cloud Function
        // This ensures reminders are always visible, even if Cloud Function fails or doesn't return them
        const allEvents = convertRemindersToEvents(reminders, normalizedEvents);
        
        console.log('[Calendar] Final events count:', {
          normalizedEvents: normalizedEvents.length,
          totalEvents: allEvents.length,
          sampleEvents: allEvents.slice(0, 5).map(e => ({ id: e.id, title: e.title, date: e.date }))
        });
        
        setEvents(allEvents);
      } catch (apiError: any) {
        // More detailed error logging
        console.error('[Calendar] API Error:', {
          message: apiError?.message,
          code: apiError?.code,
          details: apiError?.details
        });
        
        // Only show error toast for user-initiated actions, not background sync
        const isUserInitiated = prevDataRef.current === '';
        if (isUserInitiated) {
          if (apiError?.code === 'unauthenticated' || apiError?.message?.includes('UNAUTHORIZED')) {
            toast.error('Bitte anmelden');
          } else if (apiError?.code === 'unavailable' || apiError?.message?.includes('network')) {
            toast.error('Netzwerkfehler - Bitte erneut versuchen');
          }
        }
        
        // Even on error, still convert reminders to events
        // This ensures reminders are always visible
        console.log('[Calendar] API Error occurred, but still converting reminders to events');
        const reminderEventsOnError = convertRemindersToEvents(reminders, []);
        setEvents(reminderEventsOnError);
      }
    } catch (error: any) {
      // Catch any other unexpected errors - don't crash the app
      console.error('[Calendar] Unexpected error:', error);
      // Even on unexpected error, still convert reminders to events
      const reminderEventsOnError = convertRemindersToEvents(reminders, []);
      setEvents(reminderEventsOnError);
    } finally {
      setIsLoading(false);
    }
  }, [currentDate, reminders]);
  
  // Helper function to convert reminders to events
  const convertRemindersToEvents = useCallback((remindersList: any[], existingEvents: CalendarEvent[] = []): CalendarEvent[] => {
    console.log('[Calendar] convertRemindersToEvents - START:', {
      remindersCount: remindersList.length,
      existingEventsCount: existingEvents.length
    });
    
    const reminderEvents: CalendarEvent[] = remindersList
      .filter(r => {
        if (!r.dueDate) {
          console.log('[Calendar] Reminder skipped - no dueDate:', r.title);
          return false;
        }
        
        // Convert dueDate to Date if it's a string
        let dueDateObj: Date;
        if (r.dueDate instanceof Date) {
          dueDateObj = r.dueDate;
        } else if (typeof r.dueDate === 'string') {
          dueDateObj = new Date(r.dueDate);
        } else {
          console.log('[Calendar] Reminder skipped - invalid dueDate type:', r.title, typeof r.dueDate);
          return false;
        }
        
        if (isNaN(dueDateObj.getTime())) {
          console.log('[Calendar] Reminder skipped - invalid date:', r.title, r.dueDate);
          return false;
        }
        
        // Check if this reminder is already in the existing events
        const reminderDateStr = formatDateLocal(dueDateObj);
        const alreadyExists = existingEvents.some(e => {
          const eventDateStr = normalizeEventDate(e.date) || (typeof e.date === 'string' ? e.date.split('T')[0] : '');
          return eventDateStr === reminderDateStr && e.title === r.title;
        });
        
        if (alreadyExists) {
          console.log('[Calendar] Reminder already in events, skipping:', r.title);
        }
        
        return !alreadyExists;
      })
      .map(r => {
        // Convert dueDate to Date if it's a string
        let dueDateObj: Date;
        if (r.dueDate instanceof Date) {
          dueDateObj = r.dueDate;
        } else if (typeof r.dueDate === 'string') {
          dueDateObj = new Date(r.dueDate);
        } else {
          throw new Error(`Invalid dueDate for reminder ${r.id}`);
        }
        
        let eventType: CalendarEvent['type'] = 'appointment';
        if (r.type === 'termin') {
          eventType = 'appointment';
        } else if (r.type === 'zahlung') {
          eventType = 'due';
        } else if (r.type === 'aufgabe') {
          eventType = 'reminder';
        }
        
        const eventDateStr = formatDateLocal(dueDateObj);
        const eventTime = r.isAllDay ? undefined : formatTime(dueDateObj);
        
        return {
          id: `reminder-${r.id}`,
          type: eventType,
          title: r.title,
          date: eventDateStr,
          time: eventTime,
          description: r.notes || undefined,
          status: r.status
        };
      });
    
    console.log('[Calendar] convertRemindersToEvents - RESULT:', {
      count: reminderEvents.length,
      events: reminderEvents.map(e => ({ id: e.id, title: e.title, date: e.date }))
    });
    
    // Combine existing events with reminder events, avoiding duplicates
    const allEvents = [...existingEvents];
    for (const reminderEvent of reminderEvents) {
      if (!allEvents.some(e => e.id === reminderEvent.id)) {
        allEvents.push(reminderEvent);
      }
    }
    
    return allEvents;
  }, []);
  
  useEffect(() => {
    const currentData = JSON.stringify({
      reminders: reminders.map(r => r.id).sort(),
      financeEntries: financeEntries.map(e => e.id).sort(),
      people: people.map(p => p.id).sort()
    });
    
    if (prevDataRef.current !== currentData && prevDataRef.current !== '') {
      // Data has changed (not just initial load)
      prevDataRef.current = currentData;
      // Debounce the refetch to avoid too many calls
      const timeoutId = setTimeout(() => {
        if (auth.currentUser) {
          fetchEvents().catch((err: any) => {
            console.error('[Calendar] Error refetching events:', err);
            // Don't show error toast for background sync failures
          });
        }
      }, 1000); // Increased debounce to 1 second
      return () => clearTimeout(timeoutId);
    } else if (prevDataRef.current === '') {
      // Initial load - just store the data
      prevDataRef.current = currentData;
    }
  }, [reminders, financeEntries, people, fetchEvents]);
  
  // Convert reminders to events immediately when reminders change
  // This ensures events are always available, even if Cloud Function fails
  useEffect(() => {
    console.log('[Calendar] useEffect - Reminders changed:', {
      remindersCount: reminders.length,
      reminders: reminders.map(r => ({ id: r.id, title: r.title, dueDate: r.dueDate }))
    });
    
    // Always convert reminders to events immediately
    const reminderEvents = convertRemindersToEvents(reminders, []);
    console.log('[Calendar] Converted reminders to events immediately:', {
      count: reminderEvents.length,
      events: reminderEvents.map(e => ({ id: e.id, title: e.title, date: e.date }))
    });
    
    // Update events immediately with reminders
    setEvents(prevEvents => {
      // Merge with existing events, avoiding duplicates
      const merged = [...prevEvents];
      for (const reminderEvent of reminderEvents) {
        if (!merged.some(e => e.id === reminderEvent.id)) {
          merged.push(reminderEvent);
        }
      }
      console.log('[Calendar] Updated events state:', {
        prevCount: prevEvents.length,
        newCount: merged.length,
        added: reminderEvents.length
      });
      return merged;
    });
  }, [reminders, convertRemindersToEvents]);
  
  // Debug logging for weather (always log, not just in development)
  useEffect(() => {
    console.log('[Calendar] Weather state:', {
      selectedDate: selectedDate?.toISOString(),
      weatherDate: weatherDate?.toISOString(),
      location,
      weatherData: weather,
      isLoading: weatherLoading,
      error: weatherError?.message
    });
  }, [selectedDate, weatherDate, location, weather, weatherLoading, weatherError]);


  // Convert reminders to events immediately when reminders change
  useEffect(() => {
    console.log('[Calendar] Reminders changed, converting to events:', {
      remindersCount: reminders.length,
      reminders: reminders.map(r => ({ id: r.id, title: r.title, dueDate: r.dueDate }))
    });
    
    // Always convert reminders to events, even if Cloud Function hasn't loaded yet
    const reminderEvents = convertRemindersToEvents(reminders, []);
    console.log('[Calendar] Converted reminders to events immediately:', {
      count: reminderEvents.length,
      events: reminderEvents.map(e => ({ id: e.id, title: e.title, date: e.date }))
    });
    
    // Update events immediately with reminders
    setEvents(prevEvents => {
      // Merge with existing events, avoiding duplicates
      const merged = [...prevEvents];
      for (const reminderEvent of reminderEvents) {
        if (!merged.some(e => e.id === reminderEvent.id)) {
          merged.push(reminderEvent);
        }
      }
      return merged;
    });
  }, [reminders, convertRemindersToEvents]);
  
  useEffect(() => {
    // Only fetch events if user is authenticated
    console.log('[Calendar] useEffect for fetchEvents - auth check:', {
      isAuthenticated: !!auth.currentUser,
      userId: auth.currentUser?.uid
    });
    
    if (auth.currentUser) {
      console.log('[Calendar] User authenticated, calling fetchEvents');
      fetchEvents().catch(err => {
        console.error('[Calendar] Error in fetchEvents:', err);
      });
    } else {
      // Clear events if user is not authenticated
      console.log('[Calendar] User not authenticated, clearing events');
      setEvents([]);
      setIsLoading(false);
    }
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

    console.log('[Calendar] calendarDays useMemo - START:', {
      currentDate: currentDate.toISOString(),
      eventsCount: events.length,
      events: events.map(e => ({ id: e.id, title: e.title, date: e.date }))
    });

    // Use GLOBAL utility functions for date normalization (LOCAL timezone)
    // Helper function to match events to dates with robust fallback
    const getEventsForDate = (date: Date): CalendarEvent[] => {
      const dateStr = formatDateLocal(date);
      const matchedEvents = events.filter(e => {
        if (!e.date) {
          console.log('[Calendar] Event skipped - no date:', e.title);
          return false;
        }
        
        // Try to normalize the event date
        let eventDateStr = normalizeEventDate(e.date);
        
        // Fallback: if normalization fails, try to extract date from ISO string
        if (!eventDateStr && typeof e.date === 'string') {
          const datePart = e.date.split('T')[0];
          if (datePart.match(/^\d{4}-\d{2}-\d{2}/)) {
            eventDateStr = datePart;
            console.log('[Calendar] Using fallback date extraction for event:', e.title, eventDateStr);
          }
        }
        
        // If still no valid date string, skip this event
        if (!eventDateStr) {
          console.log('[Calendar] Event skipped - invalid date:', e.title, e.date);
          return false;
        }
        
        const matches = eventDateStr === dateStr;
        if (matches) {
          console.log('[Calendar] Event matched for date:', {
            eventTitle: e.title,
            eventDate: e.date,
            eventDateStr,
            targetDateStr: dateStr,
            date: date.toISOString()
          });
        }
        
        return matches;
      });
      
      if (matchedEvents.length > 0) {
        console.log('[Calendar] Found events for date:', {
          date: dateStr,
          count: matchedEvents.length,
          events: matchedEvents.map(e => e.title)
        });
      }
      
      return matchedEvents;
    };

    // Previous month days
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 0);
    const daysInPrevMonth = prevMonth.getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, daysInPrevMonth - i);
      const dayEvents = getEventsForDate(date);
      days.push({
        date,
        isCurrentMonth: false,
        events: dayEvents
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      const dayEvents = getEventsForDate(date);
      days.push({
        date,
        isCurrentMonth: true,
        events: dayEvents
      });
    }

    // Next month days (fill to 42 = 6 weeks)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i);
      const dayEvents = getEventsForDate(date);
      days.push({
        date,
        isCurrentMonth: false,
        events: dayEvents
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
    // Create a new date object at midnight to avoid timezone issues
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    setSelectedDate(normalizedDate);
    setShowDayDialog(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventDialog(true);
  };

  const dayEvents = useMemo(() => {
    if (!selectedDate) {
      console.log('[Calendar] dayEvents - no selectedDate');
      return [];
    }
    
    // Normalize selectedDate to midnight in local timezone
    const normalizedSelectedDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    // Format as YYYY-MM-DD using GLOBAL utility (LOCAL timezone)
    const dateStr = formatDateLocal(normalizedSelectedDate);
    
    console.log('[Calendar] dayEvents filter - START:', {
      selectedDate: selectedDate.toISOString(),
      normalizedSelectedDate: normalizedSelectedDate.toISOString(),
      dateStr,
      totalEvents: events.length,
      totalReminders: reminders.length,
      events: events.map(e => ({ title: e.title, date: e.date, type: e.type }))
    });
    
    // Handle both ISO date strings and full ISO datetime strings
    const filtered = events.filter(e => {
      if (!e.date) {
        console.log('[Calendar] Event skipped - no date:', e.title);
        return false;
      }
      
      // Normalize event date using GLOBAL utility (LOCAL timezone)
      let eventDateStr = normalizeEventDate(e.date);
      
      // Fallback: if normalization fails, try to extract date from ISO string
      if (!eventDateStr && typeof e.date === 'string') {
        const datePart = e.date.split('T')[0];
        if (datePart.match(/^\d{4}-\d{2}-\d{2}/)) {
          eventDateStr = datePart;
          console.log('[Calendar] Using fallback date extraction for filter:', eventDateStr);
        }
      }
      
      if (!eventDateStr) {
        console.log('[Calendar] Event skipped - invalid date:', e.title, e.date);
        return false;
      }
      
      const matches = eventDateStr === dateStr;
      
      if (matches) {
        console.log('[Calendar] Event matched:', {
          eventTitle: e.title,
          eventDate: e.date,
          eventDateStr,
          selectedDateStr: dateStr
        });
      }
      
      return matches;
    });
    
    // ALWAYS check reminders directly as well, even if we found events
    // This ensures reminders are always shown, even if they weren't converted to events properly
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
    
    console.log('[Calendar] Reminders for date:', {
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
    
    console.log('[Calendar] dayEvents filter - RESULT:', {
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

  // Get today's events for the bottom section
  const todayEvents = useMemo(() => {
    const today = new Date();
    // Format today's date using GLOBAL utility (LOCAL timezone)
    const todayStr = formatDateLocal(today);
    return events.filter(e => {
      const eventDateStr = normalizeEventDate(e.date);
      return eventDateStr !== '' && eventDateStr === todayStr;
    });
  }, [events]);

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
    <MobileLayout title="Kalender" showSidebar={true}>
      {/* Close Button - Fixed position top right, aligned with header */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setLocation('/')}
        className="fixed top-2 right-2 z-50 h-9 w-9 rounded-full bg-background/95 backdrop-blur-sm border border-border shadow-lg"
      >
        <X className="h-4 w-4" />
      </Button>

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

      {/* Today's Events Section */}
      {todayEvents.length > 0 && (
        <div className="mobile-card mt-4">
          <h3 className="text-sm font-semibold mb-3">Heute - Termine & Events</h3>
          <div className="space-y-2">
            {todayEvents.map((event) => (
              <Card 
                key={event.id} 
                className="cursor-pointer hover:bg-muted/50 transition-colors" 
                onClick={() => {
                  setSelectedDate(new Date(event.date.includes('T') ? event.date.split('T')[0] : event.date));
                  handleEventClick(event);
                }}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className={cn("w-3 h-3 rounded-full mt-1 flex-shrink-0", getEventColor(event.type))} />
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
            ))}
          </div>
        </div>
      )}

      {/* Day Events Dialog */}
      <Dialog open={showDayDialog} onOpenChange={setShowDayDialog}>
        <DialogContent className="!fixed !top-[50%] !left-[50%] !right-auto !bottom-auto !translate-x-[-50%] !translate-y-[-50%] !w-[85vw] !max-w-sm !max-h-[85vh] !rounded-3xl !m-0 !overflow-y-auto !shadow-2xl">
          <DialogHeader className="px-5 pt-5 pb-3 sticky top-0 bg-background z-10 border-b border-border">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold">
                {selectedDate?.toLocaleDateString('de-CH', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long',
                  year: 'numeric'
                })}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Details für den ausgewählten Tag mit Wetter, Terminen und Schnellaktionen
              </DialogDescription>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDayDialog(false)}
                className="h-8 w-8 rounded-full"
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
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="text-xs text-muted-foreground">Lädt Wetterdaten...</div>
                  {weatherError && (
                    <div className="text-xs text-red-500 mt-2">Fehler: {weatherError.message}</div>
                  )}
                </div>
              ) : weatherError ? (
                <div className="text-xs text-muted-foreground text-center py-2">
                  <p className="text-red-500 mb-1">Fehler beim Laden</p>
                  <p className="opacity-70">{weatherError.message}</p>
                  {!location && (
                    <p className="text-xs mt-2 opacity-50">Bitte Standort in Einstellungen eingeben</p>
                  )}
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
                  {!location ? (
                    <>
                      <p>Kein Standort konfiguriert</p>
                      <p className="text-xs mt-1 opacity-70">Bitte in Einstellungen einen Standort eingeben</p>
                    </>
                  ) : (
                    'Keine Wetterdaten verfügbar'
                  )}
                </div>
              )}
            </div>

            {/* Events Section */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Termine & Events</h3>
              {dayEvents.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-3 bg-muted/30 rounded-lg">
                  <p>Keine Events an diesem Tag</p>
                  <p className="text-xs mt-2 opacity-70">
                      Debug: {events.length} Events geladen, {selectedDate ? `Datum: ${formatDateLocal(selectedDate)}` : 'Kein Datum ausgewählt'}
                      {events.length > 0 && (
                        <span className="block mt-1">
                          Event-Daten: {JSON.stringify(events.slice(0, 2).map(e => ({ title: e.title, date: e.date })))}
                        </span>
                      )}
                    </p>
                </div>
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
              variant="default" 
              onClick={() => setShowDayDialog(false)}
              className="h-11 min-h-[44px] w-full rounded-xl text-sm font-medium"
            >
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Detail Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="!fixed !top-[50%] !left-[50%] !right-auto !bottom-auto !translate-x-[-50%] !translate-y-[-50%] !w-[85vw] !max-w-sm !max-h-[85vh] !rounded-3xl !m-0 !overflow-y-auto !shadow-2xl">
          <DialogHeader className="px-5 pt-5 pb-3 sticky top-0 bg-background z-10 border-b border-border relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowEventDialog(false)}
              className="absolute right-2 top-2 h-8 w-8 rounded-full z-20"
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="flex items-start gap-3 pr-8">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn("w-4 h-4 rounded-full flex-shrink-0", getEventColor(selectedEvent?.type || ''))} />
                  <Badge variant="outline" className="text-xs">
                    {selectedEvent?.type === 'due' && 'Fällig'}
                    {selectedEvent?.type === 'reminder' && 'Erinnerung'}
                    {selectedEvent?.type === 'appointment' && 'Termin'}
                    {selectedEvent?.type === 'work' && 'Arbeit'}
                    {selectedEvent?.type === 'school' && 'Schule'}
                    {selectedEvent?.type === 'hort' && 'Hort'}
                    {!selectedEvent?.type && 'Event'}
                  </Badge>
                </div>
                <DialogTitle className="text-lg font-semibold leading-tight">
                  {selectedEvent?.title}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Detaillierte Informationen zum ausgewählten Event
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4 px-5 pb-2">
              {/* Date & Time Section */}
              <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                {selectedEvent.date && (
                  <div className="flex items-start gap-3">
                    <CalendarIcon className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <Label className="text-xs text-muted-foreground block mb-1">Datum</Label>
                      <p className="text-sm font-medium">
                        {new Date(selectedEvent.date).toLocaleDateString('de-CH', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}
                
                {selectedEvent.time && (
                  <div className="flex items-start gap-3 pt-2 border-t border-border/50">
                    <Clock className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <Label className="text-xs text-muted-foreground block mb-1">Uhrzeit</Label>
                      <p className="text-sm font-medium">{selectedEvent.time}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Description Section */}
              {selectedEvent.description && (
                <div className="bg-muted/30 rounded-xl p-4">
                  <Label className="text-xs text-muted-foreground block mb-2">Beschreibung</Label>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedEvent.description}</p>
                </div>
              )}

              {/* Additional Info Section */}
              {(selectedEvent.amount || selectedEvent.personName || selectedEvent.status) && (
                <div className="space-y-2">
                  {selectedEvent.amount && (
                    <div className="flex items-center gap-3 bg-muted/30 rounded-xl p-4">
                      <Wallet className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <Label className="text-xs text-muted-foreground block mb-1">Betrag</Label>
                        <p className="text-sm font-semibold">CHF {(selectedEvent.amount / 100).toFixed(2)}</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedEvent.personName && (
                    <div className="flex items-center gap-3 bg-muted/30 rounded-xl p-4">
                      <Bell className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <Label className="text-xs text-muted-foreground block mb-1">Person</Label>
                        <p className="text-sm font-medium">{selectedEvent.personName}</p>
                      </div>
                    </div>
                  )}

                  {selectedEvent.status && (
                    <div className="flex items-center gap-3 bg-muted/30 rounded-xl p-4">
                      <CheckCircle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <Label className="text-xs text-muted-foreground block mb-1">Status</Label>
                        <Badge variant={selectedEvent.status === 'paid' ? 'default' : 'secondary'} className="text-xs">
                          {selectedEvent.status === 'paid' ? 'Bezahlt' : selectedEvent.status === 'pending' ? 'Ausstehend' : selectedEvent.status}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {selectedEvent.isOverdue && (
                    <div className="flex items-center gap-3 bg-red-50 dark:bg-red-950/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
                      <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-red-600 dark:text-red-400">Überfällig</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="px-5 pb-3 pt-2 sticky bottom-0 bg-background border-t border-border">
            <Button 
              variant="default" 
              onClick={() => setShowEventDialog(false)}
              className="h-11 min-h-[44px] w-full rounded-xl text-sm font-medium"
            >
              Schließen
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
          <DialogHeader className="px-5 pt-4 pb-2">
            <DialogTitle className="text-lg font-semibold">Termin erstellen</DialogTitle>
          </DialogHeader>
          
          <div className="px-5 pb-2 space-y-3">
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
                rows={2}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm resize-none"
              />
            </div>
          </div>
          
          <DialogFooter className="px-5 pb-3 pt-2 gap-2">
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
                  // Refresh events to sync everywhere
                  await fetchEvents();
                  // Force re-render by updating selectedDate
                  if (selectedDate) {
                    setSelectedDate(new Date(selectedDate));
                  }
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
          <DialogHeader className="px-5 pt-4 pb-2">
            <DialogTitle className="text-lg font-semibold">Finanz-Eintrag erstellen</DialogTitle>
            <DialogDescription className="sr-only">
              Erstellen Sie einen neuen Finanz-Eintrag mit Beschreibung, Betrag, Typ und Datum
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-5 pb-2 space-y-3">
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
          
          <DialogFooter className="px-5 pb-3 pt-2 gap-2">
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
                    notes: descriptionInput.value.trim(),
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
                  // Refresh events to sync everywhere
                  await fetchEvents();
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
    </MobileLayout>
  );
}

