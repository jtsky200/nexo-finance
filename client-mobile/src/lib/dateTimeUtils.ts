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
  options?: {
    includeTime?: boolean;
    includeSeconds?: boolean;
  }
): string {
  if (!date) return 'N/A';

  try {
    // Handle Firestore Timestamp
    let dateObj: Date;
    if (date?.toDate && typeof date.toDate === 'function') {
      dateObj = date.toDate();
    } else if (typeof date === 'string') {
      dateObj = new Date(date);
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      return 'N/A';
    }

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'N/A';
    }

    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();

    if (options?.includeTime) {
      const hours = dateObj.getHours().toString().padStart(2, '0');
      const minutes = dateObj.getMinutes().toString().padStart(2, '0');
      
      if (options?.includeSeconds) {
        const seconds = dateObj.getSeconds().toString().padStart(2, '0');
        return `${day}.${month}.${year}, ${hours}:${minutes}:${seconds}`;
      }
      
      return `${day}.${month}.${year}, ${hours}:${minutes}`;
    }

    return `${day}.${month}.${year}`;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error formatting date:', error);
    }
    return 'N/A';
  }
}

/**
 * Converts a Date object to datetime-local input format (YYYY-MM-DDTHH:mm)
 * Always uses local time components
 * 
 * @param date - Date object, Firestore Timestamp, ISO string, or null/undefined
 * @returns String in format "YYYY-MM-DDTHH:mm" for datetime-local input
 * 
 * @example
 * dateToDateTimeLocal(new Date(2025, 11, 13, 9, 54)) // "2025-12-13T09:54"
 */
export function dateToDateTimeLocal(date: Date | any | null | undefined): string {
  if (!date) {
    const now = new Date();
    return dateToDateTimeLocal(now);
  }

  try {
    // Handle Firestore Timestamp
    let dateObj: Date;
    if (date?.toDate && typeof date.toDate === 'function') {
      dateObj = date.toDate();
    } else if (typeof date === 'string') {
      dateObj = new Date(date);
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      const now = new Date();
      return dateToDateTimeLocal(now);
    }

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      const now = new Date();
      return dateToDateTimeLocal(now);
    }

    // Use local time components (getMonth() returns 0-11, so add 1)
    const year = dateObj.getFullYear();
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getDate().toString().padStart(2, '0');
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error converting date to datetime-local:', error);
    }
    const now = new Date();
    return dateToDateTimeLocal(now);
  }
}

/**
 * Converts a Date object to ISO string for storage/API
 * JavaScript automatically handles UTC conversion
 * 
 * @param date - Date object
 * @returns ISO string (e.g., "2025-12-13T08:54:00.000Z")
 */
export function dateToISOString(date: Date): string {
  return date.toISOString();
}

/**
 * Formats a date for short display (DD.MM.YYYY)
 */
export function formatDateShort(date: Date | any | null | undefined): string {
  return formatDateForDisplay(date, { includeTime: false });
}

/**
 * Formats time only (HH:mm or HH:mm:ss)
 */
export function formatTime(
  date: Date | any | null | undefined,
  includeSeconds: boolean = false
): string {
  if (!date) return 'N/A';

  try {
    let dateObj: Date;
    if (date?.toDate && typeof date.toDate === 'function') {
      dateObj = date.toDate();
    } else if (typeof date === 'string') {
      dateObj = new Date(date);
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      return 'N/A';
    }

    if (isNaN(dateObj.getTime())) {
      return 'N/A';
    }

    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    
    if (includeSeconds) {
      const seconds = dateObj.getSeconds().toString().padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    }
    
    return `${hours}:${minutes}`;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error formatting time:', error);
    }
    return 'N/A';
  }
}

/**
 * Checks if a date is today
 */
export function isToday(date: Date | any | null | undefined): boolean {
  if (!date) return false;

  try {
    let dateObj: Date;
    if (date?.toDate && typeof date.toDate === 'function') {
      dateObj = date.toDate();
    } else if (typeof date === 'string') {
      dateObj = new Date(date);
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      return false;
    }

    if (isNaN(dateObj.getTime())) {
      return false;
    }

    const today = new Date();
    return (
      dateObj.getDate() === today.getDate() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getFullYear() === today.getFullYear()
    );
  } catch (error) {
    return false;
  }
}

/**
 * Checks if a date is in the past
 */
export function isPast(date: Date | any | null | undefined): boolean {
  if (!date) return false;

  try {
    let dateObj: Date;
    if (date?.toDate && typeof date.toDate === 'function') {
      dateObj = date.toDate();
    } else if (typeof date === 'string') {
      dateObj = new Date(date);
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      return false;
    }

    if (isNaN(dateObj.getTime())) {
      return false;
    }

    return dateObj < new Date();
  } catch (error) {
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

/**
 * Formats a date as DD.MM.YYYY for display in German format
 * 
 * @param date - Date object, YYYY-MM-DD string, or null/undefined
 * @returns Formatted date string (e.g., "16.12.2025") or empty string if invalid
 * 
 * @example
 * formatDateGerman("2025-12-16") // "16.12.2025"
 * formatDateGerman(new Date(2025, 11, 16)) // "16.12.2025"
 */
export function formatDateGerman(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      // If it's already in YYYY-MM-DD format, parse it
      if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = date.split('-').map(Number);
        dateObj = new Date(year, month - 1, day);
      } else {
        dateObj = new Date(date);
      }
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      return '';
    }
    
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${day}.${month}.${year}`;
  } catch (error) {
    return '';
  }
}

/**
 * Parses a German date string (DD.MM.YYYY) to YYYY-MM-DD format
 * 
 * @param dateStr - Date string in DD.MM.YYYY format
 * @returns Date string in YYYY-MM-DD format or empty string if invalid
 * 
 * @example
 * parseDateGerman("16.12.2025") // "2025-12-16"
 */
export function parseDateGerman(dateStr: string): string {
  if (!dateStr) return '';
  
  try {
    // Remove any whitespace
    dateStr = dateStr.trim();
    
    // Try to parse DD.MM.YYYY format
    const parts = dateStr.split('.');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      
      if (isNaN(day) || isNaN(month) || isNaN(year)) {
        return '';
      }
      
      // Validate date
      const dateObj = new Date(year, month - 1, day);
      if (dateObj.getDate() !== day || dateObj.getMonth() !== month - 1 || dateObj.getFullYear() !== year) {
        return '';
      }
      
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    
    // If already in YYYY-MM-DD format, return as is
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateStr;
    }
    
    return '';
  } catch (error) {
    return '';
  }
}

/**
 * Formats a date and time as DD.MM.YYYY HH:mm for display in German format
 * 
 * @param date - Date object, YYYY-MM-DDTHH:mm string, or null/undefined
 * @returns Formatted date string (e.g., "16.12.2025 14:30") or empty string if invalid
 * 
 * @example
 * formatDateTimeGerman("2025-12-16T14:30") // "16.12.2025 14:30"
 */
export function formatDateTimeGerman(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      // If it's in YYYY-MM-DDTHH:mm format, parse it
      if (date.includes('T')) {
        const [datePart, timePart] = date.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hours, minutes] = timePart ? timePart.split(':').map(Number) : [0, 0];
        dateObj = new Date(year, month - 1, day, hours, minutes);
      } else if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = date.split('-').map(Number);
        dateObj = new Date(year, month - 1, day);
      } else {
        dateObj = new Date(date);
      }
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      return '';
    }
    
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  } catch (error) {
    return '';
  }
}

/**
 * Parses a German date-time string (DD.MM.YYYY HH:mm) to YYYY-MM-DDTHH:mm format
 * 
 * @param dateTimeStr - Date-time string in DD.MM.YYYY HH:mm format
 * @returns Date-time string in YYYY-MM-DDTHH:mm format or empty string if invalid
 * 
 * @example
 * parseDateTimeGerman("16.12.2025 14:30") // "2025-12-16T14:30"
 */
export function parseDateTimeGerman(dateTimeStr: string): string {
  if (!dateTimeStr) return '';
  
  try {
    // Remove any whitespace
    dateTimeStr = dateTimeStr.trim();
    
    // Try to parse DD.MM.YYYY HH:mm format
    const parts = dateTimeStr.split(' ');
    if (parts.length === 2) {
      const datePart = parts[0]; // DD.MM.YYYY
      const timePart = parts[1]; // HH:mm
      
      const dateParts = datePart.split('.');
      if (dateParts.length === 3) {
        const day = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10);
        const year = parseInt(dateParts[2], 10);
        
        const timeParts = timePart.split(':');
        const hours = timeParts.length >= 1 ? parseInt(timeParts[0], 10) : 0;
        const minutes = timeParts.length >= 2 ? parseInt(timeParts[1], 10) : 0;
        
        if (isNaN(day) || isNaN(month) || isNaN(year) || isNaN(hours) || isNaN(minutes)) {
          return '';
        }
        
        // Validate date
        const dateObj = new Date(year, month - 1, day, hours, minutes);
        if (dateObj.getDate() !== day || dateObj.getMonth() !== month - 1 || dateObj.getFullYear() !== year) {
          return '';
        }
        
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      }
    }
    
    // If already in YYYY-MM-DDTHH:mm format, return as is
    if (dateTimeStr.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)) {
      return dateTimeStr;
    }
    
    return '';
  } catch (error) {
    return '';
  }
}

