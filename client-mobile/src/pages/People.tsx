import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import MobileLayout from '@/components/MobileLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, Trash2, Edit2, Eye, Search, 
  Phone, Mail, Users, UserPlus, Home, Baby
} from 'lucide-react';
import { usePeople, createPerson, deletePerson, updatePerson } from '@/lib/firebaseHooks';
// Note: PersonInvoicesDialog needs to be created or imported from shared location
// For now, we'll comment it out and show a placeholder
import { toast } from 'sonner';

export default function MobilePeople() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'household' | 'external'>('household');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showInvoicesDialog, setShowInvoicesDialog] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [deletePersonId, setDeletePersonId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
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

  const householdPeople = useMemo(() => {
    return people.filter(p => !p.type || p.type === 'household' || p.type === 'child');
  }, [people]);

  const externalPeople = useMemo(() => {
    return people.filter(p => p.type === 'external');
  }, [people]);

  const calculateDebts = (personList: any[]) => {
    return personList.map(person => {
      const invoices = person.invoices || [];
      
      const incomingOpen = invoices
        .filter((inv: any) => (inv.direction === 'incoming' || !inv.direction) && (inv.status === 'open' || inv.status === 'postponed'))
        .reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);
      
      const incomingPaid = invoices
        .filter((inv: any) => (inv.direction === 'incoming' || !inv.direction) && inv.status === 'paid')
        .reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);
      
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

  const filterPeople = (peopleList: any[]) => {
    return peopleList.filter(person => {
      const matchesSearch = person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        person.phone?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesSearch;
    });
  };

  const filteredHousehold = useMemo(() => filterPeople(householdWithDebts), [householdWithDebts, searchQuery]);
  const filteredExternal = useMemo(() => filterPeople(externalWithDebts), [externalWithDebts, searchQuery]);

  const handleAddPerson = async () => {
    // Validate name
    const nameValidation = validateRequired(newPerson.name, 'Name');
    if (!nameValidation.valid) {
      toast.error(nameValidation.error || 'Bitte geben Sie einen Namen ein');
      return;
    }

    // Validate email if provided
    if (newPerson.email && newPerson.email.trim() !== '') {
      const emailValidation = validateEmail(newPerson.email);
      if (!emailValidation.valid) {
        toast.error(emailValidation.error || 'Ungültige E-Mail-Adresse');
        return;
      }
    }

    // Validate phone if provided
    if (newPerson.phone && newPerson.phone.trim() !== '') {
      const phoneValidation = validatePhone(newPerson.phone);
      if (!phoneValidation.valid) {
        toast.error(phoneValidation.error || 'Ungültige Telefonnummer');
        return;
      }
    }

    try {
      const personData: any = {
        name: newPerson.name,
        currency: newPerson.currency,
        type: newPerson.type,
        notes: newPerson.notes || null,
      };

      if (newPerson.type === 'child') {
        personData.email = null;
        personData.phone = null;
        personData.relationship = null;
      } else if (newPerson.type === 'external') {
        personData.email = newPerson.email || null;
        personData.phone = newPerson.phone || null;
        personData.relationship = newPerson.relationship;
      } else {
        personData.email = newPerson.email || null;
        personData.phone = newPerson.phone || null;
        personData.relationship = null;
      }

      await createPerson(personData);
      toast.success('Person hinzugefügt');
      setShowAddDialog(false);
      setNewPerson({
        name: '',
        email: '',
        phone: '',
        currency: 'CHF',
        type: 'household',
        relationship: 'both',
        notes: ''
      });
      await refetch();
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error adding person:', error);
      }
      toast.error('Fehler: ' + (error.message || 'Unbekannter Fehler'));
    }
  };

  const handleEditPerson = async () => {
    if (!selectedPerson || !newPerson.name) {
      toast.error('Bitte geben Sie einen Namen ein');
      return;
    }

    try {
      const personData: any = {
        name: newPerson.name,
        currency: newPerson.currency,
        type: newPerson.type,
        notes: newPerson.notes || null,
      };

      if (newPerson.type === 'child') {
        personData.email = null;
        personData.phone = null;
        personData.relationship = null;
      } else if (newPerson.type === 'external') {
        personData.email = newPerson.email || null;
        personData.phone = newPerson.phone || null;
        personData.relationship = newPerson.relationship;
      } else {
        personData.email = newPerson.email || null;
        personData.phone = newPerson.phone || null;
        personData.relationship = null;
      }

      await updatePerson(selectedPerson.id, personData);
      toast.success('Person aktualisiert');
      setShowEditDialog(false);
      setSelectedPerson(null);
      await refetch();
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error updating person:', error);
      }
      toast.error('Fehler: ' + (error.message || 'Unbekannter Fehler'));
    }
  };

  const handleDeletePerson = async () => {
    if (!deletePersonId) return;

    try {
      await deletePerson(deletePersonId);
      toast.success('Person gelöscht');
      setDeletePersonId(null);
      // No need to call refetch() - real-time listener (onSnapshot) will automatically update the UI
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error deleting person:', error);
      }
      toast.error('Fehler: ' + (error.message || 'Unbekannter Fehler'));
    }
  };

  const openEditDialog = (person: any) => {
    setSelectedPerson(person);
    setNewPerson({
      name: person.name || '',
      email: person.email || '',
      phone: person.phone || '',
      currency: person.currency || 'CHF',
      type: person.type || 'household',
      relationship: person.relationship || 'both',
      notes: person.notes || ''
    });
    setShowEditDialog(true);
  };

  const formatAmount = (amount: number) => {
    return `CHF ${(amount / 100).toFixed(2)}`;
  };

  const renderPersonCard = (person: any) => {
    const isChild = person.type === 'child';
    
    return (
      <Card key={person.id} className="mobile-card">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              isChild ? 'bg-purple-100 text-purple-600' : 'bg-primary/10 text-primary'
            }`}>
              {isChild ? <Baby className="w-5 h-5" /> : <Users className="w-5 h-5" />}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-sm">{person.name}</h3>
                {isChild && <Badge variant="outline" className="text-xs">Kind</Badge>}
              </div>
              
              {!isChild && (
                <div className="space-y-1 text-xs text-muted-foreground">
                  {person.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{person.email}</span>
                    </div>
                  )}
                  {person.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      <span>{person.phone}</span>
                    </div>
                  )}
                </div>
              )}
              
              {person.hasOpenInvoices && (
                <div className="mt-2 space-y-1">
                  {person.incomingOpen > 0 && (
                    <p className="text-xs text-green-600">
                      Forderungen: {formatAmount(person.incomingOpen)}
                    </p>
                  )}
                  {person.outgoingOpen > 0 && (
                    <p className="text-xs text-red-600">
                      Verbindlichkeiten: {formatAmount(person.outgoingOpen)}
                    </p>
                  )}
                </div>
              )}
              
              {person.invoiceCount > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {person.invoiceCount} Rechnung(en)
                </p>
              )}
              
              <div className="flex items-center gap-2 mt-3">
                {person.invoiceCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedPerson(person);
                      setShowInvoicesDialog(true);
                    }}
                    className="h-8 min-h-[44px] flex-1"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Rechnungen
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(person)}
                  className="h-8 min-h-[44px]"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeletePersonId(person.id)}
                  className="h-8 min-h-[44px] text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <MobileLayout title="Personen & Schulden" showSidebar={true}>
      {/* Search */}
      <div className="mobile-card mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 min-h-[44px]"
          />
        </div>
      </div>

      {/* Add Button */}
      <Button
        onClick={() => {
          setNewPerson({
            name: '',
            email: '',
            phone: '',
            currency: 'CHF',
            type: 'household',
            relationship: 'both',
            notes: ''
          });
          setShowAddDialog(true);
        }}
        className="w-full mb-4 h-12 min-h-[44px]"
      >
        <Plus className="w-5 h-5 mr-2" />
        Person hinzufügen
      </Button>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'household' | 'external')} className="mb-4">
        <TabsList className="grid w-full grid-cols-2 h-12 min-h-[44px]">
          <TabsTrigger value="household" className="h-10 min-h-[44px]">
            <Home className="w-4 h-4 mr-2" />
            Haushalt
          </TabsTrigger>
          <TabsTrigger value="external" className="h-10 min-h-[44px]">
            <Users className="w-4 h-4 mr-2" />
            Externe
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="household" className="mt-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Lädt...</div>
          ) : filteredHousehold.length === 0 ? (
            <div className="mobile-card text-center py-8">
              <p className="text-muted-foreground">Keine Personen gefunden</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHousehold.map(renderPersonCard)}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="external" className="mt-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Lädt...</div>
          ) : filteredExternal.length === 0 ? (
            <div className="mobile-card text-center py-8">
              <p className="text-muted-foreground">Keine Personen gefunden</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredExternal.map(renderPersonCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="!fixed !top-[50%] !left-[50%] !right-auto !bottom-auto !translate-x-[-50%] !translate-y-[-50%] !w-[85vw] !max-w-sm !max-h-fit !rounded-3xl !m-0 !overflow-visible !shadow-2xl">
          <DialogHeader className="px-5 pt-5 pb-3">
            <DialogTitle className="text-lg font-semibold">Person hinzufügen</DialogTitle>
            <DialogDescription className="sr-only">
              Erstellen Sie eine neue Person mit Name, E-Mail, Telefonnummer und optionalen Notizen
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 px-5 pb-2">
            <div>
              <Label>Name *</Label>
              <Input
                value={newPerson.name}
                onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })}
                placeholder="Name"
                className="h-10 min-h-[44px] mt-1"
              />
            </div>
            
            <div>
              <Label>Typ *</Label>
              <Select
                value={newPerson.type}
                onValueChange={(value: 'household' | 'external' | 'child') => 
                  setNewPerson({ ...newPerson, type: value })
                }
              >
                <SelectTrigger className="h-10 min-h-[44px] mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="household">Haushalt</SelectItem>
                  <SelectItem value="external">Externe Person</SelectItem>
                  <SelectItem value="child">Kind</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {newPerson.type !== 'child' && (
              <>
                <div>
                  <Label>E-Mail</Label>
                  <Input
                    type="email"
                    value={newPerson.email}
                    onChange={(e) => setNewPerson({ ...newPerson, email: e.target.value })}
                    placeholder="email@example.com"
                    className="h-10 min-h-[44px] mt-1"
                  />
                </div>
                
                <div>
                  <Label>Telefon</Label>
                  <Input
                    type="tel"
                    value={newPerson.phone}
                    onChange={(e) => setNewPerson({ ...newPerson, phone: e.target.value })}
                    placeholder="+41 XX XXX XX XX"
                    className="h-10 min-h-[44px] mt-1"
                  />
                </div>
              </>
            )}
            
            {newPerson.type === 'external' && (
              <div>
                <Label>Beziehung</Label>
                <Select
                  value={newPerson.relationship}
                  onValueChange={(value: 'creditor' | 'debtor' | 'both') => 
                    setNewPerson({ ...newPerson, relationship: value })
                  }
                >
                  <SelectTrigger className="h-10 min-h-[44px] mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Beides</SelectItem>
                    <SelectItem value="creditor">Gläubiger</SelectItem>
                    <SelectItem value="debtor">Schuldner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div>
              <Label>Währung</Label>
              <Select
                value={newPerson.currency}
                onValueChange={(value) => setNewPerson({ ...newPerson, currency: value })}
              >
                <SelectTrigger className="h-10 min-h-[44px] mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CHF">CHF</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Notizen</Label>
              <Textarea
                value={newPerson.notes}
                onChange={(e) => setNewPerson({ ...newPerson, notes: e.target.value })}
                placeholder="Notizen..."
                className="mt-1 min-h-[100px]"
              />
            </div>
          </div>
          
          <DialogFooter className="px-5 pb-3 pt-2 gap-2.5">
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="h-11 min-h-[44px] flex-1 rounded-xl text-sm font-medium">
              Abbrechen
            </Button>
            <Button onClick={handleAddPerson} className="h-10 min-h-[44px]">
              Hinzufügen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="!fixed !top-[50%] !left-[50%] !right-auto !bottom-auto !translate-x-[-50%] !translate-y-[-50%] !w-[85vw] !max-w-sm !max-h-fit !rounded-3xl !m-0 !overflow-visible !shadow-2xl">
          <DialogHeader className="px-5 pt-5 pb-3">
            <DialogTitle className="text-lg font-semibold">Person bearbeiten</DialogTitle>
            <DialogDescription className="sr-only">
              Bearbeiten Sie die Informationen der ausgewählten Person
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 px-5 pb-2">
            <div>
              <Label>Name *</Label>
              <Input
                value={newPerson.name}
                onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })}
                placeholder="Name"
                className="h-10 min-h-[44px] mt-1"
              />
            </div>
            
            <div>
              <Label>Typ *</Label>
              <Select
                value={newPerson.type}
                onValueChange={(value: 'household' | 'external' | 'child') => 
                  setNewPerson({ ...newPerson, type: value })
                }
              >
                <SelectTrigger className="h-10 min-h-[44px] mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="household">Haushalt</SelectItem>
                  <SelectItem value="external">Externe Person</SelectItem>
                  <SelectItem value="child">Kind</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {newPerson.type !== 'child' && (
              <>
                <div>
                  <Label>E-Mail</Label>
                  <Input
                    type="email"
                    value={newPerson.email}
                    onChange={(e) => setNewPerson({ ...newPerson, email: e.target.value })}
                    placeholder="email@example.com"
                    className="h-10 min-h-[44px] mt-1"
                  />
                </div>
                
                <div>
                  <Label>Telefon</Label>
                  <Input
                    type="tel"
                    value={newPerson.phone}
                    onChange={(e) => setNewPerson({ ...newPerson, phone: e.target.value })}
                    placeholder="+41 XX XXX XX XX"
                    className="h-10 min-h-[44px] mt-1"
                  />
                </div>
              </>
            )}
            
            {newPerson.type === 'external' && (
              <div>
                <Label>Beziehung</Label>
                <Select
                  value={newPerson.relationship}
                  onValueChange={(value: 'creditor' | 'debtor' | 'both') => 
                    setNewPerson({ ...newPerson, relationship: value })
                  }
                >
                  <SelectTrigger className="h-10 min-h-[44px] mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Beides</SelectItem>
                    <SelectItem value="creditor">Gläubiger</SelectItem>
                    <SelectItem value="debtor">Schuldner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div>
              <Label>Währung</Label>
              <Select
                value={newPerson.currency}
                onValueChange={(value) => setNewPerson({ ...newPerson, currency: value })}
              >
                <SelectTrigger className="h-10 min-h-[44px] mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CHF">CHF</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Notizen</Label>
              <Textarea
                value={newPerson.notes}
                onChange={(e) => setNewPerson({ ...newPerson, notes: e.target.value })}
                placeholder="Notizen..."
                className="mt-1 min-h-[100px]"
              />
            </div>
          </div>
          
          <DialogFooter className="px-5 pb-3 pt-2 gap-2.5">
            <Button variant="outline" onClick={() => setShowEditDialog(false)} className="h-11 min-h-[44px] flex-1 rounded-xl text-sm font-medium">
              Abbrechen
            </Button>
            <Button onClick={handleEditPerson} className="h-11 min-h-[44px] flex-1 rounded-xl text-sm font-medium">
              Aktualisieren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      {deletePersonId && (
        <Dialog open={!!deletePersonId} onOpenChange={() => setDeletePersonId(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Person löschen?</DialogTitle>
              <DialogDescription className="sr-only">
                Bestätigen Sie das Löschen dieser Person. Diese Aktion kann nicht rückgängig gemacht werden.
              </DialogDescription>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Möchten Sie diese Person wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <DialogFooter className="px-5 pb-3 pt-2 gap-2.5">
              <Button 
                variant="outline" 
                onClick={() => setDeletePersonId(null)}
                className="h-11 min-h-[44px] flex-1 rounded-xl text-sm font-medium"
              >
                Abbrechen
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeletePerson}
                className="h-11 min-h-[44px] flex-1 rounded-xl text-sm font-medium"
              >
                Löschen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Invoices Dialog - Feature Flag: PersonInvoicesDialog for mobile */}
      {/* NOTE: This feature is planned for a future release. Currently, person invoices can be managed via the web version. */}
      {selectedPerson && showInvoicesDialog && (
        <Dialog open={showInvoicesDialog} onOpenChange={setShowInvoicesDialog}>
          <DialogContent className="!fixed !top-[50%] !left-[50%] !right-auto !bottom-auto !translate-x-[-50%] !translate-y-[-50%] !w-[85vw] !max-w-sm !max-h-fit !rounded-3xl !m-0 !overflow-visible !shadow-2xl">
            <DialogHeader className="px-5 pt-5 pb-3">
              <DialogTitle className="text-lg font-semibold">Rechnungen - {selectedPerson.name}</DialogTitle>
              <DialogDescription className="sr-only">
                Verwalten Sie Rechnungen für diese Person
              </DialogDescription>
            </DialogHeader>
            <div className="px-5 pb-2">
              <p className="text-sm text-muted-foreground">
                Die Rechnungsverwaltung wird in einer zukünftigen Version verfügbar sein.
              </p>
            </div>
            <DialogFooter className="px-5 pb-3 pt-2">
              <Button variant="outline" onClick={() => setShowInvoicesDialog(false)} className="h-11 min-h-[44px] w-full rounded-xl text-sm font-medium">
                Schliessen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </MobileLayout>
  );
}

