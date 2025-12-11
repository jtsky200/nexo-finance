# Diagnose: Datenverlust-Problem

## Problem
Alle Daten (Kalender, Erinnerungen, Finanzen) sind nicht mehr sichtbar im Dashboard.

## Mögliche Ursachen

### 1. User-ID-Mismatch
Die Daten könnten mit einer anderen `userId` gespeichert worden sein:
- **Firebase Auth UID**: Die ID aus Firebase Authentication (z.B. `abc123...`)
- **Firestore User Document ID**: Die ID des User-Dokuments in Firestore (z.B. `xyz789...`)

Die Firebase Functions verwenden `request.auth.uid` (Firebase Auth UID), aber wenn die Daten mit der Firestore User Document ID gespeichert wurden, werden sie nicht gefunden.

### 2. Daten wurden gelöscht
Die Daten könnten versehentlich gelöscht worden sein.

### 3. Authentifizierungsproblem
Der Benutzer könnte nicht korrekt authentifiziert sein.

## Lösungsschritte

### Schritt 1: Debug-Informationen prüfen

1. Öffne die Browser-Konsole (F12)
2. Gehe zum Dashboard
3. Suche nach "Debug Info:" in der Konsole
4. Die Debug-Informationen zeigen:
   - Welche User-ID verwendet wird
   - Ob Daten mit Firebase Auth UID gefunden wurden
   - Ob Daten mit Firestore User ID gefunden wurden

### Schritt 2: Daten in Firestore prüfen

1. Gehe zu [Firebase Console](https://console.firebase.google.com/project/nexo-jtsky100/firestore)
2. Prüfe die Collections:
   - `reminders` - Suche nach Dokumenten mit deiner User-ID
   - `financeEntries` - Suche nach Dokumenten mit deiner User-ID
   - `people` - Suche nach Dokumenten mit deiner User-ID
3. Prüfe, welche `userId` in den Dokumenten verwendet wird:
   - Ist es die Firebase Auth UID?
   - Oder ist es die Firestore User Document ID?

### Schritt 3: Daten migrieren (falls nötig)

Wenn die Daten mit der falschen `userId` gespeichert wurden, müssen sie migriert werden.

**Option A: Manuelle Migration in Firebase Console**
1. Öffne jedes Dokument
2. Ändere die `userId` von Firestore User Document ID zu Firebase Auth UID
3. Speichere das Dokument

**Option B: Migration-Script erstellen**
Ein Script kann erstellt werden, um alle Daten automatisch zu migrieren.

### Schritt 4: Firebase Functions prüfen

Prüfe, ob die Functions korrekt deployed sind:
```bash
firebase functions:list
```

## Sofortige Hilfe

Falls die Daten noch in Firestore vorhanden sind, aber mit der falschen `userId`:
1. Öffne die Firebase Console
2. Gehe zu Firestore
3. Prüfe die Collections
4. Wenn Daten vorhanden sind, aber mit falscher `userId`, können wir ein Migration-Script erstellen

## Nächste Schritte

1. **Prüfe die Browser-Konsole** für Debug-Informationen
2. **Prüfe Firestore** ob Daten vorhanden sind
3. **Teile die Debug-Informationen** mit mir, dann kann ich ein Migration-Script erstellen

