import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { User, Mail, Globe, Wallet, MapPin, Bell, Moon, Sun, Loader2 } from 'lucide-react';
import i18n from '@/lib/i18n';

const swissCantons = [
  { code: 'ZH', name: 'Zürich' },
  { code: 'BE', name: 'Bern' },
  { code: 'LU', name: 'Luzern' },
  { code: 'UR', name: 'Uri' },
  { code: 'SZ', name: 'Schwyz' },
  { code: 'OW', name: 'Obwalden' },
  { code: 'NW', name: 'Nidwalden' },
  { code: 'GL', name: 'Glarus' },
  { code: 'ZG', name: 'Zug' },
  { code: 'FR', name: 'Freiburg' },
  { code: 'SO', name: 'Solothurn' },
  { code: 'BS', name: 'Basel-Stadt' },
  { code: 'BL', name: 'Basel-Landschaft' },
  { code: 'SH', name: 'Schaffhausen' },
  { code: 'AR', name: 'Appenzell Ausserrhoden' },
  { code: 'AI', name: 'Appenzell Innerrhoden' },
  { code: 'SG', name: 'St. Gallen' },
  { code: 'GR', name: 'Graubünden' },
  { code: 'AG', name: 'Aargau' },
  { code: 'TG', name: 'Thurgau' },
  { code: 'TI', name: 'Tessin' },
  { code: 'VD', name: 'Waadt' },
  { code: 'VS', name: 'Wallis' },
  { code: 'NE', name: 'Neuenburg' },
  { code: 'GE', name: 'Genf' },
  { code: 'JU', name: 'Jura' },
];

export default function Settings() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [language, setLanguage] = useState('de');
  const [currency, setCurrency] = useState('CHF');
  const [canton, setCanton] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Load user data
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
    }
    
    // Load saved preferences from localStorage
    const savedLanguage = localStorage.getItem('nexo-language') || 'de';
    const savedCurrency = localStorage.getItem('nexo-currency') || 'CHF';
    const savedCanton = localStorage.getItem('nexo-canton') || '';
    const savedNotifications = localStorage.getItem('nexo-notifications') !== 'false';
    const savedTheme = localStorage.getItem('nexo-theme') || 'light';
    
    setLanguage(savedLanguage);
    setCurrency(savedCurrency);
    setCanton(savedCanton);
    setNotificationsEnabled(savedNotifications);
    setIsDarkMode(savedTheme === 'dark');
    
    // Apply theme
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, [user]);

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    i18n.changeLanguage(value);
    localStorage.setItem('nexo-language', value);
  };

  const handleThemeChange = (dark: boolean) => {
    setIsDarkMode(dark);
    localStorage.setItem('nexo-theme', dark ? 'dark' : 'light');
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Save to localStorage
      localStorage.setItem('nexo-language', language);
      localStorage.setItem('nexo-currency', currency);
      localStorage.setItem('nexo-canton', canton);
      localStorage.setItem('nexo-notifications', notificationsEnabled.toString());
      
      // Save to Firebase if user is logged in
      if (user) {
        try {
          const updatePreferences = httpsCallable(functions, 'updateUserPreferences');
          await updatePreferences({
            locale: language,
            defaultCurrency: currency,
            canton: canton,
          });
        } catch (firebaseError) {
          console.error('Error saving to Firebase:', firebaseError);
          // Continue even if Firebase save fails - local storage is saved
        }
      }
      
      toast.success(t('settings.saved', 'Einstellungen gespeichert'));
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(t('settings.errorSaving', 'Fehler beim Speichern'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout title={t('settings.title')}>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-muted-foreground" />
              <CardTitle>{t('settings.profile', 'Profil')}</CardTitle>
            </div>
            <CardDescription>
              {t('settings.profileDescription', 'Verwalten Sie Ihre persönlichen Informationen')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {t('settings.name', 'Name')}
              </Label>
              <Input 
                id="name" 
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t('settings.namePlaceholder', 'Ihr Name')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {t('settings.email', 'E-Mail')}
              </Label>
              <Input 
                id="email" 
                type="email" 
                value={email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                {t('settings.emailHint', 'E-Mail kann nicht geändert werden')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-muted-foreground" />
              <CardTitle>{t('settings.preferences', 'Präferenzen')}</CardTitle>
            </div>
            <CardDescription>
              {t('settings.preferencesDescription', 'Passen Sie Ihre App-Einstellungen an')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Language */}
            <div className="space-y-2">
              <Label htmlFor="language" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                {t('settings.language', 'Sprache')}
              </Label>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Currency */}
            <div className="space-y-2">
              <Label htmlFor="currency" className="flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                {t('settings.currency', 'Währung')}
              </Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CHF">CHF (Schweizer Franken)</SelectItem>
                  <SelectItem value="EUR">EUR (Euro)</SelectItem>
                  <SelectItem value="USD">USD (US Dollar)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Canton */}
            <div className="space-y-2">
              <Label htmlFor="canton" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {t('settings.canton', 'Kanton')}
              </Label>
              <Select value={canton} onValueChange={setCanton}>
                <SelectTrigger id="canton">
                  <SelectValue placeholder={t('settings.selectCanton', 'Wählen Sie Ihren Kanton')} />
                </SelectTrigger>
                <SelectContent>
                  {swissCantons.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t('settings.cantonHint', 'Wird für Steuerberechnungen verwendet')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              {isDarkMode ? <Moon className="w-5 h-5 text-muted-foreground" /> : <Sun className="w-5 h-5 text-muted-foreground" />}
              <CardTitle>{t('settings.appearance', 'Darstellung')}</CardTitle>
            </div>
            <CardDescription>
              {t('settings.appearanceDescription', 'Passen Sie das Erscheinungsbild der App an')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Moon className="w-4 h-4" />
                  {t('settings.darkMode', 'Dunkler Modus')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.darkModeDescription', 'Dunkles Farbschema aktivieren')}
                </p>
              </div>
              <Switch
                checked={isDarkMode}
                onCheckedChange={handleThemeChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <CardTitle>{t('settings.notifications', 'Benachrichtigungen')}</CardTitle>
            </div>
            <CardDescription>
              {t('settings.notificationsDescription', 'Verwalten Sie Ihre Benachrichtigungseinstellungen')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  {t('settings.enableNotifications', 'Benachrichtigungen aktivieren')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.notificationsHint', 'Erhalten Sie Erinnerungen für anstehende Termine und Zahlungen')}
                </p>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => window.location.reload()}>
            {t('settings.reset', 'Zurücksetzen')}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('common.loading', 'Wird geladen...')}
              </>
            ) : (
              t('settings.save', 'Speichern')
            )}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
