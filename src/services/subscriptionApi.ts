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
   * Subscribe to a plan (aligned with web version)
   * POST /subscriptions/create - API_BASE_URL already contains /api/v1
   * Format: { planId: string } - Same format as web version
   * @param {Object} subscriptionData - Subscription data with planId
   * @returns {Promise<Object>} Subscription data
   */
  static async subscribe(subscriptionData) {
    try {
      // API_BASE_URL already contains /api/v1, so use /subscriptions/create
      // Final URL will be: {API_BASE_URL}/subscriptions/create = {API_BASE_URL}/api/v1/subscriptions/create
      console.log('📤 [SubscriptionApi] Envoi de la requête subscribe:', {
        endpoint: '/subscriptions/create',
        subscriptionData,
      });
      
      const response = await api.post('/subscriptions/create', subscriptionData);
      
      console.log('✅ [SubscriptionApi] Réponse subscribe reçue:', {
        status: response.status,
        data: response.data,
      });
      
      return response.data.data || response.data;
    } catch (error: any) {
      // ✅ Log détaillé de l'erreur avant de la propager
      console.error('❌ [SubscriptionApi] Erreur dans subscribe:', {
        error,
        errorType: typeof error,
        errorKeys: Object.keys(error || {}),
        errorResponse: error?.response,
        errorStatus: error?.response?.status,
        errorData: error?.response?.data,
        errorMessage: error?.message,
        fullErrorString: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
      });
      
      throw error;
    }
  }

  /**
   * Activate free trial subscription
   * Utilise le même endpoint que la version web: POST /subscriptions/create
   * Le backend détecte automatiquement que c'est un plan gratuit (price = 0)
   * Format: { planId: string } - Same format as web version
   * @param {string} planId - Plan ID
   * @returns {Promise<Object>} Subscription data
   */
  static async activateFreeTrial(planId) {
    try {
      // Utiliser exactement le même format que la version web
      const subscriptionData = {
        planId: planId, // Format utilisé par la version web (au lieu de subscriptionPlanId)
      };
      
      console.log('🆓 [SubscriptionApi] Activation de l\'essai gratuit:', {
        planId,
        subscriptionData,
        endpoint: '/subscriptions/create',
      });
      
      const result = await this.subscribe(subscriptionData);
      
      console.log('✅ [SubscriptionApi] Essai gratuit activé avec succès:', result);
      
      return result;
    } catch (error: any) {
      // ✅ Extraire correctement les données d'erreur selon la structure fetch/axios
      const errorStatus = error?.response?.status || error?.status || (error?.message?.includes('400') ? 400 : undefined);
      const errorData = error?.response?.data || error?.data || null;
      const errorMessage = errorData?.message || errorData?.error || error?.message;
      
      console.error('❌ [SubscriptionApi] Erreur lors de l\'activation de l\'essai gratuit:', {
        planId,
        errorType: typeof error,
        errorKeys: Object.keys(error || {}),
        errorResponse: error?.response,
        errorStatus,
        errorData,
        errorMessage,
        fullError: error,
        fullErrorString: JSON.stringify(error, null, 2),
      });
      
      // ✅ Enrichir l'erreur avec les données extraites pour faciliter le debug
      if (error && !error.response) {
        error.response = {
          status: errorStatus,
          data: errorData,
        };
      }
      
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

  /**
   * Get payment config from backend (admin-controlled).
   * Stripe is shown as payment method only if the admin has enabled it.
   * @returns {Promise<{ stripeEnabled: boolean }>}
   */
  static async getPaymentConfig() {
    try {
      const response = await api.get('/payments/config');
      const data = response.data?.data || response.data || {};
      const stripePublishableKey = data.stripePublishableKey || response.data?.stripePublishableKey;
      const stripeEnabled = data.stripeEnabled ?? (!!stripePublishableKey);
      return { stripeEnabled: Boolean(stripeEnabled) };
    } catch (error) {
      return { stripeEnabled: false };
    }
  }
}

export default SubscriptionApi;
