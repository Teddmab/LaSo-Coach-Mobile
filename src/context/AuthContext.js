import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { TokenManager } from '../services/tokenManager';
import { authAPI, handleAuthError } from '../services/api';
import Toast from 'react-native-toast-message';

/**
 * @typedef {import('../types/auth.js').AuthContextType} AuthContextType
 * @typedef {import('../types/auth.js').User} User
 * @typedef {import('../types/auth.js').AuthState} AuthState
 * @typedef {import('../types/auth.js').RegisterData} RegisterData
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

        if (token && refreshToken) {
          console.log('🔐 Tokens found, updating state...');
          
          // Update state with tokens
          dispatch({
            type: AUTH_ACTIONS.SET_TOKENS,
            payload: { token, refreshToken },
          });
          console.log('🔐 Tokens stored in state');

          // Fetch user profile
          try {
            console.log('🔐 Fetching user profile...');
            const user = await authAPI.getProfile();
            console.log('🔐 User profile fetched:', user?.email);
            
            dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
            console.log('✅ User authenticated on app launch');
          } catch (error) {
            console.error('❌ Failed to fetch user profile:', error);
            await TokenManager.clearTokens();
            dispatch({ type: AUTH_ACTIONS.LOGOUT });
          }
        } else {
          console.log('🔐 No tokens found, logging out');
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      } finally {
        console.log('🔐 Setting auth ready to true');
        dispatch({ type: AUTH_ACTIONS.SET_AUTH_READY, payload: true });
      }
    };

    initializeAuth();
  }, []);

  /**
   * Login user with email and password
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<User>}
   */
  const login = async (email, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      const response = await authAPI.login(email, password);
      const { token, refreshToken, ...userData } = response;

      // Store tokens securely
      await TokenManager.storeTokens(token, refreshToken);

      // Update state
      dispatch({
        type: AUTH_ACTIONS.SET_TOKENS,
        payload: { token, refreshToken },
      });
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: userData });

      Toast.show({
        type: 'success',
        text1: 'Connexion réussie',
        text2: `Bienvenue ${userData.name}!`,
      });

      console.log('✅ User logged in successfully');
      return userData;
    } catch (error) {
      const errorMessage = handleAuthError(error);
      Toast.show({
        type: 'error',
        text1: 'Erreur de connexion',
        text2: errorMessage,
      });
      throw new Error(errorMessage);
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

      await authAPI.register(userData);

      Toast.show({
        type: 'success',
        text1: 'Inscription réussie',
        text2: 'Votre compte a été créé avec succès',
      });

      console.log('✅ User registered successfully');
    } catch (error) {
      const errorMessage = handleAuthError(error);
      Toast.show({
        type: 'error',
        text1: 'Erreur d\'inscription',
        text2: errorMessage,
      });
      throw new Error(errorMessage);
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
    forgotPassword,
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