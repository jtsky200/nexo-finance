/**
 * Firebase App Check Integration
 * 
 * Firebase App Check helps protect your backend resources from abuse,
 * such as billing fraud or phishing. It works with Cloud Functions,
 * Cloud Storage, and other Firebase services.
 * 
 * For web apps, App Check uses reCAPTCHA v3 to verify requests.
 */

import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import app from './firebase';

// ReCAPTCHA v3 site key from Firebase Console > App Check
// This is the Website Key (client-side key) for reCAPTCHA v3
const RECAPTCHA_SITE_KEY = '6Le84jksAAAAAOOkwbWbjdTtNScZgR2wab4UWibX';

let appCheckInitialized = false;

/**
 * Initialize Firebase App Check
 * 
 * Note: You need to:
 * 1. Enable App Check in Firebase Console
 * 2. Register your domain
 * 3. Get your reCAPTCHA v3 site key
 * 4. Replace RECAPTCHA_SITE_KEY above
 */
export async function initializeAppCheckService(): Promise<void> {
  if (appCheckInitialized) {
    return;
  }

  // Only initialize in browser environment
  if (typeof window === 'undefined') {
    return;
  }

  try {
    // Initialize App Check with reCAPTCHA v3
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true, // Automatically refresh tokens
    });

    appCheckInitialized = true;

    // Log in both development and production for verification
    console.log('[App Check] Initialized successfully');
  } catch (error) {
    // Don't break the app if App Check fails to initialize
    console.error('[App Check] Failed to initialize:', error);
    
    // In development, warn about missing configuration
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[App Check] App Check not configured. ' +
        'To enable: 1) Enable App Check in Firebase Console, ' +
        '2) Register your domain, 3) Get reCAPTCHA v3 site key, ' +
        '4) Update RECAPTCHA_SITE_KEY in appCheck.ts'
      );
    }
  }
}

/**
 * Get App Check token with optional action
 * 
 * Actions help Firebase App Check provide better analytics and adaptive risk analysis.
 * Actions must be alphanumeric, slashes, and underscores only. Not user-specific.
 * 
 * Note: Firebase App Check uses reCAPTCHA v3 internally, which provides scores (0.0-1.0).
 * Low scores result in token verification failure. Successful token = acceptable score.
 * 
 * @param action - Action name (e.g., 'login', 'submit', 'register', 'reset_password')
 * @returns App Check token or null if failed
 */
export async function getAppCheckToken(action?: string): Promise<string | null> {
  try {
    if (!appCheckInitialized) {
      await initializeAppCheckService();
    }

    const { getToken } = await import('firebase/app-check');
    
    // Get App Check token
    // Firebase App Check internally uses reCAPTCHA v3 which:
    // - Returns scores from 0.0 (bot) to 1.0 (human)
    // - Low scores (< 0.5 typically) result in token verification failure
    // - Successful token generation means reCAPTCHA score was acceptable
    const tokenResult = await getToken(/* forceRefresh: false */);
    
    // Log action for analytics (if provided)
    if (action && process.env.NODE_ENV === 'development') {
      console.debug(`[App Check] Token retrieved for action: ${action}`);
    }
    
    return tokenResult.token;
  } catch (error) {
    console.error('[App Check] Failed to get token:', error);
    // Token generation failure could indicate:
    // - Low reCAPTCHA v3 score (suspicious activity)
    // - App Check not properly configured
    // - Network issues
    return null;
  }
}

/**
 * Get App Check token for a specific action
 * 
 * Recommended actions based on documentation:
 * - 'login' - For authentication
 * - 'register' - For user registration
 * - 'submit' - For form submissions
 * - 'reset_password' - For password resets
 * - 'buy' - For e-commerce transactions
 * - 'play' - For game actions
 */
export async function getAppCheckTokenForAction(action: string): Promise<string | null> {
  // Validate action name (alphanumeric, slashes, underscores only)
  if (!/^[a-zA-Z0-9/_]+$/.test(action)) {
    console.error('[App Check] Invalid action name. Must be alphanumeric, slashes, and underscores only.');
    return null;
  }
  
  return getAppCheckToken(action);
}

/**
 * Verify App Check is working
 */
export async function verifyAppCheck(): Promise<boolean> {
  try {
    const token = await getAppCheckToken();
    return token !== null;
  } catch {
    return false;
  }
}

