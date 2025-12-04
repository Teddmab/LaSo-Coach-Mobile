import { useState, useEffect, useCallback } from 'react';
import Toast from 'react-native-toast-message';
import SubscriptionApi from '../../../services/subscriptionApi';
import { ProfileApi } from '../../../services/profileApi';
import { Plan, CurrentSubscription, Invoice, PaymentData } from '../types';

export const useSubscriptionScreen = (
  navigation?: any,
  refreshProfile?: () => Promise<void>
) => {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [showPaymentFlow, setShowPaymentFlow] = useState(false);

  const initializeScreen = useCallback(async () => {
    try {
      setLoading(true);
      const [plansData, subscriptionData, profile, historyResponse] = await Promise.all([
        SubscriptionApi.getPlans().catch(() => []),
        SubscriptionApi.getCurrentSubscription().catch(() => null),
        ProfileApi.getProfile().catch(() => null),
        SubscriptionApi.getHistory().catch(() => ({ success: false, data: [] })),
      ]);

      setPlans(plansData);
      setCurrentSubscription(subscriptionData);
      setProfileData(profile);
      
      if (historyResponse && (historyResponse as any).data) {
        const data = (historyResponse as any).data;
        if (Array.isArray(data)) {
          setInvoices(data);
        } else if (data.subscriptions) {
          setInvoices(data.subscriptions);
        } else if (data.invoices) {
          setInvoices(data.invoices);
        } else if (data.history) {
          setInvoices(data.history);
        }
      } else if (Array.isArray(historyResponse)) {
        setInvoices(historyResponse);
      }
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
  }, []);

  const refreshSubscriptionData = useCallback(async () => {
    try {
      const [subscriptionData, historyResponse] = await Promise.all([
        SubscriptionApi.getCurrentSubscription(),
        SubscriptionApi.getHistory().catch(() => ({ success: false, data: [] })),
      ]);
      
      setCurrentSubscription(subscriptionData);
      
      if (historyResponse && (historyResponse as any).data) {
        const data = (historyResponse as any).data;
        if (Array.isArray(data)) {
          setInvoices(data);
        } else if (data.subscriptions) {
          setInvoices(data.subscriptions);
        } else if (data.invoices) {
          setInvoices(data.invoices);
        } else if (data.history) {
          setInvoices(data.history);
        }
      } else if (Array.isArray(historyResponse)) {
        setInvoices(historyResponse);
      }
    } catch (error) {
      console.error('❌ Error refreshing subscription:', error);
    }
  }, []);

  useEffect(() => {
    initializeScreen();
  }, [initializeScreen]);

  useEffect(() => {
    if (!navigation) return;
    
    const unsubscribe = navigation.addListener('focus', async () => {
      try {
        await refreshSubscriptionData();
        if (refreshProfile) {
          await refreshProfile();
        }
      } catch (error) {
        console.log('⚠️ Error refreshing on focus:', error);
      }
    });

    return unsubscribe;
  }, [navigation, refreshSubscriptionData, refreshProfile]);

  const handlePlanSelect = useCallback(async (plan: Plan) => {
    if (!plan || !plan.id) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Plan d\'abonnement invalide',
      });
      return;
    }
    
    const planForPayment: Plan = {
      id: plan.id,
      name: plan.name,
      price: plan.price,
      discountPrice: plan.discountPrice,
      duration: plan.duration,
      features: plan.features || [],
      currency: plan.currency || 'EUR',
    };
    
    setSelectedPlan(planForPayment);
    setShowPaymentFlow(true);
  }, []);

  const handlePaymentSuccess = useCallback(async (paymentData: PaymentData) => {
    Toast.show({
      type: 'success',
      text1: 'Abonnement activé',
      text2: 'Votre abonnement a été activé avec succès',
    });
    
    await refreshSubscriptionData();
    if (refreshProfile) {
      await refreshProfile();
    }
    
    setShowPaymentFlow(false);
    setSelectedPlan(null);
  }, [refreshSubscriptionData, refreshProfile]);

  const handlePaymentError = useCallback((error: any) => {
    console.error('❌ Payment error:', error);
    setShowPaymentFlow(false);
    setSelectedPlan(null);
  }, []);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoadingInvoices(true);
      const response: any = await SubscriptionApi.getHistory();
      
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          setInvoices(response.data);
        } else if (response.data.subscriptions) {
          setInvoices(response.data.subscriptions);
        } else if (response.data.invoices) {
          setInvoices(response.data.invoices);
        } else if (response.data.history) {
          setInvoices(response.data.history);
        } else {
          setInvoices([]);
        }
      } else if (Array.isArray(response)) {
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
  }, []);

  const handleViewInvoices = useCallback(async () => {
    await fetchInvoices();
    setShowInvoiceModal(true);
  }, [fetchInvoices]);

  const isPlanClickable = useCallback((plan: Plan): boolean => {
    if (!currentSubscription || !currentSubscription.hasSubscription) {
      return true;
    }

    const subscription = currentSubscription.subscription;
    
    if (subscription?.isTrial === true) {
      return true;
    }

    if (subscription?.status === 'ACTIVE' && subscription.isTrial === false) {
      if (plan.id === subscription.plan?.id) {
        return false;
      }
      return true;
    }

    return true;
  }, [currentSubscription]);

  return {
    loading,
    plans,
    currentSubscription,
    selectedPlan,
    showInvoiceModal,
    invoices,
    loadingInvoices,
    profileData,
    showPaymentFlow,
    setShowInvoiceModal,
    setShowPaymentFlow,
    setSelectedPlan,
    handlePlanSelect,
    handlePaymentSuccess,
    handlePaymentError,
    handleViewInvoices,
    isPlanClickable,
  };
};

