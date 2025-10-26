import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { TokenManager } from '../services/tokenManager';
import { authAPI, handleAuthError, retryRequest } from '../services/api';
import { retryRequestWithNetworkAwareness, addNetworkListener } from '../services/networkManager';
import Toast from 'react-native-toast-message';

/**
 * @typedef {import('../types/auth.js').AuthContextType} AuthContextType
 * @typedef {import('../types/auth.js').User} User
 * @typedef {import('../types/auth.js').AuthState} AuthState
 * @typedef {import('../types/auth.js').RegisterData} RegisterData
 * @typedef {import('../types/auth.js').ProfileUpdateData} ProfileUpdateData
 * @typedef {import('../types/auth.js').VerifyResetTokenResponse} VerifyResetTokenResponse
 */

// Initial auth state
/** @type {AuthState} */
const initialState = {
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
};

/**
 * Auth reducer for state management
 * @param {AuthState} state 
 * @param {any} action 
 * @returns {AuthState}
 */
const authReducer = (state, action) => {
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
/** @type {React.Context<AuthContextType | undefined>} */
const AuthContext = createContext(undefined);

/**
 * Authentication Provider Component
 * @param {{ children: React.ReactNode }} props 
 */
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  /**
   * Initialize authentication state on app launch
   */
  useEffect(() => {
    // Setup network state monitoring
    const unsubscribeNetwork = addNetworkListener((isConnected) => {
      if (isConnected && state.user === null && state.token) {
        console.log('🌐 Network reconnected, attempting to fetch user profile...');
        // Try to fetch user profile when network reconnects
        retryRequestWithNetworkAwareness(
          () => authAPI.getProfile(),
          {
            maxRetries: 3,
            initialDelay: 1000,
            networkRetryDelay: 2000,
            queueOnDisconnect: false
          }
        ).then(user => {
          if (user) {
            console.log('✅ User profile fetched after network reconnection');
            dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
          }
        }).catch(error => {
          console.log('❌ Failed to fetch profile after network reconnection:', error.message);
        });
      }
    });

    const initializeAuth = async () => {
      console.log('🔐 Starting auth initialization...');
      
      try {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
        console.log('🔐 Set loading to true');

        // Check for stored tokens
        console.log('🔐 Checking for stored tokens...');
        const { token, refreshToken } = await TokenManager.getTokens();
        console.log('🔐 Retrieved tokens:', { 
          hasToken: !!token, 
          hasRefreshToken: !!refreshToken 
        });

        if (token) {
          console.log('🔐 Token found, updating state...');
          
          // Update state with tokens
          dispatch({
            type: AUTH_ACTIONS.SET_TOKENS,
            payload: { token, refreshToken },
          });
          console.log('🔐 Tokens stored in state');

          // Fetch user profile with enhanced network-aware retry logic
          try {
            console.log('🔐 Fetching user profile...');
            const user = await retryRequestWithNetworkAwareness(
              () => authAPI.getProfile(),
              {
                maxRetries: 5,
                initialDelay: 1000,
                networkRetryDelay: 2000,
                queueOnDisconnect: true
              }
            );
            console.log('🔐 User profile fetched:', user?.email);
            
            dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
            console.log('✅ User authenticated on app launch');
          } catch (error) {
            console.error('❌ Failed to fetch user profile:', error);
            
            // Only log out if it's an authentication error (401, 403)
            // Don't log out for network errors - keep the user logged in
            if (error.response && [401, 403].includes(error.response.status)) {
              console.log('🔐 Auth error - clearing tokens and logging out');
              await TokenManager.clearTokens();
              dispatch({ type: AUTH_ACTIONS.LOGOUT });
            } else {
              console.log('🔐 Network error - keeping user logged in, will retry later');
              // Keep the user logged in but without profile data
              // They can still try to use the app and the token will be validated on next API call
              dispatch({ type: AUTH_ACTIONS.SET_USER, payload: null });
              dispatch({ type: AUTH_ACTIONS.SET_AUTH_READY, payload: true });
            }
          }
        } else {
          console.log('🔐 No token found, logging out');
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        // Only logout if we're sure there's no valid token
        // Network errors shouldn't force logout
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      } finally {
        console.log('🔐 Setting auth ready to true');
        dispatch({ type: AUTH_ACTIONS.SET_AUTH_READY, payload: true });
      }
    };

    initializeAuth();

    // Cleanup network listener on unmount
    return () => {
      unsubscribeNetwork();
    };
  }, []);

  /**
   * Login user with email and password
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<{user: User | null, error: string | null}>}
   */
  const login = async (email, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      
      // Use retry mechanism for network resilience
      const response = await retryRequest(
        () => authAPI.login(email, password),
        3, // max retries
        1000 // initial delay
      );
      
      console.log('🔐 Login response received:', response);
      
      // The API returns the user object directly with token included
      const user = {
        id: response.id,
        email: response.email,
        name: response.name,
        firstName: response.firstName,
        lastName: response.lastName,
        avatar: response.avatar,
        role: response.role,
      };
      const token = response.token;
      
      console.log('🔐 Storing token and user data...');
      await TokenManager.storeTokens(token, null); // No refresh token in this response
      dispatch({ type: AUTH_ACTIONS.SET_TOKENS, payload: { token, refreshToken: null } });
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
      
      console.log('✅ Login successful, user authenticated:', user.firstName);
      Toast.show({ type: 'success', text1: 'Connexion réussie', text2: `Bienvenue ${user.firstName || user.name}!` });
      return { user, error: null };
    } catch (error) {
      console.error('❌ Login error:', error);
      const errorMessage = handleAuthError(error);
      console.log('🔍 Error message to show:', errorMessage);
      Toast.show({
        type: 'error',
        text1: 'Erreur de connexion',
        text2: errorMessage,
      });
      // Return error message for component to handle
      return { user: null, error: errorMessage };
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  /**
   * Register new user
   * @param {RegisterData} userData 
   * @returns {Promise<void>}
   */
  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      const response = await authAPI.register(userData);
      
      // Handle the actual API response format
      // The API returns the user object directly, not nested in data
      const user = response;
      const token = response.token;
      
      // Store tokens
      await TokenManager.storeTokens(token, null); // No refresh token in this response
      dispatch({ type: AUTH_ACTIONS.SET_TOKENS, payload: { token, refreshToken: null } });
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
      Toast.show({ type: 'success', text1: 'Inscription réussie', text2: 'Votre compte a été créé avec succès' });
    } catch (error) {
      console.error('❌ Registration error:', error);
      const errorMessage = handleAuthError(error);
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
   * @returns {Promise<void>}
   */
  const logout = async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      // Call logout API
      await authAPI.logout();

      // Clear tokens
      await TokenManager.clearTokens();

      // Update state
      dispatch({ type: AUTH_ACTIONS.LOGOUT });

      Toast.show({
        type: 'success',
        text1: 'Déconnexion',
        text2: 'À bientôt!',
      });

      console.log('✅ User logged out successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Still clear local state even if API call fails
      await TokenManager.clearTokens();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  /**
   * Refresh user profile data
   * @returns {Promise<User | null>}
   */
  const refreshProfile = async () => {
    try {
      if (!state.isAuthenticated) {
        return null;
      }

      const user = await authAPI.getProfile();
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
      
      console.log('✅ Profile refreshed successfully');
      return user;
    } catch (error) {
      console.error('❌ Failed to refresh profile:', error);
      const errorMessage = handleAuthError(error);
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
   * @param {ProfileUpdateData} profileData 
   * @returns {Promise<User>}
   */
  const updateProfile = async (profileData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      const user = await authAPI.updateProfile(profileData);
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });

      Toast.show({
        type: 'success',
        text1: 'Profil mis à jour',
        text2: 'Vos informations ont été sauvegardées',
      });

      console.log('✅ Profile updated successfully');
      return user;
    } catch (error) {
      const errorMessage = handleAuthError(error);
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
   * @param {string} email 
   * @returns {Promise<void>}
   */
  const forgotPassword = async (email) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      await authAPI.forgotPassword(email);

      Toast.show({
        type: 'success',
        text1: 'Email envoyé',
        text2: 'Vérifiez votre boîte mail pour réinitialiser votre mot de passe',
      });

      console.log('✅ Password reset email sent');
    } catch (error) {
      const errorMessage = handleAuthError(error);
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
   * Verify password reset token
   * @param {string} token 
   * @returns {Promise<VerifyResetTokenResponse>}
   */
  const verifyResetToken = async (token) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      const response = await authAPI.verifyResetToken(token);
      console.log('✅ Reset token verified');
      return response;
    } catch (error) {
      const errorMessage = handleAuthError(error);
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
   * Complete password reset
   * @param {string} token 
   * @param {string} newPassword 
   * @returns {Promise<void>}
   */
  const resetPassword = async (token, newPassword) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      await authAPI.resetPassword(token, newPassword);

      Toast.show({
        type: 'success',
        text1: 'Mot de passe réinitialisé',
        text2: 'Vous pouvez maintenant vous connecter avec votre nouveau mot de passe',
      });

      console.log('✅ Password reset completed');
    } catch (error) {
      const errorMessage = handleAuthError(error);
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
  /** @type {AuthContextType} */
  const value = {
    user: state.user,
    loading: state.loading,
    isAuthenticated: state.isAuthenticated,
    authReady: state.authReady,
    login,
    logout,
    register,
    refreshProfile,
    updateProfile,
    forgotPassword,
    verifyResetToken,
    resetPassword,
    // Add a function to refresh user data from profile API
    refreshUserFromProfile: refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use authentication context
 * @returns {AuthContextType}
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 