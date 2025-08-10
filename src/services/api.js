import axios from 'axios';
import { TokenManager } from './tokenManager';
import Config from '../config/env';

// Create axios instance with environment-based configuration
const api = axios.create({
  baseURL: Config.API_BASE_URL,
  timeout: Config.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Store reference to navigation for redirects
let navigationRef = null;

/**
 * Set navigation reference for auto-redirect on auth failure
 * @param {any} navigation - Navigation object
 */
export const setNavigationRef = (navigation) => {
  navigationRef = navigation;
};

/**
 * Test API connection
 * @returns {Promise<boolean>} True if connection is successful
 */
export const testConnection = async () => {
  try {
    console.log(`🔌 Testing connection to: ${Config.API_BASE_URL}`);
    
    // Try a simple health check or login endpoint
    const response = await axios.get(`${Config.API_BASE_URL}/health`, {
      timeout: 10000, // 10 second timeout for connection test
    });
    
    console.log('✅ API connection successful:', response.status);
    return true;
  } catch (error) {
    console.error('❌ API connection failed:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
    });
    return false;
  }
};

/**
 * Simulate API responses for offline testing
 */
const mockAPI = {
  async login(email, password) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (email === 'test@example.com' && password === 'password') {
      return {
        token: 'mock_token_123',
        refreshToken: 'mock_refresh_token_456',
        id: 'user_123',
        name: 'Test User',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        onboardingCompleted: true,
        currentStep: 'Attaque',
      };
    } else {
      throw new Error('Invalid credentials');
    }
  },

  async getProfile() {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      id: 'user_123',
      name: 'Test User',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      onboardingCompleted: true,
      currentStep: 'Attaque',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },
};

/**
 * Request interceptor to add authentication headers
 */
api.interceptors.request.use(
  async (config) => {
    try {
      console.log('🔍 ===== REQUEST INTERCEPTOR START =====');
      console.log(`🚀 Making API request: ${config.method?.toUpperCase()} ${config.url}`);
      console.log('🔍 Request interceptor - starting token retrieval...');
      
      const { token } = await TokenManager.getTokens();
      console.log('🔑 Token retrieved for request:', token ? `${token.substring(0, 20)}...` : 'null');
      console.log('🔑 Token length:', token ? token.length : 'null');
      console.log('🔑 Token type:', typeof token);
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('✅ Authorization header set:', `Bearer ${token.substring(0, 20)}...`);
        console.log('📋 Final headers:', JSON.stringify(config.headers, null, 2));
      } else {
        console.warn('⚠️ No token available - request will be unauthorized');
        console.log('📋 Headers without auth:', JSON.stringify(config.headers, null, 2));
      }
      
      console.log('🔍 ===== REQUEST DETAILS =====');
      console.log('📤 Method:', config.method?.toUpperCase());
      console.log('📤 URL:', config.url);
      console.log('📤 Base URL:', config.baseURL);
      console.log('📤 Full URL:', `${config.baseURL}${config.url}`);
      console.log('📤 Headers:', JSON.stringify(config.headers, null, 2));
      console.log('📤 Has Authorization header:', !!config.headers.Authorization);
      console.log('📤 Authorization value:', config.headers.Authorization ? config.headers.Authorization.substring(0, 30) + '...' : 'null');
      console.log('🔍 ===== REQUEST INTERCEPTOR END =====');
      
    } catch (error) {
      console.error('❌ Error adding auth header:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    
    // Log request in development
    if (Config.DEBUG_MODE) {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
      console.log('📤 Request headers:', config.headers);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor for token refresh and error handling
 */
api.interceptors.response.use(
  (response) => {
    console.log('🔍 ===== RESPONSE INTERCEPTOR START =====');
    console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    console.log('📥 Response status:', response.status);
    console.log('📥 Response status text:', response.statusText);
    console.log('📥 Response headers:', JSON.stringify(response.headers, null, 2));
    console.log('📥 Request headers that were sent:', JSON.stringify(response.config.headers, null, 2));
    console.log('📥 Has Authorization header in request:', !!response.config.headers.Authorization);
    
    // Log response data details
    console.log('📥 Response data type:', typeof response.data);
    console.log('📥 Response data keys:', response.data ? Object.keys(response.data) : 'null');
    console.log('📥 Response data:', JSON.stringify(response.data, null, 2));
    
    // Additional response debugging
    if (response.data) {
      console.log('📥 Response data structure:', {
        isObject: typeof response.data === 'object',
        isArray: Array.isArray(response.data),
        hasData: 'data' in response.data,
        hasMessage: 'message' in response.data,
        hasError: 'error' in response.data,
        keys: Object.keys(response.data)
      });
    }
    
    // Make response visible to debugger network tab
    if (__DEV__) {
      // This creates a network request that debuggers can see
      const debugUrl = `${response.config.baseURL}${response.config.url}`;
      console.log(`🔍 DEBUGGER_NETWORK_REQUEST: ${response.config.method?.toUpperCase()} ${debugUrl}`);
      console.log(`🔍 DEBUGGER_NETWORK_RESPONSE:`, {
        url: debugUrl,
        method: response.config.method?.toUpperCase(),
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
        requestHeaders: response.config.headers
      });
      
      // Also log as a special format that some debuggers recognize
      console.log(`🔍 NETWORK_DEBUG_${response.config.method?.toUpperCase()}_${response.status}:`, {
        request: {
          url: debugUrl,
          method: response.config.method?.toUpperCase(),
          headers: response.config.headers
        },
        response: {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data
        }
      });
    }
    
    console.log('🔍 ===== RESPONSE INTERCEPTOR END =====');
    
    // Log successful responses in development
    if (Config.DEBUG_MODE) {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    }
    return response;
  },
  async (error) => {
    console.log('🔍 ===== ERROR INTERCEPTOR START =====');
    console.log('❌ API Error occurred:');
    console.log('📤 Request URL:', error.config?.url);
    console.log('📤 Request method:', error.config?.method);
    console.log('📤 Request headers:', JSON.stringify(error.config?.headers, null, 2));
    console.log('📤 Has Authorization header:', !!error.config?.headers?.Authorization);
    console.log('📥 Response status:', error.response?.status);
    console.log('📥 Response status text:', error.response?.statusText);
    console.log('📥 Response headers:', JSON.stringify(error.response?.headers, null, 2));
    
    // Log detailed error response data
    if (error.response?.data) {
      console.log('📥 Error response data type:', typeof error.response.data);
      console.log('📥 Error response data:', JSON.stringify(error.response.data, null, 2));
    }
    
    // Log raw response text if available
    if (error.response?.data) {
      try {
        const responseText = typeof error.response.data === 'string' 
          ? error.response.data 
          : JSON.stringify(error.response.data);
        console.log('📥 Raw error response text:', responseText);
      } catch (parseError) {
        console.log('📥 Could not parse error response data:', parseError.message);
      }
    }
    
    console.log('🔍 ===== ERROR INTERCEPTOR END =====');
    
    const originalRequest = error.config;

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        console.log('🔄 Attempting token refresh...');
        const { refreshToken } = await TokenManager.getTokens();
        
        if (refreshToken) {
          // Attempt to refresh token
          const refreshResponse = await axios.post(
            `${Config.API_BASE_URL}/auth/refresh-token`,
            { refreshToken },
            { headers: { 'Content-Type': 'application/json' } }
          );

          const { token: newToken, refreshToken: newRefreshToken } = refreshResponse.data;
          
          // Store new tokens
          await TokenManager.storeTokens(newToken, newRefreshToken);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          console.log('✅ Token refreshed successfully');
          
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        
        // Clear invalid tokens
        await TokenManager.clearTokens();
        
        // Redirect to login screen
        if (navigationRef) {
          navigationRef.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
      }
    }

    // Log errors in development
    if (Config.DEBUG_MODE) {
      console.error('❌ API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        code: error.code,
      });
    }

    return Promise.reject(error);
  }
);

/**
 * Handle API errors and return user-friendly messages
 * @param {any} error - Error object
 * @returns {string} User-friendly error message
 */
export const handleAuthError = (error) => {
  // Check for CORS errors
  if (error.message?.includes('CORS') || error.message?.includes('Origin')) {
    return 'Erreur CORS: Le serveur n\'autorise pas les requêtes depuis cette origine. Contactez l\'administrateur.';
  }

  // Check for network/connection errors
  if (!error.response && (error.code === 'ECONNABORTED' || error.message.includes('timeout'))) {
    return 'Délai de connexion dépassé. Vérifiez votre connexion internet.';
  }

  if (!error.response && (error.code === 'ECONNREFUSED' || error.message.includes('refused'))) {
    return 'Connexion refusée. Le serveur n\'est peut-être pas démarré.';
  }

  if (!error.response && (error.code === 'ENOTFOUND' || error.message.includes('not found'))) {
    return 'Serveur introuvable. Vérifiez l\'URL de l\'API.';
  }

  if (!error.response) {
    return `Erreur de connexion: ${error.message}. Vérifiez votre connexion internet.`;
  }

  const status = error.response.status;
  const message = error.response.data?.message;

  switch (status) {
    case 400:
      return message || 'Données invalides. Veuillez vérifier vos informations.';
    case 401:
      return 'Email ou mot de passe incorrect.';
    case 403:
      if (message?.includes('CORS')) {
        return 'Erreur CORS: Origine non autorisée par le serveur.';
      }
      return message || 'Accès interdit.';
    case 404:
      return 'Aucun compte trouvé avec cet email.';
    case 409:
      return 'Un compte avec cet e-mail existe déjà.';
    case 422:
      return message || 'Données de validation incorrectes.';
    case 429:
      return 'Trop de tentatives. Veuillez réessayer plus tard.';
    case 500:
    case 502:
    case 503:
      return 'Erreur du serveur. Veuillez réessayer plus tard.';
    default:
      return message || 'Une erreur inattendue s\'est produite.';
  }
};

/**
 * Safe JSON parsing with detailed error logging
 * @param {string} text - Raw response text
 * @param {string} context - Context for logging
 * @returns {Object|null} Parsed JSON or null
 */
export const safeJsonParse = (text, context = 'Unknown') => {
  try {
    console.log(`🔍 Parsing JSON for ${context}:`, text.substring(0, 200) + (text.length > 200 ? '...' : ''));
    const parsed = JSON.parse(text);
    console.log(`✅ JSON parsed successfully for ${context}:`, parsed);
    return parsed;
  } catch (error) {
    console.error(`❌ JSON parse error for ${context}:`, error.message);
    console.error(`❌ Raw text:`, text);
    return null;
  }
};

/**
 * Debug response with detailed logging
 * @param {Object} response - Axios response object
 * @param {string} context - Context for logging
 */
export const debugResponse = (response, context = 'API Response') => {
  console.log(`🔍 ===== ${context.toUpperCase()} DEBUG =====`);
  console.log('📥 Status:', response.status, response.statusText);
  console.log('📥 Headers:', JSON.stringify(response.headers, null, 2));
  console.log('📥 Data type:', typeof response.data);
  console.log('📥 Data:', JSON.stringify(response.data, null, 2));
  
  if (response.data) {
    console.log('📥 Data structure:', {
      isObject: typeof response.data === 'object',
      isArray: Array.isArray(response.data),
      keys: Object.keys(response.data),
      hasData: 'data' in response.data,
      hasMessage: 'message' in response.data,
      hasError: 'error' in response.data
    });
  }
  console.log(`🔍 ===== ${context.toUpperCase()} DEBUG END =====`);
};

/**
 * Debug API responses using fetch for better debugger visibility
 * @param {string} url - Full URL
 * @param {Object} options - Fetch options
 * @param {string} context - Context for logging
 * @returns {Promise<Object>} Response data
 */
export const debugFetch = async (url, options = {}, context = 'API Request') => {
  try {
    console.log(`🔍 ${context} - Using fetch for debugger visibility`);
    console.log(`📤 Fetch URL: ${url}`);
    console.log(`📤 Fetch options:`, JSON.stringify(options, null, 2));
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    console.log(`📥 ${context} - Status: ${response.status} ${response.statusText}`);
    console.log(`📥 ${context} - Headers:`, Object.fromEntries(response.headers.entries()));
    
    // Get response text first
    const responseText = await response.text();
    console.log(`📥 ${context} - Raw response text:`, responseText);
    
    // Parse JSON safely
    let data = null;
    try {
      data = JSON.parse(responseText);
      console.log(`✅ ${context} - JSON parsed successfully:`, data);
    } catch (parseError) {
      console.error(`❌ ${context} - JSON parse error:`, parseError.message);
      console.error(`❌ ${context} - Raw text:`, responseText);
    }
    
    // Make response data visible to debugger
    if (__DEV__) {
      // This makes the response visible in React Native debugger
      console.log(`🔍 DEBUGGER_VISIBLE_${context.toUpperCase()}:`, {
        url,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: data,
        rawText: responseText
      });
    }
    
    return { data, status: response.status, ok: response.ok };
  } catch (error) {
    console.error(`❌ ${context} - Fetch error:`, error);
    throw error;
  }
};

/**
 * Create a debugger-visible network request
 * @param {string} url - Full URL
 * @param {Object} options - Request options
 * @param {string} context - Context for logging
 * @returns {Promise<Object>} Response data
 */
export const createDebuggerVisibleRequest = async (url, options = {}, context = 'API Request') => {
  try {
    console.log(`🔍 ${context} - Creating debugger visible request`);
    
    // Use XMLHttpRequest to make it visible in debugger network tab
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.open(options.method || 'GET', url, true);
      
      // Set headers
      if (options.headers) {
        Object.keys(options.headers).forEach(key => {
          xhr.setRequestHeader(key, options.headers[key]);
        });
      }
      
      // Set default headers
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.setRequestHeader('Content-Type', 'application/json');
      
      xhr.onload = function() {
        try {
          console.log(`📥 ${context} - XHR Status: ${xhr.status}`);
          console.log(`📥 ${context} - XHR Response:`, xhr.responseText);
          
          const data = JSON.parse(xhr.responseText);
          console.log(`✅ ${context} - XHR Parsed:`, data);
          
          // Make it visible to debugger
          if (__DEV__) {
            console.log(`🔍 DEBUGGER_XHR_${context.toUpperCase()}:`, {
              url,
              method: options.method || 'GET',
              status: xhr.status,
              statusText: xhr.statusText,
              headers: xhr.getAllResponseHeaders(),
              data: data,
              rawText: xhr.responseText
            });
          }
          
          resolve({ data, status: xhr.status, ok: xhr.status >= 200 && xhr.status < 300 });
        } catch (error) {
          console.error(`❌ ${context} - XHR Parse error:`, error);
          reject(error);
        }
      };
      
      xhr.onerror = function() {
        console.error(`❌ ${context} - XHR Error:`, xhr.statusText);
        reject(new Error(xhr.statusText));
      };
      
      xhr.send(options.body || null);
    });
  } catch (error) {
    console.error(`❌ ${context} - XHR Request error:`, error);
    throw error;
  }
};

/**
 * Authentication API endpoints
 */
export const authAPI = {
  /**
   * Test API connection
   * @returns {Promise<boolean>}
   */
  async testConnection() {
    return await testConnection();
  },

  /**
   * User login
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<LoginResponse>}
   */
  async login(email, password) {
    if (Config.OFFLINE_MODE) {
      return await mockAPI.login(email, password);
    }

    const response = await api.post('/auth/login', {
      email: email.toLowerCase().trim(),
      password,
    });
    return response.data;
  },

  /**
   * User registration
   * @param {RegisterData} userData 
   * @returns {Promise<ApiResponse>}
   */
  async register(userData) {
    if (Config.OFFLINE_MODE) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, message: 'User registered successfully' };
    }

    const response = await api.post('/auth/register', {
      ...userData,
      email: userData.email.toLowerCase().trim(),
      role: userData.role || 'USER',
    });
    return response.data;
  },

  /**
   * Get user profile
   * @returns {Promise<User>}
   */
  async getProfile() {
    if (Config.OFFLINE_MODE) {
      return await mockAPI.getProfile();
    }

    const response = await api.get('/profile');
    return response.data.data;
  },

  /**
   * Logout user
   * @returns {Promise<void>}
   */
  async logout() {
    if (Config.OFFLINE_MODE) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return;
    }

    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with local logout even if API fails
    }
  },

  /**
   * Request password reset
   * @param {string} email 
   * @returns {Promise<ApiResponse>}
   */
  async forgotPassword(email) {
    if (Config.OFFLINE_MODE) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, message: 'Password reset email sent' };
    }

    const response = await api.post('/auth/forgot-password', {
      email: email.toLowerCase().trim(),
    });
    return response.data;
  },

  /**
   * Verify password reset token
   * @param {string} token 
   * @returns {Promise<ApiResponse>}
   */
  async verifyResetToken(token) {
    const response = await api.post('/auth/verify-reset-token', { token });
    return response.data;
  },

  /**
   * Complete password reset
   * @param {string} token 
   * @param {string} newPassword 
   * @returns {Promise<ApiResponse>}
   */
  async resetPassword(token, newPassword) {
    const response = await api.post('/auth/complete-reset-password', {
      token,
      newPassword,
    });
    return response.data;
  },
};

export default api; 