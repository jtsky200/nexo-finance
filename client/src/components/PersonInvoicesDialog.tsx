import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Trash2, Edit2, Camera, QrCode, Copy, 
  FileText, X, Calendar, Bell, Clock, ArrowDownLeft, ArrowUpRight, Repeat
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { 
  usePersonInvoices, 
  createInvoice, 
  updateInvoice, 
  updateInvoiceStatus, 
  deleteInvoice 
} from '@/lib/firebaseHooks';
import { toast } from 'sonner';
import InvoiceScanner, { ScannedInvoiceData } from './InvoiceScanner';

interface PersonInvoicesDialogProps {
  person: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDataChanged?: () => void;
}

export default function PersonInvoicesDialog({ person, open, onOpenChange, onDataChanged }: PersonInvoicesDialogProps) {
  const { t } = useTranslation();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [deleteInvoiceId, setDeleteInvoiceId] = useState<string | null>(null);
  const [newInvoice, setNewInvoice] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    reminderEnabled: false,
    reminderDate: '',
    isRecurring: false,
    recurringInterval: 'monthly' as 'weekly' | 'monthly' | 'quarterly' | 'yearly',
    status: 'open',
    direction: 'incoming' as 'incoming' | 'outgoing', // incoming = Person schuldet mir, outgoing = Ich schulde Person
    notes: '',
    iban: '',
    reference: '',
    creditorName: '',
    creditorAddress: '',
    imageUrl: '',
  });

  const { data: invoices = [], isLoading, refetch } = usePersonInvoices(person?.id);

  useEffect(() => {
    if (open && person?.id) {
      refetch();
    }
  }, [open, person?.id]);

  const refreshData = useCallback(async () => {
    await refetch();
    if (onDataChanged) {
      onDataChanged();
    }
  }, [refetch, onDataChanged]);

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
      await refreshData();
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
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
      });

      // Update status separately if changed
      if (editingInvoice.status) {
        await updateInvoiceStatus(person.id, editingInvoice.id, editingInvoice.status);
      }
      
      toast.success('Rechnung aktualisiert');
      setEditingInvoice(null);
      await refreshData();
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    }
  };

  const handleStatusChange = async (invoiceId: string, newStatus: string) => {
    try {
      await updateInvoiceStatus(person.id, invoiceId, newStatus);
      toast.success('Status aktualisiert');
      await refreshData();
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
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
          <div className="bg-slate-50 dark:bg-slate-900 px-6 py-6 border-b relative">
            <button
              onClick={() => handleClose(false)}
              className="absolute top-4 right-4 p-2 rounded-md opacity-70 hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold shrink-0">
                  {person?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{person?.name}</h2>
                  <p className="text-sm text-muted-foreground">{invoices.length} Rechnungen</p>
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="outline" onClick={() => setShowScanner(true)} className="flex-1 sm:flex-none h-10">
                  <Camera className="w-4 h-4 mr-2" />
                  Scannen
                </Button>
                <Button onClick={() => setShowAddDialog(true)} className="flex-1 sm:flex-none h-10">
                  <Plus className="w-4 h-4 mr-2" />
                  Neu
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 overflow-y-auto flex-1">
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

            {/* Invoice List */}
            <h3 className="font-semibold mb-4">Rechnungen</h3>
            
            {isLoading ? (
              <div className="text-center py-10 text-muted-foreground">Laden...</div>
            ) : invoices.length > 0 ? (
              <div className="space-y-3">
                {invoices.map((invoice: any) => (
                  <div 
                    key={invoice.id}
                    className={`rounded-xl p-4 border ${
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
    </>
  );
}
