/**
 * Background Sync Manager
 * Verwaltet Background-Sync für kritische Funktionen
 */

import { eventBus, Events } from './eventBus';

class BackgroundSyncManager {
  private registration: ServiceWorkerRegistration | null = null;
  private isSupported = false;

  constructor() {
    this.checkSupport();
    this.setupServiceWorker();
  }

  /**
   * Check if Background Sync is supported
   */
  private checkSupport(): void {
    try {
      this.isSupported = 
        'serviceWorker' in navigator &&
        'sync' in (self as any).ServiceWorkerRegistration?.prototype &&
        typeof (self as any).ServiceWorkerRegistration?.prototype?.sync?.register === 'function';
    } catch (error) {
      this.isSupported = false;
    }
  }

  /**
   * Setup Service Worker
   */
  private async setupServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('[BackgroundSync] Service Workers not supported');
      return;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('[BackgroundSync] Service Worker registered');

      // Listen for updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration!.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[BackgroundSync] New service worker available');
              // Optionally notify user to refresh
            }
          });
        }
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event.data);
      });

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      console.log('[BackgroundSync] Service Worker ready');

    } catch (error) {
      console.error('[BackgroundSync] Service Worker registration failed:', error);
    }
  }

  /**
   * Handle messages from service worker
   */
  private handleServiceWorkerMessage(data: any): void {
    console.log('[BackgroundSync] Message from service worker:', data);

    switch (data.type) {
      case 'SYNC_REMINDERS':
        eventBus.emit(Events.DATA_SYNC_START, { type: 'reminders', source: 'background-sync' });
        break;
      case 'SYNC_CHAT_REMINDERS':
        eventBus.emit(Events.DATA_SYNC_START, { type: 'chatReminders', source: 'background-sync' });
        break;
      case 'SYNC_ALL_DATA':
        eventBus.emit(Events.DATA_SYNC_START, { type: 'all', source: 'background-sync' });
        break;
      default:
        console.log('[BackgroundSync] Unknown message type:', data.type);
    }
  }

  /**
   * Register background sync for reminders
   */
  async syncReminders(): Promise<void> {
    if (!this.isSupported || !this.registration) {
      // Silently return - not supported
      return;
    }

    try {
      await (this.registration as any).sync.register('sync-reminders');
      console.log('[BackgroundSync] Reminder sync registered');
      eventBus.emit('background-sync:registered', { type: 'reminders' });
    } catch (error: any) {
      // Background Sync might be disabled by browser/user settings
      if (error?.message?.includes('Background Sync is disabled') || 
          error?.name === 'UnknownError') {
        // Silently ignore - Background Sync is disabled by browser/user
        return;
      }
      // Only log actual errors
      console.warn('[BackgroundSync] Failed to register reminder sync:', error?.message || error);
    }
  }

  /**
   * Register background sync for chat reminders
   */
  async syncChatReminders(): Promise<void> {
    if (!this.isSupported || !this.registration) {
      // Silently return - not supported
      return;
    }

    try {
      await (this.registration as any).sync.register('sync-chat-reminders');
      console.log('[BackgroundSync] Chat reminder sync registered');
      eventBus.emit('background-sync:registered', { type: 'chatReminders' });
    } catch (error: any) {
      // Background Sync might be disabled by browser/user settings
      if (error?.message?.includes('Background Sync is disabled') || 
          error?.name === 'UnknownError') {
        // Silently ignore - Background Sync is disabled by browser/user
        return;
      }
      // Only log actual errors
      console.warn('[BackgroundSync] Failed to register chat reminder sync:', error?.message || error);
    }
  }

  /**
   * Register background sync for all data
   */
  async syncAllData(): Promise<void> {
    if (!this.isSupported || !this.registration) {
      // Silently return - not supported
      return;
    }

    try {
      await (this.registration as any).sync.register('sync-data');
      console.log('[BackgroundSync] All data sync registered');
      eventBus.emit('background-sync:registered', { type: 'all' });
    } catch (error: any) {
      // Background Sync might be disabled by browser/user settings
      // This is not a critical error, just log as debug
      if (error?.message?.includes('Background Sync is disabled') || 
          error?.name === 'UnknownError') {
        // Silently ignore - Background Sync is disabled by browser/user
        return;
      }
      // Only log actual errors
      console.warn('[BackgroundSync] Failed to register all data sync:', error?.message || error);
    }
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('[BackgroundSync] Notifications not supported');
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
   * Show notification
   */
  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (!this.registration) {
      console.warn('[BackgroundSync] Service Worker not registered');
      return;
    }

    const permission = await this.requestNotificationPermission();
    if (permission !== 'granted') {
      console.warn('[BackgroundSync] Notification permission not granted');
      return;
    }

    await this.registration.showNotification(title, {
      icon: '/icon-192x192.png',
      badge: '/icon-96x96.png',
      ...options,
    });
  }

  /**
   * Get sync status
   */
  getStatus(): {
    supported: boolean;
    registered: boolean;
    notificationPermission: NotificationPermission;
  } {
    return {
      supported: this.isSupported,
      registered: !!this.registration,
      notificationPermission: 'Notification' in window ? Notification.permission : 'denied',
    };
  }
}

// Singleton instance
export const backgroundSyncManager = new BackgroundSyncManager();

// Auto-setup when module loads
if (typeof window !== 'undefined') {
  // Wait for page to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('[BackgroundSync] Initialized');
    });
  } else {
    console.log('[BackgroundSync] Initialized');
  }
}

