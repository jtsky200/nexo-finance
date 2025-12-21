import { useState, ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import AIChatFloatingButton from './AIChatFloatingButton';
import { TutorialHighlight } from './TutorialHighlight';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface LayoutProps {
  children: ReactNode;
  title: string;
}

export default function Layout({ children, title }: LayoutProps) {
  // Sidebar should be open by default on large screens
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [location, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(false);
  
  // Verstecke den Floating Chat Button auf der AI-Chat-Seite
  const isAIChatPage = location === '/ai-chat';
  const isOnboardingPage = location === '/onboarding';

  useEffect(() => {
    if (!loading && !user) {
      setLocation('/login');
    }
  }, [user, loading, setLocation]);

  // Check onboarding status for protected routes (not login, register, or onboarding)
  useEffect(() => {
    const checkOnboarding = async () => {
      if (loading || !user || isOnboardingPage || location === '/login' || location === '/register') {
        return;
      }

      try {
        setIsCheckingOnboarding(true);
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists() || !userDoc.data().onboardingCompleted) {
          setLocation('/onboarding');
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      } finally {
        setIsCheckingOnboarding(false);
      }
    };

    checkOnboarding();
  }, [user, loading, location, isOnboardingPage, setLocation]);

  if (loading || isCheckingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Wird geladen...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main content area */}
      <div className="lg:pl-64">
        {/* Topbar */}
        <Topbar 
          title={title} 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        />

        {/* Page content */}
        <main className="p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Floating AI Chat Button - nur anzeigen wenn nicht auf AI-Chat-Seite */}
      {!isAIChatPage && <AIChatFloatingButton />}

      {/* Tutorial Highlight System */}
      <TutorialHighlight />
    </div>
  );
}
