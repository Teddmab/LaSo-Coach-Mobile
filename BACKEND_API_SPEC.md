# Backend API Specification for Native IAP

## Overview

Your backend server must implement these endpoints to support native In-App Purchases. These endpoints validate receipts from Apple App Store and Google Play Store, preventing fraud and ensuring subscription integrity.

---

## Authentication

All endpoints require authentication via Bearer token:
```
Authorization: Bearer <user_jwt_token>
```

---

## Endpoints

### 1. POST /payments/validate-ios-receipt

Validates iOS App Store receipt and creates/updates subscription.

**Request:**
```json
{
  "receiptData": "base64_encoded_receipt_string",
  "transactionId": "1000000123456789",
  "productId": "com.laso.coach.premium_monthly",
  "originalTransactionId": "1000000123456789"
}
```

**Backend Processing:**

```javascript
// 1. Decode and validate receipt with Apple
const appleResponse = await axios.post('https://buy.itunes.apple.com/verifyReceipt', {
  'receipt-data': receiptData,
  'password': process.env.APPLE_SHARED_SECRET,
  'exclude-old-transactions': true
});

// 2. Check response status
if (appleResponse.data.status !== 0) {
  // Status 0 = valid
  // Status 21007 = sandbox receipt sent to production (redirect to sandbox)
  throw new Error('Invalid receipt');
}

// 3. Extract subscription info
const latestReceipt = appleResponse.data.latest_receipt_info[0];
const expiresDate = new Date(parseInt(latestReceipt.expires_date_ms));

// 4. Create/update subscription in database
const subscription = await Subscription.upsert({
  userId: req.user.id,
  platform: 'ios',
  productId: productId,
  transactionId: transactionId,
  originalTransactionId: originalTransactionId,
  status: expiresDate > new Date() ? 'ACTIVE' : 'EXPIRED',
  startDate: new Date(parseInt(latestReceipt.purchase_date_ms)),
  endDate: expiresDate,
  receiptData: receiptData,
  autoRenewing: latestReceipt.is_trial_period === 'false'
});

// 5. Grant user access
await User.update({ hasActiveSubscription: true }, { where: { id: req.user.id } });
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Receipt validated successfully",
  "data": {
    "subscriptionId": "sub_abc123",
    "status": "ACTIVE",
    "expiresAt": "2025-11-12T00:00:00Z",
    "productId": "com.laso.coach.premium_monthly",
    "autoRenewing": true
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_RECEIPT",
    "message": "Receipt validation failed"
  }
}
```

---

### 2. POST /payments/validate-android-receipt

Validates Google Play Store purchase and creates/updates subscription.

**Request:**
```json
{
  "purchaseToken": "google_purchase_token_string",
  "productId": "com.laso.coach.premium_monthly",
  "orderId": "GPA.1234-5678-9012-34567",
  "packageName": "com.laso.coach"
}
```

**Backend Processing:**

```javascript
// 1. Setup Google Play Developer API client
const { google } = require('googleapis');
const androidpublisher = google.androidpublisher('v3');

// 2. Authenticate with service account
const auth = new google.auth.GoogleAuth({
  keyFile: 'path/to/service-account-key.json',
  scopes: ['https://www.googleapis.com/auth/androidpublisher'],
});

// 3. Verify subscription
const response = await androidpublisher.purchases.subscriptionsv2.get({
  auth: auth,
  packageName: packageName,
  token: purchaseToken
});

// 4. Extract subscription info
const subscriptionState = response.data.subscriptionState;
const lineItems = response.data.lineItems[0];
const expiryTime = new Date(lineItems.expiryTime);

// 5. Create/update subscription
const subscription = await Subscription.upsert({
  userId: req.user.id,
  platform: 'android',
  productId: productId,
  purchaseToken: purchaseToken,
  orderId: orderId,
  status: subscriptionState === 'SUBSCRIPTION_STATE_ACTIVE' ? 'ACTIVE' : 'EXPIRED',
  startDate: new Date(response.data.startTime),
  endDate: expiryTime,
  autoRenewing: response.data.autoRenewing
});

// 6. Grant user access
await User.update({ hasActiveSubscription: true }, { where: { id: req.user.id } });
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Purchase validated successfully",
  "data": {
    "subscriptionId": "sub_xyz789",
    "status": "ACTIVE",
    "expiresAt": "2025-11-12T00:00:00Z",
    "productId": "com.laso.coach.premium_monthly",
    "autoRenewing": true
  }
}
```

---

### 3. POST /payments/restore-purchases

Restores previous purchases for a user.

**Request:**
```json
{
  "receipts": [
    {
      "platform": "ios",
      "productId": "com.laso.coach.premium_monthly",
      "transactionId": "1000000123456789",
      "transactionReceipt": "base64...",
      "originalTransactionId": "1000000123456789",
      "purchaseToken": null,
      "orderId": null
    }
  ],
  "platform": "ios"
}
```

**Backend Processing:**

```javascript
// Loop through all receipts
const restoredSubscriptions = [];

for (const receipt of receipts) {
  try {
    if (receipt.platform === 'ios') {
      // Validate iOS receipt
      const validation = await validateiOSReceipt(receipt);
      if (validation.isValid && validation.isActive) {
        restoredSubscriptions.push(validation.subscription);
      }
    } else if (receipt.platform === 'android') {
      // Validate Android purchase
      const validation = await validateAndroidPurchase(receipt);
      if (validation.isValid && validation.isActive) {
        restoredSubscriptions.push(validation.subscription);
      }
    }
  } catch (error) {
    console.error('Failed to restore receipt:', error);
    // Continue with other receipts
  }
}

// Update user's active subscription if any valid ones found
if (restoredSubscriptions.length > 0) {
  await User.update({ hasActiveSubscription: true }, { where: { id: req.user.id } });
}
```

**Response:**
```json
{
  "success": true,
  "message": "Purchases restored successfully",
  "data": {
    "restored": 2,
    "subscriptions": [
      {
        "subscriptionId": "sub_abc123",
        "productId": "com.laso.coach.premium_monthly",
        "status": "ACTIVE",
        "expiresAt": "2025-11-12T00:00:00Z"
      }
    ]
  }
}
```

---

### 4. GET /subscriptions/native-products

Returns mapping of backend plans to native store product IDs.

**Request:** No body

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "planId": "premium_monthly",
        "planName": "Premium Monthly",
        "productId": "com.laso.coach.premium_monthly",
        "price": 19.99,
        "currency": "USD",
        "duration": 30,
        "platform": "both"
      },
      {
        "planId": "premium_yearly",
        "planName": "Premium Yearly",
        "productId": "com.laso.coach.premium_yearly",
        "price": 199.99,
        "currency": "USD",
        "duration": 365,
        "platform": "both"
      },
      {
        "planId": "basic_monthly",
        "planName": "Basic Monthly",
        "productId": "com.laso.coach.basic_monthly",
        "price": 9.99,
        "currency": "USD",
        "duration": 30,
        "platform": "both"
      },
      {
        "planId": "flexy_monthly",
        "planName": "Flexy Monthly",
        "productId": "com.laso.coach.flexy_monthly",
        "price": 14.99,
        "currency": "USD",
        "duration": 30,
        "platform": "both"
      }
    ]
  }
}
```

---

### 5. POST /payments/sync-subscription-status

Syncs subscription status between native store and backend.

**Request:**
```json
{
  "userId": "user_123",
  "platform": "ios"
}
```

**Backend Processing:**

```javascript
// 1. Find user's latest subscription
const subscription = await Subscription.findOne({
  where: { userId: req.user.id, platform: platform },
  order: [['createdAt', 'DESC']]
});

if (!subscription) {
  return { success: true, data: { hasActiveSubscription: false } };
}

// 2. Re-validate with store
let isActive = false;

if (platform === 'ios') {
  const validation = await validateiOSReceipt({
    receiptData: subscription.receiptData,
    transactionId: subscription.transactionId,
    productId: subscription.productId
  });
  isActive = validation.isActive;
} else if (platform === 'android') {
  const validation = await validateAndroidPurchase({
    purchaseToken: subscription.purchaseToken,
    productId: subscription.productId
  });
  isActive = validation.isActive;
}

// 3. Update status
if (isActive !== (subscription.status === 'ACTIVE')) {
  await subscription.update({ 
    status: isActive ? 'ACTIVE' : 'EXPIRED'
  });
  
  await User.update(
    { hasActiveSubscription: isActive },
    { where: { id: req.user.id } }
  );
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "hasActiveSubscription": true,
    "subscription": {
      "subscriptionId": "sub_abc123",
      "status": "ACTIVE",
      "expiresAt": "2025-11-12T00:00:00Z"
    }
  }
}
```

---

## Webhook Handlers

### Apple Server-to-Server Notifications

Apple sends notifications for subscription events. Set up endpoint:

**Endpoint:** `POST /webhooks/apple-subscriptions`

**Request from Apple:**
```json
{
  "notification_type": "DID_RENEW",
  "password": "your_shared_secret",
  "environment": "PROD",
  "unified_receipt": {
    "latest_receipt": "base64...",
    "latest_receipt_info": [...]
  }
}
```

**Events to Handle:**
- `DID_RENEW` - Subscription renewed
- `DID_CHANGE_RENEWAL_STATUS` - Auto-renew toggled
- `CANCEL` - Subscription cancelled
- `DID_FAIL_TO_RENEW` - Payment failed
- `EXPIRED` - Subscription expired

---

### Google Real-Time Developer Notifications

Google sends notifications via Pub/Sub. Set up Cloud Function:

**Pub/Sub Message:**
```json
{
  "version": "1.0",
  "packageName": "com.laso.coach",
  "eventTimeMillis": "1234567890123",
  "subscriptionNotification": {
    "version": "1.0",
    "notificationType": 4,
    "purchaseToken": "token...",
    "subscriptionId": "com.laso.coach.premium_monthly"
  }
}
```

**Notification Types:**
- `1` - SUBSCRIPTION_RECOVERED
- `2` - SUBSCRIPTION_RENEWED
- `3` - SUBSCRIPTION_CANCELED
- `4` - SUBSCRIPTION_PURCHASED
- `5` - SUBSCRIPTION_ON_HOLD
- `12` - SUBSCRIPTION_EXPIRED

---

## Database Schema

### Subscriptions Table

```sql
CREATE TABLE subscriptions (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  platform ENUM('ios', 'android') NOT NULL,
  product_id VARCHAR(255) NOT NULL,
  transaction_id VARCHAR(255),
  original_transaction_id VARCHAR(255),
  purchase_token TEXT,
  order_id VARCHAR(255),
  status ENUM('ACTIVE', 'EXPIRED', 'CANCELLED', 'GRACE_PERIOD', 'ON_HOLD') NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  auto_renewing BOOLEAN DEFAULT true,
  receipt_data TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_transaction_id (transaction_id),
  INDEX idx_status (status),
  INDEX idx_end_date (end_date)
);
```

---

## Security Considerations

1. **Validate ALL receipts server-side**
   - Never trust client data
   - Always verify with Apple/Google

2. **Store sensitive keys securely**
   - Use environment variables
   - Never commit to git
   - Rotate periodically

3. **Implement rate limiting**
   - Prevent abuse of validation endpoints
   - Max 10 requests per minute per user

4. **Log all transactions**
   - Track validation attempts
   - Monitor for suspicious patterns
   - Alert on unusual activity

5. **Handle duplicates**
   - Check for existing transactions
   - Prevent double-granting access

---

## Testing

### Test with Sandbox

```bash
# iOS Sandbox
curl -X POST https://your-api.com/payments/validate-ios-receipt \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "receiptData": "sandbox_receipt_data",
    "transactionId": "1000000123456789",
    "productId": "com.laso.coach.premium_monthly"
  }'
```

### Monitor Logs

```javascript
// Add comprehensive logging
console.log('Receipt validation:', {
  userId: req.user.id,
  platform: platform,
  productId: productId,
  transactionId: transactionId,
  timestamp: new Date().toISOString()
});
```

---

## Error Codes

| Code | Description | Action |
|------|-------------|--------|
| `INVALID_RECEIPT` | Receipt validation failed | Ask user to retry purchase |
| `EXPIRED_RECEIPT` | Subscription has expired | Prompt renewal |
| `DUPLICATE_TRANSACTION` | Already processed | Return existing subscription |
| `VALIDATION_ERROR` | Error from Apple/Google | Retry with exponential backoff |
| `UNAUTHORIZED` | Invalid auth token | Re-authenticate user |

---

## Support

For implementation help:
- Review `IAP_IMPLEMENTATION_GUIDE.md`
- Check platform docs (Apple/Google)
- Test thoroughly with sandbox before production

