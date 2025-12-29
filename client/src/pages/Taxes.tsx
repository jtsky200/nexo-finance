import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTaxProfiles, createTaxProfile, updateTaxProfile, deleteTaxProfile, TaxProfile } from '@/lib/firebaseHooks';
import AddTaxProfileDialog from '@/components/AddTaxProfileDialog';

import { useState } from 'react';

import { useTranslation } from 'react-i18next';

import { Plus, MoreVertical, Edit, Trash2, FileText, Calculator, Users, Wallet } from 'lucide-react';

import { toast } from 'sonner';

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

export default function Taxes() {
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
          {t('taxes.status.unvollständig')}
        </Badge>;
      case 'vollständig':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          {t('taxes.status.vollständig')}
        </Badge>;
      case 'eingereicht':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          {t('taxes.status.eingereicht')}
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

  const getMaritalStatusLabel = (status: string | null | undefined) => {
    if (!status) return '-';
    const labels: Record<string, string> = {
      'single': t('taxes.single', 'Ledig'),
      'married': t('taxes.married', 'Verheiratet'),
      'divorced': t('taxes.divorced', 'Geschieden'),
      'widowed': t('taxes.widowed', 'Verwitwet'),
      'registered_partnership': t('taxes.registeredPartnership', 'Eingetragene Partnerschaft'),
    };
    return labels[status] || status;
  };

  const handleCreateProfile = async (data: Partial<TaxProfile>) => {
    try {
      await createTaxProfile(data as any);
      toast.success(t('taxes.profileCreated', 'Steuerprofil erfolgreich erstellt'));
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      toast.error(t('taxes.errorCreating', 'Fehler beim Erstellen des Profils'));
    }
  };

  const handleUpdateProfile = async (data: Partial<TaxProfile>) => {
    if (!editProfile) return;
    try {
      await updateTaxProfile(editProfile.id, data);
      toast.success(t('taxes.profileUpdated', 'Steuerprofil erfolgreich aktualisiert'));
      setEditProfile(null);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      toast.error(t('taxes.errorUpdating', 'Fehler beim Aktualisieren des Profils'));
    }
  };

  const handleDeleteProfile = async () => {
    if (!deleteProfileId) return;
    try {
      await deleteTaxProfile(deleteProfileId);
      toast.success(t('taxes.profileDeleted', 'Steuerprofil erfolgreich gelöscht'));
      setDeleteProfileId(null);
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      toast.error(t('taxes.errorDeleting', 'Fehler beim Löschen des Profils'));
    }
  };

  const handleStatusChange = async (profileId: string, newStatus: string) => {
    try {
      await updateTaxProfile(profileId, { status: newStatus as any });
      toast.success(t('taxes.statusUpdated', 'Status erfolgreich aktualisiert'));
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      toast.error(t('taxes.errorUpdating', 'Fehler beim Aktualisieren'));
    }
  };

  const calculateTaxableIncome = (profile: TaxProfile) => {
    const gross = profile.grossIncome || 0;
    const other = profile.otherIncome || 0;
    const deductions = profile.deductions || 0;
    return Math.max(0, gross + other - deductions);
  };

  return (
    <Layout title={t('taxes.title')}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-muted-foreground">
              {t('taxes.description', 'Verwalten Sie Ihre Steuerprofile für verschiedene Jahre')}
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            {t('taxes.newProfile', 'Neues Steuerprofil')}
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                {t('common.loading', 'Wird geladen...')}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-red-500">
                {t('common.error', 'Fehler')}: {error.message}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && profiles.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="font-medium">{t('taxes.noProfiles', 'Keine Steuerprofile vorhanden')}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('taxes.createFirst', 'Erstellen Sie Ihr erstes Steuerprofil, um zu beginnen.')}
                  </p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('taxes.newProfile', 'Neues Steuerprofil')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profiles List */}
        {!isLoading && !error && profiles.length > 0 && (
          <div className="grid gap-6">
            {profiles.map((profile) => (
              <Card key={profile.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-3">
                        <span className="text-2xl font-bold">{profile.taxYear}</span>
                        {getStatusBadge(profile.status)}
                      </CardTitle>
                      <CardDescription>
                        {profile.canton ? swissCantons[profile.canton] || profile.canton : t('taxes.noCanton', 'Kein Kanton ausgewählt')}
                        {' • '}
                        {profile.country}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={profile.status}
                        onValueChange={(value) => handleStatusChange(profile.id, value)}
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unvollständig">{t('taxes.status.unvollständig')}</SelectItem>
                          <SelectItem value="vollständig">{t('taxes.status.vollständig')}</SelectItem>
                          <SelectItem value="eingereicht">{t('taxes.status.eingereicht')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditProfile(profile)}>
                            <Edit className="w-4 h-4 mr-2" />
                            {t('common.edit', 'Bearbeiten')}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setDeleteProfileId(profile.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {t('common.delete', 'Löschen')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Personal Info */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        {t('taxes.personalInfo', 'Persönliches')}
                      </div>
                      <p className="font-medium">{getMaritalStatusLabel(profile.maritalStatus)}</p>
                      <p className="text-sm text-muted-foreground">
                        {profile.numberOfChildren} {t('taxes.children', 'Kinder')}
                      </p>
                    </div>

                    {/* Gross Income */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Wallet className="w-4 h-4" />
                        {t('taxes.grossIncome', 'Bruttoeinkommen')}
                      </div>
                      <p className="font-medium text-green-600">
                        {formatCurrency(profile.grossIncome)}
                      </p>
                      {profile.otherIncome && profile.otherIncome > 0 && (
                        <p className="text-sm text-muted-foreground">
                          + {formatCurrency(profile.otherIncome)} {t('taxes.other', 'andere')}
                        </p>
                      )}
                    </div>

                    {/* Deductions */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="w-4 h-4" />
                        {t('taxes.deductions', 'Abzüge')}
                      </div>
                      <p className="font-medium text-red-600">
                        {formatCurrency(profile.deductions)}
                      </p>
                    </div>

                    {/* Taxable Income */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calculator className="w-4 h-4" />
                        {t('taxes.taxableIncome', 'Steuerbares Einkommen')}
                      </div>
                      <p className="font-medium text-blue-600">
                        {formatCurrency(calculateTaxableIncome(profile))}
                      </p>
                    </div>
                  </div>

                  {/* Notes */}
                  {profile.notes && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">{t('taxes.notes', 'Notizen')}:</span> {profile.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add/Edit Dialog */}
        <AddTaxProfileDialog
          open={isDialogOpen || !!editProfile}
          onOpenChange={(open) => {
            if (!open) {
              setIsDialogOpen(false);
              setEditProfile(null);
            }
          }}
          onSubmit={editProfile ? handleUpdateProfile : handleCreateProfile}
          editProfile={editProfile}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteProfileId} onOpenChange={() => setDeleteProfileId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('taxes.confirmDelete', 'Steuerprofil löschen?')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('taxes.confirmDeleteDescription', 'Möchten Sie dieses Steuerprofil wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel', 'Abbrechen')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteProfile} className="bg-red-600 hover:bg-red-700">
                {t('common.delete', 'Löschen')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
