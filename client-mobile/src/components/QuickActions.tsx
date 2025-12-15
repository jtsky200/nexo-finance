import { useLocation } from 'wouter';
import { 
  LayoutDashboard,
  Calendar,
  Bell,
  Wallet,
  ShoppingCart,
  MessageSquare,
  ClipboardList,
  ScanLine
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import ChatSidebar from './ChatSidebar';

interface QuickAction {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
}

const defaultQuickActions: QuickAction[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { id: 'calendar', label: 'Kalender', path: '/calendar', icon: Calendar },
  { id: 'reminders', label: 'Erinnerungen', path: '/reminders', icon: Bell },
  { id: 'finance', label: 'Finanzen', path: '/finance', icon: Wallet },
  { id: 'shopping', label: 'Einkaufsliste', path: '/shopping', icon: ShoppingCart },
  { id: 'chat', label: 'Assistent', path: '/aichat', icon: MessageSquare },
  { id: 'bills', label: 'Rechnungen', path: '/bills', icon: ClipboardList },
  { id: 'documents', label: 'Dokumente', path: '/documents', icon: ScanLine },
];

interface QuickActionsProps {
  currentPath?: string;
  customActions?: QuickAction[];
}

export default function QuickActions({ currentPath, customActions }: QuickActionsProps) {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const actions = customActions || defaultQuickActions;
  const current = currentPath || location;

  return (
    <>
      <div className="fixed top-14 left-0 right-0 z-30 px-4 py-3 flex flex-row gap-3 justify-center safe-top overflow-x-auto scrollbar-hide" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
        {/* Hamburger Menu as first icon */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-12 h-12 flex-shrink-0 rounded-full bg-background hover:bg-muted border border-border transition-colors flex items-center justify-center active:scale-95 shadow-sm"
          aria-label="Menü öffnen"
          aria-expanded={sidebarOpen}
          aria-controls="sidebar-menu"
          title="Menü öffnen"
        >
          <LayoutDashboard className="w-5 h-5 text-foreground" />
        </button>
        
        {actions.map((action) => {
          const IconComponent = action.icon;
          const isActive = current === action.path;
          
          return (
            <button
              key={action.id}
              onClick={() => {
                setLocation(action.path);
              }}
              className={`w-12 h-12 flex-shrink-0 rounded-full border transition-colors flex items-center justify-center active:scale-95 shadow-sm ${
                isActive
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-muted border-border'
              }`}
              aria-label={action.label}
              title={action.label}
            >
              <IconComponent className="w-5 h-5" />
            </button>
          );
        })}
      </div>
      
      <ChatSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
    </>
  );
}

