import { useAuth } from '@/_core/hooks/useAuth';
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

import { useLocation } from 'wouter';
import { useState } from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import AIChatDialog from './AIChatDialog';

interface TopbarProps {
  title: string;
  onMenuClick: () => void;
}

export default function Topbar({ title, onMenuClick }: TopbarProps) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location, setLocation] = useLocation();
  const [aiChatOpen, setAiChatOpen] = useState(false);

  const getUserInitials = () => {
    if (!user?.name) return 'U';
    const name = user.name || '';
    return name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
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
      <div className="flex items-center gap-2">
        {/* Language switcher dropdown */}
        <LanguageSwitcher />

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-9 w-9"
          title={theme === 'dark' ? t('common.switchToLight', 'Zu hellem Design wechseln') : t('common.switchToDark', 'Zu dunklem Design wechseln')}
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        {/* User menu */}
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
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer"
              onSelect={() => setLocation('/settings')}
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>{t('nav.settings', 'Einstellungen')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="cursor-pointer"
              onSelect={() => setLocation('/dashboard')}
            >
              <User className="mr-2 h-4 w-4" />
              <span>{t('nav.dashboard', 'Dashboard')}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer"
              onSelect={() => setAiChatOpen(true)}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              <span>Assistent</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="cursor-pointer"
              onSelect={() => window.open('https://help.nexo.com', '_blank')}
            >
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>{t('common.help', 'Hilfe')}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer"
              onSelect={() => logout()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t('common.logout', 'Abmelden')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* AI Chat Dialog */}
      <AIChatDialog open={aiChatOpen} onOpenChange={setAiChatOpen} />
    </header>
  );
}
