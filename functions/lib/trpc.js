"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.trpc = exports.protectedProcedure = exports.publicProcedure = exports.router = void 0;
const fetch_1 = require("@trpc/server/adapters/fetch");
const server_1 = require("@trpc/server");
const https_1 = require("firebase-functions/v2/https");
const zod_1 = require("zod");
const admin = __importStar(require("firebase-admin"));
// Initialize tRPC for Firebase Functions without transformer (superjson is ESM only)
// We'll handle serialization manually if needed
const t = server_1.initTRPC.context().create();
exports.router = t.router;
exports.publicProcedure = t.procedure;
// Middleware to require authentication
const requireUser = t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user) {
        throw new server_1.TRPCError({ code: 'UNAUTHORIZED', message: 'User must be authenticated' });
    }
    return next({
        ctx: Object.assign(Object.assign({}, ctx), { user: ctx.user }),
    });
});
exports.protectedProcedure = t.procedure.use(requireUser);
// Create context for Firebase Functions
async function createContext(opts) {
    var _a;
    let user = null;
    try {
        // Try to get user from Firebase Auth token
        const authHeader = opts.req.headers.get('authorization');
        if (authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith('Bearer ')) {
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
                    loginMethod: ((_a = firebaseUser.providerData[0]) === null || _a === void 0 ? void 0 : _a.providerId) || null,
                    lastSignedIn: admin.firestore.FieldValue.serverTimestamp(),
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                };
                const newUserRef = await admin.firestore().collection('users').add(newUserData);
                user = Object.assign({ id: newUserRef.id }, newUserData);
            }
            else {
                // User exists, update lastSignedIn
                const userData = userDoc.docs[0].data();
                await userDoc.docs[0].ref.update({
                    lastSignedIn: admin.firestore.FieldValue.serverTimestamp(),
                });
                user = Object.assign({ id: userDoc.docs[0].id }, userData);
            }
        }
    }
    catch (error) {
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
async function invokeLLM(params, apiKey) {
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
        throw new Error(`LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`);
    }
    return await response.json();
}
// Rule-based response system (no API key needed)
function getRuleBasedResponse(messages) {
    var _a;
    const lastMessage = messages[messages.length - 1];
    const userMessage = ((_a = lastMessage === null || lastMessage === void 0 ? void 0 : lastMessage.content) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || '';
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
const appRouter = (0, exports.router)({
    ai: (0, exports.router)({
        chat: exports.protectedProcedure
            .input(zod_1.z.object({
            messages: zod_1.z.array(zod_1.z.object({
                role: zod_1.z.enum(['system', 'user', 'assistant']),
                content: zod_1.z.string(),
            })),
        }))
            .mutation(async ({ ctx, input }) => {
            var _a;
            try {
                // Get API key from environment variable
                const apiKey = process.env.BUILT_IN_FORGE_API_KEY || process.env.FORGE_API_KEY || '';
                // If no API key, use rule-based responses (free, no external API needed)
                if (!apiKey || apiKey.trim() === '') {
                    return getRuleBasedResponse(input.messages);
                }
                // Use external LLM API if key is available
                const result = await invokeLLM({
                    messages: input.messages,
                }, apiKey);
                // Extract the assistant's response
                const assistantMessage = (_a = result.choices[0]) === null || _a === void 0 ? void 0 : _a.message;
                if (!assistantMessage) {
                    throw new Error('No response from AI');
                }
                // Handle both string and array content
                const content = typeof assistantMessage.content === 'string'
                    ? assistantMessage.content
                    : Array.isArray(assistantMessage.content)
                        ? assistantMessage.content
                            .filter((c) => c.type === 'text')
                            .map((c) => c.text)
                            .join('\n')
                        : 'Keine Antwort erhalten';
                return {
                    content,
                    usage: result.usage,
                };
            }
            catch (error) {
                throw new server_1.TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: error instanceof Error ? error.message : 'AI request failed',
                    cause: error,
                });
            }
        }),
    }),
});
// Export tRPC HTTP function
// Note: secrets array is optional - if secret doesn't exist, we'll use env vars as fallback
exports.trpc = (0, https_1.onRequest)({
    cors: true,
    maxInstances: 10,
    // Only include secret if it exists (for development, you can deploy without it)
    // For production, set the secret first: firebase functions:secrets:set BUILT_IN_FORGE_API_KEY
}, async (req, res) => {
    try {
        // Build full URL
        const protocol = req.protocol || 'https';
        const host = req.get('host') || '';
        const path = req.url || '/';
        const url = `${protocol}://${host}${path}`;
        // Get request body
        let body;
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            if (req.body) {
                body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
            }
            else {
                // Read body from stream if not already parsed
                body = await new Promise((resolve, reject) => {
                    let data = '';
                    req.on('data', (chunk) => {
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
                }
                else {
                    headers.set(key, value);
                }
            }
        });
        const fetchReq = new Request(url, {
            method: req.method,
            headers,
            body,
        });
        const response = await (0, fetch_1.fetchRequestHandler)({
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
    }
    catch (error) {
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
//# sourceMappingURL=trpc.js.map