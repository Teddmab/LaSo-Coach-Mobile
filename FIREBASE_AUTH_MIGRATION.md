# Firebase Auth Migration Guide

## Summary

This project now has an improved Firebase-based authentication system that aligns with the web app implementation. The new system provides better token management, automatic refresh, and cleaner separation of concerns.

## Key Files Added

1. **`src/services/firebaseAuthServiceNew.js`** - New Firebase auth service with automatic ID token management
2. **`src/context/FirebaseAuthContext.js`** - React context using the new Firebase service

## Key Improvements from Web App

### 1. Better Firebase ID Token Handling
- **Web app approach**: Gets Firebase ID tokens and sends them to backend for verification
- **Mobile improvement**: Automatic Firebase ID token inclusion in all API requests via axios interceptors

### 2. Improved Request/Response Interceptors
- **Web app approach**: Handles token refresh, cache-busting, and proper error handling
- **Mobile improvement**: Adapted for React Native with better error messaging and automatic retry logic

### 3. Cleaner Service Separation
- **Web app approach**: Separate Firebase auth service from React context
- **Mobile improvement**: Same pattern - `firebaseAuthService` handles auth logic, context manages React state

### 4. Enhanced Error Handling
- **Web app approach**: Specific error handling for different auth endpoints and scenarios
- **Mobile improvement**: French error messages and React Native Toast integration

## Usage Examples

### Login with Email/Password
```javascript
// Old way (AuthContext.js)
const { login } = useAuth();
const result = await login(email, password);

// New way (FirebaseAuthContext.js) - same interface
const { login } = useAuth();
const result = await login(email, password);
```

### Google Login
```javascript
// Old way
const { loginWithGoogle } = useAuth();
const result = await loginWithGoogle(googleIdToken);

// New way - same interface
const { loginWithGoogle } = useAuth();
const result = await loginWithGoogle(googleIdToken);
```

### Direct Firebase Service Usage
```javascript
import firebaseAuthService from '../services/firebaseAuthServiceNew';

// Get current Firebase ID token
const idToken = await firebaseAuthService.getIdToken();

// Update user profile via backend
const updatedUser = await firebaseAuthService.updateUserProfile({
  firstName: 'John',
  lastName: 'Doe'
});
```

## API Request Pattern

The new service automatically includes Firebase ID tokens in all requests:

```javascript
// Automatic token inclusion - no manual headers needed
const response = await firebaseAuthService.backendApi.get('/api/profile');

// Automatic token refresh on 401 errors
// If Firebase token expires, it's automatically refreshed and request retried
```

## Migration Steps

### To use the new Firebase auth system:

1. **Replace AuthProvider in App.js**:
   ```javascript
   // Change from:
   import { AuthProvider } from './src/context/AuthContext';
   
   // To:
   import { AuthProvider } from './src/context/FirebaseAuthContext';
   ```

2. **Update imports in screens**:
   ```javascript
   // Keep the same hook name
   import { useAuth } from '../context/FirebaseAuthContext';
   ```

3. **The API interface remains the same** - no screen-level changes needed

## Benefits

1. **Consistent with web app** - Same authentication patterns and flows
2. **Automatic token management** - No manual token refresh logic needed  
3. **Better error handling** - More specific error messages and retry logic
4. **Cleaner architecture** - Separation between Firebase auth and React state
5. **Enhanced security** - Always uses fresh Firebase ID tokens for API calls

## Backward Compatibility

The old `AuthContext.js` remains functional. You can migrate gradually by:
1. Testing the new system in development
2. Comparing behavior with existing auth flows
3. Switching providers when ready

Both contexts expose the same hook interface (`useAuth`), so screens don't need changes during migration.