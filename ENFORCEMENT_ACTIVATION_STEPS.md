# 🔒 App Check Enforcement - Schritt-für-Schritt Aktivierung

## ⚡ **Schnell-Anleitung (3 Minuten)**

### Schritt 1: Firebase Console öffnen

**Direkter Link:** https://console.firebase.google.com/project/nexo-jtsky100/appcheck

**Oder:**
1. Gehen Sie zu: https://console.firebase.google.com
2. Wählen Sie Projekt: **nexo-jtsky100**
3. Klicken Sie im linken Menü auf **"Build"** → **"App Check"**

---

### Schritt 2: Enforcement für Cloud Functions aktivieren

1. **Klicken Sie auf Tab:** **"Cloud Functions"** (oben in der App Check-Seite)
2. **Finden Sie:** **"NEXO Web-App"** in der Liste
3. **Klicken Sie auf:** Das **Drei-Punkte-Menü** (⋮) rechts neben "NEXO Web-App"
4. **Wählen Sie:** **"Enforce"** oder **"Enforcement aktivieren"**
5. **Bestätigen Sie:** Klicken Sie auf **"Enforce"** im Bestätigungsdialog

**✅ Status:** Cloud Functions Enforcement ist jetzt aktiviert

---

### Schritt 3: Enforcement für Firestore aktivieren

1. **Klicken Sie auf Tab:** **"Cloud Firestore"** (oben in der App Check-Seite)
2. **Finden Sie:** **"NEXO Web-App"** in der Liste
3. **Klicken Sie auf:** Das **Drei-Punkte-Menü** (⋮) rechts neben "NEXO Web-App"
4. **Wählen Sie:** **"Enforce"** oder **"Enforcement aktivieren"**
5. **Bestätigen Sie:** Klicken Sie auf **"Enforce"** im Bestätigungsdialog

**✅ Status:** Firestore Enforcement ist jetzt aktiviert

---

### Schritt 4: Enforcement für Storage aktivieren (optional)

1. **Klicken Sie auf Tab:** **"Cloud Storage"** (oben in der App Check-Seite)
2. **Finden Sie:** **"NEXO Web-App"** in der Liste
3. **Klicken Sie auf:** Das **Drei-Punkte-Menü** (⋮) rechts neben "NEXO Web-App"
4. **Wählen Sie:** **"Enforce"** oder **"Enforcement aktivieren"**
5. **Bestätigen Sie:** Klicken Sie auf **"Enforce"** im Bestätigungsdialog

**✅ Status:** Storage Enforcement ist jetzt aktiviert

---

## ⏱️ **Wartezeit**

- Enforcement wird innerhalb von **1-15 Minuten** aktiv
- Sie erhalten eine Bestätigung in der Console
- Die App funktioniert weiterhin normal (mit gültigen Tokens)

---

## ✅ **Nach der Aktivierung**

### Was passiert:

- ✅ **Legitime Requests** (mit gültigen App Check Tokens) → Werden durchgelassen
- ❌ **Bot-Requests** (ohne Tokens oder mit ungültigen Tokens) → Werden blockiert
- 📊 **Security Events** werden in Firestore `securityEvents` Collection geloggt

### Testen:

1. Öffnen Sie: https://nexo-jtsky100.web.app
2. Loggen Sie sich ein
3. Alle Funktionen sollten normal funktionieren
4. Bot-Requests werden automatisch blockiert

---

## 📊 **Monitoring**

### Firebase Console → App Check → Metrics

- Token-Anfragen pro Tag
- Erfolgreiche vs. fehlgeschlagene Verifizierungen
- Top Actions (login, submit, etc.)

### Firestore → securityEvents Collection

- `invalid_token` Events (niedrige Scores)
- `auth_success` Events (erfolgreiche Authentifizierungen)

---

**Last Updated:** 2025-12-29
**Status:** ⚠️ **BEREIT FÜR AKTIVIERUNG**

