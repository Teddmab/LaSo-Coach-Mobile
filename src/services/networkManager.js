import NetInfo from '@react-native-community/netinfo';
import { retryRequest } from './api';

/**
 * Enhanced Network Manager for handling brief disconnections
 */
class NetworkManager {
  constructor() {
    this.isConnected = true;
    this.listeners = [];
    this.retryQueue = [];
    this.isRetrying = false;
    
    this.setupNetworkListener();
  }

  /**
   * Setup network state listener
   */
  setupNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasConnected = this.isConnected;
      this.isConnected = state.isConnected;
      
      console.log(`🌐 Network state changed: ${wasConnected ? 'connected' : 'disconnected'} → ${this.isConnected ? 'connected' : 'disconnected'}`);
      
      // Notify all listeners
      this.listeners.forEach(listener => {
        try {
          listener(this.isConnected);
        } catch (error) {
          console.error('❌ Network listener error:', error);
        }
      });
      
      // If we just reconnected, retry queued requests
      if (!wasConnected && this.isConnected) {
        console.log('🔄 Network reconnected, retrying queued requests...');
        this.processRetryQueue();
      }
    });
  }

  /**
   * Add network state listener
   * @param {Function} listener - Callback function
   * @returns {Function} Unsubscribe function
   */
  addListener(listener) {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Check if network is connected
   * @returns {boolean} Network connection status
   */
  isNetworkConnected() {
    return this.isConnected;
  }

  /**
   * Enhanced retry request with network awareness
   * @param {Function} requestFn - Function that returns a promise
   * @param {Object} options - Retry options
   * @returns {Promise} Promise that resolves with the request result
   */
  async retryRequestWithNetworkAwareness(requestFn, options = {}) {
    const {
      maxRetries = 5,
      initialDelay = 1000,
      maxDelay = 10000,
      networkRetryDelay = 2000,
      queueOnDisconnect = true
    } = options;

    // If network is disconnected and we should queue requests
    if (!this.isConnected && queueOnDisconnect) {
      console.log('🌐 Network disconnected, queuing request for retry...');
      return new Promise((resolve, reject) => {
        this.retryQueue.push({ requestFn, resolve, reject, options });
      });
    }

    let lastError;
    let delay = initialDelay;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Check network before each attempt
        if (!this.isConnected) {
          throw new Error('Network disconnected');
        }
        
        return await requestFn();
      } catch (error) {
        lastError = error;
        
        // Check if it's a network-related error
        const isNetworkError = this.isNetworkError(error);
        
        if (isNetworkError) {
          console.log(`🌐 Network error on attempt ${attempt}/${maxRetries}:`, error.message);
          
          // If network is disconnected, queue the request
          if (!this.isConnected && queueOnDisconnect) {
            console.log('🌐 Network disconnected, queuing request...');
            return new Promise((resolve, reject) => {
              this.retryQueue.push({ requestFn, resolve, reject, options });
            });
          }
        } else {
          // Non-network error, don't retry
          console.log('❌ Non-network error, not retrying:', error.message);
          throw error;
        }
        
        if (attempt < maxRetries) {
          // Wait before retry, with different delays for network vs other errors
          const retryDelay = isNetworkError ? networkRetryDelay : delay;
          
          console.log(`🔄 Retrying in ${retryDelay}ms (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          
          // Exponential backoff for non-network errors
          if (!isNetworkError) {
            delay = Math.min(delay * 2, maxDelay);
          }
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Check if error is network-related
   * @param {Error} error - Error to check
   * @returns {boolean} True if network error
   */
  isNetworkError(error) {
    if (!error) return false;
    
    // Check for network error codes
    const networkErrorCodes = [
      'ERR_NETWORK',
      'ECONNABORTED', 
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ENETUNREACH',
      'EHOSTUNREACH'
    ];
    
    // Check error code
    if (error.code && networkErrorCodes.includes(error.code)) {
      return true;
    }
    
    // Check error message
    const networkErrorMessages = [
      'network error',
      'connection failed',
      'timeout',
      'no internet',
      'network disconnected'
    ];
    
    const message = error.message?.toLowerCase() || '';
    return networkErrorMessages.some(msg => message.includes(msg));
  }

  /**
   * Process queued requests when network reconnects
   */
  async processRetryQueue() {
    if (this.isRetrying || this.retryQueue.length === 0) {
      return;
    }
    
    this.isRetrying = true;
    console.log(`🔄 Processing ${this.retryQueue.length} queued requests...`);
    
    const queue = [...this.retryQueue];
    this.retryQueue = [];
    
    for (const { requestFn, resolve, reject, options } of queue) {
      try {
        const result = await this.retryRequestWithNetworkAwareness(requestFn, {
          ...options,
          queueOnDisconnect: false // Don't re-queue if it fails again
        });
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }
    
    this.isRetrying = false;
  }

  /**
   * Clear retry queue
   */
  clearRetryQueue() {
    console.log(`🧹 Clearing ${this.retryQueue.length} queued requests`);
    this.retryQueue.forEach(({ reject }) => {
      reject(new Error('Request cancelled - network queue cleared'));
    });
    this.retryQueue = [];
  }
}

// Export singleton instance
export const networkManager = new NetworkManager();

/**
 * Enhanced retry request function with network awareness
 * @param {Function} requestFn - Function that returns a promise
 * @param {Object} options - Retry options
 * @returns {Promise} Promise that resolves with the request result
 */
export const retryRequestWithNetworkAwareness = (requestFn, options = {}) => {
  return networkManager.retryRequestWithNetworkAwareness(requestFn, options);
};

/**
 * Check if network is connected
 * @returns {boolean} Network connection status
 */
export const isNetworkConnected = () => {
  return networkManager.isNetworkConnected();
};

/**
 * Add network state listener
 * @param {Function} listener - Callback function
 * @returns {Function} Unsubscribe function
 */
export const addNetworkListener = (listener) => {
  return networkManager.addListener(listener);
};

export default networkManager;
