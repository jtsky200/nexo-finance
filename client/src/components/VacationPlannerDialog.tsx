import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Palmtree, Thermometer, User, Calendar, Plus, Edit2, Trash2, 
  ChevronLeft, ChevronRight, Users, Plane, Heart, Star
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
  color?: string;
}

interface VacationPlannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDataChanged?: () => void;
  initialDate?: Date;
}

const VACATION_TYPES = [
  { value: 'vacation', label: 'Ferien', icon: Palmtree, color: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
  { value: 'sick', label: 'Krankheit', icon: Thermometer, color: 'bg-red-100 text-red-800 border-red-300' },
  { value: 'personal', label: 'Persönlich', icon: Heart, color: 'bg-pink-100 text-pink-800 border-pink-300' },
  { value: 'holiday', label: 'Feiertag', icon: Star, color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { value: 'other', label: 'Sonstiges', icon: Calendar, color: 'bg-gray-100 text-gray-800 border-gray-300' },
];

export default function VacationPlannerDialog({ open, onOpenChange, onDataChanged, initialDate }: VacationPlannerDialogProps) {
  const { t } = useTranslation();
  const { data: people = [], isLoading: peopleLoading } = usePeople();
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingVacation, setEditingVacation] = useState<Vacation | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Form state
  const [formData, setFormData] = useState({
    personId: '',
    personName: '',
    startDate: '',
    endDate: '',
    type: 'vacation' as Vacation['type'],
    title: '',
    notes: '',
  });

  // Fetch vacations
  const fetchVacations = useCallback(async () => {
    try {
      setIsLoading(true);
      const getVacationsFunc = httpsCallable(functions, 'getVacations');
      const result = await getVacationsFunc({});
      const data = result.data as { vacations: Vacation[] };
      setVacations(data.vacations || []);
    } catch (error) {
      console.error('Error fetching vacations:', error);
      toast.error('Fehler beim Laden der Ferien');
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

  // Get household members
  const householdMembers = people.filter(p => p.type === 'household' || !p.type);

  // Reset form
  const resetForm = () => {
    setFormData({
      personId: '',
      personName: '',
      startDate: '',
      endDate: '',
      type: 'vacation',
      title: '',
      notes: '',
    });
    setEditingVacation(null);
  };

  // Open add dialog
  const openAddDialog = () => {
    resetForm();
    const today = new Date().toISOString().split('T')[0];
    setFormData(prev => ({
      ...prev,
      startDate: today,
      endDate: today,
    }));
    setShowAddDialog(true);
  };

  // Open edit dialog
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

  // Save vacation
  const handleSave = async () => {
    if (!formData.personId || !formData.startDate || !formData.endDate || !formData.title) {
      toast.error('Bitte alle Pflichtfelder ausfüllen');
      return;
    }

    try {
      if (editingVacation) {
        const updateVacationFunc = httpsCallable(functions, 'updateVacation');
        await updateVacationFunc({
          id: editingVacation.id,
          ...formData,
        });
        toast.success('Ferien aktualisiert');
      } else {
        const createVacationFunc = httpsCallable(functions, 'createVacation');
        await createVacationFunc(formData);
        toast.success('Ferien eingetragen');
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

  // Delete vacation
  const handleDelete = async () => {
    if (!deleteConfirmId) return;

    try {
      const deleteVacationFunc = httpsCallable(functions, 'deleteVacation');
      await deleteVacationFunc({ id: deleteConfirmId });
      toast.success('Ferien gelöscht');
      setDeleteConfirmId(null);
      fetchVacations();
      if (onDataChanged) onDataChanged();
    } catch (error) {
      console.error('Error deleting vacation:', error);
      toast.error('Fehler beim Löschen');
    }
  };

  // Calculate days
  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  // Get type info
  const getTypeInfo = (type: string) => {
    return VACATION_TYPES.find(t => t.value === type) || VACATION_TYPES[0];
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Get vacations for current month view
  const getMonthVacations = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    return vacations.filter(v => {
      const start = new Date(v.startDate);
      const end = new Date(v.endDate);
      return (start <= lastDay && end >= firstDay);
    });
  };

  // Calculate total vacation days per person
  const getVacationStats = (personId: string) => {
    const personVacations = vacations.filter(v => v.personId === personId);
    let totalDays = 0;
    personVacations.forEach(v => {
      totalDays += calculateDays(v.startDate, v.endDate);
    });
    return {
      totalDays,
      count: personVacations.length,
    };
  };

  // Month navigation
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[1100px] w-[95vw] max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Palmtree className="w-6 h-6" />
              Ferienplaner
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-5">
          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h3 className="text-lg font-semibold">
              {currentMonth.toLocaleDateString('de-CH', { month: 'long', year: 'numeric' })}
            </h3>
            <Button variant="outline" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Statistics Cards */}
          {householdMembers.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {householdMembers.slice(0, 4).map(person => {
                const stats = getVacationStats(person.id);
                return (
                  <Card key={person.id}>
                    <CardContent className="pt-3 pb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                          {person.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-sm truncate">{person.name}</span>
                      </div>
                      <p className="text-xl font-bold">{stats.totalDays} Tage</p>
                      <p className="text-xs text-muted-foreground">{stats.count} Einträge</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Add Button */}
          <Button onClick={openAddDialog} className="w-full" size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Ferien / Abwesenheit eintragen
          </Button>

          {/* Vacation List */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Laden...</p>
            </div>
          ) : getMonthVacations().length === 0 ? (
            <div className="text-center py-8 bg-muted/30 rounded-lg">
              <Palmtree className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Keine Einträge für diesen Monat</p>
            </div>
          ) : (
            <div className="space-y-2">
              {getMonthVacations().map(vacation => {
                const typeInfo = getTypeInfo(vacation.type);
                const TypeIcon = typeInfo.icon;
                const days = calculateDays(vacation.startDate, vacation.endDate);

                return (
                  <div
                    key={vacation.id}
                    className={`p-4 rounded-lg border-l-4 bg-card hover:bg-muted/50 transition-colors ${typeInfo.color.replace('bg-', 'border-l-').replace('-100', '-500')}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${typeInfo.color}`}>
                          <TypeIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-medium">{vacation.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {vacation.personName} • {formatDate(vacation.startDate)} - {formatDate(vacation.endDate)}
                          </p>
                          {vacation.notes && (
                            <p className="text-sm text-muted-foreground mt-1">{vacation.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{days} {days === 1 ? 'Tag' : 'Tage'}</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(vacation)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirmId(vacation.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className="pt-4 border-t">
            <p className="text-sm font-medium text-muted-foreground mb-2">Legende</p>
            <div className="flex flex-wrap gap-2">
              {VACATION_TYPES.map(type => {
                const TypeIcon = type.icon;
                return (
                  <Badge key={type.value} variant="outline" className={type.color}>
                    <TypeIcon className="w-3 h-3 mr-1" />
                    {type.label}
                  </Badge>
                );
              })}
            </div>
          </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>
              {editingVacation ? 'Eintrag bearbeiten' : 'Ferien / Abwesenheit eintragen'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Person */}
            <div>
              <Label>Person *</Label>
              <Select
                value={formData.personId}
                onValueChange={(value) => {
                  const person = householdMembers.find(p => p.id === value);
                  setFormData(prev => ({
                    ...prev,
                    personId: value,
                    personName: person?.name || '',
                  }));
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Person auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {householdMembers.map(person => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type */}
            <div>
              <Label>Typ *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as Vacation['type'] }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VACATION_TYPES.map(type => {
                    const TypeIcon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <span className="flex items-center gap-2">
                          <TypeIcon className="w-4 h-4" />
                          {type.label}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div>
              <Label>Titel / Beschreibung *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="z.B. Sommerferien, Arzttermin..."
                className="mt-1"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Von *</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Bis *</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Days Preview */}
            {formData.startDate && formData.endDate && (
              <div className="text-center py-2 bg-muted rounded-lg">
                <span className="text-2xl font-bold">
                  {calculateDays(formData.startDate, formData.endDate)}
                </span>
                <span className="text-muted-foreground ml-2">
                  {calculateDays(formData.startDate, formData.endDate) === 1 ? 'Tag' : 'Tage'}
                </span>
              </div>
            )}

            {/* Notes */}
            <div>
              <Label>Notizen</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Optionale Notizen..."
                className="mt-1"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Abbrechen</Button>
            <Button onClick={handleSave}>
              {editingVacation ? 'Speichern' : 'Eintragen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eintrag löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
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

