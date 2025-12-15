/**
 * Background Task Manager
 * Verwaltet kontinuierliche Hintergrund-Aufgaben für die Anwendung
 */

import { eventBus, Events } from './eventBus';
import { useChatReminders, markChatReminderAsRead, type ChatReminder } from './firebaseHooks';

interface Task {
  id: string;
  name: string;
  interval: number; // in milliseconds
  callback: () => Promise<void> | void;
  enabled: boolean;
  lastRun?: number;
  timeoutId?: number;
}

class BackgroundTaskManager {
  private tasks: Map<string, Task> = new Map();
  private isRunning = false;
  private visibilityCheckInterval: number | null = null;

  constructor() {
    this.setupVisibilityHandling();
    this.setupActivityTracking();
  }

  /**
   * Registriere eine Background-Task
   */
  registerTask(task: Omit<Task, 'lastRun' | 'timeoutId'>): () => void {
    const taskId = task.id;
    
    this.tasks.set(taskId, {
      ...task,
      lastRun: undefined,
      timeoutId: undefined,
    });

    if (this.isRunning && task.enabled) {
      this.scheduleTask(taskId);
    }

    // Return unregister function
    return () => {
      this.unregisterTask(taskId);
    };
  }

  /**
   * Entferne eine Background-Task
   */
  unregisterTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task?.timeoutId) {
      clearTimeout(task.timeoutId);
    }
    this.tasks.delete(taskId);
  }

  /**
   * Starte alle Tasks
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    eventBus.emit(Events.APP_READY);
    
    // Schedule all enabled tasks
    this.tasks.forEach((task, taskId) => {
      if (task.enabled) {
        this.scheduleTask(taskId);
      }
    });
  }

  /**
   * Stoppe alle Tasks
   */
  stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    eventBus.emit(Events.APP_SUSPEND);
    
    // Clear all timeouts
    this.tasks.forEach(task => {
      if (task.timeoutId) {
        clearTimeout(task.timeoutId);
        task.timeoutId = undefined;
      }
    });
  }

  /**
   * Schedule eine Task
   */
  private scheduleTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task || !task.enabled || !this.isRunning) return;

    // Clear existing timeout
    if (task.timeoutId) {
      clearTimeout(task.timeoutId);
    }

    // Calculate delay (immediate if never run, otherwise interval)
    const delay = task.lastRun 
      ? Math.max(0, task.interval - (Date.now() - task.lastRun))
      : 0;

    task.timeoutId = window.setTimeout(async () => {
      try {
        eventBus.emit(Events.BACKGROUND_TASK_START, { taskId, taskName: task.name });
        
        await task.callback();
        
        task.lastRun = Date.now();
        eventBus.emit(Events.BACKGROUND_TASK_COMPLETE, { taskId, taskName: task.name });
        
        // Schedule next run
        this.scheduleTask(taskId);
      } catch (error) {
        console.error(`[BackgroundTaskManager] Error in task "${task.name}":`, error);
        eventBus.emit(Events.BACKGROUND_TASK_ERROR, { taskId, taskName: task.name, error });
        
        // Retry after interval even on error
        task.lastRun = Date.now();
        this.scheduleTask(taskId);
      }
    }, delay);
  }

  /**
   * Setup Visibility Change Handling
   * Pausiert Tasks wenn Tab nicht sichtbar, beschleunigt sie wenn sichtbar
   */
  private setupVisibilityHandling(): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Tab ist versteckt - reduziere Aktivität
        eventBus.emit(Events.USER_VISIBILITY_CHANGE, { visible: false });
        // Tasks laufen weiter, aber mit reduzierter Priorität
      } else {
        // Tab ist sichtbar - erhöhe Aktivität
        eventBus.emit(Events.USER_VISIBILITY_CHANGE, { visible: true });
        // Trigger immediate sync for critical tasks
        this.triggerImmediateSync();
      }
    });
  }

  /**
   * Setup Activity Tracking
   */
  private setupActivityTracking(): void {
    if (typeof window === 'undefined') return;

    let idleTimeout: number | null = null;
    const IDLE_TIME = 5 * 60 * 1000; // 5 minutes

    const resetIdleTimer = () => {
      if (idleTimeout) {
        clearTimeout(idleTimeout);
      }
      
      eventBus.emit(Events.USER_ACTIVE);
      
      idleTimeout = window.setTimeout(() => {
        eventBus.emit(Events.USER_IDLE);
      }, IDLE_TIME);
    };

    // Track user activity
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetIdleTimer, { passive: true });
    });

    resetIdleTimer();
  }

  /**
   * Trigger immediate sync for critical tasks
   */
  private triggerImmediateSync(): void {
    // Find critical tasks (e.g., chat reminders, data sync)
    this.tasks.forEach((task, taskId) => {
      if (task.enabled && (taskId.includes('reminder') || taskId.includes('sync'))) {
        // Reset lastRun to trigger immediate execution
        task.lastRun = undefined;
        this.scheduleTask(taskId);
      }
    });
  }

  /**
   * Get task status
   */
  getTaskStatus(taskId: string): { enabled: boolean; lastRun?: number; nextRun?: number } | null {
    const task = this.tasks.get(taskId);
    if (!task) return null;

    return {
      enabled: task.enabled,
      lastRun: task.lastRun,
      nextRun: task.lastRun ? task.lastRun + task.interval : undefined,
    };
  }

  /**
   * Get all tasks status
   */
  getAllTasksStatus(): Array<{ id: string; name: string; enabled: boolean; lastRun?: number; nextRun?: number }> {
    return Array.from(this.tasks.entries()).map(([id, task]) => ({
      id,
      name: task.name,
      enabled: task.enabled,
      lastRun: task.lastRun,
      nextRun: task.lastRun ? task.lastRun + task.interval : undefined,
    }));
  }
}

// Singleton-Instanz
export const backgroundTaskManager = new BackgroundTaskManager();

// Auto-start when module loads (in browser)
if (typeof window !== 'undefined') {
  // Start after a short delay to ensure app is initialized
  setTimeout(() => {
    backgroundTaskManager.start();
  }, 1000);
}

