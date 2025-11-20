# WebSocket URL Verification - All Connections

## ✅ Summary

All WebSocket connections now use `Config.WS_BASE_URL` from `.env` file.

---

## 🔍 WebSocket Connections Found

### 1. Chat WebSocket ✅ **CORRECT**

**File:** `src/services/chatSocketService.js`

**Status:** ✅ **USING CORRECT URL**

**Code:**
```javascript
const wsUrl = Config.WS_BASE_URL;
console.log('🔌 Connecting to WebSocket server:', wsUrl);
this.socket = io(wsUrl, {
  // ... config
});
```

**Uses:** `Config.WS_BASE_URL` from `.env` file ✅

---

### 2. Notification WebSocket ✅ **FIXED**

**File:** `src/services/notificationsApi.js`

**Status:** ✅ **FIXED - NOW USING CORRECT URL**

**Before (WRONG):**
```javascript
// ❌ Using process.env which doesn't work in React Native
const wsUrl = `${process.env.WEBSOCKET_URL || 'wss://laso-coach-backend.onrender.com'}/ws/notifications?token=${token}`;
```

**After (CORRECT):**
```javascript
// ✅ Using Config.WS_BASE_URL from .env
import Config from '../config/env';
const wsBaseUrl = Config.WS_BASE_URL;
const wsUrl = `${wsBaseUrl}/ws/notifications?token=${token}`;
```

**Uses:** `Config.WS_BASE_URL` from `.env` file ✅

---

## 📋 Configuration Flow

### How WebSocket URLs are Resolved:

1. **Priority 1:** `app.json` → `extra.env.wsBaseUrl` (if set)
2. **Priority 2:** `.env` file → `WS_BASE_URL` (if set)
3. **Priority 3:** `.env` file → `WS_BASE_URL_DEV` (if in dev mode)
4. **Priority 4:** Fallback → `ws://localhost:5001` (dev) or `wss://laso-coach-backend.onrender.com` (prod)

### URL Normalization:

The config automatically converts:
- `https://` → `wss://` (secure WebSocket)
- `http://` → `ws://` (non-secure WebSocket)
- Already `ws://` or `wss://` → Used as-is

---

## ✅ Verification Checklist

- [x] Chat WebSocket uses `Config.WS_BASE_URL`
- [x] Notification WebSocket uses `Config.WS_BASE_URL`
- [x] No hardcoded WebSocket URLs (except fallback)
- [x] All WebSocket connections read from `.env` file
- [x] URL normalization handles `https://` → `wss://` conversion

---

## 🔧 Required .env Configuration

Make sure your `.env` file has:

```env
WS_BASE_URL=https://lasocoach-backend.onrender.com
# or
WS_BASE_URL=wss://lasocoach-backend.onrender.com
```

**Note:** The code will automatically convert `https://` to `wss://`, so either format works.

---

## 🧪 Testing

After updating `.env` and restarting Metro with `--clear`, you should see:

```
🔍 WebSocket URL sources: { extraEnv: undefined, envVar: 'https://...', ... }
🔌 Using WebSocket URL from .env: wss://lasocoach-backend.onrender.com
🔌 Connecting to WebSocket server: wss://lasocoach-backend.onrender.com
🔌 Using WebSocket URL from Config: wss://lasocoach-backend.onrender.com/ws/notifications?token=...
```

---

## 📝 Files Modified

1. ✅ `src/services/notificationsApi.js`
   - Changed from `process.env.WEBSOCKET_URL` to `Config.WS_BASE_URL`
   - Added import for `Config`

2. ✅ `src/config/env.js`
   - Already correctly configured
   - Added URL normalization
   - Added debugging logs

---

## ✅ Status: ALL WEBSOCKET CONNECTIONS VERIFIED

All WebSocket connections now use the correct URL from `.env` file.

