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
  Modal,
  Platform,
  StatusBar,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/FirebaseAuthContext';
import SubscriptionApi from '../services/subscriptionApi';
import ProfileApi from '../services/profileApi';
import firebaseAuthService from '../services/firebaseAuthServiceNew';
import { theme } from '../constants/theme';
import AppHeader from '../components/AppHeader';
import BottomNavigation from '../components/BottomNavigation';

/**
 * SubscriptionScreen - Spotify-style Flow
 * 
 * Flow:
 * - Shows subscription plans
 * - When user clicks a plan, redirects to web app with token for payment
 * - No in-app payments (IAP removed)
 * - Multiple views: Your Premium, Benefits, Manage, Available Plans
 */
export default function SubscriptionScreen({ navigation, onClose, onNext, isStandalone = true, onTabPress, user: propUser, activeTab = 'home' }) {
  const { user: authUser, refreshProfile, currentUser } = useAuth();
  const user = propUser || authUser || currentUser;
  const [webAuthToken, setWebAuthToken] = useState(null);
  
  // State management
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [redirecting, setRedirecting] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [profileData, setProfileData] = useState(null);
  // In-app web subscription flow
  const [showWebView, setShowWebView] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState(null);
  const [webViewLoading, setWebViewLoading] = useState(false);

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

      // Fetch subscription data, profile, and history
      const [plansData, subscriptionData, profile, historyResponse] = await Promise.all([
        SubscriptionApi.getPlans(),
        SubscriptionApi.getCurrentSubscription(),
        ProfileApi.getProfile().catch(() => null),
        SubscriptionApi.getHistory().catch(() => ({ success: false, data: [] })),
      ]);

      setPlans(plansData);
      setCurrentSubscription(subscriptionData);
      setProfileData(profile);
      
      // Process and set subscription history
      if (historyResponse && historyResponse.data) {
        if (Array.isArray(historyResponse.data)) {
          setInvoices(historyResponse.data);
        } else if (historyResponse.data.subscriptions) {
          setInvoices(historyResponse.data.subscriptions);
        } else if (historyResponse.data.invoices) {
          setInvoices(historyResponse.data.invoices);
        } else if (historyResponse.data.history) {
          setInvoices(historyResponse.data.history);
        }
      } else if (Array.isArray(historyResponse)) {
        setInvoices(historyResponse);
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
    const baseUrl = 'https://app.lasocoach.com/onboarding/subscription';
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
    // Legacy external redirect kept for any non-plan actions (e.g. cancel)
    try {
      let token = webAuthToken;
      try {
        const freshToken = await firebaseAuthService.getIdToken(true);
        if (freshToken) {
          token = freshToken;
          setWebAuthToken(freshToken);
        }
      } catch (e) {
        console.log('Token refresh failed, using cached token');
      }
      const baseUrl = 'https://app.lasocoach.com/onboarding/subscription';
      const params = new URLSearchParams();
      if (token) params.append('token', token);
      if (plan?.id) params.append('planId', plan.id);
      const url = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('External redirect error:', error);
    }
  };

  const openEmbeddedSubscription = async (plan) => {
    try {
      setRedirecting(true);
      setSelectedPlan(plan);
      let token = webAuthToken;
      try {
        const freshToken = await firebaseAuthService.getIdToken(true);
        if (freshToken) {
          token = freshToken;
          setWebAuthToken(freshToken);
        }
      } catch (e) {
        console.log('Token refresh failed, using cached token');
      }
      const baseUrl = 'https://app.lasocoach.com/onboarding/subscription';
      const params = new URLSearchParams();
      if (token) params.append('token', token);
      if (plan?.id) params.append('planId', plan.id);
      const url = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
      setWebViewUrl(url);
      setShowWebView(true);
    } catch (error) {
      console.error('Embedded subscription error:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible d\'ouvrir la souscription intégrée',
      });
    } finally {
      setRedirecting(false);
    }
  };

  /**
   * Refresh subscription data and history
   */
  const refreshSubscriptionData = async () => {
    try {
      const [subscriptionData, historyResponse] = await Promise.all([
        SubscriptionApi.getCurrentSubscription(),
        SubscriptionApi.getHistory().catch(() => ({ success: false, data: [] })),
      ]);
      
      setCurrentSubscription(subscriptionData);
      
      // Update invoices/history
      if (historyResponse && historyResponse.data) {
        if (Array.isArray(historyResponse.data)) {
          setInvoices(historyResponse.data);
        } else if (historyResponse.data.subscriptions) {
          setInvoices(historyResponse.data.subscriptions);
        } else if (historyResponse.data.invoices) {
          setInvoices(historyResponse.data.invoices);
        } else if (historyResponse.data.history) {
          setInvoices(historyResponse.data.history);
        }
      } else if (Array.isArray(historyResponse)) {
        setInvoices(historyResponse);
      }
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
    // Open embedded in-app subscription flow
    await openEmbeddedSubscription(plan);
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
   * Render "Your Premium" section - Current subscription overview
   */
  const renderYourPremium = () => {
    if (!currentSubscription || !currentSubscription.hasSubscription) {
      return null;
    }

    const subscription = currentSubscription.subscription;
    const planType = subscription?.plan?.name || 'Individual';

    return (
      <View style={styles.sectionContainer}>
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
        </View>

      </View>
    );
  };

  /**
   * Get latest active subscription from history
   */
  const getLatestActiveSubscription = () => {
    if (!invoices || invoices.length === 0) {
      return null;
    }

    // Find the latest active subscription
    const activeSubscriptions = invoices.filter(inv => {
      const status = (inv.status || inv.subscriptionStatus || '').toUpperCase();
      return status === 'ACTIVE' || status === 'ACTIF';
    });

    if (activeSubscriptions.length === 0) {
      return null;
    }

    // Sort by start date (most recent first) and return the first one
    activeSubscriptions.sort((a, b) => {
      const dateA = new Date(a.startDate || a.createdAt || a.beginDate || 0);
      const dateB = new Date(b.startDate || b.createdAt || b.beginDate || 0);
      return dateB - dateA;
    });

    return activeSubscriptions[0];
  };

  /**
   * Render "Manage subscription" section
   */
  const renderManage = () => {
    if (!currentSubscription || !currentSubscription.hasSubscription) {
      return null;
    }

    const subscription = currentSubscription.subscription;
    const planType = subscription?.plan?.name || 'Individual';
    const price = subscription?.plan?.price || 0;
    const currency = subscription?.plan?.currency || '€';
    
    // Get billing info from latest active subscription in history
    const latestActive = getLatestActiveSubscription();
    let billingPeriod = 'Mensuelle';
    let renewalDate = '-';

    if (latestActive) {
      // Calculate billing period from start and end dates
      const startDate = latestActive.startDate || latestActive.createdAt || latestActive.beginDate;
      const endDate = latestActive.endDate || latestActive.expiresAt || latestActive.nextBillingDate;
      
      if (startDate && endDate) {
        try {
          const start = new Date(startDate);
          const end = new Date(endDate);
          const diffTime = Math.abs(end - start);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays <= 7) {
            billingPeriod = 'Hebdomadaire';
          } else if (diffDays <= 31) {
            billingPeriod = 'Mensuelle';
          } else if (diffDays <= 93) {
            billingPeriod = 'Trimestrielle';
          } else if (diffDays <= 186) {
            billingPeriod = 'Semestrielle';
          } else {
            billingPeriod = 'Annuelle';
          }
        } catch (error) {
          console.error('Error calculating billing period:', error);
        }
      }
      
      // Use end date as renewal date
      if (endDate) {
        try {
          renewalDate = new Date(endDate).toLocaleDateString('fr-FR', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
          });
        } catch (error) {
          console.error('Error formatting renewal date:', error);
        }
      }
    } else {
      // Fallback to current subscription data if no history available
      renewalDate = subscription?.nextBillingDate 
        ? new Date(subscription.nextBillingDate).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
        : '-';
      billingPeriod = subscription?.plan?.duration 
        ? SubscriptionApi.getBillingPeriod(subscription.plan.duration)
        : 'Mensuelle';
    }

    return (
      <View style={styles.sectionContainer}>
        {/* Billing Card */}
        <View style={styles.billingCard}>
          <Text style={styles.billingCardTitle}>Facturation</Text>
          <View style={styles.billingCardDivider} />
          <View style={styles.billingInfo}>
            <Text style={styles.billingInfoLabel}>Période de facturation:</Text>
            <Text style={styles.billingInfoValue}>{billingPeriod}</Text>
          </View>
          <View style={styles.billingInfo}>
            <Text style={styles.billingInfoLabel}>Date de Renouvellement:</Text>
            <Text style={styles.billingInfoValue}>{renewalDate}</Text>
          </View>
          <TouchableOpacity 
            style={styles.viewInvoicesButton}
            onPress={handleViewInvoices}
          >
            <Text style={styles.viewInvoicesButtonText}>Voir les factures</Text>
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
   * Fetch invoices/subscription history
   */
  const fetchInvoices = async () => {
    try {
      setLoadingInvoices(true);
      const response = await SubscriptionApi.getHistory();
      console.log('📋 Subscription history response:', response);
      
      // Handle different response structures
      if (response && response.data) {
        // If data is an array, use it directly
        if (Array.isArray(response.data)) {
          setInvoices(response.data);
        } 
        // If data has a subscriptions or invoices property
        else if (response.data.subscriptions) {
          setInvoices(response.data.subscriptions);
        } else if (response.data.invoices) {
          setInvoices(response.data.invoices);
        } else if (response.data.history) {
          setInvoices(response.data.history);
        } else {
          setInvoices([]);
        }
      } else if (Array.isArray(response)) {
        // Response is directly an array
        setInvoices(response);
      } else {
        setInvoices([]);
      }
    } catch (error) {
      console.error('❌ Error fetching subscription history:', error);
      setInvoices([]);
    } finally {
      setLoadingInvoices(false);
    }
  };

  /**
   * Handle FAQ navigation
   */
  const handleFAQPress = () => {
    if (onTabPress) {
      onTabPress('faq');
    } else if (navigation) {
      // If used standalone, could navigate to FAQ screen
      console.log('Navigate to FAQ');
    }
  };

  /**
   * Handle invoice modal
   */
  const handleViewInvoices = async () => {
    await fetchInvoices();
    setShowInvoiceModal(true);
  };

  /**
   * Render "Available plans" section
   */
  const renderAvailablePlans = () => {
    const currentPlanId = currentSubscription?.subscription?.plan?.id;

    return (
      <View style={styles.sectionContainer}>
        {/* FAQ Link */}
        <TouchableOpacity 
          style={styles.faqLink}
          onPress={handleFAQPress}
        >
          <Text style={styles.faqLinkText}>
            Vous avez des questions? Consultez notre centre d'aide et FAQ
          </Text>
        </TouchableOpacity>

        {/* Subscription Plans */}
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
          
          const features = plan.features || [];
          
          return (
            <View key={plan.id} style={styles.planCardWithImage}>
              {/* Plan Image */}
              {plan.imageUrl ? (
                <Image 
                  source={{ uri: plan.imageUrl }} 
                  style={styles.planCardImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.planCardImagePlaceholder, { backgroundColor: backgroundColor + '20' }]}>
                  <Ionicons name="images-outline" size={48} color={backgroundColor} />
                </View>
              )}
              
              {/* Plan Content */}
              <View style={[styles.planCardContent, { backgroundColor }]}>
                <Text style={styles.planCardNameLarge}>{plan.name}</Text>
                
                <View style={styles.planCardPricing}>
                  {plan.originalPrice && plan.originalPrice > plan.price && (
                    <Text style={styles.planCardOldPrice}>
                      {plan.currency || '€'}{plan.originalPrice} /mois
                    </Text>
                  )}
                  <Text style={styles.planCardPriceLarge}>
                    {plan.currency || '€'}{plan.price}
                  </Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.planSubscribeButton}
                  onPress={() => handlePlanSelect(plan)}
                  disabled={redirecting || isCurrent}
                >
                  {redirecting && selectedPlan?.id === plan.id ? (
                    <ActivityIndicator color={backgroundColor} size="small" />
                  ) : (
                    <Text style={[styles.planSubscribeButtonText, { color: backgroundColor }]}>
                      {isCurrent ? 'Plan actuel' : "S'abonner"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Features Section */}
              {features.length > 0 && (
                <View style={styles.planFeaturesSection}>
                  <Text style={styles.planFeaturesTitle}>Inclus dans cette formule :</Text>
                  {features.map((feature, index) => (
                    <View key={index} style={styles.planFeatureItem}>
                      <View style={[styles.planFeatureCheckmark, { backgroundColor }]}>
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      </View>
                      <Text style={styles.planFeatureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
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

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (error) {
      return '-';
    }
  };

  /**
   * Get status badge style
   */
  const getStatusBadgeStyle = (status) => {
    const upperStatus = (status || '').toUpperCase();
    if (upperStatus === 'ACTIVE' || upperStatus === 'ACTIF') {
      return { backgroundColor: '#C8E6C9' };
    } else if (upperStatus === 'EXPIRED' || upperStatus === 'EXPIRÉ') {
      return { backgroundColor: '#FFCDD2' };
    }
    return { backgroundColor: '#E0E0E0' };
  };

  /**
   * Get status text color
   */
  const getStatusTextColor = (status) => {
    const upperStatus = (status || '').toUpperCase();
    if (upperStatus === 'ACTIVE' || upperStatus === 'ACTIF') {
      return '#2E7D32';
    } else if (upperStatus === 'EXPIRED' || upperStatus === 'EXPIRÉ') {
      return '#C62828';
    }
    return '#424242';
  };

  /**
   * Render Invoice Modal
   */
  const renderInvoiceModal = () => (
    <Modal
      visible={showInvoiceModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowInvoiceModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Historique des Abonnements</Text>
          <TouchableOpacity 
            style={styles.modalCloseButton}
            onPress={() => setShowInvoiceModal(false)}
          >
            <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {loadingInvoices ? (
            <View style={styles.modalLoadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : invoices.length > 0 ? (
            <View style={styles.historyTable}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderText}>Plan</Text>
                <Text style={styles.tableHeaderText}>Statut</Text>
                <Text style={styles.tableHeaderText}>Début</Text>
                <Text style={styles.tableHeaderText}>Fin</Text>
                <Text style={styles.tableHeaderText}>Prix</Text>
              </View>
              
              {/* Table Rows */}
              {invoices.map((invoice, index) => {
                const status = invoice.status || invoice.subscriptionStatus || 'EXPIRED';
                const planName = invoice.planName || invoice.plan?.name || 'N/A';
                const startDate = formatDate(invoice.startDate || invoice.createdAt || invoice.beginDate);
                const endDate = formatDate(invoice.endDate || invoice.expiresAt || invoice.nextBillingDate);
                const price = invoice.price || invoice.amount || 0;
                const currency = invoice.currency || '€';
                const isFree = price === 0 || invoice.isFree || planName.toLowerCase().includes('free');
                const paymentMethod = invoice.paymentMethod || invoice.payment?.method || null;
                const paymentAmount = invoice.paymentAmount || invoice.payment?.amount || null;
                const paymentStatus = invoice.paymentStatus || invoice.payment?.status || null;
                
                return (
                  <View key={index} style={styles.tableRow}>
                    <View style={styles.tableCell}>
                      <Text style={styles.tableCellText}>{planName}</Text>
                    </View>
                    <View style={[styles.tableCell, { alignItems: 'center' }]}>
                      <View style={[styles.statusBadge, getStatusBadgeStyle(status)]}>
                        <Text style={[styles.statusBadgeText, { color: getStatusTextColor(status) }]}>
                          {status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.tableCell}>
                      <Text style={styles.tableCellText}>{startDate}</Text>
                    </View>
                    <View style={styles.tableCell}>
                      <Text style={styles.tableCellText}>{endDate}</Text>
                    </View>
                    <View style={styles.tableCell}>
                      <Text style={styles.tableCellText}>
                        {isFree ? 'Gratuit' : `${currency}${price}`}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.modalEmptyContainer}>
              <Ionicons name="receipt-outline" size={48} color={theme.colors.text.secondary} />
              <Text style={styles.modalEmptyText}>Aucun historique disponible</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* AppHeader */}
      <AppHeader
        title="Abonnement"
        onHelpPress={handleFAQPress}
        onNotificationPress={() => {
          if (onTabPress) {
            onTabPress('notifications');
          }
        }}
        onProfilePress={() => {
          if (onTabPress) {
            onTabPress('settings');
          }
        }}
        avatarSource={profileData?.avatar || user?.avatar}
        avatarFallbackText={user?.firstName?.charAt(0) || user?.name?.charAt(0) || 'U'}
      />
      
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top Encouragement Banner */}
        <View style={styles.sectionContainer}>
          <View style={styles.encouragementBanner}>
            <Text style={styles.encouragementText}>
              Un abonnement, c'est investir en vous-même. Choisissez la formule qui vous accompagnera vers vos objectifs !
            </Text>
          </View>
        </View>

        {/* Your Premium Section */}
        {renderYourPremium()}
        
        {/* Manage Subscription Section */}
        {renderManage()}
        
        {/* Available Plans Section */}
        {renderAvailablePlans()}
      </ScrollView>

      {/* Bottom Navigation - Only show when standalone */}
      {isStandalone && (
        <BottomNavigation 
          activeTab={activeTab || 'home'} 
          onTabPress={onTabPress || (() => {})}
        />
      )}

      {/* Invoice Modal */}
      {renderInvoiceModal()}

      {/* Embedded Subscription WebView Modal */}
      <Modal
        visible={showWebView}
        animationType="slide"
        onRequestClose={() => setShowWebView(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' }}>
            <TouchableOpacity onPress={() => setShowWebView(false)} style={{ padding: 8 }}>
              <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '600', color: theme.colors.text.primary }}>
              Paiement Abonnement
            </Text>
            <View style={{ width: 32 }} />
          </View>
          {webViewUrl ? (
            <WebView
              source={{ uri: webViewUrl, headers: webAuthToken ? { Authorization: `Bearer ${webAuthToken}` } : {} }}
              onLoadStart={() => setWebViewLoading(true)}
              onLoadEnd={() => setWebViewLoading(false)}
              onNavigationStateChange={(nav) => {
                const url = nav.url || '';
                if (url.includes('/onboarding/subscription-success')) {
                  Toast.show({ type: 'success', text1: 'Abonnement activé', text2: 'Merci pour votre souscription !' });
                  setShowWebView(false);
                  refreshSubscriptionData();
                  refreshProfile();
                } else if (url.includes('/onboarding/subscription-cancel')) {
                  Toast.show({ type: 'info', text1: 'Abonnement annulé', text2: 'Processus annulé.' });
                  setShowWebView(false);
                }
              }}
              injectedJavaScriptBeforeContentLoaded={webAuthToken ? `(() => { try { localStorage.setItem('firebase_id_token', '${(webAuthToken||'').replace(/'/g,"\\'")}'); } catch(e){} })();` : ''}
              startInLoadingState
              renderLoading={() => (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={{ marginTop: 12, color: theme.colors.text.secondary }}>Chargement du portail...</Text>
                </View>
              )}
              style={{ flex: 1 }}
            />
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// Styles remain largely the same with additions for new elements
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
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
  // New design elements
  encouragementBanner: {
    backgroundColor: '#FFF9C4',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  encouragementText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    textAlign: 'center',
    lineHeight: 20,
  },
  faqLink: {
    marginBottom: 20,
    paddingVertical: 8,
  },
  faqLinkText: {
    fontSize: 14,
    color: '#007AFF',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  billingCard: {
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
  billingCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  billingCardDivider: {
    height: 2,
    backgroundColor: '#007AFF',
    marginBottom: 16,
    width: 40,
  },
  billingInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  billingInfoLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  billingInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  viewInvoicesButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  viewInvoicesButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  paymentMethodText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  paymentMethodSubtext: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 16,
  },
  // Plan card with image
  planCardWithImage: {
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
  planCardImage: {
    width: '100%',
    height: 200,
  },
  planCardImagePlaceholder: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planCardContent: {
    padding: 20,
  },
  planCardNameLarge: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  planCardPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  planCardOldPrice: {
    fontSize: 16,
    color: '#FFFFFF',
    textDecorationLine: 'line-through',
    marginRight: 12,
    opacity: 0.8,
  },
  planCardPriceLarge: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  planSubscribeButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    opacity: 1,
  },
  planSubscribeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Plan Features Section
  planFeaturesSection: {
    backgroundColor: '#F5F5DC',
    padding: 20,
  },
  planFeaturesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  planFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  planFeatureCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  planFeatureText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    flex: 1,
  },
  // Invoice Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  modalEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  modalEmptyText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginTop: 16,
  },
  invoiceItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  invoiceItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  invoiceItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  invoiceItemDate: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  invoiceItemAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  invoiceItemStatus: {
    fontSize: 14,
    color: '#4CAF50',
  },
  // History Table Styles
  historyTable: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'left',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'center',
    minHeight: 60,
  },
  tableCell: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tableCellText: {
    fontSize: 12,
    color: theme.colors.text.primary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'center',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  paymentInfo: {
    alignItems: 'center',
  },
  paymentMethodText: {
    fontSize: 11,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  paymentAmountText: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  paymentStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

