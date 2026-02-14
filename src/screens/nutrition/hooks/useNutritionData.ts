import { useState, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { NutritionPlan, Meal, SubscriptionData, WeekDay } from '../types';
import SubscriptionService from '../../../services/subscriptionService';
import { ProfileApi } from '../../../services/profileApi';
import nutritionAPI from '../../../services/nutritionApi';
import Toast from 'react-native-toast-message';
import { createLogger } from '../../../utils/logger';
import { calculatePlanDayFromDate, findMenuForPlanDay } from '../utils/dateCalculations';
import useCompanionMode from '../../../hooks/useCompanionMode';
import { useIOSSimulation } from '../../../hooks/useIOSSimulation';

const logger = createLogger('useNutritionData');

export const useNutritionData = (
  subscriptionData: SubscriptionData | null,
  setSubscriptionData: (data: SubscriptionData | null) => void,
  weekDays: WeekDay[],
  selectedDate: Date,
  onCompletionStatusFetch: (planId: string) => Promise<void>
) => {
  const { shouldShowIOSOnly } = useIOSSimulation();
  const isIOS = shouldShowIOSOnly();
  const { isCompanionMode } = useCompanionMode();

  const [profileData, setProfileData] = useState<any>(null);
  const [nutritionPlans, setNutritionPlans] = useState<NutritionPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<NutritionPlan | null>(null);
  const [plansResponseStatus, setPlansResponseStatus] = useState<number | null>(null);
  const [dayMeals, setDayMeals] = useState<Meal[]>([]);
  const [tomorrowMeals, setTomorrowMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoadingDayData, setIsLoadingDayData] = useState(false);
  const [isFetchingAllData, setIsFetchingAllData] = useState(false);
  
  const hasInitialLoadRef = useRef(false);
  const lastFetchAttemptRef = useRef<{ planId: string | null; subscriptionId: string | null } | null>(null);

  const fetchAllData = useCallback(async () => {
    // Éviter les appels multiples simultanés
    if (isFetchingAllData) {
      logger.debug('fetchAllData already in progress, skipping...');
      return;
    }

    // ✅ Déclarer en dehors du try pour être accessible dans finally
    let subscription: any = null;
    let loadedPlan: NutritionPlan | null = null;
    
    try {
      setIsFetchingAllData(true);
      setLoading(true);
      logger.group('📥 FETCH ALL DATA - Initial Load');
      logger.info('Starting data fetch for NutritionScreen');
      
      // ✅ COMPLIANCE: In iOS companion mode, still send request but handle response differently
      if (isCompanionMode) {
        logger.info('🍎 iOS COMPANION MODE: Will still send request to backend');
        setSubscriptionData({
          status: 'COMPANION_MODE',
          accessLevel: 'FREE',
          daysRemaining: 0,
          hasActiveSubscription: false,
          subscription: null,
          message: 'Gérez votre abonnement sur le web à lasocoach.com',
          isExpired: false,
          isExpiringSoon: false,
          requiresRenewal: false,
        } as any);
      }
      
      // Step 1: Fetch subscription status FIRST
      logger.debug('API Request: Fetching subscription status first');
      const subscriptionRes = await Promise.allSettled([
        SubscriptionService.getSubscriptionStatus()
      ]).then(results => results[0]);
      
      if (subscriptionRes.status === 'fulfilled') {
        subscription = subscriptionRes.value;
      }
      
      // Step 2: Fetch profile and plans (conditionally based on subscription)
      const hasActiveSubscription = subscription && 
        subscription.daysRemaining !== undefined &&
        subscription.daysRemaining > 0 &&
        subscription.status !== 'EXPIRED' && 
        subscription.status !== 'CANCELLED';
      
      const shouldFetchPlans = isIOS || isCompanionMode || hasActiveSubscription;
      
      logger.debug('Logic: Plans fetch decision', {
        subscriptionStatus: subscription?.status,
        isExpired: subscription?.isExpired,
        hasActiveSubscription,
        isIOS,
        isCompanionMode,
        shouldFetchPlans,
      });
      
      logger.debug('API Request: Fetching profile and nutrition plans');
      const [profileRes, plansRes] = await Promise.allSettled([
        ProfileApi.getProfile(),
        shouldFetchPlans ? nutritionAPI.getPlans() : Promise.resolve({ data: { plans: [] } })
      ]);

      // Handle profile data
      logger.group('👤 PROFILE DATA');
      if (profileRes.status === 'fulfilled') {
        logger.debug('API Response: Profile data received', {
          status: 'success',
          hasData: !!profileRes.value,
        });
        setProfileData(profileRes.value);
        logger.info('Profile data loaded and set in state');
      } else {
        logger.error('API Response: Profile fetch failed', profileRes.reason);
      }
      logger.groupEnd();

      // Handle subscription data
      logger.group('💳 SUBSCRIPTION DATA');
      if (subscriptionRes.status === 'fulfilled') {
        logger.debug('API Response: Subscription data received', {
          status: 'success',
          subscriptionStatus: subscription?.status,
          isExpired: subscription?.isExpired,
          daysRemaining: subscription?.daysRemaining,
        });
        setSubscriptionData(subscription as SubscriptionData);
        logger.info('Subscription data loaded and processed');
      } else {
        logger.error('API Response: Subscription fetch failed', subscriptionRes.reason);
      }
      logger.groupEnd();

      // Handle nutrition plans
      logger.group('🍽️ NUTRITION PLANS DATA');
      if (plansRes.status === 'fulfilled') {
        const plansResponse = plansRes.value;
        const plansData = plansResponse?.data || plansResponse;
        const httpStatus = plansResponse?.status || 200;
        const plansCount = plansData?.data?.plans?.length || plansData?.plans?.length || 0;
        
        setPlansResponseStatus(httpStatus);
        
        logger.debug('API Response: Nutrition plans received', {
          status: 'success',
          httpStatus: `${httpStatus} ${httpStatus === 200 ? 'OK' : ''}`,
          plansCount,
        });
        
        const allPlans = plansData?.data?.plans || plansData?.plans || [];
        setNutritionPlans(allPlans);
        
        // Logic: Set current plan (first active plan or first available)
        const activePlan = allPlans.find((plan: NutritionPlan) => plan.isActive) || allPlans[0];
        logger.debug('Logic: Current plan selection', {
          totalPlans: allPlans.length,
          selectedPlan: activePlan ? {
            id: activePlan.id,
            name: activePlan.name,
            isActive: activePlan.isActive,
          } : null,
        });
        
        // If status is 200, always load and display the plan
        if (httpStatus === 200 && activePlan) {
          setCurrentPlan(activePlan);
          loadedPlan = activePlan;
          logger.info('Current plan set (status 200)', { planName: activePlan.name, planId: activePlan.id });
          
          if (isCompanionMode) {
            logger.info('🍎 iOS COMPANION MODE: Status 200 received, allowing plan display');
            setSubscriptionData({
              status: 'ACTIVE',
              accessLevel: 'ACTIVE',
              daysRemaining: 999,
              hasActiveSubscription: true,
              subscription: {
                status: 'ACTIVE',
                isExpired: false,
              },
              isExpired: false,
              isExpiringSoon: false,
              requiresRenewal: false,
            } as any);
          }
        } else if (activePlan) {
          setCurrentPlan(activePlan);
          loadedPlan = activePlan;
          logger.info('Current plan set', { planName: activePlan.name, planId: activePlan.id });
        } else {
          loadedPlan = null;
          logger.warn('No nutrition plans available', {
            plansCount: 0,
            subscriptionStatus: subscription?.status,
          });
        }
        
        // ✅ IMPORTANT: Charger le statut de complétion UNE SEULE FOIS après avoir chargé le plan
        if (loadedPlan?.id) {
          logger.info('✅ [NutritionScreen] Plan loaded - Fetching completion status');
          await onCompletionStatusFetch(loadedPlan.id);
          logger.info('✅ [NutritionScreen] Completion status loaded');
        }
      } else {
        const errorReason = plansRes.reason as any;
        const errorStatus = errorReason?.response?.status || errorReason?.status || null;
        setPlansResponseStatus(errorStatus);
        
        if (errorStatus === 403) {
          logger.warn('⚠️ [NutritionScreen] 403 Forbidden - Access denied', {
            action: 'Will show locked menu card'
          });
        }
        
        logger.error('API Response: Nutrition plans fetch failed', {
          error: plansRes.reason,
          httpStatus: errorStatus,
        });
      }
      logger.groupEnd();
      logger.groupEnd();

    } catch (error) {
      logger.error('Error fetching all data', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur de chargement',
        text2: 'Impossible de charger les données des menus'
      });
    } finally {
      setLoading(false);
      setIsFetchingAllData(false);
      
      const finalPlanId = loadedPlan?.id || null;
      const finalSubscriptionId = subscription?.subscription?.id || subscription?.id || null;
      lastFetchAttemptRef.current = {
        planId: finalPlanId,
        subscriptionId: finalSubscriptionId,
      };
      
      logger.debug('🔄 [NutritionScreen] fetchAllData completed', {
        hasLoadedPlan: !!loadedPlan,
        hasSubscription: !!subscription,
        loadedPlanId: loadedPlan?.id,
        platform: Platform.OS
      });
      
      // ✅ Ne plus appeler loadDayData ici
      // Le useEffect dans NutritionLayout/DashboardScreen appellera loadDayData avec le currentPlanDay calculé automatiquement
      // Cela garantit que le bon jour est utilisé dès le chargement initial
    }
  }, [isFetchingAllData, isCompanionMode, isIOS, setSubscriptionData, onCompletionStatusFetch]);

  const loadDayData = useCallback(async (planToUse?: NutritionPlan | null, planDayOverride?: number) => {
    const plan = planToUse || currentPlan;
    
    if (!plan?.id) {
      logger.warn('Cannot load day data: No plan ID');
      return;
    }
    
    if (!weekDays || weekDays.length === 0) {
      logger.debug('weekDays not yet available, skipping loadDayData');
      return;
    }
    
    // ✅ Protection contre les appels multiples simultanés
    if (isLoadingDayData) {
      logger.debug('loadDayData already in progress, skipping...');
      return;
    }
    
    try {
      setIsLoadingDayData(true);
      logger.group('🍽️ LOAD DAY DATA');
      logger.info('Loading meals for selected day only');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDateObj = selectedDate instanceof Date ? selectedDate : today;
      selectedDateObj.setHours(0, 0, 0, 0);
      
      // ✅ Utiliser planDayOverride si fourni (calculé automatiquement), sinon calculer
      let menuDay: number;
      if (planDayOverride !== undefined) {
        menuDay = planDayOverride;
        logger.debug('Using provided planDay:', menuDay);
      } else {
        // Determine plan start date
        let planStartDate = today;
        if (subscriptionData?.subscription?.startDate) {
          planStartDate = new Date(subscriptionData.subscription.startDate);
          planStartDate.setHours(0, 0, 0, 0);
        } else if (plan?.startDate) {
          planStartDate = new Date(plan.startDate);
          planStartDate.setHours(0, 0, 0, 0);
        }
        
        // Use shared utility to calculate plan day
        menuDay = calculatePlanDayFromDate(
          selectedDateObj,
          planStartDate,
          plan.numDays || 7
        );
      }
      
      // Use shared utility for consistent menu finding logic
      let dayMenu = findMenuForPlanDay(plan.menus, menuDay);
      
      // Final fallback: use first menu
      if (!dayMenu && plan.menus && plan.menus.length > 0) {
        dayMenu = plan.menus[0];
      }
      
      if (dayMenu) {
        const meals = dayMenu.meals || [];
        setDayMeals(meals);
        
        // Load interaction status for each meal
        const interactionPromises = meals.map(async (meal: Meal) => {
          try {
            const interactionRes = await nutritionAPI.getMealInteraction(meal.id);
            const userInteraction = interactionRes?.data?.userInteraction || 
                                   interactionRes?.data?.data?.userInteraction ||
                                   interactionRes?.userInteraction || 
                                   null;
            
            if (userInteraction) {
              const normalizedInteraction = userInteraction.toLowerCase() === 'like' ? 'like' : 
                                          userInteraction.toLowerCase() === 'dislike' ? 'dislike' : 
                                          null;
              return { mealId: meal.id, interaction: normalizedInteraction };
            }
          } catch (error) {
            logger.debug('Error loading meal interaction', { mealId: meal.id, error });
          }
          return null;
        });
        
        const interactionResults = await Promise.allSettled(interactionPromises);
        // Note: Interactions will be handled by useMealInteractions hook
        
        logger.info('Day meals loaded', { 
          mealsCount: meals.length,
          menuDay: `${menuDay}`,
        });
      } else {
        logger.warn('No menu found for menu day', {
          menuDay,
          availableDays: plan.menus?.map(m => m.day) || [],
          action: 'Setting empty meals array'
        });
        if (plan.menus && plan.menus.length > 0) {
          setDayMeals(plan.menus[0].meals || []);
        } else {
          setDayMeals([]);
        }
      }

      setTomorrowMeals([]);
      
      logger.groupEnd();
      
    } catch (error) {
      logger.error('Error loading day data', error);
    } finally {
      setIsLoadingDayData(false);
    }
  }, [currentPlan, weekDays, selectedDate, subscriptionData]);

  const onRefresh = useCallback(async () => {
    logger.info('User Action: Pull-to-refresh triggered');
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
    logger.info('Refresh completed');
  }, [fetchAllData]);

  return {
    profileData,
    nutritionPlans,
    currentPlan,
    setCurrentPlan,
    plansResponseStatus,
    dayMeals,
    tomorrowMeals,
    loading,
    refreshing,
    isLoadingDayData,
    isFetchingAllData,
    hasInitialLoadRef,
    fetchAllData,
    loadDayData,
    onRefresh,
  };
};

