import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getFunctions } from "firebase/functions";

// Firebase configuration from user's project
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
export const functions = getFunctions(app);

// Initialize analytics only in browser environment
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { analytics };
export default app;
