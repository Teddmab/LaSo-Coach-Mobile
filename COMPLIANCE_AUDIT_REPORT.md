# 🔍 COMPLIANCE AUDIT REPORT - LaSo Coach iOS (MoiseIOS Branch)

**Date**: January 17, 2026  
**Branch**: MoiseIOS  
**Commit**: bdfed0e  
**Audit Focus**: App Store Compliance (3.1.1, 5.1.1, 1.2, 2.1, 2.3.3, 2.3.10)

---

## CRITICAL FINDINGS

### 1. ❌ **IAP/PAYMENT COMPLIANCE - MAJOR ISSUES**

#### Issue 1.1: Dual Payment Systems (Non-Compliant)
- **Finding**: Both `Stripe`/`PayPal` AND `react-native-iap` are active simultaneously
- **Evidence**: 
  - [App.tsx](App.tsx#L5) imports `@stripe/stripe-react-native` 
  - [src/services/iapService.ts](src/services/iapService.ts#L1) imports `react-native-iap`
  - [src/components/SubscriptionPaymentFlow.tsx](src/components/SubscriptionPaymentFlow.tsx#L553) handles Stripe + PayPal payment methods
  - [src/services/subscriptionApi.ts](src/services/subscriptionApi.ts#L233) calls `/payments/confirm-stripe-payment` and `/payments/confirm-paypal-payment`
- **App Store Policy Violation**: 3.1.1 requires **ONE payment method only** (IAP). External payment methods (Stripe/PayPal) must be disabled entirely.
- **Fix Required**: Remove all Stripe/PayPal UI, payment methods, and deep links. IAP must be the exclusive payment method.

#### Issue 1.2: Payment Method Selection UI Still Present
- **Evidence**: [SubscriptionPaymentFlow.tsx](src/components/SubscriptionPaymentFlow.tsx#L861) shows Stripe card option, [L875] shows PayPal option
- **Fix Required**: Remove payment method selection UI entirely. Disable Stripe and PayPal payment flows completely.

#### Issue 1.3: Stripe Configuration Placeholder in Production
- **Evidence**: [App.tsx](App.tsx#L280) checks for `pk_test_placeholder` but still loads configuration
- **Fix Required**: Remove Stripe initialization entirely from production build.

---

### 2. ⚠️ **ACCOUNT DELETION (5.1.1(v)) - NOT FULLY IMPLEMENTED**

#### Issue 2.1: Placeholder Implementation
- **Finding**: Account deletion has a TODO placeholder
- **Evidence**: [useSecurity.ts](src/screens/settings/hooks/useSecurity.ts#L40-L50) shows:
  ```typescript
  const handleDeleteAccount = (): void => {
    Alert.alert(...);
    // TODO: Implement account deletion API call
    Alert.alert('Placeholder', 'Account deletion functionality will be implemented soon.');
  };
  ```
- **Status**: **INCOMPLETE** - Just shows alert, doesn't actually delete
- **Fix Required**: 
  - Implement full end-to-end flow: Settings → Confirm → Backend delete → Logout
  - Call `deleteAccount()` from [firebaseAuthServiceNew.ts](src/services/firebaseAuthServiceNew.ts#L799)
  - Verify backend DELETE `/api/v1/profile/delete` exists and works
  - Remove placeholder alert and implement actual deletion

#### Issue 2.2: Firebase Account Delete Missing Implementation
- **Evidence**: [firebaseAuthServiceNew.ts](src/services/firebaseAuthServiceNew.ts#L799-L807) implementation is minimal:
  ```typescript
  async deleteAccount() {
    try {
      const user = this.getAuth().currentUser;
      if (!user) throw new Error('No user logged in');
      await this.backendApi.delete(API_CONFIG.endpoints.profile.delete);
      await user.delete();
      this.currentUser = null;
    }
  ```
- **Issue**: No confirmation dialog, no cleanup of user data, no proper error handling
- **Fix Required**: Add confirmation, proper error handling, AsyncStorage cleanup, logout after deletion

---

### 3. ❌ **UGC (1.2) - NOT IMPLEMENTED**

#### Issue 3.1: Zero-Tolerance Terms Not Found
- **Finding**: No explicit "I agree to Terms" prompt before UGC
- **Evidence**: No "Report", "Block" buttons found in codebase. Chat exists but compliance features missing.
- **Fix Required**: 
  - Implement explicit zero-tolerance agreement before user can post/chat
  - Add per-post "Report" button with instant removal + backend notification
  - Add per-user "Block" button with instant removal + backend notification

#### Issue 3.2: Chat/Community Features Incomplete
- **Evidence**: [BACKEND_QUESTIONS.md](BACKEND_QUESTIONS.md#L1) shows chat is "BLOCKING" - WebSocket not connected
- **Fix Required**: 
  - Complete chat implementation with moderation features
  - Implement Report/Block actions before launch

---

### 4. ❌ **PURPOSE STRINGS (5.1.1) - MISSING**

#### Issue 4.1: iOS Info.plist Permissions Not Found
- **Finding**: No permission strings for Camera, Photo Library in app configuration
- **Evidence**: [app.json](app.json#L26-L36) infoPlist section is **empty** - only has `SKAdNetworkItems` and `CFBundleIconName`
- **Missing Strings**:
  - `NSCameraUsageDescription` - "LasoCoach uses your camera to take fitness progress photos"
  - `NSPhotoLibraryUsageDescription` - "LasoCoach accesses your photo library to upload fitness progress photos"
  - `NSMicrophoneUsageDescription` (if audio recording exists)
  - `NSLocationWhenInUseUsageDescription` (if location used)
- **Fix Required**: 
  - Add specific, example-based purpose strings to app.json infoPlist
  - Each string must explain exactly why permission is needed (not generic)
  - Must appear in app before requesting permission

#### Issue 4.2: Privacy Manifest Not Configured
- **Finding**: No privacy manifest (PrivacyInfo.xcprivacy) configured
- **Fix Required**: Add privacy manifest with accurate data usage declarations

---

### 5. ⚠️ **ENTITLEMENT GATING - PARTIALLY VERIFIED**

#### Issue 5.1: Entitlement Check Location
- **Evidence**: [useSubscription.ts](src/screens/dashboard/hooks/useSubscription.ts#L29) checks subscription status from server
- **Status**: ✅ Server-side check exists
- **Verification Needed**: 
  - Confirm NO local-only unlocks exist
  - Verify free content shows WITHOUT ANY PAYWALL if entitlement is inactive
  - Check [AchievementsScreen.tsx](src/screens/AchievementsScreen.tsx#L1) and [DefisScreen.tsx](src/screens/DefisScreen.tsx#L1) don't show paywalls

---

### 6. ⚠️ **COMPLETENESS (2.1) - MULTIPLE TODOs & PLACEHOLDERS**

#### Issue 6.1: Unresolved TODOs in Production Code
- **Evidence**: [ANALYSE_CORRECTIFS.md](ANALYSE_CORRECTIFS.md#L109-L112) documents:
  - Line 36: `// TODO: Fetch last login and last password change from API`
  - Line 41: `// TODO: Implement email update API call`
  - Line 46: `// TODO: Implement password change API call`  
  - Line 63: `// TODO: Implement account deletion API call` *(mentioned above)*
  - Line 669: `// TODO: Call API to mark day as complete`
  - Line 217: `// TODO: Implement delete notification API`
  - Line 96-97: `// TODO: Remove this after testing` (debug code)

- **Alert Text**: [useSecurity.ts](src/screens/settings/hooks/useSecurity.ts#L33) shows `Alert.alert('Placeholder', ...)`
- **Fix Required**: Remove all TODO comments and replace with actual implementations OR remove features entirely before submission

#### Issue 6.2: Placeholder Images in Code
- **Evidence**: [NutritionCard.tsx](src/components/dashboard/NutritionCard.tsx#L64-L201) uses 14+ `https://via.placeholder.com` URLs
- **Fix Required**: Replace all placeholder.com URLs with real images

#### Issue 6.3: Push Token Registration Not Implemented
- **Evidence**: [NotificationContext.tsx](src/context/NotificationContext.tsx#L187) has:
  ```typescript
  // TODO: Implement API call to register push token with your backend
  ```
- **Fix Required**: Remove TODO and implement token registration

---

### 7. ⚠️ **METADATA (2.3.3/2.3.10) - NOT VERIFIED**

#### Issue 7.1: Screenshots Not Verified
- **Finding**: Cannot verify if screenshots include iOS-specific UI chrome
- **Evidence**: No screenshot directory found in codebase (typically in metadata/)
- **Fix Required**: 
  - Ensure all App Store Connect screenshots show iOS-only UI
  - No Android-specific elements visible
  - Device frames must match actual device types

#### Issue 7.2: Device Frame Consistency
- **Fix Required**: Verify all screenshots use consistent device frames (iPhone 15 Pro Max, etc.)

---

## SUMMARY TABLE

| Category | Check | Status | Priority |
|----------|-------|--------|----------|
| **3.1.1 Companion** | All payment UIs removed | ❌ FAIL | **CRITICAL** |
| **3.1.1 Companion** | Only IAP available | ❌ FAIL | **CRITICAL** |
| **3.1.1 Companion** | No marketing/steering text | ⚠️ VERIFY | HIGH |
| **Entitlement Gating** | Server-side only | ✅ PASS | - |
| **1.2 UGC** | Zero-tolerance terms | ❌ FAIL | **CRITICAL** |
| **1.2 UGC** | Report/Block actions | ❌ FAIL | **CRITICAL** |
| **5.1.1(v) Account Deletion** | End-to-end flow | ❌ FAIL | **CRITICAL** |
| **5.1.1 Purpose Strings** | Camera/Photo strings in plist | ❌ FAIL | HIGH |
| **2.1 Completeness** | No TODOs/placeholders | ❌ FAIL | HIGH |
| **2.3.3/2.3.10 Metadata** | iOS-specific screenshots | ⚠️ VERIFY | MEDIUM |
| **Privacy** | Privacy manifest | ❌ FAIL | HIGH |

---

## IMMEDIATE ACTIONS REQUIRED (Before App Store Submission)

### CRITICAL (Blocking Submission)
1. **REMOVE STRIPE/PAYPAL** 
   - Delete all external payment method code and UI
   - Remove Stripe/PayPal imports from App.tsx
   - Disable payment method selection in SubscriptionPaymentFlow
   - Keep only native IAP

2. **IMPLEMENT ACCOUNT DELETION** 
   - Full end-to-end flow with confirmation
   - Backend DELETE endpoint must work
   - Proper logout and cleanup after deletion
   - Remove "Placeholder" alert

3. **IMPLEMENT UGC FEATURES** 
   - Add Report/Block with zero-tolerance terms
   - Explicit consent before UGC
   - Instant content removal on Report/Block
   - Backend notification integration

4. **FIX PURPOSE STRINGS** 
   - Add all permission strings to app.json infoPlist
   - Camera, Photo Library, Microphone, Location (if used)
   - Specific, example-based descriptions

### HIGH PRIORITY (Must Fix)
5. **REMOVE TODOs** 
   - Replace all TODO comments with implementations
   - Or remove incomplete features entirely
   - Remove debug code

6. **REMOVE PLACEHOLDERS** 
   - Replace all placeholder.com images with real assets
   - Remove placeholder alerts
   - Remove debug console logs

7. **ADD PRIVACY MANIFEST** 
   - Create PrivacyInfo.xcprivacy
   - Declare all data usage accurately
   - Include all third-party SDKs

### MEDIUM PRIORITY (Before Launch)
8. **VERIFY METADATA** 
   - Confirm screenshots are iOS-only
   - Check device frames consistency
   - Verify no Android UI visible

9. **PUSH TOKEN REGISTRATION** 
   - Remove TODO in NotificationContext
   - Implement token registration to backend

---

## COMPLIANCE CHECKLIST

- [ ] Stripe/PayPal code completely removed
- [ ] Only native IAP payment method active
- [ ] Account deletion fully implemented and tested
- [ ] UGC Report/Block features implemented
- [ ] Zero-tolerance terms implemented
- [ ] All purpose strings added to infoPlist
- [ ] Privacy manifest created and configured
- [ ] All TODO comments resolved
- [ ] All placeholder images replaced
- [ ] Debug code removed
- [ ] Push token registration implemented
- [ ] Metadata screenshots verified as iOS-only
- [ ] Device frames consistent across all screenshots
- [ ] QA testing completed on physical iOS device
- [ ] TestFlight build created and tested
- [ ] Ready for App Store submission

---

## NOTES

- This audit focused on App Store policy compliance (3.1.1, 5.1.1, 1.2, 2.1, 2.3.3, 2.3.10)
- Many features are partially implemented but not production-ready
- The codebase has good architecture but needs cleanup for submission
- Backend integration appears solid (Firebase Auth + custom backend)
- Recommend thorough QA testing on physical device before submission
