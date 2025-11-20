# Console Filter Usage

## Overview

The console filter automatically filters console logs to show only WebSocket/chat-related logs and hide verbose API/data logs. This makes debugging chat issues much easier.

## Default Behavior

By default, the filter is **enabled** and shows:
- ✅ All WebSocket/chat related logs
- ✅ All errors and warnings
- ❌ Hides verbose API requests (GET, POST, etc.)
- ❌ Hides profile/data loading logs

## WebSocket Keywords (Always Shown)

Logs containing these keywords will always be shown:
- `websocket`, `socket`, `chat`, `message`, `notification`
- `handleNewMessage`, `chatSocketService`, `ChatContext`
- `chat:message`, `chat:created`, `chat:join`, `chat:leave`
- Emojis: 📨, 🔔, 🔌, 📡, 💬, ✅, ❌, ⚠️, 🔄

## Hidden Keywords (Filtered Out)

Logs containing these keywords (without WebSocket keywords) are hidden:
- `request`, `response`, `api`, `fetch`, `axios`
- `profile`, `user data`, `data loaded`
- `GET /`, `POST /`, `PATCH /`, `PUT /`, `DELETE /`

## Controlling the Filter

### Show All Logs (Disable Filter)

```javascript
import { showAllLogs } from './src/utils/consoleFilter';

showAllLogs();
```

### Show Only WebSocket Logs (Default)

```javascript
import { enableWebSocketOnly } from './src/utils/consoleFilter';

enableWebSocketOnly();
```

### Show Only Errors and Warnings

```javascript
import { showErrorsOnly } from './src/utils/consoleFilter';

showErrorsOnly();
```

### Custom Configuration

```javascript
import { updateConsoleFilter } from './src/utils/consoleFilter';

updateConsoleFilter({
  enabled: true,
  showWebSocketOnly: true,
  hideVerbose: true,
  showErrors: true,
  showWarnings: true,
});
```

## Examples

### Example 1: WebSocket Connection Log
```
🔌 Connecting to WebSocket server: wss://...
✅ Connected to chat server
```
✅ **Shown** (contains WebSocket keywords)

### Example 2: API Request Log
```
GET /api/v1/profile
Response: { user: {...} }
```
❌ **Hidden** (verbose API log)

### Example 3: Chat Message Log
```
📨 [handleNewMessage] WebSocket message received
```
✅ **Shown** (contains WebSocket keywords)

### Example 4: Error Log
```
❌ Error loading profile
```
✅ **Shown** (errors are always shown)

## Quick Toggle in Code

You can add these to your code temporarily:

```javascript
// At the top of a file
import { enableWebSocketOnly, showAllLogs } from '../utils/consoleFilter';

// To see only WebSocket logs
enableWebSocketOnly();

// To see all logs
showAllLogs();
```

## Notes

- The filter is automatically enabled when the app starts (in dev mode)
- Errors and warnings are always shown (unless you disable them)
- The filter works by intercepting `console.log`, `console.warn`, `console.error`, and `console.info`
- Original console methods are preserved, so you can still access them if needed

