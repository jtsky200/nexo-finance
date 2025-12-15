import { Route, Switch } from 'wouter';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ErrorBoundary from '@/components/ErrorBoundary';

// Import pages directly (temporarily disable lazy loading to fix blank page)
import Dashboard from '@/pages/Dashboard';
import Finance from '@/pages/Finance';
import Shopping from '@/pages/Shopping';
import Bills from '@/pages/Bills';
import Settings from '@/pages/Settings';
import Login from '@/pages/Login';
import AIChat from '@/pages/AIChat';
import Calendar from '@/pages/Calendar';
import Reminders from '@/pages/Reminders';
import People from '@/pages/People';
import Documents from '@/pages/Documents';
import Taxes from '@/pages/Taxes';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable={true}>
        <AuthProvider>
          <Switch>
          <Route path="/login" component={Login} />
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
        <Toaster position="top-center" richColors />
      </AuthProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;