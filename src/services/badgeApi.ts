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
      
      const response = await api.get(API_CONFIG.endpoints.mobile.badges.getAll);
      
      
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
      
      const response = await api.get(API_CONFIG.endpoints.mobile.badges.getSummary);
      
      
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
      return {
        success: false,
        error: error.message || 'Failed to fetch badge summary',
      };
    }
  }

  /**
   * Get next badge information and progress
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  static async getNextBadge() {
    try {
      
      const response = await api.get(API_CONFIG.endpoints.mobile.badges.getNext);
      
      
      // Handle both axios response structure and direct data
      const responseData = response.data || response;
      
      
      // Certains backends renvoient { status: 'success', data: {...} },
      // d'autres renvoient { success: true, data: {...} }.
      const isOk = (responseData.status === 'success' || responseData.success === true) && !!responseData.data;
      
      if (isOk) {
        const apiData = responseData.data;
        
        // Log the specific fields we need
        
        return {
          success: true,
          data: apiData, // This should contain pointsToFinishCurrentBadge
        };
      }
      
      
      return {
        success: false,
        error: 'Invalid response format',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to fetch next badge information',
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
      
      if (!badgeId) {
        return {
          success: false,
          error: 'Badge ID is required',
        };
      }
      
      const response = await api.get(API_CONFIG.endpoints.mobile.badges.getById(badgeId));
      
      
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
      return {
        success: false,
        error: error.message || 'Failed to fetch badge',
      };
    }
  }
}

export default BadgeApi;

