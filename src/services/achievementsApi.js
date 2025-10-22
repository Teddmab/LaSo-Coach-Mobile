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
      console.log('🏆 AchievementsApi: Fetching achievements summary from profile endpoint...');
      console.log('🌐 API Endpoint:', '/api/v1/profile');
      
      const response = await api.get('/api/v1/profile');
      
      console.log('✅ AchievementsApi: Profile data fetched successfully');
      console.log('📊 Response data:', response.data);
      
      // Extract badgeProgress and tasccProgress from profile response
      const profileData = response.data;
      const badgeProgress = profileData?.badgeProgress;
      const tasccProgress = profileData?.tasccProgress;
      
      console.log('📊 Extracted badgeProgress:', badgeProgress);
      console.log('📊 Extracted tasccProgress:', tasccProgress);
      
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
      
      console.log('📊 Transformed achievements data:', transformedData);
      
      return {
        success: true,
        data: transformedData
      };
    } catch (error) {
      console.error('❌ AchievementsApi: Error fetching achievements summary:', error);
      console.error('❌ Error details:', {
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
      console.log('🏆 AchievementsApi: Fetching badges progress...');
      console.log('🌐 API Endpoint:', API_CONFIG.endpoints.achievements.badges);
      
      const response = await api.get(API_CONFIG.endpoints.achievements.badges);
      
      console.log('✅ AchievementsApi: Badges progress fetched successfully');
      console.log('📊 Response data:', response.data);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ AchievementsApi: Error fetching badges progress:', error);
      console.error('❌ Error details:', {
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
      console.log('🏆 AchievementsApi: Fetching user points...');
      console.log('🌐 API Endpoint:', API_CONFIG.endpoints.achievements.points);
      
      const response = await api.get(API_CONFIG.endpoints.achievements.points);
      
      console.log('✅ AchievementsApi: User points fetched successfully');
      console.log('📊 Response data:', response.data);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ AchievementsApi: Error fetching user points:', error);
      console.error('❌ Error details:', {
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
      console.log('🏆 AchievementsApi: Fetching all badges...');
      console.log('🌐 API Endpoint:', API_CONFIG.endpoints.achievements.allBadges);
      
      const response = await api.get(API_CONFIG.endpoints.achievements.allBadges);
      
      console.log('✅ AchievementsApi: All badges fetched successfully');
      console.log('📊 Response data:', response.data);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ AchievementsApi: Error fetching all badges:', error);
      console.error('❌ Error details:', {
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
