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
      {/* Premium Elegant Christmas Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e1a] via-[#1a1f35] to-[#0f1419] dark:from-[#050709] dark:via-[#0a0e1a] dark:to-black">
        {/* Refined Snowflakes - Subtle and Elegant */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 25 }).map((_, i) => (
            <div
              key={i}
              className="absolute text-white/15 dark:text-white/8 animate-snowflake"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${10 + Math.random() * 15}s`,
                fontSize: `${6 + Math.random() * 10}px`,
              }}
            >
              ✦
            </div>
          ))}
        </div>
        
        {/* Premium Ambient Light Orbs - Very Subtle */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-emerald-600/8 to-emerald-800/3 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-amber-500/6 to-amber-600/2 rounded-full blur-[100px]"></div>
          <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-gradient-to-br from-emerald-500/5 to-emerald-700/2 rounded-full blur-[150px] transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        {/* Premium Depth Layer */}
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/40 pointer-events-none"></div>
      </div>
      
      {/* Premium Glass Card with Sophisticated Design */}
      <Card className="w-full max-w-md relative z-10 border border-white/10 dark:border-white/5 bg-white/5 dark:bg-white/[0.02] backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] ring-1 ring-white/10 dark:ring-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-amber-500/5 rounded-lg pointer-events-none"></div>
        <CardHeader className="text-center pb-8 relative z-10">
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-amber-500/20 rounded-full blur-xl"></div>
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-700 dark:from-emerald-500 dark:to-emerald-600 flex items-center justify-center shadow-[0_8px_16px_rgba(16,185,129,0.3)] ring-1 ring-white/20">
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-foreground tracking-tight">
            Anmelden
          </CardTitle>
          <CardDescription className="text-base mt-3 text-muted-foreground/80">
            Melden Sie sich bei Ihrem Nexo-Konto an
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2.5">
              <Label htmlFor="email" className="text-sm font-medium text-foreground/90">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ihre@email.com"
                required
                className="h-12 border-border/50 bg-background/50 backdrop-blur-sm focus:border-emerald-500/50 focus:ring-emerald-500/20 focus:bg-background/80 transition-all duration-200"
              />
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="password" className="text-sm font-medium text-foreground/90">Passwort</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-12 border-border/50 bg-background/50 backdrop-blur-sm focus:border-emerald-500/50 focus:ring-emerald-500/20 focus:bg-background/80 transition-all duration-200"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-black hover:bg-gray-900 dark:bg-white dark:hover:bg-gray-100 dark:text-black text-white font-medium shadow-[0_4px_14px_0_rgba(0,0,0,0.39)] hover:shadow-[0_6px_20px_0_rgba(0,0,0,0.49)] transition-all duration-300" 
              disabled={isLoading}
            >
              {isLoading ? 'Wird angemeldet...' : 'Anmelden'}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <Separator className="bg-border/30" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider">
                <span className="bg-background/80 backdrop-blur-sm px-3 text-muted-foreground/70">Oder</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-border/50 bg-background/30 backdrop-blur-sm hover:bg-background/50 hover:border-border transition-all duration-200"
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

            <div className="text-center text-sm text-muted-foreground/80 pt-2">
              Noch kein Konto?{' '}
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto font-medium text-foreground/90 hover:text-foreground underline-offset-4"
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
