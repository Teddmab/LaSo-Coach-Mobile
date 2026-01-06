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
   * Utilise fetch directement comme dans ProfileApi.updateProfile (pas Axios)
   * @param {string} mealId - The meal ID
   * @param {Object} data - Completion data (nutritionPlanId, completionDate, planDay, feedback, rating)
   * @returns {Promise<Object>} Completion response
   */
  async completeMeal(mealId, data = {}) {
    try {
      // Récupérer le token Firebase pour l'authentification
      const firebaseAuthService = require('./firebaseAuthServiceNew').default;
      const idToken = await firebaseAuthService.getIdToken();

      if (!idToken) {
        throw new Error('Token d\'authentification manquant. Veuillez vous reconnecter.');
      }

      const Config = require('../config/env').default;
      const url = `${Config.API_BASE_URL}/meals/${mealId}/complete`;

      console.log('🔵 [nutritionAPI.completeMeal] Appel API avec fetch:', {
        mealId,
        endpoint: `/meals/${mealId}/complete`,
        data,
        fullUrl: url,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(data),
      });

      const text = await response.text();
      let json: any = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch (parseError) {
        console.error('🔴 [nutritionAPI.completeMeal] Erreur parsing JSON:', parseError);
      }

      if (!response.ok) {
        const message = json?.message || `Erreur lors de la complétion du repas (code ${response.status})`;
        const error: any = new Error(message);
        error.status = response.status;
        error.data = json;
        error.response = {
          status: response.status,
          data: json,
        };
        throw error;
      }

      console.log('🔵 [nutritionAPI.completeMeal] ✅ Réponse reçue:', {
        status: response.status,
        data: json,
      });

      // Retourner la réponse complète (comme dans ProfileApi)
      return json?.data || json;
    } catch (error) {
      console.error('🔴 [nutritionAPI.completeMeal] ❌ ERREUR:', {
        mealId,
        errorMessage: error?.message,
        errorStatus: error?.status || error?.response?.status,
        errorData: error?.data || error?.response?.data,
        fullError: error,
      });
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
