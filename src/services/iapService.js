import {
  initConnection,
  endConnection,
  getProducts,
  requestPurchase,
  getAvailablePurchases,
  finishTransaction,
  acknowledgePurchaseAndroid,
  purchaseErrorListener,
  purchaseUpdatedListener,
  Product,
  ProductPurchase,
  PurchaseError,
} from 'react-native-iap';
import { Platform } from 'react-native';

/**
 * IAPService - Native In-App Purchase Service
 * Handles iOS App Store and Google Play Store purchases
 * Compliant with Apple/Google policies for digital goods
 */
class IAPService {
  constructor() {
    this.purchaseUpdateSubscription = null;
    this.purchaseErrorSubscription = null;
    this.isInitialized = false;
  }

  /**
   * Initialize IAP connection
   * MUST be called before any purchase operations
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('💳 IAP already initialized');
      return true;
    }

    try {
      console.log('💳 Initializing IAP connection...');
      await initConnection();
      this.isInitialized = true;
      console.log('✅ IAP connection initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Error initializing IAP:', error);
      
      // E_IAP_NOT_AVAILABLE is expected on unsupported platforms (web, Windows, simulators without IAP configured)
      // This is NOT a fatal error - the app should continue with limited functionality
      if (error.code === 'E_IAP_NOT_AVAILABLE') {
        console.log('ℹ️ IAP not available on this platform - continuing without native purchases');
        return false;
      }
      
      return false;
    }
  }

  /**
   * End IAP connection
   * Should be called when app is closing or IAP is no longer needed
   */
  async disconnect() {
    try {
      if (this.purchaseUpdateSubscription) {
        this.purchaseUpdateSubscription.remove();
        this.purchaseUpdateSubscription = null;
      }
      if (this.purchaseErrorSubscription) {
        this.purchaseErrorSubscription.remove();
        this.purchaseErrorSubscription = null;
      }
      await endConnection();
      this.isInitialized = false;
      console.log('✅ IAP connection closed');
    } catch (error) {
      // E_IAP_NOT_AVAILABLE during disconnect is expected and safe to ignore
      if (error.code !== 'E_IAP_NOT_AVAILABLE') {
        console.error('❌ Error closing IAP connection:', error);
      }
    }
  }

  /**
   * Get available products from App Store / Play Store
   * @param {string[]} productIds - Array of product IDs configured in stores
   * @returns {Promise<Product[]>} Array of available products
   */
  async getAvailableProducts(productIds) {
    try {
      console.log('💳 Fetching available products:', productIds);
      
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          console.log('ℹ️ IAP not initialized - returning empty products');
          return [];
        }
      }

      const products = await getProducts({ skus: productIds });
      console.log('✅ Products fetched successfully:', products);
      
      return products;
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      
      // Return empty array instead of throwing for E_IAP_NOT_AVAILABLE
      if (error.code === 'E_IAP_NOT_AVAILABLE') {
        console.log('ℹ️ IAP not available - returning empty products');
        return [];
      }
      
      throw error;
    }
  }

  /**
   * Request a purchase (subscription or one-time)
   * @param {string} productId - Product ID (SKU)
   * @param {boolean} isSubscription - True for subscriptions, false for one-time
   * @returns {Promise<ProductPurchase>} Purchase result
   */
  async requestPurchase(productId, isSubscription = true) {
    try {
      console.log('💳 Requesting purchase for:', productId);
      
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Request purchase from native store
      if (Platform.OS === 'ios') {
        await requestPurchase({ sku: productId });
      } else if (Platform.OS === 'android') {
        await requestPurchase({
          skus: [productId],
          // For Android, specify if it's a subscription
          ...(isSubscription && { 
            subscriptionOffers: [{ sku: productId, offerToken: '' }] 
          })
        });
      }

      console.log('✅ Purchase request initiated');
      // Purchase result will be handled by purchaseUpdatedListener
      return null;
    } catch (error) {
      console.error('❌ Error requesting purchase:', error);
      throw error;
    }
  }

  /**
   * Setup purchase listeners
   * These listeners handle purchase success/failure
   * @param {Function} onPurchaseSuccess - Callback for successful purchase
   * @param {Function} onPurchaseError - Callback for purchase error
   */
  setupPurchaseListeners(onPurchaseSuccess, onPurchaseError) {
    try {
      // Remove existing listeners if any
      if (this.purchaseUpdateSubscription) {
        this.purchaseUpdateSubscription.remove();
      }
      if (this.purchaseErrorSubscription) {
        this.purchaseErrorSubscription.remove();
      }

      // Listen for successful purchases
      this.purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase) => {
        console.log('💳 Purchase updated:', purchase);
        
        try {
          const receipt = purchase.transactionReceipt;
          
          if (receipt) {
            // Call success callback with purchase data
            if (onPurchaseSuccess) {
              await onPurchaseSuccess(purchase);
            }

            // Acknowledge/finish the purchase
            await this.acknowledgePurchase(purchase);
          }
        } catch (error) {
          console.error('❌ Error processing purchase update:', error);
          if (onPurchaseError) {
            onPurchaseError(error);
          }
        }
      });

      // Listen for purchase errors
      this.purchaseErrorSubscription = purchaseErrorListener((error) => {
        console.error('❌ Purchase error:', error);
        if (onPurchaseError) {
          onPurchaseError(error);
        }
      });
      
      console.log('✅ IAP purchase listeners attached');
    } catch (error) {
      // E_IAP_NOT_AVAILABLE or other initialization errors
      if (error.code !== 'E_IAP_NOT_AVAILABLE') {
        console.error('❌ Error setting up purchase listeners:', error);
      } else {
        console.log('ℹ️ IAP listeners not available (platform not supported)');
      }
      // Don't throw - allow app to continue without IAP
    }
  }

  /**
   * Acknowledge/Finish purchase
   * CRITICAL: Must be called after receipt validation
   * @param {ProductPurchase} purchase - Purchase object
   */
  async acknowledgePurchase(purchase) {
    try {
      console.log('💳 Acknowledging purchase:', purchase.productId);
      
      if (Platform.OS === 'ios') {
        // iOS: Finish transaction
        await finishTransaction({ purchase, isConsumable: false });
      } else if (Platform.OS === 'android') {
        // Android: Acknowledge purchase
        if (purchase.purchaseToken) {
          await acknowledgePurchaseAndroid({
            token: purchase.purchaseToken,
            developerPayload: purchase.developerPayloadAndroid,
          });
        }
        await finishTransaction({ purchase, isConsumable: false });
      }
      
      console.log('✅ Purchase acknowledged successfully');
    } catch (error) {
      console.error('❌ Error acknowledging purchase:', error);
      throw error;
    }
  }

  /**
   * Get all previous purchases (restore purchases)
   * Used to restore subscriptions when user reinstalls app
   * @returns {Promise<ProductPurchase[]>} Array of previous purchases
   */
  async restorePurchases() {
    try {
      console.log('💳 Restoring previous purchases...');
      
      if (!this.isInitialized) {
        await this.initialize();
      }

      const purchases = await getAvailablePurchases();
      console.log('✅ Previous purchases restored:', purchases);
      
      return purchases || [];
    } catch (error) {
      console.error('❌ Error restoring purchases:', error);
      throw error;
    }
  }

  /**
   * Extract receipt from purchase for backend validation
   * @param {ProductPurchase} purchase - Purchase object
   * @returns {Object} Receipt data for backend
   */
  extractReceiptData(purchase) {
    const receiptData = {
      platform: Platform.OS,
      productId: purchase.productId,
      transactionId: purchase.transactionId,
      transactionDate: purchase.transactionDate,
      transactionReceipt: purchase.transactionReceipt,
    };

    // Platform-specific data
    if (Platform.OS === 'ios') {
      receiptData.originalTransactionId = purchase.originalTransactionIdentifierIOS;
    } else if (Platform.OS === 'android') {
      receiptData.purchaseToken = purchase.purchaseToken;
      receiptData.orderId = purchase.orderId;
      receiptData.packageName = purchase.packageNameAndroid;
    }

    return receiptData;
  }

  /**
   * Get user-friendly error message
   * @param {PurchaseError} error - Purchase error object
   * @returns {string} User-friendly error message
   */
  getErrorMessage(error) {
    if (!error) return 'Une erreur inconnue s\'est produite';

    // iOS error codes
    if (Platform.OS === 'ios') {
      switch (error.code) {
        case 'E_USER_CANCELLED':
          return 'Achat annulé';
        case 'E_NETWORK_ERROR':
          return 'Erreur réseau. Vérifiez votre connexion.';
        case 'E_NOT_AVAILABLE':
          return 'Achats non disponibles sur cet appareil';
        case 'E_ITEM_UNAVAILABLE':
          return 'Cet article n\'est pas disponible';
        case 'E_ALREADY_OWNED':
          return 'Vous possédez déjà cet abonnement';
        default:
          return error.message || 'Erreur lors de l\'achat';
      }
    }

    // Android error codes
    if (Platform.OS === 'android') {
      switch (error.code) {
        case 'E_USER_CANCELLED':
          return 'Achat annulé';
        case 'E_NETWORK_ERROR':
          return 'Erreur réseau. Vérifiez votre connexion.';
        case 'E_ALREADY_OWNED':
          return 'Vous possédez déjà cet abonnement';
        case 'E_DEVELOPER_ERROR':
          return 'Erreur de configuration. Contactez le support.';
        case 'E_SERVICE_DISCONNECTED':
          return 'Service de facturation déconnecté. Réessayez.';
        default:
          return error.message || 'Erreur lors de l\'achat';
      }
    }

    return error.message || 'Erreur lors de l\'achat';
  }

  /**
   * Map backend plan to store product ID
   * This should match the product IDs configured in App Store Connect / Play Console
   * @param {Object} plan - Backend plan object
   * @returns {string} Store product ID
   */
  getStoreProductId(plan) {
    // Format: com.afrotouch.lasocoach.{plan_name}_{duration}
    // Example: com.afrotouch.lasocoach.premium_monthly
    
    const planName = plan.name.toLowerCase().replace(/\s+/g, '_');
    let duration = 'monthly';
    
    if (plan.duration === 365) {
      duration = 'yearly';
    } else if (plan.duration === 7) {
      duration = 'weekly';
    } else if (plan.duration === 30) {
      duration = 'monthly';
    }
    
    // Free trial uses special ID
    if (plan.isFree) {
      return `com.afrotouch.lasocoach.trial_${plan.duration}days`;
    }
    
    return `com.afrotouch.lasocoach.${planName}_${duration}`;
  }

  /**
   * Check if IAP is available on device
   * @returns {boolean} True if IAP is available
   */
  isAvailable() {
    // IAP is available on iOS and Android, not on web
    return Platform.OS === 'ios' || Platform.OS === 'android';
  }
}

// Export singleton instance
export default new IAPService();

