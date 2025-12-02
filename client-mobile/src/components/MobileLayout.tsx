import { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Home, 
  Wallet, 
  ShoppingCart, 
  Settings,
  FileText
} from 'lucide-react';

interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
}

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/finance', icon: Wallet, label: 'Finanzen' },
  { path: '/bills', icon: FileText, label: 'Rechnungen' },
  { path: '/shopping', icon: ShoppingCart, label: 'Einkaufen' },
  { path: '/settings', icon: Settings, label: 'Mehr' },
];

export default function MobileLayout({ children, title }: MobileLayoutProps) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - Clean and minimal */}
      <header className="sticky top-0 z-40 bg-background border-b border-border safe-top">
        <div className="px-4 h-14 flex items-center">
          <h1 className="text-lg font-semibold">{title || 'Nexo'}</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="mobile-container py-4">
          {children}
        </div>
      </main>

      {/* Bottom Navigation - Clean and professional */}
      <nav className="mobile-nav">
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            
            return (
              <Link key={item.path} href={item.path}>
                <button className="w-full h-full flex flex-col items-center justify-center gap-1 touch-target">
                  <Icon 
                    className={`w-5 h-5 transition-colors ${
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    }`} 
                  />
                  <span className={`text-[10px] font-medium transition-colors ${
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {item.label}
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
