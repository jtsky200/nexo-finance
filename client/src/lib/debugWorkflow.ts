/**
 * Debug Utilities für Workflow-System
 * Ermöglicht Überprüfung des System-Status
 */

import { eventBus, Events } from './eventBus';
import { backgroundTaskManager } from './backgroundTaskManager';
import { backgroundSyncManager } from './backgroundSync';
import { websocketClient } from './websocketClient';

// Expose to window for debugging
if (typeof window !== 'undefined') {
  // Use setTimeout to ensure modules are loaded
  setTimeout(() => {
    try {
      (window as any).__NEXO_DEBUG__ = {
    eventBus,
    backgroundTaskManager,
    Events,
    
    // Helper functions
    getEventListeners: (event: string) => {
      // Check if event has listeners (internal check)
      return eventBus.hasListeners(event);
    },
    
    getAllTasks: () => {
      return backgroundTaskManager.getAllTasksStatus();
    },
    
    emitTestEvent: (event: string, data?: any) => {
      eventBus.emit(event, data);
      return `Event "${event}" emitted with data: ${JSON.stringify(data)}`;
    },
    
    getSystemStatus: () => {
      return {
        eventBus: {
          available: true,
          listenersCount: Object.keys((eventBus as any).events || {}).length,
        },
        backgroundTasks: {
          available: true,
          tasks: backgroundTaskManager.getAllTasksStatus(),
          isRunning: (backgroundTaskManager as any).isRunning,
        },
        backgroundSync: backgroundSyncManager.getStatus(),
        websocket: websocketClient.getStatus(),
        timestamp: new Date().toISOString(),
      };
    },
    
    getBackgroundSyncStatus: () => {
      return backgroundSyncManager.getStatus();
    },
    
    getWebSocketStatus: () => {
      return websocketClient.getStatus();
    },
    
    syncReminders: () => {
      return backgroundSyncManager.syncReminders();
    },
    
    syncChatReminders: () => {
      return backgroundSyncManager.syncChatReminders();
    },
    
    syncAllData: () => {
      return backgroundSyncManager.syncAllData();
    },
  };
  
      console.log('[Nexo Debug] Workflow system debug utilities available at window.__NEXO_DEBUG__');
      console.log('[Nexo Debug] Use window.__NEXO_DEBUG__.getSystemStatus() to check system status');
    } catch (error) {
      console.error('[Nexo Debug] Error initializing debug utilities:', error);
    }
  }, 1000);
}

