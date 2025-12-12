import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { initTRPC, TRPCError } from '@trpc/server';

import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';

import { z } from 'zod';

import * as admin from 'firebase-admin';

// ========== MEHRSPRACHIGE STATUS-KONSTANTEN (DE/EN/FR/IT) ==========
export const STATUS_OPEN = ['open', 'offen', 'ouvert', 'aperto'];
export const STATUS_PAID = ['paid', 'bezahlt', 'payé', 'pagato'];
export const STATUS_POSTPONED = ['postponed', 'verschoben', 'reporté', 'rinviato'];
export const STATUS_COMPLETED = ['completed', 'erledigt', 'terminé', 'completato'];

function isStatusOpen(s: string | undefined): boolean { return !!s && STATUS_OPEN.includes(s.toLowerCase()); }
export function isStatusPaid(s: string | undefined): boolean { return !!s && STATUS_PAID.includes(s.toLowerCase()); }
function getOpenStatusVariants(): string[] { return STATUS_OPEN; }

// ========== SCHWEIZER WÄHRUNGS-HILFSFUNKTIONEN ==========

/**
 * Rundet auf 5 Rappen (Schweizer Rundung)
 * z.B. 1.02 -> 1.00, 1.03 -> 1.05, 1.07 -> 1.05, 1.08 -> 1.10
 */
function roundToSwiss5Rappen(amount: number): number {
  return Math.round(amount * 20) / 20;
}

/**
 * Konvertiert CHF zu Rappen (Cents) für die Speicherung
 * Die App speichert Beträge in Rappen (1 CHF = 100 Rappen)
 */
function chfToRappen(chfAmount: number): number {
  const rounded = roundToSwiss5Rappen(chfAmount);
  return Math.round(rounded * 100);
}

/**
 * Konvertiert Rappen zu CHF für die Anzeige
 */
function rappenToChf(rappenAmount: number): number {
  return roundToSwiss5Rappen(rappenAmount / 100);
}

// Export für zukünftige Verwendung (verhindert TypeScript unused warning)
export const currencyUtils = { roundToSwiss5Rappen, chfToRappen, rappenToChf };

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
// Default: asst_eXeVnct9xxf67H4rpyK2jjrb (Nexo Finance Assistant - Intelligent & Context-Aware)
function getOpenAIAssistantId(): string {
  // Try environment variable first
  if (process.env.OPENAI_ASSISTANT_ID) {
    return process.env.OPENAI_ASSISTANT_ID;
  }
  // Fallback to default
  return 'asst_eXeVnct9xxf67H4rpyK2jjrb';
}

// Define OpenAI Functions/Tools for database access - ALLE FUNKTIONEN
function getOpenAITools(userId: string): any[] {
  if (!userId) return [];
  
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
  ];
}

// Helper function to find person by name
async function findPersonByName(db: admin.firestore.Firestore, userId: string, personName: string): Promise<{ 
  id: string; 
  name: string; 
  type?: string;
  relationship?: string;
  email?: string; 
  phone?: string; 
  notes?: string 
} | null> {
  const snapshot = await db.collection('people')
    .where('userId', '==', userId)
    .get();
  
  const personDoc = snapshot.docs.find(doc => {
    const data = doc.data();
    return data.name?.toLowerCase() === personName.toLowerCase() ||
           data.name?.toLowerCase().includes(personName.toLowerCase());
  });
  
  if (!personDoc) return null;
  
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
async function executeFunction(functionName: string, args: any, userId: string): Promise<any> {
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
        const invoiceData: any = {
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
      let personId: string;
      let personCreated = false;
      
      if (person) {
        personId = person.id;
        console.log(`[createPersonWithDebt] Person already exists with ID: ${personId}`);
      } else {
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
      const invoiceData: any = {
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

      // Hole ALLE Rechnungen (nicht nur offene) um vollständiges Bild zu zeigen
      const invoicesSnapshot = await db.collection('people').doc(person.id).collection('invoices').get();

      const invoices = invoicesSnapshot.docs.map(doc => {
        const data = doc.data();
        const amountInChf = rappenToChf(data.amount || 0);
        
        // Prüfe ob Ratenplan existiert - sowohl Flag als auch Array prüfen
        const installments = data.installments || [];
        const hasInstallmentPlan = data.isInstallmentPlan === true || 
          (Array.isArray(installments) && installments.length > 0) ||
          (typeof data.installmentCount === 'number' && data.installmentCount > 0);
        
        // Berechne offene und bezahlte Raten
        const openInstallments = installments.filter((i: any) => i.status === 'pending' || i.status === 'open');
        const paidInstallments = installments.filter((i: any) => i.status === 'paid' || i.status === 'completed');
        
        // Berechne Restschuld basierend auf offenen Raten
        let remainingDebt = amountInChf;
        if (hasInstallmentPlan && installments.length > 0) {
          // Intelligente Betragskonvertierung für Raten
          const expectedPerRateChf = amountInChf / installments.length;
          const expectedPerRateRappen = (data.amount || 0) / installments.length;
          
          // Prüfe zuerst die Summe aller Raten um das Format zu bestimmen
          const totalAmount = installments.reduce((s: number, i: any) => s + (i.amount || 0), 0);
          const isChfFormat = Math.abs(totalAmount - amountInChf) < amountInChf * 0.1;
          const isRappenFormat = Math.abs(totalAmount - (data.amount || 0)) < (data.amount || 1) * 0.1;
          
          const toChfSafe = (amount: number): number => {
            if (!amount) return 0;
            
            // Wenn wir das Format schon kennen
            if (isChfFormat) return amount;
            if (isRappenFormat) return rappenToChf(amount);
            
            // Wenn Betrag sehr groß ist (korrupte Daten), verwende erwarteten Wert
            if (amount > amountInChf) return expectedPerRateChf;
            
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
          remainingDebt = openInstallments.reduce((sum: number, inst: any) => sum + toChfSafe(inst.amount || 0), 0);
        }
        
        return {
          id: doc.id,
          description: data.description || '',
          totalAmountChf: amountInChf,
          remainingDebtChf: roundToSwiss5Rappen(remainingDebt),
          status: data.status || 'open',
          dueDate: data.dueDate?.toDate?.()?.toISOString() || null,
          hasInstallmentPlan,
          installmentCount: installments.length,
          paidInstallments: paidInstallments.length,
          openInstallments: openInstallments.length,
          nextDueDate: openInstallments.length > 0 
            ? openInstallments.sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]?.dueDate 
            : null,
          installments: hasInstallmentPlan ? (() => {
            const expectedPerRateChf = amountInChf / installments.length;
            const expectedPerRateRappen = (data.amount || 0) / installments.length;
            const totalAmount = installments.reduce((s: number, i: any) => s + (i.amount || 0), 0);
            const isChfFormat = Math.abs(totalAmount - amountInChf) < amountInChf * 0.1;
            const isRappenFormat = Math.abs(totalAmount - (data.amount || 0)) < (data.amount || 1) * 0.1;
            
            const toChfSafe = (amount: number): number => {
              if (!amount) return 0;
              if (isChfFormat) return amount;
              if (isRappenFormat) return rappenToChf(amount);
              if (amount > amountInChf) return expectedPerRateChf;
              if (amount >= expectedPerRateChf * 0.5 && amount <= expectedPerRateChf * 2) return amount;
              if (amount >= expectedPerRateRappen * 0.5 && amount <= expectedPerRateRappen * 2) return rappenToChf(amount);
              return amount;
            };
            
            return installments.map((inst: any, idx: number) => ({
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

      return {
        personName: person.name,
        totalDebtChf: roundToSwiss5Rappen(totalDebtChf),
        currency: 'CHF',
        invoiceCount: invoices.length,
        openInvoiceCount: openInvoices.length,
        totalOpenInstallments,
        invoices,
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
      const toChf = (amount: any, totalAmountRappen: number): number => {
        if (!amount) return 0;
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
      const getDueDateString = (dueDate: any): string | null => {
        if (!dueDate) return null;
        if (typeof dueDate === 'string') return dueDate;
        if (typeof dueDate.toDate === 'function') {
          return dueDate.toDate().toISOString().split('T')[0];
        }
        if (dueDate instanceof Date) {
          return dueDate.toISOString().split('T')[0];
        }
        return String(dueDate);
      };
      
      // Helper: Konvertiere Date für Sortierung
      const getDueDateForSort = (dueDate: any): number => {
        if (!dueDate) return 0;
        if (typeof dueDate === 'string') return new Date(dueDate).getTime();
        if (typeof dueDate.toDate === 'function') return dueDate.toDate().getTime();
        if (dueDate instanceof Date) return dueDate.getTime();
        return 0;
      };
      
      // Verwende die gefilterten Rechnungen
      const plans = invoicesWithInstallments.map(doc => {
        const data = doc.data();
        const totalAmountRappen = data.amount || 0;
        const totalAmountChf = rappenToChf(totalAmountRappen);
        const installments = data.installments || [];
        
        const openInstallments = installments.filter((i: any) => i.status === 'pending' || i.status === 'open');
        const paidInstallments = installments.filter((i: any) => i.status === 'paid' || i.status === 'completed');
        
        // Konvertiere Beträge mit Heuristik
        const paidAmountChf = paidInstallments.reduce((sum: number, inst: any) => sum + toChf(inst.amount, totalAmountRappen), 0);
        const remainingAmountChf = openInstallments.reduce((sum: number, inst: any) => sum + toChf(inst.amount, totalAmountRappen), 0);
        
        // Sortiere Raten nach Fälligkeit
        const sortedInstallments = [...installments].sort((a: any, b: any) => 
          getDueDateForSort(a.dueDate) - getDueDateForSort(b.dueDate)
        );
        
        const nextDueInstallment = sortedInstallments.find((i: any) => i.status === 'pending' || i.status === 'open');
        
        return {
          invoiceId: doc.id,
          description: data.description || 'Ratenplan',
          totalAmountChf,
          paidAmountChf: roundToSwiss5Rappen(paidAmountChf),
          remainingAmountChf: roundToSwiss5Rappen(remainingAmountChf),
          totalInstallments: installments.length,
          paidInstallments: paidInstallments.length,
          openInstallments: openInstallments.length,
          nextDueDate: getDueDateString(nextDueInstallment?.dueDate),
          nextDueAmountChf: nextDueInstallment ? toChf(nextDueInstallment.amount, totalAmountRappen) : null,
          installments: sortedInstallments.map((inst: any, idx: number) => ({
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
      
      let query: admin.firestore.Query = db.collection('reminders')
        .where('userId', '==', userId);

      if (personId) query = query.where('personId', '==', personId);
      if (status) query = query.where('status', '==', status);

      const snapshot = await query.get();
      
      let reminders = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || '',
          type: data.type || 'reminder',
          dueDate: data.dueDate?.toDate?.()?.toISOString() || null,
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
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });

      return { reminders, count: reminders.length };
    }

    case 'createReminder': {
      const { title, dueDate, type, personId, personName, amount, currency, notes, recurring, recurringFrequency } = args;
      
      // Parse and validate date
      const parsedDate = new Date(dueDate);
      if (isNaN(parsedDate.getTime())) {
        return { error: `Ungültiges Datum: ${dueDate}. Format: YYYY-MM-DD oder YYYY-MM-DDTHH:mm:ss` };
      }

      // WICHTIG: Prüfe, ob das Datum in der Zukunft liegt
      if (parsedDate < swissTime) {
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
        if (person) finalPersonId = person.id;
      }

      const reminderData: any = {
        userId,
        title,
        dueDate: admin.firestore.Timestamp.fromDate(parsedDate),
        type: type || 'reminder',
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (finalPersonId) reminderData.personId = finalPersonId;
      if (amount) reminderData.amount = amount;
      if (currency) reminderData.currency = currency;
      if (notes) reminderData.notes = notes;
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

    case 'updateReminder': {
      const { reminderId, title, dueDate, status, notes } = args;
      
      const updateData: any = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (title) updateData.title = title;
      if (status) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes;
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

      let query: admin.firestore.Query = db.collection('reminders')
        .where('userId', '==', userId)
        .where('personId', '==', person.id);

      const snapshot = await query.get();
      
      let reminders = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || '',
          type: data.type || 'reminder',
          dueDate: data.dueDate?.toDate?.()?.toISOString() || null,
          status: data.status || 'pending',
          amount: data.amount || null,
          notes: data.notes || '',
        };
      });

      if (startDate) reminders = reminders.filter(r => r.dueDate && new Date(r.dueDate) >= new Date(startDate));
      if (endDate) reminders = reminders.filter(r => r.dueDate && new Date(r.dueDate) <= new Date(endDate));

      return { personName: person.name, reminders, count: reminders.length };
    }

    // ========== RECHNUNGEN ==========
    case 'getAllInvoices': {
      const { personId, personName, status, startDate, endDate } = args;
      
      let targetPersonId = personId;
      if (!targetPersonId && personName) {
        const person = await findPersonByName(db, userId, personName);
        if (person) targetPersonId = person.id;
      }

      // Get all people to fetch their invoices
      const peopleSnapshot = await db.collection('people')
        .where('userId', '==', userId)
        .get();

      const allInvoices: any[] = [];
      
      for (const personDoc of peopleSnapshot.docs) {
        if (targetPersonId && personDoc.id !== targetPersonId) continue;
        
        let invoiceQuery: admin.firestore.Query = personDoc.ref.collection('invoices');
        // Status-Filter mit mehrsprachiger Unterstützung
        if (status) {
          // Prüfe ob der Status einer bekannten Kategorie entspricht und erweitere auf alle Varianten
          if (STATUS_OPEN.includes(status.toLowerCase())) {
            invoiceQuery = invoiceQuery.where('status', 'in', getOpenStatusVariants());
          } else if (STATUS_PAID.includes(status.toLowerCase())) {
            invoiceQuery = invoiceQuery.where('status', 'in', STATUS_PAID);
          } else {
            invoiceQuery = invoiceQuery.where('status', '==', status);
          }
        }
        
        const invoicesSnapshot = await invoiceQuery.get();
        
        for (const invDoc of invoicesSnapshot.docs) {
          const data = invDoc.data();
          // Konvertiere Beträge von Rappen zu CHF für die AI-Anzeige
          const amountInChf = rappenToChf(data.amount || 0);
          const invoice = {
            id: invDoc.id,
            personId: personDoc.id,
            personName: personDoc.data().name,
            description: data.description || '',
            amount: amountInChf,
            currency: data.currency || 'CHF',
            status: data.status || 'offen',
            dueDate: data.dueDate?.toDate?.()?.toISOString() || null,
            date: data.date?.toDate?.()?.toISOString() || null,
          };
          
          // Date filter
          if (startDate && invoice.dueDate && new Date(invoice.dueDate) < new Date(startDate)) continue;
          if (endDate && invoice.dueDate && new Date(invoice.dueDate) > new Date(endDate)) continue;
          
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
        } else {
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

      const invoiceData: any = {
        description,
        amount,
        currency: currency || 'CHF',
        status: status || 'offen',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (dueDate) invoiceData.dueDate = admin.firestore.Timestamp.fromDate(new Date(dueDate));
      if (notes) invoiceData.notes = notes;

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
      let targetInvoice: any = null;
      let targetInvoiceId = invoiceId;
      
      if (invoiceId) {
        const invoiceDoc = await db.collection('people').doc(person.id).collection('invoices').doc(invoiceId).get();
        if (invoiceDoc.exists) {
          targetInvoice = { id: invoiceDoc.id, ...invoiceDoc.data() };
        }
      } else {
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
        
        targetInvoice = { id: invoicesSnapshot.docs[0].id, ...invoicesSnapshot.docs[0].data() };
        targetInvoiceId = invoicesSnapshot.docs[0].id;
      }
      
      if (!targetInvoice) {
        return { error: 'Rechnung nicht gefunden' };
      }
      
      // Betrag ist in Rappen gespeichert, konvertiere zu CHF für Berechnungen
      const totalAmountInChf = rappenToChf(targetInvoice.amount);
      
      // 3. Berechne Ratenplan
      let numInstallments: number;
      let amountPerInstallment: number;
      
      if (installmentAmount) {
        // installmentAmount ist in CHF (vom Benutzer angegeben)
        numInstallments = Math.ceil(totalAmountInChf / installmentAmount);
        amountPerInstallment = roundToSwiss5Rappen(installmentAmount);
      } else if (numberOfInstallments) {
        numInstallments = numberOfInstallments;
        amountPerInstallment = roundToSwiss5Rappen(totalAmountInChf / numberOfInstallments);
      } else {
        return { error: 'Bitte gib entweder installmentAmount oder numberOfInstallments an' };
      }
      
      // 4. Berechne Fälligkeitsdaten
      const freq = frequency || 'monthly';
      const start = startDate ? new Date(startDate) : new Date(swissTime.getFullYear(), swissTime.getMonth() + 1, 1);
      
      const installments: any[] = [];
      for (let i = 0; i < numInstallments; i++) {
        const dueDate = new Date(start);
        if (freq === 'weekly') {
          dueDate.setDate(dueDate.getDate() + (i * 7));
        } else if (freq === 'biweekly') {
          dueDate.setDate(dueDate.getDate() + (i * 14));
        } else {
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
      await db.collection('people').doc(person.id).collection('invoices').doc(targetInvoiceId!).update({
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
      
      const updatedInstallments = installments.map((inst: any) => {
        if (!foundOpenInstallment && (inst.status === 'pending' || inst.status === 'open')) {
          foundOpenInstallment = true;
          paidInstallmentNumber = inst.number;
          return { 
            ...inst, 
            status: 'paid', 
            paidDate: payDateStr,
            paidAmount: paymentAmountInRappen,
            notes: paymentNotes || null,
          };
        }
        return inst;
      });
      
      if (!foundOpenInstallment) {
        return { error: `Alle Raten für "${personName}" sind bereits bezahlt` };
      }
      
      // 4. Berechne Status
      const paidInstallments = updatedInstallments.filter((i: any) => i.status === 'paid' || i.status === 'completed');
      const openInstallments = updatedInstallments.filter((i: any) => i.status === 'pending' || i.status === 'open');
      const paidAmountInRappen = paidInstallments.reduce((sum: number, i: any) => sum + (i.amount || 0), 0);
      const remainingAmountInRappen = openInstallments.reduce((sum: number, i: any) => sum + (i.amount || 0), 0);
      
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
            ? openInstallments.sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]?.dueDate 
            : null,
        },
      };
    }

    // ========== FINANZEN ==========
    case 'getFinanceSummary': {
      const { startDate, endDate, month } = args;
      let start: Date;
      let end: Date;

      if (month) {
        const [year, monthNum] = month.split('-').map(Number);
        start = new Date(year, monthNum - 1, 1);
        end = new Date(year, monthNum, 0, 23, 59, 59);
      } else {
        start = startDate ? new Date(startDate) : new Date(swissTime.getFullYear(), swissTime.getMonth(), 1);
        end = endDate ? new Date(endDate) : new Date(swissTime.getFullYear(), swissTime.getMonth() + 1, 0, 23, 59, 59);
      }

      const snapshot = await db.collection('financeEntries')
        .where('userId', '==', userId)
        .get();

      const entries = snapshot.docs
        .map(doc => {
          const data = doc.data();
          const entryDate = data.date?.toDate?.() || new Date();
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
        .reduce((acc: any, e) => {
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
          .sort((a: any, b: any) => b.amount - a.amount),
        entryCount: entries.length,
        currency: 'CHF',
      };
    }

    case 'getAllFinanceEntries': {
      const { type, category, startDate, endDate } = args;
      
      let query: admin.firestore.Query = db.collection('financeEntries')
        .where('userId', '==', userId);

      if (type) query = query.where('type', '==', type);
      if (category) query = query.where('category', '==', category);

      const snapshot = await query.get();
      
      let entries = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type || 'expense',
          category: data.category || 'Sonstiges',
          amount: data.amount || 0,
          description: data.description || '',
          date: data.date?.toDate?.()?.toISOString() || null,
          currency: data.currency || 'CHF',
        };
      });

      if (startDate) entries = entries.filter(e => e.date && new Date(e.date) >= new Date(startDate));
      if (endDate) entries = entries.filter(e => e.date && new Date(e.date) <= new Date(endDate));

      entries.sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      return { entries, count: entries.length };
    }

    case 'createFinanceEntry': {
      const { type, amount, category, description, date, currency, recurring, recurringFrequency } = args;
      
      const entryDate = date ? new Date(date) : swissTime;

      const entryData: any = {
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
      
      let query: admin.firestore.Query = db.collection('shoppingItems')
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
      
      const updateData: any = {
        bought: true,
        boughtAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      if (price) updateData.price = price;

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
      
      const events: any[] = [];

      // Get reminders
      if (!type || type === 'all' || type === 'reminders') {
        const remindersSnapshot = await db.collection('reminders')
          .where('userId', '==', userId)
          .get();
        
        remindersSnapshot.docs.forEach(doc => {
          const data = doc.data();
          const dueDate = data.dueDate?.toDate?.();
          if (dueDate && dueDate >= start && dueDate <= end) {
            events.push({
              id: doc.id,
              type: 'reminder',
              title: data.title,
              date: dueDate.toISOString(),
              status: data.status,
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
          const data = doc.data();
          const vacStart = data.startDate?.toDate?.();
          const vacEnd = data.endDate?.toDate?.();
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
          const data = doc.data();
          const eventDate = data.dueDate?.toDate?.() || data.date?.toDate?.();
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
          if (!event.date) return false;
          const eventDate = new Date(event.date);
          if (startDate && eventDate < new Date(startDate)) return false;
          if (endDate && eventDate > new Date(endDate)) return false;
          return true;
        });

      return { personName: person.name, events, count: events.length };
    }

    // ========== URLAUB & FERIEN ==========
    case 'getVacations': {
      const { year, personId } = args;
      
      let query: admin.firestore.Query = db.collection('vacations')
        .where('userId', '==', userId);

      if (personId) query = query.where('personId', '==', personId);

      const snapshot = await query.get();
      
      let vacations = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || '',
          startDate: data.startDate?.toDate?.()?.toISOString() || null,
          endDate: data.endDate?.toDate?.()?.toISOString() || null,
          type: data.type || 'vacation',
          personId: data.personId || null,
          notes: data.notes || '',
        };
      });

      if (year) {
        vacations = vacations.filter(v => {
          if (!v.startDate) return false;
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
        const data = doc.data();
        return {
          id: doc.id,
          date: data.date?.toDate?.()?.toISOString() || null,
          startTime: data.startTime || null,
          endTime: data.endTime || null,
          location: data.location || '',
          notes: data.notes || '',
        };
      });

      if (startDate) schedules = schedules.filter(s => s.date && new Date(s.date) >= new Date(startDate));
      if (endDate) schedules = schedules.filter(s => s.date && new Date(s.date) <= new Date(endDate));

      return { schedules, count: schedules.length };
    }

    // ========== SCHULE ==========
    case 'getSchoolSchedules': {
      const { childId } = args;
      
      let query: admin.firestore.Query = db.collection('schoolSchedules')
        .where('userId', '==', userId);

      if (childId) query = query.where('childId', '==', childId);

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
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          startDate: data.startDate?.toDate?.()?.toISOString() || null,
          endDate: data.endDate?.toDate?.()?.toISOString() || null,
        };
      });

      holidays = holidays.filter(h => {
        if (!h.startDate) return false;
        return new Date(h.startDate).getFullYear() === targetYear;
      });

      return { holidays, count: holidays.length, year: targetYear };
    }

    // ========== DOKUMENTE ==========
    case 'getAllDocuments': {
      const { personId, type } = args;
      
      let query: admin.firestore.Query = db.collection('documents')
        .where('userId', '==', userId);

      if (personId) query = query.where('personId', '==', personId);
      if (type) query = query.where('type', '==', type);

      const snapshot = await query.get();
      
      const documents = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          type: data.type || '',
          personId: data.personId || null,
          uploadDate: data.uploadDate?.toDate?.()?.toISOString() || null,
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

      const summary: any = {
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
          .map(doc => ({ id: doc.id, title: doc.data().title, dueDate: doc.data().dueDate?.toDate?.()?.toISOString() }));
      }

      return summary;
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
  // Use openId (Firebase Auth UID) for consistency with other functions
  const firebaseUserId = ctx.user?.openId || '';
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
    throw new Error(
      `Failed to create thread: ${threadResponse.status} ${threadResponse.statusText} – ${errorText}`
    );
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
    
    console.log(`[AI Chat] Added ${conversationMessages.length} messages to thread ${threadId}`)

    // Step 3: Run the assistant with tools (functions)
    // IMPORTANT: Tools MUST be passed here for function calling to work
    // Even if tools are configured in the assistant, passing them here ensures they're available
    const tools = getOpenAITools(firebaseUserId);
    const assistantId = getOpenAIAssistantId();
    
    console.log(`[AI Chat] Running assistant: ${assistantId}`);
    console.log(`[AI Chat] User ID (Firebase Auth): ${firebaseUserId || 'NOT AUTHENTICATED'}`);
    console.log(`[AI Chat] Tools available: ${tools.length}`);
    if (tools.length > 0) {
      console.log(`[AI Chat] Tool names: ${tools.map((t: any) => t.function?.name).join(', ')}`);
    }
    
    // Get current date for context
    const now = new Date();
    const swissNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Zurich' }));
    const currentDate = swissNow.toISOString().split('T')[0];
    
    const runBody: any = {
      assistant_id: assistantId,
      // Additional instructions to make the AI smarter for this specific request
      additional_instructions: `
KRITISCHE ANWEISUNGEN - UNBEDINGT BEFOLGEN:

AKTUELLES DATUM: ${currentDate} (Schweizer Zeit, Europe/Zurich)
BENUTZER-ID: ${firebaseUserId || 'unbekannt'}

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
TERMINE - DATUM PRÜFEN!
═══════════════════════════════════════════════════════════════

1. Rufe ZUERST getCurrentDateTime auf
2. Das Datum für createReminder MUSS nach ${currentDate} liegen!
3. Vergangenheitsdaten werden abgelehnt

═══════════════════════════════════════════════════════════════
`,
    };
    
    // ALWAYS add tools if user is authenticated - this is critical for function calling
    if (firebaseUserId && tools.length > 0) {
      runBody.tools = tools;
      console.log(`[AI Chat] Adding ${tools.length} tools to run`);
    } else {
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
      let errorData: any = {};
      try {
        errorData = JSON.parse(errorText);
      } catch {
        // Not JSON, use as is
      }
      
      console.error(`[AI Chat] Run failed: ${runResponse.status} ${runResponse.statusText}`);
      console.error(`[AI Chat] Error details:`, JSON.stringify(errorData, null, 2));
      
      // Check if assistant not found
      if (runResponse.status === 404 && (errorData.error?.message?.includes('No assistant found') || errorData.error?.message?.includes('not found'))) {
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
          } else {
            const verifyError = await verifyResponse.text();
            console.error(`[AI Chat] ❌ Assistant verification failed: ${verifyError}`);
          }
        } catch (verifyError) {
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
            const result = await executeFunction(functionName, functionArgs, firebaseUserId);
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

