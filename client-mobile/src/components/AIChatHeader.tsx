import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Menu, 
  ChevronDown, 
  Wallet, 
  FileText, 
  ShoppingCart,
  History,
  X,
  Bell,
  ScanLine,
  Globe,
  UserPlus,
  RotateCcw
} from 'lucide-react';
import { useChatHistory, type ChatConversation } from '@/lib/chatHistory';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface AIChatHeaderProps {
  onMenuClick: () => void;
  onSelectChat?: (chatId: string) => void;
  currentChatId?: string;
}

// Schnellzugriff-Funktionen
const quickActions = [
  { 
    id: 'reminder', 
    icon: Bell, 
    label: 'Erinnerung erstellen',
    path: '/reminders',
    action: 'create'
  },
  { 
    id: 'scan', 
    icon: ScanLine, 
    label: 'Rechnung scannen',
    path: '/bills',
    action: 'scan'
  },
  { 
    id: 'finance', 
    icon: Wallet, 
    label: 'Finanzübersicht',
    path: '/finance'
  },
  { 
    id: 'shopping', 
    icon: ShoppingCart, 
    label: 'Einkaufsliste',
    path: '/shopping'
  },
  { 
    id: 'language', 
    icon: Globe, 
    label: 'Sprache wechseln',
    action: 'language'
  },
];

export default function AIChatHeader({ 
  onMenuClick, 
  onSelectChat,
  onNewChat,
  currentChatId 
}: AIChatHeaderProps) {
  const [, setLocation] = useLocation();
  const { i18n } = useTranslation();
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [chatHistoryOpen, setChatHistoryOpen] = useState(false);
  const { data: chatHistory, refetch: refetchHistory } = useChatHistory();
  const quickActionsRef = useRef<HTMLDivElement>(null);
  const chatHistoryRef = useRef<HTMLDivElement>(null);

  // Reload chat history when dropdown opens
  useEffect(() => {
    if (chatHistoryOpen) {
      refetchHistory();
    }
  }, [chatHistoryOpen, refetchHistory]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (quickActionsRef.current && !quickActionsRef.current.contains(event.target as Node)) {
        setQuickActionsOpen(false);
      }
      if (chatHistoryRef.current && !chatHistoryRef.current.contains(event.target as Node)) {
        setChatHistoryOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQuickAction = (action: typeof quickActions[0]) => {
    setQuickActionsOpen(false);
    
    if (action.action === 'language') {
      const currentLang = i18n.language;
      const newLang = currentLang === 'de' ? 'en' : 'de';
      i18n.changeLanguage(newLang);
      localStorage.setItem('language', newLang);
      toast.success(newLang === 'de' ? 'Sprache auf Deutsch geändert' : 'Language changed to English');
      return;
    }
    
    if (action.path) {
      if (action.action === 'create' || action.action === 'scan') {
        // Speichere die Aktion in localStorage, damit die Zielseite weiss, was zu tun ist
        localStorage.setItem('nexo_quick_action', action.action);
      }
      setLocation(action.path);
    }
  };

  const formatDate = (timestamp: string | number | Date) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : 
                 typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return 'Heute';
    } else if (days === 1) {
      return 'Gestern';
    } else if (days < 7) {
      return `${days} Tage`;
    } else {
      return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
    }
  };

  const getCurrentChatTitle = () => {
    if (currentChatId) {
      const chat = chatHistory.find(c => c.id === currentChatId);
      return chat?.title || 'Assistent';
    }
    return 'Assistent';
  };

  return (
    <header className="sticky top-0 z-40 bg-background border-b border-border safe-top">
      <div className="px-4 h-14 flex items-center gap-3">
        {/* Position 1: Hamburger Menu */}
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-muted rounded-lg transition-colors -ml-2"
          aria-label="Menü öffnen"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Position 2: Chat Title Button (ChatGPT-style) */}
        <div className="relative flex-1" ref={quickActionsRef}>
          <button
            onClick={() => {
              setQuickActionsOpen(!quickActionsOpen);
              setChatHistoryOpen(false);
            }}
            className="w-full px-4 py-2.5 rounded-full bg-background hover:bg-muted/50 border border-border transition-colors flex items-center justify-between text-sm font-medium shadow-sm"
            style={{ borderRadius: '9999px', minHeight: '40px' }}
          >
            <span className="font-medium">{getCurrentChatTitle()}</span>
            <ChevronDown className={cn(
              "w-4 h-4 transition-transform",
              quickActionsOpen && "rotate-180"
            )} />
          </button>

          {/* Schnellzugriff Dropdown Menu */}
          {quickActionsOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden">
              <div className="p-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5 mb-1">
                  Schnellzugriff
                </p>
                {quickActions.map((action) => {
                  const ActionIcon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={() => handleQuickAction(action)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <ActionIcon className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm">{action.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Position 3: Right Icons (ChatGPT-style) */}
        <div className="flex items-center gap-2">
          {/* New Chat / User Plus Icon */}
          <button
            onClick={() => {
              if (onNewChat) {
                onNewChat();
              }
            }}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Neue Konversation"
          >
            <UserPlus className="w-5 h-5" />
          </button>

          {/* Chat History / Refresh Icon */}
          <div className="relative" ref={chatHistoryRef}>
            <button
              onClick={() => {
                setChatHistoryOpen(!chatHistoryOpen);
                setQuickActionsOpen(false);
              }}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label="Chat-Verlauf"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            {/* Chat History Dropdown Menu */}
            {chatHistoryOpen && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden max-h-[60vh] flex flex-col">
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Chat-Verlauf</h3>
                  <button
                    onClick={() => setChatHistoryOpen(false)}
                    className="p-1 hover:bg-muted rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="overflow-y-auto">
                  {chatHistory.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 px-3 text-center">
                      Noch keine Konversationen
                    </p>
                  ) : (
                    <div className="p-2">
                      {chatHistory.map((chat) => {
                        const isActive = currentChatId === chat.id;
                        return (
                          <button
                            key={chat.id}
                            onClick={() => {
                              if (onSelectChat) {
                                onSelectChat(chat.id);
                              }
                              setChatHistoryOpen(false);
                            }}
                            className={cn(
                              "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg transition-colors text-left",
                              isActive
                                ? "bg-primary/10 text-primary"
                                : "hover:bg-muted"
                            )}
                          >
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                "text-sm truncate",
                                isActive && "font-medium"
                              )}>
                                {chat.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {formatDate(chat.updatedAt)}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

