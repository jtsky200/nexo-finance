import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocation } from 'wouter';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the app.
 * 
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // TODO: Log error to error reporting service (e.g., Sentry, Firebase Crashlytics)
    // Example:
    // if (window.Sentry) {
    //   window.Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
    // }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Default Error Fallback UI
 */
function ErrorFallback({
  error,
  errorInfo,
  onReset,
}: {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
}) {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-8 h-8 text-destructive" />
            <CardTitle>Ein Fehler ist aufgetreten</CardTitle>
          </div>
          <CardDescription>
            Die Anwendung ist auf einen unerwarteten Fehler gestoßen. Bitte versuchen Sie es erneut.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && error && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-mono text-destructive break-all">
                {error.toString()}
              </p>
              {errorInfo && errorInfo.componentStack && (
                <details className="mt-2">
                  <summary className="text-xs text-muted-foreground cursor-pointer">
                    Component Stack
                  </summary>
                  <pre className="text-xs mt-2 overflow-auto max-h-32 text-muted-foreground">
                    {errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button
              onClick={onReset}
              className="w-full h-10 min-h-[44px]"
              variant="default"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Erneut versuchen
            </Button>
            <Button
              onClick={() => {
                setLocation('/');
                onReset();
              }}
              className="w-full h-10 min-h-[44px]"
              variant="outline"
            >
              <Home className="w-4 h-4 mr-2" />
              Zur Startseite
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ErrorBoundary;

