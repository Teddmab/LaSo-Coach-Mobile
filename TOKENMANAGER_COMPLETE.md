# TokenManager Complete Code Analysis

## 1. ASYNCSTORAGE KEY NAMES (What it actually stores)

```javascript
// Admin token and user data keys (per backend spec)
const ADMIN_TOKEN_KEY = 'admin_token';                 // ← The main token
const ADMIN_USER_ID_KEY = 'admin_user_id';             // ← User ID
const ADMIN_USER_EMAIL_KEY = 'admin_user_email';       // ← User email
const ADMIN_USER_NAME_KEY = 'admin_user_name';         // ← User name
const ADMIN_USER_ROLE_KEY = 'admin_user_role';         // ← User role

// Legacy keys (kept for backward compatibility during migration)
const TOKEN_KEY = '@LasoCoach:authToken';              // ← Old key (fallback)
const REFRESH_TOKEN_KEY = '@LasoCoach:refreshToken';   // ← Old refresh token
const AUTH_PROVIDER_KEY = '@LasoCoach:authProvider';   // ← Old provider
```

### Key Storage Map

When you call `TokenManager.storeTokens(token, null, userData)`, it stores:

| Function Call | AsyncStorage Key | Value |
|---------------|------------------|-------|
| `storeTokens(token, ...)` | `admin_token` | `token` (JWT) |
| `userData.id` | `admin_user_id` | `userData.id` |
| `userData.email` | `admin_user_email` | `userData.email` |
| `userData.name` | `admin_user_name` | `userData.name` |
| `userData.role` | `admin_user_role` | `userData.role` |
| Backward compat | `@LasoCoach:authToken` | `token` (same JWT) |

---

## 2. storeTokens() FUNCTION

**Location**: `src/services/tokenManager.js`, lines 27-68

```javascript
async storeTokens(token, refreshToken, userData = {}) {
  try {
    console.log('🔑 TokenManager.storeTokens() - Storing admin_token and user data per backend spec...');
    
    // Store admin token (CRITICAL per backend spec)
    if (token) {
      await AsyncStorage.setItem(ADMIN_TOKEN_KEY, token);
      console.log(`✅ Stored admin_token (${token.length} chars)`);
    }
    
    // Store user data in separate keys (per backend spec AsyncStorage keys reference)
    if (userData.id) {
      await AsyncStorage.setItem(ADMIN_USER_ID_KEY, userData.id);
      console.log('✅ Stored admin_user_id');
    }
    if (userData.email) {
      await AsyncStorage.setItem(ADMIN_USER_EMAIL_KEY, userData.email);
      console.log('✅ Stored admin_user_email');
    }
    if (userData.name) {
      await AsyncStorage.setItem(ADMIN_USER_NAME_KEY, userData.name);
      console.log('✅ Stored admin_user_name');
    }
    if (userData.role) {
      await AsyncStorage.setItem(ADMIN_USER_ROLE_KEY, userData.role);
      console.log('✅ Stored admin_user_role');
    }
    
    // Also store legacy keys for backward compatibility
    if (token) {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    }
    if (refreshToken) {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    
    console.log('✅ All tokens and user data stored in AsyncStorage');
  } catch (error) {
    console.error('❌ TokenManager.storeTokens() error:', error.message);
    throw new Error('Failed to store authentication tokens');
  }
}
```

### What it does:
1. Checks if token exists, then stores under `admin_token` key
2. Stores each userData field (id, email, name, role) under separate keys
3. Also stores under legacy keys for backward compat
4. Logs each storage operation

### Usage from AuthContext:
```javascript
const userData = {
  id: response.id,
  email: response.email,
  name: response.name,
  role: response.role,
};
await TokenManager.storeTokens(token, null, userData);
```

---

## 3. getTokens() FUNCTION

**Location**: `src/services/tokenManager.js`, lines 70-103

```javascript
async getTokens() {
  try {
    console.log('🔑 TokenManager.getTokens() - Retrieving admin_token from AsyncStorage...');
    
    // CRITICAL per backend spec: Prefer admin_token (returned from login endpoint)
    const adminToken = await AsyncStorage.getItem(ADMIN_TOKEN_KEY);
    
    if (adminToken) {
      console.log(`✅ Retrieved admin_token (${adminToken.length} chars, provider: admin)`);
      return { token: adminToken, refreshToken: null, provider: 'admin' };
    }
    
    // Fallback to legacy token for backward compatibility (during migration only)
    const legacyToken = await AsyncStorage.getItem(TOKEN_KEY);
    if (legacyToken) {
      console.log(`⚠️ Using legacy token (${legacyToken.length} chars, provider: credentials) - NO admin_token found`);
      return { token: legacyToken, refreshToken: null, provider: 'credentials' };
    }
    
    console.log('ℹ️ No tokens found in AsyncStorage');
    return { token: null, refreshToken: null, provider: null };
    
  } catch (error) {
    console.error('❌ TokenManager.getTokens() error:', error.message);
    return { token: null, refreshToken: null, provider: null };
  }
}
```

### What it does:
1. **FIRST**: Tries to read `admin_token` key
2. **IF NOT FOUND**: Falls back to `@LasoCoach:authToken` (legacy)
3. **IF NEITHER**: Returns all nulls (user must login)
4. Returns object: `{ token, refreshToken, provider }`

### Return values:
- ✅ If admin_token exists: `{ token: "jwt...", refreshToken: null, provider: 'admin' }`
- ⚠️ If only legacy token: `{ token: "jwt...", refreshToken: null, provider: 'credentials' }`
- ❌ If no token: `{ token: null, refreshToken: null, provider: null }`

---

## 4. getUserData() FUNCTION

**Location**: `src/services/tokenManager.js`, lines 105-118

```javascript
async getUserData() {
  try {
    const id = await AsyncStorage.getItem(ADMIN_USER_ID_KEY);
    const email = await AsyncStorage.getItem(ADMIN_USER_EMAIL_KEY);
    const name = await AsyncStorage.getItem(ADMIN_USER_NAME_KEY);
    const role = await AsyncStorage.getItem(ADMIN_USER_ROLE_KEY);
    
    return { id, email, name, role };
  } catch (error) {
    console.error('❌ TokenManager.getUserData() error:', error.message);
    return { id: null, email: null, name: null, role: null };
  }
}
```

### What it does:
- Reads the 4 user data keys from AsyncStorage
- Returns object: `{ id, email, name, role }`
- Returns nulls if any key is missing or error occurs

---

## 5. WHERE/HOW TOKENMANAGER IS INITIALIZED

TokenManager is **NOT initialized** — it's an object with static methods that are called directly.

### Import in AuthContext:
```javascript
// src/context/AuthContext.js, line 2
import { TokenManager } from '../services/tokenManager';
```

### Direct usage (no initialization):
```javascript
// You just call the methods directly
await TokenManager.storeTokens(token, null, userData);
const { token } = await TokenManager.getTokens();
const userData = await TokenManager.getUserData();
```

### Where it's used:
1. **AuthContext.js** - login(), loginWithGoogle(), initializeAuth()
2. **api.js** - Request interceptor
3. **Any component** that imports it

---

## 6. COMPLETE FLOW: Store → Retrieve → Use

```
STEP 1: AFTER LOGIN SUCCESS
─────────────────────────────
Backend returns:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",  ← Admin token JWT
  "id": "99934100-1cf2-4fc5-...",
  "email": "user@example.com",
  "name": "User Name",
  "role": "USER"
}

↓

STEP 2: LOGIN HANDLER CALLS
─────────────────────────────
const userData = {
  id: response.id,
  email: response.email,
  name: response.name,
  role: response.role,
};
await TokenManager.storeTokens(token, null, userData);

↓

STEP 3: TOKENMANGER.STORETOKENS() STORES
─────────────────────────────────────────
AsyncStorage.setItem('admin_token', 'eyJhbGciOiJIUzI1NiIs...')
AsyncStorage.setItem('admin_user_id', '99934100-1cf2-4fc5-...')
AsyncStorage.setItem('admin_user_email', 'user@example.com')
AsyncStorage.setItem('admin_user_name', 'User Name')
AsyncStorage.setItem('admin_user_role', 'USER')

↓

STEP 4: INTERCEPTOR CALLS GETTOKENS()
──────────────────────────────────────
const { token } = await TokenManager.getTokens();
// Returns: { token: 'eyJhbGciOiJIUzI1NiIs...', refreshToken: null, provider: 'admin' }

↓

STEP 5: INTERCEPTOR ADDS HEADER
────────────────────────────────
config.headers.Authorization = `Bearer ${token}`;
// Sets: Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

↓

STEP 6: REQUEST SENT
────────────────────
GET /api/v1/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

↓

STEP 7: BACKEND ACCEPTS
───────────────────────
✅ Backend validates admin_token
✅ Returns 200 OK with data
```

---

## 7. POTENTIAL ISSUES & DEBUGGING

### Issue: Token is null after storage

**Symptom**: `getTokens()` returns `{ token: null, ... }`

**Check 1: Is token being passed correctly?**
```javascript
// Add this log in AuthContext login() BEFORE calling storeTokens
console.log('🔍 DEBUG: Token to store:', token ? token.substring(0, 20) + '...' : 'NULL');
console.log('🔍 DEBUG: userData:', userData);

// If token is null here, problem is in extraction
```

**Check 2: Is storeTokens actually being called?**
```javascript
// Should see in Metro logs:
// 🔑 TokenManager.storeTokens() - Storing admin_token and user data per backend spec...
// ✅ Stored admin_token (123 chars)
// ✅ Stored admin_user_id
// etc.
```

**Check 3: Is getTokens actually reading?**
```javascript
// Should see in Metro logs:
// 🔑 TokenManager.getTokens() - Retrieving admin_token from AsyncStorage...
// ✅ Retrieved admin_token (123 chars, provider: admin)
```

### Issue: AsyncStorage.setItem fails silently

**Check**: Is AsyncStorage imported and initialized correctly?
```javascript
// Should see in auth initialization:
// 🔐 Starting auth initialization...
// 🔑 TokenManager.getTokens() - Retrieving admin_token from AsyncStorage...
```

### Issue: Old token is being retrieved instead

**Symptom**: Logs show "Using legacy token" instead of "Retrieved admin_token"

**Cause**: `admin_token` key doesn't exist, falling back to old key

**Fix**: Make sure storeTokens is using NEW key name:
```javascript
// Should store to:
await AsyncStorage.setItem('admin_token', token);  // ✅ NEW KEY

// NOT:
await AsyncStorage.setItem('@LasoCoach:authToken', token);  // ❌ OLD KEY
```

---

## 8. QUICK REFERENCE TABLE

| Function | Returns | Use Case |
|----------|---------|----------|
| `storeTokens(token, null, userData)` | Promise<void> | After login, store token + user data |
| `getTokens()` | Promise<{token, refreshToken, provider}> | Before API request, get token |
| `getUserData()` | Promise<{id, email, name, role}> | Get user profile from storage |
| `clearTokens()` | Promise<void> | On logout, clear everything |
| `hasValidTokens()` | Promise<boolean> | Check if user is logged in |

---

## 9. ASYNCSTORAGE KEYS SUMMARY

When you call `storeTokens(token, null, userData)` with:
```javascript
token = "eyJhbGciOiJIUzI1NiIs..."
userData = {
  id: "99934100-1cf2-4fc5-a487-9a470234f3b1",
  email: "user@example.com",
  name: "User Name",
  role: "USER"
}
```

AsyncStorage receives:
```
'admin_token'           → "eyJhbGciOiJIUzI1NiIs..."
'admin_user_id'         → "99934100-1cf2-4fc5-a487-9a470234f3b1"
'admin_user_email'      → "user@example.com"
'admin_user_name'       → "User Name"
'admin_user_role'       → "USER"
'@LasoCoach:authToken'  → "eyJhbGciOiJIUzI1NiIs..." (backward compat)
```

---

## 10. COMPLETE EXAMPLE: Login → Store → Use

```javascript
// ============================================
// 1. AFTER BACKEND LOGIN RESPONDS (AuthContext.js)
// ============================================
const response = await authAPI.loginWithGoogle(firebaseIdToken);
// response = {
//   token: "eyJhbGciOiJIUzI1NiIs...",
//   id: "99934100-1cf2-4fc5-...",
//   email: "user@example.com",
//   name: "User Name",
//   role: "USER"
// }

// Extract and store
const token = response.token;
const userData = {
  id: response.id,
  email: response.email,
  name: response.name,
  role: response.role,
};
await TokenManager.storeTokens(token, null, userData);

// ============================================
// 2. TOKENMANGER STORES (TokenManager.js)
// ============================================
// AsyncStorage now has:
{
  'admin_token': 'eyJhbGciOiJIUzI1NiIs...',
  'admin_user_id': '99934100-1cf2-4fc5-...',
  'admin_user_email': 'user@example.com',
  'admin_user_name': 'User Name',
  'admin_user_role': 'USER'
}

// ============================================
// 3. INTERCEPTOR RETRIEVES (api.js)
// ============================================
const { token } = await TokenManager.getTokens();
// token = 'eyJhbGciOiJIUzI1NiIs...'

config.headers.Authorization = `Bearer ${token}`;
// Header = 'Authorization: Bearer eyJhbGciOiJIUzI1NiIs...'

// ============================================
// 4. REQUEST SENT WITH HEADER
// ============================================
// GET /api/v1/profile
// Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
//
// ✅ Backend accepts and responds with profile
```

---

## Summary

✅ **storeTokens()** — Saves token + user data to 5 AsyncStorage keys
✅ **getTokens()** — Reads `admin_token` key (or falls back to legacy key)
✅ **getUserData()** — Reads the 4 user data keys
✅ **No initialization** — Just import and call methods directly
✅ **AsyncStorage keys** — admin_token, admin_user_id, admin_user_email, admin_user_name, admin_user_role

**The flow is solid** — if token is stored correctly, `getTokens()` will retrieve it!
