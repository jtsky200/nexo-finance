import { trpc } from "@/lib/trpc";

import { UNAUTHED_ERR_MSG } from '@shared/const';

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { httpBatchLink, TRPCClientError } from "@trpc/client";

import { createRoot } from "react-dom/client";

import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";

import { auth } from "./lib/firebase";
import './lib/i18n';

// Initialize background systems
import './lib/backgroundTaskManager';
import './lib/backgroundSync'; // Background Sync Manager
import './lib/websocketClient'; // WebSocket Client
import './lib/workflowOrchestrator';
import './lib/debugWorkflow'; // Debug utilities

// Initialize security monitoring
import { initializeAppCheckService } from './lib/appCheck';

// Initialize App Check on app startup
if (typeof window !== 'undefined') {
  initializeAppCheckService().catch((error) => {
    console.error('[Main] Failed to initialize App Check:', error);
  });
} 

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

// Subscribe to query cache updates to log errors with Request IDs
queryClient.getQueryCache().subscribe((event) => {
  if (event?.type === 'updated' && event?.query?.state?.error) {
    const error = event.query.state.error;
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

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG || error.data?.code === 'UNAUTHORIZED';

  if (!isUnauthorized) return;

  // Use Firebase Auth login page instead of OAuth portal
  const loginUrl = getLoginUrl();
  window.location.href = loginUrl || '/login';
};

// Only redirect on query errors, not mutation errors (mutations handle their own errors)
queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    // Only redirect for auth queries, not for AI chat mutations
    const queryKey = event.query.queryKey;
    if (Array.isArray(queryKey) && queryKey[0] === 'auth' && queryKey[1] === 'me') {
      redirectToLoginIfUnauthorized(error);
    }
  }
});

// Don't auto-redirect on mutation errors - let components handle them
// This prevents logout when clicking on chat messages that trigger errors

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      async fetch(input, init) {
        // Get Firebase Auth token
        let authToken: string | null = null;
        try {
          const user = auth.currentUser;
          if (user) {
            authToken = await user.getIdToken();
          }
        } catch (error) {
          // Token fetch failed, continue without token
        }

        // Add Authorization header if token is available
        const headers = new Headers(init?.headers);
        if (authToken) {
          headers.set('Authorization', `Bearer ${authToken}`);
        }

        // Add App Check token for security verification with action name
        try {
          const { getAppCheckTokenForAction } = await import('./lib/appCheck');
          
          // Detect action from request URL/path
          // tRPC requests have format: /api/trpc/{procedure}.{method}?input=...
          let action: string | undefined;
          const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : String(input));
          const urlPath = new URL(url, window.location.origin).pathname;
          
          // Extract procedure name from tRPC path (e.g., /api/trpc/auth.login -> 'login')
          const trpcMatch = urlPath.match(/\/api\/trpc\/([^.]+)/);
          if (trpcMatch) {
            const procedure = trpcMatch[1];
            // Map procedure names to actions
            if (procedure.includes('login') || procedure.includes('signIn')) {
              action = 'login';
            } else if (procedure.includes('register') || procedure.includes('signUp')) {
              action = 'register';
            } else if (procedure.includes('reset') || procedure.includes('password')) {
              action = 'reset_password';
            } else if (procedure.includes('chat') || procedure.includes('ai')) {
              action = 'chat';
            } else if (procedure.includes('create') || procedure.includes('add')) {
              action = 'submit';
            } else if (procedure.includes('update') || procedure.includes('edit')) {
              action = 'submit';
            } else if (procedure.includes('delete') || procedure.includes('remove')) {
              action = 'delete';
            } else {
              // Default action for other requests
              action = 'api_call';
            }
          }
          
          // Get token with action name (or without if action not detected)
          const appCheckToken = action 
            ? await getAppCheckTokenForAction(action)
            : await (await import('./lib/appCheck')).getAppCheckToken();
            
          if (appCheckToken) {
            headers.set('X-Firebase-AppCheck', appCheckToken);
            // Also send action name in header for backend analytics
            if (action) {
              headers.set('X-AppCheck-Action', action);
            }
          }
        } catch (error) {
          // App Check token fetch failed, continue without it
          // This is non-critical - App Check is optional but recommended
          if (process.env.NODE_ENV === 'development') {
            console.warn('[tRPC] Failed to get App Check token:', error);
          }
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

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
