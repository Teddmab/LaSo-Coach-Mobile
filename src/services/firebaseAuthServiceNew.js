// IMPORTANT: Import firebaseApp FIRST to ensure proper initialization order
import { getFirebaseAuth } from '../config/firebaseApp';
import { API_CONFIG } from '../config/apiConfig';
import axios from 'axios';
// Import Firebase auth functions AFTER our config is initialized
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithCustomToken,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth/react-native';

/**
 * Firebase Authentication Service for React Native
 * Based on web app implementation but adapted for mobile
 */

class FirebaseAuthService {
  constructor() {
    this.currentUser = null;
    this.authStateListeners = [];
    this.firebaseAuth = null;
    this.authInitPromise = null;
    
    // Log which API endpoint is being used
    console.log('🔥 Firebase Auth Service initialized with API:', API_CONFIG.BASE_URL);
    
    // Create a backend API instance that automatically includes Firebase ID tokens
    this.backendApi = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Initialize Firebase Auth asynchronously
    // With simplified getAuth init, we attempt to capture the instance immediately.
    try {
      this.firebaseAuth = getFirebaseAuth();
      if (this.firebaseAuth) {
  console.log('✅ Firebase Auth Service ready');
        this.initializeInterceptors();
        this.initializeAuthStateListener();
      } else {
        console.warn('⚠️ Firebase Auth instance not available at service construction');
      }
    } catch (e) {
      console.error('❌ Firebase Auth Service construction error:', e);
    }
    this.authInitPromise = Promise.resolve(this.firebaseAuth);
  }

  async _initializeAuth() {
    // No longer used: retained for compatibility; returns existing instance.
    return this.firebaseAuth;
  }

  async ensureAuth() {
    if (!this.firebaseAuth) {
      this.firebaseAuth = getFirebaseAuth();
    }
    if (!this.firebaseAuth) throw new Error('Firebase Auth is not initialized.');
    return this.firebaseAuth;
  }

  /**
   * Get Firebase Auth instance (no longer lazy - already initialized)
   */
  getAuth() {
    if (!this.firebaseAuth) {
      throw new Error('Firebase Auth is not initialized. Please check Firebase configuration.');
    }
    return this.firebaseAuth;
  }

  /**
   * Initialize request/response interceptors
   */
  initializeInterceptors() {
    // Setup request interceptor to include Firebase ID token
    this.backendApi.interceptors.request.use(
      async (config) => {
        // Get Firebase ID token for authentication
        const idToken = await this.getIdToken();
        if (idToken) {
          config.headers.Authorization = `Bearer ${idToken}`;
        }

        // Don't set Content-Type for FormData requests
        if (config.data instanceof FormData) {
          delete config.headers['Content-Type'];
        }

        // Add cache-busting for GET requests (except auth endpoints)
        if (config.method === 'get' && !config.url?.includes('/auth/')) {
          const separator = config.url?.includes('?') ? '&' : '?';
          const timestamp = Date.now();
          config.url = `${config.url}${separator}t=${timestamp}`;
          
          // Add cache-control headers
          config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
          config.headers['Pragma'] = 'no-cache';
          config.headers['Expires'] = '0';
        }

        console.log('[API] Outgoing request:', config.url);
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Setup response interceptor for error handling
    this.backendApi.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        console.log('🔍 API Interceptor - Error URL:', originalRequest?.url);
        console.log('🔍 API Interceptor - Error Status:', error.response?.status);

        // Handle 401 Unauthorized errors
        if (error.response?.status === 401) {
          console.log('🔍 API Interceptor - 401 error detected');
          
          // Don't retry for auth endpoints
          if (originalRequest?.url?.includes('/auth/login') || 
              originalRequest?.url?.includes('/auth/verify-reset-token') ||
              originalRequest?.url?.includes('/auth/complete-reset-password') ||
              originalRequest?.url?.includes('/auth/forgot-password')) {
            console.log('🔍 API Interceptor - Auth endpoint detected, not retrying');
            return Promise.reject(new Error('Invalid credentials or token'));
          }

          // For other 401 errors, try to refresh Firebase token
          if (!originalRequest._retry) {
            originalRequest._retry = true;

            try {
              console.log('🔍 API Interceptor - Attempting Firebase token refresh');
              
              // Force refresh Firebase ID token
              const newIdToken = await this.getIdToken(true);
              if (newIdToken && originalRequest?.headers) {
                originalRequest.headers.Authorization = `Bearer ${newIdToken}`;
                return this.backendApi(originalRequest);
              }
            } catch (refreshError) {
              console.log('🔍 API Interceptor - Firebase token refresh failed');
              await this.logout();
              return Promise.reject(new Error('Session expired. Please login again.'));
            }
          }
        }

        // Handle 403 Forbidden errors
        if (error.response?.status === 403) {
          console.error('Access forbidden:', error.response.data);
          return Promise.reject(new Error('You do not have permission to perform this action.'));
        }

        // Handle other errors
        const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred';
        return Promise.reject(new Error(errorMessage));
      }
    );
  }

  /**
   * Initialize Firebase auth state listener
   */
  initializeAuthStateListener() {
    // Check if Firebase Auth is available before setting up listener
    const auth = this.getAuth();
    if (!auth) {
      console.error('❌ Firebase Auth not available for state listener');
      return;
    }

    // Listen to Firebase auth state changes
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Try to get user profile from backend
          const profile = await this.getUserProfile();
          if (profile) {
            this.currentUser = {
              ...profile,
              uid: firebaseUser.uid,
              emailVerified: firebaseUser.emailVerified,
            };
          }
        } catch (error) {
          console.log('Could not fetch user profile on auth state change:', error);
        }
      } else {
        this.currentUser = null;
      }
      
      // Notify all listeners
      this.authStateListeners.forEach(listener => listener(this.currentUser));
    });
  }

  /**
   * Get user profile from backend API
   */
  async getUserProfile() {
    try {
      const response = await this.backendApi.get(API_CONFIG.endpoints.profile.get);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Update user profile via backend API
   */
  async updateUserProfile(data) {
    try {
      if (!this.getAuth().currentUser) {
        throw new Error('No user logged in');
      }

      // Update profile via backend API
      const response = await this.backendApi.put(API_CONFIG.endpoints.profile.update, {
        ...data,
        updatedAt: new Date().toISOString()
      });
      
      // Update Firebase profile if needed
      if (data.firstName || data.lastName) {
        const displayName = `${data.firstName || this.currentUser?.firstName || ''} ${data.lastName || this.currentUser?.lastName || ''}`.trim();
        await updateProfile(this.getAuth().currentUser, { displayName });
      }

      // Update current user
      this.currentUser = response.data.data || response.data;
      return this.currentUser;
    } catch (error) {
      console.error('Profile update error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * Login with email and password via Firebase + backend verification
   */
  async login(credentials) {
    try {
      // Ensure Firebase Auth is initialized before attempting login
      const auth = await this.ensureAuth();
      
      // 1. Sign in with Firebase using email/password to get ID token
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );
      
      // 2. Get Firebase ID token
      const idToken = await userCredential.user.getIdToken();

      // 3. Send Firebase ID token to backend for verification
      const response = await this.backendApi.post(API_CONFIG.endpoints.auth.login, {
        idToken: idToken
      });

      // 4. Extract user data from backend response
      const userData = response.data?.data || response.data || {};
      const profile = await this.getUserProfile();

      this.currentUser = {
        ...(profile || userData),
        uid: userCredential.user.uid,
        emailVerified: userCredential.user.emailVerified,
      };
      
      return this.currentUser;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * Register new user via Firebase + backend
   */
  async register(credentials) {
    try {
      // Ensure Firebase Auth is initialized before registration
      const auth = await this.ensureAuth();
      
      // 1. Register user via backend (backend handles Firebase user creation)
      const response = await this.backendApi.post(API_CONFIG.endpoints.auth.register, {
        email: credentials.email.toLowerCase().trim(),
        password: credentials.password,
        name: `${credentials.firstName} ${credentials.lastName || ''}`.trim(),
        role: 'USER',
        phone: credentials.phone,
      });

      const responseData = response.data || response;
      const firebaseCustomToken =
        responseData.token || responseData.firebaseToken || responseData.customToken;

      if (!firebaseCustomToken) {
        throw new Error('No Firebase custom token received from backend registration.');
      }

      // 2. Sign in with Firebase custom token returned by backend
      const userCredential = await signInWithCustomToken(auth, firebaseCustomToken);

      // 3. Ensure Firebase display name is up-to-date
      const displayName = `${credentials.firstName} ${credentials.lastName || ''}`.trim();
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }

      // 4. Fetch full user profile from backend
      const profile = await this.getUserProfile();
      const fallbackProfile = responseData.data || {};

      this.currentUser = {
        ...(profile || fallbackProfile),
        uid: userCredential.user.uid,
        emailVerified: userCredential.user.emailVerified,
      };

      return this.currentUser;
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * Login with Google (using custom token from backend)
   */
  async loginWithGoogle(googleIdToken) {
    try {
      // Ensure Firebase Auth is initialized before Google login
      const auth = await this.ensureAuth();
      
      // Send Google ID token to backend
      const response = await this.backendApi.post(API_CONFIG.endpoints.auth.login, {
        googleIdToken: googleIdToken
      });

      const firebaseToken = response.data.firebaseToken || response.data.token;
      if (!firebaseToken) {
        throw new Error('No Firebase token received from backend');
      }

      // Get custom token from backend and sign in with Firebase
      const userCredential = await signInWithCustomToken(auth, firebaseToken);
      const userData = response.data.data || response.data || {};
      const profile = await this.getUserProfile();

      this.currentUser = {
        ...(profile || userData),
        uid: userCredential.user.uid,
        emailVerified: userCredential.user.emailVerified,
      };

      return this.currentUser;
    } catch (error) {
      console.error('Google login error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      // Sign out from Firebase
      await signOut(this.getAuth());
      
      this.currentUser = null;
    } catch (error) {
      console.error('Logout error:', error);
      this.currentUser = null;
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Get Firebase ID token for API calls
   */
  async getIdToken(forceRefresh = false) {
    try {
      const auth = this.firebaseAuth;
      if (!auth) {
        console.log('Firebase Auth not available for token request');
        return null;
      }
      
      if (auth.currentUser) {
        return await auth.currentUser.getIdToken(forceRefresh);
      }
      return null;
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email) {
    try {
      await this.backendApi.post(API_CONFIG.endpoints.auth.forgotPassword, {
        email: email.toLowerCase().trim(),
      });
    } catch (error) {
      console.error('Password reset error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * Verify backend password reset token
   */
  async verifyPasswordResetToken(token) {
    try {
      const response = await this.backendApi.post(API_CONFIG.endpoints.auth.verifyResetToken, { token });
      return response.data;
    } catch (error) {
      console.error('Verify reset token error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * Complete backend password reset
   */
  async completePasswordReset(token, newPassword) {
    try {
      const response = await this.backendApi.post(API_CONFIG.endpoints.auth.completeResetPassword, {
        token,
        newPassword,
      });
      return response.data;
    } catch (error) {
      console.error('Complete reset password error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * Update user password
   */
  async updatePassword(data) {
    try {
      if (!this.getAuth().currentUser) {
        throw new Error('No user logged in');
      }

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        this.getAuth().currentUser.email,
        data.currentPassword
      );
      await reauthenticateWithCredential(this.getAuth().currentUser, credential);

      // Update password
      await updatePassword(this.getAuth().currentUser, data.newPassword);
    } catch (error) {
      console.error('Password update error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * Delete user account
   */
  async deleteAccount() {
    try {
      if (!this.getAuth().currentUser) {
        throw new Error('No user logged in');
      }

      // Delete user via backend API
      await this.backendApi.delete(API_CONFIG.endpoints.profile.delete);

      // Delete Firebase user
      await this.getAuth().currentUser.delete();
      
      this.currentUser = null;
    } catch (error) {
      console.error('Account deletion error:', error);
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback) {
    this.authStateListeners.push(callback);
    
    // Firebase Auth is already initialized in constructor, no need for lazy init
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  /**
   * Get user-friendly error messages
   */
  getErrorMessage(error) {
    if (error?.response?.data?.message) {
      return error.response.data.message;
    }
    if (error?.response?.data?.error) {
      return error.response.data.error;
    }

    // Handle Firebase auth errors
    switch (error.code) {
      case 'auth/user-not-found':
        return 'Aucun compte trouvé avec cette adresse e-mail.';
      case 'auth/wrong-password':
        return 'Mot de passe incorrect.';
      case 'auth/email-already-in-use':
        return 'Cette adresse e-mail est déjà utilisée.';
      case 'auth/weak-password':
        return 'Le mot de passe est trop faible.';
      case 'auth/invalid-email':
        return 'Adresse e-mail invalide.';
      case 'auth/user-disabled':
        return 'Ce compte a été désactivé.';
      case 'auth/too-many-requests':
        return 'Trop de tentatives. Veuillez réessayer plus tard.';
      case 'auth/network-request-failed':
        return 'Erreur de connexion. Vérifiez votre connexion internet.';
      default:
        return error.message || 'Une erreur est survenue.';
    }
  }
}

// Export singleton instance
export const firebaseAuthService = new FirebaseAuthService();
export default firebaseAuthService;