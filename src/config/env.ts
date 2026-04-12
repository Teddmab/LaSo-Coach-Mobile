import Constants from 'expo-constants';
import { Platform } from 'react-native';
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
const getApiBaseUrl = (): string => {
  // Check if we're in development mode
  const isDev = __DEV__;
  
  // ✅ FIX: Forcer production URL si FORCE_PROD_API=true ou si devUrl n'est pas accessible
  const forceProd = String(extraEnv.forceProdApi) === 'true' || extraEnv.forceProdApi === true;
  
  // Try to get dev URL from various sources (check app config first)
  const devUrl = extraEnv.apiBaseUrlDev || API_BASE_URL_DEV;
  
  // ✅ FIX: Utiliser production si forcé OU si on est en dev mais pas de backend local
  // (localhost:3000 n'existe probablement pas si backend est sur Render)
  if (forceProd || !isDev) {
    const prodUrl = extraEnv.apiBaseUrl || API_BASE_URL || 'https://laso-coach-backend.onrender.com/api/v1';
    return prodUrl;
  }
  
  // Use dev URL in development (seulement si backend local existe)
  if (isDev && devUrl && devUrl !== 'http://localhost:3000/api/v1') {
    return devUrl;
  }
  
  // Fallback: Production même en dev si pas de backend local
  const prodUrl = extraEnv.apiBaseUrl || API_BASE_URL || 'https://laso-coach-backend.onrender.com/api/v1';
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
  API_TIMEOUT: parseInt(extraEnv.apiTimeout || API_TIMEOUT || '60000', 10), // 60 seconds (was 30s)
  // Timeout specifically for auth initialization (more lenient)
  AUTH_INIT_TIMEOUT: 90000, // 90 seconds for initial auth check
  
  // WebSocket Configuration
  // Priority: 1. extraEnv (app.json), 2. .env file, 3. Derived from API_BASE_URL, 4. Fallback
  WS_BASE_URL: (() => {
    // Helper function to convert https:// to wss:// and http:// to ws://
    const normalizeWebSocketUrl = (url: string | undefined): string | null => {
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
    const deriveWebSocketUrlFromApi = (apiUrl: string): string | null => {
      try {
        // Remove /api/v1 or any path suffix
        const urlObj = new URL(apiUrl);
        // Keep only the origin (protocol + hostname + port if any)
        const origin = `${urlObj.protocol}//${urlObj.hostname}${urlObj.port ? `:${urlObj.port}` : ''}`;
        // Convert to WebSocket protocol
        return normalizeWebSocketUrl(origin);
      } catch (e) {
        return null;
      }
    };

    // Check app.json config first
    if (extraEnv.wsBaseUrl) {
      const normalized = normalizeWebSocketUrl(extraEnv.wsBaseUrl);
      return normalized || '';
    }
    // Check .env file
    if (WS_BASE_URL) {
      const normalized = normalizeWebSocketUrl(WS_BASE_URL);
      // CRITICAL: Verify the WebSocket URL domain matches the API URL domain
      // This prevents mismatches like laso-coach-backend vs lasocoach-backend
      const apiBaseUrl = getApiBaseUrl();
      try {
        const wsUrlObj = new URL(normalized!.replace(/^wss?:\/\//, 'https://'));
        const apiUrlObj = new URL(apiBaseUrl);
        
        // If domains don't match, derive from API URL instead
        if (wsUrlObj.hostname !== apiUrlObj.hostname) {
          const derivedWsUrl = deriveWebSocketUrlFromApi(apiBaseUrl);
          if (derivedWsUrl) {
            return derivedWsUrl;
          }
        }
      } catch (e) {
      }
      return normalized || '';
    }
    // Check dev URL from .env
    if (__DEV__ && WS_BASE_URL_DEV) {
      const normalized = normalizeWebSocketUrl(WS_BASE_URL_DEV);
      return normalized || '';
    }
    
    // CRITICAL FIX: Derive WebSocket URL from API base URL to ensure consistency
    // This prevents URL mismatches (e.g., laso-coach-backend vs lasocoach-backend)
    const apiBaseUrl = getApiBaseUrl();
    const derivedWsUrl = deriveWebSocketUrlFromApi(apiBaseUrl);
    if (derivedWsUrl) {
      return derivedWsUrl;
    }
    
    // Fallback (should not be used if API URL is properly configured)
    const fallback = __DEV__ ? 'ws://localhost:5001' : 'wss://laso-coach-backend.onrender.com';
    return fallback;
  })(),
  
  // App Configuration
  APP_NAME: APP_NAME || Constants.expoConfig?.name || 'LasoCoach',
  APP_VERSION: APP_VERSION || Constants.expoConfig?.version || '1.1.5',

  /** OneSignal App ID actif pour cette plateforme (extra.onesignal.appIdIos / appIdAndroid ou appId legacy) */
  ONESIGNAL_APP_ID: (() => {
    const o = Constants.expoConfig?.extra?.onesignal as
      | { appId?: string; appIdIos?: string; appIdAndroid?: string }
      | undefined;
    const legacy = typeof o?.appId === 'string' ? o.appId.trim() : '';
    const ios = typeof o?.appIdIos === 'string' ? o.appIdIos.trim() : '';
    const android = typeof o?.appIdAndroid === 'string' ? o.appIdAndroid.trim() : '';
    if (Platform.OS === 'ios') {
      return ios || legacy;
    }
    return android || legacy;
  })(),
  
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
  // Configuration loaded
}

export default Config;

