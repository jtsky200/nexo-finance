import { Route, Switch, useLocation } from 'wouter';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Import pages directly (temporarily disable lazy loading to fix blank page)
import Dashboard from '@/pages/Dashboard';
import Finance from '@/pages/Finance';
import Shopping from '@/pages/Shopping';
import Bills from '@/pages/Bills';
import Settings from '@/pages/Settings';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Onboarding from '@/pages/Onboarding';
import AIChat from '@/pages/AIChat';
import Calendar from '@/pages/Calendar';
import Reminders from '@/pages/Reminders';
import People from '@/pages/People';
import Documents from '@/pages/Documents';
import Taxes from '@/pages/Taxes';

// Protected Route Wrapper Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (loading || !user) {
        return;
      }

      // Skip check for login, register, and onboarding pages
      if (location === '/login' || location === '/register' || location === '/onboarding') {
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
  }, [user, loading, location, setLocation]);

  if (loading || isCheckingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Lade...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <ProtectedRoute>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/" component={AIChat} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/calendar" component={Calendar} />
        <Route path="/reminders" component={Reminders} />
        <Route path="/finance" component={Finance} />
        <Route path="/people" component={People} />
        <Route path="/bills" component={Bills} />
        <Route path="/documents" component={Documents} />
        <Route path="/shopping" component={Shopping} />
        <Route path="/taxes" component={Taxes} />
        <Route path="/settings" component={Settings} />
        <Route>
          <AIChat />
        </Route>
      </Switch>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable={true}>
        <AuthProvider>
          <AppRoutes />
          <Toaster position="top-center" richColors />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;