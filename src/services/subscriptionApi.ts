import api from './api';

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
   * @returns {Promise<Object>} Current subscription data
   */
  static async getCurrentSubscription() {
    try {
      const response = await api.get('/subscriptions/current');
      
      
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
      // Use api instance - interceptor automatically adds Authorization header
      const response = await api.post('/payments/create-paypal-order', orderData);
      
        // Backend returns { success: true, data: {...} } or { data: {...} }
      return response.data?.data || response.data;
    } catch (error) {
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
      // Use api instance - interceptor automatically adds Authorization header
      const response = await api.post('/payments/create-stripe-checkout-session', sessionData);
      
        // Backend returns { success: true, data: {...} } or { data: {...} }
      const sessionDataResult = response.data?.data || response.data;
        
        // Vérifier le format de la réponse
        // Le backend peut retourner soit une URL (webview) soit sessionId/clientSecret (SDK natif)
        // Les deux sont acceptables : URL sera utilisée dans une webview, sessionId/clientSecret pour le SDK natif
      if (sessionDataResult?.url || sessionDataResult?.checkoutUrl) {
          // Retourner l'URL telle quelle, elle sera utilisée dans une webview
        return sessionDataResult;
        }
        
        // Si pas d'URL, vérifier qu'on a sessionId et clientSecret pour le SDK natif
      if (!sessionDataResult?.sessionId || !sessionDataResult?.clientSecret) {
        // Log warning but don't throw - let the caller handle it
      }
      
      return sessionDataResult;
    } catch (error) {
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
   * Subscribe to a plan (same endpoint as web version)
   * POST /subscriptions/subscribe - Utilisé par la version web
   * @param {Object} subscriptionData - Subscription data with subscriptionPlanId
   * @returns {Promise<Object>} Subscription data
   */
  static async subscribe(subscriptionData) {
    try {
      
      // Utiliser exactement le même endpoint que la version web
      const response = await api.post('/subscriptions/subscribe', subscriptionData);
      
      
      return response.data.data || response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Activate free trial subscription
   * Utilise le même endpoint que la version web: POST /subscriptions/subscribe
   * Le backend détecte automatiquement que c'est un plan gratuit (price = 0)
   * @param {string} planId - Plan ID
   * @returns {Promise<Object>} Subscription data
   */
  static async activateFreeTrial(planId) {
    try {
      
      // Utiliser exactement le même endpoint et format que la version web
      const subscriptionData = {
        subscriptionPlanId: planId, // Format utilisé par la version web
      };
      
      return await this.subscribe(subscriptionData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Retry payment
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} Retry payment data
   */
  static async retryPayment(transactionId) {
    try {
      
      const response = await api.post(`/payments/retry/${transactionId}`);
      
      
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
