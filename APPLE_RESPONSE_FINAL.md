# Apple App Review Response
## LasoCoach v1.0.6 (Build 27)

**Submission ID:** 60b0d985-b659-4160-9fbc-c2908078fea2  
**Date:** January 17, 2026

---

Hello App Review Team,

Thank you for your continued feedback. We have addressed both outstanding issues in this submission. Below is our detailed response:

---

## **Guideline 1.2 – Safety: User-Generated Content**

We have implemented comprehensive UGC safety measures as required:

### 1. Terms & Community Standards (Zero-Tolerance Policy)

**Implementation:** Mandatory terms acceptance before accessing Community or Chat features.

**Where to find it:**
- Open the app → Navigate to "Community" or "Chat" tab
- A modal appears with "Community Standards & Terms"
- Terms clearly state zero-tolerance for objectionable content including hate speech, violence, harassment, spam, explicit content, and medical misinformation
- Users cannot access UGC features without accepting terms (no dismiss option)

### 2. User Blocking Mechanism

**Implementation:** In-app block functionality with instant content removal and developer notification.

**Where to find it:**
- Navigate to Community feed → Tap any user's post → Tap three-dot menu → Select "Block User"
- Blocking instantly removes all content from the blocked user across Community and Chat
- Developer team receives immediate notification via backend alert system when any user is blocked
- Block persists across app sessions

**Technical Note:** Content filtering uses efficient real-time removal (Set-based lookup) ensuring zero delay between block action and content disappearance.

---

## **Guideline 3.1.1 – Business: Payments - In-App Purchase**

### Clarification: iOS Companion App Model

LasoCoach operates as a **free companion app** for users of an external, person-to-person nutrition coaching program. The app is **not a digital product marketplace** and does not sell, unlock, or process any content.

### How It Works

**Free Functionality (All Users):**
- Personal health journal (track measurements, progress, habits)
- Community features (share achievements, get support)
- Chat with other users
- Profile management
- General information and resources

**Personalized Content (External Coaching Clients):**
- Users who have purchased coaching services **outside the app** (directly from the coach via website, email, or phone) receive personalized meal plans and challenges
- The app **displays** this content provided by our backend based on their existing coaching relationship
- The app does **not** sell, process, or unlock this content
- Content is read-only access to previously-provided coaching materials

### iOS-Specific Implementation

**The iOS build operates in "Companion Mode" to ensure App Store compliance:**

- ✅ **Zero payment UI** in the app
- ✅ **Zero payment buttons, links, or calls-to-action**
- ✅ **Zero steering** to external payment systems
- ✅ **Zero subscription prompts or upgrade messaging**
- ✅ **Zero pricing information** visible to users
- ✅ **All premium content fetching blocked on iOS** at both UI and API levels
- ✅ **Payment validation endpoints reject iOS platform calls** (defense-in-depth approach)

**What Reviewers Will See:**
- iOS users can access the journal and community features
- iOS users do **not** see any premium content, payment screens, or subscription options
- If premium content endpoints are called programmatically, they return companion mode status and do not process requests
- A neutral message directs users to manage services on the web if needed

### Business Model Summary

- LasoCoach is a **free health journal app** with optional external coaching services
- Coaching services are sold **outside the app** as person-to-person consultations (not digital products)
- The app functions as a **companion tool** to centralize assigned content for existing coaching clients
- **No payment processing occurs in or through the app**
- Content access is entirely server-driven based on existing coaching relationships, not in-app purchases

---

## **Summary of Changes in v1.0.6 (Build 27)**

| Guideline | Implementation | Verification Steps |
|-----------|----------------|-------------------|
| **1.2 (UGC)** | Terms gate + Block mechanism + Developer alerts + Instant filtering | Open Community → See terms modal → Block any user → Content disappears instantly |
| **3.1.1 (Payments)** | iOS companion mode with zero payment UI/processing | Navigate entire app → No payment screens, buttons, or premium content visible |

---

## **Code Implementation Details**

**For your reference during testing:**

### UGC Safety
- Terms Modal: `src/components/UgcTermsModal.tsx`
- Blocking Logic: `src/services/moderationApi.ts`
- Content Filtering: `src/screens/CommunityScreen.tsx`, `src/screens/ChatScreen.tsx`

### Payment Compliance
- Companion Mode Flag: `src/config/featureFlags.ts` (IOS_COMPANION_MODE = true)
- Screen-Level Guards: `src/screens/NutritionScreen.tsx` (skips premium content fetch)
- API-Level Guards: `src/services/iapReceiptApi.ts`, `src/services/nutritionApi.ts` (payment endpoints blocked)

---

## **Request for Reconsideration**

We believe this submission now fully complies with all guidelines:

| Guideline | Status | Verification |
|-----------|--------|--------------|
| **1.2 (UGC)** | ✅ **COMPLIANT** | Terms gate enforced, blocking with instant removal and dev alerts implemented |
| **3.1.1 (Payments)** | ✅ **COMPLIANT** | iOS companion mode with zero payment processing; premium content blocked at UI and API levels |

---

## **Additional Information**

If you have questions about:
- How the companion app model works
- Where to find specific UGC features
- iOS vs. Android behavior differences
- The external coaching service model

Please let us know and we're happy to provide additional clarification or documentation.

---

Thank you for your partnership in ensuring a compliant app experience.

**Best regards,**

**Eddy Lama**  
Project Manager & LasoCoach Dev Team Director  
LasoCoach Development Team

---

**Version:** 1.0.6 (Build 27)  
**Build Status:** Ready for review  
**Platform:** iOS (Companion Mode enabled)
