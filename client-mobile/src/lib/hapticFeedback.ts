/**
 * Haptic Feedback Utility for Mobile
 * Provides vibration feedback for user interactions
 */

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'selection';

const patterns: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 30,
  success: [50, 50, 50],
  error: [100, 50, 100],
  warning: [50, 100, 50],
  selection: 5,
};

/**
 * Trigger haptic feedback
 * @param pattern - The haptic pattern to use
 */
export function triggerHaptic(pattern: HapticPattern = 'medium'): void {
  if (!navigator.vibrate) {
    return; // Not supported on this device
  }

  const vibration = patterns[pattern];
  try {
    navigator.vibrate(vibration);
  } catch (error) {
    // Silently fail if vibration is not supported or blocked
    if (process.env.NODE_ENV === 'development') {
      console.warn('Haptic feedback not available:', error);
    }
  }
}

/**
 * Trigger haptic feedback for success actions
 */
export function hapticSuccess(): void {
  triggerHaptic('success');
}

/**
 * Trigger haptic feedback for error actions
 */
export function hapticError(): void {
  triggerHaptic('error');
}

/**
 * Trigger haptic feedback for warning actions
 */
export function hapticWarning(): void {
  triggerHaptic('warning');
}

/**
 * Trigger haptic feedback for selection/click actions
 */
export function hapticSelection(): void {
  triggerHaptic('selection');
}

/**
 * Trigger haptic feedback for light interactions
 */
export function hapticLight(): void {
  triggerHaptic('light');
}

/**
 * Trigger haptic feedback for medium interactions
 */
export function hapticMedium(): void {
  triggerHaptic('medium');
}

/**
 * Trigger haptic feedback for heavy interactions
 */
export function hapticHeavy(): void {
  triggerHaptic('heavy');
}
