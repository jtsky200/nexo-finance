# Automatisches Synchronisations-Script
# Dieses Script hilft dir, die Codes von Firebase zu holen und automatisch zu synchronisieren

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Automatische Firebase → GitHub Synchronisation          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Schritt 1: Backup erstellen
Write-Host "[SCHRITT 1] Erstelle Backup..." -ForegroundColor Yellow
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupDir = "backup-before-sync-$timestamp"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

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
    }
}

Write-Host "✓ Backup erstellt: $backupDir" -ForegroundColor Green
Write-Host ""

# Schritt 2: Git Stash
Write-Host "[SCHRITT 2] Sichere Git-Änderungen..." -ForegroundColor Yellow
$status = git status --short
if ($status) {
    git stash push -m "Backup vor Firebase-Sync $timestamp" | Out-Null
    Write-Host "✓ Änderungen gestasht" -ForegroundColor Green
} else {
    Write-Host "✓ Keine Änderungen zu stashen" -ForegroundColor Green
}
Write-Host ""

# Schritt 3: Anleitung zum Kopieren der Codes
Write-Host "[SCHRITT 3] Codes von Firebase holen" -ForegroundColor Yellow
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "WICHTIG: Kopiere die Codes von Firebase Console" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Öffne Firebase Console:" -ForegroundColor White
Write-Host "   https://console.firebase.google.com/" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Für Functions (Backend):" -ForegroundColor White
Write-Host "   → Gehe zu: Functions → Code anzeigen" -ForegroundColor Gray
Write-Host "   → Öffne: functions/src/trpc.ts" -ForegroundColor Gray
Write-Host "   → Kopiere den GESAMTEN Inhalt" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Für Hosting (Frontend):" -ForegroundColor White
Write-Host "   → Gehe zu: Hosting → Code anzeigen" -ForegroundColor Gray
Write-Host "   → Kopiere die folgenden Dateien:" -ForegroundColor Gray
Write-Host "     • client/src/pages/AIChat.tsx" -ForegroundColor Gray
Write-Host "     • client/src/components/AIChatBox.tsx" -ForegroundColor Gray
Write-Host "     • client/src/components/AIChatDialog.tsx (falls geändert)" -ForegroundColor Gray
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Schritt 4: Codes einfügen
Write-Host "[SCHRITT 4] Codes einfügen" -ForegroundColor Yellow
Write-Host ""
Write-Host "Ich werde jetzt die Dateien öffnen, damit du die Codes einfügen kannst:" -ForegroundColor White
Write-Host ""

# Öffne die Dateien im Standard-Editor
$files = @(
    "functions\src\trpc.ts",
    "client\src\pages\AIChat.tsx",
    "client\src\components\AIChatBox.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Öffne: $file" -ForegroundColor Gray
        Start-Process notepad.exe $file
        Start-Sleep -Seconds 1
    }
}

Write-Host ""
Write-Host "→ Die Dateien wurden im Editor geöffnet" -ForegroundColor Green
Write-Host "→ Ersetze den Inhalt jeder Datei mit dem Code von Firebase" -ForegroundColor Yellow
Write-Host "→ Speichere die Dateien (Strg+S)" -ForegroundColor Yellow
Write-Host ""

$continue = Read-Host "Hast du alle Codes eingefügt und gespeichert? (j/n)"
if ($continue -ne "j" -and $continue -ne "J") {
    Write-Host ""
    Write-Host "Bitte füge die Codes ein und starte das Script erneut." -ForegroundColor Yellow
    Write-Host "Backup-Verzeichnis: $backupDir" -ForegroundColor Gray
    exit
}

# Schritt 5: Build testen
Write-Host ""
Write-Host "[SCHRITT 5] Teste Builds..." -ForegroundColor Yellow

# Functions Build
Write-Host "→ Teste Functions Build..." -ForegroundColor Gray
Push-Location functions
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Functions Build erfolgreich" -ForegroundColor Green
} else {
    Write-Host "✗ Functions Build fehlgeschlagen!" -ForegroundColor Red
    $continue = Read-Host "Trotzdem fortfahren? (j/n)"
    if ($continue -ne "j" -and $continue -ne "J") {
        Pop-Location
        Write-Host "Abgebrochen. Backup-Verzeichnis: $backupDir" -ForegroundColor Yellow
        exit
    }
}
Pop-Location

# Client Build
Write-Host "→ Teste Client Build..." -ForegroundColor Gray
Push-Location client
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Client Build erfolgreich" -ForegroundColor Green
} else {
    Write-Host "✗ Client Build fehlgeschlagen!" -ForegroundColor Red
    $continue = Read-Host "Trotzdem fortfahren? (j/n)"
    if ($continue -ne "j" -and $continue -ne "J") {
        Pop-Location
        Write-Host "Abgebrochen. Backup-Verzeichnis: $backupDir" -ForegroundColor Yellow
        exit
    }
}
Pop-Location

# Schritt 6: Git Commit
Write-Host ""
Write-Host "[SCHRITT 6] Committe und pushe zu GitHub..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Geänderte Dateien:" -ForegroundColor Cyan
git status --short
Write-Host ""

$commit = Read-Host "Möchtest du diese Änderungen committen und pushen? (j/n)"
if ($commit -eq "j" -or $commit -eq "J") {
    git add .
    git commit -m "sync: Synchronisiere funktionierende Codes von Firebase (manus.ai)"
    
    Write-Host ""
    Write-Host "→ Pushe zu GitHub..." -ForegroundColor Gray
    git push origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Erfolgreich zu GitHub gepusht!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "✗ Fehler beim Push. Bitte manuell pushen:" -ForegroundColor Red
        Write-Host "  git push origin main" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "Übersprungen. Du kannst später manuell committen:" -ForegroundColor Yellow
    Write-Host "  git add ." -ForegroundColor Gray
    Write-Host "  git commit -m 'sync: Synchronisiere funktionierende Codes von Firebase'" -ForegroundColor Gray
    Write-Host "  git push" -ForegroundColor Gray
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  Synchronisation abgeschlossen!                            ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Nächster Schritt: Deploye zu Firebase:" -ForegroundColor Yellow
Write-Host "  firebase deploy --only functions,hosting" -ForegroundColor Gray
Write-Host ""
Write-Host "Backup-Verzeichnis: $backupDir" -ForegroundColor Gray
Write-Host "Stash-Name: Backup vor Firebase-Sync $timestamp" -ForegroundColor Gray
Write-Host ""

