// IMPORTANT: Import firebaseApp FIRST to ensure proper initialization order
import { getFirebaseAuth, isCompatAuth } from '../config/firebaseApp';
import createLogger from '../utils/logger';
import { API_CONFIG } from '../config/apiConfig';
import axios from 'axios';
// Import Firebase auth functions AFTER our config is initialized
// Use compat fallback to avoid component registration issues in Expo Go; require modular funcs only when available.
import firebaseCompat from 'firebase/compat/app';
import 'firebase/compat/auth';

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
    this._authStateListenerAttached = false; // Track if we've attached the Firebase onAuthStateChanged listener
    this.logger = createLogger('FirebaseAuthService');
    
    // Log which API endpoint is being used
    this.logger.info('Firebase Auth Service init', { baseUrl: API_CONFIG.BASE_URL });
    
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
        this.logger.debug('Firebase Auth instance captured');
        this.initializeInterceptors();
        this.initializeAuthStateListener();
      } else {
        this.logger.warn('Firebase Auth instance not available at construction (will retry)');
      }
    } catch (e) {
      this.logger.error('Firebase Auth Service construction error', e);
    }
    this.authInitPromise = Promise.resolve(this.firebaseAuth);
  }

  async _initializeAuth() {
    // No longer used: retained for compatibility; returns existing instance.
    return this.firebaseAuth;
  }

  async ensureAuth() {
    // Attempt to obtain the Firebase Auth instance with limited retries to reduce race-induced crashes
    const maxAttempts = 5;
    let attempt = 0;
    while (!this.firebaseAuth && attempt < maxAttempts) {
      attempt += 1;
      this.firebaseAuth = getFirebaseAuth();
      if (this.firebaseAuth) {
        this.logger.debug(`ensureAuth available attempt ${attempt}`);
        if (!this._interceptorsInitialized) {
          this.initializeInterceptors();
          this._interceptorsInitialized = true;
        }
        if (!this._authStateListenerAttached) {
          this.initializeAuthStateListener();
        }
        break;
      }
      if (attempt < maxAttempts) {
        await new Promise(res => setTimeout(res, 150 * attempt)); // progressive backoff
      }
    }
    if (!this.firebaseAuth) throw new Error('Firebase Auth is not initialized after retries.');
    return this.firebaseAuth;
  }

  /**
   * Get Firebase Auth instance (no longer lazy - already initialized)
   */
  getAuth() {
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

        this.logger.debug('API request', { url: config.url });
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Setup response interceptor for error handling
    this.backendApi.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        this.logger.debug('API error', { url: originalRequest?.url, status: error.response?.status });

        // Handle 401 Unauthorized errors
        if (error.response?.status === 401) {
          this.logger.info('API 401 detected');

          // Skip retry for auth endpoints
          if (originalRequest?.url?.includes('/auth/login') ||
              originalRequest?.url?.includes('/auth/verify-reset-token') ||
              originalRequest?.url?.includes('/auth/complete-reset-password') ||
              originalRequest?.url?.includes('/auth/forgot-password')) {
            this.logger.debug('API 401 auth endpoint skip retry');
            return Promise.reject(new Error('Invalid credentials or token'));
          }

          // Retry logic with limited attempts; do NOT auto logout on transient failures
          originalRequest._retryCount = originalRequest._retryCount || 0;
          if (originalRequest._retryCount < 2) {
            originalRequest._retryCount += 1;
            try {
              this.logger.info(`API token refresh attempt ${originalRequest._retryCount}`);
              const newIdToken = await this.getIdToken(true);
              if (newIdToken && originalRequest?.headers) {
                originalRequest.headers.Authorization = `Bearer ${newIdToken}`;
                return this.backendApi(originalRequest);
              }
            } catch (refreshError) {
              this.logger.warn('API token refresh failed');
            }
          } else {
            this.logger.warn('API max token refresh attempts reached');
            return Promise.reject(new Error('Authentication temporarily unavailable. Please retry.'));
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
    if (this._authStateListenerAttached) return; // Guard against double registration
    let auth;
    try {
      auth = this.getAuth();
    } catch (e) {
      console.error('❌ Firebase Auth not available for state listener (will retry via ensureAuth):', e.message);
      return;
    }
    if (!auth) {
      console.error('❌ Firebase Auth not available for state listener');
      return;
    }
    const useCompat = isCompatAuth();
    const listener = async (firebaseUser) => {
      this.logger.debug('[AuthStateListener] change', { email: firebaseUser ? firebaseUser.email : null });
      
      if (firebaseUser) {
        // IMMEDIATE: Set basic user data and notify listeners to prevent timeout
        this.currentUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || 'User',
          emailVerified: firebaseUser.emailVerified,
        };
        
        // Notify immediately to clear auth timeout
        this.logger.debug('[AuthStateListener] notify basic user');
        this.authStateListeners.forEach(cb => cb(this.currentUser));
        
        // ASYNC: Fetch full profile in background and update
        (async () => {
          try {
            // Wait a moment for the token to be available in interceptors
            await new Promise(resolve => setTimeout(resolve, 150));
            
            const profile = await this.getUserProfile();
            if (profile) {
              this.currentUser = {
                ...profile,
                uid: firebaseUser.uid,
                emailVerified: firebaseUser.emailVerified,
              };
              this.logger.debug('[AuthStateListener] profile loaded');
              // Notify again with full profile
              this.authStateListeners.forEach(cb => cb(this.currentUser));
            }
          } catch (error) {
            this.logger.warn('[AuthStateListener] profile fetch failed', { error: error.message });
            // Keep basic user data already set
          }
        })();
      } else {
        this.currentUser = null;
        this.logger.info('[AuthStateListener] user signed out');
        this.authStateListeners.forEach(cb => cb(this.currentUser));
      }
    };
    if (useCompat) {
      auth.onAuthStateChanged(listener);
      // Compat doesn't expose separate onIdTokenChanged easily; rely on auth state changes.
    } else {
      const { onAuthStateChanged, onIdTokenChanged } = require('firebase/auth');
      onAuthStateChanged(auth, listener);
      onIdTokenChanged(auth, async (user) => {
        if (user) {
          // Optionally we could broadcast a token refresh event or update currentUser timestamp
          const freshToken = await this.getIdToken(false);
          if (freshToken) {
            this.logger.debug('[TokenListener] ID token refreshed');
          }
        }
      });
    }
    this._authStateListenerAttached = true;
    this.logger.debug('Auth state listener attached');
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
      await this.ensureAuth();
      const auth = this.getAuth();
      if (!auth || !auth.currentUser) {
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
        try {
          if (isCompatAuth()) {
            await this.getAuth().currentUser.updateProfile({ displayName });
          } else {
            const { updateProfile } = require('firebase/auth');
            await updateProfile(this.getAuth().currentUser, { displayName });
          }
        } catch (e) {
          console.log('⚠️ Failed to update Firebase displayName:', e.message);
        }
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
      const auth = await this.ensureAuth();
      let userCredential;
      if (isCompatAuth()) {
        userCredential = await auth.signInWithEmailAndPassword(credentials.email, credentials.password);
      } else {
        const { signInWithEmailAndPassword } = require('firebase/auth');
        userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      }
      
      // Get Firebase ID token and verify with backend
      const idToken = await userCredential.user.getIdToken();
      this.logger.info('[Login] Firebase sign-in successful');

      // Send Firebase ID token to backend for verification and user sync
      await this.backendApi.post(API_CONFIG.endpoints.auth.login, {
        idToken: idToken
      });
      this.logger.info('[Login] Backend verification successful');

      // Return minimal user data - the auth state listener will fetch full profile
      this.currentUser = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        name: userCredential.user.displayName || 'User',
        emailVerified: userCredential.user.emailVerified,
      };
      this.logger.debug('[Login] Returning minimal user');
      
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
      let userCredential;
      if (isCompatAuth()) {
        userCredential = await auth.signInWithCustomToken(firebaseCustomToken);
      } else {
        const { signInWithCustomToken } = require('firebase/auth');
        userCredential = await signInWithCustomToken(auth, firebaseCustomToken);
      }

      // 3. Ensure Firebase display name is up-to-date
      const displayName = `${credentials.firstName} ${credentials.lastName || ''}`.trim();
      if (displayName) {
        try {
          if (isCompatAuth()) {
            await userCredential.user.updateProfile({ displayName });
          } else {
            const { updateProfile } = require('firebase/auth');
            await updateProfile(userCredential.user, { displayName });
          }
        } catch (e) {
          console.log('⚠️ Failed to set initial displayName:', e.message);
        }
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
      let userCredential;
      if (isCompatAuth()) {
        userCredential = await auth.signInWithCustomToken(firebaseToken);
      } else {
        const { signInWithCustomToken } = require('firebase/auth');
        userCredential = await signInWithCustomToken(auth, firebaseToken);
      }
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
      await this.ensureAuth();
      const auth = this.getAuth();
      if (isCompatAuth()) {
        await auth.signOut();
      } else {
        const { signOut } = require('firebase/auth');
        await signOut(auth);
      }
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
      if (!this.firebaseAuth) {
        try {
          await this.ensureAuth();
        } catch (e) {
          console.log('Firebase Auth not available for token request (ensureAuth failed)');
          return null;
        }
      }
      const auth = this.firebaseAuth;
      
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
      await this.ensureAuth();
      const auth = this.getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');
      if (isCompatAuth()) {
        const credential = firebaseCompat.auth.EmailAuthProvider.credential(user.email, data.currentPassword);
        await user.reauthenticateWithCredential(credential);
        await user.updatePassword(data.newPassword);
      } else {
        const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } = require('firebase/auth');
        const credential = EmailAuthProvider.credential(user.email, data.currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, data.newPassword);
      }
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
      await this.ensureAuth();
      const auth = this.getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');
      await this.backendApi.delete(API_CONFIG.endpoints.profile.delete);
      await user.delete();
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