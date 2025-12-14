// IMPORTANT: Ne PAS importer react-native-iap au niveau du module !
// Ce module utilise NativeEventEmitter qui peut crasher si le runtime n'est pas prêt.
// On utilise un import lazy à la place.
import { Platform } from 'react-native';

// Types pour react-native-iap (déclarés localement pour éviter l'import)
type Product = any;
type ProductPurchase = any;
type PurchaseError = any;

/**
 * IAPService - Native In-App Purchase Service
 * Handles iOS App Store and Google Play Store purchases
 * Compliant with Apple/Google policies for digital goods
 */
class IAPService {
  private _iapModule: any = null;
  
  constructor() {
    this.purchaseUpdateSubscription = null;
    this.purchaseErrorSubscription = null;
    this.isInitialized = false;
  }

  /**
   * Lazy load react-native-iap module to avoid NativeEventEmitter crash at startup
   */
  private getIAPModule() {
    if (!this._iapModule) {
      try {
        this._iapModule = require('react-native-iap');
      } catch (error) {
        console.warn('⚠️ [IAPService] react-native-iap not available:', error);
        this._iapModule = null;
      }
    }
    return this._iapModule;
  }

  /**
   * Initialize IAP connection
   * MUST be called before any purchase operations
   */
  async initialize() {
    if (this.isInitialized) {
      return true;
    }

    const iap = this.getIAPModule();
    if (!iap) {
      console.warn('⚠️ [IAPService] IAP module not available');
      return false;
    }

    try {
      await iap.initConnection();
      this.isInitialized = true;
      return true;
    } catch (error: any) {
      
      // E_IAP_NOT_AVAILABLE is expected on unsupported platforms (web, Windows, simulators without IAP configured)
      // This is NOT a fatal error - the app should continue with limited functionality
      if (error.code === 'E_IAP_NOT_AVAILABLE') {
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
    const iap = this.getIAPModule();
    
    try {
      if (this.purchaseUpdateSubscription) {
        this.purchaseUpdateSubscription.remove();
        this.purchaseUpdateSubscription = null;
      }
      if (this.purchaseErrorSubscription) {
        this.purchaseErrorSubscription.remove();
        this.purchaseErrorSubscription = null;
      }
      if (iap) {
        await iap.endConnection();
      }
      this.isInitialized = false;
    } catch (error: any) {
      // E_IAP_NOT_AVAILABLE during disconnect is expected and safe to ignore
      if (error.code !== 'E_IAP_NOT_AVAILABLE') {
      }
    }
  }

  /**
   * Get available products from App Store / Play Store
   * @param {string[]} productIds - Array of product IDs configured in stores
   * @returns {Promise<Product[]>} Array of available products
   */
  async getAvailableProducts(productIds: string[]) {
    const iap = this.getIAPModule();
    if (!iap) {
      return [];
    }

    try {
      
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          return [];
        }
      }

      const products = await iap.getProducts({ skus: productIds });
      
      return products;
    } catch (error: any) {
      
      // Return empty array instead of throwing for E_IAP_NOT_AVAILABLE
      if (error.code === 'E_IAP_NOT_AVAILABLE') {
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
  async requestPurchase(productId: string, isSubscription = true) {
    const iap = this.getIAPModule();
    if (!iap) {
      throw new Error('IAP module not available');
    }

    try {
      
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Request purchase from native store
      if (Platform.OS === 'ios') {
        await iap.requestPurchase({ sku: productId });
      } else if (Platform.OS === 'android') {
        await iap.requestPurchase({
          skus: [productId],
          // For Android, specify if it's a subscription
          ...(isSubscription && { 
            subscriptionOffers: [{ sku: productId, offerToken: '' }] 
          })
        });
      }

      // Purchase result will be handled by purchaseUpdatedListener
      return null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Setup purchase listeners
   * These listeners handle purchase success/failure
   * @param {Function} onPurchaseSuccess - Callback for successful purchase
   * @param {Function} onPurchaseError - Callback for purchase error
   */
  setupPurchaseListeners(onPurchaseSuccess: (purchase: ProductPurchase) => Promise<void>, onPurchaseError: (error: any) => void) {
    const iap = this.getIAPModule();
    if (!iap) {
      console.warn('⚠️ [IAPService] Cannot setup listeners - IAP module not available');
      return;
    }

    try {
      // Remove existing listeners if any
      if (this.purchaseUpdateSubscription) {
        this.purchaseUpdateSubscription.remove();
      }
      if (this.purchaseErrorSubscription) {
        this.purchaseErrorSubscription.remove();
      }

      // Listen for successful purchases
      this.purchaseUpdateSubscription = iap.purchaseUpdatedListener(async (purchase: ProductPurchase) => {
        
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
          if (onPurchaseError) {
            onPurchaseError(error);
          }
        }
      });

      // Listen for purchase errors
      this.purchaseErrorSubscription = iap.purchaseErrorListener((error: PurchaseError) => {
        if (onPurchaseError) {
          onPurchaseError(error);
        }
      });
      
    } catch (error: any) {
      // E_IAP_NOT_AVAILABLE or other initialization errors
      if (error.code !== 'E_IAP_NOT_AVAILABLE') {
      } else {
      }
      // Don't throw - allow app to continue without IAP
    }
  }

  /**
   * Acknowledge/Finish purchase
   * CRITICAL: Must be called after receipt validation
   * @param {ProductPurchase} purchase - Purchase object
   */
  async acknowledgePurchase(purchase: ProductPurchase) {
    const iap = this.getIAPModule();
    if (!iap) {
      throw new Error('IAP module not available');
    }

    try {
      
      if (Platform.OS === 'ios') {
        // iOS: Finish transaction
        await iap.finishTransaction({ purchase, isConsumable: false });
      } else if (Platform.OS === 'android') {
        // Android: Acknowledge purchase
        if (purchase.purchaseToken) {
          await iap.acknowledgePurchaseAndroid({
            token: purchase.purchaseToken,
            developerPayload: purchase.developerPayloadAndroid,
          });
        }
        await iap.finishTransaction({ purchase, isConsumable: false });
      }
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all previous purchases (restore purchases)
   * Used to restore subscriptions when user reinstalls app
   * @returns {Promise<ProductPurchase[]>} Array of previous purchases
   */
  async restorePurchases() {
    const iap = this.getIAPModule();
    if (!iap) {
      return [];
    }

    try {
      
      if (!this.isInitialized) {
        await this.initialize();
      }

      const purchases = await iap.getAvailablePurchases();
      
      return purchases || [];
    } catch (error) {
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
  // Format: com.laso.coach.{plan_name}_{duration}
  // Example: com.laso.coach.premium_monthly
    
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
      return `com.laso.coach.trial_${plan.duration}days`;
    }

    return `com.laso.coach.${planName}_${duration}`;
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

