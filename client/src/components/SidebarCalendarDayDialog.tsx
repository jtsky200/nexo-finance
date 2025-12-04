import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  X, Calendar, Plus, Clock, FileText, Wallet, Bell,
  Users, Briefcase, Sun, GraduationCap, Home, AlertCircle, Coffee, CalendarOff
} from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { toast } from 'sonner';
import { createReminder, usePeople } from '@/lib/firebaseHooks';

interface CalendarEvent {
  id: string;
  title: string;
  type: 'due' | 'reminder' | 'appointment' | 'work' | 'vacation' | 'school' | 'hort' | 'school-holiday';
  date: string;
  time?: string;
  amount?: number;
  personName?: string;
  status?: string;
  isOverdue?: boolean;
}

interface SidebarCalendarDayDialogProps {
  date: Date | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SidebarCalendarDayDialog({ date, open, onOpenChange }: SidebarCalendarDayDialogProps) {
  const [, setLocation] = useLocation();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState<'appointment' | 'work' | 'vacation' | null>(null);
  const [quickAddData, setQuickAddData] = useState({
    title: '',
    type: 'termin',
    workType: 'full',
    notes: '',
    personId: '',
    personName: ''
  });
  
  const { data: people = [] } = usePeople();
  const householdPeople = people.filter(p => !p.type || p.type === 'household' || p.type === 'child');

  useEffect(() => {
    if (open && date) {
      fetchEventsForDate();
    }
  }, [open, date]);

  const fetchEventsForDate = async () => {
    if (!date) return;
    
    setIsLoading(true);
    try {
      const getCalendarEventsFunc = httpsCallable(functions, 'getCalendarEvents');
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const result = await getCalendarEventsFunc({
        startDate: startOfDay.toISOString(),
        endDate: endOfDay.toISOString()
      });
      
      const data = result.data as { events: CalendarEvent[] };
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (d: Date) => {
    const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    return `${weekdays[d.getDay()]}, ${d.getDate()}. ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'due': return <FileText className="w-4 h-4" />;
      case 'reminder': return <Bell className="w-4 h-4" />;
      case 'appointment': return <Calendar className="w-4 h-4" />;
      case 'work': return <Briefcase className="w-4 h-4" />;
      case 'vacation': return <Sun className="w-4 h-4" />;
      case 'school': return <GraduationCap className="w-4 h-4" />;
      case 'hort': return <Home className="w-4 h-4" />;
      case 'school-holiday': return <Sun className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const getEventColor = (type: string, isOverdue?: boolean) => {
    if (isOverdue) return 'bg-red-100 text-red-700 border-red-200';
    switch (type) {
      case 'due': return 'bg-red-50 text-red-700 border-red-200';
      case 'reminder': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'appointment': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'work': return 'bg-slate-50 text-slate-700 border-slate-200';
      case 'vacation': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'school': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'hort': return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'school-holiday': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'due': return 'Rechnung';
      case 'reminder': return 'Erinnerung';
      case 'appointment': return 'Termin';
      case 'work': return 'Arbeit';
      case 'vacation': return 'Ferien';
      case 'school': return 'Schule';
      case 'hort': return 'Hort';
      case 'school-holiday': return 'Schulferien';
      default: return 'Ereignis';
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(amount / 100);
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'appointment':
        setShowQuickAdd('appointment');
        setQuickAddData({ ...quickAddData, title: '', type: 'termin', notes: '' });
        break;
      case 'work':
        setShowQuickAdd('work');
        setQuickAddData({ ...quickAddData, workType: 'full' });
        break;
      case 'vacation':
        setShowQuickAdd('vacation');
        break;
      case 'invoice':
        onOpenChange(false);
        setLocation('/people');
        toast.info('Wähle eine Person, um eine Rechnung hinzuzufügen');
        break;
      case 'expense':
        onOpenChange(false);
        setLocation('/finance?tab=expenses');
        break;
      case 'reminder':
        onOpenChange(false);
        setLocation('/reminders');
        break;
    }
  };

  const handleSaveAppointment = async () => {
    if (!quickAddData.title || !date) {
      toast.error('Bitte Titel eingeben');
      return;
    }

    try {
      await createReminder({
        title: quickAddData.title,
        type: quickAddData.type as any,
        dueDate: date,
        isAllDay: true,
        notes: quickAddData.notes || undefined,
      } as any);
      
      toast.success('Termin erstellt');
      setShowQuickAdd(null);
      fetchEventsForDate();
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    }
  };

  const handleSaveWorkSchedule = async () => {
    if (!date) return;
    
    if (!quickAddData.personId) {
      toast.error('Bitte Person auswählen');
      return;
    }

    try {
      const createWorkScheduleFunc = httpsCallable(functions, 'createWorkSchedule');
      await createWorkScheduleFunc({
        date: date.toISOString().split('T')[0],
        type: quickAddData.workType,
        personId: quickAddData.personId,
        personName: quickAddData.personName,
      });
      
      toast.success(quickAddData.workType === 'off' ? 'Frei eingetragen' : 'Arbeitszeit eingetragen');
      setShowQuickAdd(null);
      setQuickAddData({ ...quickAddData, personId: '', personName: '' });
      fetchEventsForDate();
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    }
  };

  const handleSaveVacation = async () => {
    if (!date) return;
    
    if (!quickAddData.personId) {
      toast.error('Bitte Person auswählen');
      return;
    }

    try {
      const createVacationFunc = httpsCallable(functions, 'createVacation');
      await createVacationFunc({
        startDate: date.toISOString(),
        endDate: date.toISOString(),
        type: 'urlaub',
        title: 'Urlaub',
        personId: quickAddData.personId,
        personName: quickAddData.personName,
      });
      
      toast.success('Urlaub eingetragen');
      setShowQuickAdd(null);
      setQuickAddData({ ...quickAddData, personId: '', personName: '' });
      fetchEventsForDate();
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    }
  };

  if (!date) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden" showCloseButton={false}>
        {/* Header */}
        <div className="bg-slate-50 dark:bg-slate-900 px-5 py-4 border-b">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-base">{formatDate(date)}</h2>
                <p className="text-xs text-muted-foreground">
                  {events.length} {events.length === 1 ? 'Ereignis' : 'Ereignisse'}
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-5 py-4 max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-6 h-6 mx-auto mb-2 animate-pulse" />
              <p className="text-sm">Laden...</p>
            </div>
          ) : events.length > 0 ? (
            <div className="space-y-2">
              {events.map((event, index) => (
                <div
                  key={event.id || index}
                  className={`p-3 rounded-lg border ${getEventColor(event.type, event.isOverdue)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getEventIcon(event.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">{event.title}</span>
                        {event.isOverdue && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                            Überfällig
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs opacity-80">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {getEventTypeLabel(event.type)}
                        </Badge>
                        {event.time && <span>{event.time}</span>}
                        {event.personName && <span>· {event.personName}</span>}
                      </div>
                      {event.amount && (
                        <p className="text-sm font-semibold mt-1">{formatAmount(event.amount)}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 mx-auto mb-3 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium mb-1">Keine Ereignisse</p>
              <p className="text-xs text-muted-foreground">
                An diesem Tag sind keine Termine oder Aufgaben geplant.
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions or Quick Add Form */}
        <div className="px-5 py-4 border-t bg-slate-50/50 dark:bg-slate-900/50">
          {showQuickAdd === 'appointment' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Neuer Termin</p>
                <button onClick={() => setShowQuickAdd(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div>
                <Label className="text-xs">Titel *</Label>
                <Input
                  value={quickAddData.title}
                  onChange={(e) => setQuickAddData({ ...quickAddData, title: e.target.value })}
                  placeholder="z.B. Arzttermin"
                  className="h-9 mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Typ</Label>
                <Select
                  value={quickAddData.type}
                  onValueChange={(v) => setQuickAddData({ ...quickAddData, type: v })}
                >
                  <SelectTrigger className="h-9 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="termin">Termin</SelectItem>
                    <SelectItem value="aufgabe">Aufgabe</SelectItem>
                    <SelectItem value="geburtstag">Geburtstag</SelectItem>
                    <SelectItem value="andere">Andere</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Notizen</Label>
                <Textarea
                  value={quickAddData.notes}
                  onChange={(e) => setQuickAddData({ ...quickAddData, notes: e.target.value })}
                  placeholder="Optional"
                  className="mt-1"
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowQuickAdd(null)} className="flex-1">
                  Abbrechen
                </Button>
                <Button size="sm" onClick={handleSaveAppointment} className="flex-1">
                  Speichern
                </Button>
              </div>
            </div>
          ) : showQuickAdd === 'work' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Arbeitszeit eintragen</p>
                <button onClick={() => setShowQuickAdd(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div>
                <Label className="text-xs">Person *</Label>
                <Select
                  value={quickAddData.personId}
                  onValueChange={(v) => {
                    const person = householdPeople.find(p => p.id === v);
                    setQuickAddData({ ...quickAddData, personId: v, personName: person?.name || '' });
                  }}
                >
                  <SelectTrigger className="h-9 mt-1">
                    <SelectValue placeholder="Person wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {householdPeople.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={quickAddData.workType === 'full' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setQuickAddData({ ...quickAddData, workType: 'full' })}
                  className="h-12 flex-col gap-1"
                >
                  <Briefcase className="w-4 h-4" />
                  <span className="text-xs">Ganztags</span>
                </Button>
                <Button
                  variant={quickAddData.workType === 'morning' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setQuickAddData({ ...quickAddData, workType: 'morning' })}
                  className="h-12 flex-col gap-1"
                >
                  <Coffee className="w-4 h-4" />
                  <span className="text-xs">Vormittag</span>
                </Button>
                <Button
                  variant={quickAddData.workType === 'afternoon' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setQuickAddData({ ...quickAddData, workType: 'afternoon' })}
                  className="h-12 flex-col gap-1"
                >
                  <Sun className="w-4 h-4" />
                  <span className="text-xs">Nachmittag</span>
                </Button>
                <Button
                  variant={quickAddData.workType === 'off' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setQuickAddData({ ...quickAddData, workType: 'off' })}
                  className="h-12 flex-col gap-1"
                >
                  <CalendarOff className="w-4 h-4" />
                  <span className="text-xs">Frei</span>
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowQuickAdd(null)} className="flex-1">
                  Abbrechen
                </Button>
                <Button size="sm" onClick={handleSaveWorkSchedule} className="flex-1">
                  Speichern
                </Button>
              </div>
            </div>
          ) : showQuickAdd === 'vacation' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Urlaub/Ferien eintragen</p>
                <button onClick={() => setShowQuickAdd(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div>
                <Label className="text-xs">Person *</Label>
                <Select
                  value={quickAddData.personId}
                  onValueChange={(v) => {
                    const person = householdPeople.find(p => p.id === v);
                    setQuickAddData({ ...quickAddData, personId: v, personName: person?.name || '' });
                  }}
                >
                  <SelectTrigger className="h-9 mt-1">
                    <SelectValue placeholder="Person wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {householdPeople.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                Urlaub für {date ? formatDate(date) : ''} eintragen
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowQuickAdd(null)} className="flex-1">
                  Abbrechen
                </Button>
                <Button size="sm" onClick={handleSaveVacation} className="flex-1">
                  <Sun className="w-4 h-4 mr-1" />
                  Eintragen
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs font-medium text-muted-foreground mb-3">Schnellzugriff</p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-col h-14 gap-1"
                  onClick={() => handleQuickAction('appointment')}
                >
                  <Calendar className="w-4 h-4 text-orange-500" />
                  <span className="text-xs">Termin</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-col h-14 gap-1"
                  onClick={() => handleQuickAction('work')}
                >
                  <Briefcase className="w-4 h-4 text-slate-500" />
                  <span className="text-xs">Arbeit</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-col h-14 gap-1"
                  onClick={() => handleQuickAction('vacation')}
                >
                  <Sun className="w-4 h-4 text-cyan-500" />
                  <span className="text-xs">Urlaub</span>
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-col h-14 gap-1"
                  onClick={() => handleQuickAction('invoice')}
                >
                  <Users className="w-4 h-4 text-red-500" />
                  <span className="text-xs">Rechnung</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-col h-14 gap-1"
                  onClick={() => handleQuickAction('expense')}
                >
                  <Wallet className="w-4 h-4 text-green-500" />
                  <span className="text-xs">Ausgabe</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-col h-14 gap-1"
                  onClick={() => handleQuickAction('reminder')}
                >
                  <Bell className="w-4 h-4 text-blue-500" />
                  <span className="text-xs">Erinnerung</span>
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

