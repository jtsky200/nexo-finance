# PowerShell Script zum Synchronisieren von Firebase zu Git
# Dieses Script hilft dabei, die funktionierenden Codes von Firebase in Git zu bringen

Write-Host "=== Firebase → GitHub Synchronisation ===" -ForegroundColor Cyan
Write-Host ""

# 1. Backup erstellen
Write-Host "1. Erstelle Backup der aktuellen Dateien..." -ForegroundColor Yellow
$backupDir = "backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
Copy-Item -Path "functions\src\trpc.ts" -Destination "$backupDir\trpc.ts" -ErrorAction SilentlyContinue
Copy-Item -Path "client\src\pages\AIChat.tsx" -Destination "$backupDir\AIChat.tsx" -ErrorAction SilentlyContinue
Copy-Item -Path "client\src\components\AIChatBox.tsx" -Destination "$backupDir\AIChatBox.tsx" -ErrorAction SilentlyContinue
Write-Host "   ✓ Backup erstellt in: $backupDir" -ForegroundColor Green
Write-Host ""

# 2. Git Status prüfen
Write-Host "2. Prüfe Git Status..." -ForegroundColor Yellow
$status = git status --short
if ($status) {
    Write-Host "   ⚠ Uncommitted changes gefunden:" -ForegroundColor Yellow
    Write-Host $status
    Write-Host ""
    $response = Read-Host "   Möchtest du diese Änderungen stashen? (j/n)"
    if ($response -eq "j" -or $response -eq "J") {
        git stash push -m "Backup vor Firebase-Sync $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        Write-Host "   ✓ Änderungen gestasht" -ForegroundColor Green
    }
} else {
    Write-Host "   ✓ Keine uncommitted changes" -ForegroundColor Green
}
Write-Host ""

# 3. Hinweis für manuelle Schritte
Write-Host "3. Nächste Schritte:" -ForegroundColor Yellow
Write-Host "   → Kopiere die funktionierenden Codes von Firebase in die lokalen Dateien:" -ForegroundColor White
Write-Host "     - functions/src/trpc.ts" -ForegroundColor Gray
Write-Host "     - client/src/pages/AIChat.tsx" -ForegroundColor Gray
Write-Host "     - client/src/components/AIChatBox.tsx" -ForegroundColor Gray
Write-Host "     - Weitere geänderte Dateien..." -ForegroundColor Gray
Write-Host ""
Write-Host "   → Teste die Codes lokal:" -ForegroundColor White
Write-Host "     cd functions && npm run build" -ForegroundColor Gray
Write-Host "     cd client && npm run build" -ForegroundColor Gray
Write-Host ""
Write-Host "   → Committe und pushe die Änderungen:" -ForegroundColor White
Write-Host "     git add ." -ForegroundColor Gray
Write-Host "     git commit -m 'sync: Synchronisiere funktionierende Codes von Firebase'" -ForegroundColor Gray
Write-Host "     git push" -ForegroundColor Gray
Write-Host ""
Write-Host "   → Deploye zu Firebase (um Synchronisation zu bestätigen):" -ForegroundColor White
Write-Host "     firebase deploy --only functions,hosting" -ForegroundColor Gray
Write-Host ""

Write-Host "=== Fertig ===" -ForegroundColor Cyan
Write-Host "Backup-Verzeichnis: $backupDir" -ForegroundColor Gray

