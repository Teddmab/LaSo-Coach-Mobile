# Apple Compliance Audit - Endpoint Analysis
## LasoCoach v1.0.6 (Build 27)

**Date:** January 17, 2026  
**Status:** COMPLIANCE REVIEW  
**Review Basis:** Apple Guideline 1.2 (UGC), 3.1.1 (Payments), 2.1 (Completeness), 5.1.1 (Privacy)

---

## Executive Summary

**CRITICAL FINDING:** ⚠️ Several endpoints present potential compliance risks on iOS.

| Category | Risk Level | Status |
|----------|-----------|--------|
| **Payment Endpoints** | 🔴 **HIGH** | RISK IDENTIFIED |
| **Entitlements Endpoints** | 🟡 **MEDIUM** | MITIGATED (companion mode) |
| **UGC Moderation** | 🟢 **LOW** | COMPLIANT |
| **Profile/Data** | 🟢 **LOW** | COMPLIANT |

---

## FLAGGED ENDPOINTS - MUST ADDRESS

### 🔴 CRITICAL: `/payments/validate-ios-receipt`

**Issue:** This endpoint validates in-app purchase receipts from iOS App Store  
**Apple Guideline Violation:** 3.1.1 (In-App Purchase)  
**Problem:** iOS companion mode should NOT process any payments or receipts  
**Current Status:** ⚠️ **NOT GATED** - Will fail Apple review  

**Details:**
```typescript
// In iapReceiptApi.ts
static async validateiOSReceipt(receiptData) {
  const response = await api.post('/payments/validate-ios-receipt', {
    receiptData: receiptData.transactionReceipt,
    transactionId: receiptData.transactionId,
    productId: receiptData.productId,
    originalTransactionId: receiptData.originalTransactionId,
  });
  return response.data;
}
```

**Risk:** If this endpoint is called on iOS in production, it confirms payment processing is active, violating Apple's guidelines.

**Recommendation:** 🔧 **ADD GUARD**
```typescript
// BEFORE calling this endpoint, add:
if (isIOSCompanionMode()) {
  throw new Error('Payment validation not available on iOS companion app');
}
```

---

### 🔴 CRITICAL: `/payments/validate-android-receipt`

**Issue:** While Android-specific, endpoint naming could trigger scrutiny  
**Apple Guideline Violation:** Not directly (Android-specific)  
**Problem:** Backend should be aware we don't call this on iOS  
**Current Status:** ⚠️ **PARTIALLY MITIGATED** - Platform check at call site needed  

**Recommendation:** 🔧 **ADD PLATFORM CHECK**
```typescript
// In iapReceiptApi.ts
static async validateReceipt(receiptData) {
  if (Platform.OS === 'ios') {
    throw new Error('Receipt validation not supported on iOS companion app');
  }
  
  if (receiptData.platform === 'android') {
    return await this.validateAndroidReceipt(receiptData);
  }
}
```

---

### 🔴 CRITICAL: `/payments/sync-subscription-status`

**Issue:** Syncs subscription status from native store to backend  
**Apple Guideline Violation:** 3.1.1 (Payments - indicates active payment processing)  
**Problem:** Should not be called on iOS; implies subscription payment flow exists  
**Current Status:** ⚠️ **NOT GATED** - High risk  

**Details:**
```typescript
// In iapReceiptApi.ts
static async syncSubscriptionStatus(userId) {
  const response = await api.post('/payments/sync-subscription-status', {
    userId,
    platform: Platform.OS,
  });
  return response.data;
}
```

**Risk:** Apple reviewer will see this endpoint and ask: "Why are you syncing subscriptions on iOS if you claim to be companion-only?"

**Recommendation:** 🔧 **ADD GUARD**
```typescript
static async syncSubscriptionStatus(userId) {
  if (Platform.OS === 'ios') {
    console.warn('⚠️ Subscription sync not available on iOS companion app');
    return null; // Do not call backend endpoint
  }
  
  const response = await api.post('/payments/sync-subscription-status', {
    userId,
    platform: Platform.OS,
  });
  return response.data;
}
```

---

### 🟡 HIGH RISK: `/subscription/status`

**Issue:** Fetches current subscription status  
**Apple Guideline Violation:** 3.1.1 (indicates subscription system exists on iOS)  
**Problem:** Already gated in NutritionScreen, but endpoint documentation doesn't show guard  
**Current Status:** 🟡 **PARTIALLY MITIGATED** (gated at NutritionScreen level, not API level)  

**Details:**
```typescript
// In nutritionApi.ts
async getCurrentSubscription() {
  const response = await api.get('/subscriptions/current');
  return response.data;
}
```

**Problem:** This hook-level guard exists:
```typescript
// In NutritionScreen.tsx
if (isCompanionMode) {
  // Skip all premium fetch
  return;
}
```

But the API method itself has NO guard. If another screen calls this endpoint, it will bypass the guard.

**Recommendation:** 🔧 **ADD GUARD AT API LEVEL**
```typescript
async getCurrentSubscription() {
  if (isIOSCompanionMode()) {
    return this.getDefaultSubscription(); // Return empty/free state
  }
  
  const response = await api.get('/subscriptions/current');
  return response.data;
}
```

---

### 🟡 HIGH RISK: `/entitlements`

**Issue:** Fetches user entitlements (premium access flags)  
**Current Status:** 🟢 **MITIGATED** - Already has guard in entitlementsApi.ts  

**Verified Guard:**
```typescript
// In entitlementsApi.ts
static async getUserEntitlements(): Promise<Entitlements> {
  if (isIOSCompanionMode()) {
    return this.getDefaultEntitlements(); // ✅ GUARD PRESENT
  }
  const response = await api.get('/entitlements');
  return response.data;
}
```

**Status:** ✅ **COMPLIANT** - No action needed.

---

### 🟡 HIGH RISK: `/nutrition/plans`

**Issue:** Fetches meal plans (premium content)  
**Current Status:** 🟢 **MITIGATED** - Guarded in NutritionScreen  

**Verified Guard:**
```typescript
// In NutritionScreen.tsx fetchAllData()
if (isCompanionMode) {
  logger.info('🍎 iOS COMPANION MODE: Skipping premium content fetch');
  setNutritionPlans([]);
  return;
}
```

**Status:** ✅ **COMPLIANT** - No action needed.

---

## ENDPOINTS VERIFIED SAFE

### ✅ Moderation & Safety
**Endpoints:**
- `POST /moderation/reports` - ✅ Safe (UGC protection)
- `POST /moderation/blocks` - ✅ Safe (User safety)
- `POST /moderation/developer-alerts` - ✅ Safe (Compliance feature)

**Status:** COMPLIANT - No payment/premium access involved

---

### ✅ Community & UGC
**Endpoints:**
- `GET /community/posts` - ✅ Safe (Free feature)
- `POST /community/posts` - ✅ Safe (UGC with moderation)
- `POST /community/posts/{postId}/like` - ✅ Safe (Engagement)

**Features:**
- ✅ UGC Terms gate required before access
- ✅ User blocking prevents content display
- ✅ Developer alerts on block
- ✅ Instant filtering of blocked content

**Status:** COMPLIANT - Meets Guideline 1.2 requirements

---

### ✅ Chat & Messaging
**Endpoints:**
- `GET /chat/conversations` - ✅ Safe (Free feature)
- `GET /chat/conversations/{chatId}/messages` - ✅ Safe (Instant filtering of blocked users)
- `POST /chat/conversations/{chatId}/messages` - ✅ Safe (Free feature)
- `POST /chat/one-to-one` - ✅ Safe (Free feature)

**Features:**
- ✅ Message filtering for blocked users
- ✅ Instant removal of blocked user messages
- ✅ No premium content involved

**Status:** COMPLIANT - Meets Guideline 1.2 requirements

---

### ✅ Profile Management
**Endpoints:**
- `GET /auth/profile` - ✅ Safe (Basic profile)
- `PUT /profile` - ✅ Safe (Profile update)
- `DELETE /profile` - ✅ Safe (Account deletion - complies with 5.1.1)

**Status:** COMPLIANT - Meets Guideline 5.1.1 (account deletion)

---

### ✅ Progress & Measurements
**Endpoints:**
- `GET /progress/overview` - ✅ Safe (Free analytics)
- `GET /progress/detailed` - ✅ Safe (Free analytics)
- `GET /progress/historical` - ✅ Safe (Free analytics)
- `GET /onboarding/measurements` - ✅ Safe (Free tracking)
- `POST /onboarding/measurements` - ✅ Safe (Free tracking)

**Status:** COMPLIANT - No payment involved

---

### ✅ Achievements & Badges
**Endpoints:**
- `GET /mobile/badges` - ✅ Safe (Free gamification)
- `GET /mobile/badges/summary` - ✅ Safe (Free gamification)
- `GET /mobile/badges/next` - ✅ Safe (Free gamification)

**Status:** COMPLIANT - No payment involved

---

### ✅ Device Management
**Endpoints:**
- `POST /devices/register` - ✅ Safe (Device tracking)
- `GET /devices` - ✅ Safe (Device listing)
- `DELETE /devices/{deviceId}` - ✅ Safe (Device removal)

**Status:** COMPLIANT - No payment involved

---

### ✅ Notifications
**Endpoints:**
- `GET /notifications` - ✅ Safe (Free notifications)
- `GET /notifications/unread/count` - ✅ Safe (Free feature)
- `PATCH /notifications/{notificationId}/read` - ✅ Safe (Free feature)

**Status:** COMPLIANT - No payment involved

---

### ✅ Agenda & Content
**Endpoints:**
- `GET /content/agenda` - ✅ Safe (Free content, already gated at screen level)
- `POST /content/{contentId}/complete` - ✅ Safe (Free content)

**Status:** COMPLIANT - No payment involved

---

### ✅ FAQ
**Endpoints:**
- `GET /faqs/public` - ✅ Safe (Public FAQ)

**Status:** COMPLIANT - No payment involved

---

### ✅ Authentication
**Endpoints:**
- `POST /auth/login` - ✅ Safe (Authentication)
- `POST /auth/register` - ✅ Safe (Authentication)
- `POST /auth/logout` - ✅ Safe (Authentication)
- `POST /auth/forgot-password` - ✅ Safe (Authentication)

**Status:** COMPLIANT - No payment involved

---

## COMPLIANCE MATRIX

| Guideline | Requirement | Endpoints | Status |
|-----------|-------------|-----------|--------|
| **1.2 UGC** | Terms gate | UgcTermsModal gate | ✅ COMPLIANT |
| **1.2 UGC** | User blocking | `/moderation/blocks` | ✅ COMPLIANT |
| **1.2 UGC** | Instant filtering | ChatScreen, CommunityScreen | ✅ COMPLIANT |
| **1.2 UGC** | Dev alerts | `/moderation/developer-alerts` | ✅ COMPLIANT |
| **3.1.1 Payments** | No iOS payment UI | Companion mode guard | ✅ COMPLIANT |
| **3.1.1 Payments** | No receipt validation on iOS | ⚠️ **MISSING GUARD** | 🔴 AT RISK |
| **3.1.1 Payments** | No subscription sync on iOS | ⚠️ **MISSING GUARD** | 🔴 AT RISK |
| **2.1 Completeness** | No placeholder actions | Wrapped `<SecurityForm>` | ✅ COMPLIANT |
| **5.1.1 Privacy** | Purpose strings | Photo library example-based | ✅ COMPLIANT |
| **5.1.1 Privacy** | Account deletion in-app | `/profile` DELETE + Firebase | ✅ COMPLIANT |

---

## RECOMMENDED FIXES

### Priority 1 - CRITICAL (Must fix before App Store submission)

#### Fix 1: Guard `/payments/validate-ios-receipt`
**File:** `src/services/iapReceiptApi.ts`  
**Change:**
```typescript
static async validateiOSReceipt(receiptData) {
  if (isIOSCompanionMode()) {
    console.warn('🍎 Receipt validation not available on iOS companion app');
    throw new Error('Payment validation not supported on iOS');
  }
  
  try {
    const response = await api.post('/payments/validate-ios-receipt', {
      receiptData: receiptData.transactionReceipt,
      transactionId: receiptData.transactionId,
      productId: receiptData.productId,
      originalTransactionId: receiptData.originalTransactionId,
    });
    return response.data;
  } catch (error) {
    throw this.handleValidationError(error);
  }
}
```

#### Fix 2: Guard `/payments/validate-android-receipt`
**File:** `src/services/iapReceiptApi.ts`  
**Change:**
```typescript
static async validateReceipt(receiptData) {
  try {
    // On iOS, always reject receipt validation
    if (Platform.OS === 'ios' || receiptData.platform === 'ios') {
      console.warn('🍎 Receipt validation blocked on iOS companion mode');
      throw new Error('Payment validation not available on iOS');
    }
    
    if (receiptData.platform === 'android') {
      return await this.validateAndroidReceipt(receiptData);
    } else {
      throw new Error('Unsupported platform for receipt validation');
    }
  } catch (error) {
    throw error;
  }
}
```

#### Fix 3: Guard `/payments/sync-subscription-status`
**File:** `src/services/iapReceiptApi.ts`  
**Change:**
```typescript
static async syncSubscriptionStatus(userId) {
  try {
    // iOS companion mode does not sync subscriptions
    if (Platform.OS === 'ios' || isIOSCompanionMode()) {
      console.warn('🍎 Subscription sync not available on iOS companion app');
      return { subscriptionStatus: 'COMPANION_MODE', accessLevel: 'FREE' };
    }
    
    const response = await api.post('/payments/sync-subscription-status', {
      userId,
      platform: Platform.OS,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}
```

#### Fix 4: Guard `/subscription/status`
**File:** `src/services/nutritionApi.ts`  
**Change:**
```typescript
async getCurrentSubscription() {
  try {
    // iOS companion mode does not fetch subscription status
    if (isIOSCompanionMode()) {
      return {
        subscriptionStatus: 'COMPANION_MODE',
        accessLevel: 'FREE',
        message: 'Companion app - no active subscription'
      };
    }
    
    const response = await api.get('/subscriptions/current');
    return response.data;
  } catch (error) {
    throw error;
  }
}
```

---

## POST-FIX COMPLIANCE CHECKLIST

After applying fixes above, verify:

### iOS Payment Endpoints
- [ ] `/payments/validate-ios-receipt` - ✅ Guarded, throws error on iOS
- [ ] `/payments/validate-android-receipt` - ✅ Guarded, rejected on iOS
- [ ] `/payments/sync-subscription-status` - ✅ Guarded, returns companion state on iOS
- [ ] `/subscription/status` - ✅ Guarded, returns companion state on iOS

### UGC Compliance
- [ ] UGC Terms gate - ✅ Present and mandatory
- [ ] User blocking - ✅ Triggers instant filtering
- [ ] Message filtering - ✅ Blocks removed from feed
- [ ] Developer alerts - ✅ Sent on block

### Profile & Data
- [ ] Account deletion in-app - ✅ Two-step confirmation
- [ ] Firebase deletion - ✅ Complete user wipe
- [ ] Backend deletion - ✅ Profile data removed

### iOS Companion Mode
- [ ] Premium content skipped - ✅ NutritionScreen early return
- [ ] Entitlements gated - ✅ Returns default
- [ ] No payment UI - ✅ SecurityForm hidden
- [ ] All payment APIs guarded - ✅ (After fixes applied)

---

## BACKEND ENDPOINTS TO DISCUSS WITH TEAM

The following endpoints should be reviewed with the backend team to ensure they don't process iOS payments:

1. **`POST /payments/validate-ios-receipt`**
   - Backend should reject requests on iOS or respond with error
   - Alternative: Backend could check Firebase auth context for platform info

2. **`POST /payments/sync-subscription-status`**
   - Backend should validate platform = 'ios' and deny, or simply return empty

3. **`POST /payments/validate-android-receipt`**
   - Backend should only accept android platform requests

4. **`GET /subscriptions/current`**
   - Backend response should indicate "COMPANION_MODE" if user is on iOS

**Recommendation:** Add backend middleware that:
- Logs platform information for each request
- Rejects payment validation requests from iOS with clear error message
- Returns "companion_mode" status for iOS subscription requests

---

## APPLE REVIEW RISK ASSESSMENT

### Before Fixes
**Risk Level:** 🔴 **HIGH** (Will likely fail review)

**Why:**
- Payment validation endpoints callable on iOS
- Subscription sync not guarded on iOS
- Could indicate active IAP processing system on iOS

**Expected Apple Response:**
> "Your app contains payment processing endpoints that suggest in-app purchase functionality on iOS. This violates Guideline 3.1.1. Please remove all IAP processing from iOS build or restructure as free companion app with no payment collection."

---

### After Fixes
**Risk Level:** 🟢 **LOW** (Should pass review)

**Why:**
- All payment endpoints guarded on iOS
- Payment validation throws errors on iOS
- Companion mode returns friendly defaults instead of payment data
- UGC moderation fully implemented per Guideline 1.2
- Account deletion in-app per Guideline 5.1.1

**Expected Apple Response:**
> "Thank you for addressing our previous feedback. Your implementation now clearly separates iOS companion mode (free journal/community) from Android premium features. Payment processing is properly gated off on iOS. App is approved for distribution."

---

## FINAL RECOMMENDATION

**✅ APPLY ALL 4 FIXES IMMEDIATELY**

These are required before App Store submission to ensure compliance with:
- Guideline 3.1.1 (Payments - In-App Purchase)
- Guideline 2.1 (Completeness - no incomplete features)

**Estimated Implementation Time:** 30-45 minutes  
**Risk if Not Applied:** App rejection by Apple

---

## Version History

| Date | Status | Notes |
|------|--------|-------|
| Jan 17, 2026 | AUDIT COMPLETE | 4 critical guards identified and fixes provided |

