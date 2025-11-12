import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  AppState,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/FirebaseAuthContext';
import SubscriptionApi from '../services/subscriptionApi';
import ProfileApi from '../services/profileApi';
import { theme } from '../constants/theme';

export default function SubscriptionScreen({ navigation }) {
  const { user } = useAuth();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [activeTab, setActiveTab] = useState('plans'); // 'plans', 'current', 'history'
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showSubscriptionsModal, setShowSubscriptionsModal] = useState(false);
  const [subscriptionHistory, setSubscriptionHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('stripe');
  const [autoRenewal, setAutoRenewal] = useState(true);
  const [paymentRedirectUrl, setPaymentRedirectUrl] = useState(null);
  const [appState, setAppState] = useState(AppState.currentState);
  
  // New state for enhanced subscription features
  const [calculatedStartDate, setCalculatedStartDate] = useState(null);
  const [showStartDateModal, setShowStartDateModal] = useState(false);
  const [renewalLoading, setRenewalLoading] = useState(false);
  const [autoRenewalLoading, setAutoRenewalLoading] = useState(false);
  const [autoRenewalEnabled, setAutoRenewalEnabled] = useState(false);
  const [showAutoRenewalModal, setShowAutoRenewalModal] = useState(false);
  const [showPaymentStatusModal, setShowPaymentStatusModal] = useState(false);

  // Handle app state changes for payment redirects
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      console.log('📱 App state changed:', appState, '->', nextAppState);
      
      // Enhanced app state detection
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        // App came back to foreground - check if payment was completed
        console.log('🔄 App returned to foreground, checking payment status...');
        console.log('🔄 Previous app state:', appState);
        console.log('🔄 New app state:', nextAppState);
        console.log('🔄 Payment redirect URL:', paymentRedirectUrl);
        
        // Add a small delay to ensure the app is fully active
        setTimeout(() => {
          handlePaymentReturn();
        }, 1000);
      }
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [appState, paymentRedirectUrl]);

  // Handle deep links for payment redirects (local handling for backward compatibility)
  useEffect(() => {
    const handleDeepLink = (url) => {
      console.log('🔗 SubscriptionScreen deep link received:', url);
      
      if (!url) return;
      
      try {
        // Parse the deep link URL
        const urlObj = new URL(url);
        const path = urlObj.pathname;
        const params = Object.fromEntries(urlObj.searchParams);
        
        console.log('🔗 Parsed URL - Path:', path, 'Params:', params);
        
        // Handle based on path (new structure)
        if (path === '/onboarding/subscription-success') {
          console.log('🔗 Payment success deep link detected (new structure)');
          handlePaymentSuccess();
        } else if (path === '/onboarding/subscription-cancel') {
          console.log('🔗 Payment cancel deep link detected (new structure)');
          handlePaymentCancel();
        } else {
          // Fallback to old structure for backward compatibility
          console.log('🔗 Checking old URL structure...');
          if (url.includes('subscription-success') || url.includes('payment-success') || url.includes('success')) {
            console.log('🔗 Payment success deep link detected (old structure)');
            handlePaymentSuccess();
          } else if (url.includes('subscription-cancel') || url.includes('payment-cancel') || url.includes('cancel')) {
            console.log('🔗 Payment cancel deep link detected (old structure)');
            handlePaymentCancel();
          } else {
            console.log('🔗 Unknown deep link:', url);
          }
        }
      } catch (error) {
        console.error('❌ Error parsing deep link in SubscriptionScreen:', error);
        // Fallback to old structure
        if (url.includes('subscription-success') || url.includes('payment-success') || url.includes('success')) {
          console.log('🔗 Payment success deep link detected (fallback)');
          handlePaymentSuccess();
        } else if (url.includes('subscription-cancel') || url.includes('payment-cancel') || url.includes('cancel')) {
          console.log('🔗 Payment cancel deep link detected (fallback)');
          handlePaymentCancel();
        }
      }
    };

    // Listen for incoming links
    const linkingSubscription = Linking.addEventListener('url', (event) => {
      console.log('🔗 Linking event received:', event);
      handleDeepLink(event.url);
    });

    // Check for initial URL if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('🔗 Initial URL found:', url);
        handleDeepLink(url);
      }
    }).catch((error) => {
      console.error('❌ Error getting initial URL:', error);
    });

    return () => linkingSubscription?.remove();
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  // Fetch auto-renewal status when subscription data is available
  useEffect(() => {
    if (currentSubscription?.subscription?.id) {
      fetchAutoRenewalStatus();
    }
  }, [currentSubscription]);

  /**
   * Handle payment return from external browser
   */
  const handlePaymentReturn = async () => {
    console.log('🔄 Payment return handler called');
    console.log('🔄 Payment redirect URL:', paymentRedirectUrl);
    console.log('🔄 Current app state:', appState);
    
    // Only process payment return if there's actually a payment redirect URL
    if (!paymentRedirectUrl) {
      console.log('🔄 No payment redirect URL found, skipping payment return check');
      return;
    }
    
    // Always try to refresh subscription data when app returns to foreground
    try {
      console.log('🔄 Refreshing subscription data...');
      const updatedSubscription = await SubscriptionApi.getCurrentSubscription();
      console.log('🔄 Updated subscription data:', updatedSubscription);
      
      if (updatedSubscription) {
        setCurrentSubscription(updatedSubscription);
        
        // Check if subscription status changed (indicating successful payment)
        if (updatedSubscription.subscription?.status === 'ACTIVE') {
          Toast.show({
            type: 'success',
            text1: 'Paiement réussi',
            text2: 'Votre abonnement a été activé avec succès!',
          });
        } else if (updatedSubscription.subscription?.status === 'PENDING') {
          Toast.show({
            type: 'info',
            text1: 'Paiement en cours',
            text2: 'Votre paiement est en cours de traitement.',
          });
        } else {
          // If no status change detected, show a generic message
          Toast.show({
            type: 'info',
            text1: 'Retour de paiement',
            text2: 'Vérifiez le statut de votre abonnement.',
          });
        }
      } else {
        console.log('🔄 No subscription data found');
        Toast.show({
          type: 'info',
          text1: 'Retour de paiement',
          text2: 'Vérifiez le statut de votre abonnement.',
        });
      }
    } catch (error) {
      console.error('❌ Error checking payment status:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de vérifier le statut du paiement.',
      });
    } finally {
      // Clear the redirect URL after processing
      setPaymentRedirectUrl(null);
    }
  };

  /**
   * Handle successful payment
   */
  const handlePaymentSuccess = async () => {
    console.log('✅ Payment success detected');
    try {
      // Refresh subscription data
      const updatedSubscription = await SubscriptionApi.getCurrentSubscription();
      if (updatedSubscription) {
        setCurrentSubscription(updatedSubscription);
      }
      
      Toast.show({
        type: 'success',
        text1: 'Paiement réussi',
        text2: 'Votre abonnement a été activé avec succès!',
      });
    } catch (error) {
      console.error('❌ Error handling payment success:', error);
    }
  };

  /**
   * Handle cancelled payment
   */
  const handlePaymentCancel = () => {
    console.log('❌ Payment cancelled');
    Toast.show({
      type: 'info',
      text1: 'Paiement annulé',
      text2: 'Votre paiement a été annulé.',
    });
  };

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      console.log('💳 Subscription: Fetching subscription data...');

      // Fetch all data in parallel
      const [plansData, subscriptionData, profileData] = await Promise.all([
        SubscriptionApi.getPlans(),
        SubscriptionApi.getCurrentSubscription(),
        ProfileApi.getProfile()
      ]);

      setPlans(plansData);
      setCurrentSubscription(subscriptionData);
      setProfileData(profileData);

      console.log('✅ Subscription: All data fetched successfully');
    } catch (error) {
      console.error('❌ Subscription: Error fetching data:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur de chargement',
        text2: 'Impossible de charger les données d\'abonnement',
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch auto-renewal status
   */
  const fetchAutoRenewalStatus = async () => {
    try {
      const subscriptionId = currentSubscription?.subscription?.id;
      if (!subscriptionId) return;

      const status = await SubscriptionApi.getAutoRenewalStatus(subscriptionId);
      setAutoRenewalEnabled(status.enabled);
    } catch (error) {
      console.error('❌ Error fetching auto-renewal status:', error);
    }
  };

  /**
   * Calculate subscription start date
   */
  const calculateSubscriptionStartDate = async (planId) => {
    try {
      const response = await SubscriptionApi.calculateStartDate(planId);
      setCalculatedStartDate(response.startDate);
      return response.startDate;
    } catch (error) {
      console.error('❌ Error calculating start date:', error);
      const fallbackDate = new Date();
      setCalculatedStartDate(fallbackDate);
      return fallbackDate;
    }
  };

  /**
   * Handle manual subscription renewal
   */
  const handleManualRenewal = async () => {
    try {
      setRenewalLoading(true);
      console.log('🔄 Manual renewal initiated...');

      const response = await SubscriptionApi.renewSubscription();
      
      // Refresh subscription data
      await fetchSubscriptionData();
      
      Toast.show({
        type: 'success',
        text1: 'Renouvellement réussi',
        text2: 'Votre abonnement a été renouvelé avec succès!',
      });

      console.log('✅ Manual renewal completed successfully');
    } catch (error) {
      console.error('❌ Error during manual renewal:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur de renouvellement',
        text2: 'Impossible de renouveler votre abonnement. Veuillez réessayer.',
      });
    } finally {
      setRenewalLoading(false);
    }
  };

  /**
   * Handle auto-renewal toggle
   */
  const handleAutoRenewalToggle = async (enabled) => {
    try {
      setAutoRenewalLoading(true);
      const subscriptionId = currentSubscription?.subscription?.id;
      
      if (!subscriptionId) {
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: 'Aucun abonnement trouvé',
        });
        return;
      }

      if (enabled) {
        await SubscriptionApi.enableAutoRenewal(subscriptionId);
        Toast.show({
          type: 'success',
          text1: 'Renouvellement automatique activé',
          text2: 'Votre abonnement sera renouvelé automatiquement',
        });
      } else {
        await SubscriptionApi.disableAutoRenewal(subscriptionId);
        Toast.show({
          type: 'error',
          text1: 'Renouvellement automatique désactivé',
          text2: 'Votre abonnement ne sera plus renouvelé automatiquement',
        });
      }

      setAutoRenewalEnabled(enabled);
    } catch (error) {
      console.error('❌ Error toggling auto-renewal:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de modifier le renouvellement automatique',
      });
    } finally {
      setAutoRenewalLoading(false);
    }
  };

  const fetchSubscriptionHistory = async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    
    try {
      console.log('💳 Fetching subscription history...');
      const response = await SubscriptionApi.getHistory();
      
      console.log('💳 Raw response:', response);
      
      // The API returns { success: true, data: [...] } directly from SubscriptionApi.getHistory()
      if (response && response.success) {
        const historyData = response.data || [];
        console.log('💳 Setting subscription history:', historyData);
        console.log('💳 History data length:', historyData.length);
        setSubscriptionHistory(historyData);
        console.log('✅ Subscription history fetched successfully');
      } else {
        setHistoryError('Erreur lors du chargement de l\'historique des abonnements.');
        console.error('❌ Subscription history error:', response);
      }
    } catch (error) {
      console.error('❌ Error fetching subscription history:', error);
      setHistoryError('Erreur lors du chargement de l\'historique des abonnements.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleViewSubscriptions = () => {
    setShowSubscriptionsModal(true);
    fetchSubscriptionHistory();
  };

  const handleRetryPayment = async (subscriptionId) => {
    try {
      console.log('💳 Retrying payment for subscription:', subscriptionId);
      const response = await SubscriptionApi.retryPayment(subscriptionId);
      
      if (response && response.success) {
        Toast.show({
          type: 'success',
          text1: 'Paiement relancé',
          text2: 'Votre paiement a été relancé avec succès',
        });
        // Refresh the history
        fetchSubscriptionHistory();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: 'Impossible de relancer le paiement',
        });
      }
    } catch (error) {
      console.error('❌ Error retrying payment:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de relancer le paiement',
      });
    }
  };

  const handlePlanSelection = (plan) => {
    setSelectedPlan(plan);
    console.log('💳 Plan selected:', plan.name);
  };

  const isPlanClickable = (plan) => {
    if (!currentSubscription || !currentSubscription.hasSubscription) {
      // No current subscription - all plans are clickable
      return true;
    }

    const subscription = currentSubscription.subscription;
    
    // Free trial active - all plans are clickable
    if (subscription.isTrial === true) {
      return true;
    }

    // Active paid subscription
    if (subscription.status === 'ACTIVE' && subscription.isTrial === false) {
      // Check if this plan is the current plan
      if (plan.id === subscription.plan?.id) {
        return false; // Current plan is NOT clickable
      } else {
        return true; // Other plans are clickable (for upgrading/downgrading)
      }
    }

    // Inactive/cancelled subscription - all plans are clickable
    if (subscription.status !== 'ACTIVE') {
      return true;
    }

    return true; // Default fallback
  };

  const getButtonText = (plan) => {
    if (!currentSubscription || !currentSubscription.hasSubscription) {
      return plan.isFree ? "Commencer avec l'essai gratuit" : "S'abonner";
    }

    const subscription = currentSubscription.subscription;
    
    // Free trial active
    if (subscription.isTrial === true) {
      if (plan.id === subscription.plan?.id) {
        return "Plan actuel";
      } else {
        return "Mettre à jour";
      }
    }

    // Active paid subscription
    if (subscription.status === 'ACTIVE' && subscription.isTrial === false) {
      if (plan.id === subscription.plan?.id) {
        return "Plan actuel";
      } else {
        return "Changer de plan";
      }
    }

    // Inactive/cancelled subscription
    if (subscription.status !== 'ACTIVE') {
      return "Réactiver";
    }

    return "S'abonner"; // Default fallback
  };

  const handleSubscribe = async (plan) => {
    // Check if plan is clickable
    if (!isPlanClickable(plan)) {
      Toast.show({
        type: 'info',
        text1: 'Plan actuel',
        text2: 'Vous êtes déjà abonné à ce plan',
      });
      return;
    }

    try {
      // Calculate start date before showing payment modal
      const startDate = await calculateSubscriptionStartDate(plan.id);
      console.log('📅 Calculated start date:', startDate);
      
      setSelectedPlan(plan);
      setCalculatedStartDate(startDate);
      setShowStartDateModal(true);
    } catch (error) {
      console.error('❌ Error calculating start date:', error);
      // Fallback to immediate payment modal
      setSelectedPlan(plan);
      setShowPaymentModal(true);
    }
  };

  const handlePaymentMethodSelect = (method) => {
    setSelectedPaymentMethod(method);
  };

  /**
   * Confirm subscription start date and proceed to payment
   */
  const confirmSubscriptionStart = () => {
    setShowStartDateModal(false);
    setShowPaymentModal(true);
  };

  const handlePaymentContinue = async () => {
    try {
      setProcessingPayment(true);
      setShowPaymentModal(false);
      
      console.log('💳 Processing payment for plan:', selectedPlan.name);
      console.log('💳 Payment method:', selectedPaymentMethod);

      if (selectedPlan.isFree) {
        // Handle free trial activation
        console.log('💳 Activating free trial...');
        Toast.show({
          type: 'success',
          text1: 'Essai gratuit activé',
          text2: 'Votre essai gratuit a été activé',
        });
        
        // Update onboarding progress
        await ProfileApi.updateProgress({
          step: 'subscription',
          completed: true
        });
        
        if (onNext) onNext();
        return;
      }

      // Create checkout session based on payment method
      const sessionData = {
        subscriptionPlanId: selectedPlan.id,
        clientType: 'mobile', // Explicitly specify mobile client
        // URLs will be automatically constructed as deep links by backend
      };

      let checkoutData;
      if (selectedPaymentMethod === 'paypal') {
        checkoutData = await SubscriptionApi.createPayPalOrder(sessionData);
      } else {
        checkoutData = await SubscriptionApi.createStripeCheckoutSession(sessionData);
      }

      if (checkoutData?.url || checkoutData?.approvalUrl) {
        let url = checkoutData.url || checkoutData.approvalUrl;
        
        console.log('🔗 Original payment URL:', url);
        console.log('🔗 URL type:', typeof url);
        console.log('🔗 URL length:', url.length);
        console.log('🔗 URL includes lasocoach:', url.includes('lasocoach'));
        console.log('🔗 URL includes com.laso.coach:', url.includes('com.laso.coach'));
        console.log('🔗 URL includes double slash:', url.includes('//'));
        
        // Enhanced URL conversion logic for new structure
        if (url.includes('app.lasocoach.com') || url.includes('lasocoach.com')) {
          // Convert web URLs to app deep links with new structure
          if (url.includes('subscription-success') || url.includes('payment-success')) {
            url = 'lasocoach://onboarding/subscription-success';
          } else if (url.includes('subscription-cancel') || url.includes('payment-cancel')) {
            url = 'lasocoach://onboarding/subscription-cancel';
          } else if (url.includes('success')) {
            url = 'lasocoach://onboarding/subscription-success';
          } else if (url.includes('cancel')) {
            url = 'lasocoach://onboarding/subscription-cancel';
          }
        }
        
        console.log('🔗 Converted payment URL:', url);
        console.log('🔗 Converted URL type:', typeof url);
        console.log('🔗 Converted URL length:', url.length);
        console.log('🔗 Converted URL includes lasocoach:', url.includes('lasocoach'));
        console.log('🔗 Converted URL includes com.laso.coach:', url.includes('com.laso.coach'));
        console.log('🔗 Converted URL includes double slash:', url.includes('//'));
        
        // Store the redirect URL for when user returns to app
        setPaymentRedirectUrl(url);
        
        try {
          const supported = await Linking.canOpenURL(url);
          console.log('🔗 URL supported:', supported);
          
          if (supported) {
            console.log('🔗 Opening payment URL:', url);
            await Linking.openURL(url);
          } else {
            console.log('🔗 URL not supported, trying to open anyway');
            await Linking.openURL(url);
          }
        } catch (error) {
          console.error('❌ Error opening payment URL:', error);
          Alert.alert(
            'Erreur',
            'Impossible d\'ouvrir la page de paiement',
            [{ text: 'OK' }]
          );
        }
      }

    } catch (error) {
      console.error('❌ Error processing payment:', error);
      
      // Handle specific error cases
      if (error.response?.data?.error?.code === 'ACTIVE_SUBSCRIPTION_EXISTS') {
        Toast.show({
          type: 'error',
          text1: 'Abonnement actif',
          text2: 'Vous avez déjà un abonnement actif. Impossible de créer un nouvel abonnement.',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erreur de paiement',
          text2: 'Impossible de traiter votre paiement',
        });
      }
    } finally {
      setProcessingPayment(false);
    }
  };







  const renderFAQLink = () => (
    <TouchableOpacity style={styles.faqLinkContainer}>
      <Text style={styles.faqLinkText}>
        Vous avez des questions? Consultez notre centre d'aide et FAQ
      </Text>
    </TouchableOpacity>
  );

  const renderSubscriptionCard = () => (
    <View style={styles.infoCard}>
      <Text style={styles.cardTitle}>Abonnement</Text>
      <Text style={styles.planName}>
        {currentSubscription?.subscription?.planName || 'Aucun abonnement'}
      </Text>
      
      {/* Days remaining display */}
      {currentSubscription?.daysRemaining !== undefined && (
        <Text style={[
          styles.daysRemaining,
          currentSubscription.daysRemaining <= 7 ? styles.daysRemainingWarning : styles.daysRemainingNormal
        ]}>
          {currentSubscription.daysRemaining} jours restants
        </Text>
      )}
      
      <Text style={styles.subscriptionDates}>
        Début de souscription: {currentSubscription?.subscription?.startDate ? 
          new Date(currentSubscription.subscription.startDate).toLocaleDateString('fr-FR') : 'Non défini'}
      </Text>
      <Text style={styles.subscriptionDates}>
        Fin de souscription: {currentSubscription?.subscription?.endDate ? 
          new Date(currentSubscription.subscription.endDate).toLocaleDateString('fr-FR') : 'Non défini'}
      </Text>
      
      {/* Manual renewal button for expiring subscriptions */}
      {currentSubscription?.daysRemaining <= 7 && currentSubscription?.daysRemaining > 0 && (
        <TouchableOpacity 
          style={[styles.renewalButton, renewalLoading && styles.renewalButtonDisabled]}
          onPress={handleManualRenewal}
          disabled={renewalLoading}
        >
          {renewalLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.renewalButtonText}>Renouveler l'abonnement</Text>
          )}
        </TouchableOpacity>
      )}
      
      {/* Auto-renewal toggle */}
      {currentSubscription?.subscription?.id && (
        <View style={styles.autoRenewalContainer}>
          <Text style={styles.autoRenewalLabel}>Renouvellement automatique</Text>
          <Switch 
            value={autoRenewalEnabled}
            onValueChange={handleAutoRenewalToggle}
            disabled={autoRenewalLoading}
            trackColor={{ false: '#CCCCCC', true: '#4CAF50' }}
            thumbColor={autoRenewalEnabled ? '#FFFFFF' : '#FFFFFF'}
          />
          {autoRenewalLoading && (
            <ActivityIndicator size="small" color="#4CAF50" style={styles.autoRenewalLoading} />
          )}
        </View>
      )}
      
      <TouchableOpacity style={styles.cardButton} onPress={handleViewSubscriptions}>
        <Text style={styles.cardButtonText}>Voir les factures</Text>
      </TouchableOpacity>
      
      {/* Manual payment status check button */}
      <TouchableOpacity 
        style={[styles.cardButton, { marginTop: 8, backgroundColor: '#FF9800' }]} 
        onPress={() => setShowPaymentStatusModal(true)}
      >
        <Text style={styles.cardButtonText}>Vérifier le statut du paiement</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPaymentMethodCard = () => (
    <View style={styles.infoCard}>
      <Text style={styles.cardTitle}>Méthode de paiement</Text>
      <Text style={styles.paymentMethod}>
        {currentSubscription?.subscription?.payment?.paymentMethod === 'paypal' ? 'PayPal' : 'Carte bancaire'}
        {currentSubscription?.subscription?.payment?.paymentMethod === 'paypal' && 
          ` (${currentSubscription.subscription.payment.email || 'user@example.com'})`}
      </Text>
      <Text style={styles.paymentDetails}>
        Mis à jour le : {currentSubscription?.subscription?.payment?.paymentDate ? 
          new Date(currentSubscription.subscription.payment.paymentDate).toLocaleDateString('fr-FR') : '-'}
      </Text>
      <Text style={styles.paymentDetails}>
        Dernier paiement : ${currentSubscription?.subscription?.payment?.amount || 0} {currentSubscription?.subscription?.payment?.currency || 'USD'}
      </Text>
    </View>
  );

  const renderSubscriptionPlans = () => (
    <View style={styles.plansContainer}>
      {plans.map((plan) => {
        // Determine background color based on plan name
        let backgroundColor = '#4CAF50'; // Default green
        let buttonColor = '#45A049'; // Default button color
        
        if (plan.name.toLowerCase().includes('premium')) {
          backgroundColor = '#8B5CF6'; // Purple for Premium
          buttonColor = '#7C3AED'; // Darker purple for button
        } else if (plan.name.toLowerCase().includes('flexy')) {
          backgroundColor = '#FF6B35'; // Orange for Flexy
          buttonColor = '#E55A2B'; // Darker orange for button
        } else if (plan.name.toLowerCase().includes('basic')) {
          backgroundColor = '#2196F3'; // Blue for Basic
          buttonColor = '#1976D2'; // Darker blue for button
        }
        
        return (
          <View key={plan.id} style={styles.planCard}>
            <Image 
              source={{ uri: plan.imageUrl || 'https://via.placeholder.com/300x150?text=Plan' }}
              style={styles.planImage}
            />
            <View style={[styles.planContent, { backgroundColor: backgroundColor }]}>
              <Text style={styles.planTitle}>{plan.name}</Text>
              <View style={styles.planPricing}>
                {plan.originalPrice > 0 && plan.originalPrice !== plan.price && (
                  <Text style={styles.planOldPrice}>${plan.originalPrice}</Text>
                )}
                <Text style={styles.planCurrentPrice}>
                  {plan.isFree ? 'Gratuit' : `$${plan.price || plan.effectivePrice || plan.discountPrice}`}
                  {!plan.isFree && plan.duration && ` / ${SubscriptionApi.getBillingPeriod(plan.duration)}`}
                </Text>
                {plan.isFree && (
                  <Text style={styles.trialDuration}>({plan.duration} jours)</Text>
                )}
              </View>
                          <TouchableOpacity 
              style={[
                styles.subscribeButton, 
                { 
                  backgroundColor: isPlanClickable(plan) ? buttonColor : '#CCCCCC',
                  opacity: isPlanClickable(plan) ? 1 : 0.6
                }
              ]}
              onPress={() => handleSubscribe(plan)}
              disabled={processingPayment || !isPlanClickable(plan)}
            >
              {processingPayment ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.subscribeButtonText}>{getButtonText(plan)}</Text>
              )}
            </TouchableOpacity>
              <Text style={styles.planTestText}>This is a {plan.name} Subscription plan</Text>
            </View>
            
            <View style={styles.planFeatures}>
              <Text style={styles.featuresTitle}>Inclus dans cette formule :</Text>
              {plan.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color={backgroundColor} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );

  const renderTermsLink = () => (
    <View style={styles.termsContainer}>
      <Text style={styles.termsText}>
        Sous réserve de conditions d'utilisation,{' '}
        <Text style={styles.termsLink} onPress={() => setShowTermsModal(true)}>
          Lire nos Termes de services
        </Text>
      </Text>
    </View>
  );

  const renderBillingCard = () => (
    <View style={styles.infoCard}>
      <Text style={styles.cardTitle}>Facturation</Text>
      <Text style={styles.billingAmount}>
        ${currentSubscription?.subscription?.plan?.effectivePrice || 0}/mois
      </Text>
      <Text style={styles.billingDetails}>
        Période de facturation: {currentSubscription?.subscription?.plan?.duration ? 
          SubscriptionApi.getBillingPeriod(currentSubscription.subscription.plan.duration) : 'Non définie'}
      </Text>
      <Text style={styles.billingDetails}>
        Date de Renouvellement: {currentSubscription?.subscription?.endDate ? 
          new Date(currentSubscription.subscription.endDate).toLocaleDateString('fr-FR') : 'Non définie'}
      </Text>
      <TouchableOpacity style={styles.cardButton}>
        <Text style={styles.cardButtonText}>Voir les factures</Text>
      </TouchableOpacity>
    </View>
  );



  const renderPaymentModal = () => (
    <Modal
      visible={showPaymentModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowPaymentModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.paymentModalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
              <Text style={styles.modalTitle}>Choisissez votre méthode de paiement</Text>
              <Text style={styles.modalSubtitle}>Sélectionnez votre méthode de paiement préférée</Text>
            </View>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowPaymentModal(false)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {selectedPlan && (
            <View style={styles.planSummary}>
              <Text style={styles.planSummaryName}>{selectedPlan.name}</Text>
              <Text style={styles.planSummaryPrice}>
                ${selectedPlan.price}/{SubscriptionApi.getBillingPeriod(selectedPlan.duration)}
              </Text>
            </View>
          )}

          <View style={styles.paymentMethods}>
            <TouchableOpacity 
              style={[
                styles.paymentMethodOption,
                selectedPaymentMethod === 'stripe' && styles.paymentMethodSelected
              ]}
              onPress={() => handlePaymentMethodSelect('stripe')}
            >
              <View style={styles.paymentMethodInfo}>
                <View style={styles.paymentMethodIcon}>
                  <Text style={styles.stripeIcon}>💳</Text>
                </View>
                <View style={styles.paymentMethodText}>
                  <Text style={styles.paymentMethodName}>Stripe</Text>
                  <Text style={styles.paymentMethodDesc}>Carte de crédit / débit</Text>
                </View>
              </View>
              {selectedPaymentMethod === 'stripe' && (
                <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.paymentMethodOption,
                selectedPaymentMethod === 'paypal' && styles.paymentMethodSelected
              ]}
              onPress={() => handlePaymentMethodSelect('paypal')}
            >
              <View style={styles.paymentMethodInfo}>
                <View style={styles.paymentMethodIcon}>
                  <Text style={styles.paypalIcon}>PayPal</Text>
                </View>
                <View style={styles.paymentMethodText}>
                  <Text style={styles.paymentMethodName}>PayPal</Text>
                  <Text style={styles.paymentMethodDesc}>Compte PayPal</Text>
                </View>
              </View>
              {selectedPaymentMethod === 'paypal' && (
                <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.autoRenewalOption}
            onPress={() => setAutoRenewal(!autoRenewal)}
          >
            <Ionicons 
              name={autoRenewal ? "checkbox" : "square-outline"} 
              size={24} 
              color="#007AFF" 
            />
            <Text style={styles.autoRenewalText}>Renouvellement automatique</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.continueButton}
            onPress={handlePaymentContinue}
            disabled={processingPayment}
          >
            {processingPayment ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.continueButtonText}>
                Continuer avec {selectedPaymentMethod === 'stripe' ? 'Stripe' : 'PayPal'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderTermsModal = () => (
    <Modal
      visible={showTermsModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowTermsModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.termsModalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Termes de services</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowTermsModal(false)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.termsContent}>
            <Text style={styles.termsSectionTitle}>1. Acceptation des termes</Text>
            <Text style={styles.termsText}>
              En utilisant l'application LaSo Coach, vous acceptez d'être lié par ces termes de service.
            </Text>

            <Text style={styles.termsSectionTitle}>2. Description du service</Text>
            <Text style={styles.termsText}>
              LaSo Coach est une application de coaching nutritionnel et de bien-être qui propose des plans personnalisés, des conseils et un suivi de vos objectifs.
            </Text>

            <Text style={styles.termsSectionTitle}>3. Abonnements et paiements</Text>
            <Text style={styles.termsText}>
              Les abonnements sont facturés automatiquement selon la période choisie. Vous pouvez annuler votre abonnement à tout moment.
            </Text>

            <Text style={styles.termsSectionTitle}>4. Confidentialité</Text>
            <Text style={styles.termsText}>
              Vos données personnelles sont protégées conformément à notre politique de confidentialité.
            </Text>

            <Text style={styles.termsSectionTitle}>5. Limitation de responsabilité</Text>
            <Text style={styles.termsText}>
              LaSo Coach ne peut être tenu responsable des résultats obtenus ou non obtenus grâce à l'utilisation de l'application.
            </Text>
          </ScrollView>

          <TouchableOpacity 
            style={styles.closeTermsButton}
            onPress={() => setShowTermsModal(false)}
          >
            <Text style={styles.closeTermsButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'ACTIVE':
        return { backgroundColor: '#4CAF50', color: '#FFFFFF' };
      case 'PENDING':
        return { backgroundColor: '#FF9800', color: '#FFFFFF' };
      case 'EXPIRED':
      case 'CANCELLED':
        return { backgroundColor: '#F44336', color: '#FFFFFF' };
      default:
        return { backgroundColor: '#9E9E9E', color: '#FFFFFF' };
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'Actif';
      case 'PENDING':
        return 'En attente';
      case 'EXPIRED':
        return 'Expiré';
      case 'CANCELLED':
        return 'Annulé';
      default:
        return status;
    }
  };

  const renderPaymentStatusModal = () => (
    <Modal
      visible={showPaymentStatusModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowPaymentStatusModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.selectionModalContainer}>
          <View style={styles.selectionModalHeader}>
            <Text style={styles.selectionModalTitle}>Vérifier le statut du paiement</Text>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowPaymentStatusModal(false)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.paymentStatusContent}>
            <Text style={styles.paymentStatusText}>
              Si vous avez terminé votre paiement mais que l'app n'a pas détecté le succès, 
              cliquez sur "Vérifier le statut" pour rafraîchir vos données d'abonnement.
            </Text>
            
            <TouchableOpacity 
              style={styles.checkStatusButton}
              onPress={async () => {
                try {
                  await handlePaymentReturn();
                  setShowPaymentStatusModal(false);
                } catch (error) {
                  console.error('Error checking payment status:', error);
                }
              }}
            >
              <Text style={styles.checkStatusButtonText}>Vérifier le statut</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderStartDateConfirmationModal = () => (
    <Modal
      visible={showStartDateModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowStartDateModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.selectionModalContainer}>
          <View style={styles.selectionModalHeader}>
            <Text style={styles.selectionModalTitle}>Confirmer le début d'abonnement</Text>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowStartDateModal(false)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.startDateContent}>
            <View style={styles.startDateInfo}>
              <Ionicons name="calendar" size={48} color={theme.colors.primary} />
              <Text style={styles.startDateTitle}>Date de début d'abonnement</Text>
              <Text style={styles.startDateValue}>
                {calculatedStartDate ? new Date(calculatedStartDate).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'À déterminer'}
              </Text>
            </View>
            
            <Text style={styles.startDateDescription}>
              Votre abonnement {selectedPlan?.name} commencera à partir de cette date.
              {currentSubscription?.subscription?.endDate && (
                <Text style={styles.startDateNote}>
                  {'\n'}Note: Cette date a été calculée pour éviter toute interruption de service.
                </Text>
              )}
            </Text>
            
            <View style={styles.saveModalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowStartDateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={confirmSubscriptionStart}
              >
                <Text style={styles.confirmButtonText}>Confirmer et procéder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderSubscriptionsModal = () => {
    console.log('💳 Rendering subscriptions modal with state:', {
      showSubscriptionsModal,
      historyLoading,
      historyError,
      subscriptionHistoryLength: subscriptionHistory.length,
      subscriptionHistory: subscriptionHistory
    });
    
    return (
    <Modal
      visible={showSubscriptionsModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowSubscriptionsModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.subscriptionsModalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Historique des factures</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowSubscriptionsModal(false)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {historyLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Chargement...</Text>
            </View>
          ) : historyError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color="#F44336" />
              <Text style={styles.errorText}>{historyError}</Text>
            </View>
          ) : subscriptionHistory.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-outline" size={48} color="#9E9E9E" />
              <Text style={styles.emptyText}>Aucun abonnement trouvé.</Text>
            </View>
          ) : (
            <ScrollView style={styles.subscriptionsContent} showsVerticalScrollIndicator={false}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderText}>Plan</Text>
                <Text style={styles.tableHeaderText}>Statut</Text>
                <Text style={styles.tableHeaderText}>Début</Text>
                <Text style={styles.tableHeaderText}>Fin</Text>
                <Text style={styles.tableHeaderText}>Prix</Text>
                <Text style={styles.tableHeaderText}>Paiement</Text>
                <Text style={styles.tableHeaderText}>Actions</Text>
              </View>

              {/* Table Rows */}
              {subscriptionHistory.map((subscription, index) => {
                const statusStyle = getStatusBadgeStyle(subscription.status);
                const statusText = getStatusText(subscription.status);
                const planName = subscription.plan?.name || subscription.planName || 'Plan inconnu';
                const price = subscription.plan?.effectivePrice || subscription.plan?.originalPrice || 0;
                const startDate = subscription.startDate ? new Date(subscription.startDate).toLocaleDateString('fr-FR') : 'Non défini';
                const endDate = subscription.endDate ? new Date(subscription.endDate).toLocaleDateString('fr-FR') : 'Non défini';
                const paymentStatus = subscription.payment?.status || 'Aucun';
                const paymentMethod = subscription.payment?.paymentMethod || 'Aucun';
                const paymentAmount = subscription.payment?.amount || 0;
                const paymentCurrency = subscription.payment?.currency || 'USD';

                return (
                  <View key={subscription.id || index} style={styles.tableRow}>
                    <View style={styles.planCell}>
                      <Text style={styles.planNameText}>{planName}</Text>
                      {subscription.isTrial && (
                        <Text style={styles.trialBadge}>Essai gratuit</Text>
                      )}
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
                      <Text style={[styles.statusText, { color: statusStyle.color }]}>{statusText}</Text>
                    </View>
                    <Text style={styles.tableCell}>{startDate}</Text>
                    <Text style={styles.tableCell}>{endDate}</Text>
                    <View style={styles.priceCell}>
                      {subscription.plan?.hasDiscount ? (
                        <View>
                          <Text style={styles.originalPrice}>${subscription.plan.originalPrice}</Text>
                          <Text style={styles.discountPrice}>${subscription.plan.effectivePrice}</Text>
                        </View>
                      ) : (
                        <Text style={styles.priceText}>{price === 0 ? 'Gratuit' : `$${price}`}</Text>
                      )}
                    </View>
                    <View style={styles.paymentCell}>
                      {subscription.payment ? (
                        <View>
                          <Text style={styles.paymentMethodText}>
                            {paymentMethod === 'stripe' ? 'Carte' : paymentMethod === 'paypal' ? 'PayPal' : paymentMethod}
                          </Text>
                          <Text style={styles.paymentStatusText}>
                            {paymentStatus === 'COMPLETED' ? 'Payé' : paymentStatus === 'PENDING' ? 'En attente' : paymentStatus}
                          </Text>
                          {paymentAmount > 0 && (
                            <Text style={styles.paymentAmountText}>${paymentAmount} {paymentCurrency}</Text>
                          )}
                        </View>
                      ) : (
                        <Text style={styles.noPaymentText}>Aucun paiement</Text>
                      )}
                    </View>
                    <View style={styles.actionsCell}>
                      {subscription.status === 'PENDING' && (
                        <TouchableOpacity 
                          style={styles.retryButton}
                          onPress={() => handleRetryPayment(subscription.id)}
                        >
                          <Text style={styles.retryButtonText}>Relancer</Text>
                        </TouchableOpacity>
                      )}
                      {subscription.status === 'ACTIVE' && subscription.daysRemaining <= 7 && (
                        <TouchableOpacity 
                          style={styles.renewButton}
                          onPress={() => handleManualRenewal(subscription.id)}
                        >
                          <Text style={styles.renewButtonText}>Renouveler</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement des abonnements...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderFAQLink()}
        {renderSubscriptionCard()}
        {renderBillingCard()}
        {renderPaymentMethodCard()}
        {renderSubscriptionPlans()}
        {renderTermsLink()}
      </ScrollView>
      
      {/* Payment Method Modal */}
      {renderPaymentModal()}
      
      {/* Terms of Service Modal */}
      {renderTermsModal()}
      
      {/* Subscriptions History Modal */}
      {renderSubscriptionsModal()}
      
      {/* Start Date Confirmation Modal */}
      {renderStartDateConfirmationModal()}
      
      {/* Payment Status Check Modal */}
      {renderPaymentStatusModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8F0',
  },

  content: {
    flex: 1,
    paddingTop: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  profileSection: {
    backgroundColor: '#E8F5E8',
    margin: 20,
    borderRadius: 12,
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  largeProfileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  profileHeaderText: {
    flex: 1,
  },
  profileTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  profileSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  motivationalContainer: {
    backgroundColor: '#FFF3E0',
    borderLeftWidth: 4,
    borderLeftColor: '#FFB74D',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  motivationalText: {
    fontSize: 14,
    color: '#E65100',
    textAlign: 'center',
    lineHeight: 20,
  },
  faqLinkContainer: {
    alignItems: 'flex-end',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  faqLinkText: {
    fontSize: 14,
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  subscriptionDates: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  billingAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  billingDetails: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  paymentMethod: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  paymentDetails: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  cardButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  cardButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  plansContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    position: 'relative',
    marginRight: 16,
  },
  measuringTape: {
    position: 'absolute',
    top: 20,
    right: -10,
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tapeNumbers: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  logoText: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logoTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    fontFamily: 'serif',
  },
  logoSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginLeft: 8,
    textTransform: 'uppercase',
  },
  logoRegistered: {
    fontSize: 12,
    color: theme.colors.text.primary,
    marginLeft: 4,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  planImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  planContent: {
    padding: 20,
  },
  planTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  planPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  planOldPrice: {
    fontSize: 16,
    color: '#FFFFFF',
    textDecorationLine: 'line-through',
    marginRight: 8,
    opacity: 0.8,
  },
  planCurrentPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  trialDuration: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 8,
    opacity: 0.9,
  },
  subscribeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  planTestText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.9,
  },
  planFeatures: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    marginLeft: 8,
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  termsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  termsText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  termsLink: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    width: '95%',
    maxWidth: 500,
    maxHeight: '85%',
  },
  termsModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    width: '90%',
    maxHeight: '80%',
  },
  subscriptionsModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalHeaderContent: {
    flex: 1,
    marginRight: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
  },
  planSummary: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  planSummaryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  planSummaryPrice: {
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  paymentMethods: {
    marginBottom: 20,
  },
  paymentMethodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 12,
  },
  paymentMethodSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodIcon: {
    marginRight: 12,
  },
  stripeIcon: {
    fontSize: 24,
  },
  paypalIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0070BA',
  },
  paymentMethodText: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  paymentMethodDesc: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  autoRenewalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  autoRenewalText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    marginLeft: 12,
  },
  continueButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  termsContent: {
    flex: 1,
    marginBottom: 20,
  },
  termsSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  closeTermsButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeTermsButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  // Subscription History Modal Styles
  subscriptionsContent: {
    flex: 1,
    marginTop: 16,
  },
  
  // Enhanced subscription card styles
  daysRemaining: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  daysRemainingNormal: {
    color: '#4CAF50',
  },
  daysRemainingWarning: {
    color: '#FF9800',
  },
  renewalButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  renewalButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  renewalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  autoRenewalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 16,
    paddingVertical: 8,
  },
  autoRenewalLabel: {
    fontSize: 16,
    color: theme.colors.text.primary,
    flex: 1,
  },
  autoRenewalLoading: {
    marginLeft: 8,
  },
  
  // Selection Modal Styles (matching ProfileScreen)
  selectionModalContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  selectionModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectionModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    flex: 1,
  },
  modalCloseButton: {
    padding: 4,
  },
  saveModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  
  // Start date confirmation modal styles
  startDateContent: {
    padding: 0,
  },
  startDateInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  startDateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  startDateValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
  },
  startDateDescription: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    lineHeight: 24,
    marginBottom: 32,
    textAlign: 'center',
  },
  startDateNote: {
    fontSize: 14,
    color: '#FF9800',
    fontStyle: 'italic',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.secondary,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  
  // Payment status modal styles
  paymentStatusContent: {
    padding: 0,
    alignItems: 'center',
  },
  paymentStatusText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  checkStatusButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  checkStatusButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 8,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'center',
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  planCell: {
    flex: 1,
    alignItems: 'center',
  },
  planNameText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  trialBadge: {
    fontSize: 10,
    color: '#4CAF50',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  priceCell: {
    flex: 1,
    alignItems: 'center',
  },
  priceText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: 'bold',
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  discountPrice: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  paymentCell: {
    flex: 1,
    alignItems: 'center',
  },
  paymentMethodText: {
    fontSize: 12,
    color: theme.colors.text.primary,
    fontWeight: 'bold',
  },
  paymentStatusText: {
    fontSize: 11,
    color: '#666',
  },
  paymentAmountText: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  noPaymentText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  statusBadge: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
    alignSelf: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionsCell: {
    flex: 1,
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  renewButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  renewButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#9E9E9E',
    textAlign: 'center',
    marginTop: 16,
  },
});
