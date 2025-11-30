// IMPORTANT: Import firebaseApp FIRST to ensure proper initialization order
import { getFirebaseAuth, isCompatAuth } from '../config/firebaseApp';
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
        console.log('✅ Firebase Auth Service ready (instance captured)');
        this.initializeInterceptors();
        this.initializeAuthStateListener();
      } else {
        console.warn('⚠️ Firebase Auth instance not available at service construction (will retry in ensureAuth())');
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
    // Attempt to obtain the Firebase Auth instance if we don't have it yet
    if (!this.firebaseAuth) {
      this.firebaseAuth = getFirebaseAuth();
      if (this.firebaseAuth) {
        console.log('🔁 ensureAuth(): Firebase Auth became available');
        // Initialize interceptors only once
        if (!this._interceptorsInitialized) {
          this.initializeInterceptors();
          this._interceptorsInitialized = true;
        }
        // Attach the auth state listener if not already
        if (!this._authStateListenerAttached) {
          this.initializeAuthStateListener();
        }
      }
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
      console.log('🔐 [AuthStateListener] Firebase user changed:', firebaseUser ? firebaseUser.email : 'null');
      
      if (firebaseUser) {
        // IMMEDIATE: Set basic user data and notify listeners to prevent timeout
        this.currentUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || 'User',
          emailVerified: firebaseUser.emailVerified,
        };
        
        // Notify immediately to clear auth timeout
        console.log('🔐 [AuthStateListener] Notifying listeners immediately (basic user)');
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
              console.log('🔐 [AuthStateListener] User profile loaded, updating listeners');
              // Notify again with full profile
              this.authStateListeners.forEach(cb => cb(this.currentUser));
            }
          } catch (error) {
            console.log('⚠️ [AuthStateListener] Could not fetch user profile:', error.message);
            // Keep basic user data already set
          }
        })();
      } else {
        this.currentUser = null;
        console.log('🔐 [AuthStateListener] User signed out');
        this.authStateListeners.forEach(cb => cb(this.currentUser));
      }
    };
    if (useCompat) {
      auth.onAuthStateChanged(listener);
    } else {
      const { onAuthStateChanged } = require('firebase/auth');
      onAuthStateChanged(auth, listener);
    }
    this._authStateListenerAttached = true;
    console.log('✅ Auth state listener attached');
  }

  /**
   * Get user profile from backend API
   */
  async getUserProfile() {
    try {
      const response = await this.backendApi.get(API_CONFIG.endpoints.profile.get);
      // Backend retourne { success: true, data: {...} } avec tous les détails (firstName, lastName, subscription, etc.)
      return response.data.data || response.data.user || response.data;
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
      // Backend retourne { success: true, data: {...} } avec tous les détails
      this.currentUser = response.data.data || response.data.user || response.data;
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
      console.log('🔐 [Login] Firebase sign-in successful, verifying with backend...');

      // Send Firebase ID token to backend for verification and user sync
      await this.backendApi.post(API_CONFIG.endpoints.auth.login, {
        idToken: idToken
      });
      console.log('🔐 [Login] Backend verification successful');

      // Return minimal user data - the auth state listener will fetch full profile
      this.currentUser = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        name: userCredential.user.displayName || 'User',
        emailVerified: userCredential.user.emailVerified,
      };
      console.log('🔐 [Login] Returning user, auth state listener will load full profile');
      
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
   * Login with Google (Firebase + Backend POST /auth/login)
   * Utilisé pour LOGIN et REGISTER (le backend gère les deux cas)
   */
  async loginWithGoogle(googleIdToken) {
    try {
      console.log('🚀 [loginWithGoogle] Début authentification Google...');
      
      // 1. Ensure Firebase Auth is initialized
      const auth = await this.ensureAuth();
      
      // 2. Créer un credential Google à partir de l'ID token du SDK natif
      const { GoogleAuthProvider, signInWithCredential } = require('firebase/auth');
      const credential = GoogleAuthProvider.credential(googleIdToken);
      
      console.log('🔐 [loginWithGoogle] Authentification Firebase en cours...');
      
      // 3. S'authentifier avec Firebase
      let userCredential;
      if (isCompatAuth()) {
        userCredential = await auth.signInWithCredential(credential);
      } else {
        userCredential = await signInWithCredential(auth, credential);
      }

      const firebaseUser = userCredential.user;
      console.log('✅ [loginWithGoogle] Firebase Auth réussie, UID:', firebaseUser.uid);
      
      // 4. NOUVEAU: Obtenir le Firebase ID Token et appeler POST /auth/login
      console.log('🔑 [loginWithGoogle] Récupération Firebase ID Token...');
      const firebaseIdToken = await firebaseUser.getIdToken();
      
      // ✅ DEBUG: Afficher infos pour debug
      console.log('🔑 [DEBUG] Firebase ID Token (100 premiers chars):', firebaseIdToken.substring(0, 100));
      console.log('🌐 [DEBUG] Backend Base URL:', this.backendApi.defaults.baseURL);
      console.log('🔗 [DEBUG] Endpoint:', API_CONFIG.endpoints.auth.login);
      console.log('📦 [DEBUG] Body:', JSON.stringify({ idToken: '***', provider: 'google' }));
      
      console.log('📡 [loginWithGoogle] Appel POST /auth/login...');
      
      // 5. Appeler le backend pour créer/récupérer le profil
      const response = await this.backendApi.post(API_CONFIG.endpoints.auth.login, {
        idToken: firebaseIdToken,
        provider: 'google'  // Optionnel, backend l'ignore
      });
      
      console.log('✅ [loginWithGoogle] Backend réponse reçue');
      
      // 6. Parser la réponse (compatible avec { success: true, data: {...} })
      const userData = response.data.data || response.data.user || response.data;
      
      if (!userData || !userData.email) {
        throw new Error('Réponse backend invalide : données utilisateur manquantes');
      }
      
      // 7. Créer l'objet currentUser avec toutes les données
      this.currentUser = {
        ...userData,
        uid: firebaseUser.uid,  // S'assurer que le UID Firebase est présent
        emailVerified: firebaseUser.emailVerified,
      };
      
      console.log('✅ [loginWithGoogle] Authentification complète, user:', this.currentUser.email);
      
      return this.currentUser;
      
    } catch (error) {
      console.error('❌ [loginWithGoogle] Erreur:', error);
      
      // ✅ DEBUG: Afficher détails de l'erreur
      console.error('🔍 [DEBUG] Erreur complète:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        headers: error.config?.headers ? 'présents' : 'absents',
      });
      
      // Déconnecter de Firebase en cas d'erreur
      try {
        const auth = this.getAuth();
        if (isCompatAuth()) {
          await auth.signOut();
        } else {
          const { signOut } = require('firebase/auth');
          await signOut(auth);
        }
      } catch (signOutError) {
        console.error('Erreur lors de la déconnexion Firebase:', signOutError);
      }
      
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * Register with Google (Firebase + Backend POST /auth/login)
   * IDENTIQUE à loginWithGoogle car POST /auth/login gère auto-create
   */
  async registerWithGoogle(googleIdToken) {
    console.log('📝 [registerWithGoogle] Redirection vers loginWithGoogle (même flow)...');
    
    // POST /auth/login gère AUTOMATIQUEMENT :
    // - Création du profil si nouvel utilisateur Google
    // - Retour du profil si utilisateur existant
    // Donc registerWithGoogle et loginWithGoogle utilisent le même code
    return this.loginWithGoogle(googleIdToken);
  }

  /**
   * Logout user
   */
  async logout() {
    try {
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
      const user = this.getAuth().currentUser;
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
      const user = this.getAuth().currentUser;
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