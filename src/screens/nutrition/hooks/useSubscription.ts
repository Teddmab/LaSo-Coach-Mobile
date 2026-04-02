import { useMemo } from 'react';
import { SubscriptionData } from '../types';
import { useIOSSimulation } from '../../../hooks/useIOSSimulation';
import useCompanionMode from '../../../hooks/useCompanionMode';

export const useSubscription = (subscriptionData: SubscriptionData | null) => {
  const { shouldShowIOSOnly } = useIOSSimulation();
  const isIOS = shouldShowIOSOnly();
  const { isCompanionMode } = useCompanionMode();

  // ✅ LOGIQUE D'ABONNEMENT CORRIGÉE
  // Sur iOS et Android, on vérifie réellement si l'utilisateur a un abonnement actif
  // Pour la complétion des repas, on a besoin d'un abonnement actif même sur iOS
  const hasActiveSubscription = useMemo(() => {
    // Vérifier si l'utilisateur a un abonnement actif
    if (subscriptionData) {
      const status = (subscriptionData as any)?.status || (subscriptionData as any)?.subscription?.status;
      const daysRemaining = (subscriptionData as any)?.daysRemaining;
      const isExpired = (subscriptionData as any)?.isExpired || (subscriptionData as any)?.subscription?.isExpired;
      
      // Abonnement actif si :
      // - Status est ACTIVE
      // - daysRemaining > 0
      // - Pas expiré
      // - Status n'est pas EXPIRED ou CANCELLED
      const hasActive = 
        (status === 'ACTIVE' || status?.toUpperCase() === 'ACTIVE') &&
        (daysRemaining === undefined || daysRemaining > 0) &&
        !isExpired &&
        status !== 'EXPIRED' &&
        status !== 'CANCELLED';
      
      if (hasActive) {
        return true;
      }
    }
    
    // Fallback : vérifier hasActiveSubscription si disponible
    if ((subscriptionData as any)?.hasActiveSubscription === true) {
      return true;
    }
    
    return false;
  }, [subscriptionData]);

  return {
    hasActiveSubscription,
    isIOS,
    isCompanionMode,
  };
};

