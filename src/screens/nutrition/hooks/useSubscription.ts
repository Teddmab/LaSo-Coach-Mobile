import { useMemo } from 'react';
import { SubscriptionData } from '../types';
import { useIOSSimulation } from '../../../hooks/useIOSSimulation';
import useCompanionMode from '../../../hooks/useCompanionMode';

export const useSubscription = (subscriptionData: SubscriptionData | null) => {
  const { shouldShowIOSOnly } = useIOSSimulation();
  const isIOS = shouldShowIOSOnly();
  const { isCompanionMode } = useCompanionMode();

  // ✅ LOGIQUE D'ABONNEMENT CORRIGÉE (comme la version web)
  // Sur iOS (mode companion), on considère toujours qu'il y a un accès actif
  // Sur Android, on vérifie si l'abonnement n'est PAS expiré en utilisant daysRemaining
  // Tant que daysRemaining > 0, l'utilisateur a accès (même s'il reste peu de jours)
  const hasActiveSubscription = useMemo(() => {
    return isIOS || isCompanionMode || 
           (subscriptionData && 
            (subscriptionData as any)?.daysRemaining !== undefined &&
            (subscriptionData as any)?.daysRemaining > 0 &&
            (subscriptionData as any)?.status !== 'EXPIRED' &&
            (subscriptionData as any)?.status !== 'CANCELLED');
  }, [isIOS, isCompanionMode, subscriptionData]);

  return {
    hasActiveSubscription,
    isIOS,
    isCompanionMode,
  };
};

