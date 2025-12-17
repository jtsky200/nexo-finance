/**
 * Error Logger Utility
 * 
 * Centralized error logging that can be extended to use services like:
 * - Firebase Crashlytics
 * - Sentry
 * - LogRocket
 * - etc.
 */

interface ErrorContext {
  componentStack?: string;
  userId?: string;
  userAgent?: string;
  url?: string;
  timestamp?: string;
  [key: string]: unknown;
}

/**
 * Logs an error with context information
 * 
 * @param error - The error object
 * @param context - Additional context about the error
 */
export function logError(error: Error, context?: ErrorContext): void {
  const errorContext: ErrorContext = {
    ...context,
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
  };

  // Always log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error logged:', error, errorContext);
  }

  // In production, log to console with structured format
  if (process.env.NODE_ENV === 'production') {
    console.error('Error:', {
      message: error.message,
      stack: error.stack,
      ...errorContext,
    });
  }

  // TODO: Integrate with Firebase Crashlytics
  // Example implementation:
  // if (typeof window !== 'undefined' && (window as any).firebase?.crashlytics) {
  //   const crashlytics = (window as any).firebase.crashlytics();
  //   crashlytics.recordError(error);
  //   Object.entries(errorContext).forEach(([key, value]) => {
  //     crashlytics.setCustomKey(key, String(value));
  //   });
  // }

  // TODO: Integrate with Sentry
  // Example implementation:
  // if (typeof window !== 'undefined' && (window as any).Sentry) {
  //   (window as any).Sentry.captureException(error, {
  //     contexts: {
  //       react: {
  //         componentStack: context?.componentStack,
  //       },
  //     },
  //     extra: errorContext,
  //   });
  // }
}

/**
 * Logs a non-error message (info, warning, etc.)
 */
export function logMessage(
  level: 'info' | 'warn' | 'error',
  message: string,
  context?: Record<string, unknown>
): void {
  const logContext = {
    ...context,
    timestamp: new Date().toISOString(),
  };

  switch (level) {
    case 'info':
      console.info(message, logContext);
      break;
    case 'warn':
      console.warn(message, logContext);
      break;
    case 'error':
      console.error(message, logContext);
      break;
  }
}

