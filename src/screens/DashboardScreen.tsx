import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { BackHandler, Platform, View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { useFocusEffect, NavigationContainerRef } from '@react-navigation/native';
import { useAuth } from '../context/FirebaseAuthContext';
import { useIOSSimulation } from '../hooks/useIOSSimulation';
import DashboardLayout from './dashboard/components/DashboardLayout';
import { DashboardOverlayStack } from './dashboard/components/DashboardOverlayStack';
import FixedLayout from '../components/FixedLayout';
import MoreMenu from '../components/MoreMenu';
import { useDashboardData } from './dashboard/hooks/useDashboardData';
import { useSubscription } from './dashboard/hooks/useSubscription';
import { useDashboardNavigation } from './dashboard/hooks/useDashboardNavigation';
import { useAchievements } from './dashboard/hooks/useAchievements';
import { useAgenda } from './dashboard/hooks/useAgenda';
import { useCommunity } from './dashboard/hooks/useCommunity';
import { useNutritionData } from './nutrition/hooks/useNutritionData';
import { useNutritionDate } from './nutrition/hooks/useNutritionDate';
import { useCompletionStatus } from './nutrition/hooks/useCompletionStatus';
import { AgendaApi } from '../services/agendaApi';
import { ProfileApi } from '../services/profileApi';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import YoutubePlayer from 'react-native-youtube-iframe';
import { theme } from '../constants/theme';
import NewsDetailBottomSheet from '../components/dashboard/NewsDetailBottomSheet';
import VideoBottomSheet from '../components/nutrition/VideoBottomSheet';
import type { DashboardScreenProps } from './dashboard/types';
import type { Meal } from './nutrition/types';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { DashboardOverlayStackParamList } from '../types/navigation';
import { nutritionSync } from '../utils/nutritionSync';
import { profileSync } from '../utils/profileSync';
import { reviewEngagementBridge } from '../utils/reviewEngagementBridge';
import { reviewEligibilityService } from '../services/review/reviewEligibilityService';
import ReviewPromptHost from '../components/review/ReviewPromptHost';

// ✅ PHASE 1: Import feature flags for testing
import useCompanionMode from '../hooks/useCompanionMode';

// TODO: PHASE 6 - Import entitlements hook for checking user access rights
import { useEntitlements } from '../hooks/useEntitlements';
import { useAppDataCache } from '../context/AppDataCacheContext';
import HomeGuidedTour from '../components/guidedTour/HomeGuidedTour';
import NouveautesBottomSheet from '../components/nouveautes/NouveautesBottomSheet';
import { useNouveautes } from '../hooks/useNouveautes';

// Import all screen components (still in .js, will be migrated later)
import ProgressScreen from './ProgressScreen';
import NutritionScreen from './NutritionScreen';
import AchievementsScreen from './AchievementsScreen';
import DefisScreen from './DefisScreen';

const DashboardScreen: React.FC<DashboardScreenProps> = ({ user, onLogout, navigation }) => {
  const { logout: authLogout } = useAuth();
  const { shouldShowIOSOnly } = useIOSSimulation();
  const isIOS = shouldShowIOSOnly();
  
  // TODO: PHASE 6 - Get user entitlements to determine feature access
  const { entitlements, loading: entitlementsLoading, canAccess, refresh: refreshEntitlements } = useEntitlements();
  
  // ✅ Cache global pour éviter les rechargements
  const appCache = useAppDataCache();
  
  // Custom hooks for data management - Utiliser le cache pour éviter les rechargements
  const { dashboardData, fetchDashboardData, setDashboardData, loading: dashboardLoading } = useDashboardData();
  const { 
    subscriptionData, 
    showSubscriptionAlert, 
    subscriptionAlertType,
    shouldBlurMenu,
    checkSubscriptionStatus 
  } = useSubscription();
  const { achievementsData, fetchAchievementsData } = useAchievements();
  const { agendaData, loading: agendaLoading, fetchAgendaData } = useAgenda();
  const [rendezvousData, setRendezvousData] = useState<any>(null);

  /** Tuto guidé Home : ref du ScrollView et positions des sections pour défilement dynamique */
  const homeScrollViewRef = useRef<ScrollView | null>(null);
  const [homeSectionLayouts, setHomeSectionLayouts] = useState<{ y: number; height: number }[]>([]);
  const handleHomeSectionLayout = useCallback((index: number, y: number, height: number) => {
    setHomeSectionLayouts((prev) => {
      const next = [...prev];
      next[index] = { y, height };
      return next;
    });
  }, []);

  /** Forcer l’affichage du tuto (ex. Paramètres > Revoir le tutoriel) */
  const [forceShowHomeTour, setForceShowHomeTour] = useState(false);
  /** Mesure écran des sections pour le spotlight du tuto */
  const getSectionRectRef = useRef<((index: number) => Promise<{ x: number; y: number; width: number; height: number } | null>) | null>(null);
  const getSectionRect = useCallback((index: number) => getSectionRectRef.current?.(index) ?? Promise.resolve(null), []);
  
  // ✅ Fonction pour récupérer le rendez-vous actuel
  const fetchRendezvousData = useCallback(async (): Promise<void> => {
    try {
      const currentRendezvous = await ProfileApi.getCurrentRendezvous();
      if (currentRendezvous) {
        setRendezvousData(currentRendezvous);
        if (__DEV__) {
          console.log('📅 [DashboardScreen] Rendezvous data fetched:', {
            status: currentRendezvous.status,
            hasAssignedCoach: !!currentRendezvous.assignedCoach,
            assignedCoachName: currentRendezvous.assignedCoach?.name,
          });
        }
      } else {
        setRendezvousData(null);
      }
    } catch (error: any) {
      console.error('Error fetching rendezvous data:', error);
      setRendezvousData(null);
    }
  }, []);
  
  const { 
    communityPosts, 
    loading: communityLoading, 
    fetchCommunityPosts,
    handleLikePress: handleCommunityLikePress 
  } = useCommunity();
  
  // ✅ Charger toutes les données au démarrage UNE SEULE FOIS
  useEffect(() => {
    if (appCache.isInitialLoadComplete) {
      // Données déjà chargées, utiliser le cache
      if (__DEV__) {
        console.log('✅ [DashboardScreen] Utilisation du cache - données déjà chargées');
      }
      return;
    }

    // Charger toutes les données en parallèle au démarrage
    const loadAllData = async () => {
      if (__DEV__) {
        console.log('🚀 [DashboardScreen] Chargement initial de toutes les données...');
      }
      
      try {
        // Charger toutes les données en parallèle
        await Promise.allSettled([
          fetchDashboardData(),
          fetchAchievementsData(),
          fetchAgendaData(),
          fetchCommunityPosts(),
          fetchRendezvousData(),
        ]);
        
        // Marquer le chargement initial comme terminé
        appCache.setInitialLoadComplete(true);
        
        if (__DEV__) {
          console.log('✅ [DashboardScreen] Chargement initial terminé');
        }
      } catch (error) {
        console.error('❌ [DashboardScreen] Erreur lors du chargement initial:', error);
      }
    };

    loadAllData();
  }, [appCache.isInitialLoadComplete, fetchDashboardData, fetchAchievementsData, fetchAgendaData, fetchCommunityPosts, fetchRendezvousData]);

  // ✅ Polling automatique pour rafraîchir les données du rendez-vous toutes les 30 secondes
  useEffect(() => {
    if (!appCache.isInitialLoadComplete) return; // Attendre le chargement initial
    
    // Récupérer immédiatement si pas en cache ou trop vieux
    if (appCache.shouldRefetch('rendezvousData', 30000)) {
      fetchRendezvousData();
    }
    
    // Puis rafraîchir toutes les 30 secondes
    const interval = setInterval(() => {
      fetchRendezvousData();
    }, 30000); // 30 secondes
    
    return () => clearInterval(interval);
  }, [fetchRendezvousData, appCache.isInitialLoadComplete]);
  
  // ✅ PHASE 1: Test companion mode hook
  const companionMode = useCompanionMode();

  // ✅ Nutrition data hooks - Utiliser les mêmes hooks que NutritionScreen pour garantir la cohérence
  const [nutritionSubscriptionData, setNutritionSubscriptionData] = useState<any>(subscriptionData);
  const [plansResponseStatus, setPlansResponseStatus] = useState<number | null>(null);
  const [currentPlan, setCurrentPlan] = useState<any>(null);

  // Date management pour nutrition
  const {
    today: nutritionToday,
    selectedDate: nutritionSelectedDate,
    currentPlanDay,
    weekDays,
    calculateNutritionPlanDay,
  } = useNutritionDate(nutritionSubscriptionData, plansResponseStatus, currentPlan);

  // Completion status hook
  const completionStatusHook = useCompletionStatus(
    currentPlan,
    nutritionSubscriptionData,
    null,
    nutritionSelectedDate,
    [],
    calculateNutritionPlanDay,
    undefined,
    false
  );

  // Nutrition data hook - MÊME logique que NutritionScreen
  const nutritionDataHook = useNutritionData(
    nutritionSubscriptionData,
    setNutritionSubscriptionData,
    weekDays,
    nutritionSelectedDate,
    completionStatusHook.fetchCompletionStatus
  );

  // Update plansResponseStatus and currentPlan from nutritionDataHook
  useEffect(() => {
    setPlansResponseStatus(nutritionDataHook.plansResponseStatus);
    setCurrentPlan(nutritionDataHook.currentPlan);
  }, [nutritionDataHook.plansResponseStatus, nutritionDataHook.currentPlan]);

  // Sync nutritionSubscriptionData with subscriptionData
  useEffect(() => {
    if (subscriptionData) {
      setNutritionSubscriptionData(subscriptionData);
    }
  }, [subscriptionData]);

  // ✅ Charger automatiquement les données nutrition au montage (comme NutritionScreen)
  // Mais seulement si pas déjà chargé ou si données trop vieilles
  useEffect(() => {
    if (!appCache.isInitialLoadComplete) return; // Attendre le chargement initial
    
    if (subscriptionData && weekDays && weekDays.length > 0) {
      // Ne charger que si nécessaire (pas déjà chargé ou trop vieux)
      if (appCache.shouldRefetch('nutritionData', 5 * 60 * 1000)) { // 5 minutes
        nutritionDataHook.fetchAllData();
      }
    }
  }, [subscriptionData, weekDays?.length, appCache.isInitialLoadComplete]);

  // Ref pour tracker le dernier currentPlanDay chargé pour éviter les boucles
  const lastLoadedPlanDayRef = useRef<number | undefined>(undefined);
  const lastLoadedPlanIdRef = useRef<string | null>(null);

  // ✅ Recharger les données du jour avec le currentPlanDay calculé automatiquement
  // Cela garantit que le bon jour est affiché dès le chargement initial
  useEffect(() => {
    const planId = nutritionDataHook.currentPlan?.id;
    const shouldLoad = 
      planId && 
      currentPlanDay !== undefined && 
      weekDays && 
      weekDays.length > 0 &&
      !nutritionDataHook.isLoadingDayData &&
      (lastLoadedPlanDayRef.current !== currentPlanDay || lastLoadedPlanIdRef.current !== planId);
    
    if (shouldLoad) {
      if (__DEV__) {
        console.log('📅 [DashboardScreen] Chargement des données avec currentPlanDay:', {
          currentPlanDay,
          planId,
          lastLoadedPlanDay: lastLoadedPlanDayRef.current,
          lastLoadedPlanId: lastLoadedPlanIdRef.current,
        });
      }
      lastLoadedPlanDayRef.current = currentPlanDay;
      lastLoadedPlanIdRef.current = planId;
      nutritionDataHook.loadDayData(nutritionDataHook.currentPlan, currentPlanDay);
    }
    // ✅ Ne pas inclure isLoadingDayData dans les dépendances pour éviter les boucles
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlanDay, nutritionDataHook.currentPlan?.id, weekDays?.length]);

  // ✅ Callback pour compléter un repas depuis NutritionCard (utilise les hooks de NutritionScreen)
  const handleNutritionMealComplete = useCallback(async (mealId: string, planDayOverride?: number) => {
    if (!currentPlan) return;
    
    try {
      // Utiliser le hook de complétion (même logique que NutritionScreen)
      await completionStatusHook.handleMealComplete(mealId, planDayOverride);
      
      // Rafraîchir le statut de complétion
      if (currentPlan.id) {
        await completionStatusHook.fetchCompletionStatus(currentPlan.id);
      }
      
      // Rafraîchir les données du jour pour mettre à jour la liste des repas
      if (nutritionDataHook.currentPlan?.id) {
        await nutritionDataHook.loadDayData();
      }
      
      // ✅ Notifier les autres écrans (NutritionScreen) du changement
      nutritionSync.emit('meal-completed', { mealId, planDayOverride });
      nutritionSync.emit('completion-status-updated');
    } catch (error) {
      console.error('❌ [DashboardScreen] Erreur lors de la complétion du repas:', error);
      throw error;
    }
  }, [currentPlan, completionStatusHook, nutritionDataHook]);
  
  // ✅ Écouter les changements depuis NutritionScreen
  useEffect(() => {
    const unsubscribeMealCompleted = nutritionSync.subscribe('meal-completed', async (data: any) => {
      void reviewEligibilityService.recordCoreAction();
      setReviewEngagementTick((t) => t + 1);
      // Rafraîchir les données quand un repas est complété dans NutritionScreen
      if (currentPlan?.id) {
        try {
          await completionStatusHook.fetchCompletionStatus(currentPlan.id);
          if (nutritionDataHook.currentPlan?.id) {
            await nutritionDataHook.loadDayData();
          }
        } catch (error) {
          console.error('❌ [DashboardScreen] Erreur lors du rafraîchissement après complétion:', error);
        }
      }
    });
    
    const unsubscribeStatusUpdated = nutritionSync.subscribe('completion-status-updated', async () => {
      // Rafraîchir le statut de complétion
      if (currentPlan?.id) {
        try {
          await completionStatusHook.fetchCompletionStatus(currentPlan.id);
        } catch (error) {
          console.error('❌ [DashboardScreen] Erreur lors du rafraîchissement du statut:', error);
        }
      }
    });
    
    // ✅ Écouter les mises à jour de profil/avatar
    const unsubscribeAvatarUpdated = profileSync.subscribe('avatar-updated', async () => {
      // Rafraîchir dashboardData pour mettre à jour l'avatar dans le header
      console.log('📢 [DashboardScreen] Avatar updated event received, refreshing dashboard data...');
      try {
        await fetchDashboardData();
        console.log('✅ [DashboardScreen] Dashboard data refreshed after avatar update');
      } catch (error) {
        console.error('❌ [DashboardScreen] Error refreshing dashboard data after avatar update:', error);
      }
    });
    
    return () => {
      unsubscribeMealCompleted();
      unsubscribeStatusUpdated();
      unsubscribeAvatarUpdated();
    };
  }, [currentPlan, completionStatusHook, nutritionDataHook, fetchDashboardData]);

  useEffect(() => {
    return reviewEngagementBridge.subscribe(() => {
      setReviewEngagementTick((t) => t + 1);
    });
  }, []);
  
  // Local state
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showCompleteDayModal, setShowCompleteDayModal] = useState<boolean>(false);
  const [selectedMeals, setSelectedMeals] = useState<any[]>([]);
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  // État pour savoir d'où on vient (settings ou security) pour les webviews
  const [webViewSource, setWebViewSource] = useState<string>('settings');
  
  // Meal details modal state
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [showMealModal, setShowMealModal] = useState<boolean>(false);
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [youtubePlaying, setYoutubePlaying] = useState<boolean>(false);
  const [mealModalTab, setMealModalTab] = useState<'recipe' | 'ingredients'>('recipe');
  
  // ✅ News detail bottom sheet state
  const [selectedNews, setSelectedNews] = useState<any | null>(null);
  const [showNewsBottomSheet, setShowNewsBottomSheet] = useState<boolean>(false);

  // ✅ Vidéo repas (bottom sheet dédié, lecture dans l'app)
  const [videoSheetVideoId, setVideoSheetVideoId] = useState<string | null>(null);
  const [videoSheetTitle, setVideoSheetTitle] = useState<string | null>(null);
  const [reviewEngagementTick, setReviewEngagementTick] = useState(0);

  // BackHandler: gestion du bouton retour Android
  const backHandlerTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Ref pour le Stack Navigator des overlays
  const overlayNavigationRef = useRef<{
    navigate: (name: keyof DashboardOverlayStackParamList, params?: any) => void;
    goBack: () => void;
    canGoBack: () => boolean;
  } | null>(null);
  
  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string | null | undefined): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };
  
  // State to track pending navigation
  const [pendingNavigation, setPendingNavigation] = useState<{
    screenName: keyof DashboardOverlayStackParamList;
    params?: any;
  } | null>(null);

  // Navigation hook - create a placeholder navigateOverlay that will be updated
  const {
    activeTab,
    currentScreen,
    showMoreMenu,
    initialProfileStep,
    handleTabPress: handleTabPressOriginal,
    handleMoreMenuItemPress: handleMoreMenuItemPressFromHook,
    handleMoreMenuClose,
    handleProfileStepPress,
    setCurrentScreen,
    previousScreen,
    setActiveTab,
  } = useDashboardNavigation(undefined);

  // ✅ FIX: Wrapper pour handleTabPress qui ferme l'overlay avant de changer de tab
  const handleTabPress = useCallback((tabId: string): void => {
    console.log('🔄 [DashboardScreen] handleTabPress:', {
      tabId,
      currentScreen,
      activeTab,
      isOnOverlay: currentScreen !== 'home' && !['home', 'progress', 'nutrition', 'achievements'].includes(currentScreen)
    });
    
    // Si on est sur un overlay et on clique sur un tab du bottom navigation
    const isOnOverlay = currentScreen !== 'home' && !['home', 'progress', 'nutrition', 'achievements'].includes(currentScreen);
    const isBottomNavTab = ['home', 'progress', 'nutrition', 'achievements', 'more'].includes(tabId);
    
    if (isOnOverlay && isBottomNavTab && tabId !== 'more') {
      console.log('✅ [DashboardScreen] Fermeture de l\'overlay avant changement de tab');
      // ✅ FIX: Mettre à jour activeTab IMMÉDIATEMENT pour que l'indicateur visuel se mette à jour tout de suite
      // Fermer l'overlay et aller directement sur le tab
      setActiveTab(tabId); // Mettre à jour activeTab en premier pour l'indicateur visuel
      setCurrentScreen(tabId);
      handleTabPressOriginal(tabId);
    } else {
      // Comportement normal
      handleTabPressOriginal(tabId);
    }
  }, [currentScreen, activeTab, handleTabPressOriginal, setCurrentScreen, setActiveTab]);

  // Helper function to navigate in overlay stack - defined after setCurrentScreen is available
  const navigateOverlay = useCallback((screenName: keyof DashboardOverlayStackParamList, params?: any) => {
    // Map Stack Navigator route names back to currentScreen values
    const screenMap: Record<keyof DashboardOverlayStackParamList, string> = {
      'Home': 'home',
      'Settings': 'settings',
      'Profile': 'profile',
      'FAQ': 'faq',
      'Notifications': 'notifications',
      'Agenda': 'agenda',
      'Community': 'community',
      'Chat': 'chat',
      'Subscription': 'subscription',
      'Security': 'security',
      'Language': 'language',
      'NotificationSettings': 'notification-settings',
      'PrivacyPolicy': 'privacy-policy',
      'TermsOfService': 'terms-of-service',
      'PlatformRules': 'platform-rules',
      'ContactSupport': 'contact-support',
      'About': 'about',
      'TermsAndPolicies': 'terms-and-policies',
    };
    
    const screenValue = screenMap[screenName] || 'home';
    
    // ✅ FIX: Gérer l'activeTab correctement selon la destination
    console.log('🗺️ [DashboardScreen] navigateOverlay:', {
      screenName,
      screenValue,
      willDeactivateTab: screenValue !== 'home',
      willActivateHome: screenValue === 'home'
    });
    
    // ✅ Si on va sur Home, activer le tab 'home'
    // ✅ Si on va sur un overlay (pas un tab de navigation), désactiver l'activeTab
    if (screenValue === 'home') {
      setActiveTab('home');
    } else if (!['home', 'progress', 'nutrition', 'achievements'].includes(screenValue)) {
      // ✅ Désactiver l'activeTab seulement pour les pages qui ne sont pas des tabs de navigation
      setActiveTab('');
    }
    
    // If Stack Navigator is already mounted, navigate directly
    if (overlayNavigationRef.current) {
      overlayNavigationRef.current.navigate(screenName as any, params);
      setCurrentScreen(screenValue);
    } else {
      // Otherwise, set pending navigation and update currentScreen to mount Stack Navigator
      setPendingNavigation({ screenName, params });
      setCurrentScreen(screenValue);
    }
  }, [setCurrentScreen, setActiveTab]);
  
  // ✅ PHASE 1: Log companion mode status for testing
  useEffect(() => {
    console.log('🏁 [Dashboard] Companion Mode Status:', {
      isCompanionMode: companionMode.isCompanionMode,
      canShowPurchaseFlows: companionMode.canShowPurchaseFlows,
      canInitializePayments: companionMode.canInitializePayments,
      canUseIAP: companionMode.canUseIAP,
      platform: companionMode.platform,
      companionMessage: companionMode.companionMessage,
    });
  }, [companionMode]);

  // TODO: PHASE 6 - Log entitlements for testing
  useEffect(() => {
    console.log('📋 [Dashboard] User Entitlements:', {
      loading: entitlementsLoading,
      subscriptionStatus: entitlements.subscriptionStatus,
      canAccessNutrition: entitlements.canAccessNutrition,
      canAccessChat: entitlements.canAccessChat,
      canAccessAnalytics: entitlements.canAccessAdvancedAnalytics,
      canAccessCoaching: entitlements.canAccessCoachingPlans,
      canAccessDiet: entitlements.canAccessDietPlans,
      expiresAt: entitlements.subscriptionExpiresAt,
    });
  }, [entitlements, entitlementsLoading]);
  
  // Override handleMoreMenuItemPress to use navigateOverlay
  const handleMoreMenuItemPress = useCallback((itemId: string) => {
    const routeMap: Record<string, keyof DashboardOverlayStackParamList> = {
      'chat': 'Chat',
      'notifications': 'Notifications',
      'community': 'Community',
      'agenda': 'Agenda',
      'settings': 'Settings',
    };
    const route = routeMap[itemId];
    if (route) {
      navigateOverlay(route);
    }
    handleMoreMenuClose();
  }, [navigateOverlay, handleMoreMenuClose]);

  // Effect to handle pending navigation once Stack Navigator is mounted
  useEffect(() => {
    if (pendingNavigation) {
      // Wait a bit for NavigationContainer to be ready
      const timer = setTimeout(() => {
        if (overlayNavigationRef.current) {
          try {
            overlayNavigationRef.current.navigate(pendingNavigation.screenName, pendingNavigation.params);
            setPendingNavigation(null);
          } catch (error) {
            console.warn('Navigation error, retrying...', error);
            // Retry after a longer delay
            setTimeout(() => {
              if (overlayNavigationRef.current) {
                overlayNavigationRef.current.navigate(pendingNavigation.screenName, pendingNavigation.params);
                setPendingNavigation(null);
              }
            }, 200);
          }
        } else {
          // If still not mounted, try again
          console.warn('Stack Navigator not mounted yet, retrying...');
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [pendingNavigation, currentScreen]);

  // Helper function to go back in overlay stack
  const goBackOverlay = useCallback(() => {
    if (overlayNavigationRef.current?.canGoBack()) {
      overlayNavigationRef.current.goBack();
      return true;
    }
    return false;
  }, []);
  
  useEffect(() => {
    // Seulement sur Android
    if (Platform.OS !== 'android') {
      return;
    }

    const backAction = (): boolean => {
      // Si on est dans un écran overlay, utiliser goBack() du Stack Navigator
      if (currentScreen !== 'home' && currentScreen !== activeTab) {
        const wentBack = goBackOverlay();
        if (wentBack) {
          // Mettre à jour currentScreen après le retour
          // Le Stack Navigator gère automatiquement la pile
          return true;
        }
        // Si on ne peut pas revenir en arrière, aller à home
        handleTabPress('home');
        return true;
      }

      // Si on est sur un tab (pas home), aller à home
      if (activeTab !== 'home') {
        handleTabPress('home');
        return true;
      }

      // Si on est sur home, gérer le double-clic pour quitter
      if (backHandlerTimeout.current) {
        // Deuxième clic dans les 2 secondes : quitter l'application
        clearTimeout(backHandlerTimeout.current);
        backHandlerTimeout.current = null;
        BackHandler.exitApp();
        return true;
      } else {
        // Premier clic : afficher un message et attendre le deuxième clic
        Toast.show({
          type: 'info',
          text1: 'Appuyez à nouveau pour quitter',
          visibilityTime: 2000,
        });
        
        // Définir un timeout de 2 secondes
        backHandlerTimeout.current = setTimeout(() => {
          backHandlerTimeout.current = null;
        }, 2000);
        
        return true; // Empêcher le comportement par défaut
      }
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => {
      backHandler.remove();
      if (backHandlerTimeout.current) {
        clearTimeout(backHandlerTimeout.current);
      }
    };
  }, [currentScreen, activeTab, handleTabPress, goBackOverlay]);

  // Check if profile is complete (4 steps: profile_setup, goals_setup, recommendations, rendezvous)
  // If backend returns isComplete: true, trust that. Otherwise, verify all 4 steps are completed
  const completedSteps = dashboardData?.onboarding?.data?.completedSteps || [];
  const allFourStepsCompleted = 
    completedSteps.includes('profile_setup') &&
    completedSteps.includes('goals_setup') &&
    completedSteps.includes('recommendations') &&
    completedSteps.includes('rendezvous');
  
  // ✅ MODIFICATION: Utiliser le rendezvousData depuis l'état local (mis à jour automatiquement)
  // Fallback vers dashboardData si pas encore chargé
  const currentRendezvousData = rendezvousData || dashboardData?.rendezvous || dashboardData?.rendezVous || null;
  
  // Un rendez-vous est considéré comme assigné si :
  // - Le statut est ASSIGNED ou CONFIRMED
  // - OU un coach est assigné (assignedCoach existe)
  const isRendezvousAssigned = currentRendezvousData && (
    currentRendezvousData.status === 'ASSIGNED' || 
    currentRendezvousData.status === 'CONFIRMED' ||
    !!currentRendezvousData.assignedCoach
  );
  
  // ✅ MODIFICATION: Le profil est complet seulement si toutes les étapes sont complétées ET le rendez-vous est assigné
  const isProfileComplete = (dashboardData?.onboarding?.data?.isComplete || allFourStepsCompleted) && isRendezvousAssigned;
  
  // Nouveautés Home : affiché une seule fois quand l'utilisateur est sur l'onglet Home
  const {
    visible: showNouveautesHome,
    onComplete: onNouveautesHomeComplete,
    steps: nouveautesHomeSteps,
  } = useNouveautes('home', undefined, { trigger: activeTab === 'home' });

  // Debug log to help verify completion status
  if (__DEV__) {
    console.log('📊 [DashboardScreen] Profile completion check:', {
      isCompleteFromBackend: dashboardData?.onboarding?.data?.isComplete,
      completedSteps,
      allFourStepsCompleted,
      isRendezvousAssigned,
      rendezvousStatus: currentRendezvousData?.status,
      hasAssignedCoach: !!currentRendezvousData?.assignedCoach,
      assignedCoachName: currentRendezvousData?.assignedCoach?.name,
      isProfileComplete,
      stepCount: completedSteps.length,
      rendezvousDataFromState: !!rendezvousData,
      rendezvousDataFromDashboard: !!dashboardData?.rendezvous,
    });
  }

  // Mémoriser l'avatar pour éviter les rechargements à chaque changement de page
  // ✅ Utiliser user?.avatar en priorité car il est mis à jour immédiatement via refreshProfile()
  const avatarData = useMemo(() => {
    const avatarSource = user?.avatar || dashboardData?.Profile?.avatar || dashboardData?.profile?.avatar;
    const avatarFallbackText = user?.firstName?.charAt(0) || user?.name?.charAt(0) || 'U';
    return { avatarSource, avatarFallbackText };
  }, [user?.avatar, dashboardData?.Profile?.avatar, dashboardData?.profile?.avatar, user?.firstName, user?.name]);

  // Refresh all data
  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchDashboardData(),
        fetchAchievementsData(),
        fetchAgendaData(),
        fetchCommunityPosts(),
        checkSubscriptionStatus(),
        fetchRendezvousData(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  // Mise à jour automatique quand l'écran revient au focus
  useFocusEffect(
    useCallback(() => {
      // Rafraîchir les données quand l'écran revient au focus
      onRefresh();
    }, [])
  );


  // Handlers
  const handleSubscriptionRenew = async (): Promise<void> => {
    console.log('🔔 [DashboardScreen] handleSubscriptionRenew appelé');
    console.log('🔔 [DashboardScreen] isIOS:', isIOS);
    console.log('🔔 [DashboardScreen] activeTab AVANT:', activeTab);
    console.log('🔔 [DashboardScreen] navigateOverlay:', navigateOverlay);
    // Sur iOS, ne pas rediriger vers la page subscription (Reader App model)
    // Les cartes verrouillées afficheront le message de vérifier le statut
    if (isIOS) {
      // Sur iOS, on ne redirige jamais vers la page subscription
      console.log('ℹ️ [DashboardScreen] iOS détecté - pas de redirection');
      return;
    }
    // Rediriger vers la page d'abonnement dédiée (Android uniquement)
    console.log('✅ [DashboardScreen] Android détecté - redirection vers Subscription');
    // ✅ FIX: Désactiver l'activeTab AVANT de naviguer
    setActiveTab('');
    console.log('✅ [DashboardScreen] activeTab désactivé');
    navigateOverlay('Subscription');
    console.log('✅ [DashboardScreen] navigateOverlay(\'Subscription\') appelé');
    console.log('✅ [DashboardScreen] activeTab APRÈS:', '');
  };

  const loadSubscriptionPlans = async (): Promise<void> => {
    // Subscription plans loading disabled - using backend entitlements only
    return;
  };

  const handleCompleteProfile = (): void => {
    setCurrentScreen('profile');
    handleProfileStepPress(1);
  };

  const handleMealPress = async (meal: any): Promise<void> => {
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
    setShowMealModal(true);
  };

  const handlePostPress = (post: any): void => {
    // ✅ Si c'est une news (type === 'content'), ouvrir la bottomsheet au lieu de rediriger vers l'agora
    if (post?.type === 'content') {
      setSelectedNews(post);
      setShowNewsBottomSheet(true);
      return;
    }
    
    // Pour les autres types (posts de communauté), rediriger vers Community
    setSelectedPostId(post?.id || null);
    navigateOverlay('Community');
  };

  const handleCommentPress = (postId: string): void => {
  };

  const handleMarkContentComplete = async (contentId: string): Promise<void> => {
    try {
      await AgendaApi.markContentComplete(contentId);
      await fetchAgendaData();
      void reviewEligibilityService.recordCoreAction();
      setReviewEngagementTick((t) => t + 1);
    } catch (error: any) {
    }
  };

  const handleProgressRefresh = async (): Promise<void> => {
    await fetchDashboardData();
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await authLogout();
      if (onLogout) {
        onLogout();
      }
    } catch (error: any) {
    }
  };

  // Map currentScreen to Stack Navigator route names
  const getOverlayRouteName = (screen: string): keyof DashboardOverlayStackParamList | null => {
    const routeMap: Record<string, keyof DashboardOverlayStackParamList> = {
      'settings': 'Settings',
      'profile': 'Profile',
      'faq': 'FAQ',
      'notifications': 'Notifications',
      'agenda': 'Agenda',
      'community': 'Community',
      'chat': 'Chat',
      // ✅ iOS COMPLIANCE: Subscription removed from navigation on iOS (unless companion mode is enabled)
      ...(companionMode.isCompanionMode ? {} : { 'subscription': 'Subscription' }),
      'security': 'Security',
      'language': 'Language',
      'notification-settings': 'NotificationSettings',
      'privacy-policy': 'PrivacyPolicy',
      'terms-of-service': 'TermsOfService',
      'platform-rules': 'PlatformRules',
      'contact-support': 'ContactSupport',
      'about': 'About',
      'terms-and-policies': 'TermsAndPolicies',
    };
    console.log('🗺️ [DashboardScreen] getOverlayRouteName:', {
      screen,
      isCompanionMode: companionMode.isCompanionMode,
      hasSubscriptionRoute: !!routeMap['subscription'],
      result: routeMap[screen] || null
    });
    return routeMap[screen] || null;
  };

  // Determine initial route for Stack Navigator
  const overlayInitialRoute = currentScreen !== 'home' && getOverlayRouteName(currentScreen) 
    ? getOverlayRouteName(currentScreen) || 'Home' 
    : 'Home';

  // Get user name for welcome bottom sheet - vérifier plusieurs sources
  const userName = useMemo(() => {
    // Priorité 1: firstName depuis user
    if (user?.firstName) {
      return user.firstName;
    }
    // Priorité 2: name depuis user (extraire le prénom si c'est "Prénom Nom")
    if (user?.name) {
      const nameParts = user.name.trim().split(' ');
      return nameParts[0] || user.name;
    }
    // Priorité 3: firstName depuis dashboardData
    if (dashboardData?.Profile?.firstName) {
      return dashboardData.Profile.firstName;
    }
    if (dashboardData?.profile?.Profile?.firstName) {
      return dashboardData.profile.Profile.firstName;
    }
    if (dashboardData?.profile?.firstName) {
      return dashboardData.profile.firstName;
    }
    // Fallback
    return 'Utilisateur';
  }, [user?.firstName, user?.name, dashboardData?.Profile?.firstName, dashboardData?.profile?.Profile?.firstName, dashboardData?.profile?.firstName]);

  const reviewPromptEl = (
    <ReviewPromptHost
      activeTab={activeTab}
      currentScreen={currentScreen}
      profileComplete={isProfileComplete}
      user={user}
      engagementTick={reviewEngagementTick}
    />
  );

  // Screen routing logic - Use Stack Navigator for overlay screens
  // Always render Stack Navigator, but only show it when currentScreen is an overlay screen
  if (currentScreen !== 'home' && getOverlayRouteName(currentScreen)) {
    return (
      <>
      <DashboardOverlayStack
        user={user}
        activeTab={activeTab}
        showMoreMenu={showMoreMenu}
        avatarData={avatarData}
        initialProfileStep={initialProfileStep}
        webViewSource={webViewSource}
        selectedPostId={selectedPostId}
        onLogout={handleLogout}
        onTabPress={(tabId: string) => {
          if (tabId === 'home') {
            setCurrentScreen('home');
          } else {
            handleTabPress(tabId);
          }
        }}
        onMoreMenuClose={handleMoreMenuClose}
        onMoreMenuItemPress={handleMoreMenuItemPress}
        onProfileStepPress={handleProfileStepPress}
        onRefresh={onRefresh}
        onPostPress={handlePostPress}
        setWebViewSource={setWebViewSource}
        navigation={navigation}
        overlayNavigationRef={overlayNavigationRef}
        initialRouteName={overlayInitialRoute}
        onRequestShowHomeTour={() => {
          setCurrentScreen('home');
          setForceShowHomeTour(true);
        }}
      />
      {reviewPromptEl}
      </>
    );
  }
  
  // ============================================
  // TABS DE NAVIGATION (vérifiés EN DERNIER)
  // ============================================
  if (activeTab === 'progress') {
    return (
      <>
        <FixedLayout
          headerTitle="Progression"
          activeTab={activeTab}
          onTabPress={handleTabPress}
          onHelpPress={() => navigateOverlay('FAQ')}
          onNotificationPress={() => navigateOverlay('Notifications')}
          onProfilePress={() => navigateOverlay('Settings')}
          avatarSource={avatarData.avatarSource}
          avatarFallbackText={avatarData.avatarFallbackText}
        >
          <ProgressScreen 
            user={user} 
            onLogout={handleLogout} 
            onTabPress={handleTabPress}
            activeTab={activeTab}
            onSubscriptionRenew={handleSubscriptionRenew}
            onFAQPress={() => navigateOverlay('FAQ')}
          />
        </FixedLayout>
        <MoreMenu 
          visible={showMoreMenu}
          onClose={handleMoreMenuClose}
          onMenuItemPress={handleMoreMenuItemPress}
        />
        {reviewPromptEl}
      </>
    );
  }

  if (activeTab === 'nutrition') {
    return (
      <>
        <FixedLayout
          headerTitle="Nutrition"
          activeTab={activeTab}
          onTabPress={handleTabPress}
          onHelpPress={() => navigateOverlay('FAQ')}
          onNotificationPress={() => navigateOverlay('Notifications')}
          onProfilePress={() => navigateOverlay('Settings')}
          avatarSource={avatarData.avatarSource}
          avatarFallbackText={avatarData.avatarFallbackText}
        >
          <NutritionScreen 
            user={user} 
            onLogout={handleLogout} 
            onTabPress={handleTabPress}
            activeTab={activeTab}
            onSubscriptionRenew={handleSubscriptionRenew}
            onFAQPress={() => navigateOverlay('FAQ')}
          />
        </FixedLayout>
        <MoreMenu 
          visible={showMoreMenu}
          onClose={handleMoreMenuClose}
          onMenuItemPress={handleMoreMenuItemPress}
        />
        {reviewPromptEl}
      </>
    );
  }

  if (activeTab === 'achievements') {
    return (
      <>
        <FixedLayout
          headerTitle="Réalisations"
          activeTab={activeTab}
          onTabPress={handleTabPress}
          onHelpPress={() => navigateOverlay('FAQ')}
          onNotificationPress={() => navigateOverlay('Notifications')}
          onProfilePress={() => navigateOverlay('Settings')}
          avatarSource={avatarData.avatarSource}
          avatarFallbackText={avatarData.avatarFallbackText}
        >
          <AchievementsScreen 
            user={user} 
            onLogout={handleLogout} 
            onTabPress={handleTabPress}
            activeTab={activeTab}
            onSubscriptionRenew={handleSubscriptionRenew}
          />
        </FixedLayout>
        <MoreMenu 
          visible={showMoreMenu}
          onClose={handleMoreMenuClose}
          onMenuItemPress={handleMoreMenuItemPress}
        />
        {reviewPromptEl}
      </>
    );
  }

  // Default home screen
  return (
    <>
      <DashboardLayout
        user={user}
        activeTab={activeTab}
        showMoreMenu={showMoreMenu}
        dashboardData={dashboardData}
        achievementsData={achievementsData}
        subscriptionData={subscriptionData}
        agendaData={agendaData}
        rendezvousData={currentRendezvousData}
        communityPosts={communityPosts}
        agendaLoading={agendaLoading}
        communityLoading={communityLoading}
        refreshing={refreshing}
        isProfileComplete={isProfileComplete}
        shouldBlurMenu={shouldBlurMenu}
        onHelpPress={() => navigateOverlay('FAQ')}
        onNotificationPress={() => navigateOverlay('Notifications')}
        onProfilePress={() => navigateOverlay('Settings')}
        onTabPress={handleTabPress}
        onMoreMenuClose={handleMoreMenuClose}
        onMoreMenuItemPress={handleMoreMenuItemPress}
        onSubscriptionRenew={handleSubscriptionRenew}
        onRefresh={onRefresh}
        onProgressRefresh={handleProgressRefresh}
        onCompleteProfile={handleCompleteProfile}
        onProfileStepPress={handleProfileStepPress}
        onMealPress={handleMealPress}
        onPostPress={handlePostPress}
        onLikePress={handleCommunityLikePress}
        onCommentPress={handleCommentPress}
        onMarkContentComplete={handleMarkContentComplete}
        onCompleteDayPress={() => setShowCompleteDayModal(true)}
        // ✅ Passer les données nutrition de NutritionScreen
        nutritionDayMeals={nutritionDataHook.dayMeals}
        nutritionCurrentPlanDay={currentPlanDay}
        nutritionCompletionData={completionStatusHook.freshCompletionData || completionStatusHook.completionStatus}
        nutritionCurrentPlan={currentPlan}
        onNutritionMealComplete={handleNutritionMealComplete}
        onOpenVideo={(videoId, title) => {
          setVideoSheetVideoId(videoId);
          setVideoSheetTitle(title ?? null);
        }}
        scrollViewRef={homeScrollViewRef}
        onSectionLayout={handleHomeSectionLayout}
        onRegisterGetSectionRect={(getter: (index: number) => Promise<{ x: number; y: number; width: number; height: number } | null>) => { getSectionRectRef.current = getter; }}
      />

      <VideoBottomSheet
        visible={!!videoSheetVideoId}
        videoId={videoSheetVideoId}
        title={videoSheetTitle ?? undefined}
        onClose={() => {
          setVideoSheetVideoId(null);
          setVideoSheetTitle(null);
        }}
      />

      {/* Tuto guidé Home : masqué pour l'instant (on reviendra dessus) */}
      {false && (
        <HomeGuidedTour
          scrollViewRef={homeScrollViewRef}
          sectionLayouts={homeSectionLayouts}
          getSectionRect={getSectionRect}
          forceShow={forceShowHomeTour}
          onComplete={() => setForceShowHomeTour(false)}
        />
      )}

      {/* Meal Details Modal */}
      <Modal
        visible={showMealModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowMealModal(false);
          setYoutubePlaying(false);
        }}
      >
        <View style={mealModalStyles.overlay}>
          <BlurView
            intensity={20}
            tint="dark"
            style={StyleSheet.absoluteFillObject}
          />
          <View style={mealModalStyles.content}>
            <View style={mealModalStyles.header}>
              {/* Meal Image - Left */}
              {selectedMeal?.imageUrl && (
                <Image
                  source={{ uri: selectedMeal.imageUrl }}
                  style={mealModalStyles.headerImage}
                  resizeMode="cover"
                />
              )}
              
              {/* Title and Close - Right */}
              <View style={mealModalStyles.titleContainer}>
                <View style={mealModalStyles.titleRow}>
                  <View style={mealModalStyles.titleWrapper}>
                    <Text style={mealModalStyles.title} numberOfLines={1}>
                      {selectedMeal?.name || 'Détails du repas'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setShowMealModal(false);
                      setYoutubePlaying(false);
                    }}
                    style={mealModalStyles.closeButton}
                  >
                    <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            <ScrollView 
              style={mealModalStyles.body}
              contentContainerStyle={mealModalStyles.bodyContent}
              showsVerticalScrollIndicator={true}
            >
              {/* YouTube Video */}
              {youtubeVideoId && (() => {
                const screenWidth = Dimensions.get('window').width;
                const videoWidth = screenWidth - 32;
                const videoHeight = Math.round((videoWidth * 9) / 16);
                
                return (
                  <View style={[mealModalStyles.videoContainer, { width: videoWidth }]}>
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
                      onError={(error: any) => {
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
              
              {/* Navigation Tabs - Recette et Ingrédients */}
              {selectedMeal && (
                <View style={mealModalStyles.tabsContainer}>
                  <View style={mealModalStyles.tabs}>
                    <TouchableOpacity 
                      style={[mealModalStyles.tab, mealModalTab === 'recipe' && mealModalStyles.activeTab]}
                      onPress={() => setMealModalTab('recipe')}
                    >
                      <Ionicons 
                        name="restaurant" 
                        size={20} 
                        color={mealModalTab === 'recipe' ? "#000000" : "#666666"} 
                      />
                      <Text style={[mealModalStyles.tabTitle, mealModalTab === 'recipe' && mealModalStyles.activeTabText]}>
                        Recette
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[mealModalStyles.tab, mealModalTab === 'ingredients' && mealModalStyles.activeTab]}
                      onPress={() => setMealModalTab('ingredients')}
                    >
                      <Ionicons 
                        name="list" 
                        size={20} 
                        color={mealModalTab === 'ingredients' ? "#000000" : "#666666"} 
                      />
                      <Text style={[mealModalStyles.tabTitle, mealModalTab === 'ingredients' && mealModalStyles.activeTabText]}>
                        Ingrédients
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              
              {/* Tab Content */}
              {selectedMeal && (() => {
                if (mealModalTab === 'recipe') {
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
                  
                  return (
                    <ScrollView style={mealModalStyles.tabContent} showsVerticalScrollIndicator={true}>
                      <Text style={mealModalStyles.contentTitle}>Recette</Text>
                      {instructions.length > 0 ? (
                        instructions.map((instruction: string, index: number) => (
                          <Text key={index} style={mealModalStyles.recipeStep}>
                            {index + 1}. {instruction}
                          </Text>
                        ))
                      ) : (
                        <Text style={mealModalStyles.noContentText}>
                          Aucune recette disponible pour ce repas
                        </Text>
                      )}
                    </ScrollView>
                  );
                } else {
                  let ingredients = selectedMeal.ingredients;
                  if (typeof ingredients === 'string') {
                    try {
                      ingredients = JSON.parse(ingredients);
                    } catch (e) {
                      ingredients = [];
                    }
                  }
                  
                  return (
                    <ScrollView style={mealModalStyles.tabContent} showsVerticalScrollIndicator={true}>
                      <Text style={mealModalStyles.contentTitle}>Liste des ingrédients</Text>
                      {ingredients && Array.isArray(ingredients) && ingredients.length > 0 ? (
                        ingredients.map((ingredient: any, index: number) => {
                          const ingredientName = typeof ingredient === 'string' ? ingredient : (ingredient.name || ingredient);
                          const ingredientAmount = ingredient.amount;
                          const ingredientUnit = ingredient.unit;
                          
                          return (
                            <View key={index} style={mealModalStyles.ingredientItem}>
                              <Text style={mealModalStyles.ingredientNumber}>{index + 1}.</Text>
                              <View style={mealModalStyles.ingredientDetails}>
                                <Text style={mealModalStyles.ingredientText}>
                                  {ingredientName}
                                </Text>
                                {ingredientAmount && ingredientUnit && (
                                  <Text style={mealModalStyles.ingredientAmount}>
                                    – {ingredientAmount} {ingredientUnit}
                                  </Text>
                                )}
                              </View>
                            </View>
                          );
                        })
                      ) : (
                        <Text style={mealModalStyles.noContentText}>
                          Aucun ingrédient disponible pour ce repas
                        </Text>
                      )}
                    </ScrollView>
                  );
                }
              })()}
            </ScrollView>
            
            {/* Logo at bottom */}
            <View style={mealModalStyles.logoContainer}>
              <Image
                source={require('../../assets/logo.png')}
                style={mealModalStyles.logo}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* News Detail Bottom Sheet */}
      <NewsDetailBottomSheet
        visible={showNewsBottomSheet}
        news={selectedNews}
        onClose={() => {
          setShowNewsBottomSheet(false);
          setSelectedNews(null);
        }}
        onMarkComplete={handleMarkContentComplete}
      />

      {/* Nouveautés Home (une étape) - une seule fois à la première connexion / premier passage sur Home */}
      <NouveautesBottomSheet
        visible={showNouveautesHome}
        steps={nouveautesHomeSteps}
        onComplete={onNouveautesHomeComplete}
        welcomeUserName={
          user?.firstName
          || (typeof user?.name === 'string' ? user.name.trim().split(/\s+/)[0] : null)
          || (dashboardData?.profile?.firstName || dashboardData?.Profile?.firstName)
          || undefined
        }
        variant="home"
      />

      {reviewPromptEl}

    </>
  );
};

const mealModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    height: '90%',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: 12,
  },
  headerImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexShrink: 0,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'column',
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleWrapper: {
    flex: 1,
    paddingRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingBottom: 20,
    flexGrow: 1,
  },
  videoContainer: {
    alignSelf: 'center',
    marginTop: 16,
    marginBottom: 0,
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: '#000000',
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    marginBottom: 8,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 6,
    minWidth: 100,
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: '#F0F0F0',
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  tabTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  activeTabText: {
    color: '#000000',
    fontWeight: 'bold',
  },
  tabContent: {
    padding: 20,
    paddingTop: 16,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  recipeStep: {
    fontSize: 14,
    color: theme.colors.text.primary,
    lineHeight: 22,
    marginBottom: 8,
  },
  noContentText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
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
  ingredientNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginRight: 8,
    minWidth: 20,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: 'auto',
  },
  logo: {
    width: 60,
    height: 30,
    opacity: 0.7,
  },
});

const styles = StyleSheet.create({
  communityComingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  communityComingSoonCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  communityComingSoonTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    color: '#111827',
  },
  communityComingSoonMessage: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    color: '#4B5563',
  },
});

export default DashboardScreen as React.ComponentType<any>;
