# Setup OpenAI für Nexo AI Chat

## Schritt 1: OpenAI API Key setzen

Führe folgenden Befehl aus, um das Secret zu erstellen:

```bash
firebase functions:secrets:set OPENAI_API_KEY
```

Du wirst aufgefordert, den API-Key einzugeben. Alternativ kannst du den Wert direkt angeben:

```bash
echo "DEIN_OPENAI_API_KEY_HIER" | firebase functions:secrets:set OPENAI_API_KEY
```

## Schritt 2: OpenAI Assistant ID setzen (optional)

Die Assistant ID kann über eine Environment Variable gesetzt werden:

```bash
firebase functions:config:set openai.assistant_id="asst_DEINE_ASSISTANT_ID"
```

Oder direkt in der Firebase Console:
1. Gehe zu Firebase Console > Functions > Configuration
2. Füge eine Environment Variable hinzu:
   - **Name**: `OPENAI_ASSISTANT_ID`
   - **Wert**: `asst_DEINE_ASSISTANT_ID`

**Standardwert**: Falls nicht gesetzt, wird `asst_Es1kVA8SKX4G4LPtsvDtCFp9` verwendet.

## Schritt 3: Functions deployen

Nachdem die Secrets/Environment Variables gesetzt wurden, müssen die Functions neu deployed werden:

```bash
firebase deploy --only functions:trpc
```

## Schritt 4: Secrets prüfen

Um zu prüfen, ob die Secrets gesetzt wurden:

```bash
firebase functions:secrets:list
```

## Wichtig

- Der OpenAI API Key wird sicher in Firebase Secrets gespeichert
- Die Assistant ID kann als Environment Variable gesetzt werden
- Nach dem Setzen der Secrets müssen die Functions neu deployed werden
- Der Assistant wird über die OpenAI Assistants API v2 verwendet

## OpenAI Assistant erstellen

1. Gehe zu https://platform.openai.com/assistants
2. Klicke auf "Create assistant"
3. Fülle die Konfiguration aus:
   - **Name**: `nexo`
   - **System instructions**: Siehe Anleitung in der App
   - **Model**: `gpt-4o-mini` oder `gpt-4o` (empfohlen)
   - **Tools**: Alle aus (OFF)
   - **Temperature**: `0.7`
   - **Top P**: `1.00`
4. Kopiere die Assistant ID (beginnt mit `asst_...`)
5. Setze sie als Environment Variable (siehe Schritt 2)

