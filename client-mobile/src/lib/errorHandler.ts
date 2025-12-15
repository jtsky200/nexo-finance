/**
 * Error Handler Utility
 * Provides user-friendly error messages for common errors
 */

export interface ErrorInfo {
  message: string;
  title?: string;
  action?: string;
  retryable?: boolean;
  requestId?: string; // Request ID for error tracking
}

/**
 * Maps technical errors to user-friendly messages
 */
export function getUserFriendlyError(error: unknown): ErrorInfo {
  const err = error as any;
  
  // Extract Request ID from error data if available (from tRPC errors)
  const requestId = err?.data?.requestId || err?.requestId || null;
  
  // Network errors
  if (err?.code === 'unavailable' || err?.message?.includes('network') || err?.message?.includes('fetch')) {
    return {
      title: 'Verbindungsfehler',
      message: 'Keine Internetverbindung. Bitte überprüfen Sie Ihre Netzwerkverbindung und versuchen Sie es erneut.',
      action: 'Erneut versuchen',
      retryable: true,
    };
  }

  // Timeout errors
  if (err?.code === 'deadline-exceeded' || err?.message?.includes('timeout')) {
    return {
      title: 'Zeitüberschreitung',
      message: 'Die Anfrage hat zu lange gedauert. Bitte versuchen Sie es erneut.',
      action: 'Erneut versuchen',
      retryable: true,
    };
  }

  // Permission errors
  if (err?.code === 'permission-denied' || err?.message?.includes('permission')) {
    return {
      title: 'Berechtigung verweigert',
      message: 'Sie haben keine Berechtigung für diese Aktion. Bitte kontaktieren Sie den Administrator.',
      retryable: false,
    };
  }

  // Authentication errors
  if (err?.code === 'unauthenticated' || err?.message?.includes('auth') || err?.message?.includes('login')) {
    return {
      title: 'Anmeldung erforderlich',
      message: 'Bitte melden Sie sich an, um fortzufahren.',
      action: 'Anmelden',
      retryable: false,
    };
  }

  // Not found errors
  if (err?.code === 'not-found' || err?.message?.includes('not found')) {
    return {
      title: 'Nicht gefunden',
      message: 'Die angeforderte Ressource wurde nicht gefunden.',
      retryable: false,
    };
  }

  // Validation errors
  if (err?.code === 'invalid-argument' || err?.message?.includes('validation') || err?.message?.includes('invalid')) {
    return {
      title: 'Ungültige Eingabe',
      message: err?.message || 'Bitte überprüfen Sie Ihre Eingabe und versuchen Sie es erneut.',
      retryable: false,
    };
  }

  // Firebase quota errors
  if (err?.code === 'resource-exhausted' || err?.message?.includes('quota')) {
    return {
      title: 'Kontingent überschritten',
      message: 'Das Tageslimit wurde erreicht. Bitte versuchen Sie es später erneut.',
      retryable: false,
    };
  }

  // Firebase billing errors
  if (err?.message?.includes('billing') || err?.message?.includes('Billing')) {
    return {
      title: 'Abrechnungsfehler',
      message: 'Google Cloud Billing ist erforderlich. Bitte kontaktieren Sie den Administrator.',
      retryable: false,
    };
  }

  // Generic Firebase errors
  if (err?.code?.startsWith('functions/')) {
    const code = err.code.replace('functions/', '');
    return {
      title: 'Server-Fehler',
      message: `Ein Fehler ist aufgetreten: ${code}. Bitte versuchen Sie es später erneut.`,
      action: 'Erneut versuchen',
      retryable: true,
    };
  }

  // Default: use error message if available, otherwise generic message
  let message = err?.message || err?.toString() || 'Ein unbekannter Fehler ist aufgetreten.';
  
  // Append Request ID to message if available for debugging
  if (requestId) {
    message += `\n\nRequest ID: ${requestId.substring(0, 8)}...`;
  }
  
  return {
    title: 'Fehler',
    message: message.length > 200 ? `${message.substring(0, 200)}...` : message,
    action: 'Erneut versuchen',
    retryable: true,
    requestId: requestId || undefined,
  };
}

/**
 * Checks if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  const errorInfo = getUserFriendlyError(error);
  return errorInfo.retryable ?? false;
}

/**
 * Formats error for display in toast/alert
 */
export function formatErrorForDisplay(error: unknown): string {
  const errorInfo = getUserFriendlyError(error);
  return errorInfo.message;
}

/**
 * Extracts Request ID from error for debugging
 */
export function extractRequestId(error: unknown): string | null {
  const err = error as any;
  return err?.data?.requestId || err?.requestId || null;
}

/**
 * Formats Request ID for display (truncated)
 */
export function formatRequestId(requestId: string | null): string {
  if (!requestId) return '';
  // Show first 8 characters for display
  return requestId.length > 8 ? `${requestId.substring(0, 8)}...` : requestId;
}
