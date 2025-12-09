import api from './api';
import { API_CONFIG } from '../config/apiConfig';

/**
 * Achievements API Service
 * Handles all achievements and badges related API calls
 */
class AchievementsApi {
  /**
   * Get user achievements and badges summary from profile endpoint
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  static async getAchievementsSummary() {
    try {
      
      const response = await api.get('/profile');
      
      
      // Extract badgeProgress and tasccProgress from profile response
      const profileData = response.data;
      const badgeProgress = profileData?.badgeProgress;
      const tasccProgress = profileData?.tasccProgress;
      
      
      // Transform data to match BadgeProgressWidget structure as per specification
      const transformedData = {
        // Current badge information
        currentBadge: badgeProgress?.currentBadge?.name || null,
        currentBadgeDescription: badgeProgress?.currentBadge?.description || null,
        currentBadgeLevel: badgeProgress?.currentBadge?.currentLevel || 1,
        isCurrent: badgeProgress?.currentBadge?.isCurrent || false,
        
        // Points information
        totalPoints: tasccProgress?.totalPoints || 0,
        pointsNeededForNext: badgeProgress?.nextBadge?.pointsNeeded || 0,
        
        // Badge summary
        unlockedBadges: badgeProgress?.summary?.unlockedBadges || 0,
        totalBadges: badgeProgress?.summary?.totalBadges || 10,
        
        // Progress calculation
        progressPercentage: this.calculateProgressPercentage(
          tasccProgress?.totalPoints || 0,
          badgeProgress?.nextBadge?.pointsNeeded || 0
        )
      };
      
      
      return {
        success: true,
        data: transformedData
      };
    } catch (error) {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      return {
        success: false,
        error: error.message || 'Failed to fetch achievements summary'
      };
    }
  }

  /**
   * Calculate progress percentage for next badge
   * @param {number} currentPoints - Current points earned
   * @param {number} pointsNeeded - Points needed for next badge
   * @returns {number} Progress percentage (0-100)
   */
  static calculateProgressPercentage(currentPoints, pointsNeeded) {
    if (pointsNeeded === 0) return 100;
    return Math.min((currentPoints / pointsNeeded) * 100, 100);
  }

  /**
   * Get user badges progress
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  static async getBadgesProgress() {
    try {
      
      const response = await api.get(API_CONFIG.endpoints.achievements.badges);
      
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      return {
        success: false,
        error: error.message || 'Failed to fetch badges progress'
      };
    }
  }

  /**
   * Get user points and level information
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  static async getUserPoints() {
    try {
      
      const response = await api.get(API_CONFIG.endpoints.achievements.points);
      
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      return {
        success: false,
        error: error.message || 'Failed to fetch user points'
      };
    }
  }

  /**
   * Get all available badges
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  static async getAllBadges() {
    try {
      
      const response = await api.get(API_CONFIG.endpoints.achievements.allBadges);
      
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      return {
        success: false,
        error: error.message || 'Failed to fetch all badges'
      };
    }
  }
}

export default AchievementsApi;
