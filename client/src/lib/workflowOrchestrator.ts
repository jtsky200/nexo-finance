/**
 * Workflow Orchestrator
 * Koordiniert alle Workflows zwischen AI-Chat, Erinnerungen und anderen Komponenten
 */

import { eventBus, Events } from './eventBus';
import { backgroundTaskManager } from './backgroundTaskManager';
import { backgroundSyncManager } from './backgroundSync';
import { websocketClient } from './websocketClient';
import { useChatReminders, markChatReminderAsRead, type ChatReminder } from './firebaseHooks';

class WorkflowOrchestrator {
  private chatReminderProcessor: (() => Promise<void>) | null = null;
  private processedReminders: Set<string> = new Set();

  constructor() {
    this.setupEventListeners();
    this.setupBackgroundTasks();
  }

  /**
   * Setup Event Listeners für Workflow-Koordination
   */
  private setupEventListeners(): void {
    // Reminder created - trigger sync
    eventBus.on(Events.REMINDER_CREATED, () => {
      this.triggerDataSync('reminders');
    });

    // Reminder updated - trigger sync
    eventBus.on(Events.REMINDER_UPDATED, () => {
      this.triggerDataSync('reminders');
    });

    // Chat reminder received - open dialog
    eventBus.on(Events.CHAT_REMINDER_RECEIVED, (reminder: ChatReminder) => {
      this.handleChatReminder(reminder);
    });

    // User becomes active - trigger immediate sync
    eventBus.on(Events.USER_ACTIVE, () => {
      this.triggerDataSync('all');
    });

    // Tab becomes visible - trigger immediate sync
    eventBus.on(Events.USER_VISIBILITY_CHANGE, (data: { visible: boolean }) => {
      if (data.visible) {
        this.triggerDataSync('all');
      }
    });
  }

  /**
   * Setup Background Tasks
   */
  private setupBackgroundTasks(): void {
    // Task: Chat Reminder Check (every 30 seconds)
    backgroundTaskManager.registerTask({
      id: 'chat-reminder-check',
      name: 'Chat Reminder Check',
      interval: 30000, // 30 seconds
      enabled: true,
      callback: async () => {
        await this.checkChatReminders();
      },
    });

    // Task: Data Sync (every 2 minutes)
    backgroundTaskManager.registerTask({
      id: 'data-sync',
      name: 'Data Sync',
      interval: 120000, // 2 minutes
      enabled: true,
      callback: async () => {
        await this.performDataSync();
      },
    });

    // Task: Health Check (every 5 minutes)
    backgroundTaskManager.registerTask({
      id: 'health-check',
      name: 'Health Check',
      interval: 300000, // 5 minutes
      enabled: true,
      callback: async () => {
        await this.performHealthCheck();
      },
    });
  }

  /**
   * Check for new chat reminders
   */
  private async checkChatReminders(): Promise<void> {
    try {
      // This will be called from a React hook context
      // For now, we'll use the event system to trigger checks
      eventBus.emit(Events.DATA_SYNC_START, { type: 'chatReminders' });
      
      // The actual check is handled by useChatReminders hook
      // We just emit an event to trigger it
      
    } catch (error) {
      console.error('[WorkflowOrchestrator] Error checking chat reminders:', error);
      eventBus.emit(Events.DATA_SYNC_ERROR, { type: 'chatReminders', error });
    }
  }

  /**
   * Handle incoming chat reminder
   */
  private handleChatReminder(reminder: ChatReminder): void {
    // Prevent duplicate processing
    if (this.processedReminders.has(reminder.id)) {
      return;
    }

    this.processedReminders.add(reminder.id);

    // Mark as read
    markChatReminderAsRead(reminder.id).catch(console.error);

    // Emit event to open chat dialog
    eventBus.emit(Events.CHAT_DIALOG_OPEN, { reminder });

    // Emit reminder notification
    eventBus.emit(Events.REMINDER_NOTIFICATION, { reminder });
  }

  /**
   * Trigger data sync with debouncing to prevent infinite loops
   */
  private lastSyncTime: Map<string, number> = new Map();
  private triggerDataSync(type: 'all' | 'reminders' | 'chatReminders' | 'finance'): void {
    const now = Date.now();
    const lastTime = this.lastSyncTime.get(type) || 0;
    const MIN_SYNC_INTERVAL = 1000; // Minimum 1 second between syncs of the same type
    
    if (now - lastTime < MIN_SYNC_INTERVAL) {
      // Skip if sync was triggered too recently
      return;
    }
    
    this.lastSyncTime.set(type, now);
    eventBus.emit(Events.DATA_SYNC_START, { type });
  }

  /**
   * Perform data sync
   */
  private async performDataSync(): Promise<void> {
    try {
      eventBus.emit(Events.DATA_SYNC_START, { type: 'all' });
      
      // Trigger sync for all components
      // Components will listen to this event and refetch their data
      
      // Simulate sync delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      eventBus.emit(Events.DATA_SYNC_COMPLETE, { type: 'all' });
    } catch (error) {
      console.error('[WorkflowOrchestrator] Error in data sync:', error);
      eventBus.emit(Events.DATA_SYNC_ERROR, { type: 'all', error });
    }
  }

  /**
   * Perform health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      // Check if background tasks are running
      const tasks = backgroundTaskManager.getAllTasksStatus();
      const failedTasks = tasks.filter(t => t.enabled && !t.lastRun && Date.now() > (t.nextRun || 0) + 60000);
      
      if (failedTasks.length > 0) {
        console.warn('[WorkflowOrchestrator] Some background tasks may have failed:', failedTasks);
      }

      // Clean up old processed reminders (keep last 100)
      if (this.processedReminders.size > 100) {
        const remindersArray = Array.from(this.processedReminders);
        this.processedReminders = new Set(remindersArray.slice(-100));
      }
    } catch (error) {
      console.error('[WorkflowOrchestrator] Error in health check:', error);
    }
  }

  /**
   * Initialize workflow orchestrator
   */
  initialize(): void {
    console.log('[WorkflowOrchestrator] Initialized');
    
    // Setup background sync for critical functions
    this.setupBackgroundSync();
    
    // Setup WebSocket connection
    this.setupWebSocket();
    
    eventBus.emit(Events.APP_READY);
  }

  /**
   * Setup background sync
   */
  private setupBackgroundSync(): void {
    // Register background sync for reminders
    eventBus.on(Events.REMINDER_CREATED, () => {
      backgroundSyncManager.syncReminders().catch(console.error);
    });

    eventBus.on(Events.REMINDER_UPDATED, () => {
      backgroundSyncManager.syncReminders().catch(console.error);
    });

    // Register background sync for chat reminders
    eventBus.on(Events.CHAT_REMINDER_RECEIVED, () => {
      backgroundSyncManager.syncChatReminders().catch(console.error);
    });

    // Periodic sync for all data
    setInterval(() => {
      backgroundSyncManager.syncAllData().catch(console.error);
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Setup WebSocket connection
   */
  private setupWebSocket(): void {
    // WebSocket will auto-connect when user is authenticated
    // Listen for WebSocket events
    eventBus.on('websocket:connected', () => {
      console.log('[WorkflowOrchestrator] WebSocket connected');
    });

    eventBus.on('websocket:disconnected', () => {
      console.log('[WorkflowOrchestrator] WebSocket disconnected');
    });

    eventBus.on('websocket:error', (data: any) => {
      console.error('[WorkflowOrchestrator] WebSocket error:', data);
    });
  }
}

// Singleton-Instanz
export const workflowOrchestrator = new WorkflowOrchestrator();

// Auto-initialize when module loads (in browser)
if (typeof window !== 'undefined') {
  // Initialize after a short delay
  setTimeout(() => {
    workflowOrchestrator.initialize();
  }, 500);
}

