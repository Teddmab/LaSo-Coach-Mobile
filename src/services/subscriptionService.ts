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
      
      // Debug response
      debugResponse(response, 'Subscription Status');
      
      
      // Parse the profile data structure
      const rawData = response.data.data || response.data;
      
      // Extract subscription information
      const subscription = rawData.subscription;
      const hasActiveSubscription = rawData.hasActiveSubscription || false;
      const daysRemaining = subscription?.daysRemaining || 0;
      
      // Determine subscription status
      // Priority: 1. Check subscription.status from API, 2. Calculate from daysRemaining
      let status = SUBSCRIPTION_STATUS.FREE;
      let accessLevel = ACCESS_LEVEL.FREE;
      let isExpired = false;
      let isExpiringSoon = false;
      let requiresRenewal = false;
      
      // First, check the actual status from the API response
      const apiStatus = subscription?.status?.toUpperCase();
      
      if (apiStatus === 'EXPIRED' || apiStatus === 'CANCELLED' || apiStatus === 'INACTIVE') {
        // API explicitly says expired/cancelled/inactive
        status = SUBSCRIPTION_STATUS.EXPIRED;
        accessLevel = ACCESS_LEVEL.EXPIRED;
        isExpired = true;
        requiresRenewal = true;
      } else if (hasActiveSubscription && subscription) {
        // Calculate status based on daysRemaining if API status is not explicitly expired
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
      
    } catch (error) {
      // Return default expired status on error
      return {
        status: SUBSCRIPTION_STATUS.EXPIRED,
        accessLevel: ACCESS_LEVEL.EXPIRED,
        daysRemaining: 0,
        hasActiveSubscription: false,
        subscription: null,
        message: 'Erreur lors de la vérification de l\'abonnement',
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
  static getStatusMessage(status, daysRemaining) {
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