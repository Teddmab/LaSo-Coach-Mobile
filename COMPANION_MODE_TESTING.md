# 🧪 iOS Companion Mode - Testing Checklist

**Branch**: MoiseIOS  
**Feature**: iOS Companion Mode for App Store Compliance  
**Last Updated**: January 17, 2026

---

## QUICK TEST (After Each Phase)

### Current Phase Status
- [x] Phase 0: Preparation ✅
- [x] Phase 1: Feature Flags ✅
- [x] Phase 2: Guard Payment Flow ✅
- [x] Phase 3: Guard IAP ✅
- [x] Phase 4: Guard Deep Links ✅
- [x] Phase 5: Remove Stripe/PayPal Init ✅
- [ ] Phase 6: Entitlements ⏳
- [ ] Phase 7: UGC Terms ⏳
- [ ] Phase 8: Report/Block ⏳
- [ ] Phase 9: Account Deletion ⏳
- [ ] Phase 10: Permissions ⏳
- [ ] Phase 11: Cleanup ⏳
- [ ] Phase 12: Final QA ⏳

---

## TEST MATRIX

### Companion Mode OFF (IOS_COMPANION_MODE = false)
All existing functionality should work:

- [ ] App launches without errors
- [ ] Can login/logout
- [ ] Subscription screen shows plans
- [ ] Can select payment method
- [ ] Stripe/PayPal visible
- [ ] IAP purchase flows work
- [ ] Deep links work
- [ ] No regressions

### Companion Mode ON (IOS_COMPANION_MODE = true)
Companion-specific behavior:

- [ ] App launches without errors
- [ ] Can login/logout
- [ ] Subscription screen shows neutral message
- [ ] No "Subscribe" or "Upgrade" buttons visible
- [ ] No payment method selection
- [ ] No pricing information
- [ ] No Stripe/PayPal UI
- [ ] No IAP purchase dialogs
- [ ] Deep links to subscription blocked
- [ ] Entitlements checked from server
- [ ] Content accessible based on entitlements only

---

## DETAILED TEST SCENARIOS

### 1. Feature Flag System (Phase 1)

**Test 1.1: Flag Toggle**
```typescript
// In any screen, import and test
import { isIOSCompanionMode } from '../config/featureFlags';
console.log('Companion Mode:', isIOSCompanionMode());
```
- [ ] Returns `false` when IOS_COMPANION_MODE = false
- [ ] Returns `true` when IOS_COMPANION_MODE = true (iOS only)
- [ ] Returns `false` on Android regardless of flag

**Test 1.2: Hook Usage**
```typescript
const { isCompanionMode, canShowPurchaseFlows } = useCompanionMode();
console.log({ isCompanionMode, canShowPurchaseFlows });
```
- [ ] Hook returns correct values
- [ ] Values update when flag changes
- [ ] No performance issues

---

### 2. Payment Flow (Phase 2)

#### Test 2.1: Feature Flag & Hook Integration
- [ ] `IOS_COMPANION_MODE` feature flag working in SubscriptionPaymentFlow
- [ ] `useCompanionMode()` hook imported correctly
- [ ] No TypeScript errors on build
- [ ] Console logs appear during render

**Specific Console Logs Expected**:
```
🎯 [SubscriptionPaymentFlow] Rendering companion mode UI - purchases disabled
```

#### Test 2.2: Payment Flow Modal - Companion ON
1. Set `.env: IOS_COMPANION_MODE=true`
2. Navigate to Subscription screen
3. Click on any plan
4. **Expected Results**:
   - [ ] SubscriptionPaymentFlow modal opens
   - [ ] NO payment method buttons visible (Stripe/PayPal)
   - [ ] Information icon displayed
   - [ ] "App Companion" title visible
   - [ ] Message: "This app is in companion mode. Subscriptions are managed on the web."
   - [ ] "Fermer" (Close) button visible and functional
   - [ ] Clicking close button closes modal
   - [ ] No console errors

#### Test 2.3: Payment Flow Modal - Companion OFF
1. Set `.env: IOS_COMPANION_MODE=false` (or remove from .env)
2. Navigate to Subscription screen
3. Click on any plan
4. **Expected Results**:
   - [ ] SubscriptionPaymentFlow modal opens normally
   - [ ] Payment method selection visible (Stripe + PayPal buttons)
   - [ ] No companion message
   - [ ] Normal payment flow continues
   - [ ] Card input fields appear when selecting method

#### Test 2.4: Embedded Payment Flow (SubscriptionPlansModal)
1. With companion mode ON, check SubscriptionPlansModal component
2. **Expected Results**:
   - [ ] useCompanionMode hook called correctly
   - [ ] Component renders without errors
   - [ ] Hook values available for conditional rendering

#### Test 2.5: Regression Testing - Normal Payment Flow Unchanged
1. Ensure `IOS_COMPANION_MODE=false`
2. Test complete subscription flow:
   - [ ] Select plan → payment methods visible
   - [ ] Select Stripe → card input appears
   - [ ] Enter card details → payment processes
   - [ ] Select PayPal → redirects to PayPal
   - [ ] Success/error handling works
   - [ ] Free plans activate without payment

#### Test 2.6: Styles & UI Rendering
- [ ] Companion mode icon (info circle) displays correctly
- [ ] Text is properly formatted and readable
- [ ] Button styling matches theme
- [ ] Layout responsive on different screen sizes
- [ ] No text overflow or clipping issues

#### Test 2.7: Edge Cases
- [ ] Rapid modal open/close works
- [ ] Memory leaks don't occur
- [ ] Hook cleanup works properly
- [ ] Screen rotation handled correctly
- [ ] App backgrounding/foregrounding works

---

### 3. IAP Service (Phase 3)

#### Test 3.1: IAP Initialization - Companion ON
1. Set `.env: IOS_COMPANION_MODE=true`
2. Start app and check console
3. **Expected Results**:
   - [ ] Console shows: `🎯 [IAPService] Companion mode active - IAP initialization skipped`
   - [ ] No IAP module loaded
   - [ ] IAPService.isInitialized = false
   - [ ] No Xcode native IAP errors

#### Test 3.2: IAP Initialization - Companion OFF
1. Set `.env: IOS_COMPANION_MODE=false`
2. Start app
3. **Expected Results**:
   - [ ] No IAP initialization console messages
   - [ ] IAP module loads normally
   - [ ] IAPService.isInitialized = true
   - [ ] No regressions in normal IAP flow

#### Test 3.3: Purchase Request - Companion ON
1. Companion mode enabled
2. Try to trigger IAP purchase (e.g., click premium button)
3. **Expected Results**:
   - [ ] Error thrown: "Purchases are not available in companion mode"
   - [ ] Console: `🎯 [IAPService] Companion mode active - purchase request blocked`
   - [ ] No native iOS in-app purchase dialog appears
   - [ ] No payment processing attempted
   - [ ] No TestFlight/App Store payment dialogs

#### Test 3.4: Purchase Listeners - Companion ON
1. App setup with companion mode enabled
2. Check if purchase event listeners registered
3. **Expected Results**:
   - [ ] Console: `🎯 [IAPService] Companion mode active - purchase listeners not setup`
   - [ ] No purchase update listeners active
   - [ ] No purchase error listeners active
   - [ ] Purchase completion callbacks not registered

#### Test 3.5: Full IAP Flow - Companion OFF
1. Set companion mode OFF
2. Test complete IAP purchase flow (don't complete payment, just verify flow)
3. **Expected Results**:
   - [ ] No companion mode messages in console
   - [ ] IAP initializes normally
   - [ ] Listeners register successfully
   - [ ] Purchase request works
   - [ ] Native dialog appears
   - [ ] All normal IAP functions work

#### Test 3.6: Guard Guard Layering
1. Verify multiple guards activate if necessary
2. **Expected Results**:
   - [ ] initialize() guard works independently
   - [ ] requestPurchase() guard works independently
   - [ ] setupPurchaseListeners() guard works independently
   - [ ] All three can block simultaneously
   - [ ] No double logging or conflicts

---

### 4. Deep Links (Phase 4)

**Test 4.1: Subscription Success Deep Link - Companion ON**
1. App running with companion mode enabled
2. Trigger deep link: `xcrun simctl openurl booted "laso-coach://onboarding/subscription-success?session_id=test123"`
3. **Expected Results**:
   - [ ] Console shows: `🎯 [App] Deep link blocked in companion mode - payment flow disabled: ...`
   - [ ] No navigation occurs
   - [ ] User stays on current screen
   - [ ] No success toast appears
   - [ ] Dashboard is not opened

**Test 4.2: Subscription Cancel Deep Link - Companion ON**
1. App running with companion mode enabled
2. Trigger deep link: `xcrun simctl openurl booted "laso-coach://onboarding/subscription-cancel"`
3. **Expected Results**:
   - [ ] Console shows: `🎯 [App] Deep link blocked in companion mode - payment flow disabled: ...`
   - [ ] No navigation occurs
   - [ ] User stays on current screen
   - [ ] No cancel toast appears

**Test 4.3: Direct Subscription Deep Link - Companion ON**
1. App running with companion mode enabled
2. Trigger deep link: `xcrun simctl openurl booted "laso-coach://onboarding/subscription"`
3. **Expected Results**:
   - [ ] Console shows: `🎯 [App] Deep link blocked in companion mode - payment flow disabled: ...`
   - [ ] No navigation to subscription flow
   - [ ] User stays on current screen

**Test 4.4: Subscription Deep Links - Companion OFF**
1. Set companion mode OFF
2. Trigger each subscription deep link
3. **Expected Results**:
   - [ ] Links process normally
   - [ ] No companion mode console messages
   - [ ] Navigation works as before
   - [ ] Success/cancel toasts appear
   - [ ] App navigates to Dashboard

**Test 4.5: Non-Subscription Deep Links - Companion ON**
1. App running with companion mode enabled
2. Test non-payment deep links (e.g., `laso-coach://dashboard`)
3. **Expected Results**:
   - [ ] Deep links work normally
   - [ ] No false blocking
   - [ ] Can navigate to other screens
   - [ ] Only subscription routes blocked

**Test 4.6: Multiple Deep Links in Sequence - Companion ON**
1. App running with companion mode enabled
2. Trigger: subscription success → wait → trigger non-subscription deep link
3. **Expected Results**:
   - [ ] First deep link blocked (no navigation)
   - [ ] Second deep link works (navigation occurs)
   - [ ] No state contamination
   - [ ] App responds correctly to each link

---

### 5. Stripe/PayPal (Phase 5)

**Test 5.1: Stripe Initialization - Companion ON**
1. App running with companion mode enabled
2. Check console at startup
3. **Expected Results**:
   - [ ] Console shows: `🎯 [Startup] Companion mode active - Stripe initialization skipped`
   - [ ] Console shows: `🎯 [App] StripeProvider wrapper skipped in companion mode - payments disabled`
   - [ ] No Stripe SDK initialization logs
   - [ ] No "Attempting to fetch publishable key" message
   - [ ] Stripe key remains as placeholder
   - [ ] No StripeProvider errors

**Test 5.2: Stripe Initialization - Companion OFF**
1. Set companion mode OFF
2. Restart app
3. Check console logs
4. **Expected Results**:
   - [ ] Console shows: `🔑 [Stripe] Attempting to fetch publishable key from backend...`
   - [ ] Console shows: `✅ [Stripe] Publishable key loaded from backend` OR `from configuration`
   - [ ] Stripe SDK initializes normally
   - [ ] StripeProvider renders
   - [ ] No "skipped" messages

**Test 5.3: App Functionality - Companion ON**
1. App running with companion mode enabled
2. Navigate to different screens
3. **Expected Results**:
   - [ ] App doesn't crash without StripeProvider
   - [ ] All screens load normally
   - [ ] Navigation works
   - [ ] No StripeProvider-related errors
   - [ ] Other providers (Auth, Notification, etc.) work

**Test 5.4: Stripe vs IAP vs UI Protection - Companion ON**
1. Verify all 4 protection layers:
2. **Expected Results**:
   - [ ] Layer 1 (UI): Payment flow shows companion message
   - [ ] Layer 2 (SDK): IAP initialization blocked
   - [ ] Layer 3 (Navigation): Deep links blocked
   - [ ] Layer 4 (Provider): Stripe not initialized ← NEW
   - [ ] Combined: Impossible to trigger payment flow

---

### 6. Entitlements (Phase 6)

**Test 6.1: Login with Active Subscription**
- Login with account that has subscription
- **Companion ON**: 
  - [ ] Entitlements fetched from server
  - [ ] Premium content visible
  - [ ] No local unlock flags used

**Test 6.2: Login without Subscription**
- Login with free account
- **Companion ON**: 
  - [ ] Entitlements show no access
  - [ ] Demo/free content visible
  - [ ] No upsell messaging
  - [ ] Neutral message only

**Test 6.3: App Resume**
- Background app for 5 minutes, then resume
- [ ] Entitlements refreshed
- [ ] Content visibility correct

---

### 7. UGC Terms (Phase 7)

**Test 7.1: First Time Access**
- Fresh install, try to access chat/community
- [ ] Terms modal appears
- [ ] Cannot dismiss without action
- [ ] "Accept" button works
- [ ] "Decline" returns to previous screen

**Test 7.2: After Acceptance**
- Accept terms, then close app
- Reopen and access chat/community
- [ ] Terms modal doesn't show again
- [ ] Chat/community accessible

---

### 8. Report & Block (Phase 8)

**Test 8.1: Report Post**
- Find a post, tap Report
- [ ] Confirmation dialog appears
- [ ] Post hidden immediately
- [ ] Backend API called
- [ ] Toast shows success

**Test 8.2: Block User**
- Find a user, tap Block
- [ ] Confirmation dialog appears
- [ ] User content hidden immediately
- [ ] Backend API called
- [ ] Block persists after app restart

---

### 9. Account Deletion (Phase 9)

**Test 9.1: Delete Flow**
- Settings → Security → Delete Account
- [ ] First confirmation appears
- [ ] Second confirmation modal appears
- [ ] Type "DELETE" enables button
- [ ] Account deleted successfully
- [ ] Logged out automatically
- [ ] AsyncStorage cleared
- [ ] Returned to login screen

**Test 9.2: Error Handling**
- Try deletion with network off
- [ ] Clear error message shown
- [ ] Account not deleted
- [ ] Can retry

---

### 10. Permissions (Phase 10)

**Test 10.1: Camera Permission**
- Trigger camera access
- [ ] Custom description appears
- [ ] Contains specific example
- [ ] Not generic text

**Test 10.2: Photo Library**
- Trigger photo library access
- [ ] Custom description appears
- [ ] Contains specific example

---

### 11. String Search (Phase 11)

Run these searches in iOS build:
```bash
grep -r "subscribe" ios/ --include="*.m" --include="*.h"
grep -r "upgrade" ios/ --include="*.m" --include="*.h"
grep -r "trial" ios/ --include="*.m" --include="*.h"
grep -r "pricing" ios/ --include="*.m" --include="*.h"
grep -r "discount" ios/ --include="*.m" --include="*.h"
grep -r "buy" ios/ --include="*.m" --include="*.h"
```
- [ ] No prohibited strings found
- [ ] OR all findings are false positives

---

## REGRESSION TESTS

### Android Build
- [ ] Android app still works normally
- [ ] All purchase flows work
- [ ] No companion mode restrictions
- [ ] Stripe/PayPal work

### iOS Non-Companion
With `IOS_COMPANION_MODE = false`:
- [ ] All purchase flows work
- [ ] Stripe initializes
- [ ] IAP works
- [ ] Deep links work
- [ ] No regressions

---

## PERFORMANCE TESTS

### App Launch Time
- [ ] Companion mode doesn't slow launch
- [ ] No extra network calls
- [ ] Fast cold start

### Memory Usage
- [ ] No memory leaks
- [ ] Efficient caching
- [ ] Proper cleanup

---

## DEVICE TESTING

### Simulator Testing
- [ ] iPhone 15 Pro Max simulator
- [ ] iPhone SE simulator
- [ ] iPad Pro simulator (if supported)

### Physical Device Testing
- [ ] iPhone 12 or newer
- [ ] iOS 16+ 
- [ ] iOS 17+

### TestFlight Testing
- [ ] Upload build with companion mode ON
- [ ] 5-10 beta testers
- [ ] Collect feedback
- [ ] No critical issues

---

## TEST RESULTS LOG

### Test Run 1 - Phase 1 Complete
**Date**: _____________  
**Tester**: _____________  
**Result**: ⏳ Pending

**Notes**:
- 
- 

---

### Test Run 2 - Phase 2 Complete
**Date**: _____________  
**Tester**: _____________  
**Result**: ⏳ Pending

**Notes**:
- 
- 

---

## ISSUE TRACKING

### Critical Issues
1. **Issue**: _____________________________
   - **Phase**: ___
   - **Status**: ⏳ Open / ✅ Resolved
   - **Fix**: _____________________________

---

## SIGN-OFF

### Phase Completions
- [ ] Phase 1: Feature Flags - Tested & Signed Off
- [ ] Phase 2: Payment Flow - Tested & Signed Off
- [ ] Phase 3: Stripe/PayPal - Tested & Signed Off
- [ ] Phase 4: IAP - Tested & Signed Off
- [ ] Phase 5: Deep Links - Tested & Signed Off
- [ ] Phase 6: Entitlements - Tested & Signed Off
- [ ] Phase 7: UGC Terms - Tested & Signed Off
- [ ] Phase 8: Report/Block - Tested & Signed Off
- [ ] Phase 9: Account Deletion - Tested & Signed Off
- [ ] Phase 10: Permissions - Tested & Signed Off
- [ ] Phase 11: Cleanup - Tested & Signed Off
- [ ] Phase 12: Push Tokens - Tested & Signed Off

### Final Sign-Off
**Ready for TestFlight**: ⏳ No / ✅ Yes  
**Ready for App Store**: ⏳ No / ✅ Yes  

**Signed**: _____________________________  
**Date**: _____________________________
