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
  FileText, Calendar, CheckCircle2, Clock, AlertCircle,
  X, ChevronRight
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
        month: 'long',
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

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'paid':
        return { 
          icon: CheckCircle2, 
          label: t('finance.paid', 'Bezahlt'), 
          color: 'text-green-600',
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-800'
        };
      case 'postponed':
        return { 
          icon: Clock, 
          label: t('finance.postponed', 'Verschoben'), 
          color: 'text-orange-600',
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          border: 'border-orange-200 dark:border-orange-800'
        };
      default:
        return { 
          icon: AlertCircle, 
          label: t('finance.open', 'Offen'), 
          color: 'text-red-600',
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800'
        };
    }
  };

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const openAmount = invoices
    .filter(inv => inv.status === 'open' || inv.status === 'postponed')
    .reduce((sum, inv) => sum + inv.amount, 0);
  const paidAmount = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  // Handle scanned invoice data
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

  // Copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} kopiert!`);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <DialogHeader className="pb-4 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-2xl font-bold text-primary">
                    {person?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold">{person?.name}</DialogTitle>
                  <p className="text-muted-foreground mt-1">
                    {invoices.length} {invoices.length === 1 ? 'Rechnung' : 'Rechnungen'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowScanner(true)} className="gap-2">
                  <Camera className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('invoice.scan', 'Scannen')}</span>
                </Button>
                <Button onClick={() => setShowAddDialog(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  {t('finance.addInvoice', 'Rechnung hinzufügen')}
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Content */}
          <div className="flex-1 overflow-y-auto py-6 space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-muted">
                      <FileText className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">
                        {t('finance.totalInvoices', 'Rechnungen gesamt')}
                      </p>
                      <p className="text-3xl font-bold">{formatAmount(totalAmount)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30">
                      <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">
                        {t('finance.openAmount', 'Offener Betrag')}
                      </p>
                      <p className="text-3xl font-bold text-red-600">{formatAmount(openAmount)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">
                        {t('finance.paidAmount', 'Bereits bezahlt')}
                      </p>
                      <p className="text-3xl font-bold text-green-600">{formatAmount(paidAmount)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Invoice List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {t('finance.invoiceList', 'Rechnungsliste')}
              </h3>

              {isLoading ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    {t('common.loading', 'Laden...')}
                  </CardContent>
                </Card>
              ) : invoices.length > 0 ? (
                <div className="space-y-3">
                  {invoices.map((invoice: any) => {
                    const statusConfig = getStatusConfig(invoice.status);
                    const StatusIcon = statusConfig.icon;
                    
                    return (
                      <Card 
                        key={invoice.id} 
                        className={`border-2 ${statusConfig.border} ${statusConfig.bg} hover:shadow-md transition-all`}
                      >
                        <CardContent className="py-5">
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            {/* Invoice Info */}
                            <div className="flex items-start gap-4 flex-1">
                              <div className={`p-3 rounded-xl ${statusConfig.bg}`}>
                                <StatusIcon className={`w-6 h-6 ${statusConfig.color}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <h4 className="font-semibold text-lg">{invoice.description}</h4>
                                  <Badge 
                                    variant="outline" 
                                    className={`${statusConfig.color} ${statusConfig.border}`}
                                  >
                                    {statusConfig.label}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4" />
                                    {formatDate(invoice.date)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Amount and Actions */}
                            <div className="flex items-center gap-4 lg:gap-6">
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Betrag</p>
                                <p className={`text-2xl font-bold ${invoice.status === 'paid' ? 'text-green-600' : 'text-foreground'}`}>
                                  {formatAmount(invoice.amount)}
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                <Select
                                  value={invoice.status}
                                  onValueChange={(value) => handleStatusChange(invoice.id, value)}
                                >
                                  <SelectTrigger className="w-[140px] h-10">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="open">
                                      <span className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-red-500" />
                                        {t('finance.open', 'Offen')}
                                      </span>
                                    </SelectItem>
                                    <SelectItem value="paid">
                                      <span className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-500" />
                                        {t('finance.paid', 'Bezahlt')}
                                      </span>
                                    </SelectItem>
                                    <SelectItem value="postponed">
                                      <span className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                                        {t('finance.postponed', 'Verschoben')}
                                      </span>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-10 w-10"
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
                                  className="h-10 w-10 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => setDeleteInvoiceId(invoice.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="border-2 border-dashed">
                  <CardContent className="py-16 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                      <FileText className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h4 className="text-lg font-semibold mb-2">
                      {t('finance.noInvoices', 'Noch keine Rechnungen erfasst')}
                    </h4>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      {t('finance.noInvoicesDescription', 'Fügen Sie die erste Rechnung hinzu, um den Überblick über offene Beträge zu behalten.')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button variant="outline" onClick={() => setShowScanner(true)} className="gap-2">
                        <Camera className="w-4 h-4" />
                        {t('invoice.scanInvoice', 'Rechnung scannen')}
                      </Button>
                      <Button onClick={() => setShowAddDialog(true)} className="gap-2">
                        <Plus className="w-4 h-4" />
                        {t('finance.addManually', 'Manuell hinzufügen')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Invoice Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">{t('finance.addInvoice', 'Neue Rechnung')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            {/* Image Preview */}
            {newInvoice.imageUrl && (
              <div className="relative">
                <img 
                  src={newInvoice.imageUrl} 
                  alt="Invoice" 
                  className="w-full h-40 object-cover rounded-xl border-2"
                />
                <Button 
                  variant="secondary" 
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => setNewInvoice({ ...newInvoice, imageUrl: '' })}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Main Fields */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">{t('finance.invoiceDescription', 'Beschreibung')} *</Label>
                <Input
                  value={newInvoice.description}
                  onChange={(e) => setNewInvoice({ ...newInvoice, description: e.target.value })}
                  placeholder={t('finance.descriptionPlaceholder', 'z.B. Miete, Strom, Versicherung...')}
                  className="mt-1.5 h-11"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">{t('finance.invoiceAmount', 'Betrag')} (CHF) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newInvoice.amount}
                    onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                    placeholder="0.00"
                    className="mt-1.5 h-11"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">{t('finance.invoiceDate', 'Datum')}</Label>
                  <Input
                    type="date"
                    value={newInvoice.date}
                    onChange={(e) => setNewInvoice({ ...newInvoice, date: e.target.value })}
                    className="mt-1.5 h-11"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">{t('finance.invoiceStatus', 'Status')}</Label>
                <Select
                  value={newInvoice.status}
                  onValueChange={(value) => setNewInvoice({ ...newInvoice, status: value })}
                >
                  <SelectTrigger className="mt-1.5 h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        {t('finance.open', 'Offen')}
                      </span>
                    </SelectItem>
                    <SelectItem value="paid">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        {t('finance.paid', 'Bezahlt')}
                      </span>
                    </SelectItem>
                    <SelectItem value="postponed">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                        {t('finance.postponed', 'Verschoben')}
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Payment Details (from QR scan) */}
            {(newInvoice.iban || newInvoice.reference || newInvoice.creditorName) && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-xl border">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <QrCode className="w-4 h-4" />
                  {t('invoice.paymentDetails', 'Zahlungsdetails')}
                </div>
                
                {newInvoice.creditorName && (
                  <div>
                    <p className="text-xs text-muted-foreground">{t('invoice.creditor', 'Empfänger')}</p>
                    <p className="text-sm font-medium">{newInvoice.creditorName}</p>
                    {newInvoice.creditorAddress && (
                      <p className="text-xs text-muted-foreground">{newInvoice.creditorAddress}</p>
                    )}
                  </div>
                )}

                {newInvoice.iban && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">IBAN</p>
                      <p className="text-sm font-mono">{newInvoice.iban}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyToClipboard(newInvoice.iban, 'IBAN')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {newInvoice.reference && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{t('invoice.reference', 'Referenz')}</p>
                      <p className="text-sm font-mono">{newInvoice.reference}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyToClipboard(newInvoice.reference, 'Referenz')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Scan Button */}
            <Button 
              variant="outline" 
              className="w-full h-11 gap-2" 
              onClick={() => {
                setShowAddDialog(false);
                setShowScanner(true);
              }}
            >
              <Camera className="w-4 h-4" />
              {t('invoice.scanInvoice', 'Rechnung scannen')}
            </Button>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              {t('common.cancel', 'Abbrechen')}
            </Button>
            <Button onClick={handleAddInvoice} className="gap-2">
              <Plus className="w-4 h-4" />
              {t('common.add', 'Hinzufügen')}
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
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl">{t('finance.editInvoice', 'Rechnung bearbeiten')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 py-4">
              <div>
                <Label className="text-sm font-medium">{t('finance.invoiceDescription', 'Beschreibung')} *</Label>
                <Input
                  value={editingInvoice.description}
                  onChange={(e) => setEditingInvoice({ ...editingInvoice, description: e.target.value })}
                  placeholder={t('finance.description')}
                  className="mt-1.5 h-11"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">{t('finance.invoiceAmount', 'Betrag')} (CHF) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingInvoice.amount}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, amount: e.target.value })}
                    placeholder="0.00"
                    className="mt-1.5 h-11"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">{t('finance.invoiceDate', 'Datum')}</Label>
                  <Input
                    type="date"
                    value={editingInvoice.date}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, date: e.target.value })}
                    className="mt-1.5 h-11"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setEditingInvoice(null)}>
                {t('common.cancel', 'Abbrechen')}
              </Button>
              <Button onClick={handleUpdateInvoice}>
                {t('common.save', 'Speichern')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Invoice Confirmation Dialog */}
      <AlertDialog open={!!deleteInvoiceId} onOpenChange={(open) => !open && setDeleteInvoiceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              {t('finance.confirmDeleteInvoiceTitle', 'Rechnung löschen?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('finance.confirmDeleteInvoiceDesc', 'Diese Rechnung wird dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Abbrechen')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteInvoice} className="bg-red-600 hover:bg-red-700">
              {t('common.delete', 'Löschen')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
