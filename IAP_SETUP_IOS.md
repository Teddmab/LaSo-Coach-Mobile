# iOS In-App Purchase Setup Guide

## Prerequisites
- Apple Developer Account ($99/year)
- App uploaded to App Store Connect
- Bundle ID: `com.laso.coach`

---

## Step 1: Create In-App Purchase Products in App Store Connect

1. **Login to App Store Connect**
   - Go to https://appstoreconnect.apple.com
   - Select your app (LasoCoach)

2. **Navigate to In-App Purchases**
   - Click on "Features" tab
   - Select "In-App Purchases"
   - Click the "+ " button to create new product

3. **Create Subscription Products**

   For each subscription plan, create:

   ### Product 1: Premium Monthly
   - **Type**: Auto-Renewable Subscription
   - **Reference Name**: Premium Monthly Subscription
   - **Product ID**: `com.laso.coach.premium_monthly`
   - **Subscription Group**: Create new group "LaSo Coach Subscriptions"
   - **Subscription Duration**: 1 month
   - **Price**: Select tier matching your $XX.XX price
   - **Localized Info**:
     - Display Name (French): Abonnement Premium Mensuel
     - Description (French): Accès complet aux plans nutritionnels et coaching
     - Display Name (English): Premium Monthly Subscription
     - Description (English): Full access to nutrition plans and coaching

   ### Product 2: Premium Yearly
   - **Product ID**: `com.laso.coach.premium_yearly`
   - **Subscription Duration**: 1 year
   - Follow same pattern as monthly

   ### Product 3: Basic Monthly
   - **Product ID**: `com.laso.coach.basic_monthly`
   - **Subscription Duration**: 1 month
   - Follow same pattern

   ### Product 4: Flexy Monthly
   - **Product ID**: `com.laso.coach.flexy_monthly`
   - **Subscription Duration**: 1 month
   - Follow same pattern

4. **Configure Subscription Group**
   - Set upgrade/downgrade priorities
   - Premium > Flexy > Basic

5. **Submit Products for Review**
   - Products must be approved before they can be purchased
   - Approval typically takes 24-48 hours

---

## Step 2: Configure App Capabilities

1. **Open Xcode**
   ```bash
   cd ios
   open LasoCoach.xcworkspace
   ```

2. **Enable In-App Purchase Capability**
   - Select your project in navigator
   - Select target "LasoCoach"
   - Click "Signing & Capabilities" tab
   - Click "+ Capability"
   - Add "In-App Purchase"

3. **Save and Commit**

---

## Step 3: Create Shared Secret (For Receipt Validation)

1. **In App Store Connect**
   - Go to "My Apps" > Select your app
   - Click "App Information" (in sidebar)
   - Scroll to "App-Specific Shared Secret"
   - Click "Generate" or "Manage"
   - Copy the shared secret

2. **Store in Backend**
   - Add to your backend environment variables:
     ```
     APPLE_SHARED_SECRET=your_shared_secret_here
     ```

---

## Step 4: Configure app.json

Add to your `app.json`:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.laso.coach",
      "config": {
        "usesNonExemptEncryption": false
      },
      "infoPlist": {
        "SKAdNetworkItems": []
      }
    }
  }
}
```

---

## Step 5: Test with Sandbox

1. **Create Sandbox Test User**
   - Go to App Store Connect
   - Users and Access > Sandbox Testers
   - Click "+" to add tester
   - Use test email (e.g., test@example.com)
   - Set region/country
   - **DO NOT** verify email

2. **Test on Device**
   - Sign out of App Store on device
   - Build and install app
   - Try to make purchase
   - When prompted, sign in with sandbox test account
   - Purchase should go through without charging

3. **Verify Purchase Flow**
   - Purchase completes
   - Receipt is sent to backend
   - Backend validates with Apple
   - Subscription is activated

---

## Step 6: Receipt Validation (Backend)

Your backend needs to validate receipts with Apple:

**Endpoint**: POST to Apple's servers
- **Production**: https://buy.itunes.apple.com/verifyReceipt
- **Sandbox**: https://sandbox.itunes.apple.com/verifyReceipt

**Request Body**:
```json
{
  "receipt-data": "base64_encoded_receipt",
  "password": "your_shared_secret",
  "exclude-old-transactions": true
}
```

**Response**: Contains subscription details, expiration dates, etc.

---

## Step 7: Deploy and Monitor

1. **Build for Production**
   ```bash
   eas build --platform ios --profile production
   ```

2. **Submit for Review**
   - Include test account credentials in review notes
   - Provide video demonstrating purchase flow
   - Explain subscription benefits clearly

3. **Monitor**
   - Check App Store Connect for sales
   - Monitor backend logs for receipt validation
   - Watch for customer support issues

---

## Troubleshooting

### "Cannot connect to iTunes Store"
- Check internet connection
- Ensure app is signed correctly
- Verify product IDs match exactly

### "This In-App Purchase is not available"
- Product not approved yet
- Product ID mismatch
- App not properly configured in App Store Connect

### Receipt validation fails
- Check shared secret
- Verify you're using correct endpoint (sandbox vs production)
- Ensure receipt data is base64 encoded

---

## Important Notes

1. **Subscriptions Auto-Renew**: Users are charged automatically unless they cancel
2. **Grace Period**: Consider implementing grace period for failed payments
3. **Refunds**: Apple handles refunds, your app must handle revoking access
4. **Family Sharing**: Can be enabled per subscription group

---

## Resources

- [Apple IAP Documentation](https://developer.apple.com/in-app-purchase/)
- [App Store Review Guidelines 3.1](https://developer.apple.com/app-store/review/guidelines/#in-app-purchase)
- [react-native-iap docs](https://github.com/dooboolab/react-native-iap)

