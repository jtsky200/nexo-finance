const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();

async function deleteOldPasskeys() {
  try {
    // Find all passkeys
    const passkeysSnapshot = await db.collection('passkeys').get();
    
    console.log(`Found ${passkeysSnapshot.size} passkeys total`);
    
    for (const doc of passkeysSnapshot.docs) {
      const data = doc.data();
      console.log(`Passkey: ${doc.id}`);
      console.log(`  - Device Name: ${data.deviceName}`);
      console.log(`  - User ID: ${data.userId}`);
      console.log(`  - Credential ID: ${data.credentialId}`);
      console.log(`  - Created: ${data.createdAt?.toDate?.()}`);
      
      // Delete the passkey
      await db.collection('passkeys').doc(doc.id).delete();
      console.log(`  -> DELETED`);
    }
    
    console.log('\nAll old passkeys deleted. User can now register new passkeys.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

deleteOldPasskeys();

