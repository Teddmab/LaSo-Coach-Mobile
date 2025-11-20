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
import firebaseAuthService from '../services/firebaseAuthServiceNew';
import { theme } from '../constants/theme';

/**
 * SubscriptionScreen - Spotify-style Flow
 * 
 * Flow:
 * - Shows subscription plans
 * - When user clicks a plan, redirects to web app with token for payment
 * - No in-app payments (IAP removed)
 * - Multiple views: Your Premium, Benefits, Manage, Available Plans
 */
export default function SubscriptionScreen({ navigation }) {
  const { user, refreshProfile } = useAuth();
  const [webAuthToken, setWebAuthToken] = useState(null);
  
  // State management
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [redirecting, setRedirecting] = useState(false);
  
  // View state: 'premium' | 'benefits' | 'manage' | 'plans'
  const [currentView, setCurrentView] = useState('premium');

  /**
   * Initialize screen data
   */
  useEffect(() => {
    initializeScreen();
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

      // Get Firebase ID token for web authentication
      try {
        const token = await firebaseAuthService.getIdToken();
        if (token) {
          setWebAuthToken(token);
          console.log('✅ Firebase ID token retrieved for web auth');
        }
      } catch (tokenError) {
        console.log('⚠️ Could not get Firebase token for web auth:', tokenError);
      }

      // Fetch subscription data
      const [plansData, subscriptionData] = await Promise.all([
        SubscriptionApi.getPlans(),
        SubscriptionApi.getCurrentSubscription(),
      ]);

      setPlans(plansData);
      setCurrentSubscription(subscriptionData);
      
      // Set initial view based on subscription status
      if (subscriptionData && subscriptionData.hasSubscription) {
        setCurrentView('premium');
      } else {
        setCurrentView('plans');
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
   * Build web URL with token and plan ID
   */
  const buildWebUrl = (planId = null) => {
    const baseUrl = 'https://app.lasocoach.com/subscription';
    const params = new URLSearchParams();
    
    if (webAuthToken) {
      params.append('token', webAuthToken);
    }
    
    if (planId) {
      params.append('planId', planId);
    }
    
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  };

  /**
   * Redirect to web app for subscription
   */
  const redirectToWeb = async (plan) => {
    try {
      setRedirecting(true);
      setSelectedPlan(plan);
      
      const url = buildWebUrl(plan.id);
      console.log('🌐 Redirecting to web app:', url);
      
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        
        // Show info message
        Toast.show({
          type: 'info',
          text1: 'Redirection...',
          text2: 'Vous allez être redirigé vers notre site web',
        });
      } else {
        throw new Error('Cannot open URL');
      }
    } catch (error) {
      console.error('❌ Error redirecting to web:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible d\'ouvrir le lien. Veuillez réessayer.',
      });
    } finally {
      setRedirecting(false);
    }
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
   * Handle plan selection - redirect to web
   */
  const handlePlanSelect = async (plan) => {
    // Check if already subscribed to this plan
    if (!isPlanClickable(plan)) {
      Toast.show({
        type: 'info',
        text1: 'Plan actuel',
        text2: 'Vous êtes déjà abonné à ce plan',
      });
      return;
    }

    // Redirect to web app for subscription
    await redirectToWeb(plan);
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
   * Get display price
   */
  const getDisplayPrice = (plan) => {
    if (plan.isFree) {
      return 'Gratuit';
    }
    
    // Format price with currency
    const price = plan.price || 0;
    const currency = plan.currency || '€';
    const billingPeriod = plan.duration ? ` / ${SubscriptionApi.getBillingPeriod(plan.duration)}` : '';
    
    return `${currency}${price}${billingPeriod}`;
  };

  /**
   * Refresh subscription on screen focus
   * User may have purchased on web and returned to app
   */
  useEffect(() => {
    const unsubscribe = navigation?.addListener('focus', async () => {
      console.log('🔄 Subscription screen focused - checking for web purchases');
      try {
        await refreshSubscriptionData();
        await refreshProfile();
        
        // Update view if subscription status changed
        const subscriptionData = await SubscriptionApi.getCurrentSubscription();
        if (subscriptionData && subscriptionData.hasSubscription) {
          setCurrentView('premium');
        }
      } catch (error) {
        console.log('⚠️ Error refreshing on focus:', error);
      }
    });

    return unsubscribe;
  }, [navigation]);

  /**
   * Get header title based on current view
   */
  const getHeaderTitle = () => {
    switch (currentView) {
      case 'premium':
        return 'Your Premium';
      case 'benefits':
        return 'Your benefits';
      case 'manage':
        return 'Manage subscription';
      case 'plans':
        return 'Available plans';
      default:
        return 'Subscription';
    }
  };

  /**
   * Render "Your Premium" view - Current subscription overview
   */
  const renderYourPremium = () => {
    if (!currentSubscription || !currentSubscription.hasSubscription) {
      // If no subscription, show plans instead
      return renderAvailablePlans();
    }

    const subscription = currentSubscription.subscription;
    const planName = subscription?.planName || 'Premium';
    const planType = subscription?.plan?.name || 'Individual';

    return (
      <View style={styles.viewContainer}>
        {/* Subscription Card */}
        <View style={styles.premiumCard}>
          <View style={styles.subscriptionTag}>
            <Text style={styles.subscriptionTagText}>Subscription</Text>
          </View>
          
          <View style={styles.premiumHeader}>
            <Text style={styles.premiumLogo}>LaSo Coach</Text>
            <Text style={styles.premiumText}>Premium</Text>
          </View>
          
          <Text style={styles.planTypeText}>{planType}</Text>
          
          <TouchableOpacity 
            style={styles.manageButtonInline}
            onPress={() => setCurrentView('manage')}
          >
            <Text style={styles.manageButtonInlineText}>Manage</Text>
          </TouchableOpacity>
        </View>

        {/* Benefits Snapshot */}
        <View style={styles.benefitsSnapshot}>
          <Text style={styles.benefitsSnapshotTitle}>Snapshot of your benefits</Text>
          
          <View style={styles.benefitsSnapshotCard}>
            {subscription?.plan?.features?.slice(0, 6).map((feature, index) => (
              <View key={index} style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.benefitItemText}>{feature}</Text>
              </View>
            ))}
            
            <TouchableOpacity 
              style={styles.exploreBenefitsButton}
              onPress={() => setCurrentView('benefits')}
            >
              <Text style={styles.exploreBenefitsButtonText}>Explore your benefits</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  /**
   * Render "Your benefits" view
   */
  const renderBenefits = () => {
    if (!currentSubscription || !currentSubscription.hasSubscription) {
      return renderAvailablePlans();
    }

    const subscription = currentSubscription.subscription;
    const features = subscription?.plan?.features || [];

    return (
      <View style={styles.viewContainer}>
        <Text style={styles.sectionTitle}>Included in your subscription</Text>
        <Text style={styles.sectionSubtitle}>Discover all your premium benefits</Text>
        
        <View style={styles.benefitsGrid}>
          {features.map((feature, index) => (
            <View key={index} style={styles.benefitCard}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              <Text style={styles.benefitCardText}>{feature}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  /**
   * Render "Manage subscription" view
   */
  const renderManage = () => {
    if (!currentSubscription || !currentSubscription.hasSubscription) {
      return renderAvailablePlans();
    }

    const subscription = currentSubscription.subscription;
    const planName = subscription?.planName || 'Premium';
    const planType = subscription?.plan?.name || 'Individual';
    const renewalDate = subscription?.nextBillingDate 
      ? new Date(subscription.nextBillingDate).toLocaleDateString('fr-FR')
      : '01/01/1970';
    const price = subscription?.plan?.price || 0;
    const currency = subscription?.plan?.currency || '€';

    return (
      <View style={styles.viewContainer}>
        {/* Subscription Details */}
        <View style={styles.manageCard}>
          <View style={styles.manageHeader}>
            <Text style={styles.manageLogo}>LaSo Coach</Text>
            <Text style={styles.managePremiumText}>Premium</Text>
          </View>
          <Text style={styles.managePlanType}>{planType}</Text>
          <Text style={styles.manageAccountCount}>1 Premium account</Text>
        </View>

        {/* Payment Section */}
        <View style={styles.manageCard}>
          <Text style={styles.manageSectionTitle}>Payment</Text>
          <Text style={styles.managePaymentText}>
            Your plan will automatically renew on {renewalDate}. You'll be charged {currency}{price}/month.
          </Text>
        </View>

        {/* Available Plans Section */}
        <View style={styles.manageCard}>
          <Text style={styles.manageSectionTitle}>Available plans</Text>
          <TouchableOpacity 
            style={styles.explorePlansButton}
            onPress={() => setCurrentView('plans')}
          >
            <Text style={styles.explorePlansTitle}>Explore plans</Text>
            <Text style={styles.explorePlansSubtitle}>Affordable options for any situation.</Text>
          </TouchableOpacity>
        </View>

        {/* Cancel Subscription */}
        <TouchableOpacity 
          style={styles.cancelSubscriptionButton}
          onPress={() => redirectToWeb(null)}
        >
          <Text style={styles.cancelSubscriptionText}>Cancel Subscription</Text>
        </TouchableOpacity>
      </View>
    );
  };

  /**
   * Render "Available plans" view
   */
  const renderAvailablePlans = () => {
    const currentPlanId = currentSubscription?.subscription?.plan?.id;

    return (
      <View style={styles.viewContainer}>
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          let backgroundColor = '#4CAF50';
          
          if (plan.name.toLowerCase().includes('premium')) {
            backgroundColor = '#8B5CF6';
          } else if (plan.name.toLowerCase().includes('flexy')) {
            backgroundColor = '#FF6B35';
          } else if (plan.name.toLowerCase().includes('basic')) {
            backgroundColor = '#2196F3';
          }
          
          return (
            <View key={plan.id} style={styles.planCardSimple}>
              {isCurrent && (
                <View style={styles.currentBadge}>
                  <Text style={styles.currentBadgeText}>Current</Text>
                </View>
              )}
              
              <View style={styles.planCardHeader}>
                <Text style={styles.planCardLogo}>LaSo Coach</Text>
                <Text style={styles.planCardPremium}>Premium</Text>
              </View>
              
              <Text style={[styles.planCardName, { color: backgroundColor }]}>{plan.name}</Text>
              
              <Text style={styles.planCardPrice}>{getDisplayPrice(plan)}</Text>
              
              <View style={styles.planCardFeatures}>
                {plan.features?.slice(0, 3).map((feature, index) => (
                  <Text key={index} style={styles.planCardFeature}>• {feature}</Text>
                ))}
                <Text style={styles.planCardFeature}>• Cancel anytime</Text>
              </View>
              
              {!isCurrent && (
                <TouchableOpacity 
                  style={[styles.planSelectButton, { backgroundColor }]}
                  onPress={() => handlePlanSelect(plan)}
                  disabled={redirecting}
                >
                  {redirecting && selectedPlan?.id === plan.id ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.planSelectButtonText}>Select</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  /**
   * Render current view based on state
   */
  const renderCurrentView = () => {
    switch (currentView) {
      case 'premium':
        return renderYourPremium();
      case 'benefits':
        return renderBenefits();
      case 'manage':
        return renderManage();
      case 'plans':
        return renderAvailablePlans();
      default:
        return renderAvailablePlans();
    }
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
      {/* Header with back button */}
      <View style={styles.header}>
        {(currentView !== 'premium' && currentView !== 'plans') && (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              if (currentView === 'benefits' || currentView === 'manage') {
                setCurrentView('premium');
              } else {
                navigation?.goBack();
              }
            }}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCurrentView()}
      </ScrollView>
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
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  // View container
  viewContainer: {
    padding: 20,
  },
  // Your Premium view styles
  premiumCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subscriptionTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 12,
  },
  subscriptionTagText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  premiumLogo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginRight: 8,
  },
  premiumText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  planTypeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B9D',
    marginBottom: 16,
  },
  manageButtonInline: {
    alignSelf: 'flex-end',
    backgroundColor: '#F0F0F0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  manageButtonInlineText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  // Benefits snapshot
  benefitsSnapshot: {
    marginTop: 20,
  },
  benefitsSnapshotTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  benefitsSnapshotCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitItemText: {
    marginLeft: 12,
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  exploreBenefitsButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    alignItems: 'center',
  },
  exploreBenefitsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  // Benefits view
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  benefitsGrid: {
    marginTop: 20,
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  benefitCardText: {
    marginLeft: 12,
    fontSize: 14,
    color: theme.colors.text.primary,
    flex: 1,
  },
  // Manage view
  manageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  manageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  manageLogo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginRight: 8,
  },
  managePremiumText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  managePlanType: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  manageAccountCount: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  manageSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  managePaymentText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  explorePlansButton: {
    marginTop: 8,
  },
  explorePlansTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  explorePlansSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  cancelSubscriptionButton: {
    marginTop: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelSubscriptionText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    textDecorationLine: 'underline',
  },
  // Available plans view
  planCardSimple: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  currentBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  currentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  planCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  planCardLogo: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginRight: 8,
  },
  planCardPremium: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  planCardName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  planCardPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  planCardFeatures: {
    marginBottom: 16,
  },
  planCardFeature: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  planSelectButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  planSelectButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

