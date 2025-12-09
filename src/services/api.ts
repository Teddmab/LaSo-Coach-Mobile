import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import Config from '../config/env';
import firebaseAuthService from './firebaseAuthServiceNew';
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

// Create axios instance with environment-based configuration
const api: AxiosInstance = axios.create({
  baseURL: Config.API_BASE_URL,
  timeout: Config.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

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
    const token = await firebaseAuthService.getIdToken();
    if (token) {
    } else {
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
    
    // Try a simple health check or login endpoint
    const response = await axios.get(`${Config.API_BASE_URL}/health`, {
      timeout: 10000, // 10 second timeout for connection test
    });
    
    return true;
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

interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
  headers?: any;
}

/**
 * Request interceptor to add Firebase ID tokens to every call (aligned with web app flow).
 * If the user is not authenticated yet, the request proceeds without Authorization header.
 */
api.interceptors.request.use(
  async (config: any) => {
    try {
      if (__DEV__) {
      }

      // Handle FormData - remove Content-Type only if not explicitly set
      // Some requests need explicit Content-Type header
      if (config.data instanceof FormData) {
        // Only remove Content-Type if it wasn't explicitly set in config
        if (!config.headers || !config.headers['Content-Type']) {
          delete config.headers?.['Content-Type'];
          if (__DEV__) {
          }
        } else {
          if (__DEV__) {
          }
        }
        if (__DEV__) {
          // FormData detected
        }
      }

      // Log full URL before making request
      const fullUrl = `${config.baseURL || Config.API_BASE_URL}${config.url || ''}`;
      if (__DEV__) {
      }

      const idToken = await firebaseAuthService.getIdToken();
      if (idToken) {
        if (config.headers) {
          config.headers.Authorization = `Bearer ${idToken}`;
        }
        if (__DEV__) {
        }
      } else if (__DEV__) {
      }

      return config;
    } catch (error: any) {
      if (__DEV__) {
      }
      return config;
    }
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor for token refresh and error handling
 */
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Only log in development mode
    if (__DEV__) {
    }
    return response;
  },
  async (error: AxiosError) => {
    // Log errors with appropriate detail level
    if (__DEV__) {
      if (error.response?.data) {
      }
    }
    
    const originalRequest = error.config as ExtendedAxiosRequestConfig;

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401) {
      if (originalRequest?._retry) {
        return Promise.reject(error);
      }

      // Avoid retrying auth endpoints
      if (originalRequest?.url?.includes('/auth/')) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const newIdToken = await firebaseAuthService.getIdToken(true);

        if (newIdToken && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newIdToken}`;
          return api(originalRequest);
        }
      } catch (refreshError: any) {

        try {
          await firebaseAuthService.logout();
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
export const debugResponse = (response: AxiosResponse, context: string = 'API Response'): void => {
  if (response.data) {
    // Response data available
  }
};

interface FetchOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

interface FetchResponse {
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
): Promise<FetchResponse> => {
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
): Promise<FetchResponse> => {
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
    // Don't set Content-Type manually - axios will set it with boundary automatically
    const response = await api.patch<{ success: boolean; message: string; data: { avatarUrl: string } }>(endpoint, formData, {
      timeout: 120000, // 120 seconds for image uploads (longer than default)
      headers: {
        // Don't set Content-Type - axios will set it automatically with boundary for FormData
        // Setting it manually prevents axios from adding the boundary parameter
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

