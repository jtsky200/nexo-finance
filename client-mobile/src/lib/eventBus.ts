/**
 * Event Bus für Komponenten-Kommunikation
 * Ermöglicht nahtlose Kommunikation zwischen allen Teilen der Anwendung
 */

type EventCallback = (data?: any) => void;
type EventMap = {
  [key: string]: EventCallback[];
};

class EventBus {
  private events: EventMap = {};
  private onceCallbacks: Map<string, EventCallback[]> = new Map();

  /**
   * Registriere einen Event-Listener
   */
  on(event: string, callback: EventCallback): () => void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);

    // Return unsubscribe function
    return () => {
      this.off(event, callback);
    };
  }

  /**
   * Registriere einen Event-Listener, der nur einmal ausgeführt wird
   */
  once(event: string, callback: EventCallback): void {
    if (!this.onceCallbacks.has(event)) {
      this.onceCallbacks.set(event, []);
    }
    this.onceCallbacks.get(event)!.push(callback);
  }

  /**
   * Entferne einen Event-Listener
   */
  off(event: string, callback: EventCallback): void {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  /**
   * Emitte ein Event
   */
  emit(event: string, data?: any): void {
    // Execute regular listeners
    if (this.events[event]) {
      this.events[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error(`[EventBus] Error in event listener for "${event}":`, error);
          }
        }
      });
    }

    // Execute once listeners and remove them
    if (this.onceCallbacks.has(event)) {
      const callbacks = this.onceCallbacks.get(event)!;
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error(`[EventBus] Error in once listener for "${event}":`, error);
          }
        }
      });
      this.onceCallbacks.delete(event);
    }
  }

  /**
   * Entferne alle Listener für ein Event
   */
  removeAllListeners(event?: string): void {
    if (event) {
      delete this.events[event];
      this.onceCallbacks.delete(event);
    } else {
      this.events = {};
      this.onceCallbacks.clear();
    }
  }

  /**
   * Prüfe, ob ein Event Listener hat
   */
  hasListeners(event: string): boolean {
    return (this.events[event]?.length > 0) || (this.onceCallbacks.has(event) && this.onceCallbacks.get(event)!.length > 0);
  }
}

// Singleton-Instanz
export const eventBus = new EventBus();

// Event-Typen für Type-Safety
export const Events = {
  // Reminder Events
  REMINDER_CREATED: 'reminder:created',
  REMINDER_UPDATED: 'reminder:updated',
  REMINDER_DELETED: 'reminder:deleted',
  REMINDER_DUE: 'reminder:due',
  REMINDER_NOTIFICATION: 'reminder:notification',
  
  // Chat Events
  CHAT_MESSAGE: 'chat:message',
  CHAT_REMINDER_RECEIVED: 'chat:reminder:received',
  CHAT_DIALOG_OPEN: 'chat:dialog:open',
  CHAT_DIALOG_CLOSE: 'chat:dialog:close',
  
  // Data Sync Events
  DATA_UPDATED: 'data:updated',
  DATA_SYNC_START: 'data:sync:start',
  DATA_SYNC_COMPLETE: 'data:sync:complete',
  DATA_SYNC_ERROR: 'data:sync:error',
  
  // Background Tasks
  BACKGROUND_TASK_START: 'background:task:start',
  BACKGROUND_TASK_COMPLETE: 'background:task:complete',
  BACKGROUND_TASK_ERROR: 'background:task:error',
  
  // User Activity
  USER_ACTIVE: 'user:active',
  USER_IDLE: 'user:idle',
  USER_VISIBILITY_CHANGE: 'user:visibility:change',
  
  // App Lifecycle
  APP_READY: 'app:ready',
  APP_SUSPEND: 'app:suspend',
  APP_RESUME: 'app:resume',
} as const;

export type EventType = typeof Events[keyof typeof Events];

