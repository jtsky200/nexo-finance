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

// Define OpenAI Functions/Tools for database access
function getOpenAITools(userId: string): any[] {
  if (!userId) return [];
  
  return [
    {
      type: 'function',
      function: {
        name: 'getPersonDebts',
        description: 'Ermittelt die Schulden (offene Rechnungen) einer Person. Gibt den Gesamtbetrag und Details aller offenen Rechnungen zurück.',
        parameters: {
          type: 'object',
          properties: {
            personName: {
              type: 'string',
              description: 'Der Name der Person (z.B. "Pata", "Max", "Anna")',
            },
          },
          required: ['personName'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'getPersonReminders',
        description: 'Ermittelt alle Termine, Erinnerungen und Aufgaben einer Person. Kann nach Datum gefiltert werden.',
        parameters: {
          type: 'object',
          properties: {
            personName: {
              type: 'string',
              description: 'Der Name der Person',
            },
            startDate: {
              type: 'string',
              description: 'Startdatum im Format YYYY-MM-DD (optional)',
            },
            endDate: {
              type: 'string',
              description: 'Enddatum im Format YYYY-MM-DD (optional)',
            },
          },
          required: ['personName'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'getPersonCalendarEvents',
        description: 'Ermittelt Kalender-Events einer Person, einschließlich Ferien, Termine und Zahlungsfristen.',
        parameters: {
          type: 'object',
          properties: {
            personName: {
              type: 'string',
              description: 'Der Name der Person',
            },
            startDate: {
              type: 'string',
              description: 'Startdatum im Format YYYY-MM-DD (optional)',
            },
            endDate: {
              type: 'string',
              description: 'Enddatum im Format YYYY-MM-DD (optional)',
            },
          },
          required: ['personName'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'getFinanceSummary',
        description: 'Erstellt eine Finanz-Zusammenfassung für einen bestimmten Zeitraum. Zeigt Einnahmen, Ausgaben, Kategorien und Sparpotenzial.',
        parameters: {
          type: 'object',
          properties: {
            startDate: {
              type: 'string',
              description: 'Startdatum im Format YYYY-MM-DD (optional, Standard: Anfang des aktuellen Monats)',
            },
            endDate: {
              type: 'string',
              description: 'Enddatum im Format YYYY-MM-DD (optional, Standard: Ende des aktuellen Monats)',
            },
            month: {
              type: 'string',
              description: 'Monat im Format YYYY-MM (z.B. "2024-01" für Januar 2024). Überschreibt startDate und endDate.',
            },
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'getAllPeople',
        description: 'Listet alle Personen auf, die in der Datenbank gespeichert sind. Nützlich, um verfügbare Namen zu finden.',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'searchPerson',
        description: 'Sucht eine Person nach Name (teilweise Übereinstimmung möglich). Gibt Personendetails zurück.',
        parameters: {
          type: 'object',
          properties: {
            searchTerm: {
              type: 'string',
              description: 'Suchbegriff für den Namen (z.B. "Pata", "Max")',
            },
          },
          required: ['searchTerm'],
        },
      },
    },
  ];
}

// Execute function calls from OpenAI Assistant
async function executeFunction(functionName: string, args: any, userId: string): Promise<any> {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const db = admin.firestore();

  switch (functionName) {
    case 'getPersonDebts': {
      const { personName } = args;
      // Find person by name
      const peopleSnapshot = await db.collection('people')
        .where('userId', '==', userId)
        .where('name', '==', personName)
        .get();
      
      if (peopleSnapshot.empty) {
        return { error: `Person "${personName}" nicht gefunden` };
      }

      const personDoc = peopleSnapshot.docs[0];
      const invoicesSnapshot = await personDoc.ref.collection('invoices')
        .where('status', '==', 'offen')
        .get();

      const invoices = invoicesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          description: data.description || '',
          amount: data.amount || 0,
          date: data.date?.toDate?.()?.toISOString() || null,
          dueDate: data.dueDate?.toDate?.()?.toISOString() || null,
        };
      });

      const totalDebt = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

      return {
        personName,
        totalDebt,
        currency: 'CHF',
        invoiceCount: invoices.length,
        invoices,
      };
    }

    case 'getPersonReminders': {
      const { personName, startDate, endDate } = args;
      // Find person by name
      const peopleSnapshot = await db.collection('people')
        .where('userId', '==', userId)
        .where('name', '==', personName)
        .get();
      
      if (peopleSnapshot.empty) {
        return { error: `Person "${personName}" nicht gefunden` };
      }

      const personId = peopleSnapshot.docs[0].id;
      let query: admin.firestore.Query = db.collection('reminders')
        .where('userId', '==', userId)
        .where('personId', '==', personId);

      if (startDate) {
        query = query.where('dueDate', '>=', admin.firestore.Timestamp.fromDate(new Date(startDate)));
      }
      if (endDate) {
        query = query.where('dueDate', '<=', admin.firestore.Timestamp.fromDate(new Date(endDate)));
      }

      const snapshot = await query.orderBy('dueDate').get();
      const reminders = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || '',
          type: data.type || '',
          dueDate: data.dueDate?.toDate?.()?.toISOString() || null,
          amount: data.amount || null,
          currency: data.currency || 'CHF',
          notes: data.notes || '',
        };
      });

      return {
        personName,
        reminderCount: reminders.length,
        reminders,
      };
    }

    case 'getPersonCalendarEvents': {
      const { personName, startDate, endDate } = args;
      // Similar to reminders but includes all calendar events
      const peopleSnapshot = await db.collection('people')
        .where('userId', '==', userId)
        .where('name', '==', personName)
        .get();
      
      if (peopleSnapshot.empty) {
        return { error: `Person "${personName}" nicht gefunden` };
      }

      const personDoc = peopleSnapshot.docs[0];
      const invoicesSnapshot = await personDoc.ref.collection('invoices').get();
      
      const events = invoicesSnapshot.docs
        .map(doc => {
          const data = doc.data();
          const eventDate = data.dueDate?.toDate?.() || data.date?.toDate?.() || data.createdAt?.toDate?.();
          return {
            id: doc.id,
            type: 'invoice',
            title: data.description || 'Rechnung',
            date: eventDate?.toISOString() || null,
            amount: data.amount || 0,
            status: data.status || 'offen',
          };
        })
        .filter(event => {
          if (!startDate && !endDate) return true;
          if (!event.date) return false;
          const eventDate = new Date(event.date);
          if (startDate && eventDate < new Date(startDate)) return false;
          if (endDate && eventDate > new Date(endDate)) return false;
          return true;
        });

      return {
        personName,
        eventCount: events.length,
        events,
      };
    }

    case 'getFinanceSummary': {
      const { startDate, endDate, month } = args;
      let start: Date;
      let end: Date;

      if (month) {
        const [year, monthNum] = month.split('-').map(Number);
        start = new Date(year, monthNum - 1, 1);
        end = new Date(year, monthNum, 0, 23, 59, 59);
      } else {
        start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        end = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);
      }

      const snapshot = await db.collection('financeEntries')
        .where('userId', '==', userId)
        .where('date', '>=', admin.firestore.Timestamp.fromDate(start))
        .where('date', '<=', admin.firestore.Timestamp.fromDate(end))
        .get();

      const entries = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type || 'expense',
          category: data.category || '',
          amount: data.amount || 0,
          description: data.description || '',
          date: data.date?.toDate?.()?.toISOString() || null,
        };
      });

      const income = entries.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
      const expenses = entries.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
      const balance = income - expenses;

      const categories = entries
        .filter(e => e.type === 'expense')
        .reduce((acc: any, e) => {
          acc[e.category] = (acc[e.category] || 0) + e.amount;
          return acc;
        }, {});

      return {
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
        income,
        expenses,
        balance,
        savingsPotential: balance > 0 ? balance : 0,
        categoryBreakdown: Object.entries(categories).map(([category, amount]) => ({
          category,
          amount,
        })),
        entryCount: entries.length,
      };
    }

    case 'getAllPeople': {
      const snapshot = await db.collection('people')
        .where('userId', '==', userId)
        .get();

      const people = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          email: data.email || null,
          phone: data.phone || null,
        };
      });

      return {
        people,
        count: people.length,
      };
    }

    case 'searchPerson': {
      const { searchTerm } = args;
      const snapshot = await db.collection('people')
        .where('userId', '==', userId)
        .get();

      const allPeople = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      const matches = allPeople.filter((person: any) =>
        person.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );

      if (matches.length === 0) {
        return { error: `Keine Person mit "${searchTerm}" gefunden` };
      }

      return {
        matches: matches.map((person: any) => ({
          id: person.id,
          name: person.name,
          email: person.email || null,
          phone: person.phone || null,
        })),
      };
    }

    default:
      throw new Error(`Unknown function: ${functionName}`);
  }
}

// Use OpenAI Assistants API
async function invokeLLM(params: {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
}, apiKey: string, ctx: { user: any | null }): Promise<any> {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('OPENAI_API_KEY is not configured. Please set it in Firebase Functions environment variables or secrets.');
  }
  
  console.log(`[AI Chat] Using API key: ${apiKey.substring(0, 10)}... (length: ${apiKey.length})`);
  console.log(`[AI Chat] Using Assistant ID: ${getOpenAIAssistantId()}`);
  console.log(`[AI Chat] User context: ${ctx.user?.id ? `Authenticated as ${ctx.user.id}` : 'NOT AUTHENTICATED'}`);

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

    // Step 3: Run the assistant with tools (functions)
    // IMPORTANT: Tools MUST be passed here for function calling to work
    // Even if tools are configured in the assistant, passing them here ensures they're available
    const tools = getOpenAITools(ctx.user?.id || '');
    const assistantId = getOpenAIAssistantId();
    
    console.log(`[AI Chat] Running assistant: ${assistantId}`);
    console.log(`[AI Chat] User ID: ${ctx.user?.id || 'NOT AUTHENTICATED'}`);
    console.log(`[AI Chat] Tools available: ${tools.length}`);
    if (tools.length > 0) {
      console.log(`[AI Chat] Tool names: ${tools.map((t: any) => t.function?.name).join(', ')}`);
    }
    
    const runBody: any = {
      assistant_id: assistantId,
    };
    
    // ALWAYS add tools if user is authenticated - this is critical for function calling
    if (ctx.user?.id && tools.length > 0) {
      runBody.tools = tools;
      console.log(`[AI Chat] Adding ${tools.length} tools to run`);
    } else {
      console.warn(`[AI Chat] WARNING: No tools added! User authenticated: ${!!ctx.user?.id}, Tools count: ${tools.length}`);
    }
    
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'OpenAI-Beta': 'assistants=v2',
      },
      body: JSON.stringify(runBody),
    });

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      let errorData: any = {};
      try {
        errorData = JSON.parse(errorText);
      } catch {
        // Not JSON, use as is
      }
      
      // Check if assistant not found
      if (runResponse.status === 404 && errorData.error?.message?.includes('No assistant found')) {
        console.error(`Assistant not found: ${getOpenAIAssistantId()}. Falling back to rule-based response.`);
        // Fallback to rule-based response instead of throwing error
        return {
          choices: [{
            message: {
              role: 'assistant',
              content: getRuleBasedResponse(params.messages).content,
            },
          }],
          usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        };
      }
      
      throw new Error(
        `Failed to run assistant: ${runResponse.status} ${runResponse.statusText} – ${errorText}`
      );
    }

    const run = await runResponse.json();
    let runId = run.id;
    let runStatus = run.status;

    // Step 4: Poll for completion (max 60 seconds to allow for function calls)
    const maxAttempts = 60;
    let attempts = 0;
    while (runStatus === 'queued' || runStatus === 'in_progress' || runStatus === 'requires_action') {
      if (attempts >= maxAttempts) {
        throw new Error(`Assistant run timed out after ${maxAttempts} seconds. Last status: ${runStatus}`);
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
      
      // Handle function calls (requires_action)
      if (runStatus === 'requires_action' && runStatusData.required_action?.type === 'submit_tool_outputs') {
        const toolCalls = runStatusData.required_action.submit_tool_outputs.tool_calls || [];
        console.log(`[AI Chat] ✅ Function calls detected! Processing ${toolCalls.length} tool calls`);
        
        const toolOutputs = await Promise.all(toolCalls.map(async (toolCall: any) => {
          const functionName = toolCall.function.name;
          let functionArgs: any = {};
          try {
            functionArgs = JSON.parse(toolCall.function.arguments || '{}');
          } catch (parseError) {
            console.error('Failed to parse function arguments:', toolCall.function.arguments);
            return {
              tool_call_id: toolCall.id,
              output: JSON.stringify({ error: 'Invalid function arguments' }),
            };
          }
          
          try {
            console.log(`Executing function: ${functionName} with args:`, functionArgs);
            const result = await executeFunction(functionName, functionArgs, ctx.user?.id || '');
            console.log(`Function ${functionName} completed successfully`);
            return {
              tool_call_id: toolCall.id,
              output: JSON.stringify(result),
            };
          } catch (error) {
            console.error(`Function ${functionName} failed:`, error);
            return {
              tool_call_id: toolCall.id,
              output: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
            };
          }
        }));

        // Submit tool outputs
        const submitResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}/submit_tool_outputs`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'OpenAI-Beta': 'assistants=v2',
          },
          body: JSON.stringify({
            tool_outputs: toolOutputs,
          }),
        });

        if (!submitResponse.ok) {
          const errorText = await submitResponse.text();
          throw new Error(`Failed to submit tool outputs: ${submitResponse.status} ${submitResponse.statusText} – ${errorText}`);
        }

        // Continue polling - get the updated run status
        const submitData = await submitResponse.json();
        runStatus = submitData.status;
        runId = submitData.id; // Update runId in case it changed
        console.log(`[AI Chat] Tool outputs submitted, continuing with status: ${runStatus}`);
      }
      
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
    
    console.log(`[AI Chat] Retrieved ${messagesData.data.length} messages from thread`);
    
    // Find the assistant's response (latest message with role 'assistant' and text content)
    // Messages are ordered by creation time, so we need to find the latest one
    const assistantMessages = messagesData.data
      .filter((msg: any) => msg.role === 'assistant')
      .sort((a: any, b: any) => b.created_at - a.created_at); // Sort by creation time, newest first
    
    console.log(`[AI Chat] Found ${assistantMessages.length} assistant messages`);
    
    if (assistantMessages.length === 0) {
      throw new Error('No assistant response found');
    }

    // Get the latest assistant message
    const assistantMessage = assistantMessages[0];
    console.log(`[AI Chat] Using latest assistant message (created_at: ${assistantMessage.created_at})`);
    
    // Extract text content from the message
    // Handle both single text content and array of content items
    let content = '';
    if (Array.isArray(assistantMessage.content)) {
      // Find text content items
      const textContent = assistantMessage.content.find((item: any) => item.type === 'text');
      if (textContent) {
        content = textContent.text?.value || '';
      }
    } else if (assistantMessage.content?.type === 'text') {
      content = assistantMessage.content.text?.value || '';
    }
    
    if (!content) {
      console.warn('No text content found in assistant message, content structure:', JSON.stringify(assistantMessage.content));
      content = 'Entschuldigung, ich konnte keine Antwort generieren. Bitte versuchen Sie es erneut.';
    }
    
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
          try {
            const result = await invokeLLM({
              messages: input.messages,
            }, apiKey, ctx);

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
          } catch (openaiError: any) {
            // If OpenAI API fails (e.g., assistant not found), fallback to rule-based
            if (openaiError.message?.includes('No assistant found') || 
                openaiError.message?.includes('404')) {
              console.warn('OpenAI Assistant not found, using rule-based fallback:', openaiError.message);
              const fallbackResponse = getRuleBasedResponse(input.messages);
              return {
                content: fallbackResponse.content + '\n\n💡 **Hinweis:** Der OpenAI Assistant konnte nicht erreicht werden. Bitte überprüfe die Assistant ID in den Einstellungen.',
                usage: fallbackResponse.usage,
              };
            }
            // Re-throw other errors
            throw openaiError;
          }
        } catch (error) {
          console.error('AI chat error:', error);
          const errorMessage = error instanceof Error ? error.message : 'AI request failed';
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: errorMessage,
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

