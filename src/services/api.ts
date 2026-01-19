import Config from '../config/env';
// Import firebaseAuthService dynamically to avoid circular dependency
// firebaseAuthServiceNew.ts uses require('./api'), so we must use require() here too
let firebaseAuthService: any;
try {
  const firebaseAuthModule = require('./firebaseAuthServiceNew');
  firebaseAuthService = firebaseAuthModule.default || firebaseAuthModule;
} catch (error: any) {
  console.error('❌ [api] Erreur lors de l\'import de firebaseAuthService:', error?.message);
  firebaseAuthService = null;
}
import { NavigationContainerRef } from '@react-navigation/native';
import type { 
  LoginResponse, 
  RegisterData, 
  RegisterResponse, 
  ForgotPasswordResponse, 
  VerifyResetTokenResponse, 
  ResetPasswordResponse, 
  RefreshTokenResponse, 
  ProfileUpdateData, 
  User 
} from '../types/auth';

// Store reference to navigation for redirects
let navigationRef: NavigationContainerRef<any> | null = null;

interface MockLoginResponse {
  token: string;
  refreshToken: string;
  id: string;
  name: string;
  email: string;
  firstName: string;
  lastName: string;
  onboardingCompleted: boolean;
  currentStep: string;
}

interface MockAPI {
  login: (email: string, password: string) => Promise<MockLoginResponse>;
  getProfile: () => Promise<User>;
}

/**
 * Warm up Firebase auth so the initial ID token is available for interceptors.
 * Called once during app startup (before any API calls)
 */
const ensureFirebaseAuthInitialized = async (): Promise<void> => {
  try {
    // Load firebaseAuthService dynamically if not already loaded
    if (!firebaseAuthService) {
      const firebaseAuthModule = require('./firebaseAuthServiceNew');
      firebaseAuthService = firebaseAuthModule.default || firebaseAuthModule;
    }
    if (firebaseAuthService) {
    const token = await firebaseAuthService.getIdToken();
    if (token) {
    } else {
      }
    }
  } catch (error: any) {
  }
};

/**
 * Export function to keep compatibility with previous initialization hook
 */
export const initializeTokenManager = async (): Promise<void> => {
  await ensureFirebaseAuthInitialized();
};

/**
 * Set navigation reference for auto-redirect on auth failure
 */
export const setNavigationRef = (navigation: NavigationContainerRef<any>): void => {
  navigationRef = navigation;
};

/**
 * Test API connection
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`${Config.API_BASE_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error: any) {
    return false;
  }
};

/**
 * Simulate API responses for offline testing
 */
const mockAPI: MockAPI = {
  async login(email: string, password: string): Promise<MockLoginResponse> {
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

  async getProfile(): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      id: 'user_123',
      name: 'Test User',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'USER',
      status: 'ACTIVE',
      isActive: true,
      isVerified: true,
      onboardingCompleted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },
};

// Request interceptor type
type RequestInterceptor = (config: RequestConfig) => Promise<RequestConfig> | RequestConfig;
// Response interceptor types
type ResponseInterceptor = (response: FetchResponse) => FetchResponse | Promise<FetchResponse>;
type ResponseErrorInterceptor = (error: FetchError) => Promise<FetchResponse> | Promise<never>;

interface RequestConfig {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
  timeout?: number;
  _retry?: boolean;
}

interface FetchResponse {
  data: any;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: RequestConfig;
}

interface FetchError extends Error {
  response?: FetchResponse;
  config?: RequestConfig;
  code?: string;
  message: string;
}

// Interceptors storage
const requestInterceptors: RequestInterceptor[] = [];
const responseInterceptors: ResponseInterceptor[] = [];
const responseErrorInterceptors: ResponseErrorInterceptor[] = [];

/**
 * Add request interceptor
 */
const addRequestInterceptor = (fulfilled: RequestInterceptor): void => {
  requestInterceptors.push(fulfilled);
};

/**
 * Add response interceptor
 */
const addResponseInterceptor = (
  fulfilled: ResponseInterceptor,
  rejected?: ResponseErrorInterceptor
): void => {
  responseInterceptors.push(fulfilled);
  if (rejected) {
    responseErrorInterceptors.push(rejected);
  }
};

/**
 * Create timeout controller
 */
const createTimeoutController = (timeout: number): AbortController => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeout);
  return controller;
};

/**
 * Build full URL
 */
const buildUrl = (url: string): string => {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const baseURL = Config.API_BASE_URL.endsWith('/') 
    ? Config.API_BASE_URL.slice(0, -1) 
    : Config.API_BASE_URL;
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${baseURL}${path}`;
};

/**
 * Prepare request body
 */
const prepareBody = (data: any, isFormData: boolean): string | FormData => {
  if (isFormData || data instanceof FormData) {
    return data;
  }
  if (data && typeof data === 'object') {
    return JSON.stringify(data);
  }
  return data;
};

/**
 * Parse response
 */
const parseResponse = async (response: globalThis.Response): Promise<any> => {
  const contentType = response.headers.get('content-type');
  const text = await response.text();
  
  if (contentType && contentType.includes('application/json')) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  
  return text;
};

/**
 * Create fetch error
 */
const createFetchError = (
  message: string,
  response?: globalThis.Response,
  config?: RequestConfig,
  data?: any
): FetchError => {
  const error = new Error(message) as FetchError;
  if (response) {
    error.response = {
      data: data || null,
      status: response.status,
      statusText: response.statusText,
      headers: {},
      config: config || {} as RequestConfig,
    };
  }
  error.config = config;
  return error;
};

/**
 * Execute request with interceptors
 */
const executeRequest = async (config: RequestConfig): Promise<FetchResponse> => {
  // Apply request interceptors
  let finalConfig = config;
  for (const interceptor of requestInterceptors) {
    finalConfig = await interceptor(finalConfig);
  }

  const url = buildUrl(finalConfig.url);
  const isFormData = finalConfig.body instanceof FormData;
  const body = prepareBody(finalConfig.body, isFormData);

  // Prepare headers
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...finalConfig.headers,
  };

  // Don't set Content-Type for FormData (browser will set it with boundary)
  if (!isFormData && body && typeof body === 'string') {
    headers['Content-Type'] = 'application/json';
  }

  // Create timeout controller
  const timeout = finalConfig.timeout || Config.API_TIMEOUT || 30000;
  const controller = createTimeoutController(timeout);

  // Log request details before sending (especially for nutrition plans)
  if (url.includes('/nutrition/plans')) {
    const authHeader = headers.Authorization || '';
    const tokenPreview = authHeader ? authHeader.substring(0, 50) + '...' : 'MISSING';
    console.log('🌐 [api.executeRequest] Envoi de la requête HTTP fetch()', {
      method: finalConfig.method,
      url: url,
      fullUrl: url,
      headers: Object.keys(headers),
      hasAuthorization: !!headers.Authorization,
      authorizationPreview: tokenPreview,
      authorizationLength: authHeader.length,
      hasBody: !!body,
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const response = await fetch(url, {
      method: finalConfig.method,
      headers,
      body: body as any,
      signal: controller.signal,
    });
    
    if (url.includes('/nutrition/plans')) {
      console.log('📡 [api.executeRequest] Réponse HTTP reçue', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url,
      });
    }

    const responseData = await parseResponse(response);

    const fetchResponse: FetchResponse = {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: {},
      config: finalConfig,
    };

    // Copy headers
    response.headers.forEach((value, key) => {
      fetchResponse.headers[key] = value;
    });

    // Apply response interceptors
    let finalResponse = fetchResponse;
    for (const interceptor of responseInterceptors) {
      finalResponse = await interceptor(finalResponse);
    }

    if (!response.ok) {
      const error = createFetchError(
        `Request failed with status ${response.status}`,
        response,
        finalConfig,
        responseData
      );
      
      // Apply error interceptors
      for (const errorInterceptor of responseErrorInterceptors) {
        try {
          return await errorInterceptor(error);
        } catch (interceptorError) {
          // Continue to next interceptor or throw
        }
      }
      
      throw error;
    }

    return finalResponse;
  } catch (error: any) {
    // Handle abort (timeout)
    if (error.name === 'AbortError') {
      const timeoutError = createFetchError(
        'Request timeout',
        undefined,
        finalConfig
      );
      timeoutError.code = 'ECONNABORTED';
      
      // Apply error interceptors
      for (const errorInterceptor of responseErrorInterceptors) {
        try {
          return await errorInterceptor(timeoutError);
        } catch {
          // Continue
        }
      }
      
      throw timeoutError;
    }

    // Handle network errors
    const networkError = createFetchError(
      error.message || 'Network error',
      undefined,
      finalConfig
    );
    networkError.code = 'ERR_NETWORK';

    // Apply error interceptors
    for (const errorInterceptor of responseErrorInterceptors) {
      try {
        return await errorInterceptor(networkError);
      } catch {
        // Continue
      }
    }

    throw networkError;
  }
};

/**
 * API client with Axios-like interface
 */
const api = {
  get: async <T = any>(url: string, config?: { timeout?: number; headers?: Record<string, string> }): Promise<FetchResponse> => {
    return executeRequest({
      url,
      method: 'GET',
      headers: config?.headers || {},
      timeout: config?.timeout,
    });
  },

  post: async <T = any>(url: string, data?: any, config?: { timeout?: number; headers?: Record<string, string> }): Promise<FetchResponse> => {
    return executeRequest({
      url,
      method: 'POST',
      headers: config?.headers || {},
      body: data,
      timeout: config?.timeout,
    });
  },

  put: async <T = any>(url: string, data?: any, config?: { timeout?: number; headers?: Record<string, string> }): Promise<FetchResponse> => {
    return executeRequest({
      url,
      method: 'PUT',
      headers: config?.headers || {},
      body: data,
      timeout: config?.timeout,
    });
  },

  patch: async <T = any>(url: string, data?: any, config?: { timeout?: number; headers?: Record<string, string> }): Promise<FetchResponse> => {
    return executeRequest({
      url,
      method: 'PATCH',
      headers: config?.headers || {},
      body: data,
      timeout: config?.timeout,
    });
  },

  delete: async <T = any>(url: string, config?: { timeout?: number; headers?: Record<string, string> }): Promise<FetchResponse> => {
    return executeRequest({
      url,
      method: 'DELETE',
      headers: config?.headers || {},
      timeout: config?.timeout,
    });
  },
};

/**
 * Request interceptor to add Firebase ID tokens to every call
 */
addRequestInterceptor(async (config: RequestConfig) => {
  try {
    if (__DEV__) {
    }

    // Handle FormData - remove Content-Type only if not explicitly set
    if (config.body instanceof FormData) {
      if (!config.headers['Content-Type']) {
        delete config.headers['Content-Type'];
      }
      if (__DEV__) {
        // FormData detected
      }
    }

    // Log full URL before making request
    const fullUrl = buildUrl(config.url);
    if (__DEV__) {
    }

    // Load firebaseAuthService dynamically if not already loaded
    if (!firebaseAuthService) {
      const firebaseAuthModule = require('./firebaseAuthServiceNew');
      firebaseAuthService = firebaseAuthModule.default || firebaseAuthModule;
    }
    
    if (firebaseAuthService) {
    const idToken = await firebaseAuthService.getIdToken();
    if (idToken) {
      config.headers.Authorization = `Bearer ${idToken}`;
      // Log token info for nutrition plans requests
      if (config.url?.includes('/nutrition/plans')) {
        console.log('🔑 [api.interceptor] Token JWT ajouté à la requête', {
          hasToken: !!idToken,
          tokenLength: idToken.length,
          tokenPreview: idToken.substring(0, 50) + '...',
          url: config.url,
        });
      }
      if (__DEV__) {
      }
    } else {
      // Log missing token for nutrition plans requests
      if (config.url?.includes('/nutrition/plans')) {
        console.warn('⚠️ [api.interceptor] Token JWT manquant pour la requête', {
          url: config.url,
        });
      }
      if (__DEV__) {
      }
    }
    }

    return config;
  } catch (error: any) {
    if (__DEV__) {
    }
    return config;
  }
});

/**
 * Response interceptor for token refresh and error handling
 */
addResponseInterceptor(
  (response: FetchResponse) => {
    // Only log in development mode
    if (__DEV__) {
    }
    return response;
  },
  async (error: FetchError) => {
    // Log errors with appropriate detail level
    if (__DEV__) {
      if (error.response?.data) {
      }
    }
    
    const originalRequest = error.config;

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401) {
      if (originalRequest?._retry) {
        return Promise.reject(error);
      }

      // Avoid retrying auth endpoints
      if (originalRequest?.url?.includes('/auth/')) {
        return Promise.reject(error);
      }

      if (originalRequest) {
        originalRequest._retry = true;

        try {
          // Load firebaseAuthService dynamically if not already loaded
          if (!firebaseAuthService) {
            const firebaseAuthModule = require('./firebaseAuthServiceNew');
            firebaseAuthService = firebaseAuthModule.default || firebaseAuthModule;
          }
          
          if (firebaseAuthService) {
          const newIdToken = await firebaseAuthService.getIdToken(true);

          if (newIdToken && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newIdToken}`;
            return executeRequest(originalRequest);
            }
          }
        } catch (refreshError: any) {
          try {
            if (firebaseAuthService) {
            await firebaseAuthService.logout();
            }
          } catch (logoutError: any) {
          }

          if (navigationRef) {
            navigationRef.reset({
              index: 0,
              routes: [{ name: 'Login' as never }],
            });
          }
        }
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Handle API errors and return user-friendly messages
 */
export const handleAuthError = (error: any): string => {
  // Debug error structure only in dev
  if (__DEV__) {
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
 * Retry a request with exponential backoff
 */
export const retryRequest = async <T>(
  requestFn: () => Promise<T>, 
  maxRetries: number = 3, 
  delay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      // Don't retry if it's the last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Don't retry on client errors (4xx)
      if ((error as any).response && (error as any).response.status >= 400 && (error as any).response.status < 500) {
        break;
      }
      
      // Wait before retrying with exponential backoff
      const waitTime = delay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError;
};

/**
 * Safe JSON parsing with detailed error logging
 */
export const safeJsonParse = (text: string, context: string = 'Unknown'): any | null => {
  try {
    const parsed = JSON.parse(text);
    return parsed;
  } catch (error: any) {
    return null;
  }
};

/**
 * Debug response with detailed logging
 */
export const debugResponse = (response: FetchResponse, context: string = 'API Response'): void => {
  if (response.data) {
    // Response data available
  }
};

interface FetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

interface FetchResponseDebug {
  data: any;
  status: number;
  ok: boolean;
}

/**
 * Debug API responses using fetch for better debugger visibility
 */
export const debugFetch = async (
  url: string, 
  options: FetchOptions = {}, 
  context: string = 'API Request'
): Promise<FetchResponseDebug> => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    // Get response text first
    const responseText = await response.text();
    
    // Parse JSON safely
    let data = null;
    try {
      data = JSON.parse(responseText);
    } catch (parseError: any) {
    }
    
    // Make response data visible to debugger
    if (__DEV__) {
      // This makes the response visible in React Native debugger
      // Response data available
    }
    
    return { data, status: response.status, ok: response.ok };
  } catch (error: any) {
    throw error;
  }
};

/**
 * Create a debugger-visible network request
 */
export const createDebuggerVisibleRequest = async (
  url: string, 
  options: FetchOptions = {}, 
  context: string = 'API Request'
): Promise<FetchResponseDebug> => {
  try {
    // Use XMLHttpRequest to make it visible in debugger network tab
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.open(options.method || 'GET', url, true);
      
      // Set headers
      if (options.headers) {
        Object.keys(options.headers).forEach(key => {
          xhr.setRequestHeader(key, options.headers![key]);
        });
      }
      
      // Set default headers
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.setRequestHeader('Content-Type', 'application/json');
      
      xhr.onload = function() {
        try {
          const data = JSON.parse(xhr.responseText);
          
          // Make it visible to debugger
          if (__DEV__) {
            // XHR response data available
          }
          
          resolve({ data, status: xhr.status, ok: xhr.status >= 200 && xhr.status < 300 });
        } catch (error: any) {
          reject(error);
        }
      };
      
      xhr.onerror = function() {
        reject(new Error(xhr.statusText));
      };
      
      xhr.send(options.body || null);
    });
  } catch (error: any) {
    throw error;
  }
};

/**
 * Authentication API endpoints
 */
export const authAPI = {
  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    return await testConnection();
  },

  /**
   * User login
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    if (Config.OFFLINE_MODE) {
      return await mockAPI.login(email, password) as any;
    }

    const response = await api.post<LoginResponse>('/auth/login', {
      email: email.toLowerCase().trim(),
      password,
    });
    return response.data;
  },

  /**
   * Login using Firebase ID token (Google sign-in)
   */
  async loginWithGoogle(idToken: string): Promise<LoginResponse> {
    // DEBUG: temporarily log outgoing body to diagnose missing idToken issues
    try {
    } catch (e) {
      // ignore
    }
    const response = await api.post<LoginResponse>('/auth/login', { idToken });
    return response.data;
  },

  /**
   * User registration
   */
  async register(userData: RegisterData): Promise<RegisterResponse> {
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
            name: `${userData.firstName} ${userData.lastName}`,
            phoneNumber: userData.phoneNumber,
            address: userData.address,
            region: userData.region,
            language: userData.language,
            role: 'USER',
            status: 'ACTIVE',
            isActive: true,
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
    const response = await api.post<RegisterResponse>('/auth/register', {
      email: userData.email.toLowerCase().trim(),
      name: `${userData.firstName} ${userData.lastName}`,
      password: userData.password,
      phone: userData.phoneNumber,
      role: 'USER',
    });
    return response.data;
  },

  /**
   * Get user profile
   */
  async getProfile(): Promise<User> {
    if (Config.OFFLINE_MODE) {
      return await mockAPI.getProfile();
    }

    // Use longer timeout for initial profile fetch during app initialization
    const response = await api.get<User>('/profile', {
      timeout: Config.AUTH_INIT_TIMEOUT || 90000, // 90 seconds
    });
    
    if (__DEV__) {
    }
    
    // Handle different response structures
    if ((response.data as any).data) {
      return (response.data as any).data;
    } else if (response.data) {
      return response.data;
    } else {
      throw new Error('Invalid profile response format');
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(profileData: ProfileUpdateData): Promise<User> {
    if (Config.OFFLINE_MODE) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        id: 'mock_user_123',
        firstName: profileData.firstName || 'Test',
        lastName: profileData.lastName || 'User',
        email: 'test@example.com',
        name: `${profileData.firstName || 'Test'} ${profileData.lastName || 'User'}`,
        phoneNumber: profileData.phoneNumber || '',
        address: profileData.address || '',
        region: profileData.region || '',
        language: profileData.language || 'fr',
        role: 'USER',
        status: 'ACTIVE',
        isActive: true,
        isVerified: false,
        onboardingCompleted: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const response = await api.patch<{ data: User }>('/profile', profileData);
    return response.data.data;
  },

  /**
   * Upload user avatar
   */
  async uploadAvatar(formData: FormData): Promise<{ success: boolean; message: string; data: { avatarUrl: string } }> {
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

    // CRITICAL FIX: Uploads need longer timeout and proper FormData handling
    // Use the same endpoint as web app: /api/v1/profile/avatar
    // Web uses: baseURL (http://localhost:5001) + /api/v1/profile/avatar
    // Mobile: Check if API_BASE_URL already includes /api/v1
    let endpoint: string;
    if (Config.API_BASE_URL.includes('/api/v1')) {
      // API_BASE_URL already contains /api/v1, so use /profile/avatar
      endpoint = '/profile/avatar';
    } else {
      // API_BASE_URL doesn't contain /api/v1, so use /api/v1/profile/avatar (same as web)
      endpoint = '/api/v1/profile/avatar';
    }
    // Don't set Content-Type manually - fetch will set it with boundary automatically
    const response = await api.patch<{ success: boolean; message: string; data: { avatarUrl: string } }>(endpoint, formData, {
      timeout: 120000, // 120 seconds for image uploads (longer than default)
      headers: {
        // Don't set Content-Type - fetch will set it automatically with boundary for FormData
      },
    });
    return response.data;
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    if (Config.OFFLINE_MODE) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return;
    }

    try {
      // Simple POST request without body - the token is in the Authorization header
      const response = await api.post('/auth/logout');
      return response.data;
    } catch (error: any) {
      // Continue with local logout even if API fails
    }
  },

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
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

    const response = await api.post<ForgotPasswordResponse>('/auth/forgot-password', {
      email: email.toLowerCase().trim(),
    });
    return response.data;
  },

  /**
   * Verify password reset token
   */
  async verifyResetToken(token: string): Promise<VerifyResetTokenResponse> {
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

    const response = await api.post<VerifyResetTokenResponse>('/auth/verify-reset-token', { token });
    return response.data;
  },

  /**
   * Complete password reset
   */
  async resetPassword(token: string, newPassword: string): Promise<ResetPasswordResponse> {
    if (Config.OFFLINE_MODE) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        success: true,
        message: 'Password reset successfully',
        data: {
          user: {
            id: 'mock_user_123',
            email: 'test@example.com',
            name: 'Test User',
            role: 'USER',
            status: 'ACTIVE',
            isActive: true,
            isVerified: true,
            updatedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          }
        }
      };
    }

    const response = await api.post<ResetPasswordResponse>('/auth/complete-reset-password', {
      token,
      newPassword,
    });
    return response.data;
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
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

    const response = await api.post<RefreshTokenResponse>('/auth/refresh-token', { refreshToken });
    return response.data;
  },
};

export default api;
