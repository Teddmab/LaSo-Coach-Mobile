import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYCHAIN_SERVICE = 'LasoCoachTokens';
const TOKEN_KEY = '@LasoCoach:authToken';
const REFRESH_TOKEN_KEY = '@LasoCoach:refreshToken';

// Check if Keychain is available
const isKeychainAvailable = () => {
  try {
    return (
      Keychain && 
      Keychain.getInternetCredentials &&
      typeof Keychain.getInternetCredentials === 'function' &&
      typeof Keychain.setInternetCredentials === 'function'
    );
  } catch (error) {
    console.log('🔑 Keychain not available:', error.message);
    return false;
  }
};

/**
 * Token Manager for secure token storage
 */
export const TokenManager = {
  /**
   * Store authentication tokens
   * @param {string} token - Access token
   * @param {string} refreshToken - Refresh token
   */
  async storeTokens(token, refreshToken) {
    try {
      console.log('🔑 TokenManager: Storing tokens...');
      console.log('🔑 Token length:', token ? token.length : 'null');
      console.log('🔑 RefreshToken length:', refreshToken ? refreshToken.length : 'null');
      
      // Force AsyncStorage only for now
      console.log('💾 Storing in AsyncStorage...');
      await AsyncStorage.setItem(TOKEN_KEY, token);
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken || '');
      console.log('✅ Tokens stored in AsyncStorage');
    } catch (error) {
      console.error('❌ Error storing tokens:', error);
      throw new Error('Failed to store authentication tokens');
    }
  },

  /**
   * Retrieve authentication tokens
   * @returns {Promise<{token: string|null, refreshToken: string|null}>}
   */
  async getTokens() {
    try {
      console.log('🔑 TokenManager: Getting tokens...');
      console.log('🔍 getTokens - starting AsyncStorage retrieval...');
      
      // Force AsyncStorage only for now (skip Keychain entirely)
      console.log('🔄 Using AsyncStorage only...');
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      
      console.log('🔑 AsyncStorage token found:', token ? `${token.substring(0, 10)}...` : 'null');
      console.log('🔑 AsyncStorage refreshToken found:', refreshToken ? `${refreshToken.substring(0, 10)}...` : 'null');
      console.log('🔑 Token length:', token ? token.length : 'null');
      console.log('🔑 RefreshToken length:', refreshToken ? refreshToken.length : 'null');
      console.log('🔑 Token type:', typeof token);
      console.log('🔑 RefreshToken type:', typeof refreshToken);
      
      // Return tokens even if refreshToken is null - main token is what we need for API calls
      if (token) {
        console.log('✅ Token retrieved from AsyncStorage');
        return { token, refreshToken: refreshToken || null };
      }
      
      console.log('ℹ️ No token found in AsyncStorage');
      return { token: null, refreshToken: null };
      
    } catch (error) {
      console.error('❌ Error retrieving tokens:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack
      });
      return { token: null, refreshToken: null };
    }
  },

  /**
   * Clear all stored tokens
   */
  async clearTokens() {
    try {
      console.log('🔑 TokenManager: Clearing tokens...');
      
      // Clear AsyncStorage
      await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY]);
      console.log('✅ Tokens cleared from AsyncStorage');
      
    } catch (error) {
      console.error('❌ Error clearing tokens:', error);
      // Even if clearing fails, we continue
    }
  },

  /**
   * Check if user has valid tokens
   * @returns {Promise<boolean>}
   */
  async hasValidTokens() {
    const { token, refreshToken } = await this.getTokens();
    return !!(token && refreshToken);
  }
}; 