import {
  API_BASE_URL,
  API_TIMEOUT,
  APP_NAME,
  APP_VERSION,
  DEBUG_MODE,
  OFFLINE_MODE,
  NODE_ENV,
} from '@env';

// Environment configuration with fallbacks
const Config = {
  // Environment
  NODE_ENV: NODE_ENV || (__DEV__ ? 'development' : 'production'),
  IS_DEV: __DEV__,
  
  // API Configuration - Always use production URL
  API_BASE_URL: API_BASE_URL || 'https://laso-coach-backend.onrender.com/api/v1',
  // Increased timeout for better resilience with slower networks
  API_TIMEOUT: parseInt(API_TIMEOUT) || 60000, // 60 seconds (was 30s)
  // Timeout specifically for auth initialization (more lenient)
  AUTH_INIT_TIMEOUT: 90000, // 90 seconds for initial auth check
  
  // App Configuration
  APP_NAME: APP_NAME || 'LasoCoach',
  APP_VERSION: APP_VERSION || '1.0.0',
  
  // Debug Configuration
  DEBUG_MODE: DEBUG_MODE === 'true' || __DEV__,
  OFFLINE_MODE: OFFLINE_MODE === 'true' || false,
};

// Log configuration in development
if (__DEV__) {
  console.log('🔧 App Configuration:', {
    NODE_ENV: Config.NODE_ENV,
    API_BASE_URL: Config.API_BASE_URL,
    API_TIMEOUT: Config.API_TIMEOUT,
    DEBUG_MODE: Config.DEBUG_MODE,
    OFFLINE_MODE: Config.OFFLINE_MODE,
  });
}

export default Config; 