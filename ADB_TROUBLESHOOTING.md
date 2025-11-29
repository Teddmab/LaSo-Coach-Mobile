# ADB Device Detection Troubleshooting

## Step-by-Step Troubleshooting

### 1. Check USB Connection Mode
On your tablet:
- When you connect via USB, check the notification that appears
- Tap it and select **"File Transfer"** or **"MTP"** mode
- NOT "Charging only" or "PTP"

### 2. Enable Developer Options (if not already)
1. Go to Settings → About tablet
2. Find "Build number" 
3. Tap it **7 times** until you see "You are now a developer"

### 3. Enable USB Debugging
1. Go to Settings → Developer options
2. Enable **"USB debugging"**
3. Enable **"Disable adb authorization timeout"** (you already did this)

### 4. Authorize Computer
When you connect via USB:
- A popup should appear on your tablet: **"Allow USB debugging?"**
- Check **"Always allow from this computer"**
- Tap **"Allow"**

### 5. Check USB Drivers
Windows might need drivers for your tablet:
- **Samsung**: Install Samsung USB drivers
- **Google Pixel**: Usually works with Google USB drivers
- **Other brands**: Check manufacturer's website for USB drivers

### 6. Try Different USB Port/Cable
- Try a different USB port on your computer
- Try a different USB cable (some cables are charge-only)
- Use a USB 2.0 port if available (not USB 3.0)

### 7. Check Device Manager (Windows)
1. Connect tablet via USB
2. Open Device Manager (Win + X → Device Manager)
3. Look for:
   - **Unknown device** (yellow warning) - needs driver
   - **Android device** or your tablet name - should work
4. If you see "Unknown device", right-click → Update driver

### 8. Manual ADB Commands
Try these commands one by one:

```powershell
# Restart ADB server
adb kill-server
adb start-server

# Check devices
adb devices

# If still not showing, try:
adb usb
adb devices
```

### 9. Check Tablet Model
Run this to see if Windows recognizes the device:
```powershell
Get-PnpDevice | Where-Object {$_.FriendlyName -like "*android*" -or $_.FriendlyName -like "*tablet*"}
```

## Alternative: Use Network ADB (WiFi)

If USB doesn't work, you can use WiFi ADB:

1. **Connect tablet and computer to same WiFi**
2. **Enable WiFi debugging** on tablet:
   - Settings → Developer options → Enable "Wireless debugging"
3. **Pair via WiFi**:
   - Settings → Developer options → Wireless debugging → Pair device with pairing code
   - Note the IP address and port
4. **Connect via ADB**:
   ```powershell
   adb connect <IP_ADDRESS>:<PORT>
   adb devices
   ```

## For Now: Use Metro Logs

Since ADB isn't working, we can still debug using Metro logs. The enhanced logging I added should show:
- The exact redirect_uri being sent
- Full OAuth error details
- All the information we need

Just test the Google sign-in and share the Metro console logs - they should have all the details we need!

