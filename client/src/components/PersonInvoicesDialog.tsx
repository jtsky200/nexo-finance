import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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

  const formatAmount = (amount: number) => {
    return `CHF ${(amount / 100).toFixed(2)}`;
  };

  const handleAddInvoice = async () => {
    if (!newInvoice.amount || !newInvoice.description) {
      toast.error(t('finance.errors.descriptionRequired'));
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
      
      toast.success(t('finance.invoiceAdded'));
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
      toast.error(t('common.error') + ': ' + error.message);
    }
  };

  const handleUpdateInvoice = async () => {
    if (!editingInvoice || !editingInvoice.amount || !editingInvoice.description) {
      toast.error(t('finance.errors.descriptionRequired'));
      return;
    }

    try {
      const amountInCents = Math.round(parseFloat(editingInvoice.amount) * 100);
      await updateInvoice(person.id, editingInvoice.id, {
        amount: amountInCents,
        description: editingInvoice.description,
        date: new Date(editingInvoice.date),
      });
      
      toast.success(t('finance.invoiceUpdated'));
      setEditingInvoice(null);
      refetch();
    } catch (error: any) {
      toast.error(t('common.error') + ': ' + error.message);
    }
  };

  const handleStatusChange = async (invoiceId: string, newStatus: string) => {
    try {
      await updateInvoiceStatus(person.id, invoiceId, newStatus);
      toast.success(t('finance.statusUpdated'));
      refetch();
    } catch (error: any) {
      toast.error(t('common.error') + ': ' + error.message);
    }
  };

  const handleDeleteInvoice = async () => {
    if (!deleteInvoiceId) return;

    try {
      await deleteInvoice(person.id, deleteInvoiceId);
      toast.success(t('finance.invoiceDeleted'));
      refetch();
      setDeleteInvoiceId(null);
    } catch (error: any) {
      toast.error(t('common.error') + ': ' + error.message);
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
    toast.success(t('invoice.dataImported', 'Daten wurden übernommen'));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} kopiert!`);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl w-full max-h-[90vh] overflow-hidden p-0">
          {/* Header */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shrink-0">
                  {person?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{person?.name}</h2>
                  <p className="text-muted-foreground">
                    {invoices.length} {invoices.length === 1 ? 'Rechnung' : 'Rechnungen'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" onClick={() => setShowScanner(true)}>
                  <Camera className="w-4 h-4 mr-2" />
                  Scannen
                </Button>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Rechnung hinzufügen
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-5 rounded-xl border-2 bg-card">
                <p className="text-sm text-muted-foreground font-medium mb-2">Rechnungen gesamt</p>
                <p className="text-2xl font-bold">{formatAmount(totalAmount)}</p>
              </div>
              <div className="p-5 rounded-xl border-2 border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
                <p className="text-sm text-muted-foreground font-medium mb-2">Offener Betrag</p>
                <p className="text-2xl font-bold text-red-600">{formatAmount(openAmount)}</p>
              </div>
              <div className="p-5 rounded-xl border-2 border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
                <p className="text-sm text-muted-foreground font-medium mb-2">Bereits bezahlt</p>
                <p className="text-2xl font-bold text-green-600">{formatAmount(paidAmount)}</p>
              </div>
            </div>

            {/* Invoice List */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold mb-4">Rechnungsliste</h3>
              
              {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">Laden...</div>
              ) : invoices.length > 0 ? (
                <div className="space-y-3">
                  {invoices.map((invoice: any) => (
                    <div 
                      key={invoice.id} 
                      className={`p-5 rounded-xl border-2 transition-all hover:shadow-sm ${
                        invoice.status === 'paid' 
                          ? 'border-green-200 bg-green-50/50 dark:bg-green-950/10 dark:border-green-900' 
                          : invoice.status === 'postponed'
                          ? 'border-orange-200 bg-orange-50/50 dark:bg-orange-950/10 dark:border-orange-900'
                          : 'border-red-200 bg-red-50/50 dark:bg-red-950/10 dark:border-red-900'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-6">
                        {/* Left: Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-lg">{invoice.description}</h4>
                            <Badge 
                              variant={invoice.status === 'paid' ? 'default' : invoice.status === 'postponed' ? 'secondary' : 'destructive'}
                              className={`shrink-0 ${
                                invoice.status === 'paid' 
                                  ? 'bg-green-600' 
                                  : invoice.status === 'postponed'
                                  ? 'bg-orange-500 text-white'
                                  : ''
                              }`}
                            >
                              {invoice.status === 'paid' ? 'Bezahlt' : invoice.status === 'postponed' ? 'Verschoben' : 'Offen'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-6 text-sm">
                            <span className="text-muted-foreground">{formatDate(invoice.date)}</span>
                            <span className="text-xl font-bold">{formatAmount(invoice.amount)}</span>
                          </div>
                        </div>
                        
                        {/* Right: Actions */}
                        <div className="flex items-center gap-3 shrink-0">
                          <Select
                            value={invoice.status}
                            onValueChange={(value) => handleStatusChange(invoice.id, value)}
                          >
                            <SelectTrigger className="w-[150px]">
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
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            onClick={() => setDeleteInvoiceId(invoice.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-xl">
                  <FileText className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                  <h4 className="text-lg font-semibold mb-2">Noch keine Rechnungen</h4>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    Fügen Sie die erste Rechnung hinzu, um den Überblick zu behalten.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={() => setShowScanner(true)}>
                      <Camera className="w-4 h-4 mr-2" />
                      Scannen
                    </Button>
                    <Button onClick={() => setShowAddDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Manuell hinzufügen
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Invoice Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Neue Rechnung</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {newInvoice.imageUrl && (
              <div className="relative">
                <img 
                  src={newInvoice.imageUrl} 
                  alt="Invoice" 
                  className="w-full h-32 object-cover rounded-lg border"
                />
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
              <Label className="text-sm font-medium">Beschreibung *</Label>
              <Input
                value={newInvoice.description}
                onChange={(e) => setNewInvoice({ ...newInvoice, description: e.target.value })}
                placeholder="z.B. Miete, Strom, Versicherung..."
                className="mt-1.5"
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
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Datum</Label>
                <Input
                  type="date"
                  value={newInvoice.date}
                  onChange={(e) => setNewInvoice({ ...newInvoice, date: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Status</Label>
              <Select
                value={newInvoice.status}
                onValueChange={(value) => setNewInvoice({ ...newInvoice, status: value })}
              >
                <SelectTrigger className="mt-1.5">
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

            {(newInvoice.iban || newInvoice.reference || newInvoice.creditorName) && (
              <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
                <p className="font-medium flex items-center gap-2">
                  <QrCode className="w-4 h-4" />
                  Zahlungsdetails
                </p>
                {newInvoice.creditorName && (
                  <p><span className="text-muted-foreground">Empfänger:</span> {newInvoice.creditorName}</p>
                )}
                {newInvoice.iban && (
                  <div className="flex items-center justify-between">
                    <p><span className="text-muted-foreground">IBAN:</span> {newInvoice.iban}</p>
                    <Button variant="ghost" size="sm" className="h-6" onClick={() => copyToClipboard(newInvoice.iban, 'IBAN')}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                )}
                {newInvoice.reference && (
                  <div className="flex items-center justify-between">
                    <p><span className="text-muted-foreground">Referenz:</span> {newInvoice.reference}</p>
                    <Button variant="ghost" size="sm" className="h-6" onClick={() => copyToClipboard(newInvoice.reference, 'Referenz')}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => {
                setShowAddDialog(false);
                setShowScanner(true);
              }}
            >
              <Camera className="w-4 h-4 mr-2" />
              Rechnung scannen
            </Button>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleAddInvoice}>
              Hinzufügen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Scanner */}
      <InvoiceScanner
        open={showScanner}
        onOpenChange={setShowScanner}
        onInvoiceScanned={handleScannedData}
      />

      {/* Edit Invoice Dialog */}
      {editingInvoice && (
        <Dialog open={!!editingInvoice} onOpenChange={() => setEditingInvoice(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">Rechnung bearbeiten</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-sm font-medium">Beschreibung *</Label>
                <Input
                  value={editingInvoice.description}
                  onChange={(e) => setEditingInvoice({ ...editingInvoice, description: e.target.value })}
                  className="mt-1.5"
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
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Datum</Label>
                  <Input
                    type="date"
                    value={editingInvoice.date}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, date: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setEditingInvoice(null)}>
                Abbrechen
              </Button>
              <Button onClick={handleUpdateInvoice}>
                Speichern
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteInvoiceId} onOpenChange={(open) => !open && setDeleteInvoiceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rechnung löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Rechnung wird dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteInvoice} className="bg-red-600 hover:bg-red-700">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
