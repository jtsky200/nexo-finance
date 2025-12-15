/**
 * Workflow Orchestrator für Mobile
 * Vereinfachte Version für mobile Geräte
 */

import { eventBus, Events } from './eventBus';
import { backgroundTaskManager } from './backgroundTaskManager';

class WorkflowOrchestrator {
  private processedReminders: Set<string> = new Set();

  constructor() {
    this.setupEventListeners();
    this.setupBackgroundTasks();
  }

  private setupEventListeners(): void {
    eventBus.on(Events.REMINDER_CREATED, () => {
      this.triggerDataSync('reminders');
    });

    eventBus.on(Events.REMINDER_UPDATED, () => {
      this.triggerDataSync('reminders');
    });

    eventBus.on(Events.CHAT_REMINDER_RECEIVED, () => {
      this.triggerDataSync('chatReminders');
    });

    eventBus.on(Events.USER_ACTIVE, () => {
      this.triggerDataSync('all');
    });

    eventBus.on(Events.USER_VISIBILITY_CHANGE, (data: { visible: boolean }) => {
      if (data.visible) {
        this.triggerDataSync('all');
      }
    });
  }

  private setupBackgroundTasks(): void {
    backgroundTaskManager.registerTask({
      id: 'chat-reminder-check',
      name: 'Chat Reminder Check',
      interval: 30000,
      enabled: true,
      callback: async () => {
        await this.checkChatReminders();
      },
    });

    backgroundTaskManager.registerTask({
      id: 'data-sync',
      name: 'Data Sync',
      interval: 120000,
      enabled: true,
      callback: async () => {
        await this.performDataSync();
      },
    });
  }

  private async checkChatReminders(): Promise<void> {
    try {
      eventBus.emit(Events.DATA_SYNC_START, { type: 'chatReminders' });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[WorkflowOrchestrator] Error checking chat reminders:', error);
      }
      eventBus.emit(Events.DATA_SYNC_ERROR, { type: 'chatReminders', error });
    }
  }

  private lastSyncTime: Map<string, number> = new Map();
  private triggerDataSync(type: 'all' | 'reminders' | 'chatReminders' | 'finance'): void {
    const now = Date.now();
    const lastTime = this.lastSyncTime.get(type) || 0;
    const MIN_SYNC_INTERVAL = 1000;
    
    if (now - lastTime < MIN_SYNC_INTERVAL) {
      return;
    }
    
    this.lastSyncTime.set(type, now);
    eventBus.emit(Events.DATA_SYNC_START, { type });
  }

  private async performDataSync(): Promise<void> {
    try {
      eventBus.emit(Events.DATA_SYNC_START, { type: 'all' });
      await new Promise(resolve => setTimeout(resolve, 100));
      eventBus.emit(Events.DATA_SYNC_COMPLETE, { type: 'all' });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[WorkflowOrchestrator] Error in data sync:', error);
      }
      eventBus.emit(Events.DATA_SYNC_ERROR, { type: 'all', error });
    }
  }

  initialize(): void {
    if (process.env.NODE_ENV === 'development') {
      console.log('[WorkflowOrchestrator] Initialized');
    }
    eventBus.emit(Events.APP_READY);
  }
}

export const workflowOrchestrator = new WorkflowOrchestrator();

if (typeof window !== 'undefined') {
  setTimeout(() => {
    workflowOrchestrator.initialize();
  }, 500);
}

