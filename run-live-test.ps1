# Run Live Test and Display Results
Write-Host "Running live test..." -ForegroundColor Cyan
$output = node test-live-simple.js 2>&1
Write-Host $output

