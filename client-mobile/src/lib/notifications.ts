/**
 * Notifications Manager for Mobile
 * Handles push notifications, in-app notifications, and permission requests
 */

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  actions?: NotificationAction[];
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return 'denied';
}

/**
 * Check if notifications are supported and enabled
 */
export function isNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Check current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Show a browser notification
 */
export async function showNotification(options: NotificationOptions): Promise<void> {
  if (!isNotificationSupported()) {
    console.warn('Notifications not supported');
    return;
  }

  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    console.warn('Notification permission not granted');
    return;
  }

  // Try to use service worker registration first (for push notifications)
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(options.title, {
        body: options.body,
        icon: options.icon || '/icon-192x192.png',
        badge: options.badge || '/icon-96x96.png',
        tag: options.tag,
        data: options.data,
        requireInteraction: options.requireInteraction,
        silent: options.silent,
        vibrate: options.vibrate,
        actions: options.actions,
      });
      return;
    } catch (error) {
      console.warn('Service Worker notification failed, falling back to regular notification:', error);
    }
  }

  // Fallback to regular notification
  new Notification(options.title, {
    body: options.body,
    icon: options.icon || '/icon-192x192.png',
    tag: options.tag,
    data: options.data,
    silent: options.silent,
    vibrate: options.vibrate,
  });
}

/**
 * Show a reminder notification
 */
export async function showReminderNotification(reminder: {
  title: string;
  dueDate: Date | string;
  type: string;
  amount?: number;
}): Promise<void> {
  const dueDate = reminder.dueDate instanceof Date 
    ? reminder.dueDate 
    : new Date(reminder.dueDate);
  
  const dateStr = dueDate.toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  let body = `Fällig am: ${dateStr}`;
  if (reminder.amount) {
    body += ` • CHF ${(reminder.amount / 100).toFixed(2)}`;
  }

  await showNotification({
    title: reminder.title,
    body: body,
    tag: `reminder-${reminder.type}`,
    data: {
      type: 'reminder',
      url: '/reminders',
    },
    requireInteraction: true,
    vibrate: [200, 100, 200],
  });
}

/**
 * Show a bill payment reminder
 */
export async function showBillNotification(bill: {
  title: string;
  amount: number;
  dueDate: Date | string;
}): Promise<void> {
  const dueDate = bill.dueDate instanceof Date 
    ? bill.dueDate 
    : new Date(bill.dueDate);
  
  const dateStr = dueDate.toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
  });

  await showNotification({
    title: 'Rechnung fällig',
    body: `${bill.title} • CHF ${(bill.amount / 100).toFixed(2)} • Fällig: ${dateStr}`,
    tag: `bill-${bill.title}`,
    data: {
      type: 'bill',
      url: '/bills',
    },
    requireInteraction: true,
    vibrate: [200, 100, 200],
  });
}

/**
 * Show a finance entry notification
 */
export async function showFinanceNotification(entry: {
  type: string;
  category: string;
  amount: number;
}): Promise<void> {
  await showNotification({
    title: entry.type === 'einnahme' ? 'Einnahme hinzugefügt' : 'Ausgabe hinzugefügt',
    body: `${entry.category} • CHF ${(entry.amount / 100).toFixed(2)}`,
    tag: `finance-${entry.type}`,
    data: {
      type: 'finance',
      url: '/finance',
    },
    silent: true, // Don't be too intrusive for manual entries
  });
}

/**
 * Register service worker for push notifications
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('[Notifications] Service Worker registered:', registration.scope);

    // Listen for service worker updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[Notifications] New service worker available');
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('[Notifications] Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Subscribe to push notifications (requires backend setup)
 */
export async function subscribeToPushNotifications(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.VITE_VAPID_PUBLIC_KEY || ''
      ),
    });

    console.log('[Notifications] Push subscription created');
    return subscription;
  } catch (error) {
    console.error('[Notifications] Push subscription failed:', error);
    return null;
  }
}

/**
 * Convert VAPID public key from URL-safe base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
