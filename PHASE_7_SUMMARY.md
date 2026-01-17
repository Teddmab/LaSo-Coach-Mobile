# Phase 7: UGC Zero-Tolerance Modal - Quick Reference

## What Was Built

**UGC Terms Modal System** - Forces users to accept zero-tolerance policy before accessing chat/community features (App Store compliance 3.1.1 & 1.4.1).

---

## Files Created (3)

### 1. `src/components/UgcTermsModal.tsx`
**What**: Bottom-sheet modal displaying UGC policy
- 5 policy sections (Zero-Tolerance, Prohibited Content, Moderation, Reporting, Responsibility)
- Accept/Decline buttons
- Loading state during acceptance
- **TODO**: #1 Verify styling, #2 Add animations

### 2. `src/services/ugcTermsService.ts`
**What**: Storage + Backend sync service
```typescript
acceptUgcTerms()                      // Accept & save locally + backend
getUgcAcceptanceStatus()              // Check if already accepted
syncUgcAcceptanceWithBackend()        // Verify with backend
clearUgcTermsAcceptance()             // Logout/reset
resetUgcTermsRequirement()            // Admin reset (testing)
```
- Local: AsyncStorage keys `@laso_ugc_terms_accepted` + `@laso_ugc_terms_timestamp`
- Backend: `GET/POST /ugc-terms`, `POST /ugc-terms/reset`
- **TODO**: #3 Verify endpoints, #4 Add retry logic

### 3. `src/hooks/useUgcTerms.ts`
**What**: React hook for state management
```typescript
{
  termsAccepted,           // boolean
  termsLoading,            // boolean
  showTermsModal,          // boolean
  setShowTermsModal,       // fn
  handleAcceptTerms,       // async fn
  handleDeclineTerms,      // fn
  checkTermsStatus,        // fn
}
```
- Checks on mount, shows modal if needed
- Syncs with backend
- **TODO**: #5 Handle lifecycle changes, #6 Add analytics

---

## Files Modified (2)

### ChatScreen.tsx
```typescript
// Import
const { termsAccepted, termsLoading, showTermsModal, handleAcceptTerms, handleDeclineTerms } = useUgcTerms();

// Render
{termsLoading && !termsAccepted ? <loading/> : !termsAccepted ? <terms_required/> : <chat/>}

// Modal
<UgcTermsModal visible={showTermsModal} onAccept={handleAcceptTerms} onDecline={handleDeclineTerms} />
```
- **TODO**: #7 Test modal on entry, #8 Test loading state

### CommunityScreen.tsx
- Same pattern as ChatScreen
- **TODO**: #9 Test modal on entry, #10 Test loading state

---

## How It Works

### First-Time User (Chat Tab)
```
Navigate to Chat
   ↓
useUgcTerms() hook fires
   ↓
Check AsyncStorage - NOT FOUND
   ↓
Set showTermsModal = true
   ↓
Modal appears with policy
   ↓
User reads & clicks "Accept"
   ↓
acceptUgcTerms() saves locally + syncs backend
   ↓
Set termsAccepted = true
   ↓
Chat loaded
```

### Existing User (Returns to App)
```
Navigate to Chat
   ↓
useUgcTerms() hook fires
   ↓
Check AsyncStorage - FOUND
   ↓
Set termsAccepted = true
   ↓
Background: syncWithBackend() confirms
   ↓
Chat loaded immediately (no modal)
```

### User Declines
```
User clicks "I Decline"
   ↓
showTermsModal = false
   ↓
termsAccepted stays false
   ↓
Chat shows "📋 Terms Required"
   ↓
Cannot access features
```

---

## Console Output

**Successful Flow**:
```
✅ [useUgcTerms] Checking UGC terms status...
📋 [useUgcTerms] User has not accepted UGC terms - showing modal
✅ [UgcTermsService] UGC terms acceptance saved locally
✅ [UgcTermsService] UGC terms acceptance synced with backend
✅ [useUgcTerms] UGC terms accepted
```

**Existing User**:
```
✅ [useUgcTerms] User has previously accepted UGC terms
✅ [UgcTermsService] UGC acceptance confirmed with backend
```

---

## TODO Markers Location

| # | File | Line | Task |
|---|------|------|------|
| 1 | UgcTermsModal.tsx | 22 | Verify modal styling |
| 2 | UgcTermsModal.tsx | 23 | Add animations |
| 3 | ugcTermsService.ts | 16 | Verify `/ugc-terms` endpoint |
| 4 | ugcTermsService.ts | 17 | Add retry logic |
| 5 | useUgcTerms.ts | 35 | Handle lifecycle changes |
| 6 | useUgcTerms.ts | 36 | Add analytics tracking |
| 7 | ChatScreen.tsx | 43 | Test modal on chat entry |
| 8 | ChatScreen.tsx | 49 | Test loading state |
| 9 | CommunityScreen.tsx | 38 | Test modal on community entry |
| 10 | CommunityScreen.tsx | 52 | Test loading state |

---

## Key Decisions

✅ **Modal vs. Inline**: Used modal for prominence (required for App Store)
✅ **Local + Backend**: Dual storage (works offline, syncs when online)
✅ **Non-Blocking on Sync Failure**: User not blocked if backend unreachable
✅ **Separate per Feature**: Chat and Community both check (allows future granularity)
✅ **Acceptance Timestamp**: Stored for audit trail

---

## Testing

### Unit Tests (What to test)
- [ ] Modal displays when `showTermsModal = true`
- [ ] Accept button calls `handleAcceptTerms`
- [ ] Decline button calls `handleDeclineTerms`
- [ ] Chat hidden when `termsAccepted = false`
- [ ] Chat shown when `termsAccepted = true`
- [ ] `acceptUgcTerms()` saves to AsyncStorage
- [ ] `acceptUgcTerms()` calls `POST /ugc-terms`

### Integration Tests (What to test)
- [ ] Fresh app load → Modal appears
- [ ] Accept → Chat accessible
- [ ] Decline → Chat inaccessible
- [ ] Return to app → Modal doesn't appear (already accepted)
- [ ] Offline accept → Still works locally

### Manual Tests (What to test)
- [ ] Modal scrolls showing all 5 sections
- [ ] Accept button shows spinner
- [ ] No errors in console
- [ ] Chat/Community both controlled by same acceptance

---

## Backend Requirements

Implement these endpoints:
```
GET  /ugc-terms
     Response: { accepted: boolean }

POST /ugc-terms
     Body: { accepted: boolean, timestamp: number }
     Response: { success: boolean }

POST /ugc-terms/reset
     Response: { success: boolean }
```

---

## Next Phase: Phase 8

**Report/Block Features**
- Report content modal
- Block user functionality
- Moderation history

---

## Build Status

✅ **TypeScript**: No errors
✅ **Imports**: All valid
✅ **Compilation**: Passing
✅ **Ready**: Phase 8

---

## Related Documentation

- [PHASE_7_IMPLEMENTATION.md](PHASE_7_IMPLEMENTATION.md) - Full technical details
- [COMPLIANCE_AUDIT_REPORT.md](COMPLIANCE_AUDIT_REPORT.md) - What this fixes
- [COMPANION_MODE_IMPLEMENTATION_PLAN.md](COMPANION_MODE_IMPLEMENTATION_PLAN.md) - Broader context
