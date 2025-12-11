# Troubleshooting: Assistant nicht gefunden

## Problem
Die Logs zeigen: `Assistant not found: asst_Es1kVA8SKX4G4LPtsvDtCFp9`

## Mögliche Ursachen

### 1. API Key und Assistant ID gehören zu verschiedenen Accounts
**Das ist die häufigste Ursache!**

- Der API Key muss zum **gleichen OpenAI Account** gehören wie der Assistant
- Prüfe in der OpenAI Console:
  1. Gehe zu https://platform.openai.com/api-keys
  2. Prüfe, welcher Account den API Key erstellt hat
  3. Gehe zu https://platform.openai.com/assistants
  4. Prüfe, ob der Assistant im **gleichen Account** ist

### 2. Assistant wurde gelöscht
- Prüfe in der OpenAI Console, ob der Assistant noch existiert
- Falls nicht, erstelle einen neuen Assistant

### 3. API Key hat keine Berechtigung
- Der API Key muss Zugriff auf die Assistants API haben
- Prüfe die API Key Berechtigungen

## Lösung

### Option 1: API Key und Assistant im gleichen Account verwenden
1. **Erstelle einen neuen API Key** im gleichen Account wie der Assistant:
   - Gehe zu https://platform.openai.com/api-keys
   - Klicke auf "Create new secret key"
   - Kopiere den neuen Key

2. **Setze den neuen API Key in Firebase**:
   ```bash
   firebase functions:secrets:set OPENAI_API_KEY
   ```
   (Eingabe des neuen Keys)

3. **Deploye die Functions neu**:
   ```bash
   firebase deploy --only functions:trpc
   ```

### Option 2: Neuen Assistant im gleichen Account wie der API Key erstellen
1. **Prüfe, welcher Account den API Key hat**
2. **Erstelle einen neuen Assistant** in diesem Account:
   - Gehe zu https://platform.openai.com/assistants
   - Klicke auf "Create assistant"
   - Kopiere die neue Assistant ID

3. **Setze die neue Assistant ID**:
   ```bash
   firebase functions:config:set openai.assistant_id="asst_NEUE_ID"
   ```
   Oder in der Firebase Console als Environment Variable `OPENAI_ASSISTANT_ID`

4. **Deploye die Functions neu**:
   ```bash
   firebase deploy --only functions:trpc
   ```

## Prüfung

Nach dem Deploy, teste den Chat erneut. Die Logs sollten jetzt zeigen:
- `[AI Chat] ✅ Assistant exists!` (wenn der Assistant gefunden wird)
- Oder detaillierte Fehlermeldungen, die das Problem erklären

## Logs prüfen

```bash
firebase functions:log --only trpc | Select-String -Pattern "AI Chat|Assistant|error" -Context 2,2
```

Die Logs zeigen jetzt:
- Ob der Assistant verifiziert werden konnte
- Detaillierte Fehlermeldungen
- Welche Tools übergeben wurden

