# Upload Key Fix Log

## Summary
- Problem: Play Console rejected bundle; expected upload key SHA1 `11:D3:19:F7:9C:2A:BF:BE:F0:54:FF:DD:DD:A0:32:A4:56:90:2C:91`, but build was signed with SHA1 `3B:1C:4A:5B:D2:71:EC:1E:D2:BD:48:7D:F4:E0:82:9E:07:76:1F:42`.
- Cause: EAS build keystore (managed) did not match Play Console upload key on record.
- Fix path chosen: Request Play Console upload key reset using the current EAS keystore’s certificate (SHA1 `3B:1C:...`).

## Actions Taken
1) Synced codebase to `origin/Moise` and cleaned workspace.
2) Retrieved EAS Android keystore via `npx eas-cli credentials -p android` (profile: default, alias `c661329528ec59107826fdf5d8ea1636`).
   - Keystore SHA1: `3B:1C:4A:5B:D2:71:EC:1E:D2:BD:48:7D:F4:E0:82:9E:07:76:1F:42`.
3) Exported EAS keystore certificate to PEM for Play Console:
   - Keystore path: `secure-keys/eas-keystore.jks`
   - Cert PEM: `secure-keys/eas-upload-cert.pem`
4) Attempted to reuse old upload cert (`upload_cert.der`, SHA1 `11:D3:...`); Play Console rejected because it was a past upload cert. Switched to resetting upload key with current EAS cert.

## Play Console Steps (performed / to perform)
- Navigate: Play Console → App → Configuration → App integrity → Upload key certificate → Request upload key reset.
- Upload `secure-keys/eas-upload-cert.pem` (SHA1 `3B:1C:...`).
- Wait for Google approval (typically 24–48h).

## Post-Approval Steps
- No EAS change needed if using the same keystore (EAS already signs with SHA1 `3B:1C:...`).
- Rebuild and submit:
  - `npx eas-cli build -p android --profile production`
- Upload new `.aab` to Play Console; it should be accepted once the upload key reset is active.

## File Locations
- EAS keystore: `secure-keys/eas-keystore.jks`
- Current upload cert (to submit to Play): `secure-keys/eas-upload-cert.pem`
- Legacy cert (rejected as duplicate): `secure-keys/upload_cert.der` (SHA1 `11:D3:...`).

## Notes
- Keep the keystore and passwords safe; they were shown during `eas credentials` retrieval.
- If Play resets the upload key, rebuilds signed by EAS (SHA1 `3B:1C:...`) will be accepted.
