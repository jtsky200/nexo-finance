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
  FileText, X, Calendar
} from 'lucide-react';
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
    status: 'open',
    iban: '',
    reference: '',
    creditorName: '',
    creditorAddress: '',
    imageUrl: '',
  });

  const { data: invoices = [], isLoading, refetch } = usePersonInvoices(person?.id);

  // Refresh when dialog opens
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
      });
      
      toast.success('Rechnung hinzugefügt');
      setNewInvoice({
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        status: 'open',
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
      });
      
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

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-[850px] w-[95vw] max-h-[85vh] p-0 gap-0 overflow-hidden">
          {/* Header */}
          <div className="px-8 py-6 border-b">
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold shrink-0">
                  {person?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{person?.name}</h2>
                  <p className="text-muted-foreground mt-1">{invoices.length} Rechnungen</p>
                </div>
              </div>
              <div className="flex gap-3 shrink-0">
                <Button variant="outline" onClick={() => setShowScanner(true)} className="h-11">
                  <Camera className="w-5 h-5 mr-2" />
                  Scannen
                </Button>
                <Button onClick={() => setShowAddDialog(true)} className="h-11">
                  <Plus className="w-5 h-5 mr-2" />
                  Hinzufügen
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-6 overflow-y-auto flex-1">
            {/* Statistics */}
            <div className="grid grid-cols-3 gap-5 mb-8">
              <Card className="bg-slate-50 dark:bg-slate-900/50">
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground mb-2">Gesamt</p>
                  <p className="text-2xl font-bold">{formatAmount(totalAmount)}</p>
                </CardContent>
              </Card>
              <Card className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900">
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground mb-2">Offen</p>
                  <p className="text-2xl font-bold text-red-600">{formatAmount(openAmount)}</p>
                </CardContent>
              </Card>
              <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900">
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground mb-2">Bezahlt</p>
                  <p className="text-2xl font-bold text-green-600">{formatAmount(paidAmount)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Invoice List */}
            <h3 className="font-semibold text-lg mb-4">Rechnungen</h3>
            
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Laden...</div>
            ) : invoices.length > 0 ? (
              <div className="space-y-4">
                {invoices.map((invoice: any) => (
                  <Card 
                    key={invoice.id}
                    className={`${
                      invoice.status === 'paid' 
                        ? 'bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-900' 
                        : invoice.status === 'postponed'
                        ? 'bg-orange-50/50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900'
                        : 'bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-900'
                    }`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between gap-4">
                        {/* Left side */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-lg truncate">{invoice.description}</h4>
                            <Badge 
                              variant="secondary"
                              className={`shrink-0 ${
                                invoice.status === 'paid' 
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' 
                                  : invoice.status === 'postponed'
                                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
                              }`}
                            >
                              {invoice.status === 'paid' ? 'Bezahlt' : invoice.status === 'postponed' ? 'Verschoben' : 'Offen'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-muted-foreground">{formatDate(invoice.date)}</span>
                            <span className="font-bold text-lg">{formatAmount(invoice.amount)}</span>
                          </div>
                        </div>
                        
                        {/* Right side - Actions */}
                        <div className="flex items-center gap-3 shrink-0">
                          <Select
                            value={invoice.status}
                            onValueChange={(value) => handleStatusChange(invoice.id, value)}
                          >
                            <SelectTrigger className="w-[140px] h-11">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">
                                <span className="flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                                  Offen
                                </span>
                              </SelectItem>
                              <SelectItem value="paid">
                                <span className="flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                                  Bezahlt
                                </span>
                              </SelectItem>
                              <SelectItem value="postponed">
                                <span className="flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                                  Verschoben
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-11 w-11"
                            onClick={() => setEditingInvoice({
                              ...invoice,
                              amount: (invoice.amount / 100).toFixed(2),
                              date: new Date(invoice.date).toISOString().split('T')[0],
                            })}
                          >
                            <Edit2 className="h-5 w-5" />
                          </Button>
                          
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-11 w-11 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            onClick={() => setDeleteInvoiceId(invoice.id)}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-14 text-center">
                  <FileText className="w-14 h-14 mx-auto text-muted-foreground/40 mb-4" />
                  <p className="text-lg text-muted-foreground mb-6">Noch keine Rechnungen</p>
                  <div className="flex gap-4 justify-center">
                    <Button variant="outline" onClick={() => setShowScanner(true)} className="h-11">
                      <Camera className="w-5 h-5 mr-2" />
                      Scannen
                    </Button>
                    <Button onClick={() => setShowAddDialog(true)} className="h-11">
                      <Plus className="w-5 h-5 mr-2" />
                      Hinzufügen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Invoice Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px] p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl">Neue Rechnung</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {newInvoice.imageUrl && (
              <div className="relative">
                <img src={newInvoice.imageUrl} alt="" className="w-full h-32 object-cover rounded-xl border" />
                <Button 
                  variant="secondary" 
                  size="icon"
                  className="absolute top-3 right-3 h-8 w-8"
                  onClick={() => setNewInvoice({ ...newInvoice, imageUrl: '' })}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            <div>
              <Label className="text-sm font-medium">Beschreibung *</Label>
              <Input
                value={newInvoice.description}
                onChange={(e) => setNewInvoice({ ...newInvoice, description: e.target.value })}
                placeholder="z.B. Miete, Strom..."
                className="mt-2 h-11"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Betrag (CHF) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newInvoice.amount}
                  onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                  placeholder="0.00"
                  className="mt-2 h-11"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Datum</Label>
                <Input
                  type="date"
                  value={newInvoice.date}
                  onChange={(e) => setNewInvoice({ ...newInvoice, date: e.target.value })}
                  className="mt-2 h-11"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Status</Label>
              <Select
                value={newInvoice.status}
                onValueChange={(value) => setNewInvoice({ ...newInvoice, status: value })}
              >
                <SelectTrigger className="mt-2 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      Offen
                    </span>
                  </SelectItem>
                  <SelectItem value="paid">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                      Bezahlt
                    </span>
                  </SelectItem>
                  <SelectItem value="postponed">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                      Verschoben
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(newInvoice.iban || newInvoice.creditorName) && (
              <div className="p-4 bg-muted rounded-xl space-y-3">
                <p className="font-medium flex items-center gap-2">
                  <QrCode className="w-5 h-5" /> Zahlungsdetails
                </p>
                {newInvoice.creditorName && <p className="text-muted-foreground">{newInvoice.creditorName}</p>}
                {newInvoice.iban && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-mono">{newInvoice.iban}</span>
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => copyToClipboard(newInvoice.iban, 'IBAN')}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            <Button variant="outline" className="w-full h-11" onClick={() => { setShowAddDialog(false); setShowScanner(true); }}>
              <Camera className="w-5 h-5 mr-2" />
              Rechnung scannen
            </Button>
          </div>
          <DialogFooter className="mt-6 gap-3">
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="h-11 px-6">Abbrechen</Button>
            <Button onClick={handleAddInvoice} className="h-11 px-6">Hinzufügen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <InvoiceScanner open={showScanner} onOpenChange={setShowScanner} onInvoiceScanned={handleScannedData} />

      {editingInvoice && (
        <Dialog open={!!editingInvoice} onOpenChange={() => setEditingInvoice(null)}>
          <DialogContent className="sm:max-w-[500px] p-8">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl">Rechnung bearbeiten</DialogTitle>
            </DialogHeader>
            <div className="space-y-5">
              <div>
                <Label className="text-sm font-medium">Beschreibung *</Label>
                <Input
                  value={editingInvoice.description}
                  onChange={(e) => setEditingInvoice({ ...editingInvoice, description: e.target.value })}
                  className="mt-2 h-11"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Betrag (CHF) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingInvoice.amount}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, amount: e.target.value })}
                    className="mt-2 h-11"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Datum</Label>
                  <Input
                    type="date"
                    value={editingInvoice.date}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, date: e.target.value })}
                    className="mt-2 h-11"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="mt-6 gap-3">
              <Button variant="outline" onClick={() => setEditingInvoice(null)} className="h-11 px-6">Abbrechen</Button>
              <Button onClick={handleUpdateInvoice} className="h-11 px-6">Speichern</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={!!deleteInvoiceId} onOpenChange={(open) => !open && setDeleteInvoiceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rechnung löschen?</AlertDialogTitle>
            <AlertDialogDescription>Diese Aktion kann nicht rückgängig gemacht werden.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteInvoice} className="bg-red-600 hover:bg-red-700">Löschen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
