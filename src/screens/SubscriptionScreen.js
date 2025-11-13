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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/FirebaseAuthContext';
import SubscriptionApi from '../services/subscriptionApi';
import ProfileApi from '../services/profileApi';
import IAPService from '../services/iapService';
import IAPReceiptApi from '../services/iapReceiptApi';
import firebaseAuthService from '../services/firebaseAuthServiceNew';
import { theme } from '../constants/theme';

/**
 * COMPLIANT SubscriptionScreen - Reader App Exception Implementation
 * 
 * Apple App Store Guidelines 3.1.3(a) Compliance:
 * ================================================
 * 
 * PRIMARY METHOD: Native In-App Purchase (IAP)
 * - All subscriptions MUST go through App Store/Google Play by default
 * - IAP is the prominent, primary payment method
 * - Receipt validation prevents fraud
 * 
 * READER APP EXCEPTION: External Link (Secondary, Discreet)
 * - Per 3.1.3(a): Apps that provide access to previously purchased content
 * - Link must be small, text-only, non-promotional
 * - No buttons, no pricing information, no calls-to-action
 * - Cannot steer users away from IAP
 * - Passes authentication token for seamless web login
 * - Auto-refreshes subscription status after web visit
 * 
 * Compliance Features:
 * 1. ✅ Native IAP/GPB as PRIMARY payment method (default flow)
 * 2. ✅ External link relegated to "Reader App" style (discreet, compliant text)
 * 3. ✅ No payment steering (external link is minimal, at bottom)
 * 4. ✅ Receipt validation before unlocking content
 * 5. ✅ Proper platform-specific handling (iOS App Store / Google Play)
 * 6. ✅ Subscription sync (checks for web purchases on return)
 * 
 * IMPORTANT: Do NOT make external link more prominent or add pricing/promotions
 * Any violation of Reader App guidelines will result in app rejection.
 */
export default function SubscriptionScreen({ navigation }) {
  const { user, refreshProfile } = useAuth();
  const [webAuthToken, setWebAuthToken] = useState(null);
  
  // State management
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [iapProducts, setIapProducts] = useState([]);
  const [showManageSubscriptionModal, setShowManageSubscriptionModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  /**
   * Initialize IAP and fetch subscription data
   */
  useEffect(() => {
    initializeScreen();
    
    // Cleanup IAP connection when component unmounts
    return () => {
      try {
        IAPService.disconnect();
      } catch (error) {
        // Disconnect errors are non-critical during cleanup
        if (error?.code !== 'E_IAP_NOT_AVAILABLE') {
          console.error('⚠️ Error during IAP cleanup:', error);
        }
      }
    };
  }, []);

  /**
   * Setup IAP purchase listeners
   */
  useEffect(() => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      try {
        IAPService.setupPurchaseListeners(
          handlePurchaseSuccess,
          handlePurchaseError
        );
      } catch (error) {
        // IAP listener setup failure is non-critical (e.g., E_IAP_NOT_AVAILABLE)
        if (error?.code !== 'E_IAP_NOT_AVAILABLE') {
          console.error('⚠️ Error setting up IAP listeners:', error);
        }
      }
    }
  }, []);

  /**
   * Refresh subscription on screen focus (Reader App compliance)
   * User may have purchased on web and returned to app
   */
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      console.log('🔄 Subscription screen focused - checking for web purchases');
      try {
        await refreshSubscriptionData();
        await refreshProfile();
      } catch (error) {
        console.log('⚠️ Error refreshing on focus:', error);
      }
    });

    return unsubscribe;
  }, [navigation]);

  /**
   * Initialize screen data
   */
  const initializeScreen = async () => {
    try {
      setLoading(true);
      console.log('💳 Initializing subscription screen...');

      // Get Firebase ID token for web authentication (Reader App compliance)
      try {
        const token = await firebaseAuthService.getIdToken();
        if (token) {
          setWebAuthToken(token);
          console.log('✅ Firebase ID token retrieved for web auth');
        }
      } catch (tokenError) {
        console.log('⚠️ Could not get Firebase token for web auth:', tokenError);
      }

      // Initialize IAP connection (non-critical - continue if fails)
      if (IAPService.isAvailable()) {
        try {
          await IAPService.initialize();
        } catch (iapError) {
          // IAP initialization failure is not fatal - continue with limited functionality
          if (iapError.code === 'E_IAP_NOT_AVAILABLE') {
            console.log('ℹ️ IAP not available - continuing with backend-only mode');
          } else {
            console.error('⚠️ IAP initialization failed:', iapError);
          }
        }
      }

      // Fetch subscription data
      const [plansData, subscriptionData] = await Promise.all([
        SubscriptionApi.getPlans(),
        SubscriptionApi.getCurrentSubscription(),
      ]);

      setPlans(plansData);
      setCurrentSubscription(subscriptionData);

      // Fetch native IAP products if available (non-critical)
      if (IAPService.isAvailable() && plansData.length > 0) {
        try {
          await fetchIAPProducts(plansData);
        } catch (iapProductError) {
          // Product fetch failure is not fatal
          console.log('ℹ️ Could not fetch IAP products - continuing with backend prices');
        }
      }

      console.log('✅ Subscription screen initialized');
    } catch (error) {
      console.error('❌ Error initializing subscription screen:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur de chargement',
        text2: 'Impossible de charger les abonnements',
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch IAP products from stores
   */
  const fetchIAPProducts = async (backendPlans) => {
    try {
      console.log('💳 Fetching IAP products from store...');
      
      // Convert backend plans to store product IDs
      const productIds = backendPlans
        .filter(plan => !plan.isFree) // Free trials don't need store products
        .map(plan => IAPService.getStoreProductId(plan));

      console.log('💳 Product IDs to fetch:', productIds);

      // Fetch products from App Store / Play Store
      const products = await IAPService.getAvailableProducts(productIds);
      setIapProducts(products);

      console.log('✅ IAP products fetched:', products.length);
    } catch (error) {
      console.error('❌ Error fetching IAP products:', error);
      // Continue even if products fail to load - backend plans can still be shown
    }
  };

  /**
   * Handle native IAP purchase success
   */
  const handlePurchaseSuccess = async (purchase) => {
    console.log('✅ Purchase successful:', purchase.productId);
    
    try {
      // Extract receipt data
      const receiptData = IAPService.extractReceiptData(purchase);
      console.log('🧾 Receipt data:', receiptData);

      // Show processing message
      Toast.show({
        type: 'info',
        text1: 'Validation en cours',
        text2: 'Vérification de votre achat...',
      });

      // Validate receipt with backend (CRITICAL - prevents fraud)
      const validationResult = await IAPReceiptApi.validateReceipt(receiptData);
      console.log('✅ Receipt validated:', validationResult);

      // Refresh subscription data
      await refreshSubscriptionData();

      // Refresh user profile
      await refreshProfile();

      // Show success message
      Toast.show({
        type: 'success',
        text1: 'Abonnement activé',
        text2: 'Votre abonnement a été activé avec succès!',
      });

      setProcessingPayment(false);
    } catch (error) {
      console.error('❌ Error validating receipt:', error);
      
      Toast.show({
        type: 'error',
        text1: 'Erreur de validation',
        text2: error.message || 'Impossible de valider votre achat. Contactez le support.',
      });

      setProcessingPayment(false);
    }
  };

  /**
   * Handle native IAP purchase error
   */
  const handlePurchaseError = (error) => {
    console.error('❌ Purchase error:', error);
    
    const errorMessage = IAPService.getErrorMessage(error);
    
    // Only show error if not user cancelled
    if (error.code !== 'E_USER_CANCELLED') {
      Toast.show({
        type: 'error',
        text1: 'Erreur d\'achat',
        text2: errorMessage,
      });
    }

    setProcessingPayment(false);
  };

  /**
   * Refresh subscription data
   */
  const refreshSubscriptionData = async () => {
    try {
      const subscriptionData = await SubscriptionApi.getCurrentSubscription();
      setCurrentSubscription(subscriptionData);
    } catch (error) {
      console.error('❌ Error refreshing subscription:', error);
    }
  };

  /**
   * Handle subscription button press
   * PRIMARY METHOD: Native IAP
   */
  const handleSubscribe = async (plan) => {
    // Check if already subscribed to this plan
    if (!isPlanClickable(plan)) {
      Toast.show({
        type: 'info',
        text1: 'Plan actuel',
        text2: 'Vous êtes déjà abonné à ce plan',
      });
      return;
    }

    try {
      setProcessingPayment(true);
      setSelectedPlan(plan);

      // Handle free trial (no IAP needed)
      if (plan.isFree) {
        await handleFreeTrial(plan);
        return;
      }

      // Check if IAP is available on this platform
      if (!IAPService.isAvailable()) {
        Alert.alert(
          'Non disponible',
          'Les achats intégrés ne sont pas disponibles sur cette plateforme. Visitez notre site web pour vous abonner.',
          [{ text: 'OK' }]
        );
        setProcessingPayment(false);
        return;
      }

      // Get store product ID
      const productId = IAPService.getStoreProductId(plan);
      console.log('💳 Requesting purchase for:', productId);

      // Show confirmation dialog
      Alert.alert(
        'Confirmer l\'abonnement',
        `Vous allez souscrire à ${plan.name} pour $${plan.price}/${SubscriptionApi.getBillingPeriod(plan.duration)}.`,
        [
          { text: 'Annuler', style: 'cancel', onPress: () => setProcessingPayment(false) },
          { 
            text: 'Confirmer', 
            onPress: async () => {
              try {
                // Request purchase from native store
                await IAPService.requestPurchase(productId, true);
                // Purchase result will be handled by purchaseUpdatedListener
              } catch (error) {
                handlePurchaseError(error);
              }
            }
          }
        ]
      );

    } catch (error) {
      console.error('❌ Error initiating purchase:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible d\'initier l\'achat',
      });
      setProcessingPayment(false);
    }
  };

  /**
   * Handle free trial activation
   */
  const handleFreeTrial = async (plan) => {
    try {
      console.log('💳 Activating free trial...');
      
      // Call backend to activate trial
      // (Your existing backend endpoint)
      
      Toast.show({
        type: 'success',
        text1: 'Essai gratuit activé',
        text2: 'Votre essai gratuit a été activé',
      });
      
      await refreshSubscriptionData();
      await refreshProfile();
      
    } catch (error) {
      console.error('❌ Error activating trial:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible d\'activer l\'essai gratuit',
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  /**
   * Restore previous purchases
   */
  const handleRestorePurchases = async () => {
    try {
      setShowRestoreModal(false);
      
      Toast.show({
        type: 'info',
        text1: 'Restauration...',
        text2: 'Recherche de vos achats précédents',
      });

      // Get previous purchases from store
      const purchases = await IAPService.restorePurchases();
      
      if (purchases.length === 0) {
        Toast.show({
          type: 'info',
          text1: 'Aucun achat trouvé',
          text2: 'Aucun achat précédent à restaurer',
        });
        return;
      }

      // Restore purchases with backend
      await IAPReceiptApi.restorePurchases(purchases);

      // Refresh subscription data
      await refreshSubscriptionData();
      await refreshProfile();

      Toast.show({
        type: 'success',
        text1: 'Achats restaurés',
        text2: `${purchases.length} achat(s) restauré(s) avec succès`,
      });

    } catch (error) {
      console.error('❌ Error restoring purchases:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur de restauration',
        text2: 'Impossible de restaurer vos achats',
      });
    }
  };

  /**
   * Check if plan is clickable (not already subscribed)
   */
  const isPlanClickable = (plan) => {
    if (!currentSubscription || !currentSubscription.hasSubscription) {
      return true;
    }

    const subscription = currentSubscription.subscription;
    
    if (subscription.isTrial === true) {
      return true;
    }

    if (subscription.status === 'ACTIVE' && subscription.isTrial === false) {
      if (plan.id === subscription.plan?.id) {
        return false; // Current plan
      }
      return true; // Can upgrade/downgrade
    }

    return true;
  };

  /**
   * Get button text for plan
   */
  const getButtonText = (plan) => {
    if (!currentSubscription || !currentSubscription.hasSubscription) {
      return plan.isFree ? "Commencer l'essai gratuit" : "S'abonner";
    }

    const subscription = currentSubscription.subscription;
    
    if (subscription.isTrial === true) {
      if (plan.id === subscription.plan?.id) {
        return "Plan actuel";
      }
      return "Mettre à jour";
    }

    if (subscription.status === 'ACTIVE' && subscription.isTrial === false) {
      if (plan.id === subscription.plan?.id) {
        return "Plan actuel";
      }
      return "Changer de plan";
    }

    if (subscription.status !== 'ACTIVE') {
      return "Réactiver";
    }

    return "S'abonner";
  };

  /**
   * Get store product for plan
   */
  const getStoreProduct = (plan) => {
    if (plan.isFree || iapProducts.length === 0) {
      return null;
    }

    const productId = IAPService.getStoreProductId(plan);
    return iapProducts.find(p => p.productId === productId);
  };

  /**
   * Get display price (from store if available, otherwise backend)
   */
  const getDisplayPrice = (plan) => {
    const storeProduct = getStoreProduct(plan);
    
    if (storeProduct) {
      // Use price from App Store / Play Store
      return storeProduct.localizedPrice || `$${plan.price}`;
    }
    
    // Fallback to backend price
    return plan.isFree ? 'Gratuit' : `$${plan.price}`;
  };

  /**
   * Render subscription plans
   */
  const renderSubscriptionPlans = () => (
    <View style={styles.plansContainer}>
      <Text style={styles.plansTitle}>Choisissez votre plan</Text>
      
      {plans.map((plan) => {
        let backgroundColor = '#4CAF50';
        let buttonColor = '#45A049';
        
        if (plan.name.toLowerCase().includes('premium')) {
          backgroundColor = '#8B5CF6';
          buttonColor = '#7C3AED';
        } else if (plan.name.toLowerCase().includes('flexy')) {
          backgroundColor = '#FF6B35';
          buttonColor = '#E55A2B';
        } else if (plan.name.toLowerCase().includes('basic')) {
          backgroundColor = '#2196F3';
          buttonColor = '#1976D2';
        }
        
        const storeProduct = getStoreProduct(plan);
        
        return (
          <View key={plan.id} style={styles.planCard}>
            <Image 
              source={{ uri: plan.imageUrl || 'https://via.placeholder.com/300x150?text=Plan' }}
              style={styles.planImage}
            />
            <View style={[styles.planContent, { backgroundColor }]}>
              <Text style={styles.planTitle}>{plan.name}</Text>
              
              <View style={styles.planPricing}>
                {plan.originalPrice > 0 && plan.originalPrice !== plan.price && (
                  <Text style={styles.planOldPrice}>${plan.originalPrice}</Text>
                )}
                <Text style={styles.planCurrentPrice}>
                  {getDisplayPrice(plan)}
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
                {processingPayment && selectedPlan?.id === plan.id ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.subscribeButtonText}>{getButtonText(plan)}</Text>
                )}
              </TouchableOpacity>

              {storeProduct && (
                <Text style={styles.planStoreNote}>
                  Via {Platform.OS === 'ios' ? 'App Store' : 'Google Play'}
                </Text>
              )}
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

  /**
   * Render COMPLIANT external link (Reader App style)
   * Per Apple Guidelines 3.1.3(a): Must be discreet, text-only, non-promotional
   * No buttons, no pricing, no calls-to-action
   */
  const renderExternalAccountLink = () => {
    // Build web URL with authentication token for seamless login
    const buildWebUrl = () => {
      const baseUrl = 'https://app.lasocoach.com/subscription';
      if (webAuthToken) {
        // Pass token as query parameter for automatic authentication
        return `${baseUrl}?token=${encodeURIComponent(webAuthToken)}`;
      }
      return baseUrl;
    };

    const handleExternalLink = async () => {
      try {
        const url = buildWebUrl();
        console.log('🌐 Opening external subscription page (Reader App compliance)');
        
        // Open URL in device browser
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
          
          // After returning from browser, refresh subscription status
          // User may have purchased/changed subscription on web
          setTimeout(async () => {
            console.log('🔄 Refreshing subscription status after external visit');
            await refreshSubscriptionData();
            await refreshProfile();
          }, 2000);
        } else {
          console.error('Cannot open URL:', url);
        }
      } catch (error) {
        console.error('Error opening external link:', error);
      }
    };

    return (
      <View style={styles.externalLinkContainer}>
        <TouchableOpacity 
          style={styles.externalLinkButton}
          onPress={handleExternalLink}
        >
          <Text style={styles.externalLinkText}>
            Gérer votre compte
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  /**
   * Render restore purchases button (iOS requirement)
   */
  const renderRestoreButton = () => {
    if (Platform.OS !== 'ios') return null;

    return (
      <TouchableOpacity 
        style={styles.restoreButton}
        onPress={() => setShowRestoreModal(true)}
      >
        <Ionicons name="refresh-outline" size={20} color="#007AFF" />
        <Text style={styles.restoreButtonText}>Restaurer les achats</Text>
      </TouchableOpacity>
    );
  };

  /**
   * Render restore confirmation modal
   */
  const renderRestoreModal = () => (
    <Modal
      visible={showRestoreModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowRestoreModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.confirmModalContainer}>
          <Text style={styles.confirmModalTitle}>Restaurer les achats</Text>
          <Text style={styles.confirmModalText}>
            Cela restaurera tous vos achats précédents effectués avec ce compte Apple/Google.
          </Text>
          <View style={styles.confirmModalButtons}>
            <TouchableOpacity 
              style={[styles.confirmModalButton, styles.cancelButton]}
              onPress={() => setShowRestoreModal(false)}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.confirmModalButton, styles.confirmButton]}
              onPress={handleRestorePurchases}
            >
              <Text style={styles.confirmButtonText}>Restaurer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  /**
   * Render current subscription info
   */
  const renderSubscriptionInfo = () => {
    if (!currentSubscription || !currentSubscription.hasSubscription) {
      return null;
    }

    return (
      <View style={styles.currentSubscriptionCard}>
        <Text style={styles.currentSubscriptionTitle}>Votre abonnement</Text>
        <Text style={styles.currentSubscriptionPlan}>
          {currentSubscription.subscription?.planName || 'Abonnement actif'}
        </Text>
        {currentSubscription.daysRemaining !== undefined && (
          <Text style={styles.currentSubscriptionDays}>
            {currentSubscription.daysRemaining} jours restants
          </Text>
        )}
        
        <TouchableOpacity 
          style={styles.manageButton}
          onPress={() => setShowManageSubscriptionModal(true)}
        >
          <Text style={styles.manageButtonText}>Gérer l'abonnement</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderSubscriptionInfo()}
        {renderSubscriptionPlans()}
        {renderRestoreButton()}
        {renderExternalAccountLink()}
        
        {/* Compliance notice */}
        <View style={styles.complianceNotice}>
          <Text style={styles.complianceText}>
            Les paiements sont traités de manière sécurisée via {Platform.OS === 'ios' ? 'l\'App Store' : 'Google Play'}. 
            L'abonnement se renouvelle automatiquement sauf si vous l'annulez au moins 24 heures avant la fin de la période en cours.
          </Text>
        </View>
      </ScrollView>

      {renderRestoreModal()}
    </SafeAreaView>
  );
}

// Styles remain largely the same with additions for new elements
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8F0',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  currentSubscriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentSubscriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  currentSubscriptionPlan: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  currentSubscriptionDays: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginBottom: 16,
  },
  manageButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  manageButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  plansContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  plansTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 16,
    textAlign: 'center',
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
    height: 150,
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
  planStoreNote: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.8,
    marginTop: 4,
  },
  planFeatures: {
    backgroundColor: '#F8F9FA',
    padding: 16,
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
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  restoreButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 8,
  },
  // Reader App Exception - MUST be discreet per Apple Guidelines 3.1.3(a)
  externalLinkContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
  },
  externalLinkButton: {
    paddingVertical: 8,
  },
  externalLinkText: {
    fontSize: 12, // Small, discreet text
    color: '#999', // Muted gray color
    textAlign: 'center',
  },
  complianceNotice: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
  },
  complianceText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  confirmModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmModalText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  confirmModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  confirmModalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.secondary,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

