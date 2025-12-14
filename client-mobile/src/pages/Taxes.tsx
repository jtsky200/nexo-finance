import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MobileLayout from '@/components/MobileLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Plus, MoreVertical, Edit, Trash2, FileText, Calculator, Users, Wallet
} from 'lucide-react';
import { useTaxProfiles, createTaxProfile, updateTaxProfile, deleteTaxProfile, TaxProfile } from '@/lib/firebaseHooks';
import { toast } from 'sonner';
// Note: AddTaxProfileDialog needs to be created or imported from shared location
// For now, we'll create a simplified inline version

const swissCantons: Record<string, string> = {
  'ZH': 'Zürich',
  'BE': 'Bern',
  'LU': 'Luzern',
  'UR': 'Uri',
  'SZ': 'Schwyz',
  'OW': 'Obwalden',
  'NW': 'Nidwalden',
  'GL': 'Glarus',
  'ZG': 'Zug',
  'FR': 'Freiburg',
  'SO': 'Solothurn',
  'BS': 'Basel-Stadt',
  'BL': 'Basel-Landschaft',
  'SH': 'Schaffhausen',
  'AR': 'Appenzell Ausserrhoden',
  'AI': 'Appenzell Innerrhoden',
  'SG': 'St. Gallen',
  'GR': 'Graubünden',
  'AG': 'Aargau',
  'TG': 'Thurgau',
  'TI': 'Tessin',
  'VD': 'Waadt',
  'VS': 'Wallis',
  'NE': 'Neuenburg',
  'GE': 'Genf',
  'JU': 'Jura',
};

export default function MobileTaxes() {
  const { t } = useTranslation();
  const [refreshKey, setRefreshKey] = useState(0);
  const { data: profiles, isLoading, error } = useTaxProfiles(refreshKey);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editProfile, setEditProfile] = useState<TaxProfile | null>(null);
  const [deleteProfileId, setDeleteProfileId] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'unvollständig':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          Unvollständig
        </Badge>;
      case 'vollständig':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          Vollständig
        </Badge>;
      case 'eingereicht':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Eingereicht
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
    }).format(amount);
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('de-CH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return '-';
    }
  };

  const handleDelete = async () => {
    if (!deleteProfileId) return;

    try {
      await deleteTaxProfile(deleteProfileId);
      toast.success('Steuerprofil gelöscht');
      setDeleteProfileId(null);
      setRefreshKey(prev => prev + 1);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error deleting tax profile:', error);
      }
      toast.error('Fehler: ' + (error.message || 'Unbekannter Fehler'));
    }
  };

  const handleEdit = (profile: TaxProfile) => {
    setEditProfile(profile);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditProfile(null);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditProfile(null);
    setRefreshKey(prev => prev + 1);
  };

  if (error) {
    return (
      <MobileLayout title="Steuern" showSidebar={true}>
        <div className="mobile-card text-center py-8">
          <p className="text-red-500">Fehler beim Laden der Steuerprofile</p>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="Steuern" showSidebar={true}>
      {/* Add Button */}
      <Button
        onClick={handleAdd}
        className="w-full mb-4 h-12 min-h-[44px]"
      >
        <Plus className="w-5 h-5 mr-2" />
        Steuerprofil hinzufügen
      </Button>

      {/* Profiles List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Lädt...</div>
      ) : !profiles || profiles.length === 0 ? (
        <div className="mobile-card text-center py-8">
          <p className="text-muted-foreground">Keine Steuerprofile gefunden</p>
          <p className="text-sm text-muted-foreground mt-2">
            Erstellen Sie ein neues Steuerprofil, um Ihre Steuern zu verwalten
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {profiles.map((profile) => (
            <Card key={profile.id} className="mobile-card">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">
                          {profile.year} - {profile.canton ? swissCantons[profile.canton] || profile.canton : 'Schweiz'}
                        </h3>
                        {profile.status && getStatusBadge(profile.status)}
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {profile.taxableIncome !== null && profile.taxableIncome !== undefined && (
                        <div className="flex items-center gap-2">
                          <Wallet className="w-3 h-3" />
                          <span>Einkommen: {formatCurrency(profile.taxableIncome)}</span>
                        </div>
                      )}
                      
                      {profile.taxAmount !== null && profile.taxAmount !== undefined && (
                        <div className="flex items-center gap-2">
                          <Calculator className="w-3 h-3" />
                          <span>Steuerbetrag: {formatCurrency(profile.taxAmount)}</span>
                        </div>
                      )}
                      
                      {profile.submissionDate && (
                        <div className="flex items-center gap-2">
                          <span>Eingereicht: {formatDate(profile.submissionDate)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(profile)}
                        className="h-8 min-h-[44px] flex-1"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Bearbeiten
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteProfileId(profile.id)}
                        className="h-8 min-h-[44px] text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog - Feature Flag: AddTaxProfileDialog for mobile */}
      {/* NOTE: This feature is planned for a future release. Currently, tax profiles can be managed via the web version. */}
      {isDialogOpen && (
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogContent className="!fixed !top-[50%] !left-[50%] !right-auto !bottom-auto !translate-x-[-50%] !translate-y-[-50%] !w-[85vw] !max-w-sm !max-h-fit !rounded-3xl !m-0 !overflow-visible !shadow-2xl">
            <DialogHeader className="px-5 pt-5 pb-3">
              <DialogTitle>
                {editProfile ? 'Steuerprofil bearbeiten' : 'Neues Steuerprofil'}
              </DialogTitle>
            </DialogHeader>
            <div className="px-5 pb-2">
              <p className="text-sm text-muted-foreground">
                Die Steuerprofil-Verwaltung wird in einer zukünftigen Version verfügbar sein. 
                Bitte verwenden Sie die Web-Version für die Verwaltung von Steuerprofilen.
              </p>
            </div>
            <DialogFooter className="px-5 pb-3 pt-2">
              <Button variant="outline" onClick={handleDialogClose} className="h-11 min-h-[44px] w-full rounded-xl text-sm font-medium">
                Schließen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      {deleteProfileId && (
        <Dialog open={!!deleteProfileId} onOpenChange={() => setDeleteProfileId(null)}>
          <DialogContent className="!fixed !top-[50%] !left-[50%] !right-auto !bottom-auto !translate-x-[-50%] !translate-y-[-50%] !w-[85vw] !max-w-sm !max-h-fit !rounded-3xl !m-0 !overflow-visible !shadow-2xl">
            <DialogHeader className="px-5 pt-5 pb-3">
              <DialogTitle className="text-lg font-semibold">Steuerprofil löschen?</DialogTitle>
            </DialogHeader>
            <div className="px-5 pb-2">
              <p className="text-sm text-muted-foreground">
                Möchten Sie dieses Steuerprofil wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
            </div>
            <DialogFooter className="px-5 pb-3 pt-2 gap-2.5">
              <Button 
                variant="outline" 
                onClick={() => setDeleteProfileId(null)}
                className="h-11 min-h-[44px] flex-1 rounded-xl text-sm font-medium"
              >
                Abbrechen
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                className="h-11 min-h-[44px] flex-1 rounded-xl text-sm font-medium"
              >
                Löschen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </MobileLayout>
  );
}

