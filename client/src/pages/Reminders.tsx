import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Calendar, Banknote, CheckSquare, Trash2, Edit2, 
  Clock, AlertTriangle, CheckCircle2, Filter, Search,
  Bell, BellOff, RefreshCw, MoreVertical
} from 'lucide-react';
import { useReminders, createReminder, updateReminder, deleteReminder, fixReminderTimes, Reminder } from '@/lib/firebaseHooks';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { parseLocalDateTime, formatDateForDisplay, dateToDateTimeLocal, dateToISOString } from '@/lib/dateTimeUtils';
import { eventBus, Events } from '@/lib/eventBus';
import ContextMenu from '@/components/ContextMenu';
import { CheckCircle2, Eye } from 'lucide-react';

export default function Reminders() {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('upcoming');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: reminders = [], isLoading, refetch } = useReminders();

  // Fix existing reminders on mount if needed (one-time fix)
  useEffect(() => {
    const fixReminders = async () => {
      try {
        await fixReminderTimes();
        refetch();
      } catch (error) {
        // Silently fail - this is just a one-time fix
        console.log('Reminder time fix already applied or not needed');
      }
    };
    fixReminders();
  }, []); // Only run once on mount

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    type: 'termin' as 'termin' | 'zahlung' | 'aufgabe',
    dueDate: '',
    isAllDay: false,
    amount: '',
    currency: 'CHF',
    notes: '',
    recurrenceRule: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use centralized date formatting utility
  const formatDate = (date: Date | any) => formatDateForDisplay(date);

  const formatAmount = (amount: number, currency: string = 'CHF') => {
    return `${currency} ${(amount / 100).toFixed(2)}`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'termin':
        return <Calendar className="w-4 h-4" />;
      case 'zahlung':
        return <Banknote className="w-4 h-4" />;
      case 'aufgabe':
        return <CheckSquare className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'termin':
        return t('reminders.types.termin', 'Termin');
      case 'zahlung':
        return t('reminders.types.zahlung', 'Zahlung');
      case 'aufgabe':
        return t('reminders.types.aufgabe', 'Aufgabe');
      default:
        return type;
    }
  };

  const getStatusBadge = (status: string, dueDate: Date | string) => {
    const now = new Date();
    const due = dueDate instanceof Date ? dueDate : new Date(dueDate);
    const isOverdue = due < now && status === 'offen';
    
    if (isOverdue) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          {t('reminders.status.overdue', 'Überfällig')}
        </Badge>
      );
    }
    
    switch (status) {
      case 'erledigt':
        return (
          <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-700">
            <CheckCircle2 className="w-3 h-3" />
            {t('reminders.status.done', 'Erledigt')}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {t('reminders.status.open', 'Offen')}
          </Badge>
        );
    }
  };

  // Filter and sort reminders
  const filteredReminders = useMemo(() => {
    let result = [...reminders];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.title.toLowerCase().includes(query) ||
        r.notes?.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (filterType !== 'all') {
      result = result.filter(r => r.type === filterType);
    }

    // Status filter
    if (filterStatus !== 'all') {
      result = result.filter(r => r.status === filterStatus);
    }

    // Sort by due date
    result.sort((a, b) => {
      const dateA = new Date(a.dueDate).getTime();
      const dateB = new Date(b.dueDate).getTime();
      return dateA - dateB;
    });

    return result;
  }, [reminders, searchQuery, filterType, filterStatus]);

  // Split into upcoming and past
  const now = new Date();
  const upcomingReminders = filteredReminders.filter(r => {
    const due = new Date(r.dueDate);
    return due >= now || r.status === 'offen';
  });
  const pastReminders = filteredReminders.filter(r => {
    const due = new Date(r.dueDate);
    return due < now && r.status !== 'offen';
  });

  // Statistics
  const stats = useMemo(() => {
    const total = reminders.length;
    const open = reminders.filter(r => r.status === 'offen').length;
    const done = reminders.filter(r => r.status === 'erledigt').length;
    const overdue = reminders.filter(r => {
      const due = new Date(r.dueDate);
      return due < now && r.status === 'offen';
    }).length;
    const payments = reminders
      .filter(r => r.type === 'zahlung' && r.status === 'offen')
      .reduce((sum, r) => sum + (r.amount || 0), 0);

    return { total, open, done, overdue, payments };
  }, [reminders]);

  // Open dialog for new reminder
  const openNewDialog = () => {
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
    setDialogOpen(true);
  };

  // Open dialog for editing
  const openEditDialog = (reminder: Reminder) => {
    setEditingReminder(reminder);
    
    // Use centralized utility to convert date to datetime-local format
    const localDateTimeString = dateToDateTimeLocal(reminder.dueDate);
    
    setFormData({
      title: reminder.title,
      type: reminder.type as 'termin' | 'zahlung' | 'aufgabe',
      dueDate: localDateTimeString,
      isAllDay: reminder.isAllDay,
      amount: reminder.amount ? (reminder.amount / 100).toString() : '',
      currency: reminder.currency || 'CHF',
      notes: reminder.notes || '',
      recurrenceRule: reminder.recurrenceRule || '',
    });
    setDialogOpen(true);
  };

  // Handle form submit
  const handleSubmit = async () => {
    if (!formData.title || !formData.dueDate) {
      toast.error(t('reminders.errors.required', 'Bitte füllen Sie alle Pflichtfelder aus.'));
      return;
    }

    setIsSubmitting(true);
    try {
      // Use centralized utility to parse datetime-local string
      // This ensures consistent handling across the entire application
      const localDate = parseLocalDateTime(formData.dueDate);
      
      const data = {
        title: formData.title,
        type: formData.type,
        dueDate: localDate,
        isAllDay: formData.isAllDay,
        amount: formData.amount ? Math.round(parseFloat(formData.amount) * 100) : undefined,
        currency: formData.currency,
        notes: formData.notes || undefined,
        recurrenceRule: formData.recurrenceRule || undefined,
      };

      if (editingReminder) {
        await updateReminder(editingReminder.id, data);
        toast.success(t('reminders.updated', 'Erinnerung aktualisiert'));
        eventBus.emit(Events.REMINDER_UPDATED, { id: editingReminder.id, data });
      } else {
        const newReminder = await createReminder(data);
        toast.success(t('reminders.created', 'Erinnerung erstellt'));
        eventBus.emit(Events.REMINDER_CREATED, { reminder: newReminder });
      }

      setDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(t('common.error') + ': ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (reminder: Reminder, newStatus: string) => {
    try {
      await updateReminder(reminder.id, { status: newStatus as any });
      toast.success(t('reminders.statusUpdated', 'Status aktualisiert'));
      refetch();
    } catch (error: any) {
      toast.error(t('common.error') + ': ' + error.message);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteConfirmId) return;

    try {
      await deleteReminder(deleteConfirmId);
      toast.success(t('reminders.deleted', 'Erinnerung gelöscht'));
      eventBus.emit(Events.REMINDER_DELETED, { id: deleteConfirmId });
      refetch();
      setDeleteConfirmId(null);
    } catch (error: any) {
      toast.error(t('common.error') + ': ' + error.message);
    }
  };

  // Render reminder card
  const renderReminderCard = (reminder: Reminder) => {
    const due = new Date(reminder.dueDate);
    const isOverdue = due < now && reminder.status === 'offen';

    // Build context menu actions
    const contextMenuActions = [];
    
    if (reminder.status === 'offen') {
      contextMenuActions.push({
        id: 'complete',
        label: t('reminders.markDone', 'Als erledigt markieren'),
        icon: <CheckCircle2 className="w-4 h-4" />,
        onClick: () => handleStatusChange(reminder, 'erledigt'),
      });
    } else {
      contextMenuActions.push({
        id: 'reopen',
        label: t('reminders.markOpen', 'Wieder öffnen'),
        icon: <RefreshCw className="w-4 h-4" />,
        onClick: () => handleStatusChange(reminder, 'offen'),
      });
    }
    
    contextMenuActions.push({
      id: 'edit',
      label: t('common.edit', 'Bearbeiten'),
      icon: <Edit2 className="w-4 h-4" />,
      onClick: () => openEditDialog(reminder),
    });
    
    contextMenuActions.push({
      id: 'delete',
      label: t('common.delete', 'Löschen'),
      icon: <Trash2 className="w-4 h-4" />,
      onClick: () => setDeleteConfirmId(reminder.id),
      variant: 'destructive' as const,
    });

    return (
      <ContextMenu actions={contextMenuActions}>
        <Card 
          key={reminder.id} 
          className={`transition-all hover:shadow-md ${isOverdue ? 'border-red-200 bg-red-50/50' : ''}`}
        >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={`p-2 rounded-lg ${
                reminder.type === 'termin' ? 'bg-blue-100 text-blue-600' :
                reminder.type === 'zahlung' ? 'bg-green-100 text-green-600' :
                'bg-purple-100 text-purple-600'
              }`}>
                {getTypeIcon(reminder.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-semibold text-foreground truncate">{reminder.title}</h3>
                  {getStatusBadge(reminder.status, reminder.dueDate)}
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(reminder.dueDate)}
                </p>
                {reminder.notes && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {reminder.notes}
                  </p>
                )}
                {reminder.amount && (
                  <p className="text-sm font-medium text-green-600 mt-1">
                    {formatAmount(reminder.amount, reminder.currency || 'CHF')}
                  </p>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {reminder.status === 'offen' && (
                  <DropdownMenuItem onClick={() => handleStatusChange(reminder, 'erledigt')}>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {t('reminders.markDone', 'Als erledigt markieren')}
                  </DropdownMenuItem>
                )}
                {reminder.status === 'erledigt' && (
                  <DropdownMenuItem onClick={() => handleStatusChange(reminder, 'offen')}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {t('reminders.markOpen', 'Wieder öffnen')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => openEditDialog(reminder)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  {t('common.edit', 'Bearbeiten')}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setDeleteConfirmId(reminder.id)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('common.delete', 'Löschen')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
      </ContextMenu>
    );
  };

  return (
    <Layout title={t('reminders.title')}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <p className="text-muted-foreground">
            {t('reminders.description', 'Verwalten Sie Ihre Termine, Zahlungen und Aufgaben')}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={async () => {
              try {
                await fixReminderTimes();
                toast.success(t('reminders.fixed', 'Erinnerungen wurden korrigiert'));
                refetch();
              } catch (error: any) {
                toast.error(t('reminders.fixError', 'Fehler beim Korrigieren') + ': ' + error.message);
              }
            }}>
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('reminders.fixTimes', 'Zeiten korrigieren')}
            </Button>
            <Button onClick={openNewDialog}>
              <Plus className="w-4 h-4 mr-2" />
              {t('reminders.add', 'Erinnerung hinzufügen')}
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t('reminders.total', 'Gesamt')}</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">{t('reminders.status.open', 'Offen')}</span>
              </div>
              <p className="text-2xl font-bold mt-1 text-blue-600">{stats.open}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-muted-foreground">{t('reminders.status.overdue', 'Überfällig')}</span>
              </div>
              <p className="text-2xl font-bold mt-1 text-red-600">{stats.overdue}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Banknote className="w-4 h-4 text-green-500" />
                <span className="text-sm text-muted-foreground">{t('reminders.pendingPayments', 'Offene Zahlungen')}</span>
              </div>
              <p className="text-2xl font-bold mt-1 text-green-600">{formatAmount(stats.payments)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t('reminders.search', 'Suchen...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[130px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder={t('reminders.filterType', 'Typ')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('reminders.filterAll', 'Alle')}</SelectItem>
                    <SelectItem value="termin">{t('reminders.types.termin', 'Termin')}</SelectItem>
                    <SelectItem value="zahlung">{t('reminders.types.zahlung', 'Zahlung')}</SelectItem>
                    <SelectItem value="aufgabe">{t('reminders.types.aufgabe', 'Aufgabe')}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder={t('reminders.filterStatus', 'Status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('reminders.filterAll', 'Alle')}</SelectItem>
                    <SelectItem value="offen">{t('reminders.status.open', 'Offen')}</SelectItem>
                    <SelectItem value="erledigt">{t('reminders.status.done', 'Erledigt')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upcoming" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              {t('reminders.upcoming', 'Anstehend')} ({upcomingReminders.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="flex items-center gap-2">
              <BellOff className="w-4 h-4" />
              {t('reminders.past', 'Vergangen')} ({pastReminders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-4">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                {t('common.loading', 'Laden...')}
              </div>
            ) : upcomingReminders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bell className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    {t('reminders.noUpcoming', 'Keine anstehenden Erinnerungen')}
                  </p>
                  <Button onClick={openNewDialog} variant="outline" className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    {t('reminders.addFirst', 'Erste Erinnerung erstellen')}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {upcomingReminders.map(renderReminderCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-4">
            {pastReminders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BellOff className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    {t('reminders.noPast', 'Keine vergangenen Erinnerungen')}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {pastReminders.map(renderReminderCard)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingReminder 
                ? t('reminders.edit', 'Erinnerung bearbeiten') 
                : t('reminders.add', 'Erinnerung hinzufügen')
              }
            </DialogTitle>
            <DialogDescription>
              {t('reminders.dialogDescription', 'Erstellen Sie eine neue Erinnerung für Termine, Zahlungen oder Aufgaben')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t('reminders.titleField', 'Titel')} *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={t('reminders.titlePlaceholder', 'z.B. Zahnarzttermin')}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('reminders.type', 'Typ')} *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="termin">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {t('reminders.types.termin', 'Termin')}
                    </div>
                  </SelectItem>
                  <SelectItem value="zahlung">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4" />
                      {t('reminders.types.zahlung', 'Zahlung')}
                    </div>
                  </SelectItem>
                  <SelectItem value="aufgabe">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-4 h-4" />
                      {t('reminders.types.aufgabe', 'Aufgabe')}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">{t('reminders.dueDate', 'Fälligkeitsdatum')} *</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isAllDay"
                checked={formData.isAllDay}
                onCheckedChange={(checked) => setFormData({ ...formData, isAllDay: checked })}
              />
              <Label htmlFor="isAllDay">{t('reminders.allDay', 'Ganztägig')}</Label>
            </div>

            {formData.type === 'zahlung' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">{t('reminders.amount', 'Betrag')}</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">{t('reminders.currency', 'Währung')}</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CHF">CHF</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>{t('reminders.recurrence', 'Wiederholung')}</Label>
              <Select
                value={formData.recurrenceRule || 'none'}
                onValueChange={(value) => setFormData({ ...formData, recurrenceRule: value === 'none' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('reminders.noRecurrence', 'Keine Wiederholung')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('reminders.noRecurrence', 'Keine Wiederholung')}</SelectItem>
                  <SelectItem value="daily">{t('finance.daily', 'Täglich')}</SelectItem>
                  <SelectItem value="weekly">{t('finance.weekly', 'Wöchentlich')}</SelectItem>
                  <SelectItem value="monthly">{t('finance.monthly', 'Monatlich')}</SelectItem>
                  <SelectItem value="yearly">{t('finance.yearly', 'Jährlich')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t('reminders.notes', 'Notizen')}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t('reminders.notesPlaceholder', 'Optionale Notizen...')}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('common.cancel', 'Abbrechen')}
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? t('common.saving', 'Speichert...') : editingReminder ? t('common.update', 'Aktualisieren') : t('common.create', 'Erstellen')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('reminders.confirmDelete', 'Erinnerung löschen?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('reminders.confirmDeleteDescription', 'Möchten Sie diese Erinnerung wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Abbrechen')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {t('common.delete', 'Löschen')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
