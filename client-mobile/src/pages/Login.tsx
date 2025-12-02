import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function MobileLogin() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { loginWithGoogle, loginWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    console.log('Google login clicked');
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      await loginWithGoogle();
      setLocation('/');
    } catch (error: any) {
      console.error('Google login error:', error);
      toast.error(error.message || 'Login fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Email login clicked');
    
    if (!email || !password) {
      toast.error('Bitte E-Mail und Passwort eingeben');
      return;
    }
    
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      await loginWithEmail(email, password);
      setLocation('/');
    } catch (error: any) {
      console.error('Email login error:', error);
      toast.error(error.message || 'Login fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mb-6">
        <span className="text-3xl font-bold text-primary-foreground">N</span>
      </div>
      
      <h1 className="text-2xl font-bold mb-2">Nexo</h1>
      <p className="text-muted-foreground mb-8 text-center">
        {t('auth.loginSubtitle', 'Melden Sie sich an, um fortzufahren')}
      </p>

      {/* Google Login - Native button */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isLoading}
        className="w-full h-12 px-6 rounded-lg font-medium text-base border border-border bg-background flex items-center justify-center gap-3 active:bg-muted disabled:opacity-50 mb-4"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {isLoading ? 'Laden...' : t('auth.googleLogin', 'Mit Google anmelden')}
      </button>

      <div className="flex items-center gap-4 w-full mb-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">{t('common.or', 'oder')}</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Email Login - Native form */}
      <form onSubmit={handleEmailLogin} className="w-full space-y-3">
        <input
          type="email"
          placeholder={t('auth.email', 'E-Mail')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
        />
        <input
          type="password"
          placeholder={t('auth.password', 'Passwort')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 px-6 rounded-lg font-medium text-base bg-primary text-primary-foreground active:opacity-80 disabled:opacity-50"
        >
          {isLoading ? 'Laden...' : t('auth.login', 'Anmelden')}
        </button>
      </form>

      {/* Switch to Desktop */}
      <p className="text-xs text-muted-foreground mt-8 text-center">
        <a href="https://nexo-jtsky100.web.app" className="text-primary underline">
          {t('auth.desktopVersion', 'Desktop-Version öffnen')}
        </a>
      </p>
    </div>
  );
}
