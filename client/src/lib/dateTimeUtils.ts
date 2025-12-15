/**
 * Centralized Date/Time Utilities for Production-Ready Application
 * 
 * This module ensures consistent date/time handling across the entire application.
 * All date/time operations should use these utilities to prevent timezone issues.
 * 
 * Key Principles:
 * 1. User input (datetime-local) is always in LOCAL time
 * 2. Storage in Firestore uses UTC Timestamps (automatic conversion)
 * 3. Display always shows LOCAL time (automatic conversion)
 * 4. Never manually adjust for timezone - let JavaScript handle it
 */

/**
 * Parses a datetime-local string (YYYY-MM-DDTHH:mm) into a Date object
 * The Date object will be in local time, and JavaScript will handle UTC conversion when needed
 * 
 * @param dateTimeString - Format: "YYYY-MM-DDTHH:mm" (from datetime-local input)
 * @returns Date object representing the local time
 * 
 * @example
 * parseLocalDateTime("2025-12-13T09:54") // Returns Date for 09:54 local time
 */
export function parseLocalDateTime(dateTimeString: string): Date {
  if (!dateTimeString || !dateTimeString.includes('T')) {
    throw new Error('Invalid datetime-local format. Expected: YYYY-MM-DDTHH:mm');
  }

  const [datePart, timePart] = dateTimeString.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart ? timePart.split(':').map(Number) : [0, 0];

  // Create Date using local time components
  // JavaScript will automatically handle UTC conversion when serialized
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

/**
 * Formats a Date object for display in the UI
 * Always displays in local time, regardless of how the date was stored
 * 
 * @param date - Date object, Firestore Timestamp, ISO string, or null/undefined
 * @param options - Formatting options
 * @returns Formatted date string (e.g., "13.12.2025, 09:54")
 * 
 * @example
 * formatDateForDisplay(new Date(2025, 11, 13, 9, 54)) // "13.12.2025, 09:54"
 */
export function formatDateForDisplay(
  date: Date | any | null | undefined,
  options: {
    includeTime?: boolean;
    includeDate?: boolean;
    dateFormat?: 'de-CH' | 'en-US';
  } = {}
): string {
  if (!date) return 'N/A';

  const {
    includeTime = true,
    includeDate = true,
    dateFormat = 'de-CH',
  } = options;

  try {
    let d: Date;

    // Handle Firestore Timestamp
    if (date?.toDate && typeof date.toDate === 'function') {
      d = date.toDate();
    }
    // Handle ISO string (from backend)
    else if (typeof date === 'string') {
      // IMPORTANT: ISO strings from backend are in UTC
      // When user enters "11:00" local time, it's stored as "10:00 UTC" (if UTC+1)
      // When we get "2025-12-13T10:00:00.000Z" back, new Date() converts it to "11:00" local time
      // This is correct! Just use new Date() - it handles the conversion automatically
      d = new Date(date);
      
      // Validate the date
      if (isNaN(d.getTime())) {
        console.error('[formatDateForDisplay] Invalid date string:', date);
        return 'N/A';
      }
    }
    // Handle Date object
    else if (date instanceof Date) {
      d = date;
    }
    // Fallback
    else {
      d = new Date(date);
    }

    if (isNaN(d.getTime())) {
      return 'N/A';
    }

    const parts: string[] = [];

    if (includeDate) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      parts.push(`${day}.${month}.${year}`);
    }

    if (includeTime) {
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      parts.push(`${hours}:${minutes}`);
    }

    return parts.join(', ');
  } catch (error) {
    console.error('[formatDateForDisplay] Error:', error);
    return 'N/A';
  }
}

/**
 * Converts a Date object to a format suitable for datetime-local input
 * Extracts local time components to avoid timezone conversion issues
 * 
 * @param date - Date object, Firestore Timestamp, ISO string, or null/undefined
 * @returns String in format "YYYY-MM-DDTHH:mm" for datetime-local input
 * 
 * @example
 * dateToDateTimeLocal(new Date(2025, 11, 13, 9, 54)) // "2025-12-13T09:54"
 */
export function dateToDateTimeLocal(date: Date | any | null | undefined): string {
  if (!date) return '';

  try {
    let d: Date;

    // Handle Firestore Timestamp
    if (date?.toDate && typeof date.toDate === 'function') {
      d = date.toDate();
    }
    // Handle ISO string
    else if (typeof date === 'string') {
      d = new Date(date);
    }
    // Handle Date object
    else if (date instanceof Date) {
      d = date;
    }
    // Fallback
    else {
      d = new Date(date);
    }

    if (isNaN(d.getTime())) {
      return '';
    }

    // Extract LOCAL time components (not UTC)
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (error) {
    console.error('[dateToDateTimeLocal] Error:', error);
    return '';
  }
}

/**
 * Converts a Date object to ISO string for backend communication
 * The Date object should already be in local time (from parseLocalDateTime)
 * JavaScript will automatically convert to UTC when calling toISOString()
 * 
 * @param date - Date object in local time
 * @returns ISO string (UTC)
 * 
 * @example
 * const localDate = parseLocalDateTime("2025-12-13T09:54");
 * dateToISOString(localDate) // "2025-12-13T08:54:00.000Z" (if UTC+1)
 */
export function dateToISOString(date: Date | null | undefined): string {
  if (!date || !(date instanceof Date)) {
    throw new Error('Invalid date: must be a Date object');
  }

  if (isNaN(date.getTime())) {
    throw new Error('Invalid date: date is NaN');
  }

  return date.toISOString();
}

/**
 * Formats a date for display in a short format (date only)
 * 
 * @param date - Date object, Firestore Timestamp, ISO string, or null/undefined
 * @returns Formatted date string (e.g., "13.12.2025")
 */
export function formatDateShort(date: Date | any | null | undefined): string {
  return formatDateForDisplay(date, { includeTime: false, includeDate: true });
}

/**
 * Formats a time for display (time only)
 * 
 * @param date - Date object, Firestore Timestamp, ISO string, or null/undefined
 * @returns Formatted time string (e.g., "09:54")
 */
export function formatTime(date: Date | any | null | undefined): string {
  return formatDateForDisplay(date, { includeTime: true, includeDate: false });
}

/**
 * Gets the current date/time in local timezone
 * 
 * @returns Date object representing current local time
 */
export function getCurrentLocalDateTime(): Date {
  return new Date();
}

/**
 * Checks if a date is today
 * 
 * @param date - Date object, Firestore Timestamp, ISO string, or null/undefined
 * @returns true if the date is today
 */
export function isToday(date: Date | any | null | undefined): boolean {
  if (!date) return false;

  try {
    let d: Date;

    if (date?.toDate && typeof date.toDate === 'function') {
      d = date.toDate();
    } else if (typeof date === 'string') {
      d = new Date(date);
    } else if (date instanceof Date) {
      d = date;
    } else {
      d = new Date(date);
    }

    if (isNaN(d.getTime())) return false;

    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  } catch {
    return false;
  }
}

/**
 * Checks if a date is in the past
 * 
 * @param date - Date object, Firestore Timestamp, ISO string, or null/undefined
 * @returns true if the date is in the past
 */
export function isPast(date: Date | any | null | undefined): boolean {
  if (!date) return false;

  try {
    let d: Date;

    if (date?.toDate && typeof date.toDate === 'function') {
      d = date.toDate();
    } else if (typeof date === 'string') {
      d = new Date(date);
    } else if (date instanceof Date) {
      d = date;
    } else {
      d = new Date(date);
    }

    if (isNaN(d.getTime())) return false;

    return d.getTime() < new Date().getTime();
  } catch {
    return false;
  }
}

/**
 * ============================================================================
 * GLOBAL DATE NORMALIZATION RULES FOR CALENDAR EVENTS
 * ============================================================================
 * 
 * CRITICAL: All date comparisons for calendar events MUST use LOCAL timezone
 * to prevent events from appearing on the wrong day.
 * 
 * NEVER use toISOString().split('T')[0] for date comparisons - it uses UTC!
 * ALWAYS use formatDateLocal() or normalizeEventDate() for comparisons.
 */

/**
 * Normalizes any date value to YYYY-MM-DD format using LOCAL timezone
 * This is the SINGLE SOURCE OF TRUTH for date normalization in calendar components
 * 
 * @param date - Date object, Firestore Timestamp, ISO string, YYYY-MM-DD string, or null/undefined
 * @returns YYYY-MM-DD string in LOCAL timezone, or empty string if invalid
 * 
 * @example
 * normalizeEventDate(new Date(2025, 11, 14, 23, 0)) // "2025-12-14" (not "2025-12-13"!)
 * normalizeEventDate("2025-12-14T23:00:00.000Z") // "2025-12-15" (if UTC+1, shows correct local date)
 * normalizeEventDate("2025-12-14") // "2025-12-14" (already normalized)
 */
export function normalizeEventDate(date: Date | any | string | null | undefined): string {
  if (!date) return '';
  
  try {
    let dateObj: Date;
    
    // Handle Firestore Timestamp
    if (typeof date === 'object' && date !== null && 'toDate' in date && typeof (date as any).toDate === 'function') {
      dateObj = (date as any).toDate();
    }
    // Handle Date objects
    else if (date instanceof Date) {
      dateObj = date;
    }
    // Handle string dates
    else if (typeof date === 'string') {
      // If it's already a date string (YYYY-MM-DD), use it directly
      if (!date.includes('T') && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return date;
      }
      // Otherwise parse it (will convert UTC to local automatically)
      dateObj = new Date(date);
    }
    // Fallback: try to parse
    else {
      dateObj = new Date(date as any);
    }
    
    // Validate
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    // Format as YYYY-MM-DD using LOCAL timezone (NOT UTC!)
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[normalizeEventDate] Error:', error, date);
    }
    return '';
  }
}

/**
 * Formats a Date object to YYYY-MM-DD string using LOCAL timezone
 * Use this for calendar day comparisons instead of toISOString().split('T')[0]
 * 
 * @param date - Date object
 * @returns YYYY-MM-DD string in LOCAL timezone
 * 
 * @example
 * formatDateLocal(new Date(2025, 11, 14)) // "2025-12-14"
 */
export function formatDateLocal(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('Invalid date: must be a valid Date object');
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Compares two dates by their date part only (ignoring time)
 * Uses LOCAL timezone for comparison
 * 
 * @param date1 - First date (any format)
 * @param date2 - Second date (any format)
 * @returns true if both dates are on the same day in local timezone
 * 
 * @example
 * isSameDay("2025-12-14", new Date(2025, 11, 14, 23, 0)) // true
 */
export function isSameDay(date1: Date | any | string | null | undefined, date2: Date | any | string | null | undefined): boolean {
  const date1Str = normalizeEventDate(date1);
  const date2Str = normalizeEventDate(date2);
  return date1Str !== '' && date2Str !== '' && date1Str === date2Str;
}

