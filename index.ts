// CRITICAL: Import gesture handler FIRST before any other imports
// This ensures gesture handler is initialized before React Native components
import 'react-native-gesture-handler';

// Sentry le plus tôt possible (après gesture-handler) pour capter les crashes natifs / JS au cold start
import { initSentry } from './src/config/sentry';
initSentry();

// CRITICAL: Import registerRootComponent early to ensure it's available
import { registerRootComponent } from 'expo';

// Polyfills that must load BEFORE firebase/auth to avoid component registration race conditions
import 'react-native-url-polyfill/auto';

// Global error handler to catch unhandled errors
if (typeof global.ErrorUtils !== 'undefined') {
  const originalHandler = global.ErrorUtils.getGlobalHandler();
  global.ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    console.error('🚨 GLOBAL ERROR HANDLER:', error);
    console.error('🚨 Is Fatal:', isFatal);
    console.error('🚨 Stack:', error.stack);
    
    // Call original handler
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });
}

// Handle unhandled promise rejections (React Native specific)
if (typeof global !== 'undefined') {
  // Intercept unhandled promise rejections
  if (typeof global.onunhandledrejection === 'undefined') {
    (global as any).onunhandledrejection = (event: any) => {
      console.error('🚨 UNHANDLED PROMISE REJECTION:', event?.reason || event);
      if (event?.reason) {
        console.error('🚨 Rejection reason:', event.reason);
        if (event.reason?.stack) {
          console.error('🚨 Stack:', event.reason.stack);
        }
      }
    };
  }
}

// atob/btoa : ne pas utiliser Buffer (souvent absent en Hermes / release sans polyfill global)
if (typeof global.btoa === 'undefined' || typeof global.atob === 'undefined') {
	try {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const base64 = require('base-64') as { encode: (s: string) => string; decode: (s: string) => string };
		if (typeof global.btoa === 'undefined') {
			(global as any).btoa = base64.encode;
		}
		if (typeof global.atob === 'undefined') {
			(global as any).atob = base64.decode;
		}
	} catch (error) {
		console.error('❌ Error setting up btoa/atob polyfill (base-64):', error);
	}
}

// CRITICAL: Import App component AFTER all polyfills and setup
// This ensures the runtime is ready before any native modules are loaded
// Native modules in App.tsx (via contexts) are now lazy-loaded to avoid NativeEventEmitter issues
import App from './App';

// Retarder l'import de Firebase Auth jusqu'à ce que le JavaScript soit prêt
// Cela évite que le SDK natif iOS essaie de charger GoogleService-Info.plist trop tôt
// L'import sera fait de manière lazy dans firebaseApp.ts quand nécessaire

// CRITICAL: Register root component synchronously
// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
// This MUST be called after all imports to ensure the component is registered correctly
registerRootComponent(App);

