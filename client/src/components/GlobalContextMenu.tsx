import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { 
  Copy, 
  Home, 
  Calendar, 
  Users, 
  FileText, 
  ShoppingCart, 
  Receipt, 
  MessageSquare,
  Settings,
  HelpCircle,
  Search,
  RefreshCw
} from 'lucide-react';

export default function GlobalContextMenu() {
  const { t } = useTranslation();
  const [location, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      // Ignore if clicking on interactive elements (buttons, inputs, etc.)
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.closest('button') ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('select') ||
        target.closest('[data-radix-context-menu-trigger]') ||
        target.closest('[data-radix-context-menu-content]') ||
        target.closest('[role="menu"]') ||
        target.closest('[data-global-context-menu]')
      ) {
        return; // Let default context menu or specific context menus handle it
      }

      e.preventDefault();
      e.stopPropagation();

      // Get selected text
      const selection = window.getSelection();
      const text = selection?.toString().trim() || '';
      setSelectedText(text);

      // Set position, ensuring menu stays within viewport
      const menuWidth = 224; // min-w-[14rem] = 224px
      const menuHeight = 400; // approximate max height
      const x = e.clientX + menuWidth > window.innerWidth 
        ? window.innerWidth - menuWidth - 10 
        : e.clientX;
      const y = e.clientY + menuHeight > window.innerHeight 
        ? window.innerHeight - menuHeight - 10 
        : e.clientY;
      setPosition({ x: Math.max(10, x), y: Math.max(10, y) });
      setMenuOpen(true);
    };

    const handleClick = (e: MouseEvent) => {
      // Close menu if clicking outside
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleCopy = () => {
    if (selectedText) {
      navigator.clipboard.writeText(selectedText);
    } else {
      // Copy current URL
      navigator.clipboard.writeText(window.location.href);
    }
    setMenuOpen(false);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleSearch = () => {
    if (selectedText) {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(selectedText)}`;
      window.open(searchUrl, '_blank');
    }
    setMenuOpen(false);
  };

  const navigationActions = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: <Home className="w-4 h-4" />, path: '/dashboard' },
    { id: 'calendar', label: t('nav.calendar'), icon: <Calendar className="w-4 h-4" />, path: '/calendar' },
    { id: 'people', label: t('nav.people'), icon: <Users className="w-4 h-4" />, path: '/people' },
    { id: 'bills', label: t('nav.bills'), icon: <Receipt className="w-4 h-4" />, path: '/bills' },
    { id: 'documents', label: t('nav.documents'), icon: <FileText className="w-4 h-4" />, path: '/documents' },
    { id: 'shopping', label: t('nav.shopping'), icon: <ShoppingCart className="w-4 h-4" />, path: '/shopping' },
    { id: 'aiChat', label: t('nav.assistant'), icon: <MessageSquare className="w-4 h-4" />, path: '/ai-chat' },
  ];

  const commonActions = [
    { id: 'copy', label: selectedText ? t('common.copy') : t('common.copyUrl'), icon: <Copy className="w-4 h-4" />, onClick: handleCopy },
    { id: 'refresh', label: t('common.refresh'), icon: <RefreshCw className="w-4 h-4" />, onClick: handleRefresh },
  ];

  if (selectedText) {
    commonActions.splice(1, 0, {
      id: 'search',
      label: t('common.search'),
      icon: <Search className="w-4 h-4" />,
      onClick: handleSearch,
    });
  }

  const settingsActions = [
    { id: 'settings', label: t('nav.settings'), icon: <Settings className="w-4 h-4" />, path: '/settings' },
    { id: 'help', label: t('common.help'), icon: <HelpCircle className="w-4 h-4" />, path: '/help' },
  ];

  if (!menuOpen) return null;

  const menuContent = (
    <div
      ref={menuRef}
      data-global-context-menu
      className="fixed z-[10000] min-w-[14rem] rounded-md border bg-popover text-popover-foreground shadow-md"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(0, 0)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-1">
        {/* Navigation */}
        {navigationActions.map((action) => (
          <button
            key={action.id}
            onClick={() => {
              setLocation(action.path);
              setMenuOpen(false);
            }}
            className={cn(
              "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
              location === action.path && "bg-accent"
            )}
          >
            <span className="mr-2">{action.icon}</span>
            {action.label}
          </button>
        ))}

        {commonActions.length > 0 && (
          <div className="my-1 h-px bg-border" />
        )}

        {/* Common Actions */}
        {commonActions.map((action) => (
          <button
            key={action.id}
            onClick={() => {
              action.onClick();
              setMenuOpen(false);
            }}
            className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
          >
            <span className="mr-2">{action.icon}</span>
            {action.label}
          </button>
        ))}

        <div className="my-1 h-px bg-border" />

        {/* Settings */}
        {settingsActions.map((action) => (
          <button
            key={action.id}
            onClick={() => {
              setLocation(action.path);
              setMenuOpen(false);
            }}
            className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
          >
            <span className="mr-2">{action.icon}</span>
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );

  return createPortal(menuContent, document.body);
}
