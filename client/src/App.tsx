import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Reminders from "./pages/Reminders";
import Finance from "./pages/Finance";
import People from "./pages/People";
import Bills from "./pages/Bills";
import Shopping from "./pages/Shopping";
import Taxes from "./pages/Taxes";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Onboarding from "./pages/Onboarding";
import Calendar from "./pages/Calendar";
import Documents from "./pages/Documents";
import AIChat from "./pages/AIChat";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/reminders" component={Reminders} />
      <Route path="/finance" component={Finance} />
      <Route path="/people" component={People} />
      <Route path="/bills" component={Bills} />
      <Route path="/documents" component={Documents} />
      <Route path="/shopping" component={Shopping} />
      <Route path="/taxes" component={Taxes} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/settings" component={Settings} />
      <Route path="/ai-chat" component={AIChat} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable={true}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
