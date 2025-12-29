# ✅ App Check - Manuelle Test-Checkliste

## 🎯 **Schnell-Test (2 Minuten)**

### ✅ **Test 1: Browser Console prüfen**

1. **Öffnen Sie:** https://nexo-jtsky100.web.app (oder https://nexo.report)
2. **Öffnen Sie Browser DevTools:** Drücken Sie `F12`
3. **Gehen Sie zu:** **Console** Tab
4. **Suchen Sie nach:** `[App Check] Initialized successfully`

**✅ Erfolg:** Diese Nachricht sollte erscheinen  
**❌ Fehler:** Keine Nachricht = App Check nicht initialisiert

---

### ✅ **Test 2: Network-Tab prüfen (App Check Tokens)**

1. **Gehen Sie zu:** **Network** Tab in DevTools
2. **Filtern Sie nach:** `trpc` oder `api`
3. **Führen Sie eine Aktion aus:**
   - Versuchen Sie sich einzuloggen (auch mit falschen Credentials)
   - Oder klicken Sie auf einen Button, der API-Calls macht
4. **Klicken Sie auf einen tRPC Request** (z.B. `/api/trpc/auth.login`)
5. **Gehen Sie zu:** **Headers** Tab
6. **Suchen Sie nach:**
   - `X-Firebase-AppCheck` → Sollte einen langen Token-String enthalten
   - `X-AppCheck-Action` → Sollte eine Action enthalten (z.B. `login`)

**✅ Erfolg:** Beide Header sind vorhanden  
**❌ Fehler:** Header fehlen = App Check Tokens werden nicht gesendet

---

## 📊 **Erweiterte Tests (optional)**

### ✅ **Test 3: Backend-Logs prüfen**

1. **Öffnen Sie:** https://console.firebase.google.com/project/nexo-jtsky100/functions/logs
2. **Führen Sie eine Aktion in der App aus** (z.B. Login-Versuch)
3. **Aktualisieren Sie die Logs**
4. **Suchen Sie nach:** `[App Check] Token verified`

**✅ Erfolg:** Diese Nachricht erscheint  
**❌ Fehler:** Keine Nachricht = Backend-Verifizierung funktioniert nicht

---

### ✅ **Test 4: Firebase Console Metrics**

1. **Öffnen Sie:** https://console.firebase.google.com/project/nexo-jtsky100/appcheck
2. **Klicken Sie auf:** **"Metrics"** Tab
3. **Prüfen Sie:**
   - Token-Anfragen sollten > 0 sein
   - Erfolgreiche Verifizierungen sollten > 0 sein

**✅ Erfolg:** Metriken zeigen Daten  
**❌ Fehler:** Keine Metriken = App Check nicht aktiv

---

## 🎯 **Test-Ergebnisse**

Bitte markieren Sie die Ergebnisse:

- [ ] **Test 1:** App Check Initialisierung → ✅ / ❌
- [ ] **Test 2:** App Check Tokens → ✅ / ❌
- [ ] **Test 3:** Backend-Verifizierung → ✅ / ❌ (optional)
- [ ] **Test 4:** Firebase Metrics → ✅ / ❌ (optional)

---

## 🚀 **Nächste Schritte**

### Wenn alle Tests ✅ erfolgreich sind:

1. **Enforcement aktivieren** (siehe `ENFORCEMENT_ACTIVATION_AND_TEST.md`)
2. **Nach Aktivierung erneut testen**
3. **Monitoring einrichten**

### Falls Tests ❌ fehlschlagen:

1. **Prüfen Sie Browser Console auf Fehler**
2. **Prüfen Sie Network-Tab auf Blockierungen**
3. **Prüfen Sie Firebase Console → App Check → Apps**

---

**Last Updated:** 2025-12-29  
**Status:** ⏳ **BEREIT FÜR MANUELLE TESTS**

