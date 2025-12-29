import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
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
  Briefcase, Palmtree, Search, Repeat, Download, Share2, BellRing,
  GraduationCap, Home, Sun
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { useReminders, createReminder, updateReminder, deleteReminder } from '@/lib/firebaseHooks';
import { parseLocalDateTime, normalizeEventDate, formatDateLocal } from '@/lib/dateTimeUtils';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import WorkScheduleDialog from '@/components/WorkScheduleDialog';
import VacationPlannerDialog from '@/components/VacationPlannerDialog';
import SchoolPlannerDialog from '@/components/SchoolPlannerDialog';
import SchoolHolidayDialog from '@/components/SchoolHolidayDialog';

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
  invoiceId?: string;
  isOverdue?: boolean;
  dueDate?: string;
  description?: string;
  category?: string;
  priority?: string;
  completed?: boolean;
  schoolType?: 'full' | 'half' | 'off' | 'holiday';
  hortType?: 'full' | 'lunch' | 'afternoon' | 'none';
  childName?: string;
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
  const [showSchoolPlannerDialog, setShowSchoolPlannerDialog] = useState(false);
  const [showSchoolHolidayDialog, setShowSchoolHolidayDialog] = useState(false);
  const [vacations, setVacations] = useState<any[]>([]);
  const [schoolSchedules, setSchoolSchedules] = useState<any[]>([]);
  const [schoolHolidays, setSchoolHolidays] = useState<any[]>([]);

  // New event form
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: formatDateLocal(new Date()),
    time: '',
    category: 'general',
    priority: 'medium',
    isRecurring: false,
    recurrenceRule: 'weekly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
    recurrenceCount: 4,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Check notification permission on load
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  // Schedule notifications for upcoming events
  useEffect(() => {
    if (!notificationsEnabled || events.length === 0) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check for events due today or tomorrow
    const upcomingEvents = events.filter(e => {
      const eventDate = new Date(e.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= today && eventDate <= tomorrow && e.type !== 'work';
    });

    // Show notification for events today
    const todayEvents = upcomingEvents.filter(e => {
      const eventDate = new Date(e.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate.getTime() === today.getTime();
    });

    if (todayEvents.length > 0 && Notification.permission === 'granted') {
      // Only show once per session
      const notificationKey = `notified-${formatDateLocal(today)}`;
      if (!sessionStorage.getItem(notificationKey)) {
        new Notification(t('calendar.title', 'Kalender'), {
          body: t('calendar.notificationBody', 'Du hast {{count}} Event(s) heute: {{events}}', { 
            count: todayEvents.length, 
            events: todayEvents.slice(0, 3).map(e => e.title).join(', ') 
          }),
          icon: '/favicon.ico'
        });
        sessionStorage.setItem(notificationKey, 'true');
      }
    }
  }, [events, notificationsEnabled]);

  // Get reminders
  const { data: reminders = [], refetch: refetchReminders } = useReminders();

  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      const getEventsFunc = httpsCallable(functions, 'getCalendarEvents');
      const getVacationsFunc = httpsCallable(functions, 'getVacations');
      const getSchoolSchedulesFunc = httpsCallable(functions, 'getSchoolSchedules');
      const getSchoolHolidaysFunc = httpsCallable(functions, 'getSchoolHolidays');
      
      // Get events for a much wider range (6 months before and after)
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 6, 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 6, 0);
      
      // Fetch all data in parallel
      const [eventsResult, vacationsResult, schoolSchedulesResult, schoolHolidaysResult] = await Promise.all([
        getEventsFunc({ 
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }),
        getVacationsFunc({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }),
        getSchoolSchedulesFunc({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }).catch(() => ({ data: { schedules: [] } })),
        getSchoolHolidaysFunc({}).catch(() => ({ data: { holidays: [] } }))
      ]);
      
      const eventsData = eventsResult.data as { events: CalendarEvent[] };
      const vacationsData = vacationsResult.data as { vacations: any[] };
      const schoolData = schoolSchedulesResult.data as { schedules: any[] };
      const holidaysData = schoolHolidaysResult.data as { holidays: any[] };
      
      // Normalize event dates - use GLOBAL utility function (LOCAL timezone)
      const loadedEvents = eventsData.events || [];
      const normalizedEvents = loadedEvents.map(event => ({
        ...event,
        date: normalizeEventDate(event.date)
      }));
      
      // Log only in development
      if (typeof (globalThis as any).process !== 'undefined' && (globalThis as any).process?.env?.NODE_ENV === 'development') {
        console.log('[Calendar Web] Loaded and normalized events:', {
          total: normalizedEvents.length,
          events: normalizedEvents.map(e => ({ title: e.title, date: e.date, type: e.type }))
        });
      }
      
      setEvents(normalizedEvents);
      setVacations(vacationsData.vacations || []);
      setSchoolSchedules(schoolData.schedules || []);
      setSchoolHolidays(holidaysData.holidays || []);
    } catch (error) {
      // Error fetching calendar data - silently fail
      toast.error(t('calendar.errors.loadEventsError'));
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
    toast.success(t('calendar.updated', 'Kalender aktualisiert'));
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
  const monthNames = [
    t('calendar.months.january'),
    t('calendar.months.february'),
    t('calendar.months.march'),
    t('calendar.months.april'),
    t('calendar.months.may'),
    t('calendar.months.june'),
    t('calendar.months.july'),
    t('calendar.months.august'),
    t('calendar.months.september'),
    t('calendar.months.october'),
    t('calendar.months.november'),
    t('calendar.months.december')
  ];
  const dayNames = [
    t('calendar.days.monday'),
    t('calendar.days.tuesday'),
    t('calendar.days.wednesday'),
    t('calendar.days.thursday'),
    t('calendar.days.friday'),
    t('calendar.days.saturday'),
    t('calendar.days.sunday')
  ];
  const fullDayNames = [
    t('calendar.fullDays.monday'),
    t('calendar.fullDays.tuesday'),
    t('calendar.fullDays.wednesday'),
    t('calendar.fullDays.thursday'),
    t('calendar.fullDays.friday'),
    t('calendar.fullDays.saturday'),
    t('calendar.fullDays.sunday')
  ];

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

  // Helper to get school schedules for a date
  const getSchoolSchedulesForDate = useCallback((date: Date) => {
    const dateStr = formatDateLocal(date);
    return schoolSchedules.filter(s => {
      const scheduleDateStr = normalizeEventDate(s.date);
      return scheduleDateStr === dateStr;
    });
  }, [schoolSchedules]);

  // Helper to check if a date is within school holiday
  const getSchoolHolidaysForDate = useCallback((date: Date) => {
    return schoolHolidays.filter(h => {
      const start = new Date(h.startDate);
      const end = new Date(h.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      const checkDate = new Date(date);
      checkDate.setHours(12, 0, 0, 0);
      return checkDate >= start && checkDate <= end;
    });
  }, [schoolHolidays]);

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days: { date: Date; isCurrentMonth: boolean; events: CalendarEvent[]; vacations: any[]; schoolEvents: CalendarEvent[] }[] = [];

    // Apply filter and search to events
    let filteredEvts = filterType === 'all' 
      ? events 
      : events.filter(e => e.type === filterType);
    
    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredEvts = filteredEvts.filter(e => 
        e.title.toLowerCase().includes(query) ||
        (e.personName && e.personName.toLowerCase().includes(query)) ||
        (e.description && e.description.toLowerCase().includes(query))
      );
    }

    // Create school events from schedules and holidays
    const createSchoolEvents = (date: Date): CalendarEvent[] => {
      const schoolEvts: CalendarEvent[] = [];
      
      // School schedules
      const schedules = getSchoolSchedulesForDate(date);
      schedules.forEach(s => {
        // Add school event
        if (s.schoolType !== 'off') {
          schoolEvts.push({
            id: `school-${s.id}`,
            type: 'school',
            title: `${s.childName} Schule`,
            date: s.date,
            schoolType: s.schoolType,
            childName: s.childName,
          });
        }
        // Add hort event if applicable
        if (s.hortType && s.hortType !== 'none') {
          schoolEvts.push({
            id: `hort-${s.id}`,
            type: 'hort',
            title: `${s.childName} Hort`,
            date: s.date,
            hortType: s.hortType,
            childName: s.childName,
          });
        }
      });
      
      // School holidays
      const holidays = getSchoolHolidaysForDate(date);
      holidays.forEach(h => {
        if (!schoolEvts.find(e => e.type === 'school-holiday' && e.title === h.name)) {
          schoolEvts.push({
            id: `school-holiday-${h.id}`,
            type: 'school-holiday',
            title: h.name,
            date: formatDateLocal(date),
          });
        }
      });
      
      return schoolEvts;
    };

    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const daysInPrevMonth = getDaysInMonth(prevMonth);
    for (let i = firstDay - 1; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, daysInPrevMonth - i);
      days.push({ date, isCurrentMonth: false, events: [], vacations: getVacationsForDate(date), schoolEvents: createSchoolEvents(date) });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      // Format date using GLOBAL utility (LOCAL timezone)
      const dateStr = formatDateLocal(date);
      const dayEvents = filteredEvts.filter(event => {
        const eventDateStr = normalizeEventDate(event.date);
        return eventDateStr !== '' && eventDateStr === dateStr;
      });
      days.push({ date, isCurrentMonth: true, events: dayEvents, vacations: getVacationsForDate(date), schoolEvents: createSchoolEvents(date) });
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i);
      days.push({ date, isCurrentMonth: false, events: [], vacations: getVacationsForDate(date), schoolEvents: createSchoolEvents(date) });
    }

    return days;
  }, [currentDate, events, getVacationsForDate, getSchoolSchedulesForDate, getSchoolHolidaysForDate, filterType, searchQuery]);

  const filteredEvents = useMemo(() => {
    let filtered = events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getMonth() === currentDate.getMonth() && 
             eventDate.getFullYear() === currentDate.getFullYear();
    });

    if (filterType !== 'all') {
      filtered = filtered.filter(event => event.type === filterType);
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        e.title.toLowerCase().includes(query) ||
        (e.personName && e.personName.toLowerCase().includes(query)) ||
        (e.description && e.description.toLowerCase().includes(query))
      );
    }

    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events, currentDate, filterType, searchQuery]);

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
    const locale = i18n.language === 'de' ? 'de-CH' : i18n.language === 'en' ? 'en-GB' : i18n.language === 'es' ? 'es-ES' : i18n.language === 'nl' ? 'nl-NL' : i18n.language === 'it' ? 'it-IT' : i18n.language === 'fr' ? 'fr-FR' : 'de-CH';
    return date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  const formatFullDate = (date: Date) => {
    const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
    return `${fullDayNames[dayIndex]}, ${date.getDate()}. ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  };

  const getEventColor = (event: CalendarEvent) => {
    // Überfällig - dunkelrot
    if (event.isOverdue) return 'bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-100';
    
    // Schule - Lila
    if (event.type === 'school') {
      if (event.schoolType === 'half') return 'bg-purple-300 text-purple-900 dark:bg-purple-900/50 dark:text-purple-200';
      if (event.schoolType === 'off') return 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
      return 'bg-purple-200 text-purple-900 dark:bg-purple-900/40 dark:text-purple-200';
    }
    
    // Hort - Pink
    if (event.type === 'hort') {
      return 'bg-pink-200 text-pink-900 dark:bg-pink-900/40 dark:text-pink-200';
    }
    
    // Schulferien - Cyan
    if (event.type === 'school-holiday') {
      return 'bg-cyan-200 text-cyan-900 dark:bg-cyan-900/40 dark:text-cyan-200';
    }
    
    // Arbeitszeiten
    if (event.type === 'work') {
      const workType = (event as any).workType;
      if (workType === 'off') return 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200';
      if (workType === 'half-am') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200';
      if (workType === 'half-pm') return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200';
      return 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
    }
    
    // Rechnungen/Fälligkeiten - ROT
    if (event.type === 'due') {
      if (event.status === 'paid') return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      return 'bg-rose-200 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200';
    }
    
    // Erinnerungen
    if (event.type === 'reminder') return 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-200';
    
    // Termine/Aufgaben - ORANGE
    if (event.type === 'appointment') {
      if (event.completed) return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
      return 'bg-orange-200 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200';
    }
    
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  const getEventBorderColor = (_event: CalendarEvent) => {
    // Dezentes Design ohne farbige Ränder
    return '';
  };

  const getEventIcon = (event: CalendarEvent) => {
    if (event.isOverdue) return <AlertTriangle className="w-4 h-4" />;
    if (event.type === 'school') return <GraduationCap className="w-4 h-4" />;
    if (event.type === 'hort') return <Home className="w-4 h-4" />;
    if (event.type === 'school-holiday') return <Sun className="w-4 h-4" />;
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
    if (event.type === 'school') {
      if (event.schoolType === 'half') return t('calendar.eventTypes.school.half', 'Halbtag');
      if (event.schoolType === 'off') return t('calendar.eventTypes.school.off', 'Schulfrei');
      if (event.schoolType === 'holiday') return t('calendar.eventTypes.school.holiday', 'Ferien');
      return t('calendar.eventTypes.school', 'Schule');
    }
    if (event.type === 'hort') {
      if (event.hortType === 'lunch') return t('calendar.eventTypes.hort.lunch', 'Hort (Mittag)');
      if (event.hortType === 'afternoon') return t('calendar.eventTypes.hort.afternoon', 'Hort (Nachmittag)');
      return t('calendar.eventTypes.hort', 'Hort');
    }
    if (event.type === 'school-holiday') return t('calendar.eventTypes.schoolHoliday', 'Schulferien');
    if (event.type === 'work') {
      const workType = (event as any).workType;
      if (workType === 'off') return t('calendar.eventTypes.work.off', 'Frei');
      if (workType === 'half-am') return t('calendar.eventTypes.work.halfAm', 'Morgen');
      if (workType === 'half-pm') return t('calendar.eventTypes.work.halfPm', 'Nachmittag');
      if (workType === 'full') return t('calendar.eventTypes.work.full', 'Vollzeit');
      return t('calendar.eventTypes.work', 'Arbeit');
    }
    if (event.type === 'due') return t('calendar.eventTypes.due', 'Rechnung');
    if (event.type === 'reminder') return t('calendar.eventTypes.reminder', 'Erinnerung');
    if (event.type === 'appointment') {
      if (event.category === 'termin') return t('calendar.eventTypes.appointment.termin', 'Termin');
      if (event.category === 'aufgabe') return t('calendar.eventTypes.appointment.aufgabe', 'Aufgabe');
      if (event.category === 'zahlung') return t('calendar.eventTypes.appointment.zahlung', 'Zahlung');
      return t('calendar.eventTypes.appointment', 'Termin');
    }
    return t('calendar.eventTypes.event', 'Event');
  };

  // Translate event title, especially for work events
  const getEventDisplayTitle = (event: CalendarEvent) => {
    if (event.type === 'work' && event.personName) {
      const workType = (event as any).workType;
      const typeLabel = getEventTypeLabel(event);
      return `${event.personName}: ${typeLabel}`;
    }
    // Translate common German terms in titles
    let title = event.title;
    const translations: { [key: string]: string } = {
      'Vollzeit': t('calendar.eventTypes.work.full', 'Vollzeit'),
      'Frei': t('calendar.eventTypes.work.off', 'Frei'),
      'Ferien': t('calendar.eventTypes.school.holiday', 'Ferien'),
      'Auto Rate': t('finance.categories.carPayment', 'Auto Rate'),
      'Darlehnen': t('finance.categories.loans', 'Darlehnen'),
    };
    Object.keys(translations).forEach(key => {
      title = title.replace(new RegExp(key, 'g'), translations[key]);
    });
    return title;
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

  // Add new appointment (with recurring support)
  const handleAddEvent = async () => {
    if (!newEvent.title.trim()) {
      toast.error(t('calendar.errors.titleRequired', 'Titel ist erforderlich'));
      return;
    }

    try {
      // Use centralized utility to parse date/time
      const dateTimeString = newEvent.time 
        ? `${newEvent.date}T${newEvent.time}`
        : `${newEvent.date}T12:00`; // Default to noon for all-day events
      const baseDate = parseLocalDateTime(dateTimeString);
      
      // Validate that appointments (termin) cannot be created in the past
      const eventType = newEvent.category || 'termin';
      if (eventType === 'termin') {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to midnight for date comparison
        const baseDateOnly = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
        
        if (baseDateOnly < today) {
          toast.error(t('calendar.errors.cannotCreateInPast'));
          return;
        }
      }
      
      if (newEvent.isRecurring) {
        // Create multiple events for recurring
        const dates: Date[] = [baseDate];
        for (let i = 1; i < newEvent.recurrenceCount; i++) {
          const nextDate = new Date(baseDate);
          if (newEvent.recurrenceRule === 'daily') nextDate.setDate(baseDate.getDate() + i);
          else if (newEvent.recurrenceRule === 'weekly') nextDate.setDate(baseDate.getDate() + (i * 7));
          else if (newEvent.recurrenceRule === 'monthly') nextDate.setMonth(baseDate.getMonth() + i);
          else if (newEvent.recurrenceRule === 'yearly') nextDate.setFullYear(baseDate.getFullYear() + i);
          dates.push(nextDate);
        }
        
        for (const date of dates) {
          await createReminder({
            title: newEvent.title,
            notes: newEvent.description,
            dueDate: date, // Date object - will be normalized in firebaseHooks
            type: eventType,
            isAllDay: !newEvent.time,
          });
        }
        toast.success(t('calendar.recurringAppointmentsCreated', '{{count}} wiederkehrende Termine erstellt', { count: dates.length }));
      } else {
        await createReminder({
          title: newEvent.title,
          notes: newEvent.description,
          dueDate: baseDate, // Date object - will be normalized in firebaseHooks
          type: eventType,
          isAllDay: !newEvent.time,
        });
        toast.success(t('calendar.appointmentCreated', 'Termin erstellt'));
      }

      const today = new Date();
      const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      setNewEvent({ title: '', description: '', date: localDate, time: '', category: 'general', priority: 'medium', isRecurring: false, recurrenceRule: 'weekly', recurrenceCount: 4 });
      setShowAddDialog(false);
      await refreshAll();
    } catch (error: any) {
      toast.error(t('common.error') + ': ' + error.message);
    }
  };

  // Export as PDF
  const handleExportPDF = () => {
    const locale = i18n.language === 'de' ? 'de-CH' : i18n.language === 'en' ? 'en-GB' : i18n.language === 'es' ? 'es-ES' : i18n.language === 'nl' ? 'nl-NL' : i18n.language === 'it' ? 'it-IT' : i18n.language === 'fr' ? 'fr-FR' : 'de-CH';
    const monthKey = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'][currentDate.getMonth()];
    const monthName = `${t(`calendar.months.${monthKey}`)} ${currentDate.getFullYear()}`;
    
    // Group events by date
    const eventsByDate: Record<string, CalendarEvent[]> = {};
    filteredEvents.forEach(e => {
      const date = new Date(e.date);
      const dayKey = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][date.getDay() === 0 ? 6 : date.getDay() - 1];
      const monthKey2 = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'][date.getMonth()];
      const dateKey = `${t(`calendar.fullDays.${dayKey}`)} ${date.getDate()} ${t(`calendar.months.${monthKey2}`)}`;
      if (!eventsByDate[dateKey]) eventsByDate[dateKey] = [];
      eventsByDate[dateKey].push(e);
    });

    const getTypeLabel = (type: string) => {
      switch(type) {
        case 'due': return t('calendar.eventTypes.due');
        case 'appointment': return t('calendar.eventTypes.appointment');
        case 'reminder': return t('calendar.eventTypes.reminder');
        case 'work': return t('calendar.eventTypes.work');
        case 'school': return t('calendar.eventTypes.school');
        case 'hort': return t('calendar.eventTypes.hort');
        default: return '';
      }
    };

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Kalender ${monthName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; 
            padding: 40px 50px; 
            background: #fff;
            color: #333;
            line-height: 1.5;
          }
          .header {
            margin-bottom: 35px;
          }
          .header h1 { 
            font-size: 32px; 
            font-weight: 300;
            color: #1a1a1a;
            letter-spacing: -0.5px;
          }
          .header p {
            color: #888;
            font-size: 14px;
            margin-top: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          .date-row td {
            padding: 20px 0 10px 0;
            font-size: 13px;
            font-weight: 600;
            color: #1a1a1a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #1a1a1a;
          }
          .event-row td {
            padding: 14px 0;
            border-bottom: 1px solid #eee;
            vertical-align: top;
          }
          .event-row:hover td {
            background: #fafafa;
          }
          .col-time {
            width: 80px;
            font-size: 13px;
            color: #666;
          }
          .col-title {
            font-size: 15px;
            color: #1a1a1a;
          }
          .col-title small {
            display: block;
            font-size: 12px;
            color: #999;
            margin-top: 3px;
          }
          .col-type {
            width: 100px;
            font-size: 12px;
            color: #666;
            text-align: right;
          }
          .col-amount {
            width: 120px;
            font-size: 15px;
            color: #1a1a1a;
            text-align: right;
            font-weight: 500;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #aaa;
            display: flex;
            justify-content: space-between;
          }
          @media print {
            body { padding: 25px; }
            .event-row:hover td { background: transparent; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${monthName}</h1>
          <p>${filteredEvents.length} Einträge</p>
        </div>
        
        <table>
          ${Object.entries(eventsByDate).map(([date, events]) => `
            <tr class="date-row">
              <td colspan="4">${date}</td>
            </tr>
            ${events.map(e => `
              <tr class="event-row">
                <td class="col-time">${e.time || '–'}</td>
                <td class="col-title">
                  ${e.title}
                  ${e.personName ? `<small>${e.personName}</small>` : ''}
                </td>
                <td class="col-type">${getTypeLabel(e.type)}</td>
                <td class="col-amount">${e.amount ? 'CHF ' + (e.amount / 100).toFixed(2) : ''}</td>
              </tr>
            `).join('')}
          `).join('')}
        </table>

        <div class="footer">
          <span>Nexo</span>
          <span>${t('common.created', 'Erstellt')} ${(() => {
            const date = new Date();
            const locale = i18n.language === 'de' ? 'de-CH' : i18n.language === 'en' ? 'en-GB' : i18n.language === 'es' ? 'es-ES' : i18n.language === 'nl' ? 'nl-NL' : i18n.language === 'it' ? 'it-IT' : i18n.language === 'fr' ? 'fr-FR' : 'de-CH';
            return date.toLocaleDateString(locale);
          })()}</span>
        </div>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
    }
    toast.success(t('calendar.pdfExportOpened', 'PDF Export geöffnet'));
  };

  // Export as ICS
  const handleExportICS = () => {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Nexo//Calendar//DE',
      ...filteredEvents.map(e => {
        const date = new Date(e.date);
        const dateStr = date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        return [
          'BEGIN:VEVENT',
          `DTSTART:${dateStr}`,
          `DTEND:${dateStr}`,
          `SUMMARY:${e.title}`,
          `DESCRIPTION:${e.description || ''}`,
          `UID:${e.id}@nexo`,
          'END:VEVENT'
        ].join('\n');
      }),
      'END:VCALENDAR'
    ].join('\n');
    
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kalender-${currentDate.getFullYear()}-${currentDate.getMonth() + 1}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('calendar.icsFileDownloaded', 'ICS Datei heruntergeladen'));
  };

  // Drag & Drop handlers
  const handleDragStart = (event: CalendarEvent, e: React.DragEvent) => {
    if (event.type !== 'appointment') {
      e.preventDefault();
      return;
    }
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', event.id);
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'appointment', id: event.id }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (targetDate: Date, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent click event from firing
    
    // Try to get the dragged event from state first, then from dataTransfer
    let draggedEventData = draggedEvent;
    
    if (!draggedEventData) {
      try {
        const jsonData = e.dataTransfer.getData('application/json');
        if (jsonData) {
          const parsed = JSON.parse(jsonData);
          // Find the full event from the events list
          const allEvents = [...events];
          draggedEventData = allEvents.find(ev => ev.id === parsed.id) || parsed;
        }
      } catch {
        // Fallback to text data
        const eventId = e.dataTransfer.getData('text/plain');
        if (eventId) {
          // Find the event from the current events list
          const allEvents = [...events];
          draggedEventData = allEvents.find(ev => ev.id === eventId);
        }
      }
    }
    
    if (!draggedEventData) {
      console.warn('No dragged event found');
      setDraggedEvent(null);
      return;
    }
    
    // Only allow moving appointments (not invoices or work schedules)
    if (draggedEventData.type !== 'appointment') {
      toast.error(t('calendar.errors.onlyAppointmentsMovable', 'Nur Termine können verschoben werden'));
      setDraggedEvent(null);
      return;
    }

    try {
      // Update the reminder date
      const newDate = new Date(targetDate);
      // Keep the original time if exists
      if (draggedEventData.time) {
        const [hours, minutes] = draggedEventData.time.split(':');
        newDate.setHours(parseInt(hours), parseInt(minutes));
      }
      
      // Extract the reminder ID from the event ID
      // Handle both 'appointment-{id}' and direct ID formats
      let reminderId = draggedEventData.id;
      if (reminderId.startsWith('appointment-')) {
        reminderId = reminderId.replace('appointment-', '');
      }
      
      console.log('Moving appointment:', { eventId: draggedEventData.id, reminderId, newDate });
      await updateReminder(reminderId, { dueDate: newDate });
      
      toast.success(t('calendar.appointmentMoved'));
      await refreshAll();
    } catch (error: any) {
      console.error('Error moving appointment:', error);
      toast.error(t('calendar.errors.moveError', 'Fehler beim Verschieben') + ': ' + (error.message || error));
    }
    
    setDraggedEvent(null);
  };

  // Share calendar
  const handleShareCalendar = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('calendar.shareTitle', 'Mein Kalender'),
          text: t('calendar.shareText', 'Schau dir meinen Kalender an'),
          url: shareUrl
        });
      } catch (e) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t('calendar.linkCopied', 'Link in Zwischenablage kopiert'));
    }
  };

  // Toggle notifications
  const handleToggleNotifications = async () => {
    if (!('Notification' in window)) {
      toast.error(t('calendar.notifications.notSupported', 'Dein Browser unterstützt keine Benachrichtigungen'));
      return;
    }

    if (Notification.permission === 'granted') {
      setNotificationsEnabled(!notificationsEnabled);
      toast.success(notificationsEnabled ? t('calendar.notifications.disabled', 'Benachrichtigungen deaktiviert') : t('calendar.notifications.enabled', 'Benachrichtigungen aktiviert'));
    } else if (Notification.permission === 'denied') {
      toast.error(t('calendar.notifications.blocked', 'Benachrichtigungen wurden blockiert. Bitte in den Browser-Einstellungen aktivieren.'));
    } else {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        toast.success(t('calendar.notifications.enabled', 'Benachrichtigungen aktiviert'));
        // Send test notification
        new Notification(t('calendar.nexoCalendar', 'Nexo Kalender'), {
          body: t('calendar.notifications.nowEnabled', 'Benachrichtigungen sind jetzt aktiviert!'),
          icon: '/favicon.ico'
        });
      } else {
        toast.error(t('calendar.notifications.notAllowed', 'Benachrichtigungen wurden nicht erlaubt'));
      }
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
    <Layout title={t('calendar.title', 'Kalender')}>
      <div className="space-y-6">
        {/* Header */}
        {/* Header Row 1: Navigation */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('calendar.previousMonth', 'Vorheriger Monat')}</TooltipContent>
            </Tooltip>
            <h2 className="text-xl font-bold min-w-[180px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <Button variant="outline" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>{t('calendar.today')}</Button>
            <Button variant="outline" size="icon" onClick={refreshAll} title={t('common.refresh')}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={view} onValueChange={(v: any) => setView(v)}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">{t('calendar.views.month', 'Monat')}</SelectItem>
                <SelectItem value="week">{t('calendar.views.week', 'Woche')}</SelectItem>
                <SelectItem value="list">{t('calendar.views.list', 'Liste')}</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[160px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('calendar.filters.allEvents', 'Alle Events')}</SelectItem>
                <SelectItem value="due">{t('calendar.filters.bills', 'Rechnungen')}</SelectItem>
                <SelectItem value="appointment">{t('calendar.filters.appointments', 'Termine')}</SelectItem>
                <SelectItem value="work">{t('calendar.filters.work', 'Arbeitszeiten')}</SelectItem>
                <SelectItem value="school">{t('calendar.filters.school', 'Schule')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Header Row 2: Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => {
            const today = new Date();
            const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            setNewEvent({ ...newEvent, date: localDate });
            setShowAddDialog(true);
          }}>
            <Plus className="w-4 h-4 mr-1" />
            {t('calendar.appointment', 'Termin')}
          </Button>

          <div className="h-6 w-px bg-border" />

          <Button variant="outline" size="sm" onClick={() => setShowWorkScheduleDialog(true)}>
            <Briefcase className="w-4 h-4 mr-1" />
            {t('calendar.work', 'Arbeit')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowVacationDialog(true)}>
            <Palmtree className="w-4 h-4 mr-1" />
            {t('calendar.vacation', 'Ferien')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowSchoolPlannerDialog(true)}>
            <GraduationCap className="w-4 h-4 mr-1" />
            {t('calendar.school', 'Schule')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowSchoolHolidayDialog(true)}>
            <Sun className="w-4 h-4 mr-1" />
            {t('calendar.schoolHoliday', 'Schulferien')}
          </Button>

          <div className="h-6 w-px bg-border" />

          <Button variant="outline" size="sm" onClick={() => setLocation('/bills')}>
            <FileText className="w-4 h-4 mr-1" />
            {t('nav.bills', 'Rechnungen')}
          </Button>

          <div className="h-6 w-px bg-border hidden sm:block" />

          <div className="relative max-w-[180px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder={t('common.search', 'Suchen...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 h-8 text-sm"
            />
          </div>
        </div>

        {/* Header Row 3: Export & Notifications */}
        <div className="flex items-center gap-1 text-sm">
          <span className="text-muted-foreground mr-1">{t('calendar.export', 'Export')}:</span>
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={handleExportPDF}>
            PDF
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={handleExportICS}>
            ICS
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={handleShareCalendar}>
            <Share2 className="w-3.5 h-3.5 mr-1" />
            {t('calendar.share', 'Teilen')}
          </Button>
          <div className="h-5 w-px bg-border mx-1" />
          <Button 
            variant={notificationsEnabled ? 'default' : 'ghost'} 
            size="sm"
            className="h-7"
            onClick={handleToggleNotifications}
          >
            <BellRing className="w-3.5 h-3.5 mr-1" />
            {notificationsEnabled ? t('calendar.notificationsOn', 'An') : t('calendar.notify', 'Benachrichtigen')}
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <Card 
            className={`cursor-pointer transition-all hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${filterType === 'all' ? 'bg-accent' : ''}`} 
            onClick={() => setFilterType('all')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setFilterType('all');
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={t('calendar.showAll', 'Alle anzeigen')}
          >
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">{t('calendar.total', 'Gesamt')}</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card 
            className="cursor-pointer transition-all hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={() => setFilterType('all')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setFilterType('all');
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={t('calendar.showOverdue', 'Überfällige anzeigen')}
          >
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">{t('calendar.overdue', 'Überfällig')}</p>
              <p className={`text-2xl font-bold ${stats.overdue > 0 ? 'text-red-600' : ''}`}>{stats.overdue}</p>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-all hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${filterType === 'due' ? 'bg-accent' : ''}`} 
            onClick={() => setFilterType('due')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setFilterType('due');
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={t('calendar.showBills', 'Rechnungen anzeigen')}
          >
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">{t('calendar.bills', 'Rechnungen')}</p>
              <p className="text-2xl font-bold">{stats.dueThisMonth}</p>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-all hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${filterType === 'reminder' ? 'bg-accent' : ''}`} 
            onClick={() => setFilterType('reminder')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setFilterType('reminder');
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={t('calendar.showReminders', 'Erinnerungen anzeigen')}
          >
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">{t('calendar.reminders', 'Erinnerungen')}</p>
              <p className="text-2xl font-bold">{stats.reminders}</p>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-all hover:bg-accent ${filterType === 'appointment' ? 'bg-accent' : ''}`} 
            onClick={() => setFilterType('appointment')}
          >
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">{t('calendar.appointments', 'Termine')}</p>
              <p className="text-2xl font-bold">{stats.appointments}</p>
            </CardContent>
          </Card>
        </div>

        {/* Color Legend */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="text-muted-foreground">{t('calendar.legend', 'Legende')}:</span>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-rose-400" />
            <span>{t('calendar.legendBills', 'Rechnungen')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-orange-400" />
            <span>{t('calendar.legendAppointments', 'Termine')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-slate-300" />
            <span>{t('calendar.legendWork', 'Arbeit')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-emerald-300" />
            <span>{t('calendar.legendFree', 'Frei')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-cyan-300" />
            <span>{t('calendar.legendVacation', 'Ferien')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-purple-400" />
            <span>{t('calendar.legendSchool', 'Schule')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-pink-400" />
            <span>{t('calendar.legendHort', 'Hort')}</span>
          </div>
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

              <div 
                className="grid grid-cols-7 gap-1"
                onDragOver={handleDragOver}
              >
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    onClick={(e) => {
                      // Don't trigger day click if we're dropping an event
                      if (!draggedEvent) {
                        handleDayClick(day);
                      }
                    }}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(day.date, e)}
                    className={`min-h-[100px] p-2 border rounded-lg cursor-pointer transition-colors
                      ${day.isCurrentMonth ? 'bg-background hover:bg-accent' : 'bg-muted/30 hover:bg-muted/50'}
                      ${isToday(day.date) ? 'border-primary border-2' : 'border-border'}
                      ${draggedEvent ? 'hover:border-primary hover:border-dashed' : ''}
                    `}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      day.isCurrentMonth ? '' : 'text-muted-foreground'
                    } ${isToday(day.date) ? 'text-primary' : ''}`}>
                      {day.date.getDate()}
                    </div>
                    
                    <div className="space-y-1">
                      {/* School Events first */}
                      {day.schoolEvents && day.schoolEvents.slice(0, 1).map(event => (
                        <div
                          key={event.id}
                          onClick={(e) => handleEventClick(event, e)}
                          className={`text-xs px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80 ${getEventColor(event)}`}
                          title={event.title}
                        >
                          {event.type === 'school' && <GraduationCap className="w-3 h-3 inline mr-1" />}
                          {event.type === 'hort' && <Home className="w-3 h-3 inline mr-1" />}
                          {event.type === 'school-holiday' && <Sun className="w-3 h-3 inline mr-1" />}
                          {event.childName || event.title}
                        </div>
                      ))}
                      {/* Vacations */}
                      {day.vacations.slice(0, day.schoolEvents?.length > 0 ? 0 : 1).map((vacation: any) => (
                        <div
                          key={vacation.id}
                          className="text-xs px-1 py-0.5 rounded truncate bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-200"
                          title={`${vacation.personName}: ${vacation.title}`}
                        >
                          <Palmtree className="w-3 h-3 inline mr-1" />
                          {vacation.personName}
                        </div>
                      ))}
                      {/* Events - with drag support for appointments */}
                      {day.events.slice(0, Math.max(0, 3 - (day.schoolEvents?.length || 0) - (day.vacations?.length || 0))).map(event => (
                        <div
                          key={event.id}
                          draggable={event.type === 'appointment'}
                          onDragStart={(e) => {
                            handleDragStart(event, e);
                            // Prevent click event when dragging
                            e.stopPropagation();
                          }}
                          onDragEnd={() => setDraggedEvent(null)}
                          onClick={(e) => {
                            // Don't trigger click if we just finished dragging
                            if (!draggedEvent) {
                              handleEventClick(event, e);
                            }
                          }}
                          className={`text-xs px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80 ${getEventColor(event)} ${
                            event.type === 'appointment' ? 'cursor-grab active:cursor-grabbing' : ''
                          }`}
                          title={`${getEventDisplayTitle(event)}${event.type === 'appointment' ? ' (ziehen zum verschieben)' : ''}`}
                        >
                          {getEventDisplayTitle(event)}
                        </div>
                      ))}
                      {(day.events.length + day.vacations.length + (day.schoolEvents?.length || 0)) > 3 && (
                        <div className="text-xs text-muted-foreground font-medium">
                          +{day.events.length + day.vacations.length + (day.schoolEvents?.length || 0) - 3} {t('calendar.more', 'mehr')}
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
              <CardTitle>{t('calendar.allEventsIn', 'Alle Events im')} {monthNames[currentDate.getMonth()]}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center py-8 text-muted-foreground">{t('common.loading', 'Laden...')}</p>
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
                            <h4 className="font-medium">{getEventDisplayTitle(event)}</h4>
                            <Badge variant="secondary" className="text-xs">
                              {getEventTypeLabel(event)}
                            </Badge>
                            {event.isOverdue && (
                              <Badge className="bg-red-600 text-white">{t('calendar.overdue', 'Überfällig')}</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{formatDate(event.date)}</span>
                            {event.time && (
                              <>
                                <span>•</span>
                                <span>{event.time} {t('calendar.oclock', 'Uhr')}</span>
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
                                {event.status === 'paid' ? t('finance.paid', 'Bezahlt') :
                                 event.status === 'open' ? t('finance.open', 'Offen') : t('finance.postponed', 'Verschoben')}
                              </Badge>
                            )}
                          </>
                        ) : (
                          event.completed !== undefined && (
                            <Badge variant="outline" className={event.completed ? 'text-green-600 border-green-600' : 'text-muted-foreground'}>
                              {event.completed ? t('calendar.completed', 'Erledigt') : t('calendar.pending', 'Ausstehend')}
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
                  <p className="text-muted-foreground mb-4">{t('calendar.noEventsThisMonth', 'Keine Events in diesem Monat')}</p>
                  <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t('calendar.createAppointment', 'Termin erstellen')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Week View with Time Grid */}
        {view === 'week' && (
          <Card>
            <CardContent className="pt-6 overflow-x-auto">
              {(() => {
                const today = new Date();
                const startOfWeek = new Date(today);
                const dayOfWeek = today.getDay();
                const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                startOfWeek.setDate(today.getDate() + diff);

                const weekDays = Array.from({ length: 7 }, (_, i) => {
                  const date = new Date(startOfWeek);
                  date.setDate(startOfWeek.getDate() + i);
                  // Format date using GLOBAL utility (LOCAL timezone)
                  const dateStr = formatDateLocal(date);
                  const dayEvents = events.filter(event => {
                    const eventDateStr = normalizeEventDate(event.date);
                    return eventDateStr !== '' && eventDateStr === dateStr;
                  });
                  return { date, events: dayEvents };
                });

                const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 - 20:00

                return (
                  <div className="min-w-[800px]">
                    {/* Header */}
                    <div className="grid grid-cols-8 border-b">
                      <div className="p-2 text-center text-sm text-muted-foreground">{t('calendar.time', 'Zeit')}</div>
                      {weekDays.map((day, index) => (
                        <div 
                          key={index} 
                          className={`p-2 text-center cursor-pointer ${
                            isToday(day.date) ? 'bg-primary text-primary-foreground rounded' : ''
                          }`}
                          onClick={() => handleDayClick(day)}
                        >
                          <div className="text-sm font-medium">{dayNames[index]}</div>
                          <div className="text-lg font-bold">{day.date.getDate()}</div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Time Grid */}
                    <div className="relative">
                      {hours.map(hour => (
                        <div key={hour} className="grid grid-cols-8 border-b min-h-[50px]">
                          <div className="p-1 text-xs text-muted-foreground text-right pr-2 border-r">
                            {hour.toString().padStart(2, '0')}:00
                          </div>
                          {weekDays.map((day, dayIndex) => {
                            const hourEvents = day.events.filter(e => {
                              if (!e.time) return hour === 9; // Default to 9 AM
                              const eventHour = parseInt(e.time.split(':')[0]);
                              return eventHour === hour;
                            });
                            return (
                              <div 
                                key={dayIndex} 
                                className="p-0.5 border-r hover:bg-accent/30 transition-colors relative"
                                onClick={() => {
                                  setNewEvent(prev => ({ 
                                    ...prev, 
                                    date: day.date.toISOString().split('T')[0],
                                    time: `${hour.toString().padStart(2, '0')}:00`
                                  }));
                                  setShowAddDialog(true);
                                }}
                              >
                                {hourEvents.map(event => (
                                  <div
                                    key={event.id}
                                    onClick={(e) => { e.stopPropagation(); handleEventClick(event, e); }}
                                    className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 truncate ${getEventColor(event)}`}
                                    title={getEventDisplayTitle(event)}
                                  >
                                    {event.time && <span className="font-medium">{event.time}</span>} {getEventDisplayTitle(event)}
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                    
                    {/* All-day events section */}
                    <div className="mt-4 border-t pt-4">
                      <div className="text-sm font-medium text-muted-foreground mb-2">{t('calendar.allDay', 'Ganztägig / Ohne Uhrzeit')}</div>
                      <div className="grid grid-cols-7 gap-2">
                        {weekDays.map((day, index) => {
                          const allDayEvents = day.events.filter(e => !e.time);
                          return (
                            <div key={index} className="space-y-1">
                              {allDayEvents.map(event => (
                                <div
                                  key={event.id}
                                  onClick={(e) => handleEventClick(event, e)}
                                  className={`text-xs p-1.5 rounded cursor-pointer hover:opacity-80 ${getEventColor(event)}`}
                                >
                                  <div className="font-medium truncate">{getEventDisplayTitle(event)}</div>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>
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
              {t('calendar.upcoming', 'Anstehend (nächste 7 Tage)')}
            </CardTitle>
            <Select 
              value={upcomingFilter}
              onValueChange={setUpcomingFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('common.filter', 'Filter')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('calendar.showAll', 'Alle anzeigen')}</SelectItem>
                <SelectItem value="due">{t('calendar.onlyBills', 'Nur Rechnungen')}</SelectItem>
                <SelectItem value="appointment">{t('calendar.onlyAppointments', 'Nur Termine')}</SelectItem>
                <SelectItem value="overdue">{t('calendar.onlyOverdue', 'Nur Überfällige')}</SelectItem>
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
                      ? t('calendar.noEntriesNext7Days')
                      : upcomingFilter === 'due'
                        ? t('calendar.noBillsDue')
                        : upcomingFilter === 'appointment'
                          ? t('calendar.noAppointments')
                          : t('calendar.noOverdueEntries')}
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
                          <p className="font-medium">{vacation.title || t('calendar.vacation', 'Ferien')}</p>
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
                          <p className="font-medium">{getEventDisplayTitle(event)}</p>
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
            <DialogTitle className="text-xl">{t('calendar.newAppointment', 'Neuer Termin')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div>
              <Label>{t('calendar.titleRequired', 'Titel')} *</Label>
              <Input
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder={t('reminders.titlePlaceholder', 'z.B. Arzttermin, Meeting...')}
                className="mt-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('calendar.dateRequired', 'Datum')} *</Label>
                <Input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>{t('calendar.time', 'Uhrzeit')}</Label>
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
                <Label>{t('calendar.category', 'Kategorie')}</Label>
                <Select value={newEvent.category} onValueChange={(v) => setNewEvent({ ...newEvent, category: v })}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">{t('calendar.categories.general', 'Allgemein')}</SelectItem>
                    <SelectItem value="work">{t('calendar.categories.work', 'Arbeit')}</SelectItem>
                    <SelectItem value="personal">{t('calendar.categories.personal', 'Persönlich')}</SelectItem>
                    <SelectItem value="health">{t('calendar.categories.health', 'Gesundheit')}</SelectItem>
                    <SelectItem value="finance">{t('calendar.categories.finance', 'Finanzen')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('calendar.priority', 'Priorität')}</Label>
                <Select value={newEvent.priority} onValueChange={(v) => setNewEvent({ ...newEvent, priority: v })}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t('calendar.priorities.low', 'Niedrig')}</SelectItem>
                    <SelectItem value="medium">{t('calendar.priorities.medium', 'Mittel')}</SelectItem>
                    <SelectItem value="high">{t('calendar.priorities.high', 'Hoch')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>{t('finance.description', 'Beschreibung')}</Label>
              <Textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder={t('reminders.notesPlaceholder', 'Optionale Beschreibung...')}
                className="mt-2"
                rows={3}
              />
            </div>

            {/* Recurring Events */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Checkbox 
                  id="recurring"
                  checked={newEvent.isRecurring}
                  onCheckedChange={(checked) => setNewEvent({ ...newEvent, isRecurring: !!checked })}
                />
                <Label htmlFor="recurring" className="flex items-center gap-2 cursor-pointer">
                  <Repeat className="w-4 h-4" />
                  {t('calendar.repeat', 'Wiederholen')}
                </Label>
              </div>
              
              {newEvent.isRecurring && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <Label className="text-xs">{t('calendar.interval', 'Intervall')}</Label>
                    <Select value={newEvent.recurrenceRule} onValueChange={(v: any) => setNewEvent({ ...newEvent, recurrenceRule: v })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">{t('finance.daily', 'Täglich')}</SelectItem>
                        <SelectItem value="weekly">{t('finance.weekly', 'Wöchentlich')}</SelectItem>
                        <SelectItem value="monthly">{t('finance.monthly', 'Monatlich')}</SelectItem>
                        <SelectItem value="yearly">{t('finance.yearly', 'Jährlich')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">{t('calendar.count', 'Anzahl')}</Label>
                    <Select value={String(newEvent.recurrenceCount)} onValueChange={(v) => setNewEvent({ ...newEvent, recurrenceCount: parseInt(v) })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">{t('calendar.appointmentsCount', '{{count}} Termine', { count: 2 })}</SelectItem>
                        <SelectItem value="4">{t('calendar.appointmentsCount', '{{count}} Termine', { count: 4 })}</SelectItem>
                        <SelectItem value="6">{t('calendar.appointmentsCount', '{{count}} Termine', { count: 6 })}</SelectItem>
                        <SelectItem value="12">{t('calendar.appointmentsCount', '{{count}} Termine', { count: 12 })}</SelectItem>
                        <SelectItem value="52">{t('calendar.appointmentsCount', '{{count}} Termine', { count: 52 })}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>{t('common.cancel', 'Abbrechen')}</Button>
            <Button onClick={handleAddEvent}>
              {newEvent.isRecurring ? t('calendar.createAppointmentsCount', '{{count}} Termine erstellen', { count: newEvent.recurrenceCount }) : t('common.create', 'Erstellen')}
            </Button>
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
              // Normalize selectedDate using GLOBAL utility (LOCAL timezone)
              const normalizedSelectedDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
              const dateStr = formatDateLocal(normalizedSelectedDate);
              
              const dayEvents = events.filter(event => {
                const eventDateStr = normalizeEventDate(event.date);
                return eventDateStr !== '' && eventDateStr === dateStr;
              });
              
              // Log only in development
              if (typeof (globalThis as any).process !== 'undefined' && (globalThis as any).process?.env?.NODE_ENV === 'development') {
                console.log('[Calendar Web] Day events filter:', {
                  selectedDate: normalizedSelectedDate.toISOString(),
                  dateStr,
                  totalEvents: events.length,
                  filteredCount: dayEvents.length,
                  filteredEvents: dayEvents.map(e => ({ title: e.title, date: e.date, type: e.type }))
                });
              }

              return (
                <>
                  {/* Events Section */}
                  {dayEvents.length === 0 ? (
                    <div className="text-center py-4 bg-muted/30 rounded-lg">
                      <CalendarIcon className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-muted-foreground text-sm">{t('calendar.noEventsThisDay', 'Keine Events an diesem Tag')}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">{dayEvents.length} {dayEvents.length === 1 ? t('calendar.event', 'Event') : t('calendar.events', 'Events')}</p>
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
                                <h4 className="font-medium text-sm">{getEventDisplayTitle(event)}</h4>
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
                    <p className="text-sm font-medium text-muted-foreground mb-3">{t('calendar.quickActions', 'Schnellaktionen')}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        className="h-auto py-3 flex-col gap-1"
                        onClick={() => {
                          const localDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
                          setNewEvent({ ...newEvent, date: localDate });
                          setShowDayDialog(false);
                          setShowAddDialog(true);
                        }}
                      >
                        <CalendarIcon className="w-4 h-4" />
                        <span className="text-xs">{t('calendar.createAppointment', 'Termin erstellen')}</span>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="h-auto py-3 flex-col gap-1"
                        onClick={() => {
                          toast.info(t('calendar.info.selectPersonAddBill', 'Wähle eine Person und füge eine Rechnung hinzu'));
                          setShowDayDialog(false);
                          setTimeout(() => setLocation('/people'), 100);
                        }}
                      >
                        <FileText className="w-4 h-4" />
                        <span className="text-xs">{t('calendar.addBill', 'Rechnung hinzufügen')}</span>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="h-auto py-3 flex-col gap-1"
                        onClick={() => {
                          toast.info(t('calendar.info.recordExpenseOrIncome', 'Erfasse eine neue Ausgabe oder Einnahme'));
                          setShowDayDialog(false);
                          setTimeout(() => setLocation('/finance'), 100);
                        }}
                      >
                        <ArrowDownLeft className="w-4 h-4" />
                        <span className="text-xs">{t('calendar.recordExpense', 'Ausgabe erfassen')}</span>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="h-auto py-3 flex-col gap-1"
                        onClick={() => {
                          toast.info(t('calendar.info.createReminder', 'Erstelle eine neue Erinnerung'));
                          setShowDayDialog(false);
                          setTimeout(() => setLocation('/reminders'), 100);
                        }}
                      >
                        <Bell className="w-4 h-4" />
                        <span className="text-xs">{t('calendar.reminder', 'Erinnerung')}</span>
                      </Button>
                    </div>
                  </div>

                  {/* Quick Navigation */}
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-muted-foreground mb-3">{t('calendar.navigation', 'Navigation')}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => { setShowDayDialog(false); setTimeout(() => setLocation('/bills'), 100); }}
                      >
                        {t('nav.bills', 'Rechnungen')}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => { setShowDayDialog(false); setTimeout(() => setLocation('/people'), 100); }}
                      >
                        {t('nav.people', 'Personen')}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => { setShowDayDialog(false); setTimeout(() => setLocation('/finance'), 100); }}
                      >
                        {t('nav.finance', 'Finanzen')}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => { setShowDayDialog(false); setTimeout(() => setLocation('/reminders'), 100); }}
                      >
                        {t('nav.reminders', 'Erinnerungen')}
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
                    <p className="text-red-600 font-medium">{t('calendar.billOverdue', 'Diese Rechnung ist überfällig!')}</p>
                    <p className="text-sm text-red-500">{t('calendar.pleaseProcess', 'Bitte so schnell wie möglich bearbeiten.')}</p>
                  </div>
                </div>
              )}

              {/* Hauptinformationen */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">{t('finance.date', 'Datum')}</p>
                  <p className="font-medium">{formatDate(selectedEvent.date)}</p>
                  {selectedEvent.time && (
                    <p className="text-sm text-muted-foreground">{selectedEvent.time} {t('calendar.oclock', 'Uhr')}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('calendar.type', 'Typ')}</p>
                  <Badge className={getEventColor(selectedEvent)}>
                    {getEventTypeLabel(selectedEvent)}
                  </Badge>
                </div>
              </div>

              {/* Person */}
              {selectedEvent.personName && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('finance.person', 'Person')}</p>
                    <p className="font-medium">{selectedEvent.personName}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => {
                    setShowEventDialog(false);
                    setLocation('/people');
                  }}>
                    {t('calendar.goToPerson', 'Zur Person')}
                  </Button>
                </div>
              )}

              {/* Betrag und Status */}
              {selectedEvent.amount && (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('finance.amount', 'Betrag')}</p>
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
                        {selectedEvent.status === 'paid' ? t('finance.paid', 'Bezahlt') :
                         selectedEvent.status === 'open' ? t('finance.open', 'Offen') : t('finance.postponed', 'Verschoben')}
                      </Badge>
                    )}
                  </div>
                  
                  {selectedEvent.direction && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-muted-foreground mb-1">{t('calendar.direction', 'Richtung')}</p>
                      {selectedEvent.direction === 'incoming' ? (
                        <span className="flex items-center gap-2 text-green-600">
                          <ArrowDownLeft className="w-4 h-4" /> 
                          <span>{t('calendar.claim', 'Forderung (Person schuldet mir)')}</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 text-red-600">
                          <ArrowUpRight className="w-4 h-4" /> 
                          <span>{t('calendar.liability', 'Verbindlichkeit (Ich schulde Person)')}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Beschreibung */}
              {selectedEvent.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t('finance.description', 'Beschreibung')}</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">{selectedEvent.description}</p>
                </div>
              )}

              {/* Status für Termine */}
              {selectedEvent.type === 'appointment' && selectedEvent.completed !== undefined && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span>{t('calendar.status', 'Status')}</span>
                  <Badge variant="outline" className={selectedEvent.completed ? 'text-green-600 border-green-600' : 'text-muted-foreground'}>
                    {selectedEvent.completed ? t('calendar.completed', 'Erledigt') : t('calendar.pending', 'Ausstehend')}
                  </Badge>
                </div>
              )}

              {/* Quick Actions */}
              <div className="border-t pt-4 mt-4">
                <p className="text-sm font-medium text-muted-foreground mb-3">{t('calendar.quickActions', 'Schnellaktionen')}</p>
                <div className="grid grid-cols-2 gap-2">
                  {selectedEvent.type === 'due' && selectedEvent.personId && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          toast.info(t('calendar.info.openPersonEditBill', 'Öffne Person um Rechnung zu bearbeiten'));
                          setShowEventDialog(false);
                          setTimeout(() => setLocation('/people'), 100);
                        }}
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        {t('calendar.editBill', 'Rechnung bearbeiten')}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          toast.info(t('calendar.info.recordPaymentAsExpense', 'Erfasse die Zahlung als Ausgabe'));
                          setShowEventDialog(false);
                          setTimeout(() => setLocation('/finance'), 100);
                        }}
                      >
                        <ArrowUpRight className="w-4 h-4 mr-2" />
                        {t('calendar.recordAsExpense', 'Als Ausgabe erfassen')}
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
                          toast.info(t('calendar.info.openRemindersToEdit', 'Öffne Erinnerungen zum Bearbeiten'));
                          setShowEventDialog(false);
                          setTimeout(() => setLocation('/reminders'), 100);
                        }}
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        {t('common.edit')}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full"
                        onClick={async () => {
                          try {
                            const reminderId = selectedEvent.id.replace('appointment-', '');
                            await updateReminder(reminderId, { status: selectedEvent.completed ? 'ausstehend' : 'erledigt' });
                            toast.success(selectedEvent.completed ? t('calendar.markedAsPending') : t('calendar.markedAsCompleted'));
                            setShowEventDialog(false);
                            fetchEvents();
                          } catch (error) {
                            toast.error(t('calendar.errors.updateError'));
                          }
                        }}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {selectedEvent.completed ? t('calendar.markAsPending', 'Als ausstehend') : t('calendar.markAsCompleted', 'Als erledigt')}
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
                  onClick={() => { setShowEventDialog(false); setTimeout(() => setLocation('/bills'), 100); }}
                >
                  {t('calendar.allBills', 'Alle Rechnungen')}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => { setShowEventDialog(false); setTimeout(() => setLocation('/people'), 100); }}
                >
                  {t('nav.people', 'Personen')}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => { setShowEventDialog(false); setTimeout(() => setLocation('/finance'), 100); }}
                >
                  {t('nav.finance', 'Finanzen')}
                </Button>
              </div>
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowEventDialog(false)}>
              {t('common.close', 'Schliessen')}
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

      {/* School Planner Dialog */}
      <SchoolPlannerDialog
        open={showSchoolPlannerDialog}
        onOpenChange={setShowSchoolPlannerDialog}
        onDataChanged={fetchEvents}
      />

      {/* School Holiday Dialog */}
      <SchoolHolidayDialog
        open={showSchoolHolidayDialog}
        onOpenChange={setShowSchoolHolidayDialog}
        onDataChanged={fetchEvents}
      />
    </Layout>
  );
}
