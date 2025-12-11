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
exports.migrateUserIds = migrateUserIds;
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
/**
 * Migration Script: Migriert Daten von Firestore User Document ID zu Firebase Auth UID
 *
 * Problem: Wenn Daten mit der Firestore User Document ID statt der Firebase Auth UID
 * gespeichert wurden, werden sie nicht gefunden.
 *
 * Lösung: Dieses Script findet alle User-Dokumente und migriert die Daten.
 */
async function migrateUserIds() {
    console.log('[Migration] Starting user ID migration...');
    // 1. Hole alle User-Dokumente
    const usersSnapshot = await db.collection('users').get();
    console.log(`[Migration] Found ${usersSnapshot.size} users`);
    let totalMigrated = 0;
    for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const firestoreUserId = userDoc.id; // Firestore User Document ID
        const firebaseAuthUid = userData.openId; // Firebase Auth UID
        if (!firebaseAuthUid) {
            console.log(`[Migration] Skipping user ${firestoreUserId}: No openId found`);
            continue;
        }
        if (firestoreUserId === firebaseAuthUid) {
            console.log(`[Migration] Skipping user ${firestoreUserId}: IDs match`);
            continue;
        }
        console.log(`[Migration] Processing user: ${firestoreUserId} -> ${firebaseAuthUid}`);
        // 2. Migriere Reminders
        const remindersSnapshot = await db.collection('reminders')
            .where('userId', '==', firestoreUserId)
            .get();
        console.log(`[Migration] Found ${remindersSnapshot.size} reminders to migrate`);
        for (const reminderDoc of remindersSnapshot.docs) {
            await reminderDoc.ref.update({ userId: firebaseAuthUid });
            totalMigrated++;
        }
        // 3. Migriere Finance Entries
        const financeSnapshot = await db.collection('financeEntries')
            .where('userId', '==', firestoreUserId)
            .get();
        console.log(`[Migration] Found ${financeSnapshot.size} finance entries to migrate`);
        for (const financeDoc of financeSnapshot.docs) {
            await financeDoc.ref.update({ userId: firebaseAuthUid });
            totalMigrated++;
        }
        // 4. Migriere People
        const peopleSnapshot = await db.collection('people')
            .where('userId', '==', firestoreUserId)
            .get();
        console.log(`[Migration] Found ${peopleSnapshot.size} people to migrate`);
        for (const personDoc of peopleSnapshot.docs) {
            await personDoc.ref.update({ userId: firebaseAuthUid });
            totalMigrated++;
        }
        // 5. Migriere Tax Profiles
        const taxProfilesSnapshot = await db.collection('taxProfiles')
            .where('userId', '==', firestoreUserId)
            .get();
        console.log(`[Migration] Found ${taxProfilesSnapshot.size} tax profiles to migrate`);
        for (const taxDoc of taxProfilesSnapshot.docs) {
            await taxDoc.ref.update({ userId: firebaseAuthUid });
            totalMigrated++;
        }
        // 6. Migriere Shopping List
        const shoppingSnapshot = await db.collection('shoppingList')
            .where('userId', '==', firestoreUserId)
            .get();
        console.log(`[Migration] Found ${shoppingSnapshot.size} shopping items to migrate`);
        for (const shoppingDoc of shoppingSnapshot.docs) {
            await shoppingDoc.ref.update({ userId: firebaseAuthUid });
            totalMigrated++;
        }
        // 7. Migriere Budgets
        const budgetsSnapshot = await db.collection('budgets')
            .where('userId', '==', firestoreUserId)
            .get();
        console.log(`[Migration] Found ${budgetsSnapshot.size} budgets to migrate`);
        for (const budgetDoc of budgetsSnapshot.docs) {
            await budgetDoc.ref.update({ userId: firebaseAuthUid });
            totalMigrated++;
        }
        // 8. Migriere Work Schedules
        const workSchedulesSnapshot = await db.collection('workSchedules')
            .where('userId', '==', firestoreUserId)
            .get();
        console.log(`[Migration] Found ${workSchedulesSnapshot.size} work schedules to migrate`);
        for (const scheduleDoc of workSchedulesSnapshot.docs) {
            await scheduleDoc.ref.update({ userId: firebaseAuthUid });
            totalMigrated++;
        }
        // 9. Migriere Vacations
        const vacationsSnapshot = await db.collection('vacations')
            .where('userId', '==', firestoreUserId)
            .get();
        console.log(`[Migration] Found ${vacationsSnapshot.size} vacations to migrate`);
        for (const vacationDoc of vacationsSnapshot.docs) {
            await vacationDoc.ref.update({ userId: firebaseAuthUid });
            totalMigrated++;
        }
        // 10. Migriere School Schedules
        const schoolSchedulesSnapshot = await db.collection('schoolSchedules')
            .where('userId', '==', firestoreUserId)
            .get();
        console.log(`[Migration] Found ${schoolSchedulesSnapshot.size} school schedules to migrate`);
        for (const schoolDoc of schoolSchedulesSnapshot.docs) {
            await schoolDoc.ref.update({ userId: firebaseAuthUid });
            totalMigrated++;
        }
        // 11. Migriere School Holidays
        const schoolHolidaysSnapshot = await db.collection('schoolHolidays')
            .where('userId', '==', firestoreUserId)
            .get();
        console.log(`[Migration] Found ${schoolHolidaysSnapshot.size} school holidays to migrate`);
        for (const holidayDoc of schoolHolidaysSnapshot.docs) {
            await holidayDoc.ref.update({ userId: firebaseAuthUid });
            totalMigrated++;
        }
        // 12. Migriere Documents
        const documentsSnapshot = await db.collection('documents')
            .where('userId', '==', firestoreUserId)
            .get();
        console.log(`[Migration] Found ${documentsSnapshot.size} documents to migrate`);
        for (const docDoc of documentsSnapshot.docs) {
            await docDoc.ref.update({ userId: firebaseAuthUid });
            totalMigrated++;
        }
        // 13. Migriere Receipts
        const receiptsSnapshot = await db.collection('receipts')
            .where('userId', '==', firestoreUserId)
            .get();
        console.log(`[Migration] Found ${receiptsSnapshot.size} receipts to migrate`);
        for (const receiptDoc of receiptsSnapshot.docs) {
            await receiptDoc.ref.update({ userId: firebaseAuthUid });
            totalMigrated++;
        }
        // 14. Migriere Shopping List Templates
        const templatesSnapshot = await db.collection('shoppingListTemplates')
            .where('userId', '==', firestoreUserId)
            .get();
        console.log(`[Migration] Found ${templatesSnapshot.size} shopping list templates to migrate`);
        for (const templateDoc of templatesSnapshot.docs) {
            await templateDoc.ref.update({ userId: firebaseAuthUid });
            totalMigrated++;
        }
    }
    console.log(`[Migration] Migration complete! Total documents migrated: ${totalMigrated}`);
    return { success: true, totalMigrated };
}
//# sourceMappingURL=migrateUserIds.js.map