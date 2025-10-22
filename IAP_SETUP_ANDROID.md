# Android In-App Purchase (Google Play Billing) Setup Guide

## Prerequisites
- Google Play Console account ($25 one-time fee)
- App uploaded to Google Play Console
- Package name: `com.laso.coach`

---

## Step 1: Setup Google Play Billing

1. **Enable Google Play Billing API**
   - Go to Google Cloud Console
   - Enable "Google Play Android Developer API"
   - Create service account for backend validation

2. **Create Service Account**
   - Go to Google Play Console
   - Settings > API access
   - Create new service account or link existing
   - Grant permissions: "View financial data", "Manage orders"
   - Download JSON key file for backend

---

## Step 2: Create Subscription Products

1. **Login to Google Play Console**
   - Select your app (LaSo Coach)

2. **Navigate to Subscriptions**
   - Monetize > Products > Subscriptions
   - Click "Create subscription"

3. **Create Subscription Products**

   ### Product 1: Premium Monthly
   - **Product ID**: `com.laso.coach.premium_monthly`
   - **Name**: Premium Monthly Subscription
   - **Description**: Accès complet aux plans nutritionnels et coaching
   - **Billing Period**: 1 month
   - **Base Plan**: 
     - Price: Set to match your pricing (e.g., $19.99)
     - Auto-renewing: Yes
   - **Free Trial**: Optional (e.g., 7 days)

   ### Product 2: Premium Yearly
   - **Product ID**: `com.laso.coach.premium_yearly`
   - **Billing Period**: 1 year
   - Follow same pattern

   ### Product 3: Basic Monthly
   - **Product ID**: `com.laso.coach.basic_monthly`
   - **Billing Period**: 1 month
   - Follow same pattern

   ### Product 4: Flexy Monthly
   - **Product ID**: `com.laso.coach.flexy_monthly`
   - **Billing Period**: 1 month
   - Follow same pattern

4. **Activate Products**
   - Each product must be "Active" to be purchasable

---

## Step 3: Configure Android App

1. **Update build.gradle**
   
   In `android/app/build.gradle`:
   ```gradle
   dependencies {
       // Google Play Billing (already included via react-native-iap)
       implementation 'com.android.billingclient:billing:5.2.1'
   }
   ```

2. **Update AndroidManifest.xml**
   
   In `android/app/src/main/AndroidManifest.xml`:
   ```xml
   <uses-permission android:name="com.android.vending.BILLING" />
   ```

3. **Build and Upload**
   ```bash
   eas build --platform android --profile production
   ```

---

## Step 4: License Testing

Before testing, add test accounts:

1. **Add License Testers**
   - Google Play Console > Setup > License testing
   - Add test Google accounts
   - These accounts can test purchases without being charged

2. **Test Purchase Flow**
   - Install app on device with test account
   - Make test purchase
   - Verify purchase completes
   - Check backend receives and validates purchase

---

## Step 5: Receipt Validation (Backend)

Your backend validates purchases with Google Play:

**Endpoint**: Google Play Developer API
```
GET https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{packageName}/purchases/subscriptionsv2/tokens/{token}
```

**Authentication**: 
- Use service account JSON key
- OAuth 2.0 token

**Response**: Contains subscription details, expiry, etc.

---

## Step 6: Configure Real-Time Developer Notifications (RTDN)

1. **Setup Pub/Sub Topic**
   - Go to Google Cloud Console
   - Create Pub/Sub topic
   - Note the topic name

2. **Configure in Play Console**
   - Monetization setup > Real-time developer notifications
   - Enter Pub/Sub topic name
   - Google will send notifications for subscription events

3. **Setup Backend Webhook**
   - Create endpoint to receive Pub/Sub notifications
   - Handle events: subscribed, renewed, cancelled, expired, etc.

---

## Step 7: Testing

### Internal Testing
1. Upload APK/AAB to Internal Testing track
2. Add testers via email
3. Testers can download and test IAP

### Closed Testing
1. Create closed testing track
2. Add tester list
3. More realistic testing environment

### Production
1. Roll out to production
2. Monitor purchases in Play Console
3. Check analytics and revenue reports

---

## Step 8: Handle Subscription Events

Implement handlers for:

1. **Purchase Success**
   - Validate token
   - Grant access
   - Store purchase record

2. **Subscription Renewal**
   - Automatic via RTDN
   - Extend subscription period
   - Update user record

3. **Subscription Cancelled**
   - User retains access until period end
   - Mark subscription as non-renewing
   - Send reminder email

4. **Subscription Expired**
   - Revoke access
   - Offer renewal discount

5. **Grace Period**
   - Payment failed but user retains access
   - Retry payment
   - Notify user

6. **Account Hold**
   - Payment failed repeatedly
   - Suspend access
   - User must update payment method

---

## Important Configuration

### Build Configuration

In `android/app/build.gradle`:
```gradle
android {
    defaultConfig {
        applicationId "com.laso.coach"
        // ... other config
    }
    
    buildTypes {
        release {
            // Enable ProGuard to obfuscate billing code
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### ProGuard Rules

In `android/app/proguard-rules.pro`:
```
# Keep billing classes
-keep class com.android.vending.billing.** { *; }
-keep class com.android.billingclient.** { *; }
```

---

## Troubleshooting

### "Item is unavailable"
- Product not activated in Play Console
- App not uploaded to Play Console (even for testing)
- Product ID mismatch

### "This version of the app is not configured for billing"
- App must be uploaded to Play Console (internal test track is fine)
- Signing key must match

### "Authentication is required"
- User not logged into Google account
- Test account not added to license testers

### Purchase token validation fails
- Service account not properly configured
- Wrong API enabled
- Insufficient permissions

---

## Compliance Notes

1. **Disclosure**: Clearly state subscription terms before purchase
2. **Cancellation**: Must be easy for users to cancel
3. **Grace Period**: Recommended to implement
4. **Refunds**: Handle via Play Console or API

---

## Resources

- [Google Play Billing Documentation](https://developer.android.com/google/play/billing)
- [Play Console Help](https://support.google.com/googleplay/android-developer/)
- [react-native-iap Android Setup](https://github.com/dooboolab/react-native-iap#android)
- [Subscriptions Best Practices](https://developer.android.com/google/play/billing/subscriptions)

