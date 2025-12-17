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
import { useUserSettings } from '@/lib/firebaseHooks';
import { User, Mail, Globe, Wallet, MapPin, Bell, Moon, Sun, Loader2, FileSearch, Eye, EyeOff } from 'lucide-react';
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
  
  // Document Analysis Settings
  const [ocrProvider, setOcrProvider] = useState('google');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [autoConfirmDocuments, setAutoConfirmDocuments] = useState(false);
  const [isLoadingOcrSettings, setIsLoadingOcrSettings] = useState(true);

  const { settings, isLoading: isLoadingUserSettings, updateSettings } = useUserSettings();
  
  // Load user data
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
      
      // Load OCR settings from Firebase
      const loadOcrSettings = async () => {
        try {
          const getUserSettings = httpsCallable(functions, 'getUserSettings');
          const result: any = await getUserSettings({});
          if (result.data) {
            setOcrProvider(result.data.ocrProvider || 'google');
            setOpenaiApiKey(result.data.openaiApiKey || '');
            setAutoConfirmDocuments(result.data.autoConfirmDocuments || false);
          }
        } catch (error) {
          // Silently fail - settings will use defaults
        } finally {
          setIsLoadingOcrSettings(false);
        }
      };
      loadOcrSettings();
    } else {
      setIsLoadingOcrSettings(false);
    }
  }, [user]);

  // Load settings from Firebase UserSettings with localStorage migration
  useEffect(() => {
    if (!isLoadingUserSettings && settings) {
      // Migrate from localStorage if Firebase settings are not set
      const migratedLanguage = settings.language || localStorage.getItem('nexo-language') || 'de';
      const migratedCurrency = settings.currency || localStorage.getItem('nexo-currency') || 'CHF';
      const migratedCanton = settings.canton || localStorage.getItem('nexo-canton') || '';
      const migratedNotifications = settings.notificationsEnabled !== undefined 
        ? settings.notificationsEnabled 
        : (localStorage.getItem('nexo-notifications') !== 'false');
      const migratedTheme = settings.theme || localStorage.getItem('nexo-theme') || 'light';
      
      // Check if we need to migrate
      const hasLocalData = localStorage.getItem('nexo-language') || 
                          localStorage.getItem('nexo-currency') || 
                          localStorage.getItem('nexo-canton') ||
                          localStorage.getItem('nexo-notifications') ||
                          localStorage.getItem('nexo-theme');
      
      if (hasLocalData && (!settings.language || !settings.currency)) {
        // Migrate to Firebase
        updateSettings({
          language: migratedLanguage,
          currency: migratedCurrency,
          canton: migratedCanton,
          notificationsEnabled: migratedNotifications,
          theme: migratedTheme,
        }).then(() => {
          // Clear localStorage after successful migration
          localStorage.removeItem('nexo-language');
          localStorage.removeItem('nexo-currency');
          localStorage.removeItem('nexo-canton');
          localStorage.removeItem('nexo-notifications');
          localStorage.removeItem('nexo-theme');
        }).catch(console.error);
      }
      
      setLanguage(migratedLanguage);
      setCurrency(migratedCurrency);
      setCanton(migratedCanton);
      setNotificationsEnabled(migratedNotifications);
      setIsDarkMode(migratedTheme === 'dark');
      
      // Apply theme
      if (migratedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [settings, isLoadingUserSettings, updateSettings]);

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    i18n.changeLanguage(value);
    updateSettings({ language: value }).catch(console.error);
  };

  const handleThemeChange = (dark: boolean) => {
    setIsDarkMode(dark);
    const themeValue = dark ? 'dark' : 'light';
    updateSettings({ theme: themeValue }).catch(console.error);
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Save to Firebase UserSettings
      await updateSettings({
        language,
        currency,
        canton,
        notificationsEnabled,
      });
      
      // Save to Firebase if user is logged in (legacy function, can be removed later)
      if (user) {
        try {
          const updatePreferences = httpsCallable(functions, 'updateUserPreferences');
          await updatePreferences({
            locale: language,
            defaultCurrency: currency,
            canton: canton,
          });
          
          // Save OCR settings
          const updateUserSettings = httpsCallable(functions, 'updateUserSettings');
          await updateUserSettings({
            ocrProvider,
            openaiApiKey: ocrProvider === 'openai' ? openaiApiKey : null,
            autoConfirmDocuments,
          });
        } catch (firebaseError) {
          // Continue even if Firebase save fails - local storage is saved
        }
      }
      
      toast.success(t('settings.saved', 'Einstellungen gespeichert'));
    } catch (error) {
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

        {/* Document Analysis Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileSearch className="w-5 h-5 text-muted-foreground" />
              <CardTitle>{t('settings.documentAnalysis', 'Dokumenten-Analyse')}</CardTitle>
            </div>
            <CardDescription>
              {t('settings.documentAnalysisDescription', 'Einstellungen für die automatische Dokumentenerkennung')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoadingOcrSettings ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* OCR Provider */}
                <div className="space-y-2">
                  <Label>{t('settings.ocrProvider', 'Analyse-Methode')}</Label>
                  <Select value={ocrProvider} onValueChange={setOcrProvider}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google">Google Cloud Vision (empfohlen)</SelectItem>
                      <SelectItem value="openai">OpenAI GPT-4 Vision</SelectItem>
                      <SelectItem value="regex">Einfache Texterkennung (kostenlos)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {ocrProvider === 'google' && 'Google Cloud Vision - Kostenlos bis 1000 Anfragen/Monat, sehr genau'}
                    {ocrProvider === 'openai' && 'OpenAI GPT-4 Vision - Kostenpflichtig, höchste Genauigkeit'}
                    {ocrProvider === 'regex' && 'Einfache Mustererkennung - Kostenlos, weniger genau (nur für Text-PDFs)'}
                  </p>
                </div>

                {/* OpenAI API Key */}
                {ocrProvider === 'openai' && (
                  <div className="space-y-2">
                    <Label htmlFor="openaiKey">{t('settings.openaiApiKey', 'OpenAI API Key')}</Label>
                    <div className="relative">
                      <Input
                        id="openaiKey"
                        type={showApiKey ? 'text' : 'password'}
                        value={openaiApiKey}
                        onChange={(e) => setOpenaiApiKey(e.target.value)}
                        placeholder="sk-..."
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('settings.openaiApiKeyHint', 'API Key von platform.openai.com - Wird verschlüsselt gespeichert')}
                    </p>
                  </div>
                )}

                <Separator />

                {/* Auto-Confirm */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('settings.autoConfirm', 'Automatische Bestätigung')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.autoConfirmHint', 'Erkannte Daten automatisch übernehmen ohne Bestätigung')}
                    </p>
                  </div>
                  <Switch
                    checked={autoConfirmDocuments}
                    onCheckedChange={setAutoConfirmDocuments}
                  />
                </div>
              </>
            )}
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
