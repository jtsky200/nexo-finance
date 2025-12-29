# 🔒 App Check Enforcement aktivieren

## 📋 **Schritt-für-Schritt Anleitung**

### Schritt 1: Firebase Console öffnen

1. Gehen Sie zu: https://console.firebase.google.com/project/nexo-jtsky100/appcheck
2. Oder: Firebase Console → Projekt auswählen → **App Check** im linken Menü

---

### Schritt 2: Enforcement für Cloud Functions aktivieren

1. Klicken Sie auf **"Cloud Functions"** (oder suchen Sie nach "Functions")
2. Finden Sie Ihre App: **"NEXO Web-App"**
3. Klicken Sie auf das **Drei-Punkte-Menü** (⋮) neben Ihrer App
4. Wählen Sie **"Enforcement aktivieren"** oder **"Enable enforcement"**
5. Bestätigen Sie die Aktivierung

**⚠️ Wichtig:** Nach Aktivierung werden alle Requests ohne gültige App Check Tokens blockiert!

---

### Schritt 3: Enforcement für Firestore aktivieren

1. Klicken Sie auf **"Cloud Firestore"** (oder suchen Sie nach "Firestore")
2. Finden Sie Ihre App: **"NEXO Web-App"**
3. Klicken Sie auf das **Drei-Punkte-Menü** (⋮) neben Ihrer App
4. Wählen Sie **"Enforcement aktivieren"** oder **"Enable enforcement"**
5. Bestätigen Sie die Aktivierung

---

### Schritt 4: Enforcement für Storage aktivieren (optional)

1. Klicken Sie auf **"Cloud Storage"** (oder suchen Sie nach "Storage")
2. Finden Sie Ihre App: **"NEXO Web-App"**
3. Klicken Sie auf das **Drei-Punkte-Menü** (⋮) neben Ihrer App
4. Wählen Sie **"Enforcement aktivieren"** oder **"Enable enforcement"**
5. Bestätigen Sie die Aktivierung

---

## ✅ **Nach der Aktivierung**

### Was passiert:

- ✅ **Legitime Requests** (mit gültigen App Check Tokens) → Werden durchgelassen
- ❌ **Suspicious Requests** (ohne Tokens oder mit ungültigen Tokens) → Werden blockiert
- 📊 **Security Events** werden in Firestore `securityEvents` Collection geloggt

### Monitoring:

1. **Firebase Console → App Check → Metrics**
   - Sehen Sie Token-Anfragen und Verifizierungen
   - Überwachen Sie fehlgeschlagene Verifizierungen

2. **Firestore → securityEvents Collection**
   - Prüfen Sie geloggte Security Events
   - Überwachen Sie `invalid_token` Events (niedrige reCAPTCHA Scores)

3. **Cloud Functions → Logs**
   - Sehen Sie `[App Check] Token verified` Nachrichten
   - Überwachen Sie `[App Check] Token verification failed` Warnungen

---

## ⚠️ **Wichtige Hinweise**

### Vor der Aktivierung:

1. ✅ **Stellen Sie sicher, dass App Check funktioniert:**
   - Browser Console zeigt `[App Check] Initialized successfully`
   - Network-Tab zeigt `X-Firebase-AppCheck` Header in Requests
   - Backend-Logs zeigen erfolgreiche Token-Verifizierungen

2. ✅ **Testen Sie alle wichtigen Funktionen:**
   - Login/Registrierung
   - API-Calls (tRPC Requests)
   - Firestore Reads/Writes
   - Storage Uploads/Downloads

### Nach der Aktivierung:

- ⚠️ **Entwicklung:** Wenn Sie lokal entwickeln, müssen Sie localhost zur App Check Domain-Liste hinzufügen
- ⚠️ **Monitoring:** Überwachen Sie die ersten Stunden nach Aktivierung auf blockierte Requests
- ⚠️ **Rollback:** Falls Probleme auftreten, können Sie Enforcement jederzeit deaktivieren

---

## 🔄 **Rollback (Falls nötig)**

Falls Sie Enforcement deaktivieren müssen:

1. Gehen Sie zu Firebase Console → App Check
2. Klicken Sie auf den entsprechenden Service (Functions/Firestore/Storage)
3. Klicken Sie auf das **Drei-Punkte-Menü** (⋮) neben Ihrer App
4. Wählen Sie **"Enforcement deaktivieren"** oder **"Disable enforcement"**

---

## 📊 **Erwartete Ergebnisse**

Nach Aktivierung sollten Sie sehen:

- ✅ **Erhöhte Sicherheit:** Bot-Requests werden blockiert
- ✅ **Security Events:** Mehr `invalid_token` Events in Firestore (niedrige Scores werden blockiert)
- ✅ **Bessere Analytics:** Detaillierte Metriken in Firebase Console
- ✅ **Schutz vor Missbrauch:** Billing Fraud und Phishing-Angriffe werden reduziert

---

**Last Updated:** 2025-12-29
**Status:** ⚠️ **BEREIT FÜR AKTIVIERUNG** (nach Live-Test)

