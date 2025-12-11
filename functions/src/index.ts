import {onCall, HttpsError} from 'firebase-functions/v2/https';
import {onSchedule} from 'firebase-functions/v2/scheduler';

import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();

// ========== Validation Helpers ==========

function validateString(value: any, fieldName: string, maxLength: number = 1000, required: boolean = false): string {
  if (required && (!value || typeof value !== 'string' || value.trim().length === 0)) {
    throw new HttpsError('invalid-argument', `${fieldName} is required and must be a non-empty string`);
  }
  if (value && typeof value !== 'string') {
    throw new HttpsError('invalid-argument', `${fieldName} must be a string`);
  }
  if (value && value.length > maxLength) {
    throw new HttpsError('invalid-argument', `${fieldName} must not exceed ${maxLength} characters`);
  }
  return value ? value.trim() : value;
}

function validateNumber(value: any, fieldName: string, min: number = 0, max: number = Number.MAX_SAFE_INTEGER, required: boolean = false): number {
  if (required && (value === undefined || value === null)) {
    throw new HttpsError('invalid-argument', `${fieldName} is required`);
  }
  if (value !== undefined && value !== null) {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || !isFinite(num)) {
      throw new HttpsError('invalid-argument', `${fieldName} must be a valid number`);
    }
    if (num < min || num > max) {
      throw new HttpsError('invalid-argument', `${fieldName} must be between ${min} and ${max}`);
    }
    return num;
  }
  return value;
}

function validateEmail(value: any, fieldName: string = 'email'): string | null {
  if (!value) return null;
  if (typeof value !== 'string') {
    throw new HttpsError('invalid-argument', `${fieldName} must be a string`);
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value.trim())) {
    throw new HttpsError('invalid-argument', `${fieldName} must be a valid email address`);
  }
  return value.trim();
}

function validateDate(value: any, fieldName: string, required: boolean = false): Date {
  if (required && !value) {
    throw new HttpsError('invalid-argument', `${fieldName} is required`);
  }
  if (value) {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new HttpsError('invalid-argument', `${fieldName} must be a valid date`);
    }
    return date;
  }
  return value;
}

function validateEnum<T extends string>(value: any, fieldName: string, allowedValues: T[], required: boolean = false): T | null {
  if (required && !value) {
    throw new HttpsError('invalid-argument', `${fieldName} is required`);
  }
  if (value && !allowedValues.includes(value as T)) {
    throw new HttpsError('invalid-argument', `${fieldName} must be one of: ${allowedValues.join(', ')}`);
  }
  return value || null;
}

// ========== Reminders Functions ==========

export const getReminders = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { startDate, endDate, status, personId } = request.data;

  let query: admin.firestore.Query = db.collection('reminders').where('userId', '==', userId);

  if (personId) {
    query = query.where('personId', '==', personId);
  }
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
    const reminder: any = { id: doc.id, ...data };
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

export const createReminder = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { title, type, dueDate, isAllDay, amount, currency, notes, recurrenceRule, personId, personName } = request.data;

  // Validate inputs
  const validatedTitle = validateString(title, 'title', 500, true);
  const validatedType = validateEnum(type, 'type', ['termin', 'erinnerung'], false) || 'termin';
  const validatedCurrency = validateEnum(currency, 'currency', ['CHF', 'EUR', 'USD'], false);
  const validatedAmount = amount ? validateNumber(amount, 'amount', 0, 1000000000) : null;
  const validatedNotes = validateString(notes, 'notes', 5000, false);
  const validatedPersonName = validateString(personName, 'personName', 200, false);
  
  // Parse and validate dueDate
  let parsedDueDate: admin.firestore.Timestamp | null = null;
  if (dueDate) {
    const dateObj = validateDate(dueDate, 'dueDate', false);
    parsedDueDate = admin.firestore.Timestamp.fromDate(dateObj);
  } else {
    parsedDueDate = admin.firestore.Timestamp.fromDate(new Date());
  }

  const reminderData = {
    userId,
    title: validatedTitle,
    type: validatedType,
    dueDate: parsedDueDate,
    isAllDay: isAllDay === true,
    amount: validatedAmount,
    currency: validatedCurrency,
    notes: validatedNotes,
    recurrenceRule: validateString(recurrenceRule, 'recurrenceRule', 200, false),
    personId: personId ? validateString(personId, 'personId', 100, false) : null,
    personName: validatedPersonName,
    status: 'offen',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const docRef = await db.collection('reminders').add(reminderData);

  return { id: docRef.id, ...reminderData };
});

export const updateReminder = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { id, ...updateData } = request.data;

  const docRef = db.collection('reminders').doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new HttpsError('not-found', 'Reminder not found');
  }

  if (doc.data()?.userId !== userId) {
    throw new HttpsError('permission-denied', 'Not authorized');
  }

  if (updateData.dueDate) {
    updateData.dueDate = admin.firestore.Timestamp.fromDate(new Date(updateData.dueDate));
  }

  updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

  await docRef.update(updateData);

  return { success: true };
});

export const deleteReminder = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { id } = request.data;

  const docRef = db.collection('reminders').doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new HttpsError('not-found', 'Reminder not found');
  }

  if (doc.data()?.userId !== userId) {
    throw new HttpsError('permission-denied', 'Not authorized');
  }

  await docRef.delete();

  return { success: true };
});

// ========== Finance Functions ==========

export const getFinanceEntries = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { startDate, endDate, type } = request.data;

  let query: admin.firestore.Query = db.collection('financeEntries').where('userId', '==', userId);

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
    const entry: any = { id: doc.id, ...data };
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

export const createFinanceEntry = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { date, type, category, amount, currency, paymentMethod, notes, isRecurring, recurrenceRule } = request.data;

  // Validate inputs
  const validatedDate = validateDate(date, 'date', true);
  const validatedType = validateEnum(type, 'type', ['einnahme', 'ausgabe'], true);
  const validatedCategory = validateString(category, 'category', 200, true);
  const validatedAmount = validateNumber(amount, 'amount', 0, 1000000000, true);
  const validatedCurrency = validateEnum(currency, 'currency', ['CHF', 'EUR', 'USD'], false) || 'CHF';
  const validatedPaymentMethod = validateString(paymentMethod, 'paymentMethod', 100, false);
  const validatedNotes = validateString(notes, 'notes', 5000, false);
  const validatedRecurrenceRule = validateString(recurrenceRule, 'recurrenceRule', 200, false);

  const entryData = {
    userId,
    date: admin.firestore.Timestamp.fromDate(validatedDate),
    type: validatedType,
    category: validatedCategory,
    amount: validatedAmount,
    currency: validatedCurrency,
    paymentMethod: validatedPaymentMethod,
    notes: validatedNotes,
    isRecurring: isRecurring === true,
    recurrenceRule: validatedRecurrenceRule,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const docRef = await db.collection('financeEntries').add(entryData);

  return { id: docRef.id, ...entryData };
});

export const updateFinanceEntry = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { id, ...updateData } = request.data;

  const docRef = db.collection('financeEntries').doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new HttpsError('not-found', 'Entry not found');
  }

  if (doc.data()?.userId !== userId) {
    throw new HttpsError('permission-denied', 'Not authorized');
  }

  if (updateData.date) {
    updateData.date = admin.firestore.Timestamp.fromDate(new Date(updateData.date));
  }

  updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

  await docRef.update(updateData);

  return { success: true };
});

export const deleteFinanceEntry = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { id } = request.data;

  const docRef = db.collection('financeEntries').doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new HttpsError('not-found', 'Entry not found');
  }

  if (doc.data()?.userId !== userId) {
    throw new HttpsError('permission-denied', 'Not authorized');
  }

  await docRef.delete();

  return { success: true };
});

// ========== Tax Profile Functions ==========

export const getTaxProfiles = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;

  const snapshot = await db.collection('taxProfiles')
    .where('userId', '==', userId)
    .orderBy('taxYear', 'desc')
    .get();

  const profiles = snapshot.docs.map(doc => {
    const data = doc.data();
    // Convert Firestore Timestamps to ISO strings for proper serialization
    const profile: any = { id: doc.id, ...data };
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

export const getTaxProfileByYear = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
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
  return { profile: { id: doc.id, ...doc.data() } };
});

export const createTaxProfile = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
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

  return { id: docRef.id, ...profileData };
});

export const updateTaxProfile = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { id, ...updateData } = request.data;

  const docRef = db.collection('taxProfiles').doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new HttpsError('not-found', 'Tax profile not found');
  }

  if (doc.data()?.userId !== userId) {
    throw new HttpsError('permission-denied', 'Not authorized');
  }

  updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

  await docRef.update(updateData);

  return { success: true };
});

export const deleteTaxProfile = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { id } = request.data;

  const docRef = db.collection('taxProfiles').doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new HttpsError('not-found', 'Tax profile not found');
  }

  if (doc.data()?.userId !== userId) {
    throw new HttpsError('permission-denied', 'Not authorized');
  }

  await docRef.delete();

  return { success: true };
});

// ========== User Functions ==========

export const updateUserPreferences = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { locale, defaultCurrency, canton } = request.data;

  const updateData: any = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (locale) updateData.locale = locale;
  if (defaultCurrency) updateData.defaultCurrency = defaultCurrency;
  if (canton) updateData.canton = canton;

  await db.collection('users').doc(userId).set(updateData, { merge: true });

  return { success: true };
});

// ========== People Functions ==========

export const getPeople = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const snapshot = await db.collection('people').where('userId', '==', userId).get();
  
  // Get people with their invoices
  const people = await Promise.all(snapshot.docs.map(async (doc) => {
    const data = doc.data();
    const person: any = { id: doc.id, ...data };
    
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
      const invoice: any = { id: invDoc.id, ...invData };
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

export const createPerson = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { name, email, phone, currency, type, relationship, notes } = request.data;

  // Validate inputs
  const validatedName = validateString(name, 'name', 200, true);
  const validatedEmail = validateEmail(email, 'email');
  const validatedPhone = validateString(phone, 'phone', 50, false);
  const validatedCurrency = validateEnum(currency, 'currency', ['CHF', 'EUR', 'USD'], false) || 'CHF';
  const validatedType = validateEnum(type, 'type', ['household', 'external'], false) || 'household';
  const validatedRelationship = type === 'external' 
    ? (validateEnum(relationship, 'relationship', ['creditor', 'debtor', 'both'], false) || 'both')
    : null;
  const validatedNotes = validateString(notes, 'notes', 5000, false);

  // type: "household" (Haushaltsmitglied) | "external" (Externe Person)
  // relationship (nur für external): "creditor" (Ich schulde) | "debtor" (Schuldet mir) | "both"
  const personData = {
    userId,
    name: validatedName,
    email: validatedEmail,
    phone: validatedPhone,
    type: validatedType,
    relationship: validatedRelationship,
    notes: validatedNotes,
    totalOwed: 0,
    currency: validatedCurrency,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const docRef = await db.collection('people').add(personData);
  return { id: docRef.id, ...personData };
});

export const updatePerson = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { personId, name, email, phone, type, relationship, notes } = request.data;

  const personRef = db.collection('people').doc(personId);
  const personDoc = await personRef.get();

  if (!personDoc.exists || personDoc.data()?.userId !== userId) {
    throw new HttpsError('permission-denied', 'Not authorized to update this person');
  }

  // Validate inputs if provided
  const validatedName = name !== undefined ? validateString(name, 'name', 200, true) : undefined;
  const validatedEmail = email !== undefined ? validateEmail(email, 'email') : undefined;
  const validatedPhone = phone !== undefined ? validateString(phone, 'phone', 50, false) : undefined;
  const validatedNotes = notes !== undefined ? validateString(notes, 'notes', 5000, false) : undefined;
  const validatedType = type !== undefined ? validateEnum(type, 'type', ['household', 'external'], false) : undefined;
  const validatedRelationship = (type === 'external' && relationship !== undefined)
    ? validateEnum(relationship, 'relationship', ['creditor', 'debtor', 'both'], false)
    : undefined;

  const updateData: any = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  
  if (validatedName !== undefined) updateData.name = validatedName;
  if (validatedEmail !== undefined) updateData.email = validatedEmail;
  if (validatedPhone !== undefined) updateData.phone = validatedPhone;
  if (validatedNotes !== undefined) updateData.notes = validatedNotes;
  if (validatedType !== undefined) updateData.type = validatedType;
  if (validatedRelationship !== undefined) updateData.relationship = validatedRelationship;

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

export const deletePerson = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { personId } = request.data;

  const personRef = db.collection('people').doc(personId);
  const personDoc = await personRef.get();

  if (!personDoc.exists || personDoc.data()?.userId !== userId) {
    throw new HttpsError('permission-denied', 'Not authorized to delete this person');
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

export const getPersonDebts = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { personId } = request.data;

  const snapshot = await db.collection('financeEntries')
    .where('userId', '==', userId)
    .where('personId', '==', personId)
    .orderBy('date', 'desc')
    .get();

  const debts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return { debts };
});

// ========== Invoice Functions ==========

export const getPersonInvoices = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { personId } = request.data;

  // Verify person belongs to user
  const personRef = db.collection('people').doc(personId);
  const personDoc = await personRef.get();

  if (!personDoc.exists || personDoc.data()?.userId !== userId) {
    throw new HttpsError('permission-denied', 'Not authorized to access this person');
  }

  const snapshot = await personRef.collection('invoices').orderBy('date', 'desc').get();
  const invoices = snapshot.docs.map(doc => {
    const data = doc.data();
    // Convert Firestore Timestamps to ISO strings for proper serialization
    const invoice: any = { id: doc.id, ...data };
    if (data.date && typeof data.date.toDate === 'function') {
      invoice.date = data.date.toDate().toISOString();
    }
    if (data.createdAt && typeof data.createdAt.toDate === 'function') {
      invoice.createdAt = data.createdAt.toDate().toISOString();
    }
    if (data.updatedAt && typeof data.updatedAt.toDate === 'function') {
      invoice.updatedAt = data.updatedAt.toDate().toISOString();
    }
    if (data.dueDate && typeof data.dueDate.toDate === 'function') {
      invoice.dueDate = data.dueDate.toDate().toISOString();
    }
    if (data.installmentEndDate && typeof data.installmentEndDate.toDate === 'function') {
      invoice.installmentEndDate = data.installmentEndDate.toDate().toISOString();
    }
    // Convert installment dates
    if (data.installments && Array.isArray(data.installments)) {
      invoice.installments = data.installments.map((inst: any) => ({
        ...inst,
        dueDate: inst.dueDate && typeof inst.dueDate.toDate === 'function' ? inst.dueDate.toDate().toISOString() : inst.dueDate,
        paidDate: inst.paidDate && typeof inst.paidDate.toDate === 'function' ? inst.paidDate.toDate().toISOString() : inst.paidDate,
      }));
    }
    return invoice;
  });

  return { invoices };
});

export const createInvoice = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { personId, amount, description, date, status, direction, dueDate, reminderDate, reminderEnabled, notes, isRecurring, recurringInterval } = request.data;

  // Validate inputs
  if (!personId || typeof personId !== 'string') {
    throw new HttpsError('invalid-argument', 'personId is required and must be a string');
  }
  const validatedAmount = validateNumber(amount, 'amount', 1, 1000000000, true);
  const validatedDescription = validateString(description, 'description', 500, true);
  const validatedDate = validateDate(date, 'date', true);
  const validatedStatus = validateEnum(status, 'status', ['open', 'paid', 'postponed', 'cancelled'], false) || 'open';
  const validatedNotes = validateString(notes, 'notes', 5000, false);

  // Verify person belongs to user
  const personRef = db.collection('people').doc(personId);
  const personDoc = await personRef.get();

  if (!personDoc.exists || personDoc.data()?.userId !== userId) {
    throw new HttpsError('permission-denied', 'Not authorized to access this person');
  }

  // direction: "incoming" (Person schuldet mir) | "outgoing" (Ich schulde Person)
  const personData = personDoc.data();
  const invoiceDirection = direction 
    ? validateEnum(direction, 'direction', ['incoming', 'outgoing'], false) 
    : (personData?.type === 'external' ? 'incoming' : 'outgoing');

  const invoiceData: any = {
    amount: validatedAmount,
    description: validatedDescription,
    date: admin.firestore.Timestamp.fromDate(validatedDate),
    status: validatedStatus,
    direction: invoiceDirection,
    notes: validatedNotes,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  // Add due date if provided
  if (dueDate) {
    const validatedDueDate = validateDate(dueDate, 'dueDate', false);
    invoiceData.dueDate = admin.firestore.Timestamp.fromDate(validatedDueDate);
  }

  // Add reminder if enabled
  if (reminderEnabled && reminderDate) {
    const validatedReminderDate = validateDate(reminderDate, 'reminderDate', false);
    invoiceData.reminderEnabled = true;
    invoiceData.reminderDate = admin.firestore.Timestamp.fromDate(validatedReminderDate);
  }

  // Add recurring settings
  if (isRecurring && recurringInterval) {
    const validatedInterval = validateEnum(recurringInterval, 'recurringInterval', ['weekly', 'monthly', 'quarterly', 'yearly'], false);
    invoiceData.isRecurring = true;
    invoiceData.recurringInterval = validatedInterval;
    // Calculate next due date based on interval
    if (dueDate) {
      const nextDue = new Date(dueDate);
      switch (recurringInterval) {
        case 'weekly': nextDue.setDate(nextDue.getDate() + 7); break;
        case 'monthly': nextDue.setMonth(nextDue.getMonth() + 1); break;
        case 'quarterly': nextDue.setMonth(nextDue.getMonth() + 3); break;
        case 'yearly': nextDue.setFullYear(nextDue.getFullYear() + 1); break;
      }
      invoiceData.nextDueDate = admin.firestore.Timestamp.fromDate(nextDue);
    }
  }

  // Handle installment plan if enabled
  if (request.data.isInstallmentPlan) {
    const installmentInterval = request.data.installmentInterval || 'monthly';
    const startDate = dueDate ? new Date(dueDate) : new Date(date);
    
    // Calculate installment count from rate amount or use provided count (backward compatibility)
    let installmentCount = request.data.installmentCount;
    let installmentAmountValue: number;
    
    if (request.data.installmentAmount && request.data.installmentAmount > 0) {
      // Round to 5 Rappen (0.05 CHF)
      installmentAmountValue = Math.round(request.data.installmentAmount * 20) / 20;
      installmentCount = Math.ceil(amount / 100 / installmentAmountValue);
      if (installmentCount < 2) {
        throw new HttpsError('invalid-argument', 'Rate amount is too high. At least 2 installments required.');
      }
    } else if (installmentCount && installmentCount >= 2) {
      // Use provided count and calculate amount
      installmentAmountValue = parseFloat((amount / installmentCount / 100).toFixed(2));
      // Round to 5 Rappen
      installmentAmountValue = Math.round(installmentAmountValue * 20) / 20;
    } else {
      throw new HttpsError('invalid-argument', 'Either installment amount or count must be provided');
    }
    
    const installmentAmount = installmentAmountValue;
    
    const installments = [];
    for (let i = 0; i < installmentCount; i++) {
      const installmentDate = new Date(startDate);
      switch (installmentInterval) {
        case 'weekly': installmentDate.setDate(installmentDate.getDate() + (i * 7)); break;
        case 'monthly': installmentDate.setMonth(installmentDate.getMonth() + i); break;
        case 'quarterly': installmentDate.setMonth(installmentDate.getMonth() + (i * 3)); break;
        case 'yearly': installmentDate.setFullYear(installmentDate.getFullYear() + i); break;
      }
      
      // Round each installment amount to 5 Rappen
      const roundedAmount = Math.round(installmentAmount * 20) / 20;
      installments.push({
        number: i + 1,
        amount: roundedAmount,
        dueDate: admin.firestore.Timestamp.fromDate(installmentDate),
        status: 'pending',
        paidDate: null,
        paidAmount: 0,
        notes: request.data.installmentNotes?.[i] || '', // Add notes field per installment
      });
    }
    
    // Adjust last installment to account for rounding
    const totalInstallmentAmount = installments.reduce((sum, inst) => sum + inst.amount, 0);
    if (totalInstallmentAmount !== amount) {
      installments[installments.length - 1].amount = parseFloat((amount - (totalInstallmentAmount - installments[installments.length - 1].amount)).toFixed(2));
    }
    
    invoiceData.isInstallmentPlan = true;
    invoiceData.installmentCount = installmentCount;
    invoiceData.installmentInterval = installmentInterval;
    invoiceData.installments = installments;
    invoiceData.totalPaid = 0;
    invoiceData.installmentEndDate = admin.firestore.Timestamp.fromDate(installments[installments.length - 1].dueDate.toDate());
  }

  const docRef = await personRef.collection('invoices').add(invoiceData);

  // Update person's totalOwed if status is open or postponed
  if (status === 'open' || status === 'postponed') {
    await personRef.update({
      totalOwed: admin.firestore.FieldValue.increment(amount),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  return { id: docRef.id, ...invoiceData };
});

export const updateInvoice = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { personId, invoiceId, amount, description, date, dueDate, reminderDate, reminderEnabled, notes, isRecurring, recurringInterval } = request.data;

  // Validate inputs
  if (!personId || typeof personId !== 'string') {
    throw new HttpsError('invalid-argument', 'personId is required and must be a string');
  }
  if (!invoiceId || typeof invoiceId !== 'string') {
    throw new HttpsError('invalid-argument', 'invoiceId is required and must be a string');
  }
  const validatedAmount = amount !== undefined ? validateNumber(amount, 'amount', 1, 1000000000, true) : undefined;
  const validatedDescription = description !== undefined ? validateString(description, 'description', 500, true) : undefined;
  const validatedDate = date !== undefined ? validateDate(date, 'date', true) : undefined;
  const validatedNotes = notes !== undefined ? validateString(notes, 'notes', 5000, false) : undefined;

  // Verify person belongs to user
  const personRef = db.collection('people').doc(personId);
  const personDoc = await personRef.get();

  if (!personDoc.exists || personDoc.data()?.userId !== userId) {
    throw new HttpsError('permission-denied', 'Not authorized to access this person');
  }

  const invoiceRef = personRef.collection('invoices').doc(invoiceId);
  const invoiceDoc = await invoiceRef.get();

  if (!invoiceDoc.exists) {
    throw new HttpsError('not-found', 'Invoice not found');
  }

  const oldInvoiceData = invoiceDoc.data();
  const oldAmount = oldInvoiceData?.amount || 0;
  const oldStatus = oldInvoiceData?.status;

  const updateData: any = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (validatedDescription !== undefined) updateData.description = validatedDescription;
  if (validatedDate !== undefined) updateData.date = admin.firestore.Timestamp.fromDate(validatedDate);
  if (validatedNotes !== undefined) updateData.notes = validatedNotes;
  if (validatedAmount !== undefined) updateData.amount = validatedAmount;
  
  // Handle due date
  if (dueDate !== undefined) {
    const validatedDueDate = dueDate ? validateDate(dueDate, 'dueDate', false) : null;
    updateData.dueDate = validatedDueDate ? admin.firestore.Timestamp.fromDate(validatedDueDate) : null;
  }
  
  // Handle reminder
  if (reminderEnabled !== undefined) {
    updateData.reminderEnabled = reminderEnabled;
    if (reminderEnabled && reminderDate) {
      const validatedReminderDate = validateDate(reminderDate, 'reminderDate', false);
      updateData.reminderDate = admin.firestore.Timestamp.fromDate(validatedReminderDate);
    } else if (!reminderEnabled) {
      updateData.reminderDate = null;
    }
  }

  // Handle recurring settings
  if (isRecurring !== undefined) {
    updateData.isRecurring = isRecurring;
    if (isRecurring && recurringInterval) {
      updateData.recurringInterval = recurringInterval;
      // Calculate next due date if due date is set
      const effectiveDueDate = dueDate || oldInvoiceData?.dueDate?.toDate();
      if (effectiveDueDate) {
        const nextDue = new Date(effectiveDueDate);
        switch (recurringInterval) {
          case 'weekly': nextDue.setDate(nextDue.getDate() + 7); break;
          case 'monthly': nextDue.setMonth(nextDue.getMonth() + 1); break;
          case 'quarterly': nextDue.setMonth(nextDue.getMonth() + 3); break;
          case 'yearly': nextDue.setFullYear(nextDue.getFullYear() + 1); break;
        }
        updateData.nextDueDate = admin.firestore.Timestamp.fromDate(nextDue);
      }
    } else if (!isRecurring) {
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

export const updateInvoiceStatus = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { personId, invoiceId, status } = request.data;

  // Verify person belongs to user
  const personRef = db.collection('people').doc(personId);
  const personDoc = await personRef.get();

  if (!personDoc.exists || personDoc.data()?.userId !== userId) {
    throw new HttpsError('permission-denied', 'Not authorized to access this person');
  }

  const personData = personDoc.data();
  const invoiceRef = personRef.collection('invoices').doc(invoiceId);
  const invoiceDoc = await invoiceRef.get();

  if (!invoiceDoc.exists) {
    throw new HttpsError('not-found', 'Invoice not found');
  }

  const invoiceData = invoiceDoc.data();
  const oldStatus = invoiceData?.status;
  const amount = invoiceData?.amount || 0;

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
      currency: personData?.currency || 'CHF',
      date: admin.firestore.Timestamp.now(),
      description: `${personData?.name}: ${invoiceData?.description}`,
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

export const deleteInvoice = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { personId, invoiceId } = request.data;

  // Verify person belongs to user
  const personRef = db.collection('people').doc(personId);
  const personDoc = await personRef.get();

  if (!personDoc.exists || personDoc.data()?.userId !== userId) {
    throw new HttpsError('permission-denied', 'Not authorized to access this person');
  }

  const invoiceRef = personRef.collection('invoices').doc(invoiceId);
  const invoiceDoc = await invoiceRef.get();

  if (!invoiceDoc.exists) {
    throw new HttpsError('not-found', 'Invoice not found');
  }

  const invoiceData = invoiceDoc.data();
  const amount = invoiceData?.amount || 0;
  const status = invoiceData?.status;

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

// ========== Installment Plan Functions ==========

export const recordInstallmentPayment = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { personId, invoiceId, installmentNumber, paidAmount, paidDate } = request.data;

  // Verify person belongs to user
  const personRef = db.collection('people').doc(personId);
  const personDoc = await personRef.get();

  if (!personDoc.exists || personDoc.data()?.userId !== userId) {
    throw new HttpsError('permission-denied', 'Not authorized to access this person');
  }

  // Get invoice
  const invoiceRef = personRef.collection('invoices').doc(invoiceId);
  const invoiceDoc = await invoiceRef.get();

  if (!invoiceDoc.exists) {
    throw new HttpsError('not-found', 'Invoice not found');
  }

  const invoiceData = invoiceDoc.data();
  
  if (!invoiceData?.isInstallmentPlan || !invoiceData?.installments) {
    throw new HttpsError('invalid-argument', 'Invoice is not an installment plan');
  }

  const installments = invoiceData.installments;
  const installmentIndex = installments.findIndex((inst: any) => inst.number === installmentNumber);

  if (installmentIndex === -1) {
    throw new HttpsError('not-found', 'Installment not found');
  }

  // Update installment
  const installment = installments[installmentIndex];
  const newPaidAmount = (installment.paidAmount || 0) + parseFloat(paidAmount);
  const isFullyPaid = newPaidAmount >= installment.amount;

  installments[installmentIndex] = {
    ...installment,
    paidAmount: parseFloat(newPaidAmount.toFixed(2)),
    status: isFullyPaid ? 'paid' : 'partial',
    paidDate: isFullyPaid ? admin.firestore.Timestamp.fromDate(new Date(paidDate || new Date())) : installment.paidDate,
  };

  // Calculate total paid
  const totalPaid = installments.reduce((sum: number, inst: any) => sum + (inst.paidAmount || 0), 0);
  const allPaid = installments.every((inst: any) => inst.status === 'paid');

  // Update invoice
  await invoiceRef.update({
    installments,
    totalPaid: parseFloat(totalPaid.toFixed(2)),
    status: allPaid ? 'paid' : invoiceData.status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Update person's totalOwed if fully paid
  if (allPaid && invoiceData.status !== 'paid') {
    await personRef.update({
      totalOwed: admin.firestore.FieldValue.increment(-invoiceData.amount),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  return { success: true, totalPaid: parseFloat(totalPaid.toFixed(2)), allPaid };
});

export const updateInstallmentPlan = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { personId, invoiceId, installments } = request.data;

  // Verify person belongs to user
  const personRef = db.collection('people').doc(personId);
  const personDoc = await personRef.get();

  if (!personDoc.exists || personDoc.data()?.userId !== userId) {
    throw new HttpsError('permission-denied', 'Not authorized to access this person');
  }

  // Get invoice
  const invoiceRef = personRef.collection('invoices').doc(invoiceId);
  const invoiceDoc = await invoiceRef.get();

  if (!invoiceDoc.exists) {
    throw new HttpsError('not-found', 'Invoice not found');
  }

  const invoiceData = invoiceDoc.data();
  
  if (!invoiceData?.isInstallmentPlan) {
    throw new HttpsError('invalid-argument', 'Invoice is not an installment plan');
  }

  // Calculate total paid
  const totalPaid = installments.reduce((sum: number, inst: any) => sum + (inst.paidAmount || 0), 0);
  const allPaid = installments.every((inst: any) => inst.status === 'paid');

  // Update invoice
  await invoiceRef.update({
    installments: installments.map((inst: any) => ({
      ...inst,
      dueDate: inst.dueDate ? (typeof inst.dueDate === 'string' ? admin.firestore.Timestamp.fromDate(new Date(inst.dueDate)) : inst.dueDate) : inst.dueDate,
      paidDate: inst.paidDate ? (typeof inst.paidDate === 'string' ? admin.firestore.Timestamp.fromDate(new Date(inst.paidDate)) : inst.paidDate) : inst.paidDate,
      paidAmount: parseFloat((inst.paidAmount || 0).toFixed(2)),
      amount: parseFloat((inst.amount || 0).toFixed(2)),
    })),
    totalPaid: parseFloat(totalPaid.toFixed(2)),
    status: allPaid ? 'paid' : invoiceData.status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true };
});

export const convertToInstallmentPlan = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { personId, invoiceId, installmentAmount, installmentInterval, startDate, installmentCount } = request.data;

  // Verify person belongs to user
  const personRef = db.collection('people').doc(personId);
  const personDoc = await personRef.get();

  if (!personDoc.exists || personDoc.data()?.userId !== userId) {
    throw new HttpsError('permission-denied', 'Not authorized to access this person');
  }

  // Get invoice
  const invoiceRef = personRef.collection('invoices').doc(invoiceId);
  const invoiceDoc = await invoiceRef.get();

  if (!invoiceDoc.exists) {
    throw new HttpsError('not-found', 'Invoice not found');
  }

  const invoiceData = invoiceDoc.data();
  
  if (!invoiceData) {
    throw new HttpsError('not-found', 'Invoice data not found');
  }
  
  if (invoiceData.isInstallmentPlan) {
    throw new HttpsError('invalid-argument', 'Invoice is already an installment plan');
  }

  if (invoiceData.status === 'paid') {
    throw new HttpsError('invalid-argument', 'Cannot convert paid invoice to installment plan');
  }

  const amount = invoiceData.amount / 100; // Convert from cents to CHF
  const interval = installmentInterval || 'monthly';
  const start = startDate ? new Date(startDate) : (invoiceData.dueDate ? new Date(invoiceData.dueDate.toDate ? invoiceData.dueDate.toDate() : invoiceData.dueDate) : new Date());
  
  // Calculate installment count from rate amount or use provided count
  let count = installmentCount;
  let installmentAmountValue: number;
  
  if (installmentAmount && installmentAmount > 0) {
    // Round to 5 Rappen (0.05 CHF)
    installmentAmountValue = Math.round(installmentAmount * 20) / 20;
    count = Math.ceil(amount / installmentAmountValue);
    if (count < 2) {
      throw new HttpsError('invalid-argument', 'Rate amount is too high. At least 2 installments required.');
    }
  } else if (count && count >= 2) {
    // Use provided count and calculate amount
    installmentAmountValue = parseFloat((amount / count).toFixed(2));
    // Round to 5 Rappen
    installmentAmountValue = Math.round(installmentAmountValue * 20) / 20;
  } else {
    throw new HttpsError('invalid-argument', 'Either installment amount or count must be provided');
  }

  const finalInstallmentAmount = installmentAmountValue;
  
  const installments = [];
  for (let i = 0; i < count; i++) {
    const installmentDate = new Date(start);
    switch (interval) {
      case 'weekly': installmentDate.setDate(installmentDate.getDate() + (i * 7)); break;
      case 'monthly': installmentDate.setMonth(installmentDate.getMonth() + i); break;
      case 'quarterly': installmentDate.setMonth(installmentDate.getMonth() + (i * 3)); break;
      case 'yearly': installmentDate.setFullYear(installmentDate.getFullYear() + i); break;
    }
    
    installments.push({
      number: i + 1,
      amount: finalInstallmentAmount,
      dueDate: admin.firestore.Timestamp.fromDate(installmentDate),
      status: 'open',
      paidDate: null,
      paidAmount: 0,
      notes: '', // Add notes field
    });
  }
  
  // Adjust last installment to account for rounding
  const totalInstallmentAmount = installments.reduce((sum, inst) => sum + inst.amount, 0);
  if (totalInstallmentAmount !== amount) {
    installments[installments.length - 1].amount = parseFloat((amount - (totalInstallmentAmount - installments[installments.length - 1].amount)).toFixed(2));
  }
  
  // Calculate end date
  const endDate = new Date(start);
  switch (interval) {
    case 'weekly': endDate.setDate(endDate.getDate() + ((count - 1) * 7)); break;
    case 'monthly': endDate.setMonth(endDate.getMonth() + (count - 1)); break;
    case 'quarterly': endDate.setMonth(endDate.getMonth() + ((count - 1) * 3)); break;
    case 'yearly': endDate.setFullYear(endDate.getFullYear() + (count - 1)); break;
  }

  // Update invoice
  await invoiceRef.update({
    isInstallmentPlan: true,
    installmentCount: count,
    installmentInterval: interval,
    installments,
    totalPaid: 0,
    installmentEndDate: admin.firestore.Timestamp.fromDate(endDate),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true };
});

// ========== Bills Functions (All Invoices) ==========

export const getAllBills = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const bills: any[] = [];

  // 1. Get invoices from people subcollections
  const peopleSnapshot = await db.collection('people').where('userId', '==', userId).get();
  
  for (const personDoc of peopleSnapshot.docs) {
    const personData = personDoc.data();
    const invoicesSnapshot = await personDoc.ref.collection('invoices').get();
    
    for (const invoiceDoc of invoicesSnapshot.docs) {
      const invoiceData = invoiceDoc.data();
      
      // Determine direction: 
      // - If invoice has direction, use it
      // - Otherwise, infer from person's relationship:
      //   - creditor (I owe them) → outgoing
      //   - debtor (they owe me) → incoming
      //   - household/both → check invoice context or default to outgoing (I pay household bills)
      let inferredDirection = invoiceData.direction;
      if (!inferredDirection) {
        if (personData.relationship === 'creditor') {
          inferredDirection = 'outgoing'; // I owe this person
        } else if (personData.relationship === 'debtor') {
          inferredDirection = 'incoming'; // This person owes me
        } else {
          // household or both - default to outgoing (most bills are expenses)
          inferredDirection = 'outgoing';
        }
      }
      
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
        direction: inferredDirection,
        dueDate: invoiceData.dueDate?.toDate ? invoiceData.dueDate.toDate().toISOString() : null,
        reminderDate: invoiceData.reminderDate?.toDate ? invoiceData.reminderDate.toDate().toISOString() : null,
        reminderEnabled: invoiceData.reminderEnabled || false,
        isRecurring: invoiceData.isRecurring || false,
        recurringInterval: invoiceData.recurringInterval,
        notes: invoiceData.notes,
        date: invoiceData.date?.toDate ? invoiceData.date.toDate().toISOString() : null,
        createdAt: invoiceData.createdAt?.toDate ? invoiceData.createdAt.toDate().toISOString() : null,
        isOverdue: invoiceData.dueDate?.toDate && invoiceData.dueDate.toDate() < new Date() && invoiceData.status !== 'paid',
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
      dueDate: reminderData.dueDate?.toDate ? reminderData.dueDate.toDate().toISOString() : null,
      reminderDate: null,
      reminderEnabled: false,
      isRecurring: !!reminderData.recurrenceRule,
      recurringInterval: reminderData.recurrenceRule,
      notes: reminderData.notes,
      iban: reminderData.iban,
      reference: reminderData.reference,
      creditorName: reminderData.creditorName,
      creditorAddress: reminderData.creditorAddress,
      date: reminderData.dueDate?.toDate ? reminderData.dueDate.toDate().toISOString() : null,
      createdAt: reminderData.createdAt?.toDate ? reminderData.createdAt.toDate().toISOString() : null,
      isOverdue: reminderData.dueDate?.toDate && reminderData.dueDate.toDate() < new Date() && reminderData.status !== 'erledigt',
    });
  }

  // Sort by due date (most urgent first)
  bills.sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
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

export const getCalendarEvents = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { startDate, endDate } = request.data;

  const events: any[] = [];

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
      if (invoiceData.status === 'paid') continue;
      
      // Determine the date to use (dueDate > date > createdAt)
      let eventDate: Date;
      let isOverdue = false;
      
      if (invoiceData.dueDate?.toDate) {
        eventDate = invoiceData.dueDate.toDate();
        isOverdue = eventDate < new Date();
      } else if (invoiceData.date?.toDate) {
        eventDate = invoiceData.date.toDate();
      } else if (invoiceData.createdAt?.toDate) {
        eventDate = invoiceData.createdAt.toDate();
      } else {
        // If no date found, use today
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
    
    let reminderDate: Date;
    
    // Handle different date formats - reminders use 'dueDate' field
    if (reminderData.dueDate?.toDate) {
      reminderDate = reminderData.dueDate.toDate();
    } else if (reminderData.dueDate) {
      reminderDate = new Date(reminderData.dueDate);
    } else if (reminderData.date?.toDate) {
      // Fallback to 'date' field if exists
      reminderDate = reminderData.date.toDate();
    } else if (reminderData.date) {
      reminderDate = new Date(reminderData.date);
    } else {
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

  // Get work schedules
  try {
    const workSchedulesSnapshot = await db.collection('workSchedules').where('userId', '==', userId).get();
    
    console.log(`Found ${workSchedulesSnapshot.docs.length} work schedules`);
    
    for (const scheduleDoc of workSchedulesSnapshot.docs) {
      try {
        const scheduleData = scheduleDoc.data();
        
        // Skip if no date
        if (!scheduleData.date) continue;
        
        // Parse date safely - handle both string format "2025-12-08" and Date format
        let scheduleDate: Date;
        if (typeof scheduleData.date === 'string') {
          // For string dates like "2025-12-08", parse as local date
          const parts = scheduleData.date.split('-');
          if (parts.length === 3) {
            const [year, month, day] = parts.map(Number);
            scheduleDate = new Date(year, month - 1, day);
          } else {
            scheduleDate = new Date(scheduleData.date);
          }
        } else if (scheduleData.date?.toDate) {
          scheduleDate = scheduleData.date.toDate();
        } else {
          scheduleDate = new Date(scheduleData.date);
        }
        
        if (isNaN(scheduleDate.getTime())) continue;
        
        // Filter by date range if provided
        if (startDate && endDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          
          // Normalize scheduleDate to start of day for comparison
          const scheduleDateNormalized = new Date(scheduleDate);
          scheduleDateNormalized.setHours(0, 0, 0, 0);
          
          if (scheduleDateNormalized < start || scheduleDateNormalized > end) continue;
        }
        
        // Map work type to readable label (support both old and new values)
        const typeLabels: { [key: string]: string } = {
          'full': 'Vollzeit',
          'half-am': 'Morgen',
          'half-pm': 'Nachmittag',
          'morning': 'Vormittag',
          'afternoon': 'Nachmittag',
          'off': 'Frei'
        };
        
        events.push({
          id: `work-${scheduleDoc.id}`,
          type: 'work',
          title: `${scheduleData.personName || 'Unbekannt'}: ${typeLabels[scheduleData.type] || scheduleData.type}`,
          date: scheduleDate.toISOString(),
          personId: scheduleData.personId,
          personName: scheduleData.personName,
          workType: scheduleData.type,
          startTime: scheduleData.startTime,
          endTime: scheduleData.endTime,
        });
      } catch (scheduleError) {
        console.error(`Error processing schedule ${scheduleDoc.id}:`, scheduleError);
      }
    }
  } catch (workError) {
    console.error('Error fetching work schedules:', workError);
  }
  
  // Get vacations
  try {
    const vacationsSnapshot = await db.collection('vacations').where('userId', '==', userId).get();
    
    for (const vacationDoc of vacationsSnapshot.docs) {
      try {
        const vacationData = vacationDoc.data();
        
        if (!vacationData.startDate) continue;
        
        let vacStartDate: Date;
        let vacEndDate: Date;
        
        if (vacationData.startDate?.toDate) {
          vacStartDate = vacationData.startDate.toDate();
        } else {
          vacStartDate = new Date(vacationData.startDate);
        }
        
        if (vacationData.endDate?.toDate) {
          vacEndDate = vacationData.endDate.toDate();
        } else {
          vacEndDate = vacationData.endDate ? new Date(vacationData.endDate) : vacStartDate;
        }
        
        if (isNaN(vacStartDate.getTime())) continue;
        
        // Filter by date range
        if (startDate && endDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          
          if (vacEndDate < start || vacStartDate > end) continue;
        }
        
        const typeLabels: { [key: string]: string } = {
          'vacation': 'Ferien',
          'sick': 'Krank',
          'special': 'Sonderurlaub'
        };
        
        events.push({
          id: `vacation-${vacationDoc.id}`,
          type: 'vacation',
          title: `${vacationData.personName || 'Unbekannt'}: ${typeLabels[vacationData.type] || 'Ferien'}`,
          date: vacStartDate.toISOString(),
          endDate: vacEndDate.toISOString(),
          personId: vacationData.personId,
          personName: vacationData.personName,
          vacationType: vacationData.type,
          notes: vacationData.notes,
        });
      } catch (vacError) {
        console.error(`Error processing vacation ${vacationDoc.id}:`, vacError);
      }
    }
  } catch (vacationsError) {
    console.error('Error fetching vacations:', vacationsError);
  }
  
  // Get school schedules
  try {
    const schoolSchedulesSnapshot = await db.collection('schoolSchedules').where('userId', '==', userId).get();
    
    for (const scheduleDoc of schoolSchedulesSnapshot.docs) {
      try {
        const scheduleData = scheduleDoc.data();
        
        if (!scheduleData.date) continue;
        
        let scheduleDate: Date;
        if (typeof scheduleData.date === 'string') {
          const parts = scheduleData.date.split('-');
          if (parts.length === 3) {
            const [year, month, day] = parts.map(Number);
            scheduleDate = new Date(year, month - 1, day);
          } else {
            scheduleDate = new Date(scheduleData.date);
          }
        } else if (scheduleData.date?.toDate) {
          scheduleDate = scheduleData.date.toDate();
        } else {
          scheduleDate = new Date(scheduleData.date);
        }
        
        if (isNaN(scheduleDate.getTime())) continue;
        
        // Filter by date range
        if (startDate && endDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          
          const normalized = new Date(scheduleDate);
          normalized.setHours(0, 0, 0, 0);
          
          if (normalized < start || normalized > end) continue;
        }
        
        // School event
        if (scheduleData.schoolType && scheduleData.schoolType !== 'none') {
          const schoolLabels: { [key: string]: string } = {
            'full': 'Ganztag',
            'morning': 'Vormittag',
            'afternoon': 'Nachmittag'
          };
          
          events.push({
            id: `school-${scheduleDoc.id}`,
            type: 'school',
            title: `${scheduleData.childName || 'Kind'}: Schule ${schoolLabels[scheduleData.schoolType] || scheduleData.schoolType}`,
            date: scheduleDate.toISOString(),
            childId: scheduleData.childId,
            childName: scheduleData.childName,
            schoolType: scheduleData.schoolType,
          });
        }
        
        // Hort event
        if (scheduleData.hortType && scheduleData.hortType !== 'none') {
          const hortLabels: { [key: string]: string } = {
            'before': 'Vor Schule',
            'after': 'Nach Schule',
            'both': 'Vor & Nach Schule'
          };
          
          events.push({
            id: `hort-${scheduleDoc.id}`,
            type: 'hort',
            title: `${scheduleData.childName || 'Kind'}: Hort ${hortLabels[scheduleData.hortType] || scheduleData.hortType}`,
            date: scheduleDate.toISOString(),
            childId: scheduleData.childId,
            childName: scheduleData.childName,
            hortType: scheduleData.hortType,
          });
        }
      } catch (schedError) {
        console.error(`Error processing school schedule ${scheduleDoc.id}:`, schedError);
      }
    }
  } catch (schoolError) {
    console.error('Error fetching school schedules:', schoolError);
  }
  
  // Get school holidays
  try {
    const holidaysSnapshot = await db.collection('schoolHolidays').where('userId', '==', userId).get();
    
    for (const holidayDoc of holidaysSnapshot.docs) {
      try {
        const holidayData = holidayDoc.data();
        
        if (!holidayData.startDate) continue;
        
        let holidayStartDate: Date;
        let holidayEndDate: Date;
        
        if (holidayData.startDate?.toDate) {
          holidayStartDate = holidayData.startDate.toDate();
        } else {
          holidayStartDate = new Date(holidayData.startDate);
        }
        
        if (holidayData.endDate?.toDate) {
          holidayEndDate = holidayData.endDate.toDate();
        } else {
          holidayEndDate = holidayData.endDate ? new Date(holidayData.endDate) : holidayStartDate;
        }
        
        if (isNaN(holidayStartDate.getTime())) continue;
        
        // Filter by date range
        if (startDate && endDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          
          if (holidayEndDate < start || holidayStartDate > end) continue;
        }
        
        events.push({
          id: `school-holiday-${holidayDoc.id}`,
          type: 'school-holiday',
          title: holidayData.name || 'Schulferien',
          date: holidayStartDate.toISOString(),
          endDate: holidayEndDate.toISOString(),
          holidayType: holidayData.type,
        });
      } catch (holError) {
        console.error(`Error processing school holiday ${holidayDoc.id}:`, holError);
      }
    }
  } catch (holidaysError) {
    console.error('Error fetching school holidays:', holidaysError);
  }
  
  console.log(`Total events: ${events.length}`);

  // Sort by date
  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return { events };
});

// ========== Shopping List Functions ==========

export const getShoppingList = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { status } = request.data;

  let query: admin.firestore.Query = db.collection('shoppingList').where('userId', '==', userId);

  if (status) {
    query = query.where('status', '==', status);
  }

  const snapshot = await query.orderBy('createdAt', 'desc').get();
  const items = snapshot.docs.map(doc => {
    const data = doc.data();
    // Convert Firestore Timestamps to ISO strings for proper serialization
    const item: any = { id: doc.id, ...data };
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

export const createShoppingItem = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
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
  return { id: docRef.id, ...itemData };
});

export const updateShoppingItem = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { itemId, item, quantity, unit, category, estimatedPrice, actualPrice, status } = request.data;

  const itemRef = db.collection('shoppingList').doc(itemId);
  const itemDoc = await itemRef.get();

  if (!itemDoc.exists || itemDoc.data()?.userId !== userId) {
    throw new HttpsError('permission-denied', 'Not authorized to update this item');
  }

  const updateData: any = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (item !== undefined) updateData.item = item;
  if (quantity !== undefined) updateData.quantity = quantity;
  if (unit !== undefined) updateData.unit = unit;
  if (category !== undefined) updateData.category = category;
  if (estimatedPrice !== undefined) updateData.estimatedPrice = estimatedPrice;
  if (actualPrice !== undefined) updateData.actualPrice = actualPrice;
  if (status !== undefined) {
    updateData.status = status;
    if (status === 'bought') {
      updateData.boughtAt = admin.firestore.FieldValue.serverTimestamp();
    }
  }

  await itemRef.update(updateData);
  return { success: true };
});

export const deleteShoppingItem = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { itemId } = request.data;

  const itemRef = db.collection('shoppingList').doc(itemId);
  const itemDoc = await itemRef.get();

  if (!itemDoc.exists || itemDoc.data()?.userId !== userId) {
    throw new HttpsError('permission-denied', 'Not authorized to delete this item');
  }

  await itemRef.delete();
  return { success: true };
});

export const markShoppingItemAsBought = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { itemId, actualPrice, createExpense } = request.data;

  const itemRef = db.collection('shoppingList').doc(itemId);
  const itemDoc = await itemRef.get();

  if (!itemDoc.exists || itemDoc.data()?.userId !== userId) {
    throw new HttpsError('permission-denied', 'Not authorized to update this item');
  }

  const itemData = itemDoc.data();

  // Update shopping item
  await itemRef.update({
    status: 'bought',
    actualPrice: actualPrice || itemData?.estimatedPrice || 0,
    boughtAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Create expense if requested
  if (createExpense) {
    const expenseData = {
      userId,
      type: 'expense',
      category: itemData?.category || 'Einkauf',
      amount: actualPrice || itemData?.estimatedPrice || 0,
      currency: itemData?.currency || 'CHF',
      date: admin.firestore.Timestamp.now(),
      description: `Einkauf: ${itemData?.item}`,
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
export const processRecurringEntries = onSchedule({
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
export const processRecurringInvoices = onSchedule({
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

          const newInvoiceData: any = {
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
            case 'weekly': nextNextDue.setDate(nextNextDue.getDate() + 7); break;
            case 'monthly': nextNextDue.setMonth(nextNextDue.getMonth() + 1); break;
            case 'quarterly': nextNextDue.setMonth(nextNextDue.getMonth() + 3); break;
            case 'yearly': nextNextDue.setFullYear(nextNextDue.getFullYear() + 1); break;
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

export const getBudgets = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const snapshot = await db.collection('budgets')
    .where('userId', '==', userId)
    .get();

  const budgets = snapshot.docs.map(doc => {
    const data = doc.data();
    const budget: any = { id: doc.id, ...data };
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

export const createBudget = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
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
  return { id: docRef.id, ...budgetData };
});

export const updateBudget = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { id, ...updateData } = request.data;

  const docRef = db.collection('budgets').doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new HttpsError('not-found', 'Budget not found');
  }

  if (doc.data()?.userId !== userId) {
    throw new HttpsError('permission-denied', 'Not authorized');
  }

  updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
  await docRef.update(updateData);

  return { success: true };
});

export const deleteBudget = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { id } = request.data;

  const docRef = db.collection('budgets').doc(id);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new HttpsError('not-found', 'Budget not found');
  }

  if (doc.data()?.userId !== userId) {
    throw new HttpsError('permission-denied', 'Not authorized');
  }

  await docRef.delete();
  return { success: true };
});

// ========== Work Schedule Functions ==========

export const getWorkSchedules = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { personId } = request.data || {};

  let query = db.collection('workSchedules').where('userId', '==', userId);
  
  if (personId) {
    query = query.where('personId', '==', personId);
  }

  const snapshot = await query.get();
  const schedules = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
    updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null,
  }));

  return { schedules };
});

export const createWorkSchedule = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { personId, personName, date, type, startTime, endTime, notes } = request.data;

  if (!personId || !personName || !date || !type) {
    throw new HttpsError('invalid-argument', 'Missing required fields');
  }

  // Check if schedule already exists for this person and date
  const existingQuery = await db.collection('workSchedules')
    .where('userId', '==', userId)
    .where('personId', '==', personId)
    .where('date', '==', date)
    .get();

  if (!existingQuery.empty) {
    // Update existing schedule
    const docRef = existingQuery.docs[0].ref;
    await docRef.update({
      type,
      startTime: startTime || null,
      endTime: endTime || null,
      notes: notes || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { id: existingQuery.docs[0].id, updated: true };
  }

  const scheduleData = {
    userId,
    personId,
    personName,
    date,
    type,
    startTime: startTime || null,
    endTime: endTime || null,
    notes: notes || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const docRef = await db.collection('workSchedules').add(scheduleData);
  return { id: docRef.id, created: true };
});

export const updateWorkSchedule = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { id, type, startTime, endTime, notes } = request.data;

  if (!id) {
    throw new HttpsError('invalid-argument', 'Missing schedule ID');
  }

  const docRef = db.collection('workSchedules').doc(id);
  const doc = await docRef.get();

  if (!doc.exists || doc.data()?.userId !== userId) {
    throw new HttpsError('permission-denied', 'Not authorized');
  }

  const updateData: any = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (type !== undefined) updateData.type = type;
  if (startTime !== undefined) updateData.startTime = startTime;
  if (endTime !== undefined) updateData.endTime = endTime;
  if (notes !== undefined) updateData.notes = notes;

  await docRef.update(updateData);
  return { success: true };
});

export const deleteWorkSchedule = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { id } = request.data;

  const docRef = db.collection('workSchedules').doc(id);
  const doc = await docRef.get();

  if (!doc.exists || doc.data()?.userId !== userId) {
    throw new HttpsError('permission-denied', 'Not authorized');
  }

  await docRef.delete();
  return { success: true };
});

// ========== Vacation Functions ==========

export const getVacations = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { personId, startDate, endDate } = request.data || {};

  let query: any = db.collection('vacations').where('userId', '==', userId);
  
  if (personId) {
    query = query.where('personId', '==', personId);
  }

  const snapshot = await query.get();
  let vacations = snapshot.docs.map((doc: any) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      startDate: data.startDate?.toDate?.()?.toISOString() || null,
      endDate: data.endDate?.toDate?.()?.toISOString() || null,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
    };
  });

  // Filter by date range if provided
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    vacations = vacations.filter((v: any) => {
      const vStart = new Date(v.startDate);
      const vEnd = new Date(v.endDate);
      return (vStart <= end && vEnd >= start);
    });
  }

  return { vacations };
});

export const createVacation = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { personId, personName, startDate, endDate, type, title, notes, color } = request.data;

  if (!personId || !personName || !startDate || !endDate || !type || !title) {
    throw new HttpsError('invalid-argument', 'Missing required fields');
  }

  const vacationData = {
    userId,
    personId,
    personName,
    startDate: admin.firestore.Timestamp.fromDate(new Date(startDate)),
    endDate: admin.firestore.Timestamp.fromDate(new Date(endDate)),
    type,
    title,
    notes: notes || null,
    color: color || null,
    approved: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const docRef = await db.collection('vacations').add(vacationData);
  return { id: docRef.id };
});

export const updateVacation = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { id, startDate, endDate, type, title, notes, color, approved } = request.data;

  if (!id) {
    throw new HttpsError('invalid-argument', 'Missing vacation ID');
  }

  const docRef = db.collection('vacations').doc(id);
  const doc = await docRef.get();

  if (!doc.exists || doc.data()?.userId !== userId) {
    throw new HttpsError('permission-denied', 'Not authorized');
  }

  const updateData: any = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (startDate !== undefined) updateData.startDate = admin.firestore.Timestamp.fromDate(new Date(startDate));
  if (endDate !== undefined) updateData.endDate = admin.firestore.Timestamp.fromDate(new Date(endDate));
  if (type !== undefined) updateData.type = type;
  if (title !== undefined) updateData.title = title;
  if (notes !== undefined) updateData.notes = notes;
  if (color !== undefined) updateData.color = color;
  if (approved !== undefined) updateData.approved = approved;

  await docRef.update(updateData);
  return { success: true };
});

export const deleteVacation = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { id } = request.data;

  const docRef = db.collection('vacations').doc(id);
  const doc = await docRef.get();

  if (!doc.exists || doc.data()?.userId !== userId) {
    throw new HttpsError('permission-denied', 'Not authorized');
  }

  await docRef.delete();
  return { success: true };
});

// ========== School Planner Functions ==========

// Get all children (from people with type 'child')
export const getChildren = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  
  // Get people marked as children
  const snapshot = await db.collection('people')
    .where('userId', '==', userId)
    .where('type', '==', 'child')
    .get();

  const children = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  return { children };
});

// Create/Update School Schedule
export const createSchoolSchedule = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { childId, childName, date, schoolType, hortType, startTime, endTime, notes } = request.data;

  if (!childId || !childName || !date || !schoolType) {
    throw new HttpsError('invalid-argument', 'Missing required fields');
  }

  // Check if schedule already exists for this child and date
  const existingQuery = await db.collection('schoolSchedules')
    .where('userId', '==', userId)
    .where('childId', '==', childId)
    .where('date', '==', date)
    .get();

  if (!existingQuery.empty) {
    // Update existing schedule
    const docRef = existingQuery.docs[0].ref;
    await docRef.update({
      schoolType,
      hortType: hortType || 'none',
      startTime: startTime || null,
      endTime: endTime || null,
      notes: notes || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { id: existingQuery.docs[0].id, updated: true };
  }

  const scheduleData = {
    userId,
    childId,
    childName,
    date,
    schoolType,
    hortType: hortType || 'none',
    startTime: startTime || null,
    endTime: endTime || null,
    notes: notes || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const docRef = await db.collection('schoolSchedules').add(scheduleData);
  return { id: docRef.id, created: true };
});

// Get School Schedules
export const getSchoolSchedules = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { childId, startDate, endDate } = request.data || {};

  let query: admin.firestore.Query = db.collection('schoolSchedules').where('userId', '==', userId);
  
  if (childId) {
    query = query.where('childId', '==', childId);
  }

  const snapshot = await query.get();
  
  let schedules = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  // Filter by date range if provided
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    schedules = schedules.filter(s => {
      const d = new Date((s as any).date);
      return d >= start && d <= end;
    });
  }

  return { schedules };
});

// Delete School Schedule
export const deleteSchoolSchedule = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { id } = request.data;

  const docRef = db.collection('schoolSchedules').doc(id);
  const doc = await docRef.get();

  if (!doc.exists || doc.data()?.userId !== userId) {
    throw new HttpsError('permission-denied', 'Not authorized');
  }

  await docRef.delete();
  return { success: true };
});

// Create School Holiday
export const createSchoolHoliday = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { name, startDate, endDate, type, canton } = request.data;

  if (!name || !startDate || !endDate) {
    throw new HttpsError('invalid-argument', 'Missing required fields');
  }

  const holidayData = {
    userId,
    name,
    startDate,
    endDate,
    type: type || 'school',
    canton: canton || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const docRef = await db.collection('schoolHolidays').add(holidayData);
  return { id: docRef.id };
});

// Get School Holidays
export const getSchoolHolidays = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  
  const snapshot = await db.collection('schoolHolidays')
    .where('userId', '==', userId)
    .get();

  const holidays = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  return { holidays };
});

// Delete School Holiday
export const deleteSchoolHoliday = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { id } = request.data;

  const docRef = db.collection('schoolHolidays').doc(id);
  const doc = await docRef.get();

  if (!doc.exists || doc.data()?.userId !== userId) {
    throw new HttpsError('permission-denied', 'Not authorized');
  }

  await docRef.delete();
  return { success: true };
});

// ========== Document Management Functions ==========

const storage = admin.storage();

// Get User Settings (including OCR provider)
export const getUserSettings = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const settingsDoc = await db.collection('userSettings').doc(userId).get();
  
  if (!settingsDoc.exists) {
    // Return default settings
    return {
      ocrProvider: 'google', // google, openai, regex
      openaiApiKey: null,
      autoConfirmDocuments: false,
      defaultFolder: 'Sonstiges',
      language: 'de',
      theme: 'system',
    };
  }
  
  return settingsDoc.data();
});

// Update User Settings
export const updateUserSettings = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const settings = request.data;

  await db.collection('userSettings').doc(userId).set({
    ...settings,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  return { success: true };
});

// Upload Document
export const uploadDocument = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { personId, fileName, fileData, fileType, folder } = request.data;

  // Validate person belongs to user
  const personDoc = await db.collection('people').doc(personId).get();
  if (!personDoc.exists || personDoc.data()?.userId !== userId) {
    throw new HttpsError('permission-denied', 'Not authorized to upload to this person');
  }

  // Create document record
  const docData = {
    userId,
    personId,
    fileName,
    fileType,
    folder: folder || 'Sonstiges',
    status: 'uploaded', // uploaded, analyzed, processed
    analysisResult: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const docRef = await db.collection('people').doc(personId).collection('documents').add(docData);

  // Upload file to Storage
  const bucket = storage.bucket();
  const filePath = `documents/${userId}/${personId}/${docRef.id}/${fileName}`;
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

  // Update document with file URL
  await docRef.update({
    fileUrl: url,
    filePath,
  });

  return { 
    id: docRef.id, 
    ...docData,
    fileUrl: url,
    filePath,
  };
});

// Analyze Document (OCR/AI) - Supports Images, PDF, Word, Excel with Fallback Workflow
export const analyzeDocument = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { documentId, personId, fileData, fileType, fileName } = request.data;

  // Get user settings for OCR provider
  const settingsDoc = await db.collection('userSettings').doc(userId).get();
  const settings = settingsDoc.exists ? settingsDoc.data() : { ocrProvider: 'regex' };
  const ocrProvider = settings?.ocrProvider || 'regex';

  let analysisResult: any = {
    type: 'unknown',
    confidence: 0,
    extractedData: {},
    rawText: '',
    method: 'none',
  };

  const buffer = Buffer.from(fileData, 'base64');
  let extractedText = '';
  const mimeType = fileType?.toLowerCase() || '';
  const fileExt = fileName?.toLowerCase().split('.').pop() || '';

  // Helper function to try Google Vision OCR
  const tryGoogleVision = async (imageBuffer: Buffer): Promise<string> => {
    try {
      const vision = require('@google-cloud/vision');
      const client = new vision.ImageAnnotatorClient();
      const [result] = await client.textDetection(imageBuffer);
      const detections = result.textAnnotations;
      return detections && detections.length > 0 ? detections[0].description : '';
    } catch (e) {
      console.error('Google Vision error:', e);
      return '';
    }
  };

  // Helper function to try OpenAI Vision
  const tryOpenAIVision = async (base64Data: string, mimeType: string): Promise<any> => {
    if (!settings?.openaiApiKey) return null;
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4-vision-preview',
          messages: [{
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analysiere dieses Dokument und extrahiere strukturierte Daten. 
                Antworte NUR mit JSON: {"type": "rechnung"|"termin"|"vertrag"|"sonstiges", "confidence": 0-100, "extractedData": {...}}`
              },
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Data}` } }
            ]
          }],
          max_tokens: 1000,
        }),
      });
      const data = await response.json();
      if (data.choices?.[0]?.message?.content) {
        return JSON.parse(data.choices[0].message.content);
      }
    } catch (e) {
      console.error('OpenAI Vision error:', e);
    }
    return null;
  };

  try {
    // ============================================
    // STEP 1: Try direct text extraction first
    // ============================================
    
    // PDF files
    if (mimeType.includes('pdf') || fileExt === 'pdf') {
      try {
        const pdfParse = require('pdf-parse');
        const pdfData = await pdfParse(buffer);
        extractedText = (pdfData.text || '').trim();
        analysisResult.method = 'pdf-parse';
      } catch (e) {
        console.log('PDF parse failed, will try OCR');
      }
      
    // Word documents (.docx)
    } else if (mimeType.includes('word') || mimeType.includes('openxmlformats-officedocument.wordprocessingml') || fileExt === 'docx' || fileExt === 'doc') {
      try {
        const mammoth = require('mammoth');
        const result = await mammoth.extractRawText({ buffer });
        extractedText = (result.value || '').trim();
        analysisResult.method = 'mammoth';
      } catch (e) {
        console.log('Word parse failed');
      }
      
    // Excel files (.xlsx, .xls)
    } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet') || fileExt === 'xlsx' || fileExt === 'xls') {
      try {
        const XLSX = require('xlsx');
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        let allText = '';
        workbook.SheetNames.forEach((sheetName: string) => {
          const sheet = workbook.Sheets[sheetName];
          const text = XLSX.utils.sheet_to_txt(sheet);
          allText += text + '\n';
        });
        extractedText = allText.trim();
        analysisResult.method = 'xlsx';
      } catch (e) {
        console.log('Excel parse failed');
      }
      
    // CSV files
    } else if (mimeType.includes('csv') || fileExt === 'csv') {
      extractedText = buffer.toString('utf8').trim();
      analysisResult.method = 'csv';
      
    // Plain text files
    } else if (mimeType.includes('text') || fileExt === 'txt') {
      extractedText = buffer.toString('utf8').trim();
      analysisResult.method = 'text';
      
    // Images - go directly to OCR
    } else if (mimeType.includes('image')) {
      analysisResult.method = 'image-ocr';
    }

    // ============================================
    // STEP 2: If text extraction failed or too short, try OCR
    // ============================================
    const MIN_TEXT_LENGTH = 20; // Minimum characters to consider extraction successful
    
    if (extractedText.length < MIN_TEXT_LENGTH) {
      console.log(`Text too short (${extractedText.length} chars), trying OCR fallback...`);
      
      // Try Google Vision first (works on images AND PDFs)
      if (ocrProvider === 'google' || ocrProvider === 'regex') {
        const visionText = await tryGoogleVision(buffer);
        if (visionText && visionText.length > extractedText.length) {
          extractedText = visionText;
          analysisResult.method = 'google-vision';
        }
      }
      
      // If still not enough, try OpenAI Vision
      if (extractedText.length < MIN_TEXT_LENGTH && settings?.openaiApiKey) {
        const openaiResult = await tryOpenAIVision(fileData, fileType);
        if (openaiResult) {
          analysisResult = { ...analysisResult, ...openaiResult, method: 'openai-vision' };
          extractedText = openaiResult.rawText || '';
        }
      }
    }

    // ============================================
    // STEP 3: Analyze the extracted text
    // ============================================
    if (extractedText.length > 0) {
      analysisResult.rawText = extractedText;
      analysisResult = analyzeText(extractedText, analysisResult);
    } else {
      // No text could be extracted
      analysisResult.type = 'sonstiges';
      analysisResult.confidence = 5;
      analysisResult.message = 'Kein Text erkannt. Bitte Google Cloud Vision in den Einstellungen aktivieren.';
    }

    // ============================================
    // STEP 4: If confidence is still low, try OCR as final attempt
    // ============================================
    if (analysisResult.confidence < 30 && analysisResult.method !== 'google-vision' && analysisResult.method !== 'openai-vision') {
      console.log('Low confidence, trying OCR as final fallback...');
      
      // Try Google Vision
      if (ocrProvider === 'google') {
        const visionText = await tryGoogleVision(buffer);
        if (visionText && visionText.length > 50) {
          const visionResult = analyzeText(visionText, { ...analysisResult, rawText: visionText });
          if (visionResult.confidence > analysisResult.confidence) {
            analysisResult = { ...visionResult, method: 'google-vision-fallback' };
          }
        }
      }
      
      // Try OpenAI Vision as last resort
      if (analysisResult.confidence < 30 && settings?.openaiApiKey) {
        const openaiResult = await tryOpenAIVision(fileData, fileType);
        if (openaiResult && (openaiResult.confidence || 0) > analysisResult.confidence) {
          analysisResult = { ...analysisResult, ...openaiResult, method: 'openai-vision-fallback' };
        }
      }
    }

    // Update document with analysis result
    if (documentId && personId) {
      await db.collection('people').doc(personId).collection('documents').doc(documentId).update({
        analysisResult,
        status: 'analyzed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

  } catch (error: any) {
    console.error('Analysis error:', error);
    analysisResult.error = error.message;
    analysisResult.type = 'sonstiges';
    analysisResult.confidence = 10;
  }

  return analysisResult;
});

// Helper function to analyze text with regex patterns
function analyzeText(text: string, result: any): any {
  
  // Check for invoice patterns
  const invoicePatterns = [
    /RECHNUNG/i,
    /INVOICE/i,
    /ZAHLBAR BIS/i,
    /FÄLLIG/i,
    /BETRAG/i,
    /TOTAL/i,
    /MWST/i,
    /QR-RECHNUNG/i,
  ];
  
  // Check for appointment patterns
  const appointmentPatterns = [
    /TERMIN/i,
    /EINLADUNG/i,
    /MEETING/i,
    /BESPRECHUNG/i,
    /VERANSTALTUNG/i,
    /RESERVIERUNG/i,
  ];
  
  // Check for contract patterns
  const contractPatterns = [
    /VERTRAG/i,
    /VEREINBARUNG/i,
    /KONTRAKT/i,
    /MIETVERTRAG/i,
    /ARBEITSVERTRAG/i,
  ];
  
  let invoiceScore = 0;
  let appointmentScore = 0;
  let contractScore = 0;
  
  invoicePatterns.forEach(p => { if (p.test(text)) invoiceScore += 15; });
  appointmentPatterns.forEach(p => { if (p.test(text)) appointmentScore += 15; });
  contractPatterns.forEach(p => { if (p.test(text)) contractScore += 15; });
  
  // Determine type
  const maxScore = Math.max(invoiceScore, appointmentScore, contractScore);
  
  if (maxScore === 0) {
    result.type = 'sonstiges';
    result.confidence = 20;
  } else if (invoiceScore === maxScore) {
    result.type = 'rechnung';
    result.confidence = Math.min(invoiceScore, 95);
    
    // Extract invoice data
    const amountMatch = text.match(/(?:CHF|EUR|USD|Fr\.?)\s*([\d',.]+)/i) || 
                        text.match(/([\d',.]+)\s*(?:CHF|EUR|USD|Fr\.?)/i);
    const ibanMatch = text.match(/[A-Z]{2}\d{2}\s?[\dA-Z]{4}\s?[\dA-Z]{4}\s?[\dA-Z]{4}\s?[\dA-Z]{4}\s?[\dA-Z]{0,4}/);
    const dateMatch = text.match(/(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})/);
    
    result.extractedData = {
      amount: amountMatch ? parseFloat(amountMatch[1].replace(/[',]/g, '')) : null,
      currency: 'CHF',
      iban: ibanMatch ? ibanMatch[0].replace(/\s/g, '') : null,
      dueDate: dateMatch ? `${dateMatch[3].length === 2 ? '20' + dateMatch[3] : dateMatch[3]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[1].padStart(2, '0')}` : null,
    };
    
  } else if (appointmentScore === maxScore) {
    result.type = 'termin';
    result.confidence = Math.min(appointmentScore, 95);
    
    // Extract appointment data
    const dateMatch = text.match(/(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})/);
    const timeMatch = text.match(/(\d{1,2})[:\.](\d{2})\s*(?:Uhr)?/i);
    
    result.extractedData = {
      date: dateMatch ? `${dateMatch[3].length === 2 ? '20' + dateMatch[3] : dateMatch[3]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[1].padStart(2, '0')}` : null,
      time: timeMatch ? `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}` : null,
    };
    
  } else if (contractScore === maxScore) {
    result.type = 'vertrag';
    result.confidence = Math.min(contractScore, 95);
    
    const dateMatch = text.match(/(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})/);
    
    result.extractedData = {
      startDate: dateMatch ? `${dateMatch[3].length === 2 ? '20' + dateMatch[3] : dateMatch[3]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[1].padStart(2, '0')}` : null,
    };
  }
  
  result.rawText = text.substring(0, 500); // Limit raw text
  return result;
}

// Get Person Documents
export const getPersonDocuments = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { personId, folder } = request.data;

  // Validate person belongs to user
  const personDoc = await db.collection('people').doc(personId).get();
  if (!personDoc.exists || personDoc.data()?.userId !== userId) {
    throw new HttpsError('permission-denied', 'Not authorized');
  }

  let query: admin.firestore.Query = db.collection('people').doc(personId).collection('documents');
  
  if (folder) {
    query = query.where('folder', '==', folder);
  }

  const snapshot = await query.orderBy('createdAt', 'desc').get();
  
  const documents = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
    };
  });

  return { documents };
});

// Update Document (move to folder, change category)
export const updateDocument = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { documentId, personId, folder, status } = request.data;

  // Validate person belongs to user
  const personDoc = await db.collection('people').doc(personId).get();
  if (!personDoc.exists || personDoc.data()?.userId !== userId) {
    throw new HttpsError('permission-denied', 'Not authorized');
  }

  const updateData: any = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (folder !== undefined) updateData.folder = folder;
  if (status !== undefined) updateData.status = status;

  await db.collection('people').doc(personId).collection('documents').doc(documentId).update(updateData);

  return { success: true };
});

// Delete Document
export const deleteDocument = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { documentId, personId } = request.data;

  // Validate person belongs to user
  const personDoc = await db.collection('people').doc(personId).get();
  if (!personDoc.exists || personDoc.data()?.userId !== userId) {
    throw new HttpsError('permission-denied', 'Not authorized');
  }

  // Get document to find file path
  const docRef = db.collection('people').doc(personId).collection('documents').doc(documentId);
  const doc = await docRef.get();
  
  if (doc.exists) {
    const data = doc.data();
    
    // Delete file from Storage
    if (data?.filePath) {
      try {
        const bucket = storage.bucket();
        await bucket.file(data.filePath).delete();
      } catch (e) {
        console.error('Error deleting file:', e);
      }
    }
    
    // Delete document record
    await docRef.delete();
  }

  return { success: true };
});

// Process Document (create invoice/reminder from analyzed document)
export const processDocument = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { documentId, personId, type, data } = request.data;

  // Validate person belongs to user
  const personDoc = await db.collection('people').doc(personId).get();
  if (!personDoc.exists || personDoc.data()?.userId !== userId) {
    throw new HttpsError('permission-denied', 'Not authorized');
  }

  const personData = personDoc.data();
  let result: any = { success: true };

  if (type === 'rechnung') {
    // Create invoice
    const invoiceData = {
      description: data.description || 'Rechnung',
      amount: data.amount || 0,
      status: 'open',
      direction: data.direction || 'outgoing',
      dueDate: data.dueDate ? admin.firestore.Timestamp.fromDate(new Date(data.dueDate)) : null,
      iban: data.iban || null,
      documentId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const invoiceRef = await db.collection('people').doc(personId).collection('invoices').add(invoiceData);
    result.invoiceId = invoiceRef.id;
    result.type = 'rechnung';

  } else if (type === 'termin') {
    // Create reminder/appointment
    const reminderData = {
      userId,
      title: data.title || 'Termin',
      type: 'termin',
      dueDate: data.date ? admin.firestore.Timestamp.fromDate(new Date(data.date + (data.time ? `T${data.time}` : 'T12:00'))) : admin.firestore.Timestamp.fromDate(new Date()),
      notes: data.description || null,
      personId,
      personName: personData?.name,
      status: 'offen',
      documentId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const reminderRef = await db.collection('reminders').add(reminderData);
    result.reminderId = reminderRef.id;
    result.type = 'termin';
  }

  // Update document status and folder
  const folder = type === 'rechnung' ? 'Rechnungen' : type === 'termin' ? 'Termine' : 'Sonstiges';
  await db.collection('people').doc(personId).collection('documents').doc(documentId).update({
    status: 'processed',
    folder,
    processedType: type,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return result;
});

// Get All Documents (across all persons for the user)
export const getAllDocuments = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { folder, limit: queryLimit } = request.data || {};

  // Get all people for this user
  const peopleSnapshot = await db.collection('people').where('userId', '==', userId).get();
  
  const allDocuments: any[] = [];
  
  for (const personDoc of peopleSnapshot.docs) {
    const personData = personDoc.data();
    
    let docsQuery: admin.firestore.Query = personDoc.ref.collection('documents');
    
    if (folder && folder !== 'all') {
      docsQuery = docsQuery.where('folder', '==', folder);
    }
    
    // Don't use orderBy in query to avoid index requirement - sort in code instead
    const docsSnapshot = await docsQuery.get();
    
    for (const doc of docsSnapshot.docs) {
      const data = doc.data();
      allDocuments.push({
        id: doc.id,
        personId: personDoc.id,
        personName: personData.name,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
      });
    }
  }
  
  // Sort by createdAt descending
  allDocuments.sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });
  
  // Apply limit if specified
  const limitedDocs = queryLimit ? allDocuments.slice(0, queryLimit) : allDocuments;
  
  return { documents: limitedDocs, total: allDocuments.length };
});

// ============================================
// SHOPPING LIST SCANNER & ARCHIVE
// ============================================

// Analyze Shopping List (OCR)
export const analyzeShoppingList = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { fileData, fileType, fileName } = request.data;
  const buffer = Buffer.from(fileData, 'base64');
  let extractedText = '';
  const mimeType = fileType?.toLowerCase() || '';
  const fileExt = fileName?.toLowerCase().split('.').pop() || '';

  try {
    // Extract text based on file type
    if (mimeType.includes('pdf') || fileExt === 'pdf') {
      const pdfParse = require('pdf-parse');
      const pdfData = await pdfParse(buffer);
      extractedText = (pdfData.text || '').trim();
    } else if (mimeType.includes('image')) {
      // Use Google Vision for images
      try {
        const vision = require('@google-cloud/vision');
        const client = new vision.ImageAnnotatorClient();
        const [result] = await client.textDetection(buffer);
        const detections = result.textAnnotations;
        extractedText = detections && detections.length > 0 ? detections[0].description : '';
      } catch (e) {
        console.error('Vision OCR error:', e);
      }
    } else {
      extractedText = buffer.toString('utf8').trim();
    }

    // Parse shopping items from text
    const items = parseShoppingItems(extractedText);

    return {
      success: true,
      rawText: extractedText,
      items,
      itemCount: items.length,
    };

  } catch (error: any) {
    console.error('Shopping list analysis error:', error);
    return {
      success: false,
      error: error.message,
      items: [],
    };
  }
});

// Helper function to parse shopping items from text
function parseShoppingItems(text: string): Array<{ name: string; quantity?: number; unit?: string; category?: string }> {
  const items: Array<{ name: string; quantity?: number; unit?: string; category?: string }> = [];
  
  // Common units
  const unitPatterns = /(\d+(?:[.,]\d+)?)\s*(kg|g|l|ml|stk|stück|pack|pkg|dose|dosen|flasche|fl|beutel|tüte|scheiben|riegel|becher|glas|tube)?\s*/i;
  
  // Category keywords
  const categoryKeywords: Record<string, string[]> = {
    'Obst & Gemüse': ['apfel', 'äpfel', 'banane', 'orange', 'tomate', 'salat', 'gurke', 'kartoffel', 'zwiebel', 'karotte', 'paprika', 'brokkoli', 'spinat', 'zucchini', 'aubergine', 'pilz', 'champignon'],
    'Milchprodukte': ['milch', 'käse', 'joghurt', 'butter', 'sahne', 'quark', 'schmand', 'frischkäse', 'mozzarella'],
    'Fleisch & Fisch': ['fleisch', 'huhn', 'hähnchen', 'rind', 'schwein', 'lachs', 'fisch', 'wurst', 'schinken', 'salami', 'hack'],
    'Brot & Backwaren': ['brot', 'brötchen', 'toast', 'croissant', 'kuchen', 'gebäck', 'mehl'],
    'Getränke': ['wasser', 'saft', 'cola', 'bier', 'wein', 'kaffee', 'tee', 'limonade', 'energy'],
    'Süsswaren': ['schokolade', 'keks', 'gummibärchen', 'bonbon', 'eis', 'chips', 'snack'],
    'Haushalt': ['waschmittel', 'spülmittel', 'toilettenpapier', 'taschentücher', 'müllbeutel', 'reiniger'],
    'Hygiene': ['shampoo', 'duschgel', 'seife', 'zahnpasta', 'deo', 'creme'],
  };

  // Split text into lines and process
  const lines = text.split(/[\n\r]+/);
  
  for (let line of lines) {
    line = line.trim();
    if (!line || line.length < 2) continue;
    
    // Skip common non-item lines
    if (/^(einkaufsliste|shopping|liste|datum|total|summe|€|chf|\d+[.,]\d{2}$)/i.test(line)) continue;
    
    // Extract quantity and unit
    let quantity: number | undefined;
    let unit: string | undefined;
    let itemName = line;
    
    const match = line.match(unitPatterns);
    if (match) {
      quantity = parseFloat(match[1].replace(',', '.'));
      unit = match[2]?.toLowerCase();
      itemName = line.replace(match[0], '').trim();
    }
    
    // Also check for patterns like "2x Milch" or "3 Äpfel"
    const countMatch = itemName.match(/^(\d+)\s*[xX×]?\s+(.+)/);
    if (countMatch && !quantity) {
      quantity = parseInt(countMatch[1]);
      itemName = countMatch[2].trim();
    }
    
    // Clean up item name
    itemName = itemName
      .replace(/^[-•*○◦▪▸►→·]\s*/, '') // Remove bullet points
      .replace(/^\d+[.)]\s*/, '') // Remove numbering
      .replace(/\s+/g, ' ')
      .trim();
    
    if (!itemName || itemName.length < 2) continue;
    
    // Determine category
    let category: string | undefined;
    const lowerName = itemName.toLowerCase();
    for (const [cat, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(kw => lowerName.includes(kw))) {
        category = cat;
        break;
      }
    }
    
    items.push({
      name: itemName,
      quantity: quantity || 1,
      unit,
      category: category || 'Sonstiges',
    });
  }
  
  return items;
}

// Save Shopping List Template (Archive)
export const saveShoppingListTemplate = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { name, items, sourceImage } = request.data;

  if (!name || !items || items.length === 0) {
    throw new HttpsError('invalid-argument', 'Name and items are required');
  }

  const templateData = {
    userId,
    name,
    items,
    sourceImage: sourceImage || null,
    usageCount: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const templateRef = await db.collection('shoppingListTemplates').add(templateData);
  
  return { 
    success: true, 
    templateId: templateRef.id,
  };
});

// Get Shopping List Templates
export const getShoppingListTemplates = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  
  const templatesSnapshot = await db.collection('shoppingListTemplates')
    .where('userId', '==', userId)
    .get();
  
  const templates = templatesSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || '',
      items: data.items || [],
      usageCount: data.usageCount || 0,
      sourceImage: data.sourceImage || null,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
    };
  });
  
  // Sort by usage count (most used first), then by date
  templates.sort((a, b) => {
    if (b.usageCount !== a.usageCount) return b.usageCount - a.usageCount;
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });
  
  return { templates };
});

// Delete Shopping List Template
export const deleteShoppingListTemplate = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { templateId } = request.data;

  const templateDoc = await db.collection('shoppingListTemplates').doc(templateId).get();
  
  if (!templateDoc.exists || templateDoc.data()?.userId !== userId) {
    throw new HttpsError('permission-denied', 'Not authorized');
  }

  await db.collection('shoppingListTemplates').doc(templateId).delete();
  
  return { success: true };
});

// Use Shopping List Template (add items and increment usage count)
export const useShoppingListTemplate = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { templateId } = request.data;

  const templateDoc = await db.collection('shoppingListTemplates').doc(templateId).get();
  
  if (!templateDoc.exists || templateDoc.data()?.userId !== userId) {
    throw new HttpsError('permission-denied', 'Not authorized');
  }

  const templateData = templateDoc.data();
  const items = templateData?.items || [];

  // Add items to shopping list
  const batch = db.batch();
  const addedItems: string[] = [];
  
  for (const item of items) {
    const itemData = {
      userId,
      name: item.name,
      quantity: item.quantity || 1,
      unit: item.unit || null,
      category: item.category || 'Sonstiges',
      bought: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    const itemRef = db.collection('shoppingList').doc();
    batch.set(itemRef, itemData);
    addedItems.push(itemRef.id);
  }

  // Increment usage count
  batch.update(db.collection('shoppingListTemplates').doc(templateId), {
    usageCount: admin.firestore.FieldValue.increment(1),
    lastUsedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await batch.commit();

  return { 
    success: true, 
    addedCount: addedItems.length,
    addedItems,
  };
});

// ============================================
// INTELLIGENT RECEIPT SCANNER SYSTEM
// ============================================

interface ReceiptItem {
  name: string;
  articleNumber?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxCategory?: string;
}

interface ReceiptData {
  store: {
    name: string;
    address?: string;
    city?: string;
    postalCode?: string;
  };
  purchase: {
    date?: string;
    time?: string;
    paymentMethod?: string;
  };
  items: ReceiptItem[];
  totals: {
    subtotal?: number;
    rounding?: number;
    total: number;
    itemCount?: number;
  };
  tax?: {
    categoryA?: { rate: number; net: number; tax: number };
    categoryB?: { rate: number; net: number; tax: number };
  };
  rawText: string;
  confidence: number;
}

// Analyze Receipt with intelligent parsing
export const analyzeReceipt = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { fileData, fileType, fileName } = request.data;
  
  if (!fileData) {
    return { success: false, error: 'Keine Bilddaten erhalten' };
  }
  
  const buffer = Buffer.from(fileData, 'base64');
  let extractedText = '';
  let visionError = '';

  console.log(`Processing receipt: ${fileName}, type: ${fileType}, size: ${buffer.length} bytes`);

  // Step 1: Extract text using OCR
  try {
    const mimeType = fileType?.toLowerCase() || '';
    const fileExt = fileName?.toLowerCase().split('.').pop() || '';

    if (mimeType.includes('pdf') || fileExt === 'pdf') {
      const pdfParse = require('pdf-parse');
      const pdfData = await pdfParse(buffer);
      extractedText = (pdfData.text || '').trim();
      console.log('PDF text extracted:', extractedText.length, 'chars');
    } else if (mimeType.includes('image') || ['jpg', 'jpeg', 'png', 'webp'].includes(fileExt)) {
      // Use Google Vision for images
      try {
        const vision = require('@google-cloud/vision');
        const client = new vision.ImageAnnotatorClient();
        const [result] = await client.textDetection(buffer);
        const detections = result.textAnnotations;
        extractedText = detections && detections.length > 0 ? detections[0].description : '';
        console.log('Vision OCR result:', extractedText.length, 'chars');
      } catch (e: any) {
        console.error('Vision OCR error:', e.message);
        visionError = e.message;
        
        // Try to provide helpful error message
        if (e.message?.includes('PERMISSION_DENIED') || e.message?.includes('403')) {
          return { 
            success: false, 
            error: 'Google Cloud Vision API nicht aktiviert. Bitte in der Google Cloud Console aktivieren: https://console.cloud.google.com/apis/library/vision.googleapis.com',
            details: e.message 
          };
        }
        if (e.message?.includes('billing')) {
          return { 
            success: false, 
            error: 'Google Cloud Billing nicht aktiviert. Vision API benötigt ein Abrechnungskonto.',
            details: e.message 
          };
        }
        
        return { 
          success: false, 
          error: 'OCR fehlgeschlagen: ' + e.message,
          details: 'Bitte Google Cloud Vision API aktivieren oder Bild mit besserer Qualität hochladen.' 
        };
      }
    } else {
      extractedText = buffer.toString('utf8').trim();
    }

    if (!extractedText || extractedText.length < 10) {
      return { 
        success: false, 
        error: 'Kein Text erkannt. Bitte Quittung mit besserer Beleuchtung fotografieren.',
        rawText: extractedText || '',
        visionError: visionError
      };
    }

    console.log('Extracted text preview:', extractedText.substring(0, 200));

    // Step 2: Parse the receipt intelligently
    const receiptData = parseSwissReceipt(extractedText);

    return {
      success: true,
      ...receiptData,
    };

  } catch (error: any) {
    console.error('Receipt analysis error:', error);
    return { success: false, error: error.message, stack: error.stack };
  }
});

// ========================================
// SINGLE LINE SCANNER - For item-by-item scanning
// ========================================
export const analyzeSingleLine = onCall({ memory: '512MiB', timeoutSeconds: 30 }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { fileData } = request.data;

  if (!fileData) {
    return { success: false, error: 'No file data provided' };
  }

  try {
    const buffer = Buffer.from(fileData, 'base64');
    console.log(`[analyzeSingleLine] Processing image: ${buffer.length} bytes`);

    // Use Google Cloud Vision for OCR
    const vision = require('@google-cloud/vision');
    const visionClient = new vision.ImageAnnotatorClient();
    const [result] = await visionClient.textDetection({
      image: { content: buffer.toString('base64') },
    });

    const detections = result.textAnnotations;
    let extractedText = '';

    if (detections && detections.length > 0) {
      extractedText = detections[0].description || '';
    }

    console.log(`[analyzeSingleLine] OCR result: ${extractedText.length} chars`);
    console.log(`[analyzeSingleLine] Text: ${extractedText}`);

    if (!extractedText || extractedText.length < 3) {
      return { 
        success: false, 
        error: 'Kein Text erkannt',
        rawText: extractedText || ''
      };
    }

    // Parse single line/item
    const item = parseSingleItem(extractedText);

    if (item) {
      console.log(`[analyzeSingleLine] Parsed item:`, JSON.stringify(item));
      return {
        success: true,
        item: item,
        rawText: extractedText
      };
    } else {
      console.log(`[analyzeSingleLine] No item found in text`);
      return {
        success: false,
        error: 'Artikel nicht erkannt',
        rawText: extractedText
      };
    }

  } catch (error: any) {
    console.error('[analyzeSingleLine] Error:', error);
    return { success: false, error: error.message };
  }
});

// Parse a single item from OCR text - INTELLIGENT FILTERING
function parseSingleItem(text: string): { name: string; price: number; quantity: number; articleNumber?: string } | null {
  const lines = text.split(/[\n\r]+/).map(l => l.trim()).filter(l => l.length > 0);
  
  // INTELLIGENT SKIP PATTERNS - Comprehensive list of non-item lines
  const skipPatterns = [
    // Header/Footer metadata
    /^(CHF|Total|Summe|Zwischensumme|Rundung|MwSt|MWST|Netto|Brutto|Kartenzahlung|Barzahlung|TWINT|Debit|Kredit)/i,
    /^(ALDI|MIGROS|COOP|LIDL|DENNER|SPAR|VOLG|MANOR|SNIPES|H&M|ZARA|BP|SHELL|AVIA|VENDEX)/i,
    /^(VIELEN|Danke|Thank|Bitte|Herzlich|Willkommen|Geschäft|Store|Bon|Zeit|Datum|Kasse)/i,
    /^(Artikel|ANZAHL|Pos\.|Position|Rabatt|Urspr\.\s*Preis|Urspr\.Preis)/i,
    /^(Member|EFT|Buchung|Trm-Id|Trx|Auth|Rückgeld|Gegeben|Erhalten)/i,
    /^(CHE-|MWST-Nr|UID|www\.|Tel|Telefon|Email)/i,
    // Barcodes and IDs
    /^\d{10,}$/, // Long numbers (barcodes)
    /^[A-Z]{2,3}-?\d{3,}/i, // Tax IDs
    /^CHF$/i,
    // Separators
    /^[x×]\s*$/i, // Standalone x
    /^[-=*#]+$/, // Separators
    /^\s*\d+\s*Artikel\s*$/i,
    // Tax summary lines
    /^(A|B|Ges\.?)\s+\d/i,
    // Price-only lines without context (likely totals)
    /^(\d+[.,]\d{2})\s*$/,
    // Store addresses and locations
    /^\d{4}\s+[A-Za-zäöüÄÖÜ\-\s]+$/i, // Postal code + city
    /^[A-Za-zäöüÄÖÜ]+(?:strasse|str\.|weg|platz|gasse)\s*\d*/i, // Street names
    // Generic codes that look like article numbers but aren't
    /^(\d{6,})\s*$/, // Just numbers (likely barcode or ID)
    /^(\d{4,6})\s*[x×]\s*$/, // Article number with x but no name/price
  ];
  
  // First, try to find complete items on single lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = i < lines.length - 1 ? lines[i + 1] : '';
    
    // INTELLIGENT SKIP: Check all skip patterns
    if (skipPatterns.some(p => p.test(line))) {
      continue;
    }
    
    // Additional validation: Line must have meaningful content
    if (line.length < 3) continue;
    
    // Skip if line is ONLY numbers (barcode/ID)
    if (/^\d+$/.test(line) && line.length > 6) continue;
    
    // ALDI format: "12055 Super Bock 6x0.331  7.95 B"
    const aldiMatch = line.match(/^(\d{4,6})\s+(.+?)\s+(\d+[.,]\d{2})\s*([AB])?$/);
    if (aldiMatch) {
      return {
        articleNumber: aldiMatch[1],
        name: aldiMatch[2].trim(),
        price: parseFloat(aldiMatch[3].replace(',', '.')),
        quantity: 1
      };
    }
    
    // Quantity format: "2 x 12055 Name  3.98 A"
    const qtyMatch = line.match(/^(\d+)\s*[x×]\s*(\d{4,6})?\s*(.+?)\s+(\d+[.,]\d{2})\s*([AB])?$/i);
    if (qtyMatch) {
      return {
        articleNumber: qtyMatch[2] || undefined,
        name: qtyMatch[3].trim(),
        price: parseFloat(qtyMatch[4].replace(',', '.')),
        quantity: parseInt(qtyMatch[1])
      };
    }
    
    // Simple format: "Name  3.98" or "Name  3.98 A"
    const simpleMatch = line.match(/^([A-Za-zäöüÄÖÜ].{2,}?)\s+(\d+[.,]\d{2})\s*([AB])?$/);
    if (simpleMatch && !simpleMatch[1].match(/^(CHF|Total|Summe)/i)) {
      return {
        name: simpleMatch[1].trim(),
        price: parseFloat(simpleMatch[2].replace(',', '.')),
        quantity: 1
      };
    }
    
    // MULTI-LINE: Article number + name on one line, price on next
    // Format: "740713 Zucker figuren 3D" followed by "5.98 A"
    const articleLineMatch = line.match(/^(\d{4,6})\s+(.+)$/);
    if (articleLineMatch && nextLine) {
      const priceMatch = nextLine.match(/^(\d+[.,]\d{2})\s*([AB])?$/);
      if (priceMatch) {
        return {
          articleNumber: articleLineMatch[1],
          name: articleLineMatch[2].trim(),
          price: parseFloat(priceMatch[1].replace(',', '.')),
          quantity: 1
        };
      }
    }
    
    // MULTI-LINE: Name on one line, price on next (no article number)
    // Format: "Naturejog. 500g" followed by "0.85 A"
    if (line.match(/^[A-Za-zäöüÄÖÜ]/) && !line.match(/\d+[.,]\d{2}/) && nextLine) {
      const priceMatch = nextLine.match(/^(\d+[.,]\d{2})\s*([AB])?$/);
      if (priceMatch && line.length > 3) {
        return {
          name: line.trim(),
          price: parseFloat(priceMatch[1].replace(',', '.')),
          quantity: 1
        };
      }
    }
    
    // MULTI-LINE: Price on current line, name on previous
    if (i > 0) {
      const priceMatch = line.match(/^(\d+[.,]\d{2})\s*([AB])?$/);
      const prevLine = lines[i - 1];
      if (priceMatch && prevLine && prevLine.match(/^[A-Za-zäöüÄÖÜ]/) && !prevLine.match(/\d+[.,]\d{2}/)) {
        const articleMatch = prevLine.match(/^(\d{4,6})?\s*(.+)$/);
        if (articleMatch) {
          return {
            articleNumber: articleMatch[1] || undefined,
            name: articleMatch[2].trim(),
            price: parseFloat(priceMatch[1].replace(',', '.')),
            quantity: 1
          };
        }
      }
    }
  }
  
  return null;
}

// Intelligent Swiss receipt parser
function parseSwissReceipt(text: string): ReceiptData {
  const lines = text.split(/[\n\r]+/).map(l => l.trim()).filter(l => l.length > 0);
  
  const result: ReceiptData = {
    store: { name: '' },
    purchase: {},
    items: [],
    totals: { total: 0 },
    rawText: text,
    confidence: 0,
  };

  // Known Swiss stores for better recognition
  const knownStores: Record<string, { name: string; category: string }> = {
    'ALDI': { name: 'ALDI SUISSE AG', category: 'Lebensmittel' },
    'MIGROS': { name: 'Migros', category: 'Lebensmittel' },
    'COOP': { name: 'Coop', category: 'Lebensmittel' },
    'LIDL': { name: 'Lidl Schweiz', category: 'Lebensmittel' },
    'DENNER': { name: 'Denner', category: 'Lebensmittel' },
    'SPAR': { name: 'Spar', category: 'Lebensmittel' },
    'VOLG': { name: 'Volg', category: 'Lebensmittel' },
    'MANOR': { name: 'Manor', category: 'Kaufhaus' },
    'H&M': { name: 'H&M Hennes & Mauritz', category: 'Kleidung' },
    'HENNES': { name: 'H&M Hennes & Mauritz', category: 'Kleidung' },
    'SNIPES': { name: 'Snipes', category: 'Kleidung' },
    'ZARA': { name: 'Zara', category: 'Kleidung' },
    'C&A': { name: 'C&A', category: 'Kleidung' },
    'OCHSNER': { name: 'Ochsner Sport', category: 'Sport' },
    'DECATHLON': { name: 'Decathlon', category: 'Sport' },
    'BP': { name: 'BP Tankstelle', category: 'Tankstelle' },
    'SHELL': { name: 'Shell', category: 'Tankstelle' },
    'AVIA': { name: 'Avia', category: 'Tankstelle' },
    'COOP PRONTO': { name: 'Coop Pronto', category: 'Tankstelle' },
    'MIGROLINO': { name: 'Migrolino', category: 'Tankstelle' },
    'VALORA': { name: 'Valora', category: 'Tankstelle' },
    'VENDEX': { name: 'Vendex AG', category: 'Sonstiges' },
    'VAPE': { name: 'Vape Shop', category: 'Sonstiges' },
    'MEDIA MARKT': { name: 'Media Markt', category: 'Elektronik' },
    'INTERDISCOUNT': { name: 'Interdiscount', category: 'Elektronik' },
    'FUST': { name: 'Fust', category: 'Elektronik' },
    'IKEA': { name: 'IKEA', category: 'Möbel' },
    'APOTHEKE': { name: 'Apotheke', category: 'Gesundheit' },
    'DROGERIE': { name: 'Drogerie', category: 'Gesundheit' },
  };
  
  let detectedCategory = 'Sonstiges';

  // Patterns
  const patterns = {
    // Store detection - expanded for all store types
    storeNames: /^(ALDI|MIGROS|COOP|LIDL|DENNER|SPAR|VOLG|MANOR|MIGROLINO|AVEC|H&M|SNIPES|ZARA|C&A|BP|SHELL|AVIA|VENDEX|VAPE|MEDIA\s*MARKT|INTERDISCOUNT|FUST|IKEA)/i,
    storeFull: /(ALDI\s*SUISSE|MIGROS\s*\w*|COOP\s*\w*|LIDL\s*SCHWEIZ|H&M\s*Hennes|Hennes\s*&\s*Mauritz|Valora\s*Schweiz|Sneakers\s*und\s*Street)/i,
    
    // Address patterns
    postalCity: /(\d{4})\s+([A-Za-zäöüÄÖÜ\-\s]+?)(?:\s+[A-Z]{2})?$/,
    street: /([A-Za-zäöüÄÖÜ]+(?:strasse|str\.|weg|platz|gasse)\s*\d*)/i,
    
    // Item patterns - Swiss receipt format
    // Format: [qty x] [articleNo] name price [taxCat]
    itemLine: /^(\d+)\s*[x×]?\s+(\d{3,})\s+(.+?)\s+(\d+[.,]\d{2})\s*([AB])?$/,
    itemLineAlt: /^(\d+)\s*[x×]\s+(\d+[.,]\d{2})\s*$/,
    itemSimple: /^(\d{3,})?\s*(.+?)\s+(\d+[.,]\d{2})\s*([AB])?$/,
    
    // Quantity at start
    qtyPrefix: /^(\d+)\s*[x×]\s+/,
    
    // Price at end
    priceEnd: /(\d+[.,]\d{2})\s*([AB])?$/,
    
    // Total patterns - expanded for all receipt types
    total: /(Total|PREIS|TOTAL|Summe|SUMME|Total-EFT|Gesamtbetrag|ALDI\s*PREIS|Total\s*Treibstoff)\s*(?:CHF)?\s*(\d+[.,]\d{2})/i,
    subtotal: /(Zwischensumme|Subtotal|ZWISCHENSUMME)\s*(\d+[.,]\d{2})/i,
    rounding: /(Rundung|RUNDUNG)\s*(-?\d+[.,]\d{2})/i,
    
    // Payment
    payment: /(Kartenzahlung|Barzahlung|TWINT|Karte|Bar|Debit|Kredit|Mastercard|Visa)/i,
    
    // Date/Time
    datePattern: /(\d{2})[.\/](\d{2})[.\/](\d{2,4})/,
    timePattern: /(\d{2}):(\d{2})/,
    
    // Tax
    mwstA: /A\s*(\d+[.,]\d+)%?\s*(?:Netto)?\s*(\d+[.,]\d{2})\s*(?:MwSt)?\s*(\d+[.,]\d{2})/i,
    mwstB: /B\s*(\d+[.,]\d+)%?\s*(?:Netto)?\s*(\d+[.,]\d{2})\s*(?:MwSt)?\s*(\d+[.,]\d{2})/i,
    
    // Article count
    articleCount: /(\d+)\s*(Artikel|Art\.|Pos\.)/i,
    
    // Skip patterns (non-item lines)
    skipPatterns: [
      /^CHF$/i,
      /^(Vielen\s*Dank|Danke|Thank)/i,
      /^(Bitte\s*scanne|Barcode)/i,
      /^(MwSt|MWST|Steuer)/i,
      /^(Netto|Brutto)/i,
      /^\d{10,}$/, // Long numbers (barcodes)
      /^[#*\-=]+$/, // Separators
      /^(Debit|Kredit|Karte).*\d{4}/i, // Card numbers
      /^(CHE|UID|MWST-Nr)/i, // Tax IDs
    ],
  };

  let headerSection = true;
  let footerSection = false;
  let itemsSection = false;
  let totalSectionStart = -1; // Track where total section begins
  let confidencePoints = 0;
  const itemPositions: Array<{ lineIndex: number; item: ReceiptItem }> = []; // Track item positions

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = lines[i + 1] || '';
    
    // Skip empty or separator lines
    if (patterns.skipPatterns.some(p => p.test(line))) continue;

    // === HEADER SECTION ===
    if (headerSection) {
      // Detect known store
      const storeMatch = line.match(patterns.storeNames) || line.match(patterns.storeFull);
      if (storeMatch || line.match(/H&M|Hennes|Snipes|BP\s|Shell|Valora|Vendex|Vape/i)) {
        const lineUpper = line.toUpperCase();
        for (const [key, storeInfo] of Object.entries(knownStores)) {
          if (lineUpper.includes(key)) {
            result.store.name = storeInfo.name;
            detectedCategory = storeInfo.category;
            confidencePoints += 20;
            break;
          }
        }
        if (!result.store.name && storeMatch) result.store.name = storeMatch[0];
        continue;
      }

      // Detect postal code and city
      const postalMatch = line.match(patterns.postalCity);
      if (postalMatch) {
        result.store.postalCode = postalMatch[1];
        result.store.city = postalMatch[2].trim();
        confidencePoints += 10;
        continue;
      }

      // Detect street
      const streetMatch = line.match(patterns.street);
      if (streetMatch && !result.store.address) {
        result.store.address = streetMatch[1];
        confidencePoints += 5;
        continue;
      }

      // Check if we're entering item section (usually after "CHF" header or store name)
      if (line === 'CHF' || line.match(/^\s*CHF\s+CHF\s*$/) || line.match(/^\s*CHF\s*$/)) {
        headerSection = false;
        itemsSection = true;
        continue;
      }
      
      // Also check if this line looks like an item (exit header early)
      if (line.match(/^\d{4,6}\s+[A-Za-z]/) || (line.match(/^[A-Za-zäöüÄÖÜ]/) && nextLine.match(/^\d+[.,]\d{2}/))) {
        headerSection = false;
        itemsSection = true;
        // Don't continue - process this line as item
        const item = parseReceiptItem(line, nextLine);
        if (item) {
          itemPositions.push({ lineIndex: i, item });
          result.items.push(item);
          confidencePoints += 3;
          if (/^\d+[.,]\d{2}\s*[AB]?$/.test(nextLine)) {
            i++;
          }
        }
        continue;
      }
    }

    // === ITEM SECTION ===
    if (itemsSection && !footerSection) {
      // INTELLIGENT TOTAL DETECTION: Check for total section start
      const totalMatch = line.match(patterns.total);
      const subtotalMatch = line.match(patterns.subtotal);
      const totalKeywords = /^(Total|PREIS|TOTAL|Summe|SUMME|Total-EFT|Gesamtbetrag|ALDI\s*PREIS|Zwischensumme|Subtotal)/i;
      
      if (totalMatch || subtotalMatch || totalKeywords.test(line)) {
        // Mark total section start
        if (totalSectionStart === -1) {
          totalSectionStart = i;
          console.log(`[parseSwissReceipt] Total section starts at line ${i}: "${line}"`);
        }
        
        if (totalMatch) {
          result.totals.total = parseFloat(totalMatch[2].replace(',', '.'));
        }
        if (subtotalMatch) {
          result.totals.subtotal = parseFloat(subtotalMatch[2].replace(',', '.'));
        }
        
        footerSection = true;
        itemsSection = false; // Stop processing items
        confidencePoints += 15;
        continue;
      }
      
      // Additional total indicators - stop item processing
      if (/^(MwSt|MWST|Steuer|Netto|Brutto|Rundung|Kartenzahlung|Barzahlung)/i.test(line)) {
        if (totalSectionStart === -1) {
          totalSectionStart = i;
        }
        footerSection = true;
        itemsSection = false;
        continue;
      }

      // If this line is just a price, try to combine with previous line
      const priceOnlyMatch = line.match(/^(\d+[.,]\d{2})\s*([AB])?$/);
      if (priceOnlyMatch && i > 0) {
        const prevLine = lines[i - 1];
        // Check if previous line looks like an article name (has article number or text)
        const articleMatch = prevLine.match(/^(\d{4,6})?\s*(.+?)$/);
        if (articleMatch && articleMatch[2] && articleMatch[2].length > 2 && !prevLine.match(/^(CHF|Total|Summe|MwSt)/i)) {
          const item: ReceiptItem = {
            quantity: 1,
            articleNumber: articleMatch[1] || undefined,
            name: articleMatch[2].trim(),
            unitPrice: parseFloat(priceOnlyMatch[1].replace(',', '.')),
            totalPrice: parseFloat(priceOnlyMatch[1].replace(',', '.')),
            taxCategory: priceOnlyMatch[2] || undefined,
          };
          result.items.push(item);
          headerSection = false;
          confidencePoints += 3;
        }
        continue;
      }
      
      // Skip Rabatt/Urspr. Preis lines (H&M discount info)
      if (/^(Rabatt|Urspr\.\s*Preis)/i.test(line)) {
        continue;
      }

      // Check if previous line was a product name (for H&M format)
      const prevLine = i > 0 ? lines[i - 1] : '';
      let productNameFromPrev = '';
      
      // H&M format: Name on one line, then ArticleNo Size Color Price on next
      // Check if current line has article number pattern and previous line was just text
      const hmDataLine = line.match(/^(\d{7})\s+(\d+(?:\/\d+)?|ONESIZE|[SML]|[A-Z]\d?)\s+([A-Za-zäöüÄÖÜ]+)\s+(\d+[.,]\d{2})$/i);
      if (hmDataLine && prevLine && prevLine.match(/^[A-Za-zäöüÄÖÜ\s]+$/) && !prevLine.match(/^(CHF|Total|Rabatt)/i)) {
        productNameFromPrev = prevLine.trim();
        const item: ReceiptItem = {
          quantity: 1,
          articleNumber: hmDataLine[1],
          name: `${productNameFromPrev} - ${hmDataLine[3]}`, // Name from prev line + Color
          unitPrice: parseFloat(hmDataLine[4].replace(',', '.')),
          totalPrice: parseFloat(hmDataLine[4].replace(',', '.')),
        };
        result.items.push(item);
        headerSection = false;
        confidencePoints += 3;
        continue;
      }
      
      // Snipes format: Data line followed by product name
      const snipesDataLine = line.match(/^(\d)\s+(\d{6})\s+\d\s+\|(\d+)\s*\|.*?\|\s*(\d+[.,]\d{2})$/);
      if (snipesDataLine) {
        // Next line should be the product name
        const productName = nextLine && !nextLine.match(/^\d/) && !nextLine.match(/^(SUMME|Total)/i) ? nextLine.trim() : `Artikel ${snipesDataLine[2]}`;
        const item: ReceiptItem = {
          quantity: parseInt(snipesDataLine[1]),
          articleNumber: snipesDataLine[2],
          name: productName,
          unitPrice: parseFloat(snipesDataLine[4].replace(',', '.')),
          totalPrice: parseFloat(snipesDataLine[4].replace(',', '.')),
        };
        result.items.push(item);
        headerSection = false;
        confidencePoints += 3;
        i++; // Skip the product name line
        continue;
      }

      // Try to parse as item - ONLY if we're still in items section
      if (totalSectionStart === -1 || i < totalSectionStart) {
        const item = parseReceiptItem(line, nextLine);
        if (item) {
          // Track item position
          itemPositions.push({ lineIndex: i, item });
          result.items.push(item);
          headerSection = false;
          confidencePoints += 3;
          
          // Skip next line if it was a price-only line that was combined
          if (/^\d+[.,]\d{2}\s*[AB]?$/.test(nextLine)) {
            i++; // Skip the next iteration
          }
        }
      } else {
        // We've passed the total section start - don't process as item
        break;
      }
    }

    // === FOOTER SECTION ===
    if (footerSection) {
      // Rounding
      const roundingMatch = line.match(patterns.rounding);
      if (roundingMatch) {
        result.totals.rounding = parseFloat(roundingMatch[2].replace(',', '.'));
      }

      // Payment method
      const paymentMatch = line.match(patterns.payment);
      if (paymentMatch) {
        result.purchase.paymentMethod = paymentMatch[1];
        confidencePoints += 5;
      }

      // Date
      const dateMatch = line.match(patterns.datePattern);
      if (dateMatch && !result.purchase.date) {
        const year = dateMatch[3].length === 2 ? '20' + dateMatch[3] : dateMatch[3];
        result.purchase.date = `${year}-${dateMatch[2]}-${dateMatch[1]}`;
        confidencePoints += 10;
      }

      // Time
      const timeMatch = line.match(patterns.timePattern);
      if (timeMatch && !result.purchase.time) {
        result.purchase.time = `${timeMatch[1]}:${timeMatch[2]}`;
        confidencePoints += 5;
      }

      // Tax info
      const mwstAMatch = line.match(patterns.mwstA);
      if (mwstAMatch) {
        result.tax = result.tax || {};
        result.tax.categoryA = {
          rate: parseFloat(mwstAMatch[1].replace(',', '.')),
          net: parseFloat(mwstAMatch[2].replace(',', '.')),
          tax: parseFloat(mwstAMatch[3].replace(',', '.')),
        };
      }

      const mwstBMatch = line.match(patterns.mwstB);
      if (mwstBMatch) {
        result.tax = result.tax || {};
        result.tax.categoryB = {
          rate: parseFloat(mwstBMatch[1].replace(',', '.')),
          net: parseFloat(mwstBMatch[2].replace(',', '.')),
          tax: parseFloat(mwstBMatch[3].replace(',', '.')),
        };
      }

      // Article count
      const countMatch = line.match(patterns.articleCount);
      if (countMatch) {
        result.totals.itemCount = parseInt(countMatch[1]);
      }
    }
  }

  // Add position information to items
  result.items = result.items.map((item, index) => {
    const itemPos = itemPositions.find(ip => ip.item === item);
    return {
      ...item,
      position: itemPos ? itemPos.lineIndex : index, // Line index in receipt
      section: itemPos && totalSectionStart > 0 && itemPos.lineIndex >= totalSectionStart ? 'total' : 'items'
    };
  });
  
  // Log section detection
  if (totalSectionStart > 0) {
    console.log(`[parseSwissReceipt] Total section detected at line ${totalSectionStart}`);
    console.log(`[parseSwissReceipt] Items before total: ${result.items.filter(i => (i as any).section === 'items').length}`);
  }
  
  // Calculate confidence
  result.confidence = Math.min(100, confidencePoints);
  result.totals.itemCount = result.totals.itemCount || result.items.length;
  
  // INTELLIGENT FILTERING: Remove invalid items
  result.items = result.items.filter((item, index) => {
    const name = item.name.trim();
    
    // Remove items that are just quantity indicators
    if (/^\d+\s*[x×]$/i.test(name)) return false;
    
    // Remove items with very short names (likely OCR errors)
    if (name.length < 3) return false;
    
    // Remove items that look like metadata
    if (/^(CHF|Total|Summe|Subtotal|MwSt|MWST|Netto|Brutto|Zwischensumme|Rundung|Kartenzahlung|Bar|Rückgeld|Gegeben|Erhalten)/i.test(name)) return false;
    
    // Remove items that are just numbers (barcodes/IDs)
    if (/^\d{6,}$/.test(name)) return false;
    
    // Remove items that are store names or addresses
    if (/^(ALDI|MIGROS|COOP|LIDL|DENNER|SPAR|VOLG|MANOR|SNIPES|H&M|ZARA|BP|SHELL|AVIA|VENDEX)/i.test(name)) return false;
    if (/^\d{4}\s+[A-Za-zäöüÄÖÜ\-\s]+$/i.test(name)) return false; // Postal code + city
    if (/^[A-Za-zäöüÄÖÜ]+(?:strasse|str\.|weg|platz|gasse)\s*\d*/i.test(name)) return false; // Street names
    
    // Remove items with invalid prices
    if (!item.unitPrice || item.unitPrice <= 0 || item.unitPrice > 100000) return false;
    
    // Remove items that appear after total section
    const itemPos = itemPositions.find(ip => ip.item === item);
    if (itemPos && totalSectionStart > 0 && itemPos.lineIndex >= totalSectionStart) {
      console.log(`[parseSwissReceipt] Filtering item after total section: "${name}" at line ${itemPos.lineIndex}`);
      return false;
    }
    
    return true;
  });
  
  // Remove duplicate items (same name and price)
  const uniqueItems: typeof result.items = [];
  const seen = new Set<string>();
  for (const item of result.items) {
    const key = `${item.name}-${item.totalPrice}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueItems.push(item);
    }
  }
  result.items = uniqueItems;
  
  console.log(`[parseSwissReceipt] After filtering: ${result.items.length} items`);
  
  // Use subtotal as total for ALDI (ALDI PREIS ≈ Zwischensumme)
  if (result.totals.subtotal && (!result.totals.total || result.totals.total === 0)) {
    result.totals.total = result.totals.subtotal;
    console.log(`[parseSwissReceipt] Using subtotal as total: ${result.totals.total}`);
  }
  
  // Search for total in full text
  const fullText = lines.join(' ');
  
  // Only search if no total found yet
  if (!result.totals.total || result.totals.total === 0) {
    const totalPatterns = [
      /ALDI\s*PREIS\s+(\d+[.,]\d{2})/i,
      /Total-EFT\s+(?:CHF)?\s*(\d+[.,]\d{2})/i,
      /Kartenzahlung\s+(?:CHF)?\s*(\d+[.,]\d{2})/i,
      /Zwischensumme\s+(\d+[.,]\d{2})/i,
      /(?:Total|TOTAL|Summe|SUMME)\s+(?:CHF)?\s*(\d+[.,]\d{2})/i,
    ];
    
    for (const pattern of totalPatterns) {
      const match = fullText.match(pattern);
      if (match) {
        result.totals.total = parseFloat(match[1].replace(',', '.'));
        console.log(`[parseSwissReceipt] Found total via pattern: ${result.totals.total}`);
        break;
      }
    }
  }
  
  // LAST RESORT: Calculate from items (but this is often wrong)
  if (!result.totals.total || result.totals.total === 0) {
    if (result.items.length > 0) {
      const calculatedTotal = result.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
      result.totals.total = Math.round(calculatedTotal * 100) / 100;
      console.log(`[parseSwissReceipt] WARNING: Calculated total from items: ${result.totals.total} (may be inaccurate)`);
    }
  }
  
  // Add detected category
  (result as any).category = detectedCategory;
  
  // Auto-detect category from items if not detected from store
  if (detectedCategory === 'Sonstiges' && result.items.length > 0) {
    const itemNames = result.items.map(i => i.name.toLowerCase()).join(' ');
    if (itemNames.match(/diesel|benzin|treibstoff|liter/)) {
      (result as any).category = 'Tankstelle';
    } else if (itemNames.match(/jersey|hemd|hose|schuhe|shirt|jacke|kleid/)) {
      (result as any).category = 'Kleidung';
    } else if (itemNames.match(/bio|milch|brot|joghurt|käse|fleisch|gemüse|obst/)) {
      (result as any).category = 'Lebensmittel';
    }
  }

  return result;
}

// Parse a single receipt item line - INTELLIGENT FILTERING
function parseReceiptItem(line: string, nextLine: string): ReceiptItem | null {
  // COMPREHENSIVE SKIP PATTERNS - Non-item lines
  const skipPatterns = [
    // Totals and sums
    /^(Zwischensumme|Subtotal|Total|PREIS|Summe|SUMME|Rundung|ALDI\s*PREIS|Gesamtbetrag|Total-EFT)/i,
    // Tax and financial
    /^(MwSt|MWST|Steuer|Netto|Brutto|St\s*%)/i,
    /^(A|B|Ges\.?)\s+\d/i, // Tax summary lines
    // Greetings and messages
    /^(Vielen\s*Dank|Danke|Thank|Bitte|Herzlich|Willkommen|Geschäft|Store|Bon|Zeit|Datum|Kasse)/i,
    // Payment methods
    /^(Kartenzahlung|Barzahlung|TWINT|Debit|Kredit|Mastercard|Visa|Erhalten|Gegeben|Rückgeld)/i,
    // Discounts and pricing info
    /^(Urspr\.\s*Preis|Urspr\.Preis|Rabatt|Reduziert)/i,
    // Metadata
    /^(ANZAHL|Artikel\s*\d|Pos\.|Position|Member|EFT|Buchung|Trm-Id|Trx|Auth)/i,
    /^(Benutzer|CHE-|MWST-Nr|UID|www\.|Tel|Telefon|Email)/i,
    // Store names
    /^(ALDI|MIGROS|COOP|LIDL|DENNER|SPAR|VOLG|MANOR|SNIPES|H&M|ZARA|BP|SHELL|AVIA|VENDEX)/i,
    // Barcodes and IDs
    /^\d{10,}$/, // Long numbers (barcodes)
    /^[A-Z]{2,3}-?\d{3,}/i, // Tax IDs
    /^CHF$/i,
    // Separators
    /^[x×]\s*$/i, // Standalone x
    /^[-=*#]+$/, // Separators
    /^\s*\d+\s*Artikel\s*$/i,
    // Address patterns
    /^\d{4}\s+[A-Za-zäöüÄÖÜ\-\s]+$/i, // Postal code + city
    /^[A-Za-zäöüÄÖÜ]+(?:strasse|str\.|weg|platz|gasse)\s*\d*/i, // Street names
    // Just numbers (likely IDs)
    /^\d{6,}$/,
  ];

  if (skipPatterns.some(p => p.test(line))) return null;
  if (line.length < 3) return null;
  
  // Additional validation: Line must have meaningful content (not just numbers or symbols)
  if (/^[\d\s]+$/.test(line) && line.length > 6) return null; // Just numbers
  if (/^[^\w\s]+$/.test(line)) return null; // Just symbols

  let item: ReceiptItem | null = null;
  
  // Combine line with nextLine if nextLine is just a price
  const priceOnlyMatch = nextLine.match(/^(\d+[.,]\d{2})\s*([AB])?$/);
  const combinedLine = priceOnlyMatch ? `${line} ${nextLine}` : line;

  // === BP TANKSTELLE FORMAT ===
  // Example: "*000002 Ultimate Diesel 30.07 CHF A*"
  const bpMatch = combinedLine.match(/^\*?(\d{4,})\s+(.+?)\s+(\d+[.,]\d{2})\s*(?:CHF)?\s*([AB])?\*?$/);
  if (bpMatch) {
    return {
      quantity: 1,
      articleNumber: bpMatch[1],
      name: bpMatch[2].trim(),
      unitPrice: parseFloat(bpMatch[3].replace(',', '.')),
      totalPrice: parseFloat(bpMatch[3].replace(',', '.')),
      taxCategory: bpMatch[4] || undefined,
    };
  }

  // === SNIPES FORMAT ===
  // Example: "1 080376 1 |41 |89|0| 139.90" followed by "Air Force 1 white/bl"
  const snipesMatch = line.match(/^(\d)\s+(\d{6})\s+\d\s+\|(\d+)\s*\|.*?\|\s*(\d+[.,]\d{2})$/);
  if (snipesMatch) {
    // Check if next line has the product name
    const productName = nextLine && !nextLine.match(/^\d/) ? nextLine : 'Artikel';
    return {
      quantity: parseInt(snipesMatch[1]),
      articleNumber: snipesMatch[2],
      name: productName.trim(),
      unitPrice: parseFloat(snipesMatch[4].replace(',', '.')),
      totalPrice: parseFloat(snipesMatch[4].replace(',', '.')),
    };
  }

  // === H&M FORMAT ===
  // Example: "1245302 122/128 Rot 12.95" with "Basic Jersey" on previous line
  // Or combined: "Basic Jersey 1245302 122/128 Rot 12.95"
  const hmMatch = combinedLine.match(/^(.+?)\s+(\d{7})\s+(\d+(?:\/\d+)?|ONESIZE|[SML]|[A-Z]\d?)\s+([A-Za-zäöüÄÖÜ]+)\s+(\d+[.,]\d{2})$/i);
  if (hmMatch) {
    return {
      quantity: 1,
      articleNumber: hmMatch[2],
      name: `${hmMatch[1].trim()} - ${hmMatch[4]}`, // Name + Color
      unitPrice: parseFloat(hmMatch[5].replace(',', '.')),
      totalPrice: parseFloat(hmMatch[5].replace(',', '.')),
    };
  }
  
  // H&M alternate: Just article number, size, color, price
  const hmAltMatch = combinedLine.match(/^(\d{7})\s+(\d+(?:\/\d+)?|ONESIZE|[SML])\s+([A-Za-zäöüÄÖÜ]+)\s+(\d+[.,]\d{2})$/i);
  if (hmAltMatch) {
    return {
      quantity: 1,
      articleNumber: hmAltMatch[1],
      name: `Artikel ${hmAltMatch[1]} - ${hmAltMatch[3]}`,
      unitPrice: parseFloat(hmAltMatch[4].replace(',', '.')),
      totalPrice: parseFloat(hmAltMatch[4].replace(',', '.')),
    };
  }

  // === VENDEX/VAPE FORMAT ===
  // Example: "Elfbar - Elfliq Peac 7.30 A"
  const vendexMatch = combinedLine.match(/^([A-Za-zäöüÄÖÜ][A-Za-zäöüÄÖÜ0-9\s\-\.\/]+?)\s+(\d+[.,]\d{2})\s*([AB])?$/);
  if (vendexMatch && vendexMatch[1].length > 3 && !vendexMatch[1].match(/^(Total|Summe|Netto)/i)) {
    return {
      quantity: 1,
      name: vendexMatch[1].trim(),
      unitPrice: parseFloat(vendexMatch[2].replace(',', '.')),
      totalPrice: parseFloat(vendexMatch[2].replace(',', '.')),
      taxCategory: vendexMatch[3] || undefined,
    };
  }

  // === ALDI FORMAT ===
  // Example: "12055 Super Bock 6x0.331 7.95 B"
  const aldiMatch = combinedLine.match(/^(\d{4,6})\s+(.+?)\s+(\d+[.,]\d{2})\s*([AB])?$/);
  if (aldiMatch) {
    return {
      quantity: 1,
      articleNumber: aldiMatch[1],
      name: aldiMatch[2].trim(),
      unitPrice: parseFloat(aldiMatch[3].replace(',', '.')),
      totalPrice: parseFloat(aldiMatch[3].replace(',', '.')),
      taxCategory: aldiMatch[4] || undefined,
    };
  }
  
  // === GENERIC FORMAT ===
  // Name + price (fallback)
  const genericMatch = combinedLine.match(/^([A-Za-zäöüÄÖÜ][A-Za-zäöüÄÖÜ0-9\s\/.\-\(\)]+?)\s+(\d+[.,]\d{2})\s*([AB])?$/);
  if (genericMatch && genericMatch[1].length > 2 && !genericMatch[1].match(/^(CHF|Total|MwSt)/i)) {
    return {
      quantity: 1,
      name: genericMatch[1].trim(),
      unitPrice: parseFloat(genericMatch[2].replace(',', '.')),
      totalPrice: parseFloat(genericMatch[2].replace(',', '.')),
      taxCategory: genericMatch[3] || undefined,
    };
  }

  // Pattern 1: Full format - qty articleNo name price taxCat
  // Example: "2 x 825076 Bio Oran./Apfel 1l 3.98 A"
  const fullMatch = line.match(/^(\d+)\s*[x×]\s+(\d{3,})\s+(.+?)\s+(\d+[.,]\d{2})\s*([AB])?$/);
  if (fullMatch) {
    item = {
      quantity: parseInt(fullMatch[1]),
      articleNumber: fullMatch[2],
      name: fullMatch[3].trim(),
      totalPrice: parseFloat(fullMatch[4].replace(',', '.')),
      unitPrice: parseFloat(fullMatch[4].replace(',', '.')) / parseInt(fullMatch[1]),
      taxCategory: fullMatch[5],
    };
    return item;
  }

  // Pattern 2: articleNo name price taxCat (qty=1)
  // Example: "60517 Naturejog. 500g 0.85 A"
  const simpleMatch = line.match(/^(\d{3,})\s+(.+?)\s+(\d+[.,]\d{2})\s*([AB])?$/);
  if (simpleMatch) {
    item = {
      quantity: 1,
      articleNumber: simpleMatch[1],
      name: simpleMatch[2].trim(),
      totalPrice: parseFloat(simpleMatch[3].replace(',', '.')),
      unitPrice: parseFloat(simpleMatch[3].replace(',', '.')),
      taxCategory: simpleMatch[4],
    };
    return item;
  }

  // Pattern 3: Quantity line followed by price line
  // Example: "2 x    1.99"
  // Followed by item name
  const qtyPriceMatch = line.match(/^(\d+)\s*[x×]\s+(\d+[.,]\d{2})\s*$/);
  if (qtyPriceMatch && nextLine) {
    const nameMatch = nextLine.match(/^(\d{3,})?\s*(.+?)\s+(\d+[.,]\d{2})\s*([AB])?$/);
    if (nameMatch) {
      item = {
        quantity: parseInt(qtyPriceMatch[1]),
        articleNumber: nameMatch[1],
        name: nameMatch[2].trim(),
        totalPrice: parseFloat(nameMatch[3].replace(',', '.')),
        unitPrice: parseFloat(qtyPriceMatch[2].replace(',', '.')),
        taxCategory: nameMatch[4],
      };
      return item;
    }
  }

  // Pattern 4: Just name and price
  // Example: "Gelatine 1.19 A"
  const basicMatch = line.match(/^([A-Za-zäöüÄÖÜ][A-Za-zäöüÄÖÜ0-9\s\.\-\/]+?)\s+(\d+[.,]\d{2})\s*([AB])?$/);
  if (basicMatch && basicMatch[1].length >= 3) {
    // Make sure it's not a metadata line
    const name = basicMatch[1].trim();
    if (name.length >= 3 && !name.match(/^(CHF|Total|Summe|MwSt|Netto)/i)) {
      item = {
        quantity: 1,
        name: name,
        totalPrice: parseFloat(basicMatch[2].replace(',', '.')),
        unitPrice: parseFloat(basicMatch[2].replace(',', '.')),
        taxCategory: basicMatch[3],
      };
      return item;
    }
  }

  return null;
}

// Save Receipt to database
export const saveReceipt = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { receiptData, imageData } = request.data;

  try {
    // 1. Find or create store
    let storeId: string;
    const storesQuery = await db.collection('stores')
      .where('userId', '==', userId)
      .where('name', '==', receiptData.store.name)
      .limit(1)
      .get();

    if (storesQuery.empty) {
      // Create new store
      const storeRef = await db.collection('stores').add({
        userId,
        name: receiptData.store.name,
        address: receiptData.store.address || null,
        city: receiptData.store.city || null,
        postalCode: receiptData.store.postalCode || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      storeId = storeRef.id;
    } else {
      storeId = storesQuery.docs[0].id;
    }

    // 2. Save receipt
    const receiptRef = await db.collection('receipts').add({
      userId,
      storeId,
      storeName: receiptData.store.name,
      storeAddress: receiptData.store.address || null,
      purchaseDate: receiptData.purchase.date || null,
      purchaseTime: receiptData.purchase.time || null,
      paymentMethod: receiptData.purchase.paymentMethod || null,
      subtotal: receiptData.totals.subtotal || null,
      rounding: receiptData.totals.rounding || null,
      total: receiptData.totals.total,
      itemCount: receiptData.items.length,
      items: receiptData.items,
      tax: receiptData.tax || null,
      rawText: receiptData.rawText,
      confidence: receiptData.confidence,
      imageData: imageData || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 3. Update store items with price history
    const batch = db.batch();
    for (const item of receiptData.items) {
      // Find existing item in store
      const existingQuery = await db.collection('stores').doc(storeId)
        .collection('items')
        .where('name', '==', item.name)
        .limit(1)
        .get();

      if (existingQuery.empty) {
        // Create new item
        const itemRef = db.collection('stores').doc(storeId).collection('items').doc();
        batch.set(itemRef, {
          name: item.name,
          articleNumber: item.articleNumber || null,
          category: categorizeItem(item.name),
          lastPrice: item.unitPrice,
          priceHistory: [{
            price: item.unitPrice,
            date: receiptData.purchase.date || new Date().toISOString().split('T')[0],
          }],
          purchaseCount: 1,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        // Update existing item
        const existingDoc = existingQuery.docs[0];
        const existingData = existingDoc.data();
        const priceHistory = existingData.priceHistory || [];
        
        // Only add to history if price changed
        if (priceHistory.length === 0 || priceHistory[priceHistory.length - 1].price !== item.unitPrice) {
          priceHistory.push({
            price: item.unitPrice,
            date: receiptData.purchase.date || new Date().toISOString().split('T')[0],
          });
        }

        batch.update(existingDoc.ref, {
          lastPrice: item.unitPrice,
          priceHistory: priceHistory.slice(-10), // Keep last 10 prices
          purchaseCount: admin.firestore.FieldValue.increment(1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }

    await batch.commit();

    return {
      success: true,
      receiptId: receiptRef.id,
      storeId,
      itemsSaved: receiptData.items.length,
    };

  } catch (error: any) {
    console.error('Save receipt error:', error);
    return { success: false, error: error.message };
  }
});

// Helper function to categorize items
function categorizeItem(name: string): string {
  const lowerName = name.toLowerCase();
  
  const categories: Record<string, string[]> = {
    'Getränke': ['bier', 'wein', 'saft', 'wasser', 'cola', 'fanta', 'sprite', 'energy', 'shot', 'drink', 'limo'],
    'Obst & Gemüse': ['apfel', 'orange', 'banane', 'tomate', 'salat', 'gurke', 'karotte', 'zwiebel', 'bio oran', 'gemüse', 'obst', 'früchte'],
    'Milchprodukte': ['milch', 'joghurt', 'käse', 'butter', 'sahne', 'quark', 'rahm', 'naturejog', 'jogurt'],
    'Fleisch & Fisch': ['fleisch', 'steak', 'wurst', 'schinken', 'lachs', 'fisch', 'poulet', 'huhn', 'rind', 'schwein', 'hackfleisch', 'ragout'],
    'Backwaren': ['brot', 'brötchen', 'toast', 'croissant', 'gipfel', 'gebäck', 'kuchen', 'keks', 'butterkeks'],
    'Süsswaren': ['schoko', 'schokolade', 'bonbon', 'gummi', 'chips', 'snack', 'zucker', 'eis', 'gelatine'],
    'Tiefkühl': ['tiefkühl', 'frozen', 'pizza', 'pommes'],
    'Haushalt': ['waschmittel', 'spülmittel', 'reiniger', 'papier', 'müll', 'tüte', 'beutel'],
    'Hygiene': ['shampoo', 'duschgel', 'seife', 'zahnpasta', 'deo', 'creme'],
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(kw => lowerName.includes(kw))) {
      return category;
    }
  }

  return 'Sonstiges';
}

// Get store items for suggestions
export const getStoreItems = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { storeId, storeName } = request.data;

  try {
    let targetStoreId = storeId;

    // Find store by name if no ID provided
    if (!targetStoreId && storeName) {
      const storeQuery = await db.collection('stores')
        .where('userId', '==', userId)
        .where('name', '==', storeName)
        .limit(1)
        .get();

      if (!storeQuery.empty) {
        targetStoreId = storeQuery.docs[0].id;
      }
    }

    if (!targetStoreId) {
      return { success: true, items: [] };
    }

    // Get items sorted by purchase count
    const itemsSnapshot = await db.collection('stores').doc(targetStoreId)
      .collection('items')
      .orderBy('purchaseCount', 'desc')
      .limit(50)
      .get();

    const items = itemsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { success: true, items, storeId: targetStoreId };

  } catch (error: any) {
    console.error('Get store items error:', error);
    return { success: false, error: error.message, items: [] };
  }
});

// Get user's stores
export const getStores = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;

  try {
    const storesSnapshot = await db.collection('stores')
      .where('userId', '==', userId)
      .get();

    const stores = storesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
    }));

    return { success: true, stores };

  } catch (error: any) {
    console.error('Get stores error:', error);
    return { success: false, error: error.message, stores: [] };
  }
});

// Get user's receipts
export const getReceipts = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { limit: queryLimit, storeId } = request.data || {};

  try {
    let query: admin.firestore.Query = db.collection('receipts')
      .where('userId', '==', userId);

    if (storeId) {
      query = query.where('storeId', '==', storeId);
    }

    const receiptsSnapshot = await query.get();

    let receipts: any[] = receiptsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        // Don't include full image data in list view
        imageData: undefined,
      };
    });

    // Sort by date descending
    receipts.sort((a, b) => {
      const dateA = a.purchaseDate || a.createdAt || '';
      const dateB = b.purchaseDate || b.createdAt || '';
      return dateB.localeCompare(dateA);
    });

    if (queryLimit) {
      receipts = receipts.slice(0, queryLimit);
    }

    return { success: true, receipts };

  } catch (error: any) {
    console.error('Get receipts error:', error);
    return { success: false, error: error.message, receipts: [] };
  }
});

// ========== AI Chat Functions ==========

// Upload File for AI Chat
export const uploadAIChatFile = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { fileName, fileData, fileType } = request.data;

  if (!fileName || !fileData) {
    throw new HttpsError('invalid-argument', 'fileName and fileData are required');
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
  } catch (error: any) {
    throw new HttpsError('internal', 'File upload failed: ' + (error.message || 'Unknown error'));
  }
});

// Upload Image for AI Chat
export const uploadAIChatImage = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { fileName, fileData, fileType } = request.data;

  if (!fileName || !fileData) {
    throw new HttpsError('invalid-argument', 'fileName and fileData are required');
  }

  // Validate image type
  if (!fileType?.startsWith('image/')) {
    throw new HttpsError('invalid-argument', 'File must be an image');
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
  } catch (error: any) {
    throw new HttpsError('internal', 'Image upload failed: ' + (error.message || 'Unknown error'));
  }
});

// Transcribe Audio for AI Chat
export const transcribeAIChatAudio = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { audioData, mimeType } = request.data;

  if (!audioData) {
    throw new HttpsError('invalid-argument', 'audioData is required');
  }

  try {
    // For now, we'll use a simple approach: upload audio and return placeholder
    // In production, you would integrate with Google Speech-to-Text API or similar
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

    // TODO: Integrate with Google Speech-to-Text API
    // For now, return a placeholder message
    // In production, you would:
    // 1. Use @google-cloud/speech to transcribe the audio
    // 2. Return the transcription text
    
    return { 
      transcription: '[Spracheingabe wird derzeit nicht unterstützt. Bitte tippen Sie Ihre Nachricht ein.]',
      audioUrl: filePath,
    };
  } catch (error: any) {
    throw new HttpsError('internal', 'Audio transcription failed: ' + (error.message || 'Unknown error'));
  }
});

// ========== Debug Functions ==========

// Debug function to check user data and data existence
export const debugUserData = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const firebaseAuthUid = request.auth.uid;
  
  // Get user from Firestore users collection
  const userDoc = await db.collection('users')
    .where('openId', '==', firebaseAuthUid)
    .limit(1)
    .get();
  
  const userInfo = {
    firebaseAuthUid,
    firestoreUserExists: !userDoc.empty,
    firestoreUserId: userDoc.empty ? null : userDoc.docs[0].id,
    firestoreUserData: userDoc.empty ? null : userDoc.docs[0].data(),
  };

  // Check data counts using Firebase Auth UID
  const remindersCount = (await db.collection('reminders')
    .where('userId', '==', firebaseAuthUid)
    .get()).size;
  
  const financeEntriesCount = (await db.collection('financeEntries')
    .where('userId', '==', firebaseAuthUid)
    .get()).size;
  
  const peopleCount = (await db.collection('people')
    .where('userId', '==', firebaseAuthUid)
    .get()).size;

  // Also check if there's data with the Firestore user ID
  let remindersWithFirestoreUserId = 0;
  let financeEntriesWithFirestoreUserId = 0;
  let peopleWithFirestoreUserId = 0;
  
  if (!userDoc.empty) {
    const firestoreUserId = userDoc.docs[0].id;
    remindersWithFirestoreUserId = (await db.collection('reminders')
      .where('userId', '==', firestoreUserId)
      .get()).size;
    
    financeEntriesWithFirestoreUserId = (await db.collection('financeEntries')
      .where('userId', '==', firestoreUserId)
      .get()).size;
    
    peopleWithFirestoreUserId = (await db.collection('people')
      .where('userId', '==', firestoreUserId)
      .get()).size;
  }

  return {
    userInfo,
    dataCounts: {
      usingFirebaseAuthUid: {
        reminders: remindersCount,
        financeEntries: financeEntriesCount,
        people: peopleCount,
      },
      usingFirestoreUserId: {
        reminders: remindersWithFirestoreUserId,
        financeEntries: financeEntriesWithFirestoreUserId,
        people: peopleWithFirestoreUserId,
      },
    },
    recommendation: remindersCount === 0 && financeEntriesCount === 0 && peopleCount === 0
      ? 'No data found with Firebase Auth UID. Check if data was saved with Firestore User ID instead.'
      : 'Data found with Firebase Auth UID.',
  };
});

// ========== Migration Function ==========

export const migrateUserIds = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Only allow migration for authenticated users
  // In production, you might want to restrict this to admins only
  
  try {
    const { migrateUserIds: migrateFunction } = await import('./migrateUserIds');
    const result = await migrateFunction();
    return result;
  } catch (error) {
    console.error('[Migration] Error:', error);
    throw new HttpsError('internal', `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// Export tRPC function
export { trpc } from './trpc';
