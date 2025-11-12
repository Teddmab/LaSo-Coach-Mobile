# TokenManager: AsyncStorage Keys Visualization

## The Three Main Functions (One-Pager)

### 1️⃣ storeTokens(token, refreshToken, userData)

```
INPUT:
  token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  refreshToken = null (usually)
  userData = {
    id: "99934100-1cf2-4fc5-a487-9a470234f3b1",
    email: "user@example.com",
    name: "John Doe",
    role: "USER"
  }

↓ STORES IN ASYNCSTORAGE ↓

AsyncStorage {
  'admin_token'           → "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  'admin_user_id'         → "99934100-1cf2-4fc5-a487-9a470234f3b1"
  'admin_user_email'      → "user@example.com"
  'admin_user_name'       → "John Doe"
  'admin_user_role'       → "USER"
  '@LasoCoach:authToken'  → "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." (legacy)
}
```

---

### 2️⃣ getTokens()

```
READS FROM ASYNCSTORAGE:
  1. Look for 'admin_token' key
     ↓ FOUND?
     YES → Return { token: "eyJ...", refreshToken: null, provider: 'admin' }
     
     NO → Look for '@LasoCoach:authToken' (legacy)
          ↓ FOUND?
          YES → Return { token: "eyJ...", refreshToken: null, provider: 'credentials' }
          
          NO → Return { token: null, refreshToken: null, provider: null }
```

---

### 3️⃣ getUserData()

```
READS FROM ASYNCSTORAGE:
  'admin_user_id'     → "99934100-1cf2-4fc5-a487-9a470234f3b1"
  'admin_user_email'  → "user@example.com"
  'admin_user_name'   → "John Doe"
  'admin_user_role'   → "USER"

RETURNS:
  {
    id: "99934100-1cf2-4fc5-a487-9a470234f3b1",
    email: "user@example.com",
    name: "John Doe",
    role: "USER"
  }
```

---

## AsyncStorage Keys - Exact Names

```javascript
// These are the EXACT key names used:

const ADMIN_TOKEN_KEY = 'admin_token';                 // ← Main JWT token
const ADMIN_USER_ID_KEY = 'admin_user_id';             // ← User UUID
const ADMIN_USER_EMAIL_KEY = 'admin_user_email';       // ← User email
const ADMIN_USER_NAME_KEY = 'admin_user_name';         // ← User name
const ADMIN_USER_ROLE_KEY = 'admin_user_role';         // ← User role (e.g., 'USER')

// Legacy keys (for backward compatibility):
const TOKEN_KEY = '@LasoCoach:authToken';              // ← Old token key
const REFRESH_TOKEN_KEY = '@LasoCoach:refreshToken';   // ← Old refresh key
const AUTH_PROVIDER_KEY = '@LasoCoach:authProvider';   // ← Old provider key
```

---

## Real-World Example: Complete Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER LOGS IN                                 │
├─────────────────────────────────────────────────────────────────┤
│ 1. User enters: testuser@example.com / password123             │
│                                                                 │
│ 2. Firebase sign-in succeeds                                   │
│    → Firebase ID token obtained                                │
│                                                                 │
│ 3. POST /auth/login { idToken: "firebase_token_here" }         │
│                                                                 │
│ 4. Backend validates Firebase token ✅                          │
│                                                                 │
│ 5. Backend returns:                                            │
│    {                                                            │
│      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",       │
│      "id": "99934100-1cf2-4fc5-a487-9a470234f3b1",             │
│      "email": "testuser@example.com",                          │
│      "name": "Test User",                                      │
│      "role": "USER"                                            │
│    }                                                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              LOGIN SUCCESS HANDLER (AuthContext)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  const token = response.token;                                 │
│  const userData = {                                            │
│    id: response.id,                                            │
│    email: response.email,                                      │
│    name: response.name,                                        │
│    role: response.role                                         │
│  };                                                            │
│                                                                 │
│  await TokenManager.storeTokens(token, null, userData);        │
│                                                                 │
│  CONSOLE LOG:                                                  │
│  🔑 TokenManager.storeTokens() - Storing...                    │
│  ✅ Stored admin_token (456 chars)                             │
│  ✅ Stored admin_user_id                                       │
│  ✅ Stored admin_user_email                                    │
│  ✅ Stored admin_user_name                                     │
│  ✅ Stored admin_user_role                                     │
│  ✅ All tokens and user data stored in AsyncStorage            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│           AsyncStorage Now Contains (Verified):                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Key: 'admin_token'                                            │
│  Value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."             │
│                                                                 │
│  Key: 'admin_user_id'                                          │
│  Value: "99934100-1cf2-4fc5-a487-9a470234f3b1"                │
│                                                                 │
│  Key: 'admin_user_email'                                       │
│  Value: "testuser@example.com"                                 │
│                                                                 │
│  Key: 'admin_user_name'                                        │
│  Value: "Test User"                                            │
│                                                                 │
│  Key: 'admin_user_role'                                        │
│  Value: "USER"                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│          USER NAVIGATES TO DASHBOARD                            │
├─────────────────────────────────────────────────────────────────┤
│ App makes API request: GET /api/v1/profile                     │
│                                                                 │
│ REQUEST INTERCEPTOR RUNS:                                      │
│                                                                 │
│  const { token } = await TokenManager.getTokens();             │
│                                                                 │
│  CONSOLE LOG:                                                  │
│  🔑 TokenManager.getTokens() - Retrieving...                   │
│  ✅ Retrieved admin_token (456 chars, provider: admin)         │
│                                                                 │
│  token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."            │
│                                                                 │
│  config.headers.Authorization = `Bearer ${token}`;             │
│  🔐 Token source: admin_token (stored from login response)     │
│  ✅ Authorization header set with admin_token                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│          REQUEST SENT TO BACKEND                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  GET /api/v1/profile                                           │
│  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... │
│  Content-Type: application/json                                │
│                                                                 │
│  ✅ BACKEND VALIDATES ADMIN TOKEN                              │
│  ✅ RETURNS 200 OK WITH PROFILE DATA                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Debugging: Where Does Token Go?

### Step 1: After Login, Check These Logs

```
🔐 Login response received. Full response keys: [...]
🔐 Extracted token (multiple paths checked). Token length: 456

🔑 TokenManager.storeTokens() - Storing admin_token and user data per backend spec...
✅ Stored admin_token (456 chars)
✅ Stored admin_user_id
✅ Stored admin_user_email
✅ Stored admin_user_name
✅ Stored admin_user_role
✅ All tokens and user data stored in AsyncStorage

🔐 Persisted admin_token (masked): eyJhbG...Q1mUk
🔐 Persisted user data: {"id":"99934100...","email":"testuser@example.com",...}
```

**✅ If you see all these**: Token is stored correctly!
**❌ If missing any**: Check if login response contains correct fields

### Step 2: After Making API Request, Check These Logs

```
🔑 TokenManager.getTokens() - Retrieving admin_token from AsyncStorage...
✅ Retrieved admin_token (456 chars, provider: admin)

🔐 Token source: admin_token (stored from login response)
✅ Authorization header set with admin_token
```

**✅ If you see these**: Interceptor is using admin_token correctly!
**❌ If you see "No tokens found"**: storeTokens() didn't actually save

### Step 3: Check Backend Received Correct Token

Backend logs should show:
```
POST /auth/login 200 OK
GET /api/v1/profile 200 OK  ← Bearer header correct!

❌ NOT:
GET /api/v1/profile 401 Unauthorized  ← Wrong token
```

---

## Copy-Paste Code: Verify Storage

If you suspect token is not being stored, add this debug code right after login:

```javascript
// Right after TokenManager.storeTokens() call
console.log('🔍 DEBUGGING TOKEN STORAGE:');

// Check if token was actually stored
const storedToken = await AsyncStorage.getItem('admin_token');
console.log('🔍 admin_token in AsyncStorage:', storedToken ? 'YES (' + storedToken.length + ' chars)' : 'NO');

const storedUserId = await AsyncStorage.getItem('admin_user_id');
console.log('🔍 admin_user_id in AsyncStorage:', storedUserId ? 'YES' : 'NO');

const storedEmail = await AsyncStorage.getItem('admin_user_email');
console.log('🔍 admin_user_email in AsyncStorage:', storedEmail ? 'YES' : 'NO');

// Try to retrieve via TokenManager
const { token, provider } = await TokenManager.getTokens();
console.log('🔍 TokenManager.getTokens() returned:', token ? 'YES (provider: ' + provider + ')' : 'NO');
```

Expected output:
```
🔍 DEBUGGING TOKEN STORAGE:
🔍 admin_token in AsyncStorage: YES (456 chars)
🔍 admin_user_id in AsyncStorage: YES
🔍 admin_user_email in AsyncStorage: YES
🔍 TokenManager.getTokens() returned: YES (provider: admin)
```

---

## Function Signatures (TypeScript-style)

```typescript
// STORE
async storeTokens(
  token: string,           // JWT from backend
  refreshToken: null,      // Usually null
  userData: {              // User data object
    id: string;
    email: string;
    name: string;
    role: string;
  }
): Promise<void>

// GET
async getTokens(): Promise<{
  token: string | null,
  refreshToken: string | null,
  provider: 'admin' | 'credentials' | null
}>

// GET USER DATA
async getUserData(): Promise<{
  id: string | null,
  email: string | null,
  name: string | null,
  role: string | null
}>

// CLEAR
async clearTokens(): Promise<void>

// CHECK
async hasValidTokens(): Promise<boolean>
```

---

## The Most Important Thing

When `storeTokens(token, null, userData)` is called:

```
✅ CORRECT:
await AsyncStorage.setItem('admin_token', token);
await AsyncStorage.setItem('admin_user_id', userData.id);

❌ WRONG:
// If you were manually setting keys, it would be:
await AsyncStorage.setItem('some_other_key', token);  // ← WRONG KEY!
```

**The TokenManager handles all the key names for you!** You just pass token and userData, it does the storage.

---

## One-Line Summary

**storeTokens()** → saves to 5 AsyncStorage keys | **getTokens()** → reads back the token | **getUserData()** → reads back user data
