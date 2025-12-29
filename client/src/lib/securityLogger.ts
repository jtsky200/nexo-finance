/**
 * Security Event Logger
 * 
 * Centralized security event logging for monitoring suspicious activity,
 * authentication events, and security violations.
 */

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { getAuth } from 'firebase/auth';

export type SecurityEventType =
  | 'auth_failed'
  | 'auth_success'
  | 'unauthorized_access_attempt'
  | 'suspicious_activity'
  | 'rate_limit_exceeded'
  | 'invalid_token'
  | 'data_access_violation'
  | 'xss_attempt'
  | 'sql_injection_attempt'
  | 'csrf_attempt'
  | 'brute_force_attempt'
  | 'session_hijack_attempt'
  | 'privilege_escalation_attempt';

export interface SecurityEvent {
  type: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  url?: string;
  details?: Record<string, unknown>;
  timestamp?: any; // Firestore serverTimestamp
}

/**
 * Logs a security event to Firestore
 * 
 * @param event - The security event to log
 */
export async function logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): Promise<void> {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    const securityEvent: SecurityEvent = {
      ...event,
      userId: event.userId || user?.uid || 'anonymous',
      userAgent: event.userAgent || (typeof window !== 'undefined' ? window.navigator.userAgent : undefined),
      url: event.url || (typeof window !== 'undefined' ? window.location.href : undefined),
      timestamp: serverTimestamp(),
    };

    // Log to Firestore (only if user is authenticated for non-critical events)
    // Critical events should always be logged
    if (user || event.severity === 'critical' || event.severity === 'high') {
      await addDoc(collection(db, 'securityEvents'), securityEvent);
    }

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Security Event]', securityEvent);
    }

    // In production, log critical/high severity events to console
    if (process.env.NODE_ENV === 'production' && 
        (event.severity === 'critical' || event.severity === 'high')) {
      console.error('[Security Event]', {
        type: event.type,
        severity: event.severity,
        message: event.message,
        userId: securityEvent.userId,
      });
    }
  } catch (error) {
    // Don't throw - security logging should never break the app
    console.error('[Security Logger] Failed to log security event:', error);
  }
}

/**
 * Helper function to log authentication failures
 */
export function logAuthFailure(reason: string, email?: string): void {
  logSecurityEvent({
    type: 'auth_failed',
    severity: 'medium',
    message: `Authentication failed: ${reason}`,
    details: { email, reason },
  });
}

/**
 * Helper function to log unauthorized access attempts
 */
export function logUnauthorizedAccess(resource: string, action: string): void {
  logSecurityEvent({
    type: 'unauthorized_access_attempt',
    severity: 'high',
    message: `Unauthorized access attempt: ${action} on ${resource}`,
    details: { resource, action },
  });
}

/**
 * Helper function to log suspicious activity
 */
export function logSuspiciousActivity(activity: string, details?: Record<string, unknown>): void {
  logSecurityEvent({
    type: 'suspicious_activity',
    severity: 'high',
    message: `Suspicious activity detected: ${activity}`,
    details,
  });
}

/**
 * Helper function to log XSS attempts
 */
export function logXSSAttempt(content: string): void {
  logSecurityEvent({
    type: 'xss_attempt',
    severity: 'critical',
    message: 'Potential XSS attempt detected',
    details: { content: content.substring(0, 100) }, // Only log first 100 chars
  });
}

/**
 * Helper function to log brute force attempts
 */
export function logBruteForceAttempt(identifier: string, attemptCount: number): void {
  logSecurityEvent({
    type: 'brute_force_attempt',
    severity: 'high',
    message: `Brute force attempt detected: ${attemptCount} failed attempts for ${identifier}`,
    details: { identifier, attemptCount },
  });
}

