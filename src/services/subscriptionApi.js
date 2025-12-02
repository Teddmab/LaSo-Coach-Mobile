import api from './api';

class SubscriptionApi {
  /**
   * Get all subscription plans
   * @returns {Promise<Array>} Array of subscription plans
   */
  static async getPlans() {
    try {
      console.log('💳 Fetching subscription plans...');
      const response = await api.get('/subscriptions/plans');
      
      console.log('✅ Subscription plans fetched successfully');
      console.log('💳 Plans data:', response.data);
      
      return response.data.data || [];
    } catch (error) {
      console.error('❌ Error fetching subscription plans:', error);
      throw error;
    }
  }

  /**
   * Get current subscription status
   * @returns {Promise<Object>} Current subscription data
   */
  static async getCurrentSubscription() {
    try {
      console.log('💳 Fetching current subscription...');
      const response = await api.get('/subscriptions/current');
      
      console.log('✅ Current subscription fetched successfully');
      console.log('💳 Subscription data:', response.data);
      
      return response.data.data || null;
    } catch (error) {
      console.error('❌ Error fetching current subscription:', error);
      return null;
    }
  }

  /**
   * Get subscription history
   * @returns {Promise<Object>} Subscription history response with success and data
   */
  static async getHistory() {
    try {
      console.log('💳 Fetching subscription history...');
      const response = await api.get('/subscriptions/history');
      
      console.log('✅ Subscription history fetched successfully');
      console.log('💳 History data:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching subscription history:', error);
      return { success: false, data: [] };
    }
  }

  /**
   * Get latest payment method
   * @returns {Promise<Object>} Latest payment method data
   */
  static async getLatestPaymentMethod() {
    try {
      console.log('💳 Fetching latest payment method...');
      const response = await api.get('/subscriptions/latest-payment-method');
      
      console.log('✅ Latest payment method fetched successfully');
      console.log('💳 Payment method data:', response.data);
      
      return response.data.data || null;
    } catch (error) {
      console.error('❌ Error fetching latest payment method:', error);
      return null;
    }
  }

  /**
   * Get pending payments
   * @returns {Promise<Array>} Array of pending payments
   */
  static async getPendingPayments() {
    try {
      console.log('💳 Fetching pending payments...');
      const response = await api.get('/payments/pending');
      
      console.log('✅ Pending payments fetched successfully');
      console.log('💳 Pending payments data:', response.data);
      
      return response.data.data || [];
    } catch (error) {
      console.error('❌ Error fetching pending payments:', error);
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
      console.log('💳 Creating PayPal order...');
      console.log('💳 Order data:', orderData);
      
      const response = await api.post('/payments/create-paypal-order', orderData);
      
      console.log('✅ PayPal order created successfully');
      console.log('💳 PayPal order response:', response.data);
      
      return response.data.data;
    } catch (error) {
      console.error('❌ Error creating PayPal order:', error);
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
      console.log('💳 Creating Stripe checkout session...');
      console.log('💳 Session data:', sessionData);
      
      const response = await api.post('/payments/create-stripe-checkout-session', sessionData);
      
      console.log('✅ Stripe checkout session created successfully');
      console.log('💳 Stripe session response:', response.data);
      
      return response.data.data;
    } catch (error) {
      console.error('❌ Error creating Stripe checkout session:', error);
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
      console.log('💳 Confirming Stripe payment...');
      console.log('💳 Payment data:', paymentData);
      
      const response = await api.post('/payments/confirm-stripe-payment', paymentData);
      
      console.log('✅ Stripe payment confirmed successfully');
      console.log('💳 Confirmation response:', response.data);
      
      return response.data.data;
    } catch (error) {
      console.error('❌ Error confirming Stripe payment:', error);
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
      console.log('💳 Confirming PayPal payment...');
      console.log('💳 Payment data:', paymentData);
      
      const response = await api.post('/payments/confirm-paypal-payment', paymentData);
      
      console.log('✅ PayPal payment confirmed successfully');
      console.log('💳 Confirmation response:', response.data);
      
      return response.data.data;
    } catch (error) {
      console.error('❌ Error confirming PayPal payment:', error);
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
      console.log('💳 Subscribing to plan (same endpoint as web)...');
      console.log('💳 Subscription data:', subscriptionData);
      
      // Utiliser exactement le même endpoint que la version web
      const response = await api.post('/subscriptions/subscribe', subscriptionData);
      
      console.log('✅ Subscription created successfully');
      console.log('💳 Subscription response:', response.data);
      
      return response.data.data || response.data;
    } catch (error) {
      console.error('❌ Error subscribing:', error);
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
      console.log('💳 Activating free trial for plan:', planId);
      console.log('💳 Using same endpoint as web version: /subscriptions/subscribe');
      
      // Utiliser exactement le même endpoint et format que la version web
      const subscriptionData = {
        subscriptionPlanId: planId, // Format utilisé par la version web
      };
      
      return await this.subscribe(subscriptionData);
    } catch (error) {
      console.error('❌ Error activating free trial:', error);
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
      console.log('💳 Retrying payment...');
      console.log('💳 Transaction ID:', transactionId);
      
      const response = await api.post(`/payments/retry/${transactionId}`);
      
      console.log('✅ Payment retry initiated successfully');
      console.log('💳 Retry response:', response.data);
      
      return response.data.data;
    } catch (error) {
      console.error('❌ Error retrying payment:', error);
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
      console.log('💳 Calculating start date for plan:', planId);
      const response = await api.post('/subscriptions/calculate-start-date', { planId });
      
      console.log('✅ Start date calculated successfully');
      console.log('💳 Start date response:', response.data);
      
      return response.data.data || { startDate: new Date() };
    } catch (error) {
      console.error('❌ Error calculating start date:', error);
      return { startDate: new Date() }; // Fallback to immediate start
    }
  }

  /**
   * Manual subscription renewal
   * @returns {Promise<Object>} Renewal response
   */
  static async renewSubscription() {
    try {
      console.log('💳 Renewing subscription...');
      const response = await api.post('/subscriptions/renew');
      
      console.log('✅ Subscription renewed successfully');
      console.log('💳 Renewal response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ Error renewing subscription:', error);
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
      console.log('💳 Getting auto-renewal status for subscription:', subscriptionId);
      const response = await api.get(`/subscriptions/${subscriptionId}/auto-renewal/status`);
      
      console.log('✅ Auto-renewal status fetched successfully');
      console.log('💳 Auto-renewal status:', response.data);
      
      return response.data.data;
    } catch (error) {
      console.error('❌ Error getting auto-renewal status:', error);
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
      console.log('💳 Enabling auto-renewal for subscription:', subscriptionId);
      const response = await api.put(`/subscriptions/${subscriptionId}/auto-renewal/enable`);
      
      console.log('✅ Auto-renewal enabled successfully');
      console.log('💳 Enable response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ Error enabling auto-renewal:', error);
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
      console.log('💳 Disabling auto-renewal for subscription:', subscriptionId);
      const response = await api.put(`/subscriptions/${subscriptionId}/auto-renewal/disable`);
      
      console.log('✅ Auto-renewal disabled successfully');
      console.log('💳 Disable response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ Error disabling auto-renewal:', error);
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
}

export default SubscriptionApi;
