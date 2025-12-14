# Wetter-API Setup (Phase 3)

## OpenWeatherMap API Key konfigurieren

Die Wetter-Funktion verwendet die OpenWeatherMap API. Um die Funktion zu aktivieren, müssen Sie einen API-Key konfigurieren.

### 1. API-Key erhalten

1. Gehen Sie zu [OpenWeatherMap](https://openweathermap.org/api)
2. Erstellen Sie ein kostenloses Konto
3. Navigieren Sie zu [API Keys](https://home.openweathermap.org/api_keys)
4. Erstellen Sie einen neuen API-Key (kostenloser Plan ist ausreichend)

### 2. API-Key in Firebase Functions setzen

```bash
cd nexo-export
firebase functions:config:set openweathermap.api_key="IHR_API_KEY_HIER"
```

Oder für Firebase Functions v2 (empfohlen):

```bash
firebase functions:secrets:set OPENWEATHERMAP_API_KEY
# Dann den API-Key eingeben, wenn danach gefragt wird
```

### 3. Functions neu deployen

Nach dem Setzen des API-Keys müssen die Functions neu deployed werden:

```bash
firebase deploy --only functions
```

### 4. API-Limits (Free Tier)

- **60 Aufrufe pro Minute**
- **1.000.000 Aufrufe pro Monat**
- **Aktuelles Wetter**: Verfügbar
- **5-Tage Vorhersage**: Verfügbar (3 Stunden Intervalle)
- **Historische Daten**: Nur mit bezahltem Plan

### 5. Fehlerbehebung

**Fehler: "OpenWeatherMap API key not configured"**
- Stellen Sie sicher, dass der API-Key korrekt gesetzt wurde
- Überprüfen Sie mit: `firebase functions:config:get` oder `firebase functions:secrets:access OPENWEATHERMAP_API_KEY`

**Fehler: "Invalid OpenWeatherMap API key"**
- Überprüfen Sie, ob der API-Key korrekt ist
- Warten Sie einige Minuten nach der Erstellung des API-Keys (Aktivierung kann dauern)

**Fehler: "Location not found"**
- Stellen Sie sicher, dass der Ortsname korrekt ist (z.B. "Zurich, CH" oder "Berlin, DE")
- Verwenden Sie englische Ortsnamen oder ISO-Codes für Länder

### 6. Location-Format

Die Location sollte im Format `"Stadt, Land"` oder `"Stadt, Ländercode"` angegeben werden:
- `"Zurich, CH"` ✅
- `"Berlin, DE"` ✅
- `"New York, US"` ✅
- `"London, GB"` ✅

### 7. Caching

Wetterdaten werden automatisch in Firestore gecacht, um API-Aufrufe zu reduzieren:
- Daten werden pro Tag und Location gespeichert
- Bei wiederholten Anfragen werden gecachte Daten verwendet
- Historische Daten werden nur aus dem Cache geladen (keine API-Aufrufe für vergangene Daten)
