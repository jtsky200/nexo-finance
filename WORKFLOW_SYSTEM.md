# 🔄 Workflow-System: Lebendige Webseite mit AI-Chat Integration

## ✅ Implementiert

Die gesamte Webseite arbeitet jetzt im Hintergrund und kommuniziert nahtlos mit dem AI-Chat.

### 🎯 Kern-Features

#### 1. **Event Bus System** (`eventBus.ts`)
- Zentrale Event-Kommunikation zwischen allen Komponenten
- Type-safe Events für alle wichtigen Aktionen
- Unterstützt `on`, `once`, `off`, `emit`
- Automatische Fehlerbehandlung

**Verfügbare Events:**
- `REMINDER_CREATED`, `REMINDER_UPDATED`, `REMINDER_DELETED`
- `CHAT_MESSAGE`, `CHAT_REMINDER_RECEIVED`, `CHAT_DIALOG_OPEN`
- `DATA_UPDATED`, `DATA_SYNC_START`, `DATA_SYNC_COMPLETE`
- `USER_ACTIVE`, `USER_IDLE`, `USER_VISIBILITY_CHANGE`
- `APP_READY`, `APP_SUSPEND`, `APP_RESUME`

#### 2. **Background Task Manager** (`backgroundTaskManager.ts`)
- Verwaltet kontinuierliche Hintergrund-Aufgaben
- Intelligente Scheduling-Logik
- Automatische Pause/Resume bei Tab-Wechsel
- Health-Check und Fehlerbehandlung

**Registrierte Tasks:**
- **Chat Reminder Check**: Alle 30 Sekunden
- **Data Sync**: Alle 2 Minuten
- **Health Check**: Alle 5 Minuten

#### 3. **Workflow Orchestrator** (`workflowOrchestrator.ts`)
- Koordiniert alle Workflows zwischen Komponenten
- Automatische Synchronisation bei Events
- Intelligente Chat-Reminder-Verarbeitung
- User-Activity-Tracking

**Workflows:**
- Erinnerung erstellt → Trigger Data Sync
- Chat-Reminder empfangen → Öffne Dialog automatisch
- User wird aktiv → Sofortige Data Sync
- Tab wird sichtbar → Sofortige Data Sync

#### 4. **Intelligentes Polling**
- `useChatReminders`: Pollt alle 30 Sekunden
- Reagiert auf Events für sofortige Updates
- Automatische Refetch bei relevanten Events

#### 5. **Event-Integration in Komponenten**

**AIChatFloatingButton:**
- Emittiert Events bei Dialog-Öffnung/Schließung
- Reagiert auf `CHAT_DIALOG_OPEN` Events
- Automatische Chat-Reminder-Verarbeitung

**Reminders Page:**
- Emittiert Events bei CRUD-Operationen
- Reagiert auf Data-Sync-Events
- Automatische Refetch bei Änderungen

**Firebase Hooks:**
- `useReminders`: Reagiert auf Reminder-Events und Data-Sync
- `useChatReminders`: Reagiert auf Chat-Events und Data-Sync
- Automatische Synchronisation zwischen Komponenten

## 🔄 Workflow-Beispiele

### Beispiel 1: Erinnerung erstellen
1. User erstellt Erinnerung in Reminders-Seite
2. `REMINDER_CREATED` Event wird emittiert
3. Workflow Orchestrator triggert Data Sync
4. Alle Komponenten werden automatisch aktualisiert
5. Backend erstellt Chat-Reminder (wenn fällig)
6. Chat-Dialog öffnet sich automatisch

### Beispiel 2: Chat-Reminder empfangen
1. Backend erstellt Chat-Reminder (Scheduled Function)
2. `useChatReminders` Hook erkennt neuen Reminder
3. `CHAT_REMINDER_RECEIVED` Event wird emittiert
4. Workflow Orchestrator verarbeitet Reminder
5. Chat-Dialog öffnet sich automatisch
6. Reminder-Nachricht wird angezeigt
7. Reminder wird als gelesen markiert

### Beispiel 3: User wird aktiv
1. User bewegt Maus/Tastatur
2. `USER_ACTIVE` Event wird emittiert
3. Workflow Orchestrator triggert sofortige Data Sync
4. Alle Daten werden aktualisiert
5. Neue Erinnerungen/Chat-Messages werden geladen

### Beispiel 4: Tab wird sichtbar
1. User wechselt zurück zum Tab
2. `USER_VISIBILITY_CHANGE` Event wird emittiert
3. Workflow Orchestrator triggert sofortige Data Sync
4. Background Tasks werden beschleunigt
5. Alle Daten sind sofort aktuell

## 🚀 Performance-Optimierungen

- **Intelligentes Polling**: Nur wenn nötig
- **Event-basierte Updates**: Sofortige Reaktion auf Änderungen
- **Background Task Pause**: Reduzierte Aktivität bei verstecktem Tab
- **Health Checks**: Automatische Überwachung der System-Gesundheit
- **Fehlerbehandlung**: Robuste Fehlerbehandlung in allen Tasks

## 📊 Monitoring

Alle Events und Tasks können über die Browser-Konsole überwacht werden:
```javascript
// Event Bus Status
import { eventBus } from '@/lib/eventBus';
eventBus.hasListeners('reminder:created'); // true/false

// Background Tasks Status
import { backgroundTaskManager } from '@/lib/backgroundTaskManager';
backgroundTaskManager.getAllTasksStatus(); // Array mit allen Tasks
```

## 🔧 Erweiterte Nutzung

### Eigene Events emittieren
```typescript
import { eventBus, Events } from '@/lib/eventBus';

// Event emittieren
eventBus.emit(Events.DATA_UPDATED, { type: 'finance', id: '123' });

// Event abonnieren
const unsubscribe = eventBus.on(Events.DATA_UPDATED, (data) => {
  console.log('Data updated:', data);
});

// Später abmelden
unsubscribe();
```

### Eigene Background Tasks registrieren
```typescript
import { backgroundTaskManager } from '@/lib/backgroundTaskManager';

const unregister = backgroundTaskManager.registerTask({
  id: 'my-custom-task',
  name: 'My Custom Task',
  interval: 60000, // 1 minute
  enabled: true,
  callback: async () => {
    // Your task logic
    console.log('Task executed');
  },
});

// Später entfernen
unregister();
```

## ✅ Status

- ✅ Event Bus System
- ✅ Background Task Manager
- ✅ Workflow Orchestrator
- ✅ Intelligentes Polling
- ✅ Event-Integration in Komponenten
- ✅ Automatische Synchronisation
- ✅ User Activity Tracking
- ⏳ WebSocket-Integration (optional, für Echtzeit)
- ⏳ Service Worker (optional, für Offline-Support)

Die Webseite "lebt" jetzt und arbeitet kontinuierlich im Hintergrund! 🎉

