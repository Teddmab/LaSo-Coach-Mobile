# 🎯 iOS Companion Mode - Implementation Plan

**Date**: January 17, 2026  
**Branch**: MoiseIOS  
**Approach**: Phased implementation with testing between each phase  
**Goal**: Transform iOS app into Trainerize-style Companion App (no purchases, entitlement-only access)

---

## IMPLEMENTATION PHASES

### ✅ Phase 0: Preparation & Safety Checks (30 min)
**Goal**: Set up safety mechanisms before making changes

#### Tasks:
1. Create feature flag system
2. Create backup branch
3. Set up test environment
4. Document current behavior

#### Files to Create:
- `src/config/featureFlags.ts` - Feature flag configuration
- `COMPANION_MODE_TESTING.md` - Testing checklist

#### Test:
- Verify app still runs normally
- Verify feature flags can be toggled
- No breaking changes

---

### ✅ Phase 1: Add IOS_COMPANION_MODE Flag & Infrastructure (1 hour)
**Goal**: Create the flag system without changing any behavior yet

#### Tasks:
1. Create `src/config/featureFlags.ts`
   - Add `IOS_COMPANION_MODE` constant
   - Add `isIOSCompanionMode()` helper
   - Add `shouldShowPurchaseFlows()` helper

2. Create `src/hooks/useCompanionMode.ts`
   - Hook to check companion mode status
   - Hook to conditionally render payment UI

3. Update `src/config/index.ts`
   - Export companion mode flags

#### Files Changed:
```
✅ NEW: src/config/featureFlags.ts
✅ NEW: src/hooks/useCompanionMode.ts
✅ MODIFIED: src/config/index.ts (add export)
```

#### Test Steps:
1. Import `isIOSCompanionMode()` in a screen
2. Log the value - should return `false` initially
3. Toggle flag to `true`, verify it returns `true`
4. App should still work normally (no UI changes yet)

#### Success Criteria:
- [ ] Flag system works
- [ ] Can toggle companion mode on/off
- [ ] No crashes or errors
- [ ] Existing functionality unchanged

---

### ✅ Phase 2: Guard Subscription Payment Flow (2 hours)
**Goal**: Hide/disable payment flow UI when companion mode is enabled

#### Tasks:
1. Wrap `SubscriptionPaymentFlow` with companion mode check
2. Hide payment method selectors (Stripe/PayPal) on iOS companion mode
3. Add "neutral" state UI for companion mode
4. Guard `SubscriptionScreen` purchase CTAs

#### Files to Modify:
```
✅ src/components/SubscriptionPaymentFlow.tsx
  - Add useCompanionMode() hook
  - Return null or neutral UI if companion mode
  - Remove payment method selection UI

✅ src/screens/SubscriptionScreen.tsx
  - Hide "Upgrade", "Subscribe" buttons
  - Show neutral "Manage subscription on web" message

✅ src/screens/dashboard/modals/SubscriptionPlansModal.tsx
  - Disable plan selection on iOS companion mode
  - Show informational message only
```

#### Test Steps:
1. With `IOS_COMPANION_MODE = false`:
   - SubscriptionScreen shows payment options ✅
   - Can select plans ✅
   - Payment flow works ✅

2. With `IOS_COMPANION_MODE = true`:
   - SubscriptionScreen shows neutral message ✅
   - No "Subscribe" or "Upgrade" buttons ✅
   - No payment method selectors ✅
   - No pricing information ✅

#### Success Criteria:
- [ ] Companion mode hides all purchase UI
- [ ] Non-companion mode works as before
- [ ] No crashes when toggling modes
- [ ] Neutral message displays correctly

---

### ✅ Phase 3: Remove Stripe/PayPal Initialization (1.5 hours)
**Goal**: Prevent Stripe/PayPal SDKs from initializing in companion mode

#### Tasks:
1. Guard `StripeProvider` in App.tsx
2. Conditionally skip Stripe key fetch
3. Guard PayPal initialization (if any)
4. Update payment service to check companion mode

#### Files to Modify:
```
✅ App.tsx
  - Wrap StripeProvider with companion mode check
  - Skip Stripe key fetch if companion mode
  - Add console logs for debugging

✅ src/services/payment/PaymentService.ts
  - Add isPaymentAvailable() check for companion mode
  - Return false if iOS companion mode

✅ src/services/payment/IOSPaymentService.ts
  - Add companion mode check in constructor
  - Disable all payment methods if companion mode
```

#### Test Steps:
1. With `IOS_COMPANION_MODE = false`:
   - Stripe loads normally ✅
   - Console shows "Stripe initialized" ✅

2. With `IOS_COMPANION_MODE = true`:
   - No Stripe initialization ✅
   - Console shows "Companion mode - payments disabled" ✅
   - No Stripe errors in console ✅

#### Success Criteria:
- [ ] Stripe doesn't load in companion mode
- [ ] No Stripe-related errors
- [ ] Non-companion mode still works
- [ ] App starts faster in companion mode

---

### ✅ Phase 4: Guard IAP Purchase Triggers (1 hour)
**Goal**: Ensure react-native-iap never triggers purchases in companion mode

#### Tasks:
1. Add companion mode check in `iapService.ts`
2. Make `requestPurchase()` return early if companion mode
3. Disable "Restore Purchases" in companion mode
4. Update subscription screens to hide IAP options

#### Files to Modify:
```
✅ src/services/iapService.ts
  - Add isIOSCompanionMode() check at top
  - Return early from requestPurchase() if companion mode
  - Return empty array from getAvailableProducts() if companion mode
  - Disable restorePurchases() if companion mode
```

#### Test Steps:
1. With `IOS_COMPANION_MODE = true`:
   - Attempting purchase returns immediately ✅
   - No IAP dialogs appear ✅
   - "Restore Purchases" button hidden ✅

2. Verify no IAP-related crashes

#### Success Criteria:
- [ ] IAP completely disabled in companion mode
- [ ] No native purchase dialogs
- [ ] No crashes
- [ ] Android/non-companion iOS still works

---

### ✅ Phase 5: Remove Deep Links for Subscription (1 hour)
**Goal**: Disable subscription-related deep links on iOS companion mode

#### Tasks:
1. Guard deep link handlers in App.tsx
2. Remove handling for `/onboarding/subscription-success`
3. Remove handling for `/onboarding/subscription-cancel`
4. Add logging for blocked deep links

#### Files to Modify:
```
✅ App.tsx
  - Add companion mode check in handleDeepLink()
  - Return early for subscription-related paths
  - Log blocked deep links for debugging
```

#### Test Steps:
1. With `IOS_COMPANION_MODE = true`:
   - Deep link to subscription-success → ignored ✅
   - Deep link to subscription-cancel → ignored ✅
   - Console logs "Deep link blocked: companion mode" ✅

2. Other deep links still work (e.g., /dashboard)

#### Success Criteria:
- [ ] Subscription deep links blocked
- [ ] Other deep links work
- [ ] No crashes
- [ ] Clear console logging

---

### ✅ Phase 6: Server-Driven Entitlement Gating (2 hours)
**Goal**: Implement strict server-driven access control

#### Tasks:
1. Create `src/services/entitlementService.ts`
   - Fetch entitlements from server
   - Cache with 1-hour expiry
   - Auto-refresh on app resume

2. Update screens to check entitlements
   - Show neutral "No access" state if no entitlement
   - Show demo content (no upsell messaging)

3. Add entitlement refresh on login/resume

#### Files to Create/Modify:
```
✅ NEW: src/services/entitlementService.ts
  - fetchEntitlements() 
  - getCachedEntitlements()
  - hasActiveEntitlement()
  - refreshEntitlements()

✅ NEW: src/hooks/useEntitlements.ts
  - Hook for components to check access

✅ MODIFIED: src/context/FirebaseAuthContext.tsx
  - Fetch entitlements after login
  - Clear entitlements on logout

✅ MODIFIED: src/screens/DashboardScreen.tsx
  - Check entitlements before showing premium content
  - Show neutral state if no access
```

#### Test Steps:
1. Login with active subscription:
   - Entitlements fetched ✅
   - Premium content visible ✅

2. Login without subscription:
   - Entitlements show no access ✅
   - Demo content visible ✅
   - No upsell messages ✅

3. App resume:
   - Entitlements refreshed ✅

#### Success Criteria:
- [ ] Entitlements fetched from server only
- [ ] No local-only unlocks
- [ ] Cache works with expiry
- [ ] Refresh on app resume

---

### ✅ Phase 7: UGC Safety - Zero-Tolerance Terms (2 hours)
**Goal**: Add explicit consent before UGC + Report/Block features

#### Tasks:
1. Create UGC terms acceptance modal
2. Store acceptance in AsyncStorage
3. Block UGC features until accepted

#### Files to Create/Modify:
```
✅ NEW: src/components/modals/UGCTermsModal.tsx
  - Zero-tolerance terms display
  - Accept/Decline buttons
  - Store acceptance in AsyncStorage

✅ NEW: src/services/ugcComplianceService.ts
  - hasAcceptedTerms()
  - acceptTerms()
  - requireTermsAcceptance()

✅ MODIFIED: src/screens/ChatScreen.tsx (if exists)
  - Show terms modal before chat access
  - Block chat if not accepted
```

#### Test Steps:
1. First time accessing chat:
   - Terms modal appears ✅
   - Cannot dismiss without accepting ✅

2. After accepting:
   - Chat accessible ✅
   - Modal doesn't show again ✅

3. After declining:
   - Returned to previous screen ✅

#### Success Criteria:
- [ ] Terms modal works
- [ ] Acceptance persisted
- [ ] UGC blocked without acceptance
- [ ] Clear zero-tolerance language

---

### ✅ Phase 8: UGC Safety - Report & Block (3 hours)
**Goal**: Add Report (post) and Block (user) functionality

#### Tasks:
1. Create Report button component
2. Create Block button component
3. Add instant local filtering
4. Call backend moderation APIs
5. Show confirmation modals/toasts

#### Files to Create/Modify:
```
✅ NEW: src/components/ugc/ReportButton.tsx
  - Report post action
  - Instant local hide
  - Backend API call
  - Confirmation toast

✅ NEW: src/components/ugc/BlockButton.tsx
  - Block user action
  - Instant local filter
  - Backend API call
  - Confirmation modal

✅ NEW: src/services/moderationApi.ts
  - reportPost(postId, reason)
  - blockUser(userId)
  - unblockUser(userId)
  - getBlockedUsers()

✅ NEW: src/hooks/useModeration.ts
  - Hook for Report/Block state
  - Local filtering logic

✅ MODIFIED: src/screens/CommunityScreen.tsx (if exists)
  - Add Report buttons to posts
  - Add Block buttons to user profiles
  - Filter blocked content
```

#### Test Steps:
1. Report post:
   - Confirmation dialog appears ✅
   - Post hidden immediately ✅
   - Backend API called ✅
   - Toast shows success ✅

2. Block user:
   - Confirmation dialog appears ✅
   - All user content hidden ✅
   - Backend API called ✅
   - Block persists across sessions ✅

3. Unblock user:
   - Content reappears ✅

#### Success Criteria:
- [ ] Report works end-to-end
- [ ] Block works end-to-end
- [ ] Instant local filtering
- [ ] Backend APIs called
- [ ] User feedback (toasts/modals)

---

### ✅ Phase 9: Real Account Deletion (2 hours)
**Goal**: Replace placeholder with full account deletion flow

#### Tasks:
1. Update `useSecurity.ts` to call real deletion
2. Add confirmation flow (2-step)
3. Call backend delete → Firebase delete → logout → cleanup
4. Handle errors gracefully

#### Files to Modify:
```
✅ src/screens/settings/hooks/useSecurity.ts
  - Remove TODO and placeholder alert
  - Add real deletion flow:
    1. First confirmation (Alert)
    2. Second confirmation (Modal with input)
    3. Call firebaseAuthService.deleteAccount()
    4. Handle success/error
    5. Navigate to login

✅ src/services/firebaseAuthServiceNew.ts
  - Enhance deleteAccount() method:
    - Add AsyncStorage cleanup
    - Add proper error handling
    - Add logout after deletion
    - Clear all cached data

✅ NEW: src/components/modals/AccountDeletionModal.tsx
  - Second confirmation step
  - Type "DELETE" to confirm
  - Show consequences clearly
```

#### Test Steps:
1. Navigate to Settings → Security → Delete Account
2. First confirmation appears ✅
3. Second confirmation modal appears ✅
4. Type "DELETE" to enable button ✅
5. Account deleted ✅
6. Backend receives delete request ✅
7. Firebase user deleted ✅
8. AsyncStorage cleared ✅
9. Logged out automatically ✅
10. Returned to login screen ✅

#### Error Cases:
- Network error → clear error message ✅
- Re-auth required → prompt for password ✅
- Backend error → clear error message ✅

#### Success Criteria:
- [ ] Full end-to-end deletion works
- [ ] Two-step confirmation
- [ ] AsyncStorage cleanup
- [ ] Firebase cleanup
- [ ] Backend cleanup
- [ ] Error handling
- [ ] Auto logout

---

### ✅ Phase 10: iOS Permissions & Privacy (1.5 hours)
**Goal**: Add proper permission strings and privacy manifest

#### Tasks:
1. Add Info.plist purpose strings to app.json
2. Create Privacy Manifest (PrivacyInfo.xcprivacy)
3. Document all data usage

#### Files to Modify:
```
✅ app.json
  - Add to ios.infoPlist:
    - NSCameraUsageDescription
    - NSPhotoLibraryUsageDescription
    - NSPhotoLibraryAddUsageDescription
    - NSMicrophoneUsageDescription (if used)
    - NSLocationWhenInUseUsageDescription (if used)

✅ NEW: ios/LasoCoach/PrivacyInfo.xcprivacy
  - Declare data types collected
  - Declare tracking usage
  - List third-party SDKs (Firebase, etc.)
```

#### Permission Strings:
```json
"NSCameraUsageDescription": "LasoCoach uses your camera to capture fitness progress photos. For example, you can take before/after photos to track your transformation.",
"NSPhotoLibraryUsageDescription": "LasoCoach accesses your photo library to upload fitness progress photos. For example, you can upload photos showing your workout results or meal prep.",
"NSPhotoLibraryAddUsageDescription": "LasoCoach saves your fitness progress photos to your photo library so you can keep a permanent record of your transformation."
```

#### Test Steps:
1. Request camera permission:
   - Custom description appears ✅
   - Contains specific example ✅

2. Request photo library permission:
   - Custom description appears ✅
   - Contains specific example ✅

3. Privacy manifest:
   - No Xcode warnings ✅
   - All SDKs declared ✅

#### Success Criteria:
- [ ] All permission strings added
- [ ] Specific, example-based descriptions
- [ ] Privacy manifest created
- [ ] No Xcode warnings
- [ ] All data usage declared

---

### ✅ Phase 11: Cleanup & Completeness (2 hours)
**Goal**: Remove all TODOs, placeholders, debug code

#### Tasks:
1. Search and remove all TODO comments
2. Replace placeholder.com images
3. Remove debug console.logs
4. Implement or remove incomplete features
5. Remove "Placeholder" alerts

#### Files to Audit:
```
✅ src/screens/settings/hooks/useSecurity.ts - Remove TODOs
✅ src/context/NotificationContext.tsx - Implement push token registration or remove
✅ src/components/dashboard/NutritionCard.tsx - Replace placeholder images
✅ All screens - Remove debug console.logs
✅ All files - Search for "TODO", "FIXME", "placeholder"
```

#### Automated Checks:
Run these commands and ensure no results:
```bash
# Search for prohibited strings in iOS build
grep -r "subscribe" ios/
grep -r "upgrade" ios/
grep -r "trial" ios/
grep -r "pricing" ios/
grep -r "discount" ios/
grep -r "buy now" ios/

# Search for TODOs
grep -r "TODO" src/
grep -r "FIXME" src/
grep -r "placeholder" src/ --include="*.tsx" --include="*.ts"
```

#### Test Steps:
1. Build iOS app ✅
2. No Xcode warnings ✅
3. No "TODO" in production code ✅
4. No placeholder images visible ✅
5. No console spam ✅

#### Success Criteria:
- [ ] Zero TODOs in src/
- [ ] Zero placeholder images
- [ ] Zero "Placeholder" alerts
- [ ] Clean console logs
- [ ] No prohibited strings in iOS build

---

### ✅ Phase 12: Push Token Registration (1 hour)
**Goal**: Implement or remove push token registration

#### Option A: Implement
```
✅ src/context/NotificationContext.tsx
  - Remove TODO
  - Implement registerPushToken(token)
  - Call backend API POST /notifications/register-token

✅ src/services/notificationApi.ts
  - Create registerToken(token, platform)
  - Create updateToken(token)
```

#### Option B: Remove (if not ready)
```
✅ Remove push notification setup
✅ Remove expo-notifications dependency
✅ Document "Coming in future release"
```

#### Test Steps (if implementing):
1. App requests notification permission ✅
2. Token generated ✅
3. Token sent to backend ✅
4. Backend stores token ✅
5. Can receive test notification ✅

#### Success Criteria:
- [ ] Either fully implemented OR completely removed
- [ ] No half-finished code
- [ ] No TODO comments

---

## TESTING STRATEGY

### Unit Tests (Optional but Recommended)
```typescript
// src/config/__tests__/featureFlags.test.ts
test('isIOSCompanionMode returns correct value')
test('shouldShowPurchaseFlows returns false in companion mode')

// src/hooks/__tests__/useCompanionMode.test.ts
test('useCompanionMode hook returns correct state')
```

### Integration Tests
1. **Companion Mode ON**:
   - No purchase UI visible ✅
   - No Stripe initialization ✅
   - No IAP triggers ✅
   - Entitlements checked from server ✅
   - Account deletion works ✅

2. **Companion Mode OFF**:
   - All purchase flows work ✅
   - Stripe initializes ✅
   - IAP works ✅
   - No regressions ✅

### Physical Device Testing
1. Install on iPhone via TestFlight
2. Toggle companion mode
3. Test each feature area:
   - Login/Logout ✅
   - Entitlement check ✅
   - UGC features ✅
   - Account deletion ✅
   - Permissions ✅

### TestFlight Beta Testing
1. Upload build with `IOS_COMPANION_MODE = true`
2. Invite 5-10 testers
3. Test checklist:
   - Can login ✅
   - Premium content visible (if subscribed) ✅
   - No purchase options visible ✅
   - Account deletion works ✅
   - No crashes ✅

---

## ROLLOUT PLAN

### Step 1: Development (Phases 1-12)
- Implement all phases on MoiseIOS branch
- Test after each phase
- Commit after each successful phase

### Step 2: Internal Testing (3 days)
- Full QA on simulator and physical device
- Test both companion mode ON and OFF
- Document any issues

### Step 3: TestFlight Beta (1 week)
- Upload build with companion mode enabled
- 5-10 beta testers
- Collect feedback
- Fix critical issues

### Step 4: App Store Submission
- Final checks with compliance checklist
- Submit for review
- Monitor for rejection reasons

### Step 5: Gradual Rollout
- Start with 10% of users
- Monitor crashes/errors
- Increase to 50%, then 100%

---

## FILES SUMMARY

### New Files (8)
1. `src/config/featureFlags.ts` - Feature flag system
2. `src/hooks/useCompanionMode.ts` - Companion mode hook
3. `src/hooks/useEntitlements.ts` - Entitlement checking hook
4. `src/services/entitlementService.ts` - Server entitlement fetching
5. `src/services/ugcComplianceService.ts` - UGC terms management
6. `src/services/moderationApi.ts` - Report/Block APIs
7. `src/components/modals/UGCTermsModal.tsx` - Terms acceptance modal
8. `src/components/modals/AccountDeletionModal.tsx` - Deletion confirmation
9. `src/components/ugc/ReportButton.tsx` - Report functionality
10. `src/components/ugc/BlockButton.tsx` - Block functionality
11. `src/hooks/useModeration.ts` - Moderation state hook
12. `ios/LasoCoach/PrivacyInfo.xcprivacy` - Privacy manifest
13. `COMPANION_MODE_TESTING.md` - Testing documentation

### Modified Files (~15)
1. `App.tsx` - Guard Stripe, handle deep links
2. `app.json` - Add permission strings
3. `src/config/index.ts` - Export feature flags
4. `src/components/SubscriptionPaymentFlow.tsx` - Guard payment UI
5. `src/screens/SubscriptionScreen.tsx` - Hide purchase CTAs
6. `src/screens/dashboard/modals/SubscriptionPlansModal.tsx` - Disable plans
7. `src/services/iapService.ts` - Guard IAP calls
8. `src/services/payment/PaymentService.ts` - Check companion mode
9. `src/services/payment/IOSPaymentService.ts` - Disable payments
10. `src/screens/settings/hooks/useSecurity.ts` - Real deletion
11. `src/services/firebaseAuthServiceNew.ts` - Enhanced deleteAccount
12. `src/context/FirebaseAuthContext.tsx` - Fetch entitlements
13. `src/screens/DashboardScreen.tsx` - Check entitlements
14. `src/context/NotificationContext.tsx` - Push token registration
15. `src/components/dashboard/NutritionCard.tsx` - Replace placeholders

---

## COMPLIANCE CHECKLIST (Mapped to Phases)

### 3.1.1 Companion
- [ ] Phase 2: All payment UIs removed/hidden
- [ ] Phase 3: Stripe/PayPal not initialized
- [ ] Phase 4: IAP purchase triggers unreachable
- [ ] Phase 5: Deep links blocked
- [ ] Phase 11: No "subscribe"/"upgrade"/"trial" strings in iOS build
- [ ] Phase 6: Only server-driven entitlements

### 1.2 UGC
- [ ] Phase 7: Zero-tolerance terms acceptance required
- [ ] Phase 8: Report button functional
- [ ] Phase 8: Block button functional
- [ ] Phase 8: Instant local filtering
- [ ] Phase 8: Backend moderation APIs called

### 5.1.1(v) Account Deletion
- [ ] Phase 9: Full end-to-end deletion flow
- [ ] Phase 9: Two-step confirmation
- [ ] Phase 9: Backend delete called
- [ ] Phase 9: Firebase delete called
- [ ] Phase 9: AsyncStorage cleared
- [ ] Phase 9: Auto logout after deletion

### 5.1.1 Purpose Strings
- [ ] Phase 10: NSCameraUsageDescription added
- [ ] Phase 10: NSPhotoLibraryUsageDescription added
- [ ] Phase 10: Specific, example-based descriptions
- [ ] Phase 10: Privacy manifest created

### 2.1 Completeness
- [ ] Phase 11: All TODOs removed
- [ ] Phase 11: All placeholders removed
- [ ] Phase 11: Debug code removed
- [ ] Phase 12: Push tokens implemented or removed

### 2.3.3/2.3.10 Metadata
- [ ] Manual: Screenshots show iOS-only UI
- [ ] Manual: Device frames consistent
- [ ] Manual: No Android UI visible

---

## RISK MITIGATION

### High Risk Areas
1. **Stripe Removal**: Could break existing subscriptions
   - Mitigation: Only disable for iOS companion mode
   - Keep Android unchanged

2. **Account Deletion**: Could accidentally delete wrong user
   - Mitigation: Two-step confirmation with type "DELETE"
   - Extensive testing with test accounts

3. **Entitlement Caching**: Could show wrong content
   - Mitigation: Short cache expiry (1 hour)
   - Refresh on app resume

### Rollback Plan
- Keep feature flag to quickly disable companion mode
- Maintain non-companion mode code paths
- Can revert to Stripe/PayPal if needed

---

## TIMELINE ESTIMATE

| Phase | Duration | Cumulative |
|-------|----------|------------|
| 0: Preparation | 0.5h | 0.5h |
| 1: Feature Flags | 1h | 1.5h |
| 2: Guard Payment Flow | 2h | 3.5h |
| 3: Remove Stripe Init | 1.5h | 5h |
| 4: Guard IAP | 1h | 6h |
| 5: Deep Links | 1h | 7h |
| 6: Entitlements | 2h | 9h |
| 7: UGC Terms | 2h | 11h |
| 8: Report/Block | 3h | 14h |
| 9: Account Deletion | 2h | 16h |
| 10: Permissions | 1.5h | 17.5h |
| 11: Cleanup | 2h | 19.5h |
| 12: Push Tokens | 1h | 20.5h |
| **Testing** | 4h | 24.5h |
| **TOTAL** | **~25 hours** | **~3-4 days** |

---

## NEXT STEPS

1. **Review this plan** - Approve approach
2. **Start Phase 0** - Set up safety mechanisms
3. **Implement Phase 1** - Feature flags
4. **Test after each phase** - Don't skip testing
5. **Commit after each phase** - Small, atomic commits
6. **Final TestFlight** - Full beta testing

---

## SUPPORT & QUESTIONS

If any phase fails or is blocked:
1. Stop and document the issue
2. Don't proceed to next phase
3. Ask for guidance
4. Consider alternative approach

**Ready to start?** Let's begin with Phase 0! 🚀
