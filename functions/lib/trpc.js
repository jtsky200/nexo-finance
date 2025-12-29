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
exports.trpc = exports.protectedProcedure = exports.publicProcedure = exports.router = exports.currencyUtils = exports.STATUS_COMPLETED = exports.STATUS_POSTPONED = exports.STATUS_PAID = exports.STATUS_OPEN = void 0;
exports.isStatusPaid = isStatusPaid;
const fetch_1 = require("@trpc/server/adapters/fetch");
const server_1 = require("@trpc/server");
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const zod_1 = require("zod");
const admin = __importStar(require("firebase-admin"));
// ========== MEHRSPRACHIGE STATUS-KONSTANTEN (DE/EN/FR/IT) ==========
exports.STATUS_OPEN = ['open', 'offen', 'ouvert', 'aperto'];
exports.STATUS_PAID = ['paid', 'bezahlt', 'payé', 'pagato'];
exports.STATUS_POSTPONED = ['postponed', 'verschoben', 'reporté', 'rinviato'];
exports.STATUS_COMPLETED = ['completed', 'erledigt', 'terminé', 'completato'];
function isStatusOpen(s) { return !!s && exports.STATUS_OPEN.includes(s.toLowerCase()); }
function isStatusPaid(s) { return !!s && exports.STATUS_PAID.includes(s.toLowerCase()); }
function getOpenStatusVariants() { return exports.STATUS_OPEN; }
// ========== SCHWEIZER WÄHRUNGS-HILFSFUNKTIONEN ==========
/**
 * Rundet auf 5 Rappen (Schweizer Rundung)
 * z.B. 1.02 -> 1.00, 1.03 -> 1.05, 1.07 -> 1.05, 1.08 -> 1.10
 */
function roundToSwiss5Rappen(amount) {
    return Math.round(amount * 20) / 20;
}
/**
 * Konvertiert CHF zu Rappen (Cents) für die Speicherung
 * Die App speichert Beträge in Rappen (1 CHF = 100 Rappen)
 */
function chfToRappen(chfAmount) {
    const rounded = roundToSwiss5Rappen(chfAmount);
    return Math.round(rounded * 100);
}
/**
 * Konvertiert Rappen zu CHF für die Anzeige
 */
function rappenToChf(rappenAmount) {
    return roundToSwiss5Rappen(rappenAmount / 100);
}
// Export für zukünftige Verwendung (verhindert TypeScript unused warning)
exports.currencyUtils = { roundToSwiss5Rappen, chfToRappen, rappenToChf };
// Define the secret for OpenAI API Key
const openaiApiKeySecret = (0, params_1.defineSecret)('OPENAI_API_KEY');
// Define the secret for OpenWeatherMap API Key (Phase 1)
const openWeatherMapApiKey = (0, params_1.defineSecret)('OPENWEATHERMAP_API_KEY');
// Initialize tRPC for Firebase Functions without transformer (superjson is ESM only)
// We'll handle serialization manually if needed
const t = server_1.initTRPC.context().create({
    errorFormatter({ shape, error, ctx }) {
        var _a;
        // Extract Request ID from context if available
        let requestId;
        if (ctx === null || ctx === void 0 ? void 0 : ctx.req) {
            const traceHeader = ctx.req.headers.get('x-cloud-trace-context');
            const googRequestId = ctx.req.headers.get('x-goog-request-id');
            requestId = (traceHeader === null || traceHeader === void 0 ? void 0 : traceHeader.split('/')[0]) || googRequestId || undefined;
        }
        return Object.assign(Object.assign({}, shape), { data: Object.assign(Object.assign({}, shape.data), { requestId, httpStatus: (_a = shape.data.httpStatus) !== null && _a !== void 0 ? _a : 500 }) });
    },
});
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
    var _a, _b;
    let user = null;
    // Verify App Check token (optional but recommended for security)
    // This follows Firebase App Check best practices:
    // - Tokens are automatically sent from client
    // - Backend verifies tokens to ensure requests come from legitimate apps
    // - Verification is non-blocking (doesn't reject requests if App Check isn't configured)
    try {
        const appCheckToken = opts.req.headers.get('X-Firebase-AppCheck');
        if (appCheckToken) {
            try {
                // Verify App Check token using Firebase Admin SDK
                // This verifies the token was issued by Firebase App Check
                // and returns claims including appId, token expiration, etc.
                const appCheckClaims = await admin.appCheck().verifyToken(appCheckToken);
                // Get action name from header (if provided)
                const action = opts.req.headers.get('X-AppCheck-Action') || 'unknown';
                // Log App Check verification for monitoring (only in development)
                if (process.env.NODE_ENV === 'development') {
                    console.log('[App Check] Token verified:', {
                        appId: appCheckClaims.appId,
                        action,
                        // Don't log full token for security
                    });
                }
                // Token is valid - request is from a legitimate app instance
                // Firebase App Check handles score-based decisions internally
                // The token verification itself indicates the request passed reCAPTCHA v3 scoring
                // Score-based logic (handled by Firebase App Check):
                // - reCAPTCHA v3 returns scores from 0.0 (bot) to 1.0 (human)
                // - Firebase App Check uses these scores internally
                // - Low scores (< 0.5 typically) result in token verification failure
                // - Successful verification means score was acceptable (typically >= 0.5)
                // - We don't have direct access to scores, but successful verification = good score
                // Log successful verification for analytics (optional, only for important actions)
                if (action === 'login' || action === 'register' || action === 'reset_password') {
                    try {
                        await admin.firestore().collection('securityEvents').add({
                            type: 'auth_success',
                            severity: 'low',
                            message: `App Check verified for ${action} action`,
                            userId: (user === null || user === void 0 ? void 0 : user.id) || null,
                            details: {
                                action,
                                appId: appCheckClaims.appId,
                            },
                            timestamp: admin.firestore.FieldValue.serverTimestamp(),
                        });
                    }
                    catch (logError) {
                        // Don't fail request if logging fails
                        console.error('[App Check] Failed to log security event:', logError);
                    }
                }
                // In production, you could:
                // - Track action-specific metrics in Firebase Console
                // - Use appId to track which app instance made the request
                // - Implement rate limiting based on appId and action
                // - Monitor for patterns (e.g., many failed verifications = potential attack)
            }
            catch (appCheckError) {
                // App Check verification failed - this could indicate:
                // - Invalid/expired token
                // - Token from unauthorized app
                // - App Check not properly configured
                // Get action name from header (if provided)
                const action = opts.req.headers.get('X-AppCheck-Action') || 'unknown';
                // Log warning (non-blocking - App Check is optional until enforced)
                console.warn('[App Check] Token verification failed:', {
                    error: appCheckError instanceof Error ? appCheckError.message : String(appCheckError),
                    action,
                });
                // Log security event for invalid token (score-based rejection)
                // Low reCAPTCHA v3 scores result in token verification failure
                // This indicates potential bot or suspicious activity
                try {
                    // Log to Firestore securityEvents collection
                    await admin.firestore().collection('securityEvents').add({
                        type: 'invalid_token',
                        severity: 'high',
                        message: 'App Check token verification failed - possible low reCAPTCHA score',
                        userId: (user === null || user === void 0 ? void 0 : user.id) || null,
                        details: {
                            action,
                            error: appCheckError instanceof Error ? appCheckError.message : String(appCheckError),
                            // Note: reCAPTCHA v3 scores (0.0-1.0) are handled internally
                            // Low scores (< 0.5 typically) result in verification failure
                        },
                        timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    });
                }
                catch (logError) {
                    // Don't fail request if security logging fails
                    console.error('[App Check] Failed to log security event:', logError);
                }
                // TODO: When App Check enforcement is enabled, you should:
                // 1. Reject requests with invalid tokens (throw error)
                // 2. Implement rate limiting based on action and appId
                // 3. Block suspicious IPs or app instances
            }
        }
        else {
            // No App Check token provided
            // This is expected if App Check isn't configured yet
            // Once App Check is enforced, requests without tokens will be rejected
            if (process.env.NODE_ENV === 'development') {
                console.debug('[App Check] No token provided in request');
            }
        }
    }
    catch (error) {
        // App Check verification is optional, don't block requests
        // This catch handles any unexpected errors in the verification process
        if (process.env.NODE_ENV === 'development') {
            console.warn('[App Check] Verification error:', error);
        }
    }
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
        const requestId = ((_b = opts.req.headers.get('x-cloud-trace-context')) === null || _b === void 0 ? void 0 : _b.split('/')[0]) ||
            opts.req.headers.get('x-goog-request-id') ||
            'unknown';
        console.error('[tRPC] Auth error:', {
            requestId,
            error: error instanceof Error ? {
                message: error.message,
                stack: error.stack,
                name: error.name,
            } : error,
        });
        user = null;
    }
    return {
        req: opts.req,
        user,
    };
}
// OpenAI Assistant ID - can be set via environment variable or secret
// Default: asst_eXeVnct9xxf67H4rpyK2jjrb (Nexo Finance Assistant - Intelligent & Context-Aware)
function getOpenAIAssistantId() {
    // Try environment variable first
    if (process.env.OPENAI_ASSISTANT_ID) {
        return process.env.OPENAI_ASSISTANT_ID;
    }
    // Fallback to default
    return 'asst_eXeVnct9xxf67H4rpyK2jjrb';
}
// Define OpenAI Functions/Tools for database access - ALLE FUNKTIONEN
function getOpenAITools(userId) {
    if (!userId)
        return [];
    return [
        // ========== SYSTEM & ZEIT ==========
        {
            type: 'function',
            function: {
                name: 'getCurrentDateTime',
                description: 'Gibt das aktuelle Datum und die Uhrzeit zurück. WICHTIG: Verwende diese Funktion IMMER bevor du Termine oder Erinnerungen erstellst, um sicherzustellen, dass das Datum in der Zukunft liegt.',
                parameters: {
                    type: 'object',
                    properties: {},
                },
            },
        },
        // ========== PERSONEN ==========
        {
            type: 'function',
            function: {
                name: 'getAllPeople',
                description: 'Listet alle Personen auf, die in der Datenbank gespeichert sind. Nützlich, um verfügbare Namen und IDs zu finden.',
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
        {
            type: 'function',
            function: {
                name: 'createPerson',
                description: `Erstellt eine neue Person in der Datenbank. Kann optional gleich Schulden erfassen.
        
🔴 WICHTIG - TYPE:
- "external" (STANDARD für Schulden): "Herr X", "Frau Y", Nachnamen, Bekannte, Geschäftspartner
- "household": NUR Familienmitglieder die im GLEICHEN Haushalt leben ("mein Mann", "meine Tochter")

🔴 WICHTIG - SCHULDEN ERFASSEN:
Wenn jemand Geld schuldet, IMMER debtAmount und debtDirection angeben:
- "X schuldet mir 400 CHF" → debtAmount=400, debtDirection="incoming"
- "Ich schulde X 200 CHF" → debtAmount=200, debtDirection="outgoing"

BEISPIELE:
- "Herr Meier schuldet mir 500 CHF" → name="Herr Meier", type="external", debtAmount=500, debtDirection="incoming"
- "Meine Schwester" → name="Schwester", type="household"`,
                parameters: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: 'Name der Person (erforderlich)' },
                        type: {
                            type: 'string',
                            enum: ['household', 'external'],
                            description: 'STANDARD: external für Schulden! household NUR für Familie im gleichen Haushalt'
                        },
                        relationship: {
                            type: 'string',
                            enum: ['debtor', 'creditor', 'both'],
                            description: 'debtor = schuldet MIR (Standard bei Schulden), creditor = ICH schulde'
                        },
                        debtAmount: { type: 'number', description: 'Schulden-Betrag in CHF (z.B. 500 für "schuldet mir 500 CHF")' },
                        debtDirection: {
                            type: 'string',
                            enum: ['incoming', 'outgoing'],
                            description: 'incoming = Person schuldet MIR, outgoing = ICH schulde Person'
                        },
                        debtDescription: { type: 'string', description: 'Beschreibung der Schuld (z.B. "Reparatur", "Darlehen")' },
                        email: { type: 'string', description: 'E-Mail-Adresse (optional)' },
                        phone: { type: 'string', description: 'Telefonnummer (optional)' },
                        notes: { type: 'string', description: 'Notizen (optional)' },
                    },
                    required: ['name'],
                },
            },
        },
        {
            type: 'function',
            function: {
                name: 'createPersonWithDebt',
                description: `INTELLIGENTE FUNKTION: Erstellt eine externe Person UND eine Rechnung in einem Schritt.
        
Verwende diese Funktion wenn der Benutzer sagt:
- "Herr X schuldet mir 400 CHF" → Erstellt externe Person + Rechnung (direction: incoming)
- "Ich schulde Frau Y 200 CHF" → Erstellt externe Person + Rechnung (direction: outgoing)
- "Erfasse Max mit 1000 CHF Schulden" → Erstellt Person + Rechnung

Die Funktion erkennt automatisch die Richtung basierend auf der Formulierung.`,
                parameters: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: 'Name der Person' },
                        amount: { type: 'number', description: 'Schulden-Betrag in CHF' },
                        direction: {
                            type: 'string',
                            enum: ['incoming', 'outgoing'],
                            description: 'incoming = Person schuldet MIR (Forderung), outgoing = ICH schulde Person (Verbindlichkeit)'
                        },
                        description: { type: 'string', description: 'Beschreibung der Schuld (optional, z.B. "Darlehen", "Reparatur")' },
                        dueDate: { type: 'string', description: 'Fälligkeitsdatum YYYY-MM-DD (optional)' },
                        email: { type: 'string', description: 'E-Mail (optional)' },
                        phone: { type: 'string', description: 'Telefon (optional)' },
                        notes: { type: 'string', description: 'Notizen (optional)' },
                    },
                    required: ['name', 'amount', 'direction'],
                },
            },
        },
        {
            type: 'function',
            function: {
                name: 'getPersonDebts',
                description: 'Ermittelt die Schulden (offene Rechnungen) einer Person. Gibt den Gesamtbetrag, Details aller offenen Rechnungen UND Ratenpläne zurück. Verwendet diese Funktion um herauszufinden wie viel jemand noch schuldet und welche Raten offen sind.',
                parameters: {
                    type: 'object',
                    properties: {
                        personName: { type: 'string', description: 'Der Name der Person' },
                    },
                    required: ['personName'],
                },
            },
        },
        {
            type: 'function',
            function: {
                name: 'getPersonInstallments',
                description: `Ermittelt die RATENPLAN-DETAILS einer Person. Zeigt:
- Alle Raten mit Status (offen/bezahlt)
- Fälligkeitsdaten
- Beträge pro Rate
- Restschuld

WICHTIG: Verwende diese Funktion wenn der Nutzer fragt:
- "Welche Raten hat Person X?"
- "Wie viel hat Person X noch offen?"
- "Wann ist die nächste Rate fällig?"
- "Hat Person X schon bezahlt?"`,
                parameters: {
                    type: 'object',
                    properties: {
                        personName: { type: 'string', description: 'Der Name der Person' },
                    },
                    required: ['personName'],
                },
            },
        },
        // ========== ERINNERUNGEN & TERMINE ==========
        {
            type: 'function',
            function: {
                name: 'getAllReminders',
                description: 'Ruft alle Erinnerungen und Termine ab. Kann nach Datum, Status und Person gefiltert werden.',
                parameters: {
                    type: 'object',
                    properties: {
                        startDate: { type: 'string', description: 'Startdatum im Format YYYY-MM-DD (optional)' },
                        endDate: { type: 'string', description: 'Enddatum im Format YYYY-MM-DD (optional)' },
                        status: { type: 'string', enum: ['pending', 'completed', 'cancelled'], description: 'Status-Filter (optional)' },
                        personId: { type: 'string', description: 'Person-ID für Filter (optional)' },
                    },
                },
            },
        },
        {
            type: 'function',
            function: {
                name: 'createReminder',
                description: 'Erstellt eine neue Erinnerung oder einen Termin. WICHTIG: Das dueDate MUSS in der Zukunft liegen! Rufe zuerst getCurrentDateTime auf, um das aktuelle Datum zu erhalten.',
                parameters: {
                    type: 'object',
                    properties: {
                        title: { type: 'string', description: 'Titel der Erinnerung (erforderlich)' },
                        dueDate: { type: 'string', description: 'Fälligkeitsdatum im Format YYYY-MM-DD oder YYYY-MM-DDTHH:mm:ss. MUSS in der Zukunft liegen!' },
                        type: { type: 'string', enum: ['reminder', 'appointment', 'task', 'payment', 'birthday'], description: 'Art der Erinnerung' },
                        personId: { type: 'string', description: 'ID der zugeordneten Person (optional)' },
                        personName: { type: 'string', description: 'Name der Person (wird verwendet, um personId zu finden, wenn nicht angegeben)' },
                        amount: { type: 'number', description: 'Betrag (für Zahlungen, optional)' },
                        currency: { type: 'string', description: 'Währung (Standard: CHF)' },
                        notes: { type: 'string', description: 'Notizen (optional)' },
                        recurring: { type: 'boolean', description: 'Wiederkehrend? (optional)' },
                        recurringFrequency: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'yearly'], description: 'Wiederholungsintervall' },
                    },
                    required: ['title', 'dueDate'],
                },
            },
        },
        {
            type: 'function',
            function: {
                name: 'updateReminder',
                description: 'Aktualisiert eine bestehende Erinnerung.',
                parameters: {
                    type: 'object',
                    properties: {
                        reminderId: { type: 'string', description: 'ID der Erinnerung (erforderlich)' },
                        title: { type: 'string', description: 'Neuer Titel (optional)' },
                        dueDate: { type: 'string', description: 'Neues Datum im Format YYYY-MM-DD (optional)' },
                        status: { type: 'string', enum: ['pending', 'completed', 'cancelled'], description: 'Neuer Status (optional)' },
                        notes: { type: 'string', description: 'Neue Notizen (optional)' },
                    },
                    required: ['reminderId'],
                },
            },
        },
        {
            type: 'function',
            function: {
                name: 'deleteReminder',
                description: 'Löscht eine Erinnerung.',
                parameters: {
                    type: 'object',
                    properties: {
                        reminderId: { type: 'string', description: 'ID der zu löschenden Erinnerung' },
                    },
                    required: ['reminderId'],
                },
            },
        },
        {
            type: 'function',
            function: {
                name: 'createQuickReminder',
                description: 'Erstellt eine kurzfristige Erinnerung (z.B. "Erinnere mich in 5 Minuten an den Kochherd"). Perfekt für sofortige oder kurzfristige Erinnerungen. Die Erinnerung wird automatisch in X Minuten ausgelöst.',
                parameters: {
                    type: 'object',
                    properties: {
                        title: { type: 'string', description: 'Titel der Erinnerung (z.B. "Kochherd ausschalten")' },
                        minutesFromNow: { type: 'number', description: 'Anzahl Minuten bis zur Erinnerung (Standard: 5, Minimum: 1, Maximum: 1440 = 24 Stunden)' },
                        notes: { type: 'string', description: 'Zusätzliche Notizen (optional)' },
                    },
                    required: ['title'],
                },
            },
        },
        {
            type: 'function',
            function: {
                name: 'createFollowUpReminder',
                description: 'Erstellt eine Follow-up-Erinnerung basierend auf einer bestehenden Erinnerung. Wird verwendet, wenn der Benutzer nach einer Erinnerung gefragt wird, ob er nochmal erinnert werden soll.',
                parameters: {
                    type: 'object',
                    properties: {
                        originalReminderId: { type: 'string', description: 'ID der ursprünglichen Erinnerung' },
                        minutesFromNow: { type: 'number', description: 'Anzahl Minuten bis zur Follow-up-Erinnerung (Standard: 15)' },
                        title: { type: 'string', description: 'Titel für die Follow-up-Erinnerung (optional, verwendet sonst den Originaltitel)' },
                    },
                    required: ['originalReminderId'],
                },
            },
        },
        {
            type: 'function',
            function: {
                name: 'getPersonReminders',
                description: 'Ermittelt alle Termine und Erinnerungen einer bestimmten Person.',
                parameters: {
                    type: 'object',
                    properties: {
                        personName: { type: 'string', description: 'Der Name der Person' },
                        startDate: { type: 'string', description: 'Startdatum im Format YYYY-MM-DD (optional)' },
                        endDate: { type: 'string', description: 'Enddatum im Format YYYY-MM-DD (optional)' },
                    },
                    required: ['personName'],
                },
            },
        },
        // ========== RECHNUNGEN ==========
        {
            type: 'function',
            function: {
                name: 'getAllInvoices',
                description: 'Ruft alle Rechnungen ab. Kann nach Person, Status und Datum gefiltert werden.',
                parameters: {
                    type: 'object',
                    properties: {
                        personId: { type: 'string', description: 'Person-ID für Filter (optional)' },
                        personName: { type: 'string', description: 'Person-Name für Filter (optional)' },
                        status: { type: 'string', enum: ['offen', 'bezahlt', 'überfällig', 'storniert'], description: 'Status-Filter (optional)' },
                        startDate: { type: 'string', description: 'Startdatum (optional)' },
                        endDate: { type: 'string', description: 'Enddatum (optional)' },
                    },
                },
            },
        },
        {
            type: 'function',
            function: {
                name: 'createInvoice',
                description: 'Erstellt eine neue Rechnung für eine Person.',
                parameters: {
                    type: 'object',
                    properties: {
                        personId: { type: 'string', description: 'ID der Person' },
                        personName: { type: 'string', description: 'Name der Person (wird verwendet, um personId zu finden)' },
                        description: { type: 'string', description: 'Beschreibung der Rechnung (erforderlich)' },
                        amount: { type: 'number', description: 'Betrag (erforderlich)' },
                        currency: { type: 'string', description: 'Währung (Standard: CHF)' },
                        dueDate: { type: 'string', description: 'Fälligkeitsdatum im Format YYYY-MM-DD' },
                        status: { type: 'string', enum: ['offen', 'bezahlt', 'überfällig', 'storniert'], description: 'Status (Standard: offen)' },
                        notes: { type: 'string', description: 'Notizen (optional)' },
                    },
                    required: ['description', 'amount'],
                },
            },
        },
        {
            type: 'function',
            function: {
                name: 'updateInvoiceStatus',
                description: 'Aktualisiert den Status einer Rechnung (z.B. auf "bezahlt" setzen).',
                parameters: {
                    type: 'object',
                    properties: {
                        personId: { type: 'string', description: 'ID der Person' },
                        invoiceId: { type: 'string', description: 'ID der Rechnung' },
                        status: { type: 'string', enum: ['offen', 'bezahlt', 'überfällig', 'storniert'], description: 'Neuer Status' },
                    },
                    required: ['invoiceId', 'status'],
                },
            },
        },
        {
            type: 'function',
            function: {
                name: 'createInstallmentPlan',
                description: `Erstellt einen Ratenplan für eine bestehende Rechnung.
        
BEISPIELE:
- "Herr Dussel möchte die 400 CHF monatlich à 100 CHF abzahlen" → 4 Raten à 100 CHF
- "Die Rechnung soll in 6 Raten bezahlt werden" → Teilt Betrag durch 6
- "Ratenplan mit 50 CHF pro Monat" → Berechnet Anzahl Raten automatisch

Die Funktion:
1. Sucht die bestehende Rechnung der Person
2. Konvertiert sie in einen Ratenplan
3. Erstellt die einzelnen Raten mit korrekten Fälligkeitsdaten`,
                parameters: {
                    type: 'object',
                    properties: {
                        personName: { type: 'string', description: 'Name der Person mit der Rechnung' },
                        invoiceId: { type: 'string', description: 'ID der Rechnung (optional, wenn nur eine offene Rechnung existiert)' },
                        installmentAmount: { type: 'number', description: 'Betrag pro Rate (z.B. 100 für 100 CHF/Monat)' },
                        numberOfInstallments: { type: 'number', description: 'Anzahl der Raten (alternativ zu installmentAmount)' },
                        frequency: { type: 'string', enum: ['weekly', 'biweekly', 'monthly'], description: 'Zahlungsintervall (Standard: monthly)' },
                        startDate: { type: 'string', description: 'Startdatum der ersten Rate YYYY-MM-DD (Standard: nächster Monat)' },
                    },
                    required: ['personName'],
                },
            },
        },
        {
            type: 'function',
            function: {
                name: 'recordInstallmentPayment',
                description: 'Erfasst eine Ratenzahlung für einen bestehenden Ratenplan.',
                parameters: {
                    type: 'object',
                    properties: {
                        personName: { type: 'string', description: 'Name der Person' },
                        amount: { type: 'number', description: 'Gezahlter Betrag' },
                        paymentDate: { type: 'string', description: 'Zahlungsdatum YYYY-MM-DD (Standard: heute)' },
                        notes: { type: 'string', description: 'Notizen zur Zahlung (optional)' },
                    },
                    required: ['personName', 'amount'],
                },
            },
        },
        // ========== FINANZEN ==========
        {
            type: 'function',
            function: {
                name: 'getFinanceSummary',
                description: 'Erstellt eine Finanz-Zusammenfassung für einen Zeitraum. Zeigt Einnahmen, Ausgaben, Kategorien und Sparpotenzial.',
                parameters: {
                    type: 'object',
                    properties: {
                        startDate: { type: 'string', description: 'Startdatum im Format YYYY-MM-DD (optional)' },
                        endDate: { type: 'string', description: 'Enddatum im Format YYYY-MM-DD (optional)' },
                        month: { type: 'string', description: 'Monat im Format YYYY-MM (z.B. "2024-01")' },
                    },
                },
            },
        },
        {
            type: 'function',
            function: {
                name: 'getAllFinanceEntries',
                description: 'Ruft alle Finanzeinträge (Einnahmen & Ausgaben) ab.',
                parameters: {
                    type: 'object',
                    properties: {
                        type: { type: 'string', enum: ['income', 'expense'], description: 'Typ-Filter (optional)' },
                        category: { type: 'string', description: 'Kategorie-Filter (optional)' },
                        startDate: { type: 'string', description: 'Startdatum (optional)' },
                        endDate: { type: 'string', description: 'Enddatum (optional)' },
                    },
                },
            },
        },
        {
            type: 'function',
            function: {
                name: 'createFinanceEntry',
                description: 'Erstellt einen neuen Finanzeintrag (Einnahme oder Ausgabe).',
                parameters: {
                    type: 'object',
                    properties: {
                        type: { type: 'string', enum: ['income', 'expense'], description: 'Typ: Einnahme oder Ausgabe (erforderlich)' },
                        amount: { type: 'number', description: 'Betrag (erforderlich)' },
                        category: { type: 'string', description: 'Kategorie (z.B. Gehalt, Miete, Essen, Transport)' },
                        description: { type: 'string', description: 'Beschreibung (erforderlich)' },
                        date: { type: 'string', description: 'Datum im Format YYYY-MM-DD (Standard: heute)' },
                        currency: { type: 'string', description: 'Währung (Standard: CHF)' },
                        recurring: { type: 'boolean', description: 'Wiederkehrend?' },
                        recurringFrequency: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'yearly'], description: 'Wiederholungsintervall' },
                    },
                    required: ['type', 'amount', 'description'],
                },
            },
        },
        // ========== BUDGETS ==========
        {
            type: 'function',
            function: {
                name: 'getAllBudgets',
                description: 'Ruft alle Budgets ab mit aktuellem Verbrauch.',
                parameters: {
                    type: 'object',
                    properties: {
                        month: { type: 'string', description: 'Monat im Format YYYY-MM (optional)' },
                    },
                },
            },
        },
        {
            type: 'function',
            function: {
                name: 'createBudget',
                description: 'Erstellt ein neues Budget für eine Kategorie.',
                parameters: {
                    type: 'object',
                    properties: {
                        category: { type: 'string', description: 'Kategorie (erforderlich)' },
                        amount: { type: 'number', description: 'Budget-Betrag (erforderlich)' },
                        month: { type: 'string', description: 'Monat im Format YYYY-MM (optional, Standard: aktueller Monat)' },
                        currency: { type: 'string', description: 'Währung (Standard: CHF)' },
                    },
                    required: ['category', 'amount'],
                },
            },
        },
        // ========== EINKAUFSLISTE ==========
        {
            type: 'function',
            function: {
                name: 'getShoppingList',
                description: 'Ruft die aktuelle Einkaufsliste ab.',
                parameters: {
                    type: 'object',
                    properties: {
                        showCompleted: { type: 'boolean', description: 'Auch erledigte Artikel anzeigen? (Standard: false)' },
                    },
                },
            },
        },
        {
            type: 'function',
            function: {
                name: 'createShoppingItem',
                description: 'Fügt einen Artikel zur Einkaufsliste hinzu.',
                parameters: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: 'Name des Artikels (erforderlich)' },
                        quantity: { type: 'number', description: 'Menge (optional)' },
                        unit: { type: 'string', description: 'Einheit (z.B. kg, Stück, Liter)' },
                        category: { type: 'string', description: 'Kategorie (z.B. Obst, Gemüse, Milchprodukte)' },
                        notes: { type: 'string', description: 'Notizen (optional)' },
                        store: { type: 'string', description: 'Geschäft (optional)' },
                    },
                    required: ['name'],
                },
            },
        },
        {
            type: 'function',
            function: {
                name: 'markShoppingItemAsBought',
                description: 'Markiert einen Einkaufsartikel als gekauft.',
                parameters: {
                    type: 'object',
                    properties: {
                        itemId: { type: 'string', description: 'ID des Artikels' },
                        price: { type: 'number', description: 'Preis (optional)' },
                    },
                    required: ['itemId'],
                },
            },
        },
        {
            type: 'function',
            function: {
                name: 'deleteShoppingItem',
                description: 'Entfernt einen Artikel von der Einkaufsliste.',
                parameters: {
                    type: 'object',
                    properties: {
                        itemId: { type: 'string', description: 'ID des Artikels' },
                    },
                    required: ['itemId'],
                },
            },
        },
        // ========== KALENDER ==========
        {
            type: 'function',
            function: {
                name: 'getCalendarEvents',
                description: 'Ruft alle Kalender-Events ab (Termine, Ferien, Arbeitspläne, Schulpläne).',
                parameters: {
                    type: 'object',
                    properties: {
                        startDate: { type: 'string', description: 'Startdatum im Format YYYY-MM-DD' },
                        endDate: { type: 'string', description: 'Enddatum im Format YYYY-MM-DD' },
                        type: { type: 'string', enum: ['all', 'reminders', 'vacations', 'work', 'school'], description: 'Typ-Filter' },
                    },
                },
            },
        },
        {
            type: 'function',
            function: {
                name: 'getPersonCalendarEvents',
                description: 'Ermittelt Kalender-Events einer bestimmten Person.',
                parameters: {
                    type: 'object',
                    properties: {
                        personName: { type: 'string', description: 'Der Name der Person' },
                        startDate: { type: 'string', description: 'Startdatum (optional)' },
                        endDate: { type: 'string', description: 'Enddatum (optional)' },
                    },
                    required: ['personName'],
                },
            },
        },
        // ========== URLAUB & FERIEN ==========
        {
            type: 'function',
            function: {
                name: 'getVacations',
                description: 'Ruft alle Urlaube und Ferien ab.',
                parameters: {
                    type: 'object',
                    properties: {
                        year: { type: 'number', description: 'Jahr (optional)' },
                        personId: { type: 'string', description: 'Person-ID (optional)' },
                    },
                },
            },
        },
        {
            type: 'function',
            function: {
                name: 'createVacation',
                description: 'Erstellt einen neuen Urlaub.',
                parameters: {
                    type: 'object',
                    properties: {
                        title: { type: 'string', description: 'Titel (erforderlich)' },
                        startDate: { type: 'string', description: 'Startdatum im Format YYYY-MM-DD (erforderlich)' },
                        endDate: { type: 'string', description: 'Enddatum im Format YYYY-MM-DD (erforderlich)' },
                        personId: { type: 'string', description: 'Person-ID (optional)' },
                        type: { type: 'string', enum: ['vacation', 'holiday', 'sick', 'other'], description: 'Typ' },
                        notes: { type: 'string', description: 'Notizen (optional)' },
                    },
                    required: ['title', 'startDate', 'endDate'],
                },
            },
        },
        // ========== ARBEIT ==========
        {
            type: 'function',
            function: {
                name: 'getWorkSchedules',
                description: 'Ruft Arbeitspläne ab.',
                parameters: {
                    type: 'object',
                    properties: {
                        startDate: { type: 'string', description: 'Startdatum (optional)' },
                        endDate: { type: 'string', description: 'Enddatum (optional)' },
                    },
                },
            },
        },
        // ========== SCHULE ==========
        {
            type: 'function',
            function: {
                name: 'getSchoolSchedules',
                description: 'Ruft Schulpläne ab.',
                parameters: {
                    type: 'object',
                    properties: {
                        childId: { type: 'string', description: 'Kind-ID (optional)' },
                    },
                },
            },
        },
        {
            type: 'function',
            function: {
                name: 'getSchoolHolidays',
                description: 'Ruft Schulferien ab.',
                parameters: {
                    type: 'object',
                    properties: {
                        year: { type: 'number', description: 'Jahr (optional)' },
                    },
                },
            },
        },
        // ========== DOKUMENTE ==========
        {
            type: 'function',
            function: {
                name: 'getAllDocuments',
                description: 'Ruft alle gespeicherten Dokumente ab.',
                parameters: {
                    type: 'object',
                    properties: {
                        personId: { type: 'string', description: 'Person-ID für Filter (optional)' },
                        type: { type: 'string', description: 'Dokumenttyp-Filter (optional)' },
                    },
                },
            },
        },
        // ========== STATISTIKEN & ANALYSEN ==========
        {
            type: 'function',
            function: {
                name: 'getCompleteUserSummary',
                description: 'Erstellt eine vollständige Zusammenfassung aller Daten des Benutzers: Personen, Rechnungen, Finanzen, Termine, Budgets, etc. Nützlich für komplexe Fragen.',
                parameters: {
                    type: 'object',
                    properties: {
                        includeDetails: { type: 'boolean', description: 'Detaillierte Daten einschließen? (Standard: false für Übersicht)' },
                    },
                },
            },
        },
        // ========== WETTER (Phase 1) ==========
        {
            type: 'function',
            function: {
                name: 'getWeather',
                description: `Ruft Wetterdaten für ein bestimmtes Datum und einen Standort ab. 
        
WICHTIG - Verwende diese Funktion IMMER wenn:
- Der Benutzer einen Termin oder eine Erinnerung für draußen erstellt (z.B. "spazieren gehen", "im Park", "draußen", "outdoor", "Fahrrad fahren", "Picknick", "Grillen")
- Der Benutzer direkt nach Wetter fragt
- Eine Aktivität offensichtlich im Freien stattfindet

Erkenne Outdoor-Aktivitäten an Begriffen wie: spazieren, Park, draußen, outdoor, Fahrrad, Picknick, Grillen, Camping, Sport im Freien, etc.

Gib nach dem Abruf der Wetterdaten hilfreiche Warnungen:
- Temperaturen unter 5°C: Warnung vor Kälte, warme Kleidung empfehlen
- Temperaturen 5-10°C: Kühle Temperaturen, Jacke empfehlen
- Regen/Niederschlag: Regenschirm oder Regenjacke empfehlen
- Wind über 20 km/h: Windige Bedingungen warnen
- Wind über 40 km/h: Starker Wind, Vorsicht bei Outdoor-Aktivitäten
- Hohe Luftfeuchtigkeit (>80%): Feuchte Bedingungen erwähnen`,
                parameters: {
                    type: 'object',
                    properties: {
                        date: {
                            type: 'string',
                            description: 'Datum im ISO-Format (YYYY-MM-DD) oder relative Angaben wie "heute", "morgen", "übermorgen". Für Termine verwende das dueDate des Termins.',
                        },
                        location: {
                            type: 'string',
                            description: 'Standort (z.B. "Zurich, CH"). Optional, verwendet Standard-Standort aus Einstellungen wenn nicht angegeben.',
                        },
                    },
                    required: ['date'],
                },
            },
        },
    ];
}
// Helper function to find person by name
async function findPersonByName(db, userId, personName) {
    const snapshot = await db.collection('people')
        .where('userId', '==', userId)
        .get();
    const personDoc = snapshot.docs.find(doc => {
        var _a, _b;
        const data = doc.data();
        return ((_a = data.name) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === personName.toLowerCase() ||
            ((_b = data.name) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(personName.toLowerCase()));
    });
    if (!personDoc)
        return null;
    const data = personDoc.data();
    return {
        id: personDoc.id,
        name: data.name || '',
        type: data.type || 'household',
        relationship: data.relationship,
        email: data.email,
        phone: data.phone,
        notes: data.notes,
    };
}
// Execute function calls from OpenAI Assistant - ALLE FUNKTIONEN
async function executeFunction(functionName, args, userId) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    if (!userId) {
        throw new Error('User ID is required');
    }
    const db = admin.firestore();
    const now = new Date();
    // Schweizer Zeitzone
    const swissTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Zurich' }));
    switch (functionName) {
        // ========== SYSTEM & ZEIT ==========
        case 'getCurrentDateTime': {
            return {
                currentDate: swissTime.toISOString().split('T')[0],
                currentTime: swissTime.toTimeString().split(' ')[0],
                currentDateTime: swissTime.toISOString(),
                timezone: 'Europe/Zurich',
                dayOfWeek: swissTime.toLocaleDateString('de-CH', { weekday: 'long' }),
                formattedDate: swissTime.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                hint: 'WICHTIG: Verwende dieses Datum als Referenz. Termine müssen NACH diesem Datum liegen!',
            };
        }
        // ========== PERSONEN ==========
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
            return { people, count: people.length };
        }
        case 'searchPerson': {
            const { searchTerm } = args;
            const person = await findPersonByName(db, userId, searchTerm);
            if (!person) {
                return { error: `Keine Person mit "${searchTerm}" gefunden` };
            }
            return { person };
        }
        case 'createPerson': {
            const { name, type, relationship, email, phone, notes, debtAmount, debtDirection, debtDescription } = args;
            // WICHTIG: Default zu external wenn kein type angegeben (bei Schulden-Szenarien)
            const personType = type || 'external';
            const personRelationship = personType === 'external' ? (relationship || 'debtor') : null;
            const personRef = await db.collection('people').add({
                userId,
                name,
                type: personType,
                relationship: personRelationship,
                email: email || null,
                phone: phone || null,
                notes: notes || null,
                currency: 'CHF',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            let invoiceCreated = false;
            let invoiceId = null;
            // Wenn debtAmount angegeben, erstelle automatisch eine Rechnung
            if (debtAmount && debtAmount > 0) {
                const invoiceData = {
                    description: debtDescription || `Schulden von ${name}`,
                    amount: debtAmount,
                    currency: 'CHF',
                    status: 'offen',
                    direction: debtDirection || 'incoming', // incoming = Person schuldet mir
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                };
                const invoiceRef = await db.collection('people').doc(personRef.id).collection('invoices').add(invoiceData);
                invoiceCreated = true;
                invoiceId = invoiceRef.id;
            }
            return {
                success: true,
                personId: personRef.id,
                personType,
                relationship: personRelationship,
                invoiceCreated,
                invoiceId,
                message: invoiceCreated
                    ? `${name} wurde als ${personType === 'household' ? 'Haushaltsmitglied' : 'externe Person'} erfasst mit ${debtAmount} CHF Schulden.`
                    : `Person "${name}" wurde als ${personType === 'household' ? 'Haushaltsmitglied' : 'externe Person'} erstellt.`,
            };
        }
        case 'createPersonWithDebt': {
            const { name, amount, direction, description, dueDate, email, phone, notes } = args;
            // Schweizer 5-Rappen-Rundung und Konvertierung zu Rappen (die App speichert in Rappen)
            const amountInChf = roundToSwiss5Rappen(amount);
            const amountInRappen = chfToRappen(amount);
            console.log(`[createPersonWithDebt] Starting for userId: ${userId}, name: ${name}, amount: ${amountInChf} CHF (${amountInRappen} Rappen), direction: ${direction}`);
            // 1. Prüfe ob Person bereits existiert
            let person = await findPersonByName(db, userId, name);
            let personId;
            let personCreated = false;
            if (person) {
                personId = person.id;
                console.log(`[createPersonWithDebt] Person already exists with ID: ${personId}`);
            }
            else {
                // 2. Erstelle externe Person mit korrektem relationship
                const relationship = direction === 'incoming' ? 'debtor' : 'creditor';
                console.log(`[createPersonWithDebt] Creating new person: type=external, relationship=${relationship}`);
                const personData = {
                    userId,
                    name,
                    type: 'external',
                    relationship,
                    email: email || null,
                    phone: phone || null,
                    notes: notes || null,
                    currency: 'CHF',
                    totalOwed: amountInRappen, // In Rappen speichern!
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                };
                const personRef = await db.collection('people').add(personData);
                personId = personRef.id;
                personCreated = true;
                console.log(`[createPersonWithDebt] Person created with ID: ${personId}`);
            }
            // 3. Erstelle Rechnung (Betrag in Rappen!)
            const invoiceData = {
                description: description || (direction === 'incoming' ? `Schulden von ${name}` : `Schulden an ${name}`),
                amount: amountInRappen, // In Rappen speichern!
                currency: 'CHF',
                status: 'open',
                direction, // incoming = Person schuldet mir, outgoing = Ich schulde Person
                date: admin.firestore.FieldValue.serverTimestamp(),
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            if (dueDate) {
                invoiceData.dueDate = admin.firestore.Timestamp.fromDate(new Date(dueDate));
            }
            console.log(`[createPersonWithDebt] Creating invoice for person ${personId}`);
            const invoiceRef = await db.collection('people').doc(personId).collection('invoices').add(invoiceData);
            console.log(`[createPersonWithDebt] Invoice created with ID: ${invoiceRef.id}`);
            return {
                success: true,
                personId,
                invoiceId: invoiceRef.id,
                personCreated,
                message: direction === 'incoming'
                    ? `${name} wurde als externe Person erfasst mit ${amountInChf} CHF Schulden an dich.`
                    : `${name} wurde erfasst. Du schuldest ${amountInChf} CHF.`,
                summary: {
                    person: name,
                    type: 'external',
                    amountChf: amountInChf,
                    direction: direction === 'incoming' ? 'Person schuldet dir' : 'Du schuldest Person',
                },
            };
        }
        case 'getPersonDebts': {
            const { personName } = args;
            const person = await findPersonByName(db, userId, personName);
            if (!person) {
                return { error: `Person "${personName}" nicht gefunden` };
            }
            console.log(`[getPersonDebts] Looking up debts for person: ${person.id} (${person.name})`);
            // Hole ALLE Rechnungen (nicht nur offene) um vollständiges Bild zu zeigen
            const invoicesSnapshot = await db.collection('people').doc(person.id).collection('invoices').get();
            console.log(`[getPersonDebts] Found ${invoicesSnapshot.docs.length} invoices`);
            // RAW DEBUG: Log raw data for first invoice
            if (invoicesSnapshot.docs.length > 0) {
                const firstDoc = invoicesSnapshot.docs[0];
                const rawData = firstDoc.data();
                console.log(`[getPersonDebts] RAW first invoice keys: ${Object.keys(rawData).join(', ')}`);
                console.log(`[getPersonDebts] RAW installments type: ${typeof rawData.installments}, isArray: ${Array.isArray(rawData.installments)}, length: ${((_a = rawData.installments) === null || _a === void 0 ? void 0 : _a.length) || 0}`);
                if (rawData.installments && rawData.installments.length > 0) {
                    console.log(`[getPersonDebts] RAW first installment: ${JSON.stringify(rawData.installments[0])}`);
                }
            }
            const invoices = invoicesSnapshot.docs.map(doc => {
                var _a, _b, _c, _d;
                const data = doc.data();
                const amountInChf = rappenToChf(data.amount || 0);
                // Prüfe ob Ratenplan existiert - sowohl Flag als auch Array prüfen
                const installments = data.installments || [];
                const hasInstallmentPlan = data.isInstallmentPlan === true ||
                    (Array.isArray(installments) && installments.length > 0) ||
                    (typeof data.installmentCount === 'number' && data.installmentCount > 0);
                console.log(`[getPersonDebts] Invoice ${doc.id}: isInstallmentPlan=${data.isInstallmentPlan}, installments.length=${installments.length}, installmentCount=${data.installmentCount}, hasInstallmentPlan=${hasInstallmentPlan}, keys=${Object.keys(data).join(',')}`);
                // Berechne offene und bezahlte Raten
                const openInstallments = installments.filter((i) => i.status === 'pending' || i.status === 'open');
                const paidInstallments = installments.filter((i) => i.status === 'paid' || i.status === 'completed');
                // Berechne Restschuld basierend auf offenen Raten
                let remainingDebt = amountInChf;
                if (hasInstallmentPlan && installments.length > 0) {
                    // Intelligente Betragskonvertierung für Raten
                    const expectedPerRateChf = amountInChf / installments.length;
                    const expectedPerRateRappen = (data.amount || 0) / installments.length;
                    // Prüfe zuerst die Summe aller Raten um das Format zu bestimmen
                    const totalAmount = installments.reduce((s, i) => s + (i.amount || 0), 0);
                    const isChfFormat = Math.abs(totalAmount - amountInChf) < amountInChf * 0.1;
                    const isRappenFormat = Math.abs(totalAmount - (data.amount || 0)) < (data.amount || 1) * 0.1;
                    const toChfSafe = (amount) => {
                        if (!amount)
                            return 0;
                        // Wenn wir das Format schon kennen
                        if (isChfFormat)
                            return amount;
                        if (isRappenFormat)
                            return rappenToChf(amount);
                        // Wenn Betrag sehr groß ist (korrupte Daten), verwende erwarteten Wert
                        if (amount > amountInChf)
                            return expectedPerRateChf;
                        // Wenn Betrag nahe am erwarteten CHF-Wert ist
                        if (amount >= expectedPerRateChf * 0.5 && amount <= expectedPerRateChf * 2) {
                            return amount;
                        }
                        // Wenn Betrag nahe am erwarteten Rappen-Wert ist
                        if (amount >= expectedPerRateRappen * 0.5 && amount <= expectedPerRateRappen * 2) {
                            return rappenToChf(amount);
                        }
                        // Default: Annahme CHF
                        return amount;
                    };
                    remainingDebt = openInstallments.reduce((sum, inst) => sum + toChfSafe(inst.amount || 0), 0);
                }
                return {
                    id: doc.id,
                    description: data.description || '',
                    totalAmountChf: amountInChf,
                    remainingDebtChf: roundToSwiss5Rappen(remainingDebt),
                    status: data.status || 'open',
                    dueDate: ((_c = (_b = (_a = data.dueDate) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a)) === null || _c === void 0 ? void 0 : _c.toISOString()) || null,
                    hasInstallmentPlan,
                    installmentCount: installments.length,
                    paidInstallments: paidInstallments.length,
                    openInstallments: openInstallments.length,
                    // Debug fields
                    _debug: {
                        isInstallmentPlanFlag: data.isInstallmentPlan,
                        installmentsArrayLength: Array.isArray(data.installments) ? data.installments.length : 0,
                        installmentCountField: data.installmentCount,
                        allFields: Object.keys(data),
                    },
                    nextDueDate: openInstallments.length > 0
                        ? (_d = openInstallments.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]) === null || _d === void 0 ? void 0 : _d.dueDate
                        : null,
                    installments: hasInstallmentPlan ? (() => {
                        const expectedPerRateChf = amountInChf / installments.length;
                        const expectedPerRateRappen = (data.amount || 0) / installments.length;
                        const totalAmount = installments.reduce((s, i) => s + (i.amount || 0), 0);
                        const isChfFormat = Math.abs(totalAmount - amountInChf) < amountInChf * 0.1;
                        const isRappenFormat = Math.abs(totalAmount - (data.amount || 0)) < (data.amount || 1) * 0.1;
                        const toChfSafe = (amount) => {
                            if (!amount)
                                return 0;
                            if (isChfFormat)
                                return amount;
                            if (isRappenFormat)
                                return rappenToChf(amount);
                            if (amount > amountInChf)
                                return expectedPerRateChf;
                            if (amount >= expectedPerRateChf * 0.5 && amount <= expectedPerRateChf * 2)
                                return amount;
                            if (amount >= expectedPerRateRappen * 0.5 && amount <= expectedPerRateRappen * 2)
                                return rappenToChf(amount);
                            return amount;
                        };
                        return installments.map((inst, idx) => ({
                            number: idx + 1,
                            amountChf: roundToSwiss5Rappen(toChfSafe(inst.amount || 0)),
                            dueDate: inst.dueDate,
                            status: inst.status,
                            paidDate: inst.paidDate || null,
                        }));
                    })() : [],
                };
            });
            // Berechne Gesamtrestschuld (nur offene Rechnungen)
            const openInvoices = invoices.filter(inv => inv.status !== 'paid' && inv.status !== 'completed');
            const totalDebtChf = openInvoices.reduce((sum, inv) => sum + inv.remainingDebtChf, 0);
            const totalOpenInstallments = openInvoices.reduce((sum, inv) => sum + inv.openInstallments, 0);
            // Prüfe ob irgendeine Rechnung einen Ratenplan hat
            const hasAnyInstallmentPlan = invoices.some(inv => inv.hasInstallmentPlan);
            const totalInstallmentCount = invoices.reduce((sum, inv) => sum + inv.installmentCount, 0);
            return {
                personName: person.name,
                totalDebtChf: roundToSwiss5Rappen(totalDebtChf),
                currency: 'CHF',
                invoiceCount: invoices.length,
                openInvoiceCount: openInvoices.length,
                totalOpenInstallments,
                hasAnyInstallmentPlan,
                totalInstallmentCount,
                invoices,
                // Debug-Info für AI
                debugSummary: `${person.name} hat ${invoices.length} Rechnung(en). ${hasAnyInstallmentPlan ? `Davon ${invoices.filter(i => i.hasInstallmentPlan).length} mit Ratenplan (gesamt ${totalInstallmentCount} Raten, ${totalOpenInstallments} offen).` : 'Keine Ratenpläne gefunden.'} RAW: installmentCounts=[${invoices.map(i => i.installmentCount).join(',')}]`,
                // Explizite Ratenplan-Anzeige
                ratenplanAnzeige: invoices.filter(i => i.hasInstallmentPlan && i.installments && i.installments.length > 0).map(i => ({
                    rechnung: i.description,
                    betragChf: i.totalAmountChf,
                    raten: i.installments,
                })),
                // RAW Debug für Fehlersuche - zeigt welche Felder in Firestore existieren
                _rawDebug: invoicesSnapshot.docs.map(doc => {
                    const d = doc.data();
                    return {
                        id: doc.id,
                        fieldsInDoc: Object.keys(d),
                        hasInstallmentsField: 'installments' in d,
                        installmentsType: typeof d.installments,
                        installmentsIsArray: Array.isArray(d.installments),
                        installmentsLength: Array.isArray(d.installments) ? d.installments.length : 0,
                        isInstallmentPlanValue: d.isInstallmentPlan,
                        installmentCountValue: d.installmentCount,
                    };
                }),
            };
        }
        case 'getPersonInstallments': {
            const { personName } = args;
            const person = await findPersonByName(db, userId, personName);
            if (!person) {
                return { error: `Person "${personName}" nicht gefunden` };
            }
            console.log(`[getPersonInstallments] Searching invoices for person: ${person.id} (${person.name})`);
            // Hole ALLE Rechnungen und filtere dann nach Ratenplan
            // Da Firestore keine "array is not empty" Abfrage unterstützt
            const invoicesSnapshot = await db.collection('people').doc(person.id).collection('invoices').get();
            console.log(`[getPersonInstallments] Found ${invoicesSnapshot.size} total invoices`);
            // Log all invoices for debugging
            const allInvoicesDebug = invoicesSnapshot.docs.map((doc, idx) => {
                const data = doc.data();
                const debugInfo = {
                    idx,
                    id: doc.id,
                    description: data.description,
                    amount: data.amount,
                    isInstallmentPlan: data.isInstallmentPlan,
                    installmentCount: data.installmentCount,
                    hasInstallmentsArray: Array.isArray(data.installments),
                    installmentsLength: Array.isArray(data.installments) ? data.installments.length : 0,
                    installmentInterval: data.installmentInterval,
                    status: data.status,
                    // Alle Keys des Dokuments für vollständiges Debugging
                    allKeys: Object.keys(data),
                };
                console.log(`[getPersonInstallments] Invoice ${idx}:`, JSON.stringify(debugInfo));
                return debugInfo;
            });
            // Filtere Rechnungen - SEHR PERMISSIV um alle Rate-Daten zu finden
            const invoicesWithInstallments = invoicesSnapshot.docs.filter(doc => {
                const data = doc.data();
                const hasInstallmentPlanFlag = data.isInstallmentPlan === true;
                const hasInstallmentsArray = Array.isArray(data.installments) && data.installments.length > 0;
                const hasInstallmentCount = typeof data.installmentCount === 'number' && data.installmentCount > 0;
                const hasInstallmentInterval = data.installmentInterval != null;
                const hasInstallmentEndDate = data.installmentEndDate != null;
                // Sehr permissive Prüfung - jede Eigenschaft reicht
                return hasInstallmentPlanFlag || hasInstallmentsArray || hasInstallmentCount || hasInstallmentInterval || hasInstallmentEndDate;
            });
            console.log(`[getPersonInstallments] Found ${invoicesWithInstallments.length} invoices with installments`);
            if (invoicesWithInstallments.length === 0) {
                // Detaillierte Debug-Info wenn keine Raten gefunden
                return {
                    personName: person.name,
                    hasInstallmentPlan: false,
                    message: `${person.name} hat keinen aktiven Ratenplan.`,
                    totalInvoices: invoicesSnapshot.size,
                    debugInvoices: allInvoicesDebug,
                    hint: 'Prüfe debugInvoices - wenn installmentsLength > 0, dann existiert ein Ratenplan aber die Erkennung hat versagt.',
                };
            }
            // Helper: Bestimme ob Betrag in CHF oder Rappen ist und konvertiere
            const toChf = (amount, totalAmountRappen) => {
                if (!amount)
                    return 0;
                const numAmount = Number(amount);
                // Wenn der Betrag sehr groß ist im Vergleich zum Gesamtbetrag (z.B. 5000 vs 20000),
                // dann ist er wahrscheinlich schon in CHF. Wenn er kleiner ist, könnte er in Rappen sein.
                // Einfache Heuristik: Wenn der Betrag > 100 und totalAmount in Rappen < Betrag * 100, dann CHF
                const totalChf = totalAmountRappen / 100;
                if (numAmount <= totalChf && numAmount > 0) {
                    // Betrag ist kleiner oder gleich dem Gesamtbetrag in CHF -> wahrscheinlich CHF
                    return numAmount;
                }
                // Sonst behandle als Rappen
                return rappenToChf(numAmount);
            };
            // Helper: Konvertiere dueDate (kann Timestamp oder String sein)
            const getDueDateString = (dueDate) => {
                if (!dueDate)
                    return null;
                if (typeof dueDate === 'string')
                    return dueDate;
                if (typeof dueDate.toDate === 'function') {
                    return dueDate.toDate().toISOString().split('T')[0];
                }
                if (dueDate instanceof Date) {
                    return dueDate.toISOString().split('T')[0];
                }
                return String(dueDate);
            };
            // Helper: Konvertiere Date für Sortierung
            const getDueDateForSort = (dueDate) => {
                if (!dueDate)
                    return 0;
                if (typeof dueDate === 'string')
                    return new Date(dueDate).getTime();
                if (typeof dueDate.toDate === 'function')
                    return dueDate.toDate().getTime();
                if (dueDate instanceof Date)
                    return dueDate.getTime();
                return 0;
            };
            // Verwende die gefilterten Rechnungen
            const plans = invoicesWithInstallments.map(doc => {
                const data = doc.data();
                const totalAmountRappen = data.amount || 0;
                const totalAmountChf = rappenToChf(totalAmountRappen);
                const installments = data.installments || [];
                const openInstallments = installments.filter((i) => i.status === 'pending' || i.status === 'open');
                const paidInstallments = installments.filter((i) => i.status === 'paid' || i.status === 'completed');
                // Konvertiere Beträge mit Heuristik
                const paidAmountChf = paidInstallments.reduce((sum, inst) => sum + toChf(inst.amount, totalAmountRappen), 0);
                const remainingAmountChf = openInstallments.reduce((sum, inst) => sum + toChf(inst.amount, totalAmountRappen), 0);
                // Sortiere Raten nach Fälligkeit
                const sortedInstallments = [...installments].sort((a, b) => getDueDateForSort(a.dueDate) - getDueDateForSort(b.dueDate));
                const nextDueInstallment = sortedInstallments.find((i) => i.status === 'pending' || i.status === 'open');
                return {
                    invoiceId: doc.id,
                    description: data.description || 'Ratenplan',
                    totalAmountChf,
                    paidAmountChf: roundToSwiss5Rappen(paidAmountChf),
                    remainingAmountChf: roundToSwiss5Rappen(remainingAmountChf),
                    totalInstallments: installments.length,
                    paidInstallments: paidInstallments.length,
                    openInstallments: openInstallments.length,
                    nextDueDate: getDueDateString(nextDueInstallment === null || nextDueInstallment === void 0 ? void 0 : nextDueInstallment.dueDate),
                    nextDueAmountChf: nextDueInstallment ? toChf(nextDueInstallment.amount, totalAmountRappen) : null,
                    installments: sortedInstallments.map((inst, idx) => ({
                        number: inst.number || idx + 1,
                        amountChf: toChf(inst.amount, totalAmountRappen),
                        dueDate: getDueDateString(inst.dueDate),
                        status: inst.status === 'paid' || inst.status === 'completed' ? 'bezahlt' : 'offen',
                        paidDate: inst.paidDate || null,
                    })),
                };
            });
            const totalRemainingChf = plans.reduce((sum, p) => sum + p.remainingAmountChf, 0);
            const totalOpenInstallments = plans.reduce((sum, p) => sum + p.openInstallments, 0);
            return {
                personName: person.name,
                hasInstallmentPlan: true,
                totalRemainingChf: roundToSwiss5Rappen(totalRemainingChf),
                totalOpenInstallments,
                currency: 'CHF',
                plans,
            };
        }
        // ========== ERINNERUNGEN & TERMINE ==========
        case 'getAllReminders': {
            const { startDate, endDate, status, personId } = args;
            let query = db.collection('reminders')
                .where('userId', '==', userId);
            if (personId)
                query = query.where('personId', '==', personId);
            if (status)
                query = query.where('status', '==', status);
            const snapshot = await query.get();
            let reminders = snapshot.docs.map(doc => {
                var _a, _b, _c;
                const data = doc.data();
                return {
                    id: doc.id,
                    title: data.title || '',
                    type: data.type || 'reminder',
                    dueDate: ((_c = (_b = (_a = data.dueDate) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a)) === null || _c === void 0 ? void 0 : _c.toISOString()) || null,
                    status: data.status || 'pending',
                    personId: data.personId || null,
                    amount: data.amount || null,
                    notes: data.notes || '',
                };
            });
            // Date filtering
            if (startDate) {
                const start = new Date(startDate);
                reminders = reminders.filter(r => r.dueDate && new Date(r.dueDate) >= start);
            }
            if (endDate) {
                const end = new Date(endDate);
                reminders = reminders.filter(r => r.dueDate && new Date(r.dueDate) <= end);
            }
            // Sort by dueDate
            reminders.sort((a, b) => {
                if (!a.dueDate)
                    return 1;
                if (!b.dueDate)
                    return -1;
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            });
            return { reminders, count: reminders.length };
        }
        case 'createReminder': {
            const { title, dueDate, type, personId, personName, amount, currency, notes, recurring, recurringFrequency } = args;
            // Parse and validate date - normalize to avoid timezone issues
            const parsedDate = new Date(dueDate);
            if (isNaN(parsedDate.getTime())) {
                return { error: `Ungültiges Datum: ${dueDate}. Format: YYYY-MM-DD oder YYYY-MM-DDTHH:mm:ss` };
            }
            // Normalize date to avoid timezone shifts
            // Extract date components to create a clean date object
            const normalizedDate = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
            // If time is provided in the date string, preserve it; otherwise default to noon
            if (dueDate.includes('T') && dueDate.includes(':')) {
                // Time is specified, preserve it
                normalizedDate.setHours(parsedDate.getHours(), parsedDate.getMinutes(), parsedDate.getSeconds(), parsedDate.getMilliseconds());
            }
            else {
                // No time specified, default to noon to avoid timezone issues
                normalizedDate.setHours(12, 0, 0, 0);
            }
            // WICHTIG: Prüfe, ob das Datum in der Zukunft liegt (compare dates only, not time)
            const normalizedSwissTime = new Date(swissTime.getFullYear(), swissTime.getMonth(), swissTime.getDate());
            const normalizedRequestDate = new Date(normalizedDate.getFullYear(), normalizedDate.getMonth(), normalizedDate.getDate());
            if (normalizedRequestDate < normalizedSwissTime) {
                const tomorrow = new Date(swissTime);
                tomorrow.setDate(tomorrow.getDate() + 1);
                return {
                    error: `Das Datum ${dueDate} liegt in der Vergangenheit! Aktuelles Datum ist ${swissTime.toISOString().split('T')[0]}. Bitte wähle ein Datum in der Zukunft.`,
                    suggestion: `Nächster möglicher Tag: ${tomorrow.toISOString().split('T')[0]}`,
                    currentDate: swissTime.toISOString().split('T')[0],
                };
            }
            // Find personId if personName is provided
            let finalPersonId = personId;
            if (!finalPersonId && personName) {
                const person = await findPersonByName(db, userId, personName);
                if (person)
                    finalPersonId = person.id;
            }
            const reminderData = {
                userId,
                title,
                dueDate: admin.firestore.Timestamp.fromDate(normalizedDate),
                type: type || 'reminder',
                status: 'pending',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            if (finalPersonId)
                reminderData.personId = finalPersonId;
            if (amount)
                reminderData.amount = amount;
            if (currency)
                reminderData.currency = currency;
            if (notes)
                reminderData.notes = notes;
            if (recurring) {
                reminderData.recurring = true;
                reminderData.recurringFrequency = recurringFrequency || 'monthly';
            }
            const reminderRef = await db.collection('reminders').add(reminderData);
            return {
                success: true,
                reminderId: reminderRef.id,
                message: `Erinnerung "${title}" für ${parsedDate.toLocaleDateString('de-CH')} wurde erstellt.`,
                dueDate: parsedDate.toISOString(),
            };
        }
        case 'createQuickReminder': {
            const { title, minutesFromNow = 5, notes } = args;
            if (!title || typeof title !== 'string' || title.trim().length === 0) {
                return { error: 'title ist erforderlich' };
            }
            const minutes = Math.max(1, Math.min(1440, Math.round(minutesFromNow || 5)));
            // Calculate due date
            const dueDate = new Date(swissTime.getTime() + minutes * 60 * 1000);
            const dueDateTimestamp = admin.firestore.Timestamp.fromDate(dueDate);
            // Create reminder
            const reminderData = {
                userId,
                title: title.trim(),
                type: 'erinnerung',
                dueDate: dueDateTimestamp,
                isAllDay: false,
                notes: notes || null,
                status: 'offen',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            const reminderRef = await db.collection('reminders').add(reminderData);
            console.log(`[createQuickReminder] Created quick reminder ${reminderRef.id} for ${minutes} minutes`);
            return {
                success: true,
                reminderId: reminderRef.id,
                message: `Erinnerung "${title}" wurde für ${minutes} Minuten erstellt.`,
                dueDate: dueDate.toISOString(),
                minutesFromNow: minutes,
            };
        }
        case 'createFollowUpReminder': {
            const { originalReminderId, minutesFromNow = 15, title } = args;
            if (!originalReminderId) {
                return { error: 'originalReminderId ist erforderlich' };
            }
            // Get original reminder
            const originalReminderRef = db.collection('reminders').doc(originalReminderId);
            const originalReminderDoc = await originalReminderRef.get();
            if (!originalReminderDoc.exists || ((_b = originalReminderDoc.data()) === null || _b === void 0 ? void 0 : _b.userId) !== userId) {
                return { error: 'Ursprüngliche Erinnerung nicht gefunden oder nicht autorisiert' };
            }
            const originalReminder = originalReminderDoc.data();
            const minutes = Math.max(1, Math.min(1440, Math.round(minutesFromNow || 15)));
            // Calculate due date
            const dueDate = new Date(swissTime.getTime() + minutes * 60 * 1000);
            const dueDateTimestamp = admin.firestore.Timestamp.fromDate(dueDate);
            // Use provided title or original reminder title
            const reminderTitle = (title === null || title === void 0 ? void 0 : title.trim()) || (originalReminder === null || originalReminder === void 0 ? void 0 : originalReminder.title) || 'Erinnerung';
            // Create follow-up reminder
            const reminderData = {
                userId,
                title: reminderTitle,
                type: (originalReminder === null || originalReminder === void 0 ? void 0 : originalReminder.type) || 'erinnerung',
                dueDate: dueDateTimestamp,
                isAllDay: false,
                notes: (originalReminder === null || originalReminder === void 0 ? void 0 : originalReminder.notes) || null,
                status: 'offen',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            const reminderRef = await db.collection('reminders').add(reminderData);
            return {
                success: true,
                reminderId: reminderRef.id,
                message: `Follow-up-Erinnerung "${reminderTitle}" wurde für ${minutes} Minuten erstellt.`,
                dueDate: dueDate.toISOString(),
                minutesFromNow: minutes,
            };
        }
        case 'updateReminder': {
            const { reminderId, title, dueDate, status, notes } = args;
            const updateData = {
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            if (title)
                updateData.title = title;
            if (status)
                updateData.status = status;
            if (notes !== undefined)
                updateData.notes = notes;
            if (dueDate) {
                const parsedDate = new Date(dueDate);
                if (parsedDate < swissTime) {
                    return { error: `Das Datum ${dueDate} liegt in der Vergangenheit!` };
                }
                updateData.dueDate = admin.firestore.Timestamp.fromDate(parsedDate);
            }
            await db.collection('reminders').doc(reminderId).update(updateData);
            return { success: true, message: 'Erinnerung wurde aktualisiert.' };
        }
        case 'deleteReminder': {
            const { reminderId } = args;
            await db.collection('reminders').doc(reminderId).delete();
            return { success: true, message: 'Erinnerung wurde gelöscht.' };
        }
        case 'getPersonReminders': {
            const { personName, startDate, endDate } = args;
            const person = await findPersonByName(db, userId, personName);
            if (!person) {
                return { error: `Person "${personName}" nicht gefunden` };
            }
            let query = db.collection('reminders')
                .where('userId', '==', userId)
                .where('personId', '==', person.id);
            const snapshot = await query.get();
            let reminders = snapshot.docs.map(doc => {
                var _a, _b, _c;
                const data = doc.data();
                return {
                    id: doc.id,
                    title: data.title || '',
                    type: data.type || 'reminder',
                    dueDate: ((_c = (_b = (_a = data.dueDate) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a)) === null || _c === void 0 ? void 0 : _c.toISOString()) || null,
                    status: data.status || 'pending',
                    amount: data.amount || null,
                    notes: data.notes || '',
                };
            });
            if (startDate)
                reminders = reminders.filter(r => r.dueDate && new Date(r.dueDate) >= new Date(startDate));
            if (endDate)
                reminders = reminders.filter(r => r.dueDate && new Date(r.dueDate) <= new Date(endDate));
            return { personName: person.name, reminders, count: reminders.length };
        }
        // ========== RECHNUNGEN ==========
        case 'getAllInvoices': {
            const { personId, personName, status, startDate, endDate } = args;
            let targetPersonId = personId;
            if (!targetPersonId && personName) {
                const person = await findPersonByName(db, userId, personName);
                if (person)
                    targetPersonId = person.id;
            }
            // Get all people to fetch their invoices
            const peopleSnapshot = await db.collection('people')
                .where('userId', '==', userId)
                .get();
            const allInvoices = [];
            for (const personDoc of peopleSnapshot.docs) {
                if (targetPersonId && personDoc.id !== targetPersonId)
                    continue;
                let invoiceQuery = personDoc.ref.collection('invoices');
                // Status-Filter mit mehrsprachiger Unterstützung
                if (status) {
                    // Prüfe ob der Status einer bekannten Kategorie entspricht und erweitere auf alle Varianten
                    if (exports.STATUS_OPEN.includes(status.toLowerCase())) {
                        invoiceQuery = invoiceQuery.where('status', 'in', getOpenStatusVariants());
                    }
                    else if (exports.STATUS_PAID.includes(status.toLowerCase())) {
                        invoiceQuery = invoiceQuery.where('status', 'in', exports.STATUS_PAID);
                    }
                    else {
                        invoiceQuery = invoiceQuery.where('status', '==', status);
                    }
                }
                const invoicesSnapshot = await invoiceQuery.get();
                for (const invDoc of invoicesSnapshot.docs) {
                    const data = invDoc.data();
                    // Konvertiere Beträge von Rappen zu CHF für die AI-Anzeige
                    const amountInChf = rappenToChf(data.amount || 0);
                    // Prüfe auf Ratenplan
                    const installments = data.installments || [];
                    const hasInstallmentPlan = data.isInstallmentPlan === true ||
                        (Array.isArray(installments) && installments.length > 0) ||
                        (typeof data.installmentCount === 'number' && data.installmentCount > 0);
                    const invoice = {
                        id: invDoc.id,
                        personId: personDoc.id,
                        personName: personDoc.data().name,
                        description: data.description || '',
                        amount: amountInChf,
                        currency: data.currency || 'CHF',
                        status: data.status || 'offen',
                        dueDate: ((_e = (_d = (_c = data.dueDate) === null || _c === void 0 ? void 0 : _c.toDate) === null || _d === void 0 ? void 0 : _d.call(_c)) === null || _e === void 0 ? void 0 : _e.toISOString()) || null,
                        date: ((_h = (_g = (_f = data.date) === null || _f === void 0 ? void 0 : _f.toDate) === null || _g === void 0 ? void 0 : _g.call(_f)) === null || _h === void 0 ? void 0 : _h.toISOString()) || null,
                        // Ratenplan-Informationen hinzufügen
                        hasInstallmentPlan,
                        installmentCount: installments.length,
                        isInstallmentPlan: data.isInstallmentPlan || false,
                    };
                    // Raten-Details wenn vorhanden
                    if (hasInstallmentPlan && installments.length > 0) {
                        const openInstallments = installments.filter((i) => i.status === 'pending' || i.status === 'open');
                        const paidInstallments = installments.filter((i) => i.status === 'paid' || i.status === 'completed');
                        invoice.paidInstallments = paidInstallments.length;
                        invoice.openInstallments = openInstallments.length;
                        invoice.installmentInterval = data.installmentInterval || 'monthly';
                        invoice.installments = installments.map((inst, idx) => {
                            var _a, _b, _c;
                            return ({
                                number: idx + 1,
                                amount: inst.amount,
                                dueDate: ((_c = (_b = (_a = inst.dueDate) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a)) === null || _c === void 0 ? void 0 : _c.toISOString()) || inst.dueDate,
                                status: inst.status,
                            });
                        });
                    }
                    // Date filter
                    if (startDate && invoice.dueDate && new Date(invoice.dueDate) < new Date(startDate))
                        continue;
                    if (endDate && invoice.dueDate && new Date(invoice.dueDate) > new Date(endDate))
                        continue;
                    allInvoices.push(invoice);
                }
            }
            const totalAmount = allInvoices.reduce((sum, inv) => sum + inv.amount, 0);
            const openAmount = allInvoices.filter(inv => isStatusOpen(inv.status)).reduce((sum, inv) => sum + inv.amount, 0);
            return {
                invoices: allInvoices,
                count: allInvoices.length,
                totalAmount,
                openAmount,
                currency: 'CHF',
            };
        }
        case 'createInvoice': {
            const { personId, personName, description, amount, currency, dueDate, status, notes } = args;
            let targetPersonId = personId;
            if (!targetPersonId && personName) {
                const person = await findPersonByName(db, userId, personName);
                if (person) {
                    targetPersonId = person.id;
                }
                else {
                    // Create person if not exists
                    const newPersonRef = await db.collection('people').add({
                        userId,
                        name: personName,
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                    targetPersonId = newPersonRef.id;
                }
            }
            if (!targetPersonId) {
                return { error: 'Person-ID oder Name erforderlich' };
            }
            const invoiceData = {
                description,
                amount,
                currency: currency || 'CHF',
                status: status || 'offen',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            if (dueDate)
                invoiceData.dueDate = admin.firestore.Timestamp.fromDate(new Date(dueDate));
            if (notes)
                invoiceData.notes = notes;
            const invoiceRef = await db.collection('people').doc(targetPersonId).collection('invoices').add(invoiceData);
            return {
                success: true,
                invoiceId: invoiceRef.id,
                personId: targetPersonId,
                message: `Rechnung "${description}" über ${amount} ${currency || 'CHF'} wurde erstellt.`,
            };
        }
        case 'updateInvoiceStatus': {
            const { personId, invoiceId, status } = args;
            // Find invoice if personId not provided
            let targetPersonId = personId;
            if (!targetPersonId) {
                const peopleSnapshot = await db.collection('people')
                    .where('userId', '==', userId)
                    .get();
                for (const personDoc of peopleSnapshot.docs) {
                    const invoiceDoc = await personDoc.ref.collection('invoices').doc(invoiceId).get();
                    if (invoiceDoc.exists) {
                        targetPersonId = personDoc.id;
                        break;
                    }
                }
            }
            if (!targetPersonId) {
                return { error: 'Rechnung nicht gefunden' };
            }
            await db.collection('people').doc(targetPersonId).collection('invoices').doc(invoiceId).update({
                status,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return { success: true, message: `Rechnung wurde auf "${status}" gesetzt.` };
        }
        case 'createInstallmentPlan': {
            const { personName, invoiceId, installmentAmount, numberOfInstallments, frequency, startDate } = args;
            console.log(`[createInstallmentPlan] Starting for person: ${personName}, installmentAmount: ${installmentAmount}`);
            // 1. Finde Person
            const person = await findPersonByName(db, userId, personName);
            if (!person) {
                console.log(`[createInstallmentPlan] Person not found: ${personName}`);
                return { error: `Person "${personName}" nicht gefunden` };
            }
            console.log(`[createInstallmentPlan] Found person: ${person.id}`);
            // 2. Finde Rechnung
            let targetInvoice = null;
            let targetInvoiceId = invoiceId;
            if (invoiceId) {
                const invoiceDoc = await db.collection('people').doc(person.id).collection('invoices').doc(invoiceId).get();
                if (invoiceDoc.exists) {
                    targetInvoice = Object.assign({ id: invoiceDoc.id }, invoiceDoc.data());
                }
            }
            else {
                // Suche offene Rechnungen
                const invoicesSnapshot = await db.collection('people').doc(person.id).collection('invoices')
                    .where('status', 'in', getOpenStatusVariants())
                    .get();
                console.log(`[createInstallmentPlan] Found ${invoicesSnapshot.size} open invoices`);
                if (invoicesSnapshot.empty) {
                    console.log(`[createInstallmentPlan] No open invoice found for ${personName}`);
                    return { error: `Keine offene Rechnung für "${personName}" gefunden` };
                }
                if (invoicesSnapshot.size > 1) {
                    const invoices = invoicesSnapshot.docs.map(doc => ({
                        id: doc.id,
                        description: doc.data().description,
                        amount: doc.data().amount,
                    }));
                    return {
                        error: `Mehrere offene Rechnungen gefunden. Bitte gib die invoiceId an.`,
                        invoices,
                    };
                }
                targetInvoice = Object.assign({ id: invoicesSnapshot.docs[0].id }, invoicesSnapshot.docs[0].data());
                targetInvoiceId = invoicesSnapshot.docs[0].id;
            }
            if (!targetInvoice) {
                return { error: 'Rechnung nicht gefunden' };
            }
            // Betrag ist in Rappen gespeichert, konvertiere zu CHF für Berechnungen
            const totalAmountInChf = rappenToChf(targetInvoice.amount);
            // 3. Berechne Ratenplan
            let numInstallments;
            let amountPerInstallment;
            if (installmentAmount) {
                // installmentAmount ist in CHF (vom Benutzer angegeben)
                numInstallments = Math.ceil(totalAmountInChf / installmentAmount);
                amountPerInstallment = roundToSwiss5Rappen(installmentAmount);
            }
            else if (numberOfInstallments) {
                numInstallments = numberOfInstallments;
                amountPerInstallment = roundToSwiss5Rappen(totalAmountInChf / numberOfInstallments);
            }
            else {
                return { error: 'Bitte gib entweder installmentAmount oder numberOfInstallments an' };
            }
            // 4. Berechne Fälligkeitsdaten
            const freq = frequency || 'monthly';
            const start = startDate ? new Date(startDate) : new Date(swissTime.getFullYear(), swissTime.getMonth() + 1, 1);
            const installments = [];
            for (let i = 0; i < numInstallments; i++) {
                const dueDate = new Date(start);
                if (freq === 'weekly') {
                    dueDate.setDate(dueDate.getDate() + (i * 7));
                }
                else if (freq === 'biweekly') {
                    dueDate.setDate(dueDate.getDate() + (i * 14));
                }
                else {
                    dueDate.setMonth(dueDate.getMonth() + i);
                }
                // Letzte Rate kann abweichen um Rundungsdifferenz auszugleichen
                const amount = i === numInstallments - 1
                    ? roundToSwiss5Rappen(totalAmountInChf - (amountPerInstallment * (numInstallments - 1)))
                    : amountPerInstallment;
                installments.push({
                    number: i + 1,
                    amount: roundToSwiss5Rappen(amount),
                    dueDate: dueDate.toISOString().split('T')[0],
                    status: 'pending',
                });
            }
            // 5. Update Rechnung mit Ratenplan (Format passend zum Frontend)
            console.log(`[createInstallmentPlan] Saving installment plan to invoice ${targetInvoiceId}`);
            console.log(`[createInstallmentPlan] Plan: ${numInstallments} installments of ${amountPerInstallment} CHF`);
            // Frontend erwartet: isInstallmentPlan + installments Array direkt auf der Rechnung
            await db.collection('people').doc(person.id).collection('invoices').doc(targetInvoiceId).update({
                isInstallmentPlan: true,
                installmentCount: numInstallments,
                installmentAmount: chfToRappen(amountPerInstallment), // In Rappen für Konsistenz
                installmentInterval: freq,
                installments: installments.map((inst, idx) => ({
                    number: idx + 1,
                    amount: chfToRappen(inst.amount), // In Rappen
                    dueDate: inst.dueDate,
                    status: inst.status,
                    paidDate: null,
                })),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return {
                success: true,
                message: `Ratenplan für ${personName} erstellt: ${numInstallments} Raten à ${amountPerInstallment} CHF (Gesamtbetrag: ${totalAmountInChf} CHF)`,
                plan: {
                    totalAmountChf: totalAmountInChf,
                    numberOfInstallments: numInstallments,
                    amountPerInstallment,
                    frequency: freq,
                    firstPaymentDate: installments[0].dueDate,
                    lastPaymentDate: installments[installments.length - 1].dueDate,
                    installments,
                },
            };
        }
        case 'recordInstallmentPayment': {
            const { personName, amount, paymentDate, notes: paymentNotes } = args;
            const paymentAmountInRappen = chfToRappen(amount);
            const payDateStr = paymentDate || swissTime.toISOString().split('T')[0];
            console.log(`[recordInstallmentPayment] Recording payment of ${amount} CHF for ${personName}`);
            // 1. Finde Person
            const person = await findPersonByName(db, userId, personName);
            if (!person) {
                return { error: `Person "${personName}" nicht gefunden` };
            }
            // 2. Finde Rechnung mit Ratenplan
            const invoicesSnapshot = await db.collection('people').doc(person.id).collection('invoices')
                .where('isInstallmentPlan', '==', true)
                .get();
            // Filtere nach offenen Rechnungen
            const openInvoices = invoicesSnapshot.docs.filter(doc => {
                const data = doc.data();
                return data.status !== 'paid' && data.status !== 'completed' && data.status !== 'bezahlt';
            });
            if (openInvoices.length === 0) {
                return { error: `Kein aktiver Ratenplan für "${personName}" gefunden` };
            }
            const invoiceDoc = openInvoices[0];
            const invoice = invoiceDoc.data();
            // Installments sind direkt auf der Rechnung gespeichert (neues Format)
            const installments = invoice.installments || [];
            if (installments.length === 0) {
                return { error: `Ratenplan für "${personName}" hat keine Raten definiert` };
            }
            // 3. Finde nächste offene Rate und markiere sie als bezahlt
            let paidInstallmentNumber = 0;
            let foundOpenInstallment = false;
            const updatedInstallments = installments.map((inst) => {
                if (!foundOpenInstallment && (inst.status === 'pending' || inst.status === 'open')) {
                    foundOpenInstallment = true;
                    paidInstallmentNumber = inst.number;
                    return Object.assign(Object.assign({}, inst), { status: 'paid', paidDate: payDateStr, paidAmount: paymentAmountInRappen, notes: paymentNotes || null });
                }
                return inst;
            });
            if (!foundOpenInstallment) {
                return { error: `Alle Raten für "${personName}" sind bereits bezahlt` };
            }
            // 4. Berechne Status
            const paidInstallments = updatedInstallments.filter((i) => i.status === 'paid' || i.status === 'completed');
            const openInstallments = updatedInstallments.filter((i) => i.status === 'pending' || i.status === 'open');
            const paidAmountInRappen = paidInstallments.reduce((sum, i) => sum + (i.amount || 0), 0);
            const remainingAmountInRappen = openInstallments.reduce((sum, i) => sum + (i.amount || 0), 0);
            const isFullyPaid = openInstallments.length === 0;
            // 5. Update Rechnung
            await invoiceDoc.ref.update({
                status: isFullyPaid ? 'paid' : 'open',
                installments: updatedInstallments,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            // 6. Erstelle Zahlungseintrag in Finanzen
            await db.collection('financeEntries').add({
                userId,
                type: 'income',
                amount: paymentAmountInRappen,
                category: 'Ratenzahlung',
                description: `Ratenzahlung von ${personName} (Rate ${paidInstallmentNumber}/${installments.length})`,
                date: admin.firestore.Timestamp.fromDate(new Date(payDateStr)),
                personId: person.id,
                invoiceId: invoiceDoc.id,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log(`[recordInstallmentPayment] Success: Rate ${paidInstallmentNumber}/${installments.length} marked as paid`);
            return {
                success: true,
                message: isFullyPaid
                    ? `Letzte Rate (${paidInstallmentNumber}/${installments.length}) über ${amount} CHF erfasst. Ratenplan für ${personName} ist nun vollständig bezahlt!`
                    : `Rate ${paidInstallmentNumber}/${installments.length} über ${amount} CHF für ${personName} erfasst.`,
                status: {
                    personName,
                    paidAmountChf: rappenToChf(paidAmountInRappen),
                    remainingAmountChf: rappenToChf(remainingAmountInRappen),
                    paidInstallments: paidInstallments.length,
                    openInstallments: openInstallments.length,
                    totalInstallments: installments.length,
                    isFullyPaid,
                    nextDueDate: openInstallments.length > 0
                        ? (_j = openInstallments.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]) === null || _j === void 0 ? void 0 : _j.dueDate
                        : null,
                },
            };
        }
        // ========== FINANZEN ==========
        case 'getFinanceSummary': {
            const { startDate, endDate, month } = args;
            let start;
            let end;
            if (month) {
                const [year, monthNum] = month.split('-').map(Number);
                start = new Date(year, monthNum - 1, 1);
                end = new Date(year, monthNum, 0, 23, 59, 59);
            }
            else {
                start = startDate ? new Date(startDate) : new Date(swissTime.getFullYear(), swissTime.getMonth(), 1);
                end = endDate ? new Date(endDate) : new Date(swissTime.getFullYear(), swissTime.getMonth() + 1, 0, 23, 59, 59);
            }
            const snapshot = await db.collection('financeEntries')
                .where('userId', '==', userId)
                .get();
            const entries = snapshot.docs
                .map(doc => {
                var _a, _b;
                const data = doc.data();
                const entryDate = ((_b = (_a = data.date) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a)) || new Date();
                return {
                    id: doc.id,
                    type: data.type || 'expense',
                    category: data.category || 'Sonstiges',
                    amount: data.amount || 0,
                    description: data.description || '',
                    date: entryDate,
                };
            })
                .filter(e => e.date >= start && e.date <= end);
            const income = entries.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
            const expenses = entries.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
            const balance = income - expenses;
            const categories = entries
                .filter(e => e.type === 'expense')
                .reduce((acc, e) => {
                acc[e.category] = (acc[e.category] || 0) + e.amount;
                return acc;
            }, {});
            return {
                period: { start: start.toISOString(), end: end.toISOString() },
                income,
                expenses,
                balance,
                savingsRate: income > 0 ? Math.round((balance / income) * 100) : 0,
                categoryBreakdown: Object.entries(categories)
                    .map(([category, amount]) => ({ category, amount }))
                    .sort((a, b) => b.amount - a.amount),
                entryCount: entries.length,
                currency: 'CHF',
            };
        }
        case 'getAllFinanceEntries': {
            const { type, category, startDate, endDate } = args;
            let query = db.collection('financeEntries')
                .where('userId', '==', userId);
            if (type)
                query = query.where('type', '==', type);
            if (category)
                query = query.where('category', '==', category);
            const snapshot = await query.get();
            let entries = snapshot.docs.map(doc => {
                var _a, _b, _c;
                const data = doc.data();
                return {
                    id: doc.id,
                    type: data.type || 'expense',
                    category: data.category || 'Sonstiges',
                    amount: data.amount || 0,
                    description: data.description || '',
                    date: ((_c = (_b = (_a = data.date) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a)) === null || _c === void 0 ? void 0 : _c.toISOString()) || null,
                    currency: data.currency || 'CHF',
                };
            });
            if (startDate)
                entries = entries.filter(e => e.date && new Date(e.date) >= new Date(startDate));
            if (endDate)
                entries = entries.filter(e => e.date && new Date(e.date) <= new Date(endDate));
            entries.sort((a, b) => {
                if (!a.date)
                    return 1;
                if (!b.date)
                    return -1;
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            });
            return { entries, count: entries.length };
        }
        case 'createFinanceEntry': {
            const { type, amount, category, description, date, currency, recurring, recurringFrequency } = args;
            const entryDate = date ? new Date(date) : swissTime;
            const entryData = {
                userId,
                type,
                amount,
                category: category || 'Sonstiges',
                description,
                date: admin.firestore.Timestamp.fromDate(entryDate),
                currency: currency || 'CHF',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            if (recurring) {
                entryData.recurring = true;
                entryData.recurringFrequency = recurringFrequency || 'monthly';
            }
            const entryRef = await db.collection('financeEntries').add(entryData);
            return {
                success: true,
                entryId: entryRef.id,
                message: `${type === 'income' ? 'Einnahme' : 'Ausgabe'} "${description}" über ${amount} ${currency || 'CHF'} wurde erstellt.`,
            };
        }
        // ========== BUDGETS ==========
        case 'getAllBudgets': {
            const { month } = args;
            const targetMonth = month || `${swissTime.getFullYear()}-${String(swissTime.getMonth() + 1).padStart(2, '0')}`;
            const snapshot = await db.collection('budgets')
                .where('userId', '==', userId)
                .get();
            const budgets = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    category: data.category || '',
                    amount: data.amount || 0,
                    spent: data.spent || 0,
                    remaining: (data.amount || 0) - (data.spent || 0),
                    month: data.month || targetMonth,
                    currency: data.currency || 'CHF',
                };
            });
            return { budgets, count: budgets.length, month: targetMonth };
        }
        case 'createBudget': {
            const { category, amount, month, currency } = args;
            const targetMonth = month || `${swissTime.getFullYear()}-${String(swissTime.getMonth() + 1).padStart(2, '0')}`;
            const budgetRef = await db.collection('budgets').add({
                userId,
                category,
                amount,
                spent: 0,
                month: targetMonth,
                currency: currency || 'CHF',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return {
                success: true,
                budgetId: budgetRef.id,
                message: `Budget für "${category}" über ${amount} ${currency || 'CHF'} wurde erstellt.`,
            };
        }
        // ========== EINKAUFSLISTE ==========
        case 'getShoppingList': {
            const { showCompleted } = args;
            let query = db.collection('shoppingItems')
                .where('userId', '==', userId);
            if (!showCompleted) {
                query = query.where('bought', '==', false);
            }
            const snapshot = await query.get();
            const items = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.name || '',
                    quantity: data.quantity || 1,
                    unit: data.unit || '',
                    category: data.category || '',
                    notes: data.notes || '',
                    store: data.store || '',
                    bought: data.bought || false,
                    price: data.price || null,
                };
            });
            return { items, count: items.length };
        }
        case 'createShoppingItem': {
            const { name, quantity, unit, category, notes, store } = args;
            const itemRef = await db.collection('shoppingItems').add({
                userId,
                name,
                quantity: quantity || 1,
                unit: unit || '',
                category: category || '',
                notes: notes || '',
                store: store || '',
                bought: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return {
                success: true,
                itemId: itemRef.id,
                message: `"${name}" wurde zur Einkaufsliste hinzugefügt.`,
            };
        }
        case 'markShoppingItemAsBought': {
            const { itemId, price } = args;
            const updateData = {
                bought: true,
                boughtAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            if (price)
                updateData.price = price;
            await db.collection('shoppingItems').doc(itemId).update(updateData);
            return { success: true, message: 'Artikel wurde als gekauft markiert.' };
        }
        case 'deleteShoppingItem': {
            const { itemId } = args;
            await db.collection('shoppingItems').doc(itemId).delete();
            return { success: true, message: 'Artikel wurde von der Einkaufsliste entfernt.' };
        }
        // ========== KALENDER ==========
        case 'getCalendarEvents': {
            const { startDate, endDate, type } = args;
            const start = startDate ? new Date(startDate) : new Date(swissTime.getFullYear(), swissTime.getMonth(), 1);
            const end = endDate ? new Date(endDate) : new Date(swissTime.getFullYear(), swissTime.getMonth() + 1, 0);
            const events = [];
            // Get reminders
            if (!type || type === 'all' || type === 'reminders') {
                const remindersSnapshot = await db.collection('reminders')
                    .where('userId', '==', userId)
                    .get();
                remindersSnapshot.docs.forEach(doc => {
                    var _a, _b;
                    const data = doc.data();
                    const dueDate = (_b = (_a = data.dueDate) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a);
                    if (dueDate && dueDate >= start && dueDate <= end) {
                        events.push({
                            id: doc.id,
                            type: data.type || 'reminder', // Preserve original type (termin, erinnerung, etc.)
                            title: data.title,
                            date: dueDate.toISOString(),
                            time: data.isAllDay ? null : (dueDate.toTimeString().slice(0, 5)),
                            status: data.status,
                            description: data.notes || null,
                            isAllDay: data.isAllDay || false,
                        });
                    }
                });
            }
            // Get vacations
            if (!type || type === 'all' || type === 'vacations') {
                const vacationsSnapshot = await db.collection('vacations')
                    .where('userId', '==', userId)
                    .get();
                vacationsSnapshot.docs.forEach(doc => {
                    var _a, _b, _c, _d;
                    const data = doc.data();
                    const vacStart = (_b = (_a = data.startDate) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a);
                    const vacEnd = (_d = (_c = data.endDate) === null || _c === void 0 ? void 0 : _c.toDate) === null || _d === void 0 ? void 0 : _d.call(_c);
                    if (vacStart && vacEnd && !(vacEnd < start || vacStart > end)) {
                        events.push({
                            id: doc.id,
                            type: 'vacation',
                            title: data.title,
                            startDate: vacStart.toISOString(),
                            endDate: vacEnd.toISOString(),
                        });
                    }
                });
            }
            events.sort((a, b) => {
                const dateA = new Date(a.date || a.startDate);
                const dateB = new Date(b.date || b.startDate);
                return dateA.getTime() - dateB.getTime();
            });
            return { events, count: events.length, period: { start: start.toISOString(), end: end.toISOString() } };
        }
        case 'getPersonCalendarEvents': {
            const { personName, startDate, endDate } = args;
            const person = await findPersonByName(db, userId, personName);
            if (!person) {
                return { error: `Person "${personName}" nicht gefunden` };
            }
            const invoicesSnapshot = await db.collection('people').doc(person.id).collection('invoices').get();
            const events = invoicesSnapshot.docs
                .map(doc => {
                var _a, _b, _c, _d;
                const data = doc.data();
                const eventDate = ((_b = (_a = data.dueDate) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a)) || ((_d = (_c = data.date) === null || _c === void 0 ? void 0 : _c.toDate) === null || _d === void 0 ? void 0 : _d.call(_c));
                return {
                    id: doc.id,
                    type: 'invoice',
                    title: data.description || 'Rechnung',
                    date: (eventDate === null || eventDate === void 0 ? void 0 : eventDate.toISOString()) || null,
                    amount: data.amount || 0,
                    status: data.status || 'offen',
                };
            })
                .filter(event => {
                if (!event.date)
                    return false;
                const eventDate = new Date(event.date);
                if (startDate && eventDate < new Date(startDate))
                    return false;
                if (endDate && eventDate > new Date(endDate))
                    return false;
                return true;
            });
            return { personName: person.name, events, count: events.length };
        }
        // ========== URLAUB & FERIEN ==========
        case 'getVacations': {
            const { year, personId } = args;
            let query = db.collection('vacations')
                .where('userId', '==', userId);
            if (personId)
                query = query.where('personId', '==', personId);
            const snapshot = await query.get();
            let vacations = snapshot.docs.map(doc => {
                var _a, _b, _c, _d, _e, _f;
                const data = doc.data();
                return {
                    id: doc.id,
                    title: data.title || '',
                    startDate: ((_c = (_b = (_a = data.startDate) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a)) === null || _c === void 0 ? void 0 : _c.toISOString()) || null,
                    endDate: ((_f = (_e = (_d = data.endDate) === null || _d === void 0 ? void 0 : _d.toDate) === null || _e === void 0 ? void 0 : _e.call(_d)) === null || _f === void 0 ? void 0 : _f.toISOString()) || null,
                    type: data.type || 'vacation',
                    personId: data.personId || null,
                    notes: data.notes || '',
                };
            });
            if (year) {
                vacations = vacations.filter(v => {
                    if (!v.startDate)
                        return false;
                    return new Date(v.startDate).getFullYear() === year;
                });
            }
            return { vacations, count: vacations.length };
        }
        case 'createVacation': {
            const { title, startDate, endDate, personId, type, notes } = args;
            const vacationRef = await db.collection('vacations').add({
                userId,
                title,
                startDate: admin.firestore.Timestamp.fromDate(new Date(startDate)),
                endDate: admin.firestore.Timestamp.fromDate(new Date(endDate)),
                type: type || 'vacation',
                personId: personId || null,
                notes: notes || '',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return {
                success: true,
                vacationId: vacationRef.id,
                message: `Urlaub "${title}" vom ${startDate} bis ${endDate} wurde erstellt.`,
            };
        }
        // ========== ARBEIT ==========
        case 'getWorkSchedules': {
            const { startDate, endDate } = args;
            const snapshot = await db.collection('workSchedules')
                .where('userId', '==', userId)
                .get();
            let schedules = snapshot.docs.map(doc => {
                var _a, _b, _c;
                const data = doc.data();
                return {
                    id: doc.id,
                    date: ((_c = (_b = (_a = data.date) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a)) === null || _c === void 0 ? void 0 : _c.toISOString()) || null,
                    startTime: data.startTime || null,
                    endTime: data.endTime || null,
                    location: data.location || '',
                    notes: data.notes || '',
                };
            });
            if (startDate)
                schedules = schedules.filter(s => s.date && new Date(s.date) >= new Date(startDate));
            if (endDate)
                schedules = schedules.filter(s => s.date && new Date(s.date) <= new Date(endDate));
            return { schedules, count: schedules.length };
        }
        // ========== SCHULE ==========
        case 'getSchoolSchedules': {
            const { childId } = args;
            let query = db.collection('schoolSchedules')
                .where('userId', '==', userId);
            if (childId)
                query = query.where('childId', '==', childId);
            const snapshot = await query.get();
            const schedules = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    childId: data.childId || null,
                    dayOfWeek: data.dayOfWeek || '',
                    subject: data.subject || '',
                    startTime: data.startTime || null,
                    endTime: data.endTime || null,
                    teacher: data.teacher || '',
                    room: data.room || '',
                };
            });
            return { schedules, count: schedules.length };
        }
        case 'getSchoolHolidays': {
            const { year } = args;
            const targetYear = year || swissTime.getFullYear();
            const snapshot = await db.collection('schoolHolidays')
                .where('userId', '==', userId)
                .get();
            let holidays = snapshot.docs.map(doc => {
                var _a, _b, _c, _d, _e, _f;
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.name || '',
                    startDate: ((_c = (_b = (_a = data.startDate) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a)) === null || _c === void 0 ? void 0 : _c.toISOString()) || null,
                    endDate: ((_f = (_e = (_d = data.endDate) === null || _d === void 0 ? void 0 : _d.toDate) === null || _e === void 0 ? void 0 : _e.call(_d)) === null || _f === void 0 ? void 0 : _f.toISOString()) || null,
                };
            });
            holidays = holidays.filter(h => {
                if (!h.startDate)
                    return false;
                return new Date(h.startDate).getFullYear() === targetYear;
            });
            return { holidays, count: holidays.length, year: targetYear };
        }
        // ========== DOKUMENTE ==========
        case 'getAllDocuments': {
            const { personId, type } = args;
            let query = db.collection('documents')
                .where('userId', '==', userId);
            if (personId)
                query = query.where('personId', '==', personId);
            if (type)
                query = query.where('type', '==', type);
            const snapshot = await query.get();
            const documents = snapshot.docs.map(doc => {
                var _a, _b, _c;
                const data = doc.data();
                return {
                    id: doc.id,
                    name: data.name || '',
                    type: data.type || '',
                    personId: data.personId || null,
                    uploadDate: ((_c = (_b = (_a = data.uploadDate) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a)) === null || _c === void 0 ? void 0 : _c.toISOString()) || null,
                    size: data.size || 0,
                };
            });
            return { documents, count: documents.length };
        }
        // ========== STATISTIKEN ==========
        case 'getCompleteUserSummary': {
            const { includeDetails } = args;
            // Get counts
            const peopleSnapshot = await db.collection('people').where('userId', '==', userId).get();
            const remindersSnapshot = await db.collection('reminders').where('userId', '==', userId).get();
            const financeSnapshot = await db.collection('financeEntries').where('userId', '==', userId).get();
            const budgetsSnapshot = await db.collection('budgets').where('userId', '==', userId).get();
            const shoppingSnapshot = await db.collection('shoppingItems').where('userId', '==', userId).where('bought', '==', false).get();
            // Calculate totals
            const pendingReminders = remindersSnapshot.docs.filter(doc => doc.data().status === 'pending').length;
            const income = financeSnapshot.docs.filter(doc => doc.data().type === 'income').reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
            const expenses = financeSnapshot.docs.filter(doc => doc.data().type === 'expense').reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
            // Get total debts
            let totalDebts = 0;
            for (const personDoc of peopleSnapshot.docs) {
                const invoicesSnapshot = await personDoc.ref.collection('invoices').where('status', 'in', getOpenStatusVariants()).get();
                totalDebts += invoicesSnapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
            }
            const summary = {
                currentDate: swissTime.toISOString().split('T')[0],
                counts: {
                    people: peopleSnapshot.size,
                    reminders: remindersSnapshot.size,
                    pendingReminders,
                    financeEntries: financeSnapshot.size,
                    budgets: budgetsSnapshot.size,
                    shoppingItems: shoppingSnapshot.size,
                },
                finances: {
                    totalIncome: income,
                    totalExpenses: expenses,
                    balance: income - expenses,
                    totalDebts,
                    currency: 'CHF',
                },
            };
            if (includeDetails) {
                summary.people = peopleSnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
                summary.upcomingReminders = remindersSnapshot.docs
                    .filter(doc => doc.data().status === 'pending')
                    .slice(0, 5)
                    .map(doc => { var _a, _b, _c; return ({ id: doc.id, title: doc.data().title, dueDate: (_c = (_b = (_a = doc.data().dueDate) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a)) === null || _c === void 0 ? void 0 : _c.toISOString() }); });
            }
            return summary;
        }
        // ========== WETTER (Phase 1) ==========
        case 'getWeather': {
            const { date, location } = args;
            console.log('[getWeather] Called with args:', { date, location });
            if (!date) {
                return { error: 'date ist erforderlich' };
            }
            try {
                // Parse date
                let weatherDate = new Date();
                if (date === 'heute' || date === 'today') {
                    weatherDate = new Date();
                }
                else if (date === 'morgen' || date === 'tomorrow') {
                    weatherDate = new Date();
                    weatherDate.setDate(weatherDate.getDate() + 1);
                }
                else if (date === 'übermorgen' || date === 'day after tomorrow') {
                    weatherDate = new Date();
                    weatherDate.setDate(weatherDate.getDate() + 2);
                }
                else {
                    try {
                        // Try parsing as ISO date string (YYYY-MM-DD) or full date string
                        weatherDate = new Date(date);
                        if (isNaN(weatherDate.getTime())) {
                            // Try parsing German date format (e.g., "17. Dezember 2025")
                            const dateMatch = date.match(/(\d{1,2})\.?\s*(?:Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\s*(\d{4})/i);
                            if (dateMatch) {
                                const day = parseInt(dateMatch[1]);
                                const year = parseInt(dateMatch[2]);
                                const monthNames = ['januar', 'februar', 'märz', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'dezember'];
                                const month = monthNames.findIndex(m => date.toLowerCase().includes(m));
                                if (month >= 0) {
                                    weatherDate = new Date(year, month, day);
                                }
                                else {
                                    return { error: `Ungültiges Datum: ${date}` };
                                }
                            }
                            else {
                                return { error: `Ungültiges Datum: ${date}` };
                            }
                        }
                    }
                    catch (e) {
                        console.error('[getWeather] Date parsing error:', e);
                        return { error: `Ungültiges Datum: ${date}` };
                    }
                }
                // Normalize date to start of day
                weatherDate.setHours(0, 0, 0, 0);
                console.log('[getWeather] Parsed date:', {
                    input: date,
                    parsed: weatherDate.toISOString(),
                    dateStr: weatherDate.toISOString().split('T')[0],
                });
                // Check if date is within 5 days (forecast limit)
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const daysDiff = Math.ceil((weatherDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                if (daysDiff > 5) {
                    return {
                        error: `Wettervorhersage für dieses Datum nicht verfügbar`,
                        reason: 'forecast_limit',
                        message: `Die Wettervorhersage ist nur für die nächsten 5 Tage verfügbar. Das angefragte Datum liegt ${daysDiff} Tage in der Zukunft. Bitte prüfe das Wetter kurz vor dem Termin.`
                    };
                }
                // Use the helper function
                console.log('[getWeather] Calling getWeatherForAI with:', {
                    date: weatherDate.toISOString(),
                    location: location || 'default',
                });
                const weatherData = await getWeatherForAI(userId, weatherDate, location);
                console.log('[getWeather] Received weather data:', weatherData ? {
                    temperature: weatherData.temperature,
                    condition: weatherData.condition,
                    date: weatherData.date,
                    forecastTime: weatherData.forecastTime,
                } : 'null');
                if (!weatherData) {
                    return {
                        error: 'Keine Wetterdaten verfügbar für dieses Datum',
                        reason: 'api_error',
                        message: 'Die Wetterdaten konnten nicht abgerufen werden. Bitte versuche es später erneut oder prüfe das Wetter kurz vor dem Termin.'
                    };
                }
                return weatherData;
            }
            catch (error) {
                console.error('[getWeather] Error:', error);
                return { error: `Fehler beim Abrufen der Wetterdaten: ${error.message || 'Unbekannter Fehler'}` };
            }
        }
        default:
            throw new Error(`Unknown function: ${functionName}`);
    }
}
// Helper function to get weather data for AI (Phase 1) - copied from index.ts
async function getWeatherForAI(userId, date, location) {
    var _a, _b, _c, _d;
    const db = admin.firestore();
    try {
        // Get user location from settings if not provided
        if (!location) {
            const settingsDoc = await db.collection('userSettings').doc(userId).get();
            location = settingsDoc.exists ? (((_a = settingsDoc.data()) === null || _a === void 0 ? void 0 : _a.weatherLocation) || 'Zurich, CH') : 'Zurich, CH';
        }
        const dateStr = date.toISOString().split('T')[0];
        const validatedLocation = (location || 'Zurich, CH').trim();
        // Determine if this is a future date (forecast) or today (current)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const requestDate = new Date(date);
        requestDate.setHours(0, 0, 0, 0);
        const isFuture = requestDate > today;
        const isToday = requestDate.getTime() === today.getTime();
        console.log('[getWeatherForAI] Request:', {
            date: dateStr,
            location: validatedLocation,
            isToday,
            isFuture,
            daysDiff: isFuture ? Math.ceil((requestDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0,
        });
        // For future dates, cache is less reliable - only use if very recent (within 1 hour)
        // For today, cache is more reliable (can use older cache)
        const maxCacheAgeForFuture = 1 * 60 * 60 * 1000; // 1 hour for future dates
        const maxCacheAgeForToday = 6 * 60 * 60 * 1000; // 6 hours for today
        // Check cache first
        const weatherQuery = db.collection('weatherData')
            .where('userId', '==', userId)
            .where('date', '==', dateStr)
            .where('location', '==', validatedLocation);
        const snapshot = await weatherQuery.limit(1).get();
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            const data = doc.data();
            const cachedDate = ((_c = (_b = data.fetchedAt) === null || _b === void 0 ? void 0 : _b.toDate) === null || _c === void 0 ? void 0 : _c.call(_b)) || data.fetchedAt;
            const cacheAge = cachedDate ? Date.now() - cachedDate.getTime() : Infinity;
            const maxCacheAge = isFuture ? maxCacheAgeForFuture : maxCacheAgeForToday;
            if (cacheAge < maxCacheAge) {
                console.log('[getWeatherForAI] Using cached data:', {
                    date: dateStr,
                    temperature: data.temperature,
                    condition: data.condition,
                    cacheAgeHours: Math.floor(cacheAge / (1000 * 60 * 60)),
                    cachedAt: cachedDate === null || cachedDate === void 0 ? void 0 : cachedDate.toISOString(),
                    isFuture,
                });
                return {
                    temperature: data.temperature,
                    condition: data.condition,
                    icon: data.icon,
                    humidity: data.humidity || null,
                    windSpeed: data.windSpeed || null,
                    location: validatedLocation,
                    date: dateStr,
                    fromCache: true,
                };
            }
            else {
                console.log('[getWeatherForAI] Cache too old, fetching fresh data:', {
                    cacheAgeHours: Math.floor(cacheAge / (1000 * 60 * 60)),
                    maxCacheAgeHours: Math.floor(maxCacheAge / (1000 * 60 * 60)),
                });
            }
        }
        else {
            console.log('[getWeatherForAI] No cache found, fetching from API');
        }
        // Fetch from API if not cached
        const apiKey = (_d = openWeatherMapApiKey.value()) === null || _d === void 0 ? void 0 : _d.trim();
        if (!apiKey) {
            console.error('[getWeatherForAI] No API key available');
            return null;
        }
        console.log('[getWeatherForAI] Fetching from API:', {
            location: validatedLocation,
            date: date.toISOString(),
            dateStr: dateStr,
        });
        const apiWeather = await fetchWeatherFromAPI(validatedLocation, date, apiKey);
        console.log('[getWeatherForAI] API response:', apiWeather ? {
            temperature: apiWeather.temperature,
            condition: apiWeather.condition,
            forecastTime: apiWeather.forecastTime,
        } : 'null');
        if (!apiWeather) {
            console.error('[getWeatherForAI] No weather data from API');
            return null;
        }
        // Cache the result
        const weatherData = {
            userId,
            date: dateStr,
            location: validatedLocation,
            temperature: apiWeather.temperature,
            condition: apiWeather.condition,
            icon: apiWeather.icon,
            humidity: apiWeather.humidity || null,
            windSpeed: apiWeather.windSpeed || null,
            cached: false,
            fetchedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await db.collection('weatherData').add(weatherData);
        return {
            temperature: apiWeather.temperature,
            condition: apiWeather.condition,
            icon: apiWeather.icon,
            humidity: apiWeather.humidity || null,
            windSpeed: apiWeather.windSpeed || null,
            location: validatedLocation,
            date: dateStr,
            forecastTime: apiWeather.forecastTime || null,
            fromCache: false,
        };
    }
    catch (error) {
        console.error('[getWeatherForAI] Error:', error);
        return null;
    }
}
// Helper function to map OpenWeatherMap icon codes to our icon names
function mapWeatherIcon(iconCode) {
    const iconMap = {
        '01d': 'sun', '01n': 'sun',
        '02d': 'cloud-sun', '02n': 'cloud-sun',
        '03d': 'cloud', '03n': 'cloud',
        '04d': 'cloud', '04n': 'cloud',
        '09d': 'rain', '09n': 'rain',
        '10d': 'rain', '10n': 'rain',
        '11d': 'rain', '11n': 'rain',
        '13d': 'rain', '13n': 'rain', // snow -> rain (no snow icon available)
        '50d': 'cloud', '50n': 'cloud',
    };
    return iconMap[iconCode] || 'cloud';
}
// Helper function to map OpenWeatherMap weather condition to German
function mapWeatherCondition(condition) {
    const conditionMap = {
        'clear sky': 'Klar',
        'few clouds': 'Wenig bewölkt',
        'scattered clouds': 'Bewölkt',
        'broken clouds': 'Stark bewölkt',
        'shower rain': 'Regenschauer',
        'rain': 'Regen',
        'thunderstorm': 'Gewitter',
        'snow': 'Schnee',
        'mist': 'Nebel',
        'fog': 'Nebel',
        'haze': 'Dunst',
    };
    return conditionMap[condition.toLowerCase()] || condition;
}
// Helper function to fetch weather from OpenWeatherMap API
async function fetchWeatherFromAPI(location, date, apiKey) {
    var _a, _b, _c, _d;
    if (!apiKey) {
        return null;
    }
    try {
        const axios = require('axios');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const requestDate = new Date(date);
        requestDate.setHours(0, 0, 0, 0);
        const isFuture = requestDate > today;
        const isPast = requestDate < today;
        const isToday = requestDate.getTime() === today.getTime();
        if (isToday) {
            // Use current weather API for today
            const url = `https://api.openweathermap.org/data/2.5/weather`;
            const params = {
                q: location,
                appid: apiKey,
                units: 'metric',
                lang: 'de',
            };
            console.log('[fetchWeatherFromAPI] Request (current):', { url, location, date: date.toISOString().split('T')[0] });
            const response = await axios.get(url, { params, timeout: 10000 });
            const data = response.data;
            if (!data || !data.main || !data.weather || data.weather.length === 0) {
                console.error('[fetchWeatherFromAPI] Invalid API response:', data);
                return null;
            }
            return {
                temperature: Math.round(data.main.temp),
                condition: mapWeatherCondition(data.weather[0].description),
                icon: mapWeatherIcon(data.weather[0].icon),
                humidity: data.main.humidity || null,
                windSpeed: ((_a = data.wind) === null || _a === void 0 ? void 0 : _a.speed) ? Math.round(data.wind.speed * 3.6) : null, // Convert m/s to km/h
            };
        }
        else if (isFuture) {
            // Use forecast API for future dates (up to 5 days)
            const daysDiff = Math.ceil((requestDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDiff > 5) {
                // Forecast API only provides 5 days, return null for dates beyond that
                console.log('[fetchWeatherFromAPI] Date is more than 5 days in the future, forecast not available');
                return null;
            }
            const url = `https://api.openweathermap.org/data/2.5/forecast`;
            const params = {
                q: location,
                appid: apiKey,
                units: 'metric',
                lang: 'de',
            };
            console.log('[fetchWeatherFromAPI] Request (forecast):', { url, location, date: date.toISOString().split('T')[0], daysDiff });
            const response = await axios.get(url, { params, timeout: 10000 });
            const data = response.data;
            if (!data || !data.list || !Array.isArray(data.list) || data.list.length === 0) {
                console.error('[fetchWeatherFromAPI] Invalid forecast API response:', data);
                return null;
            }
            // Find the forecast entry for the requested date
            // Forecast entries are in 3-hour intervals, we want the one closest to 12:00 (noon) for that day
            const targetDateStr = requestDate.toISOString().split('T')[0];
            let bestForecast = null;
            let bestScore = Infinity;
            console.log('[fetchWeatherFromAPI] Looking for forecast for date:', targetDateStr);
            console.log('[fetchWeatherFromAPI] Available forecasts:', data.list.length, 'entries');
            for (const forecast of data.list) {
                const forecastTime = new Date(forecast.dt * 1000);
                const forecastDateStr = forecastTime.toISOString().split('T')[0];
                // Only consider forecasts for the target date
                if (forecastDateStr === targetDateStr) {
                    // Calculate score: prefer forecasts closer to 12:00 (noon)
                    // Lower score = better (closer to noon)
                    const hours = forecastTime.getHours();
                    const minutes = forecastTime.getMinutes();
                    const timeOfDay = hours + minutes / 60;
                    const distanceFromNoon = Math.abs(timeOfDay - 12);
                    if (distanceFromNoon < bestScore) {
                        bestForecast = forecast;
                        bestScore = distanceFromNoon;
                    }
                    console.log('[fetchWeatherFromAPI] Found forecast for target date:', {
                        time: forecastTime.toISOString(),
                        temp: (_b = forecast.main) === null || _b === void 0 ? void 0 : _b.temp,
                        distanceFromNoon: distanceFromNoon.toFixed(2),
                    });
                }
            }
            // If no forecast found for exact date, use the closest one
            if (!bestForecast) {
                console.log('[fetchWeatherFromAPI] No forecast found for exact date, using closest');
                const targetTime = requestDate.getTime();
                let closestForecast = data.list[0];
                let minTimeDiff = Math.abs(new Date(closestForecast.dt * 1000).getTime() - targetTime);
                for (const forecast of data.list) {
                    const forecastTime = new Date(forecast.dt * 1000).getTime();
                    const timeDiff = Math.abs(forecastTime - targetTime);
                    if (timeDiff < minTimeDiff) {
                        closestForecast = forecast;
                        minTimeDiff = timeDiff;
                    }
                }
                bestForecast = closestForecast;
            }
            if (!bestForecast || !bestForecast.main || !bestForecast.weather || bestForecast.weather.length === 0) {
                console.error('[fetchWeatherFromAPI] No suitable forecast found');
                return null;
            }
            const selectedTime = new Date(bestForecast.dt * 1000);
            console.log('[fetchWeatherFromAPI] Selected forecast:', {
                time: selectedTime.toISOString(),
                temperature: bestForecast.main.temp,
                condition: bestForecast.weather[0].description,
                humidity: bestForecast.main.humidity,
                windSpeed: (_c = bestForecast.wind) === null || _c === void 0 ? void 0 : _c.speed,
            });
            return {
                temperature: Math.round(bestForecast.main.temp),
                condition: mapWeatherCondition(bestForecast.weather[0].description),
                icon: mapWeatherIcon(bestForecast.weather[0].icon),
                humidity: bestForecast.main.humidity || null,
                windSpeed: ((_d = bestForecast.wind) === null || _d === void 0 ? void 0 : _d.speed) ? Math.round(bestForecast.wind.speed * 3.6) : null, // Convert m/s to km/h
                forecastTime: selectedTime.toISOString(), // Include for debugging
            };
        }
        else if (isPast) {
            // Historical data requires paid plan or we can return cached data only
            console.log('[fetchWeatherFromAPI] Historical data requested, returning null');
            return null;
        }
        return null;
    }
    catch (error) {
        console.error('[fetchWeatherFromAPI] Error:', error);
        if (error.response) {
            console.error('[fetchWeatherFromAPI] API Error:', {
                status: error.response.status,
                data: error.response.data
            });
        }
        return null;
    }
}
// Use OpenAI Assistants API
async function invokeLLM(params, apiKey, ctx) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    if (!apiKey || apiKey.trim() === '') {
        throw new Error('OPENAI_API_KEY is not configured. Please set it in Firebase Functions environment variables or secrets.');
    }
    console.log(`[AI Chat] Using API key: ${apiKey.substring(0, 10)}... (length: ${apiKey.length})`);
    console.log(`[AI Chat] Using Assistant ID: ${getOpenAIAssistantId()}`);
    // Use openId (Firebase Auth UID) for consistency with other functions
    const firebaseUserId = ((_a = ctx.user) === null || _a === void 0 ? void 0 : _a.openId) || '';
    console.log(`[AI Chat] User context: ${firebaseUserId ? `Authenticated as ${firebaseUserId}` : 'NOT AUTHENTICATED'}`);
    // Extract all non-system messages to preserve conversation history
    const conversationMessages = params.messages.filter(msg => msg.role !== 'system');
    const userMessages = conversationMessages.filter(msg => msg.role === 'user');
    if (userMessages.length === 0) {
        throw new Error('No user messages found');
    }
    console.log(`[AI Chat] Sending ${conversationMessages.length} messages to preserve context`);
    // Create a thread and send ALL messages to OpenAI Assistant
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
        throw new Error(`Failed to create thread: ${threadResponse.status} ${threadResponse.statusText} – ${errorText}`);
    }
    const thread = await threadResponse.json();
    const threadId = thread.id;
    try {
        // Step 2: Add ALL conversation messages to thread to preserve context
        // This ensures the AI understands the full conversation history
        for (const msg of conversationMessages) {
            const messageResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'OpenAI-Beta': 'assistants=v2',
                },
                body: JSON.stringify({
                    role: msg.role === 'assistant' ? 'assistant' : 'user',
                    content: msg.content,
                }),
            });
            if (!messageResponse.ok) {
                const errorText = await messageResponse.text();
                console.warn(`[AI Chat] Failed to add message (${msg.role}): ${errorText}`);
                // Continue with other messages even if one fails
            }
        }
        console.log(`[AI Chat] Added ${conversationMessages.length} messages to thread ${threadId}`);
        // Step 3: Run the assistant with tools (functions)
        // IMPORTANT: Tools MUST be passed here for function calling to work
        // Even if tools are configured in the assistant, passing them here ensures they're available
        const tools = getOpenAITools(firebaseUserId);
        const assistantId = getOpenAIAssistantId();
        console.log(`[AI Chat] Running assistant: ${assistantId}`);
        console.log(`[AI Chat] User ID (Firebase Auth): ${firebaseUserId || 'NOT AUTHENTICATED'}`);
        console.log(`[AI Chat] Tools available: ${tools.length}`);
        if (tools.length > 0) {
            console.log(`[AI Chat] Tool names: ${tools.map((t) => { var _a; return (_a = t.function) === null || _a === void 0 ? void 0 : _a.name; }).join(', ')}`);
        }
        // Get current date for context
        const now = new Date();
        const swissNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Zurich' }));
        const currentDate = swissNow.toISOString().split('T')[0];
        // Language mapping for response instructions
        const userLanguage = params.language || 'de';
        const languageInstructions = {
            'de': 'Antworte IMMER auf Deutsch.',
            'en': 'ALWAYS respond in English.',
            'es': 'Responde SIEMPRE en español.',
            'nl': 'Antwoord ALTIJD in het Nederlands.',
            'it': 'Rispondi SEMPRE in italiano.',
            'fr': 'Réponds TOUJOURS en français.',
        };
        const responseLanguageInstruction = languageInstructions[userLanguage] || languageInstructions['de'];
        const runBody = {
            assistant_id: assistantId,
            // Additional instructions to make the AI smarter for this specific request
            additional_instructions: `
KRITISCHE ANWEISUNGEN - UNBEDINGT BEFOLGEN:

SPRACHE: ${responseLanguageInstruction}

AKTUELLES DATUM: ${currentDate} (Schweizer Zeit, Europe/Zurich)
BENUTZER-ID: ${firebaseUserId || 'unbekannt'}

═══════════════════════════════════════════════════════════════
KALENDER-EVENTS & TERMINE - VOLLSTÄNDIGER ZUGRIFF!
═══════════════════════════════════════════════════════════════

WICHTIG: Du hast VOLLSTÄNDIGEN ZUGRIFF auf ALLE Termine und Events des angemeldeten Benutzers!

Verwende die getCalendarEvents Function, um:
- ALLE Termine (type: 'termin') des Benutzers abzurufen
- ALLE Erinnerungen (type: 'reminder') des Benutzers abzurufen
- ALLE Fälligkeiten (type: 'due') von Rechnungen abzurufen
- ALLE Ferien (type: 'vacation') des Benutzers abzurufen
- ALLE Arbeitspläne (type: 'work') abzurufen
- ALLE Schulpläne (type: 'school') abzurufen

Die Events werden AUTOMATISCH synchronisiert und sind IMMER aktuell!
Wenn ein Benutzer einen Termin erstellt, ist er SOFORT über getCalendarEvents verfügbar.

BEISPIEL-NUTZUNG:
- "Welche Termine habe ich diese Woche?" → getCalendarEvents(startDate="2025-12-15", endDate="2025-12-21", type="all")
- "Zeige mir alle Termine im Dezember" → getCalendarEvents(startDate="2025-12-01", endDate="2025-12-31", type="reminders")
- "Habe ich heute etwas?" → getCalendarEvents(startDate="${currentDate.split('T')[0]}", endDate="${currentDate.split('T')[0]}", type="all")

═══════════════════════════════════════════════════════════════
WETTER-INTEGRATION (Phase 1-4) - WICHTIG!
═══════════════════════════════════════════════════════════════

Wenn ein Benutzer einen Termin, eine Erinnerung oder eine Aktivität erwähnt, die draußen/im Freien stattfindet, rufe IMMER die getWeather Function auf!

ERKENNE OUTDOOR-AKTIVITÄTEN an folgenden Begriffen:
- "spazieren gehen", "Spaziergang", "laufen", "joggen", "wandern"
- "im Park", "draussen", "outdoor", "im Freien", "aussen"
- "Fahrrad fahren", "radfahren", "biken"
- "Picknick", "Grillen", "Camping"
- "Sport", "Training" (wenn im Freien)
- Jede Aktivität, die offensichtlich draußen stattfindet

GIB HILFREICHE WARNUNGEN basierend auf Wetterdaten:
- Temperaturen unter 5°C: "⚠️ Es wird sehr kalt sein. Zieh dich warm an - Jacke, Schal und Handschuhe sind empfohlen!"
- Temperaturen 5-10°C: "🌡️ Es wird kühl sein. Eine warme Jacke wäre sinnvoll."
- Regen/Niederschlag: "☔ Es wird regnen! Nimm unbedingt einen Regenschirm oder Regenjacke mit."
- Wind über 20 km/h: "💨 Es wird windig sein. Pass auf und halte dich warm."
- Wind über 40 km/h: "🌪️ Starker Wind erwartet! Vorsicht bei Outdoor-Aktivitäten."
- Hohe Luftfeuchtigkeit (>80%): "💧 Die Luftfeuchtigkeit ist hoch. Es könnte sich feucht anfühlen."

WICHTIG - WENN KEINE WETTERDATEN VERFÜGBAR SIND:
- Wenn die getWeather Function einen Fehler mit "forecast_limit" zurückgibt, bedeutet das, dass das Datum mehr als 5 Tage in der Zukunft liegt.
- In diesem Fall: Erstelle den Termin trotzdem, aber gib eine freundliche Nachricht wie: "Ich habe den Termin erstellt. Da die Wettervorhersage nur für die nächsten 5 Tage verfügbar ist, empfehle ich dir, das Wetter kurz vor dem Termin zu prüfen, um dich passend vorzubereiten."
- Wenn die getWeather Function einen anderen Fehler zurückgibt, erstelle den Termin trotzdem und erwähne, dass die Wetterdaten aktuell nicht verfügbar sind.

Verwende die tatsächlichen Werte aus den Wetterdaten (temperature, windSpeed, humidity) in deinen Antworten, WENN sie verfügbar sind!

═══════════════════════════════════════════════════════════════
STIL UND FORMAT - PROFESSIONELL MIT APP-ICONS!
═══════════════════════════════════════════════════════════════

WICHTIG für deinen Antwortstil:
- Verwende KEINE Standard-Emojis (🚀 😊 ✅ 🎉 💡 ❌ 📊 📈 💰 etc.)
- Antworte freundlich, professionell und sachlich
- Nutze Aufzählungen, Nummerierungen und klare Struktur

NAVIGATIONS-LINKS: Verwende die Syntax [nav:route|Label] für anklickbare App-Bereiche!
Der User kann auf diese Links klicken und wird direkt zur entsprechenden Seite navigiert.

Verfügbare Links:
- [nav:dashboard|Dashboard] → Zur Startseite/Übersicht
- [nav:calendar|Kalender] → Zum Kalender
- [nav:reminders|Erinnerungen] → Zu den Erinnerungen
- [nav:finance|Finanzen] → Zur Finanzverwaltung
- [nav:people|Personen] → Zur Personenverwaltung
- [nav:bills|Rechnungen] → Zur Rechnungsverwaltung
- [nav:documents|Dokumente] → Zu den Dokumenten
- [nav:shopping|Einkaufsliste] → Zur Einkaufsliste
- [nav:settings|Einstellungen] → Zu den Einstellungen

Beispiel-Antwort:
"Gehe zu [nav:finance|Finanzen] in der Sidebar. Dort kannst du neue Einträge erstellen."

WICHTIG: Verwende IMMER die [nav:route|Label] Syntax wenn du App-Bereiche erwähnst! Der User kann dann direkt darauf klicken!

═══════════════════════════════════════════════════════════════
SCHULDEN ERFASSEN - VERWENDE IMMER createPersonWithDebt!
═══════════════════════════════════════════════════════════════

Wenn der Benutzer sagt:
- "X schuldet mir Y CHF" → createPersonWithDebt(name="X", amount=Y, direction="incoming")
- "Erfasse X mit Y CHF Schulden" → createPersonWithDebt(name="X", amount=Y, direction="incoming")  
- "Ich schulde X Y CHF" → createPersonWithDebt(name="X", amount=Y, direction="outgoing")

WICHTIG: NICHT createPerson verwenden wenn Schulden erwähnt werden!
IMMER createPersonWithDebt verwenden - diese Funktion erstellt Person UND Rechnung!

═══════════════════════════════════════════════════════════════
EXTERNE vs HAUSHALT - STANDARD IST EXTERNAL!
═══════════════════════════════════════════════════════════════

EXTERNAL (Standard für alle die Geld schulden):
- "Herr X", "Frau X" → IMMER external
- Nachnamen ohne "mein/meine" → external
- Geschäftspartner, Handwerker, Bekannte → external
- Personen die Geld schulden → IMMER external

HOUSEHOLD (nur wenn explizit Familienmitglied):
- "mein Mann/meine Frau" → household
- "mein Sohn/meine Tochter" → household
- Explizit als Familie bezeichnet → household

═══════════════════════════════════════════════════════════════
RATENPLÄNE - VOLLSTÄNDIGE ANLEITUNG
═══════════════════════════════════════════════════════════════

1️⃣ RATEN ABFRAGEN (WICHTIG - IMMER ZUERST!):
Wenn der Benutzer fragt "Welche Raten hat X?" oder "Wie viel schuldet X noch?":
→ Rufe getPersonInstallments(personName="X") auf
→ Diese Funktion zeigt ALLE Raten mit Status, Fälligkeitsdaten und Beträgen

2️⃣ RATENPLAN ERSTELLEN:
Wenn: "X möchte monatlich à Y CHF abzahlen"
→ Rufe createInstallmentPlan(personName="X", installmentAmount=Y) auf

3️⃣ ZAHLUNG ERFASSEN:
Wenn: "X hat die Rate bezahlt" oder "X hat heute 50 CHF gezahlt"
→ Rufe recordInstallmentPayment(personName="X", amount=50) auf
→ Die nächste offene Rate wird automatisch als bezahlt markiert

WICHTIG: Bei JEDER Frage zu Schulden oder Raten ZUERST getPersonInstallments aufrufen!
Dies zeigt die aktuellen, korrekten Daten aus der Datenbank.

═══════════════════════════════════════════════════════════════
TERMINE & ERINNERUNGEN - INTELLIGENTE ERSTELLUNG!
═══════════════════════════════════════════════════════════════

1. STANDARD-ERINNERUNG (createReminder):
   - Für Termine mit spezifischem Datum/Zeit
   - Rufe ZUERST getCurrentDateTime auf
   - Das dueDate MUSS nach ${currentDate} liegen!
   - Beispiel: "Erinnerung für morgen um 14:00"

2. KURZFRISTIGE ERINNERUNG (createQuickReminder):
   - Für sofortige/kurzfristige Erinnerungen
   - Beispiel: "Erinnere mich in 5 Minuten an den Kochherd"
   - Beispiel: "Erinnere mich in 15 Minuten an die Wäsche"
   - Verwende IMMER createQuickReminder wenn der Benutzer sagt:
     * "Erinnere mich in X Minuten an..."
     * "In X Minuten erinnern"
     * "Erinnerung in X Minuten"
   - minutesFromNow: Anzahl Minuten (1-1440)
   - title: Woran erinnert werden soll

3. FOLLOW-UP-ERINNERUNG (createFollowUpReminder):
   - Wenn der Benutzer nach einer Erinnerung gefragt wird, ob er nochmal erinnert werden soll
   - Wird automatisch verwendet, wenn der Benutzer "Ja" auf die Follow-up-Frage antwortet
   - Die Erinnerungsnachricht enthält die reminderId im Text oder Kontext
   - originalReminderId: ID der ursprünglichen Erinnerung (aus dem Kontext der Erinnerungsnachricht)
   - minutesFromNow: Standard 15 Minuten, kann angepasst werden
   - Wenn der Benutzer "Ja", "ja", "Ja bitte", "Gerne", "Ok" oder ähnlich antwortet:
     → Rufe createFollowUpReminder mit der reminderId aus der letzten Erinnerungsnachricht auf
   - Wenn der Benutzer "Nein", "nein", "Nein danke" oder ähnlich antwortet:
     → Antworte einfach freundlich, dass keine weitere Erinnerung erstellt wird

WICHTIG: 
- Verwende createQuickReminder für natürliche Sprache wie "Erinnere mich in X Minuten"!
- Wenn eine Erinnerungsnachricht eine Follow-up-Frage enthält und der Benutzer "Ja" sagt, rufe createFollowUpReminder auf!

═══════════════════════════════════════════════════════════════
`,
        };
        // ALWAYS add tools if user is authenticated - this is critical for function calling
        if (firebaseUserId && tools.length > 0) {
            runBody.tools = tools;
            console.log(`[AI Chat] Adding ${tools.length} tools to run`);
        }
        else {
            console.warn(`[AI Chat] WARNING: No tools added! User authenticated: ${!!firebaseUserId}, Tools count: ${tools.length}`);
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
            let errorData = {};
            try {
                errorData = JSON.parse(errorText);
            }
            catch (_k) {
                // Not JSON, use as is
            }
            console.error(`[AI Chat] Run failed: ${runResponse.status} ${runResponse.statusText}`);
            console.error(`[AI Chat] Error details:`, JSON.stringify(errorData, null, 2));
            // Check if assistant not found
            if (runResponse.status === 404 && (((_c = (_b = errorData.error) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.includes('No assistant found')) || ((_e = (_d = errorData.error) === null || _d === void 0 ? void 0 : _d.message) === null || _e === void 0 ? void 0 : _e.includes('not found')))) {
                console.error(`[AI Chat] ❌ Assistant not found: ${assistantId}`);
                console.error(`[AI Chat] This usually means:`);
                console.error(`[AI Chat] 1. The Assistant ID doesn't exist`);
                console.error(`[AI Chat] 2. The API Key belongs to a different OpenAI account`);
                console.error(`[AI Chat] 3. The Assistant was deleted`);
                console.error(`[AI Chat] Falling back to rule-based response.`);
                // Try to verify assistant exists by fetching it
                try {
                    const verifyResponse = await fetch(`https://api.openai.com/v1/assistants/${assistantId}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${apiKey}`,
                            'OpenAI-Beta': 'assistants=v2',
                        },
                    });
                    if (verifyResponse.ok) {
                        const assistantData = await verifyResponse.json();
                        console.log(`[AI Chat] ✅ Assistant exists! Name: ${assistantData.name}, Model: ${assistantData.model}`);
                        console.log(`[AI Chat] ⚠️ But run failed - this might be a permissions issue`);
                    }
                    else {
                        const verifyError = await verifyResponse.text();
                        console.error(`[AI Chat] ❌ Assistant verification failed: ${verifyError}`);
                    }
                }
                catch (verifyError) {
                    console.error(`[AI Chat] Failed to verify assistant:`, verifyError);
                }
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
            throw new Error(`Failed to run assistant: ${runResponse.status} ${runResponse.statusText} – ${errorText}`);
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
                throw new Error(`Failed to check run status: ${statusResponse.status} ${statusResponse.statusText} – ${errorText}`);
            }
            const runStatusData = await statusResponse.json();
            runStatus = runStatusData.status;
            // Handle function calls (requires_action)
            if (runStatus === 'requires_action' && ((_f = runStatusData.required_action) === null || _f === void 0 ? void 0 : _f.type) === 'submit_tool_outputs') {
                const toolCalls = runStatusData.required_action.submit_tool_outputs.tool_calls || [];
                console.log(`[AI Chat] ✅ Function calls detected! Processing ${toolCalls.length} tool calls`);
                const toolOutputs = await Promise.all(toolCalls.map(async (toolCall) => {
                    const functionName = toolCall.function.name;
                    let functionArgs = {};
                    try {
                        functionArgs = JSON.parse(toolCall.function.arguments || '{}');
                    }
                    catch (parseError) {
                        console.error('Failed to parse function arguments:', toolCall.function.arguments);
                        return {
                            tool_call_id: toolCall.id,
                            output: JSON.stringify({ error: 'Invalid function arguments' }),
                        };
                    }
                    try {
                        console.log(`Executing function: ${functionName} with args:`, functionArgs);
                        const result = await executeFunction(functionName, functionArgs, firebaseUserId);
                        console.log(`Function ${functionName} completed successfully`);
                        return {
                            tool_call_id: toolCall.id,
                            output: JSON.stringify(result),
                        };
                    }
                    catch (error) {
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
            throw new Error(`Failed to get messages: ${messagesResponse.status} ${messagesResponse.statusText} – ${errorText}`);
        }
        const messagesData = await messagesResponse.json();
        console.log(`[AI Chat] Retrieved ${messagesData.data.length} messages from thread`);
        // Find the assistant's response (latest message with role 'assistant' and text content)
        // Messages are ordered by creation time, so we need to find the latest one
        const assistantMessages = messagesData.data
            .filter((msg) => msg.role === 'assistant')
            .sort((a, b) => b.created_at - a.created_at); // Sort by creation time, newest first
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
        console.log('[AI Chat] Assistant message structure:', JSON.stringify({
            role: assistantMessage.role,
            contentType: Array.isArray(assistantMessage.content) ? 'array' : typeof assistantMessage.content,
            contentLength: Array.isArray(assistantMessage.content) ? assistantMessage.content.length : 1,
        }));
        if (Array.isArray(assistantMessage.content)) {
            // Find text content items
            const textContent = assistantMessage.content.find((item) => item.type === 'text');
            if (textContent) {
                content = ((_g = textContent.text) === null || _g === void 0 ? void 0 : _g.value) || textContent.text || '';
                console.log('[AI Chat] Extracted text content from array:', content.substring(0, 100) + '...');
            }
            else {
                console.warn('[AI Chat] No text content found in array, items:', assistantMessage.content.map((item) => item.type));
            }
        }
        else if (((_h = assistantMessage.content) === null || _h === void 0 ? void 0 : _h.type) === 'text') {
            content = ((_j = assistantMessage.content.text) === null || _j === void 0 ? void 0 : _j.value) || assistantMessage.content.text || '';
            console.log('[AI Chat] Extracted text content from single:', content.substring(0, 100) + '...');
        }
        else if (typeof assistantMessage.content === 'string') {
            content = assistantMessage.content;
            console.log('[AI Chat] Content is direct string:', content.substring(0, 100) + '...');
        }
        if (!content || content.trim().length === 0) {
            console.warn('[AI Chat] No text content found in assistant message, full structure:', JSON.stringify(assistantMessage, null, 2));
            content = 'Entschuldigung, ich konnte keine Antwort generieren. Bitte versuchen Sie es erneut.';
        }
        console.log('[AI Chat] Final content length:', content.length);
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
    }
    finally {
        // Clean up: delete the thread (optional, but good practice)
        try {
            await fetch(`https://api.openai.com/v1/threads/${threadId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'OpenAI-Beta': 'assistants=v2',
                },
            });
        }
        catch (error) {
            // Ignore cleanup errors
        }
    }
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

So kannst du grössere Ausgaben über mehrere Monate verteilen.`,
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
            language: zod_1.z.string().optional().default('de'),
        }))
            .mutation(async ({ ctx, input }) => {
            var _a, _b, _c;
            try {
                // Get OpenAI API key from secret or environment variable
                let apiKey = '';
                try {
                    apiKey = openaiApiKeySecret.value();
                }
                catch (error) {
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
                        language: input.language || 'de',
                    }, apiKey, ctx);
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
                catch (openaiError) {
                    // If OpenAI API fails (e.g., assistant not found), fallback to rule-based
                    if (((_b = openaiError.message) === null || _b === void 0 ? void 0 : _b.includes('No assistant found')) ||
                        ((_c = openaiError.message) === null || _c === void 0 ? void 0 : _c.includes('404'))) {
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
            }
            catch (error) {
                console.error('AI chat error:', error);
                const errorMessage = error instanceof Error ? error.message : 'AI request failed';
                throw new server_1.TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: errorMessage,
                    cause: error,
                });
            }
        }),
    }),
});
// Export tRPC HTTP function
exports.trpc = (0, https_1.onRequest)({
    cors: true,
    maxInstances: 10,
    secrets: [openaiApiKeySecret, openWeatherMapApiKey], // Include secrets for OpenAI and OpenWeatherMap
    // Note: enforceAppCheck is only available for onCall, not onRequest
    // App Check verification is handled manually in createContext function
}, async (req, res) => {
    var _a;
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
        // Extract Firebase request ID from headers if available
        const requestId = ((_a = req.get('x-cloud-trace-context')) === null || _a === void 0 ? void 0 : _a.split('/')[0]) ||
            req.get('x-goog-request-id') ||
            'unknown';
        // Log error with Request ID for debugging
        console.error('[tRPC] Unhandled error:', {
            requestId,
            method: req.method,
            url: req.url,
            error: error instanceof Error ? {
                message: error.message,
                stack: error.stack,
                name: error.name,
            } : error,
        });
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
            requestId, // Include Request ID in response for debugging
        });
    }
});
//# sourceMappingURL=trpc.js.map