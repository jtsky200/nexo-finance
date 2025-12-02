import { useState, useEffect } from 'react';
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
  FileText, Calendar, X
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
        <DialogContent className="max-w-2xl w-full max-h-[85vh] flex flex-col p-0">
          {/* Header */}
          <div className="p-6 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                  {person?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{person?.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {invoices.length} {invoices.length === 1 ? 'Rechnung' : 'Rechnungen'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowScanner(true)}>
                  <Camera className="w-4 h-4 mr-2" />
                  Scannen
                </Button>
                <Button size="sm" onClick={() => setShowAddDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Hinzufügen
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-lg border bg-card">
                <p className="text-xs text-muted-foreground mb-1">Gesamt</p>
                <p className="text-xl font-bold">{formatAmount(totalAmount)}</p>
              </div>
              <div className="p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
                <p className="text-xs text-muted-foreground mb-1">Offen</p>
                <p className="text-xl font-bold text-red-600">{formatAmount(openAmount)}</p>
              </div>
              <div className="p-4 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
                <p className="text-xs text-muted-foreground mb-1">Bezahlt</p>
                <p className="text-xl font-bold text-green-600">{formatAmount(paidAmount)}</p>
              </div>
            </div>

            {/* Invoice List */}
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Laden...</div>
              ) : invoices.length > 0 ? (
                invoices.map((invoice: any) => (
                  <div 
                    key={invoice.id} 
                    className={`p-4 rounded-lg border ${
                      invoice.status === 'paid' 
                        ? 'border-green-200 bg-green-50/50 dark:bg-green-950/10 dark:border-green-900' 
                        : invoice.status === 'postponed'
                        ? 'border-orange-200 bg-orange-50/50 dark:bg-orange-950/10 dark:border-orange-900'
                        : 'border-red-200 bg-red-50/50 dark:bg-red-950/10 dark:border-red-900'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold truncate">{invoice.description}</h4>
                          <Badge 
                            variant={invoice.status === 'paid' ? 'default' : invoice.status === 'postponed' ? 'secondary' : 'destructive'}
                            className="shrink-0"
                          >
                            {invoice.status === 'paid' ? 'Bezahlt' : invoice.status === 'postponed' ? 'Verschoben' : 'Offen'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{formatDate(invoice.date)}</span>
                          <span className="font-semibold text-foreground">{formatAmount(invoice.amount)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <Select
                          value={invoice.status}
                          onValueChange={(value) => handleStatusChange(invoice.id, value)}
                        >
                          <SelectTrigger className="w-[140px] h-9">
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
                        
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9"
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
                          className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-100"
                          onClick={() => setDeleteInvoiceId(invoice.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground mb-4">Noch keine Rechnungen erfasst</p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" size="sm" onClick={() => setShowScanner(true)}>
                      <Camera className="w-4 h-4 mr-2" />
                      Scannen
                    </Button>
                    <Button size="sm" onClick={() => setShowAddDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Hinzufügen
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
            <DialogTitle>Neue Rechnung</DialogTitle>
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
              <Label>Beschreibung *</Label>
              <Input
                value={newInvoice.description}
                onChange={(e) => setNewInvoice({ ...newInvoice, description: e.target.value })}
                placeholder="z.B. Miete, Strom..."
                className="mt-1"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Betrag (CHF) *</Label>
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

            {(newInvoice.iban || newInvoice.reference || newInvoice.creditorName) && (
              <div className="p-3 bg-muted rounded-lg space-y-2 text-sm">
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
          <DialogFooter>
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
              <DialogTitle>Rechnung bearbeiten</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Beschreibung *</Label>
                <Input
                  value={editingInvoice.description}
                  onChange={(e) => setEditingInvoice({ ...editingInvoice, description: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Betrag (CHF) *</Label>
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
              Diese Rechnung wird dauerhaft gelöscht.
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
