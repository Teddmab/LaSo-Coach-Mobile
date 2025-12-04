import React, { useEffect, useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { StripeProvider } from '@stripe/stripe-react-native';
import { AuthProvider, useAuth } from './src/context/FirebaseAuthContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { ChatProvider } from './src/context/ChatContext';
import { initializeTokenManager } from './src/services/api';
import Config from './src/config/env';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import PasswordResetScreen from './src/screens/PasswordResetScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import { ActivityIndicator, View, StyleSheet, Linking } from 'react-native';
import Toast from 'react-native-toast-message';
import ErrorBoundary from './src/components/ErrorBoundary';
import NetworkStatus from './src/components/NetworkStatus';
import { RootStackParamList } from './src/types/navigation';
import './src/utils/consoleFilter';

const Stack = createStackNavigator<RootStackParamList>();

function AppContent() {
  const { isAuthenticated, authReady, loading } = useAuth();
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

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

  // Show loading screen while auth is initializing
  if (!authReady || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8BC34A" />
      </View>
    );
  }

  return (
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
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
        ) : (
          // Non-authenticated stack
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="PasswordReset" component={PasswordResetScreen} />
          </>
        )}
      </Stack.Navigator>
      <StatusBar style="light" />
    </NavigationContainer>
  );
}

export default function App() {
  console.log('📱 LaSo Coach App starting...');
  
  const [stripeKey, setStripeKey] = React.useState<string>(Config.STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');
  
  // Initialize TokenManager at app startup
  // This ensures AsyncStorage is ready before any API requests
  useEffect(() => {
    console.log('🔐 [Startup] Initializing app dependencies...');
    initializeTokenManager();
    
    // Try to fetch Stripe key from backend if not in config
    if (!Config.STRIPE_PUBLISHABLE_KEY || Config.STRIPE_PUBLISHABLE_KEY === 'pk_test_placeholder') {
      console.log('🔑 [Stripe] Attempting to fetch publishable key from backend...');
      const SubscriptionApi = require('./src/services/subscriptionApi').default;
      SubscriptionApi.getStripePublishableKey()
        .then((backendKey: string | null) => {
          if (backendKey) {
            console.log('✅ [Stripe] Publishable key loaded from backend');
            setStripeKey(backendKey);
          } else {
            console.warn('⚠️ [Stripe] Publishable key not found in backend. Using placeholder.');
            console.warn('⚠️ [Stripe] Please add STRIPE_PUBLISHABLE_KEY to your .env file or configure backend endpoint /payments/config');
          }
        })
        .catch((error: Error) => {
          console.warn('⚠️ [Stripe] Could not fetch key from backend:', error.message);
        });
    } else {
      console.log('✅ [Stripe] Publishable key loaded from configuration');
    }
  }, []);
  
  // Stripe publishable key - from config or backend
  const STRIPE_PUBLISHABLE_KEY = stripeKey;
  
  return (
    <ErrorBoundary>
      <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
        <AuthProvider>
          <NotificationProvider>
            <ChatProvider>
              <NetworkStatus />
              <AppContent />
            </ChatProvider>
          </NotificationProvider>
        </AuthProvider>
        <Toast 
          position="top"
          visibilityTime={5000}
          autoHide={true}
          topOffset={50}
        />
      </StripeProvider>
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
