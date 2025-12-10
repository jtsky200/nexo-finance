import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { initTRPC, TRPCError } from '@trpc/server';

import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';

import { z } from 'zod';

import * as admin from 'firebase-admin';

// Define the secret for OpenAI API Key
const openaiApiKeySecret = defineSecret('OPENAI_API_KEY');

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

// OpenAI Assistant ID - can be set via environment variable or secret
// Default: asst_Es1kVA8SKX4G4LPtsvDtCFp9 (your current assistant)
function getOpenAIAssistantId(): string {
  // Try environment variable first
  if (process.env.OPENAI_ASSISTANT_ID) {
    return process.env.OPENAI_ASSISTANT_ID;
  }
  // Fallback to default
  return 'asst_Es1kVA8SKX4G4LPtsvDtCFp9';
}

// Use OpenAI Assistants API
async function invokeLLM(params: {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
}, apiKey: string): Promise<any> {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('OPENAI_API_KEY is not configured. Please set it in Firebase Functions environment variables or secrets.');
  }

  // Extract user messages (skip system message, it's handled by the assistant)
  const userMessages = params.messages.filter(msg => msg.role === 'user');
  if (userMessages.length === 0) {
    throw new Error('No user messages found');
  }

  // Get the last user message
  const lastUserMessage = userMessages[userMessages.length - 1];

  // Create a thread and send message to OpenAI Assistant
  // Step 1: Create a thread
  const threadResponse = await fetch('https://api.openai.com/v1/threads', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'OpenAI-Beta': 'assistants=v2',
    },
    body: JSON.stringify({}),
  });

  if (!threadResponse.ok) {
    const errorText = await threadResponse.text();
    throw new Error(
      `Failed to create thread: ${threadResponse.status} ${threadResponse.statusText} – ${errorText}`
    );
  }

  const thread = await threadResponse.json();
  const threadId = thread.id;

  try {
    // Step 2: Add message to thread
    const messageResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        role: 'user',
        content: lastUserMessage.content,
      }),
    });

    if (!messageResponse.ok) {
      const errorText = await messageResponse.text();
      throw new Error(
        `Failed to add message: ${messageResponse.status} ${messageResponse.statusText} – ${errorText}`
      );
    }

    // Step 3: Run the assistant
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify({
        assistant_id: getOpenAIAssistantId(),
      }),
    });

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      throw new Error(
        `Failed to run assistant: ${runResponse.status} ${runResponse.statusText} – ${errorText}`
      );
    }

    const run = await runResponse.json();
    let runId = run.id;
    let runStatus = run.status;

    // Step 4: Poll for completion (max 30 seconds)
    const maxAttempts = 30;
    let attempts = 0;
    while (runStatus === 'queued' || runStatus === 'in_progress') {
      if (attempts >= maxAttempts) {
        throw new Error('Assistant run timed out');
      }

      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

      const statusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'OpenAI-Beta': 'assistants=v2',
        },
      });

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        throw new Error(
          `Failed to check run status: ${statusResponse.status} ${statusResponse.statusText} – ${errorText}`
        );
      }

      const runStatusData = await statusResponse.json();
      runStatus = runStatusData.status;
      attempts++;
    }

    if (runStatus !== 'completed') {
      throw new Error(`Assistant run failed with status: ${runStatus}`);
    }

    // Step 5: Get the messages from the thread
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'OpenAI-Beta': 'assistants=v2',
      },
    });

    if (!messagesResponse.ok) {
      const errorText = await messagesResponse.text();
      throw new Error(
        `Failed to get messages: ${messagesResponse.status} ${messagesResponse.statusText} – ${errorText}`
      );
    }

    const messagesData = await messagesResponse.json();
    
    // Find the assistant's response (first message with role 'assistant')
    const assistantMessage = messagesData.data.find((msg: any) => msg.role === 'assistant');
    
    if (!assistantMessage) {
      throw new Error('No assistant response found');
    }

    // Extract text content from the message
    const content = assistantMessage.content[0]?.text?.value || '';
    
    return {
      choices: [{
        message: {
          role: 'assistant',
          content: content,
        },
      }],
      usage: {
        prompt_tokens: 0, // OpenAI doesn't provide this in the response
        completion_tokens: 0,
        total_tokens: 0,
      },
    };
  } finally {
    // Clean up: delete the thread (optional, but good practice)
    try {
      await fetch(`https://api.openai.com/v1/threads/${threadId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'OpenAI-Beta': 'assistants=v2',
        },
      });
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

// Rule-based response system (no API key needed)
function getRuleBasedResponse(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>): { content: string; usage?: any } {
  const lastMessage = messages[messages.length - 1];
  const userMessage = lastMessage?.content?.toLowerCase() || '';
  
  // Extract keywords and provide helpful responses
  if (userMessage.includes('rechnung') || userMessage.includes('rechnungsverwaltung')) {
    return {
      content: `**Rechnungsverwaltung in Nexo:**

1. **Rechnung scannen**: Nutze die Dokumente-Funktion, um Rechnungen zu scannen
2. **Rechnung erstellen**: Gehe zu "Rechnungen" und klicke auf "Neu erstellen"
3. **Rechnungen verwalten**: Alle Rechnungen findest du in der Rechnungen-Übersicht
4. **Automatische Erkennung**: Die App erkennt automatisch Beträge, Daten und Händler

Möchtest du mehr über eine spezifische Funktion erfahren?`,
    };
  }
  
  if (userMessage.includes('erinnerung') || userMessage.includes('termin')) {
    return {
      content: `**Erinnerungen erstellen:**

1. Gehe zum **Kalender** oder **Erinnerungen**-Bereich
2. Klicke auf das **+** Symbol oder "Neue Erinnerung"
3. Fülle die Details aus:
   - Titel
   - Datum und Uhrzeit
   - Wiederholung (optional)
   - Notizen
4. Speichere die Erinnerung

Erinnerungen werden dir automatisch zur gewählten Zeit angezeigt.`,
    };
  }
  
  if (userMessage.includes('finanz') || userMessage.includes('geld') || userMessage.includes('ausgabe')) {
    return {
      content: `**Finanzen verwalten:**

1. **Einnahmen/Ausgaben erfassen**: Gehe zu "Finanzen" und klicke auf "Neu"
2. **Kategorien**: Ordne deine Transaktionen Kategorien zu
3. **Übersicht**: Sieh deine Finanzen in der Dashboard-Ansicht
4. **Statistiken**: Analysiere deine Ausgaben nach Kategorien

Tipp: Nutze die Rechnungsverwaltung, um Ausgaben automatisch zu erfassen.`,
    };
  }
  
  if (userMessage.includes('einkaufsliste') || userMessage.includes('einkaufen')) {
    return {
      content: `**Einkaufsliste nutzen:**

1. Gehe zum **Einkaufsliste**-Bereich
2. Füge Artikel hinzu mit dem **+** Button
3. Markiere gekaufte Artikel als erledigt
4. Lösche Artikel nach dem Einkauf

Die Einkaufsliste hilft dir, nichts zu vergessen und organisiert zu bleiben.`,
    };
  }
  
  if (userMessage.includes('raten') || userMessage.includes('rate') || userMessage.includes('zahlungsplan')) {
    return {
      content: `**Raten-System:**

1. Erstelle eine Rechnung mit Ratenzahlung
2. Wähle die Anzahl der Raten
3. Die App teilt den Betrag automatisch auf
4. Du erhältst Erinnerungen für jede Rate

So kannst du größere Ausgaben über mehrere Monate verteilen.`,
    };
  }
  
  if (userMessage.includes('scannen') || userMessage.includes('scan')) {
    return {
      content: `**Rechnung scannen:**

1. Gehe zu **Dokumente** oder **Rechnungen**
2. Klicke auf "Rechnung scannen" oder das Kamera-Symbol
3. Fotografiere die Rechnung
4. Die App erkennt automatisch:
   - Betrag
   - Datum
   - Händler
   - Artikel (wenn möglich)
5. Überprüfe und speichere

Die App nutzt OCR-Technologie für die automatische Erkennung.`,
    };
  }
  
  // Default helpful response
  return {
    content: `Ich helfe dir gerne bei Fragen zu Nexo! 

**Häufige Themen:**
- 📄 Rechnungsverwaltung
- 📅 Erinnerungen & Termine
- 💰 Finanzen verwalten
- 🛒 Einkaufsliste
- 📊 Raten-System
- 📷 Rechnungen scannen

Stelle eine spezifische Frage zu einer dieser Funktionen, und ich gebe dir eine detaillierte Anleitung!`,
  };
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
          // Get OpenAI API key from secret or environment variable
          let apiKey = '';
          try {
            apiKey = openaiApiKeySecret.value();
          } catch (error) {
            // Secret not available, try environment variable
            apiKey = process.env.OPENAI_API_KEY || process.env.BUILT_IN_FORGE_API_KEY || '';
          }
          
          // If no API key, use rule-based responses (free, no external API needed)
          if (!apiKey || apiKey.trim() === '') {
            return getRuleBasedResponse(input.messages);
          }
          
          // Use OpenAI Assistants API if key is available
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
export const trpc = onRequest(
  {
    cors: true,
    maxInstances: 10,
    secrets: [openaiApiKeySecret], // Include the secret in the function configuration
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

