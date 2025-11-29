import api, { debugResponse, safeJsonParse } from './api';
import Config from '../config/env';
import ProgressApi from './progressApi';
import OnboardingApi from './onboardingApi';
import AchievementsApi from './achievementsApi';
import BadgeApi from './badgeApi';

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

      console.log('🌐 Making API call to:', '/onboarding/progress');
      const response = await api.get('/onboarding/progress');
      
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

      console.log('🌐 Making API call to:', '/profile');
      const response = await api.get('/profile');
      
      // Debug response
      debugResponse(response, 'Profile Data');
      
      console.log('✅ Profile data fetched successfully');
      
      // Parse the profile data structure
      const rawData = response.data.data || response.data;
      console.log('👤 Raw profile data:', JSON.stringify(rawData, null, 2));
      console.log('👤 Avatar from API:', rawData.avatar);
      
      // Extract the profile information
      const profileData = {
        id: rawData.id,
        name: rawData.name,
        email: rawData.email,
        firstName: rawData.firstName,
        lastName: rawData.lastName,
        avatar: rawData.avatar, // Add avatar field
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

      console.log('🌐 Making API call to:', '/onboarding/measurements');
      const response = await api.get('/onboarding/measurements');
      
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

      console.log('🌐 Making API call to:', '/tascc/progress');
      const response = await api.get('/tascc/progress');
      
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
    // Removed verbose logging - was cluttering console
    
    const { profile, measurements, tascc } = dashboardData;
    
    // Removed all verbose logging - was cluttering console

    // Validate that we have all required data
    if (!profile) {
      console.warn('⚠️ Profile data missing, using fallback values');
    }
    if (!measurements) {
      console.warn('⚠️ Measurements data missing, using fallback values');
    }
    if (!tascc) {
      console.warn('⚠️ TASCC data missing, using fallback values');
    }

    // Weight progress calculation - use backend data with fallbacks
    const weightInitial = profile?.initialWeight || 70;
    const weightCurrent = measurements?.weight || 67;
    const weightTarget = profile?.targetWeight || 60;
    
    // Removed verbose logging
    
    const weightProgress = this.calculateWeightProgress(
      weightInitial,
      weightCurrent,
      weightTarget
    );

    // Waist progress calculation - use backend data with fallbacks
    const waistInitial = profile?.initialWaistSize || 90;
    const waistCurrent = measurements?.waistSize || 85;
    const waistTarget = profile?.targetWaistSize || 80;
    
    // Removed verbose logging
    
    const waistProgress = this.calculateWaistProgress(
      waistInitial,
      waistCurrent,
      waistTarget
    );

    // Points progress calculation - use backend data with fallbacks
    const pointsCurrent = tascc?.totalPoints || 100;
    const pointsMax = tascc?.maxPoints || 1000;
    
    // Removed verbose logging
    
    const pointsProgress = this.calculatePointsProgress(
      pointsCurrent,
      pointsMax
    );

    const result = {
      weight: weightProgress,
      waist: waistProgress,
      points: pointsProgress,
    };
    
    // Removed verbose logging
    
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
  /**
   * Get progress overview data from profile and measurements endpoints (as per specification)
   * @returns {Promise<Object>} Progress overview data
   */
  static async getProgressOverview() {
    try {
      console.log('📊 DashboardService: Fetching progress data from profile and measurements...');
      
      // Fetch data from both endpoints as per specification
      const [profileRes, measurementsRes] = await Promise.all([
        api.get('/profile'), // Base URL already includes /api/v1
        api.get('/onboarding/measurements') // Base URL already includes /api/v1
      ]);
      
      console.log('📊 DashboardService: Profile data:', profileRes.data);
      console.log('📊 DashboardService: Measurements data:', measurementsRes.data);
      
      // Extract data according to specification
      const profile = profileRes.data?.data?.profile || profileRes.data?.profile;
      const measurements = measurementsRes.data?.data?.measurements || measurementsRes.data?.measurements;
      const tasccProgress = profileRes.data?.data?.tasccProgress || profileRes.data?.tasccProgress;
      
      // Get latest measurement (most recent)
      const latestMeasurement = Array.isArray(measurements) && measurements.length > 0 
        ? measurements[measurements.length - 1] 
        : null;
      
      console.log('📊 DashboardService: Latest measurement:', latestMeasurement);
      
      // Calculate current values with priority order as per specification
      const currentWeight = latestMeasurement?.weight ?? profile?.weight ?? profile?.initialWeight ?? 0;
      const currentWaist = latestMeasurement?.waistSize ?? profile?.waistSize ?? profile?.initialWaistSize ?? 0;
      const currentPoints = tasccProgress?.totalPoints ?? 0;
      
      // Calculate progress percentages as per specification
      const initialWeight = profile?.initialWeight || 0;
      const targetWeight = profile?.targetWeight || 0;
      const initialWaist = profile?.initialWaistSize || 0;
      const targetWaist = profile?.targetWaistSize || 0;
      
      const weightProgress = Math.abs(initialWeight - currentWeight) / Math.abs(initialWeight - targetWeight) * 100;
      const waistProgress = Math.abs(initialWaist - currentWaist) / Math.abs(initialWaist - targetWaist) * 100;
      const pointsProgress = Math.min(currentPoints, 5000) / 5000 * 100; // Cap at 5000 as per spec
      
      const progressData = {
        // Current values
        currentWeight,
        currentWaist,
        currentPoints,
        
        // Initial values
        initialWeight,
        initialWaist,
        
        // Target values
        targetWeight,
        targetWaist,
        
        // Progress percentages
        weightProgress: Math.min(weightProgress, 100),
        waistProgress: Math.min(waistProgress, 100),
        pointsProgress: Math.min(pointsProgress, 100),
        
        // Max values
        maxPoints: 5000
      };
      
      console.log('✅ DashboardService: Progress data calculated successfully:', progressData);
      return progressData;
      
    } catch (error) {
      console.error('❌ DashboardService: Error fetching progress data:', error);
      return await this.getFallbackProgressData();
    }
  }

  /**
   * Get onboarding progress data from the new onboarding endpoint
   * @returns {Promise<Object>} Onboarding progress data
   */
  static async getOnboardingProgress() {
    try {
      console.log('🎯 DashboardService: Fetching onboarding progress from new endpoint...');
      
      const result = await OnboardingApi.getOnboardingProgress();
      
      if (result.success) {
        console.log('✅ DashboardService: Onboarding progress fetched successfully');
        return result.data;
      } else {
        console.log('⚠️ DashboardService: Onboarding progress failed, using fallback');
        // Fallback to existing method if new endpoint fails
        return await this.getFallbackOnboardingData();
      }
    } catch (error) {
      console.error('❌ DashboardService: Error fetching onboarding progress:', error);
      // Fallback to existing method on error
      return await this.getFallbackOnboardingData();
    }
  }

  /**
   * Get achievements summary data using BadgeApi (same as DefisScreen/AchievementsScreen)
   * @returns {Promise<Object>} Achievements summary data
   */
  static async getAchievementsSummary() {
    try {
      console.log('🏆 DashboardService: Fetching achievements summary from BadgeApi (same as DefisScreen/AchievementsScreen)...');
      
      // Use BadgeApi.getAllBadges() - same endpoint as DefisScreen and AchievementsScreen
      const result = await BadgeApi.getAllBadges();
      
      // Also fetch next badge information for accurate "Plus que xpts pour le badge [next badge]" text
      const nextBadgeResult = await BadgeApi.getNextBadge();
      
      if (result.success && result.data) {
        console.log('✅ DashboardService: Badges data fetched successfully');
        
        const badges = result.data.badges || [];
        const summary = result.data.summary || {};
        
        console.log('📊 DashboardService: Badges data structure:', {
          badgesCount: badges.length,
          summary: summary,
          firstBadge: badges[0],
        });
        
        // Find current badge - check summary first, then find from badges array
        // The current badge should be the one with isUnlocked=true and currentLevel > 0
        // Or check if summary has currentBadge field
        let currentBadgeObj = null;
        
        if (summary.currentBadge) {
          // If summary has currentBadge, find it in badges array
          currentBadgeObj = badges.find(b => b.id === summary.currentBadge.id || b.name === summary.currentBadge.name);
        }
        
        // If not found in summary, find first unlocked badge with currentLevel > 0
        if (!currentBadgeObj) {
          currentBadgeObj = badges.find(b => b.isUnlocked && b.currentLevel > 0);
        }
        
        // If still not found, find first unlocked badge
        if (!currentBadgeObj) {
          currentBadgeObj = badges.find(b => b.isUnlocked);
        }
        
        // If still not found, use first badge
        if (!currentBadgeObj && badges.length > 0) {
          currentBadgeObj = badges[0];
        }
        
        // Get points from summary or calculate from badges
        const totalPoints = summary.totalPointsEarned || summary.totalPoints || 0;
        
        // Extract next badge information from the new API endpoint
        // For "Plus que xpts pour completer le badge [current badge name]"
        // We need to use pointsToFinishCurrentBadge (sum of remaining points for all locked levels in current badge)
        let pointsNeededForNext = 0;
        let nextBadgeName = null;
        
        if (nextBadgeResult.success && nextBadgeResult.data) {
          const nextBadgeData = nextBadgeResult.data;
          
          // COMPREHENSIVE LOGGING FOR TROUBLESHOOTING
          console.log('🔍 DashboardService: ========== FULL NEXT BADGE API RESPONSE ==========');
          console.log('📦 Complete nextBadgeResult:', JSON.stringify(nextBadgeResult, null, 2));
          console.log('📦 Complete nextBadgeData object:', JSON.stringify(nextBadgeData, null, 2));
          console.log('📊 Next badge data structure:', {
            allUnlocked: nextBadgeData.allUnlocked,
            hasCurrentWorkingBadge: !!nextBadgeData.currentWorkingBadge,
            currentWorkingBadge: nextBadgeData.currentWorkingBadge,
            hasNextBadge: !!nextBadgeData.nextBadge,
            nextBadge: nextBadgeData.nextBadge,
            pointsToFinishCurrentBadge: nextBadgeData.pointsToFinishCurrentBadge,
            maxPointsForCurrentBadge: nextBadgeData.maxPointsForCurrentBadge,
            pointsToStartNextBadgeLevel1: nextBadgeData.pointsToStartNextBadgeLevel1,
            journeyTotalToNextBadgeLevel1: nextBadgeData.journeyTotalToNextBadgeLevel1,
          });
          
          if (nextBadgeData.currentWorkingBadge) {
            console.log('📊 Current Working Badge details:', {
              id: nextBadgeData.currentWorkingBadge.id,
              displayName: nextBadgeData.currentWorkingBadge.displayName,
              sequenceOrder: nextBadgeData.currentWorkingBadge.sequenceOrder,
              hasNextLevel: !!nextBadgeData.currentWorkingBadge.nextLevel,
              nextLevel: nextBadgeData.currentWorkingBadge.nextLevel,
            });
            
            if (nextBadgeData.currentWorkingBadge.nextLevel) {
              console.log('📊 Next Level details:', {
                level: nextBadgeData.currentWorkingBadge.nextLevel.level,
                pointsRequired: nextBadgeData.currentWorkingBadge.nextLevel.pointsRequired,
                pointsEarned: nextBadgeData.currentWorkingBadge.nextLevel.pointsEarned,
                pointsRemaining: nextBadgeData.currentWorkingBadge.nextLevel.pointsRemaining,
                progressPercent: nextBadgeData.currentWorkingBadge.nextLevel.progressPercent,
                description: nextBadgeData.currentWorkingBadge.nextLevel.description,
              });
            }
            
            // Log remainingLevelsInBadge if available
            if (nextBadgeData.currentWorkingBadge.remainingLevelsInBadge) {
              console.log('📊 Remaining Levels in Badge:', {
                totalPointsRemainingAllLevels: nextBadgeData.currentWorkingBadge.remainingLevelsInBadge.totalPointsRemainingAllLevels,
                levels: nextBadgeData.currentWorkingBadge.remainingLevelsInBadge.levels,
              });
            }
          }
          
          if (nextBadgeData.nextBadge) {
            console.log('📊 Next Badge details:', {
              id: nextBadgeData.nextBadge.id,
              name: nextBadgeData.nextBadge.name,
              displayName: nextBadgeData.nextBadge.displayName,
              icon: nextBadgeData.nextBadge.icon,
              color: nextBadgeData.nextBadge.color,
              sequenceOrder: nextBadgeData.nextBadge.sequenceOrder,
              hasFirstLevel: !!nextBadgeData.nextBadge.firstLevel,
              firstLevel: nextBadgeData.nextBadge.firstLevel,
            });
          }
          
          console.log('🔍 DashboardService: ===================================================');
          
          // Use the next badge API response for accurate next badge information
          if (nextBadgeData.allUnlocked) {
            // All badges unlocked
            console.log('✅ DashboardService: All badges unlocked');
            pointsNeededForNext = 0;
            nextBadgeName = null;
          } else if (nextBadgeData.currentWorkingBadge) {
            // According to API specification:
            // GET /api/v1/mobile/badges/next → use data.pointsToFinishCurrentBadge (remaining points)
            // Also use data.maxPointsForCurrentBadge (total points needed to complete badge)
            const pointsToFinish = nextBadgeData.pointsToFinishCurrentBadge;
            const maxPointsForBadge = nextBadgeData.maxPointsForCurrentBadge;
            
            console.log('🔍 DashboardService: Extracting badge progress fields from API response:', {
              'nextBadgeData object keys': Object.keys(nextBadgeData),
              'pointsToFinishCurrentBadge value': pointsToFinish,
              'pointsToFinishCurrentBadge type': typeof pointsToFinish,
              'maxPointsForCurrentBadge value': maxPointsForBadge,
              'maxPointsForCurrentBadge type': typeof maxPointsForBadge,
            });
            
            // Validate and use pointsToFinishCurrentBadge (remaining points to finish)
            // This should be a number representing remaining points to finish the current badge
            if (pointsToFinish !== undefined && pointsToFinish !== null && !isNaN(pointsToFinish)) {
              pointsNeededForNext = Number(pointsToFinish);
              console.log('✅ DashboardService: Using pointsToFinishCurrentBadge:', pointsNeededForNext);
            } else {
              console.warn('⚠️ DashboardService: pointsToFinishCurrentBadge is invalid, defaulting to 0');
              console.warn('⚠️ DashboardService: Raw value:', pointsToFinish);
              pointsNeededForNext = 0;
            }
            
            // Store maxPointsForCurrentBadge for progress calculation
            // This will be added to transformedData for UI display
            const maxPoints = (maxPointsForBadge !== undefined && maxPointsForBadge !== null && !isNaN(maxPointsForBadge)) 
              ? Number(maxPointsForBadge) 
              : null;
            
            if (maxPoints !== null) {
              console.log('✅ DashboardService: Using maxPointsForCurrentBadge:', maxPoints);
            } else {
              console.warn('⚠️ DashboardService: maxPointsForCurrentBadge is invalid or missing');
            }
            
            // Use current badge name (since we're completing the current badge)
            nextBadgeName = nextBadgeData.currentWorkingBadge.displayName || null;
            
            console.log('✅ DashboardService: Final calculated values:', {
              pointsNeededForNext,
              maxPointsForCurrentBadge: maxPoints,
              nextBadgeName,
              currentBadgeId: nextBadgeData.currentWorkingBadge.id,
              source: 'data.pointsToFinishCurrentBadge and data.maxPointsForCurrentBadge from GET /api/v1/mobile/badges/next',
            });
            
            // Store maxPoints in a variable that will be added to transformedData
            // We'll add this to the transformedData object below
            nextBadgeData._maxPointsForCurrentBadge = maxPoints;
          } else {
            console.warn('⚠️ DashboardService: No currentWorkingBadge in response');
            console.warn('⚠️ DashboardService: Available keys in nextBadgeData:', Object.keys(nextBadgeData));
          }
        } else {
          // Fallback to old logic if next badge API fails
          console.warn('⚠️ DashboardService: Next badge API failed, using fallback logic');
          
          if (currentBadgeObj) {
            // Check if badge has levels array
            if (currentBadgeObj.levels && Array.isArray(currentBadgeObj.levels)) {
              const currentLevel = currentBadgeObj.currentLevel || 0;
              const nextLevel = currentBadgeObj.levels.find(l => l.level === currentLevel + 1);
              if (nextLevel) {
                pointsNeededForNext = Math.max(0, nextLevel.pointsRequired - totalPoints);
                nextBadgeName = currentBadgeObj.name;
              } else {
                // No more levels in current badge, find next badge
                const currentBadgeIndex = badges.findIndex(b => b.id === currentBadgeObj.id || b.name === currentBadgeObj.name);
                if (currentBadgeIndex >= 0 && currentBadgeIndex < badges.length - 1) {
                  const nextBadge = badges[currentBadgeIndex + 1];
                  nextBadgeName = nextBadge?.name || null;
                  if (nextBadge?.levels && nextBadge.levels.length > 0) {
                    const firstLevel = nextBadge.levels[0];
                    pointsNeededForNext = Math.max(0, firstLevel.pointsRequired - totalPoints);
                  }
                }
              }
            } else if (currentBadgeObj.nextLevelPoints) {
              pointsNeededForNext = Math.max(0, currentBadgeObj.nextLevelPoints - totalPoints);
              nextBadgeName = currentBadgeObj.name;
            } else if (summary.pointsNeededForNext) {
              pointsNeededForNext = summary.pointsNeededForNext;
              const currentBadgeIndex = badges.findIndex(b => b.id === currentBadgeObj.id || b.name === currentBadgeObj.name);
              if (currentBadgeIndex >= 0 && currentBadgeIndex < badges.length - 1) {
                nextBadgeName = badges[currentBadgeIndex + 1]?.name || null;
              }
            }
          }
          
          // If next badge name not found, try to find first locked badge
          if (!nextBadgeName && badges.length > 0) {
            const firstLockedBadge = badges.find(b => !b.isUnlocked);
            if (firstLockedBadge) {
              nextBadgeName = firstLockedBadge.name;
            }
          }
        }
        
        // Get maxPointsForCurrentBadge from nextBadgeData if available
        const maxPointsForCurrentBadge = nextBadgeResult.success && nextBadgeResult.data 
          ? (nextBadgeResult.data._maxPointsForCurrentBadge || null)
          : null;
        
        // Calculate progress percentage using maxPointsForCurrentBadge if available
        // Otherwise fallback to the old calculation
        let progressPercentage = 100;
        if (maxPointsForCurrentBadge !== null && maxPointsForCurrentBadge > 0) {
          // Progress = (points earned / max points) * 100
          // Points earned = maxPoints - pointsToFinish
          const pointsEarned = maxPointsForCurrentBadge - pointsNeededForNext;
          progressPercentage = Math.min((pointsEarned / maxPointsForCurrentBadge) * 100, 100);
        } else if (pointsNeededForNext > 0) {
          // Fallback to old calculation
          progressPercentage = Math.min((totalPoints / (totalPoints + pointsNeededForNext)) * 100, 100);
        }
        
        // Transform to match AchievementsCard expected structure
        const transformedData = {
          // Current badge information
          currentBadge: currentBadgeObj?.name || null,
          currentBadgeDescription: currentBadgeObj?.description || null,
          currentBadgeLevel: currentBadgeObj?.currentLevel || 0,
          isCurrent: currentBadgeObj?.isUnlocked && (currentBadgeObj?.currentLevel || 0) > 0,
          
          // Points information
          totalPoints: totalPoints,
          pointsNeededForNext: pointsNeededForNext, // Remaining points to finish current badge
          maxPointsForCurrentBadge: maxPointsForCurrentBadge, // Total points needed to complete current badge
          nextBadgeName: nextBadgeName, // Current badge name (since we're completing it)
          
          // Badge summary
          unlockedBadges: summary.unlockedBadges || badges.filter(b => b.isUnlocked).length || 0,
          totalBadges: summary.totalBadges || badges.length || 10,
          
          // Progress calculation (using maxPointsForCurrentBadge if available)
          progressPercentage: progressPercentage
        };
        
        // LOGGING: Final transformed data that will be passed to AchievementsCard
        console.log('🔍 DashboardService: ========== FINAL TRANSFORMED DATA ==========');
        console.log('📊 Transformed data structure:', JSON.stringify(transformedData, null, 2));
        console.log('📊 Key values for AchievementsCard:', {
          currentBadge: transformedData.currentBadge,
          currentBadgeLevel: transformedData.currentBadgeLevel,
          totalPoints: transformedData.totalPoints,
          pointsNeededForNext: transformedData.pointsNeededForNext,
          nextBadgeName: transformedData.nextBadgeName,
          unlockedBadges: transformedData.unlockedBadges,
          totalBadges: transformedData.totalBadges,
          progressPercentage: transformedData.progressPercentage,
        });
        console.log('🔍 DashboardService: ============================================');
        return transformedData;
      } else {
        console.log('⚠️ DashboardService: Badges data fetch failed, using fallback');
        // Fallback to existing method if new endpoint fails
        return await this.getFallbackAchievementsData();
      }
    } catch (error) {
      console.error('❌ DashboardService: Error fetching achievements summary:', error);
      // Fallback to existing method on error
      return await this.getFallbackAchievementsData();
    }
  }

  /**
   * Fallback method to get onboarding data using existing logic
   * @returns {Promise<Object>} Fallback onboarding data
   */
  static async getFallbackOnboardingData() {
    try {
      console.log('🔄 DashboardService: Using fallback onboarding data...');
      
      // Get dashboard data and extract onboarding info
      const dashboardData = await this.getDashboardData();
      const onboardingData = dashboardData?.onboarding;
      
      return onboardingData || {
        data: {
          completedSteps: [],
          currentStep: 'profile_setup',
          isComplete: false
        }
      };
    } catch (error) {
      console.error('❌ DashboardService: Error in fallback onboarding data:', error);
      return {
        data: {
          completedSteps: [],
          currentStep: 'profile_setup',
          isComplete: false
        }
      };
    }
  }

  /**
   * Fallback method to get achievements data using existing logic
   * @returns {Promise<Object>} Fallback achievements data
   */
  static async getFallbackAchievementsData() {
    try {
      console.log('🔄 DashboardService: Using fallback achievements data...');
      
      // Get dashboard data and extract achievements info
      const dashboardData = await this.getDashboardData();
      const achievementsData = dashboardData?.achievements;
      
      console.log('📊 DashboardService: Raw dashboard achievements data:', achievementsData);
      
      // Transform the data to match expected structure
      const transformedData = {
        totalPoints: achievementsData?.totalPoints || 0,
        currentBadge: achievementsData?.currentBadge || null,
        currentBadgeLevel: achievementsData?.currentBadgeLevel || 1,
        pointsToNextLevel: achievementsData?.pointsToNextLevel || 0,
        unlockedBadges: achievementsData?.unlockedBadges || 0,
        totalBadges: achievementsData?.totalBadges || 10,
        globalProgress: achievementsData?.globalProgress || 0
      };
      
      console.log('📊 DashboardService: Transformed achievements data:', transformedData);
      
      return transformedData;
    } catch (error) {
      console.error('❌ DashboardService: Error in fallback achievements data:', error);
      return {
        totalPoints: 0,
        currentBadge: null,
        currentBadgeLevel: 1,
        pointsToNextLevel: 0,
        unlockedBadges: 0,
        totalBadges: 10,
        globalProgress: 0
      };
    }
  }

  /**
   * Fallback method to get progress data using existing logic
   * @returns {Promise<Object>} Fallback progress data
   */
  static async getFallbackProgressData() {
    try {
      console.log('📊 DashboardService: Using fallback progress data...');
      
      // Get dashboard data and calculate progress
      const dashboardData = await this.getDashboardData();
      const calculatedProgress = this.calculateProgress(dashboardData);
      
      return calculatedProgress;
    } catch (error) {
      console.error('❌ DashboardService: Error in fallback progress data:', error);
      // Return default progress data
      return {
        weight: {
          progress: 0,
          initial: 0,
          current: 0,
          target: 0,
          remaining: 0,
          lost: 0,
        },
        waist: {
          progress: 0,
          initial: 0,
          current: 0,
          target: 0,
          remaining: 0,
          reduced: 0,
        },
        points: {
          progress: 0,
          current: 0,
          max: 0,
          remaining: 0,
        },
      };
    }
  }

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