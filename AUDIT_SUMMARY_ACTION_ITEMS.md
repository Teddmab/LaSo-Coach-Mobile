# Compliance Audit Summary - Action Items

**Status**: 🔴 **CANNOT SUBMIT - 3 CRITICAL ISSUES**

---

## Critical Issues (MUST FIX)

### 🔴 Issue 1: Stripe SDK in Dependencies
- **File**: `package.json` line 29
- **Problem**: `@stripe/stripe-react-native` v0.50.3 bundled with app
- **Impact**: FAILS 3.1.1 immediately
- **Fix**: `npm uninstall @stripe/stripe-react-native`
- **Time**: 2 minutes

### 🔴 Issue 2: Payment Pricing Display  
- **File**: `src/screens/NutritionScreen.tsx` lines 1760-1770
- **Problem**: Hard-coded pricing "$85" → "$50" visible in locked content message
- **Impact**: User sees pricing/discounts; FAILS 3.1.1
- **Fix**: Delete `<View style={styles.planPricing}>` block
- **Time**: 5 minutes

### 🔴 Issue 3: External Payment Steering
- **File**: `src/screens/NutritionScreen.tsx` line 1710
- **Problem**: "Visit app.lasocoach.com to subscribe" visible to iOS users
- **Impact**: Directs to external payment site; FAILS 3.1.1  
- **Fix**: Remove `<Text style={styles.websiteHighlight}>app.lasocoach.com</Text>` reference
- **Time**: 3 minutes

---

## Passing Tests ✅

| Guideline | Requirement | Status |
|-----------|-------------|--------|
| **1.2** | UGC terms gate with zero-tolerance | ✅ PASS |
| **1.2** | Block abusive users + instant removal | ✅ PASS |
| **1.2** | Developer notifications on block | ✅ PASS |
| **2.1** | No placeholder text/images | ✅ PASS |
| **3.1.1** | No IAP SDK | ✅ PASS |
| **3.1.1** | No PayPal SDK | ✅ PASS |
| **3.1.1** | Server-driven entitlements | ✅ PASS |
| **3.1.1** | No local unlock flags | ✅ PASS |

---

## High Priority Issues (RECOMMENDED)

### 🟡 Issue 4: Stripe Config
- **File**: `src/config/env.ts` & `src/types/env.d.ts`
- **Action**: Verify STRIPE_PUBLISHABLE_KEY is null in iOS build
- **Time**: 5 minutes

### 🟡 Issue 5: Payment Handlers
- **File**: `src/screens/ProfileScreen.tsx` (handleSubscribe)
- **Action**: Remove or ensure no-op implementation
- **Time**: 3 minutes

---

## Verification Checklist

After fixes, run:

```bash
# 1. Verify Stripe removed
npm list @stripe
# Expected: (empty)

# 2. Verify pricing removed
grep -n "planPricing\|websiteHighlight" src/screens/NutritionScreen.tsx
# Expected: No matches (or only comments)

# 3. Rebuild
npm run build
# Expected: 0 errors

# 4. Build for iOS
eas build -p ios --profile production
```

---

## Timeline to Resubmission

| Phase | Task | Time | Status |
|-------|------|------|--------|
| 1 | Fix 3 critical issues | 15 min | 🔴 NOT STARTED |
| 2 | Verify grep + build | 10 min | ⏳ PENDING |
| 3 | QA test on iPad | 1-2 hrs | ⏳ PENDING |
| 4 | Screenshots prep | 1-2 hrs | ⏳ PENDING |
| 5 | Submit to App Store | 10 min | ⏳ PENDING |

**Estimated Total**: 3-4 hours  
**Can Resubmit**: Tomorrow morning after fixes + QA

---

## Evidence Files

Full audit with file paths and code snippets:
- 📄 [COMPREHENSIVE_COMPLIANCE_AUDIT_JAN17_2026.md](COMPREHENSIVE_COMPLIANCE_AUDIT_JAN17_2026.md)

---

## Bottom Line

✅ **Good News**: UGC compliance (1.2) is excellent - terms gate, blocking, dev notifications all working

❌ **Bad News**: Payment compliance (3.1.1) has 3 showstoppers - Stripe SDK, pricing display, website link

🎯 **Action**: Fix 3 issues (15 min) + verify (10 min) + test (1-2 hrs) = Ready to submit tomorrow

**Status**: 🔴 **DO NOT SUBMIT YET** - 3 critical issues must be fixed first
