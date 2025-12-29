import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, Trash2, Edit2, Eye, Search, 
  Phone, Mail, Filter, FileText, Users, UserPlus, Building2,
  ArrowDownLeft, ArrowUpRight, Home, Baby
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { usePeople, createPerson, deletePerson, updatePerson } from '@/lib/firebaseHooks';
import PersonInvoicesDialog from '@/components/PersonInvoicesDialog';
import { toast } from 'sonner';
import ContextMenu from '@/components/ContextMenu';

export default function People() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'household' | 'external'>('household');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showInvoicesDialog, setShowInvoicesDialog] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [deletePersonId, setDeletePersonId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const [newPerson, setNewPerson] = useState({
    name: '',
    email: '',
    phone: '',
    currency: 'CHF',
    type: 'household' as 'household' | 'external' | 'child',
    relationship: 'both' as 'creditor' | 'debtor' | 'both',
    notes: ''
  });

  const { data: people = [], isLoading, refetch } = usePeople();

  // Separate people by type (children are part of household)
  const householdPeople = useMemo(() => {
    return people.filter(p => !p.type || p.type === 'household' || p.type === 'child');
  }, [people]);

  const externalPeople = useMemo(() => {
    return people.filter(p => p.type === 'external');
  }, [people]);

  // Calculate debts for people
  const calculateDebts = (personList: any[]) => {
    return personList.map(person => {
      const invoices = person.invoices || [];
      
      // Incoming = Person schuldet mir (Forderungen)
      const incomingOpen = invoices
        .filter((inv: any) => (inv.direction === 'incoming' || !inv.direction) && (inv.status === 'open' || inv.status === 'postponed'))
        .reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);
      
      const incomingPaid = invoices
        .filter((inv: any) => (inv.direction === 'incoming' || !inv.direction) && inv.status === 'paid')
        .reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);
      
      // Outgoing = Ich schulde Person (Verbindlichkeiten)
      const outgoingOpen = invoices
        .filter((inv: any) => inv.direction === 'outgoing' && (inv.status === 'open' || inv.status === 'postponed'))
        .reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);
      
      const outgoingPaid = invoices
        .filter((inv: any) => inv.direction === 'outgoing' && inv.status === 'paid')
        .reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);

      return {
        ...person,
        incomingOpen,
        incomingPaid,
        outgoingOpen,
        outgoingPaid,
        totalOpen: incomingOpen + outgoingOpen,
        totalPaid: incomingPaid + outgoingPaid,
        invoiceCount: invoices.length,
        hasOpenInvoices: incomingOpen > 0 || outgoingOpen > 0
      };
    });
  };

  const householdWithDebts = useMemo(() => calculateDebts(householdPeople), [householdPeople]);
  const externalWithDebts = useMemo(() => calculateDebts(externalPeople), [externalPeople]);

  // Filter people
  const filterPeople = (peopleList: any[]) => {
    return peopleList.filter(person => {
      const matchesSearch = person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.phone?.includes(searchQuery);
      
      let matchesStatus = true;
      if (filterStatus === 'withDebt') matchesStatus = person.hasOpenInvoices;
      if (filterStatus === 'noDebt') matchesStatus = !person.hasOpenInvoices;
      if (filterStatus === 'creditor') matchesStatus = person.relationship === 'creditor' || person.relationship === 'both';
      if (filterStatus === 'debtor') matchesStatus = person.relationship === 'debtor' || person.relationship === 'both';

      return matchesSearch && matchesStatus;
    });
  };

  const filteredHousehold = useMemo(() => filterPeople(householdWithDebts), [householdWithDebts, searchQuery, filterStatus]);
  const filteredExternal = useMemo(() => filterPeople(externalWithDebts), [externalWithDebts, searchQuery, filterStatus]);

  // Statistics
  const householdStats = useMemo(() => ({
    total: householdPeople.length,
    openDebts: householdWithDebts.reduce((sum, p) => sum + p.incomingOpen, 0),
    paid: householdWithDebts.reduce((sum, p) => sum + p.incomingPaid, 0),
    withDebts: householdWithDebts.filter(p => p.hasOpenInvoices).length
  }), [householdPeople, householdWithDebts]);

  const externalStats = useMemo(() => ({
    total: externalPeople.length,
    theyOweMe: externalWithDebts.reduce((sum, p) => sum + p.incomingOpen, 0), // Forderungen
    iOweThem: externalWithDebts.reduce((sum, p) => sum + p.outgoingOpen, 0), // Verbindlichkeiten
    balance: externalWithDebts.reduce((sum, p) => sum + p.incomingOpen - p.outgoingOpen, 0)
  }), [externalPeople, externalWithDebts]);

  const formatAmount = (amount: number) => `CHF ${(amount / 100).toFixed(2)}`;

  const handleAddPerson = async () => {
    if (!newPerson.name.trim()) {
      toast.error(t('people.errors.nameRequired', 'Name ist erforderlich'));
      return;
    }

    try {
      await createPerson({
        name: newPerson.name.trim(),
        email: newPerson.type === 'child' ? null : (newPerson.email.trim() || null),
        phone: newPerson.type === 'child' ? null : (newPerson.phone.trim() || null),
        currency: newPerson.currency,
        type: newPerson.type,
        relationship: newPerson.type === 'external' ? newPerson.relationship : null,
        notes: newPerson.notes.trim() || null,
      });
      
      toast.success(newPerson.type === 'child' ? t('people.childAdded', 'Kind hinzugefügt') : t('people.personAdded', 'Person hinzugefügt'));
      setNewPerson({ name: '', email: '', phone: '', currency: 'CHF', type: 'household', relationship: 'both', notes: '' });
      setShowAddDialog(false);
      refetch();
    } catch (error: any) {
      toast.error(t('common.error', 'Fehler') + ': ' + error.message);
    }
  };

  const handleEditPerson = async () => {
    if (!selectedPerson || !selectedPerson.name.trim()) {
      toast.error(t('people.errors.nameRequired', 'Name ist erforderlich'));
      return;
    }

    try {
      await updatePerson(selectedPerson.id, {
        name: selectedPerson.name.trim(),
        email: selectedPerson.type === 'child' ? null : (selectedPerson.email?.trim() || null),
        phone: selectedPerson.type === 'child' ? null : (selectedPerson.phone?.trim() || null),
        type: selectedPerson.type,
        relationship: selectedPerson.type === 'external' ? selectedPerson.relationship : null,
        notes: selectedPerson.notes?.trim() || '',
      });
      
      toast.success(t('people.personUpdated', 'Person aktualisiert'));
      setShowEditDialog(false);
      setSelectedPerson(null);
      refetch();
    } catch (error: any) {
      toast.error(t('common.error', 'Fehler') + ': ' + error.message);
    }
  };

  const handleDeletePerson = async () => {
    if (!deletePersonId) return;

    try {
      await deletePerson(deletePersonId);
      toast.success(t('people.personDeleted', 'Person gelöscht'));
      setDeletePersonId(null);
      // No need to call refetch() - real-time listener (onSnapshot) will automatically update the UI
    } catch (error: any) {
      toast.error(t('common.error', 'Fehler') + ': ' + error.message);
    }
  };

  const openAddDialog = (type: 'household' | 'external' | 'child') => {
    setNewPerson({ ...newPerson, type });
    setShowAddDialog(true);
  };

  const openEditDialog = (person: any) => {
    setSelectedPerson({ ...person });
    setShowEditDialog(true);
  };

  const renderPersonCard = (person: any, isExternal: boolean) => {
    // Build context menu actions
    const contextMenuActions = [
      {
        id: 'view',
        label: t('common.details', 'Details'),
        icon: <Eye className="w-4 h-4" />,
        onClick: () => {
          setSelectedPerson(person);
          setShowInvoicesDialog(true);
        },
      },
      {
        id: 'edit',
        label: t('common.edit', 'Bearbeiten'),
        icon: <Edit2 className="w-4 h-4" />,
        onClick: () => openEditDialog(person),
      },
      {
        id: 'delete',
        label: t('common.delete', 'Löschen'),
        icon: <Trash2 className="w-4 h-4" />,
        onClick: () => setDeletePersonId(person.id),
        variant: 'destructive' as const,
      },
    ];

    return (
      <ContextMenu key={person.id} actions={contextMenuActions}>
        <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-semibold">
              {person.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{person.name}</h3>
                {person.type === 'child' && (
                  <Badge variant="outline" className="text-xs border-purple-300 text-purple-700">
                    <Baby className="w-3 h-3 mr-1" />
                    {t('people.child', 'Kind')}
                  </Badge>
                )}
                {isExternal && person.relationship && (
                  <Badge variant="outline" className="text-xs">
                    {person.relationship === 'creditor' ? t('people.iOwe', 'Ich schulde') : 
                     person.relationship === 'debtor' ? t('people.owesMe', 'Schuldet mir') : t('people.relationships.both', 'Beides')}
                  </Badge>
                )}
                {person.hasOpenInvoices ? (
                  <Badge className="bg-red-500 text-white text-xs">{t('people.openDebts', 'Offene Schulden')}</Badge>
                ) : (
                  <Badge className="bg-green-500 text-white text-xs">{t('people.allPaid', 'Alles bezahlt')}</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                <FileText className="w-4 h-4 flex-shrink-0" />
                <span>
                  {person.invoiceCount} {person.invoiceCount === 1 ? t('people.invoice', 'Rechnung') : t('people.invoices', 'Rechnungen')}
                  {person.installmentPlanCount > 0 && (
                    <span className="text-primary font-medium ml-1">
                      ({person.installmentPlanCount} {t('people.inInstallments', 'in Raten')})
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {isExternal ? (
              <div className="text-right">
                {person.incomingOpen > 0 && (
                  <div className="flex items-center gap-1 text-green-600">
                    <ArrowDownLeft className="w-4 h-4" />
                    <span className="text-sm">{t('people.willReceive', 'Bekomme')}: {formatAmount(person.incomingOpen)}</span>
                  </div>
                )}
                {person.outgoingOpen > 0 && (
                  <div className="flex items-center gap-1 text-red-600">
                    <ArrowUpRight className="w-4 h-4" />
                    <span className="text-sm">{t('people.iOwe', 'Schulde')}: {formatAmount(person.outgoingOpen)}</span>
                  </div>
                )}
                {!person.hasOpenInvoices && (
                  <span className="text-sm text-muted-foreground">{t('people.noOpenAmounts', 'Keine offenen Beträge')}</span>
                )}
              </div>
            ) : (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{t('people.open', 'Offen')}</p>
                <p className={`font-bold ${person.incomingOpen > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatAmount(person.incomingOpen)}
                </p>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedPerson(person);
                  setShowInvoicesDialog(true);
                }}
              >
                <Eye className="w-4 h-4 mr-1" />
                {t('common.details', 'Details')}
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(person)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('common.edit', 'Bearbeiten')}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setDeletePersonId(person.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('common.delete', 'Löschen')}</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    </ContextMenu>
    );
  };

  return (
    <Layout title={t('people.title', 'Personen & Schulden')}>
      <div className="space-y-6">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <TabsList>
              <TabsTrigger value="household" className="gap-2">
                <Home className="w-4 h-4" />
                {t('people.household', 'Haushalt')} ({householdPeople.length})
              </TabsTrigger>
              <TabsTrigger value="external" className="gap-2">
                <Building2 className="w-4 h-4" />
                {t('people.external', 'Externe')} ({externalPeople.length})
              </TabsTrigger>
            </TabsList>
            
            <div className="flex gap-2">
              {activeTab === 'household' && (
                <Button variant="outline" onClick={() => openAddDialog('child')}>
                  <Baby className="w-4 h-4 mr-2" />
                  {t('people.addChild', 'Kind hinzufügen')}
                </Button>
              )}
              <Button onClick={() => openAddDialog(activeTab === 'household' ? 'household' : 'external')}>
                <UserPlus className="w-4 h-4 mr-2" />
                {activeTab === 'household' ? t('people.householdMember', 'Haushaltsmitglied') : t('people.externalPerson', 'Externe Person')}
              </Button>
            </div>
          </div>

          {/* Household Tab */}
          <TabsContent value="household" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-1">{t('people.members', 'Mitglieder')}</p>
                  <p className="text-2xl font-bold">{householdStats.total}</p>
                </CardContent>
              </Card>
              <Card className="border-red-200">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-1">{t('people.openInvoices', 'Offene Rechnungen')}</p>
                  <p className="text-2xl font-bold text-red-600">{formatAmount(householdStats.openDebts)}</p>
                </CardContent>
              </Card>
              <Card className="border-green-200">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-1">{t('people.paid', 'Bezahlt')}</p>
                  <p className="text-2xl font-bold text-green-600">{formatAmount(householdStats.paid)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-1">{t('people.withDebts', 'Mit Schulden')}</p>
                  <p className="text-2xl font-bold">{householdStats.withDebts}</p>
                </CardContent>
              </Card>
            </div>

            {/* Search & Filter */}
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
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('common.all', 'Alle')}</SelectItem>
                      <SelectItem value="withDebt">{t('people.withDebts', 'Mit Schulden')}</SelectItem>
                      <SelectItem value="noDebt">{t('people.withoutDebts', 'Ohne Schulden')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* People List */}
            {isLoading ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">{t('common.loading', 'Laden...')}</CardContent></Card>
            ) : filteredHousehold.length > 0 ? (
              <div className="space-y-3">
                {filteredHousehold.map(person => renderPersonCard(person, false))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || filterStatus !== 'all' 
                      ? t('people.noPeopleFound', 'Keine Personen gefunden')
                      : t('people.noHouseholdMembers', 'Noch keine Haushaltsmitglieder')}
                  </p>
                  <Button onClick={() => openAddDialog('household')}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    {t('people.addMember', 'Mitglied hinzufügen')}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* External Tab */}
          <TabsContent value="external" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-1">{t('people.externalPersons', 'Externe Personen')}</p>
                  <p className="text-2xl font-bold">{externalStats.total}</p>
                </CardContent>
              </Card>
              <Card className="border-green-200">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-1">{t('people.willReceiveClaims', 'Bekomme ich (Forderungen)')}</p>
                  <p className="text-2xl font-bold text-green-600">{formatAmount(externalStats.theyOweMe)}</p>
                </CardContent>
              </Card>
              <Card className="border-red-200">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-1">{t('people.iOweLiabilities', 'Schulde ich (Verbindlichkeiten)')}</p>
                  <p className="text-2xl font-bold text-red-600">{formatAmount(externalStats.iOweThem)}</p>
                </CardContent>
              </Card>
              <Card className={externalStats.balance >= 0 ? 'border-green-200' : 'border-red-200'}>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-1">{t('people.balance', 'Bilanz')}</p>
                  <p className={`text-2xl font-bold ${externalStats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {externalStats.balance >= 0 ? '+' : ''}{formatAmount(externalStats.balance)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Search & Filter */}
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
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('common.all', 'Alle')}</SelectItem>
                      <SelectItem value="debtor">{t('people.owesMe', 'Schulden mir')}</SelectItem>
                      <SelectItem value="creditor">{t('people.iOwe', 'Ich schulde')}</SelectItem>
                      <SelectItem value="withDebt">{t('people.withOpenAmounts', 'Mit offenen Beträgen')}</SelectItem>
                      <SelectItem value="noDebt">{t('people.allPaid', 'Alles bezahlt')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* People List */}
            {isLoading ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">{t('common.loading', 'Laden...')}</CardContent></Card>
            ) : filteredExternal.length > 0 ? (
              <div className="space-y-3">
                {filteredExternal.map(person => renderPersonCard(person, true))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Building2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || filterStatus !== 'all' 
                      ? t('people.noPeopleFound', 'Keine Personen gefunden')
                      : t('people.noExternalPersons', 'Noch keine externen Personen')}
                  </p>
                  <Button onClick={() => openAddDialog('external')}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    {t('people.addExternalPerson', 'Externe Person hinzufügen')}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Person Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {newPerson.type === 'household' ? t('people.addHouseholdMember', 'Haushaltsmitglied hinzufügen') : 
               newPerson.type === 'child' ? t('people.addChild', 'Kind hinzufügen') : 
               t('people.addExternalPerson', 'Externe Person hinzufügen')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('people.type', 'Typ')}</Label>
              <Select value={newPerson.type} onValueChange={(v: any) => setNewPerson({ ...newPerson, type: v })}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="household">
                    <span className="flex items-center gap-2">
                      <Home className="w-4 h-4" /> {t('people.types.household', 'Haushaltsmitglied')}
                    </span>
                  </SelectItem>
                  <SelectItem value="child">
                    <span className="flex items-center gap-2">
                      <Baby className="w-4 h-4" /> {t('people.types.child', 'Kind')}
                    </span>
                  </SelectItem>
                  <SelectItem value="external">
                    <span className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" /> {t('people.types.external', 'Externe Person')}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newPerson.type === 'external' && (
              <div>
                <Label>{t('people.relationship', 'Beziehung')}</Label>
                <Select value={newPerson.relationship} onValueChange={(v: any) => setNewPerson({ ...newPerson, relationship: v })}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debtor">
                      <span className="flex items-center gap-2">
                        <ArrowDownLeft className="w-4 h-4 text-green-600" /> {t('people.relationships.debtor', 'Schuldet mir Geld')}
                      </span>
                    </SelectItem>
                    <SelectItem value="creditor">
                      <span className="flex items-center gap-2">
                        <ArrowUpRight className="w-4 h-4 text-red-600" /> {t('people.relationships.creditor', 'Ich schulde Geld')}
                      </span>
                    </SelectItem>
                    <SelectItem value="both">
                      <span className="flex items-center gap-2">
                        {t('people.relationships.bothPossible', 'Beides möglich')}
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>{t('people.name', 'Name')} *</Label>
              <Input
                value={newPerson.name}
                onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })}
                placeholder={t('people.namePlaceholder', 'Name eingeben')}
                className="mt-2"
              />
            </div>

            {newPerson.type !== 'child' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('people.email', 'E-Mail')}</Label>
                  <Input
                    type="email"
                    value={newPerson.email}
                    onChange={(e) => setNewPerson({ ...newPerson, email: e.target.value })}
                    placeholder={t('people.emailPlaceholder', 'email@beispiel.ch')}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>{t('people.phone', 'Telefon')}</Label>
                  <Input
                    type="tel"
                    value={newPerson.phone}
                    onChange={(e) => setNewPerson({ ...newPerson, phone: e.target.value })}
                    placeholder="+41 79 123 45 67"
                    className="mt-2"
                  />
                </div>
              </div>
            )}

            <div>
              <Label>{t('people.notes', 'Notizen')}</Label>
              <Textarea
                value={newPerson.notes}
                onChange={(e) => setNewPerson({ ...newPerson, notes: e.target.value })}
                placeholder={t('people.notesPlaceholder', 'Optionale Notizen...')}
                className="mt-2"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>{t('common.cancel', 'Abbrechen')}</Button>
            <Button onClick={handleAddPerson}>{t('common.add', 'Hinzufügen')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Person Dialog */}
      {selectedPerson && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{t('people.editPerson', 'Person bearbeiten')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{t('people.type', 'Typ')}</Label>
                <Select value={selectedPerson.type || 'household'} onValueChange={(v: any) => setSelectedPerson({ ...selectedPerson, type: v })}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="household">
                      <span className="flex items-center gap-2">
                        <Home className="w-4 h-4" /> {t('people.types.household', 'Haushaltsmitglied')}
                      </span>
                    </SelectItem>
                    <SelectItem value="child">
                      <span className="flex items-center gap-2">
                        <Baby className="w-4 h-4" /> {t('people.types.child', 'Kind')}
                      </span>
                    </SelectItem>
                    <SelectItem value="external">
                      <span className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" /> {t('people.types.external', 'Externe Person')}
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedPerson.type === 'external' && (
                <div>
                  <Label>{t('people.relationship', 'Beziehung')}</Label>
                  <Select value={selectedPerson.relationship || 'both'} onValueChange={(v: any) => setSelectedPerson({ ...selectedPerson, relationship: v })}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debtor">{t('people.relationships.debtor', 'Schuldet mir Geld')}</SelectItem>
                      <SelectItem value="creditor">{t('people.relationships.creditor', 'Ich schulde Geld')}</SelectItem>
                      <SelectItem value="both">{t('people.relationships.bothPossible', 'Beides möglich')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>{t('people.name', 'Name')} *</Label>
                <Input
                  value={selectedPerson.name}
                  onChange={(e) => setSelectedPerson({ ...selectedPerson, name: e.target.value })}
                  className="mt-2"
                />
              </div>

              {selectedPerson.type !== 'child' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('people.email', 'E-Mail')}</Label>
                    <Input
                      type="email"
                      value={selectedPerson.email || ''}
                      onChange={(e) => setSelectedPerson({ ...selectedPerson, email: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>{t('people.phone', 'Telefon')}</Label>
                    <Input
                      type="tel"
                      value={selectedPerson.phone || ''}
                      onChange={(e) => setSelectedPerson({ ...selectedPerson, phone: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                </div>
              )}

              <div>
                <Label>{t('people.notes', 'Notizen')}</Label>
                <Textarea
                  value={selectedPerson.notes || ''}
                  onChange={(e) => setSelectedPerson({ ...selectedPerson, notes: e.target.value })}
                  className="mt-2"
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>{t('common.cancel', 'Abbrechen')}</Button>
              <Button onClick={handleEditPerson}>{t('common.save', 'Speichern')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Person Invoices Dialog */}
      {selectedPerson && (
        <PersonInvoicesDialog
          person={selectedPerson}
          open={showInvoicesDialog}
          onOpenChange={setShowInvoicesDialog}
          onDataChanged={refetch}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletePersonId} onOpenChange={(open) => !open && setDeletePersonId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('people.confirmDelete', 'Person löschen?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('people.confirmDeleteDescriptionWeb', 'Diese Person und alle zugehörigen Rechnungen werden dauerhaft gelöscht.')}
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
