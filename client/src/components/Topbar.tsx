import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { Menu, LogOut, Sun, Moon, Settings, User, HelpCircle, MessageSquare, Edit, Download, BookOpen, Info, Keyboard, FileText, PlayCircle } from 'lucide-react';

import { useTranslation } from 'react-i18next';

import { Link, useLocation } from 'wouter';
import { useState } from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import AIChatDialog from './AIChatDialog';
import { startTutorial, TUTORIAL_PRESETS } from './TutorialHighlight';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { toast } from 'sonner';

interface TopbarProps {
  title: string;
  onMenuClick: () => void;
}

export default function Topbar({ title, onMenuClick }: TopbarProps) {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [, setLocation] = useLocation();
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      setLocation('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getUserInitials = () => {
    if (!user?.displayName && !user?.email) return 'U';
    const name = user.displayName || user.email?.split('@')[0] || 'U';
    return name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const createBackup = httpsCallable(functions, 'createManualBackup');
      const result = await createBackup();
      const backupUrl = (result.data as any)?.downloadUrl;
      
      if (backupUrl) {
        window.open(backupUrl, '_blank');
        toast.success(t('common.backupCreated', 'Backup erfolgreich erstellt'));
      } else {
        toast.error(t('common.backupError', 'Fehler beim Erstellen des Backups'));
      }
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(t('common.backupError', 'Fehler beim Erstellen des Backups'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleStartTutorial = () => {
    // Starte ein allgemeines Tutorial für das Dashboard
    const tutorialSteps = [
      {
        selector: '[data-tutorial="dashboard"]',
        title: t('tutorial.dashboard.title', 'Willkommen im Dashboard'),
        description: t('tutorial.dashboard.description', 'Hier sehen Sie eine Übersicht über Ihre Finanzen, Termine und Erinnerungen.'),
      },
      {
        selector: '[data-tutorial="navigation"]',
        title: t('tutorial.navigation.title', 'Navigation'),
        description: t('tutorial.navigation.description', 'Nutzen Sie die Seitenleiste, um zwischen verschiedenen Bereichen zu wechseln.'),
      },
    ];
    startTutorial(tutorialSteps);
    toast.success(t('tutorial.started', 'Tutorial gestartet'));
  };

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 flex-shrink-0" style={{ zIndex: 10000, pointerEvents: 'auto' }}>
      {/* Left side: Menu button and title */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden"
          style={{ zIndex: 10001, pointerEvents: 'auto', position: 'relative' }}
        >
          <Menu className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      </div>

      {/* Right side: Language toggle, theme toggle, and user menu */}
      <div className="flex items-center gap-2 relative" style={{ zIndex: 10001, pointerEvents: 'auto' }}>
        {/* Language switcher dropdown */}
        <LanguageSwitcher />

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-9 w-9"
          style={{ zIndex: 10002, pointerEvents: 'auto', position: 'relative' }}
          title={theme === 'dark' ? t('common.switchToLight', 'Zu hellem Design wechseln') : t('common.switchToDark', 'Zu dunklem Design wechseln')}
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        {/* User menu */}
        <div className="relative" style={{ zIndex: 10003, pointerEvents: 'auto' }}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="relative h-10 w-10 rounded-full inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground"
                style={{ pointerEvents: 'auto', position: 'relative', zIndex: 10004 }}
                data-tutorial="user-menu"
              >
                <Avatar>
                  {user?.photoURL && (
                    <AvatarImage src={user.photoURL} alt={user.displayName || t('common.user', 'Benutzer')} />
                  )}
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56" style={{ zIndex: 10004, pointerEvents: 'auto' }}>
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.displayName || t('common.user', 'Benutzer')}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>{t('nav.settings', 'Einstellungen')}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/dashboard">
                  <User className="mr-2 h-4 w-4" />
                  <span>{t('nav.dashboard', 'Dashboard')}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/settings">
                  <Edit className="mr-2 h-4 w-4" />
                  <span>{t('userMenu.editProfile', 'Profil bearbeiten')}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => setAiChatOpen(true)}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                <span>{t('userMenu.assistant', 'Assistent')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={handleStartTutorial}
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                <span>{t('userMenu.startTutorial', 'Erste Schritte Tutorial')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/help">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>{t('common.help', 'Hilfe')}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/faq">
                  <FileText className="mr-2 h-4 w-4" />
                  <span>{t('userMenu.faq', 'FAQ')}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={handleExportData}
                disabled={isExporting}
              >
                <Download className="mr-2 h-4 w-4" />
                <span>{isExporting ? t('common.exporting', 'Exportiere...') : t('userMenu.exportData', 'Daten exportieren')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => setLocation('/settings?tab=shortcuts')}
              >
                <Keyboard className="mr-2 h-4 w-4" />
                <span>{t('userMenu.keyboardShortcuts', 'Tastenkürzel')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => setLocation('/settings?tab=about')}
              >
                <Info className="mr-2 h-4 w-4" />
                <span>{t('userMenu.about', 'Über Nexo')}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t('common.logout', 'Abmelden')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* AI Chat Dialog */}
      <AIChatDialog open={aiChatOpen} onOpenChange={setAiChatOpen} />
    </header>
  );
}
