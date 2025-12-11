# Quick Sync Script - Führt die Synchronisation Schritt für Schritt durch
# FOLGE DEN ANWEISUNGEN AUF DEM BILDSCHIRM

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Firebase → GitHub Synchronisation                        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Schritt 1: Backup
Write-Host "[SCHRITT 1/6] Erstelle Backup..." -ForegroundColor Yellow
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
Write-Host "[SCHRITT 2/6] Sichere Git-Änderungen..." -ForegroundColor Yellow
$status = git status --short
if ($status) {
    git stash push -m "Backup vor Firebase-Sync $timestamp" | Out-Null
    Write-Host "✓ Änderungen gestasht" -ForegroundColor Green
} else {
    Write-Host "✓ Keine Änderungen zu stashen" -ForegroundColor Green
}
Write-Host ""

# Schritt 3: Hinweis
Write-Host "[SCHRITT 3/6] WICHTIG: Codes von Firebase holen" -ForegroundColor Yellow
Write-Host ""
Write-Host "Du musst jetzt die funktionierenden Codes von Firebase holen:" -ForegroundColor White
Write-Host ""
Write-Host "1. Gehe zu Firebase Console:" -ForegroundColor Cyan
Write-Host "   https://console.firebase.google.com/" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Für Functions:" -ForegroundColor Cyan
Write-Host "   Functions → Code anzeigen → functions/src/trpc.ts kopieren" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Für Hosting:" -ForegroundColor Cyan
Write-Host "   Hosting → Code anzeigen → Geänderte Dateien kopieren" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Füge die Codes in die lokalen Dateien ein:" -ForegroundColor Cyan
Write-Host "   - nexo-export\functions\src\trpc.ts" -ForegroundColor Gray
Write-Host "   - nexo-export\client\src\pages\AIChat.tsx" -ForegroundColor Gray
Write-Host "   - nexo-export\client\src\components\AIChatBox.tsx" -ForegroundColor Gray
Write-Host ""
$continue = Read-Host "Hast du die Codes eingefügt? (j/n)"
if ($continue -ne "j" -and $continue -ne "J") {
    Write-Host ""
    Write-Host "Bitte führe die Schritte oben aus und starte das Script erneut." -ForegroundColor Yellow
    Write-Host "Backup-Verzeichnis: $backupDir" -ForegroundColor Gray
    exit
}
Write-Host ""

# Schritt 4: Testen
Write-Host "[SCHRITT 4/6] Teste Functions Build..." -ForegroundColor Yellow
Push-Location functions
try {
    $buildResult = npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Functions Build erfolgreich" -ForegroundColor Green
    } else {
        Write-Host "✗ Functions Build fehlgeschlagen!" -ForegroundColor Red
        Write-Host $buildResult
        $continue = Read-Host "Trotzdem fortfahren? (j/n)"
        if ($continue -ne "j" -and $continue -ne "J") {
            Pop-Location
            Write-Host "Abgebrochen. Backup-Verzeichnis: $backupDir" -ForegroundColor Yellow
            exit
        }
    }
} catch {
    Write-Host "✗ Fehler beim Build: $_" -ForegroundColor Red
    $continue = Read-Host "Trotzdem fortfahren? (j/n)"
    if ($continue -ne "j" -and $continue -ne "J") {
        Pop-Location
        exit
    }
}
Pop-Location
Write-Host ""

Write-Host "[SCHRITT 5/6] Teste Client Build..." -ForegroundColor Yellow
Push-Location client
try {
    $buildResult = npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Client Build erfolgreich" -ForegroundColor Green
    } else {
        Write-Host "✗ Client Build fehlgeschlagen!" -ForegroundColor Red
        Write-Host $buildResult
        $continue = Read-Host "Trotzdem fortfahren? (j/n)"
        if ($continue -ne "j" -and $continue -ne "J") {
            Pop-Location
            Write-Host "Abgebrochen. Backup-Verzeichnis: $backupDir" -ForegroundColor Yellow
            exit
        }
    }
} catch {
    Write-Host "✗ Fehler beim Build: $_" -ForegroundColor Red
    $continue = Read-Host "Trotzdem fortfahren? (j/n)"
    if ($continue -ne "j" -and $continue -ne "J") {
        Pop-Location
        exit
    }
}
Pop-Location
Write-Host ""

# Schritt 5: Git Commit
Write-Host "[SCHRITT 6/6] Committe und pushe zu GitHub..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Änderungen:" -ForegroundColor Cyan
git status --short
Write-Host ""

$commit = Read-Host "Möchtest du diese Änderungen committen und pushen? (j/n)"
if ($commit -eq "j" -or $commit -eq "J") {
    git add .
    git commit -m "sync: Synchronisiere funktionierende Codes von Firebase (manus.ai)"
    git push origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Erfolgreich zu GitHub gepusht!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Nächster Schritt: Deploye zu Firebase:" -ForegroundColor Yellow
        Write-Host "  firebase deploy --only functions,hosting" -ForegroundColor Gray
    } else {
        Write-Host ""
        Write-Host "✗ Fehler beim Push zu GitHub" -ForegroundColor Red
        Write-Host "Bitte manuell pushen: git push origin main" -ForegroundColor Yellow
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
Write-Host "Backup-Verzeichnis: $backupDir" -ForegroundColor Gray
Write-Host "Stash-Name: Backup vor Firebase-Sync $timestamp" -ForegroundColor Gray
Write-Host ""

