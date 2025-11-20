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
  WS_BASE_URL,
  WS_BASE_URL_DEV,
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
  
  // WebSocket Configuration
  // Priority: 1. extraEnv (app.json), 2. .env file, 3. Derived from API_BASE_URL, 4. Fallback
  WS_BASE_URL: (() => {
    // Helper function to convert https:// to wss:// and http:// to ws://
    const normalizeWebSocketUrl = (url) => {
      if (!url) return null;
      // Convert https:// to wss://
      if (url.startsWith('https://')) {
        return url.replace('https://', 'wss://');
      }
      // Convert http:// to ws://
      if (url.startsWith('http://')) {
        return url.replace('http://', 'ws://');
      }
      // Already a WebSocket URL (ws:// or wss://)
      if (url.startsWith('ws://') || url.startsWith('wss://')) {
        return url;
      }
      // If no protocol, assume wss:// for production
      return `wss://${url}`;
    };

    // Helper function to derive WebSocket URL from API base URL
    const deriveWebSocketUrlFromApi = (apiUrl) => {
      try {
        // Remove /api/v1 or any path suffix
        const urlObj = new URL(apiUrl);
        // Keep only the origin (protocol + hostname + port if any)
        const origin = `${urlObj.protocol}//${urlObj.hostname}${urlObj.port ? `:${urlObj.port}` : ''}`;
        // Convert to WebSocket protocol
        return normalizeWebSocketUrl(origin);
      } catch (e) {
        console.warn('⚠️ Failed to derive WebSocket URL from API URL:', e);
        return null;
      }
    };

    // Debug: Log all potential sources
    console.log('🔍 WebSocket URL sources:', {
      extraEnv: extraEnv.wsBaseUrl,
      envVar: WS_BASE_URL,
      envVarDev: WS_BASE_URL_DEV,
      isDev: __DEV__,
      apiBaseUrl: getApiBaseUrl(),
    });

    // Check app.json config first
    if (extraEnv.wsBaseUrl) {
      const normalized = normalizeWebSocketUrl(extraEnv.wsBaseUrl);
      console.log('🔌 Using WebSocket URL from app.json:', normalized);
      return normalized;
    }
    // Check .env file
    if (WS_BASE_URL) {
      const normalized = normalizeWebSocketUrl(WS_BASE_URL);
      // CRITICAL: Verify the WebSocket URL domain matches the API URL domain
      // This prevents mismatches like laso-coach-backend vs lasocoach-backend
      const apiBaseUrl = getApiBaseUrl();
      try {
        const wsUrlObj = new URL(normalized.replace(/^wss?:\/\//, 'https://'));
        const apiUrlObj = new URL(apiBaseUrl);
        
        // If domains don't match, derive from API URL instead
        if (wsUrlObj.hostname !== apiUrlObj.hostname) {
          console.warn('⚠️ WebSocket URL domain mismatch detected!');
          console.warn('   WebSocket domain:', wsUrlObj.hostname);
          console.warn('   API domain:', apiUrlObj.hostname);
          console.warn('   Deriving WebSocket URL from API URL to ensure consistency...');
          const derivedWsUrl = deriveWebSocketUrlFromApi(apiBaseUrl);
          if (derivedWsUrl) {
            console.log('🔌 Using derived WebSocket URL (from API):', derivedWsUrl);
            return derivedWsUrl;
          }
        }
      } catch (e) {
        console.warn('⚠️ Failed to verify WebSocket URL domain match:', e);
      }
      console.log('🔌 Using WebSocket URL from .env:', normalized, '(original:', WS_BASE_URL, ')');
      return normalized;
    }
    // Check dev URL from .env
    if (__DEV__ && WS_BASE_URL_DEV) {
      const normalized = normalizeWebSocketUrl(WS_BASE_URL_DEV);
      console.log('🔌 Using WebSocket dev URL from .env:', normalized);
      return normalized;
    }
    
    // CRITICAL FIX: Derive WebSocket URL from API base URL to ensure consistency
    // This prevents URL mismatches (e.g., laso-coach-backend vs lasocoach-backend)
    const apiBaseUrl = getApiBaseUrl();
    const derivedWsUrl = deriveWebSocketUrlFromApi(apiBaseUrl);
    if (derivedWsUrl) {
      console.log('🔌 Derived WebSocket URL from API base URL:', derivedWsUrl, '(from API:', apiBaseUrl, ')');
      return derivedWsUrl;
    }
    
    // Fallback (should not be used if API URL is properly configured)
    const fallback = __DEV__ ? 'ws://localhost:5001' : 'wss://laso-coach-backend.onrender.com';
    console.warn('⚠️ Using fallback WebSocket URL (configure .env file):', fallback);
    console.warn('⚠️ Make sure WS_BASE_URL is set in your .env file');
    return fallback;
  })(),
  
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
    WS_BASE_URL: Config.WS_BASE_URL,
    IS_DEV: Config.IS_DEV,
    API_TIMEOUT: Config.API_TIMEOUT,
    DEBUG_MODE: Config.DEBUG_MODE,
    OFFLINE_MODE: Config.OFFLINE_MODE,
  });
}

export default Config; 