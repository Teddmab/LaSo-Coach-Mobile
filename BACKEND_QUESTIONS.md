# Critical Questions for Backend Team - Chat Implementation

## 🚨 CRITICAL: WebSocket Connection Issue (URGENT)

### WebSocket Connection Failing - 404 Error

**Status**: ❌ **BLOCKING** - Cannot connect to WebSocket server

**Error**: `Expected HTTP 101 response but was '404 Not Found'`

**URL Attempted**: `wss://lasocoach-backend.onrender.com`

**Paths Tried** (all return 404):
- ❌ `/socket.io` 
- ❌ `/api/v1/socket.io`
- ❌ `/socket.io/` (Socket.IO default)

**Current Configuration**:
```javascript
{
  url: 'wss://lasocoach-backend.onrender.com',
  auth: { token: 'Bearer <firebase-id-token>' },
  transports: ['websocket'],
  path: '/socket.io/' // Default Socket.IO path
}
```

### Questions for Backend Team:

1. **What is the correct WebSocket URL?**
   - Is it `wss://lasocoach-backend.onrender.com`?
   - Or a different URL/subdomain?

2. **What is the correct Socket.IO path?** ⚠️ **URGENT - STILL GETTING 404**
   - **What is the EXACT path?** (e.g., `/socket.io/`, `/api/socket.io`, `/api/v1/socket.io`, `/ws`, etc.)
   - Is Socket.IO mounted at a specific route?
   - **Current error**: `GET https://lasocoach-backend.onrender.com/socket.io/` returns 404
   - **The server responds, but the path doesn't exist - what path should we use?**

3. **What authentication format is expected?**
   - Currently sending: `auth: { token: 'Bearer <firebase-id-token>' }`
   - Is this correct, or should it be different?
   - Should we use `admin_token` instead of Firebase ID token?

4. **Is the WebSocket server running?**
   - Is the Socket.IO server active on the backend?
   - Are there any specific requirements or configurations needed?

5. **Can you provide a working example?**
   - A curl command or code snippet showing how to connect?
   - Or the exact Socket.IO server configuration?

**Impact**: Chat functionality is completely blocked until this is resolved.

---

## URGENT: Please Answer These Questions

### Q1: WebSocket Event Broadcasting (CRITICAL)

**When a message is sent via REST API (`POST /chat/{chatId}/messages`), what happens?**

- [ ] A) Backend broadcasts `chat:message` event to ALL participants (including sender)
- [ ] B) Backend broadcasts `chat:message` event only to OTHER participants (NOT sender)
- [ ] C) Backend sends `notification` event instead of `chat:message`
- [ ] D) Backend sends BOTH `chat:message` AND `notification` events

**Why this matters**: 
- If sender doesn't receive `chat:message`, their own messages won't appear in the UI
- Current implementation waits for WebSocket event to display messages (no optimistic updates)

---

### Q2: Room Joining Requirements (CRITICAL)

**To receive `chat:message` events, must the user:**

- [ ] A) Join the room (`chat:join`) BEFORE messages are sent?
- [ ] B) Join the room, but can receive messages sent before joining (backlog)?
- [ ] C) Not need to join at all (messages broadcast to all participants automatically)?

**Why this matters**:
- Current code only joins rooms when opening a chat
- If room joining is required, messages sent before opening won't be received
- If messages are sent to `user:{userId}` room, joining isn't needed

---

### Q3: Event Payload Structure (CRITICAL)

**Please provide EXACT payload structure for:**

#### 3.1 `chat:message` Event
```json
{
  "id": "string?",
  "chatId": "string?" OR "chat": { "id": "string?" },
  "content": "string?",
  "sender": { 
    "id": "string?",
    "name": "string?",
    "firstName": "string?",
    ...
  },
  "senderId": "string?",
  "createdAt": "ISO date string?",
  ...
}
```

**Questions**:
- Is `chatId` directly on the message object, or nested in `chat.id`?
- Is `senderId` directly on the message, or only in `sender.id`?
- What fields are guaranteed to be present?

#### 3.2 `notification` Event (when type is CHAT_MESSAGE)
```json
{
  "type": "CHAT_MESSAGE" OR "chat_message",
  "title": "string?",
  "message": "string?",
  "body": "string?",
  "data": {
    "chatId": "string?",
    "messageId": "string?",
    "message": { ... full message object? ... } OR null,
    "sender": { ... } OR null,
    ...
  },
  "chatId": "string?" (directly on notification?),
  ...
}
```

**Questions**:
- Does `notification.data.message` contain the full message object?
- Is `chatId` in `notification.data.chatId` or directly on `notification.chatId`?
- What is the exact structure?

---

### Q4: Message Broadcasting Scope (CRITICAL)

**When a message is sent, where is it broadcast?**

- [ ] A) `chat:message` sent to `chat:{chatId}` room (only if user joined)
- [ ] B) `chat:message` sent to `user:{userId}` room (always delivered to each participant)
- [ ] C) `notification` sent to `user:{userId}` room (always delivered)
- [ ] D) Both B and C

**Why this matters**:
- If only sent to `chat:{chatId}` room, users must join before receiving
- If sent to `user:{userId}` room, users always receive regardless of room joining

---

### Q5: Conversation Not Found Scenario

**What happens if:**
- A message arrives via WebSocket for a chat that's not in the user's conversations list?
- Should we:
  - A) Load the conversation via REST API (`GET /chat/conversations/{chatId}`)?
  - B) Create a minimal conversation object from the message?
  - C) Ignore the message until conversation is loaded?

**Current behavior**: We log a warning and don't update anything (line 390-394 in ChatContext.js)

---

### Q6: Unread Count Updates

**How is unread count calculated?**

- [ ] A) Backend automatically increments when message is sent
- [ ] B) Frontend must manually increment
- [ ] C) Backend provides count via REST API only

**Current behavior**: We increment locally AND fetch from API

---

## Current Implementation Issues

### Issue 1: Conversation Not Found
**Location**: `ChatContext.js` line 390-394

**Problem**: If conversation not in list, message is ignored
```javascript
if (conversationIndex === -1) {
  console.warn('⚠️ Conversation not found in list:', chatId);
  return prev; // ❌ Message is lost!
}
```

**Question**: Should we load the conversation or create a minimal one?

---

### Issue 2: No Optimistic Updates
**Location**: `ChatContext.js` line 640-664

**Problem**: When user sends message, it doesn't appear until WebSocket event arrives
- If sender doesn't receive WebSocket event, their message never appears
- User experience is poor (no immediate feedback)

**Question**: Should we:
- A) Add optimistic updates (show message immediately, remove if send fails)?
- B) Keep current behavior (wait for WebSocket)?
- C) Backend guarantees sender always receives `chat:message` event?

---

### Issue 3: Room Joining Timing
**Location**: `ChatContext.js` line 669-687

**Problem**: Rooms are only joined when opening a chat
- If message arrives before opening, it might be missed
- If room joining is required, we need to join all conversations on connection

**Question**: Should we join all user's conversations on WebSocket connect?

---

## Testing Scenarios

Please confirm these scenarios work:

### Scenario 1: User Sends Message
1. User A opens chat with User B
2. User A sends message via REST API
3. **Expected**: 
   - User A sees message immediately (or after WebSocket event)
   - User B receives `chat:message` event
   - User B sees message in active chat (if open) or gets notification

### Scenario 2: Message Arrives While on Chat List
1. User A is on chat list page (not in any chat)
2. User B sends message to User A
3. **Expected**:
   - Conversation list updates with new last message
   - Unread badge appears on conversation
   - Notification appears

### Scenario 3: Message Arrives While in Active Chat
1. User A is in active chat with User B
2. User B sends message
3. **Expected**:
   - Message appears immediately in chat thread
   - No notification (chat is active)
   - Conversation list updates (if visible)

### Scenario 4: Message Arrives for Unopened Chat
1. User A has chat with User B (never opened)
2. User B sends message
3. **Expected**:
   - Conversation appears in list (if not already there)
   - Unread count increments
   - Notification appears

---

## Next Steps

1. **Please answer all questions above** (especially Q1-Q4)
2. **Provide exact payload structures** for both events
3. **Confirm which scenarios work** in your implementation
4. **Share any backend logs** showing what events are sent when a message is posted

Once we have these answers, we can fix the frontend implementation accordingly.

