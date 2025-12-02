// Constants for mobile app
export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;

// Generate login URL at runtime - not used in mobile (Firebase Auth is used instead)
export const getLoginUrl = (): string | null => {
  return null;
};
