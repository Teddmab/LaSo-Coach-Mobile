import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer, NavigationContainerRef, useNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/FirebaseAuthContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { ChatProvider } from './src/context/ChatContext';
import { IOSSimulationProvider } from './src/context/IOSSimulationContext';
import { CompanionModeProvider } from './src/context/CompanionModeContext';
import { PaymentProvider } from './src/context/PaymentContext';
import { AppDataCacheProvider } from './src/context/AppDataCacheContext';
// TODO: PHASE 4 - Import companion mode guard
import { isIOSCompanionMode } from './src/config/featureFlags';
import { initializeTokenManager } from './src/services/api';
import { initializeOneSignal } from './src/services/onesignal';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import PasswordResetScreen from './src/screens/PasswordResetScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import {
  ActivityIndicator,
  View,
  StyleSheet,
  Linking,
  BackHandler,
  Alert,
  Dimensions,
  InteractionManager,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { toastConfig } from './src/config/toastConfig';
import ErrorBoundary from './src/components/ErrorBoundary';
import NetworkStatus from './src/components/NetworkStatus';
import IOSSimulationButton from './src/components/IOSSimulationButton';
import { RootStackParamList } from './src/types/navigation';
import './src/utils/consoleFilter';
import imageCache from './src/utils/imageCache';

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
  
  // Track previous authentication state to detect transitions
  const prevIsAuthenticatedRef = useRef(isAuthenticated);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Précharger les images critiques au démarrage
  useEffect(() => {
    imageCache.preloadCriticalImages().catch(() => {
      // Ignore les erreurs de préchargement
    });
  }, []);
  
  // Detect authentication state change and show white screen during transition
  useEffect(() => {
    if (prevIsAuthenticatedRef.current !== isAuthenticated && isAuthenticated) {
      // User just logged in - show white transition screen
      setIsTransitioning(true);
      // Hide transition screen after a short delay to allow Dashboard to render
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 100);
      return () => clearTimeout(timer);
    }
    prevIsAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  // Global deep link handler
  const handleDeepLink = (url: string | null) => {
    if (!url) return;
    
    try {
      // Parse the deep link URL
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      const params = Object.fromEntries(urlObj.searchParams);
      
      // Navigate based on the path
      switch (path) {
          
        default:
          break;
      }
    } catch (error) {
      console.error('❌ Error parsing deep link:', error);
    }
  };

  // Handle deep links when app is already running
  useEffect(() => {
    const handleUrl = (event: { url: string }) => {
      handleDeepLink(event.url);
    };

    // Handle deep links when app is opened from a link
    const handleInitialURL = async () => {
      try {
        const initialURL = await Linking.getInitialURL();
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

  // Show loading screen while auth is initializing or during transition
  // Use white background to avoid green flash during transition
  if (!authReady || loading || isTransitioning) {
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
            gestureEnabled: false,
            // Add transition animation to avoid green flash
            animationTypeForReplace: 'push',
            transitionSpec: {
              open: {
                animation: 'timing',
                config: {
                  duration: 0, // Instant transition to avoid showing green background
                },
              },
              close: {
                animation: 'timing',
                config: {
                  duration: 0,
                },
              },
            },
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
  // Calculate position at 20% from top for Toast
  // Position at 20% of screen height from top
  const screenHeight = React.useMemo(() => Dimensions.get('window').height, []);
  const toastContentHeight = 90; // minHeight 60 + padding 32
  const toastMarginTop = 20; // margin from toastConfig
  const topOffset20Percent = React.useMemo(() => {
    // Position at 20% from top: screenHeight * 0.2 - (toastContentHeight / 2) - toastMarginTop
    return (screenHeight * 0.2) - (toastContentHeight / 2) - toastMarginTop;
  }, [screenHeight]);
  
  // OneSignal en premier (court délai après interactions) ; expo-notifications attend ensuite
  // un écart minimal côté NotificationProvider (`waitForMinDelayAfterOneSignalInit`).
  useEffect(() => {
    try {
      initializeTokenManager();
    } catch (error: any) {
      console.error('❌ [Startup] Error initializing TokenManager:', error);
    }

    let cancelled = false;
    let deferredTimeout: ReturnType<typeof setTimeout> | null = null;
    const runOneSignal = () => {
      if (cancelled) return;
      try {
        initializeOneSignal();
      } catch (e: any) {
        console.error('❌ [Startup] OneSignal:', e?.message ?? e);
      }
    };

    const interactionTask = InteractionManager.runAfterInteractions(() => {
      const delayMs = __DEV__ ? 0 : 180;
      deferredTimeout = setTimeout(runOneSignal, delayMs);
    });

    return () => {
      cancelled = true;
      if (deferredTimeout) clearTimeout(deferredTimeout);
      const cancel = (interactionTask as { cancel?: () => void })?.cancel;
      if (typeof cancel === 'function') cancel();
    };
  }, []);
  
  // Payment infrastructure removed - using backend entitlements for feature gating
  // No StripeProvider needed - all payments handled server-side
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <AppDataCacheProvider>
            <NotificationProvider>
              <ChatProvider>
                <IOSSimulationProvider>
                  <CompanionModeProvider>
                  <PaymentProvider>
                  <NetworkStatus />
                  <AppContent />
                </PaymentProvider>
              </CompanionModeProvider>
            </IOSSimulationProvider>
          </ChatProvider>
        </NotificationProvider>
          </AppDataCacheProvider>
        </AuthProvider>
        <Toast 
          position="top"
          visibilityTime={3000}
          autoHide={true}
          topOffset={topOffset20Percent}
          config={toastConfig as any}
        />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // White background instead of green to avoid flash
  },
});