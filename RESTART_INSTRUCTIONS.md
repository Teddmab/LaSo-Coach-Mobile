# How to Restart Your Project to Pick Up Changes

## Full Restart (Recommended for WebSocket Changes)

1. **Stop the Metro bundler**:
   - Press `Ctrl+C` in the terminal where Metro is running
   - Wait for it to fully stop

2. **Clear cache and restart**:
   ```bash
   npx expo start --clear
   ```
   Or if using npm:
   ```bash
   npm start -- --reset-cache
   ```

3. **Reload the app**:
   - Press `R` in the terminal, or
   - Shake device and tap "Reload", or
   - Close and reopen the app

## Why Full Restart?

WebSocket service changes sometimes require:
- Clearing Metro bundler cache
- Restarting the JavaScript runtime
- Reinitializing native modules

## What to Look For After Restart

Check the logs for:
1. **URL processing log**: Should show `hasPort: false`
2. **Connection log**: Should show `transport: 'websocket-only'`
3. **No polling attempts**: Should NOT see `transport=polling` in error URLs
4. **No :443 in URL**: Request URL should NOT have `:443`

## If Still Getting Same Error

If you still see `transport=polling` or `:443` in the URL after restart:
1. Share the new logs
2. Check if the URL processing log shows `hasPort: false`
3. We may need to investigate Socket.IO's internal URL handling

