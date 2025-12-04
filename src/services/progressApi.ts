import api from './api';
import { API_CONFIG } from '../config/apiConfig';

/**
 * Progress API Service
 * Handles all progress-related API calls
 */
export class ProgressApi {
  /**
   * Get comprehensive progress overview
   * @returns {Promise<Object>} Progress overview data
   */
  static async getProgressOverview() {
    try {
      console.log('📊 ProgressApi: Fetching progress overview...');
      console.log('📊 ProgressApi: Endpoint:', API_CONFIG.endpoints.progress.overview);
      
      const response = await api.get(API_CONFIG.endpoints.progress.overview);
      
      console.log('📊 ProgressApi: Progress overview response status:', response.status);
      console.log('📊 ProgressApi: Progress overview response data:', response.data);
      
      if (response.data?.success) {
        console.log('✅ ProgressApi: Progress overview fetched successfully');
        console.log('📊 ProgressApi: Progress data keys:', Object.keys(response.data.data || {}));
        return {
          success: true,
          data: response.data.data
        };
      } else {
        console.log('⚠️ ProgressApi: Progress overview request failed');
        console.log('⚠️ ProgressApi: Error message:', response.data?.message);
        return {
          success: false,
          error: response.data?.message || 'Failed to fetch progress overview'
        };
      }
    } catch (error) {
      console.error('❌ ProgressApi: Error fetching progress overview:', error);
      console.error('❌ ProgressApi: Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }

  /**
   * Get detailed progress data (for ProgressScreen)
   * @returns {Promise<Object>} Detailed progress data
   */
  static async getDetailedProgress() {
    try {
      console.log('📊 ProgressApi: Fetching detailed progress...');
      
      const response = await api.get(API_CONFIG.endpoints.progress.detailed);
      
      console.log('📊 ProgressApi: Detailed progress response:', response.data);
      
      if (response.data?.success) {
        console.log('✅ ProgressApi: Detailed progress fetched successfully');
        return {
          success: true,
          data: response.data.data
        };
      } else {
        console.log('⚠️ ProgressApi: Detailed progress request failed');
        return {
          success: false,
          error: response.data?.message || 'Failed to fetch detailed progress'
        };
      }
    } catch (error) {
      console.error('❌ ProgressApi: Error fetching detailed progress:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }

  /**
   * Get historical measurements data
   * @param {number} days - Number of days to fetch (default: 30)
   * @returns {Promise<Object>} Historical measurements data
   */
  static async getHistoricalMeasurements(days = 30) {
    try {
      console.log(`📊 ProgressApi: Fetching historical measurements for ${days} days...`);
      
      const response = await api.get(`${API_CONFIG.endpoints.progress.historical}?days=${days}`);
      
      console.log('📊 ProgressApi: Historical measurements response:', response.data);
      
      if (response.data?.success) {
        console.log('✅ ProgressApi: Historical measurements fetched successfully');
        return {
          success: true,
          data: response.data.data
        };
      } else {
        console.log('⚠️ ProgressApi: Historical measurements request failed');
        return {
          success: false,
          error: response.data?.message || 'Failed to fetch historical measurements'
        };
      }
    } catch (error) {
      console.error('❌ ProgressApi: Error fetching historical measurements:', error);
      return {
        success: false,
        error: error.message || 'Network error occurred'
      };
    }
  }
}

export default ProgressApi;
