# Reader App Exception - Compliance Implementation

## Overview
This document explains the **Reader App Exception** implementation in LaSo Coach, compliant with Apple App Store Guidelines 3.1.3(a) and Google Play policies.

---

## 🎯 What is the Reader App Exception?

### Definition
The Reader App Exception allows apps to include a **single, discreet link** to an external website where users can manage existing subscriptions purchased outside the app.

### Key Requirements (Apple Guidelines 3.1.3(a))
✅ **Must be text-only** - No buttons, graphics, or promotional elements  
✅ **Must be discreet** - Small font, muted colors, minimal visibility  
✅ **No pricing information** - Cannot show subscription costs  
✅ **No calls-to-action** - Cannot encourage external purchases  
✅ **IAP must remain primary** - Native purchases must be the default/prominent method  

---

## 📋 Implementation Details

### 1. Primary Payment Method: Native IAP ✅
```javascript
// File: src/screens/SubscriptionScreen.js

// Native IAP is the PRIMARY, PROMINENT payment method
const handleSubscribe = async (plan) => {
  // Check if IAP is available
  if (!IAPService.isAvailable()) {
    Alert.alert('Non disponible', 'Les achats intégrés ne sont pas disponibles...');
    return;
  }
  
  // Request purchase from native store (App Store / Google Play)
  await IAPService.requestPurchase(productId, true);
};
```

**Visual Prominence:**
- Large, colorful subscription plan cards
- Clear "S'abonner" buttons
- Product images and features
- Pricing displayed prominently

---

### 2. Reader App Link: Discreet External Link ✅
```javascript
// File: src/screens/SubscriptionScreen.js

const renderExternalAccountLink = () => {
  const buildWebUrl = () => {
    const baseUrl = 'https://app.lasocoach.com/subscription';
    if (webAuthToken) {
      // Pass Firebase ID token for automatic authentication
      return `${baseUrl}?token=${encodeURIComponent(webAuthToken)}`;
    }
    return baseUrl;
  };

  return (
    <View style={styles.externalLinkContainer}>
      <TouchableOpacity onPress={handleExternalLink}>
        <Text style={styles.externalLinkText}>
          Gérer votre compte
        </Text>
      </TouchableOpacity>
    </View>
  );
};
```

**Styling (Discreet per Guidelines):**
```javascript
externalLinkText: {
  fontSize: 12,        // Small, unobtrusive
  color: '#999',       // Muted gray (not prominent)
  textAlign: 'center',
}
```

**Placement:**
- At the **bottom** of the screen (not prominent)
- Below IAP options (secondary)
- No visual emphasis

---

### 3. Authentication Token Passing ✅
```javascript
// Fetch Firebase ID token on screen init
const token = await firebaseAuthService.getIdToken();
setWebAuthToken(token);

// Pass token to web app for seamless login
const url = `https://app.lasocoach.com/subscription?token=${encodeURIComponent(token)}`;
await Linking.openURL(url);
```

**Web App Integration:**
Your web app (app.lasocoach.com) must:
1. Accept `?token=<firebase_id_token>` query parameter
2. Validate the Firebase ID token with Firebase Admin SDK
3. Auto-login the user
4. Allow subscription management (view, cancel, upgrade)

**Example Web Code (Next.js/React):**
```javascript
// pages/subscription.js
import { useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { signInWithCustomToken } from 'firebase/auth';

export default function SubscriptionPage() {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      // Exchange ID token for custom token via your backend
      fetch('/api/auth/exchange-token', {
        method: 'POST',
        body: JSON.stringify({ idToken: token }),
      })
      .then(res => res.json())
      .then(({ customToken }) => {
        return signInWithCustomToken(auth, customToken);
      })
      .then(() => {
        console.log('User authenticated from mobile app');
        // Show subscription management UI
      });
    }
  }, []);

  return <SubscriptionManagementUI />;
}
```

---

### 4. Subscription Sync After Web Purchase ✅
```javascript
// Refresh subscription status when returning to app
useEffect(() => {
  const unsubscribe = navigation.addListener('focus', async () => {
    console.log('🔄 Checking for web purchases');
    await refreshSubscriptionData();
    await refreshProfile();
  });

  return unsubscribe;
}, [navigation]);
```

**Flow:**
1. User clicks "Gérer votre compte"
2. Opens browser → app.lasocoach.com/subscription?token=...
3. User manages subscription on web (upgrade, cancel, etc.)
4. User returns to app
5. App automatically refreshes subscription status
6. UI updates to reflect changes

---

## ✅ Compliance Checklist

### Visual Design
- [x] External link uses **small font** (12px)
- [x] External link uses **muted color** (#999 gray)
- [x] External link is **text-only** (no button, no icon)
- [x] External link is at **bottom of screen** (not prominent)
- [x] IAP options are **visually prominent** (cards, colors, images)

### Functionality
- [x] IAP is the **default/primary** payment method
- [x] External link does **not show pricing**
- [x] External link does **not encourage purchases**
- [x] External link text is **neutral** ("Gérer votre compte")
- [x] Authentication token **automatically passed** to web
- [x] Subscription status **automatically syncs** on return

### Technical
- [x] Firebase ID token retrieved on init
- [x] Token passed as URL parameter
- [x] Screen focus listener refreshes data
- [x] IAP receipts validated server-side
- [x] Graceful handling when IAP unavailable

---

## 🚫 What NOT To Do (Policy Violations)

### ❌ Visual Violations
```javascript
// ❌ WRONG - Too prominent
<TouchableOpacity style={{ backgroundColor: 'blue', padding: 20 }}>
  <Text style={{ fontSize: 18, color: 'white', fontWeight: 'bold' }}>
    Subscribe on our website! 🎉
  </Text>
</TouchableOpacity>
```

### ❌ Pricing Violations
```javascript
// ❌ WRONG - Shows pricing
<Text>Get 20% off by subscribing on our website - Only $9.99!</Text>
```

### ❌ Call-to-Action Violations
```javascript
// ❌ WRONG - Encourages external purchase
<Text>Save money by purchasing on the web instead!</Text>
<Text>Better deals available at app.lasocoach.com</Text>
```

### ❌ Placement Violations
```javascript
// ❌ WRONG - Too prominent
return (
  <SafeAreaView>
    {renderExternalWebLink()} {/* At top - violates guidelines */}
    {renderSubscriptionPlans()}
  </SafeAreaView>
);
```

---

## 📱 Testing the Implementation

### Step 1: Test IAP Flow (Primary)
1. Open SubscriptionScreen
2. Verify IAP subscription cards are prominent
3. Tap "S'abonner" on a plan
4. Verify native App Store/Google Play sheet appears
5. Complete mock purchase (in sandbox)
6. Verify subscription activates

### Step 2: Test Reader App Link (Secondary)
1. Scroll to bottom of SubscriptionScreen
2. Verify "Gérer votre compte" link is small and discreet
3. Tap the link
4. Verify browser opens to: `app.lasocoach.com/subscription?token=...`
5. Verify user is automatically logged in on web
6. Make a change (e.g., view subscription details)
7. Return to app (navigate back)
8. Verify subscription status refreshes automatically

### Step 3: Verify Compliance
- [ ] External link is **not prominent** (small, gray, bottom)
- [ ] External link has **no pricing** information
- [ ] External link has **no call-to-action** language
- [ ] IAP is clearly the **primary method** (visually)
- [ ] Token passes correctly (check browser URL)
- [ ] Subscription syncs on return (check logs)

---

## 🔧 Backend Requirements

Your web app backend MUST implement:

### 1. Token Validation Endpoint
```javascript
// POST /api/auth/exchange-token
// Validates Firebase ID token and returns custom token

import { getAuth } from 'firebase-admin/auth';

export async function POST(req) {
  const { idToken } = await req.json();
  
  try {
    // Verify Firebase ID token
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    // Create custom token for web login
    const customToken = await getAuth().createCustomToken(uid);
    
    return Response.json({ customToken });
  } catch (error) {
    return Response.json({ error: 'Invalid token' }, { status: 401 });
  }
}
```

### 2. Subscription API Endpoints
- `GET /api/subscriptions/current` - Get user's subscription
- `POST /api/subscriptions/cancel` - Cancel subscription
- `POST /api/subscriptions/upgrade` - Upgrade plan
- `GET /api/subscriptions/history` - Subscription history

### 3. Sync with Mobile Backend
Ensure your web subscription changes are reflected in the mobile API:
- Update same database used by mobile app
- Mobile app calls `/subscriptions/current` on focus
- Backend returns latest subscription regardless of purchase source

---

## 📊 Metrics & Monitoring

Track these metrics to ensure compliance and user experience:

```javascript
// Analytics events to track
analytics.logEvent('reader_app_link_clicked', {
  source: 'subscription_screen',
  has_token: !!webAuthToken,
});

analytics.logEvent('web_subscription_detected', {
  plan_id: subscription.planId,
  purchase_source: 'web',
});

analytics.logEvent('subscription_sync_completed', {
  time_since_link_click: timeDiff,
  status_changed: oldStatus !== newStatus,
});
```

---

## 🎓 Training Your Backend Team

### What They Need to Know:
1. **Accept Firebase ID tokens** from mobile app
2. **Validate tokens** using Firebase Admin SDK
3. **Auto-login users** when token is present
4. **Sync subscription data** back to mobile API
5. **Don't expose pricing** on mobile-linked pages (compliance)

### Example Task for Backend:
> "When mobile app passes `?token=xyz` to `/subscription` page, validate the Firebase ID token, log the user in automatically, and show their subscription management UI. Any changes made on web should be immediately visible in the mobile app via the `/subscriptions/current` API."

---

## 📚 References

- [Apple App Store Guidelines 3.1.3(a)](https://developer.apple.com/app-store/review/guidelines/#business)
- [Google Play Billing Policy](https://support.google.com/googleplay/android-developer/answer/9858738)
- [Firebase ID Token Verification](https://firebase.google.com/docs/auth/admin/verify-id-tokens)
- [Reader App Best Practices](https://developer.apple.com/news/?id=465s2xa0)

---

## ✅ Final Checklist Before Submission

- [ ] IAP is clearly the primary, prominent method
- [ ] External link is small, gray, text-only, at bottom
- [ ] No pricing information in external link
- [ ] No promotional language in external link
- [ ] Token passes correctly to web app
- [ ] Web app validates token and auto-logins user
- [ ] Subscription syncs back to mobile on return
- [ ] Tested on real iOS device (not just simulator)
- [ ] Tested IAP sandbox purchases work
- [ ] Tested web purchase sync works
- [ ] Backend team trained and endpoints ready

---

## 🚀 Current Implementation Status

✅ **Native IAP**: Fully implemented and compliant  
✅ **Reader App Link**: Discreet, compliant, at bottom  
✅ **Token Passing**: Firebase ID token passed to web  
✅ **Auto-sync**: Refreshes on screen focus  
⚠️ **Web Backend**: Needs token validation endpoint  
⚠️ **Testing**: Needs real device + web integration test  

---

**Last Updated**: November 13, 2025  
**Compliance Version**: Apple Guidelines 3.1.3(a), Google Play 2023  
**Implementation**: LaSo Coach Mobile v1.0
