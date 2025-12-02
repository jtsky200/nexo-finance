import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  // Original names
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  // Aliases for compatibility
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error('Email Sign-In Error:', err);
      let errorMessage = 'Anmeldung fehlgeschlagen';
      
      switch (err.code) {
        case 'auth/invalid-email':
          errorMessage = 'Ungültige E-Mail-Adresse';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Dieses Konto wurde deaktiviert';
          break;
        case 'auth/user-not-found':
          errorMessage = 'Kein Konto mit dieser E-Mail gefunden';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Falsches Passwort';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Ungültige Anmeldedaten';
          break;
        default:
          errorMessage = err.message || 'Ein Fehler ist aufgetreten';
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setError(null);
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error('Sign-Up Error:', err);
      let errorMessage = 'Registrierung fehlgeschlagen';
      
      switch (err.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Diese E-Mail wird bereits verwendet';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Ungültige E-Mail-Adresse';
          break;
        case 'auth/weak-password':
          errorMessage = 'Passwort ist zu schwach';
          break;
        default:
          errorMessage = err.message || 'Ein Fehler ist aufgetreten';
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      const result = await signInWithPopup(auth, provider);
      console.log('Google Sign-In successful:', result.user.email);
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      
      let errorMessage = 'Ein Fehler ist aufgetreten';
      
      switch (err.code) {
        case 'auth/popup-blocked':
          errorMessage = 'Popup wurde blockiert. Bitte erlauben Sie Popups für diese Seite.';
          break;
        case 'auth/popup-closed-by-user':
          errorMessage = 'Anmeldung abgebrochen.';
          break;
        case 'auth/unauthorized-domain':
          errorMessage = 'Diese Domain ist nicht für Google Sign-In autorisiert. Bitte fügen Sie die Domain in der Firebase Console hinzu.';
          break;
        case 'auth/cancelled-popup-request':
          errorMessage = 'Nur ein Popup kann gleichzeitig geöffnet sein.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Google Sign-In ist nicht aktiviert. Bitte aktivieren Sie es in der Firebase Console.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.';
          break;
        default:
          errorMessage = err.message || 'Ein unbekannter Fehler ist aufgetreten';
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (err: any) {
      console.error('Sign-Out Error:', err);
      throw new Error('Abmeldung fehlgeschlagen');
    }
  };

  // Create aliases for compatibility
  const loginWithEmail = signIn;
  const loginWithGoogle = signInWithGoogle;
  const logout = signOut;

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error,
      signIn, 
      signUp, 
      signInWithGoogle, 
      signOut,
      // Aliases
      loginWithEmail,
      loginWithGoogle,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
