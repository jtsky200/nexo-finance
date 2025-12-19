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
      {/* Christmas Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-red-50 via-green-50 to-red-50 dark:from-red-950/20 dark:via-green-950/20 dark:to-red-950/20">
        {/* Snowflakes Animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute text-white/30 dark:text-white/10 animate-snowflake"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 10}s`,
                fontSize: `${10 + Math.random() * 20}px`,
              }}
            >
              ❄
            </div>
          ))}
        </div>
        {/* Christmas Ornaments */}
        <div className="absolute top-10 left-10 text-4xl animate-bounce" style={{ animationDuration: '3s' }}>🎄</div>
        <div className="absolute top-20 right-20 text-3xl animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}>🎁</div>
        <div className="absolute bottom-20 left-20 text-3xl animate-bounce" style={{ animationDuration: '2.8s', animationDelay: '1s' }}>⭐</div>
        <div className="absolute bottom-10 right-10 text-4xl animate-bounce" style={{ animationDuration: '3.2s', animationDelay: '1.5s' }}>🎅</div>
      </div>
      
      <Card className="w-full max-w-md relative z-10 shadow-2xl border-2 border-red-200 dark:border-red-800 bg-background/95 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Anmelden</CardTitle>
          <CardDescription>
            Melden Sie sich bei Ihrem Nexo-Konto an
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ihre@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
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
