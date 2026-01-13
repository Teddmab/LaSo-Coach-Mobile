// IMPORTANT: Import firebaseApp FIRST to ensure proper initialization order
import { getFirebaseAuth, isCompatAuth } from '../config/firebaseApp';
import { API_CONFIG } from '../config/apiConfig';
import axios from 'axios';
// Import Firebase auth functions AFTER our config is initialized
// Use compat fallback to avoid component registration issues in Expo Go; require modular funcs only when available.
import firebaseCompat from 'firebase/compat/app';
import 'firebase/compat/auth';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import deviceApi from './deviceApi';

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
        this.initializeInterceptors();
        this.initializeAuthStateListener();
      } else {
      }
    } catch (e) {
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
      try {
        this.firebaseAuth = getFirebaseAuth();
        if (this.firebaseAuth) {
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
      } catch (error: any) {
        console.error('❌ [FirebaseAuthService] Failed to get Firebase Auth:', error.message);
        // Don't throw - return null instead to allow app to continue
        return null;
      }
    }
    if (!this.firebaseAuth) {
      console.warn('⚠️ [FirebaseAuthService] Firebase Auth is not initialized. App will continue without auth.');
      return null;
    }
    return this.firebaseAuth;
  }

  /**
   * Get Firebase Auth instance (no longer lazy - already initialized)
   * Returns null if not initialized instead of throwing to prevent crashes
   */
  getAuth() {
    if (!this.firebaseAuth) {
      // Try to get it one more time
      try {
        this.firebaseAuth = getFirebaseAuth();
      } catch (error: any) {
        console.warn('⚠️ [FirebaseAuthService] Firebase Auth not available:', error.message);
      }
    }
    // Return null instead of throwing to prevent app crash
    return this.firebaseAuth || null;
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

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Setup response interceptor for error handling
    this.backendApi.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;


        // Handle 401 Unauthorized errors
        if (error.response?.status === 401) {
          
          // Don't retry for auth endpoints
          if (originalRequest?.url?.includes('/auth/login') || 
              originalRequest?.url?.includes('/auth/verify-reset-token') ||
              originalRequest?.url?.includes('/auth/complete-reset-password') ||
              originalRequest?.url?.includes('/auth/forgot-password')) {
            return Promise.reject(new Error('Invalid credentials or token'));
          }

          // For other 401 errors, try to refresh Firebase token
          if (!originalRequest._retry) {
            originalRequest._retry = true;

            try {
              
              // Force refresh Firebase ID token
              const newIdToken = await this.getIdToken(true);
              if (newIdToken && originalRequest?.headers) {
                originalRequest.headers.Authorization = `Bearer ${newIdToken}`;
                return this.backendApi(originalRequest);
              }
            } catch (refreshError) {
              await this.logout();
              return Promise.reject(new Error('Session expired. Please login again.'));
            }
          }
        }

        // Handle 403 Forbidden errors
        if (error.response?.status === 403) {
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
      return;
    }
    if (!auth) {
      return;
    }
    const useCompat = isCompatAuth();
    const listener = async (firebaseUser) => {
      
      if (firebaseUser) {
        // IMMEDIATE: Set basic user data and notify listeners to prevent timeout
        this.currentUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || 'User',
          emailVerified: firebaseUser.emailVerified,
        };
        
        // Notify immediately to clear auth timeout
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
              // Notify again with full profile
              this.authStateListeners.forEach(cb => cb(this.currentUser));
            }
          } catch (error) {
            // Keep basic user data already set
          }
        })();
      } else {
        this.currentUser = null;
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
        const currentUser = this.getAuth().currentUser;
        if (currentUser) {
          if (isCompatAuth()) {
            await currentUser.updateProfile({ displayName });
          } else {
            const { updateProfile } = require('firebase/auth');
            await updateProfile(currentUser, { displayName });
          }
        }
      }

      // Update current user
      // Backend retourne { success: true, data: {...} } avec tous les détails
      this.currentUser = response.data.data || response.data.user || response.data;
      return this.currentUser;
    } catch (error) {
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

      // Send Firebase ID token to backend for verification and user sync
      await this.backendApi.post(API_CONFIG.endpoints.auth.login, {
        idToken: idToken,
      });

      // Enregistrer les informations de l'appareil dans un endpoint séparé et sécurisé
      // (Ne bloque pas l'authentification si cela échoue)
      deviceApi.registerDevice().catch(error => {
      });

      // Return minimal user data - the auth state listener will fetch full profile
      this.currentUser = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        name: userCredential.user.displayName || 'User',
        emailVerified: userCredential.user.emailVerified,
      };
      
      return this.currentUser;
    } catch (error) {
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
        if (isCompatAuth()) {
          await userCredential.user.updateProfile({ displayName });
        } else {
          const { updateProfile } = require('firebase/auth');
          await updateProfile(userCredential.user, { displayName });
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

      // Enregistrer les informations de l'appareil dans un endpoint séparé et sécurisé
      // (Ne bloque pas l'inscription si cela échoue)
      deviceApi.registerDevice().catch(error => {
      });

      return this.currentUser;
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * Login with Google (Firebase + Backend POST /auth/login)
   * Utilisé pour LOGIN et REGISTER (le backend gère les deux cas)
   */
  async loginWithGoogle(googleIdToken) {
    try {
      
      // 1. Ensure Firebase Auth is initialized
      const auth = await this.ensureAuth();
      
      // 2. Créer un credential Google à partir de l'ID token du SDK natif
      const { GoogleAuthProvider, signInWithCredential } = require('firebase/auth');
      const credential = GoogleAuthProvider.credential(googleIdToken);
      
      
      // 3. S'authentifier avec Firebase
      let userCredential;
      if (isCompatAuth()) {
        userCredential = await auth.signInWithCredential(credential);
      } else {
        userCredential = await signInWithCredential(auth, credential);
      }

      const firebaseUser = userCredential.user;
      
      // 4. NOUVEAU: Obtenir le Firebase ID Token et appeler POST /auth/login
      const firebaseIdToken = await firebaseUser.getIdToken();
      
      // ✅ DEBUG: Afficher infos pour debug
      
      
      // 5. Appeler le backend pour créer/récupérer le profil
      const response = await this.backendApi.post(API_CONFIG.endpoints.auth.login, {
        idToken: firebaseIdToken,
        provider: 'google',  // Optionnel, backend l'ignore
      });
      

      // 6. Enregistrer les informations de l'appareil dans un endpoint séparé et sécurisé
      // (Ne bloque pas l'authentification si cela échoue)
      deviceApi.registerDevice().catch(error => {
      });
      
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
      
      
      return this.currentUser;
      
    } catch (error) {
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
      }
      
      throw new Error(this.getErrorMessage(error));
    }
  }

  /**
   * Register with Google (Firebase + Backend POST /auth/login)
   * IDENTIQUE à loginWithGoogle car POST /auth/login gère auto-create
   * Mais avec un message différent pour l'inscription
   */
  async registerWithGoogle(googleIdToken) {
    
    // POST /auth/login gère AUTOMATIQUEMENT :
    // - Création du profil si nouvel utilisateur Google
    // - Retour du profil si utilisateur existant
    // Donc registerWithGoogle et loginWithGoogle utilisent le même code backend
    // La différence est dans les messages affichés à l'utilisateur
    return this.loginWithGoogle(googleIdToken);
  }

  /**
   * Fonction pour forcer la déconnexion COMPLÈTE de Google Sign-In
   * IMPORTANT: Ne PAS utiliser signInSilently() car ça RECONNECTE le compte !
   * On utilise uniquement revokeAccess() + signOut() + reconfigure
   */
  async _forceBrutalGoogleSignOut() {
    try {
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');
      const { firebaseOAuthClientIds } = require('../config/firebaseApp');
      
      console.log('💀 Déconnexion Google Sign-In...');
      
      const config: any = {
        webClientId: firebaseOAuthClientIds.web,
        offlineAccess: true,
        forceCodeForRefreshToken: true,
        scopes: ['email', 'profile'],
      };
      
      // Sur iOS, ajouter iosClientId pour éviter l'erreur "failed to determine clientId"
      if (Platform.OS === 'ios' && firebaseOAuthClientIds.ios) {
        config.iosClientId = firebaseOAuthClientIds.ios;
      }
      
      // 1. Configurer le SDK
      GoogleSignin.configure(config);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 2. Révoquer l'accès (supprime les permissions de l'app)
      try {
        await GoogleSignin.revokeAccess();
        console.log('✅ Accès révoqué');
      } catch (revokeError: any) {
        // SIGN_IN_REQUIRED = pas de compte = OK
        if (!revokeError?.message?.includes('SIGN_IN_REQUIRED') && 
            revokeError?.code !== 'SIGN_IN_REQUIRED') {
          console.log('ℹ️ Révocation: ', revokeError?.code || 'pas de compte');
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 3. Déconnexion
      try {
        await GoogleSignin.signOut();
        console.log('✅ Déconnexion effectuée');
      } catch (e) { /* ignore */ }
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 4. RECONFIGURER le SDK (efface le compte en mémoire)
      // C'est LA CLÉ pour que signIn() affiche le sélecteur
      GoogleSignin.configure(config);
      console.log('✅ SDK reconfiguré');
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 5. Vérifier avec getCurrentUser() UNIQUEMENT (PAS signInSilently qui reconnecte!)
      let currentUser = null;
      try {
        currentUser = await GoogleSignin.getCurrentUser();
      } catch (e) { /* ignore */ }
      
      if (currentUser) {
        console.log('⚠️ Compte encore détecté, dernière déconnexion...');
        try { await GoogleSignin.revokeAccess(); } catch (e) { /* ignore */ }
        try { await GoogleSignin.signOut(); } catch (e) { /* ignore */ }
        GoogleSignin.configure(config);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // 6. Vérification finale
      let finalUser = null;
      try {
        finalUser = await GoogleSignin.getCurrentUser();
      } catch (e) { /* ignore */ }
      
      if (finalUser) {
        console.log('⚠️ Compte toujours présent (cache Android persistant)');
      } else {
        console.log('✅✅✅ Déconnexion Google complète - aucun compte');
      }
      
      console.log('💀 Déconnexion Google terminée');
    } catch (error: any) {
      console.error('❌ Erreur déconnexion Google:', error?.message);
      // Reconfigurer quand même
      try {
        const { GoogleSignin } = require('@react-native-google-signin/google-signin');
        const { firebaseOAuthClientIds } = require('../config/firebaseApp');
        const config: any = {
          webClientId: firebaseOAuthClientIds.web,
          offlineAccess: true,
          forceCodeForRefreshToken: true,
          scopes: ['email', 'profile'],
        };
        
        // Sur iOS, ajouter iosClientId pour éviter l'erreur "failed to determine clientId"
        if (Platform.OS === 'ios' && firebaseOAuthClientIds.ios) {
          config.iosClientId = firebaseOAuthClientIds.ios;
        }
        
        GoogleSignin.configure(config);
      } catch (configError) { /* ignore */ }
    }
  }

  /**
   * Logout user
   * CRITICAL: Supprime TOUT - Firebase, Google Sign-In, AsyncStorage, tous les caches
   * Quand on clique sur "se déconnecter", on ne doit RIEN garder en mémoire
   */
  async logout() {
    try {
      console.log('🚪🚪🚪 DÉCONNEXION COMPLÈTE - Suppression de TOUT...');
      
      // 1. CRITICAL: Nettoyer AsyncStorage EN PREMIER pour supprimer tous les tokens et données
      // Cela supprime la session de l'app immédiatement
      // QUAND ON CLIQUE SUR "SE DÉCONNECTER", ON NE GARDE RIEN EN MÉMOIRE
      console.log('🗑️🗑️🗑️ NETTOYAGE COMPLET d\'AsyncStorage - Suppression de TOUS les tokens et données...');
      try {
        // Supprimer TOUS les tokens et données utilisateur
        // Liste exhaustive de toutes les clés possibles
        await AsyncStorage.multiRemove([
          // Clés admin_* (backend spec)
          'admin_token',
          'admin_user_id',
          'admin_user_email',
          'admin_user_name',
          'admin_user_role',
          // Clés legacy
          '@LasoCoach:authToken',
          '@LasoCoach:refreshToken',
          '@LasoCoach:authProvider',
          '@LasoCoach:user',
          // Clés de persistance utilisateur
          'laso_auth_user_v1',
          // Autres clés possibles
          'firebase:authUser',
          'firebase:token',
        ]);
        console.log('✅ AsyncStorage complètement nettoyé - tous les tokens et données supprimés');
        
        // Vérification : s'assurer qu'il ne reste rien
        const allKeys = await AsyncStorage.getAllKeys();
        const authRelatedKeys = allKeys.filter(key => 
          key.includes('token') || 
          key.includes('auth') || 
          key.includes('user') || 
          key.includes('admin')
        );
        if (authRelatedKeys.length > 0) {
          console.warn('⚠️ Clés restantes détectées:', authRelatedKeys);
          // Supprimer les clés restantes
          await AsyncStorage.multiRemove(authRelatedKeys);
          console.log('✅ Clés restantes supprimées');
        } else {
          console.log('✅ Aucune clé d\'authentification restante - AsyncStorage complètement propre');
        }
      } catch (storageError: any) {
        console.error('❌ Erreur lors du nettoyage AsyncStorage:', storageError?.message);
        // En cas d'erreur, essayer un nettoyage complet
        try {
          await AsyncStorage.clear();
          console.log('✅ AsyncStorage.clear() effectué (dernier recours)');
        } catch (clearError) {
          console.error('❌ Impossible de nettoyer AsyncStorage:', clearError);
        }
      }
      
      // 2. Sign out from Firebase
      console.log('🔥 Déconnexion de Firebase...');
      const auth = this.getAuth();
      if (isCompatAuth()) {
        await auth.signOut();
      } else {
        const { signOut } = require('firebase/auth');
        await signOut(auth);
      }
      console.log('✅ Firebase déconnecté');
      
      // 3. CRITICAL: Déconnexion ULTRA-BRUTALE de Google Sign-In
      // Utilise une méthode agressive avec plusieurs cycles pour forcer le nettoyage complet
      // Supprime TOUS les comptes (réels + fantômes + cache Android)
      console.log('💀💀💀 Déconnexion ULTRA-BRUTALE de Google Sign-In...');
      await this._forceBrutalGoogleSignOut();
      
      // 4. Nettoyer l'état local
      this.currentUser = null;
      
      console.log('✅✅✅ DÉCONNEXION COMPLÈTE TERMINÉE - RIEN n\'a été gardé en mémoire');
      console.log('✅ AsyncStorage nettoyé, Firebase déconnecté, Google Sign-In supprimé');
    } catch (error) {
      // Même en cas d'erreur, on nettoie l'état local
      this.currentUser = null;
      
      // Essayer de nettoyer AsyncStorage même en cas d'erreur
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.clear(); // Nettoyage complet en dernier recours
        console.log('✅ AsyncStorage nettoyé (dernier recours)');
      } catch (clearError) {
        // Ignore
      }
      
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
        return null;
      }
      
      if (auth.currentUser) {
        return await auth.currentUser.getIdToken(forceRefresh);
      }
      return null;
    } catch (error) {
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
      
      const endpoint = API_CONFIG.endpoints.profile.delete;
      console.log('🔥 [FirebaseAuthService.deleteAccount] Starting Firebase account deletion...');
      console.log('📡 [FirebaseAuthService.deleteAccount] Backend endpoint:', endpoint);
      console.log('📡 [FirebaseAuthService.deleteAccount] Method: DELETE');
      console.log('👤 [FirebaseAuthService.deleteAccount] Firebase user UID:', user.uid);
      console.log('📦 [FirebaseAuthService.deleteAccount] Payload: {} (DELETE request, no body)');
      
      await this.backendApi.delete(endpoint);
      console.log('✅ [FirebaseAuthService.deleteAccount] Backend deletion successful');
      
      console.log('🔥 [FirebaseAuthService.deleteAccount] Deleting Firebase user...');
      await user.delete();
      console.log('✅ [FirebaseAuthService.deleteAccount] Firebase user deletion successful');
      
      this.currentUser = null;
      console.log('✅ [FirebaseAuthService.deleteAccount] Account deletion completed');
    } catch (error) {
      console.error('❌ [FirebaseAuthService.deleteAccount] Account deletion failed');
      console.error('❌ [FirebaseAuthService.deleteAccount] Error:', error);
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