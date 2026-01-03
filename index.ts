// CRITIQUE: Initialiser Sentry EN PREMIER pour capturer les crashes natifs
// Même avant les polyfills et autres imports
import { initSentry } from './src/config/sentry';
initSentry();

// Attendre un peu pour que Sentry natif soit initialisé
// Cela permet de capturer les crashes qui se produisent pendant l'initialisation
if (typeof global !== 'undefined') {
  // Forcer l'initialisation Sentry native immédiatement
  try {
    const Sentry = require('@sentry/react-native');
    // Sentry natif devrait être initialisé maintenant
  } catch (e) {
    // Ignorer si Sentry n'est pas encore disponible
  }
}

import 'react-native-gesture-handler';
// Polyfills that must load BEFORE firebase/auth to avoid component registration race conditions
import 'react-native-url-polyfill/auto';
import { registerRootComponent } from 'expo';

// Global error handler to catch unhandled errors
// Intégré avec Sentry pour capturer les crashes
if (typeof global.ErrorUtils !== 'undefined') {
  const originalHandler = global.ErrorUtils.getGlobalHandler();
  global.ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    console.error('🚨 GLOBAL ERROR HANDLER:', error);
    console.error('🚨 Is Fatal:', isFatal);
    console.error('🚨 Stack:', error.stack);
    
    // Capturer l'erreur dans Sentry
    try {
      const Sentry = require('@sentry/react-native');
      Sentry.captureException(error, {
        level: isFatal ? 'fatal' : 'error',
        tags: {
          error_boundary: 'global_handler',
          is_fatal: String(isFatal),
        },
      });
    } catch (sentryError) {
      // Sentry n'est peut-être pas encore initialisé, ignorer
      console.warn('⚠️ [Sentry] Impossible de capturer l\'erreur:', sentryError);
    }
    
    // Call original handler
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });
}

// Handle unhandled promise rejections (React Native specific)
// Intégré avec Sentry pour capturer les promesses rejetées
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
        
        // Capturer dans Sentry
        try {
          const Sentry = require('@sentry/react-native');
          const error = event.reason instanceof Error 
            ? event.reason 
            : new Error(String(event.reason));
          Sentry.captureException(error, {
            level: 'error',
            tags: {
              error_boundary: 'unhandled_promise_rejection',
            },
          });
        } catch (sentryError) {
          console.warn('⚠️ [Sentry] Impossible de capturer la rejection:', sentryError);
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

// Ensure Firebase Auth module registers its components before any lazy initialization
import 'firebase/auth';

// Import App component using ES6 import (standard for TypeScript)
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

