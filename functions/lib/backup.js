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
exports.createBackup = createBackup;
exports.listBackups = listBackups;
exports.restoreBackup = restoreBackup;
const admin = __importStar(require("firebase-admin"));
const storage_1 = require("firebase-admin/storage");
const db = admin.firestore();
const storage = (0, storage_1.getStorage)();
/**
 * Erstellt ein vollständiges Backup aller Firestore-Daten
 */
async function createBackup() {
    console.log('[Backup] Starting backup creation...');
    const timestamp = new Date().toISOString();
    const backupId = `backup-${Date.now()}`;
    const collectionsToBackup = [
        'reminders',
        'financeEntries',
        'people',
        'taxProfiles',
        'shoppingList',
        'budgets',
        'workSchedules',
        'vacations',
        'schoolSchedules',
        'schoolHolidays',
        'documents',
        'receipts',
        'shoppingListTemplates',
        'users', // Auch User-Daten sichern
    ];
    const backupData = {
        timestamp,
        collections: {},
        metadata: {
            totalDocuments: 0,
            backupVersion: '1.0',
        },
    };
    let totalDocuments = 0;
    // Backup für jede Collection
    for (const collectionName of collectionsToBackup) {
        try {
            console.log(`[Backup] Backing up collection: ${collectionName}`);
            const snapshot = await db.collection(collectionName).get();
            const documents = [];
            for (const doc of snapshot.docs) {
                const data = doc.data();
                const docData = Object.assign({ id: doc.id }, data);
                // Konvertiere Firestore Timestamps zu ISO-Strings
                Object.keys(docData).forEach(key => {
                    var _a;
                    const value = docData[key];
                    if (value && typeof value === 'object' && ((_a = value.constructor) === null || _a === void 0 ? void 0 : _a.name) === 'Timestamp') {
                        docData[key] = value.toDate().toISOString();
                    }
                    else if (value && typeof value === 'object' && value.toDate && typeof value.toDate === 'function') {
                        docData[key] = value.toDate().toISOString();
                    }
                });
                // Für people: Backup auch invoices Subcollection
                if (collectionName === 'people') {
                    try {
                        const invoicesSnapshot = await doc.ref.collection('invoices').get();
                        const invoices = [];
                        for (const invoiceDoc of invoicesSnapshot.docs) {
                            const invoiceData = invoiceDoc.data();
                            const invoice = Object.assign({ id: invoiceDoc.id }, invoiceData);
                            // Konvertiere Timestamps
                            Object.keys(invoice).forEach(key => {
                                var _a;
                                const value = invoice[key];
                                if (value && typeof value === 'object' && ((_a = value.constructor) === null || _a === void 0 ? void 0 : _a.name) === 'Timestamp') {
                                    invoice[key] = value.toDate().toISOString();
                                }
                                else if (value && typeof value === 'object' && value.toDate && typeof value.toDate === 'function') {
                                    invoice[key] = value.toDate().toISOString();
                                }
                            });
                            invoices.push(invoice);
                        }
                        docData.invoices = invoices;
                    }
                    catch (error) {
                        console.error(`[Backup] Error backing up invoices for person ${doc.id}:`, error);
                    }
                }
                documents.push(docData);
            }
            backupData.collections[collectionName] = documents;
            totalDocuments += documents.length;
            console.log(`[Backup] Backed up ${documents.length} documents from ${collectionName}`);
        }
        catch (error) {
            console.error(`[Backup] Error backing up collection ${collectionName}:`, error);
            // Setze fort, auch wenn eine Collection fehlschlägt
            backupData.collections[collectionName] = [];
        }
    }
    backupData.metadata.totalDocuments = totalDocuments;
    // Speichere Backup in Firebase Storage
    const bucket = storage.bucket();
    const fileName = `backups/${backupId}.json`;
    const file = bucket.file(fileName);
    await file.save(JSON.stringify(backupData, null, 2), {
        metadata: {
            contentType: 'application/json',
            metadata: {
                timestamp,
                backupId,
                documentCount: totalDocuments.toString(),
            },
        },
    });
    // Erstelle auch eine signierte URL für direkten Zugriff (gültig für 1 Jahr)
    const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: '03-01-2500', // Sehr lange Gültigkeit
    });
    // Speichere Backup-Metadaten in Firestore
    await db.collection('backups').doc(backupId).set({
        backupId,
        timestamp,
        fileName,
        documentCount: totalDocuments,
        collections: collectionsToBackup,
        storagePath: fileName,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`[Backup] Backup completed: ${backupId} (${totalDocuments} documents)`);
    return {
        backupId,
        backupUrl: signedUrl,
        documentCount: totalDocuments,
    };
}
/**
 * Listet alle verfügbaren Backups auf
 */
async function listBackups(limit = 10) {
    const snapshot = await db.collection('backups')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
    return snapshot.docs.map(doc => {
        var _a, _b, _c;
        const data = doc.data();
        return Object.assign(Object.assign({ id: doc.id }, data), { createdAt: ((_c = (_b = (_a = data.createdAt) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a)) === null || _c === void 0 ? void 0 : _c.toISOString()) || null });
    });
}
/**
 * Stellt Daten aus einem Backup wieder her
 */
async function restoreBackup(backupId, userId) {
    console.log(`[Backup] Starting restore from backup: ${backupId}`);
    // Lade Backup-Metadaten
    const backupDoc = await db.collection('backups').doc(backupId).get();
    if (!backupDoc.exists) {
        throw new Error(`Backup ${backupId} not found`);
    }
    const backupMeta = backupDoc.data();
    if (!backupMeta) {
        throw new Error(`Backup metadata not found for ${backupId}`);
    }
    // Lade Backup-Daten aus Storage
    const bucket = storage.bucket();
    const file = bucket.file(backupMeta.storagePath);
    const [fileContents] = await file.download();
    const backupData = JSON.parse(fileContents.toString());
    let restored = 0;
    let errors = 0;
    // Stelle jede Collection wieder her
    for (const [collectionName, documents] of Object.entries(backupData.collections)) {
        try {
            console.log(`[Backup] Restoring ${documents.length} documents to ${collectionName}`);
            // Batch-Schreibvorgänge für bessere Performance
            const batch = db.batch();
            let batchCount = 0;
            const BATCH_SIZE = 500; // Firestore Batch-Limit
            for (const docData of documents) {
                try {
                    const { id, invoices } = docData, data = __rest(docData, ["id", "invoices"]);
                    // Konvertiere ISO-Strings zurück zu Firestore Timestamps
                    const processedData = Object.assign({}, data);
                    Object.keys(processedData).forEach(key => {
                        const value = processedData[key];
                        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
                            try {
                                processedData[key] = admin.firestore.Timestamp.fromDate(new Date(value));
                            }
                            catch (_a) {
                                // Behalte String, wenn Konvertierung fehlschlägt
                            }
                        }
                    });
                    // Wenn userId angegeben, filtere nur Daten für diesen User
                    if (userId && processedData.userId && processedData.userId !== userId) {
                        continue;
                    }
                    const docRef = db.collection(collectionName).doc(id);
                    batch.set(docRef, processedData, { merge: true });
                    batchCount++;
                    // Stelle invoices Subcollection wieder her (für people)
                    if (collectionName === 'people' && invoices && Array.isArray(invoices)) {
                        for (const invoice of invoices) {
                            const { id: invoiceId } = invoice, invoiceData = __rest(invoice, ["id"]);
                            // Konvertiere Timestamps
                            const processedInvoice = Object.assign({}, invoiceData);
                            Object.keys(processedInvoice).forEach(key => {
                                const value = processedInvoice[key];
                                if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
                                    try {
                                        processedInvoice[key] = admin.firestore.Timestamp.fromDate(new Date(value));
                                    }
                                    catch (_a) {
                                        // Behalte String
                                    }
                                }
                            });
                            const invoiceRef = docRef.collection('invoices').doc(invoiceId);
                            batch.set(invoiceRef, processedInvoice, { merge: true });
                            batchCount++;
                        }
                    }
                    // Firestore Batch-Limit erreicht, committe und starte neuen Batch
                    if (batchCount >= BATCH_SIZE) {
                        await batch.commit();
                        restored += batchCount;
                        batchCount = 0;
                        // Neuer Batch
                        const newBatch = db.batch();
                        Object.assign(batch, newBatch);
                    }
                }
                catch (error) {
                    console.error(`[Backup] Error restoring document ${docData.id} in ${collectionName}:`, error);
                    errors++;
                }
            }
            // Committe verbleibende Änderungen
            if (batchCount > 0) {
                await batch.commit();
                restored += batchCount;
            }
            console.log(`[Backup] Restored ${documents.length} documents to ${collectionName}`);
        }
        catch (error) {
            console.error(`[Backup] Error restoring collection ${collectionName}:`, error);
            errors++;
        }
    }
    console.log(`[Backup] Restore completed: ${restored} documents restored, ${errors} errors`);
    return { restored, errors };
}
//# sourceMappingURL=backup.js.map