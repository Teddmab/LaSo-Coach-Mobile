// IMPORTANT: Import firebaseApp FIRST to ensure proper initialization order
import { getFirebaseAuth, isCompatAuth } from '../config/firebaseApp';
import { API_CONFIG } from '../config/apiConfig';
// Import api - utiliser require pour éviter les dépendances circulaires
// api.ts importe firebaseAuthServiceNew, donc on doit utiliser require() pour l'import dynamique
let api: any;
try {
  // Utiliser require() pour éviter les dépendances circulaires
  const apiModule = require('./api');
  api = apiModule.default || apiModule;
} catch (error: any) {
  console.error('❌ [FirebaseAuthService] Erreur lors de l\'import de api:', error?.message);
  // En cas d'échec, api sera null et sera vérifié dans le constructeur
  api = null;
}
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
  currentUser: any;
  authStateListeners: any[];
  firebaseAuth: any;
  authInitPromise: Promise<any> | null;
  _authStateListenerAttached: boolean;
  backendApi: any;
  _interceptorsInitialized: boolean;
  GoogleSignin: any;
  ensure: any;

  constructor() {
    this.currentUser = null;
    this.authStateListeners = [];
    this.firebaseAuth = null;
    this.authInitPromise = null;
    this._authStateListenerAttached = false; // Track if we've attached the Firebase onAuthStateChanged listener
    this._interceptorsInitialized = false;
    
    // Log which API endpoint is being used
    
    // Use the shared API instance that automatically includes Firebase ID tokens
    // Vérifier que api est bien défini avant de l'assigner
    // Note: api peut être null si l'import a échoué (dépendance circulaire)
    // On initialise backendApi de manière lazy pour éviter les problèmes de dépendance circulaire
    try {
      if (api && typeof api.post === 'function') {
    this.backendApi = api;
      } else {
        // Si api n'est pas disponible, on essaie de le charger dynamiquement
        const apiModule = require('./api');
        this.backendApi = apiModule.default || apiModule;
        if (!this.backendApi || typeof this.backendApi.post !== 'function') {
          console.error('❌ [FirebaseAuthService] API instance non disponible après chargement dynamique');
          this.backendApi = null;
        }
      }
    } catch (error: any) {
      console.error('❌ [FirebaseAuthService] Erreur lors de l\'initialisation de backendApi:', error?.message);
      this.backendApi = null;
    }

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
    // Note: Request and response interceptors are already set up in api.ts
    // The api instance handles Firebase token injection and 401 retry automatically
    // No need to configure interceptors here
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
   * Vérifier que backendApi est disponible, sinon essayer de le charger
   */
  _ensureBackendApi() {
    if (this.backendApi && typeof this.backendApi.post === 'function') {
      return true;
    }
    
    // Essayer de charger l'API dynamiquement
    try {
      const apiModule = require('./api');
      this.backendApi = apiModule.default || apiModule;
      if (this.backendApi && typeof this.backendApi.post === 'function') {
        return true;
      }
    } catch (error: any) {
      console.error('❌ [FirebaseAuthService] Impossible de charger backendApi:', error?.message);
    }
    
    return false;
  }

  /**
   * Get user profile from backend API
   */
  async getUserProfile() {
    try {
      if (!this._ensureBackendApi()) {
        console.error('❌ [getUserProfile] backendApi non disponible');
        return null;
      }
      const endpoint = API_CONFIG.endpoints.profile.get.replace(API_CONFIG.BASE_URL, '').replace(/^\/+/, '');
      const response = await this.backendApi.get(`/${endpoint}`);
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

      if (!this._ensureBackendApi()) {
        throw new Error('Service API non disponible. Veuillez réessayer.');
      }

      // Update profile via backend API
      const endpoint = API_CONFIG.endpoints.profile.update.replace(API_CONFIG.BASE_URL, '').replace(/^\/+/, '');
      const response = await this.backendApi.put(`/${endpoint}`, {
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

      if (!this._ensureBackendApi()) {
        throw new Error('Service API non disponible. Veuillez réessayer.');
      }

      // Send Firebase ID token to backend for verification and user sync
      const endpoint = API_CONFIG.endpoints.auth.login.replace(API_CONFIG.BASE_URL, '').replace(/^\/+/, '');
      await this.backendApi.post(`/${endpoint}`, {
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
      
      // Vérifier que backendApi est disponible
      if (!this._ensureBackendApi()) {
        throw new Error('Service API non disponible. Veuillez réessayer.');
      }
      
      // 1. Register user via backend (backend handles Firebase user creation)
      const endpoint = API_CONFIG.endpoints.auth.register.replace(API_CONFIG.BASE_URL, '').replace(/^\/+/, '');
      
      let response;
      try {
        response = await this.backendApi.post(`/${endpoint}`, {
        email: credentials.email.toLowerCase().trim(),
        password: credentials.password,
        name: `${credentials.firstName} ${credentials.lastName || ''}`.trim(),
        role: 'USER',
        phone: credentials.phone,
        platform: Platform.OS, // 'ios' or 'android'
      });
      } catch (postError: any) {
        // Améliorer la gestion d'erreur pour les erreurs réseau
        if (postError.code === 'ERR_NETWORK' || postError.message?.includes('Network')) {
          throw new Error('Erreur de connexion. Vérifiez votre connexion internet et réessayez.');
        }
        if (postError.code === 'ECONNABORTED' || postError.message?.includes('timeout')) {
          throw new Error('Délai de connexion dépassé. Vérifiez votre connexion internet et réessayez.');
        }
        // Propager l'erreur avec un message plus clair
        const errorMessage = postError.response?.data?.message || postError.message || 'Erreur lors de la création du compte';
        throw new Error(errorMessage);
      }

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
      
      // 3.5. Détecter si c'est un nouvel utilisateur (Firebase fournit cette info)
      const isNewUser = userCredential.additionalUserInfo?.isNewUser === true;
      
      // 4. NOUVEAU: Obtenir le Firebase ID Token et appeler POST /auth/login
      const firebaseIdToken = await firebaseUser.getIdToken();
      
      // 5. Appeler le backend pour créer/récupérer le profil
      if (!this._ensureBackendApi()) {
        throw new Error('Service API non disponible. Veuillez réessayer.');
      }
      
      const endpoint = API_CONFIG.endpoints.auth.login.replace(API_CONFIG.BASE_URL, '').replace(/^\/+/, '');
      const response = await this.backendApi.post(`/${endpoint}`, {
        idToken: firebaseIdToken,
        provider: 'google',  // Optionnel, backend l'ignore
        platform: Platform.OS, // 'ios' or 'android' - Important pour l'assignation de plan
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
        // Ajouter l'info si c'est un nouvel utilisateur (pour le welcome flow)
        _isNewUser: isNewUser,
      };
      
      // 7.5. Si c'est un nouvel utilisateur, marquer dans AsyncStorage pour le welcome flow
      if (isNewUser) {
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          const userId = userData.id || firebaseUser.uid;
          await AsyncStorage.setItem(`@laso_is_new_user_${userId}`, 'true');
          console.log('✅ [firebaseAuthService] Nouvel utilisateur Google détecté - marqué pour welcome flow:', { userId });
        } catch (storageError) {
          console.warn('⚠️ [firebaseAuthService] Could not mark new Google user:', storageError);
        }
      }
      
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
   * Fonction helper pour charger le module Google Sign-In de manière sécurisée
   * Ne génère pas d'erreur visible si le module n'est pas disponible
   */
  private _loadGoogleSignInModuleSafely(): any | null {
    // Ne pas charger le module sur iOS
    if (Platform.OS === 'ios') {
      return null;
    }

    try {
      // Vérifier si on est dans Expo Go (qui ne supporte pas les modules natifs)
      // Expo Go a une structure différente, on peut détecter cela
      const isExpoGo = !__DEV__ || (typeof (require as any).ensure === 'undefined' && !(require as any).extensions);
      
      if (isExpoGo) {
        // Dans Expo Go, le module natif n'est jamais disponible - skip silencieusement
        return null;
      }

      // Utiliser une fonction interne pour charger le module de manière sécurisée
      const loadModule = () => {
        try {
          // Supprimer temporairement les handlers d'erreur pour éviter le spam
          const originalError = console.error;
          const originalWarn = console.warn;
          
          // Supprimer temporairement les logs d'erreur
          console.error = () => {};
          console.warn = () => {};
          
          let module = null;
          try {
            module = require('@react-native-google-signin/google-signin');
          } catch (e) {
            // Erreur silencieuse - c'est normal si le module n'est pas disponible
            module = null;
          }
          
          // Restaurer les handlers d'erreur
          console.error = originalError;
          console.warn = originalWarn;
          
          return module;
        } catch (e) {
          return null;
        }
      };
      
      const googleSignInModule: any = loadModule();
      return googleSignInModule?.GoogleSignin || null;
    } catch (error) {
      // Ne pas logger l'erreur pour éviter le spam dans les logs
      // C'est normal si le module n'est pas disponible (Expo Go, module non lié, etc.)
      return null;
    }
  }

  /**
   * Fonction pour forcer la déconnexion COMPLÈTE de Google Sign-In
   * IMPORTANT: Ne PAS utiliser signInSilently() car ça RECONNECTE le compte !
   * On utilise uniquement revokeAccess() + signOut() + reconfigure
   */
  async _forceBrutalGoogleSignOut() {
    try {
      // IMPORTANT: Sur iOS, ne pas charger le module pour éviter les erreurs TurboModuleRegistry
      if (Platform.OS === 'ios') {
        console.log('ℹ️ [Google Sign-Out] iOS détecté, déconnexion Google ignorée (module natif non utilisé sur iOS)');
        return;
      }
      
      // Charger le module natif de manière sécurisée (Android uniquement)
      const GoogleSignin = this._loadGoogleSignInModuleSafely();
      
      // Si le module n'est pas disponible, on skip la déconnexion Google
      if (!GoogleSignin || typeof GoogleSignin.configure !== 'function') {
        // Module non disponible (Expo Go ou module non lié) - c'est normal, on skip silencieusement
        return;
      }
      
      
      const { firebaseOAuthClientIds } = require('../config/firebaseApp');
      
      console.log('💀 Déconnexion Google Sign-In...');
      
      const config: any = {
        webClientId: firebaseOAuthClientIds.web,
        offlineAccess: true,
        forceCodeForRefreshToken: true,
        scopes: ['email', 'profile'],
      };
      
      // Sur iOS, ajouter iosClientId pour éviter l'erreur "failed to determine clientId"
      if ((Platform.OS as string) === 'ios' && firebaseOAuthClientIds.ios) {
        config.iosClientId = firebaseOAuthClientIds.ios;
        console.log('🍎 [iOS] Ajout de iosClientId à la configuration Google Sign-In');
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
      // Ne pas logger l'erreur si c'est juste que le module n'est pas disponible
      if (error?.message?.includes('Cannot read property') || 
          error?.message?.includes('GoogleSignin') ||
          error?.message?.includes('undefined') ||
          error?.message?.includes('TurboModuleRegistry')) {
        console.log('ℹ️ [Google Sign-Out] Module natif non disponible, déconnexion Google ignorée');
        return;
      }
      
      console.error('❌ Erreur déconnexion Google:', error?.message);
      // Essayer de reconfigurer seulement si le module est disponible (Android uniquement)
      // Sur iOS, ne pas charger le module pour éviter les erreurs TurboModuleRegistry
      if (Platform.OS !== 'ios') {
        try {
          const GoogleSignin = this._loadGoogleSignInModuleSafely();
          
          if (GoogleSignin && typeof GoogleSignin.configure === 'function') {
            const { firebaseOAuthClientIds } = require('../config/firebaseApp');
            const config: any = {
              webClientId: firebaseOAuthClientIds.web,
              offlineAccess: true,
              forceCodeForRefreshToken: true,
              scopes: ['email', 'profile'],
            };
            
            GoogleSignin.configure(config);
          }
        } catch (configError) { 
          // Ignorer silencieusement si le module n'est pas disponible
        }
      }
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
      
      // 0. Récupérer l'ID utilisateur AVANT le nettoyage pour supprimer les clés de session
      // NOTE: On NE supprime PAS @laso_welcome_bottomsheet_shown_${userId} car c'est une information
      // permanente liée au compte utilisateur (l'utilisateur a déjà vu le welcome une fois)
      const userId = this.currentUser?.id || this.currentUser?.uid;
      const welcomeKeysToRemove: string[] = [];
      const ugcKeysToRemove: string[] = [];
      if (userId) {
        // Supprimer seulement les clés de session, pas les clés permanentes
        welcomeKeysToRemove.push(
          `@laso_welcome_shown_${userId}`, // Clé de session pour welcome back
          `@laso_last_login_session_${userId}`, // Clé de session pour tracker la dernière connexion
          `@laso_is_new_user_${userId}` // Clé de session
        );
        // NE PAS supprimer @laso_welcome_bottomsheet_shown_${userId} - c'est permanent
        ugcKeysToRemove.push(
          `@laso_ugc_terms_accepted_${userId}`,
          `@laso_ugc_terms_timestamp_${userId}`
        );
      }
      
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
          // Clés de welcome flow
          ...welcomeKeysToRemove,
          // Clés UGC (user-specific)
          ...ugcKeysToRemove,
        ]);
        console.log('✅ AsyncStorage complètement nettoyé - tous les tokens et données supprimés');
        
        // Supprimer aussi toutes les clés de welcome flow et UGC restantes (au cas où l'ID utilisateur n'était pas disponible)
        const allKeys = await AsyncStorage.getAllKeys();
        const welcomeFlowKeys = allKeys.filter(key => 
          key.startsWith('@laso_welcome_shown_') || 
          key.startsWith('@laso_is_new_user_')
        );
        const ugcFlowKeys = allKeys.filter(key => 
          key.startsWith('@laso_ugc_terms_accepted_') || 
          key.startsWith('@laso_ugc_terms_timestamp_')
        );
        if (welcomeFlowKeys.length > 0) {
          console.log('🗑️ Suppression des clés de welcome flow restantes:', welcomeFlowKeys);
          await AsyncStorage.multiRemove(welcomeFlowKeys);
          console.log('✅ Clés de welcome flow supprimées');
        }
        if (ugcFlowKeys.length > 0) {
          console.log('🗑️ Suppression des clés UGC restantes:', ugcFlowKeys);
          await AsyncStorage.multiRemove(ugcFlowKeys);
          console.log('✅ Clés UGC supprimées');
        }
        
        // Vérification : s'assurer qu'il ne reste rien
        const remainingKeys = await AsyncStorage.getAllKeys();
        const authRelatedKeys = remainingKeys.filter(key => 
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
      const endpoint = API_CONFIG.endpoints.auth.forgotPassword.replace(API_CONFIG.BASE_URL, '').replace(/^\/+/, '');
      await this.backendApi.post(`/${endpoint}`, {
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
      const endpoint = API_CONFIG.endpoints.auth.verifyResetToken.replace(API_CONFIG.BASE_URL, '').replace(/^\/+/, '');
      const response = await this.backendApi.post(`/${endpoint}`, { token });
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
      const endpoint = API_CONFIG.endpoints.auth.completeResetPassword.replace(API_CONFIG.BASE_URL, '').replace(/^\/+/, '');
      const response = await this.backendApi.post(`/${endpoint}`, {
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
   * Delete user account and all associated data
   * CRITICAL: Complete wipe - removes account, all data, all tokens, all cache
   * Calls backend to delete user record, then deletes Firebase account
   */
  async deleteAccount() {
    try {
      console.log('🗑️ ACCOUNT DELETION - Starting complete account deletion process...');
      
      const user = this.getAuth().currentUser;
      if (!user) throw new Error('No user logged in');

      // 1. Delete account on backend first (atomic operation)
      console.log('📡 Deleting user account from backend...');
      try {
        const endpoint = API_CONFIG.endpoints.profile.delete.replace(API_CONFIG.BASE_URL, '').replace(/^\/+/, '');
        await this.backendApi.delete(`/${endpoint}`);
        console.log('✅ Backend account deleted');
      } catch (backendError: any) {
        // If backend deletion fails, don't proceed with Firebase deletion
        throw new Error(
          backendError.response?.data?.message || 'Failed to delete account on backend'
        );
      }

      // 2. Delete Firebase user
      console.log('🔥 Deleting Firebase account...');
      if (isCompatAuth()) {
        await user.delete();
      } else {
        const { deleteUser } = require('firebase/auth');
        await deleteUser(user);
      }
      console.log('✅ Firebase account deleted');

      // 3. Perform complete logout cleanup to remove all traces
      // This is critical for account deletion - must clear everything
      console.log('🧹 Performing complete cleanup...');
      await this.logout();

      this.currentUser = null;
      console.log('✅✅✅ ACCOUNT DELETION COMPLETE - All data removed');
    } catch (error) {
      console.error('❌ Account deletion failed:', error);
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