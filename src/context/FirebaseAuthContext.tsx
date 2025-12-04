import React, { createContext, useContext, useReducer, useEffect, useRef, ReactNode } from 'react';
import { AppState } from 'react-native';
import Toast from 'react-native-toast-message';
import type { 
  AuthContextType, 
  User, 
  AuthState, 
  RegisterData, 
  ProfileUpdateData,
  VerifyResetTokenResponse 
} from '../types/auth';

// Initial auth state
const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  loading: false,
  authReady: false,
};

// Auth actions
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_TOKENS: 'SET_TOKENS',
  LOGOUT: 'LOGOUT',
  SET_AUTH_READY: 'SET_AUTH_READY',
} as const;

type AuthActionType = typeof AUTH_ACTIONS[keyof typeof AUTH_ACTIONS];

interface AuthAction {
  type: AuthActionType;
  payload?: any;
}

/**
 * Auth reducer for state management
 */
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        loading: false,
      };

    case AUTH_ACTIONS.SET_TOKENS:
      return {
        ...state,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        authReady: true,
      };

    case AUTH_ACTIONS.SET_AUTH_READY:
      return {
        ...state,
        authReady: true,
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Import Firebase auth service directly
import firebaseAuthService from '../services/firebaseAuthServiceNew';
import { loadPersistedUser, savePersistedUser, clearPersistedUser } from '../services/authPersistence';
import deviceApi from '../services/deviceApi';

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication Provider Component using Firebase Auth Service
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  // Track whether we've already received the first auth state event to safely clear fallback timeout
  const initialAuthResolvedRef = useRef(false);

  /**
   * Check current Firebase auth state and update context
   * This can be called manually to refresh auth state (e.g., after error recovery)
   */
  const refreshAuthState = async (): Promise<void> => {
    try {
      console.log('🔄 Manually refreshing auth state...');
      await firebaseAuthService.ensureAuth();
      const currentUser = firebaseAuthService.getCurrentUser();
      
      if (currentUser) {
        console.log('✅ Auth state refreshed - user found:', currentUser.email);
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: currentUser });
      } else {
        // Check Firebase directly
        const auth = firebaseAuthService.getAuth();
        if (auth?.currentUser) {
          // Firebase has a user but service doesn't - fetch profile
          console.log('🔄 Firebase has user, fetching profile...');
          const profile = await firebaseAuthService.getUserProfile();
          if (profile) {
            dispatch({ type: AUTH_ACTIONS.SET_USER, payload: profile });
            console.log('✅ Auth state refreshed from Firebase');
          } else {
            dispatch({ type: AUTH_ACTIONS.LOGOUT });
          }
        } else {
          console.log('ℹ️ No user found in Firebase');
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
      }
    } catch (error: any) {
      console.error('❌ Error refreshing auth state:', error);
      // Don't logout on error - keep current state
    }
  };

  /**
   * Initialize authentication state on app launch
   */
  useEffect(() => {
    console.log('🔐 Starting Firebase auth initialization...');
    let unsubscribe: (() => void) = () => {};
    let fallbackTimeout: NodeJS.Timeout | null = null;

    const prehydrateFromStorage = async (): Promise<void> => {
      // Attempt to restore a previously persisted user snapshot BEFORE listener fires
      try {
        const persisted = await loadPersistedUser();
        if (persisted && !state.user) {
          console.log('💾 Rehydrated user from AsyncStorage (pre-listener):', persisted.email);
          dispatch({ type: AUTH_ACTIONS.SET_USER, payload: persisted });
        }
      } catch (e: any) {
        console.log('⚠️ Failed to rehydrate user:', e.message);
      }
    };

    const initAuth = async (): Promise<void> => {
      try {
        await prehydrateFromStorage();
        // Wait for Firebase Auth to be ready
        await firebaseAuthService.ensureAuth();
        console.log('🔐 Firebase Auth is ready, setting up auth state listener...');

        // If Firebase already has a current user and we have not resolved yet, optimistically set it
        const firebaseCurrent = firebaseAuthService.getAuth().currentUser;
        if (firebaseCurrent && !initialAuthResolvedRef.current && !state.user) {
          console.log('🔐 Found Firebase currentUser before listener event, optimistic set');
          dispatch({
            type: AUTH_ACTIONS.SET_USER,
            payload: {
              uid: firebaseCurrent.uid,
              email: firebaseCurrent.email,
              name: firebaseCurrent.displayName || 'User',
              emailVerified: firebaseCurrent.emailVerified,
            }
          });
        }

        // Listen to Firebase auth state changes
        unsubscribe = firebaseAuthService.onAuthStateChange((user: User | null) => {
          console.log('🔐 Firebase auth state changed:', user ? `User: ${user.email}` : 'No user');
          if (!initialAuthResolvedRef.current) {
            initialAuthResolvedRef.current = true;
            if (fallbackTimeout) {
              clearTimeout(fallbackTimeout);
              fallbackTimeout = null;
              console.log('🛑 Cleared auth fallback timeout after first auth event');
            }
          }

          if (user) {
            dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
            savePersistedUser(user); // persist snapshot
            console.log('✅ User authenticated via Firebase (listener):', user.firstName || user.name);
            
            // Event Trigger 1: After auth success - Enregistrer l'appareil
            // (Déjà fait dans firebaseAuthServiceNew.js, mais on le fait aussi ici pour être sûr)
            deviceApi.registerDevice().catch((error: any) => {
              console.warn('⚠️ [AuthContext] Échec enregistrement appareil après auth (non bloquant):', error.message);
            });
          } else {
            clearPersistedUser();
            dispatch({ type: AUTH_ACTIONS.LOGOUT });
            console.log('🔐 No Firebase user, logged out (listener)');
          }
          dispatch({ type: AUTH_ACTIONS.SET_AUTH_READY, payload: true });
        });
      } catch (error: any) {
        console.error('❌ Firebase auth initialization error:', error);
        // Don't force logout here; just mark ready so UI can show login if needed
        dispatch({ type: AUTH_ACTIONS.SET_AUTH_READY, payload: true });
      }
    };

    initAuth();

    // Fallback: mark authReady but DO NOT logout blindly (keep any rehydrated user)
    fallbackTimeout = setTimeout(() => {
      if (initialAuthResolvedRef.current) return; // Listener already fired
      console.log('⚠️ Auth init fallback reached before listener. Marking ready without forcing logout.');
      dispatch({ type: AUTH_ACTIONS.SET_AUTH_READY, payload: true });
    }, 6000); // Slightly longer to allow fold/unfold/device slow init

    return () => {
      unsubscribe();
      if (fallbackTimeout) clearTimeout(fallbackTimeout);
    };
    // Intentionally exclude state.user from deps (rehydration only once)
  }, []);

  /**
   * Event Trigger 2: App lifecycle - Quand l'app revient au premier plan
   * Met à jour lastSeenAt et appVersion dans le backend
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: string) => {
      if (nextAppState === 'active' && state.isAuthenticated) {
        // App has come to the foreground and user is authenticated
        console.log('📱 [DeviceApi] App revient au premier plan - Mise à jour lastSeenAt et appVersion...');
        
        // Mettre à jour les informations de l'appareil (lastSeenAt, appVersion)
        deviceApi.registerDevice().catch((error: any) => {
          console.warn('⚠️ [DeviceApi] Échec mise à jour appareil au foreground (non bloquant):', error.message);
        });
      }
    });

    return () => {
      subscription?.remove();
    };
  }, [state.isAuthenticated]);

  /**
   * Event Trigger 3: Cold start - Si l'utilisateur est déjà connecté au démarrage
   * Optionnel : Enregistrer l'appareil une fois au démarrage si session restaurée
   */
  useEffect(() => {
    // Attendre que l'auth soit prête et que l'utilisateur soit authentifié
    if (state.authReady && state.isAuthenticated && state.user) {
      console.log('📱 [DeviceApi] Cold start - Utilisateur déjà connecté, enregistrement appareil...');
      
      // Enregistrer l'appareil une fois au démarrage (avec un petit délai pour éviter les appels multiples)
      const timeoutId = setTimeout(() => {
        deviceApi.registerDevice().catch((error: any) => {
          console.warn('⚠️ [DeviceApi] Échec enregistrement appareil au cold start (non bloquant):', error.message);
        });
      }, 2000); // Délai de 2 secondes pour laisser l'app se stabiliser

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [state.authReady, state.isAuthenticated]); // Se déclenche une fois quand authReady et isAuthenticated deviennent true

  /**
   * Login user with email and password
   */
  const login = async (email: string, password: string): Promise<{ user: User | null; error: string | null }> => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      const user = await firebaseAuthService.login({ email, password });
      
      // User state will be updated via Firebase auth state listener
      console.log('✅ Login successful via Firebase:', user.firstName || user.name);
      Toast.show({ 
        type: 'success', 
        text1: 'Connexion réussie', 
        text2: `Bienvenue ${user.firstName || user.name}!` 
      });
      // Fallback: in case the auth state listener hasn't attached yet (race after delayed Firebase init), optimistically set user now
      if (!state.isAuthenticated) {
        console.log('⚙️ Fallback user dispatch after login (listener may not have fired yet)');
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
        dispatch({ type: AUTH_ACTIONS.SET_AUTH_READY, payload: true });
      }
      
      return { user, error: null };
    } catch (error: any) {
      console.error('❌ Login error:', error);
      const errorMessage = error.message || 'Erreur de connexion inconnue';
      
      Toast.show({
        type: 'error',
        text1: 'Erreur de connexion',
        text2: errorMessage,
      });
      
      return { user: null, error: errorMessage };
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  /**
   * Complete Google login using Firebase
   */
  const loginWithGoogle = async (googleIdToken: string): Promise<{ user: User | null; error: string | null }> => {
    try {
      if (!googleIdToken) {
        return { user: null, error: 'Jeton Google manquant.' };
      }

      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      const user = await firebaseAuthService.loginWithGoogle(googleIdToken);

      Toast.show({
        type: 'success',
        text1: 'Connexion Google réussie',
        text2: `Bienvenue ${user.firstName || user.name}!`,
      });

      return { user, error: null };
    } catch (error: any) {
      console.error('❌ Google login error:', error);

      let errorMessage = 'Impossible de se connecter avec Google. Veuillez réessayer.';

      if (error?.code === 'GOOGLE_SIGN_IN_CANCELLED' || error?.code === 'SIGN_IN_CANCELLED') {
        // CRITICAL: User cancelled - do NOT show error, just return
        console.log('ℹ️ [loginWithGoogle] Connexion Google annulée par l\'utilisateur');
        return { user: null, error: null };
      } else if (error?.message) {
        errorMessage = error.message;
      }

      Toast.show({
        type: 'error',
        text1: 'Erreur de connexion',
        text2: errorMessage,
      });

      return { user: null, error: errorMessage };
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  /**
   * Register with Google (Firebase + Backend POST /auth/login)
   * Uses same backend endpoint but with different messaging for registration flow
   */
  const registerWithGoogle = async (googleIdToken: string): Promise<{ user: User | null; error: string | null }> => {
    try {
      if (!googleIdToken) {
        return { user: null, error: 'Jeton Google manquant.' };
      }

      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      // Use registerWithGoogle from service (which internally uses loginWithGoogle but with different messaging)
      const user = await firebaseAuthService.registerWithGoogle(googleIdToken);

      Toast.show({
        type: 'success',
        text1: 'Inscription Google réussie',
        text2: `Bienvenue ${user.firstName || user.name}!`,
      });

      return { user, error: null };
    } catch (error: any) {
      console.error('❌ Google registration error:', error);

      let errorMessage = 'Impossible de créer un compte avec Google. Veuillez réessayer.';

      if (error?.code === 'GOOGLE_SIGN_IN_CANCELLED' || error?.code === 'SIGN_IN_CANCELLED') {
        // CRITICAL: User cancelled - do NOT proceed with authentication
        // Return null error to indicate user choice (not an error)
        console.log('ℹ️ [registerWithGoogle] Inscription Google annulée par l\'utilisateur');
        return { user: null, error: null };
      } else if (error?.message) {
        errorMessage = error.message;
      }

      Toast.show({
        type: 'error',
        text1: 'Erreur d\'inscription',
        text2: errorMessage,
      });

      return { user: null, error: errorMessage };
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  /**
   * Register new user
   */
  const register = async (userData: RegisterData): Promise<void> => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      const user = await firebaseAuthService.register(userData);
      
      // User state will be updated via Firebase auth state listener
      Toast.show({ 
        type: 'success', 
        text1: 'Inscription réussie', 
        text2: 'Votre compte a été créé avec succès' 
      });
      
      console.log('✅ Registration successful via Firebase:', user.firstName || user.name);
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      const errorMessage = error.message || 'Erreur d\'inscription inconnue';
      
      Toast.show({
        type: 'error',
        text1: 'Erreur d\'inscription',
        text2: errorMessage,
      });
      throw error;
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  /**
   * Logout user
   */
  const logout = async (): Promise<void> => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      await firebaseAuthService.logout();

      // State will be updated via Firebase auth state listener
      Toast.show({
        type: 'success',
        text1: 'Déconnexion',
        text2: 'À bientôt!',
      });

      console.log('✅ User logged out successfully via Firebase');
    } catch (error: any) {
      console.error('❌ Logout error:', error);
      // Still update state even if Firebase logout fails
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    } finally {
      clearPersistedUser();
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  /**
   * Refresh user profile data
   */
  const refreshProfile = async (): Promise<User | null> => {
    try {
      if (!state.isAuthenticated) {
        return null;
      }

      const user = await firebaseAuthService.getUserProfile();
      if (user) {
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
        console.log('✅ Profile refreshed successfully via Firebase');
        return user;
      }
      return null;
    } catch (error: any) {
      console.error('❌ Failed to refresh profile via Firebase:', error);
      const errorMessage = error.message || 'Erreur lors du rafraîchissement du profil';
      
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: errorMessage,
      });
      return null;
    }
  };

  /**
   * Update user profile
   */
  const updateProfile = async (profileData: ProfileUpdateData): Promise<User> => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      const user = await firebaseAuthService.updateUserProfile(profileData);
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });

      Toast.show({
        type: 'success',
        text1: 'Profil mis à jour',
        text2: 'Vos informations ont été sauvegardées',
      });

      console.log('✅ Profile updated successfully via Firebase');
      return user;
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur lors de la mise à jour du profil';
      
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: errorMessage,
      });
      throw new Error(errorMessage);
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  /**
   * Request password reset
   */
  const forgotPassword = async (email: string): Promise<void> => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      await firebaseAuthService.sendPasswordResetEmail(email);

      Toast.show({
        type: 'success',
        text1: 'Email envoyé',
        text2: 'Vérifiez votre boîte mail pour réinitialiser votre mot de passe',
      });

      console.log('✅ Password reset email sent via Firebase');
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur lors de l\'envoi de l\'email de réinitialisation';
      
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: errorMessage,
      });
      throw new Error(errorMessage);
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  /**
   * Verify password reset token via backend
   */
  const verifyResetToken = async (token: string): Promise<VerifyResetTokenResponse> => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      const response = await firebaseAuthService.verifyPasswordResetToken(token);
      console.log('✅ Reset token verified via backend');
      return response;
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur lors de la vérification du code';

      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: errorMessage,
      });

      throw new Error(errorMessage);
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  /**
   * Complete password reset via backend
   */
  const resetPassword = async (token: string, newPassword: string): Promise<void> => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      await firebaseAuthService.completePasswordReset(token, newPassword);

      Toast.show({
        type: 'success',
        text1: 'Mot de passe réinitialisé',
        text2: 'Vous pouvez maintenant vous connecter avec votre nouveau mot de passe',
      });

      console.log('✅ Password reset completed via backend');
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur lors de la réinitialisation du mot de passe';

      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: errorMessage,
      });
      throw new Error(errorMessage);
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  /**
   * Update user password
   */
  const updatePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      await firebaseAuthService.updatePassword({ currentPassword, newPassword });

      Toast.show({
        type: 'success',
        text1: 'Mot de passe mis à jour',
        text2: 'Votre mot de passe a été changé avec succès',
      });

      console.log('✅ Password updated successfully via Firebase');
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur lors de la mise à jour du mot de passe';
      
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: errorMessage,
      });
      throw new Error(errorMessage);
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Context value
  const value: AuthContextType = {
    user: state.user,
    loading: state.loading,
    isAuthenticated: state.isAuthenticated,
    authReady: state.authReady,
    login,
    logout,
    loginWithGoogle,
    registerWithGoogle,
    register,
    refreshProfile,
    forgotPassword,
    verifyResetToken,
    resetPassword,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use authentication context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

