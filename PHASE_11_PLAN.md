# Phase 11: Debug Cleanup - Plan

**Phase**: 11 of 12  
**Status**: 🔄 IN PROGRESS  
**Date**: January 17, 2026  
**Objective**: Remove/optimize debug logs while maintaining production logging

---

## Audit Results

**Total Console Statements Found**: ~50-100+ across source files

### By Type:
- `console.log()` - ~70+ (INFO level)
- `console.warn()` - ~10-15 (WARNING level)
- `console.error()` - ~10-15 (ERROR level)

### By Category:
- **Deep linking** (App.tsx) - ~8 statements
- **Authentication** (FirebaseAuthService) - ~15+ statements
- **Permissions** (permissionService.ts) - ~10+ statements
- **Entitlements** (entitlementsApi.ts, useEntitlements.ts) - ~8+ statements
- **UGC Terms** (ugcTermsService.ts, useUgcTerms.ts) - ~15+ statements
- **Moderation** (moderationApi.ts, useModeration.ts) - ~20+ statements
- **Account Deletion** (AccountSettingsScreen, useSecurity) - ~5 statements
- **Various other services** - ~10+ statements

---

## Files to Clean

### HIGH PRIORITY (Core app functionality)

1. **App.tsx** (~15 debug statements)
   - Deep linking logs
   - Stripe initialization logs
   - App startup logs

2. **src/services/firebaseAuthService.ts** (~15+ debug statements)
   - Login/logout logs
   - Token refresh logs
   - Auth state logs

3. **src/context/FirebaseAuthContext.tsx** (~10 debug statements)
   - Auth state listeners
   - Token refresh triggers

### MEDIUM PRIORITY (Feature-specific)

4. **src/services/entitlementsApi.ts** (~5 statements)
5. **src/hooks/useEntitlements.ts** (~5 statements)
6. **src/services/ugcTermsService.ts** (~10 statements)
7. **src/hooks/useUgcTerms.ts** (~8 statements)
8. **src/services/permissionService.ts** (~10 statements)

### LOWER PRIORITY (Moderation features)

9. **src/services/moderationApi.ts** (~15 statements)
10. **src/hooks/useModeration.ts** (~10 statements)
11. **src/components/BlockUserModal.tsx** (~3 statements)
12. **src/components/ReportMessageModal.tsx** (~2 statements)
13. **src/components/UgcTermsModal.tsx** (~3 statements)

---

## Strategy

### Phase 11 Approach: Two-Tier Logging

**Tier 1: Production Logging** (Keep)
- Error logs with stack traces
- Critical warnings
- Key milestones (app startup, user login, feature toggled)

**Tier 2: Debug Logging** (Remove/Comment)
- Verbose object logging
- API response details
- Function entry/exit logs
- Detailed state changes

### Implementation Strategy

1. **Audit**: Identify all console statements ✅ DONE
2. **Categorize**: Separate production vs. debug logs
3. **Create Logger**: Use existing `src/utils/logger.js` where available
4. **Replace**: Use logger instead of console for production logs
5. **Remove**: Delete debug-only logs
6. **Test**: Verify app still works
7. **Validate**: No errors in build

---

## What to Keep

Keep these types of logs:

```typescript
// ERROR logs (always keep)
logger.error('Critical error:', error);

// WARNING logs (keep for important issues)
logger.warn('Feature disabled:', reason);

// MILESTONES (keep important app events)
logger.info('User logged in');
logger.info('App initialized');
```

---

## What to Remove/Comment

Remove these types:

```typescript
// ❌ REMOVE: Verbose info logs
console.log('🔐 [Startup] Initializing app dependencies...');

// ❌ REMOVE: API response details
console.log('✅ [Entitlements] Entitlements loaded from backend');

// ❌ REMOVE: Deep debugging
console.log('🔗 Parsed URL - Path:', path, 'Params:', params);

// ❌ REMOVE: Object dumps
console.log('📋 [Dashboard] User Entitlements:', { ... });
```

---

## TODO List - Phase 11

### TODO #23: Audit console logs (DONE ✅)
- [x] Search for all console.* statements
- [x] Categorize by file and type
- [x] Identify which are production vs. debug

### TODO #24: Clean App.tsx
- [ ] Remove deep linking debug logs (keep errors)
- [ ] Remove Stripe initialization debug logs
- [ ] Remove app startup verbose logs
- [ ] Reduce from ~15 to ~3-4 statements

### TODO #25: Clean firebaseAuthService.ts
- [ ] Remove login/logout debug logs
- [ ] Remove token refresh verbose logs
- [ ] Keep authentication errors
- [ ] Reduce from ~15 to ~3-4 statements

### TODO #26: Clean permissionService.ts
- [ ] Remove permission request logs
- [ ] Remove verbose status logs
- [ ] Keep error handling
- [ ] Reduce from ~10 to ~2 statements

### TODO #27: Clean entitlements code
- [ ] Remove entitlements loading logs
- [ ] Remove useEntitlements debug logs
- [ ] Keep error handling
- [ ] Reduce from ~10 to ~2 statements

### TODO #28: Clean UGC terms code
- [ ] Remove terms status logs
- [ ] Remove useUgcTerms debug logs
- [ ] Keep errors
- [ ] Reduce from ~15 to ~2 statements

### TODO #29: Clean moderation code
- [ ] Remove moderation action logs
- [ ] Remove useModeration debug logs
- [ ] Remove modal debug logs
- [ ] Reduce from ~30 to ~3 statements

### TODO #30: Test and validate
- [ ] Run app without errors
- [ ] Verify essential logs still appear
- [ ] Check console in React Native Debugger
- [ ] Validate build succeeds

### TODO #31: Final documentation
- [ ] Create cleanup summary
- [ ] List all removed logs
- [ ] Note any important logs retained
- [ ] Update codebase status

---

## Build Validation

After cleanup, verify:

```bash
# Check for TypeScript errors
npm run type-check

# Build for iOS (macOS only)
npm run ios

# Build for Android
npm run android

# Verify build succeeds with 0 errors
```

---

## Expected Impact

**Before Cleanup**:
- ~50-100+ console.log statements
- Cluttered debug output
- Harder to find real errors
- ~50KB of debug code

**After Cleanup**:
- ~10-15 strategic log statements
- Clean console output
- Easier error tracking
- ~5-10KB of logging code

**Performance Impact**: Negligible (logging overhead minimal)

---

## Files Affected

Total files to review: **~13 files**

```
App.tsx (CORE)
src/services/firebaseAuthService.ts (CORE)
src/context/FirebaseAuthContext.tsx (CORE)
src/services/entitlementsApi.ts
src/hooks/useEntitlements.ts
src/services/ugcTermsService.ts
src/hooks/useUgcTerms.ts
src/services/permissionService.ts
src/services/moderationApi.ts
src/hooks/useModeration.ts
src/components/BlockUserModal.tsx
src/components/ReportMessageModal.tsx
src/components/UgcTermsModal.tsx
```

---

## Logger Utility Available

Project has existing logger at: `src/utils/logger.ts`

Available methods:
```typescript
logger.info(message)
logger.warn(message)
logger.error(message)
logger.debug(message) // For development only
```

---

## Quality Checklist

- [ ] All console.log statements reviewed
- [ ] Debug logs removed
- [ ] Production logs preserved
- [ ] Error handling intact
- [ ] Build succeeds
- [ ] No TypeScript errors
- [ ] Console clean on app startup
- [ ] Console clean during operations

---

## Timeline Estimate

| Task | Estimate | Status |
|------|----------|--------|
| App.tsx | 15 min | ⏳ |
| firebaseAuthService | 15 min | ⏳ |
| Other services | 30 min | ⏳ |
| Testing | 15 min | ⏳ |
| Documentation | 10 min | ⏳ |
| **Total** | **~85 min** | ⏳ |

---

## Success Criteria

✅ **Phase 11 Complete When**:
- All debug logs removed
- ~90%+ reduction in console output
- Error logs still appear
- Build succeeds with 0 errors
- No functionality changed
- Documentation updated

---

## Next Phase Preview

**Phase 12: Final QA & Release**
- Complete testing
- Performance validation
- Release preparation
- Final sign-off

---

## Notes

- Keep backups of original files (git handles this)
- Test app after each file cleaned
- Use git diff to review changes
- Don't remove error handling
- Preserve stack traces in errors

