# PowerShell Script zum sicheren Synchronisieren von Firebase zu GitHub
# Dieses Script hilft dabei, die funktionierenden Codes von Firebase in Git zu bringen

Write-Host "=== Firebase → GitHub Synchronisation (Sicher) ===" -ForegroundColor Cyan
Write-Host ""

# 1. Backup erstellen
Write-Host "1. Erstelle Backup der aktuellen Dateien..." -ForegroundColor Yellow
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupDir = "backup-before-sync-$timestamp"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

# Backup der wichtigsten Chat-Dateien
$filesToBackup = @(
    "functions\src\trpc.ts",
    "client\src\pages\AIChat.tsx",
    "client\src\components\AIChatBox.tsx",
    "client\src\components\AIChatDialog.tsx"
)

foreach ($file in $filesToBackup) {
    if (Test-Path $file) {
        $backupPath = Join-Path $backupDir (Split-Path $file -Leaf)
        Copy-Item -Path $file -Destination $backupPath -ErrorAction SilentlyContinue
        Write-Host "   ✓ Gesichert: $file" -ForegroundColor Gray
    }
}

Write-Host "   ✓ Backup erstellt in: $backupDir" -ForegroundColor Green
Write-Host ""

# 2. Git Status prüfen
Write-Host "2. Prüfe Git Status..." -ForegroundColor Yellow
$status = git status --short
if ($status) {
    Write-Host "   ⚠ Uncommitted changes gefunden:" -ForegroundColor Yellow
    Write-Host $status
    Write-Host ""
    Write-Host "   Diese Änderungen werden in einem Stash gespeichert..." -ForegroundColor Yellow
    git stash push -m "Backup vor Firebase-Sync $timestamp"
    Write-Host "   ✓ Änderungen gestasht" -ForegroundColor Green
} else {
    Write-Host "   ✓ Keine uncommitted changes" -ForegroundColor Green
}
Write-Host ""

# 3. Hinweis für manuelle Schritte
Write-Host "3. Nächste Schritte:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   SCHRITT 1: Codes von Firebase holen" -ForegroundColor Cyan
Write-Host "   → Gehe zu Firebase Console:" -ForegroundColor White
Write-Host "     https://console.firebase.google.com/" -ForegroundColor Gray
Write-Host ""
Write-Host "   → Für Functions:" -ForegroundColor White
Write-Host "     Functions → Code anzeigen → Kopiere functions/src/trpc.ts" -ForegroundColor Gray
Write-Host ""
Write-Host "   → Für Hosting (Client):" -ForegroundColor White
Write-Host "     Hosting → Code anzeigen → Kopiere die geänderten Dateien:" -ForegroundColor Gray
Write-Host "     - client/src/pages/AIChat.tsx" -ForegroundColor Gray
Write-Host "     - client/src/components/AIChatBox.tsx" -ForegroundColor Gray
Write-Host "     - client/src/components/AIChatDialog.tsx (falls geändert)" -ForegroundColor Gray
Write-Host ""
Write-Host "   SCHRITT 2: Codes in lokale Dateien einfügen" -ForegroundColor Cyan
Write-Host "   → Öffne die Dateien im Editor" -ForegroundColor White
Write-Host "   → Ersetze den Inhalt mit den Codes von Firebase" -ForegroundColor White
Write-Host ""
Write-Host "   SCHRITT 3: Testen" -ForegroundColor Cyan
Write-Host "   → Führe aus:" -ForegroundColor White
Write-Host "     cd functions" -ForegroundColor Gray
Write-Host "     npm run build" -ForegroundColor Gray
Write-Host "     cd ..\client" -ForegroundColor Gray
Write-Host "     npm run build" -ForegroundColor Gray
Write-Host ""
Write-Host "   SCHRITT 4: Committen und Pushen" -ForegroundColor Cyan
Write-Host "   → Führe aus:" -ForegroundColor White
Write-Host "     git add ." -ForegroundColor Gray
Write-Host "     git commit -m 'sync: Synchronisiere funktionierende Codes von Firebase'" -ForegroundColor Gray
Write-Host "     git push" -ForegroundColor Gray
Write-Host ""
Write-Host "   SCHRITT 5: Firebase neu deployen (um Synchronisation zu bestätigen)" -ForegroundColor Cyan
Write-Host "   → Führe aus:" -ForegroundColor White
Write-Host "     firebase deploy --only functions,hosting" -ForegroundColor Gray
Write-Host ""

Write-Host "=== Backup-Informationen ===" -ForegroundColor Cyan
Write-Host "Backup-Verzeichnis: $backupDir" -ForegroundColor Gray
Write-Host "Stash-Name: Backup vor Firebase-Sync $timestamp" -ForegroundColor Gray
Write-Host ""
Write-Host "Falls etwas schief geht, kannst du das Backup wiederherstellen:" -ForegroundColor Yellow
Write-Host "  git stash pop  # Stash wiederherstellen" -ForegroundColor Gray
Write-Host "  # Oder Dateien manuell aus $backupDir kopieren" -ForegroundColor Gray
Write-Host ""

