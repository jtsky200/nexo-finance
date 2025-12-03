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
  Briefcase, Palmtree, Search, Repeat, Download, Share2, BellRing,
  GraduationCap, Home, Sun
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { useReminders, createReminder, updateReminder, deleteReminder } from '@/lib/firebaseHooks';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
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
    date: new Date().toISOString().split('T')[0],
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
      const notificationKey = `notified-${today.toISOString().split('T')[0]}`;
      if (!sessionStorage.getItem(notificationKey)) {
        new Notification('Nexo Kalender', {
          body: `Du hast ${todayEvents.length} Event(s) heute: ${todayEvents.slice(0, 3).map(e => e.title).join(', ')}`,
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
      
      setEvents(eventsData.events || []);
      setVacations(vacationsData.vacations || []);
      setSchoolSchedules(schoolData.schedules || []);
      setSchoolHolidays(holidaysData.holidays || []);
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

  // Helper to get school schedules for a date
  const getSchoolSchedulesForDate = useCallback((date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return schoolSchedules.filter(s => s.date === dateStr);
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
            date: date.toISOString().split('T')[0],
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
      const dayEvents = filteredEvts.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.toDateString() === date.toDateString();
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
    return date.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
      if (event.schoolType === 'half') return 'Halbtag';
      if (event.schoolType === 'off') return 'Schulfrei';
      if (event.schoolType === 'holiday') return 'Ferien';
      return 'Schule';
    }
    if (event.type === 'hort') {
      if (event.hortType === 'lunch') return 'Hort (Mittag)';
      if (event.hortType === 'afternoon') return 'Hort (Nachmittag)';
      return 'Hort';
    }
    if (event.type === 'school-holiday') return 'Schulferien';
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

  // Add new appointment (with recurring support)
  const handleAddEvent = async () => {
    if (!newEvent.title.trim()) {
      toast.error('Titel ist erforderlich');
      return;
    }

    try {
      const baseDate = new Date(newEvent.date + (newEvent.time ? `T${newEvent.time}` : 'T12:00'));
      
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
            description: newEvent.description,
            date,
            category: newEvent.category,
            priority: newEvent.priority,
            completed: false,
          });
        }
        toast.success(`${dates.length} wiederkehrende Termine erstellt`);
      } else {
        await createReminder({
          title: newEvent.title,
          description: newEvent.description,
          date: baseDate,
          category: newEvent.category,
          priority: newEvent.priority,
          completed: false,
        });
        toast.success('Termin erstellt');
      }

      setNewEvent({ title: '', description: '', date: new Date().toISOString().split('T')[0], time: '', category: 'general', priority: 'medium', isRecurring: false, recurrenceRule: 'weekly', recurrenceCount: 4 });
      setShowAddDialog(false);
      await refreshAll();
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    }
  };

  // Export as PDF
  const handleExportPDF = () => {
    const monthName = currentDate.toLocaleDateString('de-CH', { month: 'long', year: 'numeric' });
    const content = `
      <html>
      <head>
        <title>Kalender - ${monthName}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .event { padding: 8px; margin: 5px 0; border-left: 3px solid #3b82f6; background: #f5f5f5; }
          .date { font-weight: bold; color: #666; }
        </style>
      </head>
      <body>
        <h1>Kalender - ${monthName}</h1>
        ${filteredEvents.map(e => `
          <div class="event">
            <div class="date">${new Date(e.date).toLocaleDateString('de-CH')}</div>
            <div><strong>${e.title}</strong></div>
            ${e.personName ? `<div>Person: ${e.personName}</div>` : ''}
          </div>
        `).join('')}
      </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.print();
    }
    toast.success('PDF Export geöffnet');
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
    toast.success('ICS Datei heruntergeladen');
  };

  // Drag & Drop handlers
  const handleDragStart = (event: CalendarEvent, e: React.DragEvent) => {
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', event.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (targetDate: Date, e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedEvent) return;
    
    // Only allow moving appointments (not invoices or work schedules)
    if (draggedEvent.type !== 'appointment') {
      toast.error('Nur Termine können verschoben werden');
      setDraggedEvent(null);
      return;
    }

    try {
      // Update the reminder date
      const newDate = new Date(targetDate);
      // Keep the original time if exists
      if (draggedEvent.time) {
        const [hours, minutes] = draggedEvent.time.split(':');
        newDate.setHours(parseInt(hours), parseInt(minutes));
      }
      
      // Extract the reminder ID from the event ID
      const reminderId = draggedEvent.id.replace('appointment-', '');
      await updateReminder(reminderId, { date: newDate });
      
      toast.success('Termin verschoben');
      await refreshAll();
    } catch (error: any) {
      toast.error('Fehler beim Verschieben: ' + error.message);
    }
    
    setDraggedEvent(null);
  };

  // Share calendar
  const handleShareCalendar = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mein Kalender',
          text: 'Schau dir meinen Kalender an',
          url: shareUrl
        });
      } catch (e) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link in Zwischenablage kopiert');
    }
  };

  // Toggle notifications
  const handleToggleNotifications = async () => {
    if (!('Notification' in window)) {
      toast.error('Dein Browser unterstützt keine Benachrichtigungen');
      return;
    }

    if (Notification.permission === 'granted') {
      setNotificationsEnabled(!notificationsEnabled);
      toast.success(notificationsEnabled ? 'Benachrichtigungen deaktiviert' : 'Benachrichtigungen aktiviert');
    } else if (Notification.permission === 'denied') {
      toast.error('Benachrichtigungen wurden blockiert. Bitte in den Browser-Einstellungen aktivieren.');
    } else {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        toast.success('Benachrichtigungen aktiviert');
        // Send test notification
        new Notification('Nexo Kalender', {
          body: 'Benachrichtigungen sind jetzt aktiviert!',
          icon: '/favicon.ico'
        });
      } else {
        toast.error('Benachrichtigungen wurden nicht erlaubt');
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

            <Button variant="outline" onClick={() => setShowSchoolPlannerDialog(true)}>
              <GraduationCap className="w-4 h-4 mr-2" />
              Schulplaner
            </Button>

            <Button variant="outline" onClick={() => setShowSchoolHolidayDialog(true)}>
              <Sun className="w-4 h-4 mr-2" />
              Schulferien
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
                <SelectItem value="appointment">Termine</SelectItem>
                <SelectItem value="work">Arbeitszeiten</SelectItem>
                <SelectItem value="school">Schule</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Search & Export Row */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Events suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportICS}>
            <Download className="w-4 h-4 mr-2" />
            ICS
          </Button>
          <Button variant="outline" size="sm" onClick={handleShareCalendar}>
            <Share2 className="w-4 h-4 mr-2" />
            Teilen
          </Button>
          <Button 
            variant={notificationsEnabled ? 'default' : 'outline'} 
            size="sm" 
            onClick={handleToggleNotifications}
          >
            <BellRing className="w-4 h-4 mr-2" />
            {notificationsEnabled ? 'Benachrichtigt' : 'Benachrichtigen'}
          </Button>
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

        {/* Color Legend */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="text-muted-foreground">Legende:</span>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-rose-400" />
            <span>Rechnungen</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-orange-400" />
            <span>Termine</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-slate-300" />
            <span>Arbeit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-emerald-300" />
            <span>Frei</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-cyan-300" />
            <span>Ferien</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-purple-400" />
            <span>Schule</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-pink-400" />
            <span>Hort</span>
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

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    onClick={() => handleDayClick(day)}
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
                          onDragStart={(e) => handleDragStart(event, e)}
                          onDragEnd={() => setDraggedEvent(null)}
                          onClick={(e) => handleEventClick(event, e)}
                          className={`text-xs px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80 ${getEventColor(event)} ${
                            event.type === 'appointment' ? 'cursor-grab active:cursor-grabbing' : ''
                          }`}
                          title={`${event.title}${event.type === 'appointment' ? ' (ziehen zum verschieben)' : ''}`}
                        >
                          {event.title}
                        </div>
                      ))}
                      {(day.events.length + day.vacations.length + (day.schoolEvents?.length || 0)) > 3 && (
                        <div className="text-xs text-muted-foreground font-medium">
                          +{day.events.length + day.vacations.length + (day.schoolEvents?.length || 0) - 3} mehr
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
                  const dayEvents = events.filter(event => {
                    const eventDate = new Date(event.date);
                    return eventDate.toDateString() === date.toDateString();
                  });
                  return { date, events: dayEvents };
                });

                const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 - 20:00

                return (
                  <div className="min-w-[800px]">
                    {/* Header */}
                    <div className="grid grid-cols-8 border-b">
                      <div className="p-2 text-center text-sm text-muted-foreground">Zeit</div>
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
                                    title={event.title}
                                  >
                                    {event.time && <span className="font-medium">{event.time}</span>} {event.title}
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
                      <div className="text-sm font-medium text-muted-foreground mb-2">Ganztägig / Ohne Uhrzeit</div>
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
                                  <div className="font-medium truncate">{event.title}</div>
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
                  Wiederholen
                </Label>
              </div>
              
              {newEvent.isRecurring && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <Label className="text-xs">Intervall</Label>
                    <Select value={newEvent.recurrenceRule} onValueChange={(v: any) => setNewEvent({ ...newEvent, recurrenceRule: v })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Täglich</SelectItem>
                        <SelectItem value="weekly">Wöchentlich</SelectItem>
                        <SelectItem value="monthly">Monatlich</SelectItem>
                        <SelectItem value="yearly">Jährlich</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Anzahl</Label>
                    <Select value={String(newEvent.recurrenceCount)} onValueChange={(v) => setNewEvent({ ...newEvent, recurrenceCount: parseInt(v) })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 Termine</SelectItem>
                        <SelectItem value="4">4 Termine</SelectItem>
                        <SelectItem value="6">6 Termine</SelectItem>
                        <SelectItem value="12">12 Termine</SelectItem>
                        <SelectItem value="52">52 Termine</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Abbrechen</Button>
            <Button onClick={handleAddEvent}>
              {newEvent.isRecurring ? `${newEvent.recurrenceCount} Termine erstellen` : 'Erstellen'}
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
