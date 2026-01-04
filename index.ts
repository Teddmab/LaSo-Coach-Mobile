import 'react-native-gesture-handler';
// Polyfills that must load BEFORE firebase/auth to avoid component registration race conditions
import 'react-native-url-polyfill/auto';
import { registerRootComponent } from 'expo';

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

// Provide atob/btoa if missing (Firebase may rely on these in RN Hermes environment)
if (typeof global.btoa === 'undefined') {
	try {
		(global as any).btoa = (data: string) => Buffer.from(data, 'binary').toString('base64');
	} catch (error) {
		console.error('❌ Error setting up btoa polyfill:', error);
	}
}
if (typeof global.atob === 'undefined') {
	try {
		(global as any).atob = (data: string) => Buffer.from(data, 'base64').toString('binary');
	} catch (error) {
		console.error('❌ Error setting up atob polyfill:', error);
	}
}

// Import App component using ES6 import (standard for TypeScript)
import App from './App';

// Retarder l'import de Firebase Auth jusqu'à ce que le JavaScript soit prêt
// Cela évite que le SDK natif iOS essaie de charger GoogleService-Info.plist trop tôt
// L'import sera fait de manière lazy dans firebaseApp.ts quand nécessaire

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

