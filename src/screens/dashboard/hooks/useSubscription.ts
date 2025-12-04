import { useState, useEffect, useCallback } from 'react';
import SubscriptionService, { SUBSCRIPTION_STATUS } from '../../../services/subscriptionService';

export const useSubscription = () => {
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [showSubscriptionAlert, setShowSubscriptionAlert] = useState<boolean>(false);
  const [subscriptionAlertType, setSubscriptionAlertType] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const checkSubscriptionStatus = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      console.log('💳 Dashboard: Checking subscription status...');
      const data = await SubscriptionService.getSubscriptionStatus();
      
      const subscriptionData: any = data;
      console.log('💳 Dashboard: Subscription status:', {
        status: subscriptionData.status,
        isExpired: subscriptionData.isExpired,
        isExpiringSoon: subscriptionData.isExpiringSoon,
        daysRemaining: subscriptionData.daysRemaining,
        isTrial: subscriptionData.isTrial
      });
      
      // Show modal ONLY if status is EXPIRED, INACTIVE, or CANCELLED
      const statusRequiresModal = subscriptionData.status === 'EXPIRED' || 
                                   subscriptionData.status === 'CANCELLED' || 
                                   subscriptionData.status === 'INACTIVE';
      
      if (statusRequiresModal) {
        setSubscriptionAlertType('expired');
        setShowSubscriptionAlert(true);
      } else {
        setShowSubscriptionAlert(false);
      }
      
      setSubscriptionData(subscriptionData);
    } catch (error: any) {
      console.error('❌ Dashboard: Error checking subscription status:', error);
      // Default to expired status on error
      setSubscriptionData({
        status: SUBSCRIPTION_STATUS.EXPIRED,
        isExpired: true,
        isExpiringSoon: false,
        daysRemaining: 0,
        requiresRenewal: true
      });
      setSubscriptionAlertType('expired');
      setShowSubscriptionAlert(true);
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

