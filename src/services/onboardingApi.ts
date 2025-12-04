import api from './api';
import { API_CONFIG } from '../config/apiConfig';

/**
 * Onboarding API Service
 * Handles all onboarding-related API calls
 */
class OnboardingApi {
  /**
   * Get onboarding progress data
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  static async getOnboardingProgress() {
    try {
      console.log('🎯 OnboardingApi: Fetching onboarding progress...');
      console.log('🌐 API Endpoint:', API_CONFIG.endpoints.onboarding.progress);
      
      const response = await api.get(API_CONFIG.endpoints.onboarding.progress);
      
      console.log('✅ OnboardingApi: Onboarding progress fetched successfully');
      console.log('📊 Response data:', response.data);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ OnboardingApi: Error fetching onboarding progress:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      return {
        success: false,
        error: error.message || 'Failed to fetch onboarding progress'
      };
    }
  }

  /**
   * Get onboarding step details
   * @param {string} stepId - The step identifier
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  static async getOnboardingStep(stepId) {
    try {
      console.log('🎯 OnboardingApi: Fetching onboarding step:', stepId);
      console.log('🌐 API Endpoint:', API_CONFIG.endpoints.onboarding.step(stepId));
      
      const response = await api.get(API_CONFIG.endpoints.onboarding.step(stepId));
      
      console.log('✅ OnboardingApi: Onboarding step fetched successfully');
      console.log('📊 Response data:', response.data);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ OnboardingApi: Error fetching onboarding step:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      return {
        success: false,
        error: error.message || 'Failed to fetch onboarding step'
      };
    }
  }

  /**
   * Update onboarding step completion
   * @param {string} stepId - The step identifier
   * @param {Object} stepData - The step data to update
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  static async updateOnboardingStep(stepId, stepData) {
    try {
      console.log('🎯 OnboardingApi: Updating onboarding step:', stepId);
      console.log('🌐 API Endpoint:', API_CONFIG.endpoints.onboarding.updateStep(stepId));
      console.log('📊 Step data:', stepData);
      
      const response = await api.put(API_CONFIG.endpoints.onboarding.updateStep(stepId), stepData);
      
      console.log('✅ OnboardingApi: Onboarding step updated successfully');
      console.log('📊 Response data:', response.data);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ OnboardingApi: Error updating onboarding step:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      return {
        success: false,
        error: error.message || 'Failed to update onboarding step'
      };
    }
  }

  /**
   * Complete onboarding process
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  static async completeOnboarding() {
    try {
      console.log('🎯 OnboardingApi: Completing onboarding process...');
      console.log('🌐 API Endpoint:', API_CONFIG.endpoints.onboarding.complete);
      
      const response = await api.post(API_CONFIG.endpoints.onboarding.complete);
      
      console.log('✅ OnboardingApi: Onboarding completed successfully');
      console.log('📊 Response data:', response.data);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ OnboardingApi: Error completing onboarding:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      return {
        success: false,
        error: error.message || 'Failed to complete onboarding'
      };
    }
  }
}

export default OnboardingApi;


