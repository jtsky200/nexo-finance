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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500 hover:bg-green-600 text-white px-4 py-1">Bezahlt</Badge>;
      case 'postponed':
        return <Badge className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1">Verschoben</Badge>;
      default:
        return <Badge className="bg-red-500 hover:bg-red-600 text-white px-4 py-1">Offen</Badge>;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-[900px] w-[95vw] max-h-[90vh] p-0 gap-0 overflow-hidden">
          {/* Header */}
          <div className="bg-slate-50 dark:bg-slate-900 px-10 py-8 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-3xl font-bold">
                  {person?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-2">{person?.name}</h2>
                  <p className="text-lg text-muted-foreground">{invoices.length} Rechnungen</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Button variant="outline" size="lg" onClick={() => setShowScanner(true)} className="h-14 px-6 text-base">
                  <Camera className="w-5 h-5 mr-3" />
                  Scannen
                </Button>
                <Button size="lg" onClick={() => setShowAddDialog(true)} className="h-14 px-6 text-base">
                  <Plus className="w-5 h-5 mr-3" />
                  Hinzufügen
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-10 py-8 overflow-y-auto flex-1">
            {/* Statistics */}
            <div className="grid grid-cols-3 gap-6 mb-10">
              <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-8">
                <p className="text-base text-muted-foreground mb-3">Gesamt</p>
                <p className="text-4xl font-bold">{formatAmount(totalAmount)}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-950/50 border-2 border-red-200 dark:border-red-900 rounded-2xl p-8">
                <p className="text-base text-red-600 dark:text-red-400 mb-3">Offen</p>
                <p className="text-4xl font-bold text-red-600">{formatAmount(openAmount)}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-950/50 border-2 border-green-200 dark:border-green-900 rounded-2xl p-8">
                <p className="text-base text-green-600 dark:text-green-400 mb-3">Bezahlt</p>
                <p className="text-4xl font-bold text-green-600">{formatAmount(paidAmount)}</p>
              </div>
            </div>

            {/* Invoice List */}
            <h3 className="text-xl font-bold mb-6">Rechnungen</h3>
            
            {isLoading ? (
              <div className="text-center py-16 text-lg text-muted-foreground">Laden...</div>
            ) : invoices.length > 0 ? (
              <div className="space-y-5">
                {invoices.map((invoice: any) => (
                  <div 
                    key={invoice.id}
                    className={`rounded-2xl p-8 border-2 ${
                      invoice.status === 'paid' 
                        ? 'bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-800' 
                        : invoice.status === 'postponed'
                        ? 'bg-orange-50/50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800'
                        : 'bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      {/* Left side */}
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <h4 className="text-2xl font-semibold">{invoice.description}</h4>
                          {getStatusBadge(invoice.status)}
                        </div>
                        <div className="flex items-center gap-8 text-lg">
                          <span className="text-muted-foreground flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            {formatDate(invoice.date)}
                          </span>
                          <span className="text-2xl font-bold">{formatAmount(invoice.amount)}</span>
                        </div>
                      </div>
                      
                      {/* Right side - Actions */}
                      <div className="flex items-center gap-4">
                        <Select
                          value={invoice.status}
                          onValueChange={(value) => handleStatusChange(invoice.id, value)}
                        >
                          <SelectTrigger className="w-[180px] h-14 text-base">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open" className="py-3">
                              <span className="flex items-center gap-3">
                                <span className="w-3 h-3 rounded-full bg-red-500" />
                                Offen
                              </span>
                            </SelectItem>
                            <SelectItem value="paid" className="py-3">
                              <span className="flex items-center gap-3">
                                <span className="w-3 h-3 rounded-full bg-green-500" />
                                Bezahlt
                              </span>
                            </SelectItem>
                            <SelectItem value="postponed" className="py-3">
                              <span className="flex items-center gap-3">
                                <span className="w-3 h-3 rounded-full bg-orange-500" />
                                Verschoben
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-14 w-14"
                          onClick={() => setEditingInvoice({
                            ...invoice,
                            amount: (invoice.amount / 100).toFixed(2),
                            date: new Date(invoice.date).toISOString().split('T')[0],
                          })}
                        >
                          <Edit2 className="h-6 w-6" />
                        </Button>
                        
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-14 w-14 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          onClick={() => setDeleteInvoiceId(invoice.id)}
                        >
                          <Trash2 className="h-6 w-6" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-2xl py-20 text-center">
                <FileText className="w-20 h-20 mx-auto text-muted-foreground/30 mb-6" />
                <p className="text-xl text-muted-foreground mb-8">Noch keine Rechnungen</p>
                <div className="flex gap-4 justify-center">
                  <Button variant="outline" size="lg" onClick={() => setShowScanner(true)} className="h-14 px-8 text-base">
                    <Camera className="w-5 h-5 mr-3" />
                    Scannen
                  </Button>
                  <Button size="lg" onClick={() => setShowAddDialog(true)} className="h-14 px-8 text-base">
                    <Plus className="w-5 h-5 mr-3" />
                    Hinzufügen
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Invoice Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-2xl">Neue Rechnung</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {newInvoice.imageUrl && (
              <div className="relative">
                <img src={newInvoice.imageUrl} alt="" className="w-full h-40 object-cover rounded-xl border-2" />
                <Button 
                  variant="secondary" 
                  size="icon"
                  className="absolute top-3 right-3 h-10 w-10"
                  onClick={() => setNewInvoice({ ...newInvoice, imageUrl: '' })}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            )}

            <div>
              <Label className="text-base font-medium">Beschreibung *</Label>
              <Input
                value={newInvoice.description}
                onChange={(e) => setNewInvoice({ ...newInvoice, description: e.target.value })}
                placeholder="z.B. Miete, Strom..."
                className="mt-3 h-14 text-base px-4"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label className="text-base font-medium">Betrag (CHF) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newInvoice.amount}
                  onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                  placeholder="0.00"
                  className="mt-3 h-14 text-base px-4"
                />
              </div>
              <div>
                <Label className="text-base font-medium">Datum</Label>
                <Input
                  type="date"
                  value={newInvoice.date}
                  onChange={(e) => setNewInvoice({ ...newInvoice, date: e.target.value })}
                  className="mt-3 h-14 text-base px-4"
                />
              </div>
            </div>

            <div>
              <Label className="text-base font-medium">Status</Label>
              <Select
                value={newInvoice.status}
                onValueChange={(value) => setNewInvoice({ ...newInvoice, status: value })}
              >
                <SelectTrigger className="mt-3 h-14 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open" className="py-3">
                    <span className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full bg-red-500" />
                      Offen
                    </span>
                  </SelectItem>
                  <SelectItem value="paid" className="py-3">
                    <span className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full bg-green-500" />
                      Bezahlt
                    </span>
                  </SelectItem>
                  <SelectItem value="postponed" className="py-3">
                    <span className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full bg-orange-500" />
                      Verschoben
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(newInvoice.iban || newInvoice.creditorName) && (
              <div className="p-6 bg-muted rounded-xl space-y-4">
                <p className="font-semibold flex items-center gap-3 text-base">
                  <QrCode className="w-5 h-5" /> Zahlungsdetails
                </p>
                {newInvoice.creditorName && <p className="text-muted-foreground">{newInvoice.creditorName}</p>}
                {newInvoice.iban && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-mono">{newInvoice.iban}</span>
                    <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => copyToClipboard(newInvoice.iban, 'IBAN')}>
                      <Copy className="w-5 h-5" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            <Button variant="outline" className="w-full h-14 text-base" onClick={() => { setShowAddDialog(false); setShowScanner(true); }}>
              <Camera className="w-5 h-5 mr-3" />
              Rechnung scannen
            </Button>
          </div>
          <DialogFooter className="mt-8 gap-4">
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="h-14 px-8 text-base">
              Abbrechen
            </Button>
            <Button onClick={handleAddInvoice} className="h-14 px-8 text-base">
              Hinzufügen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <InvoiceScanner open={showScanner} onOpenChange={setShowScanner} onInvoiceScanned={handleScannedData} />

      {editingInvoice && (
        <Dialog open={!!editingInvoice} onOpenChange={() => setEditingInvoice(null)}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader className="pb-6">
              <DialogTitle className="text-2xl">Rechnung bearbeiten</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <Label className="text-base font-medium">Beschreibung *</Label>
                <Input
                  value={editingInvoice.description}
                  onChange={(e) => setEditingInvoice({ ...editingInvoice, description: e.target.value })}
                  className="mt-3 h-14 text-base px-4"
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-base font-medium">Betrag (CHF) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingInvoice.amount}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, amount: e.target.value })}
                    className="mt-3 h-14 text-base px-4"
                  />
                </div>
                <div>
                  <Label className="text-base font-medium">Datum</Label>
                  <Input
                    type="date"
                    value={editingInvoice.date}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, date: e.target.value })}
                    className="mt-3 h-14 text-base px-4"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="mt-8 gap-4">
              <Button variant="outline" onClick={() => setEditingInvoice(null)} className="h-14 px-8 text-base">
                Abbrechen
              </Button>
              <Button onClick={handleUpdateInvoice} className="h-14 px-8 text-base">
                Speichern
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={!!deleteInvoiceId} onOpenChange={(open) => !open && setDeleteInvoiceId(null)}>
        <AlertDialogContent className="max-w-[450px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Rechnung löschen?</AlertDialogTitle>
            <AlertDialogDescription className="text-base mt-3">
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-4">
            <AlertDialogCancel className="h-12 px-6">Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteInvoice} className="h-12 px-6 bg-red-600 hover:bg-red-700">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
