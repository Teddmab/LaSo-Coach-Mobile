import SubscriptionApi from '../subscriptionApi';

export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  planName?: string;
  planId?: string;
  status?: string;
  expiresAt?: string;
  daysRemaining?: number;
  isTrial?: boolean;
}

/**
 * Service pour vérifier le statut d'abonnement
 * Fonctionne sur toutes les plateformes (iOS, Android, Web)
 */
export class SubscriptionStatusService {
  /**
   * Vérifie le statut d'abonnement actuel de l'utilisateur
   * @returns Promise avec le statut de l'abonnement
   */
  async checkStatus(): Promise<SubscriptionStatus> {
    try {
      const subscription = await SubscriptionApi.getCurrentSubscription();
      
      if (!subscription) {
        return {
          hasActiveSubscription: false,
        };
      }

      const status = subscription.status || subscription.subscription?.status;
      const isActive = status === 'ACTIVE' || status === 'TRIAL';
      const daysRemaining = subscription.daysRemaining ?? subscription.subscription?.daysRemaining ?? 0;
      const isExpired = daysRemaining <= 0 && status !== 'ACTIVE';

      return {
        hasActiveSubscription: isActive && !isExpired,
        planName: subscription.planName || subscription.subscription?.planName,
        planId: subscription.planId || subscription.subscription?.planId,
        status: status,
        expiresAt: subscription.expiresAt || subscription.subscription?.expiresAt,
        daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
        isTrial: subscription.isTrial ?? subscription.subscription?.isTrial ?? false,
      };
    } catch (error) {
      console.error('Erreur lors de la vérification du statut d\'abonnement:', error);
      return {
        hasActiveSubscription: false,
      };
    }
  }

  /**
   * Force un rafraîchissement du statut depuis le backend
   * Utile après qu'un utilisateur se soit abonné sur le site web
   */
  async refreshStatus(): Promise<SubscriptionStatus> {
    // Pour forcer un refresh, on peut faire un appel avec un cache-busting
    // ou simplement rappeler checkStatus (le backend devrait retourner les données à jour)
    return this.checkStatus();
  }
}

// Instance singleton
export const subscriptionStatusService = new SubscriptionStatusService();

