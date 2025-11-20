# WebSocket Implementation - Complete Analysis & Troubleshooting

## Current Error

```
⚠️ Socket connection error (Socket.IO will auto-reconnect): {
  "message": "websocket error",
  "type": "TransportError"
}
```

**Status**: Connection attempts failing repeatedly, no successful connection

## Implementation Review

### 1. Connection URL Flow

**Source Chain**:
1. `.env` file → `WS_BASE_URL` or `WS_BASE_URL_DEV`
2. `app.json` → `extra.env.wsBaseUrl`
3. Fallback → `wss://laso-coach-backend.onrender.com` (production)

**Current URL** (from logs): `https://lasocoach-backend.onrender.com`
- ✅ Converted from `wss://` to `https://` (correct for Socket.IO)
- ✅ Port `:443` removed (correct)
- ⚠️ **Issue**: URL might be wrong - check if it should be `laso-coach-backend` (with hyphen) vs `lasocoach-backend` (no hyphen)

**File**: `src/config/env.js` lines 53-104

### 2. Socket.IO Configuration

**Current Config**:
```javascript
{
  auth: { token: tokenWithoutBearer }, // ✅ NO Bearer prefix
  // transports: NOT specified (uses default: ['polling', 'websocket'])
  timeout: 20000,
  reconnection: true,
  reconnectionAttempts: 8,
  reconnectionDelay: 1200,
  reconnectionDelayMax: 6000,
  autoConnect: true,
  forceNew: true,
  upgrade: true, // Allow upgrade from polling to websocket
  // path: NOT specified (uses default '/socket.io')
}
```

**Status**: ✅ Matches Admin FE pattern (standard socket.io-client)

### 3. Authentication Token

**Source**: `firebaseAuthService.getIdToken()`
**Format**: `auth: { token: tokenWithoutBearer }`
**Bearer Prefix**: ✅ Removed (backend requirement)

**File**: `src/services/chatSocketService.js` lines 71-125

### 4. Connection Flow

**Sequence**:
1. User authenticates → `isAuthenticated = true`
2. `useEffect` in `ChatContext` triggers
3. `chatSocketService.connect()` called
4. Firebase token fetched
5. Socket.IO connection created
6. `connect` event → `handleConnect` callback
7. Conversations fetched
8. Rooms joined immediately

**File**: `src/context/ChatContext.js` lines 169-234

### 5. Singleton Enforcement

**Checks**:
- ✅ Socket exists and connected → Skip
- ✅ Socket exists and connecting → Wait
- ✅ `isConnecting` flag → Wait

**File**: `src/services/chatSocketService.js` lines 26-65

## Potential Issues

### Issue 1: URL Mismatch ⚠️ **CRITICAL**

**Problem**: URL might be incorrect
- Logs show: `https://lasocoach-backend.onrender.com`
- Fallback shows: `wss://laso-coach-backend.onrender.com` (with hyphen)
- **Mismatch**: `lasocoach` vs `laso-coach`

**Check**: What is the correct backend URL?

### Issue 2: Transport Error Details Missing

**Problem**: Error logs don't show full error details
- Only shows: `"message": "websocket error", "type": "TransportError"`
- Missing: HTTP status code, response headers, full error context

**Fix**: Enhanced error logging added (lines 203-240)

### Issue 3: Default Transport Behavior

**Current**: Using default transports (polling → websocket upgrade)
**Backend Said**: Admin FE uses standard socket.io-client (default behavior)
**Status**: ✅ Matches Admin FE

### Issue 4: Connection URL Format

**Current**: Converting `wss://` → `https://` for Socket.IO
**Question**: Is this correct? Should we use `wss://` directly?

**Socket.IO Behavior**: 
- Socket.IO client accepts both `https://` and `wss://`
- It will use the appropriate protocol internally
- Using `https://` is standard for Socket.IO

## Debugging Checklist

### ✅ Completed
- [x] Removed path cycling
- [x] Enforced singleton socket
- [x] Immediate room joining
- [x] Correct token format (no Bearer prefix)
- [x] Default transports (polling → websocket)
- [x] Enhanced error logging

### ⏳ To Verify
- [ ] Exact backend URL (with/without hyphen)
- [ ] Health endpoint accessible (`/ws-health`)
- [ ] Token is valid and not expired
- [ ] Network connectivity
- [ ] Backend logs show connection attempts

## Next Steps

1. **Verify URL**: Check if URL should be `laso-coach-backend` (with hyphen) or `lasocoach-backend` (no hyphen)
2. **Test Health Endpoint**: Call `/ws-health` to verify server accessibility
3. **Check Backend Logs**: See what backend receives when mobile app connects
4. **Compare with Admin FE**: Get exact Admin FE configuration

## Questions for Backend Team

1. **URL**: What is the EXACT WebSocket URL? 
   - `https://lasocoach-backend.onrender.com`?
   - `https://laso-coach-backend.onrender.com`?
   - Something else?

2. **Admin FE Config**: Can you share the exact Socket.IO client configuration Admin FE uses?

3. **Backend Logs**: What do you see in backend logs when mobile app tries to connect?
   - Do you see auth attempts?
   - Do you see connection attempts?
   - Any errors?

4. **Health Endpoint**: Is `/ws-health` accessible? What does it return?

5. **Token Format**: Confirm token format:
   - `auth: { token: '<firebase-id-token>' }` ✅ (current)
   - Or something else?

