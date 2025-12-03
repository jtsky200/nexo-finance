import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  { value: 'vacation', label: 'Ferien', icon: Palmtree, color: 'bg-cyan-100 text-cyan-800' },
  { value: 'sick', label: 'Krankheit', icon: Thermometer, color: 'bg-red-100 text-red-800' },
  { value: 'personal', label: 'Persönlich', icon: Heart, color: 'bg-pink-100 text-pink-800' },
  { value: 'holiday', label: 'Feiertag', icon: Star, color: 'bg-amber-100 text-amber-800' },
  { value: 'other', label: 'Sonstiges', icon: Calendar, color: 'bg-gray-100 text-gray-800' },
];

const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 
                    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit' });
  };

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

  const getTotalDays = () => {
    let total = 0;
    vacations.forEach(v => { total += calculateDays(v.startDate, v.endDate); });
    return total;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl w-full max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palmtree className="w-5 h-5" />
              Ferienplaner
            </DialogTitle>
          </DialogHeader>

          {peopleLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            </div>
          ) : householdMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Keine Haushaltsmitglieder gefunden</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="font-medium min-w-[130px] text-center">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    <strong>{getTotalDays()}</strong> Tage gesamt
                  </span>
                  <Button size="sm" onClick={openAddDialog}>
                    <Plus className="w-4 h-4 mr-1" />
                    Hinzufügen
                  </Button>
                </div>
              </div>

              {/* Vacation List */}
              {isLoading ? (
                <div className="text-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
                </div>
              ) : getMonthVacations().length === 0 ? (
                <div className="text-center py-8 bg-muted/30 rounded-lg">
                  <Palmtree className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">Keine Einträge für diesen Monat</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {getMonthVacations().map(vacation => {
                    const typeInfo = getTypeInfo(vacation.type);
                    const TypeIcon = typeInfo.icon;
                    const days = calculateDays(vacation.startDate, vacation.endDate);

                    return (
                      <div key={vacation.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                        <div className={`p-1.5 rounded ${typeInfo.color}`}>
                          <TypeIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{vacation.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {vacation.personName} • {formatDate(vacation.startDate)} - {formatDate(vacation.endDate)}
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs shrink-0">{days}d</Badge>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(vacation)}>
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteConfirmId(vacation.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Legend */}
              <div className="flex items-center justify-center gap-2 pt-2 text-xs">
                {VACATION_TYPES.map(type => {
                  const TypeIcon = type.icon;
                  return (
                    <span key={type.value} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${type.color}`}>
                      <TypeIcon className="w-3 h-3" />
                      {type.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingVacation ? 'Bearbeiten' : 'Hinzufügen'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Person</Label>
              <Select value={formData.personId} onValueChange={(v) => {
                const p = householdMembers.find(x => x.id === v);
                setFormData(prev => ({ ...prev, personId: v, personName: p?.name || '' }));
              }}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Wählen..." /></SelectTrigger>
                <SelectContent>
                  {householdMembers.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Typ</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData(prev => ({ ...prev, type: v as Vacation['type'] }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VACATION_TYPES.map(t => {
                    const I = t.icon;
                    return <SelectItem key={t.value} value={t.value}><span className="flex items-center gap-2"><I className="w-4 h-4" />{t.label}</span></SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Titel</Label>
              <Input value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="z.B. Sommerferien" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Von</Label>
                <Input type="date" value={formData.startDate} onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Bis</Label>
                <Input type="date" value={formData.endDate} onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))} className="mt-1" />
              </div>
            </div>
            {formData.startDate && formData.endDate && (
              <div className="text-center py-1.5 bg-muted rounded text-sm">
                <strong>{calculateDays(formData.startDate, formData.endDate)}</strong> Tage
              </div>
            )}
            <div>
              <Label className="text-xs">Notizen</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} placeholder="Optional..." className="mt-1" rows={2} />
            </div>
          </div>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => setShowAddDialog(false)}>Abbrechen</Button>
            <Button size="sm" onClick={handleSave}>{editingVacation ? 'Speichern' : 'Hinzufügen'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(o) => !o && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Löschen?</AlertDialogTitle>
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
