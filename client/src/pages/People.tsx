import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, Users, Trash2, Edit2, Eye, Search, 
  Phone, Mail, CreditCard, AlertCircle, CheckCircle2,
  Clock, ArrowUpRight, ArrowDownRight, Filter, MoreVertical,
  Camera, FileText
} from 'lucide-react';
import { usePeople, usePersonDebts, createPerson, deletePerson, updatePerson } from '@/lib/firebaseHooks';
import PersonInvoicesDialog from '@/components/PersonInvoicesDialog';
import { toast } from 'sonner';

export default function People() {
  const { t } = useTranslation();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showInvoicesDialog, setShowInvoicesDialog] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [deletePersonId, setDeletePersonId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'withDebt' | 'noDebt'>('all');
  
  const [newPerson, setNewPerson] = useState({
    name: '',
    email: '',
    phone: '',
    currency: 'CHF',
    notes: ''
  });

  const { data: people = [], isLoading, refetch } = usePeople();

  // Get debts for all people
  const peopleWithDebts = useMemo(() => {
    return people.map(person => {
      const totalDebt = person.invoices?.reduce((sum: number, inv: any) => {
        if (inv.status === 'open' || inv.status === 'postponed') {
          return sum + (inv.amount || 0);
        }
        return sum;
      }, 0) || 0;
      
      const totalPaid = person.invoices?.reduce((sum: number, inv: any) => {
        if (inv.status === 'paid') {
          return sum + (inv.amount || 0);
        }
        return sum;
      }, 0) || 0;

      return {
        ...person,
        totalDebt,
        totalPaid,
        invoiceCount: person.invoices?.length || 0,
        hasOpenInvoices: totalDebt > 0
      };
    });
  }, [people]);

  // Filter and search
  const filteredPeople = useMemo(() => {
    return peopleWithDebts.filter(person => {
      // Search filter
      const matchesSearch = person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.phone?.includes(searchQuery);
      
      // Status filter
      const matchesStatus = 
        filterStatus === 'all' ||
        (filterStatus === 'withDebt' && person.hasOpenInvoices) ||
        (filterStatus === 'noDebt' && !person.hasOpenInvoices);

      return matchesSearch && matchesStatus;
    });
  }, [peopleWithDebts, searchQuery, filterStatus]);

  // Statistics
  const stats = useMemo(() => {
    const totalOpenDebt = peopleWithDebts.reduce((sum, p) => sum + p.totalDebt, 0);
    const totalPaid = peopleWithDebts.reduce((sum, p) => sum + p.totalPaid, 0);
    const peopleWithOpenDebt = peopleWithDebts.filter(p => p.hasOpenInvoices).length;
    
    return {
      totalPeople: people.length,
      totalOpenDebt,
      totalPaid,
      peopleWithOpenDebt
    };
  }, [peopleWithDebts, people]);

  const formatAmount = (amount: number) => {
    return `CHF ${(amount / 100).toFixed(2)}`;
  };

  const handleAddPerson = async () => {
    if (!newPerson.name.trim()) {
      toast.error(t('people.nameRequired', 'Name ist erforderlich'));
      return;
    }

    try {
      await createPerson({
        name: newPerson.name.trim(),
        email: newPerson.email.trim(),
        phone: newPerson.phone.trim(),
        currency: newPerson.currency,
      });
      
      toast.success(t('people.personAdded', 'Person hinzugefügt'));
      setNewPerson({ name: '', email: '', phone: '', currency: 'CHF', notes: '' });
      setShowAddDialog(false);
      refetch();
    } catch (error: any) {
      toast.error(t('common.error') + ': ' + error.message);
    }
  };

  const handleEditPerson = async () => {
    if (!selectedPerson || !selectedPerson.name.trim()) {
      toast.error(t('people.nameRequired', 'Name ist erforderlich'));
      return;
    }

    try {
      await updatePerson(selectedPerson.id, {
        name: selectedPerson.name.trim(),
        email: selectedPerson.email?.trim() || '',
        phone: selectedPerson.phone?.trim() || '',
      });
      
      toast.success(t('people.personUpdated', 'Person aktualisiert'));
      setShowEditDialog(false);
      setSelectedPerson(null);
      refetch();
    } catch (error: any) {
      toast.error(t('common.error') + ': ' + error.message);
    }
  };

  const handleDeletePerson = async () => {
    if (!deletePersonId) return;

    try {
      await deletePerson(deletePersonId);
      toast.success(t('people.personDeleted', 'Person gelöscht'));
      setDeletePersonId(null);
      refetch();
    } catch (error: any) {
      toast.error(t('common.error') + ': ' + error.message);
    }
  };

  const openInvoices = (person: any) => {
    setSelectedPerson(person);
    setShowInvoicesDialog(true);
  };

  const openEdit = (person: any) => {
    setSelectedPerson({ ...person });
    setShowEditDialog(true);
  };

  return (
    <Layout title={t('people.title', 'Personen & Schulden')}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-muted-foreground">
              {t('people.description', 'Verwalten Sie Personen und deren Rechnungen')}
            </p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            {t('people.addPerson', 'Person hinzufügen')}
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('people.totalPeople', 'Personen')}</p>
                  <p className="text-2xl font-bold">{stats.totalPeople}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('people.openDebts', 'Offene Schulden')}</p>
                  <p className="text-2xl font-bold text-red-600">{formatAmount(stats.totalOpenDebt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('people.totalPaid', 'Bezahlt')}</p>
                  <p className="text-2xl font-bold text-green-600">{formatAmount(stats.totalPaid)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('people.withOpenDebt', 'Mit Schulden')}</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.peopleWithOpenDebt}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t('people.searchPlaceholder', 'Name, E-Mail oder Telefon suchen...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('people.filterAll', 'Alle Personen')}</SelectItem>
                  <SelectItem value="withDebt">{t('people.filterWithDebt', 'Mit offenen Schulden')}</SelectItem>
                  <SelectItem value="noDebt">{t('people.filterNoDebt', 'Ohne Schulden')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* People List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                {t('common.loading', 'Laden...')}
              </CardContent>
            </Card>
          ) : filteredPeople.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery || filterStatus !== 'all' 
                    ? t('people.noResults', 'Keine Personen gefunden')
                    : t('people.noPeople', 'Noch keine Personen vorhanden')}
                </p>
                {!searchQuery && filterStatus === 'all' && (
                  <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t('people.addFirstPerson', 'Erste Person hinzufügen')}
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredPeople.map((person) => (
                <Card key={person.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Person Info */}
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-lg font-semibold text-primary">
                            {person.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-lg">{person.name}</h3>
                            {person.hasOpenInvoices ? (
                              <Badge variant="destructive" className="text-xs">
                                {t('people.hasDebt', 'Offene Schulden')}
                              </Badge>
                            ) : person.invoiceCount > 0 ? (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                {t('people.allPaid', 'Alles bezahlt')}
                              </Badge>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                            {person.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3.5 h-3.5" />
                                {person.email}
                              </span>
                            )}
                            {person.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5" />
                                {person.phone}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5" />
                              {person.invoiceCount} {t('people.invoices', 'Rechnungen')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Amounts */}
                      <div className="flex items-center gap-6 lg:gap-8">
                        {person.totalDebt > 0 && (
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">{t('people.open', 'Offen')}</p>
                            <p className="text-lg font-semibold text-red-600">
                              {formatAmount(person.totalDebt)}
                            </p>
                          </div>
                        )}
                        {person.totalPaid > 0 && (
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">{t('people.paid', 'Bezahlt')}</p>
                            <p className="text-lg font-semibold text-green-600">
                              {formatAmount(person.totalPaid)}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openInvoices(person)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          {t('people.viewInvoices', 'Details')}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openEdit(person)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeletePersonId(person.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Person Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('people.addPerson', 'Person hinzufügen')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('people.name', 'Name')} *</Label>
              <Input
                value={newPerson.name}
                onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })}
                placeholder={t('people.namePlaceholder', 'Max Mustermann')}
              />
            </div>
            <div>
              <Label>{t('people.email', 'E-Mail')}</Label>
              <Input
                type="email"
                value={newPerson.email}
                onChange={(e) => setNewPerson({ ...newPerson, email: e.target.value })}
                placeholder="max@example.com"
              />
            </div>
            <div>
              <Label>{t('people.phone', 'Telefon')}</Label>
              <Input
                value={newPerson.phone}
                onChange={(e) => setNewPerson({ ...newPerson, phone: e.target.value })}
                placeholder="+41 79 123 45 67"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              {t('common.cancel', 'Abbrechen')}
            </Button>
            <Button onClick={handleAddPerson}>
              {t('common.add', 'Hinzufügen')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Person Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('people.editPerson', 'Person bearbeiten')}</DialogTitle>
          </DialogHeader>
          {selectedPerson && (
            <div className="space-y-4">
              <div>
                <Label>{t('people.name', 'Name')} *</Label>
                <Input
                  value={selectedPerson.name}
                  onChange={(e) => setSelectedPerson({ ...selectedPerson, name: e.target.value })}
                />
              </div>
              <div>
                <Label>{t('people.email', 'E-Mail')}</Label>
                <Input
                  type="email"
                  value={selectedPerson.email || ''}
                  onChange={(e) => setSelectedPerson({ ...selectedPerson, email: e.target.value })}
                />
              </div>
              <div>
                <Label>{t('people.phone', 'Telefon')}</Label>
                <Input
                  value={selectedPerson.phone || ''}
                  onChange={(e) => setSelectedPerson({ ...selectedPerson, phone: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              {t('common.cancel', 'Abbrechen')}
            </Button>
            <Button onClick={handleEditPerson}>
              {t('common.save', 'Speichern')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Person Invoices Dialog */}
      {selectedPerson && (
        <PersonInvoicesDialog
          person={selectedPerson}
          open={showInvoicesDialog}
          onOpenChange={setShowInvoicesDialog}
        />
      )}

      {/* Delete Person Confirmation */}
      <AlertDialog open={!!deletePersonId} onOpenChange={(open) => !open && setDeletePersonId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('people.deleteTitle', 'Person löschen?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('people.deleteDescription', 'Diese Person und alle zugehörigen Rechnungen werden dauerhaft gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Abbrechen')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePerson} className="bg-red-600 hover:bg-red-700">
              {t('common.delete', 'Löschen')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}

