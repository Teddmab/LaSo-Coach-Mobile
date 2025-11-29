# Script to view live device logs with different filters
param(
    [string]$Filter = "app",
    [string]$DeviceId = ""
)

Write-Host "=== DEVICE LOG VIEWER ===" -ForegroundColor Cyan
Write-Host ""

# Check devices and select the right one
$devices = adb devices
$deviceList = $devices | Select-String -Pattern "device$" | Where-Object { $_ -notmatch "List of devices" }

if ($deviceList.Count -gt 1) {
    Write-Host "Multiple devices detected:" -ForegroundColor Yellow
    $deviceList | ForEach-Object { 
        $deviceId = ($_ -split '\s+')[0]
        $deviceStatus = ($_ -split '\s+')[1]
        Write-Host "  $deviceId - $deviceStatus" -ForegroundColor Cyan
    }
    Write-Host ""
    
    # Prefer physical device over emulator
    $physicalDevice = $deviceList | Where-Object { $_ -notmatch "emulator" } | Select-Object -First 1
    if ($physicalDevice) {
        $DeviceId = ($physicalDevice -split '\s+')[0]
        Write-Host "Using physical device: $DeviceId" -ForegroundColor Green
    } else {
        $DeviceId = ($deviceList[0] -split '\s+')[0]
        Write-Host "Using device: $DeviceId" -ForegroundColor Yellow
    }
    Write-Host ""
} elseif ($deviceList.Count -eq 1) {
    $DeviceId = ($deviceList[0] -split '\s+')[0]
    Write-Host "Using device: $DeviceId" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "❌ No devices found!" -ForegroundColor Red
    Write-Host "Please connect your device and try again." -ForegroundColor Yellow
    exit 1
}

# Build adb command arguments array
$adbArgs = if ($DeviceId) { @("-s", $DeviceId) } else { @() }

# Clear previous logs
Write-Host "Clearing old logs..." -ForegroundColor Yellow
$clearArgs = $adbArgs + @("logcat", "-c")
& adb $clearArgs | Out-Null
Start-Sleep -Seconds 1

Write-Host "Starting live logs..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

switch ($Filter.ToLower()) {
    "app" {
        Write-Host "Filter: App logs (LaSo Coach, React Native, Expo)" -ForegroundColor Cyan
        $logcatArgs = $adbArgs + @("logcat")
        & adb $logcatArgs | Select-String -Pattern "LaSo|LasoCoach|ReactNative|Expo|com.laso.coach" -CaseSensitive:$false
    }
    "oauth" {
        Write-Host "Filter: Google OAuth logs" -ForegroundColor Cyan
        $logcatArgs = $adbArgs + @("logcat")
        & adb $logcatArgs | Select-String -Pattern "Google|OAuth|auth|redirect|auth.expo|lasocoach://" -CaseSensitive:$false
    }
    "firebase" {
        Write-Host "Filter: Firebase logs" -ForegroundColor Cyan
        $logcatArgs = $adbArgs + @("logcat")
        & adb $logcatArgs | Select-String -Pattern "Firebase|firebase" -CaseSensitive:$false
    }
    "error" {
        Write-Host "Filter: Errors only" -ForegroundColor Cyan
        $logcatArgs = $adbArgs + @("logcat", "*:E")
        & adb $logcatArgs
    }
    "all" {
        Write-Host "Filter: All logs (verbose)" -ForegroundColor Cyan
        $logcatArgs = $adbArgs + @("logcat")
        & adb $logcatArgs
    }
    "ownership" {
        Write-Host "Filter: App Ownership detection" -ForegroundColor Cyan
        $logcatArgs = $adbArgs + @("logcat")
        & adb $logcatArgs | Select-String -Pattern "App Ownership|appOwnership|expo|guest|standalone" -CaseSensitive:$false
    }
    default {
        Write-Host "Filter: App logs (default)" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Usage: .\view-logs.ps1 [filter] [deviceId]" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Available filters:" -ForegroundColor White
        Write-Host "  app       - App logs (LaSo Coach, React Native, Expo)" -ForegroundColor Gray
        Write-Host "  oauth     - Google OAuth logs" -ForegroundColor Gray
        Write-Host "  firebase  - Firebase logs" -ForegroundColor Gray
        Write-Host "  error     - Errors only" -ForegroundColor Gray
        Write-Host "  ownership - App ownership detection" -ForegroundColor Gray
        Write-Host "  all       - All logs (verbose)" -ForegroundColor Gray
        Write-Host ""
        $logcatArgs = $adbArgs + @("logcat")
        & adb $logcatArgs | Select-String -Pattern "LaSo|LasoCoach|ReactNative|Expo|com.laso.coach" -CaseSensitive:$false
    }
}

