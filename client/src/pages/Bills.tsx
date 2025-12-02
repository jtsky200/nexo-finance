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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, Search, Filter, Calendar, Clock, AlertTriangle, 
  CheckCircle2, DollarSign, FileText, Trash2, Edit2, 
  MoreVertical, Camera, Copy, Building2, CreditCard,
  TrendingUp, Receipt, CalendarClock, Ban
} from 'lucide-react';
import { useReminders, createReminder, updateReminder, deleteReminder, useFinanceEntries, createFinanceEntry, Reminder } from '@/lib/firebaseHooks';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import InvoiceScanner, { ScannedInvoiceData } from '@/components/InvoiceScanner';

export default function Bills() {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Reminder | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('pending');

  // Fetch all payment reminders
  const { data: allReminders = [], isLoading, refetch } = useReminders({});
  
  // Filter only payment type reminders
  const bills = useMemo(() => {
    return allReminders.filter(r => r.type === 'zahlung');
  }, [allReminders]);

  // Fetch finance entries to link paid bills
  const { data: financeEntries = [] } = useFinanceEntries({});

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    dueDate: '',
    amount: '',
    currency: 'CHF',
    notes: '',
    iban: '',
    reference: '',
    creditorName: '',
    creditorAddress: '',
    recurrenceRule: '',
  });

  const resetForm = () => {
    setFormData({
      title: '',
      dueDate: new Date().toISOString().slice(0, 10),
      amount: '',
      currency: 'CHF',
      notes: '',
      iban: '',
      reference: '',
      creditorName: '',
      creditorAddress: '',
      recurrenceRule: '',
    });
    setEditingBill(null);
  };

  const formatDate = (date: Date | any) => {
    if (!date) return 'N/A';
    try {
      const d = date?.toDate ? date.toDate() : new Date(date);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleDateString('de-CH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  const formatAmount = (amount: number, currency: string = 'CHF') => {
    return `${currency} ${(amount / 100).toFixed(2)}`;
  };

  const getDaysUntilDue = (dueDate: Date) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusInfo = (bill: Reminder) => {
    const daysUntil = getDaysUntilDue(bill.dueDate);
    
    if (bill.status === 'erledigt') {
      return {
        label: t('bills.status.paid', 'Bezahlt'),
        color: 'bg-green-100 text-green-700 border-green-200',
        icon: <CheckCircle2 className="w-3 h-3" />,
      };
    }
    
    if (daysUntil < 0) {
      return {
        label: t('bills.status.overdue', 'Überfällig'),
        color: 'bg-red-100 text-red-700 border-red-200',
        icon: <AlertTriangle className="w-3 h-3" />,
      };
    }
    
    if (daysUntil <= 7) {
      return {
        label: t('bills.status.dueSoon', 'Bald fällig'),
        color: 'bg-orange-100 text-orange-700 border-orange-200',
        icon: <Clock className="w-3 h-3" />,
      };
    }
    
    return {
      label: t('bills.status.pending', 'Offen'),
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      icon: <CalendarClock className="w-3 h-3" />,
    };
  };

  // Filter and sort bills
  const filteredBills = useMemo(() => {
    let result = [...bills];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(b => 
        b.title.toLowerCase().includes(query) ||
        b.notes?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filterStatus === 'open') {
      result = result.filter(b => b.status === 'offen');
    } else if (filterStatus === 'paid') {
      result = result.filter(b => b.status === 'erledigt');
    } else if (filterStatus === 'overdue') {
      result = result.filter(b => {
        const daysUntil = getDaysUntilDue(b.dueDate);
        return daysUntil < 0 && b.status === 'offen';
      });
    }

    // Sort by due date
    result.sort((a, b) => {
      const dateA = new Date(a.dueDate).getTime();
      const dateB = new Date(b.dueDate).getTime();
      return dateA - dateB;
    });

    return result;
  }, [bills, searchQuery, filterStatus]);

  // Split into pending and paid
  const pendingBills = filteredBills.filter(b => b.status === 'offen');
  const paidBills = filteredBills.filter(b => b.status === 'erledigt');

  // Statistics
  const stats = useMemo(() => {
    const total = bills.length;
    const open = bills.filter(b => b.status === 'offen').length;
    const paid = bills.filter(b => b.status === 'erledigt').length;
    const overdue = bills.filter(b => {
      const daysUntil = getDaysUntilDue(b.dueDate);
      return daysUntil < 0 && b.status === 'offen';
    }).length;
    const totalPending = bills
      .filter(b => b.status === 'offen')
      .reduce((sum, b) => sum + (b.amount || 0), 0);
    const totalPaid = bills
      .filter(b => b.status === 'erledigt')
      .reduce((sum, b) => sum + (b.amount || 0), 0);

    return { total, open, paid, overdue, totalPending, totalPaid };
  }, [bills]);

  // Open dialog for new bill
  const openNewDialog = () => {
    resetForm();
    setFormData(prev => ({
      ...prev,
      dueDate: new Date().toISOString().slice(0, 10),
    }));
    setDialogOpen(true);
  };

  // Open dialog for editing
  const openEditDialog = (bill: Reminder) => {
    setEditingBill(bill);
    const dueDate = bill.dueDate instanceof Date 
      ? bill.dueDate 
      : new Date(bill.dueDate);
    
    // Parse notes for IBAN, reference, etc.
    const notes = bill.notes || '';
    const ibanMatch = notes.match(/IBAN:\s*([A-Z0-9]+)/i);
    const refMatch = notes.match(/Ref:\s*([^\n]+)/i);
    const creditorMatch = notes.match(/Empfänger:\s*([^\n]+)/i);
    
    setFormData({
      title: bill.title,
      dueDate: dueDate.toISOString().slice(0, 10),
      amount: bill.amount ? (bill.amount / 100).toString() : '',
      currency: bill.currency || 'CHF',
      notes: notes.replace(/IBAN:.*\n?/gi, '').replace(/Ref:.*\n?/gi, '').replace(/Empfänger:.*\n?/gi, '').trim(),
      iban: ibanMatch?.[1] || '',
      reference: refMatch?.[1] || '',
      creditorName: creditorMatch?.[1] || '',
      creditorAddress: '',
      recurrenceRule: bill.recurrenceRule || '',
    });
    setDialogOpen(true);
  };

  // Handle form submit
  const handleSubmit = async () => {
    if (!formData.title || !formData.dueDate) {
      toast.error(t('bills.errors.required', 'Bitte füllen Sie alle Pflichtfelder aus.'));
      return;
    }

    try {
      // Build notes with payment details
      let notes = formData.notes || '';
      if (formData.iban) notes = `IBAN: ${formData.iban}\n${notes}`;
      if (formData.reference) notes = `Ref: ${formData.reference}\n${notes}`;
      if (formData.creditorName) notes = `Empfänger: ${formData.creditorName}\n${notes}`;

      const data = {
        title: formData.title,
        type: 'zahlung' as const,
        dueDate: new Date(formData.dueDate),
        isAllDay: true,
        amount: formData.amount ? Math.round(parseFloat(formData.amount) * 100) : undefined,
        currency: formData.currency,
        notes: notes.trim() || undefined,
        recurrenceRule: formData.recurrenceRule || undefined,
      };

      if (editingBill) {
        await updateReminder(editingBill.id, data);
        toast.success(t('bills.updated', 'Rechnung aktualisiert'));
      } else {
        await createReminder(data);
        toast.success(t('bills.created', 'Rechnung erstellt'));
      }

      setDialogOpen(false);
      resetForm();
      refetch();
    } catch (error: any) {
      toast.error(t('common.error') + ': ' + error.message);
    }
  };

  // Handle mark as paid
  const handleMarkAsPaid = async (bill: Reminder) => {
    try {
      // Update reminder status
      await updateReminder(bill.id, { status: 'erledigt' as any });
      
      // Create expense entry in finance
      if (bill.amount) {
        await createFinanceEntry({
          date: new Date().toISOString(),
          type: 'ausgabe',
          category: 'Rechnung',
          amount: bill.amount,
          currency: bill.currency || 'CHF',
          notes: `Bezahlt: ${bill.title}`,
          paymentMethod: 'Überweisung',
        });
      }
      
      toast.success(t('bills.markedAsPaid', 'Als bezahlt markiert und Ausgabe erstellt'));
      refetch();
    } catch (error: any) {
      toast.error(t('common.error') + ': ' + error.message);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm(t('bills.confirmDelete', 'Möchten Sie diese Rechnung wirklich löschen?'))) {
      return;
    }

    try {
      await deleteReminder(id);
      toast.success(t('bills.deleted', 'Rechnung gelöscht'));
      refetch();
    } catch (error: any) {
      toast.error(t('common.error') + ': ' + error.message);
    }
  };

  // Handle scanned invoice data
  const handleScannedData = (data: ScannedInvoiceData) => {
    setFormData(prev => ({
      ...prev,
      title: data.creditorName || data.message || prev.title,
      amount: data.amount?.toString() || prev.amount,
      iban: data.iban || prev.iban,
      reference: data.reference || prev.reference,
      creditorName: data.creditorName || prev.creditorName,
      creditorAddress: data.creditorAddress || prev.creditorAddress,
      notes: data.message || prev.notes,
    }));
    setScannerOpen(false);
    setDialogOpen(true);
    toast.success(t('bills.dataImported', 'Rechnungsdaten übernommen'));
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} kopiert!`);
  };

  // Render bill card
  const renderBillCard = (bill: Reminder) => {
    const statusInfo = getStatusInfo(bill);
    const daysUntil = getDaysUntilDue(bill.dueDate);
    
    // Parse IBAN from notes
    const notes = bill.notes || '';
    const ibanMatch = notes.match(/IBAN:\s*([A-Z0-9]+)/i);

    return (
      <Card key={bill.id} className="transition-all hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="p-2 rounded-lg bg-green-100 text-green-600">
                <Receipt className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-semibold text-foreground truncate">{bill.title}</h3>
                  <Badge variant="outline" className={`flex items-center gap-1 ${statusInfo.color}`}>
                    {statusInfo.icon}
                    {statusInfo.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(bill.dueDate)}
                  </span>
                  {bill.status === 'offen' && (
                    <span className={`${daysUntil < 0 ? 'text-red-600' : daysUntil <= 7 ? 'text-orange-600' : ''}`}>
                      {daysUntil < 0 
                        ? `${Math.abs(daysUntil)} Tage überfällig`
                        : daysUntil === 0 
                          ? 'Heute fällig'
                          : `${daysUntil} Tage verbleibend`
                      }
                    </span>
                  )}
                </div>
                {ibanMatch && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground font-mono">{ibanMatch[1]}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(ibanMatch[1], 'IBAN')}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {bill.amount && (
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">
                    {formatAmount(bill.amount, bill.currency || 'CHF')}
                  </p>
                </div>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {bill.status === 'offen' && (
                    <DropdownMenuItem onClick={() => handleMarkAsPaid(bill)}>
                      <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                      {t('bills.markAsPaid', 'Als bezahlt markieren')}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => openEditDialog(bill)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    {t('common.edit', 'Bearbeiten')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleDelete(bill.id)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('common.delete', 'Löschen')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Layout title={t('bills.title', 'Rechnungen')}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <p className="text-muted-foreground">
            {t('bills.description', 'Verwalten Sie Ihre Rechnungen und Zahlungserinnerungen')}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setScannerOpen(true)}>
              <Camera className="w-4 h-4 mr-2" />
              {t('bills.scan', 'Scannen')}
            </Button>
            <Button onClick={openNewDialog}>
              <Plus className="w-4 h-4 mr-2" />
              {t('bills.add', 'Rechnung hinzufügen')}
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t('bills.total', 'Gesamt')}</span>
              </div>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">{t('bills.open', 'Offen')}</span>
              </div>
              <p className="text-2xl font-bold mt-1 text-blue-600">{stats.open}</p>
              <p className="text-sm text-muted-foreground">{formatAmount(stats.totalPending)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-muted-foreground">{t('bills.overdue', 'Überfällig')}</span>
              </div>
              <p className="text-2xl font-bold mt-1 text-red-600">{stats.overdue}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-sm text-muted-foreground">{t('bills.paid', 'Bezahlt')}</span>
              </div>
              <p className="text-2xl font-bold mt-1 text-green-600">{stats.paid}</p>
              <p className="text-sm text-muted-foreground">{formatAmount(stats.totalPaid)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar for pending payments */}
        {stats.totalPending > 0 && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">{t('bills.pendingPayments', 'Offene Zahlungen')}</span>
                <span className="text-sm font-bold">{formatAmount(stats.totalPending)}</span>
              </div>
              <Progress value={(stats.paid / (stats.open + stats.paid)) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {stats.paid} von {stats.total} Rechnungen bezahlt
              </p>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={t('bills.search', 'Suchen...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder={t('bills.filterStatus', 'Status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all', 'Alle')}</SelectItem>
                  <SelectItem value="open">{t('bills.open', 'Offen')}</SelectItem>
                  <SelectItem value="overdue">{t('bills.overdue', 'Überfällig')}</SelectItem>
                  <SelectItem value="paid">{t('bills.paid', 'Bezahlt')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {t('bills.pending', 'Ausstehend')} ({pendingBills.length})
            </TabsTrigger>
            <TabsTrigger value="paid" className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {t('bills.paidTab', 'Bezahlt')} ({paidBills.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                {t('common.loading', 'Laden...')}
              </div>
            ) : pendingBills.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Receipt className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    {t('bills.noPending', 'Keine ausstehenden Rechnungen')}
                  </p>
                  <Button onClick={openNewDialog} variant="outline" className="mt-4">
                    <Plus className="w-4 h-4 mr-2" />
                    {t('bills.addFirst', 'Erste Rechnung hinzufügen')}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {pendingBills.map(renderBillCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="paid" className="mt-4">
            {paidBills.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    {t('bills.noPaid', 'Noch keine bezahlten Rechnungen')}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {paidBills.map(renderBillCard)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBill 
                ? t('bills.edit', 'Rechnung bearbeiten') 
                : t('bills.add', 'Rechnung hinzufügen')
              }
            </DialogTitle>
            <DialogDescription>
              {t('bills.dialogDescription', 'Erfassen Sie die Rechnungsdetails')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Scan Button */}
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => {
                setDialogOpen(false);
                setScannerOpen(true);
              }}
            >
              <Camera className="w-4 h-4 mr-2" />
              {t('bills.scanInvoice', 'Rechnung scannen')}
            </Button>

            <div className="space-y-2">
              <Label htmlFor="title">{t('bills.titleField', 'Titel / Beschreibung')} *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={t('bills.titlePlaceholder', 'z.B. Stromrechnung März')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">{t('bills.amount', 'Betrag')} *</Label>
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
                <Label htmlFor="currency">{t('bills.currency', 'Währung')}</Label>
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

            <div className="space-y-2">
              <Label htmlFor="dueDate">{t('bills.dueDate', 'Fälligkeitsdatum')} *</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>

            {/* Payment Details */}
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Building2 className="w-4 h-4" />
                {t('bills.paymentDetails', 'Zahlungsdetails')}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="creditorName">{t('bills.creditor', 'Empfänger')}</Label>
                <Input
                  id="creditorName"
                  value={formData.creditorName}
                  onChange={(e) => setFormData({ ...formData, creditorName: e.target.value })}
                  placeholder="z.B. Stadtwerke AG"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="iban">IBAN</Label>
                <Input
                  id="iban"
                  value={formData.iban}
                  onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                  placeholder="CH00 0000 0000 0000 0000 0"
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference">{t('bills.reference', 'Referenz / Mitteilung')}</Label>
                <Input
                  id="reference"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  placeholder="Referenznummer"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('bills.recurrence', 'Wiederholung')}</Label>
              <Select
                value={formData.recurrenceRule}
                onValueChange={(value) => setFormData({ ...formData, recurrenceRule: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('bills.noRecurrence', 'Keine Wiederholung')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('bills.noRecurrence', 'Keine Wiederholung')}</SelectItem>
                  <SelectItem value="monthly">{t('finance.monthly', 'Monatlich')}</SelectItem>
                  <SelectItem value="quarterly">{t('bills.quarterly', 'Vierteljährlich')}</SelectItem>
                  <SelectItem value="yearly">{t('finance.yearly', 'Jährlich')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t('bills.notes', 'Notizen')}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t('bills.notesPlaceholder', 'Optionale Notizen...')}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('common.cancel', 'Abbrechen')}
            </Button>
            <Button onClick={handleSubmit}>
              {t('common.save', 'Speichern')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Scanner */}
      <InvoiceScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onInvoiceScanned={handleScannedData}
      />
    </Layout>
  );
}

