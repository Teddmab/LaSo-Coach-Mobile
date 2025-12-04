import api from './api';
import { AxiosResponse } from 'axios';

/**
 * Nutrition API Service
 * Handles all nutrition-related API calls according to the API contract
 */
export const nutritionAPI: {
  getPlans: () => Promise<any>;
  getProfile: () => Promise<any>;
  [key: string]: (...args: any[]) => Promise<any>;
} = {
  /**
   * Get nutrition plans
   * Endpoint: GET /api/v1/nutrition/plans
   * @returns {Promise<Object>} Nutrition plans data
   */
  async getPlans() {
    try {
      console.log('🥗 API Request: GET /nutrition/plans');
      console.log('🥗 Making fresh GET request (not OPTIONS preflight)');
      const response = await api.get('/nutrition/plans');
      console.log('✅ GET /nutrition/plans - 200 OK');
      console.log('✅ Response data structure:', {
        hasData: !!response.data?.data,
        plansCount: response.data?.data?.plans?.length || 0,
        responseKeys: Object.keys(response.data || {})
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching nutrition plans:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      throw error;
    }
  },

  /**
   * Get user profile
   * Endpoint: GET /api/v1/profile
   * @returns {Promise<Object>} User profile data
   */
  async getProfile() {
    try {
      console.log('👤 Fetching user profile...');
      const response = await api.get('/profile');
      console.log('✅ User profile fetched successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
      throw error;
    }
  },

  /**
   * Get current subscription
   * Endpoint: GET /api/v1/subscriptions/current
   * @returns {Promise<Object>} Current subscription data
   */
  async getCurrentSubscription() {
    try {
      console.log('💳 Fetching current subscription...');
      const response = await api.get('/subscriptions/current');
      console.log('✅ Current subscription fetched successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching current subscription:', error);
      throw error;
    }
  },

  /**
   * Get plan completion status
   * Endpoint: GET /api/v1/meals/plans/{planId}/completion-status
   * @param {string} planId - The plan ID
   * @returns {Promise<Object>} Completion status data
   */
  async getCompletionStatus(planId) {
    try {
      console.log(`🥗 Fetching completion status for plan: ${planId}`);
      const response = await api.get(`/meals/plans/${planId}/completion-status`);
      console.log('✅ Completion status fetched successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching completion status:', error);
      throw error;
    }
  },

  /**
   * Complete meal
   * Endpoint: POST /api/v1/meals/{mealId}/complete
   * @param {string} mealId - The meal ID
   * @param {Object} data - Completion data (feedback, rating)
   * @returns {Promise<Object>} Completion response
   */
  async completeMeal(mealId, data = {}) {
    try {
      console.log(`🥗 Completing meal: ${mealId}`);
      const response = await api.post(`/meals/${mealId}/complete`, data);
      console.log('✅ Meal completed successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error completing meal:', error);
      throw error;
    }
  },

  /**
   * Like meal
   * Endpoint: POST /api/v1/meals/{mealId}/like
   * @param {string} mealId - The meal ID
   * @returns {Promise<Object>} Like response
   */
  async likeMeal(mealId) {
    try {
      console.log(`👍 Liking meal: ${mealId}`);
      const response = await api.post(`/meals/${mealId}/like`);
      console.log('✅ Meal liked successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error liking meal:', error);
      throw error;
    }
  },

  /**
   * Dislike meal
   * Endpoint: POST /api/v1/meals/{mealId}/dislike
   * @param {string} mealId - The meal ID
   * @returns {Promise<Object>} Dislike response
   */
  async dislikeMeal(mealId) {
    try {
      console.log(`👎 Disliking meal: ${mealId}`);
      const response = await api.post(`/meals/${mealId}/dislike`);
      console.log('✅ Meal disliked successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error disliking meal:', error);
      throw error;
    }
  },

  /**
   * Remove meal interaction
   * Endpoint: DELETE /api/v1/meals/{mealId}/interaction
   * @param {string} mealId - The meal ID
   * @returns {Promise<Object>} Remove interaction response with updated counts and null user interaction
   */
  async removeMealInteraction(mealId) {
    try {
      console.log(`🔄 Removing meal interaction: ${mealId}`);
      const response = await api.delete(`/meals/${mealId}/interaction`);
      console.log('✅ Meal interaction removed successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error removing meal interaction:', error);
      throw error;
    }
  },

  /**
   * Get meal interaction status
   * Endpoint: GET /api/v1/meals/{mealId}/interaction
   * @param {string} mealId - The meal ID
   * @returns {Promise<Object>} Current like/dislike counts and user's interaction status
   */
  async getMealInteraction(mealId) {
    try {
      console.log(`📊 Fetching meal interaction status: ${mealId}`);
      const response = await api.get(`/meals/${mealId}/interaction`);
      console.log('✅ Meal interaction status fetched successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching meal interaction status:', error);
      throw error;
    }
  },

  /**
   * Submit meal feedback
   * Endpoint: POST /api/v1/meals/{mealId}/feedback
   * @param {string} mealId - The meal ID
   * @param {Object} feedback - Feedback data
   * @returns {Promise<Object>} Feedback response
   */
  async submitMealFeedback(mealId, feedback) {
    try {
      console.log(`💬 Submitting meal feedback: ${mealId}`);
      const response = await api.post(`/meals/${mealId}/feedback`, feedback);
      console.log('✅ Meal feedback submitted successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error submitting meal feedback:', error);
      throw error;
    }
  },

  /**
   * Get day completion status
   * Endpoint: GET /api/v1/meals/plans/{planId}/day/{day}/completion
   * @param {string} planId - The plan ID
   * @param {number} day - The day number (1-7)
   * @returns {Promise<Object>} Day completion data
   */
  async getDayCompletionStatus(planId, day) {
    try {
      console.log(`📅 Fetching day completion status: plan ${planId}, day ${day}`);
      const response = await api.get(`/meals/plans/${planId}/day/${day}/completion`);
      console.log('✅ Day completion status fetched successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching day completion status:', error);
      throw error;
    }
  }
};

export default nutritionAPI;
