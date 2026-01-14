import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer, NavigationContainerRef, useNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { StripeProvider } from '@stripe/stripe-react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/FirebaseAuthContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { ChatProvider } from './src/context/ChatContext';
import { IOSSimulationProvider } from './src/context/IOSSimulationContext';
import { initializeTokenManager } from './src/services/api';
import Config from './src/config/env';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import PasswordResetScreen from './src/screens/PasswordResetScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import { ActivityIndicator, View, StyleSheet, Linking, BackHandler, Alert, Dimensions } from 'react-native';
import Toast from 'react-native-toast-message';
import { toastConfig } from './src/config/toastConfig';
import ErrorBoundary from './src/components/ErrorBoundary';
import NetworkStatus from './src/components/NetworkStatus';
import IOSSimulationButton from './src/components/IOSSimulationButton';
import { RootStackParamList } from './src/types/navigation';
import './src/utils/consoleFilter';

// Preload profile components at app startup to avoid delay when navigating
// These imports force immediate loading instead of lazy loading
// We import them but don't use them directly - they're loaded for side effects
import OnboardingAccordion from './src/components/profile/OnboardingAccordion';
import ProfileInformationsSection from './src/components/profile/ProfileInformationsSection';
import ProfileStep1BottomSheet from './src/components/dashboard/ProfileStep1BottomSheet';
import ProfileStep2BottomSheet from './src/components/dashboard/ProfileStep2BottomSheet';
import ProfileStep3BottomSheet from './src/components/dashboard/ProfileStep3BottomSheet';
import ProfileStep4BottomSheet from './src/components/dashboard/ProfileStep4BottomSheet';

// Keep references to prevent tree-shaking (force bundler to include them)
const _preloadedComponents = {
  OnboardingAccordion,
  ProfileInformationsSection,
  ProfileStep1BottomSheet,
  ProfileStep2BottomSheet,
  ProfileStep3BottomSheet,
  ProfileStep4BottomSheet,
};

const Stack = createStackNavigator<RootStackParamList>();

function AppContent() {
  const { isAuthenticated, authReady, loading } = useAuth();
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const backHandlerRef = useRef<{ lastBackPress: number; isOnHome: boolean }>({
    lastBackPress: 0,
    isOnHome: false,
  });

  // Global deep link handler
  const handleDeepLink = (url: string | null) => {
    console.log('🔗 Global deep link received:', url);
    
    if (!url) return;
    
    try {
      // Parse the deep link URL
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      const params = Object.fromEntries(urlObj.searchParams);
      
      console.log('🔗 Parsed URL - Path:', path, 'Params:', params);
      
      // Navigate based on the path
      switch (path) {
        case '/onboarding/subscription-success':
          console.log('🔗 Navigating to subscription success with session_id:', params.session_id);
          // Navigate to dashboard and show success message
          if (navigationRef.current) {
            navigationRef.current.navigate('Dashboard');
            // Show success toast
            setTimeout(() => {
              Toast.show({
                type: 'success',
                text1: 'Paiement réussi',
                text2: 'Votre abonnement a été activé avec succès!',
              });
            }, 1000);
          }
          break;
          
        case '/onboarding/subscription-cancel':
          console.log('🔗 Navigating to subscription cancel');
          // Navigate to dashboard and show cancel message
          if (navigationRef.current) {
            navigationRef.current.navigate('Dashboard');
            // Show cancel toast
            setTimeout(() => {
              Toast.show({
                type: 'info',
                text1: 'Paiement annulé',
                text2: 'Votre paiement a été annulé.',
              });
            }, 1000);
          }
          break;
          
        case '/onboarding/subscription':
          console.log('🔗 Navigating to subscription screen');
          // Navigate to dashboard (subscription is handled within dashboard)
          if (navigationRef.current) {
            navigationRef.current.navigate('Dashboard');
          }
          break;
          
        default:
          console.log('🔗 Unknown deep link path:', path);
          break;
      }
    } catch (error) {
      console.error('❌ Error parsing deep link:', error);
    }
  };

  // Handle deep links when app is already running
  useEffect(() => {
    const handleUrl = (event: { url: string }) => {
      console.log('🔗 URL event received:', event);
      handleDeepLink(event.url);
    };

    // Handle deep links when app is opened from a link
    const handleInitialURL = async () => {
      try {
        const initialURL = await Linking.getInitialURL();
        console.log('🔗 Initial URL:', initialURL);
        if (initialURL) {
          handleDeepLink(initialURL);
        }
      } catch (error) {
        console.error('❌ Error getting initial URL:', error);
      }
    };

    // Add event listener for deep links
    const linkingSubscription = Linking.addEventListener('url', handleUrl);
    
    // Check for initial URL
    handleInitialURL();

    return () => {
      linkingSubscription?.remove();
    };
  }, []);

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!navigationRef.current) {
        return false;
      }

      const navigationState = navigationRef.current.getRootState();
      const currentRoute = navigationState?.routes[navigationState?.index];
      const isOnHome = currentRoute?.name === 'Dashboard';

      // Check if we're on the Dashboard (home screen)
      if (isOnHome) {
        const now = Date.now();
        const DOUBLE_PRESS_DELAY = 2000; // 2 seconds

        // If last back press was recent, exit app
        if (
          backHandlerRef.current.isOnHome &&
          now - backHandlerRef.current.lastBackPress < DOUBLE_PRESS_DELAY
        ) {
          Alert.alert(
            'Quitter l\'application',
            'Voulez-vous vraiment quitter l\'application ?',
            [
              { text: 'Annuler', style: 'cancel' },
              { text: 'Quitter', onPress: () => BackHandler.exitApp() },
            ]
          );
          return true;
        }

        // First press on home - show message and track time
        backHandlerRef.current.lastBackPress = now;
        backHandlerRef.current.isOnHome = true;
        Toast.show({
          type: 'info',
          text1: 'Appuyez à nouveau pour quitter',
          position: 'bottom',
          visibilityTime: 2000,
        });
        return true;
      } else {
        // Not on home - normal navigation back
        if (navigationRef.current?.canGoBack()) {
          navigationRef.current.goBack();
          return true;
        }
        return false;
      }
    });

    // Track navigation state to know when we're on home
    const unsubscribe = navigationRef.current?.addListener('state', () => {
      const navigationState = navigationRef.current?.getRootState();
      const currentRoute = navigationState?.routes[navigationState?.index];
      backHandlerRef.current.isOnHome = currentRoute?.name === 'Dashboard';
    });

    return () => {
      backHandler.remove();
      unsubscribe?.();
    };
  }, []);

  // Show loading screen while auth is initializing
  if (!authReady || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8BC34A" />
      </View>
    );
  }

  return (
    <>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator 
          initialRouteName={isAuthenticated ? "Dashboard" : "Login"}
          screenOptions={{ 
            headerShown: false,
            gestureEnabled: false
          }}
        >
          {isAuthenticated ? (
            // Authenticated stack
            (<Stack.Screen name="Dashboard" component={DashboardScreen} />)
          ) : (
            // Non-authenticated stack
            (<>
              <Stack.Screen name="Login" component={LoginScreen as any} />
              <Stack.Screen name="Register" component={RegisterScreen} />
              <Stack.Screen name="PasswordReset" component={PasswordResetScreen as any} />
            </>)
          )}
        </Stack.Navigator>
        {/* StatusBar pour le contenu de l'app - style light pour fonds sombres */}
        <StatusBar style="light" />
      </NavigationContainer>
      {/* Bouton flottant iOS Simulation - Masqué pour le build production */}
      {/* <IOSSimulationButton /> */}
    </>
  );
}

export default function App() {
  console.log('📱 LaSo Coach App starting...');
  
  // Calculate position at 20% from top for Toast
  // Position at 20% of screen height from top
  const screenHeight = React.useMemo(() => Dimensions.get('window').height, []);
  const toastContentHeight = 90; // minHeight 60 + padding 32
  const toastMarginTop = 20; // margin from toastConfig
  const topOffset20Percent = React.useMemo(() => {
    // Position at 20% from top: screenHeight * 0.2 - (toastContentHeight / 2) - toastMarginTop
    return (screenHeight * 0.2) - (toastContentHeight / 2) - toastMarginTop;
  }, [screenHeight]);
  
  const [stripeKey, setStripeKey] = React.useState<string>(Config.STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');
  
  // Initialize TokenManager at app startup
  // This ensures AsyncStorage is ready before any API requests
  useEffect(() => {
    try {
      console.log('🔐 [Startup] Initializing app dependencies...');
      initializeTokenManager();
      
      // Try to fetch Stripe key from backend if not in config
      if (!Config.STRIPE_PUBLISHABLE_KEY || Config.STRIPE_PUBLISHABLE_KEY === 'pk_test_placeholder') {
        console.log('🔑 [Stripe] Attempting to fetch publishable key from backend...');
        // Use dynamic import to avoid crash if module not available
        import('./src/services/subscriptionApi')
          .then((module) => {
            const SubscriptionApi = module.default;
            return SubscriptionApi.getStripePublishableKey();
          })
          .then((backendKey: string | null) => {
            if (backendKey) {
              console.log('✅ [Stripe] Publishable key loaded from backend');
              setStripeKey(backendKey);
            } else {
              console.warn('⚠️ [Stripe] Publishable key not found in backend. Using placeholder.');
            }
          })
          .catch((error: Error) => {
            console.warn('⚠️ [Stripe] Could not fetch key from backend:', error.message);
            // Don't crash app if Stripe key fetch fails
          });
      } else {
        console.log('✅ [Stripe] Publishable key loaded from configuration');
      }

      // Profile components are now preloaded via static imports at the top of the file
      // This ensures they are bundled and ready immediately at app startup
      console.log('✅ [Startup] Profile components preloaded via static imports');
    } catch (error: any) {
      console.error('❌ [Startup] Error initializing app dependencies:', error);
      // Don't crash - continue with default values
    }
  }, []);
  
  // Stripe publishable key - from config or backend
  const STRIPE_PUBLISHABLE_KEY = stripeKey;
  
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
          <AuthProvider>
            <NotificationProvider>
              <ChatProvider>
                <IOSSimulationProvider>
                  <NetworkStatus />
                  <AppContent />
                </IOSSimulationProvider>
              </ChatProvider>
            </NotificationProvider>
          </AuthProvider>
          <Toast 
            position="top"
            visibilityTime={3000}
            autoHide={true}
            topOffset={topOffset20Percent}
            config={toastConfig as any}
          />
        </StripeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#8BC34A',
  },
});