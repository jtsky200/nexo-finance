import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, Trash2, Edit2, Camera, QrCode, Copy, 
  FileText, X
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
}

export default function PersonInvoicesDialog({ person, open, onOpenChange }: PersonInvoicesDialogProps) {
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

  const formatDate = (date: Date | any) => {
    if (!date) return '-';
    try {
      const d = date?.toDate ? date.toDate() : new Date(date);
      if (isNaN(d.getTime())) return '-';
      return d.toLocaleDateString('de-CH');
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
      refetch();
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
      refetch();
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    }
  };

  const handleStatusChange = async (invoiceId: string, newStatus: string) => {
    try {
      await updateInvoiceStatus(person.id, invoiceId, newStatus);
      toast.success('Status aktualisiert');
      refetch();
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    }
  };

  const handleDeleteInvoice = async () => {
    if (!deleteInvoiceId) return;

    try {
      await deleteInvoice(person.id, deleteInvoiceId);
      toast.success('Rechnung gelöscht');
      refetch();
      setDeleteInvoiceId(null);
    } catch (error: any) {
      toast.error('Fehler: ' + error.message);
    }
  };

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const openAmount = invoices
    .filter(inv => inv.status === 'open' || inv.status === 'postponed')
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700 border-green-200';
      case 'postponed': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-red-100 text-red-700 border-red-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Bezahlt';
      case 'postponed': return 'Verschoben';
      default: return 'Offen';
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                  {person?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <DialogTitle className="text-lg">{person?.name}</DialogTitle>
                  <p className="text-sm text-muted-foreground">{invoices.length} Rechnungen</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowScanner(true)}>
                  <Camera className="w-4 h-4 mr-1" />
                  Scan
                </Button>
                <Button size="sm" onClick={() => setShowAddDialog(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Neu
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Summary */}
            <div className="flex gap-4">
              <div className="flex-1 p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Gesamt</p>
                <p className="text-lg font-semibold">{formatAmount(totalAmount)}</p>
              </div>
              <div className="flex-1 p-3 rounded-lg bg-red-50 dark:bg-red-950/30">
                <p className="text-xs text-muted-foreground">Offen</p>
                <p className="text-lg font-semibold text-red-600">{formatAmount(openAmount)}</p>
              </div>
            </div>

            {/* Invoice List */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {isLoading ? (
                <p className="text-center py-8 text-muted-foreground">Laden...</p>
              ) : invoices.length > 0 ? (
                invoices.map((invoice: any) => (
                  <div 
                    key={invoice.id} 
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{invoice.description}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(invoice.status)}`}>
                          {getStatusLabel(invoice.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span>{formatDate(invoice.date)}</span>
                        <span className="font-medium text-foreground">{formatAmount(invoice.amount)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 ml-2">
                      <Select
                        value={invoice.status}
                        onValueChange={(value) => handleStatusChange(invoice.id, value)}
                      >
                        <SelectTrigger className="h-8 w-[110px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Offen</SelectItem>
                          <SelectItem value="paid">Bezahlt</SelectItem>
                          <SelectItem value="postponed">Verschoben</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setEditingInvoice({
                          ...invoice,
                          amount: (invoice.amount / 100).toFixed(2),
                          date: new Date(invoice.date).toISOString().split('T')[0],
                        })}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => setDeleteInvoiceId(invoice.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-muted-foreground text-sm">Keine Rechnungen</p>
                  <Button size="sm" className="mt-3" onClick={() => setShowAddDialog(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Erste Rechnung
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Invoice Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Neue Rechnung</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {newInvoice.imageUrl && (
              <div className="relative">
                <img src={newInvoice.imageUrl} alt="" className="w-full h-24 object-cover rounded-lg border" />
                <Button 
                  variant="secondary" 
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6"
                  onClick={() => setNewInvoice({ ...newInvoice, imageUrl: '' })}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}

            <div>
              <Label>Beschreibung</Label>
              <Input
                value={newInvoice.description}
                onChange={(e) => setNewInvoice({ ...newInvoice, description: e.target.value })}
                placeholder="z.B. Miete, Strom..."
                className="mt-1"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Betrag (CHF)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newInvoice.amount}
                  onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Datum</Label>
                <Input
                  type="date"
                  value={newInvoice.date}
                  onChange={(e) => setNewInvoice({ ...newInvoice, date: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Status</Label>
              <Select
                value={newInvoice.status}
                onValueChange={(value) => setNewInvoice({ ...newInvoice, status: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Offen</SelectItem>
                  <SelectItem value="paid">Bezahlt</SelectItem>
                  <SelectItem value="postponed">Verschoben</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(newInvoice.iban || newInvoice.creditorName) && (
              <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                <p className="font-medium flex items-center gap-1">
                  <QrCode className="w-3 h-3" /> Zahlungsdetails
                </p>
                {newInvoice.creditorName && <p className="text-muted-foreground">{newInvoice.creditorName}</p>}
                {newInvoice.iban && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-mono text-xs">{newInvoice.iban}</span>
                    <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => copyToClipboard(newInvoice.iban, 'IBAN')}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            <Button variant="outline" className="w-full" onClick={() => { setShowAddDialog(false); setShowScanner(true); }}>
              <Camera className="w-4 h-4 mr-2" />
              Rechnung scannen
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Abbrechen</Button>
            <Button onClick={handleAddInvoice}>Hinzufügen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <InvoiceScanner open={showScanner} onOpenChange={setShowScanner} onInvoiceScanned={handleScannedData} />

      {editingInvoice && (
        <Dialog open={!!editingInvoice} onOpenChange={() => setEditingInvoice(null)}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Rechnung bearbeiten</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Beschreibung</Label>
                <Input
                  value={editingInvoice.description}
                  onChange={(e) => setEditingInvoice({ ...editingInvoice, description: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Betrag (CHF)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingInvoice.amount}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, amount: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Datum</Label>
                  <Input
                    type="date"
                    value={editingInvoice.date}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, date: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingInvoice(null)}>Abbrechen</Button>
              <Button onClick={handleUpdateInvoice}>Speichern</Button>
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
