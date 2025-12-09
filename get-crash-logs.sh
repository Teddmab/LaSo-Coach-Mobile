#!/bin/bash
# Script to capture Android crash logs and errors for the APK

echo "🔍 Collecting Android crash logs and errors..."
echo ""

# Check if device is connected
if ! adb devices | grep -q "device$"; then
    echo "❌ No Android device detected!"
    echo "   Please connect your device via USB and enable USB debugging"
    echo "   Run: adb devices"
    exit 1
fi

echo "✅ Device detected"
echo ""

# Clear previous logs
echo "🧹 Clearing previous logs..."
adb logcat -c

# Create logs directory if it doesn't exist
mkdir -p logs

# Generate timestamp for log file
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="logs/crash-logs-${TIMESTAMP}.txt"

echo "📱 Waiting for app to crash or be launched..."
echo "   (Please install and open the APK now)"
echo "   Logs will be saved to: ${LOG_FILE}"
echo "   Press Ctrl+C to stop capturing"
echo ""

# Capture logs with filters for React Native, Expo, and app-specific errors
# Save to file AND display in terminal
adb logcat -v time | grep -E "(ReactNative|Expo|FATAL|AndroidRuntime|JS|Error|Exception|Crash|LaSo|laso|GoogleSignIn|Firebase)" --color=never | tee "${LOG_FILE}"

