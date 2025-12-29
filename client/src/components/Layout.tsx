import { useState, ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import AIChatFloatingButton from './AIChatFloatingButton';
import { TutorialHighlight, startTutorial } from './TutorialHighlight';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTranslation } from 'react-i18next';
import { eventBus, Events } from '@/lib/eventBus';
import GlobalContextMenu from './GlobalContextMenu';

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
  const { t } = useTranslation();
  
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

  // Auto-start tutorial on first login (after onboarding completed)
  useEffect(() => {
    const checkAndStartTutorial = async () => {
      if (loading || !user || isOnboardingPage || location === '/login' || location === '/register' || location === '/onboarding') {
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        
        // Check if tutorial should be shown (first login after onboarding)
        if (userData?.onboardingCompleted && !userData?.tutorialShown && userData?.tutorialEnabled !== false) {
          // Wait a bit for the page to load
          setTimeout(() => {
            const tutorialSteps = [
              {
                selector: '[data-tutorial="dashboard"]',
                title: t('tutorial.dashboard.title', 'Willkommen im Dashboard'),
                description: t('tutorial.dashboard.description', 'Hier sehen Sie eine Übersicht über Ihre Finanzen, Termine und Erinnerungen.'),
              },
              {
                selector: '[data-tutorial="navigation"]',
                title: t('tutorial.navigation.title', 'Navigation'),
                description: t('tutorial.navigation.description', 'Nutzen Sie die Seitenleiste, um zwischen verschiedenen Bereichen zu wechseln.'),
              },
              {
                selector: '[data-tutorial="user-menu"]',
                title: t('tutorial.userMenu.title', 'Benutzermenü'),
                description: t('tutorial.userMenu.description', 'Hier finden Sie Einstellungen, Hilfe und können das Tutorial jederzeit neu starten.'),
              },
            ];
            startTutorial(tutorialSteps);
            
            // Mark tutorial as shown
            updateDoc(doc(db, 'users', user.uid), { tutorialShown: true });
          }, 1000);
        }
      } catch (error) {
        console.error('Error checking tutorial status:', error);
      }
    };

    checkAndStartTutorial();
  }, [user, loading, location, isOnboardingPage, t]);

  if (loading || isCheckingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t('common.loading', 'Wird geladen...')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main content area */}
      <div className="lg:pl-64 flex flex-col flex-1 overflow-hidden">
        {/* Topbar - Fixed */}
        <Topbar 
          title={title} 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        />

        {/* Page content - Scrollable */}
        <main className="p-4 md:p-6 lg:p-8 flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Floating AI Chat Button - nur anzeigen wenn nicht auf AI-Chat-Seite */}
      {!isAIChatPage && <AIChatFloatingButton />}

      {/* Tutorial Highlight System */}
      <TutorialHighlight 
        onOpenChat={() => {
          // Öffne den Chat-Dialog über EventBus
          eventBus.emit(Events.CHAT_DIALOG_OPEN);
        }}
      />

      {/* Global Context Menu */}
      <GlobalContextMenu />
    </div>
  );
}
