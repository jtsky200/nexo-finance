import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { 
  User,
  Globe,
  Moon,
  Sun,
  LogOut,
  LogIn,
  ChevronRight,
  Bell,
  Shield,
  HelpCircle,
  Monitor,
  Check,
  X
} from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from 'sonner';
import { 
  requestNotificationPermission, 
  getNotificationPermission,
  isNotificationSupported,
  registerServiceWorker
} from '@/lib/notifications';
import { hapticSuccess, hapticError, hapticSelection } from '@/lib/hapticFeedback';
import { 
  isBiometricSupported, 
  isBiometricAvailable, 
  registerBiometric,
  useBiometricAuth
} from '@/lib/biometricAuth';
import { Fingerprint } from 'lucide-react';
import { useGlassEffect } from '@/hooks/useGlassEffect';
import { Sparkles, MapPin } from 'lucide-react';
import { useUserSettings } from '@/lib/firebaseHooks';

function NotificationsSettings() {
  const { t } = useTranslation();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsSupported(isNotificationSupported());
    setPermission(getNotificationPermission());
  }, []);

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      hapticSelection();
      
      // Register service worker first
      await registerServiceWorker();
      
      // Request permission
      const newPermission = await requestNotificationPermission();
      setPermission(newPermission);
      
      if (newPermission === 'granted') {
        toast.success(t('settings.notificationsEnabled', 'Benachrichtigungen aktiviert'));
        hapticSuccess();
      } else if (newPermission === 'denied') {
        toast.error(t('settings.notificationsBlocked', 'Benachrichtigungen wurden blockiert. Bitte in den Browser-Einstellungen aktivieren.'));
        hapticError();
      } else {
        toast.info(t('settings.permissionRequired', 'Berechtigung erforderlich'));
      }
    } catch (error) {
      toast.error(t('settings.errors.enableNotificationsError', 'Fehler beim Aktivieren der Benachrichtigungen'));
      hapticError();
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="mobile-card w-full flex items-center justify-between py-4 opacity-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <Bell className="w-5 h-5 text-foreground" />
          </div>
          <div className="text-left">
            <p className="font-medium">{t('settings.notifications', 'Benachrichtigungen')}</p>
            <p className="text-xs text-muted-foreground">{t('settings.notSupported', 'Nicht unterstützt')}</p>
          </div>
        </div>
      </div>
    );
  }

  const isEnabled = permission === 'granted';
  const isBlocked = permission === 'denied';

  return (
    <div className="mobile-card w-full py-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <Bell className="w-5 h-5 text-foreground" />
          </div>
          <div className="text-left">
            <p className="font-medium">{t('settings.notifications', 'Benachrichtigungen')}</p>
            <p className="text-xs text-muted-foreground">
              {isEnabled ? t('settings.enabled', 'Aktiviert') : isBlocked ? t('settings.blocked', 'Blockiert') : t('settings.notEnabled', 'Nicht aktiviert')}
            </p>
          </div>
        </div>
        {isEnabled ? (
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center">
            <X className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
      
      {!isEnabled && (
        <button
          onClick={handleEnableNotifications}
          disabled={isLoading || isBlocked}
          className="w-full py-2 px-4 rounded-lg bg-primary text-primary-foreground font-medium active:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          {isLoading ? t('settings.enabling', 'Aktiviere...') : isBlocked ? t('settings.enableInBrowser', 'In Browser-Einstellungen aktivieren') : t('settings.enableNotifications', 'Benachrichtigungen aktivieren')}
        </button>
      )}
      
      {isBlocked && (
        <p className="text-xs text-muted-foreground mt-2">
          {t('settings.enableInBrowserDescription', 'Bitte öffnen Sie die Browser-Einstellungen und erlauben Sie Benachrichtigungen für diese Website.')}
        </p>
      )}
    </div>
  );
}

function BiometricSettings() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isEnabled, enable, disable } = useBiometricAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    const checkBiometric = async () => {
      const supported = isBiometricSupported();
      setIsSupported(supported);
      
      if (supported) {
        const available = await isBiometricAvailable();
        setIsAvailable(available);
      }
    };
    
    checkBiometric();
  }, []);

  const handleToggleBiometric = async () => {
    if (isEnabled) {
      await disable();
      toast.success(t('settings.biometricDisabled', 'Biometrische Authentifizierung deaktiviert'));
      hapticSuccess();
      return;
    }

    if (!isAvailable) {
      toast.error(t('settings.biometricNotAvailable', 'Biometrische Authentifizierung ist auf diesem Gerät nicht verfügbar'));
      hapticError();
      return;
    }

    setIsRegistering(true);
    try {
      hapticSelection();
      
      if (!user) {
        toast.error(t('settings.errors.pleaseLogin', 'Bitte melden Sie sich zuerst an'));
        hapticError();
        return;
      }

      const result = await registerBiometric(
        user.uid,
        user.displayName || user.email || t('common.user', 'User')
      );

      if (result.success) {
        await enable();
        toast.success(t('settings.biometricEnabled', 'Biometrische Authentifizierung aktiviert'));
        hapticSuccess();
      } else {
        toast.error(result.error || t('settings.biometricActivationFailed', 'Aktivierung fehlgeschlagen'));
        hapticError();
      }
    } catch (error) {
      toast.error(t('settings.errors.enableBiometricError', 'Fehler beim Aktivieren der biometrischen Authentifizierung'));
      hapticError();
    } finally {
      setIsRegistering(false);
    }
  };

  if (!isSupported) {
    return null; // Don't show if not supported
  }

  return (
    <div className="mobile-card w-full py-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <Fingerprint className="w-5 h-5 text-foreground" />
          </div>
          <div className="text-left">
            <p className="font-medium">{t('settings.biometric', 'Biometrische Authentifizierung')}</p>
            <p className="text-xs text-muted-foreground">
              {isEnabled ? t('settings.enabled', 'Aktiviert') : isAvailable ? t('settings.available', 'Verfügbar') : t('settings.notAvailable', 'Nicht verfügbar')}
            </p>
          </div>
        </div>
        {isEnabled ? (
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center">
            <X className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
      
      {isAvailable && (
        <button
          onClick={handleToggleBiometric}
          disabled={isRegistering || isLoading}
          className="w-full py-2 px-4 rounded-lg bg-primary text-primary-foreground font-medium active:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          {isRegistering 
            ? t('settings.registering', 'Registriere...') 
            : isLoading 
            ? t('common.loading', 'Lädt...') 
            : isEnabled 
            ? t('settings.disableBiometric', 'Biometrische Authentifizierung deaktivieren') 
            : t('settings.enableBiometric', 'Biometrische Authentifizierung aktivieren')}
        </button>
      )}
      
      {!isAvailable && isSupported && (
        <p className="text-xs text-muted-foreground">
          {t('settings.noBiometricSensor', 'Kein biometrischer Sensor auf diesem Gerät gefunden.')}
        </p>
      )}
    </div>
  );
}

function WeatherLocationSettings() {
  const { t } = useTranslation();
  const { settings, updateSettings, isLoading } = useUserSettings();
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings?.weatherLocation) {
      setLocationInput(settings.weatherLocation);
    }
  }, [settings]);

  const handleSaveLocation = async () => {
    if (!locationInput.trim()) {
      toast.error(t('settings.errors.enterLocation', 'Bitte geben Sie einen Ort ein'));
      hapticError();
      return;
    }

    setIsSaving(true);
    try {
      hapticSelection();
      await updateSettings({ weatherLocation: locationInput.trim() });
      setShowLocationDialog(false);
      toast.success(t('settings.locationSaved', 'Standort gespeichert'));
      hapticSuccess();
    } catch (error) {
      toast.error(t('settings.errors.saveLocationError', 'Fehler beim Speichern des Standorts'));
      hapticError();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowLocationDialog(true)}
        className="mobile-card w-full flex items-center justify-between active:opacity-80 transition-opacity py-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <MapPin className="w-5 h-5 text-foreground" />
          </div>
          <div className="text-left">
            <p className="font-medium">{t('settings.weatherLocation', 'Wetter-Standort')}</p>
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
              {settings?.weatherLocation || 'Zurich, CH'}
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </button>

      {showLocationDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end" onClick={() => setShowLocationDialog(false)}>
          <div 
            className="bg-background w-full rounded-t-2xl p-6 safe-bottom animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4">{t('settings.weatherLocation', 'Wetter-Standort')}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">{t('settings.locationLabel', 'Ort (z.B. "Zurich, CH" oder "Berlin, DE")')}</label>
                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="Zurich, CH"
                  className="w-full px-4 py-3 rounded-lg bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={isSaving || isLoading}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {t('settings.locationFormat', 'Format: Stadt, Ländercode (z.B. "Zurich, CH", "Berlin, DE", "New York, US")')}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSaveLocation}
                  disabled={isSaving || isLoading || !locationInput.trim()}
                  className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground font-medium active:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                >
                  {isSaving ? t('common.saving', 'Speichere...') : t('common.save', 'Speichern')}
                </button>
                <button
                  onClick={() => setShowLocationDialog(false)}
                  className="px-6 py-3 rounded-lg bg-muted text-foreground font-medium active:opacity-80 transition-opacity min-h-[44px]"
                >
                  {t('common.cancel', 'Abbrechen')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function MobileSettings() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isEnabled: glassEffectEnabled, toggle: toggleGlassEffect } = useGlassEffect();
  
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const [showThemeDialog, setShowThemeDialog] = useState(false);

  const { settings, updateSettings } = useUserSettings();
  
  const languages = [
    { code: 'de', label: 'Deutsch', flag: '🇨🇭' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
    { code: 'it', label: 'Italiano', flag: '🇮🇹' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
  ];

  const handleLanguageChange = async (lang: string) => {
    i18n.changeLanguage(lang);
    await updateSettings({ language: lang });
    setShowLanguageDialog(false);
    toast.success(t('settings.languageChanged', 'Sprache geändert'));
    hapticSuccess();
  };
  
  // Load language from Firebase UserSettings
  useEffect(() => {
    if (settings?.language) {
      i18n.changeLanguage(settings.language);
    } else {
      // Migrate from localStorage
      const savedLang = localStorage.getItem('language');
      if (savedLang) {
        updateSettings({ language: savedLang }).then(() => {
          localStorage.removeItem('language');
        }).catch(console.error);
        i18n.changeLanguage(savedLang);
      }
    }
  }, [settings?.language, updateSettings, i18n]);

  const handleThemeChange = () => {
    if (toggleTheme) {
      toggleTheme();
      toast.success(theme === 'dark' ? t('settings.lightThemeActivated', 'Helles Design aktiviert') : t('settings.darkThemeActivated', 'Dunkles Design aktiviert'));
    }
    setShowThemeDialog(false);
  };

  const handleLogout = async () => {
    try {
      if (logout) {
        await logout();
      }
      toast.success(t('auth.loggedOut', 'Abgemeldet'));
      setLocation('/login');
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Logout error:', error);
      }
      toast.error(t('auth.errors.logoutError', 'Fehler beim Abmelden'));
    }
  };

  const handleLogin = () => {
    setLocation('/login');
  };

  const handleDesktopSwitch = async () => {
    await updateSettings({ preferDesktop: true });
    window.location.href = 'https://nexo-jtsky100.web.app';
  };

  return (
    <MobileLayout title={t('nav.settings', 'Einstellungen')} showSidebar={true}>
      {/* Profile Section */}
      <div className="mobile-card mb-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="w-14 h-14 object-cover" />
          ) : (
            <User className="w-7 h-7 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{user?.displayName || t('common.user', 'Benutzer')}</p>
          <p className="text-sm text-muted-foreground truncate">{user?.email || t('auth.notLoggedIn', 'Nicht angemeldet')}</p>
        </div>
      </div>

      {/* Settings List */}
      <div className="space-y-3">
        {/* Language */}
        <button
          onClick={() => setShowLanguageDialog(true)}
          className="mobile-card w-full flex items-center justify-between active:opacity-80 transition-opacity py-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Globe className="w-5 h-5 text-foreground" />
            </div>
            <div className="text-left">
              <p className="font-medium">{t('settings.language', 'Sprache')}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span>{languages.find(l => l.code === i18n.language)?.flag || '🌐'}</span>
                <span>{languages.find(l => l.code === i18n.language)?.label || i18n.language.toUpperCase()}</span>
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Theme */}
        <button
          onClick={() => setShowThemeDialog(true)}
          className="mobile-card w-full flex items-center justify-between active:opacity-80 transition-opacity py-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-foreground" />
              ) : (
                <Sun className="w-5 h-5 text-foreground" />
              )}
            </div>
            <div className="text-left">
              <p className="font-medium">{t('settings.theme', 'Design')}</p>
              <p className="text-xs text-muted-foreground">
                {theme === 'dark' ? t('settings.dark', 'Dunkel') : t('settings.light', 'Hell')}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Desktop Version */}
        <button
          onClick={handleDesktopSwitch}
          className="mobile-card w-full flex items-center justify-between active:opacity-80 transition-opacity py-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Monitor className="w-5 h-5 text-foreground" />
            </div>
            <div className="text-left">
              <p className="font-medium">{t('settings.desktopVersion', 'Desktop Version')}</p>
              <p className="text-xs text-muted-foreground">{t('settings.desktopVersionDescription', 'Zur vollständigen Ansicht')}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Notifications */}
        <NotificationsSettings />

        {/* Biometric Authentication */}
        <BiometricSettings />

        {/* Weather Location */}
        <WeatherLocationSettings />

        {/* Glass Effect */}
        <div className="mobile-card w-full py-4">
          <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-foreground" />
            </div>
            <div className="text-left">
                <p className="font-medium">{t('settings.glassEffect', 'Glass-Effekt')}</p>
                <p className="text-xs text-muted-foreground">
                  {glassEffectEnabled ? t('settings.enabled', 'Aktiviert') : t('settings.disabled', 'Deaktiviert')}
                </p>
            </div>
          </div>
            {glassEffectEnabled ? (
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center">
                <X className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
          
          <button
            onClick={() => {
              toggleGlassEffect();
              hapticSelection();
              toast.success(glassEffectEnabled ? t('settings.glassEffectDisabled', 'Glass-Effekt deaktiviert') : t('settings.glassEffectEnabled', 'Glass-Effekt aktiviert'));
            }}
            className="w-full py-2 px-4 rounded-lg bg-primary text-primary-foreground font-medium active:opacity-80 transition-opacity min-h-[44px]"
          >
            {glassEffectEnabled ? t('settings.disableGlassEffect', 'Glass-Effekt deaktivieren') : t('settings.enableGlassEffect', 'Glass-Effekt aktivieren')}
        </button>
        </div>

        {/* Privacy */}
        <button
          onClick={() => toast.info(t('settings.comingSoon', 'Kommt in einer zukünftigen Version'))}
          className="mobile-card w-full flex items-center justify-between active:opacity-80 transition-opacity py-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Shield className="w-5 h-5 text-foreground" />
            </div>
            <div className="text-left">
              <p className="font-medium">{t('settings.privacy', 'Datenschutz')}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Help */}
        <button
          onClick={() => setLocation('/help')}
          className="mobile-card w-full flex items-center justify-between active:opacity-80 transition-opacity py-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-foreground" />
            </div>
            <div className="text-left">
              <p className="font-medium">{t('settings.help', 'Hilfe')}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Login/Logout */}
      <button
        onClick={user ? handleLogout : handleLogin}
        className="mobile-card w-full flex items-center gap-3 mt-6 active:opacity-80 transition-opacity"
      >
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          user ? 'bg-status-error' : 'bg-primary'
        }`}>
          {user ? (
            <LogOut className="w-5 h-5 status-error" />
          ) : (
            <LogIn className="w-5 h-5 text-primary-foreground" />
          )}
        </div>
        <p className={`font-medium ${user ? 'status-error' : 'text-primary'}`}>
          {user ? t('auth.logout', 'Abmelden') : t('auth.login', 'Anmelden')}
        </p>
      </button>

      {/* Version */}
      <p className="text-center text-xs text-muted-foreground mt-6">
        Nexo Mobile v1.0.0
      </p>

      {/* Language Dialog */}
      {showLanguageDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end" onClick={() => setShowLanguageDialog(false)}>
          <div 
            className="bg-background w-full rounded-t-2xl p-6 safe-bottom animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4">{t('settings.language', 'Sprache')}</h2>
            
            <div className="space-y-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full mobile-card flex items-center justify-between p-4 ${
                    i18n.language === lang.code ? 'border-2 border-primary bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{lang.flag}</span>
                    <span className="font-medium">{lang.label}</span>
                  </div>
                  {i18n.language === lang.code && <Check className="w-5 h-5 text-primary" />}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowLanguageDialog(false)}
              className="w-full mt-4 py-3 text-muted-foreground font-medium"
            >
              {t('common.cancel', 'Abbrechen')}
            </button>
          </div>
        </div>
      )}

      {/* Theme Dialog */}
      {showThemeDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end" onClick={() => setShowThemeDialog(false)}>
          <div 
            className="bg-background w-full rounded-t-2xl p-6 safe-bottom animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4">{t('settings.theme', 'Design')}</h2>
            
            <div className="space-y-2">
              <button
                onClick={() => { if (theme === 'dark') handleThemeChange(); else setShowThemeDialog(false); }}
                className={`w-full mobile-card flex items-center justify-between ${
                  theme === 'light' ? 'border-primary' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <Sun className="w-5 h-5" />
                  <span className="font-medium">{t('settings.light', 'Hell')}</span>
                </div>
                {theme === 'light' && <Check className="w-5 h-5" />}
              </button>
              
              <button
                onClick={() => { if (theme === 'light') handleThemeChange(); else setShowThemeDialog(false); }}
                className={`w-full mobile-card flex items-center justify-between ${
                  theme === 'dark' ? 'border-primary' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <Moon className="w-5 h-5" />
                  <span className="font-medium">{t('settings.dark', 'Dunkel')}</span>
                </div>
                {theme === 'dark' && <Check className="w-5 h-5" />}
              </button>
            </div>

            <button
              onClick={() => setShowThemeDialog(false)}
              className="w-full mt-4 py-3 text-muted-foreground font-medium"
            >
              {t('common.cancel', 'Abbrechen')}
            </button>
          </div>
        </div>
      )}
    </MobileLayout>
  );
}
