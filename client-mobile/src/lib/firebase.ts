import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getFunctions } from "firebase/functions";

/**
 * Firebase Configuration
 * 
 * NOTE: The API key in this configuration is PUBLIC and is intended for client-side use.
 * This is standard practice for Firebase client SDKs. The API key alone does not provide
 * access to your Firebase resources - it only identifies your Firebase project.
 * 
 * Security is enforced through:
 * 1. Firestore Security Rules (firestore.rules) - All database access is controlled
 * 2. Firebase Authentication - User authentication is required for all operations
 * 3. Firebase Cloud Functions - Server-side logic validates all requests
 * 4. Firebase App Check (if enabled) - Prevents abuse from unauthorized apps
 * 
 * IMPORTANT: Never commit sensitive data or server-side secrets to this file.
 * All sensitive operations are handled server-side via Firebase Cloud Functions.
 * 
 * For production deployments, consider using environment variables for different environments:
 * - Development: Use Firebase emulator or development project
 * - Staging: Use staging Firebase project
 * - Production: Use production Firebase project
 */
const firebaseConfig = {
  apiKey: "AIzaSyCZ8V17HUVMlBKXK0ftrMURS-XP2zIsOps",
  authDomain: "nexo-jtsky100.firebaseapp.com",
  projectId: "nexo-jtsky100",
  storageBucket: "nexo-jtsky100.firebasestorage.app",
  messagingSenderId: "859320186482",
  appId: "1:859320186482:web:0c9dcca5d8ce613aaf34eb",
  measurementId: "G-G8PX4GB2YF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
// Initialize Functions with explicit region (us-central1)
export const functions = getFunctions(app, 'us-central1');

// Initialize analytics only in browser environment
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { analytics };
export default app;
