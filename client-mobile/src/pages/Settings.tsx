import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  User,
  Globe,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
  Bell,
  Shield,
  HelpCircle,
  Monitor,
  Check
} from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from 'sonner';

export default function MobileSettings() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const [showThemeDialog, setShowThemeDialog] = useState(false);

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
    setShowLanguageDialog(false);
    toast.success(lang === 'de' ? 'Sprache geändert' : 'Language changed');
  };

  const handleThemeChange = () => {
    if (toggleTheme) {
      toggleTheme();
      toast.success(theme === 'dark' ? 'Helles Design aktiviert' : 'Dunkles Design aktiviert');
    }
    setShowThemeDialog(false);
  };

  const handleLogout = async () => {
    try {
      if (logout) {
        await logout();
      }
      toast.success('Abgemeldet');
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Fehler beim Abmelden');
    }
  };

  const handleDesktopSwitch = () => {
    localStorage.setItem('preferDesktop', 'true');
    window.location.href = 'https://nexo-jtsky100.web.app';
  };

  return (
    <MobileLayout title={t('nav.settings', 'Einstellungen')}>
      {/* Profile Section */}
      <div className="mobile-card mb-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="w-14 h-14 rounded-full object-cover" />
          ) : (
            <User className="w-7 h-7 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{user?.displayName || 'Benutzer'}</p>
          <p className="text-sm text-muted-foreground truncate">{user?.email || 'Nicht angemeldet'}</p>
        </div>
      </div>

      {/* Settings List */}
      <div className="space-y-2">
        {/* Language */}
        <button
          onClick={() => setShowLanguageDialog(true)}
          className="mobile-card w-full flex items-center justify-between active:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Globe className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="font-medium">{t('settings.language', 'Sprache')}</p>
              <p className="text-xs text-muted-foreground">
                {i18n.language === 'de' ? 'Deutsch' : 'English'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Theme */}
        <button
          onClick={() => setShowThemeDialog(true)}
          className="mobile-card w-full flex items-center justify-between active:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-purple-600" />
              ) : (
                <Sun className="w-5 h-5 text-purple-600" />
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
          className="mobile-card w-full flex items-center justify-between active:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
              <Monitor className="w-5 h-5 text-cyan-600" />
            </div>
            <div className="text-left">
              <p className="font-medium">Desktop Version</p>
              <p className="text-xs text-muted-foreground">Zur vollständigen Ansicht wechseln</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Notifications */}
        <button
          onClick={() => toast.info('Benachrichtigungen werden in einer zukünftigen Version verfügbar sein')}
          className="mobile-card w-full flex items-center justify-between active:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Bell className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-left">
              <p className="font-medium">{t('settings.notifications', 'Benachrichtigungen')}</p>
              <p className="text-xs text-muted-foreground">{t('settings.enabled', 'Aktiviert')}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Privacy */}
        <button
          onClick={() => toast.info('Datenschutzeinstellungen werden in einer zukünftigen Version verfügbar sein')}
          className="mobile-card w-full flex items-center justify-between active:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-left">
              <p className="font-medium">{t('settings.privacy', 'Datenschutz')}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Help */}
        <button
          onClick={() => toast.info('Hilfe wird in einer zukünftigen Version verfügbar sein')}
          className="mobile-card w-full flex items-center justify-between active:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-teal-600" />
            </div>
            <div className="text-left">
              <p className="font-medium">{t('settings.help', 'Hilfe')}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="mobile-card w-full flex items-center gap-3 mt-6 text-red-600 active:bg-red-50 dark:active:bg-red-900/20 transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <LogOut className="w-5 h-5" />
        </div>
        <p className="font-medium">{t('auth.logout', 'Abmelden')}</p>
      </button>

      {/* Version */}
      <p className="text-center text-xs text-muted-foreground mt-6">
        Nexo Mobile v1.0.0
      </p>

      {/* Language Dialog */}
      {showLanguageDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end" onClick={() => setShowLanguageDialog(false)}>
          <div 
            className="bg-background w-full rounded-t-3xl p-6 safe-bottom animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">{t('settings.language', 'Sprache')}</h2>
            
            <div className="space-y-2">
              <button
                onClick={() => handleLanguageChange('de')}
                className={`w-full mobile-card flex items-center justify-between ${
                  i18n.language === 'de' ? 'border-primary bg-primary/5' : ''
                }`}
              >
                <span className="font-medium">🇨🇭 Deutsch</span>
                {i18n.language === 'de' && <Check className="w-5 h-5 text-primary" />}
              </button>
              
              <button
                onClick={() => handleLanguageChange('en')}
                className={`w-full mobile-card flex items-center justify-between ${
                  i18n.language === 'en' ? 'border-primary bg-primary/5' : ''
                }`}
              >
                <span className="font-medium">🇬🇧 English</span>
                {i18n.language === 'en' && <Check className="w-5 h-5 text-primary" />}
              </button>
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
            className="bg-background w-full rounded-t-3xl p-6 safe-bottom animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">{t('settings.theme', 'Design')}</h2>
            
            <div className="space-y-2">
              <button
                onClick={() => { if (theme === 'dark') handleThemeChange(); else setShowThemeDialog(false); }}
                className={`w-full mobile-card flex items-center justify-between ${
                  theme === 'light' ? 'border-primary bg-primary/5' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <Sun className="w-5 h-5 text-orange-500" />
                  <span className="font-medium">{t('settings.light', 'Hell')}</span>
                </div>
                {theme === 'light' && <Check className="w-5 h-5 text-primary" />}
              </button>
              
              <button
                onClick={() => { if (theme === 'light') handleThemeChange(); else setShowThemeDialog(false); }}
                className={`w-full mobile-card flex items-center justify-between ${
                  theme === 'dark' ? 'border-primary bg-primary/5' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <Moon className="w-5 h-5 text-purple-500" />
                  <span className="font-medium">{t('settings.dark', 'Dunkel')}</span>
                </div>
                {theme === 'dark' && <Check className="w-5 h-5 text-primary" />}
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
