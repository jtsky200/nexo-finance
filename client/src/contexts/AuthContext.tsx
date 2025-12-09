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
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
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

  const signUp = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
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
