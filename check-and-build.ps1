# Script to check device connection and build for physical device
Write-Host "=== CHECKING DEVICE CONNECTION ===" -ForegroundColor Cyan
Write-Host ""

# Restart ADB server
Write-Host "Restarting ADB server..." -ForegroundColor Yellow
adb kill-server 2>&1 | Out-Null
Start-Sleep -Seconds 2
adb start-server 2>&1 | Out-Null
Start-Sleep -Seconds 2

# Check devices
Write-Host "Checking connected devices..." -ForegroundColor Yellow
$devices = adb devices
Write-Host ""
Write-Host $devices

# Filter out emulator and offline devices
$physicalDevices = $devices | Select-String -Pattern "device$" | Where-Object { $_ -notmatch "emulator" }

if ($physicalDevices) {
    Write-Host ""
    Write-Host "✅ Physical device detected!" -ForegroundColor Green
    $deviceId = ($physicalDevices[0] -split '\s+')[0]
    Write-Host "Device ID: $deviceId" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Building for physical device..." -ForegroundColor Yellow
    Write-Host ""
    
    # Set Android environment
    $env:ANDROID_HOME = "C:\Users\temabulay\AppData\Local\Android\Sdk"
    $env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
    
    # Build with --device flag to force physical device
    npx expo run:android --device
} else {
    Write-Host ""
    Write-Host "❌ No physical device detected!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting steps:" -ForegroundColor Yellow
    Write-Host "1. On tablet: Settings > Developer options > Revoke USB debugging authorizations" -ForegroundColor White
    Write-Host "2. Disconnect and reconnect USB cable" -ForegroundColor White
    Write-Host "3. On tablet: Tap 'Allow USB debugging' when prompted" -ForegroundColor White
    Write-Host "4. Check 'Always allow from this computer'" -ForegroundColor White
    Write-Host "5. Try different USB cable/port" -ForegroundColor White
    Write-Host ""
    Write-Host "Or use WiFi debugging:" -ForegroundColor Cyan
    Write-Host "  On tablet: Enable 'Wireless debugging' in Developer options" -ForegroundColor White
    Write-Host "  Then run: adb connect <IP>:<PORT>" -ForegroundColor White
    Write-Host ""
    Write-Host "Full guide: TABLET_CONNECTION_TROUBLESHOOTING.md" -ForegroundColor Cyan
}

