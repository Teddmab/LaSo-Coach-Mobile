import { useState, useEffect, useCallback } from 'react';
import { NavigationProp } from '@react-navigation/native';
import SubscriptionApi from '../../../../services/subscriptionApi';
import SubscriptionService from '../../../../services/subscriptionService';
import { Plan, SubscriptionData, Invoice } from '../types';
import Toast from 'react-native-toast-message';

export const useSubscriptionScreen = (
  navigation?: NavigationProp<any>,
  refreshProfile?: () => Promise<void>
) => {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<SubscriptionData | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [showPaymentFlow, setShowPaymentFlow] = useState(false);

  const loadPlans = useCallback(async () => {
    try {
      const plansData = await SubscriptionApi.getPlans();
      setPlans(plansData || []);
    } catch (error) {
      console.error('Error loading plans:', error);
      setPlans([]);
    }
  }, []);

  const loadSubscriptionStatus = useCallback(async () => {
    try {
      const status = await SubscriptionService.getSubscriptionStatus();
      setCurrentSubscription(status);
    } catch (error) {
      console.error('Error loading subscription status:', error);
      setCurrentSubscription(null);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadPlans(), loadSubscriptionStatus()]);
      setLoading(false);
    };
    loadData();
  }, [loadPlans, loadSubscriptionStatus]);

  const handlePlanSelect = useCallback((plan: Plan) => {
    setSelectedPlan(plan);
    setShowPaymentFlow(true);
  }, []);

  const handlePaymentSuccess = useCallback(async (paymentData: any) => {
    try {
      setShowPaymentFlow(false);
      setSelectedPlan(null);
      
      if (refreshProfile) {
        await refreshProfile();
      }
      
      await loadSubscriptionStatus();
      
      Toast.show({
        type: 'success',
        text1: 'Paiement réussi',
        text2: 'Votre abonnement a été activé avec succès.',
      });
    } catch (error) {
      console.error('Error after payment success:', error);
    }
  }, [refreshProfile, loadSubscriptionStatus]);

  const handlePaymentError = useCallback((error: any) => {
    setShowPaymentFlow(false);
    setSelectedPlan(null);
    
    Toast.show({
      type: 'error',
      text1: 'Erreur de paiement',
      text2: error?.message || 'Une erreur est survenue lors du paiement.',
    });
  }, []);

  const handleViewInvoices = useCallback(async () => {
    setShowInvoiceModal(true);
    setLoadingInvoices(true);
    
    try {
      // Load invoices from API
      const response = await SubscriptionApi.getHistory();
      if (response?.success && response?.data) {
        setInvoices(response.data);
      } else {
        setInvoices([]);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
      setInvoices([]);
    } finally {
      setLoadingInvoices(false);
    }
  }, []);

  const isPlanClickable = useCallback((plan: Plan) => {
    if (!currentSubscription) return true;
    const currentPlanId = currentSubscription.subscription?.plan?.id;
    return plan.id !== currentPlanId;
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

