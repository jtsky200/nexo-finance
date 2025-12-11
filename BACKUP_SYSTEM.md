# Backup-System für Nexo

## ✅ Automatisches Backup-System implementiert

Ein vollständiges Backup-System wurde erstellt, das deine Daten vor Verlust schützt.

## 🔄 Automatische Backups

**Täglich um 2:00 Uhr morgens (MEZ)** wird automatisch ein Backup erstellt:
- Alle wichtigen Collections werden gesichert
- Backups werden in Firebase Storage gespeichert
- Die letzten 30 Backups werden automatisch aufbewahrt
- Ältere Backups werden automatisch gelöscht

## 📦 Gesicherte Daten

Das Backup-System sichert folgende Collections:
- ✅ `reminders` - Alle Erinnerungen
- ✅ `financeEntries` - Alle Finanzeinträge
- ✅ `people` - Alle Personen (inkl. Rechnungen)
- ✅ `taxProfiles` - Alle Steuerprofile
- ✅ `shoppingList` - Einkaufslisten
- ✅ `budgets` - Budgets
- ✅ `workSchedules` - Arbeitspläne
- ✅ `vacations` - Ferien
- ✅ `schoolSchedules` - Schulpläne
- ✅ `schoolHolidays` - Schulferien
- ✅ `documents` - Dokumente
- ✅ `receipts` - Quittungen
- ✅ `shoppingListTemplates` - Einkaufslisten-Vorlagen
- ✅ `users` - Benutzerdaten

## 🛠️ Verfügbare Funktionen

### 1. Manuelles Backup erstellen
```typescript
import { createManualBackup } from '@/lib/firebaseHooks';

const result = await createManualBackup();
console.log(`Backup erstellt: ${result.backupId}`);
console.log(`Dokumente gesichert: ${result.documentCount}`);
```

### 2. Backups auflisten
```typescript
import { listAllBackups } from '@/lib/firebaseHooks';

const { backups } = await listAllBackups(10);
// Zeigt die letzten 10 Backups
```

### 3. Backup wiederherstellen
```typescript
import { restoreFromBackup } from '@/lib/firebaseHooks';

const result = await restoreFromBackup('backup-1234567890');
console.log(`Wiederhergestellt: ${result.restored} Dokumente`);
console.log(`Fehler: ${result.errors}`);
```

## 📍 Backup-Speicherort

- **Firebase Storage**: `gs://nexo-jtsky100.appspot.com/backups/`
- **Firestore Metadaten**: Collection `backups`

## 🔒 Sicherheit

- Backups sind nur für authentifizierte Benutzer zugänglich
- Backups werden verschlüsselt in Firebase Storage gespeichert
- Automatische Bereinigung alter Backups (nur letzte 30)

## 📊 Backup-Format

Backups werden als JSON-Dateien gespeichert mit folgender Struktur:
```json
{
  "timestamp": "2025-12-11T02:00:00.000Z",
  "collections": {
    "reminders": [...],
    "financeEntries": [...],
    ...
  },
  "metadata": {
    "totalDocuments": 1234,
    "backupVersion": "1.0"
  }
}
```

## 🚀 Nächste Schritte

1. **Erstes Backup erstellen**: Rufe `createManualBackup()` auf
2. **Backup-UI hinzufügen**: Erstelle eine Einstellungsseite für Backups
3. **Automatische Wiederherstellung**: Optional: Automatische Wiederherstellung bei Datenverlust

## ✅ Status

- ✅ Automatisches tägliches Backup aktiv
- ✅ Manuelles Backup möglich
- ✅ Backup-Wiederherstellung implementiert
- ✅ Backup-Auflistung verfügbar
- ✅ Automatische Bereinigung alter Backups

Das System ist vollständig funktionsfähig und schützt deine Daten!

