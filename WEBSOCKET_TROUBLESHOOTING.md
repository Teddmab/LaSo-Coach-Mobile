# WebSocket Connection Troubleshooting - Complete Analysis

## Current Status

**Error**: `websocket error` (TransportError)
**Status**: Connection attempts failing, no successful connection
**Backend**: Admin FE works, so server is fine

## Complete Implementation Review

### 1. Connection URL ✅
- **Source**: `Config.WS_BASE_URL` from `.env` or `app.json`
- **Current**: `wss://lasocoach-backend.onrender.com` (from logs)
- **Conversion**: `wss://` → `https://` for Socket.IO connection
- **Port**: Removed `:443` to avoid routing issues
- **Status**: ✅ URL format looks correct

### 2. Authentication ✅
- **Token Source**: Firebase ID token from `firebaseAuthService.getIdToken()`
- **Format**: `auth: { token: tokenWithoutBearer }` (NO Bearer prefix)
- **Status**: ✅ Token format matches backend requirement

### 3. Socket.IO Configuration ⚠️ **CHANGED**
- **Before**: `transports: ['websocket']` (websocket-only)
- **After**: Default transports (polling first, then upgrade to websocket)
- **Reason**: Backend said Admin FE uses standard socket.io-client with default behavior
- **Path**: Not specified (uses default `/socket.io`)

### 4. Singleton Enforcement ✅
- **Checks**: Socket exists, connected, or connecting before creating new
- **Status**: ✅ Prevents duplicate instances

### 5. Room Joining ✅
- **Timing**: Immediately after connection in `handleConnect` callback
- **Method**: Fetches conversations, then joins all rooms synchronously
- **Status**: ✅ Early room joining implemented

## Potential Issues

### Issue 1: Transport Configuration
**Problem**: Forcing websocket-only might not work if server requires polling handshake first
**Fix**: Changed to default transports (polling → websocket upgrade)

### Issue 2: URL Format
**Problem**: Converting `wss://` to `https://` might cause issues
**Check**: Verify the exact URL format Admin FE uses

### Issue 3: Token Format
**Problem**: Token might need different format or placement
**Check**: Verify Admin FE token format

### Issue 4: Connection Timing
**Problem**: Connection might be attempted before token is ready
**Check**: Verify token is available before connecting

## Debugging Steps

### Step 1: Verify URL
Check logs for:
```
🔌 Connecting to WebSocket server: { url: '...', ... }
🔌 Connecting to Socket.IO server: { url: '...', ... }
```

Expected: `https://lasocoach-backend.onrender.com` (after conversion)

### Step 2: Verify Token
Check logs for:
```
hasToken: true
tokenLength: 1088 (or similar)
```

### Step 3: Check Error Details
Look for detailed error logs:
```
❌ Socket connection error (detailed): {
  message: '...',
  type: '...',
  description: '...',
  url: '...',
  ...
}
```

### Step 4: Test Health Endpoint
Try calling `/ws-health` endpoint to verify server is accessible:
```javascript
const healthUrl = 'https://lasocoach-backend.onrender.com/ws-health';
const response = await axios.get(healthUrl);
console.log('Health check:', response.data);
```

## Next Steps

1. ✅ Changed to default transports (polling first, then upgrade)
2. ✅ Added detailed error logging
3. ⏳ Test connection with default transports
4. ⏳ If still fails, check exact URL Admin FE uses
5. ⏳ Verify token format matches Admin FE exactly

## Questions for Backend

1. **Exact URL Format**: What exact URL does Admin FE use? (with/without port, http/https/wss)
2. **Transport**: Does Admin FE use default transports or force websocket?
3. **Token Format**: Exact token format Admin FE sends (in auth.token? any other fields?)
4. **Connection Flow**: Does Admin FE see polling handshake first, then upgrade?
5. **Error Details**: What do backend logs show when mobile app tries to connect?

