import { ReactNode } from 'react';
import { useLocation, Link } from 'wouter';
import { 
  LayoutDashboard, 
  Wallet, 
  ShoppingCart, 
  Bell,
  Settings,
  Receipt
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
}

const navItems = [
  { path: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { path: '/finance', icon: Wallet, labelKey: 'nav.finance' },
  { path: '/bills', icon: Receipt, labelKey: 'nav.bills' },
  { path: '/shopping', icon: ShoppingCart, labelKey: 'nav.shopping' },
  { path: '/settings', icon: Settings, labelKey: 'nav.settings' },
];

export default function MobileLayout({ children, title }: MobileLayoutProps) {
  const [location] = useLocation();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      {title && (
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border safe-top">
          <div className="flex items-center justify-center h-14 px-4">
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="mobile-container py-4">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="mobile-nav z-50">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = location === item.path || 
              (item.path !== '/' && location.startsWith(item.path));
            const Icon = item.icon;
            
            return (
              <Link key={item.path} href={item.path}>
                <button
                  className={`flex flex-col items-center justify-center w-16 h-full touch-target transition-colors ${
                    isActive 
                      ? 'text-primary' 
                      : 'text-muted-foreground'
                  }`}
                >
                  <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : ''}`} />
                  <span className="text-[10px] mt-1 font-medium">
                    {t(item.labelKey, item.labelKey.split('.')[1])}
                  </span>
                </button>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

