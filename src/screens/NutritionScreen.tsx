import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Image,
  StatusBar,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  Linking,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import YoutubePlayer from 'react-native-youtube-iframe';
import { theme } from '../constants/theme';
import BlurOverlay from '../components/BlurOverlay';
import SubscriptionBanner from '../components/SubscriptionBanner';
import SubscriptionService from '../services/subscriptionService';
import { ProfileApi } from '../services/profileApi';
import nutritionAPI from '../services/nutritionApi';
import Toast from 'react-native-toast-message';
import { createLogger } from '../utils/logger';
import { ShimmerCard, ShimmerList } from '../components/Shimmer';

// Create logger instance for NutritionScreen
const logger = createLogger('NutritionScreen');

import { NutritionScreenProps } from './nutrition/types';

const NutritionScreen: React.FC<NutritionScreenProps> = ({ user, onLogout, onTabPress, activeTab, onSubscriptionRenew, onFAQPress }) => {
  // State management
  const today = new Date();
  const [currentDate] = useState(today); // Keep current date constant
  const [selectedDate, setSelectedDate] = useState(today.getDate());
  const [selectedDay, setSelectedDay] = useState(today.getDay() || 7); // Use current day of week
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [showBlurOverlay, setShowBlurOverlay] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [nutritionPlans, setNutritionPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [dayMeals, setDayMeals] = useState([]);
  const [tomorrowMeals, setTomorrowMeals] = useState([]);
  const [completionStatus, setCompletionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Meal interaction states
  const [mealInteractions, setMealInteractions] = useState({});
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedMealForFeedback, setSelectedMealForFeedback] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  
  // Selected meal for preview
  const [selectedMeal, setSelectedMeal] = useState(null);
  
  // Tab state for meal preview
  const [activeMealTab, setActiveMealTab] = useState('recipe'); // 'recipe' or 'ingredients' (composition removed)
  
  // YouTube video state
  const [youtubeVideoId, setYoutubeVideoId] = useState(null);
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [youtubePlaying, setYoutubePlaying] = useState(false);
  const [youtubeModalTab, setYoutubeModalTab] = useState('recipe'); // Tab state for YouTube modal (default to recipe, composition removed)
  
  // Meal completion modal state
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [mealsToComplete, setMealsToComplete] = useState([]);
  
  // Full-screen image modal state
  const [showImageModal, setShowImageModal] = useState(false);
  const [fullScreenImageUrl, setFullScreenImageUrl] = useState(null);

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Meal type configuration - minimal UI mapping only
  const mealTypeMap = {
    breakfast: { 
      title: 'Petit-Déj', 
      icon: '🍳', 
      bg: '#E8F5E8',
      time: 'entre 7h30-9h00'
    },
    lunch: { 
      title: 'Déjeuner', 
      icon: '🍽️', 
      bg: '#F0F8FF',
      time: 'entre 12h00-14h00'
    },
    dinner: { 
      title: 'Souper', 
      icon: '🍲', 
      bg: '#FFF8DC',
      time: 'entre 19h00-21h00'
    },
    snack: { 
      title: 'Bonus', 
      icon: '🥤', 
      bg: '#FFF9E6',
      time: 'Snack'
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Mise à jour automatique quand l'écran revient au focus
  useFocusEffect(
    useCallback(() => {
      // Rafraîchir les données quand l'écran revient au focus
      if (currentPlan && subscriptionData) {
        loadDayData();
      } else {
        // Si pas de plan, essayer de charger les données
        fetchAllData();
      }
    }, [currentPlan, subscriptionData])
  );

  useEffect(() => {
    if (currentPlan && subscriptionData) {
      loadDayData();
    }
  }, [currentPlan, selectedDate, subscriptionData]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      logger.group('📥 FETCH ALL DATA - Initial Load');
      logger.info('Starting data fetch for NutritionScreen');
      
      // Step 1: Fetch subscription status FIRST to determine if we should fetch plans
      logger.debug('API Request: Fetching subscription status first');
      const subscriptionRes = await Promise.allSettled([
        SubscriptionService.getSubscriptionStatus()
      ]).then(results => results[0]);
      
      let subscription = null;
      if (subscriptionRes.status === 'fulfilled') {
        subscription = subscriptionRes.value;
      }
      
      // Step 2: Fetch profile and plans (conditionally based on subscription)
      const shouldFetchPlans = subscription && 
        subscription.status !== 'EXPIRED' && 
        subscription.status !== 'CANCELLED' && 
        subscription.status !== 'INACTIVE' &&
        !subscription.isExpired;
      
      logger.debug('Logic: Plans fetch decision', {
        subscriptionStatus: subscription?.status,
        isExpired: subscription?.isExpired,
        shouldFetchPlans,
        reason: shouldFetchPlans 
          ? 'Subscription active - will fetch plans' 
          : 'Subscription expired/inactive - will still fetch plans but expect empty response'
      });
      
      // Always fetch plans (even if expired) to get fresh data, but log expected behavior
      logger.debug('API Request: Fetching profile and nutrition plans');
      const [profileRes, plansRes] = await Promise.allSettled([
        ProfileApi.getProfile(),
        nutritionAPI.getPlans()
      ]);

      // Handle profile data
      logger.group('👤 PROFILE DATA');
      if (profileRes.status === 'fulfilled') {
        logger.debug('API Response: Profile data received', {
          status: 'success',
          hasData: !!profileRes.value,
          fields: profileRes.value ? Object.keys(profileRes.value) : []
        });
        
        // Field mapping
        logger.debug('Field Mapping: Profile data structure', {
          'profile.height': profileRes.value?.Profile?.height,
          'profile.initialWeight': profileRes.value?.Profile?.initialWeight,
          'profile.targetWeight': profileRes.value?.Profile?.targetWeight,
          'profile.initialWaistSize': profileRes.value?.Profile?.initialWaistSize,
          'profile.targetWaistSize': profileRes.value?.Profile?.targetWaistSize,
          'profile.currentPhase': profileRes.value?.currentPhase,
        });
        
        setProfileData(profileRes.value);
        logger.info('Profile data loaded and set in state');
      } else {
        logger.error('API Response: Profile fetch failed', profileRes.reason);
      }
      logger.groupEnd();

      // Handle subscription data (already fetched above)
      logger.group('💳 SUBSCRIPTION DATA');
      if (subscriptionRes.status === 'fulfilled') {
        logger.debug('API Response: Subscription data received', {
          status: 'success',
          subscriptionStatus: subscription?.status,
          isExpired: subscription?.isExpired,
          isExpiringSoon: subscription?.isExpiringSoon,
          daysRemaining: subscription?.daysRemaining,
        });
        
        // Field mapping
        logger.debug('Field Mapping: Subscription data structure', {
          'subscription.status': subscription?.status,
          'subscription.endDate': subscription?.endDate || subscription?.subscription?.endDate,
          'subscription.startDate': subscription?.startDate || subscription?.subscription?.startDate,
          'subscription.isTrial': subscription?.isTrial,
          'subscription.planName': subscription?.planName,
        });
        
        setSubscriptionData(subscription);
        
        // Logic: Check if banner should be displayed
        const status = subscription?.status || subscription?.subscription?.status;
        const isExpired = subscription?.isExpired || false;
        const statusRequiresBanner = status === 'EXPIRED' || 
                                     status === 'CANCELLED' || 
                                     status === 'INACTIVE' ||
                                     isExpired;
        
        logger.debug('Logic: Subscription banner display check', {
          status,
          isExpired,
          statusRequiresBanner,
          willShowBanner: statusRequiresBanner ? 'YES - Banner will be displayed' : 'NO - Banner will not be displayed',
        });
        
        // Logic: Only blur when status is EXPIRED or INACTIVE
        const shouldBlur = subscription?.status === 'EXPIRED' || subscription?.status === 'INACTIVE';
        logger.debug('Logic: Blur overlay decision', {
          subscriptionStatus: subscription?.status,
          shouldBlur,
          action: shouldBlur ? 'Setting blur overlay to true' : 'No blur needed'
        });
        
        if (shouldBlur) {
          setShowBlurOverlay(true);
        }
        logger.info('Subscription data loaded and processed');
      } else {
        logger.error('API Response: Subscription fetch failed', subscriptionRes.reason);
      }
      logger.groupEnd();

      // Handle nutrition plans
      logger.group('🍽️ NUTRITION PLANS DATA');
      if (plansRes.status === 'fulfilled') {
        const plansData = plansRes.value;
        const plansCount = plansData?.data?.plans?.length || 0;
        
        logger.debug('API Response: Nutrition plans received', {
          status: 'success',
          httpStatus: '200 OK',
          requestType: 'GET /nutrition/plans',
          hasData: !!plansData?.data,
          plansCount,
          responseStructure: {
            hasData: !!plansData?.data,
            hasPlansArray: Array.isArray(plansData?.data?.plans),
            plansArrayLength: plansData?.data?.plans?.length || 0,
          }
        });
        
        // Check if empty plans are due to expired subscription
        const isSubscriptionExpired = subscription && (
          subscription.status === 'EXPIRED' || 
          subscription.status === 'CANCELLED' || 
          subscription.status === 'INACTIVE' ||
          subscription.isExpired
        );
        
        if (plansCount === 0) {
          if (isSubscriptionExpired) {
            logger.info('Logic: Empty plans response - Expected behavior', {
              reason: 'Subscription is expired/inactive',
              subscriptionStatus: subscription?.status,
              isExpired: subscription?.isExpired,
              action: 'Backend correctly returns empty plans array for expired subscription',
              userMessage: 'UI will show "Aucun repas planifié" with subscription banner'
            });
          } else {
            logger.warn('Logic: Empty plans response - Unexpected behavior', {
              reason: 'No plans returned but subscription appears active',
              subscriptionStatus: subscription?.status,
              isExpired: subscription?.isExpired,
              action: 'This may indicate a backend issue or user has no plans assigned'
            });
          }
        }
        
        // Field mapping
        logger.debug('Field Mapping: Plans data structure', {
          'data.plans': plansData?.data?.plans?.map(plan => ({
            id: plan.id,
            name: plan.name,
            isActive: plan.isActive,
            numDays: plan.numDays,
            menusCount: plan.menus?.length || 0,
          })) || [],
        });
        
        const allPlans = plansData?.data?.plans || [];
        setNutritionPlans(allPlans);
        
        // Logic: Set current plan (first active plan or first available)
        const activePlan = allPlans.find(plan => plan.isActive) || allPlans[0];
        logger.debug('Logic: Current plan selection', {
          totalPlans: allPlans.length,
          activePlansCount: allPlans.filter(p => p.isActive).length,
          selectedPlan: activePlan ? {
            id: activePlan.id,
            name: activePlan.name,
            isActive: activePlan.isActive,
            numDays: activePlan.numDays,
            selectionReason: activePlan.isActive ? 'First active plan' : 'First available plan'
          } : null,
          result: activePlan ? 'Plan selected' : 'No plan available'
        });
        
        if (activePlan) {
          setCurrentPlan(activePlan);
          logger.info('Current plan set', { planName: activePlan.name, planId: activePlan.id });
        } else {
          logger.warn('No nutrition plans available', {
            plansCount: 0,
            subscriptionStatus: subscription?.status,
            isExpired: subscription?.isExpired,
            reason: isSubscriptionExpired 
              ? 'Expected: Subscription expired, backend returns empty plans' 
              : 'Unexpected: No plans available despite active subscription'
          });
        }
      } else {
        logger.error('API Response: Nutrition plans fetch failed', {
          error: plansRes.reason,
          subscriptionStatus: subscription?.status,
          isExpired: subscription?.isExpired,
          note: 'This is an actual API error, not an empty response'
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
    }
  };

  // Calculate which day in the nutrition plan cycle based on selected date
  const calculateNutritionPlanDay = (selectedDate) => {
    logger.group('📅 CALCULATE PLAN DAY');
    logger.debug('Input: Calculating plan day for selected date', {
      selectedDate: selectedDate?.toDateString?.() || selectedDate,
      subscriptionStartDate: subscriptionData?.subscription?.startDate,
      planNumDays: currentPlan?.numDays,
    });
    
    if (!subscriptionData?.subscription?.startDate || !currentPlan?.numDays) {
      logger.warn('Missing required data for plan day calculation', {
        hasStartDate: !!subscriptionData?.subscription?.startDate,
        hasNumDays: !!currentPlan?.numDays,
        action: 'Returning default day 1'
      });
      logger.groupEnd();
      return 1; // Default to day 1
    }

    const startDate = new Date(subscriptionData.subscription.startDate);
    startDate.setHours(0, 0, 0, 0);
    
    const currentDate = new Date(selectedDate);
    currentDate.setHours(0, 0, 0, 0);
    
    // Calculate days since subscription started (0-indexed)
    const daysSinceStart = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
    
    // Logic: Calculate which day in the plan cycle (1-indexed, repeating)
    // Example: 3-day plan cycles as 1,2,3,1,2,3...
    const planDay = (daysSinceStart % currentPlan.numDays) + 1;
    
    logger.debug('Logic: Plan day calculation', {
      startDate: startDate.toDateString(),
      currentDate: currentDate.toDateString(),
      daysSinceStart,
      planNumDays: currentPlan.numDays,
      calculation: `(${daysSinceStart} % ${currentPlan.numDays}) + 1`,
      result: planDay,
    });
    
    logger.info('Plan day calculated', { 
      calendarDate: currentDate.toDateString(),
      planDay: `${planDay}/${currentPlan.numDays}` 
    });
    logger.groupEnd();
    
    return planDay;
  };

  const loadDayData = async () => {
    if (!currentPlan?.id) {
      logger.warn('Cannot load day data: No current plan ID');
      return;
    }
    
    try {
      logger.group('🍽️ LOAD DAY DATA');
      logger.info('Loading meals for selected day and tomorrow');
      
      // Calculate which day in the nutrition plan cycle for today
      const selectedDateObj = selectedDate ? new Date(today.getFullYear(), today.getMonth(), selectedDate) : today;
      const planDay = calculateNutritionPlanDay(selectedDateObj);
      
      // Calculate tomorrow's date and plan day
      const tomorrow = new Date(selectedDateObj);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowPlanDay = calculateNutritionPlanDay(tomorrow);
      
      logger.debug('Input: Day selection parameters', {
        calendarDate: selectedDate,
        selectedDateObj: selectedDateObj.toDateString(),
        tomorrowDate: tomorrow.toDateString(),
        calculatedPlanDay: planDay,
        tomorrowPlanDay: tomorrowPlanDay,
        currentPlan: {
          id: currentPlan.id,
          name: currentPlan.name,
          numDays: currentPlan.numDays,
          menusCount: currentPlan.menus?.length || 0,
        }
      });
      
      // Logic: Get meals for today (calculated plan day)
      logger.debug('Logic: Finding menu for plan day', {
        planDay,
        availableMenuDays: currentPlan.menus?.map(m => m.day) || [],
        searchCriteria: `menu.day === ${planDay}`
      });
      
      const dayMenu = currentPlan.menus?.find(menu => menu.day === planDay);
      
      if (dayMenu) {
        logger.debug('API Response: Day menu found', {
          menuDay: dayMenu.day,
          mealsCount: dayMenu.meals?.length || 0,
          mealIds: dayMenu.meals?.map(m => ({ id: m.id, name: m.name, type: m.type })) || [],
        });
        
        // Field mapping
        logger.debug('Field Mapping: Day menu structure', {
          'menu.day': dayMenu.day,
          'menu.meals[].id': dayMenu.meals?.map(m => m.id) || [],
          'menu.meals[].name': dayMenu.meals?.map(m => m.name) || [],
          'menu.meals[].type': dayMenu.meals?.map(m => m.type) || [],
          'menu.meals[].imageUrl': dayMenu.meals?.map(m => m.imageUrl ? 'present' : 'missing') || [],
        });
        
        const meals = dayMenu.meals || [];
        setDayMeals(meals);
        
        // Load interaction status for each meal
        const interactionPromises = meals.map(async (meal) => {
          try {
            const interactionRes = await nutritionAPI.getMealInteraction(meal.id);
            logger.debug('Meal interaction response', { 
              mealId: meal.id, 
              response: interactionRes,
              data: interactionRes?.data,
              userInteraction: interactionRes?.data?.userInteraction || interactionRes?.userInteraction
            });
            
            // Handle different response structures
            const userInteraction = interactionRes?.data?.userInteraction || 
                                   interactionRes?.data?.data?.userInteraction ||
                                   interactionRes?.userInteraction || 
                                   null;
            
            if (userInteraction) {
              // Normalize to 'like' or 'dislike' (case-insensitive)
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
        const newInteractions = {};
        interactionResults.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            newInteractions[result.value.mealId] = result.value.interaction;
          }
        });
        
        if (Object.keys(newInteractions).length > 0) {
          setMealInteractions(prev => ({ ...prev, ...newInteractions }));
          logger.debug('Updated meal interactions state', { newInteractions });
        }
        
        logger.info('Day meals loaded', { 
          mealsCount: meals.length,
          planDay: `${planDay}/${currentPlan.numDays}`,
          interactionsLoaded: Object.keys(newInteractions).length
        });
      } else {
        logger.warn('No menu found for plan day', {
          planDay,
          availableDays: currentPlan.menus?.map(m => m.day) || [],
          action: 'Setting empty meals array'
        });
        setDayMeals([]);
      }

      // Logic: Get meals for tomorrow
      logger.debug('Logic: Finding menu for tomorrow plan day', {
        tomorrowPlanDay,
        availableMenuDays: currentPlan.menus?.map(m => m.day) || [],
        searchCriteria: `menu.day === ${tomorrowPlanDay}`
      });
      
      const tomorrowMenu = currentPlan.menus?.find(menu => menu.day === tomorrowPlanDay);
      
      if (tomorrowMenu) {
        logger.debug('API Response: Tomorrow menu found', {
          menuDay: tomorrowMenu.day,
          mealsCount: tomorrowMenu.meals?.length || 0,
          mealIds: tomorrowMenu.meals?.map(m => ({ id: m.id, name: m.name, type: m.type })) || [],
        });
        
        const tomorrowMealsList = tomorrowMenu.meals || [];
        setTomorrowMeals(tomorrowMealsList);
        
        // Load interaction status for tomorrow's meals
        const tomorrowInteractionPromises = tomorrowMealsList.map(async (meal) => {
          try {
            const interactionRes = await nutritionAPI.getMealInteraction(meal.id);
            logger.debug('Tomorrow meal interaction response', { 
              mealId: meal.id, 
              response: interactionRes,
              data: interactionRes?.data,
              userInteraction: interactionRes?.data?.userInteraction || interactionRes?.userInteraction
            });
            
            // Handle different response structures
            const userInteraction = interactionRes?.data?.userInteraction || 
                                   interactionRes?.data?.data?.userInteraction ||
                                   interactionRes?.userInteraction || 
                                   null;
            
            if (userInteraction) {
              // Normalize to 'like' or 'dislike' (case-insensitive)
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
        
        const tomorrowInteractionResults = await Promise.allSettled(tomorrowInteractionPromises);
        const tomorrowNewInteractions = {};
        tomorrowInteractionResults.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            tomorrowNewInteractions[result.value.mealId] = result.value.interaction;
          }
        });
        
        if (Object.keys(tomorrowNewInteractions).length > 0) {
          setMealInteractions(prev => ({ ...prev, ...tomorrowNewInteractions }));
          logger.debug('Updated tomorrow meal interactions state', { tomorrowNewInteractions });
        }
        
        logger.info('Tomorrow meals loaded', { 
          mealsCount: tomorrowMealsList.length,
          planDay: `${tomorrowPlanDay}/${currentPlan.numDays}`,
          interactionsLoaded: Object.keys(tomorrowNewInteractions).length
        });
      } else {
        logger.warn('No menu found for tomorrow plan day', {
          tomorrowPlanDay,
          availableDays: currentPlan.menus?.map(m => m.day) || [],
          action: 'Setting empty meals array'
        });
        setTomorrowMeals([]);
      }

      // Get completion status for the plan day
      logger.debug('API Request: Fetching day completion status', {
        planId: currentPlan.id,
        planDay,
        endpoint: 'nutritionAPI.getDayCompletionStatus'
      });
      
      try {
        const completionData = await nutritionAPI.getDayCompletionStatus(currentPlan.id, planDay);
        logger.debug('API Response: Completion status received', {
          status: 'success',
          hasData: !!completionData,
          completionData,
        });
        setCompletionStatus(completionData);
        logger.info('Completion status loaded');
      } catch (error) {
        logger.error('API Response: Completion status fetch failed', error?.message || error);
        // On ne bloque pas l'écran si ce call échoue : on laisse simplement completionStatus à null
        setCompletionStatus(null);
      }
      
      logger.groupEnd();
      
    } catch (error) {
      logger.error('Error loading day data', error);
    }
  };

  const onRefresh = async () => {
    logger.info('User Action: Pull-to-refresh triggered');
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
    logger.info('Refresh completed');
  };

  const handleSubscriptionRenew = () => {
    logger.info('User Action: Subscription renewal requested');
    logger.debug('Action: Closing blur overlay and navigating to subscription page');
    setShowBlurOverlay(false);
    if (onSubscriptionRenew) {
      onSubscriptionRenew();
    }
  };

  // Meal interaction functions
  const handleMealLike = async (mealId) => {
    logger.group('👍 MEAL LIKE ACTION');
    logger.info('User Action: Meal like button pressed', { mealId });
    
    try {
      // Find meal name from current meals
      const meal = [...dayMeals, ...tomorrowMeals].find(m => m.id === mealId) || selectedMeal;
      const mealName = meal?.name || 'ce repas';
      
      const currentInteraction = mealInteractions[mealId];
      logger.debug('Current state', {
        mealId,
        currentInteraction,
        action: 'POST /meals/{mealId}/like (toggles: if liked removes, if disliked changes to like)'
      });
      
      // API handles toggle behavior: if already liked, removes like; if disliked, changes to like
      logger.debug('API Request: Toggling meal like', { mealId, endpoint: 'POST /meals/{mealId}/like' });
      const response = await nutritionAPI.likeMeal(mealId);
      logger.debug('API Response: Like action completed', { 
        response: response?.data || response,
        userInteraction: response?.data?.userInteraction || response?.userInteraction
      });
      
      // Update state based on API response
      // Response should contain: { userInteraction: 'like' | 'dislike' | null, likeCount, dislikeCount }
      const userInteraction = response?.data?.userInteraction || 
                             response?.data?.data?.userInteraction ||
                             response?.userInteraction || 
                             null;
      
      // Normalize to 'like' or 'dislike' (case-insensitive)
      const updatedInteraction = userInteraction?.toLowerCase() === 'like' ? 'like' : 
                                userInteraction?.toLowerCase() === 'dislike' ? 'dislike' : 
                                null;
      
      logger.debug('API Response parsing', {
        mealId,
        rawResponse: response,
        userInteraction,
        normalizedInteraction: updatedInteraction
      });
      
      setMealInteractions(prev => {
        const updated = { ...prev, [mealId]: updatedInteraction };
        logger.debug('Updated mealInteractions state', { mealId, updatedInteraction, allInteractions: updated });
        return updated;
      });
      
      logger.info('State updated based on API response', { 
        mealId, 
        previousInteraction: currentInteraction,
        newInteraction: updatedInteraction
      });
      
      if (updatedInteraction === 'like') {
        Toast.show({
          type: 'success',
          text1: 'Repas aimé',
          text2: `Vous avez aimé ${mealName}`
        });
      } else {
        Toast.show({
          type: 'success',
          text1: 'Like supprimé',
          text2: `Vous n'avez plus aimé ${mealName}`
        });
      }
      logger.groupEnd();
    } catch (error) {
      logger.error('Error handling meal like', error);
      logger.groupEnd();
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de sauvegarder votre choix'
      });
    }
  };

  const handleMealDislike = async (mealId) => {
    logger.group('👎 MEAL DISLIKE ACTION');
    logger.info('User Action: Meal dislike button pressed', { mealId });
    
    try {
      // Find meal name from current meals
      const meal = [...dayMeals, ...tomorrowMeals].find(m => m.id === mealId) || selectedMeal;
      const mealName = meal?.name || 'ce repas';
      
      const currentInteraction = mealInteractions[mealId];
      logger.debug('Current state', {
        mealId,
        currentInteraction,
        action: 'POST /meals/{mealId}/dislike (toggles: if disliked removes, if liked changes to dislike)'
      });
      
      // API handles toggle behavior: if already disliked, removes dislike; if liked, changes to dislike
      logger.debug('API Request: Toggling meal dislike', { mealId, endpoint: 'POST /meals/{mealId}/dislike' });
      const response = await nutritionAPI.dislikeMeal(mealId);
      logger.debug('API Response: Dislike action completed', { 
        response: response?.data || response,
        userInteraction: response?.data?.userInteraction || response?.userInteraction
      });
      
      // Update state based on API response
      // Response should contain: { userInteraction: 'like' | 'dislike' | null, likeCount, dislikeCount }
      const userInteraction = response?.data?.userInteraction || 
                             response?.data?.data?.userInteraction ||
                             response?.userInteraction || 
                             null;
      
      // Normalize to 'like' or 'dislike' (case-insensitive)
      const updatedInteraction = userInteraction?.toLowerCase() === 'like' ? 'like' : 
                                userInteraction?.toLowerCase() === 'dislike' ? 'dislike' : 
                                null;
      
      logger.debug('API Response parsing', {
        mealId,
        rawResponse: response,
        userInteraction,
        normalizedInteraction: updatedInteraction
      });
      
      setMealInteractions(prev => {
        const updated = { ...prev, [mealId]: updatedInteraction };
        logger.debug('Updated mealInteractions state', { mealId, updatedInteraction, allInteractions: updated });
        return updated;
      });
      
      logger.info('State updated based on API response', { 
        mealId, 
        previousInteraction: currentInteraction,
        newInteraction: updatedInteraction
      });
      
      if (updatedInteraction === 'dislike') {
        Toast.show({
          type: 'success',
          text1: 'Repas non aimé',
          text2: `Vous n'avez pas aimé ${mealName}`
        });
      } else {
        Toast.show({
          type: 'success',
          text1: 'Dislike supprimé',
          text2: `Vous n'avez plus détesté ${mealName}`
        });
      }
      logger.groupEnd();
    } catch (error) {
      logger.error('Error handling meal dislike', error);
      logger.groupEnd();
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de sauvegarder votre choix'
      });
    }
  };

  const handleMealComplete = async (mealId) => {
    console.log('🔵 [MEAL COMPLETE] ==========================================');
    console.log('🔵 [MEAL COMPLETE] Début de la complétion du repas');
    console.log('🔵 [MEAL COMPLETE] mealId:', mealId);
    console.log('🔵 [MEAL COMPLETE] currentPlan:', currentPlan ? { id: currentPlan.id, name: currentPlan.name } : 'null');
    console.log('🔵 [MEAL COMPLETE] selectedDate:', selectedDate);
    console.log('🔵 [MEAL COMPLETE] subscriptionData:', subscriptionData ? { status: subscriptionData.status } : 'null');
    
    logger.group('✅ MEAL COMPLETE ACTION');
    logger.info('User Action: Meal complete button pressed', { mealId });
    
    try {
      // Log détaillé avant l'appel API
      console.log('🔵 [MEAL COMPLETE] Préparation de l\'appel API...');
      console.log('🔵 [MEAL COMPLETE] Endpoint: POST /meals/' + mealId + '/complete');
      
      logger.debug('API Request: Marking meal as complete', { 
        mealId, 
        endpoint: 'POST /meals/{mealId}/complete',
        note: 'Awards 25 points and marks meal as completed',
        currentPlanId: currentPlan?.id,
        currentPlanName: currentPlan?.name,
        selectedDate: selectedDate,
        hasSubscriptionData: !!subscriptionData,
        subscriptionStatus: subscriptionData?.status,
      });
      
      // Préparer les données requises par le backend
      if (!currentPlan?.id) {
        throw new Error('Plan nutritionnel non disponible. Veuillez réessayer.');
      }

      // selectedDate est un nombre (jour du mois), convertir en Date complète
      // Utiliser la même logique que dans loadDayData (ligne 431)
      const selectedDateObj = selectedDate ? new Date(today.getFullYear(), today.getMonth(), selectedDate) : today;

      // Calculer le planDay pour la date sélectionnée
      const planDay = calculateNutritionPlanDay(selectedDateObj);
      
      // Formater la completionDate au format ISO (comme la version web)
      const completionDate = new Date(selectedDateObj);
      completionDate.setHours(0, 0, 0, 0);
      const completionDateISO = completionDate.toISOString().split('T')[0] + 'T00:00:00.000Z';
      
      console.log('🔵 [MEAL COMPLETE] Date calculée:', {
        selectedDate,
        selectedDateObj: selectedDateObj.toISOString(),
        completionDateISO,
        planDay,
        nutritionPlanId: currentPlan.id,
      });

      const completionData = {
        nutritionPlanId: currentPlan.id,
        completionDate: completionDateISO,
        planDay: planDay,
      };

      console.log('🔵 [MEAL COMPLETE] Données à envoyer:', completionData);
      console.log('🔵 [MEAL COMPLETE] Appel API en cours...');
      const response = await nutritionAPI.completeMeal(mealId, completionData);
      console.log('🔵 [MEAL COMPLETE] ✅ Réponse API reçue:', response);
      
      // Log détaillé de la réponse
      logger.debug('API Response: Meal marked as complete successfully', {
        response: response?.data || response,
        responseStatus: response?.status,
        pointsAwarded: response?.data?.pointsAwarded || response?.pointsAwarded || 25,
        hasData: !!response?.data,
        fullResponse: JSON.stringify(response, null, 2),
      });
      
      logger.info('State: Refreshing day data to update completion status');
      Toast.show({
        type: 'success',
        text1: 'Repas terminé',
        text2: `+${response?.data?.pointsAwarded || response?.pointsAwarded || 25} points!`
      });
      
      // Refresh completion status
      if (currentPlan?.id) {
        logger.debug('Refreshing day data after meal completion', {
          planId: currentPlan.id,
          planDay: calculateNutritionPlanDay(selectedDate),
        });
        loadDayData();
      } else {
        logger.warn('Cannot refresh day data: currentPlan is missing', {
          hasCurrentPlan: !!currentPlan,
        });
      }
      console.log('🔵 [MEAL COMPLETE] ✅ Complétion réussie');
      logger.groupEnd();
    } catch (error) {
      // Log détaillé de l'erreur avec console.log pour être sûr de voir l'erreur
      console.error('🔴 [MEAL COMPLETE] ❌ ERREUR DÉTECTÉE ==========================================');
      console.error('🔴 [MEAL COMPLETE] error.message:', error?.message);
      console.error('🔴 [MEAL COMPLETE] error.response?.status:', error?.response?.status);
      console.error('🔴 [MEAL COMPLETE] error.response?.data:', error?.response?.data);
      console.error('🔴 [MEAL COMPLETE] error.code:', error?.code);
      console.error('🔴 [MEAL COMPLETE] error.stack:', error?.stack);
      console.error('🔴 [MEAL COMPLETE] Full error object:', error);
      console.error('🔴 [MEAL COMPLETE] ==========================================');
      
      // Log détaillé de l'erreur
      logger.error('❌ Error completing meal - Full error details', {
        mealId,
        errorMessage: error?.message,
        errorResponse: error?.response?.data,
        errorStatus: error?.response?.status,
        errorCode: error?.code,
        errorStack: error?.stack,
        currentPlanId: currentPlan?.id,
        currentPlanName: currentPlan?.name,
        selectedDate: selectedDate,
        hasSubscriptionData: !!subscriptionData,
        subscriptionStatus: subscriptionData?.status,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
      });
      
      // Gérer l'erreur "already completed" de manière gracieuse
      const errorMessage = error?.response?.data?.message || error?.message || 'Erreur inconnue';
      const isAlreadyCompleted = errorMessage?.toLowerCase().includes('already completed') || 
                                 errorMessage?.toLowerCase().includes('déjà complété');
      
      if (isAlreadyCompleted) {
        // Si le repas est déjà complété, juste rafraîchir les données sans afficher d'erreur
        console.log('ℹ️ [MEAL COMPLETE] Repas déjà complété - Rafraîchissement des données');
        logger.info('Meal already completed - Refreshing data silently');
        
        // Rafraîchir les données pour mettre à jour le statut
        if (currentPlan?.id) {
          loadDayData();
        }
        
        // Ne pas afficher d'erreur, juste un message informatif discret
        Toast.show({
          type: 'info',
          text1: 'Repas déjà complété',
          text2: 'Ce repas a déjà été marqué comme complété',
          visibilityTime: 2000,
        });
      } else {
        // Pour les autres erreurs, afficher le message d'erreur
        logger.error('Error completing meal', error);
        logger.groupEnd();
        
        const errorStatus = error?.response?.status;
        const errorDetails = error?.response?.data;
        
        console.error('🔴 [MEAL COMPLETE] Message d\'erreur pour l\'utilisateur:', errorMessage);
        console.error('🔴 [MEAL COMPLETE] Status HTTP:', errorStatus);
        console.error('🔴 [MEAL COMPLETE] Détails:', errorDetails);
        
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: `Impossible de marquer le repas comme complété: ${errorMessage}`
        });
      }
      
      logger.groupEnd();
    }
  };

  const handleMealFeedback = (meal) => {
    setSelectedMealForFeedback(meal);
    setFeedbackText('');
    setFeedbackRating(5);
    setShowFeedbackModal(true);
  };

  const submitMealFeedback = async () => {
    if (!selectedMealForFeedback) return;
    
    logger.group('💬 SUBMIT MEAL FEEDBACK');
    logger.info('User Action: Submitting meal feedback', {
      mealId: selectedMealForFeedback.id,
      mealName: selectedMealForFeedback.name,
      rating: feedbackRating,
      hasFeedbackText: !!feedbackText,
      feedbackLength: feedbackText.length,
    });
    
    try {
      const feedbackPayload = {
        feedback: feedbackText,
        rating: feedbackRating,
        suggestions: feedbackText // Using feedback as suggestions for now
      };
      
      logger.debug('API Request: Submitting meal feedback', {
        mealId: selectedMealForFeedback.id,
        endpoint: 'nutritionAPI.submitMealFeedback',
        payload: feedbackPayload,
      });
      
      await nutritionAPI.submitMealFeedback(selectedMealForFeedback.id, feedbackPayload);
      
      logger.debug('API Response: Feedback submitted successfully');
      logger.info('State: Closing feedback modal and resetting form');
      
      Toast.show({
        type: 'success',
        text1: 'Feedback envoyé',
        text2: 'Merci pour votre retour détaillé!'
      });
      
      setShowFeedbackModal(false);
      setSelectedMealForFeedback(null);
      logger.groupEnd();
    } catch (error) {
      logger.error('Error submitting feedback', error);
      logger.groupEnd();
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible d\'envoyer votre feedback'
      });
    }
  };

  // Check if a date is outside subscription coverage
  const isDateOutsideSubscription = (date) => {
    logger.group('🗓️ DATE VALIDATION');
    logger.debug('Input: Checking if date is outside subscription', {
      dateToCheck: date?.toDateString?.() || date,
      hasSubscriptionData: !!subscriptionData,
    });
    
    if (!subscriptionData) {
      logger.warn('No subscription data available - allowing date');
      logger.groupEnd();
      return false;
    }
    
    // Field mapping
    logger.debug('Field Mapping: Subscription data for date validation', {
      'subscriptionData.status': subscriptionData.status,
      'subscriptionData.endDate': subscriptionData.endDate,
      'subscriptionData.subscription.endDate': subscriptionData.subscription?.endDate,
    });
    
    // Logic: If subscription is EXPIRED or INACTIVE, all dates are outside
    if (subscriptionData.status === 'EXPIRED' || subscriptionData.status === 'INACTIVE') {
      logger.debug('Logic: Subscription status check', {
        status: subscriptionData.status,
        result: 'Date is outside (subscription expired/inactive)',
        action: 'Returning true'
      });
      logger.groupEnd();
      return true;
    }
    
    // Check if date is after subscription end date
    // endDate might be in subscriptionData.endDate or subscriptionData.subscription.endDate
    const endDateString = subscriptionData.endDate || subscriptionData.subscription?.endDate;
    
    if (endDateString) {
      logger.debug('Logic: Date comparison', {
        endDateFromAPI: endDateString,
        dateToCheck: date?.toDateString?.() || date,
      });
      
      const endDate = new Date(endDateString);
      endDate.setHours(23, 59, 59, 999); // End of day
      
      const dateToCheck = new Date(date);
      dateToCheck.setHours(0, 0, 0, 0); // Start of day
      
      const isOutside = dateToCheck > endDate;
      
      logger.debug('Logic: Date comparison result', {
        dateToCheck: dateToCheck.toISOString(),
        dateToCheckFormatted: dateToCheck.toDateString(),
        endDate: endDate.toISOString(),
        endDateFormatted: endDate.toDateString(),
        comparison: `${dateToCheck.toISOString()} > ${endDate.toISOString()}`,
        result: isOutside ? 'OUTSIDE' : 'INSIDE',
      });
      
      logger.info('Date validation completed', {
        date: dateToCheck.toDateString(),
        isOutside,
      });
      logger.groupEnd();
      
      if (isOutside) {
        return true;
      }
    } else {
      logger.warn('No end date found in subscription data - allowing date');
      logger.groupEnd();
    }
    
    return false;
  };

  // Generate week days centered around current date
  const generateWeekDays = () => {
    const weekDays = [];
    const today = new Date();
    
    // Generate 7 days starting from 3 days before today
    for (let i = -3; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      weekDays.push({
        number: date.getDate(),
        day: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][date.getDay()],
        dayOfWeek: date.getDay() || 7, // Convert Sunday (0) to 7
        date: date,
        isToday: date.toDateString() === today.toDateString(),
        isOutsideSubscription: isDateOutsideSubscription(date)
      });
    }
    return weekDays;
  };

  // Recalculate weekDays whenever subscriptionData changes
  const weekDays = useMemo(() => generateWeekDays(), [subscriptionData]);

  const formatDate = (date) => {
    const months = [
      'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
      'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'
    ];
    
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    
    return `${days[date.getDay()]}, ${date.getDate()}-${months[date.getMonth()]}-${date.getFullYear()}`;
  };

  // Function to sort meals by type in correct order
  const sortMealsByType = (meals) => {
    const typeOrder = ['breakfast', 'lunch', 'dinner', 'snack'];
    return meals.sort((a, b) => {
      return typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
    });
  };

  const renderMealCard = (meal) => {
    const mealType = mealTypeMap[meal.type] || mealTypeMap.breakfast;
    const isCompleted = completionStatus?.dayProgress?.completedMealIds?.includes(meal.id);
    const interaction = mealInteractions[meal.id];
    const isSelected = selectedMeal?.id === meal.id;
    
    logger.debug('Rendering meal card', {
      mealId: meal.id,
      mealName: meal.name,
      mealType: meal.type,
      hasImageUrl: !!meal.imageUrl,
      imageUrl: meal.imageUrl,
      isCompleted,
      interaction,
      isSelected,
    });
    
    return (
      <TouchableOpacity 
        key={meal.id} 
        style={[
          styles.mealCard, 
          { backgroundColor: mealType.bg },
          isSelected && styles.selectedMealCard
        ]}
        onPress={() => {
          setSelectedMeal(meal);
          // Open modal and set up video if available
          if (meal.youtubeUrl) {
            const videoId = getYouTubeVideoId(meal.youtubeUrl);
            if (videoId) {
              setYoutubeVideoId(videoId);
              setYoutubePlaying(true);
            } else {
              setYoutubeVideoId(null);
              setYoutubePlaying(false);
            }
          } else {
            setYoutubeVideoId(null);
            setYoutubePlaying(false);
          }
          setShowYoutubeModal(true);
          logger.info('User Action: Opening meal details modal from meal card', {
            mealId: meal.id,
            hasYoutubeUrl: !!meal.youtubeUrl,
            videoId: meal.youtubeUrl ? getYouTubeVideoId(meal.youtubeUrl) : null
          });
        }}
      >
        <View style={styles.mealContent}>
          {/* Meal Image - Left thumbnail */}
          <View style={styles.mealCardImageContainer}>
            {meal.imageUrl ? (
              <Image 
                source={{ uri: meal.imageUrl }}
                style={styles.mealCardImage}
                resizeMode="cover"
                onError={(error) => logger.warn('Meal image load error', { mealId: meal.id, mealName: meal.name, error })}
                onLoad={() => logger.debug('Meal image loaded successfully', { mealId: meal.id, imageUrl: meal.imageUrl })}
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.placeholderText}>🍽️</Text>
              </View>
            )}
          </View>
          
          {/* Meal Info - Center */}
          <View style={styles.mealInfo}>
            <View style={styles.mealHeader}>
              <Text style={styles.mealTypeTitle}>{mealType.title}</Text>
              <Text style={styles.mealName}>{meal.name || 'Aucun plat'}</Text>
              {mealType.time && (
                <Text style={styles.mealTime}>{mealType.time}</Text>
              )}
            </View>
          </View>

          {/* Icon and Status - Right */}
          <View style={styles.mealRightSection}>
            <Text style={styles.mealIcon}>{mealType.icon}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };


  if (loading) {
    return (
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.sectionContainer}>
          <ShimmerCard />
          <ShimmerCard />
          <ShimmerCard />
          <ShimmerCard />
        </View>
      </ScrollView>
    );
  }

  return (
    <>
      {/* Subscription Banner */}
      <SubscriptionBanner 
        subscriptionData={subscriptionData}
        onRenew={handleSubscriptionRenew}
      />

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Menu du jour section */}
        <View style={styles.menuHeader}>
          <View style={styles.menuTitleRow}>
            <Text style={styles.menuIcon}>🍽️</Text>
            <Text style={styles.menuTitle}>Menu du jour</Text>
            <Text style={styles.menuDate}>{formatDate(currentDate)}</Text>
          </View>
        </View>

        {/* Week Calendar */}
        <View style={styles.calendarContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.calendarContent}
            initialScrollIndex={3}
          >
            {weekDays.map((day) => (
              <TouchableOpacity
                key={day.number + '-' + day.dayOfWeek}
                style={[
                  styles.calendarDay,
                  day.isToday && styles.todayDay,
                  selectedDate === day.number && styles.selectedDay,
                  day.isOutsideSubscription && styles.outsideSubscriptionDay
                ]}
                onPress={() => {
                  if (day.isOutsideSubscription) {
                    // Show alert for dates outside subscription
                    Alert.alert(
                      '⚠️ Hors Abonnement',
                      'Cette date est en dehors de votre période d\'abonnement. Renouvelez votre abonnement pour accéder aux menus.',
                      [
                        { text: 'Annuler', style: 'cancel' },
                        { 
                          text: 'Renouveler', 
                          onPress: () => {
                            if (onSubscriptionRenew) {
                              onSubscriptionRenew();
                            }
                          }
                        }
                      ]
                    );
                  } else {
                    logger.info('User Action: Date selected', {
                      selectedDate: day.number,
                      selectedDayOfWeek: day.dayOfWeek,
                      dayLabel: day.label,
                      isToday: day.isToday,
                      isOutsideSubscription: day.isOutsideSubscription,
                    });
                    setSelectedDate(day.number);
                    setSelectedDay(day.dayOfWeek);
                    // Clear selected meal when date changes
                    setSelectedMeal(null);
                  }
                }}
              >
                <Text style={[
                  styles.dayNumber,
                  day.isToday && styles.todayDayNumber,
                  selectedDate === day.number && styles.selectedDayNumber,
                  day.isOutsideSubscription && styles.outsideSubscriptionText,
                  (day.dayOfWeek === 0 || day.dayOfWeek === 6) && !day.isToday && selectedDate !== day.number && styles.weekendDayNumber
                ]}>
                  {day.number}
                </Text>
                <Text style={[
                  styles.dayName,
                  day.isToday && styles.todayDayName,
                  selectedDate === day.number && styles.selectedDayName,
                  day.isOutsideSubscription && styles.outsideSubscriptionText,
                  (day.dayOfWeek === 0 || day.dayOfWeek === 6) && !day.isToday && selectedDate !== day.number && styles.weekendDayName
                ]}>
                  {day.day}
                </Text>
                {day.isOutsideSubscription && (
                  <Ionicons 
                    name="warning" 
                    size={12} 
                    color="#F44336" 
                    style={styles.warningIcon}
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Meals List */}
        <View style={styles.mealsContainer}>
          {/* Today's Meals */}
          {(dayMeals.length > 0 || tomorrowMeals.length > 0) ? (
            <>
              {dayMeals.length > 0 && (() => {
                // Check if selected date is today
                const selectedDateObj = selectedDate ? new Date(today.getFullYear(), today.getMonth(), selectedDate) : today;
                const isToday = selectedDateObj.toDateString() === today.toDateString();
                const dayLabel = isToday ? 'Aujourd\'hui' : formatDate(selectedDateObj);
                
                return (
                  <>
                    <View style={styles.mealsSectionHeader}>
                      <Text style={styles.mealsSectionTitle}>{dayLabel}</Text>
                    </View>
                    {sortMealsByType(dayMeals).map((meal) => renderMealCard(meal))}
                    
                    {/* Complete All Button - only for today's meals */}
                    {isToday && (
                      <TouchableOpacity
                        style={styles.completeAllMealsButton}
                        onPress={() => {
                          setMealsToComplete(sortMealsByType([...dayMeals]));
                          setShowCompletionModal(true);
                          logger.info('User Action: Open completion modal', { mealsCount: dayMeals.length });
                        }}
                      >
                        <Ionicons name="checkmark-circle-outline" size={20} color={theme.colors.primary} />
                        <Text style={styles.completeAllMealsButtonText}>Marquer comme complétés</Text>
                      </TouchableOpacity>
                    )}
                  </>
                );
              })()}
              
              {/* Tomorrow's Meals */}
              {tomorrowMeals.length > 0 && (() => {
                // Calculate tomorrow's date
                const selectedDateObj = selectedDate ? new Date(today.getFullYear(), today.getMonth(), selectedDate) : today;
                const tomorrow = new Date(selectedDateObj);
                tomorrow.setDate(tomorrow.getDate() + 1);
                const isToday = selectedDateObj.toDateString() === today.toDateString();
                const dayLabel = isToday ? 'Demain' : formatDate(tomorrow);
                
                return (
                  <>
                    <View style={[styles.mealsSectionHeader, { marginTop: dayMeals.length > 0 ? 24 : 0 }]}>
                      <Text style={styles.mealsSectionTitle}>{dayLabel}</Text>
                    </View>
                    {sortMealsByType(tomorrowMeals).map((meal) => renderMealCard(meal))}
                  </>
                );
              })()}
            </>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateIcon}>🍽️</Text>
              <Text style={styles.emptyStateTitle}>Aucun repas planifié</Text>
              <Text style={styles.emptyStateSubtitle}>
                Pas de repas prévus pour aujourd'hui et demain
              </Text>
              <Text style={styles.debugText}>Debug: Selected day: {selectedDay}, Meals count: {dayMeals.length}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Feedback Modal */}
      <Modal
        visible={showFeedbackModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFeedbackModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Feedback sur le repas</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowFeedbackModal(false)}
              >
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

            {selectedMealForFeedback && (
              <View style={styles.modalBody}>
                <Text style={styles.modalMealName}>{selectedMealForFeedback.name}</Text>
                
                <View style={styles.ratingContainer}>
                  <Text style={styles.ratingLabel}>Note:</Text>
                  <View style={styles.starRating}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        onPress={() => setFeedbackRating(star)}
                      >
                        <Ionicons 
                          name={star <= feedbackRating ? "star" : "star-outline"} 
                          size={24} 
                          color="#FFD700" 
                        />
              </TouchableOpacity>
                    ))}
            </View>
          </View>

                <TextInput
                  style={styles.feedbackInput}
                  placeholder="Votre avis sur ce repas..."
                  multiline
                  numberOfLines={4}
                  value={feedbackText}
                  onChangeText={setFeedbackText}
                />
                
                <TouchableOpacity 
                  style={styles.submitFeedbackButton}
                  onPress={submitMealFeedback}
                >
                  <Text style={styles.submitFeedbackButtonText}>Envoyer le feedback</Text>
                </TouchableOpacity>
                    </View>
                      )}
                    </View>
                    </View>
      </Modal>

      {/* YouTube Video Modal */}
      <Modal
        visible={showYoutubeModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowYoutubeModal(false);
          setYoutubePlaying(false);
        }}
      >
        <View style={styles.youtubeModalOverlay}>
          <View style={styles.youtubeModalContent}>
            <View style={styles.youtubeModalHeader}>
              {/* Meal Image - Left */}
              {selectedMeal?.imageUrl && (
                <Image
                  source={{ uri: selectedMeal.imageUrl }}
                  style={styles.youtubeModalHeaderImage}
                  resizeMode="cover"
                />
              )}
              
              {/* Title and Like/Dislike - Right */}
              <View style={styles.youtubeModalTitleAndActionsContainer}>
                <View style={styles.youtubeModalTitleRow}>
                  <View style={styles.youtubeModalTitleContainer}>
                    <Text style={styles.youtubeModalTitle} numberOfLines={1}>
                      {selectedMeal?.name || 'Détails du repas'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setShowYoutubeModal(false);
                      setYoutubePlaying(false);
                    }}
                    style={styles.youtubeModalCloseButton}
                  >
                    <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                  </TouchableOpacity>
                </View>
                
                {/* Like/Dislike Buttons - Below title */}
                {selectedMeal && (
                  <View style={styles.headerInteractionButtons}>
                    <TouchableOpacity 
                      style={[styles.headerInteractionButton, mealInteractions[selectedMeal.id] === 'like' && styles.activeHeaderInteractionButton]}
                      onPress={() => handleMealLike(selectedMeal.id)}
                    >
                      <Ionicons 
                        name={mealInteractions[selectedMeal.id] === 'like' ? "thumbs-up" : "thumbs-up-outline"} 
                        size={20} 
                        color={mealInteractions[selectedMeal.id] === 'like' ? '#1877F2' : '#8E8E93'} 
                      />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.headerInteractionButton, mealInteractions[selectedMeal.id] === 'dislike' && styles.activeHeaderInteractionButton]}
                      onPress={() => handleMealDislike(selectedMeal.id)}
                    >
                      <Ionicons 
                        name={mealInteractions[selectedMeal.id] === 'dislike' ? "thumbs-down" : "thumbs-down-outline"} 
                        size={20} 
                        color={mealInteractions[selectedMeal.id] === 'dislike' ? '#FF3B30' : '#8E8E93'} 
                      />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
            
            <ScrollView 
              style={styles.youtubeModalBody}
              contentContainerStyle={styles.youtubeModalBodyContent}
              showsVerticalScrollIndicator={true}
            >
              {/* YouTube Video */}
              {youtubeVideoId && (() => {
                // Calculate video dimensions based on 16:9 aspect ratio
                const screenWidth = Dimensions.get('window').width;
                const videoWidth = screenWidth - 32; // Account for padding (16 on each side)
                const videoHeight = Math.round((videoWidth * 9) / 16); // 16:9 aspect ratio
                
                logger.debug('YouTube player dimensions', {
                  screenWidth,
                  videoWidth,
                  videoHeight,
                  aspectRatio: (videoWidth / videoHeight).toFixed(2)
                });
                
                return (
                  <View style={[styles.youtubePlayerContainer, { width: videoWidth }]}>
                    <YoutubePlayer
                      height={videoHeight}
                      width={videoWidth}
                      videoId={youtubeVideoId}
                      play={youtubePlaying}
                      onChangeState={(event) => {
                        if (event === 'playing') {
                          setYoutubePlaying(true);
                        } else if (event === 'paused' || event === 'ended') {
                          setYoutubePlaying(false);
                        }
                      }}
                      onReady={() => {
                        logger.debug('YouTube player ready', { videoId: youtubeVideoId });
                      }}
                      onError={(error) => {
                        logger.error('YouTube player error', { videoId: youtubeVideoId, error });
                        Toast.show({
                          type: 'error',
                          text1: 'Erreur',
                          text2: 'Impossible de charger la vidéo'
                        });
                      }}
                      webViewStyle={{ opacity: 0.99 }}
                    />
                  </View>
                );
              })()}
              
              {/* Completion Button - Only for today's meals */}
              {selectedMeal && (() => {
                // Check if meal is from today (in dayMeals) or tomorrow (in tomorrowMeals)
                const isTodayMeal = dayMeals.some(meal => meal.id === selectedMeal.id);
                // Vérifier le statut de complétion de deux façons pour être sûr
                const isCompletedByIds = completionStatus?.dayProgress?.completedMealIds?.includes(selectedMeal.id);
                const isCompletedByStatus = completionStatus?.mealStatus?.[selectedMeal.id]?.completed;
                const isCompleted = isCompletedByIds || isCompletedByStatus;
                
                // Only show completion button for today's meals
                if (!isTodayMeal) {
                  return null;
                }
                
                // Si le repas est déjà complété, afficher un badge au lieu du bouton
                if (isCompleted) {
                  return (
                    <View style={styles.youtubeModalCompletedBadge}>
                      <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                      <Text style={styles.youtubeModalCompletedBadgeText}>
                        Repas complété
                      </Text>
                    </View>
                  );
                }
                
                // Sinon, afficher le bouton actif
                return (
                  <TouchableOpacity 
                    style={styles.youtubeModalCompleteButton}
                    onPress={() => {
                      handleMealComplete(selectedMeal.id);
                      setShowYoutubeModal(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                    <Text style={styles.youtubeModalCompleteButtonText}>
                      Marquer comme complété
                    </Text>
                  </TouchableOpacity>
                );
              })()}
              
              {/* Navigation Tabs - Retirer l'onglet Composition */}
              {selectedMeal && (
                <View style={styles.youtubeModalTabsContainer}>
                  <View style={styles.youtubeModalTabs}>
                    <TouchableOpacity 
                      style={[styles.youtubeModalTab, youtubeModalTab === 'recipe' && styles.activeYoutubeModalTab]}
                      onPress={() => setYoutubeModalTab('recipe')}
                    >
                      <Ionicons 
                        name="restaurant" 
                        size={20} 
                        color={youtubeModalTab === 'recipe' ? "#000000" : "#666666"} 
                      />
                      {youtubeModalTab === 'recipe' && (
                        <Text style={styles.youtubeModalTabTitle}>Instructions</Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.youtubeModalTab, youtubeModalTab === 'ingredients' && styles.activeYoutubeModalTab]}
                      onPress={() => setYoutubeModalTab('ingredients')}
                    >
                      <Ionicons 
                        name="list" 
                        size={20} 
                        color={youtubeModalTab === 'ingredients' ? "#000000" : "#666666"} 
                      />
                      {youtubeModalTab === 'ingredients' && (
                        <Text style={styles.youtubeModalTabTitle}>Ingrédients</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              
              {/* Tab Content - Retirer Composition */}
              {selectedMeal && (() => {
                if (youtubeModalTab === 'recipe') {
                  // Instructions Content
                  return (
                    <View style={styles.youtubeModalTabContent}>
                      <Text style={styles.contentTitle}>Instructions de préparation</Text>
                      {selectedMeal.instructions && selectedMeal.instructions.length > 0 ? (
                        (() => {
                          let instructions = selectedMeal.instructions;
                          if (typeof instructions === 'string') {
                            try {
                              instructions = JSON.parse(instructions);
                            } catch (e) {
                              instructions = [instructions];
                            }
                          }
                          return instructions.map((instruction, index) => (
                            <Text key={index} style={styles.recipeStep}>
                              {index + 1}. {instruction}
                            </Text>
                          ));
                        })()
                      ) : (
                        <Text style={styles.noContentText}>
                          Aucune instruction disponible pour ce repas
                        </Text>
                      )}
                    </View>
                  );
                } else {
                  // Ingredients Content
                  return (
                    <View style={styles.youtubeModalTabContent}>
                      <Text style={styles.contentTitle}>Liste des ingrédients</Text>
                      {(() => {
                        let ingredients = selectedMeal.ingredients;
                        if (typeof ingredients === 'string') {
                          try {
                            ingredients = JSON.parse(ingredients);
                          } catch (e) {
                            ingredients = [];
                          }
                        }
                        
                        return ingredients && ingredients.length > 0 ? (
                          ingredients.map((ingredient, index) => {
                            const ingredientName = typeof ingredient === 'string' ? ingredient : (ingredient.name || ingredient);
                            const ingredientAmount = ingredient.amount;
                            const ingredientUnit = ingredient.unit;
                            
                            return (
                              <View key={index} style={styles.ingredientItem}>
                                <Text style={styles.ingredientNumber}>{index + 1}.</Text>
                                <View style={styles.ingredientDetails}>
                                  <Text style={styles.ingredientText}>
                                    {ingredientName}
                                  </Text>
                                  {ingredientAmount && ingredientUnit && (
                                    <Text style={styles.ingredientAmount}>
                                      – {ingredientAmount} {ingredientUnit}
                                    </Text>
                                  )}
                                </View>
                              </View>
                            );
                          })
                        ) : (
                          <Text style={styles.noContentText}>
                            Aucun ingrédient disponible pour ce repas
                          </Text>
                        );
                      })()}
                    </View>
                  );
                }
              })()}
            </ScrollView>
            
            {/* Logo at bottom center - Baissé */}
            <View style={styles.youtubeModalLogoContainer}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.youtubeModalLogo}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Full-Screen Image Modal */}
      <Modal
        visible={showImageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity
            style={styles.imageModalCloseArea}
            activeOpacity={1}
            onPress={() => setShowImageModal(false)}
          >
            <View style={styles.imageModalHeader}>
              <TouchableOpacity
                onPress={() => setShowImageModal(false)}
                style={styles.imageModalCloseButton}
              >
                <Ionicons name="close" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            {fullScreenImageUrl && (
              <Image
                source={{ uri: fullScreenImageUrl }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            )}
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Meal Completion Modal */}
      <Modal
        visible={showCompletionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCompletionModal(false)}
      >
        <View style={styles.completionModalOverlay}>
          <View style={styles.completionModalContent}>
            <View style={styles.completionModalHeader}>
              <Text style={styles.completionModalTitle}>Marquer des repas comme complétés</Text>
              <TouchableOpacity
                onPress={() => setShowCompletionModal(false)}
                style={styles.completionModalCloseButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.completionModalBody}>
              {mealsToComplete.map((meal) => {
                const mealType = mealTypeMap[meal.type] || mealTypeMap.breakfast;
                const isCompleted = completionStatus?.dayProgress?.completedMealIds?.includes(meal.id);
                
                return (
                  <View key={meal.id} style={styles.completionMealItem}>
                    <View style={styles.completionMealImageContainer}>
                      {meal.imageUrl ? (
                        <Image 
                          source={{ uri: meal.imageUrl }}
                          style={styles.completionMealImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.completionMealPlaceholder}>
                          <Text style={styles.completionMealPlaceholderText}>Meal</Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.completionMealInfo}>
                      <Text style={styles.completionMealName}>{meal.name}</Text>
                      <Text style={styles.completionMealType}>{mealType.title}</Text>
                      <View style={styles.completionMealDetails}>
                        <Text style={styles.completionMealCalories}>
                          {meal.calories || meal.calorieCount || 'N/A'} kcal
                        </Text>
                        <Text style={styles.completionMealPoints}>
                          {meal.points || meal.pointValue || 0} points
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.completionMealActions}>
                      <TouchableOpacity 
                        style={styles.completionStatsButton}
                        onPress={() => {
                          // TODO: Show meal statistics
                          logger.info('User Action: View meal statistics', { mealId: meal.id });
                        }}
                      >
                        <Ionicons name="bar-chart" size={20} color={theme.colors.primary} />
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[
                          styles.completionCheckButton,
                          isCompleted && styles.completionCheckButtonCompleted
                        ]}
                        onPress={async () => {
                          if (isCompleted) {
                            // TODO: Uncomplete meal if needed
                            logger.info('User Action: Meal already completed', { mealId: meal.id });
                          } else {
                            await handleMealComplete(meal.id);
                            // Refresh day data to update completion status
                            if (currentPlan?.id) {
                              loadDayData();
                            }
                            logger.info('User Action: Mark meal as completed from modal', { mealId: meal.id });
                          }
                        }}
                      >
                        {isCompleted ? (
                          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                        ) : (
                          <Ionicons name="checkmark-outline" size={20} color="#FFFFFF" />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
            
            <View style={styles.completionModalFooter}>
              <TouchableOpacity
                style={styles.completeAllButton}
                onPress={async () => {
                  logger.info('User Action: Complete all meals', { mealsCount: mealsToComplete.length });
                  for (const meal of mealsToComplete) {
                    const isCompleted = completionStatus?.dayProgress?.completedMealIds?.includes(meal.id);
                    if (!isCompleted) {
                      await handleMealComplete(meal.id);
                    }
                  }
                  // Refresh day data to update completion status
                  if (currentPlan?.id) {
                    loadDayData();
                  }
                  setShowCompletionModal(false);
                  Toast.show({
                    type: 'success',
                    text1: 'Succès',
                    text2: 'Tous les repas ont été marqués comme complétés'
                  });
                }}
              >
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.completeAllButtonText}>Tout compléter</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.completionCancelButton}
                onPress={() => setShowCompletionModal(false)}
              >
                <Text style={styles.completionCancelButtonText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Blur Overlay for Expired Subscription */}
      <BlurOverlay
        visible={showBlurOverlay}
        onRenew={handleSubscriptionRenew}
      />
      
      <Toast />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20, // Padding réduit car FixedLayout gère déjà l'espace pour la navigation
  },
  sectionContainer: {
    padding: 20,
  },
  menuHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 16,
  },
  menuTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginRight: 16,
  },
  menuDate: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  phasePathContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  phasePathItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  phasePathContent: {
    alignItems: 'center',
    width: '100%',
  },
  phasePathCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    zIndex: 1,
  },
  phasePathCircleCompleted: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  phasePathCircleActive: {
    backgroundColor: '#C8E6C9',
    borderWidth: 3,
    borderColor: '#66BB6A',
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  phasePathLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  phasePathLabelInactive: {
    color: '#9E9E9E',
  },
  phasePathLabelActive: {
    fontSize: 16,
    color: '#2E7D32',
  },
  phasePathName: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 14,
  },
  phasePathNameActive: {
    fontWeight: 'bold',
    color: '#2E7D32',
    fontSize: 12,
  },
  phasePathNameCompleted: {
    color: '#4CAF50',
  },
  phasePathLine: {
    position: 'absolute',
    top: 20,
    left: '60%',
    right: '-40%',
    height: 2,
    backgroundColor: '#E0E0E0',
    zIndex: 0,
  },
  phasePathLineFill: {
    height: '100%',
    width: 0,
    backgroundColor: '#E0E0E0',
  },
  phasePathLineFillCompleted: {
    width: '100%',
    backgroundColor: '#4CAF50',
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  calendarContent: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  calendarDay: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginHorizontal: 6,
    borderRadius: 12,
    minWidth: 65,
    flex: 1,
    maxWidth: 80,
  },
  todayDay: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  selectedDay: {
    backgroundColor: '#7B1FA2',
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  todayDayNumber: {
    color: '#2196F3',
  },
  selectedDayNumber: {
    color: '#FFFFFF',
  },
  dayName: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  todayDayName: {
    color: '#2196F3',
  },
  selectedDayName: {
    color: '#FFFFFF',
  },
  outsideSubscriptionDay: {
    backgroundColor: '#FFEBEE',
    borderWidth: 2,
    borderColor: '#F44336',
    opacity: 0.7,
  },
  outsideSubscriptionText: {
    color: '#F44336',
    fontWeight: '600',
  },
  weekendDayNumber: {
    color: '#FF6B6B',
  },
  weekendDayName: {
    color: '#FF6B6B',
  },
  warningIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  completionStatusCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  completionStatusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  completionProgress: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  mealsContainer: {
    paddingHorizontal: 20,
  },
  mealsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  mealCard: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedMealCard: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  mealContent: {
    flexDirection: 'row',
    height: 80,
  },
  mealCardImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    margin: 0,
    overflow: 'hidden',
  },
  mealCardImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 32,
    color: '#CCCCCC',
  },
  mealInfo: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'space-between',
  },
  mealHeader: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    height: '100%',
  },
  mealTypeTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  mealName: {
    fontSize: 16,
    color: '#000000',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  mealTime: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
  },
  mealRightSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  mealIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  mealDetails: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  mealTime: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  mealNutritionInfo: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  nutritionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nutritionValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  mealActions: {
    alignItems: 'center',
  },
  completedButton: {
    marginBottom: 8,
  },
  interactionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  interactionButton: {
    padding: 12,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  activeInteractionButton: {
    backgroundColor: '#E3F2FD',
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  debugText: {
    fontSize: 12,
    color: '#FF6B35',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalMealName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 20,
  },
  ratingContainer: {
    marginBottom: 20,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  starRating: {
    flexDirection: 'row',
    gap: 8,
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: theme.colors.text.primary,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  submitFeedbackButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitFeedbackButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Meal Preview Card styles
  mealPreviewCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    position: 'relative',
  },
  emptyPreviewContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyPreviewIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyPreviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  emptyPreviewSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  mealPreviewHeader: {
    marginBottom: 16,
  },
  mealPreviewTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  mealPreviewTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  mealPreviewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  mealPreviewType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  mealPreviewTime: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  nutritionalInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 0,
  },
  nutritionalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  nutritionalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  completeButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 24,
    gap: 8,
  },
  completedButtonStyle: {
    backgroundColor: '#4CAF50',
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mealImageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  mealImage: {
    width: '100%',
    height: '100%',
  },
  videoButton: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  videoButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  imageIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 5,
  },
  mealTabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  mealTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'center',
  },
  mealTab: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
    flexDirection: 'column',
  },
  tabTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    marginTop: 4,
  },
  activeMealTab: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  activeMealTabText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  mealTabText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  recipeContent: {
    marginTop: 10,
  },
  recipeStep: {
    fontSize: 14,
    color: theme.colors.text.primary,
    lineHeight: 22,
    marginBottom: 8,
  },
  ingredientsContent: {
    marginTop: 10,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 6,
    gap: 8,
  },
  ingredientDetails: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  ingredientText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  ingredientAmount: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '600',
    marginLeft: 8,
  },
  noIngredientsText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  compositionContent: {
    marginTop: 10,
  },
  nutritionalDataContainer: {
    marginTop: 16,
    gap: 12,
  },
  nutritionalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  nutritionalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  nutritionalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  noContentText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  // Header Interaction Buttons
  headerInteractionButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  headerInteractionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'transparent', // Fond transparent comme demandé
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0, // Pas de bordure pour fond transparent
  },
  activeHeaderInteractionButton: {
    backgroundColor: 'transparent', // Fond transparent même quand actif
  },
  mockDataContent: {
    marginTop: 8,
  },
  mockDataText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    lineHeight: 22,
    marginBottom: 6,
  },
  ingredientNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginRight: 8,
    minWidth: 20,
  },
  // Meals section header
  mealsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  completeAllMealsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 16,
    marginHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  completeAllMealsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  
  // YouTube Modal Styles
  youtubeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  youtubeModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    height: '90%',
    flexDirection: 'column',
  },
  youtubeModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: 12,
  },
  youtubeModalHeaderImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexShrink: 0, // Empêcher la réduction de taille
  },
  youtubeModalTitleAndActionsContainer: {
    flex: 1,
    flexDirection: 'column',
    gap: 8,
  },
  youtubeModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  youtubeModalTitleContainer: {
    flex: 1,
    paddingRight: 8,
  },
  youtubeModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  youtubeModalCloseButton: {
    padding: 4,
  },
  youtubeModalCompleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 8,
    gap: 8,
  },
  youtubeModalCompleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  youtubeModalCompletedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  youtubeModalCompletedBadgeText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  youtubeModalTabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    marginBottom: 8,
  },
  youtubeModalTabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  youtubeModalTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 6,
    minWidth: 100,
    justifyContent: 'center',
  },
  activeYoutubeModalTab: {
    backgroundColor: '#F0F0F0',
  },
  youtubeModalTabTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  youtubeModalTabContent: {
    padding: 20,
    paddingTop: 16,
  },
  youtubeModalBody: {
    flex: 1,
  },
  youtubeModalBodyContent: {
    paddingBottom: 20, // Réduit car footer est maintenant plus bas
    flexGrow: 1,
  },
  youtubePlayerContainer: {
    alignSelf: 'center',
    marginTop: 16,
    marginBottom: 0,
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: '#000000',
  },
  youtubeModalInstructions: {
    padding: 16,
    paddingTop: 8,
  },
  youtubeModalInstructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  youtubeModalInstructionStep: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  youtubeModalStepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  youtubeModalStepNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  youtubeModalInstructionText: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  youtubeModalNoInstructions: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  youtubeModalLogoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8, // Réduit de 16 à 8
    paddingBottom: 20, // Réduit de 100 à 20 pour baisser le footer
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: 'auto', // Push to bottom
  },
  youtubeModalLogo: {
    width: 60,
    height: 30,
    opacity: 0.7,
  },
  
  // Completion Modal Styles
  completionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  completionModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 100, // Espace pour la navigation fixe en bas (hauteur nav + safe area + marge)
  },
  completionModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  completionModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    flex: 1,
  },
  completionModalCloseButton: {
    padding: 4,
  },
  completionModalBody: {
    maxHeight: 500,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  completionMealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  completionMealImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  completionMealImage: {
    width: '100%',
    height: '100%',
  },
  completionMealPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionMealPlaceholderText: {
    fontSize: 10,
    color: '#999999',
  },
  completionMealInfo: {
    flex: 1,
  },
  completionMealName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  completionMealType: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  completionMealDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  completionMealCalories: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  completionMealPoints: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  completionMealActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  completionStatsButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionCheckButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionCheckButtonCompleted: {
    backgroundColor: '#4CAF50',
  },
  completionModalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  completeAllButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  completeAllButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  completionCancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0E0E0',
    paddingVertical: 14,
    borderRadius: 12,
  },
  completionCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  
  // Full-Screen Image Modal Styles
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalCloseArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 100, // Espace pour la navigation fixe en bas (hauteur nav + safe area + marge)
    zIndex: 1,
    alignItems: 'flex-end',
  },
  imageModalCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
});

export default NutritionScreen; 