import {onCall, HttpsError} from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();

// ========== Reminders Functions ==========

export const getReminders = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { startDate, endDate, status } = request.data;

  let query: admin.firestore.Query = db.collection('reminders').where('userId', '==', userId);

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
  const reminders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return { reminders };
});

export const createReminder = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
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

  const profiles = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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
  const snapshot = await db.collection('people').where('userId', '==', userId).orderBy('name').get();
  const people = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return { people };
});

export const createPerson = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
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
  return { id: docRef.id, ...personData };
});

export const updatePerson = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { personId, name, email, phone } = request.data;

  const personRef = db.collection('people').doc(personId);
  const personDoc = await personRef.get();

  if (!personDoc.exists || personDoc.data()?.userId !== userId) {
    throw new HttpsError('permission-denied', 'Not authorized to update this person');
  }

  await personRef.update({
    name,
    email: email || null,
    phone: phone || null,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

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
  const invoices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return { invoices };
});

export const createInvoice = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { personId, amount, description, date, status } = request.data;

  // Verify person belongs to user
  const personRef = db.collection('people').doc(personId);
  const personDoc = await personRef.get();

  if (!personDoc.exists || personDoc.data()?.userId !== userId) {
    throw new HttpsError('permission-denied', 'Not authorized to access this person');
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

  return { id: docRef.id, ...invoiceData };
});

export const updateInvoice = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const userId = request.auth.uid;
  const { personId, invoiceId, amount, description, date } = request.data;

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
  const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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
