import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Palmtree, Thermometer, Calendar, Plus, Edit2, Trash2, 
  ChevronLeft, ChevronRight, Users, Heart, Star
} from 'lucide-react';
import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { usePeople } from '@/lib/firebaseHooks';
import { toast } from 'sonner';

interface Vacation {
  id: string;
  personId: string;
  personName: string;
  startDate: string;
  endDate: string;
  type: 'vacation' | 'sick' | 'personal' | 'holiday' | 'other';
  title: string;
  notes?: string;
}

interface VacationPlannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDataChanged?: () => void;
  initialDate?: Date;
}

const VACATION_TYPES = [
  { value: 'vacation', label: 'Ferien', icon: Palmtree, color: 'bg-cyan-100 text-cyan-700' },
  { value: 'sick', label: 'Krankheit', icon: Thermometer, color: 'bg-red-100 text-red-700' },
  { value: 'personal', label: 'Persönlich', icon: Heart, color: 'bg-pink-100 text-pink-700' },
  { value: 'holiday', label: 'Feiertag', icon: Star, color: 'bg-amber-100 text-amber-700' },
  { value: 'other', label: 'Sonstiges', icon: Calendar, color: 'bg-gray-100 text-gray-700' },
];

const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

export default function VacationPlannerDialog({ open, onOpenChange, onDataChanged, initialDate }: VacationPlannerDialogProps) {
  const { data: people = [], isLoading: peopleLoading } = usePeople();
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingVacation, setEditingVacation] = useState<Vacation | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [formData, setFormData] = useState({
    personId: '',
    personName: '',
    startDate: '',
    endDate: '',
    type: 'vacation' as Vacation['type'],
    title: '',
    notes: '',
  });

  const fetchVacations = useCallback(async () => {
    try {
      setIsLoading(true);
      const getVacationsFunc = httpsCallable(functions, 'getVacations');
      const result = await getVacationsFunc({});
      const data = result.data as { vacations: Vacation[] };
      setVacations(data.vacations || []);
    } catch (error) {
      console.error('Error fetching vacations:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchVacations();
      if (initialDate) {
        setFormData(prev => ({
          ...prev,
          startDate: initialDate.toISOString().split('T')[0],
          endDate: initialDate.toISOString().split('T')[0],
        }));
      }
    }
  }, [open, fetchVacations, initialDate]);

  const householdMembers = people.filter(p => p.type === 'household' || !p.type);

  const resetForm = () => {
    setFormData({ personId: '', personName: '', startDate: '', endDate: '', type: 'vacation', title: '', notes: '' });
    setEditingVacation(null);
  };

  const openAddDialog = () => {
    resetForm();
    const today = new Date().toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, startDate: today, endDate: today }));
    setShowAddDialog(true);
  };

  const openEditDialog = (vacation: Vacation) => {
    setEditingVacation(vacation);
    setFormData({
      personId: vacation.personId,
      personName: vacation.personName,
      startDate: vacation.startDate.split('T')[0],
      endDate: vacation.endDate.split('T')[0],
      type: vacation.type,
      title: vacation.title,
      notes: vacation.notes || '',
    });
    setShowAddDialog(true);
  };

  const handleSave = async () => {
    if (!formData.personId || !formData.startDate || !formData.endDate || !formData.title) {
      toast.error('Bitte alle Pflichtfelder ausfüllen');
      return;
    }

    try {
      if (editingVacation) {
        const updateVacationFunc = httpsCallable(functions, 'updateVacation');
        await updateVacationFunc({ id: editingVacation.id, ...formData });
        toast.success('Aktualisiert');
      } else {
        const createVacationFunc = httpsCallable(functions, 'createVacation');
        await createVacationFunc(formData);
        toast.success('Eingetragen');
      }
      setShowAddDialog(false);
      resetForm();
      fetchVacations();
      if (onDataChanged) onDataChanged();
    } catch (error) {
      console.error('Error saving vacation:', error);
      toast.error('Fehler beim Speichern');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      const deleteVacationFunc = httpsCallable(functions, 'deleteVacation');
      await deleteVacationFunc({ id: deleteConfirmId });
      toast.success('Gelöscht');
      setDeleteConfirmId(null);
      fetchVacations();
      if (onDataChanged) onDataChanged();
    } catch (error) {
      console.error('Error deleting vacation:', error);
      toast.error('Fehler beim Löschen');
    }
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const getTypeInfo = (type: string) => VACATION_TYPES.find(t => t.value === type) || VACATION_TYPES[0];

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit' });

  const getMonthVacations = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return vacations.filter(v => {
      const start = new Date(v.startDate);
      const end = new Date(v.endDate);
      return start <= lastDay && end >= firstDay;
    });
  };

  const getPersonStats = (personId: string) => {
    const personVacations = vacations.filter(v => v.personId === personId);
    let total = 0;
    personVacations.forEach(v => { total += calculateDays(v.startDate, v.endDate); });
    return { days: total, count: personVacations.length };
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Palmtree className="w-5 h-5" />
              Ferienplaner
            </DialogTitle>
          </DialogHeader>

          {peopleLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            </div>
          ) : householdMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Keine Haushaltsmitglieder gefunden</p>
            </div>
          ) : (
            <div className="space-y-6 pt-4">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {householdMembers.slice(0, 4).map(person => {
                  const stats = getPersonStats(person.id);
                  return (
                    <Card key={person.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                            {person.name.charAt(0)}
                          </div>
                          <span className="font-medium truncate">{person.name}</span>
                        </div>
                        <div className="text-2xl font-bold">{stats.days} Tage</div>
                        <div className="text-xs text-muted-foreground">{stats.count} Einträge</div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Month Navigation + Add Button */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="font-semibold text-lg min-w-[160px] text-center">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </span>
                  <Button variant="outline" size="icon" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <Button onClick={openAddDialog}>
                  <Plus className="w-4 h-4 mr-2" />
                  Hinzufügen
                </Button>
              </div>

              {/* Vacation List */}
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
                </div>
              ) : getMonthVacations().length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-lg">
                  <Palmtree className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground">Keine Einträge für diesen Monat</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getMonthVacations().map(vacation => {
                    const typeInfo = getTypeInfo(vacation.type);
                    const TypeIcon = typeInfo.icon;
                    const days = calculateDays(vacation.startDate, vacation.endDate);

                    return (
                      <div key={vacation.id} className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/30 transition-colors">
                        <div className={`p-2.5 rounded-lg ${typeInfo.color}`}>
                          <TypeIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{vacation.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {vacation.personName} • {formatDate(vacation.startDate)} - {formatDate(vacation.endDate)}
                          </div>
                          {vacation.notes && (
                            <div className="text-sm text-muted-foreground mt-1 truncate">{vacation.notes}</div>
                          )}
                        </div>
                        <Badge variant="secondary" className="shrink-0">{days} {days === 1 ? 'Tag' : 'Tage'}</Badge>
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(vacation)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteConfirmId(vacation.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Legend */}
              <div className="flex items-center justify-center gap-4 pt-2">
                {VACATION_TYPES.map(type => {
                  const TypeIcon = type.icon;
                  return (
                    <Badge key={type.value} variant="outline" className={`${type.color} px-3 py-1`}>
                      <TypeIcon className="w-3 h-3 mr-1.5" />
                      {type.label}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingVacation ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Person *</Label>
                <Select value={formData.personId} onValueChange={(v) => {
                  const p = householdMembers.find(x => x.id === v);
                  setFormData(prev => ({ ...prev, personId: v, personName: p?.name || '' }));
                }}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Wählen..." /></SelectTrigger>
                  <SelectContent>
                    {householdMembers.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Typ *</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData(prev => ({ ...prev, type: v as Vacation['type'] }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VACATION_TYPES.map(t => {
                      const I = t.icon;
                      return <SelectItem key={t.value} value={t.value}><span className="flex items-center gap-2"><I className="w-4 h-4" />{t.label}</span></SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Titel *</Label>
              <Input value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="z.B. Sommerferien" className="mt-1.5" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Von *</Label>
                <Input type="date" value={formData.startDate} onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))} className="mt-1.5" />
              </div>
              <div>
                <Label>Bis *</Label>
                <Input type="date" value={formData.endDate} onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))} className="mt-1.5" />
              </div>
            </div>
            {formData.startDate && formData.endDate && (
              <div className="text-center py-3 bg-muted rounded-lg">
                <span className="text-2xl font-bold">{calculateDays(formData.startDate, formData.endDate)}</span>
                <span className="text-muted-foreground ml-2">Tage</span>
              </div>
            )}
            <div>
              <Label>Notizen</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} placeholder="Optional..." className="mt-1.5" rows={2} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Abbrechen</Button>
            <Button onClick={handleSave}>{editingVacation ? 'Speichern' : 'Hinzufügen'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(o) => !o && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eintrag löschen?</AlertDialogTitle>
            <AlertDialogDescription>Diese Aktion kann nicht rückgängig gemacht werden.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Löschen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
