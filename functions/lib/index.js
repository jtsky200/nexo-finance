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
exports.markShoppingItemAsBought = exports.deleteShoppingItem = exports.updateShoppingItem = exports.createShoppingItem = exports.getShoppingList = exports.deleteInvoice = exports.updateInvoiceStatus = exports.updateInvoice = exports.createInvoice = exports.getPersonInvoices = exports.getPersonDebts = exports.deletePerson = exports.updatePerson = exports.createPerson = exports.getPeople = exports.updateUserPreferences = exports.deleteTaxProfile = exports.updateTaxProfile = exports.createTaxProfile = exports.getTaxProfileByYear = exports.getTaxProfiles = exports.deleteFinanceEntry = exports.updateFinanceEntry = exports.createFinanceEntry = exports.getFinanceEntries = exports.deleteReminder = exports.updateReminder = exports.createReminder = exports.getReminders = void 0;
const https_1 = require("firebase-functions/v2/https");
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
    const reminders = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
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
    const entries = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
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
    const profiles = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
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
    const people = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
    return { people };
});
exports.createPerson = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { name, email, phone, currency } = request.data;
    const personData = {
        userId,
        name,
        email: email || null,
        phone: phone || null,
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
    const { personId, name, email, phone } = request.data;
    const personRef = db.collection('people').doc(personId);
    const personDoc = await personRef.get();
    if (!personDoc.exists || ((_a = personDoc.data()) === null || _a === void 0 ? void 0 : _a.userId) !== userId) {
        throw new https_1.HttpsError('permission-denied', 'Not authorized to update this person');
    }
    await personRef.update({
        name,
        email: email || null,
        phone: phone || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
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
    const invoices = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
    return { invoices };
});
exports.createInvoice = (0, https_1.onCall)(async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { personId, amount, description, date, status } = request.data;
    // Verify person belongs to user
    const personRef = db.collection('people').doc(personId);
    const personDoc = await personRef.get();
    if (!personDoc.exists || ((_a = personDoc.data()) === null || _a === void 0 ? void 0 : _a.userId) !== userId) {
        throw new https_1.HttpsError('permission-denied', 'Not authorized to access this person');
    }
    const invoiceData = {
        amount,
        description,
        date: admin.firestore.Timestamp.fromDate(new Date(date)),
        status: status || 'open',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
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
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = request.auth.uid;
    const { personId, invoiceId, amount, description, date } = request.data;
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
    const items = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
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
//# sourceMappingURL=index.js.map