import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { confirmPasswordReset, verifyPasswordResetCode, applyActionCode, checkActionCode } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Loader2, Lock, Eye, EyeOff, CheckCircle2, Mail, MailCheck, AlertCircle } from 'lucide-react';

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [email, setEmail] = useState('');
  const [oobCode, setOobCode] = useState<string | null>(null);
  const [mode, setMode] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionCompleted, setActionCompleted] = useState(false);
  const [newEmail, setNewEmail] = useState<string | null>(null);

  useEffect(() => {
    // Extract oobCode and mode from URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('oobCode');
    const urlMode = urlParams.get('mode');

    if (!code || !urlMode) {
      toast.error(t('auth.action.invalidLink', 'Ungültiger Link'));
      setTimeout(() => setLocation('/login'), 2000);
      return;
    }

    // Supported modes: resetPassword, verifyEmail, recoverEmail
    if (!['resetPassword', 'verifyEmail', 'recoverEmail'].includes(urlMode)) {
      toast.error(t('auth.action.unsupportedMode', 'Nicht unterstützter Modus'));
      setTimeout(() => setLocation('/login'), 2000);
      return;
    }

    setOobCode(code);
    setMode(urlMode);

    // Verify the code using checkActionCode (works for all modes)
    checkActionCode(auth, code)
      .then((info) => {
        setEmail(info.data.email || '');
        
        // For recoverEmail, get the new email
        if (urlMode === 'recoverEmail' && info.data.previousEmail) {
          setNewEmail(info.data.email || null);
        }
        
        setIsValid(true);
        setIsVerifying(false);
      })
      .catch((error) => {
        console.error('Error verifying action code:', error);
        setIsVerifying(false);
        setIsValid(false);
        
        let errorMessage = t('auth.action.invalidLink', 'Ungültiger Link');
        if (error.code === 'auth/expired-action-code') {
          errorMessage = t('auth.action.expiredLink', 'Dieser Link ist abgelaufen. Bitte fordern Sie einen neuen an.');
        } else if (error.code === 'auth/invalid-action-code') {
          errorMessage = t('auth.action.invalidLink', 'Ungültiger Link');
        }
        
        toast.error(errorMessage);
        setTimeout(() => setLocation('/login'), 3000);
      });
  }, [setLocation, t]);

  // Handle Email Verification
  const handleVerifyEmail = async () => {
    if (!oobCode) {
      toast.error(t('auth.action.invalidLink', 'Ungültiger Link'));
      return;
    }

    setIsProcessing(true);
    try {
      await applyActionCode(auth, oobCode);
      setActionCompleted(true);
      toast.success(t('auth.action.emailVerified', 'E-Mail erfolgreich bestätigt'));
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        setLocation('/login');
      }, 3000);
    } catch (error: any) {
      console.error('Error verifying email:', error);
      let errorMessage = t('auth.action.error', 'Fehler bei der Verifizierung');
      
      if (error.code === 'auth/expired-action-code') {
        errorMessage = t('auth.action.expiredLink', 'Dieser Link ist abgelaufen. Bitte fordern Sie einen neuen an.');
      } else if (error.code === 'auth/invalid-action-code') {
        errorMessage = t('auth.action.invalidLink', 'Ungültiger Link');
      }
      
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Email Recovery (revert email change)
  const handleRecoverEmail = async () => {
    if (!oobCode) {
      toast.error(t('auth.action.invalidLink', 'Ungültiger Link'));
      return;
    }

    setIsProcessing(true);
    try {
      await applyActionCode(auth, oobCode);
      setActionCompleted(true);
      toast.success(t('auth.action.emailRecovered', 'E-Mail-Änderung rückgängig gemacht'));
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        setLocation('/login');
      }, 3000);
    } catch (error: any) {
      console.error('Error recovering email:', error);
      let errorMessage = t('auth.action.error', 'Fehler bei der Wiederherstellung');
      
      if (error.code === 'auth/expired-action-code') {
        errorMessage = t('auth.action.expiredLink', 'Dieser Link ist abgelaufen. Bitte fordern Sie einen neuen an.');
      } else if (error.code === 'auth/invalid-action-code') {
        errorMessage = t('auth.action.invalidLink', 'Ungültiger Link');
      }
      
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error(t('auth.resetPassword.fillAllFields', 'Bitte füllen Sie alle Felder aus'));
      return;
    }

    if (password.length < 6) {
      toast.error(t('auth.resetPassword.passwordTooShort', 'Passwort muss mindestens 6 Zeichen lang sein'));
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t('auth.resetPassword.passwordsDoNotMatch', 'Passwörter stimmen nicht überein'));
      return;
    }

    if (!oobCode) {
      toast.error(t('auth.resetPassword.invalidLink', 'Ungültiger Link'));
      return;
    }

    setIsResetting(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      toast.success(t('auth.resetPassword.success', 'Passwort erfolgreich zurückgesetzt'));
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        setLocation('/login');
      }, 2000);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      let errorMessage = t('auth.resetPassword.error', 'Fehler beim Zurücksetzen des Passworts');
      
      if (error.code === 'auth/expired-action-code') {
        errorMessage = t('auth.resetPassword.expiredLink', 'Dieser Link ist abgelaufen. Bitte fordern Sie einen neuen an.');
      } else if (error.code === 'auth/invalid-action-code') {
        errorMessage = t('auth.resetPassword.invalidLink', 'Ungültiger Link');
      } else if (error.code === 'auth/weak-password') {
        errorMessage = t('auth.resetPassword.weakPassword', 'Passwort ist zu schwach');
      }
      
      toast.error(errorMessage);
    } finally {
      setIsResetting(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {t('auth.resetPassword.verifying', 'Link wird überprüft...')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">{t('auth.action.errorTitle', 'Fehler')}</CardTitle>
            <CardDescription className="text-center">
              {t('auth.action.invalidLink', 'Ungültiger Link')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setLocation('/login')} 
              className="w-full"
            >
              {t('auth.action.backToLogin', 'Zurück zur Anmeldung')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show success message if action is completed
  if (actionCompleted) {
    const getSuccessContent = () => {
      switch (mode) {
        case 'verifyEmail':
          return {
            icon: MailCheck,
            title: t('auth.action.emailVerifiedTitle', 'E-Mail bestätigt'),
            description: t('auth.action.emailVerifiedDesc', 'Ihre E-Mail-Adresse wurde erfolgreich bestätigt. Sie können sich jetzt anmelden.'),
          };
        case 'recoverEmail':
          return {
            icon: AlertCircle,
            title: t('auth.action.emailRecoveredTitle', 'E-Mail wiederhergestellt'),
            description: t('auth.action.emailRecoveredDesc', 'Die E-Mail-Änderung wurde rückgängig gemacht. Ihre ursprüngliche E-Mail-Adresse ist wieder aktiv.'),
          };
        default:
          return null;
      }
    };

    const successContent = getSuccessContent();
    if (successContent) {
      const Icon = successContent.icon;
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-center mb-2">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <CardTitle className="text-2xl text-center">
                {successContent.title}
              </CardTitle>
              <CardDescription className="text-center">
                {successContent.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setLocation('/login')} 
                className="w-full"
              >
                {t('auth.action.backToLogin', 'Zurück zur Anmeldung')}
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  // Render based on mode
  if (mode === 'verifyEmail') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-center mb-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="w-6 h-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">
              {t('auth.action.verifyEmailTitle', 'E-Mail bestätigen')}
            </CardTitle>
            <CardDescription className="text-center">
              {t('auth.action.verifyEmailDesc', 'für {{email}}', { email })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              {t('auth.action.verifyEmailInfo', 'Klicken Sie auf die Schaltfläche unten, um Ihre E-Mail-Adresse zu bestätigen.')}
            </p>
            <Button
              onClick={handleVerifyEmail}
              className="w-full"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('auth.action.processing', 'Wird verarbeitet...')}
                </>
              ) : (
                <>
                  <MailCheck className="w-4 h-4 mr-2" />
                  {t('auth.action.verifyEmail', 'E-Mail bestätigen')}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setLocation('/login')}
              disabled={isProcessing}
            >
              {t('auth.action.backToLogin', 'Zurück zur Anmeldung')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mode === 'recoverEmail') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-center mb-2">
              <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">
              {t('auth.action.recoverEmailTitle', 'E-Mail wiederherstellen')}
            </CardTitle>
            <CardDescription className="text-center">
              {t('auth.action.recoverEmailDesc', 'Die E-Mail-Änderung für {{email}} rückgängig machen', { email })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {newEmail && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {t('auth.action.newEmailLabel', 'Neue E-Mail')}: <strong>{newEmail}</strong>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('auth.action.originalEmailLabel', 'Ursprüngliche E-Mail')}: <strong>{email}</strong>
                </p>
              </div>
            )}
            <p className="text-sm text-muted-foreground text-center">
              {t('auth.action.recoverEmailInfo', 'Wenn Sie diese E-Mail-Änderung nicht vorgenommen haben, klicken Sie auf die Schaltfläche unten, um die Änderung rückgängig zu machen.')}
            </p>
            <Button
              onClick={handleRecoverEmail}
              className="w-full"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('auth.action.processing', 'Wird verarbeitet...')}
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {t('auth.action.recoverEmail', 'E-Mail wiederherstellen')}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setLocation('/login')}
              disabled={isProcessing}
            >
              {t('auth.action.backToLogin', 'Zurück zur Anmeldung')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Password Reset Mode (default)
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="w-6 h-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">
            {t('auth.resetPassword.title', 'Passwort zurücksetzen')}
          </CardTitle>
          <CardDescription className="text-center">
            {t('auth.resetPassword.description', 'für {{email}}', { email })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">
                {t('auth.resetPassword.newPassword', 'Neues Passwort')}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.resetPassword.passwordPlaceholder', '••••••••')}
                  disabled={isResetting}
                  className="pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isResetting}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('auth.resetPassword.passwordHint', 'Mindestens 6 Zeichen')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {t('auth.resetPassword.confirmPassword', 'Passwort bestätigen')}
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('auth.resetPassword.passwordPlaceholder', '••••••••')}
                  disabled={isResetting}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isResetting}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {password && confirmPassword && password === confirmPassword && (
                <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{t('auth.resetPassword.passwordsMatch', 'Passwörter stimmen überein')}</span>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isResetting || !password || !confirmPassword || password !== confirmPassword}
            >
              {isResetting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('auth.resetPassword.resetting', 'Wird zurückgesetzt...')}
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  {t('auth.resetPassword.save', 'Passwort speichern')}
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setLocation('/login')}
              disabled={isResetting}
            >
              {t('auth.resetPassword.backToLogin', 'Zurück zur Anmeldung')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

