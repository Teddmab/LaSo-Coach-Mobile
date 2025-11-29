# Script to install APK on connected tablet
Write-Host "=== INSTALLING APK ON TABLET ===" -ForegroundColor Cyan

# Check if tablet is connected
$devices = adb devices
if (-not ($devices -match "device$")) {
    Write-Host "❌ No tablet detected!" -ForegroundColor Red
    Write-Host "Please connect your tablet via USB and enable USB debugging" -ForegroundColor Yellow
    Write-Host "Then run: adb devices" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Tablet detected" -ForegroundColor Green

# Find APK
$apkPath = Get-ChildItem -Path "android\app\build\outputs\apk\playDebug" -Filter "*.apk" -ErrorAction SilentlyContinue | Select-Object -First 1

if (-not $apkPath) {
    Write-Host "❌ APK not found!" -ForegroundColor Red
    Write-Host "Expected location: android\app\build\outputs\apk\playDebug\*.apk" -ForegroundColor Yellow
    Write-Host "Build may still be in progress. Check: android\build-output.log" -ForegroundColor Yellow
    exit 1
}

Write-Host "📦 Found APK: $($apkPath.Name)" -ForegroundColor Green
Write-Host "   Size: $([math]::Round($apkPath.Length / 1MB, 2)) MB" -ForegroundColor Gray
Write-Host "   Path: $($apkPath.FullName)" -ForegroundColor Gray

Write-Host "`nInstalling APK..." -ForegroundColor Yellow
$installResult = adb install -r "$($apkPath.FullName)" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ APK installed successfully!" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Yellow
    Write-Host "1. Open the app on your tablet" -ForegroundColor White
    Write-Host "2. The app should automatically connect to the dev server" -ForegroundColor White
    Write-Host "3. Test Google authentication" -ForegroundColor White
} else {
    Write-Host "❌ Installation failed!" -ForegroundColor Red
    Write-Host $installResult -ForegroundColor Red
}

