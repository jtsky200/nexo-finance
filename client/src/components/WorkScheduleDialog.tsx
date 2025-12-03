import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, User, Calendar, Briefcase, Coffee, Moon, Sun, 
  Save, Trash2, Plus, Users
} from 'lucide-react';
import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { usePeople } from '@/lib/firebaseHooks';
import { toast } from 'sonner';

interface WorkSchedule {
  id?: string;
  personId: string;
  personName: string;
  dayOfWeek: number;
  type: 'full' | 'half-am' | 'half-pm' | 'off';
  startTime?: string;
  endTime?: string;
  notes?: string;
}

interface WorkScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDataChanged?: () => void;
}

const DAYS = [
  { value: 1, label: 'Montag', short: 'Mo' },
  { value: 2, label: 'Dienstag', short: 'Di' },
  { value: 3, label: 'Mittwoch', short: 'Mi' },
  { value: 4, label: 'Donnerstag', short: 'Do' },
  { value: 5, label: 'Freitag', short: 'Fr' },
  { value: 6, label: 'Samstag', short: 'Sa' },
  { value: 0, label: 'Sonntag', short: 'So' },
];

const SCHEDULE_TYPES = [
  { value: 'full', label: 'Vollzeit', icon: Briefcase, color: 'bg-blue-100 text-blue-800' },
  { value: 'half-am', label: 'Halbtag (Morgen)', icon: Sun, color: 'bg-amber-100 text-amber-800' },
  { value: 'half-pm', label: 'Halbtag (Nachmittag)', icon: Moon, color: 'bg-purple-100 text-purple-800' },
  { value: 'off', label: 'Frei', icon: Coffee, color: 'bg-green-100 text-green-800' },
];

export default function WorkScheduleDialog({ open, onOpenChange, onDataChanged }: WorkScheduleDialogProps) {
  const { t } = useTranslation();
  const { data: people = [], isLoading: peopleLoading } = usePeople();
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch schedules
  const fetchSchedules = useCallback(async () => {
    try {
      setIsLoading(true);
      const getSchedulesFunc = httpsCallable(functions, 'getWorkSchedules');
      const result = await getSchedulesFunc({});
      const data = result.data as { schedules: WorkSchedule[] };
      setSchedules(data.schedules || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast.error('Fehler beim Laden der Arbeitspläne');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchSchedules();
    }
  }, [open, fetchSchedules]);

  // Get household members (type === 'household')
  const householdMembers = people.filter(p => p.type === 'household' || !p.type);

  // Get schedule for a specific person and day
  const getScheduleForDay = (personId: string, dayOfWeek: number) => {
    return schedules.find(s => s.personId === personId && s.dayOfWeek === dayOfWeek);
  };

  // Save schedule for a day
  const saveSchedule = async (personId: string, personName: string, dayOfWeek: number, type: string, startTime?: string, endTime?: string) => {
    try {
      setIsSaving(true);
      const createScheduleFunc = httpsCallable(functions, 'createWorkSchedule');
      await createScheduleFunc({
        personId,
        personName,
        dayOfWeek,
        type,
        startTime,
        endTime,
      });
      toast.success('Arbeitsplan gespeichert');
      fetchSchedules();
      if (onDataChanged) onDataChanged();
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error('Fehler beim Speichern');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete schedule
  const deleteSchedule = async (scheduleId: string) => {
    try {
      const deleteScheduleFunc = httpsCallable(functions, 'deleteWorkSchedule');
      await deleteScheduleFunc({ id: scheduleId });
      toast.success('Arbeitsplan gelöscht');
      fetchSchedules();
      if (onDataChanged) onDataChanged();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Fehler beim Löschen');
    }
  };

  // Calculate weekly hours for a person
  const calculateWeeklyHours = (personId: string) => {
    let totalHours = 0;
    DAYS.forEach(day => {
      const schedule = getScheduleForDay(personId, day.value);
      if (schedule) {
        if (schedule.type === 'full') {
          if (schedule.startTime && schedule.endTime) {
            const start = parseInt(schedule.startTime.split(':')[0]);
            const end = parseInt(schedule.endTime.split(':')[0]);
            totalHours += (end - start);
          } else {
            totalHours += 8; // Default 8 hours
          }
        } else if (schedule.type === 'half-am' || schedule.type === 'half-pm') {
          totalHours += 4;
        }
      }
    });
    return totalHours;
  };

  // Count work days for a person
  const countWorkDays = (personId: string) => {
    let count = 0;
    DAYS.forEach(day => {
      const schedule = getScheduleForDay(personId, day.value);
      if (schedule && schedule.type !== 'off') {
        count++;
      }
    });
    return count;
  };

  const getTypeInfo = (type: string) => {
    return SCHEDULE_TYPES.find(t => t.value === type) || SCHEDULE_TYPES[0];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Briefcase className="w-6 h-6" />
            Arbeitspläne verwalten
          </DialogTitle>
        </DialogHeader>

        {peopleLoading || isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Laden...</p>
          </div>
        ) : householdMembers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">Keine Haushaltsmitglieder gefunden</p>
            <p className="text-sm text-muted-foreground">
              Füge zuerst Personen als "Haushalt" auf der Personen-Seite hinzu.
            </p>
          </div>
        ) : (
          <Tabs defaultValue={householdMembers[0]?.id || ''} className="w-full">
            <TabsList className="w-full flex-wrap h-auto gap-1 mb-4">
              {householdMembers.map(person => (
                <TabsTrigger 
                  key={person.id} 
                  value={person.id}
                  className="flex items-center gap-2"
                >
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                    {person.name.charAt(0).toUpperCase()}
                  </div>
                  {person.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {householdMembers.map(person => (
              <TabsContent key={person.id} value={person.id} className="space-y-4">
                {/* Statistics */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <Card>
                    <CardContent className="pt-4 pb-4">
                      <p className="text-sm text-muted-foreground">Arbeitstage</p>
                      <p className="text-2xl font-bold">{countWorkDays(person.id)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-4">
                      <p className="text-sm text-muted-foreground">Wochenstunden</p>
                      <p className="text-2xl font-bold">{calculateWeeklyHours(person.id)}h</p>
                    </CardContent>
                  </Card>
                  <Card className="col-span-2 sm:col-span-1">
                    <CardContent className="pt-4 pb-4">
                      <p className="text-sm text-muted-foreground">Freie Tage</p>
                      <p className="text-2xl font-bold">{7 - countWorkDays(person.id)}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Weekly Schedule Grid */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Wochenplan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {DAYS.map(day => {
                        const schedule = getScheduleForDay(person.id, day.value);
                        const typeInfo = schedule ? getTypeInfo(schedule.type) : null;

                        return (
                          <div 
                            key={day.value}
                            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                          >
                            <div className="w-24 font-medium">{day.label}</div>
                            
                            <Select
                              value={schedule?.type || 'none'}
                              onValueChange={(value) => {
                                if (value === 'none') {
                                  if (schedule?.id) {
                                    deleteSchedule(schedule.id);
                                  }
                                } else {
                                  saveSchedule(person.id, person.name, day.value, value);
                                }
                              }}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Nicht festgelegt" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Nicht festgelegt</SelectItem>
                                {SCHEDULE_TYPES.map(type => (
                                  <SelectItem key={type.value} value={type.value}>
                                    <span className="flex items-center gap-2">
                                      <type.icon className="w-4 h-4" />
                                      {type.label}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            {schedule && schedule.type !== 'off' && (
                              <div className="flex items-center gap-2 flex-1">
                                <Input
                                  type="time"
                                  value={schedule.startTime || '08:00'}
                                  onChange={(e) => saveSchedule(person.id, person.name, day.value, schedule.type, e.target.value, schedule.endTime)}
                                  className="w-28"
                                />
                                <span className="text-muted-foreground">-</span>
                                <Input
                                  type="time"
                                  value={schedule.endTime || '17:00'}
                                  onChange={(e) => saveSchedule(person.id, person.name, day.value, schedule.type, schedule.startTime, e.target.value)}
                                  className="w-28"
                                />
                              </div>
                            )}

                            {typeInfo && (
                              <Badge className={`${typeInfo.color} ml-auto`}>
                                {schedule?.startTime && schedule?.endTime 
                                  ? `${schedule.startTime} - ${schedule.endTime}`
                                  : typeInfo.label
                                }
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Set standard work week (Mo-Fr full time)
                      [1, 2, 3, 4, 5].forEach(day => {
                        saveSchedule(person.id, person.name, day, 'full', '08:00', '17:00');
                      });
                      [0, 6].forEach(day => {
                        saveSchedule(person.id, person.name, day, 'off');
                      });
                    }}
                  >
                    <Briefcase className="w-4 h-4 mr-2" />
                    Standard (Mo-Fr)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Set part-time (Mo-Fr half days)
                      [1, 2, 3, 4, 5].forEach(day => {
                        saveSchedule(person.id, person.name, day, 'half-am', '08:00', '12:00');
                      });
                      [0, 6].forEach(day => {
                        saveSchedule(person.id, person.name, day, 'off');
                      });
                    }}
                  >
                    <Sun className="w-4 h-4 mr-2" />
                    Teilzeit (Morgens)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Clear all
                      schedules
                        .filter(s => s.personId === person.id)
                        .forEach(s => {
                          if (s.id) deleteSchedule(s.id);
                        });
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Alle löschen
                  </Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

