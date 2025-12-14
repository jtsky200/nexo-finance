import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { 
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ChatSidebar from './ChatSidebar';
import { useGlassEffect } from '@/hooks/useGlassEffect';

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
  
  const sidebarOpen = externalSidebarOpen !== undefined ? externalSidebarOpen : internalSidebarOpen;
  const setSidebarOpen = onSidebarToggle || setInternalSidebarOpen;

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

          {/* Position 3: Right Icons entfernt - alles ist bereits im Hamburger-Menü verfügbar */}
        </div>
      </header>
    </>
  );
}

