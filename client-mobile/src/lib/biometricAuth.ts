/**
 * Biometric Authentication using WebAuthn API
 * Supports fingerprint, face ID, and other platform authenticators
 */

import { useState, useEffect } from 'react';
import { useUserSettings } from './firebaseHooks';

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  credentialId?: string;
}

/**
 * Check if WebAuthn/biometric authentication is supported
 */
export function isBiometricSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'PublicKeyCredential' in window &&
    typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
  );
}

/**
 * Check if a platform authenticator (biometric) is available
 */
export async function isBiometricAvailable(): Promise<boolean> {
  if (!isBiometricSupported()) {
    return false;
  }

  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch (error) {
    console.error('[Biometric] Error checking availability:', error);
    return false;
  }
}

/**
 * Register a new biometric credential
 * Note: This requires backend support for WebAuthn registration
 */
export async function registerBiometric(
  userId: string,
  userName: string
): Promise<BiometricAuthResult> {
  if (!isBiometricSupported()) {
    return {
      success: false,
      error: 'Biometric authentication is not supported on this device',
    };
  }

  const available = await isBiometricAvailable();
  if (!available) {
    return {
      success: false,
      error: 'No biometric authenticator available on this device',
    };
  }

  try {
    // This is a simplified example - in production, you'd get these from your backend
    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge: Uint8Array.from(
        crypto.getRandomValues(new Uint8Array(32))
      ),
      rp: {
        name: 'Nexo',
        id: window.location.hostname,
      },
      user: {
        id: Uint8Array.from(userId, (c) => c.charCodeAt(0)),
        name: userName,
        displayName: userName,
      },
      pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
      },
      timeout: 60000,
      attestation: 'direct',
    };

    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    }) as PublicKeyCredential;

    if (!credential) {
      return {
        success: false,
        error: 'Failed to create credential',
      };
    }

    // In production, send credential to backend for storage
    const credentialId = Buffer.from(
      (credential.rawId as ArrayBuffer)
    ).toString('base64');

    return {
      success: true,
      credentialId,
    };
  } catch (error: any) {
    console.error('[Biometric] Registration error:', error);
    
    let errorMessage = 'Biometric registration failed';
    if (error.name === 'NotAllowedError') {
      errorMessage = 'Biometric registration was cancelled or denied';
    } else if (error.name === 'InvalidStateError') {
      errorMessage = 'Biometric credential already exists';
    } else if (error.name === 'NotSupportedError') {
      errorMessage = 'Biometric authentication is not supported';
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Authenticate using biometric
 * Note: This requires backend support for WebAuthn authentication
 */
export async function authenticateBiometric(
  credentialId: string
): Promise<BiometricAuthResult> {
  if (!isBiometricSupported()) {
    return {
      success: false,
      error: 'Biometric authentication is not supported on this device',
    };
  }

  const available = await isBiometricAvailable();
  if (!available) {
    return {
      success: false,
      error: 'No biometric authenticator available on this device',
    };
  }

  try {
    // This is a simplified example - in production, you'd get these from your backend
    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge: Uint8Array.from(
        crypto.getRandomValues(new Uint8Array(32))
      ),
      allowCredentials: [
        {
          id: Uint8Array.from(atob(credentialId), (c) => c.charCodeAt(0)),
          type: 'public-key',
          transports: ['internal'],
        },
      ],
      timeout: 60000,
      userVerification: 'required',
    };

    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    });

    if (!assertion) {
      return {
        success: false,
        error: 'Biometric authentication failed',
      };
    }

    // In production, send assertion to backend for verification
    return {
      success: true,
    };
  } catch (error: any) {
    console.error('[Biometric] Authentication error:', error);
    
    let errorMessage = 'Biometric authentication failed';
    if (error.name === 'NotAllowedError') {
      errorMessage = 'Biometric authentication was cancelled or denied';
    } else if (error.name === 'InvalidStateError') {
      errorMessage = 'No biometric credential found';
    } else if (error.name === 'NotSupportedError') {
      errorMessage = 'Biometric authentication is not supported';
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Check if user has biometric enabled (stored in localStorage for demo)
 * In production, this would check with the backend
 * Note: This is a synchronous function. Use useBiometricAuth() hook for React components.
 */
export function hasBiometricEnabled(): boolean {
  return localStorage.getItem('biometricEnabled') === 'true';
}

/**
 * Hook to use biometric authentication settings
 */
export function useBiometricAuth() {
  const { settings, updateSettings, isLoading } = useUserSettings();
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    // Try Firebase first, then localStorage as fallback
    if (settings?.biometricEnabled !== undefined) {
      return settings.biometricEnabled;
    }
    return localStorage.getItem('biometricEnabled') === 'true';
  });

  // Sync with Firebase UserSettings when settings change
  useEffect(() => {
    if (!isLoading && settings?.biometricEnabled !== undefined) {
      setIsEnabled(settings.biometricEnabled);
    } else if (!isLoading && !settings?.biometricEnabled) {
      // Migrate from localStorage to Firebase
      const saved = localStorage.getItem('biometricEnabled');
      if (saved !== null) {
        const value = saved === 'true';
        updateSettings({ biometricEnabled: value }).then(() => {
          localStorage.removeItem('biometricEnabled');
        }).catch(console.error);
        setIsEnabled(value);
      }
    }
  }, [settings?.biometricEnabled, isLoading, updateSettings]);

  const enable = async () => {
    setIsEnabled(true);
    await updateSettings({ biometricEnabled: true });
    localStorage.setItem('biometricEnabled', 'true'); // Fallback
  };

  const disable = async () => {
    setIsEnabled(false);
    await updateSettings({ biometricEnabled: false });
    localStorage.setItem('biometricEnabled', 'false'); // Fallback
  };

  return { isEnabled, enable, disable };
}

/**
 * Enable biometric authentication (legacy function, use hook version)
 */
export function enableBiometric(): void {
  localStorage.setItem('biometricEnabled', 'true');
}

/**
 * Disable biometric authentication (legacy function, use hook version)
 */
export function disableBiometric(): void {
  localStorage.setItem('biometricEnabled', 'false');
}
