import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { sendPasswordResetEmail, signInWithEmailAndPassword, signOut, signInWithCustomToken, RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider, signInWithCredential, getMultiFactorResolver, multiFactor, PhoneMultiFactorGenerator, deleteUser } from 'firebase/auth';
import { auth, db, functions } from '@/lib/firebase';
import { Loader2, Smartphone, KeyRound, Fingerprint, Phone } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';

// Format phone number with spaces based on country code
const formatPhoneNumber = (value: string): string => {
  if (!value || value.trim() === '') return '';
  const cleaned = value.replace(/[^\d+]/g, '');
  if (!cleaned.startsWith('+')) {
    if (cleaned.length > 0) {
      return '+' + cleaned;
    }
    return cleaned;
  }
  
  // Known 2-digit country codes (check these first to avoid greedy matching)
  const twoDigitCodes = ['41', '49', '43', '33', '39', '34', '31', '32', '44', '45', '46', '47', '48', '30', '90', '91', '81', '82', '86'];
  const digitsOnly = cleaned.slice(1); // Remove the +
  
  let countryCode = '';
  let number = '';
  
  // Check for known 2-digit country codes first
  for (const code of twoDigitCodes) {
    if (digitsOnly.startsWith(code)) {
      countryCode = code;
      number = digitsOnly.slice(code.length);
      break;
    }
  }
  
  // If no known 2-digit code found, use generic matching
  if (!countryCode) {
    const match = cleaned.match(/^\+(\d{1,3})(.*)$/);
    if (!match) return cleaned;
    countryCode = match[1];
    number = match[2].replace(/\D/g, '');
  }
  
  if (number.length === 0) {
    return `+${countryCode}`;
  }
  
  let formatted = `+${countryCode}`;
  
  // Swiss format: +41 79 XXX XX XX
  if (countryCode === '41' && number.length > 0) {
    if (number.length <= 2) {
      formatted += ' ' + number;
    } else if (number.length <= 5) {
      formatted += ' ' + number.slice(0, 2) + ' ' + number.slice(2);
    } else if (number.length <= 7) {
      formatted += ' ' + number.slice(0, 2) + ' ' + number.slice(2, 5) + ' ' + number.slice(5);
    } else {
      formatted += ' ' + number.slice(0, 2) + ' ' + number.slice(2, 5) + ' ' + number.slice(5, 7) + ' ' + number.slice(7, 9);
    }
  } 
  // German format: +49 XXX XXXXXXX
  else if (countryCode === '49' && number.length > 0) {
    if (number.length <= 3) {
      formatted += ' ' + number;
    } else if (number.length <= 7) {
      formatted += ' ' + number.slice(0, 3) + ' ' + number.slice(3);
    } else {
      formatted += ' ' + number.slice(0, 3) + ' ' + number.slice(3, 7) + ' ' + number.slice(7);
    }
  }
  // Default format: groups of 3
  else if (number.length > 0) {
    const parts = number.match(/.{1,3}/g) || [];
    formatted += ' ' + parts.join(' ');
  }
  
  return formatted.trim();
};
import { httpsCallable } from 'firebase/functions';

export default function Login() {
  const [, setLocation] = useLocation();
  const { signIn, signInWithGoogle, error: authError, user, loading } = useAuth();
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPasswordDialog, setShowForgotPasswordDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);
  
  // 2FA/TOTP
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [pendingUser, setPendingUser] = useState<any>(null);
  const [twoFactorSecret, setTwoFactorSecret] = useState<string | null>(null);
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);
  
  // Passwordless 2FA Login
  const [show2FAOnlyDialog, setShow2FAOnlyDialog] = useState(false);
  const [twoFactorOnlyEmail, setTwoFactorOnlyEmail] = useState('');
  const [twoFactorOnlyCode, setTwoFactorOnlyCode] = useState('');
  const [is2FAOnlyStep2, setIs2FAOnlyStep2] = useState(false);
  const [isVerifying2FAOnly, setIsVerifying2FAOnly] = useState(false);
  
  // Passkey Login
  const [showPasskeyDialog, setShowPasskeyDialog] = useState(false);
  const [passkeyEmail, setPasskeyEmail] = useState('');
  const [passkeyPassword, setPasskeyPassword] = useState('');
  const [isAuthenticatingPasskey, setIsAuthenticatingPasskey] = useState(false);
  const [passkeyStep, setPasskeyStep] = useState<'email' | 'noPasskey' | 'register' | 'success'>('email');
  const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);
  const [newPasskeyName, setNewPasskeyName] = useState('');

  // Phone/SMS Login (Primary Factor)
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [isSendingSMS, setIsSendingSMS] = useState(false);
  const [isVerifyingSMS, setIsVerifyingSMS] = useState(false);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);

  // Firebase MFA (Phone as Second Factor)
  const [showMFADialog, setShowMFADialog] = useState(false);
  const [mfaResolver, setMfaResolver] = useState<any>(null);
  const [mfaHints, setMfaHints] = useState<any[]>([]);
  const [selectedMfaIndex, setSelectedMfaIndex] = useState<number>(0);
  const [mfaVerificationId, setMfaVerificationId] = useState<string | null>(null);
  const [mfaVerificationCode, setMfaVerificationCode] = useState('');
  const [isSendingMFASMS, setIsSendingMFASMS] = useState(false);
  const [isVerifyingMFA, setIsVerifyingMFA] = useState(false);

  // Initialize invisible reCAPTCHA verifier
  useEffect(() => {
    if (typeof window !== 'undefined' && !recaptchaVerifier) {
      try {
        const verifier = new RecaptchaVerifier(auth, 'phone-sign-in-button', {
          size: 'invisible',
          callback: (response: any) => {
            console.log('reCAPTCHA solved:', response);
          },
          'expired-callback': () => {
            console.log('reCAPTCHA expired');
          },
        });
        setRecaptchaVerifier(verifier);
      } catch (error) {
        console.error('Error initializing reCAPTCHA:', error);
      }
    }

    // Cleanup on unmount
    return () => {
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
      }
    };
  }, [recaptchaVerifier]);

  // Check sessionStorage on mount and restore 2FA state
  // For security: only restore if the entry is less than 60 seconds old
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('pending2FA');
      if (stored) {
        const parsed = JSON.parse(stored);
        const timestamp = parsed.timestamp || 0;
        const age = Date.now() - timestamp;
        const maxAge = 60000; // 60 seconds
        
        if (age > maxAge) {
          // Entry is too old (probably a manual page refresh) - clear it
          sessionStorage.removeItem('pending2FA');
          return;
        }
        
        setTwoFactorSecret(parsed.secret);
        setPendingUser({ email: parsed.email, uid: parsed.uid });
        setShow2FADialog(true);
      }
    } catch {
      sessionStorage.removeItem('pending2FA');
    }
  }, []);

  // Redirect to dashboard when user is authenticated (but not if 2FA is pending)
  useEffect(() => {
    // Don't redirect if 2FA dialog is pending
    const pending2FA = sessionStorage.getItem('pending2FA');
    if (pending2FA) return;
    // Don't redirect if phone dialog is still open
    if (showPhoneDialog || confirmationResult) return;
    // Don't redirect if passkey dialog is still open
    if (showPasskeyDialog) return;
    if (!loading && user && !show2FADialog && !pendingUser && !twoFactorSecret) {
      setLocation('/dashboard');
    }
  }, [user, loading, setLocation, show2FADialog, pendingUser, twoFactorSecret, showPhoneDialog, confirmationResult, showPasskeyDialog]);

  // Normal login (without 2FA) - supports Firebase MFA
  const handleNormalLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!email || !password) {
      toast.error(t('auth.login.fillAllFields', 'Bitte füllen Sie alle Felder aus'));
      return;
    }
    
    try {
      setIsLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // User successfully signed in and is not enrolled with a second factor
      toast.success(t('auth.login.success'));
      
      // Clear any stale session data that might block redirect
      sessionStorage.removeItem('pending2FA');
      
      // Explicit redirect after successful login
      setTimeout(() => {
        setLocation('/dashboard');
      }, 100);
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Check if MFA is required (Firebase MFA, not TOTP)
      if (error.code === 'auth/multi-factor-auth-required') {
        try {
          // Get the multi-factor resolver
          const resolver = getMultiFactorResolver(auth, error);
          setMfaResolver(resolver);
          setMfaHints(resolver.hints || []);
          
          // If user has multiple factors, show selection dialog
          // For now, we'll use the first phone factor if available
          const phoneFactorIndex = resolver.hints.findIndex(
            (hint: any) => hint.factorId === PhoneMultiFactorGenerator.FACTOR_ID
          );
          
          if (phoneFactorIndex >= 0) {
            setSelectedMfaIndex(phoneFactorIndex);
            setShowMFADialog(true);
            setIsLoading(false);
            toast.info(t('auth.login.mfaRequired', 'Multi-Faktor-Authentifizierung erforderlich'));
          } else {
            toast.error(t('auth.login.noPhoneFactor', 'Kein Telefon-Faktor registriert'));
          }
        } catch (mfaError: any) {
          console.error('MFA resolver error:', mfaError);
          toast.error(t('auth.login.mfaError', 'Fehler bei der MFA-Verifizierung'));
        }
        return;
      }
      
      // Handle other errors with user-friendly messages
      let errorMessage = t('auth.login.genericError', 'Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Eingaben.');
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = t('auth.login.userNotFound', 'Benutzer nicht gefunden');
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = t('auth.login.wrongPassword', 'Falsches Passwort');
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = t('auth.login.invalidEmail', 'Ungültige E-Mail-Adresse');
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = t('auth.login.invalidCredential', 'Ungültige Anmeldedaten. Bitte überprüfen Sie E-Mail und Passwort.');
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = t('auth.login.tooManyRequests', 'Zu viele Anmeldeversuche. Bitte versuchen Sie es später erneut.');
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 2FA login
  const handle2FALogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!email || !password) {
      toast.error(t('auth.login.fillAllFields', 'Bitte füllen Sie alle Felder aus'));
      return;
    }
    
    try {
      setIsLoading(true);
      // First, sign in to get user credential
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      if (userCredential?.user) {
        // Check if 2FA is enabled for this user
        const twoFactorDoc = await getDoc(doc(db, 'twoFactorSecrets', userCredential.user.uid));
        
        if (twoFactorDoc.exists() && twoFactorDoc.data().enabled === true && twoFactorDoc.data().secret) {
          // 2FA is enabled
          const secret = twoFactorDoc.data().secret;
          const userEmail = userCredential.user.email || email;
          const userId = userCredential.user.uid;
          
          // Store in sessionStorage BEFORE signOut to preserve across re-renders
          // Also store password for re-login after 2FA verification
          // Add timestamp for security (entry expires after 60 seconds)
          const pending2FAData = { secret, email: userEmail, uid: userId, password, timestamp: Date.now() };
          sessionStorage.setItem('pending2FA', JSON.stringify(pending2FAData));
          
          // Sign out first
          await signOut(auth);
          
          // Set states after signOut
          setTwoFactorSecret(secret);
          setPendingUser({ email: userEmail, uid: userId });
          setShow2FADialog(true);
          setIsLoading(false);
          
          // Show toast
          toast.success(t('auth.login.twoFactorRequired', 'Bitte geben Sie Ihren 2FA-Code ein'));
          
          return;
        } else {
          // 2FA not enabled for this user
          await signOut(auth);
          toast.error(t('auth.login.twoFactorNotEnabled', '2FA ist für dieses Konto nicht aktiviert'));
        }
      }
    } catch (error: any) {
      console.error('2FA Login error:', error);
      let errorMessage = t('auth.login.genericError', 'Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Eingaben.');
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = t('auth.login.userNotFound', 'Benutzer nicht gefunden');
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = t('auth.login.wrongPassword', 'Falsches Passwort');
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = t('auth.login.invalidEmail', 'Ungültige E-Mail-Adresse');
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = t('auth.login.invalidCredential', 'Ungültige Anmeldedaten. Bitte überprüfen Sie E-Mail und Passwort.');
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FAVerification = async () => {
    if (!twoFactorSecret || !twoFactorCode || twoFactorCode.length !== 6) {
      toast.error(t('auth.login.invalid2FACode', 'Ungültiger Code'));
      return;
    }

    // Get credentials from sessionStorage if not in state
    let loginEmail = email;
    let loginPassword = password;
    try {
      const stored = sessionStorage.getItem('pending2FA');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.email && !loginEmail) loginEmail = parsed.email;
        if (parsed.password && !loginPassword) loginPassword = parsed.password;
      }
    } catch {}

    setIsVerifying2FA(true);
    try {
      // Use otplib loader to avoid Buffer issues
      const { loadOtplib } = await import('@/lib/otplib-loader');
      const otplibModule = await loadOtplib();
      const { authenticator } = otplibModule;
      
      const isValid = authenticator.verify({
        token: twoFactorCode,
        secret: twoFactorSecret,
      });

      if (!isValid) {
        toast.error(t('auth.login.invalid2FACode', 'Ungültiger Code'));
        setIsVerifying2FA(false);
        return;
      }

      // 2FA verified - complete login by signing in again
      if (loginEmail && loginPassword) {
        const userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
        
        // Update last used timestamp
        if (userCredential?.user) {
          const { setDoc, Timestamp } = await import('firebase/firestore');
          await setDoc(doc(db, 'twoFactorSecrets', userCredential.user.uid), {
            secret: twoFactorSecret,
            enabled: true,
            lastUsed: Timestamp.now(),
          }, { merge: true });
        }
        
        // Clear sessionStorage and states
        sessionStorage.removeItem('pending2FA');
        setShow2FADialog(false);
        setTwoFactorCode('');
        setTwoFactorSecret(null);
        setPendingUser(null);
        toast.success(t('auth.login.success'));
        // Redirect will happen automatically via useEffect when user state updates
      } else {
        toast.error(t('auth.login.missingCredentials', 'Anmeldedaten fehlen. Bitte loggen Sie sich erneut ein.'));
        sessionStorage.removeItem('pending2FA');
        setShow2FADialog(false);
      }
    } catch {
      toast.error(t('auth.login.errorVerifying2FA', 'Fehler bei der Verifizierung'));
    } finally {
      setIsVerifying2FA(false);
    }
  };

  // Passwordless 2FA Login - Step 1: Check if 2FA is enabled
  const handle2FAOnlyStep1 = async () => {
    if (!twoFactorOnlyEmail) {
      toast.error(t('auth.login.emailRequired', 'E-Mail ist erforderlich'));
      return;
    }
    
    setIsVerifying2FAOnly(true);
    try {
      const check2FAStatus = httpsCallable(functions, 'check2FAStatus');
      const result = await check2FAStatus({ email: twoFactorOnlyEmail });
      const data = result.data as { enabled: boolean };
      
      if (data.enabled) {
        setIs2FAOnlyStep2(true);
        toast.success(t('auth.login.enter2FACode', 'Bitte geben Sie Ihren 2FA-Code ein'));
      } else {
        toast.error(t('auth.login.twoFactorNotEnabled', '2FA ist für dieses Konto nicht aktiviert. Bitte aktivieren Sie 2FA zuerst in den Einstellungen.'));
      }
    } catch (error: any) {
      console.error('2FA check error:', error);
      toast.error(t('auth.login.genericError', 'Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Eingaben.'));
    } finally {
      setIsVerifying2FAOnly(false);
    }
  };
  
  // Passwordless 2FA Login - Step 2: Verify code and login
  const handle2FAOnlyStep2 = async () => {
    if (!twoFactorOnlyEmail || !twoFactorOnlyCode || twoFactorOnlyCode.length !== 6) {
      toast.error(t('auth.login.invalid2FACode', 'Ungültiger Code'));
      return;
    }
    
    setIsVerifying2FAOnly(true);
    try {
      const loginWith2FAOnly = httpsCallable(functions, 'loginWith2FAOnly');
      const result = await loginWith2FAOnly({ 
        email: twoFactorOnlyEmail, 
        totpCode: twoFactorOnlyCode 
      });
      const data = result.data as { success: boolean; customToken: string };
      
      if (data.success && data.customToken) {
        // Sign in with custom token
        await signInWithCustomToken(auth, data.customToken);
        
        // Clear states
        setShow2FAOnlyDialog(false);
        setTwoFactorOnlyEmail('');
        setTwoFactorOnlyCode('');
        setIs2FAOnlyStep2(false);
        
        toast.success(t('auth.login.success'));
        // Redirect will happen automatically via useEffect
      }
    } catch (error: any) {
      console.error('2FA only login error:', error);
      let errorMessage = t('auth.login.genericError', 'Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Eingaben.');
      
      if (error.code === 'functions/unauthenticated') {
        errorMessage = t('auth.login.invalid2FACode', 'Ungültiger 2FA-Code');
      } else if (error.code === 'functions/not-found') {
        errorMessage = t('auth.login.userNotFound', 'Benutzer nicht gefunden');
      } else if (error.code === 'functions/failed-precondition') {
        errorMessage = t('auth.login.twoFactorNotEnabled', '2FA ist für dieses Konto nicht aktiviert');
      }
      
      toast.error(errorMessage);
    } finally {
      setIsVerifying2FAOnly(false);
    }
  };

  // Passkey Login - Step 1: Check if passkeys exist
  const handlePasskeyCheckEmail = async () => {
    if (!passkeyEmail) {
      toast.error(t('auth.login.emailRequired', 'E-Mail ist erforderlich'));
      return;
    }
    
    setIsAuthenticatingPasskey(true);
    try {
      // Import WebAuthn browser library
      const { startAuthentication } = await import('@simplewebauthn/browser');
      
      // Get authentication options from server
      const generateOptions = httpsCallable(functions, 'generatePasskeyAuthenticationOptions');
      const optionsResult = await generateOptions({ email: passkeyEmail });
      const options = optionsResult.data as any;
      
      // Start WebAuthn authentication
      const credential = await startAuthentication({ optionsJSON: options });
      
      // DEBUG: Log what the browser is sending
      console.log('=== BROWSER CREDENTIAL ===');
      console.log('Credential ID from browser:', credential.id);
      console.log('Credential ID length:', credential.id.length);
      console.log('Raw ID:', credential.rawId);
      console.log('Full credential object:', JSON.stringify(credential, null, 2));
      
      // Verify with server
      const verifyAuth = httpsCallable(functions, 'verifyPasskeyAuthentication');
      const verifyResult = await verifyAuth({ 
        credential, 
        challengeId: options.challengeId 
      });
      const data = verifyResult.data as { success: boolean; customToken: string };
      
      if (data.success && data.customToken) {
        // Sign in with custom token
        await signInWithCustomToken(auth, data.customToken);
        
        setShowPasskeyDialog(false);
        resetPasskeyDialog();
        toast.success(t('auth.login.success'));
      }
    } catch (error: any) {
      console.error('Passkey login error:', error);
      
      if (error.code === 'functions/failed-precondition' || 
          error.message?.includes('Keine Passkeys')) {
        // No passkeys registered - show registration flow
        setPasskeyStep('noPasskey');
      } else if (error.name === 'NotAllowedError') {
        toast.error(t('auth.login.passkeyAborted', 'Authentifizierung abgebrochen'));
      } else if (error.code === 'functions/not-found') {
        toast.error(t('auth.login.userNotFound', 'Benutzer nicht gefunden'));
      } else {
        toast.error(t('auth.login.passkeyError', 'Passkey-Anmeldung fehlgeschlagen'));
      }
    } finally {
      setIsAuthenticatingPasskey(false);
    }
  };
  
  // Passkey Registration - Step 2: Login with password and register passkey
  const handlePasskeySignInAndRegister = async () => {
    if (!passkeyEmail || !passkeyPassword) {
      toast.error(t('auth.login.emailPasswordRequired', 'E-Mail und Passwort sind erforderlich'));
      return;
    }
    
    setIsAuthenticatingPasskey(true);
    try {
      // Sign in with email/password
      await signInWithEmailAndPassword(auth, passkeyEmail, passkeyPassword);
      
      // Move to registration step
      setPasskeyStep('register');
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast.error(t('auth.login.invalidCredentials', 'Ungültige Anmeldedaten'));
    } finally {
      setIsAuthenticatingPasskey(false);
    }
  };
  
  // Passkey Registration - Step 3: Register the passkey
  const handleRegisterPasskey = async () => {
    setIsRegisteringPasskey(true);
    try {
      const { startRegistration } = await import('@simplewebauthn/browser');
      
      // Get registration options from server
      const generateOptions = httpsCallable(functions, 'generatePasskeyRegistrationOptions');
      const optionsResult = await generateOptions({});
      const options = optionsResult.data as any;
      
      // Start WebAuthn registration
      const credential = await startRegistration({ optionsJSON: options });
      
      // Verify with server
      const verifyRegistration = httpsCallable(functions, 'verifyPasskeyRegistration');
      const verifyResult = await verifyRegistration({ 
        credential, 
        deviceName: newPasskeyName || t('settings.defaultDeviceName', 'Mein Gerät') 
      });
      const data = verifyResult.data as { success: boolean };
      
      if (data.success) {
        setPasskeyStep('success');
      }
    } catch (error: any) {
      console.error('Error registering passkey:', error);
      
      let errorMessage = t('auth.login.passkeyRegisterError', 'Fehler beim Registrieren des Passkeys');
      
      if (error.name === 'NotAllowedError') {
        errorMessage = t('auth.login.passkeyAborted', 'Registrierung abgebrochen');
      } else if (error.name === 'InvalidStateError') {
        errorMessage = t('auth.login.passkeyAlreadyRegistered', 'Dieser Passkey ist bereits registriert');
      }
      
      toast.error(errorMessage);
    } finally {
      setIsRegisteringPasskey(false);
    }
  };
  
  // Reset passkey dialog state
  const resetPasskeyDialog = () => {
    setPasskeyEmail('');
    setPasskeyPassword('');
    setPasskeyStep('email');
    setNewPasskeyName('');
  };

  // Phone/SMS Login - Send verification code
  const handlePhoneLogin = async () => {
    if (!phoneNumber) {
      toast.error(t('auth.login.phoneRequired', 'Telefonnummer ist erforderlich'));
      return;
    }

    if (!recaptchaVerifier) {
      toast.error(t('auth.login.recaptchaNotReady', 'reCAPTCHA ist nicht bereit. Bitte Seite neu laden.'));
      return;
    }

    setIsSendingSMS(true);
    try {
      // Remove all spaces and format phone number (add + if not present)
      const cleanedPhone = phoneNumber.replace(/\s/g, '');
      const formattedPhone = cleanedPhone.startsWith('+') ? cleanedPhone : `+${cleanedPhone}`;
      
      // Check if phone number exists BEFORE sending SMS
      const checkPhone = httpsCallable(functions, 'checkPhoneNumberExists');
      const checkResult = await checkPhone({ phoneNumber: formattedPhone });
      
      // If phone number does NOT exist, show error
      if (!(checkResult.data as any).exists) {
        toast.error(t('auth.login.phoneNumberNotRegistered', 'Diese Telefonnummer ist nicht mit einem Konto verknüpft. Bitte verwenden Sie E-Mail/Passwort oder registrieren Sie sich zuerst.'));
        setIsSendingSMS(false);
        return;
      }
      
      // Send SMS with verification code
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
      setConfirmationResult(confirmation);
      toast.success(t('auth.login.smsSent', 'SMS mit Verifizierungscode wurde gesendet'));
    } catch (error: any) {
      console.error('Phone login error:', error);
      let errorMessage = t('auth.login.phoneError', 'Fehler beim Senden der SMS');
      
      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = t('auth.login.invalidPhoneNumber', 'Ungültige Telefonnummer');
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = t('auth.login.tooManyRequests', 'Zu viele Anfragen. Bitte später erneut versuchen.');
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSendingSMS(false);
    }
  };

  // Firebase MFA - Send SMS verification code
  const handleMFASendSMS = async () => {
    if (!mfaResolver || !recaptchaVerifier) {
      toast.error(t('auth.login.mfaNotReady', 'MFA ist nicht bereit'));
      return;
    }

    const selectedHint = mfaHints[selectedMfaIndex];
    if (!selectedHint || selectedHint.factorId !== PhoneMultiFactorGenerator.FACTOR_ID) {
      toast.error(t('auth.login.invalidMfaFactor', 'Ungültiger MFA-Faktor'));
      return;
    }

    setIsSendingMFASMS(true);
    try {
      // Initialize PhoneInfoOptions with multiFactorHint and session
      const phoneInfoOptions = {
        multiFactorHint: selectedHint,
        session: mfaResolver.session,
      };

      // Send SMS verification code
      const phoneAuthProvider = new PhoneAuthProvider(auth);
      const verificationId = await phoneAuthProvider.verifyPhoneNumber(phoneInfoOptions, recaptchaVerifier);
      
      setMfaVerificationId(verificationId);
      toast.success(t('auth.login.smsSent', 'SMS mit Verifizierungscode wurde gesendet'));
    } catch (error: any) {
      console.error('MFA SMS error:', error);
      
      // Reset reCAPTCHA on error
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
      }
      
      let errorMessage = t('auth.login.phoneError', 'Fehler beim Senden der SMS');
      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = t('auth.login.invalidPhoneNumber', 'Ungültige Telefonnummer');
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = t('auth.login.tooManyRequests', 'Zu viele Anfragen. Bitte später erneut versuchen.');
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSendingMFASMS(false);
    }
  };

  // Firebase MFA - Verify code and complete sign-in
  const handleMFAVerification = async () => {
    if (!mfaVerificationId || !mfaVerificationCode || mfaVerificationCode.length !== 6) {
      toast.error(t('auth.login.invalidVerificationCode', 'Ungültiger Verifizierungscode'));
      return;
    }

    if (!mfaResolver) {
      toast.error(t('auth.login.mfaNotReady', 'MFA ist nicht bereit'));
      return;
    }

    setIsVerifyingMFA(true);
    try {
      // Create phone credential
      const cred = PhoneAuthProvider.credential(mfaVerificationId, mfaVerificationCode);
      
      // Create multi-factor assertion
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
      
      // Complete sign-in
      const userCredential = await mfaResolver.resolveSignIn(multiFactorAssertion);
      
      toast.success(t('auth.login.success'));
      setShowMFADialog(false);
      setMfaResolver(null);
      setMfaHints([]);
      setMfaVerificationId(null);
      setMfaVerificationCode('');
      // Redirect will happen automatically via useEffect when user state updates
    } catch (error: any) {
      console.error('MFA verification error:', error);
      let errorMessage = t('auth.login.invalidVerificationCode', 'Ungültiger Verifizierungscode');
      
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = t('auth.login.invalidVerificationCode', 'Ungültiger Verifizierungscode');
      } else if (error.code === 'auth/code-expired') {
        errorMessage = t('auth.login.codeExpired', 'Code abgelaufen. Bitte neue SMS anfordern.');
      }
      
      toast.error(errorMessage);
    } finally {
      setIsVerifyingMFA(false);
    }
  };

  // Phone/SMS Login - Verify code
  const handlePhoneVerification = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error(t('auth.login.invalidVerificationCode', 'Ungültiger Verifizierungscode'));
      return;
    }

    if (!confirmationResult) {
      toast.error(t('auth.login.noConfirmationResult', 'Bitte senden Sie zuerst eine SMS'));
      return;
    }

    setIsVerifyingSMS(true);
    try {
      // Verify the code
      const result = await confirmationResult.confirm(verificationCode);
      
      if (result.user) {
        // Check if account was just created (less than 10 seconds ago)
        const creationTime = new Date(result.user.metadata.creationTime).getTime();
        const now = Date.now();
        const accountAge = (now - creationTime) / 1000; // in seconds
        
        // If account is less than 10 seconds old, it was likely just created
        if (accountAge < 10) {
          // Delete the newly created account
          await deleteUser(result.user);
          await signOut(auth);
          
          // Close dialog and clear state
          setShowPhoneDialog(false);
          setPhoneNumber('');
          setVerificationCode('');
          setConfirmationResult(null);
          
          // Show error message
          toast.error(t('auth.login.phoneNumberNotRegistered', 'Diese Telefonnummer ist nicht bei einem Konto hinterlegt. Bitte verwenden Sie E-Mail/Passwort oder registrieren Sie sich zuerst.'));
          setIsVerifyingSMS(false);
          return;
        }
        
        toast.success(t('auth.login.success'));
        // Close dialog and clear state first
        setShowPhoneDialog(false);
        setPhoneNumber('');
        setVerificationCode('');
        setConfirmationResult(null);
        // Small delay to ensure state is updated before redirect
        setTimeout(() => {
          setLocation('/dashboard');
        }, 100);
      }
    } catch (error: any) {
      console.error('Phone verification error:', error);
      let errorMessage = t('auth.login.invalidVerificationCode', 'Ungültiger Verifizierungscode');
      
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = t('auth.login.invalidVerificationCode', 'Ungültiger Verifizierungscode');
      } else if (error.code === 'auth/code-expired') {
        errorMessage = t('auth.login.codeExpired', 'Code abgelaufen. Bitte neue SMS anfordern.');
      }
      
      toast.error(errorMessage);
    } finally {
      setIsVerifyingSMS(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      toast.error(t('auth.forgotPassword.emailRequired'));
      return;
    }

    setIsSendingReset(true);
    try {
      // Set Firebase Auth language based on current app language
      // This ensures email is sent in the user's preferred language
      auth.languageCode = i18n.language || 'de';
      
      await sendPasswordResetEmail(auth, resetEmail);
      toast.success(t('auth.forgotPassword.emailSent'));
      setShowForgotPasswordDialog(false);
      setResetEmail('');
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      let errorMessage = t('auth.forgotPassword.error');
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = t('auth.forgotPassword.userNotFound');
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = t('auth.forgotPassword.invalidEmail');
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl">{t('auth.login.title')}</CardTitle>
              <CardDescription>
                {t('auth.login.description')}
              </CardDescription>
            </div>
            <div className="ml-4">
              <LanguageSwitcher />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.login.email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.login.emailPlaceholder')}
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t('auth.login.password')}</Label>
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto text-xs"
                  onClick={() => {
                    setResetEmail(email);
                    setShowForgotPasswordDialog(true);
                  }}
                >
                  {t('auth.forgotPassword.link')}
                </Button>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.login.passwordPlaceholder')}
                required
              />
            </div>

            {/* Normal Login Button */}
            <Button 
              type="button" 
              onClick={handleNormalLogin} 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? t('auth.login.submitting') : t('auth.login.submit')}
            </Button>

            {/* Passkey Login Button */}
            <Button 
              type="button" 
              onClick={() => {
                setPasskeyEmail(email);
                setShowPasskeyDialog(true);
              }}
              variant="outline" 
              className="w-full border-green-500/50 hover:bg-green-500/5" 
              disabled={isLoading}
            >
              <Fingerprint className="w-4 h-4 mr-2" />
              {t('auth.login.loginWithPasskey', 'Mit Passkey anmelden')}
            </Button>

            {/* Phone/SMS Login Button */}
            <Button 
              type="button" 
              id="phone-sign-in-button"
              onClick={() => {
                setPhoneNumber('');
                setVerificationCode('');
                setConfirmationResult(null);
                setShowPhoneDialog(true);
              }}
              variant="outline" 
              className="w-full border-blue-500/50 hover:bg-blue-500/5" 
              disabled={isLoading}
            >
              <Phone className="w-4 h-4 mr-2" />
              {t('auth.login.loginWithPhone', 'Mit Telefon anmelden')}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">{t('auth.login.or')}</span>
              </div>
            </div>

            {/* Google Login Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={async () => {
                try {
                  setIsLoading(true);
                  await signInWithGoogle();
                  toast.success(t('auth.login.googleSuccess'));
                  
                  // Clear any stale session data that might block redirect
                  sessionStorage.removeItem('pending2FA');
                  
                  // Explicit redirect after successful login
                  setTimeout(() => {
                    setLocation('/dashboard');
                  }, 100);
                } catch (error: any) {
                  console.error('Google login error:', error);
                  const errorMessage = error.message || t('aiChat.unknownError', 'Ein unbekannter Fehler ist aufgetreten');
                  toast.error(t('auth.login.googleError', { message: errorMessage }));
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              {t('auth.login.googleButton')}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              {t('auth.login.noAccount')}{' '}
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto"
                onClick={() => setLocation('/register')}
              >
                {t('auth.login.registerLink')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPasswordDialog} onOpenChange={setShowForgotPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('auth.forgotPassword.title')}</DialogTitle>
            <DialogDescription>
              {t('auth.forgotPassword.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="resetEmail">{t('auth.login.email')}</Label>
              <Input
                id="resetEmail"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder={t('auth.login.emailPlaceholder')}
                disabled={isSendingReset}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowForgotPasswordDialog(false);
                setResetEmail('');
              }}
              disabled={isSendingReset}
            >
              {t('common.cancel')}
            </Button>
            <Button onClick={handleForgotPassword} disabled={isSendingReset || !resetEmail}>
              {isSendingReset ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('auth.forgotPassword.sending')}
                </>
              ) : (
                t('auth.forgotPassword.send')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Passkey Login Dialog - Multi-Step */}
      <Dialog open={showPasskeyDialog} onOpenChange={(open) => {
        if (!open && !isAuthenticatingPasskey && !isRegisteringPasskey) {
          setShowPasskeyDialog(false);
          resetPasskeyDialog();
          // Sign out if we're in registration step (user was logged in temporarily)
          if (passkeyStep === 'register') {
            signOut(auth);
          }
        }
      }}>
        <DialogContent className="max-w-md">
          {/* Step 1: Enter Email */}
          {passkeyStep === 'email' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Fingerprint className="w-5 h-5 text-green-500" />
                  </div>
                  {t('auth.login.loginWithPasskey', 'Mit Passkey anmelden')}
                </DialogTitle>
                <DialogDescription>
                  {t('auth.login.passkeyDescription', 'Melden Sie sich mit Ihrem Fingerabdruck, Face ID oder Security Key an')}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="passkeyEmail">{t('auth.login.email')}</Label>
                  <Input
                    id="passkeyEmail"
                    type="email"
                    value={passkeyEmail}
                    onChange={(e) => setPasskeyEmail(e.target.value)}
                    placeholder={t('auth.login.emailPlaceholder')}
                    disabled={isAuthenticatingPasskey}
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handlePasskeyCheckEmail()}
                  />
                </div>
                
                <div className="p-4 bg-muted/50 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-full">
                      <Fingerprint className="w-6 h-6 text-green-500" />
                    </div>
                    <div className="text-sm">
                      <p className="font-medium">{t('auth.login.passkeyInfo', 'Biometrische Anmeldung')}</p>
                      <p className="text-muted-foreground">
                        {t('auth.login.passkeyInfoDesc', 'Nutzen Sie Fingerabdruck, Face ID oder Ihren Security Key')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPasskeyDialog(false);
                    resetPasskeyDialog();
                  }}
                  disabled={isAuthenticatingPasskey}
                >
                  {t('common.cancel', 'Abbrechen')}
                </Button>
                <Button
                  onClick={handlePasskeyCheckEmail}
                  disabled={isAuthenticatingPasskey || !passkeyEmail}
                  className="min-w-[120px] bg-green-500 hover:bg-green-600"
                >
                  {isAuthenticatingPasskey ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('auth.login.authenticating', 'Authentifizieren...')}
                    </>
                  ) : (
                    <>
                      <Fingerprint className="w-4 h-4 mr-2" />
                      {t('auth.login.authenticate', 'Authentifizieren')}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
          
          {/* Step 2: No Passkey - Login to Register */}
          {passkeyStep === 'noPasskey' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <Fingerprint className="w-5 h-5 text-amber-500" />
                  </div>
                  {t('auth.login.noPasskeyTitle', 'Passkey einrichten')}
                </DialogTitle>
                <DialogDescription>
                  {t('auth.login.noPasskeyDescription', 'Für dieses Konto ist noch kein Passkey registriert. Melden Sie sich einmalig mit Ihrem Passwort an, um einen Passkey zu erstellen.')}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                    <Fingerprint className="w-4 h-4" />
                    {t('auth.login.registeringFor', 'Passkey einrichten für:')} <strong>{passkeyEmail}</strong>
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="passkeyPassword">{t('auth.login.password')}</Label>
                  <Input
                    id="passkeyPassword"
                    type="password"
                    value={passkeyPassword}
                    onChange={(e) => setPasskeyPassword(e.target.value)}
                    placeholder={t('auth.login.passwordPlaceholder')}
                    disabled={isAuthenticatingPasskey}
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handlePasskeySignInAndRegister()}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setPasskeyStep('email')}
                  disabled={isAuthenticatingPasskey}
                >
                  {t('common.back', 'Zurück')}
                </Button>
                <Button
                  onClick={handlePasskeySignInAndRegister}
                  disabled={isAuthenticatingPasskey || !passkeyPassword}
                  className="min-w-[140px]"
                >
                  {isAuthenticatingPasskey ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('auth.login.signingIn', 'Anmelden...')}
                    </>
                  ) : (
                    t('auth.login.signInAndSetup', 'Anmelden & Einrichten')
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
          
          {/* Step 3: Register Passkey */}
          {passkeyStep === 'register' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Fingerprint className="w-5 h-5 text-green-500" />
                  </div>
                  {t('auth.login.registerPasskeyTitle', 'Passkey registrieren')}
                </DialogTitle>
                <DialogDescription>
                  {t('auth.login.registerPasskeyDescription', 'Jetzt können Sie Ihren Passkey registrieren. Geben Sie dem Passkey einen Namen und authentifizieren Sie sich.')}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="newPasskeyName">{t('auth.login.passkeyName', 'Passkey-Name')}</Label>
                  <Input
                    id="newPasskeyName"
                    value={newPasskeyName}
                    onChange={(e) => setNewPasskeyName(e.target.value)}
                    placeholder={t('auth.login.passkeyNamePlaceholder', 'z.B. MacBook Pro, iPhone')}
                    disabled={isRegisteringPasskey}
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('auth.login.passkeyNameHint', 'Der Name hilft Ihnen, diesen Passkey später wiederzuerkennen')}
                  </p>
                </div>
                
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-500/20 rounded-full mt-0.5">
                      <Fingerprint className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="text-sm space-y-1">
                      <p className="font-medium text-green-600 dark:text-green-400">
                        {t('auth.login.readyToRegister', 'Bereit zur Registrierung')}
                      </p>
                      <p className="text-muted-foreground">
                        {t('auth.login.registerInfo', 'Klicken Sie auf "Passkey erstellen" und folgen Sie den Anweisungen Ihres Browsers.')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPasskeyDialog(false);
                    resetPasskeyDialog();
                    signOut(auth);
                  }}
                  disabled={isRegisteringPasskey}
                >
                  {t('common.cancel', 'Abbrechen')}
                </Button>
                <Button
                  onClick={handleRegisterPasskey}
                  disabled={isRegisteringPasskey}
                  className="min-w-[140px] bg-green-500 hover:bg-green-600"
                >
                  {isRegisteringPasskey ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('auth.login.registering', 'Registrieren...')}
                    </>
                  ) : (
                    <>
                      <Fingerprint className="w-4 h-4 mr-2" />
                      {t('auth.login.createPasskey', 'Passkey erstellen')}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
          
          {/* Step 4: Success */}
          {passkeyStep === 'success' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Fingerprint className="w-5 h-5 text-green-500" />
                  </div>
                  {t('auth.login.passkeySuccessTitle', 'Passkey erstellt!')}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
                      <Fingerprint className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  
                  <div className="text-center space-y-2">
                    <p className="font-semibold text-lg">
                      {t('auth.login.passkeySetupComplete', 'Passkey erfolgreich eingerichtet!')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t('auth.login.passkeySuccessDescription', 'Sie können sich ab jetzt mit Ihrem Fingerabdruck, Face ID oder Security Key anmelden. Sie sind bereits eingeloggt.')}
                    </p>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  onClick={() => {
                    setShowPasskeyDialog(false);
                    resetPasskeyDialog();
                    // User is already logged in, redirect to dashboard
                    setLocation('/dashboard');
                  }}
                  className="w-full bg-green-500 hover:bg-green-600"
                >
                  <Fingerprint className="w-4 h-4 mr-2" />
                  {t('auth.login.continueToApp', 'Weiter zur App')}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Passwordless 2FA Login Dialog */}
      <Dialog open={show2FAOnlyDialog} onOpenChange={(open) => {
        if (!open) {
          setShow2FAOnlyDialog(false);
          setTwoFactorOnlyCode('');
          setIs2FAOnlyStep2(false);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <KeyRound className="w-5 h-5 text-primary" />
              </div>
              {t('auth.login.loginWith2FAOnly', 'Nur mit 2FA anmelden')}
            </DialogTitle>
            <DialogDescription>
              {is2FAOnlyStep2 
                ? t('auth.login.twoFactorDescription', 'Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein')
                : t('auth.login.enter2FAEmail', 'Geben Sie Ihre E-Mail-Adresse ein, um sich mit 2FA anzumelden (kein Passwort erforderlich)')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {!is2FAOnlyStep2 ? (
              // Step 1: Enter email
              <div className="space-y-2">
                <Label htmlFor="twoFactorOnlyEmail">{t('auth.login.email')}</Label>
                <Input
                  id="twoFactorOnlyEmail"
                  type="email"
                  value={twoFactorOnlyEmail}
                  onChange={(e) => setTwoFactorOnlyEmail(e.target.value)}
                  placeholder={t('auth.login.emailPlaceholder')}
                  disabled={isVerifying2FAOnly}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  {t('auth.login.2faOnlyInfo', '2FA muss für Ihr Konto aktiviert sein, um diese Anmeldemethode zu verwenden.')}
                </p>
              </div>
            ) : (
              // Step 2: Enter 2FA code
              <div className="space-y-2">
                <div className="p-3 bg-muted/50 rounded-lg border border-border mb-4">
                  <p className="text-sm text-center">
                    <span className="text-muted-foreground">{t('auth.login.loggingInAs', 'Anmelden als')}: </span>
                    <span className="font-medium">{twoFactorOnlyEmail}</span>
                  </p>
                </div>
                <Label className="text-sm font-medium">{t('auth.login.enter2FACode', 'Verifizierungscode')}</Label>
                <div className="relative">
                  <Input
                    value={twoFactorOnlyCode.length > 3 ? twoFactorOnlyCode.slice(0, 3) + ' ' + twoFactorOnlyCode.slice(3) : twoFactorOnlyCode}
                    onChange={(e) => setTwoFactorOnlyCode(e.target.value.replace(/\D/g, '').replace(/\s/g, '').slice(0, 6))}
                    placeholder="000 000"
                    maxLength={7}
                    inputMode="numeric"
                    className="text-center text-2xl font-medium tracking-widest h-14"
                    disabled={isVerifying2FAOnly}
                    autoFocus
                  />
                  {twoFactorOnlyCode.length === 6 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (is2FAOnlyStep2) {
                  setIs2FAOnlyStep2(false);
                  setTwoFactorOnlyCode('');
                } else {
                  setShow2FAOnlyDialog(false);
                  setTwoFactorOnlyEmail('');
                }
              }}
              disabled={isVerifying2FAOnly}
            >
              {is2FAOnlyStep2 ? t('common.back', 'Zurück') : t('common.cancel')}
            </Button>
            <Button
              onClick={is2FAOnlyStep2 ? handle2FAOnlyStep2 : handle2FAOnlyStep1}
              disabled={isVerifying2FAOnly || (is2FAOnlyStep2 ? twoFactorOnlyCode.length !== 6 : !twoFactorOnlyEmail)}
              className="min-w-[120px]"
            >
              {isVerifying2FAOnly ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('auth.login.verifying', 'Wird verifiziert...')}
                </>
              ) : is2FAOnlyStep2 ? (
                <>
                  <KeyRound className="w-4 h-4 mr-2" />
                  {t('auth.login.verify', 'Anmelden')}
                </>
              ) : (
                t('common.continue', 'Weiter')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2FA Verification Dialog */}
      {show2FADialog && twoFactorSecret && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-background border rounded-lg shadow-xl max-w-md w-full mx-4 p-6 animate-in fade-in zoom-in-95">
            <div className="mb-2">
              <h2 className="text-lg font-semibold">
                {t('auth.login.twoFactorTitle', 'Zwei-Faktor-Authentifizierung')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t('auth.login.twoFactorDescription', 'Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein')}
              </p>
            </div>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <p className="text-sm text-muted-foreground text-center mb-4">
                {t('auth.login.twoFactorInfo', 'Ihr Konto ist durch Zwei-Faktor-Authentifizierung geschützt. Bitte geben Sie den Code aus Ihrer Authenticator-App ein.')}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('auth.login.enter2FACode', 'Verifizierungscode')}</Label>
              <div className="relative">
                <Input
                  value={twoFactorCode.length > 3 ? twoFactorCode.slice(0, 3) + ' ' + twoFactorCode.slice(3) : twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').replace(/\s/g, '').slice(0, 6))}
                  placeholder="000 000"
                  maxLength={7}
                  inputMode="numeric"
                  className="text-center text-2xl font-medium tracking-widest h-14"
                  disabled={isVerifying2FA}
                  autoFocus
                />
                {twoFactorCode.length === 6 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {t('auth.login.enter2FACodeHint', 'Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein')}
              </p>
            </div>
          </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  sessionStorage.removeItem('pending2FA');
                  setShow2FADialog(false);
                  setTwoFactorCode('');
                  setTwoFactorSecret(null);
                  setPendingUser(null);
                }}
                disabled={isVerifying2FA}
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handle2FAVerification}
                disabled={isVerifying2FA || twoFactorCode.length !== 6}
                className="min-w-[120px]"
              >
                {isVerifying2FA ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('auth.login.verifying', 'Wird verifiziert...')}
                  </>
                ) : (
                  <>
                    <Smartphone className="w-4 h-4 mr-2" />
                    {t('auth.login.verify', 'Verifizieren')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Phone/SMS Login Dialog */}
      <Dialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('auth.login.phoneLoginTitle', 'Mit Telefon anmelden')}
            </DialogTitle>
            <DialogDescription>
              {confirmationResult 
                ? t('auth.login.enterVerificationCode', 'Geben Sie den 6-stelligen Code ein, den Sie per SMS erhalten haben')
                : t('auth.login.enterPhoneNumber', 'Geben Sie Ihre Telefonnummer ein (mit Ländercode, z.B. +491234567890)')
              }
            </DialogDescription>
          </DialogHeader>
          
          {!confirmationResult ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">{t('auth.login.phoneNumber', 'Telefonnummer')}</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+41 79 123 45 67"
                  value={phoneNumber}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    const formatted = formatPhoneNumber(inputValue);
                    setPhoneNumber(formatted);
                  }}
                  onBlur={(e) => {
                    // Ensure formatting is applied when field loses focus
                    const inputValue = e.target.value;
                    const formatted = formatPhoneNumber(inputValue);
                    if (formatted !== inputValue) {
                      setPhoneNumber(formatted);
                    }
                  }}
                  onKeyDown={(e) => {
                    // Allow backspace, delete, arrow keys, etc.
                    if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                      return;
                    }
                  }}
                  disabled={isSendingSMS}
                  autoComplete="tel"
                />
                <p className="text-xs text-muted-foreground">
                  {t('auth.login.phoneFormatHint', 'Format: +[Ländercode][Nummer], z.B. +41 79 442 26 82')}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verification-code">{t('auth.login.verificationCode', 'Verifizierungscode')}</Label>
                <Input
                  id="verification-code"
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setVerificationCode(value);
                  }}
                  maxLength={6}
                  inputMode="numeric"
                  disabled={isVerifyingSMS}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (confirmationResult) {
                  setConfirmationResult(null);
                  setVerificationCode('');
                } else {
                  setShowPhoneDialog(false);
                  setPhoneNumber('');
                }
              }}
              disabled={isSendingSMS || isVerifyingSMS}
            >
              {confirmationResult ? t('common.back', 'Zurück') : t('common.cancel')}
            </Button>
            <Button
              onClick={confirmationResult ? handlePhoneVerification : handlePhoneLogin}
              disabled={
                isSendingSMS || 
                isVerifyingSMS || 
                (confirmationResult ? verificationCode.length !== 6 : !phoneNumber)
              }
              className="min-w-[120px]"
            >
              {isSendingSMS || isVerifyingSMS ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isSendingSMS 
                    ? t('auth.login.sending', 'Wird gesendet...')
                    : t('auth.login.verifying', 'Wird verifiziert...')
                  }
                </>
              ) : confirmationResult ? (
                <>
                  <Phone className="w-4 h-4 mr-2" />
                  {t('auth.login.verify', 'Anmelden')}
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4 mr-2" />
                  {t('auth.login.sendSMS', 'SMS senden')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Firebase MFA Dialog */}
      <Dialog open={showMFADialog} onOpenChange={setShowMFADialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('auth.login.mfaTitle', 'Multi-Faktor-Authentifizierung')}
            </DialogTitle>
            <DialogDescription>
              {mfaVerificationId
                ? t('auth.login.enterVerificationCode', 'Geben Sie den 6-stelligen Code ein, den Sie per SMS erhalten haben')
                : t('auth.login.mfaDescription', 'Ihr Konto ist mit Multi-Faktor-Authentifizierung geschützt. Bitte bestätigen Sie Ihre Telefonnummer.')
              }
            </DialogDescription>
          </DialogHeader>
          
          {!mfaVerificationId ? (
            <div className="space-y-4">
              {mfaHints.length > 1 && (
                <div className="space-y-2">
                  <Label>{t('auth.login.selectMfaFactor', 'Wählen Sie einen zweiten Faktor')}</Label>
                  <div className="space-y-2">
                    {mfaHints.map((hint: any, index: number) => (
                      <Button
                        key={index}
                        variant={selectedMfaIndex === index ? 'default' : 'outline'}
                        onClick={() => setSelectedMfaIndex(index)}
                        className="w-full justify-start"
                      >
                        {hint.factorId === PhoneMultiFactorGenerator.FACTOR_ID && (
                          <Phone className="w-4 h-4 mr-2" />
                        )}
                        {hint.displayName || hint.phoneNumber || t('auth.login.phoneFactor', 'Telefon')}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              {mfaHints[selectedMfaIndex]?.phoneNumber && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {t('auth.login.phoneNumberLabel', 'Telefonnummer')}: {mfaHints[selectedMfaIndex].phoneNumber}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mfa-verification-code">{t('auth.login.verificationCode', 'Verifizierungscode')}</Label>
                <Input
                  id="mfa-verification-code"
                  type="text"
                  placeholder="000000"
                  value={mfaVerificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setMfaVerificationCode(value);
                  }}
                  maxLength={6}
                  inputMode="numeric"
                  disabled={isVerifyingMFA}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (mfaVerificationId) {
                  setMfaVerificationId(null);
                  setMfaVerificationCode('');
                } else {
                  setShowMFADialog(false);
                  setMfaResolver(null);
                  setMfaHints([]);
                }
              }}
              disabled={isSendingMFASMS || isVerifyingMFA}
            >
              {mfaVerificationId ? t('common.back', 'Zurück') : t('common.cancel')}
            </Button>
            <Button
              onClick={mfaVerificationId ? handleMFAVerification : handleMFASendSMS}
              disabled={
                isSendingMFASMS || 
                isVerifyingMFA || 
                (mfaVerificationId ? mfaVerificationCode.length !== 6 : false)
              }
              className="min-w-[120px]"
            >
              {isSendingMFASMS || isVerifyingMFA ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isSendingMFASMS 
                    ? t('auth.login.sending', 'Wird gesendet...')
                    : t('auth.login.verifying', 'Wird verifiziert...')
                  }
                </>
              ) : mfaVerificationId ? (
                <>
                  <Phone className="w-4 h-4 mr-2" />
                  {t('auth.login.verify', 'Anmelden')}
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4 mr-2" />
                  {t('auth.login.sendSMS', 'SMS senden')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
