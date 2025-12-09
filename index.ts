// CRITICAL: react-native-gesture-handler MUST be imported first
import 'react-native-gesture-handler';

// Polyfills that must load BEFORE firebase/auth to avoid component registration race conditions
import 'react-native-url-polyfill/auto';

// Provide atob/btoa if missing (Firebase may rely on these in RN Hermes environment)
if (typeof global.btoa === 'undefined') {
	(global as any).btoa = (data: string) => Buffer.from(data, 'binary').toString('base64');
}
if (typeof global.atob === 'undefined') {
	(global as any).atob = (data: string) => Buffer.from(data, 'base64').toString('binary');
}

// Ensure Firebase Auth module registers its components before any lazy initialization
import 'firebase/auth';

import { registerRootComponent } from 'expo';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

