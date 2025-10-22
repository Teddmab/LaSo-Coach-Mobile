import api from './api';
import { API_CONFIG } from '../config/apiConfig';

/**
 * Measurements API Service
 * Handles all measurements related API calls
 */
class MeasurementsApi {
  /**
   * Get user measurements history
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  static async getMeasurements() {
    try {
      console.log('📏 MeasurementsApi: Fetching measurements...');
      console.log('🌐 API Endpoint:', API_CONFIG.endpoints.onboarding.measurements);
      
      const response = await api.get('/onboarding/measurements');
      
      console.log('✅ MeasurementsApi: Measurements fetched successfully');
      console.log('📊 Response data:', response.data);
      
      return {
        success: true,
        data: response.data?.data?.measurements || response.data?.measurements || []
      };
    } catch (error) {
      console.error('❌ MeasurementsApi: Error fetching measurements:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      return {
        success: false,
        error: error.message || 'Failed to fetch measurements'
      };
    }
  }

  /**
   * Add a new measurement
   * @param {Object} measurementData - Measurement data
   * @param {number} measurementData.weight - Weight in kg
   * @param {number} measurementData.waistSize - Waist size in cm
   * @param {string} measurementData.notes - Optional notes
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  static async addMeasurement(measurementData) {
    try {
      console.log('📏 MeasurementsApi: Adding new measurement...');
      console.log('📊 Measurement data:', measurementData);
      console.log('🌐 API Endpoint:', API_CONFIG.endpoints.onboarding.measurements);
      
      const response = await api.post('/onboarding/measurements', measurementData);
      
      console.log('✅ MeasurementsApi: Measurement added successfully');
      console.log('📊 Response data:', response.data);
      
      return {
        success: true,
        data: response.data?.data || response.data
      };
    } catch (error) {
      console.error('❌ MeasurementsApi: Error adding measurement:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      return {
        success: false,
        error: error.message || 'Failed to add measurement'
      };
    }
  }

  /**
   * Delete a measurement
   * @param {string} measurementId - Measurement ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  static async deleteMeasurement(measurementId) {
    try {
      console.log('📏 MeasurementsApi: Deleting measurement...');
      console.log('📊 Measurement ID:', measurementId);
      console.log('🌐 API Endpoint:', `${API_CONFIG.endpoints.onboarding.measurements}/${measurementId}`);
      
      const response = await api.delete(`/onboarding/measurements/${measurementId}`);
      
      console.log('✅ MeasurementsApi: Measurement deleted successfully');
      console.log('📊 Response data:', response.data);
      
      return {
        success: true
      };
    } catch (error) {
      console.error('❌ MeasurementsApi: Error deleting measurement:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      return {
        success: false,
        error: error.message || 'Failed to delete measurement'
      };
    }
  }

  /**
   * Update a measurement
   * @param {string} measurementId - Measurement ID
   * @param {Object} measurementData - Updated measurement data
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  static async updateMeasurement(measurementId, measurementData) {
    try {
      console.log('📏 MeasurementsApi: Updating measurement...');
      console.log('📊 Measurement ID:', measurementId);
      console.log('📊 Updated data:', measurementData);
      console.log('🌐 API Endpoint:', `${API_CONFIG.endpoints.onboarding.measurements}/${measurementId}`);
      
      const response = await api.put(`/onboarding/measurements/${measurementId}`, measurementData);
      
      console.log('✅ MeasurementsApi: Measurement updated successfully');
      console.log('📊 Response data:', response.data);
      
      return {
        success: true,
        data: response.data?.data || response.data
      };
    } catch (error) {
      console.error('❌ MeasurementsApi: Error updating measurement:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      return {
        success: false,
        error: error.message || 'Failed to update measurement'
      };
    }
  }

  /**
   * Get latest measurement
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  static async getLatestMeasurement() {
    try {
      console.log('📏 MeasurementsApi: Fetching latest measurement...');
      
      const result = await this.getMeasurements();
      
      if (result.success && result.data.length > 0) {
        // Sort by createdAt descending and get the first one
        const sortedMeasurements = result.data.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        return {
          success: true,
          data: sortedMeasurements[0]
        };
      } else {
        return {
          success: true,
          data: null
        };
      }
    } catch (error) {
      console.error('❌ MeasurementsApi: Error fetching latest measurement:', error);
      
      return {
        success: false,
        error: error.message || 'Failed to fetch latest measurement'
      };
    }
  }
}

export default MeasurementsApi;
