import './lib/i18n'; // Initialize i18n
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { trpc } from "./lib/trpc";
import { auth } from "./lib/firebase";
import App from "./App";
import "./index.css";

// Initialize background systems after React is ready
import { registerServiceWorker } from './lib/notifications';

// Initialize background systems after DOM is ready
if (typeof window !== 'undefined') {
  // Use setTimeout to ensure React is initialized first
  setTimeout(async () => {
    try {
      await import('./lib/eventBus');
      await import('./lib/backgroundTaskManager');
      await import('./lib/workflowOrchestrator');
    } catch (error) {
      // Silently fail in production, log in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Main] Background systems initialization failed:', error);
      }
    }
  }, 100);
}

// Register service worker for offline support and notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    registerServiceWorker().catch((error) => {
      console.error('[Main] Service Worker registration failed:', error);
    });
  });
}

const UNAUTHED_ERR_MSG = 'UNAUTHORIZED';
const getLoginUrl = () => '/login';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error instanceof TRPCClientError) {
          const status = (error as any).data?.httpStatus;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
    },
  },
});

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG || error.data?.code === 'UNAUTHORIZED';

  if (!isUnauthorized) return;

  const loginUrl = getLoginUrl();
  window.location.href = loginUrl || '/login';
};

// Subscribe to query cache updates to log errors with Request IDs and handle auth redirects
queryClient.getQueryCache().subscribe((event) => {
  if (event?.type === 'updated' && event?.query?.state?.error) {
    const error = event.query.state.error;
    
    // Log all query errors with Request IDs
    if (error instanceof TRPCClientError) {
      const requestId = (error as any).data?.requestId || 
                      (error as any).meta?.requestId ||
                      null;
      console.error('[Query Error]', {
        message: error.message,
        code: error.data?.code,
        requestId,
        path: error.data?.path,
      });
    }
    
    // Handle auth redirects for unauthorized errors on auth queries
    if (event.action?.type === "error") {
      const queryKey = event.query.queryKey;
      if (Array.isArray(queryKey) && queryKey[0] === 'auth' && queryKey[1] === 'me') {
        redirectToLoginIfUnauthorized(error);
      }
    }
  }
});

// Subscribe to mutation cache updates to log errors with Request IDs
queryClient.getMutationCache().subscribe((event) => {
  if (event?.type === 'updated' && event?.mutation?.state?.error) {
    const error = event.mutation.state.error;
    if (error instanceof TRPCClientError) {
      const requestId = (error as any).data?.requestId || 
                      (error as any).meta?.requestId ||
                      null;
      console.error('[Mutation Error]', {
        message: error.message,
        code: error.data?.code,
        requestId,
        path: error.data?.path,
      });
    }
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      async fetch(input, init) {
        let authToken: string | null = null;
        try {
          const user = auth.currentUser;
          if (user) {
            authToken = await user.getIdToken();
          }
        } catch (error) {
          // Token fetch failed, continue without token
        }

        const headers = new Headers(init?.headers);
        if (authToken) {
          headers.set('Authorization', `Bearer ${authToken}`);
        }

        try {
          const response = await globalThis.fetch(input, {
            ...(init ?? {}),
            headers,
            credentials: "include",
          });

          // Capture Request ID from response headers for error tracking
          const requestId = response.headers.get('x-goog-request-id') || 
                          response.headers.get('x-cloud-trace-context')?.split('/')[0] ||
                          null;
          
          if (requestId && !response.ok) {
            const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : String(input));
            console.error('[tRPC] Request failed with Request ID:', {
              requestId,
              status: response.status,
              statusText: response.statusText,
              url,
            });
          }

          return response;
        } catch (error) {
          // Log network errors with context
          const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : String(input));
          console.error('[tRPC] Network error:', {
            error: error instanceof Error ? error.message : String(error),
            url,
          });
          throw error;
        }
      },
    }),
  ],
});

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error('Root element not found');
}

// Show loading immediately
rootElement.innerHTML = '<div style="padding: 20px; text-align: center;"><p>Lädt...</p></div>';

// Global error handler
window.addEventListener('error', (event) => {
  console.error('[Global Error]', event.error);
  if (rootElement && !rootElement.querySelector('h1')) {
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: system-ui;">
        <h1>Fehler beim Laden</h1>
        <p>${event.error?.message || 'Unbekannter Fehler'}</p>
        <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">Seite neu laden</button>
      </div>
    `;
  }
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Rejection]', event.reason);
});

// Render the app
try {
  const root = createRoot(rootElement);
  root.render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
  console.log('[Main] App rendered successfully');
} catch (error) {
  console.error('[Main] Failed to render app:', error);
  const errorMsg = error instanceof Error ? error.message : String(error);
  rootElement.innerHTML = `
    <div style="padding: 20px; text-align: center; font-family: system-ui;">
      <h1>Fehler beim Laden</h1>
      <p>Die Anwendung konnte nicht geladen werden.</p>
      <p style="color: #666; font-size: 14px; margin-top: 10px; font-family: monospace;">${errorMsg}</p>
      <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">Seite neu laden</button>
    </div>
  `;
}
