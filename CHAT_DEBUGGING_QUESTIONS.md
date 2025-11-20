# Chat Debugging - Questions for Backend/Back Office Team

## 🔍 Issues to Investigate

### Issue 1: Chat List Not Updating
**Problem:** When on chat list page, new messages don't update:
- Last message subtitle doesn't update
- Unread badge doesn't appear

**Questions for Backend:**
1. When a message is sent, does the backend emit `chat:message` event to the `chat:{chatId}` room?
2. Does the backend also emit `notification` event to `user:{userId}` room?
3. What is the exact structure of the `chat:message` event payload? (especially `message.chatId` vs `message.chat.id`)
4. Are we required to be in the `chat:{chatId}` room to receive `chat:message` events?
5. What is the exact structure of the `notification` event payload for chat messages?

**Questions for Back Office:**
1. Should we be receiving messages via `chat:message` event or `notification` event when on the chat list page?
2. When a user is on the chat list (not in a specific chat), should they receive `chat:message` events for all their chats?

---

### Issue 2: Messages Not Appearing in Open Chat
**Problem:** When in an open chat conversation, new messages don't appear automatically.

**Questions for Backend:**
1. When a message is sent to an active chat, does the backend emit `chat:message` to `chat:{chatId}` room?
2. What is the exact event name? (`chat:message` or something else?)
3. What is the exact payload structure? (especially `chatId` field location)
4. Do we need to be in the `chat:{chatId}` room to receive messages for that chat?
5. Is there a delay between sending a message and receiving the WebSocket event?

**Questions for Back Office:**
1. Should messages appear immediately via WebSocket, or is there a delay?
2. Are there any authentication/authorization checks that might prevent message delivery?

---

## 🔍 Current Implementation Details

### WebSocket Event Listeners:
- `chat:message` → Handled by `handleNewMessage()`
- `notification` → Handled by `handleChatNotification()`
- `chat:created` → Handled by `handleNewChat()`

### Room Joining:
- All chat rooms are joined when WebSocket connects (via useEffect)
- Rooms are joined using `chatSocketService.joinChat(chatId)`
- This emits `chat:join` event with `{ chatId }`

### Message Handling:
- `handleNewMessage()` updates:
  - `messages` state (adds message to `messages[chatId]`)
  - `conversations` state (updates `lastMessage` and `unreadCount`)
  - Shows notification if chat is not active

---

## 🧪 Debugging Steps

### Step 1: Verify WebSocket Connection
Check logs for:
- `✅ Connected to chat server: [socket-id]`
- `🔄 Joining X chat rooms...`
- `✅ All chat rooms joined`

### Step 2: Verify Room Joining
Check logs for:
- `→ Joining room: chat:[chatId]` for each conversation

### Step 3: Verify Message Reception
Check logs for:
- `📨 [WebSocket] New message received (single source of truth): {...}`
- `✅ [handleNewMessage] Adding NEW message to chat: [chatId] [messageId]`

### Step 4: Verify State Updates
Check logs for:
- `🔔 [handleNewMessage] Showing notification for new message: [messageId]`
- Or: `ℹ️ [handleNewMessage] Chat is active, skipping notification`

---

## 📋 What We Need to Know

1. **Event Names:** Exact event names the backend emits
2. **Payload Structure:** Exact structure of message/notification payloads
3. **Room Requirements:** Do we need to be in rooms to receive events?
4. **Event Flow:** Which events are sent to which rooms?
5. **Timing:** Any delays or async operations we should account for?

