import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import MobileLayout from '@/components/MobileLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, Calendar, Banknote, CheckSquare, Trash2, Edit2, 
  Clock, AlertTriangle, CheckCircle2, Search
} from 'lucide-react';
import { useReminders, createReminder, updateReminder, deleteReminder, Reminder } from '@/lib/firebaseHooks';
import { toast } from 'sonner';
import { parseLocalDateTime, formatDateForDisplay, dateToDateTimeLocal, formatDateTimeGerman, parseDateTimeGerman } from '@/lib/dateTimeUtils';
import { formatErrorForDisplay } from '@/lib/errorHandler';
import { hapticSuccess, hapticError, hapticSelection } from '@/lib/hapticFeedback';
import { Skeleton } from '@/components/ui/skeleton';
import { exportRemindersToCSV } from '@/lib/exportUtils';
import { Download } from 'lucide-react';
import ContextMenu from '@/components/ContextMenu';
import { RefreshCw } from 'lucide-react';

export default function MobileReminders() {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: reminders = [], isLoading, refetch } = useReminders();

  const [formData, setFormData] = useState({
    title: '',
    type: 'termin' as 'termin' | 'zahlung' | 'aufgabe',
    dueDate: dateToDateTimeLocal(new Date()), // Internal format: YYYY-MM-DDTHH:mm
    isAllDay: false,
    amount: '',
    currency: 'CHF',
    notes: '',
    recurrenceRule: '',
  });
  
  // Display date in German format (DD.MM.YYYY HH:mm)
  const [dueDateDisplay, setDueDateDisplay] = useState(formatDateTimeGerman(new Date()));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatDate = (date: Date | any) => formatDateForDisplay(date);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'termin': return <Calendar className="w-4 h-4" />;
      case 'zahlung': return <Banknote className="w-4 h-4" />;
      case 'aufgabe': return <CheckSquare className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'termin': return t('reminders.types.termin');
      case 'zahlung': return t('reminders.types.zahlung');
      case 'aufgabe': return t('reminders.types.aufgabe');
      default: return type;
    }
  };

  const getStatusBadge = (status: string, dueDate: Date | string) => {
    const now = new Date();
    const due = dueDate instanceof Date ? dueDate : new Date(dueDate);
    
    if (status === 'erledigt') {
      return <Badge className="bg-green-500 text-white">{t('reminders.status.done')}</Badge>;
    }
    
    if (due < now) {
      return <Badge className="bg-red-500 text-white">{t('reminders.status.overdue')}</Badge>;
    }
    
    return <Badge className="bg-blue-500 text-white">{t('reminders.status.open')}</Badge>;
  };

  const filteredReminders = useMemo(() => {
    let result = [...reminders];
    
    if (filterType !== 'all') {
      result = result.filter(r => r.type === filterType);
    }
    
    if (filterStatus !== 'all') {
      result = result.filter(r => r.status === filterStatus);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.title.toLowerCase().includes(query) ||
        (r.notes && r.notes.toLowerCase().includes(query)) ||
        (r.amount && (r.amount / 100).toString().includes(query))
      );
    }
    
    // Sort by due date (upcoming first, then overdue, then completed)
    return result.sort((a, b) => {
      const dateA = a.dueDate instanceof Date ? a.dueDate : new Date(a.dueDate);
      const dateB = b.dueDate instanceof Date ? b.dueDate : new Date(b.dueDate);
      const now = new Date();
      
      // Completed items last
      if (a.status === 'erledigt' && b.status !== 'erledigt') return 1;
      if (b.status === 'erledigt' && a.status !== 'erledigt') return -1;
      
      // Overdue items first (among non-completed)
      const aOverdue = a.status !== 'erledigt' && dateA < now;
      const bOverdue = b.status !== 'erledigt' && dateB < now;
      if (aOverdue && !bOverdue) return -1;
      if (bOverdue && !aOverdue) return 1;
      
      // Then by date
      return dateA.getTime() - dateB.getTime();
    });
  }, [reminders, filterType, filterStatus, searchQuery]);

  const openDialog = (reminder?: Reminder) => {
    if (reminder) {
      setEditingReminder(reminder);
      const dueDate = reminder.dueDate instanceof Date 
        ? reminder.dueDate 
        : new Date(reminder.dueDate);
      
      setFormData({
        title: reminder.title,
        type: reminder.type as 'termin' | 'zahlung' | 'aufgabe',
        dueDate: dateToDateTimeLocal(dueDate),
        isAllDay: reminder.isAllDay,
        amount: reminder.amount ? (reminder.amount / 100).toString() : '',
        currency: reminder.currency || 'CHF',
        notes: reminder.notes || '',
        recurrenceRule: reminder.recurrenceRule || '',
      });
    } else {
      setEditingReminder(null);
      setFormData({
        title: '',
        type: 'termin',
        dueDate: new Date().toISOString().slice(0, 16),
        isAllDay: false,
        amount: '',
        currency: 'CHF',
        notes: '',
        recurrenceRule: '',
      });
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingReminder(null);
    const now = dateToDateTimeLocal(new Date());
    setFormData({
      title: '',
      type: 'termin',
      dueDate: now,
      isAllDay: false,
      amount: '',
      currency: 'CHF',
      notes: '',
      recurrenceRule: '',
    });
    setDueDateDisplay(formatDateTimeGerman(now));
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.dueDate) {
      toast.error(t('reminders.errors.required'));
      return;
    }

    try {
      setIsSubmitting(true);
      
      const dueDate = parseLocalDateTime(formData.dueDate);
      
      const reminderData = {
        title: formData.title,
        type: formData.type,
        dueDate: dueDate.toISOString(),
        isAllDay: formData.isAllDay,
        amount: formData.amount ? Math.round(parseFloat(formData.amount) * 100) : null,
        currency: formData.currency,
        notes: formData.notes || null,
        recurrenceRule: formData.recurrenceRule || null,
      };

      if (editingReminder) {
        await updateReminder(editingReminder.id, reminderData);
        toast.success(t('reminders.updated'));
      } else {
        await createReminder(reminderData);
        toast.success(t('reminders.created'));
      }
      
      await refetch();
      closeDialog();
      hapticSuccess();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error saving reminder:', error);
      }
      toast.error(formatErrorForDisplay(error));
      hapticError();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReminder(id);
      toast.success(t('reminders.deleted'));
      hapticSuccess();
      await refetch();
      setDeleteConfirmId(null);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error deleting reminder:', error);
      }
      toast.error(formatErrorForDisplay(error));
      hapticError();
    }
  };

  const handleStatusToggle = async (reminder: Reminder) => {
    try {
      const newStatus = reminder.status === 'erledigt' ? 'offen' : 'erledigt';
      await updateReminder(reminder.id, { status: newStatus } as any);
      toast.success(newStatus === 'erledigt' ? t('reminders.markedAsDone') : t('reminders.reopened'));
      hapticSuccess();
      await refetch();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error updating status:', error);
      }
      toast.error(formatErrorForDisplay(error));
      hapticError();
    }
  };

  const stats = useMemo(() => {
    const total = reminders.length;
    const open = reminders.filter(r => r.status === 'offen').length;
    const done = reminders.filter(r => r.status === 'erledigt').length;
    const overdue = reminders.filter(r => {
      const due = r.dueDate instanceof Date ? r.dueDate : new Date(r.dueDate);
      return r.status === 'offen' && due < new Date();
    }).length;
    
    return { total, open, done, overdue };
  }, [reminders]);

  return (
    <MobileLayout title={t('reminders.title')} showSidebar={true}>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="mobile-card">
          <p className="text-xs text-muted-foreground mb-1">{t('reminders.stats.total')}</p>
          <p className="text-xl font-semibold">{stats.total}</p>
        </div>
        <div className="mobile-card">
          <p className="text-xs text-muted-foreground mb-1">{t('reminders.stats.open')}</p>
          <p className="text-xl font-semibold">{stats.open}</p>
        </div>
        <div className="mobile-card">
          <p className="text-xs text-muted-foreground mb-1">{t('reminders.stats.done')}</p>
          <p className="text-xl font-semibold">{stats.done}</p>
        </div>
        <div className="mobile-card">
          <p className="text-xs text-muted-foreground mb-1">{t('reminders.stats.overdue')}</p>
          <p className="text-xl font-semibold text-red-500">{stats.overdue}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mobile-card mb-4">
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">{t('reminders.search')}</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t('reminders.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 min-h-[44px]"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">{t('reminders.type')}</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-10 min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('reminders.filterAll')}</SelectItem>
                  <SelectItem value="termin">{t('reminders.types.termin')}</SelectItem>
                  <SelectItem value="zahlung">{t('reminders.types.zahlung')}</SelectItem>
                  <SelectItem value="aufgabe">{t('reminders.types.aufgabe')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">{t('reminders.status.label')}</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-10 min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('reminders.filterAll')}</SelectItem>
                  <SelectItem value="offen">{t('reminders.status.open')}</SelectItem>
                  <SelectItem value="erledigt">{t('reminders.status.done')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mb-4">
        <Button
          onClick={() => {
            hapticSelection();
            openDialog();
          }}
          className="w-auto mx-auto h-12 min-h-[44px]"
        >
          <Plus className="w-5 h-5 mr-2" />
          {t('reminders.add')}
        </Button>
        {filteredReminders.length > 0 && (
          <button
            onClick={() => {
              hapticSelection();
              exportRemindersToCSV(filteredReminders);
              hapticSuccess();
            }}
            className="px-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors flex items-center justify-center min-h-[48px]"
            aria-label={t('reminders.exportCSV')}
          >
            <Download className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Reminders List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="mobile-card p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="w-4 h-4 rounded mt-1" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-2/3" />
                  <div className="flex gap-2 mt-3">
                    <Skeleton className="h-8 flex-1" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredReminders.length === 0 ? (
        <div className="mobile-card text-center py-8">
          <p className="text-muted-foreground">{t('reminders.noRemindersFound')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReminders.map((reminder) => {
            const dueDate = reminder.dueDate instanceof Date 
              ? reminder.dueDate 
              : new Date(reminder.dueDate);
            
            // Build context menu actions
            const contextMenuActions = [];
            
            if (reminder.status === 'offen') {
              contextMenuActions.push({
                id: 'complete',
                label: t('reminders.markAsDone', 'Als erledigt markieren'),
                icon: <CheckCircle2 className="w-4 h-4" />,
                onClick: () => {
                  hapticSelection();
                  handleStatusToggle(reminder);
                },
              });
            } else {
              contextMenuActions.push({
                id: 'reopen',
                label: t('reminders.reopen', 'Wieder öffnen'),
                icon: <RefreshCw className="w-4 h-4" />,
                onClick: () => {
                  hapticSelection();
                  handleStatusToggle(reminder);
                },
              });
            }
            
            contextMenuActions.push({
              id: 'edit',
              label: t('common.edit', 'Bearbeiten'),
              icon: <Edit2 className="w-4 h-4" />,
              onClick: () => {
                hapticSelection();
                openDialog(reminder);
              },
            });
            
            contextMenuActions.push({
              id: 'delete',
              label: t('common.delete', 'Löschen'),
              icon: <Trash2 className="w-4 h-4" />,
              onClick: () => {
                hapticSelection();
                setDeleteConfirmId(reminder.id);
              },
              variant: 'destructive' as const,
            });

            return (
              <ContextMenu key={reminder.id} actions={contextMenuActions}>
                <Card className="mobile-card">
                  <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getTypeIcon(reminder.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-sm flex-1">{reminder.title}</h3>
                        {getStatusBadge(reminder.status, dueDate)}
                      </div>
                      
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(dueDate)}</span>
                          {!reminder.isAllDay && reminder.dueDate && (
                            <span>
                              {new Date(reminder.dueDate).toLocaleTimeString('de-CH', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span>{getTypeLabel(reminder.type)}</span>
                          {reminder.amount && (
                            <span>• CHF {(reminder.amount / 100).toFixed(2)}</span>
                          )}
                        </div>
                        
                        {reminder.notes && (
                          <p className="line-clamp-2">{reminder.notes}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            hapticSelection();
                            handleStatusToggle(reminder);
                          }}
                          className="h-8 min-h-[44px] flex-1"
                        >
                          {reminder.status === 'erledigt' ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              {t('reminders.reopen')}
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              {t('reminders.markAsDone')}
                            </>
                          )}
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            hapticSelection();
                            openDialog(reminder);
                          }}
                          className="h-8 min-h-[44px]"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            hapticSelection();
                            setDeleteConfirmId(reminder.id);
                          }}
                          className="h-8 min-h-[44px] text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            </ContextMenu>
          );
        })}
      </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="!fixed !top-[50%] !left-[50%] !right-auto !bottom-auto !translate-x-[-50%] !translate-y-[-50%] !w-[85vw] !max-w-sm !max-h-fit !rounded-3xl !m-0 !overflow-visible !shadow-2xl">
          <DialogHeader className="px-5 pt-5 pb-3">
            <DialogTitle className="text-lg font-semibold">
              {editingReminder ? t('reminders.edit') : t('reminders.add')}
            </DialogTitle>
            <DialogDescription className="sr-only">
              {editingReminder ? t('reminders.dialogDescription') : t('reminders.dialogDescription')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 px-5 pb-2">
            <div>
              <Label>{t('reminders.reminderTitle')} *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={t('reminders.titlePlaceholder')}
                className="h-10 min-h-[44px] mt-1"
              />
            </div>
            
            <div>
              <Label>{t('reminders.type')} *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'termin' | 'zahlung' | 'aufgabe') => 
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger className="h-10 min-h-[44px] mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="termin">{t('reminders.types.termin')}</SelectItem>
                  <SelectItem value="zahlung">{t('reminders.types.zahlung')}</SelectItem>
                  <SelectItem value="aufgabe">{t('reminders.types.aufgabe')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>{t('reminders.dueDate')} *</Label>
              <Input
                type="text"
                placeholder="DD.MM.YYYY HH:mm"
                value={dueDateDisplay}
                onChange={(e) => {
                  const inputValue = e.target.value;
                  setDueDateDisplay(inputValue);
                  
                  // Try to parse the German date-time format
                  const parsed = parseDateTimeGerman(inputValue);
                  if (parsed) {
                    setFormData({ ...formData, dueDate: parsed });
                  }
                }}
                onBlur={(e) => {
                  // Validate and format on blur
                  const parsed = parseDateTimeGerman(e.target.value);
                  if (parsed) {
                    setFormData({ ...formData, dueDate: parsed });
                    setDueDateDisplay(formatDateTimeGerman(parsed));
                  } else if (e.target.value) {
                    // If invalid, try to keep current valid date
                    setDueDateDisplay(formatDateTimeGerman(formData.dueDate));
                  }
                }}
                className="h-10 min-h-[44px] mt-1"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isAllDay}
                onCheckedChange={(checked) => setFormData({ ...formData, isAllDay: checked })}
              />
              <Label>{t('reminders.allDay')}</Label>
            </div>
            
            {formData.type === 'zahlung' && (
              <>
                <div>
                  <Label>{t('reminders.amount')}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    className="h-10 min-h-[44px] mt-1"
                  />
                </div>
                
                <div>
                  <Label>{t('reminders.currency')}</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger className="h-10 min-h-[44px] mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CHF">CHF</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            
            <div>
              <Label>{t('reminders.notes')}</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t('reminders.notesPlaceholder')}
                className="mt-1 min-h-[100px]"
              />
            </div>
          </div>
          
          <DialogFooter className="px-5 pb-3 pt-2 gap-2.5">
            <Button variant="outline" onClick={closeDialog} className="h-11 min-h-[44px] flex-1 rounded-xl text-sm font-medium">
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="h-11 min-h-[44px] flex-1 rounded-xl text-sm font-medium"
            >
              {isSubmitting ? t('common.saving') : editingReminder ? t('common.update') : t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation - Centered and Compact */}
      {deleteConfirmId && (
        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent 
            className="max-w-[320px] w-[90vw] 
                       !fixed !top-[50%] !left-[50%] !right-auto !bottom-auto !translate-x-[-50%] !translate-y-[-50%]
                       rounded-lg
                       border
                       !h-auto !max-h-[auto]
                       flex flex-col
                       p-5 gap-4"
            showCloseButton={false}
          >
            <DialogHeader className="text-center">
              <DialogTitle className="text-lg font-semibold">{t('reminders.confirmDelete')}</DialogTitle>
              <DialogDescription className="sr-only">
                {t('reminders.confirmDeleteDescription')}
              </DialogDescription>
            </DialogHeader>
            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              {t('reminders.confirmDeleteDescription')}
            </p>
            <DialogFooter className="flex-row gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setDeleteConfirmId(null)}
                className="h-10 min-h-[44px] flex-1 text-sm font-medium"
              >
                {t('common.cancel')}
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => handleDelete(deleteConfirmId)}
                className="h-10 min-h-[44px] flex-1 text-sm font-medium"
              >
                {t('common.delete')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </MobileLayout>
  );
}

