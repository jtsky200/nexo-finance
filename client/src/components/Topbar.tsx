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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

import { Menu, LogOut, Sun, Moon, Settings, User, HelpCircle, MessageSquare } from 'lucide-react';

import { useTranslation } from 'react-i18next';

import { Link, useLocation } from 'wouter';
import { useState } from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import AIChatDialog from './AIChatDialog';

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

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 relative z-50">
      {/* Left side: Menu button and title */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      </div>

      {/* Right side: Language toggle, theme toggle, and user menu */}
      <div className="flex items-center gap-2 relative z-50">
        {/* Language switcher dropdown */}
        <div className="relative z-50">
          <LanguageSwitcher />
        </div>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-9 w-9 relative z-50"
          title={theme === 'dark' ? t('common.switchToLight', 'Zu hellem Design wechseln') : t('common.switchToDark', 'Zu dunklem Design wechseln')}
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        {/* User menu */}
        <div className="relative z-50">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 z-[60]">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.displayName || 'User'}</p>
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
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={() => setAiChatOpen(true)}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              <span>Assistent</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={() => window.open('https://help.nexo.com', '_blank')}
            >
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>{t('common.help', 'Hilfe')}</span>
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
