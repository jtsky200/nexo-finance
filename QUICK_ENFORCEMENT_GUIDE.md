# ⚡ Schnelle Enforcement-Aktivierung

## 🚀 **In 3 Minuten aktiviert**

### Schritt 1: Firebase Console öffnen

**Direkter Link:** https://console.firebase.google.com/project/nexo-jtsky100/appcheck

Oder:
1. Gehen Sie zu: https://console.firebase.google.com
2. Wählen Sie Projekt: **nexo-jtsky100**
3. Klicken Sie im linken Menü auf **App Check**

---

### Schritt 2: Enforcement für Cloud Functions aktivieren

1. Klicken Sie auf **"Cloud Functions"** Tab
2. Finden Sie **"NEXO Web-App"** in der Liste
3. Klicken Sie auf das **Drei-Punkte-Menü** (⋮) rechts neben der App
4. Klicken Sie auf **"Enforce"** oder **"Enforcement aktivieren"**
5. Bestätigen Sie mit **"Enforce"**

**✅ Fertig!** Cloud Functions sind jetzt geschützt.

---

### Schritt 3: Enforcement für Firestore aktivieren

1. Klicken Sie auf **"Cloud Firestore"** Tab
2. Finden Sie **"NEXO Web-App"** in der Liste
3. Klicken Sie auf das **Drei-Punkte-Menü** (⋮) rechts neben der App
4. Klicken Sie auf **"Enforce"** oder **"Enforcement aktivieren"**
5. Bestätigen Sie mit **"Enforce"**

**✅ Fertig!** Firestore ist jetzt geschützt.

---

### Schritt 4: Enforcement für Storage aktivieren (optional)

1. Klicken Sie auf **"Cloud Storage"** Tab
2. Finden Sie **"NEXO Web-App"** in der Liste
3. Klicken Sie auf das **Drei-Punkte-Menü** (⋮) rechts neben der App
4. Klicken Sie auf **"Enforce"** oder **"Enforcement aktivieren"**
5. Bestätigen Sie mit **"Enforce"**

**✅ Fertig!** Storage ist jetzt geschützt.

---

## ⏱️ **Wartezeit**

- Enforcement wird innerhalb von **1-15 Minuten** aktiv
- Sie erhalten eine Bestätigung in der Console
- Die App funktioniert weiterhin normal (mit gültigen Tokens)

---

## ✅ **Nach der Aktivierung**

### Was passiert:

- ✅ **Legitime Requests** → Werden durchgelassen
- ❌ **Bot-Requests** → Werden blockiert
- 📊 **Security Events** → Werden in Firestore geloggt

### Testen:

1. Öffnen Sie: https://nexo-jtsky100.web.app
2. Loggen Sie sich ein
3. Alle Funktionen sollten normal funktionieren
4. Bot-Requests werden automatisch blockiert

---

**Status:** ⚠️ **BEREIT FÜR AKTIVIERUNG**

