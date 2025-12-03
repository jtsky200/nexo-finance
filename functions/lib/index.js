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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBudget = exports.updateBudget = exports.createBudget = exports.getBudgets = exports.processRecurringInvoices = exports.processRecurringEntries = exports.markShoppingItemAsBought = exports.deleteShoppingItem = exports.updateShoppingItem = exports.createShoppingItem = exports.getShoppingList = exports.getCalendarEvents = exports.getAllBills = exports.deleteInvoice = exports.updateInvoiceStatus = exports.updateInvoice = exports.createInvoice = exports.getPersonInvoices = exports.getPersonDebts = exports.deletePerson = exports.updatePerson = exports.createPerson = exports.getPeople = exports.updateUserPreferences = exports.deleteTaxProfile = exports.updateTaxProfile = exports.createTaxProfile = exports.getTaxProfileByYear = exports.getTaxProfiles = exports.deleteFinanceEntry = exports.updateFinanceEntry = exports.createFinanceEntry = exports.getFinanceEntries = exports.deleteReminder = exports.updateReminder = exports.createReminder = exports.getReminders = void 0;
const https_1 = require("firebase-functions/v2/https");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
const db = admin.firestore();
// ========== Reminders Functions ==========
exports.getReminders = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { startDate, endDate, status } = request.data;
    let query = db.collection('reminders').where('userId', '==', userId);
    if (startDate) {
        query = query.where('dueDate', '>=', admin.firestore.Timestamp.fromDate(new Date(startDate)));
    }
    if (endDate) {
        query = query.where('dueDate', '<=', admin.firestore.Timestamp.fromDate(new Date(endDate)));
    }
    if (status) {
        query = query.where('status', '==', status);
    }
    const snapshot = await query.orderBy('dueDate').get();
    const reminders = snapshot.docs.map(doc => {
        const data = doc.data();
        // Convert Firestore Timestamps to ISO strings for proper serialization
        const reminder = Object.assign({ id: doc.id }, data);
        if (data.dueDate && typeof data.dueDate.toDate === 'function') {
            reminder.dueDate = data.dueDate.toDate().toISOString();
        }
        if (data.createdAt && typeof data.createdAt.toDate === 'function') {
            reminder.createdAt = data.createdAt.toDate().toISOString();
        }
        if (data.updatedAt && typeof data.updatedAt.toDate === 'function') {
            reminder.updatedAt = data.updatedAt.toDate().toISOString();
        }
        return reminder;
    });
    return { reminders };
});
exports.createReminder = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { title, type, dueDate, isAllDay, amount, currency, notes, recurrenceRule } = request.data;
    const reminderData = {
        userId,
        title,
        type,
        dueDate: admin.firestore.Timestamp.fromDate(new Date(dueDate)),
        isAllDay: isAllDay || false,
        amount: amount || null,
        currency: currency || null,
        notes: notes || null,
        recurrenceRule: recurrenceRule || null,
        status: 'offen',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const docRef = await db.collection('reminders').add(reminderData);
    return Object.assign({ id: docRef.id }, reminderData);
});
exports.updateReminder = (0, https_1.onCall)(async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const _b = request.data, { id } = _b, updateData = __rest(_b, ["id"]);
    const docRef = db.collection('reminders').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
        throw new https_1.HttpsError('not-found', 'Reminder not found');
    }
    if (((_a = doc.data()) === null || _a === void 0 ? void 0 : _a.userId) !== userId) {
        throw new https_1.HttpsError('permission-denied', 'Not authorized');
    }
    if (updateData.dueDate) {
        updateData.dueDate = admin.firestore.Timestamp.fromDate(new Date(updateData.dueDate));
    }
    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    await docRef.update(updateData);
    return { success: true };
});
exports.deleteReminder = (0, https_1.onCall)(async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { id } = request.data;
    const docRef = db.collection('reminders').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
        throw new https_1.HttpsError('not-found', 'Reminder not found');
    }
    if (((_a = doc.data()) === null || _a === void 0 ? void 0 : _a.userId) !== userId) {
        throw new https_1.HttpsError('permission-denied', 'Not authorized');
    }
    await docRef.delete();
    return { success: true };
});
// ========== Finance Functions ==========
exports.getFinanceEntries = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { startDate, endDate, type } = request.data;
    let query = db.collection('financeEntries').where('userId', '==', userId);
    if (startDate) {
        query = query.where('date', '>=', admin.firestore.Timestamp.fromDate(new Date(startDate)));
    }
    if (endDate) {
        query = query.where('date', '<=', admin.firestore.Timestamp.fromDate(new Date(endDate)));
    }
    if (type) {
        query = query.where('type', '==', type);
    }
    const snapshot = await query.orderBy('date', 'desc').get();
    const entries = snapshot.docs.map(doc => {
        const data = doc.data();
        // Convert Firestore Timestamps to ISO strings for proper serialization
        const entry = Object.assign({ id: doc.id }, data);
        if (data.date && typeof data.date.toDate === 'function') {
            entry.date = data.date.toDate().toISOString();
        }
        if (data.createdAt && typeof data.createdAt.toDate === 'function') {
            entry.createdAt = data.createdAt.toDate().toISOString();
        }
        if (data.updatedAt && typeof data.updatedAt.toDate === 'function') {
            entry.updatedAt = data.updatedAt.toDate().toISOString();
        }
        return entry;
    });
    return { entries };
});
exports.createFinanceEntry = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { date, type, category, amount, currency, paymentMethod, notes, isRecurring, recurrenceRule } = request.data;
    const entryData = {
        userId,
        date: admin.firestore.Timestamp.fromDate(new Date(date)),
        type,
        category,
        amount,
        currency,
        paymentMethod: paymentMethod || null,
        notes: notes || null,
        isRecurring: isRecurring || false,
        recurrenceRule: recurrenceRule || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const docRef = await db.collection('financeEntries').add(entryData);
    return Object.assign({ id: docRef.id }, entryData);
});
exports.updateFinanceEntry = (0, https_1.onCall)(async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const _b = request.data, { id } = _b, updateData = __rest(_b, ["id"]);
    const docRef = db.collection('financeEntries').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
        throw new https_1.HttpsError('not-found', 'Entry not found');
    }
    if (((_a = doc.data()) === null || _a === void 0 ? void 0 : _a.userId) !== userId) {
        throw new https_1.HttpsError('permission-denied', 'Not authorized');
    }
    if (updateData.date) {
        updateData.date = admin.firestore.Timestamp.fromDate(new Date(updateData.date));
    }
    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    await docRef.update(updateData);
    return { success: true };
});
exports.deleteFinanceEntry = (0, https_1.onCall)(async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { id } = request.data;
    const docRef = db.collection('financeEntries').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
        throw new https_1.HttpsError('not-found', 'Entry not found');
    }
    if (((_a = doc.data()) === null || _a === void 0 ? void 0 : _a.userId) !== userId) {
        throw new https_1.HttpsError('permission-denied', 'Not authorized');
    }
    await docRef.delete();
    return { success: true };
});
// ========== Tax Profile Functions ==========
exports.getTaxProfiles = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const snapshot = await db.collection('taxProfiles')
        .where('userId', '==', userId)
        .orderBy('taxYear', 'desc')
        .get();
    const profiles = snapshot.docs.map(doc => {
        const data = doc.data();
        // Convert Firestore Timestamps to ISO strings for proper serialization
        const profile = Object.assign({ id: doc.id }, data);
        if (data.createdAt && typeof data.createdAt.toDate === 'function') {
            profile.createdAt = data.createdAt.toDate().toISOString();
        }
        if (data.updatedAt && typeof data.updatedAt.toDate === 'function') {
            profile.updatedAt = data.updatedAt.toDate().toISOString();
        }
        return profile;
    });
    return { profiles };
});
exports.getTaxProfileByYear = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { year } = request.data;
    const snapshot = await db.collection('taxProfiles')
        .where('userId', '==', userId)
        .where('taxYear', '==', year)
        .limit(1)
        .get();
    if (snapshot.empty) {
        return { profile: null };
    }
    const doc = snapshot.docs[0];
    return { profile: Object.assign({ id: doc.id }, doc.data()) };
});
exports.createTaxProfile = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { taxYear, canton, maritalStatus, numberOfChildren, grossIncome, otherIncome, deductions, notes } = request.data;
    const profileData = {
        userId,
        taxYear,
        country: 'CH',
        canton: canton || null,
        status: 'unvollständig',
        maritalStatus: maritalStatus || null,
        numberOfChildren: numberOfChildren || 0,
        grossIncome: grossIncome || null,
        otherIncome: otherIncome || null,
        deductions: deductions || null,
        notes: notes || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const docRef = await db.collection('taxProfiles').add(profileData);
    return Object.assign({ id: docRef.id }, profileData);
});
exports.updateTaxProfile = (0, https_1.onCall)(async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const _b = request.data, { id } = _b, updateData = __rest(_b, ["id"]);
    const docRef = db.collection('taxProfiles').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
        throw new https_1.HttpsError('not-found', 'Tax profile not found');
    }
    if (((_a = doc.data()) === null || _a === void 0 ? void 0 : _a.userId) !== userId) {
        throw new https_1.HttpsError('permission-denied', 'Not authorized');
    }
    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    await docRef.update(updateData);
    return { success: true };
});
exports.deleteTaxProfile = (0, https_1.onCall)(async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { id } = request.data;
    const docRef = db.collection('taxProfiles').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
        throw new https_1.HttpsError('not-found', 'Tax profile not found');
    }
    if (((_a = doc.data()) === null || _a === void 0 ? void 0 : _a.userId) !== userId) {
        throw new https_1.HttpsError('permission-denied', 'Not authorized');
    }
    await docRef.delete();
    return { success: true };
});
// ========== User Functions ==========
exports.updateUserPreferences = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { locale, defaultCurrency, canton } = request.data;
    const updateData = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (locale)
        updateData.locale = locale;
    if (defaultCurrency)
        updateData.defaultCurrency = defaultCurrency;
    if (canton)
        updateData.canton = canton;
    await db.collection('users').doc(userId).set(updateData, { merge: true });
    return { success: true };
});
// ========== People Functions ==========
exports.getPeople = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const snapshot = await db.collection('people').where('userId', '==', userId).orderBy('name').get();
    // Get people with their invoices
    const people = await Promise.all(snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const person = Object.assign({ id: doc.id }, data);
        // Convert Firestore Timestamps to ISO strings
        if (data.createdAt && typeof data.createdAt.toDate === 'function') {
            person.createdAt = data.createdAt.toDate().toISOString();
        }
        if (data.updatedAt && typeof data.updatedAt.toDate === 'function') {
            person.updatedAt = data.updatedAt.toDate().toISOString();
        }
        // Load invoices for this person
        const invoicesSnapshot = await db.collection('people').doc(doc.id).collection('invoices').get();
        person.invoices = invoicesSnapshot.docs.map(invDoc => {
            const invData = invDoc.data();
            const invoice = Object.assign({ id: invDoc.id }, invData);
            if (invData.date && typeof invData.date.toDate === 'function') {
                invoice.date = invData.date.toDate().toISOString();
            }
            if (invData.createdAt && typeof invData.createdAt.toDate === 'function') {
                invoice.createdAt = invData.createdAt.toDate().toISOString();
            }
            return invoice;
        });
        return person;
    }));
    return { people };
});
exports.createPerson = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { name, email, phone, currency, type, relationship, notes } = request.data;
    // type: "household" (Haushaltsmitglied) | "external" (Externe Person)
    // relationship (nur für external): "creditor" (Ich schulde) | "debtor" (Schuldet mir) | "both"
    const personData = {
        userId,
        name,
        email: email || null,
        phone: phone || null,
        type: type || 'household', // Default: Haushaltsmitglied
        relationship: type === 'external' ? (relationship || 'both') : null,
        notes: notes || null,
        totalOwed: 0,
        currency: currency || 'CHF',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const docRef = await db.collection('people').add(personData);
    return Object.assign({ id: docRef.id }, personData);
});
exports.updatePerson = (0, https_1.onCall)(async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { personId, name, email, phone, type, relationship, notes } = request.data;
    const personRef = db.collection('people').doc(personId);
    const personDoc = await personRef.get();
    if (!personDoc.exists || ((_a = personDoc.data()) === null || _a === void 0 ? void 0 : _a.userId) !== userId) {
        throw new https_1.HttpsError('permission-denied', 'Not authorized to update this person');
    }
    const updateData = {
        name,
        email: email || null,
        phone: phone || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    // Only update type/relationship/notes if provided
    if (type !== undefined) {
        updateData.type = type;
        updateData.relationship = type === 'external' ? (relationship || 'both') : null;
    }
    if (notes !== undefined) {
        updateData.notes = notes;
    }
    await personRef.update(updateData);
    return { success: true };
});
exports.deletePerson = (0, https_1.onCall)(async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { personId } = request.data;
    const personRef = db.collection('people').doc(personId);
    const personDoc = await personRef.get();
    if (!personDoc.exists || ((_a = personDoc.data()) === null || _a === void 0 ? void 0 : _a.userId) !== userId) {
        throw new https_1.HttpsError('permission-denied', 'Not authorized to delete this person');
    }
    // Delete all invoices for this person
    const invoicesSnapshot = await db.collection('people').doc(personId).collection('invoices').get();
    const batch = db.batch();
    invoicesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
    // Delete the person
    await personRef.delete();
    return { success: true };
});
exports.getPersonDebts = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { personId } = request.data;
    const snapshot = await db.collection('financeEntries')
        .where('userId', '==', userId)
        .where('personId', '==', personId)
        .orderBy('date', 'desc')
        .get();
    const debts = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
    return { debts };
});
// ========== Invoice Functions ==========
exports.getPersonInvoices = (0, https_1.onCall)(async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { personId } = request.data;
    // Verify person belongs to user
    const personRef = db.collection('people').doc(personId);
    const personDoc = await personRef.get();
    if (!personDoc.exists || ((_a = personDoc.data()) === null || _a === void 0 ? void 0 : _a.userId) !== userId) {
        throw new https_1.HttpsError('permission-denied', 'Not authorized to access this person');
    }
    const snapshot = await personRef.collection('invoices').orderBy('date', 'desc').get();
    const invoices = snapshot.docs.map(doc => {
        const data = doc.data();
        // Convert Firestore Timestamps to ISO strings for proper serialization
        const invoice = Object.assign({ id: doc.id }, data);
        if (data.date && typeof data.date.toDate === 'function') {
            invoice.date = data.date.toDate().toISOString();
        }
        if (data.createdAt && typeof data.createdAt.toDate === 'function') {
            invoice.createdAt = data.createdAt.toDate().toISOString();
        }
        if (data.updatedAt && typeof data.updatedAt.toDate === 'function') {
            invoice.updatedAt = data.updatedAt.toDate().toISOString();
        }
        return invoice;
    });
    return { invoices };
});
exports.createInvoice = (0, https_1.onCall)(async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { personId, amount, description, date, status, direction, dueDate, reminderDate, reminderEnabled, notes, isRecurring, recurringInterval } = request.data;
    // Verify person belongs to user
    const personRef = db.collection('people').doc(personId);
    const personDoc = await personRef.get();
    if (!personDoc.exists || ((_a = personDoc.data()) === null || _a === void 0 ? void 0 : _a.userId) !== userId) {
        throw new https_1.HttpsError('permission-denied', 'Not authorized to access this person');
    }
    // direction: "incoming" (Person schuldet mir) | "outgoing" (Ich schulde Person)
    const personData = personDoc.data();
    const invoiceDirection = direction || ((personData === null || personData === void 0 ? void 0 : personData.type) === 'external' ? 'incoming' : 'outgoing');
    const invoiceData = {
        amount,
        description,
        date: admin.firestore.Timestamp.fromDate(new Date(date)),
        status: status || 'open',
        direction: invoiceDirection,
        notes: notes || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    // Add due date if provided
    if (dueDate) {
        invoiceData.dueDate = admin.firestore.Timestamp.fromDate(new Date(dueDate));
    }
    // Add reminder if enabled
    if (reminderEnabled && reminderDate) {
        invoiceData.reminderEnabled = true;
        invoiceData.reminderDate = admin.firestore.Timestamp.fromDate(new Date(reminderDate));
    }
    // Add recurring settings
    if (isRecurring && recurringInterval) {
        invoiceData.isRecurring = true;
        invoiceData.recurringInterval = recurringInterval;
        // Calculate next due date based on interval
        if (dueDate) {
            const nextDue = new Date(dueDate);
            switch (recurringInterval) {
                case 'weekly':
                    nextDue.setDate(nextDue.getDate() + 7);
                    break;
                case 'monthly':
                    nextDue.setMonth(nextDue.getMonth() + 1);
                    break;
                case 'quarterly':
                    nextDue.setMonth(nextDue.getMonth() + 3);
                    break;
                case 'yearly':
                    nextDue.setFullYear(nextDue.getFullYear() + 1);
                    break;
            }
            invoiceData.nextDueDate = admin.firestore.Timestamp.fromDate(nextDue);
        }
    }
    const docRef = await personRef.collection('invoices').add(invoiceData);
    // Update person's totalOwed if status is open or postponed
    if (status === 'open' || status === 'postponed') {
        await personRef.update({
            totalOwed: admin.firestore.FieldValue.increment(amount),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    return Object.assign({ id: docRef.id }, invoiceData);
});
exports.updateInvoice = (0, https_1.onCall)(async (request) => {
    var _a, _b;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { personId, invoiceId, amount, description, date, dueDate, reminderDate, reminderEnabled, notes, isRecurring, recurringInterval } = request.data;
    // Verify person belongs to user
    const personRef = db.collection('people').doc(personId);
    const personDoc = await personRef.get();
    if (!personDoc.exists || ((_a = personDoc.data()) === null || _a === void 0 ? void 0 : _a.userId) !== userId) {
        throw new https_1.HttpsError('permission-denied', 'Not authorized to access this person');
    }
    const invoiceRef = personRef.collection('invoices').doc(invoiceId);
    const invoiceDoc = await invoiceRef.get();
    if (!invoiceDoc.exists) {
        throw new https_1.HttpsError('not-found', 'Invoice not found');
    }
    const oldInvoiceData = invoiceDoc.data();
    const oldAmount = (oldInvoiceData === null || oldInvoiceData === void 0 ? void 0 : oldInvoiceData.amount) || 0;
    const oldStatus = oldInvoiceData === null || oldInvoiceData === void 0 ? void 0 : oldInvoiceData.status;
    const updateData = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (description !== undefined)
        updateData.description = description;
    if (date !== undefined)
        updateData.date = admin.firestore.Timestamp.fromDate(new Date(date));
    if (notes !== undefined)
        updateData.notes = notes;
    // Handle due date
    if (dueDate !== undefined) {
        updateData.dueDate = dueDate ? admin.firestore.Timestamp.fromDate(new Date(dueDate)) : null;
    }
    // Handle reminder
    if (reminderEnabled !== undefined) {
        updateData.reminderEnabled = reminderEnabled;
        if (reminderEnabled && reminderDate) {
            updateData.reminderDate = admin.firestore.Timestamp.fromDate(new Date(reminderDate));
        }
        else if (!reminderEnabled) {
            updateData.reminderDate = null;
        }
    }
    // Handle recurring settings
    if (isRecurring !== undefined) {
        updateData.isRecurring = isRecurring;
        if (isRecurring && recurringInterval) {
            updateData.recurringInterval = recurringInterval;
            // Calculate next due date if due date is set
            const effectiveDueDate = dueDate || ((_b = oldInvoiceData === null || oldInvoiceData === void 0 ? void 0 : oldInvoiceData.dueDate) === null || _b === void 0 ? void 0 : _b.toDate());
            if (effectiveDueDate) {
                const nextDue = new Date(effectiveDueDate);
                switch (recurringInterval) {
                    case 'weekly':
                        nextDue.setDate(nextDue.getDate() + 7);
                        break;
                    case 'monthly':
                        nextDue.setMonth(nextDue.getMonth() + 1);
                        break;
                    case 'quarterly':
                        nextDue.setMonth(nextDue.getMonth() + 3);
                        break;
                    case 'yearly':
                        nextDue.setFullYear(nextDue.getFullYear() + 1);
                        break;
                }
                updateData.nextDueDate = admin.firestore.Timestamp.fromDate(nextDue);
            }
        }
        else if (!isRecurring) {
            updateData.recurringInterval = null;
            updateData.nextDueDate = null;
        }
    }
    // Handle amount change
    if (amount !== undefined && amount !== oldAmount) {
        updateData.amount = amount;
        // Update totalOwed if invoice is open or postponed
        if (oldStatus === 'open' || oldStatus === 'postponed') {
            const difference = amount - oldAmount;
            await personRef.update({
                totalOwed: admin.firestore.FieldValue.increment(difference),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
    }
    await invoiceRef.update(updateData);
    return { success: true };
});
exports.updateInvoiceStatus = (0, https_1.onCall)(async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { personId, invoiceId, status } = request.data;
    // Verify person belongs to user
    const personRef = db.collection('people').doc(personId);
    const personDoc = await personRef.get();
    if (!personDoc.exists || ((_a = personDoc.data()) === null || _a === void 0 ? void 0 : _a.userId) !== userId) {
        throw new https_1.HttpsError('permission-denied', 'Not authorized to access this person');
    }
    const personData = personDoc.data();
    const invoiceRef = personRef.collection('invoices').doc(invoiceId);
    const invoiceDoc = await invoiceRef.get();
    if (!invoiceDoc.exists) {
        throw new https_1.HttpsError('not-found', 'Invoice not found');
    }
    const invoiceData = invoiceDoc.data();
    const oldStatus = invoiceData === null || invoiceData === void 0 ? void 0 : invoiceData.status;
    const amount = (invoiceData === null || invoiceData === void 0 ? void 0 : invoiceData.amount) || 0;
    // Update invoice status
    await invoiceRef.update({
        status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    // Update person's totalOwed based on status change
    let totalOwedChange = 0;
    // If changing from open/postponed to paid
    if ((oldStatus === 'open' || oldStatus === 'postponed') && status === 'paid') {
        totalOwedChange = -amount;
        // Create expense entry when invoice is marked as paid
        const expenseData = {
            userId,
            type: 'ausgabe',
            category: 'Rechnung',
            amount,
            currency: (personData === null || personData === void 0 ? void 0 : personData.currency) || 'CHF',
            date: admin.firestore.Timestamp.now(),
            description: `${personData === null || personData === void 0 ? void 0 : personData.name}: ${invoiceData === null || invoiceData === void 0 ? void 0 : invoiceData.description}`,
            status: 'paid',
            personId,
            invoiceId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await db.collection('financeEntries').add(expenseData);
    }
    // If changing from paid to open/postponed
    else if (oldStatus === 'paid' && (status === 'open' || status === 'postponed')) {
        totalOwedChange = amount;
        // Delete the expense entry if it exists
        const expenseSnapshot = await db.collection('financeEntries')
            .where('userId', '==', userId)
            .where('invoiceId', '==', invoiceId)
            .get();
        const batch = db.batch();
        expenseSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    }
    // If changing between open and postponed
    else if ((oldStatus === 'open' && status === 'postponed') || (oldStatus === 'postponed' && status === 'open')) {
        totalOwedChange = 0; // No change in totalOwed
    }
    if (totalOwedChange !== 0) {
        await personRef.update({
            totalOwed: admin.firestore.FieldValue.increment(totalOwedChange),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    return { success: true };
});
exports.deleteInvoice = (0, https_1.onCall)(async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { personId, invoiceId } = request.data;
    // Verify person belongs to user
    const personRef = db.collection('people').doc(personId);
    const personDoc = await personRef.get();
    if (!personDoc.exists || ((_a = personDoc.data()) === null || _a === void 0 ? void 0 : _a.userId) !== userId) {
        throw new https_1.HttpsError('permission-denied', 'Not authorized to access this person');
    }
    const invoiceRef = personRef.collection('invoices').doc(invoiceId);
    const invoiceDoc = await invoiceRef.get();
    if (!invoiceDoc.exists) {
        throw new https_1.HttpsError('not-found', 'Invoice not found');
    }
    const invoiceData = invoiceDoc.data();
    const amount = (invoiceData === null || invoiceData === void 0 ? void 0 : invoiceData.amount) || 0;
    const status = invoiceData === null || invoiceData === void 0 ? void 0 : invoiceData.status;
    // Delete associated expense if invoice was paid
    if (status === 'paid') {
        const expenseSnapshot = await db.collection('financeEntries')
            .where('userId', '==', userId)
            .where('invoiceId', '==', invoiceId)
            .get();
        const batch = db.batch();
        expenseSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
    }
    // Update person's totalOwed if invoice was open or postponed
    if (status === 'open' || status === 'postponed') {
        await personRef.update({
            totalOwed: admin.firestore.FieldValue.increment(-amount),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    // Delete the invoice
    await invoiceRef.delete();
    return { success: true };
});
// ========== Bills Functions (All Invoices) ==========
exports.getAllBills = (0, https_1.onCall)(async (request) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const bills = [];
    // 1. Get invoices from people subcollections
    const peopleSnapshot = await db.collection('people').where('userId', '==', userId).get();
    for (const personDoc of peopleSnapshot.docs) {
        const personData = personDoc.data();
        const invoicesSnapshot = await personDoc.ref.collection('invoices').get();
        for (const invoiceDoc of invoicesSnapshot.docs) {
            const invoiceData = invoiceDoc.data();
            bills.push({
                id: invoiceDoc.id,
                source: 'person',
                personId: personDoc.id,
                personName: personData.name,
                title: invoiceData.description,
                description: invoiceData.description,
                amount: invoiceData.amount,
                currency: personData.currency || 'CHF',
                status: invoiceData.status,
                direction: invoiceData.direction || 'incoming',
                dueDate: ((_a = invoiceData.dueDate) === null || _a === void 0 ? void 0 : _a.toDate) ? invoiceData.dueDate.toDate().toISOString() : null,
                reminderDate: ((_b = invoiceData.reminderDate) === null || _b === void 0 ? void 0 : _b.toDate) ? invoiceData.reminderDate.toDate().toISOString() : null,
                reminderEnabled: invoiceData.reminderEnabled || false,
                isRecurring: invoiceData.isRecurring || false,
                recurringInterval: invoiceData.recurringInterval,
                notes: invoiceData.notes,
                date: ((_c = invoiceData.date) === null || _c === void 0 ? void 0 : _c.toDate) ? invoiceData.date.toDate().toISOString() : null,
                createdAt: ((_d = invoiceData.createdAt) === null || _d === void 0 ? void 0 : _d.toDate) ? invoiceData.createdAt.toDate().toISOString() : null,
                isOverdue: ((_e = invoiceData.dueDate) === null || _e === void 0 ? void 0 : _e.toDate) && invoiceData.dueDate.toDate() < new Date() && invoiceData.status !== 'paid',
            });
        }
    }
    // 2. Get payment reminders from reminders collection
    const remindersSnapshot = await db.collection('reminders')
        .where('userId', '==', userId)
        .where('type', '==', 'zahlung')
        .get();
    for (const reminderDoc of remindersSnapshot.docs) {
        const reminderData = reminderDoc.data();
        bills.push({
            id: reminderDoc.id,
            source: 'reminder',
            personId: null,
            personName: reminderData.creditorName || null,
            title: reminderData.title,
            description: reminderData.notes || reminderData.title,
            amount: reminderData.amount,
            currency: reminderData.currency || 'CHF',
            status: reminderData.status === 'erledigt' ? 'paid' : 'open',
            direction: 'outgoing',
            dueDate: ((_f = reminderData.dueDate) === null || _f === void 0 ? void 0 : _f.toDate) ? reminderData.dueDate.toDate().toISOString() : null,
            reminderDate: null,
            reminderEnabled: false,
            isRecurring: !!reminderData.recurrenceRule,
            recurringInterval: reminderData.recurrenceRule,
            notes: reminderData.notes,
            iban: reminderData.iban,
            reference: reminderData.reference,
            creditorName: reminderData.creditorName,
            creditorAddress: reminderData.creditorAddress,
            date: ((_g = reminderData.dueDate) === null || _g === void 0 ? void 0 : _g.toDate) ? reminderData.dueDate.toDate().toISOString() : null,
            createdAt: ((_h = reminderData.createdAt) === null || _h === void 0 ? void 0 : _h.toDate) ? reminderData.createdAt.toDate().toISOString() : null,
            isOverdue: ((_j = reminderData.dueDate) === null || _j === void 0 ? void 0 : _j.toDate) && reminderData.dueDate.toDate() < new Date() && reminderData.status !== 'erledigt',
        });
    }
    // Sort by due date (most urgent first)
    bills.sort((a, b) => {
        if (!a.dueDate)
            return 1;
        if (!b.dueDate)
            return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
    // Calculate statistics
    const stats = {
        total: bills.length,
        open: bills.filter(b => b.status === 'open').length,
        openAmount: bills.filter(b => b.status === 'open').reduce((sum, b) => sum + (b.amount || 0), 0),
        overdue: bills.filter(b => b.isOverdue).length,
        overdueAmount: bills.filter(b => b.isOverdue).reduce((sum, b) => sum + (b.amount || 0), 0),
        paid: bills.filter(b => b.status === 'paid').length,
        paidAmount: bills.filter(b => b.status === 'paid').reduce((sum, b) => sum + (b.amount || 0), 0),
    };
    return { bills, stats };
});
// ========== Calendar Functions ==========
exports.getCalendarEvents = (0, https_1.onCall)(async (request) => {
    var _a, _b, _c, _d, _e;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { startDate, endDate } = request.data;
    const events = [];
    // Get all people with their invoices
    const peopleSnapshot = await db.collection('people').where('userId', '==', userId).get();
    console.log(`Found ${peopleSnapshot.docs.length} people for user ${userId}`);
    for (const personDoc of peopleSnapshot.docs) {
        const personData = personDoc.data();
        const invoicesSnapshot = await personDoc.ref.collection('invoices').get();
        console.log(`Found ${invoicesSnapshot.docs.length} invoices for person ${personData.name}`);
        for (const invoiceDoc of invoicesSnapshot.docs) {
            const invoiceData = invoiceDoc.data();
            // Skip paid invoices
            if (invoiceData.status === 'paid')
                continue;
            // Determine the date to use (dueDate > date > createdAt)
            let eventDate = null;
            let isOverdue = false;
            if ((_a = invoiceData.dueDate) === null || _a === void 0 ? void 0 : _a.toDate) {
                eventDate = invoiceData.dueDate.toDate();
                isOverdue = eventDate < new Date();
            }
            else if ((_b = invoiceData.date) === null || _b === void 0 ? void 0 : _b.toDate) {
                eventDate = invoiceData.date.toDate();
            }
            else if ((_c = invoiceData.createdAt) === null || _c === void 0 ? void 0 : _c.toDate) {
                eventDate = invoiceData.createdAt.toDate();
            }
            // If no date found, use today
            if (!eventDate) {
                eventDate = new Date();
            }
            // Filter by date range if provided
            if (startDate && endDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                if (eventDate < start || eventDate > end) {
                    console.log(`Invoice ${invoiceData.description} filtered out (date: ${eventDate.toISOString()})`);
                    continue;
                }
            }
            console.log(`Adding invoice event: ${invoiceData.description} on ${eventDate.toISOString()}`);
            // Only add ONE event per invoice - prefer dueDate over reminderDate
            // If reminder is on the same day as due date, only show due date
            const reminderDate = invoiceData.reminderEnabled && invoiceData.reminderDate
                ? invoiceData.reminderDate.toDate()
                : null;
            const isSameDay = reminderDate && eventDate &&
                reminderDate.toDateString() === eventDate.toDateString();
            events.push({
                id: `due-${invoiceDoc.id}`,
                type: 'due',
                title: `${personData.name}: ${invoiceData.description}`,
                date: eventDate.toISOString(),
                amount: invoiceData.amount,
                status: invoiceData.status,
                direction: invoiceData.direction || 'incoming',
                personId: personDoc.id,
                personName: personData.name,
                invoiceId: invoiceDoc.id,
                isOverdue: isOverdue,
                hasDueDate: !!invoiceData.dueDate,
                hasReminder: !!reminderDate && !isSameDay,
                reminderDate: reminderDate && !isSameDay ? reminderDate.toISOString() : null,
            });
        }
    }
    // Get regular reminders (Termine & Aufgaben) - field is 'dueDate' not 'date'
    // SKIP type='zahlung' as those are already covered by person invoices
    const remindersSnapshot = await db.collection('reminders').where('userId', '==', userId).get();
    console.log(`Found ${remindersSnapshot.docs.length} reminders for user ${userId}`);
    for (const reminderDoc of remindersSnapshot.docs) {
        const reminderData = reminderDoc.data();
        // Skip payment reminders - they are already shown via person invoices
        if (reminderData.type === 'zahlung') {
            console.log(`Skipping payment reminder ${reminderDoc.id} - covered by person invoices`);
            continue;
        }
        let reminderDate;
        // Handle different date formats - reminders use 'dueDate' field
        if ((_d = reminderData.dueDate) === null || _d === void 0 ? void 0 : _d.toDate) {
            reminderDate = reminderData.dueDate.toDate();
        }
        else if (reminderData.dueDate) {
            reminderDate = new Date(reminderData.dueDate);
        }
        else if ((_e = reminderData.date) === null || _e === void 0 ? void 0 : _e.toDate) {
            // Fallback to 'date' field if exists
            reminderDate = reminderData.date.toDate();
        }
        else if (reminderData.date) {
            reminderDate = new Date(reminderData.date);
        }
        else {
            console.log(`Reminder ${reminderDoc.id} has no date/dueDate, skipping`);
            continue;
        }
        console.log(`Reminder ${reminderDoc.id}: ${reminderData.title} at ${reminderDate.toISOString()}`);
        // Filter by date range if provided - but be more lenient
        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            const reminderDateOnly = new Date(reminderDate);
            reminderDateOnly.setHours(12, 0, 0, 0);
            if (reminderDateOnly < start || reminderDateOnly > end) {
                console.log(`  -> Filtered out (outside range ${start.toISOString()} - ${end.toISOString()})`);
                continue;
            }
        }
        // Extract time if available
        const hours = reminderDate.getHours();
        const minutes = reminderDate.getMinutes();
        const timeStr = (hours > 0 || minutes > 0) ?
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}` : undefined;
        events.push({
            id: `appointment-${reminderDoc.id}`,
            type: 'appointment',
            title: reminderData.title,
            date: reminderDate.toISOString(),
            time: timeStr,
            description: reminderData.notes || reminderData.description,
            category: reminderData.type, // termin, aufgabe
            priority: reminderData.priority,
            completed: reminderData.status === 'erledigt',
        });
    }
    console.log(`Total events: ${events.length}`);
    // Sort by date
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return { events };
});
// ========== Shopping List Functions ==========
exports.getShoppingList = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { status } = request.data;
    let query = db.collection('shoppingList').where('userId', '==', userId);
    if (status) {
        query = query.where('status', '==', status);
    }
    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const items = snapshot.docs.map(doc => {
        const data = doc.data();
        // Convert Firestore Timestamps to ISO strings for proper serialization
        const item = Object.assign({ id: doc.id }, data);
        if (data.boughtAt && typeof data.boughtAt.toDate === 'function') {
            item.boughtAt = data.boughtAt.toDate().toISOString();
        }
        if (data.createdAt && typeof data.createdAt.toDate === 'function') {
            item.createdAt = data.createdAt.toDate().toISOString();
        }
        if (data.updatedAt && typeof data.updatedAt.toDate === 'function') {
            item.updatedAt = data.updatedAt.toDate().toISOString();
        }
        return item;
    });
    return { items };
});
exports.createShoppingItem = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { item, quantity, unit, category, estimatedPrice, currency } = request.data;
    const itemData = {
        userId,
        item,
        quantity: quantity || 1,
        unit: unit || null,
        category: category || 'Sonstiges',
        estimatedPrice: estimatedPrice || 0,
        actualPrice: null,
        currency: currency || 'CHF',
        status: 'not_bought',
        boughtAt: null,
        linkedExpenseId: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const docRef = await db.collection('shoppingList').add(itemData);
    return Object.assign({ id: docRef.id }, itemData);
});
exports.updateShoppingItem = (0, https_1.onCall)(async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { itemId, item, quantity, unit, category, estimatedPrice, actualPrice, status } = request.data;
    const itemRef = db.collection('shoppingList').doc(itemId);
    const itemDoc = await itemRef.get();
    if (!itemDoc.exists || ((_a = itemDoc.data()) === null || _a === void 0 ? void 0 : _a.userId) !== userId) {
        throw new https_1.HttpsError('permission-denied', 'Not authorized to update this item');
    }
    const updateData = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (item !== undefined)
        updateData.item = item;
    if (quantity !== undefined)
        updateData.quantity = quantity;
    if (unit !== undefined)
        updateData.unit = unit;
    if (category !== undefined)
        updateData.category = category;
    if (estimatedPrice !== undefined)
        updateData.estimatedPrice = estimatedPrice;
    if (actualPrice !== undefined)
        updateData.actualPrice = actualPrice;
    if (status !== undefined) {
        updateData.status = status;
        if (status === 'bought') {
            updateData.boughtAt = admin.firestore.FieldValue.serverTimestamp();
        }
    }
    await itemRef.update(updateData);
    return { success: true };
});
exports.deleteShoppingItem = (0, https_1.onCall)(async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { itemId } = request.data;
    const itemRef = db.collection('shoppingList').doc(itemId);
    const itemDoc = await itemRef.get();
    if (!itemDoc.exists || ((_a = itemDoc.data()) === null || _a === void 0 ? void 0 : _a.userId) !== userId) {
        throw new https_1.HttpsError('permission-denied', 'Not authorized to delete this item');
    }
    await itemRef.delete();
    return { success: true };
});
exports.markShoppingItemAsBought = (0, https_1.onCall)(async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { itemId, actualPrice, createExpense } = request.data;
    const itemRef = db.collection('shoppingList').doc(itemId);
    const itemDoc = await itemRef.get();
    if (!itemDoc.exists || ((_a = itemDoc.data()) === null || _a === void 0 ? void 0 : _a.userId) !== userId) {
        throw new https_1.HttpsError('permission-denied', 'Not authorized to update this item');
    }
    const itemData = itemDoc.data();
    // Update shopping item
    await itemRef.update({
        status: 'bought',
        actualPrice: actualPrice || (itemData === null || itemData === void 0 ? void 0 : itemData.estimatedPrice) || 0,
        boughtAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    // Create expense if requested
    if (createExpense) {
        const expenseData = {
            userId,
            type: 'expense',
            category: (itemData === null || itemData === void 0 ? void 0 : itemData.category) || 'Einkauf',
            amount: actualPrice || (itemData === null || itemData === void 0 ? void 0 : itemData.estimatedPrice) || 0,
            currency: (itemData === null || itemData === void 0 ? void 0 : itemData.currency) || 'CHF',
            date: admin.firestore.Timestamp.now(),
            description: `Einkauf: ${itemData === null || itemData === void 0 ? void 0 : itemData.item}`,
            status: 'paid',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        const expenseRef = await db.collection('financeEntries').add(expenseData);
        // Link expense to shopping item
        await itemRef.update({
            linkedExpenseId: expenseRef.id,
        });
        return { success: true, expenseId: expenseRef.id };
    }
    return { success: true };
});
// ========== Scheduled Functions ==========
// Process recurring finance entries - runs daily at midnight (Europe/Zurich)
exports.processRecurringEntries = (0, scheduler_1.onSchedule)({
    schedule: '0 0 * * *',
    timeZone: 'Europe/Zurich',
}, async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Get all recurring entries
    const recurringSnapshot = await db
        .collection('financeEntries')
        .where('isRecurring', '==', true)
        .get();
    let createdCount = 0;
    for (const doc of recurringSnapshot.docs) {
        const entry = doc.data();
        const lastDate = entry.date.toDate();
        lastDate.setHours(0, 0, 0, 0);
        // Calculate days difference
        const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        // Check if we need to create a new entry based on recurrence rule
        let shouldCreate = false;
        switch (entry.recurrenceRule) {
            case 'daily':
                shouldCreate = daysDiff >= 1;
                break;
            case 'weekly':
                shouldCreate = daysDiff >= 7;
                break;
            case 'monthly':
                // Check if a month has passed
                const lastMonth = lastDate.getMonth();
                const lastYear = lastDate.getFullYear();
                const currentMonth = today.getMonth();
                const currentYear = today.getFullYear();
                shouldCreate = (currentYear > lastYear) || (currentYear === lastYear && currentMonth > lastMonth);
                break;
            case 'yearly':
                shouldCreate = daysDiff >= 365;
                break;
        }
        if (shouldCreate) {
            // Create new entry with today's date
            await db.collection('financeEntries').add({
                userId: entry.userId,
                type: entry.type,
                category: entry.category,
                amount: entry.amount,
                currency: entry.currency,
                paymentMethod: entry.paymentMethod,
                notes: `${entry.notes || ''} (Automatisch erstellt)`.trim(),
                isRecurring: false, // The new entry is not recurring, only the original
                recurrenceRule: null,
                date: admin.firestore.Timestamp.fromDate(today),
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            // Update the original recurring entry's date to today
            await doc.ref.update({
                date: admin.firestore.Timestamp.fromDate(today),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            createdCount++;
        }
    }
    console.log(`Processed recurring entries. Created ${createdCount} new entries.`);
});
// Process recurring invoices - runs daily at midnight (Europe/Zurich)
exports.processRecurringInvoices = (0, scheduler_1.onSchedule)({
    schedule: '0 1 * * *', // Run at 1 AM
    timeZone: 'Europe/Zurich',
}, async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Get all people
    const peopleSnapshot = await db.collection('people').get();
    let createdCount = 0;
    for (const personDoc of peopleSnapshot.docs) {
        // Get recurring invoices for this person
        const invoicesSnapshot = await personDoc.ref
            .collection('invoices')
            .where('isRecurring', '==', true)
            .get();
        for (const invoiceDoc of invoicesSnapshot.docs) {
            const invoice = invoiceDoc.data();
            // Check if nextDueDate has passed
            if (invoice.nextDueDate) {
                const nextDue = invoice.nextDueDate.toDate();
                nextDue.setHours(0, 0, 0, 0);
                if (nextDue <= today) {
                    // Create new invoice
                    const newDueDate = new Date(nextDue);
                    // Calculate reminder offset from due date
                    let reminderOffset = 0;
                    if (invoice.dueDate && invoice.reminderDate) {
                        const originalDue = invoice.dueDate.toDate();
                        const originalReminder = invoice.reminderDate.toDate();
                        reminderOffset = Math.floor((originalDue.getTime() - originalReminder.getTime()) / (1000 * 60 * 60 * 24));
                    }
                    const newInvoiceData = {
                        amount: invoice.amount,
                        description: invoice.description,
                        date: admin.firestore.Timestamp.fromDate(today),
                        dueDate: admin.firestore.Timestamp.fromDate(newDueDate),
                        status: 'open',
                        direction: invoice.direction,
                        notes: invoice.notes,
                        isRecurring: false, // The new invoice is not recurring
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    };
                    // Add reminder if enabled
                    if (invoice.reminderEnabled && reminderOffset > 0) {
                        const newReminder = new Date(newDueDate);
                        newReminder.setDate(newReminder.getDate() - reminderOffset);
                        newInvoiceData.reminderEnabled = true;
                        newInvoiceData.reminderDate = admin.firestore.Timestamp.fromDate(newReminder);
                    }
                    await personDoc.ref.collection('invoices').add(newInvoiceData);
                    // Calculate next due date for the recurring invoice
                    const nextNextDue = new Date(nextDue);
                    switch (invoice.recurringInterval) {
                        case 'weekly':
                            nextNextDue.setDate(nextNextDue.getDate() + 7);
                            break;
                        case 'monthly':
                            nextNextDue.setMonth(nextNextDue.getMonth() + 1);
                            break;
                        case 'quarterly':
                            nextNextDue.setMonth(nextNextDue.getMonth() + 3);
                            break;
                        case 'yearly':
                            nextNextDue.setFullYear(nextNextDue.getFullYear() + 1);
                            break;
                    }
                    // Update the recurring invoice's next due date
                    await invoiceDoc.ref.update({
                        nextDueDate: admin.firestore.Timestamp.fromDate(nextNextDue),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                    // Update person's totalOwed
                    await personDoc.ref.update({
                        totalOwed: admin.firestore.FieldValue.increment(invoice.amount),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                    createdCount++;
                }
            }
        }
    }
    console.log(`Processed recurring invoices. Created ${createdCount} new invoices.`);
});
// ========== Budget Functions ==========
exports.getBudgets = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const snapshot = await db.collection('budgets')
        .where('userId', '==', userId)
        .get();
    const budgets = snapshot.docs.map(doc => {
        const data = doc.data();
        const budget = Object.assign({ id: doc.id }, data);
        if (data.createdAt && typeof data.createdAt.toDate === 'function') {
            budget.createdAt = data.createdAt.toDate().toISOString();
        }
        if (data.updatedAt && typeof data.updatedAt.toDate === 'function') {
            budget.updatedAt = data.updatedAt.toDate().toISOString();
        }
        return budget;
    });
    return { budgets };
});
exports.createBudget = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { category, amount, period, currency } = request.data;
    const budgetData = {
        userId,
        category,
        amount,
        period: period || 'monthly', // monthly, yearly
        currency: currency || 'CHF',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const docRef = await db.collection('budgets').add(budgetData);
    return Object.assign({ id: docRef.id }, budgetData);
});
exports.updateBudget = (0, https_1.onCall)(async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const _b = request.data, { id } = _b, updateData = __rest(_b, ["id"]);
    const docRef = db.collection('budgets').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
        throw new https_1.HttpsError('not-found', 'Budget not found');
    }
    if (((_a = doc.data()) === null || _a === void 0 ? void 0 : _a.userId) !== userId) {
        throw new https_1.HttpsError('permission-denied', 'Not authorized');
    }
    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    await docRef.update(updateData);
    return { success: true };
});
exports.deleteBudget = (0, https_1.onCall)(async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { id } = request.data;
    const docRef = db.collection('budgets').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
        throw new https_1.HttpsError('not-found', 'Budget not found');
    }
    if (((_a = doc.data()) === null || _a === void 0 ? void 0 : _a.userId) !== userId) {
        throw new https_1.HttpsError('permission-denied', 'Not authorized');
    }
    await docRef.delete();
    return { success: true };
});
//# sourceMappingURL=index.js.map