# LaSo Coach Mobile UAT Test Cases

**Version:** 1.0.2  
**Date:** December 14, 2025  
**Purpose:** End-to-end UAT for LaSo Coach mobile (iOS/Android) tied to backend flows, production-like scenarios, data integrity, compliance (native IAP), and resilience.

---

## Environments & Preconditions

- **Backend:** API_BASE_URL set to staging/UAT; IAP endpoints deployed; WebSocket URL reachable
- **Mobile:** Build from current branch; env configured; Firebase keys present; react-native-iap installed
- **Stores:** Sandbox products configured with IDs `com.laso.coach.{premium_monthly|premium_yearly|basic_monthly|flexy_monthly}`
- **Test Data:** Users (free, active web sub, active native sub iOS/Android, expired sub), sample agenda, nutrition plans, community posts, notifications seeded

---

## A) Authentication & Account Recovery

| ID | Scenario | Steps | Expected | Backend Endpoint | Pass/Fail | Evidence | Defect ID |
|---|---|---|---|---|---|---|---|
| AUTH-01 | Login valid | Launch → Login with valid credentials | Navigate to dashboard; tokens stored; profile loaded | `/auth/login`, `/profile` | | | |
| AUTH-02 | Login invalid password | Login with wrong password | Error message; no token stored | `/auth/login` | | | |
| AUTH-03 | Register new user | Open Register → fill fields (first, last, email, phone, address, region, language, password) → submit | Account created; auto-login; profile fetched | `/auth/register`, `/profile` | | | |
| AUTH-04 | Password reset | Forgot password → enter email → receive token → verify → set new password | Success message; can login with new password | `/auth/forgot-password`, `/auth/verify-reset-token`, `/auth/complete-reset-password` | | | |
| AUTH-05 | Token refresh | Force access token expiry → perform API call | 401 triggers refresh; request retried; user stays logged in | `/auth/refresh-token` | | | |
| AUTH-06 | Google sign-in | Sign in with Google | Receive app session; tokens stored; profile fetched | Firebase ID token → backend login | | | |
| AUTH-07 | Avatar upload | Upload valid image (<2MB) | Avatar stored; displayed after refresh | `/profile/avatar` | | | |
| AUTH-08 | Unauthorized access | Clear token → call protected screen | Redirect to login; no crash | Protected endpoints | | | |

---

## B) Onboarding

| ID | Scenario | Steps | Expected | Backend Endpoint | Pass/Fail | Evidence | Defect ID |
|---|---|---|---|---|---|---|---|
| ONB-01 | Fetch progress | Login new user → app loads onboarding | Progress data returned; correct current step | `/onboarding/progress` | | | |
| ONB-02 | Complete step | Fill required data for a step → submit | Step saved; next step unlocked | `/onboarding/steps/{id}` (PUT) | | | |
| ONB-03 | Measurements submit | Enter measurements within allowed range → submit | Saved; reflected on reload | `/onboarding/measurements` | | | |
| ONB-04 | Complete onboarding | Finish final step → complete | Flag set; main app unlocked | `/onboarding/complete` | | | |
| ONB-05 | Resume flow | Exit app mid-step → reopen | Resumes at saved step | `/onboarding/progress` | | | |

---

## C) Agenda / Daily Content

| ID | Scenario | Steps | Expected | Backend Endpoint | Pass/Fail | Evidence | Defect ID |
|---|---|---|---|---|---|---|---|
| AG-01 | Fetch agenda | Open Agenda screen | Items grouped by date; content URLs present | `/agenda` | | | |
| AG-02 | Complete content | Open item → mark complete | Status toggles; persists after refresh | `/agenda/{id}/complete` | | | |
| AG-03 | Date window filter | Verify past 3 days + future items shown | Items filtered per logic | `/agenda` | | | |
| AG-04 | Error handling | Simulate 500/timeout | Graceful error; retry option; no crash | `/agenda` | | | |

---

## D) Nutrition & Meals

| ID | Scenario | Steps | Expected | Backend Endpoint | Pass/Fail | Evidence | Defect ID |
|---|---|---|---|---|---|---|---|
| NUT-01 | Fetch plans | Open Nutrition screen | Plans list loads | `/nutrition/plans` | | | |
| NUT-02 | Subscription gate | User without sub opens plans | Appropriate gating or upsell shown | `/subscriptions/current` | | | |
| NUT-03 | Day completion status | Open plan/day | Status reflects backend | `/meals/plans/{planId}/completion-status` | | | |
| NUT-04 | Complete meal | Mark meal done with feedback | Completion stored; UI updates | `/meals/{mealId}/complete` | | | |
| NUT-05 | Like/Dislike meal | Like, dislike, remove interaction | State changes persist | `/meals/{mealId}/like`, `/dislike` | | | |
| NUT-06 | Submit feedback | Post feedback | Feedback saved; no duplication | `/meals/{mealId}/feedback` | | | |

---

## E) Progress, Measurements, Photos

| ID | Scenario | Steps | Expected | Backend Endpoint | Pass/Fail | Evidence | Defect ID |
|---|---|---|---|---|---|---|---|
| PROG-01 | Overview | Open Progress screen | Overview data renders; no empty-crash | `/progress/overview` | | | |
| PROG-02 | Detailed view | Navigate to detailed view | Detailed stats load | `/progress/detailed` | | | |
| PROG-03 | Historical data | Select 7/30/90 days | Data matches range | `/progress/historical?days=` | | | |
| PROG-04 | Measurements CRUD | Create/update/delete measurement | Data persists; validation enforced | `/measurements` (POST/PUT/DELETE), `/measurements/latest` | | | |
| PROG-05 | Progress photos | Upload/list/delete photo | Upload within size/type limits; list updates | `/progress-photos` | | | |

---

## F) Achievements & T.A.S.C.C.

| ID | Scenario | Steps | Expected | Backend Endpoint | Pass/Fail | Evidence | Defect ID |
|---|---|---|---|---|---|---|---|
| ACH-01 | Profile summary | Open achievements widget | Badge progress, points, next badge shown | `/profile` (badgeProgress, tasccProgress) | | | |
| ACH-02 | Badges list | View badges screen | Badges load; counts correct | `/achievements/badges`, `/achievements/badges/all` | | | |
| ACH-03 | Points & levels | View points/levels screen | Numbers match backend | `/achievements/points`, `/tascc/*` | | | |
| ACH-04 | Leaderboard | View leaderboard (if enabled) | Ranks visible, pagination works | `/tascc/leaderboard/*` | | | |

---

## G) Subscriptions & Payments (Web + Native IAP)

| ID | Scenario | Steps | Expected | Backend Endpoint | Pass/Fail | Evidence | Defect ID |
|---|---|---|---|---|---|---|---|
| SUB-01 | Plans list | Open subscription screen | Plans + prices render | `/subscriptions/plans` | | | |
| SUB-02 | Current sub | User with active sub | Current plan shown; buttons disabled | `/subscriptions/current` | | | |
| SUB-03 | History | View subscription history | History displays | `/subscriptions/history` | | | |
| SUB-04 | Payment method | View latest payment method | Displays Stripe/PayPal/native info | `/subscriptions/latest-payment-method` | | | |
| SUB-05 | Pending payments | Load pending payments | Pending list shown | `/payments/pending` | | | |
| SUB-06 | Stripe checkout | Initiate checkout (legacy) | Session URL returned; no external steering in UI | `/payments/create-stripe-checkout-session` | | | |
| SUB-07 | PayPal order | Create order (legacy) | Order ID returned | `/payments/create-paypal-order` | | | |
| SUB-08 | Retry failed payment | Trigger retry | Retry created | `/payments/retry/{id}` | | | |
| SUB-09 | Start date calc | Select plan → calculate start date | Date matches backend rule | `/subscriptions/calculate-start-date` | | | |
| SUB-10 | Manual renew | Trigger renewal | Renewal succeeds | `/subscriptions/renew` | | | |
| SUB-11 | Auto-renew toggle | Enable/disable auto-renew | Status updates | `/subscriptions/{id}/auto-renewal/{enable}` | | | |
| SUB-12 | Native IAP iOS | Sandbox purchase → validate | Receipt sent to backend; access granted; status ACTIVE | `/payments/validate-ios-receipt` (Apple S2S webhook) | | | |
| SUB-13 | Native IAP Android | Sandbox purchase → validate | Receipt validated; access granted | `/payments/validate-android-receipt` (Google API) | | | |
| SUB-14 | Restore purchases | Tap restore button | Valid purchases restored; access set | `/payments/restore-purchases` | | | |
| SUB-15 | Sync status | Trigger sync | Backend re-validates; status correct | `/payments/sync-subscription-status` | | | |
| SUB-16 | Products mapping | Fetch native products | IDs match store config | `/subscriptions/native-products` | | | |
| SUB-17 | Invalid/expired receipt | Validate bad receipt | Clear error; no unlock | IAP validate endpoints | | | |

---

## H) Notifications (REST + WebSocket)

| ID | Scenario | Steps | Expected | Backend Endpoint | Pass/Fail | Evidence | Defect ID |
|---|---|---|---|---|---|---|---|
| NOTIF-01 | List notifications | Open notifications screen | Items load with paging | `/notifications` | | | |
| NOTIF-02 | Unread count | Check badge/count | Count matches backend | `/notifications/unread/count` | | | |
| NOTIF-03 | Mark one read | Mark a notification as read | Status updates; count decrements | `/notifications/{id}/read` | | | |
| NOTIF-04 | Mark all read | Tap "mark all read" | All unread cleared | `/notifications/read/all` | | | |
| NOTIF-05 | WebSocket live | Login → keep app open; trigger server notification | Real-time notification arrives; no app restart needed | `ws /ws/notifications` | | | |
| NOTIF-06 | WS reconnect | Drop connection (toggle offline/online) | Auto-reconnect within retries; no crash | WebSocket handler | | | |

---

## I) Community

| ID | Scenario | Steps | Expected | Backend Endpoint | Pass/Fail | Evidence | Defect ID |
|---|---|---|---|---|---|---|---|
| COM-01 | List posts | Open community screen | Posts load (paged) | `/community/posts` | | | |
| COM-02 | Like/Unlike | Like then unlike post | State toggles; persists after refresh | `/community/posts/{id}/like` | | | |
| COM-03 | Comment | Add comment to post | Comment appears; persists after reload | `/community/posts/{id}/comments` | | | |
| COM-04 | Unauthorized | Remove token → attempt action | Redirect/login; no crash | Protected endpoints | | | |

---

## J) Chat

| ID | Scenario | Steps | Expected | Backend Endpoint | Pass/Fail | Evidence | Defect ID |
|---|---|---|---|---|---|---|---|
| CHAT-01 | List conversations | Open chat screen | Conversations load | `/chat/conversations` | | | |
| CHAT-02 | Fetch messages | Open conversation | Messages load chronologically | `/chat/conversations/{id}/messages` | | | |
| CHAT-03 | Send message | Send text message | Message appears locally and after reload | `/chat/conversations/{id}/messages` | | | |
| CHAT-04 | Error handling | Simulate 401/timeout | Graceful error, retry | Chat endpoints | | | |

---

## K) Network/Offline & Resilience

| ID | Scenario | Steps | Expected | Backend Endpoint | Pass/Fail | Evidence | Defect ID |
|---|---|---|---|---|---|---|---|
| NET-01 | Offline fetch | Enable airplane mode → open dashboard | Offline message; no crash; queued/failed safely | Any endpoint | | | |
| NET-02 | Retry after offline | Go online → pull to refresh | Data reloads successfully | Any endpoint | | | |
| NET-03 | Timeout handling | Simulate slow backend | User-friendly timeout message | Any endpoint | | | |
| NET-04 | 401 during flow | Force token invalid mid-session | Interceptor refresh; if fails → logout | `/auth/refresh-token` | | | |

---

## Data & Evidence Capture

For each test case, capture:
- **Device:** iOS/Android model, OS version
- **Build:** App version, build number (1.0.2)
- **User:** Test account, role
- **Test Data:** Resource IDs (planId, mealId, contentId, etc.)
- **Screenshots:** Key screen states
- **Console Logs:** Metro dev logs, backend request/response
- **WebSocket Traces:** Connection, message flow, reconnect
- **Defect Record:** Scenario ID, steps to reproduce, actual vs expected, endpoint hit, redacted payload/response

---

## Acceptance Criteria

✓ All scenarios above pass on iOS (latest + N-1) and Android (latest + N-1) for target devices  
✓ No crashes across flows; graceful handling for network/errors  
✓ Subscription screen remains compliant: native IAP primary, no payment steering; external link is discreet  
✓ Backend state matches UI for subscriptions, agenda completions, meals, progress, notifications, community actions  
✓ WebSocket notifications function with reconnect behavior  
✓ IAP receipts validated server-side for both stores in sandbox  

---

## Execution Order (Runbook)

1. **Auth & Profile**
2. **Onboarding** (new user)
3. **Agenda**
4. **Nutrition/Meals**
5. **Progress/Measurements/Photos**
6. **Achievements/TASCC**
7. **Subscriptions & IAP** (happy paths, then negatives)
8. **Notifications** (REST + WS)
9. **Community**
10. **Chat** (if enabled)
11. **Offline/Resilience** sweeps

---

## Post-UAT Sign-off Checklist

- [ ] All critical/high defects resolved or accepted with waivers
- [ ] Regression pass on fixed areas
- [ ] IAP receipts validated server-side for both stores in sandbox
- [ ] Monitoring/alerts in place for prod (backend logs, WS uptime, IAP validation errors)
- [ ] Go/No-Go recorded with stakeholders (Product, Backend lead, Mobile lead)

**Sign-Off Date:** _______________  
**Tester:** _______________  
**Product Owner:** _______________  
**Backend Lead:** _______________  
**Mobile Lead:** _______________  

---

## Notes

- Keep tests isolated; clean up test data between runs
- Test on real devices; emulator-only issues are secondary
- Capture network activity (Charles/Fiddler) for payment flows if possible
- Log WebSocket frames for live notification scenarios
