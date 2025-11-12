# TokenManager: Code Copy-Paste Reference

## Complete Code (All 3 Functions + Usage)

### File: `src/services/tokenManager.js`

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================
// KEY NAMES (Copy these exactly!)
// ==========================================
const ADMIN_TOKEN_KEY = 'admin_token';
const ADMIN_USER_ID_KEY = 'admin_user_id';
const ADMIN_USER_EMAIL_KEY = 'admin_user_email';
const ADMIN_USER_NAME_KEY = 'admin_user_name';
const ADMIN_USER_ROLE_KEY = 'admin_user_role';
const TOKEN_KEY = '@LasoCoach:authToken';           // Legacy
const REFRESH_TOKEN_KEY = '@LasoCoach:refreshToken'; // Legacy
const AUTH_PROVIDER_KEY = '@LasoCoach:authProvider'; // Legacy

// ==========================================
// FUNCTION 1: STORE TOKEN + USER DATA
// ==========================================
async storeTokens(token, refreshToken, userData = {}) {
  try {
    console.log('🔑 TokenManager.storeTokens() - Storing admin_token and user data per backend spec...');
    
    // Store token
    if (token) {
      await AsyncStorage.setItem(ADMIN_TOKEN_KEY, token);
      console.log(`✅ Stored admin_token (${token.length} chars)`);
    }
    
    // Store user data
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
    
    // Legacy backward compatibility
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

// ==========================================
// FUNCTION 2: GET TOKEN
// ==========================================
async getTokens() {
  try {
    console.log('🔑 TokenManager.getTokens() - Retrieving admin_token from AsyncStorage...');
    
    // Try to get admin_token (new key)
    const adminToken = await AsyncStorage.getItem(ADMIN_TOKEN_KEY);
    
    if (adminToken) {
      console.log(`✅ Retrieved admin_token (${adminToken.length} chars, provider: admin)`);
      return { token: adminToken, refreshToken: null, provider: 'admin' };
    }
    
    // Fallback to legacy token
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

// ==========================================
// FUNCTION 3: GET USER DATA
// ==========================================
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

// ==========================================
// FUNCTION 4: CLEAR TOKENS (on logout)
// ==========================================
async clearTokens() {
  try {
    console.log('🔑 TokenManager.clearTokens() - Clearing all tokens and user data (logout)...');
    
    await AsyncStorage.multiRemove([
      ADMIN_TOKEN_KEY,
      ADMIN_USER_ID_KEY,
      ADMIN_USER_EMAIL_KEY,
      ADMIN_USER_NAME_KEY,
      ADMIN_USER_ROLE_KEY,
      TOKEN_KEY,
      REFRESH_TOKEN_KEY,
      AUTH_PROVIDER_KEY,
    ]);
    console.log('✅ All tokens and user data cleared from AsyncStorage');
    
  } catch (error) {
    console.error('❌ TokenManager.clearTokens() error:', error.message);
  }
}

// ==========================================
// FUNCTION 5: CHECK IF LOGGED IN
// ==========================================
async hasValidTokens() {
  const { token } = await this.getTokens();
  return !!token;
}

// Export all functions
export const TokenManager = {
  storeTokens,
  getTokens,
  getUserData,
  clearTokens,
  hasValidTokens,
};
```

---

## How to Use (In AuthContext.js)

### Import:
```javascript
import { TokenManager } from '../services/tokenManager';
```

### After Login Success:
```javascript
// This is what happens after backend returns login response
const response = await authAPI.loginWithGoogle(firebaseIdToken);

// Extract token
const token = response.token;

// Extract user data
const userData = {
  id: response.id,
  email: response.email,
  name: response.name,
  role: response.role,
};

// STORE IT!
await TokenManager.storeTokens(token, null, userData);
// ↑ This stores to 5 AsyncStorage keys automatically
```

### To Get Token Later (In Interceptor):
```javascript
const { token, provider } = await TokenManager.getTokens();
// token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
// provider = 'admin' or 'credentials' or null

if (token) {
  config.headers.Authorization = `Bearer ${token}`;
}
```

### To Get User Data:
```javascript
const userData = await TokenManager.getUserData();
// userData = { id: "...", email: "...", name: "...", role: "..." }
```

### On Logout:
```javascript
await TokenManager.clearTokens();
// All 8 AsyncStorage keys are deleted
```

---

## What Gets Stored in AsyncStorage

When you call:
```javascript
await TokenManager.storeTokens(
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  null,
  {
    id: "99934100-1cf2-4fc5-a487-9a470234f3b1",
    email: "user@example.com",
    name: "John Doe",
    role: "USER"
  }
);
```

AsyncStorage ends up with these 5 NEW keys:
```javascript
AsyncStorage {
  'admin_token': "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  'admin_user_id': "99934100-1cf2-4fc5-a487-9a470234f3b1",
  'admin_user_email': "user@example.com",
  'admin_user_name': "John Doe",
  'admin_user_role': "USER"
}
```

Plus 3 LEGACY keys for backward compat:
```javascript
AsyncStorage {
  '@LasoCoach:authToken': "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  // ... other legacy keys
}
```

---

## Testing: Add This Debug Code

Put this right after `storeTokens()` in AuthContext to verify it worked:

```javascript
// VERIFY STORAGE
const storedToken = await AsyncStorage.getItem('admin_token');
const storedUserId = await AsyncStorage.getItem('admin_user_id');
const storedEmail = await AsyncStorage.getItem('admin_user_email');
const storedName = await AsyncStorage.getItem('admin_user_name');
const storedRole = await AsyncStorage.getItem('admin_user_role');

console.log('🔍 VERIFY STORAGE:');
console.log('  admin_token:', storedToken ? '✅ YES' : '❌ NO');
console.log('  admin_user_id:', storedUserId ? '✅ YES' : '❌ NO');
console.log('  admin_user_email:', storedEmail ? '✅ YES' : '❌ NO');
console.log('  admin_user_name:', storedName ? '✅ YES' : '❌ NO');
console.log('  admin_user_role:', storedRole ? '✅ YES' : '❌ NO');

// VERIFY RETRIEVAL
const retrieved = await TokenManager.getTokens();
console.log('🔍 TokenManager.getTokens():', retrieved.token ? '✅ RETURNS TOKEN' : '❌ RETURNS NULL');
```

Expected output:
```
🔍 VERIFY STORAGE:
  admin_token: ✅ YES
  admin_user_id: ✅ YES
  admin_user_email: ✅ YES
  admin_user_name: ✅ YES
  admin_user_role: ✅ YES
🔍 TokenManager.getTokens(): ✅ RETURNS TOKEN
```

If you see any ❌, then storage failed!

---

## Key Points

1. **5 Keys Are Stored**: admin_token, admin_user_id, admin_user_email, admin_user_name, admin_user_role
2. **No Manual Setup**: TokenManager is just exported, not initialized
3. **Auto Retrieval**: getTokens() checks 'admin_token' first, then falls back to legacy
4. **Logging**: Every operation logs to Metro console, so you can see what's happening

---

## Quick API Reference

| Call | What it Does | Returns |
|------|-------------|---------|
| `storeTokens(token, null, userData)` | Saves token + user data to 5 keys | Promise |
| `getTokens()` | Reads token from AsyncStorage | `{ token, refreshToken, provider }` |
| `getUserData()` | Reads 4 user fields from AsyncStorage | `{ id, email, name, role }` |
| `clearTokens()` | Deletes all 8 keys from AsyncStorage | Promise |
| `hasValidTokens()` | Checks if token exists | boolean |

---

## The Most Common Problem

**Problem**: `getTokens()` returns `{ token: null, ... }`

**Cause**: `storeTokens()` was never called OR it failed silently

**Solution**: 
1. Check if login response contains `token` field
2. Verify `storeTokens()` is being called with correct parameters
3. Check Metro logs for errors during storage
4. Run the debug code above to verify AsyncStorage keys exist

---

## Real Login Flow (Step by Step)

```javascript
// 1. USER SUBMITS CREDENTIALS
await login(email, password);

// 2. BACKEND RETURNS RESPONSE
const response = await authAPI.loginWithGoogle(firebaseIdToken);
// response.token = JWT
// response.id = user ID
// response.email = user email
// response.name = user name
// response.role = user role

// 3. WE STORE IT
const userData = {
  id: response.id,
  email: response.email,
  name: response.name,
  role: response.role,
};
await TokenManager.storeTokens(response.token, null, userData);
// ↓ AsyncStorage now has 5 keys

// 4. USER CLICKS API BUTTON (like GET /profile)
// Interceptor runs:
const { token } = await TokenManager.getTokens();
// ↓ Returns the stored token!

config.headers.Authorization = `Bearer ${token}`;
// ↓ Sets correct header

// 5. REQUEST SENT
// GET /api/v1/profile
// Authorization: Bearer <token>
// ↓ Backend receives correct token ✅
```

---

That's it! The TokenManager handles everything. You just:
1. Call `storeTokens(token, null, userData)` after login
2. Call `getTokens()` in the interceptor
3. Call `clearTokens()` on logout
