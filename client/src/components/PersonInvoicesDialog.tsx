import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { 
  usePersonInvoices, 
  createInvoice, 
  updateInvoice, 
  updateInvoiceStatus, 
  deleteInvoice,
  usePersonReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  recordInstallmentPayment,
  updateInstallmentPlan,
  convertToInstallmentPlan
} from '@/lib/firebaseHooks';

import { useState, useEffect, useCallback, useRef } from 'react';

import { useTranslation } from 'react-i18next';

import { 
  Plus, Trash2, Edit2, Camera, QrCode, Copy, 
  FileText, X, Calendar, Bell, Clock, ArrowDownLeft, ArrowUpRight, Repeat, CalendarDays, FolderOpen, CreditCard
} from 'lucide-react';

import { toast } from 'sonner';

import InvoiceScanner, { ScannedInvoiceData } from './InvoiceScanner';
import PersonDocumentsTab from './PersonDocumentsTab';

interface PersonInvoicesDialogProps {
  person: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDataChanged?: () => void;
  highlightInvoiceId?: string | null;
}

export default function PersonInvoicesDialog({ person, open, onOpenChange, onDataChanged, highlightInvoiceId }: PersonInvoicesDialogProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'invoices' | 'appointments' | 'documents'>('invoices');
  const invoiceRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [highlightedInvoiceId, setHighlightedInvoiceId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAddAppointmentDialog, setShowAddAppointmentDialog] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const [deleteInvoiceId, setDeleteInvoiceId] = useState<string | null>(null);
  const [deleteAppointmentId, setDeleteAppointmentId] = useState<string | null>(null);
  const [showInstallmentPaymentDialog, setShowInstallmentPaymentDialog] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<any>(null);
  const [selectedInstallment, setSelectedInstallment] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showConvertToInstallmentDialog, setShowConvertToInstallmentDialog] = useState(false);
  const [invoiceToConvert, setInvoiceToConvert] = useState<any>(null);
  const [convertInstallmentDuration, setConvertInstallmentDuration] = useState('3');
  const [convertInstallmentInterval, setConvertInstallmentInterval] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [editingInstallment, setEditingInstallment] = useState<any>(null);
  const [installmentNote, setInstallmentNote] = useState('');
  const [installmentNewDate, setInstallmentNewDate] = useState('');
  const [newAppointment, setNewAppointment] = useState({
    title: '',
    type: 'termin' as 'termin' | 'aufgabe' | 'geburtstag' | 'andere',
    dueDate: new Date().toISOString().split('T')[0],
    isAllDay: true,
    notes: '',
    recurrenceRule: 'none' as 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly',
  });
  const [newInvoice, setNewInvoice] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    reminderEnabled: false,
    reminderDate: '',
    isRecurring: false,
    recurringInterval: 'monthly' as 'weekly' | 'monthly' | 'quarterly' | 'yearly',
    isInstallmentPlan: false,
    installmentCount: 2,
    installmentDuration: 0, // Duration in months/weeks/years
    installmentInterval: 'monthly' as 'weekly' | 'monthly' | 'quarterly' | 'yearly',
    status: 'open',
    direction: 'incoming' as 'incoming' | 'outgoing', // incoming = Person schuldet mir, outgoing = Ich schulde Person
    notes: '',
    iban: '',
    reference: '',
    creditorName: '',
    creditorAddress: '',
    imageUrl: '',
  });

  const { data: invoices = [], isLoading, refetch: refetchInvoices } = usePersonInvoices(person?.id);
  const { data: appointments = [], isLoading: appointmentsLoading, refetch: refetchAppointments } = usePersonReminders(person?.id);

  useEffect(() => {
    if (open && person?.id) {
      refetchInvoices();
      refetchAppointments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, person?.id]);

  // Scroll to and highlight invoice when highlightInvoiceId is set
  useEffect(() => {
    if (highlightInvoiceId && open && activeTab === 'invoices') {
      // Wait for invoices to load
      setTimeout(() => {
        const invoiceElement = invoiceRefs.current[highlightInvoiceId];
        if (invoiceElement) {
          invoiceElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setHighlightedInvoiceId(highlightInvoiceId);
          // Remove highlight after 3 seconds
          setTimeout(() => {
            setHighlightedInvoiceId(null);
          }, 3000);
        }
      }, 500);
    }
  }, [highlightInvoiceId, open, activeTab, invoices.length]);

  // Update selected invoice when invoices data changes
  useEffect(() => {
    if (selectedInvoiceForPayment && invoices.length > 0) {
      const updatedInvoice = invoices.find((inv: any) => inv.id === selectedInvoiceForPayment.id);
      if (updatedInvoice) {
        setSelectedInvoiceForPayment(updatedInvoice);
      }
    }
  }, [invoices, selectedInvoiceForPayment?.id]);

  const refreshData = useCallback(async () => {
    try {
      await refetchInvoices();
      await refetchAppointments();
      if (onDataChanged) {
        onDataChanged();
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      // Silently fail - data will refresh on next dialog open
    }
  }, [refetchInvoices, refetchAppointments, onDataChanged]);

  // Appointment handlers
  const handleAddAppointment = async () => {
    if (!newAppointment.title || !newAppointment.dueDate) {
      toast.error('Bitte Titel und Datum eingeben');
      return;
    }

    try {
      await createReminder({
        title: newAppointment.title,
        type: newAppointment.type,
        dueDate: new Date(newAppointment.dueDate),
        isAllDay: newAppointment.isAllDay,
        notes: newAppointment.notes || undefined,
        recurrenceRule: newAppointment.recurrenceRule !== 'none' ? newAppointment.recurrenceRule : undefined,
        personId: person.id,
        personName: person.name,
      } as any);
      
      toast.success('Termin hinzugefügt');
      setNewAppointment({
        title: '',
        type: 'termin',
        dueDate: new Date().toISOString().split('T')[0],
        isAllDay: true,
        notes: '',
        recurrenceRule: 'none',
      });
      setShowAddAppointmentDialog(false);
      try {
        await refreshData();
      } catch (refreshError) {
        console.error('Error refreshing data:', refreshError);
      }
    } catch (error: any) {
      console.error('Error adding appointment:', error);
      toast.error('Fehler: ' + (error.message || 'Unbekannter Fehler'));
    }
  };

  const handleUpdateAppointment = async () => {
    if (!editingAppointment || !editingAppointment.title) {
      toast.error('Bitte Titel eingeben');
      return;
    }

    try {
      await updateReminder(editingAppointment.id, {
        title: editingAppointment.title,
        type: editingAppointment.type,
        dueDate: new Date(editingAppointment.dueDate),
        isAllDay: editingAppointment.isAllDay,
        notes: editingAppointment.notes || undefined,
        recurrenceRule: editingAppointment.recurrenceRule !== 'none' ? editingAppointment.recurrenceRule : undefined,
      });
      
      toast.success('Termin aktualisiert');
      setEditingAppointment(null);
      try {
        await refreshData();
      } catch (refreshError) {
        console.error('Error refreshing data:', refreshError);
      }
    } catch (error: any) {
      console.error('Error updating appointment:', error);
      toast.error('Fehler: ' + (error.message || 'Unbekannter Fehler'));
    }
  };

  const handleDeleteAppointment = async () => {
    if (!deleteAppointmentId) return;

    try {
      await deleteReminder(deleteAppointmentId);
      toast.success('Termin gelöscht');
      setDeleteAppointmentId(null);
      try {
        await refreshData();
      } catch (refreshError) {
        console.error('Error refreshing data:', refreshError);
      }
    } catch (error: any) {
      console.error('Error deleting appointment:', error);
      toast.error('Fehler: ' + (error.message || 'Unbekannter Fehler'));
    }
  };

  const formatDate = (date: Date | any) => {
    if (!date) return '-';
    try {
      const d = date?.toDate ? date.toDate() : new Date(date);
      if (isNaN(d.getTime())) return '-';
      return d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return '-';
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(amount / 100);
  };

  const handleAddInvoice = async () => {
    if (!newInvoice.amount || !newInvoice.description) {
      toast.error('Bitte Beschreibung und Betrag eingeben');
      return;
    }

    try {
      const amountInCents = Math.round(parseFloat(newInvoice.amount) * 100);
      await createInvoice(person.id, {
        amount: amountInCents,
        description: newInvoice.description,
        date: new Date(newInvoice.date),
        status: newInvoice.status,
        direction: newInvoice.direction,
        dueDate: newInvoice.dueDate ? new Date(newInvoice.dueDate) : undefined,
        reminderEnabled: newInvoice.reminderEnabled,
        reminderDate: newInvoice.reminderDate ? new Date(newInvoice.reminderDate) : undefined,
        notes: newInvoice.notes || undefined,
        isRecurring: newInvoice.isRecurring,
        recurringInterval: newInvoice.isRecurring ? newInvoice.recurringInterval : undefined,
        isInstallmentPlan: newInvoice.isInstallmentPlan,
        installmentCount: newInvoice.isInstallmentPlan ? newInvoice.installmentCount : undefined,
        installmentDuration: newInvoice.isInstallmentPlan && newInvoice.installmentDuration ? newInvoice.installmentDuration : undefined,
        installmentInterval: newInvoice.isInstallmentPlan ? newInvoice.installmentInterval : undefined,
      });
      
      toast.success('Rechnung hinzugefügt');
      setNewInvoice({
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        dueDate: '',
        reminderEnabled: false,
        reminderDate: '',
        isRecurring: false,
        recurringInterval: 'monthly',
        isInstallmentPlan: false,
        installmentCount: 2,
        installmentDuration: 0,
        installmentInterval: 'monthly',
        status: 'open',
        direction: person?.type === 'external' ? 'incoming' : 'outgoing',
        notes: '',
        iban: '',
        reference: '',
        creditorName: '',
        creditorAddress: '',
        imageUrl: '',
      });
      setShowAddDialog(false);
      try {
        await refreshData();
      } catch (refreshError) {
        console.error('Error refreshing data:', refreshError);
        // Don't show error to user, data will refresh on next open
      }
    } catch (error: any) {
      console.error('Error adding invoice:', error);
      toast.error('Fehler: ' + (error.message || 'Unbekannter Fehler'));
    }
  };

  const handleConvertToInstallment = async () => {
    if (!invoiceToConvert || !convertInstallmentDuration || parseInt(convertInstallmentDuration) < 1) {
      toast.error('Bitte Dauer eingeben (mindestens 1)');
      return;
    }

    try {
      await convertToInstallmentPlan(person.id, invoiceToConvert.id, {
        installmentDuration: parseInt(convertInstallmentDuration),
        installmentInterval: convertInstallmentInterval,
        startDate: invoiceToConvert.dueDate ? new Date(invoiceToConvert.dueDate) : new Date(),
      });
      toast.success('Rechnung erfolgreich in Raten umgewandelt');
                setShowConvertToInstallmentDialog(false);
                setInvoiceToConvert(null);
                setConvertInstallmentDuration('3');
                setConvertInstallmentInterval('monthly');
      try {
        await refreshData();
      } catch (refreshError) {
        console.error('Error refreshing data:', refreshError);
      }
    } catch (error: any) {
      console.error('Error converting to installment:', error);
      toast.error('Fehler: ' + (error.message || 'Unbekannter Fehler'));
    }
  };

  const handleUpdateInvoice = async () => {
    if (!editingInvoice || !editingInvoice.amount || !editingInvoice.description) {
      toast.error('Bitte alle Felder ausfüllen');
      return;
    }

    try {
      const amountInCents = Math.round(parseFloat(editingInvoice.amount) * 100);
      await updateInvoice(person.id, editingInvoice.id, {
        amount: amountInCents,
        description: editingInvoice.description,
        date: new Date(editingInvoice.date),
        dueDate: editingInvoice.dueDate ? new Date(editingInvoice.dueDate) : undefined,
        reminderEnabled: editingInvoice.reminderEnabled,
        reminderDate: editingInvoice.reminderDate ? new Date(editingInvoice.reminderDate) : undefined,
        notes: editingInvoice.notes || undefined,
        isRecurring: editingInvoice.isRecurring,
        recurringInterval: editingInvoice.isRecurring ? editingInvoice.recurringInterval : undefined,
        isInstallmentPlan: editingInvoice.isInstallmentPlan,
        installmentCount: editingInvoice.isInstallmentPlan ? editingInvoice.installmentCount : undefined,
        installmentInterval: editingInvoice.isInstallmentPlan ? editingInvoice.installmentInterval : undefined,
      });

      // Update status separately if changed
      if (editingInvoice.status) {
        await updateInvoiceStatus(person.id, editingInvoice.id, editingInvoice.status);
      }
      
      toast.success('Rechnung aktualisiert');
      setEditingInvoice(null);
      try {
        await refreshData();
      } catch (refreshError) {
        console.error('Error refreshing data:', refreshError);
      }
    } catch (error: any) {
      console.error('Error updating invoice:', error);
      toast.error('Fehler: ' + (error.message || 'Unbekannter Fehler'));
    }
  };

  const handleStatusChange = async (invoiceId: string, newStatus: string) => {
    try {
      await updateInvoiceStatus(person.id, invoiceId, newStatus);
      toast.success('Status aktualisiert');
      try {
        await refreshData();
      } catch (refreshError) {
        console.error('Error refreshing data:', refreshError);
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error('Fehler: ' + (error.message || 'Unbekannter Fehler'));
    }
  };

  const handleDeleteInvoice = async () => {
    if (!deleteInvoiceId) return;

    try {
      await deleteInvoice(person.id, deleteInvoiceId);
      toast.success('Rechnung gelöscht');
      await refreshData();
      setDeleteInvoiceId(null);
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    }
  };

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const openAmount = invoices
    .filter(inv => inv.status === 'open' || inv.status === 'postponed')
    .reduce((sum, inv) => sum + inv.amount, 0);
  const paidAmount = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const handleScannedData = (data: ScannedInvoiceData) => {
    setNewInvoice(prev => ({
      ...prev,
      amount: data.amount?.toString() || prev.amount,
      description: data.creditorName || data.message || prev.description,
      iban: data.iban || prev.iban,
      reference: data.reference || prev.reference,
      creditorName: data.creditorName || prev.creditorName,
      creditorAddress: data.creditorAddress || prev.creditorAddress,
      imageUrl: data.imageUrl || prev.imageUrl,
    }));
    setShowAddDialog(true);
    toast.success('Daten übernommen');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} kopiert`);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen && onDataChanged) {
      onDataChanged();
    }
    onOpenChange(isOpen);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-0.5">Bezahlt</Badge>;
      case 'postponed':
        return <Badge className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-2 py-0.5">Verschoben</Badge>;
      default:
        return <Badge className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-0.5">Offen</Badge>;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-[700px] w-[95vw] max-h-[90vh] p-0 gap-0 overflow-hidden" showCloseButton={false}>
          {/* Header with custom close button */}
          <div className="bg-slate-50 dark:bg-slate-900 px-6 py-5 border-b">
            {/* Top row: Name and Close button */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold shrink-0">
                  {person?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold">{person?.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {invoices.length} Rechnungen · {appointments.length} Termine
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleClose(false)}
                className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Bottom row: Action buttons */}
            <div className="flex gap-2">
              {activeTab === 'invoices' ? (
                <>
                  <Button variant="outline" onClick={() => setShowScanner(true)} size="sm">
                    <Camera className="w-4 h-4 mr-2" />
                    Scannen
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setNewInvoice({
                        ...newInvoice,
                        isInstallmentPlan: true,
                        installmentCount: 3,
                        installmentDuration: 3,
                        installmentInterval: 'monthly',
                      });
                      setShowAddDialog(true);
                    }} 
                    size="sm"
                    className="border-primary/20 text-primary hover:bg-primary/5"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Raten
                  </Button>
                  <Button onClick={() => setShowAddDialog(true)} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Rechnung
                  </Button>
                </>
              ) : (
                <Button onClick={() => setShowAddAppointmentDialog(true)} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Termin
                </Button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 overflow-y-auto flex-1">
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="invoices" className="gap-2">
                  <FileText className="w-4 h-4" />
                  Rechnungen ({invoices.length})
                </TabsTrigger>
                <TabsTrigger value="appointments" className="gap-2">
                  <CalendarDays className="w-4 h-4" />
                  Termine ({appointments.length})
                </TabsTrigger>
                <TabsTrigger value="documents" className="gap-2">
                  <FolderOpen className="w-4 h-4" />
                  Dokumente
                </TabsTrigger>
              </TabsList>

              {/* Invoices Tab */}
              <TabsContent value="invoices" className="mt-0">
                {/* Statistics */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-1">Gesamt</p>
                    <p className="text-lg font-bold truncate">{formatAmount(totalAmount)}</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl p-4">
                    <p className="text-xs text-red-600 dark:text-red-400 mb-1">Offen</p>
                    <p className="text-lg font-bold text-red-600 truncate">{formatAmount(openAmount)}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-900 rounded-xl p-4">
                    <p className="text-xs text-green-600 dark:text-green-400 mb-1">Bezahlt</p>
                    <p className="text-lg font-bold text-green-600 truncate">{formatAmount(paidAmount)}</p>
                  </div>
                </div>
            
                {isLoading ? (
              <div className="text-center py-10 text-muted-foreground">Laden...</div>
            ) : invoices.length > 0 ? (
              <div className="space-y-3">
                {invoices.map((invoice: any) => (
                  <div 
                    key={invoice.id}
                    ref={(el) => {
                      if (invoice.id) {
                        invoiceRefs.current[invoice.id] = el;
                      }
                    }}
                    className={`rounded-xl p-4 border transition-all duration-300 ${
                      highlightedInvoiceId === invoice.id ? 'ring-2 ring-primary ring-offset-2 bg-primary/5' : ''
                    } ${
                      invoice.status === 'paid' 
                        ? 'bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-800' 
                        : invoice.status === 'postponed'
                        ? 'bg-orange-50/50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800'
                        : 'bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                    }`}
                  >
                    {/* Top row - Description and Badge */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <h4 className="font-semibold truncate">{invoice.description}</h4>
                        {getStatusBadge(invoice.status)}
                      </div>
                    </div>
                    
                    {/* Middle row - Date and Amount */}
                    <div className="flex items-center gap-4 mb-3">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(invoice.date)}
                      </span>
                      <span className="text-lg font-bold">{formatAmount(invoice.amount)}</span>
                    </div>
                    
                    {/* Installment Plan Overview */}
                    {invoice.isInstallmentPlan && invoice.installments && (
                      <div className="mb-3 p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            Ratenvereinbarung
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {invoice.installments.filter((inst: any) => inst.status === 'paid').length} / {invoice.installments.length} bezahlt
                          </span>
                        </div>
                        <div className="w-full bg-background rounded-full h-2 mb-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ 
                              width: `${(invoice.totalPaid || 0) / invoice.amount * 100}%` 
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            Bezahlt: {formatAmount((invoice.totalPaid || 0) * 100)}
                          </span>
                          <span className="text-muted-foreground">
                            {invoice.installmentEndDate ? `Fertig: ${formatDate(invoice.installmentEndDate)}` : ''}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-2 h-9 text-sm font-medium"
                          onClick={() => {
                            console.log('Opening installment dialog for invoice:', invoice);
                            setSelectedInvoiceForPayment(invoice);
                            setShowInstallmentPaymentDialog(true);
                          }}
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Ratenverwaltung öffnen
                        </Button>
                      </div>
                    )}
                    
                    {/* Convert to Installment Button (for non-installment invoices) */}
                    {!invoice.isInstallmentPlan && invoice.status !== 'paid' && (
                      <div className="mb-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-9 text-sm font-medium border-primary/20 text-primary hover:bg-primary/5"
                          onClick={() => {
                            setInvoiceToConvert(invoice);
                            setShowConvertToInstallmentDialog(true);
                          }}
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          In Raten umwandeln
                        </Button>
                      </div>
                    )}
                    
                    {/* Bottom row - Actions */}
                    <div className="flex items-center gap-2">
                      <Select
                        value={invoice.status}
                        onValueChange={(value) => handleStatusChange(invoice.id, value)}
                      >
                        <SelectTrigger className="w-[130px] h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-red-500" />
                              Offen
                            </span>
                          </SelectItem>
                          <SelectItem value="paid">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-green-500" />
                              Bezahlt
                            </span>
                          </SelectItem>
                          <SelectItem value="postponed">
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-orange-500" />
                              Verschoben
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <div className="flex-1" />
                      
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-9 w-9"
                        onClick={() => setEditingInvoice({
                          ...invoice,
                          amount: (invoice.amount / 100).toFixed(2),
                          date: new Date(invoice.date).toISOString().split('T')[0],
                          dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
                          reminderDate: invoice.reminderDate ? new Date(invoice.reminderDate).toISOString().split('T')[0] : '',
                          reminderEnabled: invoice.reminderEnabled || false,
                          isRecurring: invoice.isRecurring || false,
                          recurringInterval: invoice.recurringInterval || 'monthly',
                          notes: invoice.notes || '',
                        })}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        onClick={() => setDeleteInvoiceId(invoice.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
                  <div className="border border-dashed rounded-xl py-12 text-center">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground mb-4">Noch keine Rechnungen</p>
                    <div className="flex gap-2 justify-center">
                      <Button variant="outline" onClick={() => setShowScanner(true)} className="h-9">
                        <Camera className="w-4 h-4 mr-2" />
                        Scannen
                      </Button>
                      <Button onClick={() => setShowAddDialog(true)} className="h-9">
                        <Plus className="w-4 h-4 mr-2" />
                        Neu
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Appointments Tab */}
              <TabsContent value="appointments" className="mt-0">
                {appointmentsLoading ? (
                  <div className="text-center py-10 text-muted-foreground">Laden...</div>
                ) : appointments.length > 0 ? (
                  <div className="space-y-3">
                    {appointments.map((appointment: any) => (
                      <div 
                        key={appointment.id}
                        className="rounded-xl p-4 border bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
                      >
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <h4 className="font-semibold truncate">{appointment.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {appointment.type === 'termin' ? 'Termin' : 
                               appointment.type === 'aufgabe' ? 'Aufgabe' : 
                               appointment.type === 'geburtstag' ? 'Geburtstag' : 'Andere'}
                            </Badge>
                            {appointment.recurrenceRule && (
                              <Badge variant="secondary" className="text-xs">
                                <Repeat className="w-3 h-3 mr-1" />
                                {appointment.recurrenceRule === 'daily' ? 'Täglich' :
                                 appointment.recurrenceRule === 'weekly' ? 'Wöchentlich' :
                                 appointment.recurrenceRule === 'monthly' ? 'Monatlich' : 'Jährlich'}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 mb-3">
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(appointment.dueDate)}
                          </span>
                          {appointment.notes && (
                            <span className="text-sm text-muted-foreground truncate">{appointment.notes}</span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="flex-1" />
                          
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-9 w-9"
                            onClick={() => setEditingAppointment({
                              ...appointment,
                              dueDate: new Date(appointment.dueDate).toISOString().split('T')[0],
                            })}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            onClick={() => setDeleteAppointmentId(appointment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed rounded-xl py-12 text-center">
                    <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground mb-4">Noch keine Termine</p>
                    <Button onClick={() => setShowAddAppointmentDialog(true)} className="h-9">
                      <Plus className="w-4 h-4 mr-2" />
                      Termin hinzufügen
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="mt-0">
                <PersonDocumentsTab
                  personId={person?.id}
                  personName={person?.name}
                  onInvoiceCreated={() => {
                    refetchInvoices();
                    onDataChanged?.();
                  }}
                  onReminderCreated={() => {
                    refetchAppointments();
                    onDataChanged?.();
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Invoice Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl">Neue Rechnung</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {newInvoice.imageUrl && (
              <div className="relative">
                <img src={newInvoice.imageUrl} alt="" className="w-full h-32 object-cover rounded-lg border" />
                <Button 
                  variant="secondary" 
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={() => setNewInvoice({ ...newInvoice, imageUrl: '' })}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            <div>
              <Label>Beschreibung *</Label>
              <Input
                value={newInvoice.description}
                onChange={(e) => setNewInvoice({ ...newInvoice, description: e.target.value })}
                placeholder="z.B. Miete, Strom..."
                className="mt-2 h-10"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Betrag (CHF) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newInvoice.amount}
                  onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                  placeholder="0.00"
                  className="mt-2 h-10"
                />
              </div>
              <div>
                <Label>Datum</Label>
                <Input
                  type="date"
                  value={newInvoice.date}
                  onChange={(e) => setNewInvoice({ ...newInvoice, date: e.target.value })}
                  className="mt-2 h-10"
                />
              </div>
            </div>

            {/* Richtung für externe Personen */}
            {person?.type === 'external' && (
              <div>
                <Label>Richtung</Label>
                <Select
                  value={newInvoice.direction}
                  onValueChange={(value: 'incoming' | 'outgoing') => setNewInvoice({ ...newInvoice, direction: value })}
                >
                  <SelectTrigger className="mt-2 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incoming">
                      <span className="flex items-center gap-2">
                        <ArrowDownLeft className="w-4 h-4 text-green-600" />
                        Person schuldet mir
                      </span>
                    </SelectItem>
                    <SelectItem value="outgoing">
                      <span className="flex items-center gap-2">
                        <ArrowUpRight className="w-4 h-4 text-red-600" />
                        Ich schulde Person
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Status</Label>
              <Select
                value={newInvoice.status}
                onValueChange={(value) => setNewInvoice({ ...newInvoice, status: value })}
              >
                <SelectTrigger className="mt-2 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      Offen
                    </span>
                  </SelectItem>
                  <SelectItem value="paid">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      Bezahlt
                    </span>
                  </SelectItem>
                  <SelectItem value="postponed">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500" />
                      Verschoben
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fälligkeitsdatum */}
            <div>
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Fälligkeitsdatum
              </Label>
              <Input
                type="date"
                value={newInvoice.dueDate}
                onChange={(e) => setNewInvoice({ ...newInvoice, dueDate: e.target.value })}
                className="mt-2 h-10"
              />
            </div>

            {/* Erinnerung */}
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="reminderEnabled"
                  checked={newInvoice.reminderEnabled}
                  onCheckedChange={(checked) => setNewInvoice({ 
                    ...newInvoice, 
                    reminderEnabled: checked as boolean,
                    reminderDate: checked ? newInvoice.dueDate : ''
                  })}
                />
                <Label htmlFor="reminderEnabled" className="flex items-center gap-2 cursor-pointer">
                  <Bell className="w-4 h-4" />
                  Erinnerung aktivieren
                </Label>
              </div>
              
              {newInvoice.reminderEnabled && (
                <div>
                  <Label>Erinnerungsdatum</Label>
                  <Input
                    type="date"
                    value={newInvoice.reminderDate}
                    onChange={(e) => setNewInvoice({ ...newInvoice, reminderDate: e.target.value })}
                    className="mt-2 h-10"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Die Erinnerung erscheint im Kalender
                  </p>
                </div>
              )}
            </div>

            {/* Wiederkehrende Rechnung */}
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="isRecurring"
                  checked={newInvoice.isRecurring}
                  onCheckedChange={(checked) => setNewInvoice({ 
                    ...newInvoice, 
                    isRecurring: checked as boolean
                  })}
                />
                <Label htmlFor="isRecurring" className="flex items-center gap-2 cursor-pointer">
                  <Repeat className="w-4 h-4" />
                  Wiederkehrende Rechnung
                </Label>
              </div>
              
              {newInvoice.isRecurring && (
                <div>
                  <Label>Wiederholungsintervall</Label>
                  <Select
                    value={newInvoice.recurringInterval}
                    onValueChange={(value: any) => setNewInvoice({ ...newInvoice, recurringInterval: value })}
                  >
                    <SelectTrigger className="mt-2 h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Wöchentlich</SelectItem>
                      <SelectItem value="monthly">Monatlich</SelectItem>
                      <SelectItem value="quarterly">Vierteljährlich</SelectItem>
                      <SelectItem value="yearly">Jährlich</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Die Rechnung wird automatisch zum Fälligkeitsdatum neu erstellt
                  </p>
                </div>
              )}
            </div>

            {/* Ratenvereinbarung */}
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="isInstallmentPlan"
                  checked={newInvoice.isInstallmentPlan}
                  onCheckedChange={(checked) => setNewInvoice({ 
                    ...newInvoice, 
                    isInstallmentPlan: checked as boolean,
                    isRecurring: checked ? false : newInvoice.isRecurring // Can't be both
                  })}
                />
                <Label htmlFor="isInstallmentPlan" className="flex items-center gap-2 cursor-pointer">
                  <CalendarDays className="w-4 h-4" />
                  Ratenvereinbarung
                </Label>
              </div>
              
              {newInvoice.isInstallmentPlan && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Dauer *</Label>
                      <Input
                        type="number"
                        min="1"
                        max="120"
                        value={newInvoice.installmentDuration || ''}
                        onChange={(e) => {
                          const duration = parseInt(e.target.value) || 0;
                          setNewInvoice({ 
                            ...newInvoice, 
                            installmentDuration: duration,
                            // Calculate count based on duration and interval
                            installmentCount: duration > 0 ? (newInvoice.installmentInterval === 'quarterly' ? duration * 3 : duration) : 2
                          });
                        }}
                        placeholder="z.B. 12"
                        className="mt-2 h-10"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {newInvoice.installmentInterval === 'weekly' && 'Wochen'}
                        {newInvoice.installmentInterval === 'monthly' && 'Monate'}
                        {newInvoice.installmentInterval === 'quarterly' && 'Quartale'}
                        {newInvoice.installmentInterval === 'yearly' && 'Jahre'}
                      </p>
                    </div>
                    <div>
                      <Label>Ratenintervall</Label>
                      <Select
                        value={newInvoice.installmentInterval}
                        onValueChange={(value: any) => {
                          const duration = newInvoice.installmentDuration || 0;
                          setNewInvoice({ 
                            ...newInvoice, 
                            installmentInterval: value,
                            // Recalculate count when interval changes
                            installmentCount: duration > 0 ? (value === 'quarterly' ? duration * 3 : duration) : 2
                          });
                        }}
                      >
                        <SelectTrigger className="mt-2 h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Wöchentlich</SelectItem>
                          <SelectItem value="monthly">Monatlich</SelectItem>
                          <SelectItem value="quarterly">Vierteljährlich</SelectItem>
                          <SelectItem value="yearly">Jährlich</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {newInvoice.amount && newInvoice.installmentDuration && newInvoice.installmentDuration > 0 && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium">Ratenübersicht</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Anzahl Raten: {newInvoice.installmentCount}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Ratenbetrag: {((parseFloat(newInvoice.amount) || 0) / newInvoice.installmentCount).toFixed(2)} CHF
                      </p>
                      {newInvoice.dueDate && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Letzte Rate fällig: {(() => {
                            const startDate = new Date(newInvoice.dueDate);
                            const interval = newInvoice.installmentInterval;
                            const lastDate = new Date(startDate);
                            switch (interval) {
                              case 'weekly': lastDate.setDate(lastDate.getDate() + ((newInvoice.installmentCount - 1) * 7)); break;
                              case 'monthly': lastDate.setMonth(lastDate.getMonth() + (newInvoice.installmentCount - 1)); break;
                              case 'quarterly': lastDate.setMonth(lastDate.getMonth() + ((newInvoice.installmentCount - 1) * 3)); break;
                              case 'yearly': lastDate.setFullYear(lastDate.getFullYear() + (newInvoice.installmentCount - 1)); break;
                            }
                            return lastDate.toLocaleDateString('de-CH');
                          })()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notizen */}
            <div>
              <Label>Notizen</Label>
              <Textarea
                value={newInvoice.notes}
                onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                placeholder="Optionale Notizen..."
                className="mt-2"
                rows={2}
              />
            </div>

            {(newInvoice.iban || newInvoice.creditorName) && (
              <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
                <p className="font-medium flex items-center gap-2">
                  <QrCode className="w-4 h-4" /> Zahlungsdetails
                </p>
                {newInvoice.creditorName && <p className="text-muted-foreground">{newInvoice.creditorName}</p>}
                {newInvoice.iban && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-mono text-xs">{newInvoice.iban}</span>
                    <Button variant="ghost" size="sm" className="h-8" onClick={() => copyToClipboard(newInvoice.iban, 'IBAN')}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            <Button variant="outline" className="w-full h-10" onClick={() => { setShowAddDialog(false); setShowScanner(true); }}>
              <Camera className="w-4 h-4 mr-2" />
              Rechnung scannen
            </Button>
          </div>
          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="h-10">
              Abbrechen
            </Button>
            <Button onClick={handleAddInvoice} className="h-10">
              Hinzufügen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <InvoiceScanner open={showScanner} onOpenChange={setShowScanner} onInvoiceScanned={handleScannedData} />

      {editingInvoice && (
        <Dialog open={!!editingInvoice} onOpenChange={() => setEditingInvoice(null)}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-xl">Rechnung bearbeiten</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Beschreibung *</Label>
                <Input
                  value={editingInvoice.description}
                  onChange={(e) => setEditingInvoice({ ...editingInvoice, description: e.target.value })}
                  className="mt-2 h-10"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Betrag (CHF) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingInvoice.amount}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, amount: e.target.value })}
                    className="mt-2 h-10"
                  />
                </div>
                <div>
                  <Label>Datum</Label>
                  <Input
                    type="date"
                    value={editingInvoice.date}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, date: e.target.value })}
                    className="mt-2 h-10"
                  />
                </div>
              </div>

              {/* Richtung für externe Personen */}
              {person?.type === 'external' && (
                <div>
                  <Label>Richtung</Label>
                  <Select
                    value={editingInvoice.direction || 'incoming'}
                    onValueChange={(value) => setEditingInvoice({ ...editingInvoice, direction: value })}
                  >
                    <SelectTrigger className="mt-2 h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="incoming">
                        <span className="flex items-center gap-2">
                          <ArrowDownLeft className="w-4 h-4 text-green-600" />
                          Person schuldet mir
                        </span>
                      </SelectItem>
                      <SelectItem value="outgoing">
                        <span className="flex items-center gap-2">
                          <ArrowUpRight className="w-4 h-4 text-red-600" />
                          Ich schulde Person
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Status */}
              <div>
                <Label>Status</Label>
                <Select
                  value={editingInvoice.status || 'open'}
                  onValueChange={(value) => setEditingInvoice({ ...editingInvoice, status: value })}
                >
                  <SelectTrigger className="mt-2 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        Offen
                      </span>
                    </SelectItem>
                    <SelectItem value="paid">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        Bezahlt
                      </span>
                    </SelectItem>
                    <SelectItem value="postponed">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                        Verschoben
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Fälligkeitsdatum */}
              <div>
                <Label className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Fälligkeitsdatum
                </Label>
                <Input
                  type="date"
                  value={editingInvoice.dueDate || ''}
                  onChange={(e) => setEditingInvoice({ ...editingInvoice, dueDate: e.target.value })}
                  className="mt-2 h-10"
                />
              </div>

              {/* Erinnerung */}
              <div className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="editReminderEnabled"
                    checked={editingInvoice.reminderEnabled || false}
                    onCheckedChange={(checked) => setEditingInvoice({ 
                      ...editingInvoice, 
                      reminderEnabled: checked as boolean,
                      reminderDate: checked ? editingInvoice.dueDate : ''
                    })}
                  />
                  <Label htmlFor="editReminderEnabled" className="flex items-center gap-2 cursor-pointer">
                    <Bell className="w-4 h-4" />
                    Erinnerung aktivieren
                  </Label>
                </div>
                
                {editingInvoice.reminderEnabled && (
                  <div>
                    <Label>Erinnerungsdatum</Label>
                    <Input
                      type="date"
                      value={editingInvoice.reminderDate || ''}
                      onChange={(e) => setEditingInvoice({ ...editingInvoice, reminderDate: e.target.value })}
                      className="mt-2 h-10"
                    />
                  </div>
                )}
              </div>

              {/* Wiederkehrende Rechnung */}
              <div className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="editIsRecurring"
                    checked={editingInvoice.isRecurring || false}
                    onCheckedChange={(checked) => setEditingInvoice({ 
                      ...editingInvoice, 
                      isRecurring: checked as boolean
                    })}
                  />
                  <Label htmlFor="editIsRecurring" className="flex items-center gap-2 cursor-pointer">
                    <Repeat className="w-4 h-4" />
                    Wiederkehrende Rechnung
                  </Label>
                </div>
                
                {editingInvoice.isRecurring && (
                  <div>
                    <Label>Wiederholungsintervall</Label>
                    <Select
                      value={editingInvoice.recurringInterval || 'monthly'}
                      onValueChange={(value) => setEditingInvoice({ ...editingInvoice, recurringInterval: value })}
                    >
                      <SelectTrigger className="mt-2 h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Wöchentlich</SelectItem>
                        <SelectItem value="monthly">Monatlich</SelectItem>
                        <SelectItem value="quarterly">Vierteljährlich</SelectItem>
                        <SelectItem value="yearly">Jährlich</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Notizen */}
              <div>
                <Label>Notizen</Label>
                <Textarea
                  value={editingInvoice.notes || ''}
                  onChange={(e) => setEditingInvoice({ ...editingInvoice, notes: e.target.value })}
                  placeholder="Optionale Notizen..."
                  className="mt-2"
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter className="mt-4 gap-2">
              <Button variant="outline" onClick={() => setEditingInvoice(null)} className="h-10">
                Abbrechen
              </Button>
              <Button onClick={handleUpdateInvoice} className="h-10">
                Speichern
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={!!deleteInvoiceId} onOpenChange={(open) => !open && setDeleteInvoiceId(null)}>
        <AlertDialogContent className="max-w-[400px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Rechnung löschen?</AlertDialogTitle>
            <AlertDialogDescription className="mt-2">
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel className="h-10">Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteInvoice} className="h-10 bg-red-600 hover:bg-red-700">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Appointment Dialog */}
      <Dialog open={showAddAppointmentDialog} onOpenChange={setShowAddAppointmentDialog}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl">Neuer Termin für {person?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Titel *</Label>
              <Input
                value={newAppointment.title}
                onChange={(e) => setNewAppointment({ ...newAppointment, title: e.target.value })}
                placeholder="z.B. Arzttermin, Treffen..."
                className="mt-2 h-10"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Typ</Label>
                <Select
                  value={newAppointment.type}
                  onValueChange={(value: any) => setNewAppointment({ ...newAppointment, type: value })}
                >
                  <SelectTrigger className="mt-2 h-10">
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
                <Label>Datum *</Label>
                <Input
                  type="date"
                  value={newAppointment.dueDate}
                  onChange={(e) => setNewAppointment({ ...newAppointment, dueDate: e.target.value })}
                  className="mt-2 h-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                id="isAllDay"
                checked={newAppointment.isAllDay}
                onCheckedChange={(checked) => setNewAppointment({ ...newAppointment, isAllDay: checked as boolean })}
              />
              <Label htmlFor="isAllDay" className="cursor-pointer">Ganztägig</Label>
            </div>

            <div>
              <Label>Wiederholung</Label>
              <Select
                value={newAppointment.recurrenceRule}
                onValueChange={(value: any) => setNewAppointment({ ...newAppointment, recurrenceRule: value })}
              >
                <SelectTrigger className="mt-2 h-10">
                  <SelectValue placeholder="Keine Wiederholung" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keine</SelectItem>
                  <SelectItem value="daily">Täglich</SelectItem>
                  <SelectItem value="weekly">Wöchentlich</SelectItem>
                  <SelectItem value="monthly">Monatlich</SelectItem>
                  <SelectItem value="yearly">Jährlich</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Notizen</Label>
              <Textarea
                value={newAppointment.notes}
                onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
                placeholder="Optionale Notizen..."
                className="mt-2"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => setShowAddAppointmentDialog(false)} className="h-10">
              Abbrechen
            </Button>
            <Button onClick={handleAddAppointment} className="h-10">
              Hinzufügen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Appointment Dialog */}
      {editingAppointment && (
        <Dialog open={!!editingAppointment} onOpenChange={() => setEditingAppointment(null)}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-xl">Termin bearbeiten</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Titel *</Label>
                <Input
                  value={editingAppointment.title}
                  onChange={(e) => setEditingAppointment({ ...editingAppointment, title: e.target.value })}
                  className="mt-2 h-10"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Typ</Label>
                  <Select
                    value={editingAppointment.type}
                    onValueChange={(value) => setEditingAppointment({ ...editingAppointment, type: value })}
                  >
                    <SelectTrigger className="mt-2 h-10">
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
                  <Label>Datum *</Label>
                  <Input
                    type="date"
                    value={editingAppointment.dueDate}
                    onChange={(e) => setEditingAppointment({ ...editingAppointment, dueDate: e.target.value })}
                    className="mt-2 h-10"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Checkbox
                  id="editIsAllDay"
                  checked={editingAppointment.isAllDay}
                  onCheckedChange={(checked) => setEditingAppointment({ ...editingAppointment, isAllDay: checked as boolean })}
                />
                <Label htmlFor="editIsAllDay" className="cursor-pointer">Ganztägig</Label>
              </div>

              <div>
                <Label>Wiederholung</Label>
                <Select
                  value={editingAppointment.recurrenceRule || 'none'}
                  onValueChange={(value) => setEditingAppointment({ ...editingAppointment, recurrenceRule: value })}
                >
                  <SelectTrigger className="mt-2 h-10">
                    <SelectValue placeholder="Keine Wiederholung" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Keine</SelectItem>
                    <SelectItem value="daily">Täglich</SelectItem>
                    <SelectItem value="weekly">Wöchentlich</SelectItem>
                    <SelectItem value="monthly">Monatlich</SelectItem>
                    <SelectItem value="yearly">Jährlich</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Notizen</Label>
                <Textarea
                  value={editingAppointment.notes || ''}
                  onChange={(e) => setEditingAppointment({ ...editingAppointment, notes: e.target.value })}
                  placeholder="Optionale Notizen..."
                  className="mt-2"
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter className="mt-4 gap-2">
              <Button variant="outline" onClick={() => setEditingAppointment(null)} className="h-10">
                Abbrechen
              </Button>
              <Button onClick={handleUpdateAppointment} className="h-10">
                Speichern
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Appointment AlertDialog */}
      <AlertDialog open={!!deleteAppointmentId} onOpenChange={(open) => !open && setDeleteAppointmentId(null)}>
        <AlertDialogContent className="max-w-[400px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Termin löschen?</AlertDialogTitle>
            <AlertDialogDescription className="mt-2">
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel className="h-10">Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAppointment} className="h-10 bg-red-600 hover:bg-red-700">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Complete Installment Management Dialog - Separate Modal within PersonInvoicesDialog */}
      <Dialog open={showInstallmentPaymentDialog} onOpenChange={setShowInstallmentPaymentDialog}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-2xl flex items-center gap-2">
              <CreditCard className="w-6 h-6" />
              Ratenverwaltung
            </DialogTitle>
            {selectedInvoiceForPayment && (
              <p className="text-sm text-muted-foreground mt-1">
                Rechnung: {selectedInvoiceForPayment.description}
              </p>
            )}
          </DialogHeader>
          {!selectedInvoiceForPayment ? (
            <div className="py-8 text-center text-muted-foreground">
              <p>Keine Rechnung ausgewählt</p>
            </div>
          ) : !selectedInvoiceForPayment.installments || !Array.isArray(selectedInvoiceForPayment.installments) || selectedInvoiceForPayment.installments.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium mb-2">Keine Raten gefunden</p>
              <p className="text-sm">Diese Rechnung hat noch keine Ratenvereinbarung oder die Raten wurden noch nicht erstellt.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Invoice Overview */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-base font-semibold">{selectedInvoiceForPayment.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedInvoiceForPayment.installmentCount} Raten à {selectedInvoiceForPayment.installmentInterval === 'weekly' ? 'Woche' : selectedInvoiceForPayment.installmentInterval === 'monthly' ? 'Monat' : selectedInvoiceForPayment.installmentInterval === 'quarterly' ? 'Quartal' : 'Jahr'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Gesamtbetrag</p>
                    <p className="text-lg font-bold">{formatAmount(selectedInvoiceForPayment.amount)}</p>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-background rounded-full h-3 mb-3">
                  <div 
                    className="bg-green-500 h-3 rounded-full transition-all"
                    style={{ 
                      width: `${Math.min(100, selectedInvoiceForPayment.amount > 0 ? ((selectedInvoiceForPayment.totalPaid || 0) / selectedInvoiceForPayment.amount) * 100 : 0)}%` 
                    }}
                  />
                </div>
                
                {/* Statistics */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Bezahlt</p>
                    <p className="text-sm font-semibold text-green-600">
                      {formatAmount((selectedInvoiceForPayment.totalPaid || 0) * 100)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Noch offen</p>
                    <p className="text-sm font-semibold text-red-600">
                      {formatAmount((selectedInvoiceForPayment.amount - (selectedInvoiceForPayment.totalPaid || 0) * 100))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Fertig am</p>
                    <p className="text-sm font-semibold">
                      {selectedInvoiceForPayment.installmentEndDate ? formatDate(selectedInvoiceForPayment.installmentEndDate) : 'Nicht gesetzt'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Installments List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base font-semibold">Alle Raten</Label>
                  <Badge variant="outline">
                    {selectedInvoiceForPayment.installments.filter((inst: any) => inst.status === 'paid').length} / {selectedInvoiceForPayment.installments.length} bezahlt
                  </Badge>
                </div>
                
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {selectedInvoiceForPayment.installments.map((inst: any, idx: number) => {
                    const remaining = inst.amount - (inst.paidAmount || 0);
                    let dueDateObj: Date | null = null;
                    if (inst.dueDate) {
                      try {
                        dueDateObj = inst.dueDate?.toDate ? inst.dueDate.toDate() : (typeof inst.dueDate === 'string' ? new Date(inst.dueDate) : new Date(inst.dueDate));
                      } catch (e) {
                        console.error('Error parsing dueDate:', e);
                      }
                    }
                    const isOverdue = dueDateObj && dueDateObj < new Date() && inst.status !== 'paid';
                    
                    return (
                      <div 
                        key={inst.number}
                        className={`p-4 border rounded-lg ${
                          inst.status === 'paid' 
                            ? 'bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-800' 
                            : inst.status === 'partial'
                            ? 'bg-orange-50/50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800'
                            : isOverdue
                            ? 'bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                            : 'bg-slate-50/50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                inst.status === 'paid' 
                                  ? 'bg-green-500 text-white' 
                                  : inst.status === 'partial'
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                              }`}>
                                {inst.number}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-semibold">Rate {inst.number}</span>
                                  <Badge variant={
                                    inst.status === 'paid' ? 'default' : 
                                    inst.status === 'partial' ? 'secondary' : 
                                    isOverdue ? 'destructive' : 'outline'
                                  }>
                                    {inst.status === 'paid' ? 'Bezahlt' : 
                                     inst.status === 'partial' ? 'Teilweise' : 
                                     isOverdue ? 'Überfällig' : 'Offen'}
                                  </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {dueDateObj ? (
                                    <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                                      Fällig: {formatDate(dueDateObj)}
                                    </span>
                                  ) : (
                                    <span>Kein Fälligkeitsdatum</span>
                                  )}
                                  {inst.paidDate && (
                                    <span className="ml-3 text-green-600">
                                      Bezahlt: {formatDate(inst.paidDate?.toDate ? inst.paidDate.toDate() : (typeof inst.paidDate === 'string' ? new Date(inst.paidDate) : new Date(inst.paidDate)))}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {inst.notes && (
                              <div className="mt-2 p-2 bg-muted rounded text-xs">
                                <p className="text-muted-foreground mb-1">Kommentar:</p>
                                <p>{inst.notes}</p>
                              </div>
                            )}
                            
                            <div className="grid grid-cols-3 gap-3 mt-3 text-xs">
                              <div>
                                <p className="text-muted-foreground mb-1">Rate</p>
                                <p className="font-semibold">{formatAmount(inst.amount * 100)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">Bezahlt</p>
                                <p className="font-semibold text-green-600">{formatAmount((inst.paidAmount || 0) * 100)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">Noch offen</p>
                                <p className={`font-semibold ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  {formatAmount(remaining * 100)}
                                </p>
                              </div>
                            </div>
                            
                            {inst.status === 'partial' && (
                              <div className="mt-2 w-full bg-background rounded-full h-1.5">
                                <div 
                                  className="bg-orange-500 h-1.5 rounded-full"
                                  style={{ width: `${(inst.paidAmount / inst.amount) * 100}%` }}
                                />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            {remaining > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs whitespace-nowrap"
                                onClick={() => {
                                  setSelectedInstallment(inst);
                                  setPaymentAmount(remaining.toFixed(2));
                                }}
                              >
                                {inst.status === 'partial' ? 'Weiter zahlen' : 'Bezahlen'}
                              </Button>
                            )}
                            {inst.paidAmount > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs whitespace-nowrap"
                                onClick={() => {
                                  setSelectedInstallment(inst);
                                  setPaymentAmount('');
                                }}
                              >
                                Bearbeiten
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs whitespace-nowrap"
                              onClick={() => {
                                setEditingInstallment(inst);
                                setInstallmentNote(inst.notes || '');
                                setInstallmentNewDate(inst.dueDate ? (inst.dueDate?.toDate ? inst.dueDate.toDate().toISOString().split('T')[0] : (typeof inst.dueDate === 'string' ? new Date(inst.dueDate).toISOString().split('T')[0] : new Date(inst.dueDate).toISOString().split('T')[0])) : '');
                              }}
                            >
                              <Edit2 className="w-3 h-3 mr-1" />
                              Bearbeiten
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payment Form */}
              {selectedInstallment && (
                <div className="p-4 border rounded-lg bg-background">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-base font-semibold">Zahlung erfassen</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedInstallment(null);
                        setPaymentAmount('');
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Rate {selectedInstallment.number}</span>
                        <Badge variant={selectedInstallment.status === 'paid' ? 'default' : selectedInstallment.status === 'partial' ? 'secondary' : 'outline'}>
                          {selectedInstallment.status === 'paid' ? 'Bezahlt' : selectedInstallment.status === 'partial' ? 'Teilweise' : 'Offen'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-muted-foreground mb-1">Rate</p>
                          <p className="font-semibold">{formatAmount(selectedInstallment.amount * 100)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Bereits bezahlt</p>
                          <p className="font-semibold text-green-600">{formatAmount((selectedInstallment.paidAmount || 0) * 100)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Fälligkeitsdatum</p>
                          <p className="font-semibold">
                            {selectedInstallment.dueDate ? formatDate(selectedInstallment.dueDate?.toDate ? selectedInstallment.dueDate.toDate() : (typeof selectedInstallment.dueDate === 'string' ? new Date(selectedInstallment.dueDate) : new Date(selectedInstallment.dueDate))) : 'Nicht gesetzt'}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Noch zu zahlen</p>
                          <p className="font-semibold text-red-600">
                            {formatAmount((selectedInstallment.amount - (selectedInstallment.paidAmount || 0)) * 100)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label>Zahlungsbetrag (CHF) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder="0.00"
                        className="mt-2 h-10"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Maximal: {formatAmount((selectedInstallment.amount - (selectedInstallment.paidAmount || 0)) * 100)}
                      </p>
                    </div>

                    {selectedInstallment.notes && (
                      <div className="p-2 bg-muted rounded text-xs">
                        <p className="text-muted-foreground mb-1">Kommentar:</p>
                        <p>{selectedInstallment.notes}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 h-10"
                        onClick={() => {
                          setSelectedInstallment(null);
                          setPaymentAmount('');
                        }}
                      >
                        Abbrechen
                      </Button>
                      <Button
                        className="flex-1 h-10"
                        onClick={async () => {
                          if (!selectedInvoiceForPayment || !selectedInstallment || !paymentAmount) {
                            toast.error('Bitte alle Felder ausfüllen');
                            return;
                          }
                          const amount = parseFloat(paymentAmount);
                          if (amount <= 0) {
                            toast.error('Betrag muss größer als 0 sein');
                            return;
                          }
                          const remaining = selectedInstallment.amount - (selectedInstallment.paidAmount || 0);
                          if (amount > remaining) {
                            toast.error(`Betrag darf nicht größer als ${formatAmount(remaining * 100)} sein`);
                            return;
                          }
                          try {
                            await recordInstallmentPayment(
                              person.id,
                              selectedInvoiceForPayment.id,
                              selectedInstallment.number,
                              amount,
                              new Date()
                            );
                            toast.success('Zahlung erfolgreich erfasst');
                            setSelectedInstallment(null);
                            setPaymentAmount('');
                            try {
                              await refreshData();
                              // Update selected invoice to show latest data
                              const updatedInvoice = invoices.find((inv: any) => inv.id === selectedInvoiceForPayment.id);
                              if (updatedInvoice) {
                                setSelectedInvoiceForPayment(updatedInvoice);
                              }
                            } catch (refreshError) {
                              console.error('Error refreshing data:', refreshError);
                            }
                          } catch (error: any) {
                            console.error('Error recording payment:', error);
                            toast.error('Fehler: ' + (error.message || 'Unbekannter Fehler'));
                          }
                        }}
                      >
                        Zahlung erfassen
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="mt-6 pt-4 border-t gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowInstallmentPaymentDialog(false);
                setSelectedInvoiceForPayment(null);
                setSelectedInstallment(null);
                setPaymentAmount('');
              }} 
              className="h-10"
            >
              Schliessen
            </Button>
            {selectedInvoiceForPayment && selectedInvoiceForPayment.installments && selectedInvoiceForPayment.installments.length > 0 && (
              <Button 
                variant="default"
                onClick={async () => {
                  try {
                    await refreshData();
                    const updatedInvoice = invoices.find((inv: any) => inv.id === selectedInvoiceForPayment.id);
                    if (updatedInvoice) {
                      setSelectedInvoiceForPayment(updatedInvoice);
                      toast.success('Daten aktualisiert');
                    }
                  } catch (error) {
                    console.error('Error refreshing:', error);
                  }
                }}
                className="h-10"
              >
                Aktualisieren
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert to Installment Dialog */}
      <Dialog open={showConvertToInstallmentDialog} onOpenChange={setShowConvertToInstallmentDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              In Raten umwandeln
            </DialogTitle>
            {invoiceToConvert && (
              <p className="text-sm text-muted-foreground mt-1">
                Rechnung: {invoiceToConvert.description} - {formatAmount(invoiceToConvert.amount)}
              </p>
            )}
          </DialogHeader>
          
          {invoiceToConvert && (
            <div className="space-y-4 py-4">
              <div>
                <Label>Dauer *</Label>
                <Input
                  type="number"
                  min="1"
                  max="120"
                  value={convertInstallmentDuration}
                  onChange={(e) => setConvertInstallmentDuration(e.target.value)}
                  placeholder="z.B. 12"
                  className="mt-2 h-10"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {convertInstallmentInterval === 'weekly' && 'Wochen'}
                  {convertInstallmentInterval === 'monthly' && 'Monate'}
                  {convertInstallmentInterval === 'quarterly' && 'Quartale'}
                  {convertInstallmentInterval === 'yearly' && 'Jahre'}
                </p>
              </div>
              
              <div>
                <Label>Ratenintervall *</Label>
                <Select
                  value={convertInstallmentInterval}
                  onValueChange={(value: any) => setConvertInstallmentInterval(value)}
                >
                  <SelectTrigger className="mt-2 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Wöchentlich</SelectItem>
                    <SelectItem value="monthly">Monatlich</SelectItem>
                    <SelectItem value="quarterly">Vierteljährlich</SelectItem>
                    <SelectItem value="yearly">Jährlich</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {convertInstallmentDuration && parseInt(convertInstallmentDuration) >= 1 && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Ratenübersicht</p>
                  <p className="text-xs text-muted-foreground">
                    Anzahl Raten: {(() => {
                      const duration = parseInt(convertInstallmentDuration);
                      return convertInstallmentInterval === 'quarterly' ? duration * 3 : duration;
                    })()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ratenbetrag: {(() => {
                      const duration = parseInt(convertInstallmentDuration);
                      const count = convertInstallmentInterval === 'quarterly' ? duration * 3 : duration;
                      return ((invoiceToConvert.amount / 100) / count).toFixed(2);
                    })()} CHF
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(() => {
                      const startDate = invoiceToConvert.dueDate ? new Date(invoiceToConvert.dueDate) : new Date();
                      const lastDate = new Date(startDate);
                      const duration = parseInt(convertInstallmentDuration);
                      const count = convertInstallmentInterval === 'quarterly' ? duration * 3 : duration;
                      switch (convertInstallmentInterval) {
                        case 'weekly': lastDate.setDate(lastDate.getDate() + ((count - 1) * 7)); break;
                        case 'monthly': lastDate.setMonth(lastDate.getMonth() + (count - 1)); break;
                        case 'quarterly': lastDate.setMonth(lastDate.getMonth() + ((count - 1) * 3)); break;
                        case 'yearly': lastDate.setFullYear(lastDate.getFullYear() + (count - 1)); break;
                      }
                      return `Letzte Rate fällig: ${lastDate.toLocaleDateString('de-CH')}`;
                    })()}
                  </p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="mt-4 gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowConvertToInstallmentDialog(false);
                setInvoiceToConvert(null);
                setConvertInstallmentDuration('3');
                setConvertInstallmentInterval('monthly');
              }} 
              className="h-10"
            >
              Abbrechen
            </Button>
            <Button onClick={handleConvertToInstallment} className="h-10">
              Umwandeln
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Installment Dialog */}
      <Dialog open={!!editingInstallment} onOpenChange={(open) => !open && setEditingInstallment(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Edit2 className="w-5 h-5" />
              Rate bearbeiten
            </DialogTitle>
            {editingInstallment && (
              <p className="text-sm text-muted-foreground mt-1">
                Rate {editingInstallment.number} - {formatAmount(editingInstallment.amount * 100)}
              </p>
            )}
          </DialogHeader>
          
          {editingInstallment && (
            <div className="space-y-4 py-4">
              <div>
                <Label>Fälligkeitsdatum</Label>
                <Input
                  type="date"
                  value={installmentNewDate}
                  onChange={(e) => setInstallmentNewDate(e.target.value)}
                  className="mt-2 h-10"
                />
              </div>
              
              <div>
                <Label>Kommentar</Label>
                <Textarea
                  value={installmentNote}
                  onChange={(e) => setInstallmentNote(e.target.value)}
                  placeholder="Optionaler Kommentar zu dieser Rate..."
                  rows={3}
                  className="mt-2"
                />
              </div>
            </div>
          )}
          
          <DialogFooter className="mt-4 gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setEditingInstallment(null);
                setInstallmentNote('');
                setInstallmentNewDate('');
              }} 
              className="h-10"
            >
              Abbrechen
            </Button>
            <Button
              onClick={async () => {
                if (!editingInstallment || !selectedInvoiceForPayment) return;
                
                try {
                  const updatedInstallments = selectedInvoiceForPayment.installments.map((inst: any) => {
                    if (inst.number === editingInstallment.number) {
                      return {
                        ...inst,
                        dueDate: installmentNewDate ? new Date(installmentNewDate) : inst.dueDate,
                        notes: installmentNote,
                      };
                    }
                    return inst;
                  });
                  
                  await updateInstallmentPlan(person.id, selectedInvoiceForPayment.id, updatedInstallments);
                  toast.success('Rate erfolgreich aktualisiert');
                  setEditingInstallment(null);
                  setInstallmentNote('');
                  setInstallmentNewDate('');
                  try {
                    await refreshData();
                    const updatedInvoice = invoices.find((inv: any) => inv.id === selectedInvoiceForPayment.id);
                    if (updatedInvoice) {
                      setSelectedInvoiceForPayment(updatedInvoice);
                    }
                  } catch (refreshError) {
                    console.error('Error refreshing data:', refreshError);
                  }
                } catch (error: any) {
                  console.error('Error updating installment:', error);
                  toast.error('Fehler: ' + (error.message || 'Unbekannter Fehler'));
                }
              }}
              className="h-10"
            >
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
