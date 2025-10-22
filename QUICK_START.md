# 🚀 Quick Start - Native IAP Implementation

Get your app compliant in 30 minutes!

---

## Step 1: Install Package (2 min)

```bash
npm install react-native-iap@^12.15.4

# iOS only
cd ios && pod install && cd ..
```

✅ Package added to package.json
✅ iOS pods installed

---

## Step 2: Replace SubscriptionScreen (1 min)

```bash
# Backup old version
mv src/screens/SubscriptionScreen.js src/screens/SubscriptionScreen.backup.js

# Use compliant version
cp src/screens/SubscriptionScreen.compliant.js src/screens/SubscriptionScreen.js
```

✅ Compliant screen active

---

## Step 3: Configure Stores (5-10 min)

### iOS - App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Select your app
3. Features > In-App Purchases
4. Create subscription products:
   - `com.laso.coach.premium_monthly`
   - `com.laso.coach.premium_yearly`
   - etc.

### Android - Play Console

1. Go to https://play.google.com/console
2. Select your app
3. Monetize > Subscriptions
4. Create same products with matching IDs

📘 Full details: See `IAP_SETUP_IOS.md` and `IAP_SETUP_ANDROID.md`

---

## Step 4: Implement Backend (10-15 min)

Your backend needs 2 critical endpoints:

### 1. POST /payments/validate-ios-receipt

```javascript
app.post('/payments/validate-ios-receipt', async (req, res) => {
  const { receiptData, transactionId, productId } = req.body;
  
  // Validate with Apple
  const appleResponse = await axios.post('https://buy.itunes.apple.com/verifyReceipt', {
    'receipt-data': receiptData,
    'password': process.env.APPLE_SHARED_SECRET
  });
  
  if (appleResponse.data.status === 0) {
    // Valid! Grant access
    const subscription = await createSubscription(req.user.id, productId, appleResponse.data);
    res.json({ success: true, data: subscription });
  } else {
    res.status(400).json({ success: false, error: 'Invalid receipt' });
  }
});
```

### 2. POST /payments/validate-android-receipt

```javascript
app.post('/payments/validate-android-receipt', async (req, res) => {
  const { purchaseToken, productId } = req.body;
  
  // Validate with Google
  const androidpublisher = google.androidpublisher('v3');
  const response = await androidpublisher.purchases.subscriptionsv2.get({
    packageName: 'com.laso.coach',
    token: purchaseToken
  });
  
  if (response.data.subscriptionState === 'SUBSCRIPTION_STATE_ACTIVE') {
    // Valid! Grant access
    const subscription = await createSubscription(req.user.id, productId, response.data);
    res.json({ success: true, data: subscription });
  } else {
    res.status(400).json({ success: false, error: 'Invalid purchase' });
  }
});
```

📘 Full API spec: See `BACKEND_API_SPEC.md`

---

## Step 5: Test with Sandbox (5-10 min)

### iOS

1. Create sandbox test account in App Store Connect
2. Sign out of App Store on device
3. Build and run app:
   ```bash
   npx expo run:ios --device
   ```
4. Try purchase - sign in with sandbox account
5. Verify purchase completes

### Android

1. Add test account in Play Console
2. Upload to Internal Testing track
3. Install and test purchase
4. Verify flow completes

---

## Step 6: Submit for Review

### iOS

1. Build for production:
   ```bash
   eas build --platform ios --profile production
   ```
2. Upload to App Store Connect
3. Add test account in review notes
4. Submit

### Android

1. Build for production:
   ```bash
   eas build --platform android --profile production
   ```
2. Upload to Play Console
3. Submit for review

---

## ✅ Checklist

Before submitting:

- [ ] Native IAP implemented as primary method
- [ ] External link is discreet (Reader App style)
- [ ] Products created in both stores
- [ ] Backend validates receipts
- [ ] Tested with sandbox accounts
- [ ] Restore purchases button added (iOS)
- [ ] Subscription terms clearly stated
- [ ] Easy cancellation instructions

---

## 🆘 Need Help?

**Common Issues:**

1. **"Products not found"**
   - Products not approved in stores
   - Product IDs don't match
   - Solution: Check IDs match exactly

2. **"Receipt validation fails"**
   - Wrong shared secret / API key
   - Using wrong endpoint (sandbox vs production)
   - Solution: Check backend configuration

3. **"Purchase listener not firing"**
   - Listeners not set up before purchase
   - Solution: Move setup to component mount

---

## 📚 Full Documentation

- `IAP_IMPLEMENTATION_GUIDE.md` - Complete implementation guide
- `IAP_SETUP_IOS.md` - iOS App Store setup
- `IAP_SETUP_ANDROID.md` - Google Play setup
- `BACKEND_API_SPEC.md` - Backend API requirements

---

## 🎉 You're Done!

Your app is now compliant! 🎊

**Next:**
- Monitor purchases in store consoles
- Watch for any review feedback
- Iterate based on user feedback

Good luck! 🚀

