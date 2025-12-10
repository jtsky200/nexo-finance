# Live Test Script for Nexo Application
# Tests critical functionality on the live deployment

$BASE_URL = "https://nexo-jtsky100.web.app"

Write-Host "🚀 Starting Live Test for Nexo Application..." -ForegroundColor Cyan
Write-Host "Testing URL: $BASE_URL`n" -ForegroundColor Cyan

$tests = @(
    @{ Name = "1. Homepage Loads"; Url = $BASE_URL; Expected = "Nexo|Login|Dashboard" },
    @{ Name = "2. Login Page"; Url = "$BASE_URL/login"; Expected = "Login|Anmelden|email" },
    @{ Name = "3. Dashboard Page"; Url = "$BASE_URL/dashboard"; Expected = "Dashboard|Termine|Finanz" },
    @{ Name = "4. Finance Page"; Url = "$BASE_URL/finance"; Expected = "Finance|Finanzen|Einnahmen" },
    @{ Name = "5. People Page"; Url = "$BASE_URL/people"; Expected = "People|Personen|Haushalt" },
    @{ Name = "6. Bills Page"; Url = "$BASE_URL/bills"; Expected = "Bills|Rechnungen|Zahlungen" },
    @{ Name = "7. Calendar Page"; Url = "$BASE_URL/calendar"; Expected = "Calendar|Kalender|Termin" },
    @{ Name = "8. Shopping Page"; Url = "$BASE_URL/shopping"; Expected = "Shopping|Einkauf|Liste" },
    @{ Name = "9. Reminders Page"; Url = "$BASE_URL/reminders"; Expected = "Reminder|Erinnerung|Termin" },
    @{ Name = "10. Taxes Page"; Url = "$BASE_URL/taxes"; Expected = "Tax|Steuer|Profil" }
)

$results = @()

foreach ($test in $tests) {
    Write-Host "Testing: $($test.Name)..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri $test.Url -Method Get -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            $content = $response.Content
            $pattern = $test.Expected -split '\|'
            $matched = $false
            
            foreach ($p in $pattern) {
                if ($content -match $p) {
                    $matched = $true
                    break
                }
            }
            
            $result = @{
                Name = $test.Name
                Url = $test.Url
                Status = $response.StatusCode
                Passed = $matched
                Message = if ($matched) { "✅ PASS" } else { "⚠️ Page loads but content check failed" }
            }
            
            Write-Host "  $(if ($matched) { '✅' } else { '⚠️' }) Status: $($response.StatusCode) - $(if ($matched) { 'PASS' } else { 'Content check failed' })" -ForegroundColor $(if ($matched) { "Green" } else { "Yellow" })
        } else {
            $result = @{
                Name = $test.Name
                Url = $test.Url
                Status = $response.StatusCode
                Passed = $false
                Message = "❌ FAIL - Status: $($response.StatusCode)"
            }
            Write-Host "  ❌ Status: $($response.StatusCode) - FAIL" -ForegroundColor Red
        }
        
        $results += $result
    } catch {
        $result = @{
            Name = $test.Name
            Url = $test.Url
            Status = "ERROR"
            Passed = $false
            Message = "❌ ERROR - $($_.Exception.Message)"
        }
        Write-Host "  ❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
        $results += $result
    }
}

Write-Host "`n📊 Test Results Summary:" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan

$passed = ($results | Where-Object { $_.Passed }).Count
$failed = ($results | Where-Object { -not $_.Passed }).Count

foreach ($result in $results) {
    Write-Host "$(if ($result.Passed) { '✅' } else { '❌' }) $($result.Name)" -ForegroundColor $(if ($result.Passed) { "Green" } else { "Red" })
    Write-Host "   URL: $($result.Url)"
    Write-Host "   $($result.Message)"
    Write-Host ""
}

Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host "Total: $($results.Count) tests" -ForegroundColor Cyan
Write-Host "✅ Passed: $passed" -ForegroundColor Green
Write-Host "❌ Failed: $failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host "Success Rate: $([math]::Round(($passed / $results.Count) * 100, 1))%" -ForegroundColor Cyan

if ($failed -eq 0) {
    Write-Host "`n🎉 All tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n⚠️ Some tests failed. Please review the results above." -ForegroundColor Yellow
    exit 1
}

