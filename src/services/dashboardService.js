import api, { debugResponse, safeJsonParse } from './api';
import { API_CONFIG } from '../config/apiConfig';
import Config from '../config/env';

/**
 * Dashboard API Service
 * Handles all API calls related to dashboard data
 */
export class DashboardService {
  /**
   * Get onboarding progress
   * @returns {Promise<Object>} Onboarding progress data
   */
  static async getOnboardingProgress() {
    try {
      console.log('🎯 Fetching onboarding progress...');
      if (Config.OFFLINE_MODE) {
        console.log('📱 Using OFFLINE mode for onboarding progress');
        // Mock data for offline mode
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
          currentStep: 2,
          totalSteps: 6,
          completedSteps: ['profile', 'objectives'],
          isComplete: false,
          nextStep: 'recommendations',
        };
      }

      console.log('🌐 Making API call to:', API_CONFIG.endpoints.onboarding.progress);
      const response = await api.get(API_CONFIG.endpoints.onboarding.progress);
      
      // Debug response
      debugResponse(response, 'Onboarding Progress');
      
      console.log('✅ Onboarding progress fetched successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching onboarding progress:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers
      });
      throw error;
    }
  }

  /**
   * Get user profile data
   * @returns {Promise<Object>} Profile data
   */
  static async getProfile() {
    try {
      console.log('👤 Fetching profile data...');
      if (Config.OFFLINE_MODE) {
        console.log('📱 Using OFFLINE mode for profile');
        // Mock data for offline mode
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
          id: 'user_123',
          name: 'Teddy Tresor',
          email: 'teddmabulay@gmail.com',
          firstName: 'Teddy',
          lastName: 'Tresor',
          initialWeight: 70,
          goalWeight: 60,
          targetWeight: 60,
          initialWaistSize: 90,
          targetWaistSize: 80,
          currentPhase: 'Test',
          hasActiveSubscription: true,
        };
      }

      console.log('🌐 Making API call to:', API_CONFIG.endpoints.profile.get);
      const response = await api.get(API_CONFIG.endpoints.profile.get);
      
      // Debug response
      debugResponse(response, 'Profile Data');
      
      console.log('✅ Profile data fetched successfully');
      
      // Parse the profile data structure
      const rawData = response.data.data || response.data;
      console.log('👤 Raw profile data:', JSON.stringify(rawData, null, 2));
      
      // Extract the profile information
      const profileData = {
        id: rawData.id,
        name: rawData.name,
        email: rawData.email,
        firstName: rawData.firstName,
        lastName: rawData.lastName,
        initialWeight: rawData.profile?.initialWeight,
        goalWeight: rawData.profile?.targetWeight,
        targetWeight: rawData.profile?.targetWeight,
        initialWaistSize: rawData.profile?.initialWaistSize,
        targetWaistSize: rawData.profile?.targetWaistSize,
        currentPhase: rawData.currentPhase,
        hasActiveSubscription: rawData.hasActiveSubscription,
        profile: rawData.profile
      };
      
      // Validate that we have the required data
      if (!profileData.initialWeight || !profileData.targetWeight || !profileData.initialWaistSize || !profileData.targetWaistSize) {
        throw new Error('Profile data is incomplete - missing weight or waist size information');
      }
      
      console.log('👤 Parsed profile data:', profileData);
      return profileData;
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers
      });
      throw error;
    }
  }

  /**
   * Get latest measurements
   * @returns {Promise<Object>} Latest measurements data
   */
  static async getLatestMeasurements() {
    try {
      console.log('📏 Fetching latest measurements...');
      if (Config.OFFLINE_MODE) {
        // Mock data for offline mode
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
          weight: 67,
          waistSize: 89,
          date: new Date().toISOString(),
          measurements: [
            {
              id: 1,
              weight: 67,
              waistSize: 89,
              date: new Date().toISOString(),
              notes: 'Current measurement',
            }
          ]
        };
      }

      console.log('🌐 Making API call to:', API_CONFIG.endpoints.onboarding.measurements.get);
      const response = await api.get(API_CONFIG.endpoints.onboarding.measurements.get);
      
      // Debug response
      debugResponse(response, 'Measurements Data');
      
      console.log('✅ Measurements data fetched successfully');
      
      // Parse the measurements data structure
      const rawData = response.data.data || response.data;
      console.log('📏 Raw measurements data:', JSON.stringify(rawData, null, 2));
      
      // Extract the latest measurement from the array
      let latestMeasurement = null;
      if (rawData.measurements && rawData.measurements.length > 0) {
        // Get the most recent measurement (assuming they're ordered by date)
        latestMeasurement = rawData.measurements[0];
        console.log('📏 Latest measurement found:', latestMeasurement);
      }
      
      // Return the parsed data structure
      const parsedData = {
        weight: latestMeasurement?.weight,
        waistSize: latestMeasurement?.waistSize,
        date: latestMeasurement?.createdAt,
        measurements: rawData.measurements || []
      };
      
      // Validate that we have the required data
      if (parsedData.weight === undefined || parsedData.waistSize === undefined) {
        throw new Error('Latest measurement data is incomplete');
      }
      
      console.log('📏 Parsed measurements data:', parsedData);
      return parsedData;
    } catch (error) {
      console.error('❌ Error fetching measurements:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers
      });
      throw error;
    }
  }

  /**
   * Get T.A.S.C.C. progress data
   * @returns {Promise<Object>} TASCC progress data
   */
  static async getTasccProgress() {
    try {
      console.log('🏆 Fetching TASCC progress...');
      if (Config.OFFLINE_MODE) {
        // Mock data for offline mode
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
          totalPoints: 1300,
          maxPoints: 5000,
          level: 'ELENGI NIVEAU 3',
          currentStreak: 5,
          pointsToNextLevel: 50,
          currentPhase: 'Test',
          achievements: {
            completed: 2,
            total: 125,
          },
          badges: {
            current: 'ELENGI',
            level: 3,
            collected: 1,
            total: 10,
          }
        };
      }

      console.log('🌐 Making API call to:', API_CONFIG.endpoints.tascc.progress);
      const response = await api.get(API_CONFIG.endpoints.tascc.progress);
      
      // Debug response
      debugResponse(response, 'TASCC Progress');
      
      console.log('✅ TASCC progress fetched successfully');
      
      // Parse the TASCC data structure
      const rawData = response.data.data || response.data;
      console.log('🏆 Raw TASCC data:', JSON.stringify(rawData, null, 2));
      
      // Extract the TASCC information
      const tasccData = {
        totalPoints: rawData.totalPoints,
        maxPoints: 5000, // This might need to be fetched from a different endpoint
        level: rawData.level,
        currentStreak: rawData.currentStreak,
        longestStreak: rawData.longestStreak,
        phase: rawData.phase,
        achievements: rawData.achievements || [],
        id: rawData.id,
        userId: rawData.userId
      };
      
      // Validate that we have the required data
      if (tasccData.totalPoints === undefined) {
        throw new Error('TASCC data is incomplete - missing total points');
      }
      
      console.log('🏆 Parsed TASCC data:', tasccData);
      return tasccData;
    } catch (error) {
      console.error('❌ Error fetching TASCC progress:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers
      });
      throw error;
    }
  }

  /**
   * Get all dashboard data in parallel
   * @returns {Promise<Object>} Combined dashboard data
   */
  static async getDashboardData() {
    try {
      console.log('📊 Fetching dashboard data...');
      console.log('🌐 API Base URL:', Config.API_BASE_URL);
      console.log('🔄 OFFLINE_MODE:', Config.OFFLINE_MODE);
      
      // Fetch all data in parallel for better performance
      const [
        onboardingProgress,
        profile,
        measurements,
        tasccProgress
      ] = await Promise.all([
        this.getOnboardingProgress().catch(err => {
          console.warn('⚠️ Onboarding progress fetch failed:', err.message);
          return null;
        }),
        this.getProfile().catch(err => {
          console.warn('⚠️ Profile fetch failed:', err.message);
          return null;
        }),
        this.getLatestMeasurements().catch(err => {
          console.warn('⚠️ Measurements fetch failed:', err.message);
          return null;
        }),
        this.getTasccProgress().catch(err => {
          console.warn('⚠️ TASCC progress fetch failed:', err.message);
          return null;
        })
      ]);

      console.log('✅ Dashboard data fetched successfully');
      console.log('📊 Fetched data summary:', {
        onboarding: onboardingProgress ? 'loaded' : 'null',
        profile: profile ? 'loaded' : 'null', 
        measurements: measurements ? 'loaded' : 'null',
        tascc: tasccProgress ? 'loaded' : 'null'
      });
      
      return {
        onboarding: onboardingProgress,
        profile,
        measurements,
        tascc: tasccProgress,
        fetchedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      throw error;
    }
  }

  /**
   * Calculate progress percentages for circular charts
   * @param {Object} dashboardData - Combined dashboard data
   * @returns {Object} Calculated progress data
   */
  static calculateProgress(dashboardData) {
    console.log('📊 calculateProgress - Input dashboardData:', JSON.stringify(dashboardData, null, 2));
    
    const { profile, measurements, tascc } = dashboardData;
    
    console.log('📊 calculateProgress - Extracted data:', {
      profile: profile ? 'loaded' : 'null',
      measurements: measurements ? 'loaded' : 'null',
      tascc: tascc ? 'loaded' : 'null'
    });
    
    if (profile) {
      console.log('📊 Profile data:', {
        initialWeight: profile.initialWeight,
        goalWeight: profile.goalWeight,
        targetWeight: profile.targetWeight,
        initialWaistSize: profile.initialWaistSize,
        targetWaistSize: profile.targetWaistSize
      });
    }
    
    if (measurements) {
      console.log('📊 Measurements data:', {
        weight: measurements.weight,
        waistSize: measurements.waistSize
      });
    }
    
    if (tascc) {
      console.log('📊 TASCC data:', {
        totalPoints: tascc.totalPoints,
        maxPoints: tascc.maxPoints
      });
    }

    // Validate that we have all required data
    if (!profile) {
      throw new Error('Profile data is required for progress calculation');
    }
    if (!measurements) {
      throw new Error('Measurements data is required for progress calculation');
    }
    if (!tascc) {
      throw new Error('TASCC data is required for progress calculation');
    }

    // Weight progress calculation - use only backend data
    const weightInitial = profile.initialWeight;
    const weightCurrent = measurements.weight;
    const weightTarget = profile.targetWeight;
    
    console.log('📊 Weight calculation inputs:', {
      initial: weightInitial,
      current: weightCurrent,
      target: weightTarget
    });
    
    const weightProgress = this.calculateWeightProgress(
      weightInitial,
      weightCurrent,
      weightTarget
    );

    // Waist progress calculation - use only backend data
    const waistInitial = profile.initialWaistSize;
    const waistCurrent = measurements.waistSize;
    const waistTarget = profile.targetWaistSize;
    
    console.log('📊 Waist calculation inputs:', {
      initial: waistInitial,
      current: waistCurrent,
      target: waistTarget
    });
    
    const waistProgress = this.calculateWaistProgress(
      waistInitial,
      waistCurrent,
      waistTarget
    );

    // Points progress calculation - use only backend data
    const pointsCurrent = tascc.totalPoints;
    const pointsMax = tascc.maxPoints;
    
    console.log('📊 Points calculation inputs:', {
      current: pointsCurrent,
      max: pointsMax
    });
    
    const pointsProgress = this.calculatePointsProgress(
      pointsCurrent,
      pointsMax
    );

    const result = {
      weight: weightProgress,
      waist: waistProgress,
      points: pointsProgress,
    };
    
    console.log('📊 calculateProgress - Final result:', JSON.stringify(result, null, 2));
    
    return result;
  }

  /**
   * Calculate weight progress percentage
   * @param {number} initial - Initial weight
   * @param {number} current - Current weight
   * @param {number} target - Target weight
   * @returns {Object} Weight progress data
   */
  static calculateWeightProgress(initial, current, target) {
    const totalLoss = initial - target;
    const currentLoss = initial - current;
    const progress = totalLoss > 0 ? Math.min(100, Math.max(0, (currentLoss / totalLoss) * 100)) : 0;

    return {
      progress: Math.round(progress),
      initial,
      current,
      target,
      remaining: Math.max(0, current - target),
      lost: Math.max(0, initial - current),
    };
  }

  /**
   * Calculate waist progress percentage
   * @param {number} initial - Initial waist size
   * @param {number} current - Current waist size
   * @param {number} target - Target waist size
   * @returns {Object} Waist progress data
   */
  static calculateWaistProgress(initial, current, target) {
    const totalReduction = initial - target;
    const currentReduction = initial - current;
    const progress = totalReduction > 0 ? Math.min(100, Math.max(0, (currentReduction / totalReduction) * 100)) : 0;

    return {
      progress: Math.round(progress),
      initial,
      current,
      target,
      remaining: Math.max(0, current - target),
      reduced: Math.max(0, initial - current),
    };
  }

  /**
   * Calculate points progress percentage
   * @param {number} current - Current points
   * @param {number} max - Maximum points
   * @returns {Object} Points progress data
   */
  static calculatePointsProgress(current, max) {
    const progress = max > 0 ? Math.min(100, Math.max(0, (current / max) * 100)) : 0;

    return {
      progress: Math.round(progress),
      current,
      max,
      remaining: Math.max(0, max - current),
    };
  }
}

export default DashboardService; 