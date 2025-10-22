# 🎯 Native IAP Implementation Guide - LaSo Coach

## Overview

This document outlines the complete implementation of globally compliant native In-App Purchases (IAP) for the LaSo Coach mobile app, replacing the non-compliant external payment redirect system.

---

## ✅ What Changed

### Before (Non-Compliant)
```javascript
// ❌ Opens external browser for Stripe/PayPal
await Linking.openURL(checkoutData.url);
```

### After (Compliant)
```javascript
// ✅ Uses native App Store / Google Play
await IAPService.requestPurchase(productId, true);
// Then validates receipt server-side
await IAPReceiptApi.validateReceipt(receiptData);
```

---

## 📁 New Files Created

### 1. **src/services/iapService.js**
- Core IAP service
- Handles purchases, restore, product fetching
- Platform-agnostic wrapper for react-native-iap

### 2. **src/services/iapReceiptApi.js**
- Receipt validation API client
- Communicates with your backend
- Handles iOS and Android receipt formats

### 3. **src/screens/SubscriptionScreen.compliant.js**
- New compliant subscription screen
- Native IAP as primary payment method
- Discreet external link (Reader App style)
- No payment steering

### 4. **Configuration Files**
- `IAP_SETUP_IOS.md` - iOS App Store setup
- `IAP_SETUP_ANDROID.md` - Google Play setup
- Backend API requirements (below)

---

## 🚀 Installation Steps

### Step 1: Install Dependencies

```bash
# Install react-native-iap
npm install react-native-iap@^12.15.4

# OR with yarn
yarn add react-native-iap@^12.15.4
```

### Step 2: iOS Setup

```bash
cd ios
pod install
cd ..
```

**Xcode Configuration:**
1. Open `ios/LasoCoach.xcworkspace` in Xcode
2. Select target > Signing & Capabilities
3. Add "In-App Purchase" capability
4. Build and run

### Step 3: Android Setup

Already configured automatically via `react-native-iap`.

Verify in `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="com.android.vending.BILLING" />
```

### Step 4: Replace SubscriptionScreen

**Backup current file:**
```bash
mv src/screens/SubscriptionScreen.js src/screens/SubscriptionScreen.old.js
```

**Use compliant version:**
```bash
mv src/screens/SubscriptionScreen.compliant.js src/screens/SubscriptionScreen.js
```

### Step 5: Test

```bash
# iOS
npx expo run:ios

# Android  
npx expo run:android
```

---

## 🔧 Backend API Requirements

Your backend **MUST** implement these endpoints:

### 1. Validate iOS Receipt

**Endpoint**: `POST /payments/validate-ios-receipt`

**Request Body:**
```json
{
  "receiptData": "base64_encoded_receipt",
  "transactionId": "1000000123456789",
  "productId": "com.laso.coach.premium_monthly",
  "originalTransactionId": "1000000123456789"
}
```

**Backend Logic:**
1. Decode receipt data
2. Send to Apple's server:
   ```
   POST https://buy.itunes.apple.com/verifyReceipt
   {
     "receipt-data": "<receipt>",
     "password": "<shared_secret>"
   }
   ```
3. Validate response
4. Create/update subscription in database
5. Return success

**Response:**
```json
{
  "success": true,
  "data": {
    "subscriptionId": "sub_123",
    "expiresAt": "2025-11-12T00:00:00Z",
    "status": "ACTIVE"
  }
}
```

---

### 2. Validate Android Receipt

**Endpoint**: `POST /payments/validate-android-receipt`

**Request Body:**
```json
{
  "purchaseToken": "google_purchase_token",
  "productId": "com.laso.coach.premium_monthly",
  "orderId": "GPA.1234-5678-9012-34567",
  "packageName": "com.laso.coach"
}
```

**Backend Logic:**
1. Use Google Play Developer API
2. Verify purchase token:
   ```
   GET https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{packageName}/purchases/subscriptionsv2/tokens/{token}
   ```
3. Validate subscription status
4. Create/update subscription in database
5. Return success

**Response:**
```json
{
  "success": true,
  "data": {
    "subscriptionId": "sub_456",
    "expiresAt": "2025-11-12T00:00:00Z",
    "status": "ACTIVE"
  }
}
```

---

### 3. Restore Purchases

**Endpoint**: `POST /payments/restore-purchases`

**Request Body:**
```json
{
  "receipts": [
    {
      "platform": "ios",
      "productId": "com.laso.coach.premium_monthly",
      "transactionId": "1000000123456789",
      "transactionReceipt": "base64..."
    }
  ],
  "platform": "ios"
}
```

**Backend Logic:**
1. Loop through receipts
2. Validate each with platform API
3. Restore active subscriptions
4. Return list of restored subscriptions

**Response:**
```json
{
  "success": true,
  "data": {
    "restored": 2,
    "subscriptions": [...]
  }
}
```

---

### 4. Get Native Products

**Endpoint**: `GET /subscriptions/native-products`

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "planId": "premium_monthly",
        "productId": "com.laso.coach.premium_monthly",
        "platform": "both"
      },
      {
        "planId": "premium_yearly",
        "productId": "com.laso.coach.premium_yearly",
        "platform": "both"
      }
    ]
  }
}
```

---

## 🔐 Security Best Practices

### 1. **ALWAYS Validate Server-Side**
```javascript
// ✅ GOOD
const receiptData = IAPService.extractReceiptData(purchase);
await IAPReceiptApi.validateReceipt(receiptData); // Backend validates
// Only unlock after backend confirms

// ❌ BAD - Never trust client
if (purchase.transactionId) {
  unlockContent(); // Don't do this without server validation!
}
```

### 2. **Store Sensitive Data on Backend**
- Apple Shared Secret
- Google Service Account JSON
- Never in mobile app code

### 3. **Implement Receipt Caching**
- Store validated receipts in database
- Check expiration before each access
- Re-validate periodically

### 4. **Handle Fraud**
- Detect duplicate receipts
- Monitor for unusual patterns
- Implement rate limiting

---

## 📱 App Store / Play Console Setup

### iOS App Store
Follow `IAP_SETUP_IOS.md` for:
- Creating subscription products
- Configuring App Store Connect
- Setting up sandbox testing
- Submitting for review

### Google Play
Follow `IAP_SETUP_ANDROID.md` for:
- Creating subscription products
- Configuring Play Console
- Setting up license testing
- Enabling real-time notifications

---

## 🧪 Testing

### iOS Sandbox Testing

1. **Create Sandbox Test Account**
   - App Store Connect > Users and Access > Sandbox Testers
   - Add test email (don't verify)

2. **Test on Device**
   ```bash
   npx expo run:ios --device
   ```

3. **Sign in with Sandbox Account**
   - When prompted for payment, use sandbox account
   - Purchase completes without real charge

4. **Verify**
   - Check backend logs for receipt validation
   - Verify subscription activated
   - Test restore purchases

### Android License Testing

1. **Add Test Account**
   - Play Console > Setup > License testing
   - Add Gmail account

2. **Upload to Internal Testing**
   ```bash
   eas build --platform android --profile production
   ```

3. **Test Purchase**
   - Install from Play Console
   - Make test purchase
   - Verify flow completes

---

## 🚨 Common Issues

### Issue 1: "Products not found"

**iOS:**
- Products not approved in App Store Connect
- Product IDs don't match
- App not built from Xcode with correct bundle ID

**Android:**
- App not uploaded to Play Console (even for testing)
- Products not activated
- Package name mismatch

**Fix:**
```javascript
// Verify product IDs match exactly
const productId = IAPService.getStoreProductId(plan);
console.log('Looking for product:', productId);
```

---

### Issue 2: "Receipt validation fails"

**iOS:**
- Wrong shared secret
- Using production URL for sandbox (or vice versa)
- Receipt not base64 encoded

**Android:**
- Service account not configured
- Missing API permissions
- Wrong package name

**Fix:**
```javascript
// Add detailed logging
console.log('Validating receipt:', {
  platform: receiptData.platform,
  productId: receiptData.productId,
  transactionId: receiptData.transactionId
});
```

---

### Issue 3: "Purchase listener not firing"

**Fix:**
```javascript
// Ensure listeners are set up BEFORE purchase
useEffect(() => {
  IAPService.setupPurchaseListeners(
    handlePurchaseSuccess,
    handlePurchaseError
  );
}, []); // Empty dependency array - run once on mount
```

---

## 📊 Monitoring

### Key Metrics to Track

1. **Purchase Funnel**
   - Plans viewed
   - Purchase button clicked
   - Purchase initiated
   - Purchase completed
   - Receipt validated

2. **Success Rate**
   - % of initiated purchases that complete
   - % of receipts that validate successfully

3. **Platform Split**
   - iOS vs Android purchases
   - Which plans are most popular

4. **Errors**
   - Most common error codes
   - Validation failures
   - User cancellations

### Logging

```javascript
// Add comprehensive logging
console.log('💳 IAP Event:', {
  event: 'purchase_initiated',
  productId,
  platform: Platform.OS,
  timestamp: new Date().toISOString()
});
```

---

## 🎓 User Education

Add these to your app:

### 1. **Subscription Management**
```
"Gérer l'abonnement"
↓
Links to:
- iOS: Device Settings > Apple ID > Subscriptions
- Android: Google Play > Subscriptions
```

### 2. **Cancellation**
```
"Annuler l'abonnement"
↓
Explains:
- Go to device settings
- Cancel at least 24h before renewal
- Access retained until period ends
```

### 3. **Restore Purchases**
```
"Restaurer les achats"
↓
Button that calls:
IAPService.restorePurchases()
```

---

## ✅ Compliance Checklist

Before submitting to stores:

- [ ] Native IAP is **primary** payment method
- [ ] External link is **discreet** and non-promotional
- [ ] No language steering users away from IAP
- [ ] Clear subscription terms displayed
- [ ] Auto-renewal clearly stated
- [ ] Easy cancellation instructions
- [ ] Restore purchases button (iOS)
- [ ] Receipt validation implemented server-side
- [ ] Tested with sandbox/test accounts
- [ ] Products approved in stores
- [ ] Documentation for reviewers prepared

---

## 📞 Support

### If Something Goes Wrong

1. **Check logs** - Most issues show in console
2. **Verify product IDs** - Must match exactly
3. **Test with sandbox** - Don't use production until tested
4. **Contact support**:
   - Apple: developer.apple.com/contact
   - Google: support.google.com/googleplay/android-developer

---

## 📚 Resources

- **Apple IAP**: https://developer.apple.com/in-app-purchase/
- **Google Play Billing**: https://developer.android.com/google/play/billing
- **react-native-iap**: https://github.com/dooboolab/react-native-iap
- **App Store Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **Play Store Policies**: https://play.google.com/about/developer-content-policy/

---

## 🎉 You're Done!

Your app is now compliant with App Store and Play Store policies for digital subscriptions!

**Next Steps:**
1. Complete store configuration (iOS/Android guides)
2. Implement backend receipt validation
3. Test thoroughly with sandbox accounts
4. Submit for review with clear documentation
5. Monitor purchases and address any issues

Good luck! 🚀

