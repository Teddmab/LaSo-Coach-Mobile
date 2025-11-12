# TokenManager: Function Calls At a Glance

## 3 Main Functions (With Real Examples)

---

## ✅ FUNCTION 1: storeTokens()

**Location**: `src/services/tokenManager.js`, lines 27-68  
**Purpose**: Save token + user data to AsyncStorage after login

### Function Signature:
```javascript
async storeTokens(token, refreshToken, userData = {})
```

### What It Does:
- Stores `token` to key `'admin_token'`
- Stores `userData.id` to key `'admin_user_id'`
- Stores `userData.email` to key `'admin_user_email'`
- Stores `userData.name` to key `'admin_user_name'`
- Stores `userData.role` to key `'admin_user_role'`
- Also stores to legacy keys for backward compat

### Real Example (From AuthContext.js):
```javascript
// After backend login succeeds:
const response = await authAPI.loginWithGoogle(firebaseIdToken);

// Extract what we need:
const token = response.token;
const userData = {
  id: response.id,
  email: response.email,
  name: response.name,
  role: response.role,
};

// CALL FUNCTION:
await TokenManager.storeTokens(token, null, userData);
```

### What Gets Stored in AsyncStorage:
```javascript
AsyncStorage.setItem('admin_token', token);
AsyncStorage.setItem('admin_user_id', userData.id);
AsyncStorage.setItem('admin_user_email', userData.email);
AsyncStorage.setItem('admin_user_name', userData.name);
AsyncStorage.setItem('admin_user_role', userData.role);
```

### Console Logs You'll See:
```
🔑 TokenManager.storeTokens() - Storing admin_token and user data per backend spec...
✅ Stored admin_token (456 chars)
✅ Stored admin_user_id
✅ Stored admin_user_email
✅ Stored admin_user_name
✅ Stored admin_user_role
✅ All tokens and user data stored in AsyncStorage
```

---

## ✅ FUNCTION 2: getTokens()

**Location**: `src/services/tokenManager.js`, lines 70-103  
**Purpose**: Retrieve token from AsyncStorage (used by interceptor)

### Function Signature:
```javascript
async getTokens()
// Returns: { token, refreshToken, provider }
```

### What It Does:
1. Tries to read `'admin_token'` key
2. If not found, tries `'@LasoCoach:authToken'` (legacy)
3. If neither found, returns `{ token: null, ... }`

### Real Example (From api.js interceptor):
```javascript
// Before every API request, the interceptor runs:
const { token, provider } = await TokenManager.getTokens();

// token is either:
// - JWT string (if stored)
// - null (if not logged in)

if (token) {
  config.headers.Authorization = `Bearer ${token}`;
}
```

### What It Reads from AsyncStorage:
```javascript
const adminToken = await AsyncStorage.getItem('admin_token');
// If exists: return { token: adminToken, refreshToken: null, provider: 'admin' }

// If NOT, try legacy:
const legacyToken = await AsyncStorage.getItem('@LasoCoach:authToken');
// If exists: return { token: legacyToken, refreshToken: null, provider: 'credentials' }

// If neither:
// return { token: null, refreshToken: null, provider: null }
```

### Console Logs You'll See:
```
// SUCCESS:
🔑 TokenManager.getTokens() - Retrieving admin_token from AsyncStorage...
✅ Retrieved admin_token (456 chars, provider: admin)

// OR if using legacy:
⚠️ Using legacy token (456 chars, provider: credentials) - NO admin_token found

// OR if not logged in:
ℹ️ No tokens found in AsyncStorage
```

### Return Values:
```javascript
// If token exists:
{
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  refreshToken: null,
  provider: 'admin'
}

// If not logged in:
{
  token: null,
  refreshToken: null,
  provider: null
}
```

---

## ✅ FUNCTION 3: getUserData()

**Location**: `src/services/tokenManager.js`, lines 105-118  
**Purpose**: Get stored user data (id, email, name, role)

### Function Signature:
```javascript
async getUserData()
// Returns: { id, email, name, role }
```

### What It Does:
- Reads `'admin_user_id'` key
- Reads `'admin_user_email'` key
- Reads `'admin_user_name'` key
- Reads `'admin_user_role'` key
- Returns all in one object

### Real Example (Usage):
```javascript
// Get user data from storage:
const userData = await TokenManager.getUserData();

console.log(userData);
// {
//   id: "99934100-1cf2-4fc5-a487-9a470234f3b1",
//   email: "user@example.com",
//   name: "John Doe",
//   role: "USER"
// }
```

### What It Reads from AsyncStorage:
```javascript
const id = await AsyncStorage.getItem('admin_user_id');
const email = await AsyncStorage.getItem('admin_user_email');
const name = await AsyncStorage.getItem('admin_user_name');
const role = await AsyncStorage.getItem('admin_user_role');

return { id, email, name, role };
```

### Return Values:
```javascript
// If logged in:
{
  id: "99934100-1cf2-4fc5-a487-9a470234f3b1",
  email: "user@example.com",
  name: "John Doe",
  role: "USER"
}

// If not logged in:
{
  id: null,
  email: null,
  name: null,
  role: null
}
```

---

## Additional Helper Functions

### clearTokens()
**Purpose**: Delete all stored tokens (on logout)

```javascript
await TokenManager.clearTokens();
// Deletes all 8 AsyncStorage keys
```

### hasValidTokens()
**Purpose**: Check if user is logged in

```javascript
const isLoggedIn = await TokenManager.hasValidTokens();
// Returns: true if token exists, false otherwise
```

---

## Complete Login → Store → Use Flow

```
┌─────────────────────────────────────────────┐
│ 1. BACKEND LOGIN RESPONSE                   │
├─────────────────────────────────────────────┤
│ {                                           │
│   "token": "eyJhbGciOiJIUzI1NiIs...",      │
│   "id": "99934100-1cf2-4fc5-...",          │
│   "email": "user@example.com",              │
│   "name": "John Doe",                       │
│   "role": "USER"                            │
│ }                                           │
└────────────────┬────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────┐
│ 2. CALL storeTokens()                       │
├─────────────────────────────────────────────┤
│ await TokenManager.storeTokens(             │
│   "eyJhbGciOiJIUzI1NiIs...",               │
│   null,                                     │
│   {                                         │
│     id: "99934100-1cf2-4fc5-...",          │
│     email: "user@example.com",              │
│     name: "John Doe",                       │
│     role: "USER"                            │
│   }                                         │
│ );                                          │
└────────────────┬────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────┐
│ 3. AsyncStorage NOW CONTAINS:               │
├─────────────────────────────────────────────┤
│ 'admin_token'       → "eyJhbGciOiJIUzI1Ni..│
│ 'admin_user_id'     → "99934100-1cf2-4fc5..│
│ 'admin_user_email'  → "user@example.com"   │
│ 'admin_user_name'   → "John Doe"           │
│ 'admin_user_role'   → "USER"               │
│ '@LasoCoach:...'    → "eyJhbGciOiJIUzI1Ni..│
└────────────────┬────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────┐
│ 4. INTERCEPTOR CALLS getTokens()            │
├─────────────────────────────────────────────┤
│ const { token } = await                     │
│   TokenManager.getTokens();                 │
│                                             │
│ Returns:                                    │
│ token = "eyJhbGciOiJIUzI1NiIs..."          │
└────────────────┬────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────┐
│ 5. REQUEST SENT WITH HEADER                 │
├─────────────────────────────────────────────┤
│ GET /api/v1/profile                         │
│ Authorization: Bearer eyJhbGciOiJIUzI1Ni... │
│                                             │
│ ✅ BACKEND ACCEPTS ✅                       │
└─────────────────────────────────────────────┘
```

---

## Key Names Cheat Sheet

```javascript
// MAIN KEYS (store to these):
'admin_token'        // The JWT token
'admin_user_id'      // User UUID
'admin_user_email'   // User email
'admin_user_name'    // User full name
'admin_user_role'    // User role (e.g., 'USER')

// LEGACY KEYS (for backward compat):
'@LasoCoach:authToken'      // Old token location
'@LasoCoach:refreshToken'   // Old refresh token
'@LasoCoach:authProvider'   // Old provider
```

---

## Minimal Example: Everything You Need

```javascript
// ========== AFTER LOGIN ==========
import { TokenManager } from '../services/tokenManager';

const response = await authAPI.loginWithGoogle(firebaseIdToken);

await TokenManager.storeTokens(
  response.token,
  null,
  {
    id: response.id,
    email: response.email,
    name: response.name,
    role: response.role
  }
);

// ========== IN INTERCEPTOR ==========
const { token } = await TokenManager.getTokens();
if (token) {
  config.headers.Authorization = `Bearer ${token}`;
}

// ========== ON LOGOUT ==========
await TokenManager.clearTokens();
```

That's it! TokenManager handles everything else.

---

## Debugging: What to Check

If token is not being used in requests:

1. **Check storeTokens was called:**
   ```
   Look for logs:
   ✅ Stored admin_token
   ✅ Stored admin_user_id
   ```

2. **Check getTokens returns token:**
   ```
   Look for logs:
   ✅ Retrieved admin_token (456 chars, provider: admin)
   ```

3. **Check AsyncStorage has the key:**
   ```javascript
   const token = await AsyncStorage.getItem('admin_token');
   console.log('Token exists:', !!token);
   ```

4. **Check interceptor is being called:**
   ```
   Look for logs during any API request:
   🚀 GET /api/v1/profile
   🔑 Token source: admin_token
   ✅ Authorization header set with admin_token
   ```

If any of these is missing, that's where the problem is!
