import api from './api';
import { Platform } from 'react-native';
import { isIOSCompanionMode } from '../config/featureFlags';

/**
 * IAP Receipt Validation API
 * Handles server-side receipt validation for App Store and Play Store purchases
 * 
 * CRITICAL: All purchases MUST be validated server-side before granting access
 * This prevents fraud and ensures subscription integrity
 * 
 * APPLE COMPLIANCE (Guideline 3.1.1):
 * - iOS companion mode blocks all payment validation
 * - Receipt validation returns error on iOS
 * - No subscription syncing on iOS
 */
class IAPReceiptApi {
  /**
   * Validate iOS App Store receipt
   * ✅ APPLE COMPLIANCE: Blocks receipt validation on iOS companion mode
   * @param {Object} receiptData - Receipt data from iOS purchase
   * @returns {Promise<Object>} Validation response
   */
  static async validateiOSReceipt(receiptData) {
    try {
      // 🍎 iOS COMPANION MODE: Block payment validation
      if (isIOSCompanionMode()) {
        console.warn('🍎 [IAPReceiptApi] Receipt validation blocked on iOS companion mode');
        const error = new Error('Payment validation not available on iOS companion app');
        (error as any).code = 'COMPANION_MODE_BLOCKED';
        throw error;
      }
      
      const response = await api.post('/payments/validate-ios-receipt', {
        receiptData: receiptData.transactionReceipt,
        transactionId: receiptData.transactionId,
        productId: receiptData.productId,
        originalTransactionId: receiptData.originalTransactionId,
      });

      return response.data;
    } catch (error) {
      throw this.handleValidationError(error);
    }
  }

  /**
   * Validate Android Play Store receipt
   * @param {Object} receiptData - Receipt data from Android purchase
   * @returns {Promise<Object>} Validation response
   */
  static async validateAndroidReceipt(receiptData) {
    try {
      
      const response = await api.post('/payments/validate-android-receipt', {
        purchaseToken: receiptData.purchaseToken,
        productId: receiptData.productId,
        orderId: receiptData.orderId,
        packageName: receiptData.packageName,
        transactionReceipt: receiptData.transactionReceipt,
      });

      return response.data;
    } catch (error) {
      throw this.handleValidationError(error);
    }
  }

  /**
   * Validate receipt (automatically detects platform)
   * ✅ APPLE COMPLIANCE: Blocks validation on iOS
   * @param {Object} receiptData - Receipt data from purchase
   * @returns {Promise<Object>} Validation response
   */
  static async validateReceipt(receiptData) {
    try {
      // 🍎 iOS COMPANION MODE: Block payment validation on iOS
      if (receiptData.platform === 'ios' || Platform.OS === 'ios' || isIOSCompanionMode()) {
        console.warn('🍎 [IAPReceiptApi] Receipt validation blocked on iOS');
        const error = new Error('Payment validation not available on iOS companion app');
        (error as any).code = 'COMPANION_MODE_BLOCKED';
        throw error;
      }
      
      if (receiptData.platform === 'android') {
        return await this.validateAndroidReceipt(receiptData);
      } else {
        throw new Error('Unsupported platform for receipt validation');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check subscription status from native store
   * ✅ APPLE COMPLIANCE: Returns companion mode status on iOS
   * Used to sync subscription status with backend
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Subscription status
   */
  static async syncSubscriptionStatus(userId) {
    try {
      // 🍎 iOS COMPANION MODE: Return companion mode status, don't call API
      if (Platform.OS === 'ios' || isIOSCompanionMode()) {
        console.warn('🍎 [IAPReceiptApi] Subscription sync blocked on iOS companion mode');
        return {
          status: 'success',
          data: {
            subscriptionStatus: 'COMPANION_MODE',
            accessLevel: 'FREE',
            message: 'iOS companion app - no active subscription',
            timestamp: new Date().toISOString(),
          }
        };
      }
      
      const response = await api.post('/payments/sync-subscription-status', {
        userId,
        platform: Platform.OS,
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Restore purchases from native store
   * Validates all previous purchases and updates backend
   * @param {Array} purchases - Array of purchase objects
   * @returns {Promise<Object>} Restore result
   */
  static async restorePurchases(purchases) {
    try {
      
      // Extract receipt data from each purchase
      const receipts = purchases.map(purchase => ({
        platform: Platform.OS,
        productId: purchase.productId,
        transactionId: purchase.transactionId,
        transactionReceipt: purchase.transactionReceipt,
        originalTransactionId: purchase.originalTransactionIdentifierIOS,
        purchaseToken: purchase.purchaseToken,
        orderId: purchase.orderId,
        packageName: purchase.packageNameAndroid,
      }));

      const response = await api.post('/payments/restore-purchases', {
        receipts,
        platform: Platform.OS,
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Handle validation errors and provide user-friendly messages
   * @param {Error} error - Error object
   * @returns {Error} Enhanced error with user message
   */
  static handleValidationError(error) {
    let userMessage = 'Erreur lors de la validation de l\'achat';

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 400:
          userMessage = 'Reçu invalide. Veuillez réessayer.';
          break;
        case 404:
          userMessage = 'Achat introuvable. Contactez le support.';
          break;
        case 409:
          userMessage = 'Cet achat a déjà été validé.';
          break;
        case 422:
          userMessage = data?.message || 'Validation échouée. Vérifiez votre achat.';
          break;
        case 500:
          userMessage = 'Erreur serveur. Réessayez plus tard.';
          break;
        default:
          userMessage = data?.message || 'Erreur lors de la validation';
      }
    } else if (error.message?.includes('Network')) {
      userMessage = 'Erreur réseau. Vérifiez votre connexion.';
    }

    const enhancedError = new Error(userMessage);
    (enhancedError as any).originalError = error;
    return enhancedError;
  }

  /**
   * Create subscription via native IAP
   * This endpoint creates a subscription record after successful receipt validation
   * @param {string} productId - Product ID (SKU)
   * @param {Object} receiptData - Validated receipt data
   * @returns {Promise<Object>} Subscription data
   */
  static async createNativeSubscription(productId, receiptData) {
    try {
      
      const response = await api.post('/subscriptions/create-native', {
        productId,
        platform: Platform.OS,
        receiptData,
      });

      return response.data;
    } catch (error) {
      throw this.handleValidationError(error);
    }
  }

  /**
   * Get native subscription products
   * Returns mapping between backend plans and store product IDs
   * @returns {Promise<Object>} Product mapping
   */
  static async getNativeProducts() {
    try {
      
      const response = await api.get('/subscriptions/native-products');

      return response.data;
    } catch (error) {
      
      // Return default mapping as fallback
      return {
        success: true,
        data: {
          products: [
            { planId: 'premium_monthly', productId: 'com.laso.coach.premium_monthly' },
            { planId: 'premium_yearly', productId: 'com.laso.coach.premium_yearly' },
            { planId: 'basic_monthly', productId: 'com.laso.coach.basic_monthly' },
            { planId: 'flexy_monthly', productId: 'com.laso.coach.flexy_monthly' },
          ]
        }
      };
    }
  }
}

export default IAPReceiptApi;

