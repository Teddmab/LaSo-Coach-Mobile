# Mobile Money Payment Implementation Guide

## Complete Implementation for Web & Mobile Applications

This document provides a comprehensive guide for implementing mobile money payments (Airtel, Vodacom, Orange USSD). It covers the complete flow including request/response formats, UI components, and integration patterns used in the LaSo Coach platform.

---

## Table of Contents

1. [Overview](#overview)
2. [Supported Countries & Providers](#supported-countries--providers)
3. [Architecture & Flow](#architecture--flow)
4. [Frontend Implementation](#frontend-implementation)
5. [API Contracts](#api-contracts)
6. [Error Handling](#error-handling)
7. [User Experience Flow](#user-experience-flow)
8. [Security Considerations](#security-considerations)

---

## Overview

### What is Mobile Money Payment?

LaSo Coach supports mobile money payments via USSD (Unstructured Supplementary Service Data) across multiple African countries. Instead of requiring users to have credit cards or online banking, they can simply dial a USSD code on their phone to authorize payments through major mobile money providers like Airtel, Vodacom, and Orange.

### Key Benefits

- **Accessibility**: Works on basic feature phones (not just smartphones)
- **No infrastructure required**: Uses existing telecom infrastructure (USSD)
- **Multiple providers**: Supports various mobile money providers across countries
- **Instant settlement**: Payments are processed quickly
- **Cost-effective**: Lower transaction fees compared to cards

### Payment Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User selects subscription plan                              │
│    ↓                                                             │
│ 2. User selects "Mobile Payment" option                        │
│    ↓                                                             │
│ 3. User enters country, provider, and phone number             │
│    ↓                                                             │
│ 4. Frontend sends request to backend                           │
│    ↓                                                             │
│ 5. Backend calls mobile money provider API                    │
│    ↓                                                             │
│ 6. Mobile provider sends USSD prompt to user's phone          │
│    User sees: "Enter amount: $10. Press 1 to confirm"         │
│    ↓                                                             │
│ 7. User responds to USSD prompt on phone                       │
│    ↓                                                             │
│ 8. PawaPay processes payment                                   │
│    ↓                                                             │
│ 9. PawaPay sends webhook to backend with status               │
│    ↓                                                             │
│ 10. Backend updates subscription status                        │
│    ↓                                                             │
│ 11. Frontend redirects to success page                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Supported Countries & Providers

### 🇨🇩 Congo DRC (CDF)

| Provider | Code | Mobile Network |
|----------|------|----------------|
| Airtel Money | `AIRTEL_COD` | Airtel |
| Orange Money | `ORANGE_COD` | Orange |
| Vodacom M-Pesa | `VODACOM_MPESA_COD` | Vodacom |

**Phone Prefix**: `+243`  
**Supported Currencies**: `USD` and `CDF`

### Extensible Structure

```typescript
interface CountryConfig {
  code: string;                    // e.g., "COD"
  label: string;                   // e.g., "Congo (RDC)"
  prefix: string;                  // e.g., "+243"
  currencies: string[];            // e.g., ["USD", "CDF"]
  providers: ProviderConfig[];
}

interface ProviderConfig {
  code: string;                    // e.g., "AIRTEL_COD"
  label: string;                   // e.g., "Airtel Money"
}
```

To add new countries, simply extend the `PAWAPAY_COUNTRIES` array in your frontend.

---

## Architecture & Flow

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND (React/TypeScript)                                      │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Payment Modal Component                                   │  │
│  │ - Show payment method options (Stripe, PayPal, Mobile)   │  │
│  │ - Collect mobile payment details:                        │  │
│  │   * Country selector                                     │  │
│  │   * Provider selector                                    │  │
│  │   * Phone number input                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ API Service Layer                                         │  │
│  │ - firebaseApi.post(...) → /payments/pawapay/create-...  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND API                                                      │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ POST /payments/pawapay/create-deposit                    │  │
│  │ - Validate payment details                              │  │
│  │ - Call PawaPay API                                      │  │
│  │ - Store deposit record                                  │  │
│  │ - Return depositId & status                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ PAWAPAY API                                                      │
│                                                                   │
│  - Sends USSD to user's phone                                    │
│  - User confirms payment                                         │
│  - Sends webhook callback to backend                             │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND WEBHOOK ENDPOINT                                         │
│                                                                   │
│  POST /webhooks/pawapay/deposit-callback                        │
│  - Update deposit status                                         │
│  - Update subscription if payment completed                      │
│  - Send notification to frontend (via Socket.IO)                │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND (Success)                                               │
│                                                                   │
│  - Redirect to /subscription-success                             │
│  - Display payment confirmation                                  │
│  - Grant subscription access                                     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Frontend Implementation

### 1. Payment Configuration

**File**: `src/pages/onboarding/Subscription.tsx`

Define supported countries and providers:

```typescript
const MOBILE_MONEY_COUNTRIES = [
  {
    code: 'COD',
    label: 'Congo (RDC)',
    prefix: '+243',
    currencies: ['USD', 'CDF'],
    providers: [
      { code: 'AIRTEL_COD', label: 'Airtel Money' },
      { code: 'ORANGE_COD', label: 'Orange Money' },
      { code: 'VODACOM_MPESA_COD', label: 'Vodacom M-Pesa' },
    ],
  },
  // Add more countries here
];
```

### 2. State Management

```typescript
// Mobile payment form state
const [mobilePayment, setMobilePayment] = useState({
  country: MOBILE_MONEY_COUNTRIES[0].code,        // Selected country code
  currency: MOBILE_MONEY_COUNTRIES[0].currencies[0],  // Selected currency (USD or CDF)
  provider: MOBILE_MONEY_COUNTRIES[0].providers[0].code,  // Selected provider code
  phoneNumber: '',                           // User's phone number
});

// Payment method selection
const [selectedPayment, setSelectedPayment] = useState('stripe');  // or 'paypal' or 'mobile'

// Loading state
const [loading, setLoading] = useState(false);

// Selected plan
const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
```

### 3. Form Validation

Before submitting, validate the mobile payment form:

```typescript
const validateMobilePayment = (): boolean => {
  // 1. Check country is supported
  const country = MOBILE_MONEY_COUNTRIES.find(c => c.code === mobilePayment.country);
  if (!country) {
    toast.error('Pays non supporté pour le paiement mobile.');
    return false;
  }

  // 2. Check currency is selected
  if (!mobilePayment.currency || !country.currencies.includes(mobilePayment.currency)) {
    toast.error('Sélectionnez une devise valide.');
    return false;
  }

  // 3. Check provider is selected
  if (!mobilePayment.provider) {
    toast.error('Sélectionnez un opérateur mobile.');
    return false;
  }

  // 4. Extract digits from phone number
  const phone = mobilePayment.phoneNumber.replace(/\D/g, '');
  if (!phone) {
    toast.error('Ajoutez votre numéro de téléphone.');
    return false;
  }

  // 4. Validate phone length (typically 9-15 digits for African numbers)
  if (phone.length < 6 || phone.length > 15) {
    toast.error('Numéro de téléphone invalide.');
    return false;
  }

  return true;
};
```

### 4. Payment Modal Component

The payment method selection modal displays three options:

```typescript
{showPaymentConfirm && (
  <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
      {/* Header */}
      <h2 className="text-xl font-bold mb-2">Choisissez votre méthode de paiement</h2>
      <p className="text-gray-600 text-sm mb-6">Sélectionnez votre méthode de paiement préférée</p>

      {/* Plan Summary */}
      {selectedPlanObj && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-lg font-bold">{selectedPlanObj.name}</div>
          <div className="flex items-end gap-2">
            <span className="text-lg font-bold">${selectedPlanObj.price}</span>
            <span className="text-sm text-gray-500">{getBillingPeriod(selectedPlanObj.duration)}</span>
          </div>
        </div>
      )}

      {/* Payment Method Options */}
      <div className="space-y-3 mb-6">
        {/* STRIPE OPTION */}
        <button
          className={`w-full p-4 rounded-lg border-2 flex items-center justify-between ${
            selectedPayment === 'stripe'
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
          onClick={() => setSelectedPayment('stripe')}
        >
          <div className="flex items-center gap-3">
            <img src="/assets/stripe-svgrepo-com.svg" alt="Stripe" className="w-8 h-8" />
            <div className="text-left">
              <div className="font-semibold text-gray-900">Stripe</div>
              <div className="text-sm text-gray-500">Carte de crédit / débit</div>
            </div>
          </div>
          {selectedPayment === 'stripe' && <CheckmarkIcon />}
        </button>

        {/* PAYPAL OPTION */}
        <button
          className={`w-full p-4 rounded-lg border-2 flex items-center justify-between ${
            selectedPayment === 'paypal'
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
          onClick={() => setSelectedPayment('paypal')}
        >
          <div className="flex items-center gap-3">
            <img src="/assets/paypal-svgrepo-com.svg" alt="PayPal" className="w-8 h-8" />
            <div className="text-left">
              <div className="font-semibold text-gray-900">PayPal</div>
              <div className="text-sm text-gray-500">Compte PayPal</div>
            </div>
          </div>
          {selectedPayment === 'paypal' && <CheckmarkIcon />}
        </button>

        {/* MOBILE MONEY OPTION */}
        <button
          className={`w-full p-4 rounded-lg border-2 flex items-center justify-between ${
            selectedPayment === 'mobile'
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
          onClick={() => {
            setSelectedPayment('mobile');
            // Initialize mobile payment if not already set
            setMobilePayment(prev => {
              const countryCode = prev.country || MOBILE_MONEY_COUNTRIES[0].code;
              const countryConfig = MOBILE_MONEY_COUNTRIES.find(c => c.code === countryCode);
              const currencyCode = prev.currency || countryConfig?.currencies[0] || 'USD';
              const providers = countryConfig?.providers || [];
              const providerCode = prev.provider || providers[0]?.code || '';
              return { ...prev, country: countryCode, currency: currencyCode, provider: providerCode };
            });
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-sm">MM</div>
            <div className="text-left">
              <div className="font-semibold text-gray-900">Paiement mobile</div>
              <div className="text-sm text-gray-500">Airtel, Vodacom, Orange</div>
            </div>
          </div>
          {selectedPayment === 'mobile' && <CheckmarkIcon />}
        </button>

        {/* MOBILE PAYMENT FORM - Conditionally shown when mobile is selected */}
        {selectedPayment === 'mobile' && (
          <div className="border border-blue-100 bg-blue-50 rounded-lg p-4 space-y-3">
            {/* Country Selector */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">Pays</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={mobilePayment.country}
                onChange={(e) => {
                  const nextCountry = e.target.value;
                  const countryConfig = MOBILE_MONEY_COUNTRIES.find(c => c.code === nextCountry);
                  const providers = countryConfig?.providers || [];
                  const currencies = countryConfig?.currencies || ['USD'];
                  setMobilePayment(prev => ({
                    ...prev,
                    country: nextCountry,
                    currency: prev.currency && currencies.includes(prev.currency) ? prev.currency : currencies[0],
                    provider: providers[0]?.code || '',
                  }));
                }}
              >
                {MOBILE_MONEY_COUNTRIES.map(country => (
                  <option key={country.code} value={country.code}>
                    {country.label} ({country.prefix})
                  </option>
                ))}
              </select>
            </div>

            {/* Currency Selector */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">Devise</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={mobilePayment.currency}
                onChange={(e) => setMobilePayment(prev => ({ ...prev, currency: e.target.value }))}
              >
                {(MOBILE_MONEY_COUNTRIES.find(c => c.code === mobilePayment.country)?.currencies || ['USD']).map(curr => (
                  <option key={curr} value={curr}>{curr}</option>
                ))}
              </select>
            </div>

            {/* Provider Selector */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">Opérateur</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={mobilePayment.provider}
                onChange={(e) => setMobilePayment(prev => ({ ...prev, provider: e.target.value }))}
              >
                {(selectedMobileCountry?.providers || []).map(provider => (
                  <option key={provider.code} value={provider.code}>{provider.label}</option>
                ))}
              </select>
            </div>

            {/* Phone Number Input */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-700">Numéro de téléphone</label>
              <div className="flex items-center gap-2">
                {/* Country code prefix (read-only) */}
                <span className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-sm text-gray-700 font-medium">
                  {selectedMobileCountry?.prefix || '+'}
                </span>
                {/* Phone number input (without prefix) */}
                <input
                  type="tel"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Numéro sans indicatif"
                  value={mobilePayment.phoneNumber}
                  onChange={(e) => setMobilePayment(prev => ({ ...prev, phoneNumber: e.target.value }))}
                />
              </div>
              <p className="text-xs text-gray-600">Vous recevrez une demande USSD en {mobilePayment.currency} sur ce numéro.</p>
            </div>
          </div>
        )}
      </div>

      {/* Auto-Renewal Checkbox */}
      <div className="flex items-center gap-2 mb-6">
        <input
          type="checkbox"
          id="autoRenew"
          checked={autoRenew}
          onChange={e => setAutoRenew(e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
        />
        <label htmlFor="autoRenew" className="text-sm text-gray-600">
          Renouvellement automatique
        </label>
      </div>

      {/* Submit Button */}
      <button
        className="w-full px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
        onClick={handlePaymentSummaryConfirm}
        disabled={loading}
      >
        {loading ? (
          <>
            <Spinner />
            <span>Traitement...</span>
          </>
        ) : (
          `Continuer avec ${selectedPayment === 'stripe' ? 'Stripe' : selectedPayment === 'paypal' ? 'PayPal' : 'Paiement Mobile'}`
        )}
      </button>
    </div>
  </div>
)}
```

### 5. Payment Handler Function

When user confirms payment with mobile method selected:

```typescript
const handleMobilePayment = async (plan: SubscriptionPlan, amountToPay: number) => {
  // 1. Validate mobile payment form
  if (!validateMobilePayment()) {
    return;
  }

  // 2. Get country configuration
  const country = MOBILE_MONEY_COUNTRIES.find(c => c.code === mobilePayment.country);
  if (!country) {
    toast.error('Pays non supporté pour le paiement mobile.');
    return;
  }

  // 3. Format phone number with country prefix
  const rawPhone = mobilePayment.phoneNumber.replace(/\D/g, '');           // Remove non-digits
  const phoneWithCountry = `${country.prefix}${rawPhone}`;                 // Add country prefix

  // 4. Get selected currency
  const mobileCurrency = mobilePayment.currency || 'USD';

  // 5. Set loading state
  setLoading(true);

  try {
    // 6. Build request payload
    const payload = {
      subscriptionPlanId: plan.id,                    // Plan ID
      phoneNumber: phoneWithCountry,                  // Full phone number with prefix
      rawPhoneNumber: rawPhone,                       // Phone without prefix (optional)
      provider: mobilePayment.provider,               // e.g., "AIRTEL_COD"
      country: mobilePayment.country,                 // e.g., "COD"
      amount: amountToPay,                            // Amount to charge
      currency: mobileCurrency,                       // "USD" or "CDF"
    };

    // 7. Call backend API
    const response = await firebaseApi.post(
      API_CONFIG.endpoints.payments.createMobileMoneyDeposit,
      payload
    );
    const data = response?.data;

    // 8. Handle success response
    if (data?.success) {
      // Show success toast
      toast.success('Paiement mobile initié. Validez sur votre téléphone.');

      // Extract response data
      const depositId = data.data?.depositId;        // e.g., "pwa_dep_123456"
      const status = data.data?.status || 'processing'; // Status from backend

      // Clear payment summary
      setPaymentSummary(null);
      setShowPaymentConfirm(false);

      // Redirect to success page with deposit tracking info
      navigate(
        `/onboarding/subscription-success?method=mobile${
          depositId ? `&depositId=${encodeURIComponent(depositId)}` : ''
        }&status=${encodeURIComponent(status)}`
      );
      return;
    }

    // 9. Handle error response
    toast.error(
      data?.error?.message || 'Erreur lors de l\'initiation du paiement mobile.'
    );

  } catch (error: any) {
    // 10. Handle network/request errors
    console.error('Paiement mobile - erreur:', error);
    toast.error(
      error?.response?.data?.message || 'Erreur réseau lors du paiement mobile.'
    );
  } finally {
    // 11. Clear loading state
    setLoading(false);
  }
};
```

---

## API Contracts

### 1. Create Mobile Money Deposit (Frontend → Backend)

**Endpoint**: `POST /api/v1/payments/mobile-money/create-deposit`

**Request Headers**:
```http
Authorization: Bearer {user_token}
Content-Type: application/json
```

**Request Body**:
```json
{
  "subscriptionPlanId": "550e8400-e29b-41d4-a716-446655440000",
  "phoneNumber": "+243912345678",
  "rawPhoneNumber": "912345678",
  "provider": "AIRTEL_COD",
  "country": "COD",
  "amount": 10.00,
  "currency": "USD"
}
```

**Field Details**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `subscriptionPlanId` | UUID | ✓ | The subscription plan to purchase |
| `phoneNumber` | String | ✓ | Full phone number with country code (e.g., "+243912345678") |
| `rawPhoneNumber` | String | ✗ | Phone number without country code (for logging/debugging) |
| `provider` | String | ✓ | Mobile money provider code (e.g., "AIRTEL_COD", "ORANGE_COD") |
| `country` | String | ✓ | Country code (e.g., "COD") |
| `amount` | Number | ✓ | Amount to charge |
| `currency` | String | ✓ | "USD" or "CDF" (based on user selection) |

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "depositId": "mm_dep_550e8400e29b41d4a716",
    "status": "SUBMITTED",
    "amount": "10.00",
    "currency": "USD",
    "phoneNumber": "+243912345678",
    "provider": "AIRTEL_COD",
    "correspondentId": "airtel_550e8400e29b",
    "createdAt": "2026-01-17T10:30:00Z",
    "message": "USSD prompt sent to user's phone. User has 2 minutes to respond."
  },
  "message": "Deposit initiated successfully"
}
```

**Response Field Details**:

| Field | Type | Description |
|-------|------|-------------|
| `depositId` | String | Unique deposit transaction ID (store for tracking) |
| `status` | String | Current status: "SUBMITTED", "ACCEPTED", "COMPLETED", "FAILED", "CANCELLED" |
| `amount` | String | Amount that was charged |
| `currency` | String | Currency code |
| `phoneNumber` | String | Phone number that received USSD prompt |
| `provider` | String | Mobile money provider |
| `correspondentId` | String | PawaPay's correspondent ID |
| `createdAt` | ISO8601 | When the deposit was created |
| `message` | String | Human-readable status message |

**Error Response (400/500)**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PHONE_NUMBER",
    "message": "Phone number format is invalid for Congo DRC",
    "details": {
      "receivedFormat": "+243912345678",
      "expectedFormat": "+243 + 9-15 digits",
      "country": "COD",
      "currency": "USD"
    }
  }
}
```

**Common Error Codes**:

| Code | Meaning | Action |
|------|---------|--------|
| `INVALID_PHONE_NUMBER` | Phone format incorrect | Validate phone format and try again |
| `UNSUPPORTED_PROVIDER` | Provider unavailable | Show list of available providers for country |
| `UNSUPPORTED_COUNTRY` | Country not supported | Show list of supported countries |
| `UNSUPPORTED_CURRENCY` | Currency not available in country | Show available currencies for selected country |
| `INSUFFICIENT_BALANCE` | Merchant account low | Contact support |
| `DUPLICATE_REQUEST` | Same request already pending | Wait or contact support |
| `PLAN_NOT_FOUND` | Plan doesn't exist | Refresh page and try again |
| `USER_NOT_FOUND` | User doesn't exist | Re-authenticate |
| `RATE_LIMITED` | Too many requests | Wait and retry |
| `PAYMENT_PROCESSING_ERROR` | Backend error processing | Retry or contact support |

### 2. Webhook Callback (Backend ← Mobile Money Provider)

**Endpoint**: `POST /webhooks/mobile-money/deposit-callback` (Backend only)

**Webhook Headers** (sent by provider):
```http
X-PawaPay-Signature: {HMAC_SHA256_signature}
Content-Type: application/json
```

**Webhook Payload** (sent by provider):
```json
{
  "depositId": "mm_dep_550e8400e29b41d4a716",
  "status": "COMPLETED",
  "amount": "10.00",
  "currency": "USD",
  "correspondent": "AIRTEL_COD",
  "payer": {
    "phoneNumber": "+243912345678"
  },
  "created": "2026-01-17T10:30:00Z",
  "completed": "2026-01-17T10:31:15Z"
}
```

**Backend Should**:

1. ✓ Verify webhook signature using PawaPay's public key
2. ✓ Look up deposit by `depositId`
3. ✓ Update deposit record with new status
4. ✓ If status = "COMPLETED":
   - Update subscription to ACTIVE
   - Grant user access
   - Send confirmation email
5. ✓ If status = "FAILED":
   - Keep subscription PENDING
   - Notify user to retry
6. ✓ Send notification to frontend (via Socket.IO or polling)
7. ✓ Return 200 OK to confirm receipt

**Payment Status Reference**:

| Status | Meaning | Action |
|--------|---------|--------|
| `SUBMITTED` | Payment initiated, waiting for USSD response | Show "Awaiting confirmation" message |
| `ACCEPTED` | User approved on phone but not yet deducted | Still processing |
| `COMPLETED` | Payment successful and settled | Activate subscription, show success |
| `FAILED` | Payment failed (insufficient balance, etc.) | Allow user to retry |
| `CANCELLED` | User cancelled USSD prompt | Allow user to retry |

---

## Error Handling

### Frontend Error Handling Strategy

```typescript
try {
  // 1. Validate input first
  if (!validateMobilePayment()) {
    return; // Validation shows appropriate toast
  }

  // 2. Show loading state
  setLoading(true);

  // 3. Make API call
  const response = await firebaseApi.post(
    API_CONFIG.endpoints.payments.createMobileMoneyDeposit,
    payload
  );

  // 4. Check response success flag
  if (response?.data?.success) {
    // Success path
    toast.success('Paiement mobile initié. Validez sur votre téléphone.');
    navigate(...);
  } else {
    // API returned error in response
    const errorMessage = response?.data?.error?.message || 
                        response?.data?.message ||
                        'Unknown error';
    toast.error(errorMessage);
  }

} catch (error: any) {
  // Network or request error
  const errorMessage = error?.response?.data?.message ||
                      error?.response?.data?.error?.message ||
                      error?.message ||
                      'Network error';
  
  console.error('Payment error:', error);
  toast.error(errorMessage);

} finally {
  setLoading(false);
}
```

### User-Facing Error Messages (French)

```typescript
const errorMessages: Record<string, string> = {
  'INVALID_PHONE_NUMBER': 'Numéro de téléphone invalide. Vérifiez le format.',
  'UNSUPPORTED_PROVIDER': 'Opérateur mobile non disponible dans ce pays.',
  'UNSUPPORTED_COUNTRY': 'Pays non supporté pour le paiement mobile.',
  'UNSUPPORTED_CURRENCY': 'Devise non disponible dans ce pays.',
  'INSUFFICIENT_BALANCE': 'Solde insuffisant. Veuillez contacter le support.',
  'DUPLICATE_REQUEST': 'Un paiement est déjà en cours. Attendez la fin.',
  'PLAN_NOT_FOUND': 'Plan d\'abonnement introuvable. Réessayez.',
  'USER_NOT_FOUND': 'Utilisateur non trouvé. Reconnectez-vous.',
  'RATE_LIMITED': 'Trop de tentatives. Attendez quelques minutes.',
};
```

---

## User Experience Flow

### Step-by-Step User Journey

#### 1. **Plan Selection**
```
[Dashboard] → [Subscription Page]
User sees list of plans with pricing
```

#### 2. **Plan Click**
```
User clicks "S'abonner" on a paid plan
→ Payment method modal appears
```

#### 3. **Payment Method Selection**
```
Modal shows three options:
- Stripe (Carte de crédit/débit)
- PayPal (Compte PayPal)  
- Mobile Payment (Airtel, Vodacom, Orange)

User clicks "Paiement mobile"
→ Mobile payment form expands
```

#### 4. **Mobile Payment Form**
```
User fills out:
1. Pays: [Dropdown] "Congo (RDC) (+243)"
2. Devise: [Dropdown] "USD" or "CDF"
3. Opérateur: [Dropdown] "Airtel Money"
4. Numéro: [+243] [912345678]

Help text: "Vous recevrez une demande USSD en {devise} sur ce numéro."
```

#### 5. **Confirmation**
```
User checks "Renouvellement automatique" (optional)
User clicks "Continuer avec Paiement Mobile"

Loading spinner shows: "Traitement..."
```

#### 6. **Backend Processing**
```
Backend validates and calls mobile money provider API
Provider sends USSD to phone: "Montant: $10. Tapez 1 pour confirmer"
```

#### 7. **User Confirms on Phone**
```
User receives USSD prompt on their phone
User enters their PIN/confirms the payment
Money is deducted from their mobile account
```

#### 8. **Success Notification**
```
Backend receives webhook with status: COMPLETED
Frontend notification: "Paiement mobile initié. Validez sur votre téléphone."
Frontend redirects to: /onboarding/subscription-success
  ?method=mobile
  &depositId=pwa_dep_550e8400e29b41d4a716
  &status=COMPLETED
```

#### 9. **Success Page**
```
Shows:
- ✓ Payment confirmed via mobile money
- Plan name and duration
- Amount paid in selected currency (USD/CDF)
- Subscription active until date
- "Merci pour votre abonnement!"
- Next button to continue onboarding
```

### Timeout & Pending Payment Handling

**User closes modal before confirmation:**
- Payment may still be processing
- When webhook arrives, update subscription in background
- Show notification via Socket.IO or polling

**Payment status checking (Poll every 3 seconds initially):**
```typescript
const checkPaymentStatus = async (depositId: string) => {
  try {
    const response = await firebaseApi.get(
      `/api/v1/payments/mobile-money/deposits/${depositId}`
    );
    
    const status = response?.data?.data?.status;
    
    if (status === 'COMPLETED') {
      // Show success
      navigate('/onboarding/subscription-success');
    } else if (status === 'FAILED' || status === 'CANCELLED') {
      // Show error and allow retry
      setShowPaymentConfirm(true);
    }
  } catch (error) {
    console.error('Status check error:', error);
  }
};
```

---

## Security Considerations

### Frontend Security

1. **Never log sensitive data**
   ```typescript
   // ✗ BAD - Don't log phone numbers
   console.log('Phone:', mobilePayment.phoneNumber);
   
   // ✓ GOOD - Log only digest
   console.log('Payment attempt for country:', mobilePayment.country);
   ```

2. **Validate on both client and server**
   ```typescript
   // Frontend: Quick user feedback
   if (phone.length < 6) {
     toast.error('Invalid phone number');
     return;
   }
   
   // Backend: Security validation (what actually matters)
   ```

3. **Use HTTPS only**
   - All API calls must use HTTPS
   - Phone numbers sent over encrypted connection

4. **Store minimal data**
   - Don't store full phone numbers in localStorage
   - Only store depositId temporarily until success

### Backend Security

1. **Verify webhook signatures**
   ```python
   # Backend pseudocode
   received_signature = request.headers.get('X-Mobile-Money-Signature')
   calculated_signature = HMAC_SHA256(
     webhook_payload,
     MOBILE_MONEY_SECRET_KEY
   )
   
   if received_signature != calculated_signature:
       raise UnauthorizedError("Invalid webhook signature")
   ```

2. **Prevent duplicate payments**
   - Use idempotency keys
   - Check for existing deposits with same details

3. **Rate limiting**
   - Limit payment attempts per user/hour
   - Prevent brute force phone validation

4. **API authentication**
   - All frontend requests must include Bearer token
   - Backend validates token before processing

5. **Secure configuration**
   - Store mobile money provider credentials in environment variables
   - Never commit secrets to git
   - Rotate keys regularly

---

## Implementation Checklist

### Frontend

- [ ] Add `PAWAPAY_COUNTRIES` config with supported providers
- [ ] Create payment modal component
- [ ] Implement mobile payment form fields (country, provider, phone)
- [ ] Add form validation function
- [ ] Implement payment handler (handleMobilePayment)
- [ ] Add success/error toast messages
- [ ] Add loading spinner during submission
- [ ] Redirect to success page with depositId
- [ ] Add polling for payment status (if needed)
- [ ] Style mobile payment section with Tailwind

### Backend

- [ ] Create `/payments/mobile-money/create-deposit` endpoint
- [ ] Validate request data (phone format, provider, country)
- [ ] Call PawaPay API with credentials
- [ ] Store deposit record in database
- [ ] Return proper response with depositId
- [ ] Create `/webhooks/mobile-money/deposit-callback` endpoint
- [ ] Verify webhook signature
- [ ] Update deposit status on callback
- [ ] Update subscription status when payment completes
- [ ] Send Socket.IO notification to frontend
- [ ] Implement error handling and logging
- [ ] Add rate limiting
- [ ] Add idempotency key support

### Testing

- [ ] Test with valid phone numbers for each country/provider
- [ ] Test with invalid phone numbers (too short, too long, wrong format)
- [ ] Test unsupported country/provider combinations
- [ ] Test timeout/slow response handling
- [ ] Test webhook signature verification
- [ ] Test duplicate payment prevention
- [ ] Test with network disconnection
- [ ] Load test (rate limiting)
- [ ] Security audit of phone number handling

### Deployment

- [ ] Set mobile money provider API credentials in production environment
- [ ] Set webhook URL in provider dashboard
- [ ] Test webhook delivery
- [ ] Monitor payment success rate
- [ ] Set up alerts for payment failures
- [ ] Document rollback procedure

---

## Support & Troubleshooting

### Common Issues

**Issue**: User doesn't receive USSD prompt
- **Solution**: Check if phone number format is correct with country prefix
- **Debug**: Log the formatted number being sent to PawaPay

**Issue**: Payment marked as FAILED
- **Solution**: User may have insufficient balance in mobile account
- **Action**: Ask user to add funds and retry

**Issue**: Webhook not received
- **Solution**: Verify webhook URL is correct in PawaPay dashboard
- **Debug**: Check PawaPay logs and backend error logs

**Issue**: Duplicate payment created
- **Solution**: Use idempotency keys to prevent duplicates
- **Implementation**: Send same idempotency-key for retry requests

---

## References

- [USSD Standard](https://en.wikipedia.org/wiki/Unstructured_Supplementary_Service_Data)
- [Mobile Money Provider Documentation](./PAYMENT_API_SPECS.txt)
- [LaSo Coach Backend API Docs](./PAYMENT_API_SPECS.txt)

---

**Last Updated**: January 2026  
**Status**: Production Ready  
**Maintainer**: LaSo Coach Development Team
