import * as admin from 'firebase-admin';
import { getStorage } from 'firebase-admin/storage';

const db = admin.firestore();
const storage = getStorage();

/**
 * Backup-System für Firestore-Daten
 * 
 * Erstellt automatische Backups aller wichtigen Collections:
 * - reminders
 * - financeEntries
 * - people (mit invoices)
 * - taxProfiles
 * - shoppingList
 * - budgets
 * - workSchedules
 * - vacations
 * - schoolSchedules
 * - schoolHolidays
 * - documents
 * - receipts
 * - shoppingListTemplates
 */

export interface BackupData {
  timestamp: string;
  collections: {
    [collectionName: string]: any[];
  };
  metadata: {
    totalDocuments: number;
    backupVersion: string;
  };
}

/**
 * Erstellt ein vollständiges Backup aller Firestore-Daten
 */
export async function createBackup(): Promise<{ backupId: string; backupUrl: string; documentCount: number }> {
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
  
  const backupData: BackupData = {
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
      const documents: any[] = [];
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const docData: any = {
          id: doc.id,
          ...data,
        };
        
        // Konvertiere Firestore Timestamps zu ISO-Strings
        Object.keys(docData).forEach(key => {
          const value = docData[key];
          if (value && typeof value === 'object' && value.constructor?.name === 'Timestamp') {
            docData[key] = value.toDate().toISOString();
          } else if (value && typeof value === 'object' && value.toDate && typeof value.toDate === 'function') {
            docData[key] = value.toDate().toISOString();
          }
        });
        
        // Für people: Backup auch invoices Subcollection
        if (collectionName === 'people') {
          try {
            const invoicesSnapshot = await doc.ref.collection('invoices').get();
            const invoices: any[] = [];
            
            for (const invoiceDoc of invoicesSnapshot.docs) {
              const invoiceData = invoiceDoc.data();
              const invoice: any = {
                id: invoiceDoc.id,
                ...invoiceData,
              };
              
              // Konvertiere Timestamps
              Object.keys(invoice).forEach(key => {
                const value = invoice[key];
                if (value && typeof value === 'object' && value.constructor?.name === 'Timestamp') {
                  invoice[key] = value.toDate().toISOString();
                } else if (value && typeof value === 'object' && value.toDate && typeof value.toDate === 'function') {
                  invoice[key] = value.toDate().toISOString();
                }
              });
              
              invoices.push(invoice);
            }
            
            docData.invoices = invoices;
          } catch (error) {
            console.error(`[Backup] Error backing up invoices for person ${doc.id}:`, error);
          }
        }
        
        documents.push(docData);
      }
      
      backupData.collections[collectionName] = documents;
      totalDocuments += documents.length;
      
      console.log(`[Backup] Backed up ${documents.length} documents from ${collectionName}`);
    } catch (error) {
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
export async function listBackups(limit: number = 10): Promise<any[]> {
  const snapshot = await db.collection('backups')
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
    };
  });
}

/**
 * Stellt Daten aus einem Backup wieder her
 */
export async function restoreBackup(backupId: string, userId?: string): Promise<{ restored: number; errors: number }> {
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
  const backupData: BackupData = JSON.parse(fileContents.toString());
  
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
          const { id, invoices, ...data } = docData;
          
          // Konvertiere ISO-Strings zurück zu Firestore Timestamps
          const processedData: any = { ...data };
          Object.keys(processedData).forEach(key => {
            const value = processedData[key];
            if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
              try {
                processedData[key] = admin.firestore.Timestamp.fromDate(new Date(value));
              } catch {
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
              const { id: invoiceId, ...invoiceData } = invoice;
              
              // Konvertiere Timestamps
              const processedInvoice: any = { ...invoiceData };
              Object.keys(processedInvoice).forEach(key => {
                const value = processedInvoice[key];
                if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
                  try {
                    processedInvoice[key] = admin.firestore.Timestamp.fromDate(new Date(value));
                  } catch {
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
        } catch (error) {
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
    } catch (error) {
      console.error(`[Backup] Error restoring collection ${collectionName}:`, error);
      errors++;
    }
  }
  
  console.log(`[Backup] Restore completed: ${restored} documents restored, ${errors} errors`);
  
  return { restored, errors };
}

