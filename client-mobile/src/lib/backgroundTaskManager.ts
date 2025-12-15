/**
 * Background Task Manager für Mobile
 * Vereinfachte Version für mobile Geräte
 */

import { eventBus, Events } from './eventBus';

interface Task {
  id: string;
  name: string;
  interval: number;
  callback: () => Promise<void> | void;
  enabled: boolean;
  lastRun?: number;
  timeoutId?: number;
}

class BackgroundTaskManager {
  private tasks: Map<string, Task> = new Map();
  private isRunning = false;

  constructor() {
    this.setupVisibilityHandling();
    this.setupActivityTracking();
  }

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

    return () => {
      this.unregisterTask(taskId);
    };
  }

  unregisterTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task?.timeoutId) {
      clearTimeout(task.timeoutId);
    }
    this.tasks.delete(taskId);
  }

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    eventBus.emit(Events.APP_READY);
    
    this.tasks.forEach((task, taskId) => {
      if (task.enabled) {
        this.scheduleTask(taskId);
      }
    });
  }

  stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    eventBus.emit(Events.APP_SUSPEND);
    
    this.tasks.forEach(task => {
      if (task.timeoutId) {
        clearTimeout(task.timeoutId);
        task.timeoutId = undefined;
      }
    });
  }

  private scheduleTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task || !task.enabled || !this.isRunning) return;

    if (task.timeoutId) {
      clearTimeout(task.timeoutId);
    }

    const delay = task.lastRun 
      ? Math.max(0, task.interval - (Date.now() - task.lastRun))
      : 0;

    task.timeoutId = window.setTimeout(async () => {
      try {
        eventBus.emit(Events.BACKGROUND_TASK_START, { taskId, taskName: task.name });
        
        await task.callback();
        
        task.lastRun = Date.now();
        eventBus.emit(Events.BACKGROUND_TASK_COMPLETE, { taskId, taskName: task.name });
        
        this.scheduleTask(taskId);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error(`[BackgroundTaskManager] Error in task "${task.name}":`, error);
        }
        eventBus.emit(Events.BACKGROUND_TASK_ERROR, { taskId, taskName: task.name, error });
        
        task.lastRun = Date.now();
        this.scheduleTask(taskId);
      }
    }, delay);
  }

  private setupVisibilityHandling(): void {
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        eventBus.emit(Events.USER_VISIBILITY_CHANGE, { visible: false });
      } else {
        eventBus.emit(Events.USER_VISIBILITY_CHANGE, { visible: true });
        this.triggerImmediateSync();
      }
    });
  }

  private setupActivityTracking(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    try {
    let idleTimeout: number | null = null;
    const IDLE_TIME = 5 * 60 * 1000;

    const resetIdleTimer = () => {
        try {
      if (idleTimeout) {
        clearTimeout(idleTimeout);
      }
      
      eventBus.emit(Events.USER_ACTIVE);
      
      idleTimeout = window.setTimeout(() => {
        eventBus.emit(Events.USER_IDLE);
      }, IDLE_TIME);
        } catch (error) {
          // Silently handle errors in activity tracking
          if (process.env.NODE_ENV === 'development') {
            console.warn('[BackgroundTaskManager] Activity tracking error:', error);
          }
        }
      };

      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            try {
              document.addEventListener(event, resetIdleTimer, { passive: true });
            } catch (error) {
              // Ignore errors adding event listeners
            }
          });
          resetIdleTimer();
        });
      } else {
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
          try {
      document.addEventListener(event, resetIdleTimer, { passive: true });
          } catch (error) {
            // Ignore errors adding event listeners
          }
    });
    resetIdleTimer();
      }
    } catch (error) {
      // Silently fail activity tracking initialization
      if (process.env.NODE_ENV === 'development') {
        console.warn('[BackgroundTaskManager] Failed to setup activity tracking:', error);
      }
    }
  }

  private triggerImmediateSync(): void {
    this.tasks.forEach((task, taskId) => {
      if (task.enabled && (taskId.includes('reminder') || taskId.includes('sync'))) {
        task.lastRun = undefined;
        this.scheduleTask(taskId);
      }
    });
  }

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

export const backgroundTaskManager = new BackgroundTaskManager();

if (typeof window !== 'undefined') {
  setTimeout(() => {
    backgroundTaskManager.start();
  }, 1000);
}

