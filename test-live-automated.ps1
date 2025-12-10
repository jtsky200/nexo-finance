# Automated Live Test Script for Nexo Application
# Tests critical functionality with login

$BASE_URL = "https://nexo-jtsky100.web.app"
$LOGIN_EMAIL = "antonio10jonathan@yahoo.com"
$LOGIN_PASSWORD = "12345678"

Write-Host "🚀 Starting Automated Live Test for Nexo Application..." -ForegroundColor Cyan
Write-Host "Testing URL: $BASE_URL`n" -ForegroundColor Cyan

# Test 1: Homepage loads
Write-Host "Test 1: Homepage loads..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $BASE_URL -Method Get -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✅ Homepage loads successfully (Status: $($response.StatusCode))" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Homepage failed (Status: $($response.StatusCode))" -ForegroundColor Red
    }
} catch {
    Write-Host "  ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Login page
Write-Host "`nTest 2: Login page..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/login" -Method Get -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        $hasLoginForm = $response.Content -match "email|password|Login|Anmelden"
        if ($hasLoginForm) {
            Write-Host "  ✅ Login page loads successfully" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️ Login page loads but form not detected" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ❌ Login page failed (Status: $($response.StatusCode))" -ForegroundColor Red
    }
} catch {
    Write-Host "  ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3-10: Test all main pages
$pages = @(
    @{ Name = "Dashboard"; Path = "/dashboard" },
    @{ Name = "Finance"; Path = "/finance" },
    @{ Name = "People"; Path = "/people" },
    @{ Name = "Bills"; Path = "/bills" },
    @{ Name = "Calendar"; Path = "/calendar" },
    @{ Name = "Shopping"; Path = "/shopping" },
    @{ Name = "Reminders"; Path = "/reminders" },
    @{ Name = "Taxes"; Path = "/taxes" }
)

Write-Host "`nTesting main pages (authentication may be required):" -ForegroundColor Cyan
foreach ($page in $pages) {
    Write-Host "`nTest: $($page.Name) page..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "$BASE_URL$($page.Path)" -Method Get -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $content = $response.Content
            # Check if redirected to login or if page content is present
            if ($content -match "Login|Anmelden|email" -and $content -notmatch $page.Name) {
                Write-Host "  ⚠️ Page requires authentication (redirected to login)" -ForegroundColor Yellow
            } else {
                Write-Host "  ✅ Page loads successfully (Status: $($response.StatusCode))" -ForegroundColor Green
            }
        } else {
            Write-Host "  ❌ Page failed (Status: $($response.StatusCode))" -ForegroundColor Red
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 401 -or $statusCode -eq 403) {
            Write-Host "  ⚠️ Page requires authentication (Status: $statusCode)" -ForegroundColor Yellow
        } else {
            Write-Host "  ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host "`n" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "📋 Manual Testing Instructions:" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Open browser and navigate to: $BASE_URL" -ForegroundColor White
Write-Host "2. Login with:" -ForegroundColor White
Write-Host "   Email: $LOGIN_EMAIL" -ForegroundColor Gray
Write-Host "   Password: $LOGIN_PASSWORD" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Test the following workflows:" -ForegroundColor White
Write-Host ""
Write-Host "   ✅ Navigation:" -ForegroundColor Green
Write-Host "      - Click all sidebar links" -ForegroundColor Gray
Write-Host "      - Verify pages load correctly" -ForegroundColor Gray
Write-Host "      - Test browser back/forward buttons" -ForegroundColor Gray
Write-Host ""
Write-Host "   ✅ Finance Page:" -ForegroundColor Green
Write-Host "      - Add new entry" -ForegroundColor Gray
Write-Host "      - Edit entry" -ForegroundColor Gray
Write-Host "      - Delete entry (check confirmation dialog)" -ForegroundColor Gray
Write-Host "      - Change status" -ForegroundColor Gray
Write-Host ""
Write-Host "   ✅ People Page:" -ForegroundColor Green
Write-Host "      - Add new person" -ForegroundColor Gray
Write-Host "      - Click 'Details' to open PersonInvoicesDialog" -ForegroundColor Gray
Write-Host "      - Add invoice" -ForegroundColor Gray
Write-Host "      - Test installment system" -ForegroundColor Gray
Write-Host ""
Write-Host "   ✅ Bills Page:" -ForegroundColor Green
Write-Host "      - Click 'Zur Person' (should open PersonInvoicesDialog)" -ForegroundColor Gray
Write-Host "      - Click 'Rechnung ansehen und bearbeiten'" -ForegroundColor Gray
Write-Host "      - Test dropdown menu (IBAN kopieren, etc.)" -ForegroundColor Gray
Write-Host ""
Write-Host "   ✅ Calendar Page:" -ForegroundColor Green
Write-Host "      - Add new appointment" -ForegroundColor Gray
Write-Host "      - Navigate months" -ForegroundColor Gray
Write-Host "      - Test filters" -ForegroundColor Gray
Write-Host ""
Write-Host "   ✅ Shopping Page:" -ForegroundColor Green
Write-Host "      - Add item to shopping list" -ForegroundColor Gray
Write-Host "      - Test receipt scanner" -ForegroundColor Gray
Write-Host "      - Test budget system" -ForegroundColor Gray
Write-Host ""
Write-Host "   ✅ Error Handling:" -ForegroundColor Green
Write-Host "      - Check for console errors (F12)" -ForegroundColor Gray
Write-Host "      - Verify success/error toasts appear" -ForegroundColor Gray
Write-Host "      - Test loading states" -ForegroundColor Gray
Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan

