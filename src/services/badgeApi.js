import api from './api';
import { API_CONFIG } from '../config/apiConfig';

/**
 * Badge API Service
 * Handles all mobile badge related API calls
 * Based on the new simplified mobile badge system
 */
class BadgeApi {
  /**
   * Get all badges with user progress
   * @returns {Promise<{success: boolean, data?: {badges: Array, summary: Object}, error?: string}>}
   */
  static async getAllBadges() {
    try {
      console.log('🏆 BadgeApi: Fetching all badges...');
      console.log('🌐 API Endpoint:', API_CONFIG.endpoints.mobile.badges.getAll);
      
      const response = await api.get(API_CONFIG.endpoints.mobile.badges.getAll);
      
      console.log('✅ BadgeApi: All badges fetched successfully');
      console.log('📊 Response data:', response.data);
      
      // Handle both axios response structure and direct data
      const responseData = response.data || response;
      
      if (responseData.success && responseData.data) {
        return {
          success: true,
          data: responseData.data,
        };
      }
      
      return {
        success: false,
        error: 'Invalid response format',
      };
    } catch (error) {
      console.error('❌ BadgeApi: Error fetching all badges:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      
      return {
        success: false,
        error: error.message || 'Failed to fetch badges',
      };
    }
  }

  /**
   * Get badge summary statistics (lightweight)
   * @returns {Promise<{success: boolean, data?: {summary: Object}, error?: string}>}
   */
  static async getSummary() {
    try {
      console.log('🏆 BadgeApi: Fetching badge summary...');
      console.log('🌐 API Endpoint:', API_CONFIG.endpoints.mobile.badges.getSummary);
      
      const response = await api.get(API_CONFIG.endpoints.mobile.badges.getSummary);
      
      console.log('✅ BadgeApi: Badge summary fetched successfully');
      console.log('📊 Response data:', response.data);
      
      // Handle both axios response structure and direct data
      const responseData = response.data || response;
      
      if (responseData.success && responseData.data) {
        return {
          success: true,
          data: responseData.data,
        };
      }
      
      return {
        success: false,
        error: 'Invalid response format',
      };
    } catch (error) {
      console.error('❌ BadgeApi: Error fetching badge summary:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      
      return {
        success: false,
        error: error.message || 'Failed to fetch badge summary',
      };
    }
  }

  /**
   * Get detailed information for a single badge
   * @param {string} badgeId - Badge ID
   * @returns {Promise<{success: boolean, data?: {badge: Object}, error?: string}>}
   */
  static async getBadgeById(badgeId) {
    try {
      console.log('🏆 BadgeApi: Fetching badge by ID:', badgeId);
      console.log('🌐 API Endpoint:', API_CONFIG.endpoints.mobile.badges.getById(badgeId));
      
      if (!badgeId) {
        return {
          success: false,
          error: 'Badge ID is required',
        };
      }
      
      const response = await api.get(API_CONFIG.endpoints.mobile.badges.getById(badgeId));
      
      console.log('✅ BadgeApi: Badge fetched successfully');
      console.log('📊 Response data:', response.data);
      
      // Handle both axios response structure and direct data
      const responseData = response.data || response;
      
      if (responseData.success && responseData.data) {
        return {
          success: true,
          data: responseData.data,
        };
      }
      
      return {
        success: false,
        error: 'Invalid response format',
      };
    } catch (error) {
      console.error('❌ BadgeApi: Error fetching badge by ID:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      
      return {
        success: false,
        error: error.message || 'Failed to fetch badge',
      };
    }
  }
}

export default BadgeApi;

