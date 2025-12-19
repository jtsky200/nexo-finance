import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function Login() {
  const [, setLocation] = useLocation();
  const { signIn, signInWithGoogle, error: authError, user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect to dashboard when user is authenticated
  useEffect(() => {
    if (!loading && user) {
      setLocation('/dashboard');
    }
  }, [user, loading, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      await signIn(email, password);
      toast.success('Erfolgreich angemeldet');
      // Redirect will happen automatically via useEffect when user state updates
    } catch (error: any) {
      toast.error('Anmeldung fehlgeschlagen: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Festive Christmas Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-950 dark:from-slate-950 dark:via-slate-900 dark:to-black">
        {/* Enhanced Snowflakes Pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute text-white/25 dark:text-white/15 animate-snowflake"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${8 + Math.random() * 12}s`,
                fontSize: `${8 + Math.random() * 16}px`,
              }}
            >
              ❄
            </div>
          ))}
        </div>

        {/* Twinkling Stars */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={`star-${i}`}
              className="absolute text-amber-300/40 dark:text-amber-200/30 animate-twinkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
                fontSize: `${12 + Math.random() * 8}px`,
              }}
            >
              ⭐
            </div>
          ))}
        </div>
        
        {/* Dynamic Pulsing Christmas Orbs - Green and Gold */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-20 left-20 w-48 h-48 bg-gradient-to-br from-emerald-600/30 to-emerald-800/15 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute top-40 right-32 w-40 h-40 bg-gradient-to-br from-amber-500/25 to-amber-600/12 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute bottom-32 left-32 w-52 h-52 bg-gradient-to-br from-emerald-500/25 to-emerald-700/12 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-20 right-20 w-36 h-36 bg-gradient-to-br from-amber-400/20 to-amber-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-56 h-56 bg-gradient-to-br from-emerald-400/20 to-emerald-600/8 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2 animate-pulse-slow" style={{ animationDelay: '0.75s' }}></div>
          <div className="absolute top-1/4 right-1/4 w-44 h-44 bg-gradient-to-br from-amber-300/15 to-amber-400/8 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.25s' }}></div>
        </div>

        {/* Elegant Light Rays with Movement */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/30 pointer-events-none animate-gradient-shift"></div>
        
        {/* Dynamic Accent Lines - Green and Gold with Animation */}
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-emerald-500/20 to-transparent pointer-events-none animate-fade-pulse"></div>
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-amber-500/18 to-transparent pointer-events-none animate-fade-pulse" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-transparent via-emerald-400/15 to-transparent pointer-events-none animate-fade-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-0 left-3/4 w-px h-full bg-gradient-to-b from-transparent via-amber-400/12 to-transparent pointer-events-none animate-fade-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>
      
      <Card className="w-full max-w-md relative z-10 shadow-2xl border border-emerald-500/20 dark:border-emerald-400/25 bg-background/98 backdrop-blur-xl ring-1 ring-emerald-500/12 dark:ring-emerald-400/18 animate-card-glow">
        <CardHeader className="text-center pb-6">
          <div className="mb-4 flex justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 dark:from-emerald-500 dark:to-emerald-600 flex items-center justify-center shadow-lg ring-2 ring-amber-400/30 animate-icon-pulse">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-foreground">
            Anmelden
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Melden Sie sich bei Ihrem Nexo-Konto an
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ihre@email.com"
                required
                className="h-11 border-emerald-500/15 focus:border-emerald-500/40 focus:ring-emerald-500/15 dark:border-emerald-400/20 dark:focus:border-emerald-400/40"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Passwort</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-11 border-emerald-500/15 focus:border-emerald-500/40 focus:ring-emerald-500/15 dark:border-emerald-400/20 dark:focus:border-emerald-400/40"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-black hover:bg-gray-900 dark:bg-white dark:hover:bg-gray-100 dark:text-black text-white shadow-lg hover:shadow-xl transition-all duration-200" 
              disabled={isLoading}
            >
              {isLoading ? 'Wird angemeldet...' : 'Anmelden'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Oder</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={async () => {
                try {
                  setIsLoading(true);
                  await signInWithGoogle();
                  toast.success('Erfolgreich mit Google angemeldet');
                  // Redirect will happen automatically via useEffect when user state updates
                } catch (error: any) {
                  const errorMsg = authError || error.message || 'Ein unbekannter Fehler ist aufgetreten';
                  toast.error('Google-Anmeldung fehlgeschlagen: ' + errorMsg);
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
              Mit Google anmelden
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Noch kein Konto?{' '}
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto"
                onClick={() => setLocation('/register')}
              >
                Jetzt registrieren
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
