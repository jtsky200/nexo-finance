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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.trpc = exports.transcribeAIChatAudio = exports.uploadAIChatImage = exports.uploadAIChatFile = exports.checkPhoneNumberExists = exports.send2FADeactivationEmail = exports.send2FAActivationEmail = exports.debugPasskeys = exports.adminDeleteAllPasskeys = exports.deletePasskey = exports.listPasskeys = exports.verifyPasskeyAuthentication = exports.generatePasskeyAuthenticationOptions = exports.verifyPasskeyRegistration = exports.generatePasskeyRegistrationOptions = exports.check2FAStatus = exports.loginWith2FAOnly = exports.analyzeProductImage = exports.searchProductInfo = exports.getWeatherHistory = exports.saveWeather = exports.getWeather = exports.clearAllChatConversations = exports.deleteChatConversation = exports.updateChatConversation = exports.createChatConversation = exports.getChatConversations = exports.migrateUserIds = exports.debugUserData = exports.clearChatHistory = exports.getChatThread = exports.getChatHistory = exports.chat = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const axios_1 = __importDefault(require("axios"));
const nodemailer = __importStar(require("nodemailer"));
const params_1 = require("firebase-functions/params");
admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();
const openaiApiKeySecret = (0, params_1.defineSecret)('OPENAI_API_KEY');
const openWeatherMapApiKey = (0, params_1.defineSecret)('OPENWEATHERMAP_API_KEY');
// SMTP secrets for email notifications
const smtpHost = (0, params_1.defineSecret)('SMTP_HOST');
const smtpPort = (0, params_1.defineSecret)('SMTP_PORT');
const smtpUser = (0, params_1.defineSecret)('SMTP_USER');
const smtpPass = (0, params_1.defineSecret)('SMTP_PASS');
// ========== Validation Helpers ==========
function validateString(value, fieldName, maxLength = 1000, required = false) {
    if (required && (!value || typeof value !== 'string' || value.trim().length === 0)) {
        throw new https_1.HttpsError('invalid-argument', `${fieldName} is required and must be a non-empty string`);
    }
    if (value && typeof value !== 'string') {
        throw new https_1.HttpsError('invalid-argument', `${fieldName} must be a string`);
    }
    if (value && value.length > maxLength) {
        throw new https_1.HttpsError('invalid-argument', `${fieldName} must not exceed ${maxLength} characters`);
    }
    return value ? value.trim() : value;
}
function validateNumber(value, fieldName, min = 0, max = Number.MAX_SAFE_INTEGER, required = false) {
    if (required && (value === undefined || value === null)) {
        throw new https_1.HttpsError('invalid-argument', `${fieldName} is required`);
    }
    if (value !== undefined && value !== null) {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(num) || !isFinite(num)) {
            throw new https_1.HttpsError('invalid-argument', `${fieldName} must be a valid number`);
        }
        if (num < min || num > max) {
            throw new https_1.HttpsError('invalid-argument', `${fieldName} must be between ${min} and ${max}`);
        }
        return num;
    }
    return value;
}
function validateEmail(value, fieldName = 'email') {
    if (!value)
        return null;
    if (typeof value !== 'string') {
        throw new https_1.HttpsError('invalid-argument', `${fieldName} must be a string`);
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) {
        throw new https_1.HttpsError('invalid-argument', `${fieldName} must be a valid email address`);
    }
    return value.trim();
}
/**
 * Validates and normalizes a date value for Firestore storage
 *
 * IMPORTANT: This function handles Date objects correctly.
 * When a Date object is created with local time components (e.g., new Date(2025, 11, 13, 9, 54)),
 * JavaScript automatically handles UTC conversion. Firestore Timestamp.fromDate() preserves this.
 *
 * @param value - Date object, ISO string, or null/undefined
 * @param fieldName - Field name for error messages
 * @param required - Whether the field is required
 * @returns Date object ready for Firestore Timestamp conversion
 */
function validateDate(value, fieldName, required = false) {
    if (required && !value) {
        throw new https_1.HttpsError('invalid-argument', `${fieldName} is required`);
    }
    if (value) {
        // If it's already a Date object, use it directly
        // JavaScript Date objects created with local time components are already correct
        if (value instanceof Date) {
            if (isNaN(value.getTime())) {
                throw new https_1.HttpsError('invalid-argument', `${fieldName} must be a valid date`);
            }
            return value;
        }
        // Otherwise, parse it
        const date = new Date(value);
        if (isNaN(date.getTime())) {
            throw new https_1.HttpsError('invalid-argument', `${fieldName} must be a valid date`);
        }
        return date;
    }
    return value;
}
// Chat function - AI Chat with OpenAI
// Helper function to get weather data for AI (Phase 1)
async function getWeatherForAI(userId, date, location) {
    var _a, _b;
    try {
        // Get user location from settings if not provided
        if (!location) {
            const settingsDoc = await db.collection('userSettings').doc(userId).get();
            location = settingsDoc.exists ? (((_a = settingsDoc.data()) === null || _a === void 0 ? void 0 : _a.weatherLocation) || 'Zurich, CH') : 'Zurich, CH';
        }
        const dateStr = date.toISOString().split('T')[0];
        const validatedLocation = validateString(location, 'location', 200, true);
        // Check cache first
        const weatherQuery = db.collection('weatherData')
            .where('userId', '==', userId)
            .where('date', '==', dateStr)
            .where('location', '==', validatedLocation);
        const snapshot = await weatherQuery.limit(1).get();
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            const data = doc.data();
            return {
                temperature: data.temperature,
                condition: data.condition,
                icon: data.icon,
                humidity: data.humidity || null,
                windSpeed: data.windSpeed || null,
                location: validatedLocation,
                date: dateStr,
            };
        }
        // Fetch from API if not cached
        const apiKey = (_b = openWeatherMapApiKey.value()) === null || _b === void 0 ? void 0 : _b.trim();
        if (!apiKey) {
            return null;
        }
        const apiWeather = await fetchWeatherFromAPI(validatedLocation, date, apiKey);
        if (!apiWeather) {
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
        };
    }
    catch (error) {
        console.error('[getWeatherForAI] Error:', error);
        return null;
    }
}
exports.chat = (0, https_1.onCall)({ secrets: [openaiApiKeySecret, openWeatherMapApiKey], enforceAppCheck: true }, async (request) => {
    var _a, _b, _c, _d;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { messages, threadId } = request.data || {};
    const userId = request.auth.uid;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        throw new https_1.HttpsError('invalid-argument', 'messages array is required');
    }
    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
        throw new https_1.HttpsError('invalid-argument', 'Last message must be from user');
    }
    try {
        // Get OpenAI API key from secret only (avoid process.env to prevent overlap error)
        const apiKey = openaiApiKeySecret.value();
        if (!apiKey) {
            // Fallback to rule-based response
            return {
                response: getRuleBasedResponse(lastMessage.content),
                threadId: threadId || `thread_${Date.now()}`,
            };
        }
        // Define available functions for AI (Phase 1: Weather)
        const functions = [
            {
                name: 'get_weather',
                description: 'Ruft Wetterdaten für ein bestimmtes Datum und einen Standort ab. Verwende dies, wenn der Benutzer nach Wetter fragt oder einen Termin/Erinnerung für draußen erstellt.',
                parameters: {
                    type: 'object',
                    properties: {
                        date: {
                            type: 'string',
                            description: 'Datum im ISO-Format (YYYY-MM-DD) oder relative Angaben wie "heute", "morgen", "übermorgen"',
                        },
                        location: {
                            type: 'string',
                            description: 'Standort (z.B. "Zurich, CH"). Optional, verwendet Standard-Standort aus Einstellungen wenn nicht angegeben.',
                        },
                    },
                    required: ['date'],
                },
            },
        ];
        // Prepare messages with system prompt
        const systemMessage = {
            role: 'system',
            content: `Du bist ein hilfreicher Assistent für die Nexo-Anwendung. Du hilfst Benutzern bei Fragen zu Finanzen, Rechnungen, Terminen und anderen Funktionen der App.

KRITISCH - Schweizer Grammatik:
- VERBOTEN: NIEMALS das Zeichen "ß" (Eszett) in deutschen Texten verwenden
- MANDATORY: IMMER "ss" statt "ß" verwenden (Schweizer Grammatik)
- Beispiele: "Strasse" (nicht "Straße"), "gross" (nicht "groß"), "schliessen" (nicht "schließen"), "draussen" (nicht "draußen"), "aussen" (nicht "außen"), "grösser" (nicht "größer"), "müssen" (bereits korrekt), "besser" (bereits korrekt)
- Diese Regel gilt für ALLE deutschen Texte, die du generierst: Antworten, Fehlermeldungen, Beschreibungen, etc.

WICHTIG - Wetter-Integration (Phase 1-2):
Wenn ein Benutzer einen Termin, eine Erinnerung oder Aktivität erwähnt, die draussen/im Freien stattfindet, rufe IMMER die get_weather Function auf, um das Wetter für diesen Tag zu prüfen.

Erkenne Outdoor-Aktivitäten an folgenden Begriffen:
- "spazieren gehen", "Spaziergang", "laufen", "joggen", "wandern"
- "im Park", "draussen", "outdoor", "im Freien", "aussen"
- "Fahrrad fahren", "radfahren", "biken"
- "Picknick", "Grillen", "Camping"
- "Sport", "Training" (wenn im Freien)
- Jede Aktivität, die offensichtlich draussen stattfindet

             WENN WETTERDATEN VERFÜGBAR SIND - Gib hilfreiche, freundliche Warnungen:
             - Temperaturen unter 5°C: "⚠️ Es wird sehr kalt sein. Zieh dich warm an - Jacke, Schal und Handschuhe sind empfohlen!"
             - Temperaturen 5-10°C: "🌡️ Es wird kühl sein. Eine warme Jacke wäre sinnvoll."
             - Regen/Niederschlag: "☔ Es wird regnen! Nimm unbedingt einen Regenschirm oder Regenjacke mit."
             - Wind über 20 km/h: "💨 Es wird windig sein. Pass auf und halte dich warm."
             - Wind über 40 km/h: "🌪️ Starker Wind erwartet! Vorsicht bei Outdoor-Aktivitäten."
             - Hohe Luftfeuchtigkeit (>80%): "💧 Die Luftfeuchtigkeit ist hoch. Es könnte sich feucht anfühlen."

             WENN KEINE WETTERDATEN VERFÜGBAR SIND:
             - Wenn die get_weather Function einen Fehler mit "forecast_limit" zurückgibt, bedeutet das, dass das Datum mehr als 5 Tage in der Zukunft liegt.
             - In diesem Fall: Erstelle den Termin trotzdem, aber gib eine freundliche Nachricht wie: "Ich habe den Termin erstellt. Hinweis: Für dieses Datum konnten aktuell keine Wetterdaten abgerufen werden, da die Wettervorhersage nur für die nächsten 5 Tage verfügbar ist. Bitte prüfe das Wetter kurz vor dem Termin, um dich passend vorzubereiten."
             - Wenn die get_weather Function einen anderen Fehler zurückgibt, erstelle den Termin trotzdem und erwähne, dass die Wetterdaten aktuell nicht verfügbar sind.

             Verwende die tatsächlichen Werte aus den Wetterdaten (temperature, windSpeed, humidity) in deinen Antworten, WENN sie verfügbar sind!

Wenn der Benutzer direkt nach Wetter fragt, rufe get_weather auf und gib eine freundliche, informative Antwort mit allen relevanten Wetterdaten.`,
        };
        const chatMessages = [systemMessage, ...messages.map((m) => ({
                role: m.role,
                content: m.content,
            }))];
        // Call OpenAI API with function calling
        let response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: chatMessages,
                functions: functions,
                function_call: 'auto',
                max_tokens: 2000,
            }),
        });
        if (!response.ok) {
            const error = await response.text();
            console.error('[Chat] OpenAI error:', error);
            return {
                response: getRuleBasedResponse(lastMessage.content),
                threadId: threadId || `thread_${Date.now()}`,
            };
        }
        let data = await response.json();
        let aiMessage = (_b = (_a = data.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message;
        // Handle function calls (Phase 1: Weather)
        if (aiMessage.function_call) {
            const functionName = aiMessage.function_call.name;
            const functionArgs = JSON.parse(aiMessage.function_call.arguments || '{}');
            console.log('[Chat] Function call:', functionName, functionArgs);
            if (functionName === 'get_weather') {
                // Parse date
                let weatherDate = new Date();
                const dateStr = functionArgs.date;
                if (dateStr === 'heute' || dateStr === 'today') {
                    weatherDate = new Date();
                }
                else if (dateStr === 'morgen' || dateStr === 'tomorrow') {
                    weatherDate = new Date();
                    weatherDate.setDate(weatherDate.getDate() + 1);
                }
                else if (dateStr === 'übermorgen' || dateStr === 'day after tomorrow') {
                    weatherDate = new Date();
                    weatherDate.setDate(weatherDate.getDate() + 2);
                }
                else {
                    try {
                        weatherDate = new Date(dateStr);
                    }
                    catch (e) {
                        weatherDate = new Date();
                    }
                }
                // Check if date is within 5 days (forecast limit)
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const requestDate = new Date(weatherDate);
                requestDate.setHours(0, 0, 0, 0);
                const daysDiff = Math.ceil((requestDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                let weatherData = null;
                if (daysDiff > 5) {
                    weatherData = {
                        error: 'Wettervorhersage für dieses Datum nicht verfügbar',
                        reason: 'forecast_limit',
                        message: `Die Wettervorhersage ist nur für die nächsten 5 Tage verfügbar. Das angefragte Datum liegt ${daysDiff} Tage in der Zukunft.`
                    };
                }
                else {
                    weatherData = await getWeatherForAI(userId, weatherDate, functionArgs.location);
                    if (!weatherData) {
                        weatherData = {
                            error: 'Keine Wetterdaten verfügbar',
                            reason: 'api_error',
                            message: 'Die Wetterdaten konnten nicht abgerufen werden.'
                        };
                    }
                }
                // Add function result to messages
                chatMessages.push({
                    role: 'assistant',
                    content: null,
                    function_call: {
                        name: functionName,
                        arguments: JSON.stringify(functionArgs),
                    },
                });
                chatMessages.push({
                    role: 'function',
                    name: functionName,
                    content: JSON.stringify(weatherData),
                });
                // Call OpenAI again with function result
                response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify({
                        model: 'gpt-4o-mini',
                        messages: chatMessages,
                        functions: functions,
                        function_call: 'auto',
                        max_tokens: 2000,
                    }),
                });
                if (!response.ok) {
                    const error = await response.text();
                    console.error('[Chat] OpenAI error (after function call):', error);
                    return {
                        response: getRuleBasedResponse(lastMessage.content),
                        threadId: threadId || `thread_${Date.now()}`,
                    };
                }
                data = await response.json();
                aiMessage = (_d = (_c = data.choices) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.message;
            }
        }
        const aiResponse = (aiMessage === null || aiMessage === void 0 ? void 0 : aiMessage.content) || 'Keine Antwort erhalten.';
        // Save chat history
        const chatRef = db.collection('chatHistory').doc();
        await chatRef.set({
            userId,
            threadId: threadId || `thread_${Date.now()}`,
            messages: [...messages, { role: 'assistant', content: aiResponse }],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return {
            response: aiResponse,
            threadId: threadId || `thread_${Date.now()}`,
            chatId: chatRef.id,
        };
    }
    catch (error) {
        console.error('[Chat] Error:', error);
        return {
            response: getRuleBasedResponse(lastMessage.content),
            threadId: threadId || `thread_${Date.now()}`,
        };
    }
});
// Rule-based response function
function getRuleBasedResponse(message) {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('rechnung') || lowerMessage.includes('rechnungsverwaltung')) {
        return `**Rechnungsverwaltung in Nexo:**\n\n1. **Rechnung scannen**: Nutze die Dokumente-Funktion, um Rechnungen zu scannen\n2. **Rechnung erstellen**: Gehe zu "Rechnungen" und klicke auf "Neu erstellen"\n3. **Rechnungen verwalten**: Alle Rechnungen findest du in der Rechnungen-Übersicht\n\nMöchtest du mehr erfahren?`;
    }
    if (lowerMessage.includes('erinnerung') || lowerMessage.includes('termin')) {
        return `**Erinnerungen erstellen:**\n\n1. Gehe zum Kalender oder Erinnerungen-Bereich\n2. Klicke auf das + Symbol\n3. Fülle die Details aus\n4. Speichere die Erinnerung\n\nErinnerungen werden dir automatisch angezeigt.`;
    }
    if (lowerMessage.includes('finanz') || lowerMessage.includes('geld')) {
        return `**Finanzen verwalten:**\n\n1. Gehe zu "Finanzen"\n2. Erfasse Einnahmen und Ausgaben\n3. Ordne sie Kategorien zu\n4. Sieh deine Übersicht im Dashboard`;
    }
    return `Ich helfe dir gerne bei Fragen zu Nexo!\n\n**Häufige Themen:**\n- 📄 Rechnungsverwaltung\n- 📅 Erinnerungen & Termine\n- 💰 Finanzen verwalten\n- 🛒 Einkaufsliste\n\nStelle eine spezifische Frage!`;
}
// Get chat history
exports.getChatHistory = (0, https_1.onCall)({ enforceAppCheck: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { limit = 20 } = request.data || {};
    const snapshot = await db.collection('chatHistory')
        .where('userId', '==', userId)
        .orderBy('updatedAt', 'desc')
        .limit(limit)
        .get();
    const chats = snapshot.docs.map((doc) => {
        var _a, _b, _c, _d, _e, _f;
        return (Object.assign(Object.assign({ id: doc.id }, doc.data()), { createdAt: ((_c = (_b = (_a = doc.data().createdAt) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a)) === null || _c === void 0 ? void 0 : _c.toISOString()) || null, updatedAt: ((_f = (_e = (_d = doc.data().updatedAt) === null || _d === void 0 ? void 0 : _d.toDate) === null || _e === void 0 ? void 0 : _e.call(_d)) === null || _f === void 0 ? void 0 : _f.toISOString()) || null }));
    });
    return { chats };
});
// Get specific chat thread
exports.getChatThread = (0, https_1.onCall)({ enforceAppCheck: true }, async (request) => {
    var _a, _b, _c, _d, _e, _f;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { threadId } = request.data || {};
    if (!threadId) {
        throw new https_1.HttpsError('invalid-argument', 'threadId is required');
    }
    const snapshot = await db.collection('chatHistory')
        .where('userId', '==', userId)
        .where('threadId', '==', threadId)
        .orderBy('updatedAt', 'desc')
        .limit(1)
        .get();
    if (snapshot.empty) {
        return { thread: null };
    }
    const doc = snapshot.docs[0];
    return {
        thread: Object.assign(Object.assign({ id: doc.id }, doc.data()), { createdAt: ((_c = (_b = (_a = doc.data().createdAt) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a)) === null || _c === void 0 ? void 0 : _c.toISOString()) || null, updatedAt: ((_f = (_e = (_d = doc.data().updatedAt) === null || _d === void 0 ? void 0 : _d.toDate) === null || _e === void 0 ? void 0 : _e.call(_d)) === null || _f === void 0 ? void 0 : _f.toISOString()) || null }),
    };
});
// Clear chat history
exports.clearChatHistory = (0, https_1.onCall)({ enforceAppCheck: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { threadId } = request.data || {};
    let query = db.collection('chatHistory')
        .where('userId', '==', userId);
    if (threadId) {
        query = query.where('threadId', '==', threadId);
    }
    const snapshot = await query.get();
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
    return {
        success: true,
        deletedCount: snapshot.size,
    };
});
// Debug user data
exports.debugUserData = (0, https_1.onCall)({ enforceAppCheck: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    // Get counts of all collections for this user
    const collections = ['people', 'reminders', 'financeEntries', 'budgets', 'shoppingItems', 'chatHistory'];
    const counts = {};
    for (const collection of collections) {
        const snapshot = await db.collection(collection)
            .where('userId', '==', userId)
            .count()
            .get();
        counts[collection] = snapshot.data().count;
    }
    return {
        userId,
        counts,
        timestamp: new Date().toISOString(),
    };
});
// Migrate user IDs (for data migration)
exports.migrateUserIds = (0, https_1.onCall)({ enforceAppCheck: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { oldUserId, newUserId } = request.data || {};
    const currentUserId = request.auth.uid;
    // Only allow migrating own data or admin migration
    if (oldUserId !== currentUserId && newUserId !== currentUserId) {
        throw new https_1.HttpsError('permission-denied', 'Can only migrate own data');
    }
    if (!oldUserId || !newUserId) {
        throw new https_1.HttpsError('invalid-argument', 'Both oldUserId and newUserId are required');
    }
    const collections = ['people', 'reminders', 'financeEntries', 'budgets', 'shoppingItems', 'chatHistory'];
    const migrated = {};
    for (const collection of collections) {
        const snapshot = await db.collection(collection)
            .where('userId', '==', oldUserId)
            .get();
        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, { userId: newUserId });
        });
        await batch.commit();
        migrated[collection] = snapshot.size;
    }
    return {
        success: true,
        migrated,
        timestamp: new Date().toISOString(),
    };
});
// ========== Chat Conversations Functions ==========
exports.getChatConversations = (0, https_1.onCall)({ enforceAppCheck: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    try {
        const snapshot = await db.collection('chatConversations')
            .where('userId', '==', userId)
            .orderBy('updatedAt', 'desc')
            .limit(50)
            .get();
        const conversations = snapshot.docs.map((doc) => {
            var _a, _b, _c, _d, _e, _f;
            const data = doc.data();
            return Object.assign(Object.assign({ id: doc.id }, data), { createdAt: ((_c = (_b = (_a = data.createdAt) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a)) === null || _c === void 0 ? void 0 : _c.toISOString()) || new Date().toISOString(), updatedAt: ((_f = (_e = (_d = data.updatedAt) === null || _d === void 0 ? void 0 : _d.toDate) === null || _e === void 0 ? void 0 : _e.call(_d)) === null || _f === void 0 ? void 0 : _f.toISOString()) || new Date().toISOString() });
        });
        return { conversations };
    }
    catch (error) {
        console.error('[getChatConversations] Error:', error);
        throw new https_1.HttpsError('internal', 'Failed to fetch chat conversations');
    }
});
exports.createChatConversation = (0, https_1.onCall)({ enforceAppCheck: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { title, messages } = request.data;
    const validatedTitle = validateString(title || 'Neue Konversation', 'title', 200, false);
    // Validate messages
    if (!Array.isArray(messages)) {
        throw new https_1.HttpsError('invalid-argument', 'messages must be an array');
    }
    if (messages.length > 100) {
        throw new https_1.HttpsError('invalid-argument', 'messages array cannot exceed 100 items');
    }
    // Validate each message
    for (const msg of messages) {
        if (!msg.role || !['system', 'user', 'assistant'].includes(msg.role)) {
            throw new https_1.HttpsError('invalid-argument', 'Invalid message role');
        }
        if (!msg.content || typeof msg.content !== 'string') {
            throw new https_1.HttpsError('invalid-argument', 'Message content must be a string');
        }
        if (msg.content.length > 100000) {
            throw new https_1.HttpsError('invalid-argument', 'Message content cannot exceed 100000 characters');
        }
    }
    const conversationData = {
        userId,
        title: validatedTitle,
        messages,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const docRef = await db.collection('chatConversations').add(conversationData);
    return Object.assign(Object.assign({ id: docRef.id }, conversationData), { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
});
exports.updateChatConversation = (0, https_1.onCall)({ enforceAppCheck: true }, async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { id, title, messages } = request.data;
    if (!id) {
        throw new https_1.HttpsError('invalid-argument', 'id is required');
    }
    const docRef = db.collection('chatConversations').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
        throw new https_1.HttpsError('not-found', 'Chat conversation not found');
    }
    if (((_a = doc.data()) === null || _a === void 0 ? void 0 : _a.userId) !== userId) {
        throw new https_1.HttpsError('permission-denied', 'Not authorized');
    }
    const updateData = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (title !== undefined) {
        updateData.title = validateString(title, 'title', 200, false);
    }
    if (messages !== undefined) {
        if (!Array.isArray(messages)) {
            throw new https_1.HttpsError('invalid-argument', 'messages must be an array');
        }
        if (messages.length > 100) {
            throw new https_1.HttpsError('invalid-argument', 'messages array cannot exceed 100 items');
        }
        // Validate each message
        for (const msg of messages) {
            if (!msg.role || !['system', 'user', 'assistant'].includes(msg.role)) {
                throw new https_1.HttpsError('invalid-argument', 'Invalid message role');
            }
            if (!msg.content || typeof msg.content !== 'string') {
                throw new https_1.HttpsError('invalid-argument', 'Message content must be a string');
            }
            if (msg.content.length > 100000) {
                throw new https_1.HttpsError('invalid-argument', 'Message content cannot exceed 100000 characters');
            }
        }
        updateData.messages = messages;
    }
    await docRef.update(updateData);
    return { success: true };
});
exports.deleteChatConversation = (0, https_1.onCall)({ enforceAppCheck: true }, async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { id } = request.data;
    if (!id) {
        throw new https_1.HttpsError('invalid-argument', 'id is required');
    }
    const docRef = db.collection('chatConversations').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
        throw new https_1.HttpsError('not-found', 'Chat conversation not found');
    }
    if (((_a = doc.data()) === null || _a === void 0 ? void 0 : _a.userId) !== userId) {
        throw new https_1.HttpsError('permission-denied', 'Not authorized');
    }
    await docRef.delete();
    return { success: true };
});
// Clear all chat conversations for the current user
exports.clearAllChatConversations = (0, https_1.onCall)({ enforceAppCheck: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    // Get all chat conversations for this user
    const snapshot = await db.collection('chatConversations')
        .where('userId', '==', userId)
        .get();
    // Delete all conversations in batches (Firestore batch limit is 500)
    const batch = db.batch();
    let deletedCount = 0;
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
        deletedCount++;
    });
    if (deletedCount > 0) {
        await batch.commit();
    }
    // Also clear old chatHistory collection for backward compatibility
    const oldHistorySnapshot = await db.collection('chatHistory')
        .where('userId', '==', userId)
        .get();
    if (oldHistorySnapshot.size > 0) {
        const oldBatch = db.batch();
        oldHistorySnapshot.docs.forEach(doc => {
            oldBatch.delete(doc.ref);
            deletedCount++;
        });
        await oldBatch.commit();
    }
    return {
        success: true,
        deletedCount,
    };
});
// ========== Weather Functions (Phase 3: API Integration) ==========
// Helper function to map OpenWeatherMap icon codes to our icon names
function mapWeatherIcon(iconCode) {
    // OpenWeatherMap icon codes: https://openweathermap.org/weather-conditions
    const iconMap = {
        '01d': 'sun', // clear sky day
        '01n': 'sun', // clear sky night
        '02d': 'cloud-sun', // few clouds day
        '02n': 'cloud-sun', // few clouds night
        '03d': 'cloud', // scattered clouds
        '03n': 'cloud',
        '04d': 'cloud', // broken clouds
        '04n': 'cloud',
        '09d': 'rain', // shower rain
        '09n': 'rain',
        '10d': 'rain', // rain day
        '10n': 'rain', // rain night
        '11d': 'rain', // thunderstorm
        '11n': 'rain',
        '13d': 'snow', // snow
        '13n': 'snow',
        '50d': 'cloud', // mist
        '50n': 'cloud',
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
        'dust': 'Staub',
        'sand': 'Sand',
        'ash': 'Asche',
        'squall': 'Böen',
        'tornado': 'Tornado',
    };
    return conditionMap[condition.toLowerCase()] || condition;
}
// Helper function to fetch weather from OpenWeatherMap API
async function fetchWeatherFromAPI(location, date, apiKey) {
    var _a, _b, _c, _d;
    if (!apiKey) {
        throw new https_1.HttpsError('failed-precondition', 'OpenWeatherMap API key not configured. Please set OPENWEATHERMAP_API_KEY secret in Firebase.');
    }
    try {
        // For current weather (today and future dates)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const requestDate = new Date(date);
        requestDate.setHours(0, 0, 0, 0);
        // Check if date is in the future (forecast) or past (historical)
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
            const response = await axios_1.default.get(url, { params, timeout: 10000 });
            const data = response.data;
            if (!data || !data.main || !data.weather || data.weather.length === 0) {
                throw new Error('Invalid API response');
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
            const response = await axios_1.default.get(url, { params, timeout: 10000 });
            const data = response.data;
            if (!data || !data.list || !Array.isArray(data.list) || data.list.length === 0) {
                throw new Error('Invalid forecast API response');
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
                throw new Error('No suitable forecast found');
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
            // For now, return null - historical data should be cached when it was current
            // Don't throw error, just return null so client can show appropriate message
            return null;
        }
        return null;
    }
    catch (error) {
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        // Handle API errors
        if (error.response) {
            const status = error.response.status;
            const errorData = error.response.data;
            console.error('[fetchWeatherFromAPI] API Error:', {
                status,
                data: errorData,
                location,
                apiKeyPrefix: apiKey ? `${apiKey.substring(0, 8)}...` : 'MISSING'
            });
            if (status === 401) {
                throw new https_1.HttpsError('failed-precondition', `Invalid OpenWeatherMap API key. Response: ${JSON.stringify(errorData)}`);
            }
            else if (status === 404) {
                throw new https_1.HttpsError('not-found', `Location "${location}" not found`);
            }
            else if (status === 429) {
                throw new https_1.HttpsError('resource-exhausted', 'OpenWeatherMap API rate limit exceeded');
            }
            else {
                throw new https_1.HttpsError('internal', `Weather API error: ${(errorData === null || errorData === void 0 ? void 0 : errorData.message) || JSON.stringify(errorData) || 'Unknown error'}`);
            }
        }
        else if (error.request) {
            console.error('[fetchWeatherFromAPI] Request Error:', { location, hasApiKey: !!apiKey });
            throw new https_1.HttpsError('deadline-exceeded', 'Weather API request timeout');
        }
        else {
            console.error('[fetchWeatherFromAPI] Unknown Error:', { message: error.message, location, hasApiKey: !!apiKey });
            throw new https_1.HttpsError('internal', `Failed to fetch weather: ${error.message}`);
        }
    }
}
exports.getWeather = (0, https_1.onCall)({
    secrets: [openWeatherMapApiKey],
    enforceAppCheck: true,
}, async (request) => {
    var _a, _b;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { date, location } = request.data;
    if (!date) {
        throw new https_1.HttpsError('invalid-argument', 'date is required');
    }
    if (!location) {
        throw new https_1.HttpsError('invalid-argument', 'location is required');
    }
    const dateObj = validateDate(date, 'date', true);
    const dateStr = dateObj.toISOString().split('T')[0];
    const validatedLocation = validateString(location, 'location', 200, true);
    // Check if weather data exists in cache
    const weatherQuery = db.collection('weatherData')
        .where('userId', '==', userId)
        .where('date', '==', dateStr)
        .where('location', '==', validatedLocation);
    const snapshot = await weatherQuery.limit(1).get();
    if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        return {
            id: doc.id,
            date: data.date,
            location: data.location || null,
            temperature: data.temperature,
            condition: data.condition,
            icon: data.icon,
            humidity: data.humidity || null,
            windSpeed: data.windSpeed || null,
            cached: true,
            fetchedAt: ((_a = data.fetchedAt) === null || _a === void 0 ? void 0 : _a.toDate) ? data.fetchedAt.toDate().toISOString() : new Date().toISOString(),
        };
    }
    // No cached data found - fetch from API
    try {
        const apiKey = (_b = openWeatherMapApiKey.value()) === null || _b === void 0 ? void 0 : _b.trim();
        console.log('[getWeather] Using API key:', apiKey ? `${apiKey.substring(0, 8)}... (length: ${apiKey.length})` : 'MISSING');
        if (!apiKey) {
            throw new https_1.HttpsError('failed-precondition', 'OpenWeatherMap API key not configured');
        }
        const apiWeather = await fetchWeatherFromAPI(validatedLocation, dateObj, apiKey);
        if (!apiWeather) {
            return null;
        }
        // Save to cache
        const weatherData = {
            userId,
            date: dateStr,
            location: validatedLocation,
            temperature: apiWeather.temperature,
            condition: apiWeather.condition,
            icon: apiWeather.icon,
            humidity: apiWeather.humidity,
            windSpeed: apiWeather.windSpeed,
            fetchedAt: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        const docRef = await db.collection('weatherData').add(weatherData);
        return {
            id: docRef.id,
            date: dateStr,
            location: validatedLocation,
            temperature: apiWeather.temperature,
            condition: apiWeather.condition,
            icon: apiWeather.icon,
            humidity: apiWeather.humidity,
            windSpeed: apiWeather.windSpeed,
            cached: false,
            fetchedAt: new Date().toISOString(),
        };
    }
    catch (error) {
        // Log detailed error for debugging
        console.error('[getWeather] Error fetching weather from API:', {
            error: error.message,
            code: error.code,
            location: validatedLocation,
            date: dateStr,
            userId,
            stack: error.stack
        });
        // If it's already an HttpsError, re-throw it
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        // Otherwise, wrap it in an HttpsError
        throw new https_1.HttpsError(error.code || 'internal', error.message || 'Fehler beim Abrufen der Wetterdaten. Bitte überprüfen Sie den Standort in den Einstellungen.');
    }
});
exports.saveWeather = (0, https_1.onCall)({ enforceAppCheck: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { date, location, temperature, condition, icon, humidity, windSpeed } = request.data;
    if (!date) {
        throw new https_1.HttpsError('invalid-argument', 'date is required');
    }
    const dateObj = validateDate(date, 'date', true);
    const dateStr = dateObj.toISOString().split('T')[0];
    const validatedLocation = validateString(location, 'location', 200, false);
    const validatedTemperature = validateNumber(temperature, 'temperature', -100, 100, true);
    const validatedCondition = validateString(condition, 'condition', 100, true);
    const validatedIcon = validateString(icon, 'icon', 50, false) || 'cloud';
    const validatedHumidity = validateNumber(humidity, 'humidity', 0, 100, false);
    const validatedWindSpeed = validateNumber(windSpeed, 'windSpeed', 0, 500, false);
    // Check if weather data already exists for this date and location
    const existingQuery = db.collection('weatherData')
        .where('userId', '==', userId)
        .where('date', '==', dateStr);
    if (validatedLocation) {
        existingQuery.where('location', '==', validatedLocation);
    }
    const existingSnapshot = await existingQuery.limit(1).get();
    const weatherData = {
        userId,
        date: dateStr,
        location: validatedLocation || null,
        temperature: validatedTemperature,
        condition: validatedCondition,
        icon: validatedIcon,
        humidity: validatedHumidity || null,
        windSpeed: validatedWindSpeed || null,
        fetchedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (!existingSnapshot.empty) {
        // Update existing record
        const docRef = existingSnapshot.docs[0].ref;
        await docRef.update(weatherData);
        return Object.assign(Object.assign({ id: existingSnapshot.docs[0].id }, weatherData), { updated: true });
    }
    else {
        // Create new record
        weatherData.createdAt = admin.firestore.FieldValue.serverTimestamp();
        const docRef = await db.collection('weatherData').add(weatherData);
        return Object.assign(Object.assign({ id: docRef.id }, weatherData), { created: true });
    }
});
exports.getWeatherHistory = (0, https_1.onCall)({ enforceAppCheck: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { startDate, endDate, location, limit = 30 } = request.data;
    let query = db.collection('weatherData')
        .where('userId', '==', userId);
    if (startDate) {
        const start = validateDate(startDate, 'startDate', false);
        if (start) {
            query = query.where('date', '>=', start.toISOString().split('T')[0]);
        }
    }
    if (endDate) {
        const end = validateDate(endDate, 'endDate', false);
        if (end) {
            query = query.where('date', '<=', end.toISOString().split('T')[0]);
        }
    }
    if (location) {
        const validatedLocation = validateString(location, 'location', 200, false);
        if (validatedLocation) {
            query = query.where('location', '==', validatedLocation);
        }
    }
    const validatedLimit = validateNumber(limit, 'limit', 1, 100, false) || 30;
    const snapshot = await query.orderBy('date', 'desc').limit(validatedLimit).get();
    const weatherHistory = snapshot.docs.map((doc) => {
        var _a;
        const data = doc.data();
        return {
            id: doc.id,
            date: data.date,
            location: data.location || null,
            temperature: data.temperature,
            condition: data.condition,
            icon: data.icon,
            humidity: data.humidity || null,
            windSpeed: data.windSpeed || null,
            fetchedAt: ((_a = data.fetchedAt) === null || _a === void 0 ? void 0 : _a.toDate) ? data.fetchedAt.toDate().toISOString() : null,
        };
    });
    return { weatherHistory };
});
// Search product info by article number and store
exports.searchProductInfo = (0, https_1.onCall)({ enforceAppCheck: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { articleNumber, store } = request.data;
    const validatedArticleNumber = validateString(articleNumber, 'articleNumber', 50, true);
    const validatedStore = validateString(store, 'store', 100, false);
    try {
        // Try to find product in database first
        const productQuery = await db.collection('productDatabase')
            .where('articleNumber', '==', validatedArticleNumber)
            .where('store', '==', validatedStore || '')
            .limit(1)
            .get();
        if (!productQuery.empty) {
            const productData = productQuery.docs[0].data();
            return {
                productInfo: {
                    brand: productData.brand || null,
                    description: productData.description || null,
                    price: productData.price || null,
                    imageUrl: productData.imageUrl || null,
                    store: productData.store || validatedStore,
                    articleNumber: validatedArticleNumber
                }
            };
        }
        // If not found, try to search store website or external APIs
        const storeUrls = {
            'Migros': 'https://www.migros.ch',
            'Coop': 'https://www.coop.ch',
            'Aldi': 'https://www.aldi.ch',
            'Lidl': 'https://www.lidl.ch',
            'Denner': 'https://www.denner.ch'
        };
        const storeUrl = validatedStore ? storeUrls[validatedStore] || null : null;
        const searchUrl = storeUrl ? `${storeUrl}/search?q=${encodeURIComponent(validatedArticleNumber)}` : null;
        // Try to fetch from Open Product Data API (EAN database)
        let externalProductInfo = null;
        try {
            const eanApiResponse = await axios_1.default.get(`https://api.upcitemdb.com/prod/trial/lookup`, {
                params: { upc: validatedArticleNumber },
                timeout: 5000
            });
            if (eanApiResponse.data && eanApiResponse.data.items && eanApiResponse.data.items.length > 0) {
                const item = eanApiResponse.data.items[0];
                externalProductInfo = {
                    brand: item.brand || null,
                    description: item.title || item.description || null,
                    price: null, // API doesn't provide price
                    imageUrl: item.images && item.images.length > 0 ? item.images[0] : null,
                    store: validatedStore,
                    articleNumber: validatedArticleNumber,
                    searchUrl: searchUrl
                };
            }
        }
        catch (apiError) {
            console.log('[searchProductInfo] External API error:', apiError.message);
            // Continue without external data
        }
        // If external API provided info, use it; otherwise return basic structure
        if (externalProductInfo) {
            // Save to database for future use
            try {
                await db.collection('productDatabase').add({
                    articleNumber: validatedArticleNumber,
                    store: validatedStore || '',
                    brand: externalProductInfo.brand,
                    description: externalProductInfo.description,
                    price: null,
                    imageUrl: externalProductInfo.imageUrl,
                    searchUrl: searchUrl,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }
            catch (dbError) {
                console.log('[searchProductInfo] Database save error:', dbError);
            }
            return { productInfo: externalProductInfo };
        }
        return {
            productInfo: {
                brand: null,
                description: null,
                price: null,
                imageUrl: null,
                store: validatedStore,
                articleNumber: validatedArticleNumber,
                searchUrl: searchUrl
            }
        };
    }
    catch (error) {
        console.error('[searchProductInfo] Error:', error);
        throw new https_1.HttpsError('internal', 'Failed to search product info: ' + error.message);
    }
});
// Analyze product image to extract product info
exports.analyzeProductImage = (0, https_1.onCall)({ enforceAppCheck: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { imageData, store, articleNumber } = request.data;
    const validatedImageData = validateString(imageData, 'imageData', 10000000, true); // ~10MB base64
    const validatedStore = validateString(store, 'store', 100, false);
    const validatedArticleNumber = validateString(articleNumber, 'articleNumber', 50, false);
    try {
        const buffer = Buffer.from(validatedImageData.split(',')[1] || validatedImageData, 'base64');
        let extractedText = '';
        let detectedBarcode = validatedArticleNumber || null;
        let productName = null;
        let productPrice = null;
        let productBrand = null;
        // Step 1: Extract text using Google Vision OCR
        try {
            const vision = require('@google-cloud/vision');
            const client = new vision.ImageAnnotatorClient();
            // Text detection
            const [textResult] = await client.textDetection(buffer);
            const textAnnotations = textResult.textAnnotations;
            if (textAnnotations && textAnnotations.length > 0) {
                extractedText = textAnnotations[0].description || '';
                console.log('[analyzeProductImage] OCR text extracted:', extractedText.length, 'chars');
            }
            // Barcode detection
            const [barcodeResult] = await client.barcodeDetection(buffer);
            const barcodes = barcodeResult.barcodeAnnotations;
            if (barcodes && barcodes.length > 0) {
                detectedBarcode = barcodes[0].rawValue || detectedBarcode;
                console.log('[analyzeProductImage] Barcode detected:', detectedBarcode);
            }
            // Label detection for product identification
            const [labelResult] = await client.labelDetection(buffer);
            const labels = labelResult.labelAnnotations;
            if (labels && labels.length > 0) {
                // Use top labels as product description
                const topLabels = labels.slice(0, 3).map((l) => l.description).join(', ');
                productName = topLabels;
                console.log('[analyzeProductImage] Labels detected:', topLabels);
            }
        }
        catch (visionError) {
            console.error('[analyzeProductImage] Vision API error:', visionError.message);
            // Continue with basic info if Vision fails
        }
        // Step 2: Parse extracted text for product info
        if (extractedText) {
            const lines = extractedText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            // Try to find product name (usually first meaningful line)
            for (const line of lines.slice(0, 5)) {
                if (line.length > 3 && !/^\d+$/.test(line) && !line.match(/^(CHF|Preis|Total)/i)) {
                    if (!productName)
                        productName = line;
                    break;
                }
            }
            // Try to find price
            const priceMatch = extractedText.match(/(\d+[.,]\d{2})\s*(CHF|Fr\.?)?/i);
            if (priceMatch) {
                productPrice = parseFloat(priceMatch[1].replace(',', '.'));
            }
            // Try to find brand (look for common brand patterns)
            const brandPatterns = /(Migros|Coop|Aldi|Lidl|Denner|Nestlé|Coca-Cola|Pepsi|Milka|Lindt|Toblerone)/i;
            const brandMatch = extractedText.match(brandPatterns);
            if (brandMatch) {
                productBrand = brandMatch[1];
            }
        }
        // Step 3: If barcode detected, try to fetch product info from database
        if (detectedBarcode && !validatedArticleNumber) {
            try {
                const productQuery = await db.collection('productDatabase')
                    .where('articleNumber', '==', detectedBarcode)
                    .where('store', '==', validatedStore || '')
                    .limit(1)
                    .get();
                if (!productQuery.empty) {
                    const productData = productQuery.docs[0].data();
                    return {
                        productInfo: {
                            brand: productBrand || productData.brand || null,
                            description: productName || productData.description || 'Produkt erkannt',
                            price: productPrice || productData.price || null,
                            imageUrl: validatedImageData,
                            store: validatedStore,
                            articleNumber: detectedBarcode
                        }
                    };
                }
                // Try external API
                try {
                    const eanApiResponse = await axios_1.default.get(`https://api.upcitemdb.com/prod/trial/lookup`, {
                        params: { upc: detectedBarcode },
                        timeout: 5000
                    });
                    if (eanApiResponse.data && eanApiResponse.data.items && eanApiResponse.data.items.length > 0) {
                        const item = eanApiResponse.data.items[0];
                        return {
                            productInfo: {
                                brand: productBrand || item.brand || null,
                                description: productName || item.title || item.description || 'Produkt erkannt',
                                price: productPrice || null,
                                imageUrl: validatedImageData,
                                store: validatedStore,
                                articleNumber: detectedBarcode
                            }
                        };
                    }
                }
                catch (apiError) {
                    console.log('[analyzeProductImage] External API error:', apiError);
                }
            }
            catch (searchError) {
                console.log('[analyzeProductImage] Product search failed:', searchError);
            }
        }
        return {
            productInfo: {
                brand: productBrand || null,
                description: productName || (extractedText ? 'Produktbild erkannt' : 'Produktbild gespeichert'),
                price: productPrice || null,
                imageUrl: validatedImageData,
                store: validatedStore,
                articleNumber: detectedBarcode
            }
        };
    }
    catch (error) {
        console.error('[analyzeProductImage] Error:', error);
        throw new https_1.HttpsError('internal', 'Failed to analyze product image: ' + error.message);
    }
});
// ========== Passwordless 2FA Login ==========
/**
 * Login with only email and 2FA code (no password required)
 * Returns a custom token that can be used to sign in
 */
exports.loginWith2FAOnly = (0, https_1.onCall)({ enforceAppCheck: true }, async (request) => {
    const { email, totpCode } = request.data || {};
    // Validate inputs
    const validatedEmail = validateEmail(email, 'email');
    if (!validatedEmail) {
        throw new https_1.HttpsError('invalid-argument', 'E-Mail ist erforderlich');
    }
    if (!totpCode || typeof totpCode !== 'string' || totpCode.length !== 6) {
        throw new https_1.HttpsError('invalid-argument', 'Ein gültiger 6-stelliger Code ist erforderlich');
    }
    try {
        // Find user by email
        const userRecord = await admin.auth().getUserByEmail(validatedEmail);
        if (!userRecord) {
            throw new https_1.HttpsError('not-found', 'Benutzer nicht gefunden');
        }
        // Check if 2FA is enabled for this user
        const twoFactorDoc = await db.collection('twoFactorSecrets').doc(userRecord.uid).get();
        if (!twoFactorDoc.exists) {
            throw new https_1.HttpsError('failed-precondition', '2FA ist für dieses Konto nicht aktiviert');
        }
        const twoFactorData = twoFactorDoc.data();
        if (!(twoFactorData === null || twoFactorData === void 0 ? void 0 : twoFactorData.enabled) || !(twoFactorData === null || twoFactorData === void 0 ? void 0 : twoFactorData.secret)) {
            throw new https_1.HttpsError('failed-precondition', '2FA ist für dieses Konto nicht aktiviert');
        }
        // Verify the TOTP code
        const { authenticator } = await Promise.resolve().then(() => __importStar(require('otplib')));
        const isValid = authenticator.verify({
            token: totpCode,
            secret: twoFactorData.secret,
        });
        if (!isValid) {
            throw new https_1.HttpsError('unauthenticated', 'Ungültiger 2FA-Code');
        }
        // Update last used timestamp
        await db.collection('twoFactorSecrets').doc(userRecord.uid).update({
            lastUsed: admin.firestore.Timestamp.now(),
        });
        // Create a custom token for the user
        const customToken = await admin.auth().createCustomToken(userRecord.uid, {
            loginMethod: '2fa-only',
        });
        return {
            success: true,
            customToken,
            email: userRecord.email,
            displayName: userRecord.displayName,
        };
    }
    catch (error) {
        console.error('[loginWith2FAOnly] Error:', error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        if (error.code === 'auth/user-not-found') {
            throw new https_1.HttpsError('not-found', 'Benutzer nicht gefunden');
        }
        throw new https_1.HttpsError('internal', 'Login fehlgeschlagen: ' + error.message);
    }
});
/**
 * Check if 2FA is enabled for an email (without requiring authentication)
 * Used for passwordless 2FA login flow
 */
exports.check2FAStatus = (0, https_1.onCall)({ enforceAppCheck: true }, async (request) => {
    const { email } = request.data || {};
    const validatedEmail = validateEmail(email, 'email');
    if (!validatedEmail) {
        throw new https_1.HttpsError('invalid-argument', 'E-Mail ist erforderlich');
    }
    try {
        // Find user by email
        const userRecord = await admin.auth().getUserByEmail(validatedEmail);
        if (!userRecord) {
            // Don't reveal if user exists or not for security
            return { enabled: false };
        }
        // Check if 2FA is enabled
        const twoFactorDoc = await db.collection('twoFactorSecrets').doc(userRecord.uid).get();
        if (!twoFactorDoc.exists) {
            return { enabled: false };
        }
        const data = twoFactorDoc.data();
        return {
            enabled: (data === null || data === void 0 ? void 0 : data.enabled) === true && !!(data === null || data === void 0 ? void 0 : data.secret)
        };
    }
    catch (error) {
        console.error('[check2FAStatus] Error:', error);
        // Don't reveal user existence for security
        return { enabled: false };
    }
});
// ========== WebAuthn/Passkeys ==========
// Configuration for WebAuthn
const WEBAUTHN_RP_NAME = 'Nexo';
const WEBAUTHN_RP_ID = 'nexo-jtsky100.web.app';
const WEBAUTHN_ORIGIN = 'https://nexo-jtsky100.web.app';
/**
 * Generate registration options for a new passkey
 */
exports.generatePasskeyRegistrationOptions = (0, https_1.onCall)({ enforceAppCheck: true }, async (request) => {
    var _a;
    // Require authentication
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new https_1.HttpsError('unauthenticated', 'Authentifizierung erforderlich');
    }
    const userId = request.auth.uid;
    try {
        const { generateRegistrationOptions } = await Promise.resolve().then(() => __importStar(require('@simplewebauthn/server')));
        // Get user info
        const userRecord = await admin.auth().getUser(userId);
        // Get existing passkeys for this user
        const passkeysSnapshot = await db.collection('passkeys').where('userId', '==', userId).get();
        const existingCredentials = passkeysSnapshot.docs.map((doc) => ({
            id: doc.data().credentialId,
            transports: doc.data().transports || [],
        }));
        const options = await generateRegistrationOptions({
            rpName: WEBAUTHN_RP_NAME,
            rpID: WEBAUTHN_RP_ID,
            userName: userRecord.email || userId,
            userDisplayName: userRecord.displayName || userRecord.email || 'Nexo User',
            attestationType: 'none',
            excludeCredentials: existingCredentials.map(cred => ({
                id: cred.id,
                transports: cred.transports,
            })),
            authenticatorSelection: {
                residentKey: 'required', // Required for discoverable credentials
                userVerification: 'preferred',
                // Don't restrict to platform - allow cross-platform authenticators too
            },
        });
        // Store challenge temporarily
        await db.collection('passkeysChallenges').doc(userId).set({
            challenge: options.challenge,
            type: 'registration',
            createdAt: admin.firestore.Timestamp.now(),
            expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 5 * 60 * 1000), // 5 minutes
        });
        return options;
    }
    catch (error) {
        console.error('[generatePasskeyRegistrationOptions] Error:', error);
        throw new https_1.HttpsError('internal', 'Fehler beim Generieren der Passkey-Optionen: ' + error.message);
    }
});
/**
 * Verify and save a new passkey registration
 */
exports.verifyPasskeyRegistration = (0, https_1.onCall)({ enforceAppCheck: true }, async (request) => {
    var _a, _b;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new https_1.HttpsError('unauthenticated', 'Authentifizierung erforderlich');
    }
    const userId = request.auth.uid;
    const { credential, deviceName } = request.data || {};
    if (!credential) {
        throw new https_1.HttpsError('invalid-argument', 'Credential ist erforderlich');
    }
    try {
        const { verifyRegistrationResponse } = await Promise.resolve().then(() => __importStar(require('@simplewebauthn/server')));
        // Get stored challenge
        const challengeDoc = await db.collection('passkeysChallenges').doc(userId).get();
        if (!challengeDoc.exists) {
            throw new https_1.HttpsError('failed-precondition', 'Keine Challenge gefunden');
        }
        const challengeData = challengeDoc.data();
        if ((challengeData === null || challengeData === void 0 ? void 0 : challengeData.type) !== 'registration') {
            throw new https_1.HttpsError('failed-precondition', 'Ungültige Challenge');
        }
        // Check expiration
        if (challengeData.expiresAt.toMillis() < Date.now()) {
            await db.collection('passkeysChallenges').doc(userId).delete();
            throw new https_1.HttpsError('failed-precondition', 'Challenge abgelaufen');
        }
        const verification = await verifyRegistrationResponse({
            response: credential,
            expectedChallenge: challengeData.challenge,
            expectedOrigin: WEBAUTHN_ORIGIN,
            expectedRPID: WEBAUTHN_RP_ID,
        });
        if (!verification.verified || !verification.registrationInfo) {
            throw new https_1.HttpsError('unauthenticated', 'Verifizierung fehlgeschlagen');
        }
        const { credential: verifiedCredential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
        // In SimpleWebAuthn v10+, credential.id is already a base64url string
        // DO NOT convert it with Buffer.from() - use it directly
        const credentialIdBase64url = typeof verifiedCredential.id === 'string'
            ? verifiedCredential.id
            : Buffer.from(verifiedCredential.id).toString('base64url');
        console.log('[verifyPasskeyRegistration] Saving credentialId:', credentialIdBase64url);
        console.log('[verifyPasskeyRegistration] Original ID type:', typeof verifiedCredential.id);
        // Save passkey
        await db.collection('passkeys').add({
            userId,
            credentialId: credentialIdBase64url,
            // publicKey is a Uint8Array, convert to base64
            publicKey: Buffer.from(verifiedCredential.publicKey).toString('base64'),
            counter: verifiedCredential.counter,
            deviceType: credentialDeviceType,
            backedUp: credentialBackedUp,
            transports: ((_b = credential.response) === null || _b === void 0 ? void 0 : _b.transports) || [],
            deviceName: deviceName || 'Unbenanntes Gerät',
            createdAt: admin.firestore.Timestamp.now(),
            lastUsed: null,
        });
        // Clean up challenge
        await db.collection('passkeysChallenges').doc(userId).delete();
        return { success: true, verified: true };
    }
    catch (error) {
        console.error('[verifyPasskeyRegistration] Error:', error);
        if (error instanceof https_1.HttpsError)
            throw error;
        throw new https_1.HttpsError('internal', 'Fehler bei der Passkey-Registrierung: ' + error.message);
    }
});
/**
 * Generate authentication options for passkey login
 */
exports.generatePasskeyAuthenticationOptions = (0, https_1.onCall)(async (request) => {
    var _a;
    const { email: rawEmail } = request.data || {};
    // Validate and clean email
    const email = (_a = rawEmail === null || rawEmail === void 0 ? void 0 : rawEmail.trim) === null || _a === void 0 ? void 0 : _a.call(rawEmail);
    if (!email) {
        throw new https_1.HttpsError('invalid-argument', 'E-Mail-Adresse ist erforderlich');
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new https_1.HttpsError('invalid-argument', 'Ungültige E-Mail-Adresse');
    }
    try {
        const { generateAuthenticationOptions } = await Promise.resolve().then(() => __importStar(require('@simplewebauthn/server')));
        let allowCredentials = [];
        let userId = null;
        // Find user by email
        try {
            const userRecord = await admin.auth().getUserByEmail(email);
            userId = userRecord.uid;
            // Get passkeys for this user
            const passkeysSnapshot = await db.collection('passkeys').where('userId', '==', userId).get();
            console.log('[generatePasskeyAuthenticationOptions] Found passkeys:', passkeysSnapshot.size);
            allowCredentials = passkeysSnapshot.docs.map((doc) => {
                const credId = doc.data().credentialId;
                const transports = doc.data().transports || ['internal', 'hybrid'];
                console.log('[generatePasskeyAuthenticationOptions] Passkey credentialId:', credId, 'transports:', transports);
                return {
                    id: credId,
                    transports: transports,
                };
            });
            if (allowCredentials.length === 0) {
                throw new https_1.HttpsError('failed-precondition', 'Keine Passkeys für dieses Konto registriert');
            }
        }
        catch (error) {
            if (error.code === 'auth/user-not-found') {
                throw new https_1.HttpsError('not-found', 'Benutzer nicht gefunden');
            }
            if (error instanceof https_1.HttpsError)
                throw error;
            throw new https_1.HttpsError('internal', 'Fehler beim Suchen des Benutzers: ' + error.message);
        }
        // Pass allowCredentials to only allow the registered passkeys
        // This prevents the browser from selecting old/corrupted passkeys
        console.log('[generatePasskeyAuthenticationOptions] Using allowCredentials:', JSON.stringify(allowCredentials));
        const options = await generateAuthenticationOptions({
            rpID: WEBAUTHN_RP_ID,
            allowCredentials: allowCredentials,
            userVerification: 'preferred',
        });
        // Store challenge
        const challengeDocId = userId || `anonymous_${Date.now()}`;
        await db.collection('passkeysChallenges').doc(challengeDocId).set({
            challenge: options.challenge,
            type: 'authentication',
            userId: userId,
            createdAt: admin.firestore.Timestamp.now(),
            expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 5 * 60 * 1000),
        });
        return Object.assign(Object.assign({}, options), { challengeId: challengeDocId });
    }
    catch (error) {
        console.error('[generatePasskeyAuthenticationOptions] Error:', error);
        if (error instanceof https_1.HttpsError)
            throw error;
        throw new https_1.HttpsError('internal', 'Fehler beim Generieren der Authentifizierungsoptionen: ' + error.message);
    }
});
/**
 * Verify passkey authentication and return custom token
 */
exports.verifyPasskeyAuthentication = (0, https_1.onCall)(async (request) => {
    const { credential, challengeId } = request.data || {};
    if (!credential || !challengeId) {
        throw new https_1.HttpsError('invalid-argument', 'Credential und ChallengeId sind erforderlich');
    }
    try {
        const { verifyAuthenticationResponse } = await Promise.resolve().then(() => __importStar(require('@simplewebauthn/server')));
        // Get challenge
        const challengeDoc = await db.collection('passkeysChallenges').doc(challengeId).get();
        if (!challengeDoc.exists) {
            throw new https_1.HttpsError('failed-precondition', 'Challenge nicht gefunden');
        }
        const challengeData = challengeDoc.data();
        if ((challengeData === null || challengeData === void 0 ? void 0 : challengeData.type) !== 'authentication') {
            throw new https_1.HttpsError('failed-precondition', 'Ungültige Challenge');
        }
        if (challengeData.expiresAt.toMillis() < Date.now()) {
            await db.collection('passkeysChallenges').doc(challengeId).delete();
            throw new https_1.HttpsError('failed-precondition', 'Challenge abgelaufen');
        }
        // Find passkey by credential ID
        // The credential.id from the browser is already base64url encoded (from @simplewebauthn/browser)
        const credentialIdFromBrowser = credential.id;
        console.log('[verifyPasskeyAuthentication] Looking for credentialId:', credentialIdFromBrowser);
        console.log('[verifyPasskeyAuthentication] credentialId length:', credentialIdFromBrowser.length);
        // Query by exact match first
        let passkeysSnapshot = await db.collection('passkeys')
            .where('credentialId', '==', credentialIdFromBrowser)
            .limit(1)
            .get();
        console.log('[verifyPasskeyAuthentication] Found by exact match:', !passkeysSnapshot.empty);
        if (passkeysSnapshot.empty) {
            // List all passkeys for debugging
            const allPasskeys = await db.collection('passkeys').get();
            const allCredentialIds = allPasskeys.docs.map((d) => ({
                id: d.id,
                credentialId: d.data().credentialId,
                deviceName: d.data().deviceName,
                userId: d.data().userId
            }));
            console.log('[verifyPasskeyAuthentication] All passkeys in DB:', JSON.stringify(allCredentialIds, null, 2));
            console.log('[verifyPasskeyAuthentication] Browser sent:', credentialIdFromBrowser);
            throw new https_1.HttpsError('not-found', 'Passkey nicht gefunden. Die Credential-ID wurde nicht in der Datenbank gefunden.');
        }
        const passkeyDoc = passkeysSnapshot.docs[0];
        const passkeyData = passkeyDoc.data();
        const verification = await verifyAuthenticationResponse({
            response: credential,
            expectedChallenge: challengeData.challenge,
            expectedOrigin: WEBAUTHN_ORIGIN,
            expectedRPID: WEBAUTHN_RP_ID,
            credential: {
                id: passkeyData.credentialId,
                publicKey: new Uint8Array(Buffer.from(passkeyData.publicKey, 'base64')),
                counter: passkeyData.counter,
                transports: passkeyData.transports,
            },
        });
        if (!verification.verified) {
            throw new https_1.HttpsError('unauthenticated', 'Passkey-Verifizierung fehlgeschlagen');
        }
        // Update counter and last used
        await passkeyDoc.ref.update({
            counter: verification.authenticationInfo.newCounter,
            lastUsed: admin.firestore.Timestamp.now(),
        });
        // Clean up challenge
        await db.collection('passkeysChallenges').doc(challengeId).delete();
        // Create custom token
        const customToken = await admin.auth().createCustomToken(passkeyData.userId, {
            loginMethod: 'passkey',
        });
        // Get user info
        const userRecord = await admin.auth().getUser(passkeyData.userId);
        return {
            success: true,
            customToken,
            email: userRecord.email,
            displayName: userRecord.displayName,
        };
    }
    catch (error) {
        console.error('[verifyPasskeyAuthentication] Error:', error);
        if (error instanceof https_1.HttpsError)
            throw error;
        throw new https_1.HttpsError('internal', 'Fehler bei der Passkey-Authentifizierung: ' + error.message);
    }
});
/**
 * List passkeys for the current user
 */
exports.listPasskeys = (0, https_1.onCall)(async (request) => {
    var _a;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new https_1.HttpsError('unauthenticated', 'Authentifizierung erforderlich');
    }
    try {
        // Simple query without orderBy to avoid index requirement
        const passkeysSnapshot = await db.collection('passkeys')
            .where('userId', '==', request.auth.uid)
            .get();
        const passkeys = passkeysSnapshot.docs.map((doc) => {
            var _a, _b, _c, _d, _e, _f;
            return ({
                id: doc.id,
                deviceName: doc.data().deviceName || 'Unbenanntes Gerät',
                deviceType: doc.data().deviceType || 'unknown',
                backedUp: doc.data().backedUp || false,
                createdAt: ((_c = (_b = (_a = doc.data().createdAt) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a)) === null || _c === void 0 ? void 0 : _c.toISOString()) || null,
                lastUsed: ((_f = (_e = (_d = doc.data().lastUsed) === null || _d === void 0 ? void 0 : _d.toDate) === null || _e === void 0 ? void 0 : _e.call(_d)) === null || _f === void 0 ? void 0 : _f.toISOString()) || null,
            });
        });
        // Sort client-side by createdAt descending
        passkeys.sort((a, b) => {
            if (!a.createdAt)
                return 1;
            if (!b.createdAt)
                return -1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        return { passkeys };
    }
    catch (error) {
        console.error('[listPasskeys] Error:', error);
        throw new https_1.HttpsError('internal', 'Fehler beim Laden der Passkeys: ' + error.message);
    }
});
/**
 * Delete a passkey
 */
exports.deletePasskey = (0, https_1.onCall)(async (request) => {
    var _a, _b;
    if (!((_a = request.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new https_1.HttpsError('unauthenticated', 'Authentifizierung erforderlich');
    }
    const { passkeyId } = request.data || {};
    if (!passkeyId) {
        throw new https_1.HttpsError('invalid-argument', 'Passkey-ID ist erforderlich');
    }
    try {
        const passkeyDoc = await db.collection('passkeys').doc(passkeyId).get();
        if (!passkeyDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Passkey nicht gefunden');
        }
        if (((_b = passkeyDoc.data()) === null || _b === void 0 ? void 0 : _b.userId) !== request.auth.uid) {
            throw new https_1.HttpsError('permission-denied', 'Keine Berechtigung');
        }
        await db.collection('passkeys').doc(passkeyId).delete();
        return { success: true };
    }
    catch (error) {
        console.error('[deletePasskey] Error:', error);
        if (error instanceof https_1.HttpsError)
            throw error;
        throw new https_1.HttpsError('internal', 'Fehler beim Löschen des Passkeys');
    }
});
/**
 * TEMPORARY: Delete all passkeys (admin cleanup)
 * This function will be removed after cleanup
 */
exports.adminDeleteAllPasskeys = (0, https_1.onCall)(async (request) => {
    var _a, _b;
    // Only allow specific admin email
    const adminEmails = ['jtsky100@gmail.com', 'antonio10jonathan@yahoo.com'];
    if (!((_b = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.token) === null || _b === void 0 ? void 0 : _b.email) || !adminEmails.includes(request.auth.token.email)) {
        throw new https_1.HttpsError('permission-denied', 'Nur für Administratoren');
    }
    try {
        const passkeysSnapshot = await db.collection('passkeys').get();
        console.log(`[adminDeleteAllPasskeys] Found ${passkeysSnapshot.size} passkeys to delete`);
        const deleted = [];
        for (const doc of passkeysSnapshot.docs) {
            const data = doc.data();
            console.log(`[adminDeleteAllPasskeys] Deleting: ${doc.id} - ${data.deviceName}`);
            await doc.ref.delete();
            deleted.push(`${doc.id} (${data.deviceName})`);
        }
        // Also clean up any old challenges
        const challengesSnapshot = await db.collection('passkeysChallenges').get();
        for (const doc of challengesSnapshot.docs) {
            await doc.ref.delete();
        }
        return {
            success: true,
            deletedCount: deleted.length,
            deleted: deleted,
            message: `${deleted.length} Passkeys gelöscht. Bitte registriere einen neuen Passkey.`
        };
    }
    catch (error) {
        console.error('[adminDeleteAllPasskeys] Error:', error);
        throw new https_1.HttpsError('internal', 'Fehler beim Löschen: ' + error.message);
    }
});
/**
 * TEMPORARY: Debug function to check passkey storage
 */
exports.debugPasskeys = (0, https_1.onCall)(async (request) => {
    var _a, _b;
    const adminEmails = ['jtsky100@gmail.com', 'antonio10jonathan@yahoo.com'];
    if (!((_b = (_a = request.auth) === null || _a === void 0 ? void 0 : _a.token) === null || _b === void 0 ? void 0 : _b.email) || !adminEmails.includes(request.auth.token.email)) {
        throw new https_1.HttpsError('permission-denied', 'Nur für Administratoren');
    }
    try {
        const passkeysSnapshot = await db.collection('passkeys').get();
        const passkeys = passkeysSnapshot.docs.map(doc => {
            var _a, _b, _c, _d;
            const data = doc.data();
            return {
                docId: doc.id,
                credentialId: data.credentialId,
                credentialIdLength: (_a = data.credentialId) === null || _a === void 0 ? void 0 : _a.length,
                userId: data.userId,
                deviceName: data.deviceName,
                createdAt: (_d = (_c = (_b = data.createdAt) === null || _b === void 0 ? void 0 : _b.toDate) === null || _c === void 0 ? void 0 : _c.call(_b)) === null || _d === void 0 ? void 0 : _d.toISOString(),
            };
        });
        return {
            count: passkeys.length,
            passkeys,
            message: 'Passkeys in der Datenbank'
        };
    }
    catch (error) {
        console.error('[debugPasskeys] Error:', error);
        throw new https_1.HttpsError('internal', 'Fehler: ' + error.message);
    }
});
// ============================================
// EMAIL NOTIFICATION SYSTEM
// ============================================
// SMTP secrets (defined at the top with other secrets)
// smtpHost, smtpPort, smtpUser, smtpPass are defined above
// Email transporter configuration
const getEmailTransporter = () => {
    return nodemailer.createTransport({
        host: smtpHost.value() || 'mail.privateemail.com',
        port: parseInt(smtpPort.value() || '465'),
        secure: true,
        auth: {
            user: smtpUser.value() || 'support@nexo.report',
            pass: smtpPass.value() || '',
        },
    });
};
// Send 2FA Activation Notification Email
exports.send2FAActivationEmail = (0, https_1.onCall)({ secrets: [smtpHost, smtpPort, smtpUser, smtpPass], enforceAppCheck: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { displayName, email, language = 'en' } = request.data;
    if (!email) {
        throw new https_1.HttpsError('invalid-argument', 'Email is required');
    }
    try {
        const transporter = getEmailTransporter();
        // Check if SMTP is configured
        if (!smtpPass.value()) {
            console.log('[send2FAActivationEmail] SMTP not configured, skipping email');
            return { success: true, skipped: true, message: 'SMTP not configured' };
        }
        const userName = displayName || 'User';
        // Email template helper
        const createActivationTemplate = (greeting, mainText, secureText, codeText, warningText, regards, team) => `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a1a; margin-bottom: 24px;">${greeting} ${userName},</h2>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">${mainText}</p>
        <div style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <p style="color: #166534; margin: 0; font-weight: 500;">✓ ${secureText}</p>
        </div>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">${codeText}</p>
        <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 24px;">${warningText}</p>
        <br>
        <p style="color: #333;">${regards}</p>
        <p style="color: #333; font-weight: 500;">${team}</p>
      </div>
    `;
        // Multi-language email templates (de, en, es, nl, it, fr)
        const templates = {
            en: {
                subject: '2FA Successfully Activated for Your Nexo Account',
                body: createActivationTemplate('Hello', 'Two-Factor Authentication (2FA) has been successfully activated for your <strong>Nexo</strong> account.', 'Your account is now more secure', 'From now on, you\'ll need to enter a 6-digit code from your authenticator app when logging in.', 'If you didn\'t activate 2FA, please contact us immediately or disable 2FA in your account settings.', 'Best regards,', 'The Nexo Team'),
            },
            de: {
                subject: '2FA erfolgreich aktiviert für Ihr Nexo-Konto',
                body: createActivationTemplate('Hallo', 'Die Zwei-Faktor-Authentifizierung (2FA) wurde erfolgreich für Ihr <strong>Nexo</strong>-Konto aktiviert.', 'Ihr Konto ist jetzt sicherer', 'Ab sofort müssen Sie beim Anmelden einen 6-stelligen Code aus Ihrer Authenticator-App eingeben.', 'Falls Sie 2FA nicht aktiviert haben, kontaktieren Sie uns bitte sofort oder deaktivieren Sie 2FA in Ihren Kontoeinstellungen.', 'Mit freundlichen Grüßen,', 'Ihr Nexo Team'),
            },
            es: {
                subject: '2FA activado correctamente para su cuenta Nexo',
                body: createActivationTemplate('Hola', 'La autenticación de dos factores (2FA) se ha activado correctamente para su cuenta <strong>Nexo</strong>.', 'Su cuenta ahora es más segura', 'A partir de ahora, deberá ingresar un código de 6 dígitos de su aplicación de autenticación al iniciar sesión.', 'Si no activó 2FA, contáctenos de inmediato o desactive 2FA en la configuración de su cuenta.', 'Saludos cordiales,', 'El equipo de Nexo'),
            },
            nl: {
                subject: '2FA succesvol geactiveerd voor uw Nexo-account',
                body: createActivationTemplate('Hallo', 'Twee-factor-authenticatie (2FA) is succesvol geactiveerd voor uw <strong>Nexo</strong>-account.', 'Uw account is nu veiliger', 'Vanaf nu moet u bij het inloggen een 6-cijferige code uit uw authenticator-app invoeren.', 'Als u 2FA niet heeft geactiveerd, neem dan onmiddellijk contact met ons op of schakel 2FA uit in uw accountinstellingen.', 'Met vriendelijke groeten,', 'Het Nexo Team'),
            },
            it: {
                subject: '2FA attivato con successo per il tuo account Nexo',
                body: createActivationTemplate('Ciao', 'L\'autenticazione a due fattori (2FA) è stata attivata con successo per il tuo account <strong>Nexo</strong>.', 'Il tuo account è ora più sicuro', 'D\'ora in poi, dovrai inserire un codice a 6 cifre dalla tua app di autenticazione quando effettui l\'accesso.', 'Se non hai attivato la 2FA, contattaci immediatamente o disattiva la 2FA nelle impostazioni del tuo account.', 'Cordiali saluti,', 'Il Team Nexo'),
            },
            fr: {
                subject: '2FA activé avec succès pour votre compte Nexo',
                body: createActivationTemplate('Bonjour', 'L\'authentification à deux facteurs (2FA) a été activée avec succès pour votre compte <strong>Nexo</strong>.', 'Votre compte est maintenant plus sécurisé', 'Désormais, vous devrez saisir un code à 6 chiffres de votre application d\'authentification lors de la connexion.', 'Si vous n\'avez pas activé la 2FA, veuillez nous contacter immédiatement ou désactiver la 2FA dans les paramètres de votre compte.', 'Cordialement,', 'L\'équipe Nexo'),
            },
        };
        const template = templates[language] || templates.en;
        await transporter.sendMail({
            from: `"Nexo" <${smtpUser.value() || 'support@nexo.report'}>`,
            to: email,
            subject: template.subject,
            html: template.body,
        });
        console.log(`[send2FAActivationEmail] Email sent to ${email} (language: ${language})`);
        return { success: true, message: 'Email sent successfully' };
    }
    catch (error) {
        console.error('[send2FAActivationEmail] Error:', error);
        // Don't fail the request if email fails - it's not critical
        return { success: false, error: error.message };
    }
});
// Send 2FA Deactivation Notification Email
exports.send2FADeactivationEmail = (0, https_1.onCall)({ secrets: [smtpHost, smtpPort, smtpUser, smtpPass], enforceAppCheck: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { displayName, email, language = 'en' } = request.data;
    if (!email) {
        throw new https_1.HttpsError('invalid-argument', 'Email is required');
    }
    try {
        const transporter = getEmailTransporter();
        if (!smtpPass.value()) {
            console.log('[send2FADeactivationEmail] SMTP not configured, skipping email');
            return { success: true, skipped: true, message: 'SMTP not configured' };
        }
        const userName = displayName || 'User';
        // Email template helper for deactivation
        const createDeactivationTemplate = (greeting, mainText, warningText, recommendText, securityText, regards, team) => `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a1a; margin-bottom: 24px;">${greeting} ${userName},</h2>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">${mainText}</p>
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <p style="color: #991b1b; margin: 0; font-weight: 500;">⚠ ${warningText}</p>
        </div>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">${recommendText}</p>
        <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 24px;">${securityText}</p>
        <br>
        <p style="color: #333;">${regards}</p>
        <p style="color: #333; font-weight: 500;">${team}</p>
      </div>
    `;
        const templates = {
            en: {
                subject: '2FA Deactivated for Your Nexo Account',
                body: createDeactivationTemplate('Hello', 'Two-Factor Authentication (2FA) has been deactivated for your <strong>Nexo</strong> account.', 'Your account is now less secure', 'We recommend re-enabling 2FA for enhanced security.', 'If you didn\'t deactivate 2FA, please secure your account immediately by changing your password and re-enabling 2FA.', 'Best regards,', 'The Nexo Team'),
            },
            de: {
                subject: '2FA deaktiviert für Ihr Nexo-Konto',
                body: createDeactivationTemplate('Hallo', 'Die Zwei-Faktor-Authentifizierung (2FA) wurde für Ihr <strong>Nexo</strong>-Konto deaktiviert.', 'Ihr Konto ist jetzt weniger sicher', 'Wir empfehlen, 2FA für erhöhte Sicherheit wieder zu aktivieren.', 'Falls Sie 2FA nicht deaktiviert haben, sichern Sie bitte sofort Ihr Konto, indem Sie Ihr Passwort ändern und 2FA wieder aktivieren.', 'Mit freundlichen Grüßen,', 'Ihr Nexo Team'),
            },
            es: {
                subject: '2FA desactivado para su cuenta Nexo',
                body: createDeactivationTemplate('Hola', 'La autenticación de dos factores (2FA) ha sido desactivada para su cuenta <strong>Nexo</strong>.', 'Su cuenta ahora es menos segura', 'Le recomendamos volver a activar 2FA para mayor seguridad.', 'Si no desactivó 2FA, proteja su cuenta inmediatamente cambiando su contraseña y volviendo a activar 2FA.', 'Saludos cordiales,', 'El equipo de Nexo'),
            },
            nl: {
                subject: '2FA gedeactiveerd voor uw Nexo-account',
                body: createDeactivationTemplate('Hallo', 'Twee-factor-authenticatie (2FA) is gedeactiveerd voor uw <strong>Nexo</strong>-account.', 'Uw account is nu minder veilig', 'Wij raden aan om 2FA opnieuw in te schakelen voor verbeterde beveiliging.', 'Als u 2FA niet heeft gedeactiveerd, beveilig dan onmiddellijk uw account door uw wachtwoord te wijzigen en 2FA opnieuw in te schakelen.', 'Met vriendelijke groeten,', 'Het Nexo Team'),
            },
            it: {
                subject: '2FA disattivato per il tuo account Nexo',
                body: createDeactivationTemplate('Ciao', 'L\'autenticazione a due fattori (2FA) è stata disattivata per il tuo account <strong>Nexo</strong>.', 'Il tuo account è ora meno sicuro', 'Ti consigliamo di riattivare la 2FA per una maggiore sicurezza.', 'Se non hai disattivato la 2FA, proteggi immediatamente il tuo account cambiando la password e riattivando la 2FA.', 'Cordiali saluti,', 'Il Team Nexo'),
            },
            fr: {
                subject: '2FA désactivé pour votre compte Nexo',
                body: createDeactivationTemplate('Bonjour', 'L\'authentification à deux facteurs (2FA) a été désactivée pour votre compte <strong>Nexo</strong>.', 'Votre compte est maintenant moins sécurisé', 'Nous vous recommandons de réactiver la 2FA pour une sécurité renforcée.', 'Si vous n\'avez pas désactivé la 2FA, sécurisez immédiatement votre compte en changeant votre mot de passe et en réactivant la 2FA.', 'Cordialement,', 'L\'équipe Nexo'),
            },
        };
        const template = templates[language] || templates.en;
        await transporter.sendMail({
            from: `"Nexo" <${smtpUser.value() || 'support@nexo.report'}>`,
            to: email,
            subject: template.subject,
            html: template.body,
        });
        console.log(`[send2FADeactivationEmail] Email sent to ${email}`);
        return { success: true, message: 'Email sent successfully' };
    }
    catch (error) {
        console.error('[send2FADeactivationEmail] Error:', error);
        return { success: false, error: error.message };
    }
});
// Check if phone number is already registered
// This function can be called without authentication (for login page)
exports.checkPhoneNumberExists = (0, https_1.onCall)(async (request) => {
    const { phoneNumber } = request.data;
    if (!phoneNumber || typeof phoneNumber !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'Phone number is required');
    }
    try {
        // Remove all non-digit characters except +
        const cleanedPhone = phoneNumber.replace(/[^\d+]/g, '');
        // Check if phone number exists in Firestore (stored when user adds phone number)
        const phoneDoc = await db.collection('phoneNumbers').doc(cleanedPhone).get();
        if (phoneDoc.exists) {
            const phoneData = phoneDoc.data();
            const userId = (phoneData === null || phoneData === void 0 ? void 0 : phoneData.userId) || null;
            // If user is authenticated, check if it belongs to them
            if (request.auth && userId === request.auth.uid) {
                return {
                    exists: true,
                    ownNumber: true,
                    userId: userId,
                    message: 'This phone number is already registered to your account'
                };
            }
            // Phone exists but belongs to another user (don't expose userId for privacy)
            return {
                exists: true,
                ownNumber: false,
                message: 'This phone number is already registered'
            };
        }
        return { exists: false, message: 'Phone number is available' };
    }
    catch (error) {
        console.error('[checkPhoneNumberExists] Error:', error);
        throw new https_1.HttpsError('internal', 'Failed to check phone number: ' + error.message);
    }
});
// ========== AI Chat File Upload Functions ==========
// Upload File for AI Chat
exports.uploadAIChatFile = (0, https_1.onCall)({ enforceAppCheck: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { fileName, fileData, fileType } = request.data;
    if (!fileName || !fileData) {
        throw new https_1.HttpsError('invalid-argument', 'fileName and fileData are required');
    }
    try {
        // Upload file to Storage
        const bucket = storage.bucket();
        const filePath = `ai-chat/${userId}/${Date.now()}_${fileName}`;
        const file = bucket.file(filePath);
        // Decode base64 and upload
        const buffer = Buffer.from(fileData, 'base64');
        await file.save(buffer, {
            metadata: {
                contentType: fileType || 'application/octet-stream',
            },
        });
        // Get download URL
        const [url] = await file.getSignedUrl({
            action: 'read',
            expires: '03-01-2500',
        });
        return {
            fileUrl: url,
            fileName,
            filePath,
        };
    }
    catch (error) {
        throw new https_1.HttpsError('internal', 'File upload failed: ' + (error.message || 'Unknown error'));
    }
});
// Upload Image for AI Chat
exports.uploadAIChatImage = (0, https_1.onCall)({ enforceAppCheck: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { fileName, fileData, fileType } = request.data;
    if (!fileName || !fileData) {
        throw new https_1.HttpsError('invalid-argument', 'fileName and fileData are required');
    }
    // Validate image type
    if (!(fileType === null || fileType === void 0 ? void 0 : fileType.startsWith('image/'))) {
        throw new https_1.HttpsError('invalid-argument', 'File must be an image');
    }
    try {
        // Upload image to Storage
        const bucket = storage.bucket();
        const filePath = `ai-chat/${userId}/images/${Date.now()}_${fileName}`;
        const file = bucket.file(filePath);
        // Decode base64 and upload
        const buffer = Buffer.from(fileData, 'base64');
        await file.save(buffer, {
            metadata: {
                contentType: fileType,
            },
        });
        // Get download URL
        const [url] = await file.getSignedUrl({
            action: 'read',
            expires: '03-01-2500',
        });
        return {
            imageUrl: url,
            fileName,
            filePath,
        };
    }
    catch (error) {
        throw new https_1.HttpsError('internal', 'Image upload failed: ' + (error.message || 'Unknown error'));
    }
});
// Transcribe Audio for AI Chat
exports.transcribeAIChatAudio = (0, https_1.onCall)({ enforceAppCheck: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { audioData, mimeType } = request.data;
    if (!audioData) {
        throw new https_1.HttpsError('invalid-argument', 'audioData is required');
    }
    try {
        // Upload audio to Storage first
        const bucket = storage.bucket();
        const filePath = `ai-chat/${userId}/audio/${Date.now()}_recording.webm`;
        const file = bucket.file(filePath);
        // Decode base64 and upload
        const buffer = Buffer.from(audioData, 'base64');
        await file.save(buffer, {
            metadata: {
                contentType: mimeType || 'audio/webm',
            },
        });
        // Transcribe using Google Speech-to-Text API
        try {
            const { SpeechClient } = await Promise.resolve().then(() => __importStar(require('@google-cloud/speech')));
            const speechClient = new SpeechClient();
            // Determine encoding and sample rate from mimeType
            // WebM typically uses opus codec
            const audioConfig = {
                encoding: 'WEBM_OPUS',
                sampleRateHertz: 48000, // Common for WebM Opus
                languageCode: 'de-CH', // Default to Swiss German
                alternativeLanguageCodes: ['de-DE', 'en-US', 'fr-CH', 'it-CH'], // Support multiple languages
                enableAutomaticPunctuation: true,
                model: 'latest_long', // Use latest long-form model for better accuracy
            };
            // If mimeType suggests different format, adjust
            if (mimeType === null || mimeType === void 0 ? void 0 : mimeType.includes('wav')) {
                audioConfig.encoding = 'LINEAR16';
                audioConfig.sampleRateHertz = 16000;
            }
            else if ((mimeType === null || mimeType === void 0 ? void 0 : mimeType.includes('mp3')) || (mimeType === null || mimeType === void 0 ? void 0 : mimeType.includes('mpeg'))) {
                audioConfig.encoding = 'MP3';
            }
            // Perform transcription
            const [response] = await speechClient.recognize({
                config: audioConfig,
                audio: {
                    content: buffer.toString('base64'),
                },
            });
            // Extract transcription from response
            let transcription = '';
            if (response.results && response.results.length > 0) {
                const result = response.results[0];
                if (result.alternatives && result.alternatives.length > 0) {
                    transcription = result.alternatives[0].transcript || '';
                }
            }
            // If no transcription found, try with different settings
            if (!transcription || transcription.trim().length === 0) {
                console.log('[transcribeAIChatAudio] No transcription result, trying with auto-detect encoding');
                // Try with auto-detect encoding
                const autoConfig = Object.assign(Object.assign({}, audioConfig), { encoding: 'WEBM_OPUS' });
                const [autoResponse] = await speechClient.recognize({
                    config: autoConfig,
                    audio: {
                        content: buffer.toString('base64'),
                    },
                });
                if (autoResponse.results && autoResponse.results.length > 0) {
                    const result = autoResponse.results[0];
                    if (result.alternatives && result.alternatives.length > 0) {
                        transcription = result.alternatives[0].transcript || '';
                    }
                }
            }
            return {
                transcription: transcription || '',
                audioUrl: filePath,
                success: transcription.length > 0,
            };
        }
        catch (speechError) {
            console.error('[transcribeAIChatAudio] Speech-to-Text error:', speechError);
            // Fallback: return empty transcription but still provide audio URL
            return {
                transcription: '',
                audioUrl: filePath,
                success: false,
                error: speechError.message,
            };
        }
    }
    catch (error) {
        console.error('[transcribeAIChatAudio] General error:', error);
        throw new https_1.HttpsError('internal', 'Audio transcription failed: ' + (error.message || 'Unknown error'));
    }
});
// Export tRPC function
var trpc_1 = require("./trpc");
Object.defineProperty(exports, "trpc", { enumerable: true, get: function () { return trpc_1.trpc; } });
//# sourceMappingURL=index.js.map