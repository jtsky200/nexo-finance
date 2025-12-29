import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

// VACATION_TYPES will be defined inside the component to use t()

export default function VacationPlannerDialog({ open, onOpenChange, onDataChanged, initialDate }: VacationPlannerDialogProps) {
  const { t } = useTranslation();
  const { data: people = [], isLoading: peopleLoading } = usePeople();
  
  const VACATION_TYPES = useMemo(() => [
    { value: 'vacation', label: t('calendar.vacationTypes.vacation', 'Ferien'), icon: Palmtree },
    { value: 'sick', label: t('calendar.vacationTypes.sick', 'Krankheit'), icon: Thermometer },
    { value: 'personal', label: t('calendar.vacationTypes.personal', 'Persönlich'), icon: Heart },
    { value: 'holiday', label: t('calendar.vacationTypes.holiday', 'Feiertag'), icon: Star },
    { value: 'other', label: t('calendar.vacationTypes.other', 'Sonstiges'), icon: Calendar },
  ], [t]);
  
  const monthNames = useMemo(() => [
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
    t('calendar.months.december'),
  ], [t]);
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
      // Silently fail - vacations will be empty
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
      toast.error(t('calendar.vacationPlanner.fillAllFields', 'Bitte alle Pflichtfelder ausfüllen'));
      return;
    }

    try {
      if (editingVacation) {
        const updateVacationFunc = httpsCallable(functions, 'updateVacation');
        await updateVacationFunc({ id: editingVacation.id, ...formData });
        toast.success(t('common.updated', 'Aktualisiert'));
      } else {
        const createVacationFunc = httpsCallable(functions, 'createVacation');
        await createVacationFunc(formData);
        toast.success(t('calendar.vacationPlanner.entered', 'Eingetragen'));
      }
      setShowAddDialog(false);
      resetForm();
      fetchVacations();
      if (onDataChanged) onDataChanged();
    } catch (error) {
      toast.error(t('calendar.vacationPlanner.saveError', 'Fehler beim Speichern'));
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      const deleteVacationFunc = httpsCallable(functions, 'deleteVacation');
      await deleteVacationFunc({ id: deleteConfirmId });
      toast.success(t('common.deleted', 'Gelöscht'));
      setDeleteConfirmId(null);
      fetchVacations();
      if (onDataChanged) onDataChanged();
    } catch (error) {
      toast.error(t('calendar.vacationPlanner.deleteError', 'Fehler beim Löschen'));
    }
  };

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const getTypeInfo = (type: string) => VACATION_TYPES.find(t => t.value === type) || VACATION_TYPES[0];

  const formatDate = (dateStr: string) => {
    const locale = i18n.language === 'de' ? 'de-CH' : i18n.language === 'en' ? 'en-GB' : i18n.language === 'fr' ? 'fr-CH' : i18n.language === 'it' ? 'it-CH' : i18n.language;
    return new Date(dateStr).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
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

  const getPersonStats = (personId: string) => {
    const personVacations = vacations.filter(v => v.personId === personId);
    let total = 0;
    personVacations.forEach(v => { total += calculateDays(v.startDate, v.endDate); });
    return { days: total, count: personVacations.length };
  };

  const totalDays = vacations.reduce((sum, v) => sum + calculateDays(v.startDate, v.endDate), 0);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Palmtree className="w-5 h-5" />
              {t('calendar.vacationPlanner.title', 'Ferienplaner')}
            </DialogTitle>
          </DialogHeader>

          {peopleLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            </div>
          ) : householdMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">{t('calendar.vacationPlanner.noHouseholdMembers', 'Keine Haushaltsmitglieder gefunden')}</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-4 text-sm">
                  {householdMembers.slice(0, 4).map(person => {
                    const stats = getPersonStats(person.id);
                    return (
                      <span key={person.id}>
                        <strong>{person.name}:</strong> {stats.days} {t('calendar.vacationPlanner.days', 'Tage')}
                      </span>
                    );
                  })}
                </div>
                <div className="ml-auto text-sm">
                  <strong>{totalDays}</strong> {t('calendar.vacationPlanner.daysTotal', 'Tage gesamt')}
                </div>
              </div>

              {/* Month Navigation + Add Button */}
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="font-medium min-w-[150px] text-center">
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </span>
                <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <div className="flex-1" />
                <Button size="sm" onClick={openAddDialog}>
                  <Plus className="w-4 h-4 mr-1" />
                  {t('common.add', 'Hinzufügen')}
                </Button>
              </div>

              {/* Vacation List */}
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
                </div>
              ) : getMonthVacations().length === 0 ? (
                <div className="text-center py-12 border rounded-lg">
                  <Palmtree className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground">{t('calendar.vacationPlanner.noEntriesThisMonth', 'Keine Einträge für diesen Monat')}</p>
                </div>
              ) : (
                <div className="border rounded-lg divide-y">
                  {getMonthVacations().map(vacation => {
                    const typeInfo = getTypeInfo(vacation.type);
                    const TypeIcon = typeInfo.icon;
                    const days = calculateDays(vacation.startDate, vacation.endDate);

                    return (
                      <div key={vacation.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                        <TypeIcon className="w-5 h-5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{vacation.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {vacation.personName} · {formatDate(vacation.startDate)} – {formatDate(vacation.endDate)} · {days} {days === 1 ? t('calendar.vacationPlanner.day', 'Tag') : t('calendar.vacationPlanner.days', 'Tage')}
                          </div>
                          {vacation.notes && (
                            <div className="text-sm text-muted-foreground mt-1">{vacation.notes}</div>
                          )}
                        </div>
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
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingVacation ? t('calendar.vacationPlanner.editEntry', 'Eintrag bearbeiten') : t('calendar.vacationPlanner.newEntry', 'Neuer Eintrag')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>{t('calendar.vacationPlanner.person', 'Person')}</Label>
              <Select value={formData.personId} onValueChange={(v) => {
                const p = householdMembers.find(x => x.id === v);
                setFormData(prev => ({ ...prev, personId: v, personName: p?.name || '' }));
              }}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder={t('common.select', 'Wählen...')} /></SelectTrigger>
                <SelectContent>
                  {householdMembers.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('calendar.vacationPlanner.type', 'Typ')}</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData(prev => ({ ...prev, type: v as Vacation['type'] }))}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VACATION_TYPES.map(type => {
                    const I = type.icon;
                    return <SelectItem key={type.value} value={type.value}><span className="flex items-center gap-2"><I className="w-4 h-4" />{type.label}</span></SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('calendar.vacationPlanner.title', 'Titel')}</Label>
              <Input value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder={t('calendar.vacationPlanner.titlePlaceholder', 'z.B. Sommerferien')} className="mt-1.5" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('calendar.vacationPlanner.from', 'Von')}</Label>
                <Input type="date" value={formData.startDate} onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))} className="mt-1.5" />
              </div>
              <div>
                <Label>{t('calendar.vacationPlanner.to', 'Bis')}</Label>
                <Input type="date" value={formData.endDate} onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))} className="mt-1.5" />
              </div>
            </div>
            {formData.startDate && formData.endDate && (
              <div className="text-center py-2 border rounded">
                <strong>{calculateDays(formData.startDate, formData.endDate)}</strong> {t('calendar.vacationPlanner.days', 'Tage')}
              </div>
            )}
            <div>
              <Label>{t('calendar.vacationPlanner.notes', 'Notizen')}</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} placeholder={t('common.optional', 'Optional...')} className="mt-1.5" rows={2} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>{t('common.cancel', 'Abbrechen')}</Button>
            <Button onClick={handleSave}>{editingVacation ? t('common.save', 'Speichern') : t('common.add', 'Hinzufügen')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(o) => !o && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('calendar.vacationPlanner.deleteEntry', 'Eintrag löschen?')}</AlertDialogTitle>
            <AlertDialogDescription>{t('common.cannotUndo', 'Diese Aktion kann nicht rückgängig gemacht werden.')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Abbrechen')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{t('common.delete', 'Löschen')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
