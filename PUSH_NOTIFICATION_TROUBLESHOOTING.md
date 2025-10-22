# Push Notification Troubleshooting Guide

## 🔍 **Issues Fixed and Debugging Steps**

### **1. Configuration Issues Fixed**

#### ✅ **App.json Configuration**
```json
{
  "notification": {
    "icon": "./assets/icon.png",
    "color": "#8BC34A",
    "iosDisplayInForeground": true,
    "androidMode": "default",
    "androidCollapsedTitle": "#{unread_notifications} new notifications"
  }
}
```

#### ✅ **Device Check**
- Added `Device.isDevice` check to ensure notifications only work on physical devices
- Simulators don't support push notifications

#### ✅ **Permission Handling**
- Proper permission request flow
- Clear error messages for denied permissions

### **2. Common Issues and Solutions**

#### 🚨 **Issue: Notifications not showing on phone**

**Possible Causes:**
1. **Running on Simulator**: Push notifications only work on physical devices
2. **Permission Denied**: User denied notification permissions
3. **Backend Not Configured**: Push token not registered with backend
4. **EAS Project ID Missing**: Incorrect project ID in token generation

**Solutions:**

1. **Check Device Type**:
   ```javascript
   if (!Device.isDevice) {
     console.log('⚠️ Push notifications only work on physical devices');
     return false;
   }
   ```

2. **Verify Permissions**:
   - Use the "Debug Status" button in NotificationsScreen
   - Check console logs for permission status
   - Ensure permissions are granted

3. **Test Local Notifications**:
   - Use the "Test Notification" button
   - This tests if the notification system works locally

4. **Check Push Token**:
   - Look for "Push notification token:" in console logs
   - Token should start with "ExponentPushToken["

#### 🚨 **Issue: No push notifications from backend**

**Solutions:**
1. **Register Push Token**: The token needs to be sent to your backend
2. **Backend Integration**: Your backend needs to send push notifications via Expo Push API
3. **Token Registration API**: Implement the `registerPushToken` function

### **3. Testing Steps**

#### **Step 1: Check Device and Permissions**
1. Open the app on a **physical device** (not simulator)
2. Go to Notifications tab
3. Tap "Debug Status" button
4. Check console logs for:
   - Device type (should be physical device)
   - Permission status (should be granted)
   - Push token (should be present)

#### **Step 2: Test Local Notifications**
1. Tap "Test Notification" button
2. You should see a notification appear on your device
3. If this works, the notification system is properly configured

#### **Step 3: Check Console Logs**
Look for these log messages:
```
📱 Initializing push notifications...
📱 Requesting push notification permissions...
✅ Push notification permissions granted
✅ Push notification token: ExponentPushToken[...]
📱 Registering push token with backend...
✅ Push token registered with backend
```

### **4. Backend Integration Required**

#### **Push Token Registration**
Your backend needs to:
1. **Store Push Tokens**: Save the Expo push token for each user
2. **Send Notifications**: Use Expo Push API to send notifications
3. **Handle Token Updates**: Update tokens when they change

#### **Example Backend API**
```javascript
// Register push token
POST /api/v1/notifications/register-token
{
  "token": "ExponentPushToken[xxx]",
  "platform": "ios",
  "deviceId": "device-id"
}

// Send push notification (from your backend)
POST https://exp.host/--/api/v2/push/send
{
  "to": "ExponentPushToken[xxx]",
  "title": "New Message",
  "body": "You have a new message",
  "data": { "chatId": "123" }
}
```

### **5. Debug Tools Added**

#### **Test Notification Button**
- Manually triggers a local notification
- Tests if the notification system works
- Should show notification on device

#### **Debug Status Button**
- Shows current permission status
- Displays stored push token
- Shows device information
- Helps identify configuration issues

### **6. Next Steps**

1. **Test on Physical Device**: Ensure you're testing on a real device
2. **Check Permissions**: Verify notification permissions are granted
3. **Test Local Notifications**: Use the test button to verify local notifications work
4. **Implement Backend**: Set up push token registration and sending
5. **Monitor Logs**: Check console logs for any errors

### **7. Expected Behavior**

#### **Working Notifications Should:**
- Show permission request on first launch
- Generate push token after permission granted
- Display test notifications when "Test Notification" is pressed
- Show real notifications when backend sends them
- Update unread count in real-time

#### **Console Logs Should Show:**
- Successful permission grant
- Push token generation
- Notification scheduling
- App state changes
- WebSocket connections (if implemented)

### **8. Common Error Messages**

- `⚠️ Push notifications only work on physical devices` → Use real device
- `❌ Push notification permission denied` → Grant permissions in device settings
- `❌ Error getting initial URL` → Normal, not related to notifications
- `📱 Notification received:` → Success, notification was received

---

## 🎯 **Quick Fix Checklist**

- [ ] Running on physical device (not simulator)
- [ ] Notification permissions granted
- [ ] Push token generated successfully
- [ ] Test notification works locally
- [ ] Backend configured to send push notifications
- [ ] Push token registered with backend
- [ ] Expo Push API configured on backend

---

**If notifications still don't work after following this guide, the issue is likely in the backend configuration or push token registration.**

