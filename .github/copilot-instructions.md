## Purpose
Short, actionable instructions to help an AI coding agent be productive in this repository (LaSo Coach - Expo/React Native).

## Big picture (how the app is assembled)
- Expo-managed React Native app (Expo SDK 53). Entry point: `index.js` -> `App.js`.
- Native projects live in `ios/` and `android/` and are used for device builds or EAS builds.
- App structure: UI components in `src/components/`, screens in `src/screens/`, API wrappers in `src/services/`, runtime config in `config/`, contexts in `src/context/` (notably `AuthContext.js` and `NotificationContext.js`).
- Key runtime wiring: `App.js` composes `AuthProvider`, `NotificationProvider`, `NetworkStatus` and a global `ErrorBoundary`. Navigation is driven by auth state (see `App.js` for deep-link handling and initialRoute logic).

## Build / run / debug (concrete commands)
- Local development (Metro + Expo):
  - npm start     -> runs `expo start`
  - npm run android -> runs `expo run:android` (Android device/emulator)
  - npm run ios     -> runs `expo run:ios` (macOS required)
- EAS (cloud/native) builds: `eas-cli` is a devDependency and build profiles are in `eas.json` (development, preview, production). Use `eas build -p android --profile preview` etc.
- iOS native pods: when working on native iOS code run `npx pod-install` or `cd ios && pod install` on macOS. `ios/Podfile` is present.
- Android notes: signing configuration references environment variables `LASO_RELEASE_*` in `android/app/build.gradle`. Debug keystore is in `android/app/debug.keystore`.

## Project-specific patterns and conventions
- Environment variables: `babel.config.js` uses `react-native-dotenv` with module name `@env`. Import with `import { SOME_KEY } from '@env'`. The `.env` file is expected at project root.
- Auth & navigation: the navigation stack chooses `Dashboard` vs `Login` based on `AuthContext` state. If you change auth behavior, update `src/context/AuthContext.js` and `App.js` accordingly.
- Firebase authentication: New Firebase-based auth service in `src/services/firebaseAuthServiceNew.js` with proper ID token handling and backend integration. Uses Firebase auth state listeners and automatic token refresh. Alternative context in `src/context/FirebaseAuthContext.js`.
- API authentication: All API requests automatically include Firebase ID tokens via axios interceptors. The `firebaseAuthService` handles token refresh on 401 errors and maintains sync between Firebase auth state and backend user profiles.
- Deep links: `App.js` implements a global deep link handler. Known paths in code:
  - `/onboarding/subscription-success` (shows success toast, navigates to Dashboard)
  - `/onboarding/subscription-cancel` (navigates to Dashboard and shows info toast)
  - `/onboarding/subscription` (navigates to Dashboard/subscription flow)
  Check `App.js` for parsing and toast examples.
- API clients: look under `src/services/` (e.g. `achievementsApi.js`) — services use `axios` and follow a small wrapper per resource.
- Notifications & toast: `react-native-toast-message` is used; configuration is in `config/toastConfig.js` and global `Toast` is mounted in `App.js`.
- IAP & payments: repository includes `react-native-iap` and subscription-related screens (`SubscriptionScreen.js`); payment verification and deep linking live in `src/screens` and `App.js`.

## Integration points & external dependencies
- Firebase: `config/firebaseApp.js` — look here for project Firebase setup.
- Push notifications: `expo-notifications` is used; see `NotificationContext.js` for handling registration and events.
- In-app purchases: `react-native-iap` and subscription flow; verify flows against backend endpoints (see `BACKEND_API_SPEC.md`).
- Backend API: `BACKEND_API_SPEC.md` and several `src/services/*` files describe API endpoints and expected shapes. Prefer modifying service wrappers rather than sprinkling `axios` calls across screens.

## Quick guidance for common tasks (examples)
- Add a new screen: create `src/screens/MyScreen.js`, register it in `App.js` navigation stack or in a relevant navigator component (e.g., `BottomNavigation.js`).
- Add an API wrapper: create `src/services/myResourceApi.js` and reuse existing axios instance pattern found in other service files.
- Use env vars in code:
  - `import { API_URL } from '@env'`

## Files to inspect first (high signal)
- `App.js` — app wiring, deep linking, providers
- `index.js` — root registration
- `src/context/AuthContext.js` (legacy) and `src/context/FirebaseAuthContext.js` (new) — auth & navigation behavior
- `src/services/firebaseAuthServiceNew.js` — Firebase-based auth with automatic token management and backend integration
- `src/context/NotificationContext.js` — push notification behavior
- `src/services/` — API patterns and service wrappers
- `config/firebaseApp.js`, `config/apiConfig.js`, `config/toastConfig.js` — important integration/config
- `android/app/build.gradle`, `ios/Podfile`, `eas.json` — native build/signing/EAS profiles

## Non-goals / gotchas
- This repo is Expo-based: many native operations (especially iOS) require macOS. Avoid assuming local iOS builds on Windows.
- TypeScript is only partially used (devDependency `typescript`, `tsconfig.json` extends `expo/tsconfig.base`). Most source files are JS. Don't introduce wide TS-only changes without running project-level checks.

If anything above is unclear or you want me to include more examples (for example, the exact axios instance pattern or the auth reducer shape), tell me which area to expand and I will iterate. 
