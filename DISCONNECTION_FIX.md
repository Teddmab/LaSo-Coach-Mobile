# Automatic Disconnection Fix

## Problem
When using `expo export`, the app was automatically disconnecting users. This happened because:
1. **Too aggressive error handling** - Any network error during auth initialization caused immediate logout
2. **No retry logic** - Single failed API call would disconnect the user
3. **Short timeout** - 30-second timeout was too short for slow networks
4. **Excessive logging** - Production builds had too much console logging affecting performance

## Changes Made

### 1. AuthContext.js - Improved Auth Initialization
- **Added retry logic** for initial profile fetch (3 retries with exponential backoff)
- **Better error handling** - Only logout on actual auth errors (401, 403), not network errors
- **Network resilience** - Keep user logged in if network fails, will retry on next API call
- Users now stay logged in even if the initial profile fetch fails due to network issues

### 2. api.js - Reduced Logging & Improved Resilience
- **Minimized production logging** - Only log in `__DEV__` mode to improve performance
- **Cleaned up console spam** - Removed excessive debug logs that cluttered production
- **Better retry logic** - Added timeout errors (ETIMEDOUT) to retry conditions
- **Graceful degradation** - Network issues don't force logout

### 3. env.js - Extended Timeouts
- **Increased API timeout** from 30s to 60s for better network resilience
- **Added AUTH_INIT_TIMEOUT** - Special 90-second timeout for initial auth check
- This helps on slower networks and when backend is cold-starting

## Expected Behavior Now

✅ **Network issues won't disconnect users** - They'll stay logged in and retry automatically
✅ **Better retry mechanism** - Failed requests retry up to 3 times with exponential backoff
✅ **Longer timeouts** - More time for slow networks and cold starts
✅ **Cleaner logs** - Production builds are faster with less console spam
✅ **Auth errors still work** - Real auth failures (401, 403) still properly log out users

## Testing
1. Test with `expo export` - User should stay logged in
2. Test with poor network - App should retry and not disconnect
3. Test with airplane mode - App should show network error but not logout
4. Test with expired token - Should properly logout (401 error)

## What to Watch For
- If users are still getting disconnected, check the console logs for specific error codes
- Network status banner should appear when offline (red banner at top)
- App should retry automatically when connection returns

