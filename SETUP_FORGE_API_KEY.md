# Setup BUILT_IN_FORGE_API_KEY für Firebase Functions

## Schritt 1: Secret erstellen

Führe folgenden Befehl aus, um das Secret zu erstellen:

```bash
firebase functions:secrets:set BUILT_IN_FORGE_API_KEY
```

Du wirst aufgefordert, den API-Key einzugeben. Alternativ kannst du den Wert direkt angeben:

```bash
echo "DEIN_API_KEY_HIER" | firebase functions:secrets:set BUILT_IN_FORGE_API_KEY
```

## Schritt 2: Functions deployen

Nachdem das Secret gesetzt wurde, müssen die Functions neu deployed werden:

```bash
firebase deploy --only functions
```

## Schritt 3: Secret prüfen

Um zu prüfen, ob das Secret gesetzt wurde:

```bash
firebase functions:secrets:list
```

## Wichtig

- Das Secret wird automatisch von der tRPC-Function verwendet
- Der API-Key wird sicher in Firebase Secrets gespeichert
- Nach dem Setzen des Secrets müssen die Functions neu deployed werden

## Alternative: Environment Variable (nicht empfohlen für Production)

Falls du keine Secrets verwenden möchtest, kannst du auch eine Environment Variable setzen:

```bash
firebase functions:config:set forge.api_key="DEIN_API_KEY"
```

Dann musst du die Function anpassen, um `functions.config().forge.api_key` zu verwenden.

