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
      {/* Professional Christmas Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1f2e] via-[#16213e] to-[#0f1419] dark:from-[#0a0d14] dark:via-[#0f1419] dark:to-[#050709]">
        {/* Elegant Snowflakes Pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute text-white/20 dark:text-white/10 animate-snowflake"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${8 + Math.random() * 12}s`,
                fontSize: `${8 + Math.random() * 12}px`,
              }}
            >
              ✦
            </div>
          ))}
        </div>
        
        {/* Subtle Geometric Christmas Elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 border-2 border-emerald-500/30 rounded-full blur-xl"></div>
          <div className="absolute top-40 right-32 w-24 h-24 border-2 border-red-500/30 rounded-full blur-xl"></div>
          <div className="absolute bottom-32 left-32 w-40 h-40 border-2 border-amber-500/20 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 right-20 w-28 h-28 border-2 border-emerald-500/30 rounded-full blur-xl"></div>
        </div>

        {/* Elegant Light Rays */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/20 pointer-events-none"></div>
        
        {/* Subtle Christmas Accent Lines */}
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-emerald-500/10 to-transparent pointer-events-none"></div>
        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-red-500/10 to-transparent pointer-events-none"></div>
      </div>
      
      <Card className="w-full max-w-md relative z-10 shadow-2xl border border-emerald-500/20 dark:border-emerald-400/30 bg-background/98 backdrop-blur-xl ring-1 ring-emerald-500/10 dark:ring-emerald-400/20">
        <CardHeader className="text-center pb-6">
          <div className="mb-4 flex justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-400 dark:to-emerald-500 flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-400 dark:from-emerald-400 dark:to-emerald-300 bg-clip-text text-transparent">
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
                className="h-11 border-emerald-500/20 focus:border-emerald-500/50 focus:ring-emerald-500/20 dark:border-emerald-400/30 dark:focus:border-emerald-400/50"
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
                className="h-11 border-emerald-500/20 focus:border-emerald-500/50 focus:ring-emerald-500/20 dark:border-emerald-400/30 dark:focus:border-emerald-400/50"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-200" 
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
