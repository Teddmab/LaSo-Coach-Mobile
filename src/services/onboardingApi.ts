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
      const response = await api.get(API_CONFIG.endpoints.onboarding.progress);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
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
      const response = await api.get(API_CONFIG.endpoints.onboarding.step(stepId));
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
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
      const response = await api.put(API_CONFIG.endpoints.onboarding.updateStep(stepId), stepData);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
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
      const response = await api.post(API_CONFIG.endpoints.onboarding.complete);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to complete onboarding'
      };
    }
  }

  /**
   * Étape 1/4 : Complete Profile Setup
   * Endpoint: PUT /profile
   * Points: 100
   * @param {string} userId - User ID
   * @param {Object} profileData - Profile data
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  static async completeProfileSetup(userId, profileData) {
    try {
      // Build address string: "line1; line2; city; postalCode; country"
      const addressParts = [
        profileData.addressLine1,
        profileData.addressLine2,
        profileData.city,
        profileData.postalCode,
        profileData.country
      ].filter(part => part && part !== ''); // Remove empty parts
      const addressString = addressParts.join('; ');
      
      const payload = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        name: `${profileData.firstName} ${profileData.lastName}`,
        phoneNumber: profileData.phoneNumber,
        address: addressString,
        profile: {
          height: profileData.height ? parseFloat(profileData.height) : null,
          initialWeight: profileData.initialWeight ? parseFloat(profileData.initialWeight) : null,
          initialWaistSize: profileData.initialWaistSize ? parseFloat(profileData.initialWaistSize) : null,
          gender: profileData.gender,
          occupation: profileData.occupation
        }
      };
      
      let response;
      try {
        // Essayer d'abord PUT (update) - le backend devrait gérer l'upsert
        response = await api.put(API_CONFIG.endpoints.profile.update, payload);
      } catch (error: any) {
        // Si l'erreur indique que le Profile (relation) n'existe pas
        const errorMessage = error?.message || '';
        const errorData = error?.response?.data || error?.data || {};
        const errorDataMessage = errorData?.message || '';
        
        if (errorMessage.includes('No record was found for an update') || 
            errorDataMessage.includes('No record was found for an update') ||
            error?.response?.status === 404) {
          try {
            // Créer le Profile d'abord avec POST /profile
            const createResponse = await api.post(API_CONFIG.endpoints.profile.create, {});
            
            // Maintenant, réessayer le PUT avec les données complètes
            response = await api.put(API_CONFIG.endpoints.profile.update, payload);
          } catch (createError: any) {
            // Si l'erreur indique que le Profile existe déjà, réessayer le PUT
            if (createError?.response?.status === 400 && 
                (createError?.response?.data?.message?.includes('already exists') ||
                 createError?.message?.includes('already exists'))) {
              response = await api.put(API_CONFIG.endpoints.profile.update, payload);
            } else {
              throw createError;
            }
          }
        } else {
          // Si c'est une autre erreur, la re-lancer
          throw error;
        }
      }
      
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to complete Profile Setup'
      };
    }
  }

  /**
   * Étape 2/4 : Complete Goals Setup
   * Endpoint: PUT /profile
   * Points: 30
   * @param {string} userId - User ID
   * @param {Object} goalsData - Goals data
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  static async completeGoalsSetup(userId, goalsData) {
    try {
      const payload = {
        profile: {
          targetWeight: goalsData.targetWeight ? parseFloat(goalsData.targetWeight) : null,
          targetWaistSize: goalsData.targetWaistSize ? parseFloat(goalsData.targetWaistSize) : null,
          goal: goalsData.goal || null,
          goals: goalsData.goals || [],
          dietaryRestrictions: goalsData.dietaryRestrictions || []
        }
      };
      
      const response = await api.put(API_CONFIG.endpoints.profile.update, payload);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to complete Goals Setup'
      };
    }
  }

  /**
   * Étape 3/4 : Complete Recommendations
   * Endpoint: PATCH /onboarding/progress
   * Points: 20
   * @param {string} userId - User ID (not used in endpoint, but kept for consistency)
   * @param {boolean} photoConsent - Photo consent
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  static async completeRecommendations(userId, photoConsent) {
    try {
      const payload = {
        step: 'recommendations',
        completed: photoConsent
      };
      
      const endpoint = API_CONFIG.endpoints.onboarding.progress;
      const response = await api.patch(endpoint, payload);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to complete Recommendations'
      };
    }
  }

  /**
   * Étape 4/4 : Complete Rendez-vous
   * Endpoints: 
   *   - POST /onboarding/rendezvous (create)
   *   - PATCH /onboarding/user/${userId}/progress (mark as completed)
   * Points: 25
   * @param {string} userId - User ID
   * @param {Object} rendezVousData - Rendez-vous data
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  static async completeRendezVous(userId, rendezVousData) {
    try {
      // Étape 4A : Créer le rendez-vous
      const createPayload = {
        userId: userId,
        scheduledAt: rendezVousData.scheduledAt,
        subject: rendezVousData.subject,
        duration: rendezVousData.duration,
        notes: rendezVousData.notes || undefined
      };
      
      const createResponse = await api.post(API_CONFIG.endpoints.onboarding.rendezvous, createPayload);
      
      // Étape 4B : Marquer comme complété
      const progressPayload = {
        step: 'rendezvous',
        completed: true
      };
      
      const progressEndpoint = API_CONFIG.endpoints.onboarding.progress;
      const progressResponse = await api.patch(progressEndpoint, progressPayload);
      
      return {
        success: true,
        data: {
          rendezvous: createResponse.data,
          progress: progressResponse.data
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to complete Rendez-vous'
      };
    }
  }
}

export default OnboardingApi;


