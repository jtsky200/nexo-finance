import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import i18next from 'i18next';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  error: string | null;
  signOut: () => Promise<void>;
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
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
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
    } catch (err: any) {
      let errorMessage = i18next.t('common.genericError');
      
      switch (err.code) {
        case 'auth/internal-error':
          errorMessage = i18next.t('auth.errors.internalError', 'Ein interner Fehler ist aufgetreten. Bitte versuchen Sie es erneut oder verwenden Sie die E-Mail-Anmeldung.');
          break;
        case 'auth/popup-blocked':
          errorMessage = i18next.t('auth.errors.popupBlocked');
          break;
        case 'auth/popup-closed-by-user':
          errorMessage = i18next.t('auth.errors.loginCancelled');
          break;
        case 'auth/unauthorized-domain':
          errorMessage = i18next.t('auth.errors.unauthorizedDomain');
          break;
        case 'auth/cancelled-popup-request':
          errorMessage = i18next.t('auth.errors.onlyOnePopup');
          break;
        case 'auth/operation-not-allowed':
          errorMessage = i18next.t('auth.errors.googleNotEnabled');
          break;
        case 'auth/network-request-failed':
          errorMessage = i18next.t('auth.errors.networkError');
          break;
        default:
          errorMessage = err.message || i18next.t('common.unknownError');
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithGoogle, signOut, error }}>
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

// Safe version that doesn't throw - returns null user if outside provider
export function useAuthSafe() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Return a safe default when used outside AuthProvider
    return { user: null, loading: true, error: null, signIn: async () => {}, signUp: async () => {}, signInWithGoogle: async () => {}, signOut: async () => {} };
  }
  return context;
}