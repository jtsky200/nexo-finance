# Firebase ↔ GitHub Synchronisation

## Problem
Die Codes in Firebase (von manus.ai bearbeitet) sind nicht synchron mit GitHub (alte Codes von Cursor).

## Lösung: Zwei-Wege-Synchronisation

### Option 1: Firebase → GitHub (Empfohlen)
Wenn die Codes in Firebase funktionieren und die in GitHub nicht:

1. **Backup der aktuellen lokalen Dateien erstellen:**
```bash
cd nexo-export
git stash  # Speichert aktuelle Änderungen
```

2. **Firebase Functions herunterladen (falls möglich):**
   - Firebase Console → Functions → Code anzeigen
   - Oder: Die funktionierenden Codes manuell kopieren

3. **Codes in lokale Dateien einfügen:**
   - `functions/src/trpc.ts`
   - `client/src/pages/AIChat.tsx`
   - `client/src/components/AIChatBox.tsx`
   - Alle anderen geänderten Dateien

4. **Testen:**
```bash
cd functions
npm run build
cd ../client
npm run build
```

5. **In Git committen:**
```bash
git add .
git commit -m "sync: Synchronisiere funktionierende Codes von Firebase"
git push
```

6. **Firebase neu deployen (um sicherzustellen, dass alles synchron ist):**
```bash
firebase deploy --only functions,hosting
```

### Option 2: GitHub → Firebase
Wenn die Codes in GitHub aktueller sind:

```bash
cd nexo-export
git pull origin main
firebase deploy --only functions,hosting
```

## Automatische Synchronisation

Um zukünftige Probleme zu vermeiden:

1. **Immer zuerst in Git committen, dann deployen:**
```bash
git add .
git commit -m "feat: Beschreibung der Änderung"
git push
firebase deploy
```

2. **Nie direkt in Firebase bearbeiten** - immer lokal entwickeln und dann deployen

## Welche Dateien wurden geändert?

Bitte teile mir mit, welche Dateien in Firebase geändert wurden, damit ich sie synchronisieren kann:

- [ ] `functions/src/trpc.ts`
- [ ] `client/src/pages/AIChat.tsx`
- [ ] `client/src/components/AIChatBox.tsx`
- [ ] `client/src/components/AIChatDialog.tsx`
- [ ] Andere: _______________

## Nächste Schritte

1. **Sofort:** Backup der aktuellen funktionierenden Codes erstellen
2. **Dann:** Codes in Git committen
3. **Abschließend:** Firebase neu deployen, um Synchronisation zu bestätigen

