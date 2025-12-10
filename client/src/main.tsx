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

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG || error.data?.code === 'UNAUTHORIZED';

  if (!isUnauthorized) return;

  // Use Firebase Auth login page instead of OAuth portal
  const loginUrl = getLoginUrl();
  window.location.href = loginUrl || '/login';
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
  }
});

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

        return globalThis.fetch(input, {
          ...(init ?? {}),
          headers,
          credentials: "include",
        });
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
