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
      // On a toujours un plan par défaut avec access level ACTIVE, donc on ne doit jamais afficher l'alerte
      const hasActivePlan = subscriptionData.status === 'ACTIVE' ||
        subscriptionData.status === SUBSCRIPTION_STATUS.ACTIVE ||
        subscriptionData.subscription?.status?.toUpperCase() === 'ACTIVE' ||
        subscriptionData.accessLevel === 'ACTIVE' ||
        subscriptionData.accessLevel === 'FREE';

      if (hasActivePlan) {
        setShowSubscriptionAlert(false);
        setSubscriptionAlertType(null);
        if (__DEV__) {
          console.log('✅ [useSubscription] Plan actif (même FREE) - pas d\'alerte', {
            status: subscriptionData.status,
            subscriptionStatus: subscriptionData.subscription?.status,
            accessLevel: subscriptionData.accessLevel,
            isExpired: subscriptionData.isExpired,
          });
        }
      } else if (statusRequiresModal) {
        // Ne pas afficher l'alerte si le statut est ACTIVE (même pour plan FREE par défaut)
        // Cela s'applique à iOS et Android - on a toujours un plan par défaut en cas de non-abonnement
        // Si le backend retourne ACTIVE, c'est qu'il y a un plan actif (même FREE)
        if (subscriptionData.subscription?.status?.toUpperCase() === 'ACTIVE' ||
          subscriptionData.status === 'ACTIVE') {
          // Plan actif (même FREE) - ne pas afficher l'alerte
          setShowSubscriptionAlert(false);
          setSubscriptionAlertType(null);
          if (__DEV__) {
            console.log('✅ [useSubscription] Plan actif (même FREE) - pas d\'alerte d\'expiration');
          }
        } else {
          // Vraiment expiré sans plan par défaut - MAIS on ne veut plus afficher l'alerte
          // L'utilisateur reste sur le plan test/free
          setShowSubscriptionAlert(false);
          setSubscriptionAlertType(null);
          if (__DEV__) {
            console.log('ℹ️ [useSubscription] Subscription expired but alert disabled by user request');
          }
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
      // Ne pas afficher l'alerte en cas d'erreur - on assume qu'il y a un plan par défaut
      // Comme sur iOS, on ne veut pas perturber l'utilisateur avec des alertes d'expiration
      setShowSubscriptionAlert(false);
      setSubscriptionAlertType(null);
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

