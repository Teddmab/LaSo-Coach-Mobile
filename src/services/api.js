import axios from 'axios';
import { TokenManager } from './tokenManager';
import Config from '../config/env';
import { retryRequestWithNetworkAwareness } from './networkManager';
import { getFreshFirebaseIdToken } from './googleAuthService';

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
      if (__DEV__) {
        console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
      }
      
      const { token, provider } = await TokenManager.getTokens();
      let authToken = token;

      if (provider === 'google') {
        const firebaseToken = await getFreshFirebaseIdToken();
        if (firebaseToken) {
          authToken = firebaseToken;
          if (token !== firebaseToken) {
            await TokenManager.storeTokens(firebaseToken, null, 'google');
          }
        }
      }
      
      if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
        if (__DEV__) {
          console.log('✅ Authorization header set');
        }
      } else if (__DEV__) {
        console.warn('⚠️ No token available - request will be unauthorized');
      }
      
    } catch (error) {
      console.error('❌ Error adding auth header:', error);
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
    // Only log in development mode
    if (__DEV__) {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    }
    return response;
  },
  async (error) => {
    // Log errors with appropriate detail level
    if (__DEV__) {
      console.log('❌ API Error:', error.config?.method?.toUpperCase(), error.config?.url);
      console.log('Status:', error.response?.status, error.response?.statusText);
      if (error.response?.data) {
        console.log('Error data:', error.response.data);
      }
    }
    
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

    return Promise.reject(error);
  }
);

/**
 * Handle API errors and return user-friendly messages
 * @param {any} error - Error object
 * @returns {string} User-friendly error message
 */
export const handleAuthError = (error) => {
  // Debug error structure only in dev
  if (__DEV__) {
    console.log('🔍 handleAuthError:', error.response?.status || error.code || error.message);
  }

  // Check for network errors first (most common)
  if (!error.response) {
    // Network error - no response from server
    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      return 'Impossible de se connecter au serveur. Vérifiez votre connexion internet et réessayez.';
    }
    
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return 'Délai de connexion dépassé. Vérifiez votre connexion internet et réessayez.';
    }
    
    if (error.code === 'ECONNREFUSED' || error.message?.includes('refused')) {
      return 'Connexion refusée. Le serveur n\'est peut-être pas disponible. Réessayez plus tard.';
    }
    
    if (error.code === 'ENOTFOUND' || error.message?.includes('not found')) {
      return 'Serveur introuvable. Vérifiez votre connexion internet.';
    }
    
    // Generic network error
    return 'Erreur de connexion. Vérifiez votre connexion internet et réessayez.';
  }

  // Check for CORS errors
  if (error.message?.includes('CORS') || error.message?.includes('Origin')) {
    return 'Erreur CORS: Le serveur n\'autorise pas les requêtes depuis cette origine. Contactez l\'administrateur.';
  }

  const status = error.response.status;
  const message = error.response.data?.message || error.response.data?.error;

  switch (status) {
    case 400:
      if (message?.includes('validation') || message?.includes('invalid')) {
        return 'Données invalides. Veuillez vérifier vos informations et réessayer.';
      }
      return message || 'Requête invalide. Veuillez vérifier vos informations.';
      
    case 401:
      // Check for specific error messages from backend
      if (message?.includes('No account found')) {
        return 'Aucun compte trouvé avec cet email. Vérifiez votre email ou cliquez sur "Inscrivez-vous" pour créer un compte.';
      }
      if (message?.includes('Invalid credentials') || message?.includes('incorrect')) {
        return 'Email ou mot de passe incorrect. Vérifiez vos identifiants et réessayez.';
      }
      if (message?.includes('token') || message?.includes('expired')) {
        return 'Session expirée. Veuillez vous reconnecter.';
      }
      // If we have a specific message from the backend, use it
      if (message) {
        return message;
      }
      return 'Email ou mot de passe incorrect.';
      
    case 403:
      if (message?.includes('CORS')) {
        return 'Erreur CORS: Origine non autorisée par le serveur.';
      }
      if (message?.includes('forbidden') || message?.includes('access denied')) {
        return 'Accès refusé. Vous n\'avez pas les permissions nécessaires.';
      }
      return message || 'Accès interdit.';
      
    case 404:
      if (message?.includes('account') || message?.includes('user')) {
        return 'Aucun compte trouvé avec cet email.';
      }
      return 'Ressource introuvable.';
      
    case 409:
      if (message?.includes('already exists') || message?.includes('duplicate')) {
        return 'Un compte avec cet e-mail existe déjà.';
      }
      return 'Conflit de données. Veuillez réessayer.';
      
    case 422:
      if (message?.includes('validation')) {
        return 'Données de validation incorrectes. Veuillez vérifier vos informations.';
      }
      return message || 'Données invalides. Veuillez vérifier vos informations.';
      
    case 429:
      return 'Trop de tentatives. Veuillez attendre quelques minutes avant de réessayer.';
      
    case 500:
      return 'Erreur interne du serveur. Veuillez réessayer plus tard.';
      
    case 502:
      return 'Serveur temporairement indisponible. Veuillez réessayer dans quelques minutes.';
      
    case 503:
      return 'Service temporairement indisponible. Veuillez réessayer plus tard.';
      
    default:
      if (status >= 500) {
        return 'Erreur du serveur. Veuillez réessayer plus tard.';
      }
      if (status >= 400) {
        return message || 'Erreur de requête. Veuillez réessayer.';
      }
      return message || 'Une erreur inattendue s\'est produite.';
  }
};

/**
 * Enhanced retry mechanism for network requests with network awareness
 * @param {Function} requestFn - Function that returns a promise
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Delay between retries in ms
 * @returns {Promise} Promise that resolves with the request result
 */
export const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  return retryRequestWithNetworkAwareness(requestFn, {
    maxRetries,
    initialDelay: delay,
    networkRetryDelay: 2000,
    queueOnDisconnect: true
  });
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
   * Login using Firebase ID token (Google sign-in)
   * @param {string} idToken
   * @returns {Promise<LoginResponse>}
   */
  async loginWithGoogle(idToken) {
    const response = await api.post('/auth/login', { idToken });
    return response.data;
  },

  /**
   * User registration
   * @param {RegisterData} userData 
   * @returns {Promise<RegisterResponse>}
   */
  async register(userData) {
    if (Config.OFFLINE_MODE) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { 
        success: true, 
        message: 'User registered successfully',
        data: {
          user: {
            id: 'mock_user_123',
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            phoneNumber: userData.phoneNumber,
            address: userData.address,
            region: userData.region,
            language: userData.language,
            status: 'ACTIVE',
            isVerified: false,
            onboardingCompleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          token: 'mock_token_123',
          refreshToken: 'mock_refresh_token_456',
        }
      };
    }

    // Match the webapp's API format
    const response = await api.post('/auth/register', {
      email: userData.email.toLowerCase().trim(),
      name: userData.name,
      password: userData.password,
      phone: userData.phone,
      role: 'USER',
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

    // Use longer timeout for initial profile fetch during app initialization
    const response = await api.get('/profile', {
      timeout: Config.AUTH_INIT_TIMEOUT || 90000, // 90 seconds
    });
    
    if (__DEV__) {
      console.log('🔐 getProfile response received');
    }
    
    // Handle different response structures
    if (response.data.data) {
      return response.data.data;
    } else if (response.data) {
      return response.data;
    } else {
      throw new Error('Invalid profile response format');
    }
  },

  /**
   * Update user profile
   * @param {ProfileUpdateData} profileData 
   * @returns {Promise<User>}
   */
  async updateProfile(profileData) {
    if (Config.OFFLINE_MODE) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        id: 'mock_user_123',
        firstName: profileData.firstName || 'Test',
        lastName: profileData.lastName || 'User',
        email: 'test@example.com',
        phoneNumber: profileData.phoneNumber || '',
        address: profileData.address || '',
        region: profileData.region || '',
        language: profileData.language || 'fr',
        status: 'ACTIVE',
        isVerified: false,
        onboardingCompleted: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const response = await api.patch('/profile', profileData);
    return response.data.data;
  },

  /**
   * Upload user avatar
   * @param {FormData} formData 
   * @returns {Promise<{avatarUrl: string}>}
   */
  async uploadAvatar(formData) {
    if (Config.OFFLINE_MODE) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        success: true,
        message: 'Avatar uploaded successfully',
        data: {
          avatarUrl: 'https://laso-coach-uploads.s3.eu-north-1.amazonaws.com/avatars/mock-avatar.jpg'
        }
      };
    }

    const response = await api.patch('/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
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
      // Simple POST request without body - the token is in the Authorization header
      const response = await api.post('/auth/logout');
      console.log('🚪 Logout API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with local logout even if API fails
    }
  },

  /**
   * Request password reset
   * @param {string} email 
   * @returns {Promise<ForgotPasswordResponse>}
   */
  async forgotPassword(email) {
    if (Config.OFFLINE_MODE) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { 
        success: true, 
        message: 'Password reset email sent successfully',
        data: {
          emailSent: true
        }
      };
    }

    const response = await api.post('/auth/forgot-password', {
      email: email.toLowerCase().trim(),
    });
    return response.data;
  },

  /**
   * Verify password reset token
   * @param {string} token 
   * @returns {Promise<VerifyResetTokenResponse>}
   */
  async verifyResetToken(token) {
    if (Config.OFFLINE_MODE) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        success: true,
        message: 'Token is valid',
        data: {
          isValid: true,
          email: 'test@example.com'
        }
      };
    }

    const response = await api.post('/auth/verify-reset-token', { token });
    return response.data;
  },

  /**
   * Complete password reset
   * @param {string} token 
   * @param {string} newPassword 
   * @returns {Promise<ResetPasswordResponse>}
   */
  async resetPassword(token, newPassword) {
    if (Config.OFFLINE_MODE) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        success: true,
        message: 'Password reset successfully',
        data: {
          user: {
            id: 'mock_user_123',
            email: 'test@example.com',
            updatedAt: new Date().toISOString(),
          }
        }
      };
    }

    const response = await api.post('/auth/complete-reset-password', {
      token,
      newPassword,
    });
    return response.data;
  },

  /**
   * Refresh access token
   * @param {string} refreshToken 
   * @returns {Promise<RefreshTokenResponse>}
   */
  async refreshToken(refreshToken) {
    if (Config.OFFLINE_MODE) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        success: true,
        message: 'Token refreshed successfully',
        data: {
          token: 'new_mock_token_123',
          refreshToken: 'new_mock_refresh_token_456',
        }
      };
    }

    const response = await api.post('/auth/refresh-token', { refreshToken });
    return response.data;
  },
};

export default api; 