# Monitor Android Build Progress
Write-Host "=== Monitoring Android Build ===" -ForegroundColor Cyan
Write-Host ""

$logFile = "android\build-output.log"
$apkPath = "android\app\build\outputs\apk\debug\app-debug.apk"

Write-Host "Checking build status..." -ForegroundColor Yellow
Write-Host ""

# Check if log file exists
if (Test-Path $logFile) {
    Write-Host "Build log found. Showing latest output:" -ForegroundColor Green
    Write-Host "----------------------------------------" -ForegroundColor Gray
    Get-Content $logFile -Tail 50
    Write-Host "----------------------------------------" -ForegroundColor Gray
} else {
    Write-Host "Build log not found yet. Build may still be initializing..." -ForegroundColor Yellow
}

Write-Host ""

# Check if APK exists
if (Test-Path $apkPath) {
    $apkInfo = Get-Item $apkPath
    Write-Host "✅ BUILD COMPLETE!" -ForegroundColor Green
    Write-Host "APK Location: $apkPath" -ForegroundColor Cyan
    Write-Host "APK Size: $([math]::Round($apkInfo.Length / 1MB, 2)) MB" -ForegroundColor Cyan
    Write-Host "Build Time: $($apkInfo.LastWriteTime)" -ForegroundColor Cyan
} else {
    Write-Host "⏳ Build still in progress..." -ForegroundColor Yellow
    Write-Host "APK not found yet at: $apkPath" -ForegroundColor Gray
}

Write-Host ""
Write-Host "To see live updates, run:" -ForegroundColor Cyan
Write-Host "  Get-Content android\build-output.log -Wait -Tail 20" -ForegroundColor White

