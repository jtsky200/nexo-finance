/**
 * Input Validation Utilities
 * 
 * Provides reusable validation functions for form inputs
 */

/**
 * Validates an email address
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || email.trim() === '') {
    return { valid: false, error: 'E-Mail-Adresse ist erforderlich' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Ungültige E-Mail-Adresse' };
  }

  return { valid: true };
}

/**
 * Validates a phone number (Swiss format: +41 XX XXX XX XX)
 */
export function validatePhone(phone: string): { valid: boolean; error?: string } {
  if (!phone || phone.trim() === '') {
    return { valid: true }; // Phone is optional
  }

  // Remove spaces and dashes
  const cleaned = phone.replace(/[\s-]/g, '');

  // Swiss phone number formats:
  // +41XXXXXXXXX, 0041XXXXXXXXX, 0XXXXXXXXX
  const phoneRegex = /^(\+41|0041|0)[1-9]\d{8}$/;
  if (!phoneRegex.test(cleaned)) {
    return { valid: false, error: 'Ungültige Telefonnummer. Format: +41 XX XXX XX XX' };
  }

  return { valid: true };
}

/**
 * Validates a password
 */
export function validatePassword(password: string, minLength: number = 6): { valid: boolean; error?: string } {
  if (!password || password.length === 0) {
    return { valid: false, error: 'Passwort ist erforderlich' };
  }

  if (password.length < minLength) {
    return { valid: false, error: `Passwort muss mindestens ${minLength} Zeichen lang sein` };
  }

  return { valid: true };
}

/**
 * Validates a date
 */
export function validateDate(date: Date | string | null | undefined): { valid: boolean; error?: string } {
  if (!date) {
    return { valid: false, error: 'Datum ist erforderlich' };
  }

  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) {
    return { valid: false, error: 'Ungültiges Datum' };
  }

  return { valid: true };
}

/**
 * Validates a number
 */
export function validateNumber(
  value: string | number,
  options?: {
    min?: number;
    max?: number;
    required?: boolean;
    allowDecimals?: boolean;
  }
): { valid: boolean; error?: string } {
  const { min, max, required = true, allowDecimals = true } = options || {};

  if (value === '' || value === null || value === undefined) {
    if (required) {
      return { valid: false, error: 'Wert ist erforderlich' };
    }
    return { valid: true };
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return { valid: false, error: 'Ungültige Zahl' };
  }

  if (!allowDecimals && !Number.isInteger(num)) {
    return { valid: false, error: 'Nur ganze Zahlen erlaubt' };
  }

  if (min !== undefined && num < min) {
    return { valid: false, error: `Wert muss mindestens ${min} sein` };
  }

  if (max !== undefined && num > max) {
    return { valid: false, error: `Wert darf höchstens ${max} sein` };
  }

  return { valid: true };
}

/**
 * Validates a required field
 */
export function validateRequired(value: string | number | null | undefined, fieldName: string = 'Feld'): { valid: boolean; error?: string } {
  if (value === null || value === undefined || value === '' || (typeof value === 'string' && value.trim() === '')) {
    return { valid: false, error: `${fieldName} ist erforderlich` };
  }

  return { valid: true };
}

/**
 * Validates a string length
 */
export function validateLength(
  value: string,
  options?: {
    min?: number;
    max?: number;
    required?: boolean;
  }
): { valid: boolean; error?: string } {
  const { min, max, required = true } = options || {};

  if (required && (!value || value.trim() === '')) {
    return { valid: false, error: 'Feld ist erforderlich' };
  }

  if (!value || value.trim() === '') {
    return { valid: true };
  }

  if (min !== undefined && value.length < min) {
    return { valid: false, error: `Mindestens ${min} Zeichen erforderlich` };
  }

  if (max !== undefined && value.length > max) {
    return { valid: false, error: `Höchstens ${max} Zeichen erlaubt` };
  }

  return { valid: true };
}

/**
 * Validates a currency amount (CHF)
 */
export function validateCurrency(amount: string | number): { valid: boolean; error?: string } {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(num)) {
    return { valid: false, error: 'Ungültiger Betrag' };
  }

  if (num < 0) {
    return { valid: false, error: 'Betrag darf nicht negativ sein' };
  }

  if (num > 1000000000) {
    return { valid: false, error: 'Betrag ist zu gross' };
  }

  return { valid: true };
}

