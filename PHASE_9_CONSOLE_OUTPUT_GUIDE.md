# Phase 9: Console Output & Debugging Guide

## Expected Console Output

### ✅ Successful Account Deletion Flow

```
🗑️ [useSecurity] Starting account deletion...
🗑️ ACCOUNT DELETION - Starting complete account deletion process...
📡 Deleting user account from backend...
✅ Backend account deleted
🔥 Deleting Firebase account...
✅ Firebase account deleted
🧹 Performing complete cleanup...
🚪🚪🚪 DÉCONNEXION COMPLÈTE - Suppression de TOUT...
🗑️🗑️🗑️ NETTOYAGE COMPLET d'AsyncStorage - Suppression de TOUS les tokens et données...
✅ AsyncStorage complètement nettoyé
🔥 Déconnexion de Firebase...
✅ Firebase déconnecté
💀💀💀 Déconnexion ULTRA-BRUTALE de Google Sign-In...
💀 Déconnexion Google Sign-In...
✅ Accès révoqué
✅ Déconnexion effectuée
✅ SDK reconfiguré
✅✅✅ Déconnexion Google complète
✅✅✅ DÉCONNEXION COMPLÈTE TERMINÉE - RIEN n'a été gardé en mémoire
✅ AsyncStorage nettoyé, Firebase déconnecté, Google Sign-In supprimé
✅✅✅ ACCOUNT DELETION COMPLETE - All data removed
✅ [useSecurity] Account deletion successful

[SUCCESS ALERT SHOWN TO USER]
```

### ❌ Failed Account Deletion - Backend Error

```
🗑️ [useSecurity] Starting account deletion...
🗑️ ACCOUNT DELETION - Starting complete account deletion process...
📡 Deleting user account from backend...
❌ Account deletion failed: [Backend error message]
❌ [useSecurity] Account deletion failed: [error message]

[ERROR ALERT SHOWN TO USER with Support Contact Option]
```

### ❌ Failed Account Deletion - Firebase Error

```
🗑️ [useSecurity] Starting account deletion...
🗑️ ACCOUNT DELETION - Starting complete account deletion process...
📡 Deleting user account from backend...
✅ Backend account deleted
🔥 Deleting Firebase account...
❌ Account deletion failed: [Firebase error code]
❌ [useSecurity] Account deletion failed: [User-friendly error message]

[ERROR ALERT SHOWN TO USER with Support Contact Option]
```

---

## Debugging Checklist

### When Testing Account Deletion

#### Pre-Deletion Checks
```javascript
// In browser console or debugger, check:
localStorage.getItem('@LasoCoach:authToken');       // Should exist
localStorage.getItem('@LasoCoach:user');            // Should exist
firebase.auth().currentUser;                         // Should be logged in user
```

#### During Deletion Process
```javascript
// Watch console for these emojis:
// ✅ indicates progress
// ❌ indicates error
// 🗑️ indicates data wipe
// 📡 indicates API calls
// 🔥 indicates Firebase operations
// 💀 indicates Google Sign-In cleanup
```

#### Post-Deletion Checks
```javascript
// After successful deletion:
localStorage.getAllKeys();                           // Should be empty
firebase.auth().currentUser;                         // Should be null
AsyncStorage.getAllKeys() // Should be empty (RN)
```

---

## Common Error Messages & Solutions

### Error: "Failed to delete account on backend"

**Cause**: Backend DELETE /profile endpoint failed

**Solution**:
1. Check backend logs for /profile DELETE endpoint
2. Verify user has permission to delete their own account
3. Verify Firebase ID token is being passed
4. Check if user record exists in database

**Console Check**:
```
❌ Account deletion failed: Failed to delete account on backend
```

---

### Error: "No user logged in"

**Cause**: User was logged out before deletion was called

**Solution**:
1. Ensure user is still logged in when deletion starts
2. Check if session expired during confirmation dialogs
3. Verify Firebase auth state is still active

**Console Check**:
```
🗑️ ACCOUNT DELETION - Starting...
❌ Account deletion failed: No user logged in
```

---

### Error: "Session expired. Please login again."

**Cause**: Firebase ID token refreshed failed during deletion

**Solution**:
1. Check internet connection
2. Verify Firebase configuration
3. Check if user's password/credentials are still valid

**Console Check**:
```
❌ Account deletion failed: Session expired. Please login again.
```

---

### Error: "You do not have permission to perform this action"

**Cause**: Backend returned 403 Forbidden

**Solution**:
1. Check backend authorization logic
2. Verify user UID matches deletion request
3. Check if user has account deletion permission

**Console Check**:
```
❌ Account deletion failed: You do not have permission...
```

---

## Testing Scenarios

### Scenario 1: Successful Deletion
```
1. Login with valid credentials
2. Navigate to Settings → Security (Paramètres du compte)
3. Scroll to "Zone de danger"
4. Click "Supprimer le compte"
5. Click "Supprimer" on first confirmation
6. Click "Oui, supprimer mon compte" on second confirmation
7. Watch console for ✅ emojis
8. See success alert: "Compte supprimé avec succès"
9. Get redirected to LoginScreen
10. Try logging in with deleted account → Should fail
```

**Expected Console**:
```
🗑️ [useSecurity] Starting account deletion...
✅ Backend account deleted
✅ Firebase account deleted
✅✅✅ ACCOUNT DELETION COMPLETE
```

---

### Scenario 2: User Cancels First Confirmation
```
1. Login
2. Navigate to Settings → Security
3. Click "Supprimer le compte"
4. See first confirmation dialog
5. Click "Annuler"
6. Should return to Account Settings (no deletion)
```

**Expected Console**:
```
[No deletion console output - operation cancelled]
```

---

### Scenario 3: User Confirms First but Cancels Second
```
1. Login
2. Navigate to Settings → Security
3. Click "Supprimer le compte"
4. Click "Supprimer" on first confirmation
5. See second confirmation dialog
6. Click "Annuler"
7. Should return to Account Settings (no deletion)
```

**Expected Console**:
```
[No deletion console output - operation cancelled at second confirmation]
```

---

### Scenario 4: Backend Error Handling
```
1. Simulate backend DELETE /profile endpoint returning 500 error
2. Login and try to delete account
3. Should show error alert: "Erreur lors de la suppression"
4. Should offer "Contacter le support" button
5. User should remain logged in
```

**Expected Console**:
```
❌ Account deletion failed: [Backend error]
[Shows error alert with support option]
```

---

### Scenario 5: Network Error During Deletion
```
1. Go offline (disconnect internet)
2. Try to delete account
3. Should show network error
4. Should offer retry or support contact
```

**Expected Console**:
```
❌ Account deletion failed: Network error or similar
```

---

## Debug Commands

### Check Current User State
```typescript
// In browser console during deletion:
import { firebaseAuthService } from 'src/services/firebaseAuthServiceNew';

// Check current user
firebaseAuthService.getCurrentUser();

// Check if Firebase user exists
firebaseAuthService.getAuth().currentUser;
```

### Force Console Logging
```typescript
// In useSecurity hook before deletion:
console.log('DEBUG: About to delete account');
console.log('Current user:', firebaseAuthService.getCurrentUser());
console.log('Firebase user:', firebaseAuthService.getAuth().currentUser);

// Then call deleteAccount
```

### Monitor AsyncStorage Cleanup
```typescript
// Before deletion:
const keysBefore = await AsyncStorage.getAllKeys();
console.log('Keys before:', keysBefore);

// After deletion:
const keysAfter = await AsyncStorage.getAllKeys();
console.log('Keys after:', keysAfter);
```

---

## Performance Metrics

### Expected Deletion Time
- Backend deletion: ~1-2 seconds
- Firebase deletion: ~1-2 seconds
- Logout cleanup: ~2-3 seconds
- **Total**: ~4-7 seconds

### If Taking Longer
1. Check network speed
2. Check backend response time
3. Check Firebase connectivity
4. Check AsyncStorage cleanup loops

---

## Network Request Inspection

### DELETE /profile Request
```
Method: DELETE
URL: /api/v1/profile (or /profile depending on API_BASE_URL)
Headers:
  Authorization: Bearer [Firebase ID Token]
  Content-Type: application/json

Response (Success):
  Status: 200 or 204
  Body: { success: true, message: "...", data: {...} }

Response (Error):
  Status: 400+ (e.g., 401, 403, 500)
  Body: { error: "...", message: "..." }
```

### Monitor in DevTools
1. Open Network tab
2. Filter by "delete"
3. Look for DELETE request to /profile
4. Check status code
5. Check response body

---

## Rollback Instructions (If Needed)

### If Deletion Gets Stuck
1. Close app
2. Reopen app
3. User should be logged out (if deletion was atomic)
4. Can login again

### If User Still Logged In After Failed Deletion
1. Check backend logs for errors
2. Manually verify user record in database
3. Backend may need to clean up partial data

### If User Data Not Fully Deleted
1. Check backend DELETE logic
2. Verify all cascading deletes are working
3. May need to implement cleanup jobs

---

## Monitoring Dashboard (Future)

Track these metrics post-deployment:
- [ ] Account deletion success rate (%)
- [ ] Average deletion time (seconds)
- [ ] Error rate (%)
- [ ] Most common errors
- [ ] User cancellation rate (%)
- [ ] Support tickets related to deletion

---

## Support Documentation

### For Support Team
**What to tell users who report deletion issues:**

1. "Your account deletion is atomic - either fully completed or fully failed"
2. "If you see an error, your account is NOT deleted"
3. "If deletion was successful, you'll see success message and be redirected to login"
4. "You can contact us if deletion failed - we can help investigate"

### For Backend Team
**What to implement for DELETE /profile:**

1. Verify Firebase ID token
2. Extract user ID from token
3. Delete user record
4. Delete all user-related data (cascade)
5. Return success response
6. Log deletion for audit trail

---

## Conclusion

The Phase 9 account deletion feature includes comprehensive logging for debugging. Use the console emojis as your guide:
- ✅ = Success/Progress
- ❌ = Error/Failure
- 🗑️ = Data deletion
- 📡 = API calls
- 🔥 = Firebase operations
- 💀 = Google Sign-In operations

All error cases are handled with user-friendly messages and support contact options.
