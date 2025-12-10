import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { initTRPC, TRPCError } from '@trpc/server';

import { onRequest } from 'firebase-functions/v2/https';

import { z } from 'zod';

import * as admin from 'firebase-admin';

// Initialize tRPC for Firebase Functions without transformer (superjson is ESM only)
// We'll handle serialization manually if needed
const t = initTRPC.context<{
  user: any | null;
  req: Request;
}>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// Middleware to require authentication
const requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User must be authenticated' });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

// Create context for Firebase Functions
async function createContext(opts: { req: Request }): Promise<{ user: any | null; req: Request }> {
  let user: any = null;

  try {
    // Try to get user from Firebase Auth token
    const authHeader = opts.req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      // Get Firebase Auth user info
      const firebaseUser = await admin.auth().getUser(decodedToken.uid);
      
      // Get user from Firestore
      let userDoc = await admin.firestore()
        .collection('users')
        .where('openId', '==', decodedToken.uid)
        .limit(1)
        .get();
      
      if (userDoc.empty) {
        // User doesn't exist in Firestore, create it
        const newUserData = {
          openId: decodedToken.uid,
          name: firebaseUser.displayName || null,
          email: firebaseUser.email || null,
          loginMethod: firebaseUser.providerData[0]?.providerId || null,
          lastSignedIn: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        
        const newUserRef = await admin.firestore().collection('users').add(newUserData);
        user = {
          id: newUserRef.id,
          ...newUserData,
        };
      } else {
        // User exists, update lastSignedIn
        const userData = userDoc.docs[0].data();
        await userDoc.docs[0].ref.update({
          lastSignedIn: admin.firestore.FieldValue.serverTimestamp(),
        });
        user = {
          id: userDoc.docs[0].id,
          ...userData,
        };
      }
    }
  } catch (error) {
    // Authentication is optional for public procedures
    // Log error for debugging but don't throw
    console.error('[tRPC] Auth error:', error);
    user = null;
  }

  return {
    req: opts.req,
    user,
  };
}

// Import invokeLLM function (we'll need to adapt it for Firebase Functions)
async function invokeLLM(params: {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
}, apiKey: string): Promise<any> {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('BUILT_IN_FORGE_API_KEY is not configured. Please set it in Firebase Functions environment variables or secrets.');
  }

  const payload = {
    model: 'gemini-2.5-flash',
    messages: params.messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    })),
    max_tokens: 32768,
    thinking: {
      budget_tokens: 128,
    },
  };

  const response = await fetch('https://api.forge.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`
    );
  }

  return await response.json();
}

// Create tRPC router for Firebase Functions
const appRouter = router({
  ai: router({
    chat: protectedProcedure
      .input(z.object({
        messages: z.array(z.object({
          role: z.enum(['system', 'user', 'assistant']),
          content: z.string(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Get API key from environment variable
          // For production, set it as a Firebase Secret and access via process.env
          // For development, you can set it as an environment variable
          // To set as secret: firebase functions:secrets:set BUILT_IN_FORGE_API_KEY
          // Then redeploy: firebase deploy --only functions:trpc
          const apiKey = process.env.BUILT_IN_FORGE_API_KEY || process.env.FORGE_API_KEY || '';
          
          if (!apiKey || apiKey.trim() === '') {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'BUILT_IN_FORGE_API_KEY is not configured. Please set it using: firebase functions:secrets:set BUILT_IN_FORGE_API_KEY. See SETUP_FORGE_API_KEY.md for instructions.',
            });
          }
          const result = await invokeLLM({
            messages: input.messages,
          }, apiKey);

          // Extract the assistant's response
          const assistantMessage = result.choices[0]?.message;
          if (!assistantMessage) {
            throw new Error('No response from AI');
          }

          // Handle both string and array content
          const content = typeof assistantMessage.content === 'string'
            ? assistantMessage.content
            : Array.isArray(assistantMessage.content)
            ? assistantMessage.content
                .filter((c: any): c is { type: 'text'; text: string } => c.type === 'text')
                .map((c: { text: string }) => c.text)
                .join('\n')
            : 'Keine Antwort erhalten';

          return {
            content,
            usage: result.usage,
          };
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error instanceof Error ? error.message : 'AI request failed',
            cause: error,
          });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;

// Export tRPC HTTP function
// Note: secrets array is optional - if secret doesn't exist, we'll use env vars as fallback
export const trpc = onRequest(
  {
    cors: true,
    maxInstances: 10,
    // Only include secret if it exists (for development, you can deploy without it)
    // For production, set the secret first: firebase functions:secrets:set BUILT_IN_FORGE_API_KEY
  },
  async (req, res) => {
    try {
      // Build full URL
      const protocol = req.protocol || 'https';
      const host = req.get('host') || '';
      const path = req.url || '/';
      const url = `${protocol}://${host}${path}`;
      
      // Get request body
      let body: string | undefined;
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        if (req.body) {
          body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        } else {
          // Read body from stream if not already parsed
          body = await new Promise<string>((resolve, reject) => {
            let data = '';
            req.on('data', (chunk: Buffer) => {
              data += chunk.toString();
            });
            req.on('end', () => resolve(data));
            req.on('error', reject);
          });
        }
      }
      
      // Convert headers
      const headers = new Headers();
      Object.keys(req.headers).forEach(key => {
        const value = req.headers[key];
        if (value) {
          if (Array.isArray(value)) {
            value.forEach(v => headers.append(key, v));
          } else {
            headers.set(key, value);
          }
        }
      });
      
      const fetchReq = new Request(url, {
        method: req.method,
        headers,
        body,
      });

      const response = await fetchRequestHandler({
        endpoint: '/api/trpc',
        req: fetchReq,
        router: appRouter,
        createContext: () => createContext({ req: fetchReq }),
      });

      // Convert Fetch Response to Express response
      // Clone response to avoid "body already read" errors
      const responseClone = response.clone();
      
      res.status(response.status);
      
      // Copy all headers from response
      response.headers.forEach((value, key) => {
        // Skip problematic headers that Express handles automatically
        const lowerKey = key.toLowerCase();
        if (lowerKey !== 'content-encoding' && 
            lowerKey !== 'transfer-encoding' && 
            lowerKey !== 'content-length') {
          res.setHeader(key, value);
        }
      });
      
      // Get response body - tRPC always returns JSON
      const text = await responseClone.text();
      res.send(text);
    } catch (error) {
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

