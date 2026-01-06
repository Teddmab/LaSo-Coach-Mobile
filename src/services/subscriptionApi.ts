import api from './api';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Config from '../config/env';
import { AxiosResponse } from 'axios';

export class SubscriptionApi {
  /**
   * Get all subscription plans
   * @returns {Promise<Array>} Array of subscription plans
   */
  static async getPlans() {
    try {
      const response = await api.get('/subscriptions/plans');
      
      
      return response.data.data || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get current subscription status
   * Aligned with web version: GET /api/v1/subscriptions
   * @returns {Promise<Object>} Current subscription data
   */
  static async getCurrentSubscription() {
    try {
      // Utiliser le même endpoint que la version web
      const response = await api.get('/subscriptions');
      
      
      return response.data.data || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get subscription history
   * @returns {Promise<Object>} Subscription history response with success and data
   */
  static async getHistory() {
    try {
      const response = await api.get('/subscriptions/history');
      
      
      return response.data;
    } catch (error) {
      return { success: false, data: [] };
    }
  }

  /**
   * Get latest payment method
   * @returns {Promise<Object>} Latest payment method data
   */
  static async getLatestPaymentMethod() {
    try {
      const response = await api.get('/subscriptions/latest-payment-method');
      
      
      return response.data.data || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get pending payments
   * @returns {Promise<Array>} Array of pending payments
   */
  static async getPendingPayments() {
    try {
      const response = await api.get('/payments/pending');
      
      
      return response.data.data || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Create PayPal order
   * @param {Object} orderData - Order data
   * @returns {Promise<Object>} PayPal order data
   */
  static async createPayPalOrder(orderData) {
    try {
      
      // Get Firebase ID token for authentication
      const firebaseAuthService = require('./firebaseAuthServiceNew').default;
      const idToken = await firebaseAuthService.getIdToken();
      
      if (!idToken) {
        throw new Error('Token d\'authentification manquant. Veuillez vous reconnecter.');
      }
      
      const endpoint = '/payments/create-paypal-order';
      const fullUrl = `${Config.API_BASE_URL}${endpoint}`;
      
      
      // Use react-native-blob-util for POST request with JSON body
      // For JSON requests, we need to pass the stringified JSON as the body
      // NOTE: This bypasses Axios interceptors completely
      const response = await ReactNativeBlobUtil.fetch(
        'POST',
        fullUrl,
        {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        JSON.stringify(orderData)
      );
      
      
      const statusCode = response.info().status;
      
      // Parse JSON response (react-native-blob-util provides .json() method)
      const responseData = response.json();
      
      
      if (statusCode >= 200 && statusCode < 300) {
        // Backend returns { success: true, data: {...} } or { data: {...} }
        return responseData.data || responseData;
      } else {
        // Handle error response from backend
        const errorMessage = responseData?.error?.message || 
                           responseData?.message || 
                           `Erreur ${statusCode}: Erreur lors de la création de la commande PayPal`;
        const error = new Error(errorMessage);
        error.response = {
          status: statusCode,
          statusText: response.info().statusText,
          data: responseData
        };
        throw error;
      }
    } catch (error) {
      // Handle react-native-blob-util errors differently from Axios errors
      if (error.response) {
        // Error response available
      } else if (error.info) {
        // react-native-blob-util error format
      }
      
      throw error;
    }
  }

  /**
   * Create Stripe checkout session
   * @param {Object} sessionData - Session data
   * @returns {Promise<Object>} Stripe session data
   */
  static async createStripeCheckoutSession(sessionData) {
    try {
      
      // Get Firebase ID token for authentication
      const firebaseAuthService = require('./firebaseAuthServiceNew').default;
      const idToken = await firebaseAuthService.getIdToken();
      
      if (!idToken) {
        throw new Error('Token d\'authentification manquant. Veuillez vous reconnecter.');
      }
      
      const endpoint = '/payments/create-stripe-checkout-session';
      const fullUrl = `${Config.API_BASE_URL}${endpoint}`;
      
      
      // Use react-native-blob-util for POST request with JSON body
      // NOTE: This bypasses Axios interceptors completely
      const response = await ReactNativeBlobUtil.fetch(
        'POST',
        fullUrl,
        {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        JSON.stringify(sessionData)
      );
      
      
      const statusCode = response.info().status;
      
      // Parse JSON response
      const responseData = response.json();
      
      
      if (statusCode >= 200 && statusCode < 300) {
        // Backend returns { success: true, data: {...} } or { data: {...} }
        const sessionData = responseData.data || responseData;
        
        // Vérifier le format de la réponse
        // Le backend peut retourner soit une URL (webview) soit sessionId/clientSecret (SDK natif)
        // Les deux sont acceptables : URL sera utilisée dans une webview, sessionId/clientSecret pour le SDK natif
        if (sessionData?.url || sessionData?.checkoutUrl) {
          // Retourner l'URL telle quelle, elle sera utilisée dans une webview
          return sessionData;
        }
        
        // Si pas d'URL, vérifier qu'on a sessionId et clientSecret pour le SDK natif
        if (!sessionData?.sessionId || !sessionData?.clientSecret) {
        } else {
        }
        
        return sessionData;
      } else {
        // Handle error response from backend
        const errorMessage = responseData?.error?.message || 
                           responseData?.message || 
                           `Erreur ${statusCode}: Erreur lors de la création de la session Stripe`;
        const error = new Error(errorMessage);
        error.response = {
          status: statusCode,
          statusText: response.info().statusText,
          data: responseData
        };
        throw error;
      }
    } catch (error) {
      if (error.response) {
        // Error response available
      } else if (error.info) {
        // react-native-blob-util error format
      }
      
      throw error;
    }
  }

  /**
   * Confirm Stripe payment
   * @param {Object} paymentData - Payment confirmation data
   * @returns {Promise<Object>} Subscription data
   */
  static async confirmStripePayment(paymentData) {
    try {
      
      const response = await api.post('/payments/confirm-stripe-payment', paymentData);
      
      
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Confirm PayPal payment
   * @param {Object} paymentData - Payment confirmation data
   * @returns {Promise<Object>} Subscription data
   */
  static async confirmPayPalPayment(paymentData) {
    try {
      
      const response = await api.post('/payments/confirm-paypal-payment', paymentData);
      
      
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Subscribe to a plan (aligned with web version)
   * POST /subscriptions/create - Same endpoint as web version
   * Note: API_BASE_URL already contains /api/v1, so we only need /subscriptions/create
   * @param {Object} subscriptionData - Subscription data with planId
   * @returns {Promise<Object>} Subscription data
   */
  static async subscribe(subscriptionData) {
    try {
      
      // Utiliser exactement le même endpoint que la version web
      // API_BASE_URL contient déjà /api/v1, donc on utilise seulement /subscriptions/create
      const response = await api.post('/subscriptions/create', subscriptionData);
      
      
      return response.data.data || response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Activate free trial subscription
   * Utilise le même endpoint que la version web: POST /subscriptions/create
   * Le backend détecte automatiquement que c'est un plan gratuit (price = 0)
   * @param {string} planId - Plan ID
   * @returns {Promise<Object>} Subscription data
   */
  static async activateFreeTrial(planId) {
    try {
      
      // Utiliser exactement le même endpoint et format que la version web
      const subscriptionData = {
        planId: planId, // Format utilisé par la version web (aligned)
      };
      
      return await this.subscribe(subscriptionData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Retry payment
   * Aligned with backend: POST /api/v1/payments/:transactionId/retry
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} Retry payment data
   */
  static async retryPayment(transactionId) {
    try {
      
      // Utiliser le même format que le backend: /payments/:transactionId/retry
      const response = await api.post(`/payments/${transactionId}/retry`);
      
      
      return response.data.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get billing period text
   * @param {number} duration - Duration in days
   * @returns {string} Billing period text
   */
  static getBillingPeriod(duration) {
    if (duration === 1) return 'jour';
    if (duration < 7) return `${duration} jours`;
    if (duration === 7) return 'semaine';
    if (duration < 30) return `${Math.floor(duration / 7)} semaines`;
    if (duration === 30) return 'mois';
    if (duration < 365) return `${Math.floor(duration / 30)} mois`;
    if (duration === 365) return 'an';
    return `${Math.floor(duration / 365)} ans`;
  }

  /**
   * Format price with currency
   * @param {number} price - Price amount
   * @param {string} currency - Currency code
   * @returns {string} Formatted price
   */
  static formatPrice(price, currency = 'EUR') {
    if (price === 0) return 'Gratuit';
    return `${price}€`;
  }

  /**
   * Get subscription status text
   * @param {string} status - Status code
   * @returns {string} Status text
   */
  static getStatusText(status) {
    const statusMap = {
      'ACTIVE': 'Actif',
      'PENDING': 'En attente',
      'CANCELLED': 'Annulé',
      'EXPIRED': 'Expiré',
      'TRIAL': 'Essai gratuit'
    };
    return statusMap[status] || status;
  }

  /**
   * Calculate subscription start date
   * @param {string} planId - Plan ID
   * @returns {Promise<Object>} Start date calculation
   */
  static async calculateStartDate(planId) {
    try {
      const response = await api.post('/subscriptions/calculate-start-date', { planId });
      
      
      return response.data.data || { startDate: new Date() };
    } catch (error) {
      return { startDate: new Date() }; // Fallback to immediate start
    }
  }

  /**
   * Manual subscription renewal
   * @returns {Promise<Object>} Renewal response
   */
  static async renewSubscription() {
    try {
      const response = await api.post('/subscriptions/renew');
      
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get auto-renewal status
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<Object>} Auto-renewal status
   */
  static async getAutoRenewalStatus(subscriptionId) {
    try {
      const response = await api.get(`/subscriptions/${subscriptionId}/auto-renewal/status`);
      
      
      return response.data.data;
    } catch (error) {
      return { enabled: false };
    }
  }

  /**
   * Enable auto-renewal
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<Object>} Enable response
   */
  static async enableAutoRenewal(subscriptionId) {
    try {
      const response = await api.put(`/subscriptions/${subscriptionId}/auto-renewal/enable`);
      
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Disable auto-renewal
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<Object>} Disable response
   */
  static async disableAutoRenewal(subscriptionId) {
    try {
      const response = await api.put(`/subscriptions/${subscriptionId}/auto-renewal/disable`);
      
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get payment method display name
   * @param {Object} paymentMethod - Payment method data
   * @returns {string} Display name
   */
  static getPaymentMethodDisplayName(paymentMethod) {
    if (!paymentMethod) return 'Aucune méthode de paiement';
    
    if (paymentMethod.paymentMethod === 'paypal') {
      return 'PayPal';
    }
    
    if (paymentMethod.paymentMethod === 'stripe') {
      return paymentMethod.displayName || `Carte ${paymentMethod.cardBrand} •••• ${paymentMethod.cardLast4}`;
    }
    
    return 'Méthode de paiement inconnue';
  }

  /**
   * Get Stripe publishable key from backend
   * @returns {Promise<string|null>} Stripe publishable key or null
   */
  static async getStripePublishableKey() {
    try {
      const response = await api.get('/payments/config');
      
      return response.data?.data?.stripePublishableKey || response.data?.stripePublishableKey || null;
    } catch (error) {
      return null;
    }
  }
}

export default SubscriptionApi;
