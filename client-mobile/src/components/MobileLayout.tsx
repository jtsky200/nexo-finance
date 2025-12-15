import { ReactNode } from 'react';
import { useLocation } from 'wouter';
import PageHeader from './PageHeader';
import QuickActions from './QuickActions';

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
  hideQuickActions?: boolean;
}

export default function MobileLayout({ 
  children, 
  title = 'Nexo',
  showSidebar = false,
  showQuickActions = false,
  quickActions = [],
  currentChatId,
  onSelectChat,
  onNewChat,
  hideQuickActions = false
}: MobileLayoutProps) {
  const [location] = useLocation();
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

      {/* Quick Actions - Always visible on all pages unless explicitly hidden */}
      {!hideQuickActions && <QuickActions currentPath={location} />}

      {/* Main Content - Add padding-top to account for fixed header and quick actions */}
      <main className="flex-1 overflow-y-auto" style={{ paddingTop: hideQuickActions ? '3.5rem' : '7rem', touchAction: 'pan-y' }}>
        <div className="mobile-container py-4">
          {children}
        </div>
      </main>

      {/* Bottom Navigation entfernt - alle Funktionen sind im Hamburger-Menü verfügbar */}
    </div>
  );
}
