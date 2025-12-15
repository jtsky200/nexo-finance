import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
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
    // Check for redirect result on mount
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          if (process.env.NODE_ENV === 'development') {
            console.log('Redirect sign-in successful:', result.user.email);
          }
          setUser(result.user);
        }
      })
      .catch((err) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('Redirect result error:', err);
        }
      });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Auth state changed:', user?.email || 'No user');
      }
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      if (process.env.NODE_ENV === 'development') {
        console.log('Attempting email sign-in...');
      }
      const result = await signInWithEmailAndPassword(auth, email, password);
      if (process.env.NODE_ENV === 'development') {
        console.log('Email sign-in successful:', result.user.email);
      }
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Email Sign-In Error:', err);
      }
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
      const result = await createUserWithEmailAndPassword(auth, email, password);
      if (process.env.NODE_ENV === 'development') {
        console.log('Sign-up successful:', result.user.email);
      }
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Sign-Up Error:', err);
      }
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
      if (process.env.NODE_ENV === 'development') {
        console.log('Attempting Google sign-in with redirect...');
      }
      
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      // Use redirect directly for mobile - more reliable
      await signInWithRedirect(auth, provider);
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Google Sign-In Error:', err);
        console.error('Error code:', err.code);
        console.error('Error message:', err.message);
      }
      
      let errorMessage = 'Ein Fehler ist aufgetreten';
      
      switch (err.code) {
        case 'auth/unauthorized-domain':
          errorMessage = 'Diese Domain ist nicht autorisiert. Bitte kontaktieren Sie den Administrator.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Google Sign-In ist nicht aktiviert.';
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
      if (process.env.NODE_ENV === 'development') {
        console.log('Signing out...');
      }
      await firebaseSignOut(auth);
      if (process.env.NODE_ENV === 'development') {
        console.log('Sign-out successful');
      }
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Sign-Out Error:', err);
      }
      throw new Error('Abmeldung fehlgeschlagen');
    }
  };

  // Aliases
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
