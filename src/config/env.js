import Constants from 'expo-constants';
import {
  API_BASE_URL,
  API_BASE_URL_DEV,
  API_TIMEOUT,
  APP_NAME,
  APP_VERSION,
  DEBUG_MODE,
  OFFLINE_MODE,
  NODE_ENV,
} from '@env';

const extraEnv = Constants.expoConfig?.extra?.env ?? {};

// Determine the appropriate API URL based on environment
const getApiBaseUrl = () => {
  // Check if we're in development mode
  const isDev = __DEV__;
  
  // Try to get dev URL from various sources (check app config first)
  const devUrl = extraEnv.apiBaseUrlDev || API_BASE_URL_DEV;
  console.log('🔍 Dev URL sources:', { extraEnv: extraEnv.apiBaseUrlDev, envVar: API_BASE_URL_DEV });
  
  // Use dev URL in development, production URL in builds
  if (isDev && devUrl) {
    console.log('🔧 Using development API:', devUrl);
    return devUrl;
  }
  
  const prodUrl = extraEnv.apiBaseUrl || API_BASE_URL || 'https://laso-coach-backend.onrender.com/api/v1';
  console.log('🚀 Using production API:', prodUrl);
  return prodUrl;
};

// Environment configuration with fallbacks
const Config = {
  // Environment
  NODE_ENV: extraEnv.nodeEnv || NODE_ENV || (__DEV__ ? 'development' : 'production'),
  IS_DEV: __DEV__,
  
  // API Configuration - Smart URL switching
  API_BASE_URL: getApiBaseUrl(),
  API_BASE_URL_DEV: extraEnv.apiBaseUrlDev || API_BASE_URL_DEV, // Keep dev URL for reference
  // Increased timeout for better resilience with slower networks
  API_TIMEOUT: parseInt(extraEnv.apiTimeout || API_TIMEOUT) || 60000, // 60 seconds (was 30s)
  // Timeout specifically for auth initialization (more lenient)
  AUTH_INIT_TIMEOUT: 90000, // 90 seconds for initial auth check
  
  // App Configuration
  APP_NAME: APP_NAME || Constants.expoConfig?.name || 'LasoCoach',
  APP_VERSION: APP_VERSION || Constants.expoConfig?.version || '1.0.0',
  
  // Debug Configuration
  DEBUG_MODE:
    (typeof extraEnv.debugMode !== 'undefined'
      ? String(extraEnv.debugMode) === 'true'
      : DEBUG_MODE === 'true') || __DEV__,
  OFFLINE_MODE:
    typeof extraEnv.offlineMode !== 'undefined'
      ? String(extraEnv.offlineMode) === 'true'
      : OFFLINE_MODE === 'true' || false,
};

// Log configuration in development
if (__DEV__) {
  console.log('🔧 App Configuration:', {
    NODE_ENV: Config.NODE_ENV,
    API_BASE_URL: Config.API_BASE_URL,
    API_BASE_URL_DEV: Config.API_BASE_URL_DEV,
    IS_DEV: Config.IS_DEV,
    API_TIMEOUT: Config.API_TIMEOUT,
    DEBUG_MODE: Config.DEBUG_MODE,
    OFFLINE_MODE: Config.OFFLINE_MODE,
  });
}

export default Config; 