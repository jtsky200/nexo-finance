import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard,
  Calendar,
  Bell,
  Wallet,
  Users,
  ClipboardList,
  ScanLine,
  ShoppingCart,
  FileText,
  Settings,
  MessageSquare,
  X,
  User
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
// Chat-Historie entfernt - nimmt zu viel Platz ein
import { cn } from '@/lib/utils';
import { useGlassEffect } from '@/hooks/useGlassEffect';

interface ChatSidebarProps {
  open: boolean;
  onClose: () => void;
  currentChatId?: string;
  onSelectChat?: (chatId: string) => void;
  onNewChat?: () => void;
}

const navItems = [
  { path: '/', icon: MessageSquare, label: 'Assistent' },
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/calendar', icon: Calendar, label: 'Kalender' },
  { path: '/reminders', icon: Bell, label: 'Erinnerungen' },
  { path: '/finance', icon: Wallet, label: 'Finanzen' },
  { path: '/people', icon: Users, label: 'Personen' },
  { path: '/bills', icon: ClipboardList, label: 'Rechnungen' },
  { path: '/documents', icon: ScanLine, label: 'Dokumente' },
  { path: '/shopping', icon: ShoppingCart, label: 'Einkaufen' },
  { path: '/taxes', icon: FileText, label: 'Steuern' },
  { path: '/settings', icon: Settings, label: 'Einstellungen' },
];

export default function ChatSidebar({ 
  open, 
  onClose, 
  currentChatId,
  onSelectChat,
  onNewChat 
}: ChatSidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const { isEnabled: glassEffectEnabled } = useGlassEffect();

  // Get user initials
  const getUserInitials = () => {
    if (user?.displayName) {
      const names = user.displayName.split(' ');
      if (names.length >= 2) {
        return (names[0][0] + names[1][0]).toUpperCase();
      }
      return user.displayName.substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <>
      {/* Backdrop - Very light for glass effect */}
      {open && (
        <div 
          className={cn(
            "fixed inset-0 z-40 transition-opacity",
            glassEffectEnabled 
              ? "bg-black/5"
              : "bg-black/50"
          )}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-full max-w-sm z-50 transform transition-transform duration-300 ease-in-out shadow-xl",
          open ? "translate-x-0" : "-translate-x-full",
          glassEffectEnabled 
            ? "bg-background/2 backdrop-blur-none"
            : "bg-background"
        )}
        aria-label="Hauptnavigation"
        aria-hidden={!open}
      >
        <div className={cn(
          "flex flex-col h-full",
          glassEffectEnabled ? "bg-transparent" : ""
        )}>
          {/* Header with Search */}
          <div className={cn(
            "p-4 border-b",
            glassEffectEnabled ? "border-border/30 bg-transparent" : "border-border"
          )}>
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
                aria-label="Menü schließen"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-semibold flex-1">Menü</h2>
            </div>

            {/* Search Bar entfernt - Chat-Historie wurde entfernt */}
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 border-b border-border">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Navigation
              </h3>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.path;
                  
                  return (
                    <Link key={item.path} href={item.path}>
                      <button
                        onClick={onClose}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left min-h-[44px]",
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-foreground hover:bg-muted"
                        )}
                        aria-label={`Zu ${item.label} navigieren`}
                        aria-current={isActive ? 'page' : undefined}
                        aria-pressed={isActive}
                        type="button"
                        role="menuitem"
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                        <span className="text-sm">{item.label}</span>
                      </button>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Chat-Historie entfernt - nimmt zu viel Platz ein */}
          </div>

          {/* User Profile */}
          <div className={cn(
            "p-4 border-t",
            glassEffectEnabled ? "border-border/30 bg-transparent" : "border-border"
          )}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-sm font-medium">
                {user?.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user?.displayName || 'Benutzerprofilbild'} 
                    className="w-10 h-10 rounded-full object-cover" 
                  />
                ) : (
                  <span aria-label="Benutzerinitialen">{getUserInitials()}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.displayName || 'Benutzer'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email || 'Nicht angemeldet'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

