# Tablet Connection Troubleshooting

## Problem
Tablet is connected and can run Expo, but not showing in `adb devices` list.

## Current Status
- Only seeing: `emulator-5554 (offline)`
- Physical tablet: Not detected

## Solution Steps

### Method 1: USB Connection (Recommended)

#### Step 1: On Tablet - Clear Authorizations
1. Go to **Settings > Developer options**
2. Find **"Revoke USB debugging authorizations"**
3. Tap it to clear all previous authorizations
4. Ensure **"USB debugging"** is **ON**
5. Enable **"USB debugging (Security settings)"** if available

#### Step 2: Physical Connection
1. **Disconnect** USB cable from tablet
2. Wait 5 seconds
3. **Reconnect** USB cable
4. Try **different USB port** on computer
5. Try **different USB cable** (must be data cable, not charge-only)

#### Step 3: Authorize Computer
1. When you reconnect, tablet should show popup:
   - **"Allow USB debugging?"**
2. Tap **"Allow"**
3. **CHECK** the box: **"Always allow from this computer"**
4. Tap **"OK"**

#### Step 4: USB Connection Mode
1. When USB is connected, tablet may show notification:
   - **"USB for file transfer"** or **"Charging this device"**
2. **Tap the notification**
3. Select **"File transfer"** or **"MTP"** mode
4. **NOT** "Charging only" mode

#### Step 5: Verify Connection
```powershell
adb kill-server
adb start-server
adb devices
```

Should show your tablet (not just emulator).

### Method 2: WiFi Debugging (Alternative)

If USB doesn't work, use WiFi debugging:

#### On Tablet:
1. **Settings > Developer options**
2. Enable **"Wireless debugging"**
3. Tap **"Wireless debugging"**
4. Note the **IP address and port** (e.g., `192.168.1.100:5555`)

#### On Computer:
```powershell
adb connect <IP>:<PORT>
# Example:
adb connect 192.168.1.100:5555
```

#### Verify:
```powershell
adb devices
```

Should show your tablet connected via WiFi.

### Method 3: Install USB Drivers

If device still not detected:

1. **Install device manufacturer USB drivers:**
   - Samsung: Samsung USB drivers
   - Google: Google USB drivers
   - Other: Manufacturer's website

2. **Or install Universal ADB drivers:**
   - Download from: https://adb.clockworkmod.com/

3. **Restart computer** after driver installation

4. **Try connection again**

## Once Device is Detected

### Build for Physical Device

When your tablet shows in `adb devices`, build with:

```powershell
npx expo run:android --device
```

The `--device` flag forces Expo to use physical device instead of emulator.

### Or Specify Device ID

If you have multiple devices:

```powershell
# List devices
adb devices

# Build for specific device
npx expo run:android --device <DEVICE_ID>
```

## Common Issues

### "unauthorized" Status
- **Cause**: Computer not authorized on tablet
- **Fix**: Check tablet screen for authorization prompt, tap "Allow"

### "offline" Status
- **Cause**: USB connection issue or driver problem
- **Fix**: Try different cable/port, install drivers, restart ADB

### Device Not Listed
- **Cause**: USB debugging not enabled or authorization not granted
- **Fix**: Follow Step 1-3 above

### Expo Tries to Use Emulator
- **Cause**: Expo defaults to emulator if available
- **Fix**: Use `--device` flag: `npx expo run:android --device`

## Verification Commands

```powershell
# Check devices
adb devices

# Check devices with details
adb devices -l

# Restart ADB server
adb kill-server
adb start-server

# Check ADB version
adb version

# List all connected devices (including offline)
adb devices -a
```

## Next Steps

Once tablet is detected:
1. ✅ Verify in `adb devices`
2. ✅ Build with `npx expo run:android --device`
3. ✅ App will install automatically
4. ✅ Test Google OAuth with dev client

