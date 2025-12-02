import { Route, Switch } from 'wouter';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Pages
import Dashboard from '@/pages/Dashboard';
import Finance from '@/pages/Finance';
import Shopping from '@/pages/Shopping';
import Bills from '@/pages/Bills';
import Settings from '@/pages/Settings';
import Login from '@/pages/Login';

function App() {
  return (
    <ThemeProvider defaultTheme="light" switchable={true}>
      <AuthProvider>
        <Switch>
          <Route path="/login" component={Login} />
          <Route path="/" component={Dashboard} />
          <Route path="/finance" component={Finance} />
          <Route path="/shopping" component={Shopping} />
          <Route path="/bills" component={Bills} />
          <Route path="/settings" component={Settings} />
          <Route>
            <Dashboard />
          </Route>
        </Switch>
        <Toaster position="top-center" richColors />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

