# Quick Reference: Backend Spec Implementation

## Key Code Locations

### 1. Login Flow
**File**: `src/context/AuthContext.js`
**Function**: `login(email, password)`
**Lines**: 200-290

```javascript
// Firebase sign-in
const firebaseAuth = getFirebaseAuth();
const userCred = await signInWithEmailAndPassword(firebaseAuth, email, password);
const firebaseIdToken = await userCred.user.getIdToken(true);

// Send to backend
response = await authAPI.loginWithGoogle(firebaseIdToken);

// Extract token and user data
const token = response.token;
const userData = {
  id: response.id,
  email: response.email,
  name: response.name,
  role: response.role,
};

// Store both token and user data
await TokenManager.storeTokens(token, null, userData);
```

---

### 2. Token Storage
**File**: `src/services/tokenManager.js`
**Function**: `storeTokens(token, refreshToken, userData)`
**Lines**: 18-51

Stores 5 separate keys:
- `admin_token` - JWT token from backend
- `admin_user_id` - User UUID
- `admin_user_email` - User email
- `admin_user_name` - User name
- `admin_user_role` - User role

---

### 3. Token Retrieval (with NO Firebase fallback)
**File**: `src/services/tokenManager.js`
**Function**: `getTokens()`
**Lines**: 54-81

Returns stored admin_token (NEVER uses Firebase as fallback)

---

### 4. API Request Headers
**File**: `src/services/api.js`
**Section**: Request Interceptor
**Lines**: 95-131

```javascript
const { token } = await TokenManager.getTokens();

// ONLY use admin_token
if (token) {
  config.headers.Authorization = `Bearer ${token}`;
  console.log('🔐 Token source: admin_token (stored from login response)');
}
```

**CRITICAL**: No Firebase fallback - if admin_token missing, request fails

---

### 5. Logout
**File**: `src/services/tokenManager.js`
**Function**: `clearTokens()`
**Lines**: 145-165

Clears all 5 admin_* keys:
```javascript
await AsyncStorage.multiRemove([
  ADMIN_TOKEN_KEY,           // admin_token
  ADMIN_USER_ID_KEY,         // admin_user_id
  ADMIN_USER_EMAIL_KEY,      // admin_user_email
  ADMIN_USER_NAME_KEY,       // admin_user_name
  ADMIN_USER_ROLE_KEY,       // admin_user_role
]);
```

---

### 6. App Restart / Session Restore
**File**: `src/context/AuthContext.js`
**Effect**: `initializeAuth()`
**Lines**: 115-140

Checks AsyncStorage for admin_token on app launch:
- If token exists → restore session (fetch profile)
- If token missing → show login screen

---

## AsyncStorage Keys Reference

| Key | Type | Storage | Cleared On |
|-----|------|---------|-----------|
| `admin_token` | JWT | AsyncStorage | Logout |
| `admin_user_id` | UUID | AsyncStorage | Logout |
| `admin_user_email` | String | AsyncStorage | Logout |
| `admin_user_name` | String | AsyncStorage | Logout |
| `admin_user_role` | String | AsyncStorage | Logout |

---

## API Flow

```
POST /api/v1/auth/login
{
  "idToken": "firebase_id_token_here"
}
        ↓
200 OK
{
  "token": "admin_token_here",
  "id": "user_uuid",
  "email": "user@example.com",
  "name": "User Name",
  "role": "USER",
  ...
}
        ↓
Store all fields in AsyncStorage
        ↓
Subsequent requests:
GET /api/v1/profile
Authorization: Bearer admin_token_here
```

---

## Console Logs to Verify Compliance

After login, you should see these logs in Metro console:

```
✅ Firebase sign-in successful
✅ Stored admin_token (1234 chars)
✅ Stored admin_user_id
✅ Stored admin_user_email
✅ Stored admin_user_name
✅ Stored admin_user_role
🔐 Token source: admin_token (stored from login response)
```

---

## Error Scenarios

### Scenario 1: Firebase Sign-in Fails
```javascript
if (firebaseError) {
  // Fall back to credentials login
  response = await authAPI.login(email, password);
}
```

### Scenario 2: Invalid Firebase Token
Backend returns: `{ "error": "Invalid token" }`
Handler: Logout and show login screen

### Scenario 3: No Admin Token After Login
Interceptor logs: `⚠️ No admin_token available - request will be unauthorized`
Result: Request fails (intentional - user must login first)

---

## Testing Commands

```bash
# Start metro with cache clear
npm start -- --clear

# Run on Android
npx expo run:android

# Run on iOS (macOS only)
npx expo run:ios

# Clean and reset
npm run android:clean
```

---

## Files Modified Summary

1. **tokenManager.js**: Token & user data storage
   - +5 new AsyncStorage keys
   - +1 new method (getUserData)
   - ~50 lines changed

2. **AuthContext.js**: Login flows
   - Pass userData to TokenManager
   - ~15 lines changed

3. **api.js**: Request interceptor
   - **Remove Firebase fallback** (CRITICAL)
   - Only use admin_token
   - ~35 lines changed

**Total Changes**: ~100 lines | **Backward Compat**: ✅ Yes | **Breaking**: ❌ No

---

## Next Steps

1. ✅ Code changes applied
2. ✅ No compile errors
3. 👉 **Test login flow**
4. 👉 Verify admin_token usage in API requests
5. 👉 Check backend logs confirm Bearer header
6. 👉 Test app restart (token restoration)
7. 👉 Test logout (keys cleared)

---

## Support

For issues:
1. Check Metro console for error messages
2. Verify admin_token in AsyncStorage (AsyncStorage Inspector)
3. Check backend logs for Bearer header
4. Review compliance documents in repo root
