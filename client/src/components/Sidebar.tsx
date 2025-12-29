import { cn } from '@/lib/utils';

import { useState, useMemo, useCallback } from 'react';

import { Link, useLocation } from 'wouter';

import { useTranslation } from 'react-i18next';

import { 
  LayoutDashboard, 
  Bell, 
  Wallet, 
  ShoppingCart,
  FileText, 
  Settings,
  ClipboardList,
  Users,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  ScanLine,
  MessageSquare
} from 'lucide-react';

import SidebarCalendarDayDialog from './SidebarCalendarDayDialog';
import NexoLogo from './NexoLogo';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { t } = useTranslation();
  const [miniCalMonth, setMiniCalMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayDialog, setShowDayDialog] = useState(false);

  const navItems = useMemo(() => [
    { path: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    { path: '/calendar', icon: Calendar, label: t('nav.calendar') },
    { path: '/reminders', icon: Bell, label: t('nav.reminders') },
    { path: '/finance', icon: Wallet, label: t('nav.finance') },
    { path: '/people', icon: Users, label: t('nav.people') },
    { path: '/bills', icon: ClipboardList, label: t('nav.bills') },
    { path: '/documents', icon: ScanLine, label: t('nav.documents') },
    { path: '/shopping', icon: ShoppingCart, label: t('nav.shopping') },
    { path: '/taxes', icon: FileText, label: t('nav.taxes') },
    { path: '/ai-chat', icon: MessageSquare, label: t('nav.assistant') },
    { path: '/settings', icon: Settings, label: t('nav.settings') },
  ], [t]);

  // Mini Calendar Logic
  const miniCalDays = useMemo(() => {
    const year = miniCalMonth.getFullYear();
    const month = miniCalMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    
    const days: { date: Date; isCurrentMonth: boolean }[] = [];
    
    // Previous month days
    const prevMonth = new Date(year, month, 0);
    const daysInPrevMonth = prevMonth.getDate();
    for (let i = adjustedStartDay - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month - 1, daysInPrevMonth - i), isCurrentMonth: false });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    
    // Next month days (fill to 42 = 6 weeks)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    
    return days;
  }, [miniCalMonth]);

  const isToday = useCallback((date: Date) => date.toDateString() === new Date().toDateString(), []);

  const handleDayClick = useCallback((date: Date) => {
    setSelectedDate(date);
    setShowDayDialog(true);
  }, []);

  const monthNames = useMemo(() => [
    t('calendar.months.january', 'Jan').substring(0, 3),
    t('calendar.months.february', 'Feb').substring(0, 3),
    t('calendar.months.march', 'Mär').substring(0, 3),
    t('calendar.months.april', 'Apr').substring(0, 3),
    t('calendar.months.may', 'Mai').substring(0, 3),
    t('calendar.months.june', 'Jun').substring(0, 3),
    t('calendar.months.july', 'Jul').substring(0, 3),
    t('calendar.months.august', 'Aug').substring(0, 3),
    t('calendar.months.september', 'Sep').substring(0, 3),
    t('calendar.months.october', 'Okt').substring(0, 3),
    t('calendar.months.november', 'Nov').substring(0, 3),
    t('calendar.months.december', 'Dez').substring(0, 3),
  ], [t]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside
        data-tutorial="navigation"
        className={cn(
          "fixed top-0 left-0 h-full bg-card border-r border-border z-50 transition-transform duration-300",
          "w-64 flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo and close button */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-border">
          <NexoLogo variant="full" size="md" />
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-accent rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => onClose?.()}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors cursor-pointer w-full text-left no-underline",
                  "hover:bg-accent hover:text-accent-foreground",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Mini Calendar */}
        <div className="px-3 py-3 border-t border-border">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-2">
            <button 
              onClick={() => setMiniCalMonth(new Date(miniCalMonth.getFullYear(), miniCalMonth.getMonth() - 1, 1))}
              className="p-1 hover:bg-accent rounded"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium">
              {monthNames[miniCalMonth.getMonth()]} {miniCalMonth.getFullYear()}
            </span>
            <button 
              onClick={() => setMiniCalMonth(new Date(miniCalMonth.getFullYear(), miniCalMonth.getMonth() + 1, 1))}
              className="p-1 hover:bg-accent rounded"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {['M', 'D', 'M', 'D', 'F', 'S', 'S'].map((day, i) => (
              <div key={i} className="text-center text-[10px] text-muted-foreground font-medium">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {miniCalDays.map((day, index) => (
              <button
                key={index}
                onClick={() => handleDayClick(day.date)}
                className={cn(
                  "w-7 h-7 text-[10px] rounded transition-colors",
                  day.isCurrentMonth ? "hover:bg-accent" : "text-muted-foreground/40",
                  isToday(day.date) && "bg-primary text-primary-foreground font-bold"
                )}
              >
                {day.date.getDate()}
              </button>
            ))}
          </div>

          {/* Today Button */}
          <button
            onClick={() => {
              setMiniCalMonth(new Date());
              handleDayClick(new Date());
            }}
            className="w-full mt-2 text-xs py-1.5 text-center text-primary hover:bg-accent rounded transition-colors"
          >
            {t('calendar.today', 'Heute')}
          </button>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            © 2025 Nexo
          </p>
        </div>
      </aside>

      {/* Day Detail Dialog */}
      <SidebarCalendarDayDialog
        date={selectedDate}
        open={showDayDialog}
        onOpenChange={setShowDayDialog}
      />
    </>
  );
}
