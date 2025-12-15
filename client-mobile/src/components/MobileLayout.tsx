import { ReactNode } from 'react';
import PageHeader from './PageHeader';

interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
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
}

export default function MobileLayout({ 
  children, 
  title = 'Nexo',
  showSidebar = false,
  showQuickActions = false,
  quickActions = [],
  currentChatId,
  onSelectChat,
  onNewChat
}: MobileLayoutProps) {
  // Bottom Navigation entfernt - alle Funktionen sind im Hamburger-Menü verfügbar

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - ChatGPT-style, konsistent auf allen Seiten */}
      <PageHeader
        title={title}
        showSidebar={showSidebar}
        showQuickActions={showQuickActions}
        quickActions={quickActions}
        currentChatId={currentChatId}
        onSelectChat={onSelectChat}
        onNewChat={onNewChat}
      />

      {/* Main Content - Add padding-top to account for fixed header */}
      <main className="flex-1 overflow-y-auto pt-14" style={{ touchAction: 'pan-y' }}>
        <div className="mobile-container py-4">
          {children}
        </div>
      </main>

      {/* Bottom Navigation entfernt - alle Funktionen sind im Hamburger-Menü verfügbar */}
    </div>
  );
}
