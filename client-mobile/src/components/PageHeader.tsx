import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { 
  Menu,
  UserPlus,
  History,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ChatSidebar from './ChatSidebar';
import { useGlassEffect } from '@/hooks/useGlassEffect';
import { useChatHistory } from '@/lib/chatHistory';

interface PageHeaderProps {
  title: string;
  showSidebar?: boolean;
  showQuickActions?: boolean;
  quickActions?: Array<{
    id: string;
    label: string;
    path: string;
    onClick?: () => void;
  }>;
  currentChatId?: string;
  onSelectChat?: (chatId: string) => void;
  onNewChat?: () => void;
  sidebarOpen?: boolean;
  onSidebarToggle?: (open: boolean) => void;
}

export default function PageHeader({
  title,
  showSidebar = false,
  showQuickActions = false,
  quickActions = [],
  currentChatId,
  onSelectChat,
  onNewChat,
  sidebarOpen: externalSidebarOpen,
  onSidebarToggle
}: PageHeaderProps) {
  const [, setLocation] = useLocation();
  const [internalSidebarOpen, setInternalSidebarOpen] = useState(false);
  const { isEnabled: glassEffectEnabled } = useGlassEffect();
  const [chatHistoryOpen, setChatHistoryOpen] = useState(false);
  const { data: chatHistory, refetch: refetchHistory } = useChatHistory();
  const chatHistoryRef = useRef<HTMLDivElement>(null);
  
  const sidebarOpen = externalSidebarOpen !== undefined ? externalSidebarOpen : internalSidebarOpen;
  const setSidebarOpen = onSidebarToggle || setInternalSidebarOpen;

  // Reload chat history when dropdown opens
  useEffect(() => {
    if (chatHistoryOpen) {
      refetchHistory();
    }
  }, [chatHistoryOpen, refetchHistory]);

  // Close chat history when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatHistoryRef.current && !chatHistoryRef.current.contains(event.target as Node)) {
        setChatHistoryOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  return (
    <>
      {/* Sidebar */}
      {showSidebar && (
        <ChatSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          currentChatId={currentChatId}
          onSelectChat={onSelectChat}
          onNewChat={onNewChat}
        />
      )}

      {/* Header - ChatGPT-style, konsistent auf allen Seiten */}
      <header className={cn(
        "fixed top-0 left-0 right-0 z-40 border-b safe-top",
        glassEffectEnabled 
          ? "bg-background/95 backdrop-blur-md border-border/30"
          : "bg-background border-border"
      )}>
        <div className="px-4 h-14 flex items-center gap-3">
          {/* Position 1: Hamburger Menu - Removed, now in icon row */}

          {/* Position 2: Page Title - Centered */}
          <div className="flex-1 flex items-center justify-center">
            <h1 className="text-lg font-semibold text-center">{title}</h1>
          </div>

          {/* Position 3: Right Icons - New Chat and History (only for chat page) */}
          {onNewChat && (
            <div className="flex items-center gap-2">
              {/* New Chat Button */}
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

              {/* Chat History Button */}
              <div className="relative" ref={chatHistoryRef}>
                <button
                  onClick={() => {
                    setChatHistoryOpen(!chatHistoryOpen);
                    if (!chatHistoryOpen) {
                      refetchHistory();
                    }
                  }}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  aria-label="Chat-Verlauf"
                >
                  <History className="w-5 h-5" />
                </button>

                {/* Chat History Dropdown */}
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
          )}
        </div>
      </header>
    </>
  );
}

