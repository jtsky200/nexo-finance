# 🔒 App Check Enforcement aktivieren & Live-Test

## 📋 **Schritt 1: Enforcement aktivieren**

### ⚡ Schnell-Anleitung (3 Minuten)

1. **Öffnen Sie:** https://console.firebase.google.com/project/nexo-jtsky100/appcheck

2. **Cloud Functions:**
   - Tab: **"Cloud Functions"**
   - App: **"NEXO Web-App"**
   - Drei-Punkte-Menü (⋮) → **"Enforce"** → Bestätigen

3. **Firestore:**
   - Tab: **"Cloud Firestore"**
   - App: **"NEXO Web-App"**
   - Drei-Punkte-Menü (⋮) → **"Enforce"** → Bestätigen

4. **Storage (optional):**
   - Tab: **"Cloud Storage"**
   - App: **"NEXO Web-App"**
   - Drei-Punkte-Menü (⋮) → **"Enforce"** → Bestätigen

**⏱️ Wartezeit:** 1-15 Minuten bis Enforcement aktiv ist

---

## 🧪 **Schritt 2: Live-Test durchführen**

### Test 1: Browser Console prüfen

1. Öffnen Sie: **https://nexo-jtsky100.web.app**
2. Öffnen Sie **Browser DevTools** (F12)
3. Gehen Sie zu **Console** Tab
4. **Suchen Sie nach:**
   ```
   [App Check] Initialized successfully
   ```
5. ✅ **Erwartetes Ergebnis:** Diese Nachricht sollte erscheinen

---

### Test 2: Network-Tab prüfen (App Check Tokens)

1. Gehen Sie zu **Network** Tab in DevTools
2. **Filtern Sie nach:** `trpc` oder `api`
3. **Führen Sie eine Aktion aus:**
   - Loggen Sie sich ein
   - Oder klicken Sie auf einen Button, der API-Calls macht
4. **Klicken Sie auf einen tRPC Request**
5. Gehen Sie zu **Headers** Tab
6. **Suchen Sie nach:**
   - `X-Firebase-AppCheck` → Sollte einen langen Token-String enthalten
   - `X-AppCheck-Action` → Sollte eine Action wie `login`, `submit`, etc. enthalten
7. ✅ **Erwartetes Ergebnis:** Beide Header sollten vorhanden sein

---

### Test 3: Backend-Logs prüfen

1. Öffnen Sie: https://console.firebase.google.com/project/nexo-jtsky100/functions/logs
2. **Führen Sie eine Aktion in der App aus** (z.B. Login)
3. **Aktualisieren Sie die Logs**
4. **Suchen Sie nach:**
   ```
   [App Check] Token verified
   ```
5. ✅ **Erwartetes Ergebnis:** Diese Nachricht sollte erscheinen

---

### Test 4: Firebase Console Metrics prüfen

1. Öffnen Sie: https://console.firebase.google.com/project/nexo-jtsky100/appcheck
2. Klicken Sie auf **"Metrics"** Tab
3. **Prüfen Sie:**
   - Token-Anfragen sollten > 0 sein
   - Erfolgreiche Verifizierungen sollten > 0 sein
4. ✅ **Erwartetes Ergebnis:** Metriken sollten Daten zeigen

---

### Test 5: Security Events prüfen

1. Öffnen Sie: https://console.firebase.google.com/project/nexo-jtsky100/firestore/data
2. Gehen Sie zu Collection: **`securityEvents`**
3. **Prüfen Sie:**
   - Events sollten nach Aktionen erscheinen
   - `invalid_token` Events = Blockierte Requests (niedrige Scores)
4. ✅ **Erwartetes Ergebnis:** Events werden geloggt

---

## ✅ **Erfolgreiche Tests**

Wenn alle Tests erfolgreich sind:

- ✅ App Check ist initialisiert
- ✅ Tokens werden gesendet
- ✅ Backend verifiziert Tokens
- ✅ Enforcement ist aktiv
- ✅ Bot-Requests werden blockiert

---

## ⚠️ **Falls Probleme auftreten**

### Problem: "App Check not initialized"

**Lösung:**
- Prüfen Sie Browser Console auf Fehler
- Prüfen Sie, ob reCAPTCHA v3 Site Key korrekt ist
- Prüfen Sie Network-Tab auf Blockierungen

### Problem: "Token verification failed"

**Lösung:**
- Prüfen Sie Firebase Console → App Check → Apps
- Stellen Sie sicher, dass die Domain registriert ist
- Prüfen Sie, ob Enforcement korrekt aktiviert ist

### Problem: "Requests werden blockiert"

**Lösung:**
- Prüfen Sie, ob App Check Tokens gesendet werden
- Prüfen Sie Backend-Logs auf Fehler
- Temporär Enforcement deaktivieren, um zu debuggen

---

## 📊 **Monitoring nach Aktivierung**

### Was zu überwachen:

1. **Firebase Console → App Check → Metrics**
   - Token-Anfragen pro Tag
   - Erfolgreiche vs. fehlgeschlagene Verifizierungen
   - Top Actions (login, submit, etc.)

2. **Firestore → securityEvents Collection**
   - `invalid_token` Events (niedrige Scores)
   - `auth_success` Events (erfolgreiche Authentifizierungen)
   - Patterns erkennen (z.B. viele fehlgeschlagene Verifizierungen = möglicher Angriff)

3. **Cloud Functions → Logs**
   - `[App Check] Token verified` Nachrichten
   - `[App Check] Token verification failed` Warnungen
   - Action Names für Analytics

---

## 🎯 **Erwartete Ergebnisse nach Enforcement**

### Vorher (ohne Enforcement):
- ✅ Legitime Requests funktionieren
- ⚠️ Bot-Requests funktionieren auch (unsicher)

### Nachher (mit Enforcement):
- ✅ Legitime Requests funktionieren weiterhin
- ❌ Bot-Requests werden blockiert
- 📊 Security Events werden geloggt
- 🔒 Erhöhte Sicherheit gegen Missbrauch

---

**Last Updated:** 2025-12-29
**Status:** ⚠️ **BEREIT FÜR AKTIVIERUNG UND TEST**

