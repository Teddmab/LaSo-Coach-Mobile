# Apple App Review Response - IAP Unavailability in DRC
## LasoCoach v1.0.6 (Build 31)

**Submission ID:** [À compléter avec votre ID de soumission]  
**Date:** [Date actuelle]  
**Guideline Concerned:** 3.1.1 - Business - Payments - In-App Purchase

---

Hello App Review Team,

Thank you for your feedback regarding Guideline 3.1.1. We would like to provide clarification regarding our specific situation and request guidance on how to proceed.

---

## **Guideline 3.1.1 – Business: Payments - In-App Purchase**

### **Situation: In-App Purchases Not Available in Primary Market**

LasoCoach is primarily designed for users in the **Democratic Republic of Congo (DRC)**, where **In-App Purchases are not available** through the App Store according to Apple's payment infrastructure limitations.

### **Our Understanding of the Issue**

We understand that Apple's guidelines state:
> "Apps on the United States storefront may link out to the default browser, using buttons, external links, or other calls to action, for payment mechanisms other than in-app purchase. **For storefronts where there are not alternative options for qualifying apps, the app must use in-app purchase.**"

However, we are in a unique situation where:
1. **IAP is not available** in our primary market (DRC)
2. **IAP cannot be configured** for DRC in App Store Connect
3. **Alternative payment methods** (Mobile Money) are the standard in this region

---

## **Technical Implementation Details**

### **Current iOS Implementation: Companion Mode**

Our iOS app operates in **"Companion Mode"** to ensure compliance:

**✅ Zero Payment Processing in App:**
- No payment UI visible in the iOS app
- No payment buttons, links, or calls-to-action
- No subscription prompts or upgrade messaging
- No pricing information displayed
- All premium content fetching blocked at UI and API levels
- Payment validation endpoints reject iOS platform calls

**✅ Content Access Model:**
- Users purchase subscriptions **exclusively on our website** (lasocoach.com)
- Website uses Mobile Money payment methods (Airtel Money, Orange Money, Vodacom M-Pesa) - standard payment methods in DRC
- iOS app functions as a **read-only companion** that displays content for users who have already purchased externally
- Content access is entirely server-driven based on existing subscription relationships

**✅ What Reviewers Will See:**
- iOS users can access free features (health journal, community, chat)
- iOS users **do not** see any premium content, payment screens, or subscription options
- If premium content endpoints are called, they return companion mode status
- A neutral message directs users to manage services on the web if needed

---

## **Market Context: Democratic Republic of Congo (DRC)**

### **Payment Infrastructure in DRC:**

1. **Mobile Money is Standard:**
   - Airtel Money
   - Orange Money  
   - Vodacom M-Pesa
   - These are the primary payment methods used by 95%+ of our target users

2. **IAP Availability:**
   - In-App Purchases are **not available** in DRC through App Store Connect
   - Apple's payment infrastructure does not support DRC for IAP transactions
   - This is a limitation of Apple's payment system, not our implementation choice

3. **App Distribution:**
   - Our app is primarily distributed to users in DRC
   - While the app may be available in other regions, our primary user base and business model are focused on DRC

---

## **Compliance Approach**

### **Why We Cannot Implement IAP:**

1. **Technical Limitation:**
   - App Store Connect does not allow IAP configuration for DRC
   - Even if we implemented `react-native-iap`, the App Store would not process payments for DRC users

2. **User Experience:**
   - Our users in DRC use Mobile Money as their primary payment method
   - Forcing them to use unavailable payment methods would create a poor user experience

3. **Business Model:**
   - We operate a legitimate subscription service
   - All payments are processed securely through our website
   - iOS app serves as a companion tool for content access only

---

## **Request for Clarification**

We respectfully request guidance on the following:

1. **Exception for Unavailable IAP Markets:**
   - Is there an exception process for apps targeting markets where IAP is not available?
   - How should we handle this situation according to Apple's guidelines?

2. **Companion App Model:**
   - Our iOS app functions as a companion app with zero payment processing
   - Users purchase externally and access content in-app
   - Is this model acceptable when IAP is not available in the target market?

3. **Alternative Payment Methods:**
   - For markets where IAP is unavailable, are alternative payment methods (Mobile Money) acceptable?
   - What documentation or implementation is required?

4. **Storefront Availability:**
   - Should we limit app availability to only DRC in App Store Connect?
   - Would this affect the review process?

---

## **Proposed Solutions**

We are open to implementing any of the following solutions if approved by Apple:

### **Option 1: Regional Availability Limitation**
- Limit app availability to DRC and other countries where IAP is unavailable
- Document this limitation in App Review Information
- Maintain companion mode for iOS

### **Option 2: IAP Implementation with Regional Disabling**
- Implement IAP infrastructure
- Disable IAP availability for DRC in App Store Connect
- Use alternative payment methods for DRC users via website
- Use IAP for other regions where available

### **Option 3: Reader App Exception**
- If applicable, qualify for Reader App exception (3.1.3(a))
- Maintain single discreet link to web subscription management
- Ensure IAP remains primary method where available

---

## **Documentation Provided**

For your reference during testing:

### **Companion Mode Implementation:**
- Companion Mode Flag: `src/config/featureFlags.ts` (IOS_COMPANION_MODE = true)
- Screen-Level Guards: `src/screens/NutritionScreen.tsx` (skips premium content fetch)
- API-Level Guards: `src/services/iapReceiptApi.ts`, `src/services/nutritionApi.ts` (payment endpoints blocked)
- Payment Service: `src/services/payment/IOSPaymentService.ts` (returns false for all payment methods)

### **Payment Methods (Web Only):**
- Mobile Money configuration: `src/config/mobileMoneyConfig.ts`
- Supported providers: Airtel Money, Orange Money, Vodacom M-Pesa (DRC)
- All payment processing occurs on website, not in iOS app

---

## **Verification Steps for Reviewers**

To verify our compliance:

1. **Open the iOS app** → Navigate through all screens
   - ✅ No payment screens visible
   - ✅ No subscription buttons or CTAs
   - ✅ No pricing information displayed

2. **Attempt to access premium content** → Without external subscription
   - ✅ Premium content is blocked
   - ✅ Neutral message displayed (no payment prompts)

3. **Check for payment processing** → Review network calls
   - ✅ No payment API calls from iOS app
   - ✅ Payment endpoints reject iOS platform requests

4. **Verify companion mode** → Check feature flags
   - ✅ IOS_COMPANION_MODE = true
   - ✅ All purchase flows disabled

---

## **Additional Information**

### **Business Model Summary:**
- LasoCoach is a **nutrition coaching companion app**
- Subscriptions are sold **exclusively on our website** (lasocoach.com)
- iOS app provides **read-only access** to content for existing subscribers
- **No payment processing occurs in or through the iOS app**

### **Target Market:**
- **Primary:** Democratic Republic of Congo (DRC)
- **Payment Method:** Mobile Money (standard in DRC)
- **IAP Status:** Not available in DRC per Apple's infrastructure

### **Compliance Commitment:**
We are committed to full compliance with Apple's guidelines. We have implemented companion mode to ensure zero payment processing in the iOS app. We are seeking clarification on how to proceed when IAP is not available in our target market.

---

## **Request for Reconsideration**

We believe our implementation is compliant given the constraints:

| Aspect | Implementation | Status |
|--------|----------------|--------|
| **Payment Processing** | Zero payment processing in iOS app | ✅ COMPLIANT |
| **Payment UI** | All payment UI hidden/blocked | ✅ COMPLIANT |
| **Content Access** | Server-driven entitlement checking only | ✅ COMPLIANT |
| **IAP Availability** | Not available in target market (DRC) | ⚠️ **SEEKING GUIDANCE** |

We respectfully request:
1. **Clarification** on how to handle IAP unavailability in target markets
2. **Guidance** on acceptable alternative approaches
3. **Approval** of our companion app model for this specific situation

---

## **Contact Information**

If you have questions about:
- Our companion app implementation
- DRC market payment infrastructure
- Mobile Money payment methods
- Regional availability limitations
- Technical implementation details

Please let us know and we're happy to provide additional clarification or documentation.

---

Thank you for your partnership in ensuring a compliant app experience while serving users in markets with limited payment infrastructure.

**Best regards,**

**Eddy Lama**  
Project Manager & LasoCoach Dev Team Director  
LasoCoach Development Team

---

**Version:** 1.0.6 (Build 31)  
**Build Status:** Ready for review  
**Platform:** iOS (Companion Mode enabled)  
**Primary Market:** Democratic Republic of Congo (DRC)  
**IAP Status:** Not available in target market

---

## **Appendix: Supporting Documentation**

### **References:**
- Apple Developer Documentation: In-App Purchase Availability by Country
- App Store Connect: Payment Methods by Region
- Mobile Money Payment Infrastructure in DRC

### **Technical Evidence:**
- Companion mode implementation code
- Payment endpoint blocking logic
- UI-level payment flow prevention
- API-level payment request rejection

---

**Note:** This response addresses the specific situation where In-App Purchases are not available in our primary target market. We are committed to implementing any solution Apple recommends to ensure full compliance.

