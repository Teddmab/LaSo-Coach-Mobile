import api, { debugResponse } from './api';
import Config from '../config/env';

/**
 * Subscription Status Types
 */
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  EXPIRING_SOON: 'EXPIRING_SOON',
  FREE: 'FREE'
};

/**
 * Subscription Access Levels
 */
export const ACCESS_LEVEL = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  EXPIRING_SOON: 'EXPIRING_SOON',
  FREE: 'FREE'
};

/**
 * Subscription Service
 * Handles all subscription-related API calls and status checking
 */
export class SubscriptionService {
  /**
   * Get subscription status from profile endpoint
   * @returns {Promise<Object>} Subscription status and details
   */
  static async getSubscriptionStatus() {
    try {
      
      if (Config.OFFLINE_MODE) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
          status: SUBSCRIPTION_STATUS.EXPIRED,
          accessLevel: ACCESS_LEVEL.EXPIRED,
          daysRemaining: 0,
          hasActiveSubscription: false,
          subscription: {
            id: 'mock-subscription-id',
            status: 'EXPIRED',
            startDate: '2025-07-12T17:54:57.567Z',
            endDate: '2025-07-15T17:54:57.567Z',
            daysRemaining: 0,
            plan: {
              name: 'Flexy',
              description: 'This is a Flexy Subscription plan',
              originalPrice: 15,
              discountPrice: 5,
              effectivePrice: 5,
              hasDiscount: true,
              discountPercentage: 67
            }
          },
          message: 'Votre abonnement a expiré. Veuillez renouveler pour accéder aux plans nutritionnels.',
          isExpired: true,
          isExpiringSoon: false,
          requiresRenewal: true
        };
      }

      const response = await api.get('/profile');
      
      // Parse the profile data structure
      const rawData = response.data.data || response.data;
      
      // Ignore invalid properties from backend (e.g., subscriptionBanner, subscriptionbanner)
      // This property doesn't exist in our data model and should be ignored
      if (rawData && typeof rawData === 'object') {
        // Remove any invalid properties that might cause errors
        if ('subscriptionBanner' in rawData) {
          delete (rawData as any).subscriptionBanner;
        }
        if ('subscriptionbanner' in rawData) {
          delete (rawData as any).subscriptionbanner;
        }
      }
      
      // Extract subscription information
      // Check if subscription exists and is not null/empty
      const subscription = rawData.subscription;
      const hasSubscriptionData = subscription && typeof subscription === 'object' && Object.keys(subscription).length > 0;
      
      // Handle case where subscription data might be missing due to backend errors
      if (!rawData || (!hasSubscriptionData && !rawData.hasActiveSubscription)) {
        // Return default expired status if no subscription data
        return {
          status: SUBSCRIPTION_STATUS.EXPIRED,
          accessLevel: ACCESS_LEVEL.EXPIRED,
          daysRemaining: 0,
          hasActiveSubscription: false,
          isExpired: true,
          isExpiringSoon: false,
          requiresRenewal: true,
          message: 'Impossible de récupérer les informations d\'abonnement',
        };
      }
      const hasActiveSubscription = rawData.hasActiveSubscription || false;
      const daysRemaining = subscription?.daysRemaining || 0;
      const planName = subscription?.plan?.name || subscription?.planName || '';
      const isFreePlan = planName?.toLowerCase().includes('free') || false;
      
      // Determine subscription status
      // Priority: 1. Check subscription.status from API, 2. Check hasActiveSubscription, 3. Calculate from daysRemaining
      let status = SUBSCRIPTION_STATUS.FREE;
      let accessLevel = ACCESS_LEVEL.FREE;
      let isExpired = false;
      let isExpiringSoon = false;
      let requiresRenewal = false;
      
      // First, check the actual status from the API response
      // CRITICAL: Read status from subscription.status field (this is what backend returns)
      const apiStatus = subscription?.status?.toUpperCase();
      
      
      // Check if API explicitly says ACTIVE (even for FREE plan, if status is ACTIVE, it's active)
      if (apiStatus === 'ACTIVE') {
        // CRITICAL: If backend says status is ACTIVE, trust it and consider it ACTIVE
        // Don't override with daysRemaining check - backend is the source of truth
        // For FREE plan, daysRemaining might be 0 or undefined, but status ACTIVE means it's active
        if (daysRemaining > 0 && daysRemaining <= 3) {
          // If daysRemaining exists and is <= 3, mark as expiring soon
          status = SUBSCRIPTION_STATUS.EXPIRING_SOON;
          accessLevel = ACCESS_LEVEL.EXPIRING_SOON;
          isExpiringSoon = true;
          requiresRenewal = true;
        } else {
          // Status is ACTIVE - consider it ACTIVE regardless of daysRemaining
          // This handles FREE plan with ACTIVE status (daysRemaining might be 0 or undefined)
          status = SUBSCRIPTION_STATUS.ACTIVE;
          accessLevel = ACCESS_LEVEL.ACTIVE;
          isExpired = false;
          requiresRenewal = false;
        }
      } else if (apiStatus === 'EXPIRED' || apiStatus === 'CANCELLED' || apiStatus === 'INACTIVE') {
        // API explicitly says expired/cancelled/inactive
        status = SUBSCRIPTION_STATUS.EXPIRED;
        accessLevel = ACCESS_LEVEL.EXPIRED;
        isExpired = true;
        requiresRenewal = true;
      } else if (hasActiveSubscription && subscription) {
        // hasActiveSubscription is true but status not explicitly set - calculate from daysRemaining
        if (daysRemaining > 0) {
          if (daysRemaining <= 3) {
            status = SUBSCRIPTION_STATUS.EXPIRING_SOON;
            accessLevel = ACCESS_LEVEL.EXPIRING_SOON;
            isExpiringSoon = true;
            requiresRenewal = true;
          } else {
            status = SUBSCRIPTION_STATUS.ACTIVE;
            accessLevel = ACCESS_LEVEL.ACTIVE;
          }
        } else {
          // daysRemaining <= 0 means expired
          status = SUBSCRIPTION_STATUS.EXPIRED;
          accessLevel = ACCESS_LEVEL.EXPIRED;
          isExpired = true;
          requiresRenewal = true;
        }
      } else if (subscription && daysRemaining > 0) {
        // Fallback: if subscription exists and has days remaining, consider it active
        if (daysRemaining <= 3) {
          status = SUBSCRIPTION_STATUS.EXPIRING_SOON;
          accessLevel = ACCESS_LEVEL.EXPIRING_SOON;
          isExpiringSoon = true;
          requiresRenewal = true;
        } else {
          status = SUBSCRIPTION_STATUS.ACTIVE;
          accessLevel = ACCESS_LEVEL.ACTIVE;
        }
      } else if (subscription && apiStatus === 'ACTIVE') {
        // CRITICAL: If subscription exists and API status is ACTIVE (even if daysRemaining is 0 or undefined for FREE plan)
        // This handles the case where FREE plan has status ACTIVE
        status = SUBSCRIPTION_STATUS.ACTIVE;
        accessLevel = ACCESS_LEVEL.ACTIVE;
        // FREE plan with ACTIVE status should not be considered expired
        isExpired = false;
        requiresRenewal = false;
      }
      
      // Log final status for debugging
      if (__DEV__) {
      }
      
      const subscriptionData = {
        status,
        accessLevel,
        daysRemaining,
        hasActiveSubscription,
        subscription,
        message: this.getStatusMessage(status, daysRemaining),
        isExpired,
        isExpiringSoon,
        requiresRenewal,
        isTrial: subscription?.isTrial || false
      };
      
      return subscriptionData;
      
    } catch (error: any) {
      // Log error details for debugging
      const errorMessage = error.response?.data?.message || error.message || '';
      const isPrismaError = errorMessage.includes('Prisma') || 
                           errorMessage.includes('prisma') ||
                           errorMessage.includes('does not exist in the current database') ||
                           (errorMessage.includes('column') && errorMessage.includes('does not exist'));
      
      
      // Return default expired status on error
      // This allows the app to continue functioning even if subscription data cannot be retrieved
      return {
        status: SUBSCRIPTION_STATUS.EXPIRED,
        accessLevel: ACCESS_LEVEL.EXPIRED,
        daysRemaining: 0,
        hasActiveSubscription: false,
        subscription: null,
        message: isPrismaError 
          ? 'Erreur de configuration serveur. Veuillez contacter le support.'
          : 'Erreur lors de la vérification de l\'abonnement',
        isExpired: true,
        isExpiringSoon: false,
        requiresRenewal: true
      };
    }
  }

  /**
   * Get status message based on subscription status
   * @param {string} status - Subscription status
   * @param {number} daysRemaining - Days remaining
   * @returns {string} Status message
   */
  static getStatusMessage(status: string, daysRemaining: number) {
    switch (status) {
      case SUBSCRIPTION_STATUS.ACTIVE:
        return 'Accès complet aux plans nutritionnels';
      case SUBSCRIPTION_STATUS.EXPIRING_SOON:
        return `Votre abonnement expire dans ${daysRemaining} jour(s). Veuillez renouveler pour continuer l'accès.`;
      case SUBSCRIPTION_STATUS.EXPIRED:
        return 'Votre abonnement a expiré. Veuillez renouveler pour accéder aux plans nutritionnels.';
      case SUBSCRIPTION_STATUS.FREE:
        return 'Aucun abonnement actif trouvé';
      default:
        return 'Statut d\'abonnement inconnu';
    }
  }

  /**
   * Check if user can access premium features
   * @returns {Promise<boolean>} True if user has active subscription
   */
  static async canAccessPremiumFeatures() {
    try {
      const subscriptionData = await this.getSubscriptionStatus();
      return subscriptionData.status === SUBSCRIPTION_STATUS.ACTIVE || 
             subscriptionData.status === SUBSCRIPTION_STATUS.EXPIRING_SOON;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if subscription requires renewal
   * @returns {Promise<boolean>} True if subscription needs renewal
   */
  static async requiresRenewal() {
    try {
      const subscriptionData = await this.getSubscriptionStatus();
      return subscriptionData.requiresRenewal;
    } catch (error) {
      return true; // Default to requiring renewal on error
    }
  }

  /**
   * Get subscription alert type
   * @returns {Promise<string>} Alert type: 'expired', 'expiring_soon', or null
   */
  static async getAlertType() {
    try {
      const subscriptionData = await this.getSubscriptionStatus();
      
      if (subscriptionData.isExpired) {
        return 'expired';
      } else if (subscriptionData.isExpiringSoon) {
        return 'expiring_soon';
      }
      
      return null;
    } catch (error) {
      return 'expired'; // Default to expired on error
    }
  }
}

export default SubscriptionService; 