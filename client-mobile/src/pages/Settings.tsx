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
  HelpCircle
} from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function MobileSettings() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'de' ? 'en' : 'de';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <MobileLayout title={t('nav.settings', 'Einstellungen')}>
      {/* Profile Section */}
      <div className="mobile-card mb-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="w-14 h-14 rounded-full" />
          ) : (
            <User className="w-7 h-7 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{user?.displayName || 'Benutzer'}</p>
          <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
        </div>
      </div>

      {/* Settings List */}
      <div className="space-y-2">
        {/* Language */}
        <button
          onClick={toggleLanguage}
          className="mobile-card w-full flex items-center justify-between active:scale-98 transition-transform"
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
          onClick={toggleTheme}
          className="mobile-card w-full flex items-center justify-between active:scale-98 transition-transform"
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

        {/* Notifications */}
        <div className="mobile-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Bell className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="font-medium">{t('settings.notifications', 'Benachrichtigungen')}</p>
              <p className="text-xs text-muted-foreground">{t('settings.enabled', 'Aktiviert')}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>

        {/* Privacy */}
        <div className="mobile-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium">{t('settings.privacy', 'Datenschutz')}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>

        {/* Help */}
        <div className="mobile-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <p className="font-medium">{t('settings.help', 'Hilfe')}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="mobile-card w-full flex items-center gap-3 mt-6 text-red-600 active:scale-98 transition-transform"
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
    </MobileLayout>
  );
}

