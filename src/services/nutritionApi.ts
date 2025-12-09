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
      const response = await api.get('/nutrition/plans');
      return response.data;
    } catch (error) {
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
      const response = await api.get('/profile');
      return response.data;
    } catch (error) {
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
      const response = await api.get('/subscriptions/current');
      return response.data;
    } catch (error) {
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
      const response = await api.get(`/meals/plans/${planId}/completion-status`);
      return response.data;
    } catch (error) {
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
      const response = await api.post(`/meals/${mealId}/complete`, data);
      return response.data;
    } catch (error) {
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
      const response = await api.post(`/meals/${mealId}/like`);
      return response.data;
    } catch (error) {
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
      const response = await api.post(`/meals/${mealId}/dislike`);
      return response.data;
    } catch (error) {
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
      const response = await api.delete(`/meals/${mealId}/interaction`);
      return response.data;
    } catch (error) {
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
      const response = await api.get(`/meals/${mealId}/interaction`);
      return response.data;
    } catch (error) {
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
      const response = await api.post(`/meals/${mealId}/feedback`, feedback);
      return response.data;
    } catch (error) {
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
      const response = await api.get(`/meals/plans/${planId}/day/${day}/completion`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default nutritionAPI;
