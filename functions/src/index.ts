import {onCall, HttpsError} from 'firebase-functions/v2/https';
import {onSchedule} from 'firebase-functions/v2/scheduler';

import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();

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

  // Parse and validate dueDate
  let parsedDueDate: admin.firestore.Timestamp | null = null;
  if (dueDate) {
    const dateObj = new Date(dueDate);
    if (!isNaN(dateObj.getTime())) {
      parsedDueDate = admin.firestore.Timestamp.fromDate(dateObj);
    } else {
      // If date string parsing fails, try to create from current date
      parsedDueDate = admin.firestore.Timestamp.fromDate(new Date());
    }
  } else {
    parsedDueDate = admin.firestore.Timestamp.fromDate(new Date());
  }

  const reminderData = {
    userId,
    title: title || 'Neuer Termin',
    type: type || 'termin',
    dueDate: parsedDueDate,
    isAllDay: isAllDay || false,
    amount: amount || null,
    currency: currency || null,
    notes: notes || null,
    recurrenceRule: recurrenceRule || null,
    personId: personId || null,
    personName: personName || null,
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

  const updateData: any = {
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

  // Verify person belongs to user
  const personRef = db.collection('people').doc(personId);
  const personDoc = await personRef.get();

  if (!personDoc.exists || personDoc.data()?.userId !== userId) {
    throw new HttpsError('permission-denied', 'Not authorized to access this person');
  }

  // direction: "incoming" (Person schuldet mir) | "outgoing" (Ich schulde Person)
  const personData = personDoc.data();
  const invoiceDirection = direction || (personData?.type === 'external' ? 'incoming' : 'outgoing');

  const invoiceData: any = {
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
        case 'weekly': nextDue.setDate(nextDue.getDate() + 7); break;
        case 'monthly': nextDue.setMonth(nextDue.getMonth() + 1); break;
        case 'quarterly': nextDue.setMonth(nextDue.getMonth() + 3); break;
        case 'yearly': nextDue.setFullYear(nextDue.getFullYear() + 1); break;
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

  return { id: docRef.id, ...invoiceData };
});

export const updateInvoice = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { personId, invoiceId, amount, description, date, dueDate, reminderDate, reminderEnabled, notes, isRecurring, recurringInterval } = request.data;

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

  if (description !== undefined) updateData.description = description;
  if (date !== undefined) updateData.date = admin.firestore.Timestamp.fromDate(new Date(date));
  if (notes !== undefined) updateData.notes = notes;
  
  // Handle due date
  if (dueDate !== undefined) {
    updateData.dueDate = dueDate ? admin.firestore.Timestamp.fromDate(new Date(dueDate)) : null;
  }
  
  // Handle reminder
  if (reminderEnabled !== undefined) {
    updateData.reminderEnabled = reminderEnabled;
    if (reminderEnabled && reminderDate) {
      updateData.reminderDate = admin.firestore.Timestamp.fromDate(new Date(reminderDate));
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

// Analyze Document (OCR/AI)
export const analyzeDocument = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { documentId, personId, fileData, fileType } = request.data;

  // Get user settings for OCR provider
  const settingsDoc = await db.collection('userSettings').doc(userId).get();
  const settings = settingsDoc.exists ? settingsDoc.data() : { ocrProvider: 'regex' };
  const ocrProvider = settings?.ocrProvider || 'regex';

  let analysisResult: any = {
    type: 'unknown',
    confidence: 0,
    extractedData: {},
    rawText: '',
  };

  try {
    if (ocrProvider === 'google') {
      // Google Cloud Vision API
      const vision = require('@google-cloud/vision');
      const client = new vision.ImageAnnotatorClient();
      
      const buffer = Buffer.from(fileData, 'base64');
      const [result] = await client.textDetection(buffer);
      const detections = result.textAnnotations;
      const fullText = detections && detections.length > 0 ? detections[0].description : '';
      
      analysisResult.rawText = fullText;
      analysisResult = analyzeText(fullText, analysisResult);
      
    } else if (ocrProvider === 'openai' && settings?.openaiApiKey) {
      // OpenAI GPT-4 Vision
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analysiere dieses Dokument und extrahiere strukturierte Daten. 
                  Antworte NUR mit JSON in diesem Format:
                  {
                    "type": "rechnung" | "termin" | "vertrag" | "sonstiges",
                    "confidence": 0-100,
                    "extractedData": {
                      // Für Rechnungen: amount, currency, dueDate, iban, description, creditor
                      // Für Termine: date, time, location, description, title
                      // Für Verträge: parties, startDate, endDate, subject
                    }
                  }`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${fileType};base64,${fileData}`
                  }
                }
              ]
            }
          ],
          max_tokens: 1000,
        }),
      });

      const data = await response.json();
      if (data.choices && data.choices[0]?.message?.content) {
        try {
          const parsed = JSON.parse(data.choices[0].message.content);
          analysisResult = {
            ...analysisResult,
            ...parsed,
          };
        } catch (e) {
          // If JSON parsing fails, use regex fallback
          analysisResult = analyzeText(data.choices[0].message.content, analysisResult);
        }
      }
      
    } else {
      // Regex-based analysis (fallback)
      // For images, we can't do much without OCR
      // This is mainly for text-based documents
      analysisResult.type = 'unknown';
      analysisResult.confidence = 10;
      analysisResult.message = 'Regex-Analyse kann nur Text-Dokumente verarbeiten. Bitte wähle Google Cloud Vision oder OpenAI in den Einstellungen.';
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
    
    const docsSnapshot = await docsQuery.orderBy('createdAt', 'desc').get();
    
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
