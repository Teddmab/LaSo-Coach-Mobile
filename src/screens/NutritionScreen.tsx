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
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import YoutubePlayer from 'react-native-youtube-iframe';
import { theme } from '../constants/theme';
import SubscriptionService from '../services/subscriptionService';
import { ProfileApi } from '../services/profileApi';
import nutritionAPI from '../services/nutritionApi';
import Toast from 'react-native-toast-message';
import { createLogger } from '../utils/logger';
import { ShimmerCard, ShimmerList } from '../components/Shimmer';
import { useIOSSimulation } from '../hooks/useIOSSimulation';
import { useAuth } from '../context/FirebaseAuthContext';
import useCompanionMode from '../hooks/useCompanionMode';

// Create logger instance for NutritionScreen
const logger = createLogger('NutritionScreen');

import { 
  NutritionScreenProps, 
  NutritionPlan, 
  Meal, 
  CompletionStatus, 
  SubscriptionData,
  MealInteraction 
} from './nutrition/types';
import { calculatePlanDayFromDate, findMenuForPlanDay, getPlanProgress } from './nutrition/utils/dateCalculations';

const NutritionScreen: React.FC<NutritionScreenProps> = ({ user, onLogout, onTabPress, activeTab, onSubscriptionRenew, onFAQPress }) => {
  const { shouldShowIOSOnly } = useIOSSimulation();
  const isIOS = shouldShowIOSOnly();
  const { refreshProfile } = useAuth();
  const { isCompanionMode } = useCompanionMode();

  // State management
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [currentDate] = useState(today); // Keep current date constant
  const [selectedDate, setSelectedDate] = useState<Date>(today); // Store full date object instead of just day number
  const [selectedDay, setSelectedDay] = useState(today.getDay() || 7); // Use current day of week
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  
  const [profileData, setProfileData] = useState<any>(null);
  const [nutritionPlans, setNutritionPlans] = useState<NutritionPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<NutritionPlan | null>(null);
  const [plansResponseStatus, setPlansResponseStatus] = useState<number | null>(null);
  
  // ✅ ANDROID: Nouveaux comptes sans abonnement actif ne doivent pas avoir accès aux plans
  // ✅ iOS: On garde le comportement actuel (accès complet même sans abonnement)
  // Vérifier si l'utilisateur a un abonnement actif
  // Sur iOS (mode companion), on considère toujours qu'il y a un accès actif
  // Sur Android, on vérifie strictement le statut de l'abonnement
  const hasActiveSubscription = isIOS || isCompanionMode || 
                                 ((subscriptionData as any)?.status === 'ACTIVE' && 
                                  (subscriptionData as any)?.hasActiveSubscription === true &&
                                  !(subscriptionData as any)?.isExpired) ||
                                 ((subscriptionData as any)?.subscription?.status?.toUpperCase() === 'ACTIVE' && 
                                  !(subscriptionData as any)?.isExpired);
  
  // Log pour debug
  if (__DEV__) {
    console.log('🔍 [NutritionScreen] Subscription check:', {
      subscriptionData: subscriptionData ? {
        status: (subscriptionData as any).status,
        hasActiveSubscription: (subscriptionData as any).hasActiveSubscription,
        isExpired: (subscriptionData as any).isExpired,
        subscriptionStatus: (subscriptionData as any).subscription?.status,
      } : null,
      hasActiveSubscription,
      currentPlan: currentPlan ? { id: currentPlan.id, name: currentPlan.name } : null,
      plansResponseStatus,
      willShowLockCard: (!currentPlan || !hasActiveSubscription) && plansResponseStatus !== 200,
    });
  }
  
  // BlurOverlay supprimé - on a toujours un plan FREE par défaut avec accessLevel ACTIVE
  const [dayMeals, setDayMeals] = useState<Meal[]>([]);
  const [tomorrowMeals, setTomorrowMeals] = useState<Meal[]>([]);
  const [completionStatus, setCompletionStatus] = useState<CompletionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Meal interaction states
  const [mealInteractions, setMealInteractions] = useState<MealInteraction>({});
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedMealForFeedback, setSelectedMealForFeedback] = useState<Meal | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  
  // Selected meal for preview
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  
  // Tab state for meal preview
  const [activeMealTab, setActiveMealTab] = useState<'recipe' | 'ingredients'>('recipe');
  
  // YouTube video state
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [youtubePlaying, setYoutubePlaying] = useState(false);
  const [youtubeModalTab, setYoutubeModalTab] = useState<'recipe' | 'ingredients'>('recipe');
  
  // Plan video modal state
  const [showPlanVideoModal, setShowPlanVideoModal] = useState(false);
  const [planVideoId, setPlanVideoId] = useState<string | null>(null);
  const [planVideoPlaying, setPlanVideoPlaying] = useState(false);
  
  // Meal completion modal state
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [mealsToComplete, setMealsToComplete] = useState<Meal[]>([]);
  // ✅ Stocker les données de complétion fraîches pour le filtrage du bottom sheet
  const [freshCompletionData, setFreshCompletionData] = useState<any>(null);
  
  // Full-screen image modal state
  const [showImageModal, setShowImageModal] = useState(false);
  const [fullScreenImageUrl, setFullScreenImageUrl] = useState<string | null>(null);

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string | null | undefined): string | null => {
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
      title: 'Dejeuner', 
      icon: '🍽️', 
      bg: '#F0F8FF',
      time: 'entre 12h00-14h00'
    },
    snack: { 
      title: 'Collation', 
      icon: '🥤', 
      bg: '#FFF9E6',
      time: 'à 16h'
    },
    dinner: { 
      title: 'Souper', 
      icon: '🍲', 
      bg: '#FFF8DC',
      time: 'entre 18h00-20h00'
    },
   
  };

  // Flag pour éviter les appels multiples simultanés
  const [isLoadingDayData, setIsLoadingDayData] = useState(false);
  const [isFetchingAllData, setIsFetchingAllData] = useState(false);
  const hasInitialLoadRef = React.useRef(false);
  const lastFetchAttemptRef = React.useRef<{ planId: string | null; subscriptionId: string | null } | null>(null);

  useEffect(() => {
    console.log('🔄 [NutritionScreen] useEffect - Démarrage du chargement initial');
    fetchAllData();
    hasInitialLoadRef.current = true;
  }, []);

  // Mise à jour automatique quand l'écran revient au focus
  useFocusEffect(
    useCallback(() => {
      // Ne rien faire si on est déjà en train de charger
      if (isFetchingAllData || isLoadingDayData) {
        return;
      }

      // Rafraîchir les données quand l'écran revient au focus
      if (currentPlan && subscriptionData && !isLoadingDayData) {
        // Si on a un plan et une subscription, charger les données du jour
        loadDayData();
      } else if (!hasInitialLoadRef.current) {
        // Seulement charger si c'est le premier chargement (ne devrait pas arriver ici car fait dans useEffect)
        fetchAllData();
      }
      // Si on a déjà chargé mais qu'il n'y a toujours pas de plan,
      // ne pas recharger indéfiniment - juste laisser l'UI afficher l'état vide
      // Le useFocusEffect ne doit pas déclencher de rechargement si on n'a pas de plan
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPlan?.id, subscriptionData])
  );

  // Use selectedDate timestamp for dependency to ensure React detects changes
  const selectedDateKey = selectedDate instanceof Date ? selectedDate.getTime() : selectedDate;
  
  // Check if a date is outside subscription coverage
  const isDateOutsideSubscription = (date: Date) => {
    // If status is 200, no restrictions on calendar
    if (plansResponseStatus === 200) {
      return false;
    }
    
    // Réduire les logs pour éviter la répétition excessive
    if (!subscriptionData) {
      return false;
    }
    
    // Logic: If subscription is EXPIRED or INACTIVE, all dates are outside
    if ((subscriptionData as any).status === 'EXPIRED' || (subscriptionData as any).status === 'INACTIVE') {
      return true;
    }
    
    // Check if date is after subscription end date
    // endDate might be in subscriptionData.endDate or subscriptionData.subscription.endDate
    const endDateString = (subscriptionData as any).endDate || subscriptionData.subscription?.endDate;
    
    if (endDateString) {
      const endDate = new Date(endDateString);
      endDate.setHours(23, 59, 59, 999); // End of day
      
      const dateToCheck = new Date(date);
      dateToCheck.setHours(0, 0, 0, 0); // Start of day
      
      const isOutside = dateToCheck > endDate;
      
      if (isOutside) {
        return true;
      }
    }
    
    return false;
  };
  
  // Generate week days starting from plan start date (or today if start date is in the past)
  const generateWeekDays = () => {
    const weekDays = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Determine start date: use plan start date if available, otherwise use today
    let startDate = today;
    if (subscriptionData?.subscription?.startDate && currentPlan) {
      const planStartDate = new Date(subscriptionData.subscription.startDate);
      planStartDate.setHours(0, 0, 0, 0);
      // Use plan start date if it's today or in the future, otherwise use today
      if (planStartDate >= today) {
        startDate = planStartDate;
      }
    }
    
    // Generate 7 days starting from start date (no past dates)
    for (let i = 0; i <= 6; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isPast = date < today;
      
      weekDays.push({
        number: date.getDate(),
        day: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][date.getDay()],
        dayOfWeek: date.getDay() || 7, // Convert Sunday (0) to 7
        date: date,
        isToday: date.toDateString() === today.toDateString(),
        isOutsideSubscription: isDateOutsideSubscription(date),
        isPast: isPast
      });
    }
    return weekDays;
  };

  // Recalculate weekDays whenever subscriptionData, plansResponseStatus, or currentPlan changes
  const weekDays = useMemo(() => generateWeekDays(), [subscriptionData, plansResponseStatus, currentPlan]);
  
  useEffect(() => {
    // ✅ FIX: Call loadDayData when currentPlan and weekDays are ready
    // This ensures meals load on initial page load
    if (currentPlan && subscriptionData && weekDays && weekDays.length > 0 && !isLoadingDayData) {
      console.log('🔄 [NutritionScreen] useEffect triggered - loading day data', {
        selectedDate: selectedDate instanceof Date ? selectedDate.toDateString() : selectedDate,
        selectedDateKey,
        currentPlanId: currentPlan.id,
        weekDaysCount: weekDays.length,
        subscriptionStatus: (subscriptionData as any)?.status,
        trigger: 'useEffect dependency changed',
      });
      // ✅ FIX: Appeler loadDayData() immédiatement quand toutes les conditions sont remplies
      loadDayData();
    } else {
      // Log pour debug si les conditions ne sont pas remplies
      if (__DEV__) {
        console.log('⚠️ [NutritionScreen] useEffect - conditions not met for loadDayData', {
          hasCurrentPlan: !!currentPlan,
          hasSubscriptionData: !!subscriptionData,
          hasWeekDays: !!weekDays,
          weekDaysLength: weekDays?.length || 0,
          isLoadingDayData,
          reason: !currentPlan ? 'No currentPlan' : 
                  !subscriptionData ? 'No subscriptionData' :
                  !weekDays || weekDays.length === 0 ? 'No weekDays' :
                  isLoadingDayData ? 'Already loading' : 'Unknown'
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlan?.id, selectedDateKey, subscriptionData?.subscription?.startDate, weekDays?.length, subscriptionData?.status]);

  const fetchAllData = async () => {
    // Éviter les appels multiples simultanés
    if (isFetchingAllData) {
      logger.debug('fetchAllData already in progress, skipping...');
      return;
    }

    try {
      setIsFetchingAllData(true);
      setLoading(true);
      logger.group('📥 FETCH ALL DATA - Initial Load');
      logger.info('Starting data fetch for NutritionScreen');
      
      // ✅ COMPLIANCE: In iOS companion mode, still send request but handle response differently
      if (isCompanionMode) {
        logger.info('🍎 iOS COMPANION MODE: Will still send request to backend');
        // Set companion mode subscription data but still fetch plans
        setSubscriptionData({
          status: 'COMPANION_MODE',
          accessLevel: 'FREE',
          daysRemaining: 0,
          hasActiveSubscription: false,
          subscription: null,
          message: 'Manage your subscription on the web at lasocoach.com',
          isExpired: false,
          isExpiringSoon: false,
          requiresRenewal: false,
        } as any);
        // Continue to fetch plans - don't return early
      }
      
      // Step 1: Fetch subscription status FIRST to determine if we should fetch plans
      logger.debug('API Request: Fetching subscription status first');
      const subscriptionRes = await Promise.allSettled([
        SubscriptionService.getSubscriptionStatus()
      ]).then(results => results[0]);
      
      let subscription = null;
      let loadedPlan = null; // Pour tracker le plan chargé
      if (subscriptionRes.status === 'fulfilled') {
        subscription = subscriptionRes.value;
      }
      
      // Step 2: Fetch profile and plans (conditionally based on subscription)
      // ✅ ANDROID: Nouveaux comptes sans abonnement actif ne doivent pas avoir accès aux plans
      // ✅ iOS: On garde le comportement actuel (accès complet même sans abonnement)
      const hasActiveSubscription = subscription && 
        subscription.status === 'ACTIVE' && 
        subscription.status !== 'EXPIRED' && 
        subscription.status !== 'CANCELLED' && 
        subscription.status !== 'INACTIVE' &&
        !subscription.isExpired;
      
      // Sur Android, on ne fetch les plans que si l'utilisateur a un abonnement actif
      // Sur iOS (mode companion), on fetch toujours les plans (accès complet)
      const shouldFetchPlans = isIOS || isCompanionMode || hasActiveSubscription;
      
      logger.debug('Logic: Plans fetch decision', {
        subscriptionStatus: subscription?.status,
        isExpired: subscription?.isExpired,
        hasActiveSubscription,
        isIOS,
        isCompanionMode,
        shouldFetchPlans,
        reason: shouldFetchPlans 
          ? (isIOS || isCompanionMode ? 'iOS companion mode - full access' : 'Subscription active - will fetch plans')
          : 'Android: No active subscription - will not fetch plans'
      });
      
      logger.debug('API Request: Fetching profile and nutrition plans');
      console.log('🔄 [NutritionScreen] Envoi des requêtes API (profile + nutrition plans)');
      const [profileRes, plansRes] = await Promise.allSettled([
        ProfileApi.getProfile(),
        shouldFetchPlans ? nutritionAPI.getPlans() : Promise.resolve({ data: { plans: [] } })
      ]);
      console.log('✅ [NutritionScreen] Requêtes API terminées', {
        profileStatus: profileRes.status,
        plansStatus: plansRes.status,
      });

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
          'subscription.endDate': (subscription as any)?.endDate || (subscription as any)?.subscription?.endDate,
          'subscription.startDate': (subscription as any)?.startDate || (subscription as any)?.subscription?.startDate,
          'subscription.isTrial': (subscription as any)?.isTrial,
          'subscription.planName': (subscription as any)?.planName,
        });
        
        setSubscriptionData(subscription as SubscriptionData);
        
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
        
        // BlurOverlay supprimé - on a toujours un plan FREE par défaut avec accessLevel ACTIVE
        logger.info('Subscription data loaded and processed');
      } else {
        logger.error('API Response: Subscription fetch failed', subscriptionRes.reason);
      }
      logger.groupEnd();

      // Handle nutrition plans
      logger.group('🍽️ NUTRITION PLANS DATA');
      if (plansRes.status === 'fulfilled') {
        const plansResponse = plansRes.value;
        const plansData = plansResponse?.data || plansResponse; // Support both old and new format
        const httpStatus = plansResponse?.status || 200; // Default to 200 if not provided
        const plansCount = plansData?.data?.plans?.length || plansData?.plans?.length || 0;
        
        // Store HTTP status for lock card logic
        setPlansResponseStatus(httpStatus);
        
        logger.debug('API Response: Nutrition plans received', {
          status: 'success',
          httpStatus: `${httpStatus} ${httpStatus === 200 ? 'OK' : ''}`,
          requestType: 'GET /nutrition/plans',
          hasData: !!plansData?.data || !!plansData,
          plansCount,
          responseStructure: {
            hasData: !!plansData?.data || !!plansData,
            hasPlansArray: Array.isArray(plansData?.data?.plans) || Array.isArray(plansData?.plans),
            plansArrayLength: plansData?.data?.plans?.length || plansData?.plans?.length || 0,
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
          'data.plans': plansData?.data?.plans?.map((plan: NutritionPlan) => ({
            id: plan.id,
            name: plan.name,
            isActive: plan.isActive,
            numDays: plan.numDays,
            menusCount: plan.menus?.length || 0,
          })) || [],
        });
        
        const allPlans = plansData?.data?.plans || plansData?.plans || [];
        setNutritionPlans(allPlans);
        
        // Logic: Set current plan (first active plan or first available)
        const activePlan = allPlans.find((plan: NutritionPlan) => plan.isActive) || allPlans[0];
        logger.debug('Logic: Current plan selection', {
          totalPlans: allPlans.length,
          activePlansCount: allPlans.filter((p: NutritionPlan) => p.isActive).length,
          selectedPlan: activePlan ? {
            id: activePlan.id,
            name: activePlan.name,
            isActive: activePlan.isActive,
            numDays: activePlan.numDays,
            selectionReason: activePlan.isActive ? 'First active plan' : 'First available plan'
          } : null,
          result: activePlan ? 'Plan selected' : 'No plan available'
        });
        
        // If status is 200, always load and display the plan (even in iOS companion mode)
        if (httpStatus === 200 && activePlan) {
          setCurrentPlan(activePlan);
          loadedPlan = activePlan; // Sauvegarder pour la référence
          logger.info('Current plan set (status 200)', { planName: activePlan.name, planId: activePlan.id, isCompanionMode });
          
          // If in companion mode but status is 200, update subscription data to allow plan display
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
          loadedPlan = activePlan; // Sauvegarder pour la référence
          logger.info('Current plan set', { planName: activePlan.name, planId: activePlan.id });
        } else {
          loadedPlan = null; // Pas de plan chargé
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
        // Handle error case - set status from error response if available
        const errorReason = plansRes.reason as any;
        const errorStatus = errorReason?.response?.status || errorReason?.status || null;
        const errorMessage = errorReason?.response?.data?.message || errorReason?.message || '';
        const errorMessageLower = errorMessage.toLowerCase();
        
        setPlansResponseStatus(errorStatus);
        
        // Log error status for debugging
        if (errorStatus === 403) {
          logger.warn('⚠️ [NutritionScreen] 403 Forbidden - Access denied', {
            errorMessage,
            subscriptionStatus: subscription?.status,
            isExpired: subscription?.isExpired,
            action: 'Will show locked menu card'
          });
        }
        
        logger.error('API Response: Nutrition plans fetch failed', {
          error: plansRes.reason,
          httpStatus: errorStatus,
          errorMessage,
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
      setIsFetchingAllData(false);
      
      // Mettre à jour la référence du dernier état chargé pour éviter les boucles
      // Utiliser les valeurs locales chargées plutôt que l'état qui peut ne pas être à jour
      // Note: loadedPlan et subscription sont des variables locales dans le scope try
      const finalPlanId = loadedPlan?.id || currentPlan?.id || null;
      const finalSubscriptionId = subscription?.subscription?.id || subscription?.id || (subscriptionData as any)?.subscription?.id || (subscriptionData as any)?.id || null;
      lastFetchAttemptRef.current = {
        planId: finalPlanId,
        subscriptionId: finalSubscriptionId,
      };
      
      // ✅ FIX: Don't call loadDayData() here - let the useEffect handle it
      // The useEffect at line ~285 will trigger when currentPlan, subscriptionData, and weekDays are ready
      // This avoids race conditions with weekDays recalculation
      logger.debug('🔄 [NutritionScreen] fetchAllData completed - useEffect will trigger loadDayData when ready', {
        hasPlan: !!loadedPlan,
        hasSubscription: !!subscription,
        message: 'Relying on useEffect to call loadDayData when all dependencies are ready'
      });
    }
  };

  // Calculate which day in the nutrition plan cycle based on selected date
  // ✅ FIX: Use plan.startDate as primary source (not subscription.startDate)
  const calculateNutritionPlanDay = (selectedDate: Date | number): number => {
    logger.group('📅 CALCULATE PLAN DAY');
    const dateObj = selectedDate instanceof Date ? selectedDate : new Date(selectedDate);
    
    if (!currentPlan?.numDays) {
      logger.warn('Missing plan numDays', {
        hasNumDays: !!currentPlan?.numDays,
        action: 'Returning default day 1'
      });
      logger.groupEnd();
      return 1; // Default to day 1
    }
    
    // ✅ PRIORITY LOGIC FOR REFERENCE DATE:
    // 1. plan.startDate (nutrition plan start date) - PRIMARY SOURCE
    // 2. subscription.startDate (subscription start date) - FALLBACK
    // 3. profile.createdAt (user registration date) - LEGACY FALLBACK
    // 4. Current date - LAST RESORT
    
    let referenceDate: Date;
    let dateSource: string;
    
    if (currentPlan.startDate) {
      referenceDate = new Date(currentPlan.startDate);
      dateSource = 'plan.startDate';
    } else if (subscriptionData?.subscription?.startDate) {
      referenceDate = new Date(subscriptionData.subscription.startDate);
      dateSource = 'subscription.startDate';
    } else if (profileData?.createdAt) {
      referenceDate = new Date(profileData.createdAt);
      dateSource = 'profile.createdAt';
    } else {
      referenceDate = new Date();
      dateSource = 'current date (fallback)';
    }
    
    logger.debug('Input: Calculating plan day for selected date', {
      selectedDate: dateObj.toDateString(),
      planStartDate: currentPlan.startDate,
      subscriptionStartDate: subscriptionData?.subscription?.startDate,
      profileCreatedAt: profileData?.createdAt,
      referenceDateUsed: referenceDate.toDateString(),
      dateSource,
      planNumDays: currentPlan.numDays,
    });
    
    referenceDate.setHours(0, 0, 0, 0);
    const currentDate = dateObj;
    currentDate.setHours(0, 0, 0, 0);
    
    // Calculate days since plan started (0-indexed)
    const daysSinceStart = Math.floor((currentDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Logic: Calculate which day in the plan cycle (1-indexed, repeating)
    // Example: 3-day plan cycles as 1,2,3,1,2,3...
    const planDay = (daysSinceStart % currentPlan.numDays) + 1;
    
    logger.debug('Logic: Plan day calculation', {
      dateSource,
      referenceDate: referenceDate.toDateString(),
      currentDate: currentDate.toDateString(),
      daysSinceStart,
      planNumDays: currentPlan.numDays,
      calculation: `(${daysSinceStart} % ${currentPlan.numDays}) + 1`,
      result: planDay,
    });
    
    logger.info('Plan day calculated', { 
      calendarDate: currentDate.toDateString(),
      planDay: `${planDay}/${currentPlan.numDays}`,
      dateSource
    });
    logger.groupEnd();
    
    return planDay;
  };

  const loadDayData = async () => {
    if (!currentPlan?.id) {
      logger.warn('Cannot load day data: No current plan ID');
      return;
    }
    
    // Éviter les appels multiples simultanés
    if (isLoadingDayData) {
      logger.debug('loadDayData already in progress, skipping...');
      return;
    }
    
    // Wait for weekDays to be available
    if (!weekDays || weekDays.length === 0) {
      logger.debug('weekDays not yet available, skipping loadDayData');
      return;
    }
    
    try {
      setIsLoadingDayData(true);
      logger.group('🍽️ LOAD DAY DATA');
      logger.info('Loading meals for selected day only');
      // ✅ NEW: Calculate actual plan day from calendar date
      // This handles plans of any length (3-day, 7-day, 14-day, 21-day, etc.)
      const selectedDateObj = selectedDate instanceof Date ? selectedDate : today;
      selectedDateObj.setHours(0, 0, 0, 0);
      
      // Determine plan start date (from subscription or fallback to today)
      let planStartDate = today;
      if (subscriptionData?.subscription?.startDate) {
        planStartDate = new Date(subscriptionData.subscription.startDate);
        planStartDate.setHours(0, 0, 0, 0);
      } else if (currentPlan?.startDate) {
        planStartDate = new Date(currentPlan.startDate);
        planStartDate.setHours(0, 0, 0, 0);
      }
      
      // Use shared utility to calculate plan day from calendar date
      // This supports cycling plans and long plans correctly
      const menuDay = calculatePlanDayFromDate(
        selectedDateObj,
        planStartDate,
        currentPlan.numDays || 7 // Default to 7-day cycle if not specified
      );
      
      // Get plan progress information for logging
      const planProgress = getPlanProgress(
        selectedDateObj,
        planStartDate,
        currentPlan.numDays || 7
      );
      
      logger.info('Plan progress calculated', {
        planStartDate: planStartDate.toDateString(),
        menuDay,
        planProgress: {
          daysElapsed: planProgress.daysElapsed,
          cycleNumber: planProgress.cycleNumber,
          progressInCycle: `${planProgress.progressInCycle}%`
        },
        currentPlanId: currentPlan.id,
        planNumDays: currentPlan.numDays,
        menusCount: currentPlan.menus?.length || 0,
        menusAvailable: currentPlan.menus?.map((m: any) => ({ day: m.day, mealsCount: m.meals?.length || 0 })) || [],
        weekDaysCount: weekDays?.length || 0,
        weekDaysDates: weekDays?.map(d => d.date.toDateString()) || [],
      });
      
      logger.debug('Input: Day selection parameters', {
        selectedDate: selectedDateObj.toDateString(),
        planStartDate: planStartDate.toDateString(),
        calculatedMenuDay: menuDay,
        daysElapsed: planProgress.daysElapsed,
        cycleNumber: planProgress.cycleNumber
      });
      
      // ✅ NEW: Use shared utility to find menu for the calculated plan day
      // This ensures consistency with NutritionCard and handles all plan lengths
      logger.debug('Logic: Finding menu for calculated plan day', {
        menuDay,
        availableMenuDays: currentPlan.menus?.map((m: any) => m.day) || [],
        planNumDays: currentPlan.numDays,
        note: 'Using shared utility function for consistency'
      });
      
      // Use shared utility for consistent menu finding logic
      let dayMenu = findMenuForPlanDay(currentPlan.menus, menuDay);
      
      if (dayMenu) {
        console.log('✅ [NutritionScreen] Menu found', {
          requestedPlanDay: menuDay,
          foundMenuDay: dayMenu.day,
          mealsCount: dayMenu.meals?.length || 0,
          isExactMatch: dayMenu.day === menuDay,
          isFallback: dayMenu.day !== menuDay
        });
      } else {
        console.log('⚠️ [NutritionScreen] No menu found', {
          requestedPlanDay: menuDay,
          availableMenus: currentPlan.menus?.length || 0,
          availableMenuDays: currentPlan.menus?.map((m: any) => m.day) || [],
        });
      }
      
      // Final fallback: use first menu (like NutritionCard does)
      if (!dayMenu && currentPlan.menus && currentPlan.menus.length > 0) {
        dayMenu = currentPlan.menus[0];
        console.log('🔄 [NutritionScreen] Using fallback: first menu', {
          fallbackMenuDay: dayMenu.day,
        });
      }
      
      if (dayMenu) {
        logger.debug('API Response: Day menu found', {
          menuDay: dayMenu.day,
          mealsCount: dayMenu.meals?.length || 0,
          mealIds: dayMenu.meals?.map((m: Meal) => ({ id: m.id, name: m.name, type: m.type })) || [],
        });
        
        // Field mapping
        logger.debug('Field Mapping: Day menu structure', {
          'menu.day': dayMenu.day,
          'menu.meals[].id': dayMenu.meals?.map((m: Meal) => m.id) || [],
          'menu.meals[].name': dayMenu.meals?.map((m: Meal) => m.name) || [],
          'menu.meals[].type': dayMenu.meals?.map((m: Meal) => m.type) || [],
          'menu.meals[].imageUrl': dayMenu.meals?.map((m: Meal) => m.imageUrl ? 'present' : 'missing') || [],
        });
        
        const meals = dayMenu.meals || [];
        console.log('✅ [NutritionScreen] Setting dayMeals', {
          menuDay: dayMenu.day,
          mealsCount: meals.length,
          mealNames: meals.map((m: Meal) => m.name),
        });
        setDayMeals(meals);
        
        // Load interaction status for each meal
        const interactionPromises = meals.map(async (meal: Meal) => {
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
        const newInteractions: MealInteraction = {};
        interactionResults.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            const interaction = result.value.interaction;
            if (interaction === 'like' || interaction === 'dislike' || interaction === null) {
              newInteractions[result.value.mealId] = interaction;
            }
          }
        });
        
        if (Object.keys(newInteractions).length > 0) {
          setMealInteractions(prev => ({ ...prev, ...newInteractions }));
          logger.debug('Updated meal interactions state', { newInteractions });
        }
        
        logger.info('Day meals loaded', { 
          mealsCount: meals.length,
          menuDay: `${menuDay}`,
          interactionsLoaded: Object.keys(newInteractions).length
        });
      } else {
        logger.warn('No menu found for menu day', {
          menuDay,
          availableDays: currentPlan.menus?.map(m => m.day) || [],
          action: 'Setting empty meals array'
        });
        // Fallback: try to use the first menu if available
        if (currentPlan.menus && currentPlan.menus.length > 0) {
          logger.info('Using fallback: first menu available', {
            fallbackMenuDay: currentPlan.menus[0].day,
            mealsCount: currentPlan.menus[0].meals?.length || 0,
          });
          setDayMeals(currentPlan.menus[0].meals || []);
        } else {
          setDayMeals([]);
        }
      }

      // Clear tomorrow meals - we only show selected day meals
      setTomorrowMeals([]);

      // Get completion status for the plan (global, puis filtrer pour le jour spécifique)
      logger.debug('API Request: Fetching completion status', {
        planId: currentPlan.id,
        menuDay,
        endpoint: 'nutritionAPI.getCompletionStatus'
      });
      
      try {
        // Utiliser getCompletionStatus qui retourne le statut global du plan
        const globalCompletionData = await nutritionAPI.getCompletionStatus(currentPlan.id);
        
        // Log détaillé de la réponse complète du backend
        console.log('📥 [LOAD DAY DATA] Réponse complète du backend:', JSON.stringify(globalCompletionData, null, 2));
        
        logger.debug('API Response: Global completion status received', {
          status: 'success',
          hasData: !!globalCompletionData,
          globalCompletionData,
        });
        
        // Filtrer les données pour le jour spécifique si nécessaire
        // Le backend peut retourner les données de tous les jours, on extrait celles du jour actuel
        let completionData = globalCompletionData;
        
        // Si les données sont structurées par jour, extraire le jour spécifique
        if (globalCompletionData?.days && globalCompletionData.days[menuDay]) {
          completionData = globalCompletionData.days[menuDay];
        } else if (globalCompletionData?.dayProgress) {
          // Si c'est déjà au format attendu, utiliser directement
          completionData = globalCompletionData;
        }
        
        // Log détaillé pour voir la structure des données reçues
        console.log('📊 [LOAD DAY DATA] Statut de complétion reçu de l\'API', {
          planId: currentPlan.id,
          menuDay,
          hasData: !!completionData,
          hasProgress: !!completionData?.progress,
          progress: completionData?.progress,
          hasAllCompletions: !!completionData?.allCompletions,
          allCompletionsCount: completionData?.allCompletions?.length || 0,
          allCompletionsMealIds: completionData?.allCompletions?.map((c: any) => c?.mealId) || [],
          completedMealIds: completionData?.dayProgress?.completedMealIds || [],
          mealStatus: completionData?.mealStatus || {},
          mealStatusKeys: Object.keys(completionData?.mealStatus || {}),
          hasCompletionsByDay: !!completionData?.completionsByDay,
          completionsByDay: completionData?.completionsByDay,
          fullData: completionData,
        });
        
        // S'assurer qu'on conserve toutes les données importantes
        setCompletionStatus({
          ...completionData,
          progress: completionData?.progress,
          allCompletions: completionData?.allCompletions,
          dayProgress: completionData?.dayProgress,
          mealStatus: completionData?.mealStatus,
          completionsByDay: completionData?.completionsByDay,
        });
        logger.info('Completion status loaded');
      } catch (error: any) {
        logger.error('API Response: Completion status fetch failed', error?.message || error);
        console.error('❌ [LOAD DAY DATA] Erreur lors du chargement du statut de complétion', {
          planId: currentPlan.id,
          menuDay,
          error: error?.message || error,
          errorResponse: error?.response?.data,
        });
        // On ne bloque pas l'écran si ce call échoue : on laisse simplement completionStatus à null
        setCompletionStatus(null);
      }
      
      logger.groupEnd();
      
    } catch (error) {
      logger.error('Error loading day data', error);
    } finally {
      setIsLoadingDayData(false);
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
    // Sur iOS, ne pas rediriger vers la page subscription (Reader App model)
    if (isIOS) {
      return;
    }
    if (onSubscriptionRenew) {
      onSubscriptionRenew();
    }
  };

  // Meal interaction functions
  const handleMealLike = async (mealId: string) => {
    logger.group('👍 MEAL LIKE ACTION');
    logger.info('User Action: Meal like button pressed', { mealId });
    
    try {
      // Find meal name from current meals
      const meal = dayMeals.find(m => m.id === mealId) || selectedMeal;
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
        const interaction: 'like' | 'dislike' | null = updatedInteraction === 'like' ? 'like' : 
                                                      updatedInteraction === 'dislike' ? 'dislike' : null;
        const updated: MealInteraction = { ...prev, [mealId]: interaction };
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

  const handleMealDislike = async (mealId: string) => {
    logger.group('👎 MEAL DISLIKE ACTION');
    logger.info('User Action: Meal dislike button pressed', { mealId });
    
    try {
      // Find meal name from current meals
      const meal = dayMeals.find(m => m.id === mealId) || selectedMeal;
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
        const interaction: 'like' | 'dislike' | null = updatedInteraction === 'like' ? 'like' : 
                                                      updatedInteraction === 'dislike' ? 'dislike' : null;
        const updated: MealInteraction = { ...prev, [mealId]: interaction };
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

  const handleMealComplete = async (mealId: string) => {
    console.log('🔵 [MEAL COMPLETE] ==========================================');
    console.log('🔵 [MEAL COMPLETE] Début de la complétion du repas');
    console.log('🔵 [MEAL COMPLETE] mealId:', mealId);
    console.log('🔵 [MEAL COMPLETE] currentPlan:', currentPlan ? { id: currentPlan.id, name: currentPlan.name } : 'null');
    console.log('🔵 [MEAL COMPLETE] selectedDate:', selectedDate);
    console.log('🔵 [MEAL COMPLETE] subscriptionData:', subscriptionData ? { status: subscriptionData.status } : 'null');
    
    logger.group('✅ MEAL COMPLETE ACTION');
    logger.info('User Action: Meal complete button pressed', { mealId });
    
    // Charger le statut de complétion à jour avant de vérifier
    let freshCompletionStatus = completionStatus;
    if (currentPlan?.id) {
      try {
        const selectedDateObj = selectedDate instanceof Date ? selectedDate : today;
        selectedDateObj.setHours(0, 0, 0, 0);
        const planDay = calculateNutritionPlanDay(selectedDateObj);
        // Utiliser getCompletionStatus au lieu de getDayCompletionStatus
        const globalCompletionData = await nutritionAPI.getCompletionStatus(currentPlan.id);
        
        // Filtrer pour le jour spécifique si nécessaire
        let completionData = globalCompletionData;
        if (globalCompletionData?.days && globalCompletionData.days[planDay]) {
          completionData = globalCompletionData.days[planDay];
        }
        
        freshCompletionStatus = completionData;
        setCompletionStatus(completionData);
        logger.debug('Fresh completion status loaded', { completionData });
        console.log('🔄 [MEAL COMPLETE] Statut de complétion rafraîchi depuis l\'API', {
          mealId,
          planDay,
          completedMealIds: completionData?.dayProgress?.completedMealIds || [],
          mealStatus: completionData?.mealStatus || {},
        });
      } catch (error: any) {
        logger.warn('Could not load fresh completion status, using cached', { error });
        console.warn('⚠️ [MEAL COMPLETE] Impossible de charger le statut frais, utilisation du cache', {
          mealId,
          error: error?.message || error,
        });
      }
    }
    
    // VÉRIFIER AVANT TOUT si le repas est déjà complété pour éviter l'appel API inutile
    const isCompletedByIds = freshCompletionStatus?.dayProgress?.completedMealIds?.includes(mealId) === true;
    const isCompletedByStatus = freshCompletionStatus?.mealStatus?.[mealId]?.completed === true;
    const isAlreadyCompleted = isCompletedByIds || isCompletedByStatus;
    
    console.log('🔍 [MEAL COMPLETE] Vérification détaillée du statut AVANT complétion:', {
      mealId,
      isCompletedByIds,
      isCompletedByStatus,
      isAlreadyCompleted,
      hasCompletionStatus: !!freshCompletionStatus,
      completedMealIds: freshCompletionStatus?.dayProgress?.completedMealIds || [],
      mealStatus: freshCompletionStatus?.mealStatus?.[mealId] || null,
      allMealStatuses: freshCompletionStatus?.mealStatus || {},
    });
    
    if (isAlreadyCompleted) {
      console.log('ℹ️ [MEAL COMPLETE] Repas déjà complété - Rafraîchissement des données');
      logger.info('Meal already completed - Refreshing data silently');
      
      // Rafraîchir les données pour mettre à jour le statut
      if (currentPlan?.id && !isLoadingDayData) {
        loadDayData();
      }
      
      // Message informatif discret
      Toast.show({
        type: 'info',
        text1: 'Repas déjà complété',
        text2: 'Ce repas a déjà été marqué comme complété',
        visibilityTime: 2000,
      });
      
      logger.groupEnd();
      return;
    }
    
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

      // selectedDate est maintenant une Date complète, utiliser directement
      const selectedDateObj = selectedDate instanceof Date ? selectedDate : today;
      selectedDateObj.setHours(0, 0, 0, 0);

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
      
      logger.info('State: Updating completion status immediately');
      
      // Mettre à jour immédiatement le statut de complétion localement pour un feedback instantané
      setCompletionStatus(prevStatus => {
        // Créer un nouvel objet pour garantir l'immutabilité
        const newStatus = prevStatus ? { ...prevStatus } : {};
        
        // ✅ NOUVEAU: Mettre à jour progress.completedMeals et progress.percentage
        if (!newStatus.progress) {
          // Si pas de progress, initialiser avec les valeurs du plan ou du jour
          const totalMealsFromPlan = currentPlan?.menus?.reduce((sum: number, menu: any) => {
            return sum + (menu.meals?.length || 0);
          }, 0) || dayMeals.length || 0;
          
          newStatus.progress = {
            percentage: 0,
            completedMeals: 0,
            totalMeals: totalMealsFromPlan,
            remainingMeals: totalMealsFromPlan,
          };
        } else {
          newStatus.progress = { ...newStatus.progress };
          // S'assurer que totalMeals est défini
          if (!newStatus.progress.totalMeals || newStatus.progress.totalMeals === 0) {
            const totalMealsFromPlan = currentPlan?.menus?.reduce((sum: number, menu: any) => {
              return sum + (menu.meals?.length || 0);
            }, 0) || dayMeals.length || 0;
            newStatus.progress.totalMeals = totalMealsFromPlan;
          }
        }
        
        // Incrémenter completedMeals si le repas n'était pas déjà complété
        const wasAlreadyCompleted = newStatus.dayProgress?.completedMealIds?.includes(mealId) || 
                                   newStatus.mealStatus?.[mealId]?.completed;
        if (!wasAlreadyCompleted) {
          const currentCompleted = newStatus.progress.completedMeals || 0;
          newStatus.progress.completedMeals = currentCompleted + 1;
          newStatus.progress.remainingMeals = Math.max(0, (newStatus.progress.remainingMeals || 0) - 1);
        }
        
        // Recalculer le pourcentage avec le total correct
        const totalMeals = newStatus.progress.totalMeals || dayMeals.length || 1;
        const completedMeals = newStatus.progress.completedMeals || 0;
        newStatus.progress.percentage = totalMeals > 0 
          ? Math.round((completedMeals / totalMeals) * 100)
          : 0;
        
        // ✅ GARDÉ: Ajouter le mealId à la liste des repas complétés (pour compatibilité)
        if (!newStatus.dayProgress) {
          newStatus.dayProgress = {};
        }
        if (!newStatus.dayProgress.completedMealIds) {
          newStatus.dayProgress.completedMealIds = [];
        }
        if (!newStatus.dayProgress.completedMealIds.includes(mealId)) {
          newStatus.dayProgress.completedMealIds = [...newStatus.dayProgress.completedMealIds, mealId];
        }
        
        // ✅ GARDÉ: Mettre à jour le statut du repas (pour compatibilité)
        if (!newStatus.mealStatus) {
          newStatus.mealStatus = {};
        }
        // Créer une copie de l'objet mealStatus pour garantir l'immutabilité
        newStatus.mealStatus = { ...newStatus.mealStatus };
        if (!newStatus.mealStatus[mealId]) {
          newStatus.mealStatus[mealId] = {};
        }
        // Créer une copie de l'objet meal pour garantir l'immutabilité
        newStatus.mealStatus[mealId] = { ...newStatus.mealStatus[mealId], completed: true };
        
        console.log('🟢 [MEAL COMPLETE] Statut mis à jour immédiatement', {
          mealId,
          // ✅ NOUVEAU: Log de la nouvelle structure
          progress: newStatus.progress,
          completedMeals: newStatus.progress?.completedMeals,
          percentage: newStatus.progress?.percentage,
          // ✅ GARDÉ: Log de l'ancienne structure
          completedMealIds: newStatus.dayProgress?.completedMealIds,
          mealStatus: newStatus.mealStatus?.[mealId],
        });
        
        return newStatus;
      });
      
      Toast.show({
        type: 'success',
        text1: 'Repas terminé',
        text2: `+${response?.data?.pointsAwarded || response?.pointsAwarded || 25} points!`
      });
      
      // ✅ Refresh completion status from server (en arrière-plan) pour mettre à jour la progression
      if (currentPlan?.id) {
        logger.debug('Refreshing day data after meal completion', {
          planId: currentPlan.id,
          planDay: calculateNutritionPlanDay(selectedDateObj),
        });
        // Appeler loadDayData de manière asynchrone pour mettre à jour depuis le serveur
        setTimeout(() => {
          loadDayData();
        }, 300);
        
        // ✅ AUSSI: Rafraîchir directement le statut de complétion global pour mettre à jour la progression
        setTimeout(async () => {
          try {
            const apiResponse = await nutritionAPI.getCompletionStatus(currentPlan.id);
            let globalCompletionData = apiResponse;
            if (apiResponse?.data && apiResponse?.status) {
              globalCompletionData = apiResponse.data;
            }
            
            // Mettre à jour completionStatus avec les nouvelles données
            setCompletionStatus(prevStatus => {
              // Fusionner les nouvelles données avec l'ancien statut pour préserver dayProgress
              const updatedStatus = {
                ...prevStatus,
                ...globalCompletionData,
                progress: globalCompletionData?.progress || prevStatus?.progress,
                allCompletions: globalCompletionData?.allCompletions || prevStatus?.allCompletions,
                // ✅ Préserver dayProgress et mealStatus pour la compatibilité
                dayProgress: prevStatus?.dayProgress || globalCompletionData?.dayProgress,
                mealStatus: prevStatus?.mealStatus || globalCompletionData?.mealStatus,
              };
              
              return updatedStatus;
            });
            
            logger.debug('Completion status refreshed after meal completion', {
              progress: globalCompletionData?.progress,
              completedMeals: globalCompletionData?.progress?.completedMeals,
            });
          } catch (error) {
            logger.warn('Could not refresh completion status', { error });
          }
        }, 400);
      } else {
        logger.warn('Cannot refresh day data: currentPlan is missing', {
          hasCurrentPlan: !!currentPlan,
        });
      }
      console.log('🔵 [MEAL COMPLETE] ✅ Complétion réussie');
      logger.groupEnd();
    } catch (error: any) {
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
      
      // Gérer les erreurs spécifiques selon les codes HTTP
      const errorStatus = error?.status || error?.response?.status;
      const errorMessage = error?.response?.data?.message || error?.data?.message || error?.message || 'Erreur inconnue';
      const errorMessageLower = errorMessage.toLowerCase();
      
      // 400: Meal already completed for this plan and date
      if (errorStatus === 400 || errorMessageLower.includes('already completed') || errorMessageLower.includes('déjà complété')) {
        console.log('ℹ️ [MEAL COMPLETE] Repas déjà complété (400) - Rafraîchissement des données');
        logger.info('Meal already completed - Refreshing data silently');
        
        // Rafraîchir les données pour mettre à jour le statut
        if (currentPlan?.id) {
          loadDayData();
        }
        
        // Message informatif discret (ne pas retry)
        Toast.show({
          type: 'info',
                          text1: isIOS ? 'Plat déjà complété' : 'Repas déjà complété',
                          text2: isIOS ? 'Ce plat a déjà été marqué comme complété pour ce plan et cette date' : 'Ce repas a déjà été marqué comme complété pour ce plan et cette date',
          visibilityTime: 2000,
        });
        logger.groupEnd();
        return;
      }
      
      // 403: Access denied - Active subscription required
      if (errorStatus === 403 || errorMessageLower.includes('access denied') || errorMessageLower.includes('subscription')) {
        console.error('🔴 [MEAL COMPLETE] Accès refusé (403) - Abonnement requis');
        logger.error('Access denied - Active subscription required', { errorStatus, errorMessage });
        
        Toast.show({
          type: 'error',
          text1: 'Accès refusé',
          text2: 'Un abonnement actif est requis pour compléter ce repas',
          visibilityTime: 4000,
        });
        logger.groupEnd();
        return;
      }
      
      // 404: Meal or plan not found
      if (errorStatus === 404 || errorMessageLower.includes('not found') || errorMessageLower.includes('introuvable')) {
        console.error('🔴 [MEAL COMPLETE] Repas ou plan introuvable (404)');
        logger.error('Meal or plan not found', { errorStatus, errorMessage });
        
        Toast.show({
          type: 'error',
          text1: 'Repas introuvable',
          text2: 'Le repas ou le plan nutritionnel n\'a pas été trouvé',
          visibilityTime: 3000,
        });
        logger.groupEnd();
        return;
      }
      
      // Autres erreurs
      logger.error('Error completing meal', error);
      logger.groupEnd();
      
      console.error('🔴 [MEAL COMPLETE] Message d\'erreur pour l\'utilisateur:', errorMessage);
      console.error('🔴 [MEAL COMPLETE] Status HTTP:', errorStatus);
      console.error('🔴 [MEAL COMPLETE] Détails:', error?.response?.data || error?.data);
      
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: isIOS 
          ? `Impossible de marquer le plat comme complété: ${errorMessage}`
          : `Impossible de marquer le repas comme complété: ${errorMessage}`
      });
      
      logger.groupEnd();
    }
  };

  const handleMealFeedback = (meal: Meal) => {
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
      } catch (error: any) {
        logger.error('Error submitting feedback', error);
        logger.groupEnd();
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible d\'envoyer votre feedback'
      });
    }
  };

  const formatDate = (date: Date) => {
    const months = [
      'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
      'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'
    ];
    
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    
    return `${days[date.getDay()]}, ${date.getDate()}-${months[date.getMonth()]}-${date.getFullYear()}`;
  };

  // Helper function to compare dates (ignoring time)
  const isSameDate = (date1: Date, date2: Date): boolean => {
    if (!date1 || !date2) return false;
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  // Function to sort meals by type in correct order
  const sortMealsByType = (meals: Meal[]): Meal[] => {
    // Ordre correct : Petit-Dej, Dejeuner, Collation, Souper
    const typeOrder = ['breakfast', 'lunch', 'snack', 'dinner'];
    return meals.sort((a: Meal, b: Meal) => {
      return typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
    });
  };

  // ✅ Fonction pour calculer le pourcentage de progression (comme web app)
  const getCompletionProgress = (): number => {
    if (!completionStatus) {
      return 0;
    }
    
    // Priorité 1: progress.percentage (structure backend)
    if (completionStatus.progress?.percentage !== undefined && completionStatus.progress.percentage >= 0) {
      return completionStatus.progress.percentage;
    }
    
    // Priorité 2: Calculer depuis completedMeals et totalMeals
    const completedMeals = getCompletedMealsCount();
    const totalMeals = getTotalMealsCount();
    if (totalMeals > 0) {
      return Math.round((completedMeals / totalMeals) * 100);
    }
    
    return 0;
  };

  // ✅ Fonction pour obtenir le nombre de repas complétés
  const getCompletedMealsCount = (): number => {
    if (!completionStatus) return 0;
    
    // Priorité 1: progress.completedMeals (structure backend - le plus fiable)
    if (completionStatus.progress?.completedMeals !== undefined && completionStatus.progress.completedMeals >= 0) {
      return completionStatus.progress.completedMeals;
    }
    
    // Priorité 2: allCompletions.length (toutes les complétions du plan)
    if (completionStatus.allCompletions && Array.isArray(completionStatus.allCompletions) && completionStatus.allCompletions.length > 0) {
      return completionStatus.allCompletions.length;
    }
    
    // Priorité 3: Calculer depuis dayProgress.completedMealIds (pour le jour actuel)
    const completedMealIds = completionStatus.dayProgress?.completedMealIds;
    if (completedMealIds && Array.isArray(completedMealIds) && completedMealIds.length > 0) {
      return completedMealIds.length;
    }
    
    // Priorité 4: Compter depuis mealStatus (tous les repas marqués comme complétés)
    if (completionStatus.mealStatus && typeof completionStatus.mealStatus === 'object') {
      const completedCount = Object.values(completionStatus.mealStatus).filter(
        (status: any) => status?.completed === true
      ).length;
      if (completedCount > 0) {
        return completedCount;
      }
    }
    
    return 0;
  };

  // ✅ Fonction pour obtenir le total de repas
  const getTotalMealsCount = (): number => {
    // Priorité 1: progress.totalMeals (structure backend - le plus fiable)
    if (completionStatus?.progress?.totalMeals !== undefined && completionStatus.progress.totalMeals > 0) {
      return completionStatus.progress.totalMeals;
    }
    
    // Priorité 2: Calculer depuis tous les menus du plan
    if (currentPlan?.menus && Array.isArray(currentPlan.menus)) {
      const totalFromPlan = currentPlan.menus.reduce((sum: number, menu: any) => {
        return sum + (menu.meals?.length || 0);
      }, 0);
      if (totalFromPlan > 0) {
        return totalFromPlan;
      }
    }
    
    // Priorité 3: Fallback sur dayMeals (pour le jour actuel)
    return dayMeals.length || 0;
  };

  const renderMealCard = (meal: Meal) => {
    const mealType = mealTypeMap[meal.type] || mealTypeMap.breakfast;
    // Vérifier le statut de complétion de manière plus robuste
    const isCompletedByIds = completionStatus?.dayProgress?.completedMealIds?.includes(meal.id) === true;
    const isCompletedByStatus = completionStatus?.mealStatus?.[meal.id]?.completed === true;
    const isCompleted = isCompletedByIds || isCompletedByStatus;
    const interaction = mealInteractions[meal.id];
    const isSelected = selectedMeal?.id === meal.id;
    
    // Log détaillé pour vérifier la vérification de complétion pour TOUS les repas
    if (__DEV__) {
      console.log('🔍 [RENDER MEAL CARD] Vérification du statut de complétion', {
        mealId: meal.id,
        mealName: meal.name,
        isCompleted,
        isCompletedByIds,
        isCompletedByStatus,
        hasCompletionStatus: !!completionStatus,
        completedMealIds: completionStatus?.dayProgress?.completedMealIds || [],
        mealStatus: completionStatus?.mealStatus?.[meal.id] || null,
        willBeClickable: !isCompleted,
        pointerEvents: isCompleted ? 'none' : 'auto',
      });
    }
    
    return (
      <View 
        key={meal.id} 
        style={[
          styles.mealCard, 
          { backgroundColor: mealType.bg },
          isSelected && styles.selectedMealCard,
          isCompleted && styles.completedMealCard
        ]}
        pointerEvents={isCompleted ? 'none' : 'auto'}
      >
        {/* Icône de succès pour les repas complétés */}
        {isCompleted && (
          <View style={styles.completedMealBadge}>
            <Ionicons name="checkmark-circle" size={28} color="#4CAF50" />
          </View>
        )}
        
        {isCompleted ? (
          // Si complété, utiliser un View non cliquable avec pointerEvents='none'
          <View style={styles.mealContent} pointerEvents="none">
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
        ) : (
          // Si non complété, utiliser un TouchableOpacity cliquable
          <TouchableOpacity 
            style={styles.mealContent}
            disabled={isCompleted}
            onPress={() => {
              // Protection supplémentaire : ne pas ouvrir si complété
              if (isCompleted) {
                return;
              }
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
            activeOpacity={0.8}
          >
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
          </TouchableOpacity>
        )}
      </View>
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

  // ✅ ANDROID: Afficher la carte verrouillée si pas d'abonnement actif
  console.log('🔒 [NutritionScreen] Lock check:', {
    platform: Platform.OS,
    isAndroid: Platform.OS === 'android',
    hasActiveSubscription,
    willShowLock: Platform.OS === 'android' && !hasActiveSubscription
  });
  
  if (Platform.OS === 'android' && !hasActiveSubscription) {
    console.log('🔒 [NutritionScreen] Affichage de la carte verrouillée');
    return (
      <View style={[styles.content, { backgroundColor: '#F0F0F0' }]}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.lockedScrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.lockedContainer}>
            <View style={styles.lockIconContainer}>
              <Ionicons name="lock-closed" size={64} color="#FF9800" />
            </View>
            <Text style={styles.lockedTitle}>Nutrition verrouillée</Text>
            <Text style={styles.lockedMessage}>
              Abonnez-vous pour accéder au menu du jour et débloquer tous les plans nutritionnels personnalisés
            </Text>
            <TouchableOpacity 
              style={styles.subscribeButton}
              onPress={() => {
                console.log('🔘 [NutritionScreen] Bouton "Voir les plans d\'abonnement" cliqué');
                console.log('🔘 [NutritionScreen] onSubscriptionRenew:', onSubscriptionRenew);
                if (onSubscriptionRenew) {
                  console.log('✅ [NutritionScreen] Appel de onSubscriptionRenew()');
                  onSubscriptionRenew();
                } else {
                  console.error('❌ [NutritionScreen] onSubscriptionRenew est undefined');
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="rocket" size={20} color="#FFFFFF" />
              <Text style={styles.subscribeButtonText}>Voir les plans d'abonnement</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <>
      {/* Subscription Banner supprimé - on a toujours un plan FREE par défaut */}
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
            <Text style={styles.menuDate}>{formatDate(selectedDate)}</Text>
          </View>
          {/* Phase actuel - Only on Android */}
          {!isIOS && profileData?.currentPhase && (
            <View style={styles.phaseBanner}>
              <Text style={styles.phaseText}>Phase actuel : {profileData.currentPhase}</Text>
            </View>
          )}
        </View>

        {/* Week Calendar */}
        <View style={styles.calendarContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.calendarContent}
          >
            {weekDays.map((day) => (
              <TouchableOpacity
                key={day.number + '-' + day.dayOfWeek}
                style={[
                  styles.calendarDay,
                  day.isToday && styles.todayDay,
                  isSameDate(selectedDate, day.date) && styles.selectedDay,
                  day.isOutsideSubscription && styles.outsideSubscriptionDay,
                  day.isPast && styles.pastDay // Style pour dates passées
                ]}
                disabled={day.isPast} // Désactiver les dates passées
                onPress={() => {
                  // Ne pas permettre de sélectionner les dates passées
                  if (day.isPast) {
                    return;
                  }
                  
                  // If status is 200, allow all dates (no restrictions)
                  if (plansResponseStatus === 200) {
                    logger.info('User Action: Date selected (status 200 - no restrictions)', {
                      selectedDate: day.date.toDateString(),
                      selectedDayOfWeek: day.dayOfWeek,
                      isToday: day.isToday,
                    });
                    // Create a new Date object to ensure React detects the change
                    const newDate = new Date(day.date);
                    setSelectedDate(newDate);
                    setSelectedDay(day.dayOfWeek);
                    // Clear selected meal when date changes
                    setSelectedMeal(null);
                    console.log('📅 [NutritionScreen] Date changed', {
                      newDate: newDate.toDateString(),
                      dayNumber: day.number,
                      dayOfWeek: day.dayOfWeek,
                    });
                  } else if (day.isOutsideSubscription) {
                    // Sur iOS, afficher une notification Toast au lieu d'une Alert
                    if (isIOS) {
                      Toast.show({
                        type: 'info',
                        text1: 'Statut non vérifié',
                        text2: 'L\'accès à ce contenu dépend de votre statut actuel. Veuillez vérifier votre accès pour continuer.',
                        visibilityTime: 5000,
                      });
                    } else {
                      // Sur Android, afficher l'alerte classique
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
                    }
                  } else {
                    logger.info('User Action: Date selected', {
                      selectedDate: day.date.toDateString(),
                      selectedDayOfWeek: day.dayOfWeek,
                      isToday: day.isToday,
                      isOutsideSubscription: day.isOutsideSubscription,
                    });
                    // Create a new Date object to ensure React detects the change
                    const newDate = new Date(day.date);
                    setSelectedDate(newDate);
                    setSelectedDay(day.dayOfWeek);
                    // Clear selected meal when date changes
                    setSelectedMeal(null);
                    console.log('📅 [NutritionScreen] Date changed', {
                      newDate: newDate.toDateString(),
                      dayNumber: day.number,
                      dayOfWeek: day.dayOfWeek,
                    });
                  }
                }}
              >
                <Text style={[
                  styles.dayNumber,
                  day.isToday && styles.todayDayNumber,
                  isSameDate(selectedDate, day.date) && styles.selectedDayNumber,
                  day.isOutsideSubscription && styles.outsideSubscriptionText,
                ]}>
                  {day.number}
                </Text>
                <Text style={[
                  styles.dayName,
                  day.isToday && styles.todayDayName,
                  isSameDate(selectedDate, day.date) && styles.selectedDayName,
                  day.isOutsideSubscription && styles.outsideSubscriptionText,
                ]}>
                  {day.day}
                </Text>
                {day.isOutsideSubscription && (
                  <Ionicons 
                    name="warning" 
                    size={12} 
                    color="#F44336" 
                    style={{ marginTop: 2 }}
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Carte "Menus verrouillés" supprimée - on a toujours un plan FREE par défaut avec accessLevel ACTIVE */}

        {/* Meals List - Only show when there's an active plan AND active subscription */}
        {(() => {
          if (__DEV__) {
            console.log('🍽️ [NutritionScreen] Meals List Display Check:', {
              hasCurrentPlan: !!currentPlan,
              currentPlanId: currentPlan?.id,
              currentPlanName: currentPlan?.name,
              hasActiveSubscription,
              subscriptionStatus: subscriptionData?.status,
              subscriptionDataKeys: subscriptionData ? Object.keys(subscriptionData) : [],
              plansResponseStatus,
              dayMealsCount: dayMeals.length,
              willShowMeals: plansResponseStatus === 200 || (currentPlan && hasActiveSubscription) || dayMeals.length > 0,
              willShowLockCard: (!currentPlan || !hasActiveSubscription) && plansResponseStatus !== 200,
            });
          }
          return null;
        })()}
        {/* Meals List - Show when status is 200 OR when there's an active plan AND active subscription OR when we have meals data */}
        {(plansResponseStatus === 200 || (currentPlan && hasActiveSubscription) || dayMeals.length > 0) && (
          <View style={styles.mealsContainer}>
            {/* Selected Day's Meals */}
            {dayMeals.length > 0 ? (
              <>
                {(() => {
                  // Check if selected date is today
                  const selectedDateObj = selectedDate instanceof Date ? selectedDate : today;
                  selectedDateObj.setHours(0, 0, 0, 0);
                  const isToday = isSameDate(selectedDateObj, today);
                  const dayLabel = isToday ? 'Aujourd\'hui' : formatDate(selectedDateObj);
                  
                  return (
                    <>
                      <View style={styles.mealsSectionHeader}>
                        <Text style={styles.mealsSectionTitle}>{dayLabel}</Text>
                      </View>
                      {sortMealsByType(dayMeals).map((meal: Meal) => renderMealCard(meal))}
                    </>
                  );
                })()}
              </>
            ) : null}
          </View>
        )}

        {/* ✅ Carte de progression - Affichée après les repas */}
        {/* ✅ MASQUÉ: Carte de progression cachée mais code conservé */}
        {false && currentPlan && completionStatus && (
          <View style={styles.progressCard}>
            {/* Nombre de repas complétés - Au-dessus de la progression */}
            <View style={styles.progressMealsCountContainer}>
              <Text style={styles.progressMealsCountLabel}>Repas complétés</Text>
              <Text style={styles.progressMealsCountValue}>
                {getCompletedMealsCount()} / {getTotalMealsCount()}
              </Text>
            </View>

            {/* Progression - Barre en longueur */}
            <View style={styles.progressBarContainerFull}>
              <View style={styles.progressBarBackgroundFull}>
                <View 
                  style={[
                    styles.progressBarFillFull,
                    { width: `${getCompletionProgress()}%` }
                  ]}
                />
              </View>
              <Text style={styles.progressBarPercentageFull}>
                {Math.round(getCompletionProgress())}%
              </Text>
            </View>
          </View>
        )}

        {/* Bouton "Compléter des repas" - Sous la carte de progression */}
        {/* ✅ MASQUÉ: Bouton compléter caché mais code conservé */}
        {false && currentPlan && dayMeals.length > 0 && (
          <View style={styles.completeMealsButtonContainer}>
            <TouchableOpacity
              style={styles.completeMealsButton}
              onPress={async () => {
                // ✅ Rafraîchir le statut de complétion depuis le serveur AVANT d'ouvrir le modal
                if (currentPlan?.id) {
                  try {
                    console.log('🔄 [COMPLETE MEALS] Rafraîchissement du statut depuis le serveur...');
                    const apiResponse = await nutritionAPI.getCompletionStatus(currentPlan.id);
                    
                    // Log détaillé de la réponse du backend
                    console.log('📥 [COMPLETE MEALS] Réponse complète du backend:', JSON.stringify(apiResponse, null, 2));
                    
                    let globalCompletionData = apiResponse;
                    if (apiResponse?.data && apiResponse?.status) {
                      globalCompletionData = apiResponse.data;
                    }
                    
                    // Log de la structure des données après parsing
                    console.log('📊 [COMPLETE MEALS] Structure des données de complétion:', {
                      hasProgress: !!globalCompletionData?.progress,
                      progress: globalCompletionData?.progress,
                      hasAllCompletions: !!globalCompletionData?.allCompletions,
                      allCompletionsCount: globalCompletionData?.allCompletions?.length || 0,
                      allCompletions: globalCompletionData?.allCompletions,
                      hasDayProgress: !!globalCompletionData?.dayProgress,
                      dayProgress: globalCompletionData?.dayProgress,
                      hasMealStatus: !!globalCompletionData?.mealStatus,
                      mealStatus: globalCompletionData?.mealStatus,
                      hasCompletionsByDay: !!globalCompletionData?.completionsByDay,
                      completionsByDay: globalCompletionData?.completionsByDay,
                    });
                    
                    // ✅ Stocker les données fraîches pour le filtrage du bottom sheet
                    setFreshCompletionData(globalCompletionData);
                    
                    // Mettre à jour completionStatus avec les données fraîches du serveur
                    setCompletionStatus(prevStatus => {
                      const updatedStatus = {
                        ...prevStatus,
                        ...globalCompletionData,
                        progress: globalCompletionData?.progress || prevStatus?.progress,
                        allCompletions: globalCompletionData?.allCompletions || prevStatus?.allCompletions,
                        dayProgress: globalCompletionData?.dayProgress || prevStatus?.dayProgress,
                        mealStatus: globalCompletionData?.mealStatus || prevStatus?.mealStatus,
                        completionsByDay: globalCompletionData?.completionsByDay || prevStatus?.completionsByDay,
                      };
                      
                      console.log('✅ [COMPLETE MEALS] Statut mis à jour:', {
                        completedMealIds: updatedStatus?.dayProgress?.completedMealIds || [],
                        mealStatusKeys: Object.keys(updatedStatus?.mealStatus || {}),
                        allCompletionsMealIds: updatedStatus?.allCompletions?.map((c: any) => c?.mealId) || [],
                        completionsByDay: updatedStatus?.completionsByDay,
                        completionsByDayKeys: Object.keys(updatedStatus?.completionsByDay || {}),
                        totalCompletionsInCompletionsByDay: Object.values(updatedStatus?.completionsByDay || {}).reduce((total: number, dayCompletions: any) => {
                          return total + (Array.isArray(dayCompletions) ? dayCompletions.length : 0);
                        }, 0),
                      });
                      
                      return updatedStatus;
                    });
                    
                    // ✅ Filtrer les repas pour ne garder que ceux NON complétés avec le statut frais
                    const incompleteMeals = dayMeals.filter((meal: Meal) => {
                      const isCompletedByIds = globalCompletionData?.dayProgress?.completedMealIds?.includes(meal.id) === true;
                      const isCompletedByStatus = globalCompletionData?.mealStatus?.[meal.id]?.completed === true;
                      const isCompletedInAllCompletions = globalCompletionData?.allCompletions?.some(
                        (completion: any) => completion?.mealId === meal.id
                      ) === true;
                      
                      // ✅ Vérifier dans TOUS les jours de completionsByDay (pas seulement le jour sélectionné)
                      let isCompletedInCompletionsByDay = false;
                      if (globalCompletionData?.completionsByDay) {
                        // Parcourir tous les jours dans completionsByDay
                        Object.values(globalCompletionData.completionsByDay).forEach((dayCompletions: any) => {
                          if (Array.isArray(dayCompletions)) {
                            const found = dayCompletions.some(
                              (completion: any) => completion?.mealId === meal.id && completion?.completedAt
                            );
                            if (found) {
                              isCompletedInCompletionsByDay = true;
                            }
                          }
                        });
                      }
                      
                      const isCompleted = isCompletedByIds || isCompletedByStatus || isCompletedInAllCompletions || isCompletedInCompletionsByDay;
                      
                      if (isCompleted) {
                        console.log(`🚫 [COMPLETE MEALS] Repas ${meal.name} (${meal.id}) est déjà complété:`, {
                          isCompletedByIds,
                          isCompletedByStatus,
                          isCompletedInAllCompletions,
                          isCompletedInCompletionsByDay,
                        });
                      }
                      
                      // Ne garder que les repas NON complétés
                      return !isCompleted;
                    });
                    
                    console.log('📋 [COMPLETE MEALS] Repas à compléter:', {
                      totalMeals: dayMeals.length,
                      incompleteMeals: incompleteMeals.length,
                      incompleteMealIds: incompleteMeals.map((m: Meal) => m.id),
                    });
                    
                    setMealsToComplete(incompleteMeals);
                    setShowCompletionModal(true);
                  } catch (error) {
                    console.error('❌ [COMPLETE MEALS] Erreur lors du rafraîchissement du statut:', error);
                    // En cas d'erreur, utiliser le statut local actuel
                    const incompleteMeals = dayMeals.filter((meal: Meal) => {
                      const isCompletedByIds = completionStatus?.dayProgress?.completedMealIds?.includes(meal.id) === true;
                      const isCompletedByStatus = completionStatus?.mealStatus?.[meal.id]?.completed === true;
                      const isCompletedInAllCompletions = completionStatus?.allCompletions?.some(
                        (completion: any) => completion?.mealId === meal.id
                      ) === true;
                      
                      // ✅ Vérifier dans TOUS les jours de completionsByDay
                      let isCompletedInCompletionsByDay = false;
                      if (completionStatus?.completionsByDay) {
                        Object.values(completionStatus.completionsByDay).forEach((dayCompletions: any) => {
                          if (Array.isArray(dayCompletions)) {
                            const found = dayCompletions.some(
                              (completion: any) => completion?.mealId === meal.id && completion?.completedAt
                            );
                            if (found) {
                              isCompletedInCompletionsByDay = true;
                            }
                          }
                        });
                      }
                      
                      return !(isCompletedByIds || isCompletedByStatus || isCompletedInAllCompletions || isCompletedInCompletionsByDay);
                    });
                    setMealsToComplete(incompleteMeals);
                    setShowCompletionModal(true);
                  }
                } else {
                  // Si pas de plan, utiliser le statut local actuel
                  const incompleteMeals = dayMeals.filter((meal: Meal) => {
                    const isCompletedByIds = completionStatus?.dayProgress?.completedMealIds?.includes(meal.id) === true;
                    const isCompletedByStatus = completionStatus?.mealStatus?.[meal.id]?.completed === true;
                    const isCompletedInAllCompletions = completionStatus?.allCompletions?.some(
                      (completion: any) => completion?.mealId === meal.id
                    ) === true;
                    
                    // ✅ Vérifier dans TOUS les jours de completionsByDay
                    let isCompletedInCompletionsByDay = false;
                    if (completionStatus?.completionsByDay) {
                      Object.values(completionStatus.completionsByDay).forEach((dayCompletions: any) => {
                        if (Array.isArray(dayCompletions)) {
                          const found = dayCompletions.some(
                            (completion: any) => completion?.mealId === meal.id && completion?.completedAt
                          );
                          if (found) {
                            isCompletedInCompletionsByDay = true;
                          }
                        }
                      });
                    }
                    
                    return !(isCompletedByIds || isCompletedByStatus || isCompletedInAllCompletions || isCompletedInCompletionsByDay);
                  });
                  setMealsToComplete(incompleteMeals);
                  setShowCompletionModal(true);
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.completeMealsButtonText}>Compléter des repas</Text>
            </TouchableOpacity>
          </View>
        )}
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
        <BlurView
          intensity={20}
          tint="dark"
          style={StyleSheet.absoluteFillObject}
        >
          <View style={styles.youtubeModalOverlay}>
            <View style={styles.youtubeModalContent}>
            <View style={styles.youtubeModalHeader}>
              {/* First Row: Image, Icon above Thumbs, Close Button */}
              <View style={styles.youtubeModalFirstRow}>
                {/* Meal Image - Left */}
                {selectedMeal?.imageUrl && (
                  <Image
                    source={{ uri: selectedMeal.imageUrl }}
                    style={styles.youtubeModalHeaderImage}
                    resizeMode="cover"
                  />
                )}
                
                {/* Icon above Thumbs - Center */}
                {selectedMeal && (
                  <View style={styles.youtubeModalIconAndThumbsContainer}>
                    {/* Meal Type Icon with Label - Above */}
                    {(() => {
                      const mealType = mealTypeMap[selectedMeal.type] || mealTypeMap.breakfast;
                      return (
                        <View style={styles.youtubeModalMealIconContainer}>
                          <Text style={styles.youtubeModalMealIcon}>{mealType.icon}</Text>
                          <Text style={styles.youtubeModalMealIconLabel}>{mealType.title}</Text>
                        </View>
                      );
                    })()}
                    
                    {/* Like/Dislike Buttons - Below Icon */}
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
                  </View>
                )}
                
                {/* Close Button - Right */}
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
              
              {/* Second Row: Full Name */}
              <View style={styles.youtubeModalSecondRow}>
                <Text style={styles.youtubeModalTitle}>
                  {selectedMeal?.name || 'Détails du repas'}
                </Text>
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
                      onChangeState={(event: string) => {
                        if (event === 'playing') {
                          setYoutubePlaying(true);
                        } else if (event === 'paused' || event === 'ended') {
                          setYoutubePlaying(false);
                        }
                      }}
                      onReady={() => {
                        logger.debug('YouTube player ready', { videoId: youtubeVideoId });
                      }}
                      onError={(error: any) => {
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
              
              {/* Navigation Tabs - Recette (gauche) et Ingrédients (droite) */}
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
                      <Text style={[styles.youtubeModalTabTitle, youtubeModalTab === 'recipe' && styles.activeYoutubeModalTabText]}>
                        Recette
                      </Text>
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
                      <Text style={[styles.youtubeModalTabTitle, youtubeModalTab === 'ingredients' && styles.activeYoutubeModalTabText]}>
                        Ingrédients
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              
              {/* Tab Content - Affiche le contenu selon l'onglet sélectionné */}
              {selectedMeal && (() => {
                if (youtubeModalTab === 'recipe') {
                  // Recette Content
                  return (
                    <ScrollView style={styles.youtubeModalTabContent} showsVerticalScrollIndicator={true}>
                      <Text style={styles.contentTitle}>Recette</Text>
                      {selectedMeal.instructions && selectedMeal.instructions.length > 0 ? (
                        (() => {
                          let instructions: string[] = [];
                          if (Array.isArray(selectedMeal.instructions)) {
                            instructions = selectedMeal.instructions;
                          } else if (typeof selectedMeal.instructions === 'string') {
                            try {
                              const parsed = JSON.parse(selectedMeal.instructions);
                              instructions = Array.isArray(parsed) ? parsed : [selectedMeal.instructions];
                            } catch (e) {
                              instructions = [selectedMeal.instructions];
                            }
                          }
                          return instructions.map((instruction: string, index: number) => (
                            <Text key={index} style={styles.recipeStep}>
                              {index + 1}. {instruction}
                            </Text>
                          ));
                        })()
                      ) : (
                        <Text style={styles.noContentText}>
                          Aucune recette disponible pour ce repas
                        </Text>
                      )}
                    </ScrollView>
                  );
                } else {
                  // Ingredients Content
                  return (
                    <ScrollView style={styles.youtubeModalTabContent} showsVerticalScrollIndicator={true}>
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
                          ingredients.map((ingredient: any, index: number) => {
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
                    </ScrollView>
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
        </BlurView>
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
              <Text style={styles.completionModalTitle}>
                {isIOS ? 'Marquer des plats comme complétés' : 'Marquer des repas comme complétés'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowCompletionModal(false);
                  // ✅ Réinitialiser les données fraîches quand on ferme le modal
                  setFreshCompletionData(null);
                }}
                style={styles.completionModalCloseButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.completionModalBody}
              contentContainerStyle={styles.completionModalBodyContent}
              showsVerticalScrollIndicator={true}
            >
              {(() => {
                // ✅ Utiliser les données fraîches si disponibles, sinon utiliser completionStatus
                const completionDataToUse = freshCompletionData || completionStatus;
                
                // Log pour debug
                console.log('🔍 [BOTTOM SHEET] Filtrage des repas:', {
                  totalDayMeals: dayMeals.length,
                  usingFreshData: !!freshCompletionData,
                  hasCompletionData: !!completionDataToUse,
                  hasCompletionsByDay: !!completionDataToUse?.completionsByDay,
                  completionsByDayKeys: completionDataToUse?.completionsByDay ? Object.keys(completionDataToUse.completionsByDay) : [],
                  completionsByDayTotal: completionDataToUse?.completionsByDay ? Object.values(completionDataToUse.completionsByDay).reduce((total: number, dayCompletions: any) => {
                    return total + (Array.isArray(dayCompletions) ? dayCompletions.length : 0);
                  }, 0) : 0,
                });
                
                const mealsList = dayMeals.filter((meal: Meal) => {
                  const isCompletedByIds = completionDataToUse?.dayProgress?.completedMealIds?.includes(meal.id) === true;
                  const isCompletedByStatus = completionDataToUse?.mealStatus?.[meal.id]?.completed === true;
                  const isCompletedInAllCompletions = completionDataToUse?.allCompletions?.some(
                    (completion: any) => completion?.mealId === meal.id
                  ) === true;
                  
                  // ✅ Vérifier dans TOUS les jours de completionsByDay (pas seulement le jour sélectionné)
                  let isCompletedInCompletionsByDay = false;
                  if (completionDataToUse?.completionsByDay) {
                    // Parcourir tous les jours dans completionsByDay
                    Object.values(completionDataToUse.completionsByDay).forEach((dayCompletions: any) => {
                      if (Array.isArray(dayCompletions)) {
                        const found = dayCompletions.some(
                          (completion: any) => completion?.mealId === meal.id && completion?.completedAt
                        );
                        if (found) {
                          isCompletedInCompletionsByDay = true;
                        }
                      }
                    });
                  }
                  
                  // Ne garder que les repas NON complétés
                  const isCompleted = isCompletedByIds || isCompletedByStatus || isCompletedInAllCompletions || isCompletedInCompletionsByDay;
                  
                  if (isCompleted) {
                    console.log(`🚫 [BOTTOM SHEET] Repas ${meal.name} (${meal.id}) filtré car complété:`, {
                      mealId: meal.id,
                      mealName: meal.name,
                      isCompletedByIds,
                      isCompletedByStatus,
                      isCompletedInAllCompletions,
                      isCompletedInCompletionsByDay,
                      completionsByDayCheck: completionDataToUse?.completionsByDay ? 'présent' : 'absent',
                    });
                  }
                  
                  return !isCompleted;
                });
                
                console.log('✅ [BOTTOM SHEET] Résultat du filtrage:', {
                  totalMeals: dayMeals.length,
                  filteredMeals: mealsList.length,
                  filteredMealIds: mealsList.map((m: Meal) => m.id),
                  allMealIds: dayMeals.map((m: Meal) => m.id),
                });
                
                if (mealsList.length === 0) {
                  return (
                    <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                      <Ionicons name="checkmark-circle" size={48} color="#4CAF50" style={{ marginBottom: 12 }} />
                      <Text style={{ fontSize: 18, fontWeight: '600', color: '#4CAF50', textAlign: 'center' }}>
                        {isIOS ? 'Tous les plats sont déjà complétés pour aujourd\'hui' : 'Tous les repas sont déjà complétés pour aujourd\'hui'}
                      </Text>
                      <Text style={{ marginTop: 8, color: '#757575', textAlign: 'center' }}>
                        Bravo ! Continuez comme ça 🎉
                      </Text>
                    </View>
                  );
                }
                
                return mealsList.map((meal: Meal) => {
                const mealType = mealTypeMap[meal.type] || mealTypeMap.breakfast;
                // Tous les repas dans cette liste sont non complétés (filtrage fait au-dessus)
                const isCompleted = false;
                
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
                          <Text style={styles.completionMealPlaceholderText}>{mealType.icon}</Text>
                        </View>
                      )}
                      {/* ✅ Ajouter l'icône et le type de repas à côté de l'image */}
                      <View style={styles.completionMealTypeBadge}>
                        <Text style={styles.completionMealTypeIcon}>{mealType.icon}</Text>
                        <Text style={styles.completionMealTypeText}>{mealType.title}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.completionMealInfo}>
                      <Text style={styles.completionMealName}>{meal.name}</Text>
                      <Text style={styles.completionMealTime}>{mealType.time}</Text>
                      <View style={styles.completionMealDetails}>
                        <Text style={styles.completionMealCalories}>
                          {meal.calories || meal.calorieCount || 'N/A'} kcal
                        </Text>
                        <Text style={styles.completionMealPoints}>
                          {meal.points || meal.pointValue || 0} points
                        </Text>
                      </View>
                    </View>
                    
                    {/* ✅ Masquer le bouton compléter si le repas est déjà complété */}
                    {!isCompleted && (
                      <View style={styles.completionMealActions}>
                        <TouchableOpacity 
                          style={styles.completionDetailsButton}
                          onPress={() => {
                            // Afficher les détails nutritionnels
                            Alert.alert(
                              meal.name,
                              `Détails nutritionnels:\n\n` +
                              `🔥 Calories: ${meal.calories || 0} kcal\n` +
                              `🥩 Protéines: ${meal.proteins || 0}g\n` +
                              `🍚 Glucides: ${meal.carbs || 0}g\n` +
                              `🥑 Lipides: ${meal.fats || 0}g\n\n` +
                              `⭐ Points: ${meal.points || 0}`,
                              [{ text: 'OK', style: 'cancel' }]
                            );
                            logger.info('User Action: View meal nutritional details', { mealId: meal.id });
                          }}
                        >
                          <Ionicons name="information-circle-outline" size={20} color={theme.colors.primary} />
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={styles.completionCheckButton}
                          onPress={async () => {
                            try {
                              await handleMealComplete(meal.id);
                              
                              // ✅ Retirer immédiatement le repas de la liste mealsToComplete
                              setMealsToComplete(prevMeals => 
                                prevMeals.filter(m => m.id !== meal.id)
                              );
                              
                              logger.info('User Action: Mark meal as completed from modal', { mealId: meal.id });
                            } catch (error) {
                              // En cas d'erreur, ne pas fermer le modal pour permettre de réessayer
                              logger.error('Error completing meal from modal', { mealId: meal.id, error });
                            }
                          }}
                        >
                          <Ionicons name="checkmark-outline" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
                });
              })()}
            </ScrollView>
            
            <View style={styles.completionModalFooter}>
              <TouchableOpacity
                style={styles.completeAllButton}
                onPress={async () => {
                  // Filtrer seulement les repas non complétés
                  const incompleteMeals = mealsToComplete.filter((meal: Meal) => {
                    const isCompletedByIds = completionStatus?.dayProgress?.completedMealIds?.includes(meal.id);
                    const isCompletedByStatus = completionStatus?.mealStatus?.[meal.id]?.completed;
                    return !isCompletedByIds && !isCompletedByStatus;
                  });
                  
                  logger.info('User Action: Complete all incomplete meals', { 
                    totalMeals: mealsToComplete.length,
                    incompleteMeals: incompleteMeals.length 
                  });
                  
                  if (incompleteMeals.length === 0) {
                    Toast.show({
                      type: 'info',
                      text1: 'Information',
                      text2: isIOS ? 'Tous les plats sont déjà complétés' : 'Tous les repas sont déjà complétés'
                    });
                    setShowCompletionModal(false);
                    return;
                  }
                  
                  for (const meal of incompleteMeals) {
                    await handleMealComplete(meal.id);
                    // handleMealComplete met déjà à jour le statut immédiatement
                  }
                  // Un seul refresh final pour synchroniser avec le serveur
                  if (currentPlan?.id) {
                    setTimeout(() => {
                      loadDayData();
                    }, 500);
                  }
                  setShowCompletionModal(false);
                  Toast.show({
                    type: 'success',
                    text1: 'Succès',
                    text2: isIOS 
                      ? `${incompleteMeals.length} ${incompleteMeals.length === 1 ? 'plat' : 'plats'} marqué${incompleteMeals.length === 1 ? '' : 's'} comme complété${incompleteMeals.length === 1 ? '' : 's'}`
                      : `${incompleteMeals.length} repas marqués comme complétés`
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

      {/* BlurOverlay supprimé - on a toujours un plan FREE par défaut avec accessLevel ACTIVE */}
      
      {/* Plan Video Modal */}
      <Modal
        visible={showPlanVideoModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowPlanVideoModal(false);
          setPlanVideoPlaying(false);
        }}
      >
        <View style={styles.planVideoModalOverlay}>
          <View style={styles.planVideoModalContent}>
            <View style={styles.planVideoModalHeader}>
              <Text style={styles.planVideoModalTitle}>
                {currentPlan?.name || 'Vidéo du plan'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowPlanVideoModal(false);
                  setPlanVideoPlaying(false);
                }}
                style={styles.planVideoModalCloseButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            {planVideoId && (() => {
              const screenWidth = Dimensions.get('window').width;
              const videoWidth = screenWidth - 32;
              const videoHeight = Math.round((videoWidth * 9) / 16);
              
              return (
                <View style={[styles.planVideoPlayerContainer, { width: videoWidth }]}>
                  <YoutubePlayer
                    height={videoHeight}
                    width={videoWidth}
                    videoId={planVideoId}
                    play={planVideoPlaying}
                    onChangeState={(event: string) => {
                      if (event === 'playing') {
                        setPlanVideoPlaying(true);
                      } else if (event === 'paused' || event === 'ended') {
                        setPlanVideoPlaying(false);
                      }
                    }}
                    onError={(error: any) => {
                      logger.error('Plan video player error', { videoId: planVideoId, error });
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
          </View>
        </View>
      </Modal>
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
  lockedScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100%',
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
  phaseBanner: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  phaseText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '500',
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
  pastDay: {
    opacity: 0.4,
    backgroundColor: '#F5F5F5',
  },
  outsideSubscriptionText: {
    display: 'none',
    color: '#FF6B6B',
  },
  completionStatusTitle: {
    display: 'none',
    marginBottom: 12,
  },
  progressContainer: {
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
    paddingBottom: 24,
  },
  mealsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  mealCard: {
    position: 'relative',
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
  completedMealCard: {
    borderWidth: 3,
    borderColor: '#4CAF50',
    borderStyle: 'solid',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  completedMealBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#4CAF50',
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
    fontSize: 16,
    fontWeight: 'normal',
    color: '#333333',
    marginBottom: 4,
  },
  mealName: {
    fontSize: 14,
    color: '#000000',
    fontWeight: 'normal',
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
  nutritionalValueText: {
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
    marginBottom: 24,
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
    justifyContent: 'flex-end',
  },
  youtubeModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    height: '75%', // Réduire la hauteur pour ne pas soulever trop
    flexDirection: 'column',
  },
  youtubeModalHeader: {
    flexDirection: 'column',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: 12,
  },
  youtubeModalCloseButton: {
    padding: 4,
    marginLeft: 'auto',
  },
  youtubeModalFirstRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  youtubeModalHeaderImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexShrink: 0,
  },
  youtubeModalIconAndThumbsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  youtubeModalSecondRow: {
    width: '100%',
    marginTop: 12,
  },
  youtubeModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    lineHeight: 24,
  },
  youtubeModalMealIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  youtubeModalMealIcon: {
    fontSize: 24,
  },
  youtubeModalMealIconLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
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
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  youtubeModalTabTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  activeYoutubeModalTabText: {
    color: '#000000',
    fontWeight: 'bold',
  },
  recipeSection: {
    marginBottom: 24,
  },
  ingredientsSection: {
    marginBottom: 24,
  },
  youtubeModalTabContent: {
    padding: 20,
    paddingTop: 16,
  },
  contentSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#E0E0E0',
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
  completionMealTypeBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
    gap: 4,
  },
  completionMealTypeIcon: {
    fontSize: 12,
  },
  completionMealTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
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
  completionMealTime: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 8,
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
  
  // Locked Menu Card Styles
  lockedMenuCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  lockedMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  lockedMenuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    flex: 1,
    marginLeft: 8,
  },
  lockedMenuContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  lockedPlateIconContainer: {
    marginBottom: 24,
  },
  lockedPlateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3E5F5',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  lockedForkIcon: {
    position: 'absolute',
    left: -8,
    top: '50%',
    transform: [{ translateY: -8 }],
  },
  lockedKnifeIcon: {
    position: 'absolute',
    right: -8,
    top: '50%',
    transform: [{ translateY: -8 }],
  },
  lockedMenuTitleText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  lockedMenuDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  websiteHighlight: {
    // Hidden: external steering removed for App Store compliance
    display: 'none',
  },
  lasocoachHighlight: {
    color: '#10B981', // Vert
    fontStyle: 'italic',
    fontWeight: '600',
  },
  lockedSubscriptionButton: {
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
    marginBottom: 16,
  },
  lockedSubscriptionButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedSubscriptionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  lockedFreeTrialLink: {
    marginBottom: 8,
  },
  lockedFreeTrialText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  lockedFreeTrialDescription: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: 4,
  },
  iosMessageContainer: {
    alignItems: 'center',
    marginTop: 16,
    width: '100%',
  },
  // Plan Name Row Styles
  planNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  planNameText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    flex: 1,
  },
  // Plan Video Modal Styles
  planVideoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  planVideoModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '95%',
    maxHeight: '90%',
    padding: 20,
  },
  planVideoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  planVideoModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    flex: 1,
  },
  planVideoModalCloseButton: {
    padding: 4,
  },
  planVideoPlayerContainer: {
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: '#000000',
  },
  // Styles pour la carte verrouillée (Android sans abonnement)
  lockedContainer: {
    flex: 1,
    width: '100%',
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 600,
  },
  lockIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  lockedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  lockedMessage: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9800',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  
  // ✅ Carte de progression
  progressCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  progressMealsCountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressMealsCountLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  progressMealsCountValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  progressBarContainerFull: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBarBackgroundFull: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFillFull: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressBarPercentageFull: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    minWidth: 40,
    textAlign: 'right',
  },
  
  // ✅ Bouton "Compléter des repas"
  completeMealsButtonContainer: {
    marginHorizontal: 20,
    marginBottom: 40,
  },
  completeMealsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  completeMealsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // ✅ Completion Modal Styles
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
    minHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
    flexDirection: 'column',
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
    flex: 1,
  },
  completionModalBodyContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    flexGrow: 1,
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
  completionMealTypeBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
    gap: 4,
  },
  completionMealTypeIcon: {
    fontSize: 12,
  },
  completionMealTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
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
  completionMealTime: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 8,
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
  completionDetailsButton: {
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
  completionModalFooter: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 2,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginBottom: -65,
  },
  completeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  completeAllButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  completionCancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  completionCancelButtonText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
});

export default NutritionScreen; 