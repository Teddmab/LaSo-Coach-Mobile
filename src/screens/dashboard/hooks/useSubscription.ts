import { useState, useEffect, useCallback } from 'react';
import SubscriptionService, { SUBSCRIPTION_STATUS } from '../../../services/subscriptionService';
import { useIOSSimulation } from '../../../hooks/useIOSSimulation';

export const useSubscription = () => {
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [showSubscriptionAlert, setShowSubscriptionAlert] = useState<boolean>(false);
  const [subscriptionAlertType, setSubscriptionAlertType] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { shouldShowIOSOnly } = useIOSSimulation();
  const isIOS = shouldShowIOSOnly();

  const checkSubscriptionStatus = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await SubscriptionService.getSubscriptionStatus();
      
      const subscriptionData: any = data;
      
      // Debug log
      if (__DEV__) {
        console.log('🔍 [useSubscription] Subscription status check:', {
          status: subscriptionData.status,
          isExpired: subscriptionData.isExpired,
          daysRemaining: subscriptionData.daysRemaining,
          hasActiveSubscription: subscriptionData.hasActiveSubscription,
        });
      }
      
      // Show modal ONLY if status is EXPIRED, INACTIVE, or CANCELLED
      // Also check isExpired flag as additional safeguard
      // IMPORTANT: Do NOT show modal if status is ACTIVE (even for FREE plan)
      const statusRequiresModal = 
        (subscriptionData.status === 'EXPIRED' || 
         subscriptionData.status === 'CANCELLED' || 
         subscriptionData.status === 'INACTIVE') &&
        subscriptionData.status !== 'ACTIVE' &&
        subscriptionData.status !== SUBSCRIPTION_STATUS.ACTIVE;
      
      // CRITICAL: If status is ACTIVE (even FREE plan with ACTIVE status), NEVER show the modal
      if (subscriptionData.status === 'ACTIVE' || 
          subscriptionData.status === SUBSCRIPTION_STATUS.ACTIVE ||
          (subscriptionData.subscription?.status?.toUpperCase() === 'ACTIVE' && !subscriptionData.isExpired)) {
        setShowSubscriptionAlert(false);
        setSubscriptionAlertType(null);
        if (__DEV__) {
          console.log('✅ [useSubscription] Subscription is ACTIVE - hiding alert', {
            status: subscriptionData.status,
            subscriptionStatus: subscriptionData.subscription?.status,
            isExpired: subscriptionData.isExpired,
          });
        }
      } else if (statusRequiresModal) {
        // Sur iOS, ne pas afficher l'alerte (Reader App model)
        // Sur Android, afficher l'alerte normalement
        if (!isIOS) {
          setSubscriptionAlertType('expired');
          setShowSubscriptionAlert(true);
          if (__DEV__) {
            console.log('⚠️ [useSubscription] Subscription expired/inactive - showing alert');
          }
        } else {
          // Sur iOS, ne pas afficher l'alerte même si l'abonnement est expiré
          setShowSubscriptionAlert(false);
          setSubscriptionAlertType(null);
        }
      } else {
        setShowSubscriptionAlert(false);
        setSubscriptionAlertType(null);
        if (__DEV__) {
          console.log('ℹ️ [useSubscription] Subscription status does not require alert');
        }
      }
      
      setSubscriptionData(subscriptionData);
    } catch (error: any) {
      // Default to expired status on error
      console.error('❌ [useSubscription] Error checking subscription:', error);
      setSubscriptionData({
        status: SUBSCRIPTION_STATUS.EXPIRED,
        isExpired: true,
        isExpiringSoon: false,
        daysRemaining: 0,
        requiresRenewal: true
      });
      // Sur iOS, ne pas afficher l'alerte même en cas d'erreur
      if (!isIOS) {
        setSubscriptionAlertType('expired');
        setShowSubscriptionAlert(true);
      } else {
        setShowSubscriptionAlert(false);
        setSubscriptionAlertType(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSubscriptionStatus();
  }, [checkSubscriptionStatus]);

  const shouldBlurMenu = subscriptionData?.status === 'EXPIRED' || subscriptionData?.status === 'INACTIVE';
  const requiresRenewal = subscriptionData?.requiresRenewal || false;

  return {
    subscriptionData,
    showSubscriptionAlert,
    subscriptionAlertType,
    loading,
    shouldBlurMenu,
    requiresRenewal,
    checkSubscriptionStatus,
    setSubscriptionData,
    setShowSubscriptionAlert,
    setSubscriptionAlertType,
  };
};

