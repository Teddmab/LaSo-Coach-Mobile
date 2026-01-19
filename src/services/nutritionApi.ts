import api from './api';
import { isIOSCompanionMode } from '../config/featureFlags';

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
   * @returns {Promise<Object>} Nutrition plans data with HTTP status
   */
  async getPlans() {
    try {
      const url = '/nutrition/plans';
      console.log('═══════════════════════════════════════════════════════════');
      console.log('🍽️ [NUTRITION PLANS] Envoi de la requête API');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('📤 Méthode: GET');
      console.log('📤 Endpoint: /api/v1/nutrition/plans');
      console.log('📤 URL complète:', url);
      console.log('📤 Timestamp:', new Date().toISOString());
      
      const response = await api.get(url);
      console.log('📡 [NUTRITION PLANS] Requête HTTP envoyée avec succès');
      
      console.log('═══════════════════════════════════════════════════════════');
      console.log('✅ [NUTRITION PLANS] Réponse reçue avec succès');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('📥 Status HTTP:', response.status, response.statusText);
      console.log('📥 Headers:', JSON.stringify(response.headers || {}, null, 2));
      console.log('📥 Données reçues:', JSON.stringify(response.data, null, 2));
      console.log('📥 Structure des données:', {
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : [],
        hasDataField: !!response.data?.data,
        hasPlansArray: Array.isArray(response.data?.data?.plans) || Array.isArray(response.data?.plans),
        plansCount: response.data?.data?.plans?.length || response.data?.plans?.length || 0,
        plansData: response.data?.data?.plans || response.data?.plans || [],
      });
      console.log('═══════════════════════════════════════════════════════════');
      
      // Return both data and status for lock card logic
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error: unknown) {
      // If error, return status from error response
      const apiError = error as { 
        response?: { 
          status?: number; 
          statusText?: string;
          data?: any;
          headers?: any;
        }; 
        status?: number; 
        message?: string;
        config?: any;
      };
      
      console.log('═══════════════════════════════════════════════════════════');
      console.log('❌ [NUTRITION PLANS] Erreur lors de la requête');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('📤 Requête qui a échoué:', {
        method: apiError?.config?.method || 'GET',
        url: apiError?.config?.url || '/nutrition/plans',
        headers: apiError?.config?.headers || {},
      });
      console.log('📥 Status HTTP:', apiError?.response?.status || apiError?.status || 'N/A');
      console.log('📥 Status Text:', apiError?.response?.statusText || 'N/A');
      console.log('📥 Message d\'erreur:', apiError?.message || 'N/A');
      console.log('📥 Données d\'erreur:', JSON.stringify(apiError?.response?.data || {}, null, 2));
      console.log('📥 Headers de réponse:', JSON.stringify(apiError?.response?.headers || {}, null, 2));
      console.log('📥 Erreur complète:', JSON.stringify(error, null, 2));
      console.log('═══════════════════════════════════════════════════════════');
      
      return {
        data: apiError?.response?.data || null,
        status: apiError?.response?.status || apiError?.status || 500,
      };
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
   * ✅ APPLE COMPLIANCE: Returns companion mode status on iOS
   * Endpoint: GET /api/v1/subscriptions/current
   * @returns {Promise<Object>} Current subscription data
   */
  async getCurrentSubscription() {
    try {
      // 🍎 iOS COMPANION MODE: Return companion mode status, don't call API
      if (isIOSCompanionMode()) {
        console.warn('🍎 [NutritionApi] Subscription endpoint blocked on iOS companion mode');
        return {
          status: 'success',
          data: {
            subscriptionStatus: 'COMPANION_MODE',
            accessLevel: 'FREE',
            message: 'iOS companion app - subscription information not available',
            timestamp: new Date().toISOString(),
          }
        };
      }

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
    } catch (error: unknown) {
      const apiError = error as { message?: string; status?: number; response?: { status?: number; data?: any }; data?: any };
      console.error('🔴 [nutritionAPI.completeMeal] ❌ ERREUR:', {
        mealId,
        errorMessage: apiError?.message,
        errorStatus: apiError?.status || apiError?.response?.status,
        errorData: apiError?.data || apiError?.response?.data,
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
