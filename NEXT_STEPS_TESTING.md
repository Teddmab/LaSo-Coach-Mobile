# 🧪 Next Steps - Testing Native IAP

## ✅ What Just Worked

### Build Success
- iOS app compiled successfully
- 0 errors, 10 warnings (non-critical)
- RNIap native module linked correctly
- All dependencies working

### App Running
- Dashboard loading ✅
- User authenticated ✅
- Profile data fetching ✅
- Active subscription detected ✅

---

## 🎯 What to Test Now

### 1. Navigate to Subscription Screen
In the running app on simulator:
1. Open the app (already running)
2. Tap on **Profile** or **Settings**
3. Find **"Subscription"** or **"Manage Subscription"** button
4. Tap to open subscription screen

**Expected Result:**
- New subscription screen should load
- Should show your current Flexy subscription
- Should display subscription plans
- Should show "Already subscribed? Manage account" link at bottom

---

### 2. Check UI Elements

Look for these on the screen:

#### ✅ Should See:
- [ ] Current subscription card showing "Flexy" plan
- [ ] "20 days remaining" display
- [ ] Subscription plans (Premium, Basic, Flexy, etc.)
- [ ] Each plan shows price
- [ ] Subscribe buttons (disabled for current plan)
- [ ] "Restore purchases" button (iOS)
- [ ] Discreet link at bottom: "Already subscribed? Manage account"

#### ❌ Should NOT See:
- No "Pay with Stripe" redirect button
- No external browser opening on button press
- No promotional language for external payment

---

### 3. Test Button Interactions

#### Test 1: Tap Current Plan Button
1. Find the "Flexy" plan card
2. Tap the button
3. **Expected**: Button should be disabled or show "Plan actuel"

#### Test 2: Tap Different Plan Button
1. Find a different plan (e.g., "Premium")
2. Tap "Subscribe" button
3. **Expected**: 
   - Should show native iOS payment sheet (App Store dialog)
   - OR alert saying "Products not available" (normal - stores not configured yet)

#### Test 3: Tap "Restore Purchases"
1. Find "Restore purchases" button
2. Tap it
3. **Expected**: 
   - Confirmation dialog
   - May say "No purchases found" (normal without store setup)

#### Test 4: Tap External Link
1. Scroll to bottom
2. Find "Already subscribed? Manage account" link
3. Tap it
4. **Expected**:
   - Alert asking to open external browser
   - Tapping "Continue" should open Safari to app.lasocoach.com

---

### 4. Check Console Logs

While testing, watch for these logs:

```
✅ Good Logs:
- "💳 IAP Event: purchase_initiated"
- "💳 Fetching IAP products from store"
- "✅ IAP connection initialized"

⚠️ Expected Warnings (until stores configured):
- "Products not found"
- "Store product not available"

❌ Bad Logs (shouldn't see):
- "Opening external payment URL" (old code)
- "Stripe checkout session created"
- Network errors
```

---

## 📸 Take Screenshots

If everything looks good, take screenshots of:
1. Subscription screen showing plans
2. Current subscription card
3. External link at bottom
4. Any alerts/dialogs that appear

---

## 🐛 If You See Issues

### Issue: App crashes when opening subscription screen
**Fix**: Check console for error - likely import issue
```bash
# Restart Metro bundler
npm start -- --reset-cache
```

### Issue: Old subscription screen still showing
**Fix**: Clear cache and rebuild
```bash
rm -rf ios/build
npx expo run:ios
```

### Issue: "Cannot find module" errors
**Fix**: Reinstall dependencies
```bash
npm install
cd ios && pod install && cd ..
npx expo run:ios
```

---

## ✅ Success Criteria

The implementation is working if you see:

1. ✅ New subscription screen loads without crash
2. ✅ Native IAP code is being called (check logs)
3. ✅ No external browser redirects happening
4. ✅ UI shows compliant layout
5. ✅ External link is discreet and separate

---

## 📋 Current Status

- [x] Dependencies installed
- [x] iOS build successful
- [x] App running on simulator
- [x] No compilation errors
- [ ] **→ NOW: Test subscription screen UI**
- [ ] Configure App Store products
- [ ] Implement backend validation
- [ ] Test with sandbox accounts

---

## 🚀 After UI Testing

Once you confirm the UI looks good:

### Next Phase: Store Configuration

1. **Read**: `IAP_SETUP_IOS.md`
2. **Create products** in App Store Connect:
   - `com.laso.coach.premium_monthly`
   - `com.laso.coach.premium_yearly`
   - `com.laso.coach.basic_monthly`
   - `com.laso.coach.flexy_monthly`

3. **Read**: `BACKEND_API_SPEC.md`
4. **Implement** receipt validation endpoints

5. **Test** with sandbox account

---

## 💬 What to Report

After testing, let me know:

1. **Does the subscription screen load?** Yes/No
2. **What UI elements do you see?** (describe or screenshot)
3. **Any errors in console?** (copy/paste)
4. **Does tapping subscribe button work?** (describe what happens)
5. **Any crashes or issues?** (describe)

---

**Current Test Environment:**
- Platform: iOS Simulator (iPhone 16 Pro)
- App Version: 1.0.0
- react-native-iap: 12.15.4
- Expo SDK: 53.0.22
- Date: 2025-10-12

**Status: ✅ Ready for UI Testing**

Navigate to the subscription screen in the app and report what you see!

