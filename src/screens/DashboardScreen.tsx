import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { BackHandler, Platform, View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useFocusEffect, NavigationContainerRef } from '@react-navigation/native';
import { useAuth } from '../context/FirebaseAuthContext';
import { useIOSSimulation } from '../hooks/useIOSSimulation';
import DashboardLayout from './dashboard/components/DashboardLayout';
import SubscriptionPlansModal from './dashboard/modals/SubscriptionPlansModal';
import { DashboardOverlayStack } from './dashboard/components/DashboardOverlayStack';
import FixedLayout from '../components/FixedLayout';
import MoreMenu from '../components/MoreMenu';
import { useDashboardData } from './dashboard/hooks/useDashboardData';
import { useSubscription } from './dashboard/hooks/useSubscription';
import { useDashboardNavigation } from './dashboard/hooks/useDashboardNavigation';
import { useAchievements } from './dashboard/hooks/useAchievements';
import { useAgenda } from './dashboard/hooks/useAgenda';
import { useCommunity } from './dashboard/hooks/useCommunity';
import SubscriptionApi from '../services/subscriptionApi';
import { AgendaApi } from '../services/agendaApi';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import YoutubePlayer from 'react-native-youtube-iframe';
import { theme } from '../constants/theme';
import type { DashboardScreenProps } from './dashboard/types';
import type { Meal } from './nutrition/types';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { DashboardOverlayStackParamList } from '../types/navigation';

// Import all screen components (still in .js, will be migrated later)
import ProgressScreen from './ProgressScreen';
import NutritionScreen from './NutritionScreen';
import AchievementsScreen from './AchievementsScreen';
import DefisScreen from './DefisScreen';

const DashboardScreen: React.FC<DashboardScreenProps> = ({ user, onLogout, navigation }) => {
  const { logout: authLogout } = useAuth();
  const { shouldShowIOSOnly } = useIOSSimulation();
  const isIOS = shouldShowIOSOnly();
  
  // Custom hooks for data management
  const { dashboardData, fetchDashboardData, setDashboardData } = useDashboardData();
  const { 
    subscriptionData, 
    showSubscriptionAlert, 
    subscriptionAlertType,
    shouldBlurMenu,
    checkSubscriptionStatus 
  } = useSubscription();
  const { achievementsData, fetchAchievementsData } = useAchievements();
  const { agendaData, loading: agendaLoading, fetchAgendaData } = useAgenda();
  const { 
    communityPosts, 
    loading: communityLoading, 
    fetchCommunityPosts,
    handleLikePress: handleCommunityLikePress 
  } = useCommunity();
  
  // Local state
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showPlansBottomSheet, setShowPlansBottomSheet] = useState<boolean>(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState<boolean>(false);
  const [showPaymentFlow, setShowPaymentFlow] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
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
    handleTabPress,
    handleMoreMenuItemPress: handleMoreMenuItemPressFromHook,
    handleMoreMenuClose,
    handleProfileStepPress,
    setCurrentScreen,
    previousScreen,
  } = useDashboardNavigation(undefined);

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
    };
    
    const screenValue = screenMap[screenName] || 'home';
    
    // If Stack Navigator is already mounted, navigate directly
    if (overlayNavigationRef.current) {
      overlayNavigationRef.current.navigate(screenName as any, params);
      setCurrentScreen(screenValue);
    } else {
      // Otherwise, set pending navigation and update currentScreen to mount Stack Navigator
      setPendingNavigation({ screenName, params });
      setCurrentScreen(screenValue);
    }
  }, [setCurrentScreen]);
  
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
  
  const isProfileComplete = dashboardData?.onboarding?.data?.isComplete || allFourStepsCompleted;
  
  // Debug log to help verify completion status
  if (__DEV__) {
    console.log('📊 [DashboardScreen] Profile completion check:', {
      isCompleteFromBackend: dashboardData?.onboarding?.data?.isComplete,
      completedSteps,
      allFourStepsCompleted,
      isProfileComplete,
      stepCount: completedSteps.length,
    });
  }

  // Mémoriser l'avatar pour éviter les rechargements à chaque changement de page
  const avatarData = useMemo(() => {
    const avatarSource = dashboardData?.Profile?.avatar || dashboardData?.profile?.avatar || user?.avatar;
    const avatarFallbackText = user?.firstName?.charAt(0) || user?.name?.charAt(0) || 'U';
    return { avatarSource, avatarFallbackText };
  }, [dashboardData?.Profile?.avatar, dashboardData?.profile?.avatar, user?.avatar, user?.firstName, user?.name]);

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
    // Sur iOS, ne pas rediriger vers la page subscription (Reader App model)
    // Les cartes verrouillées afficheront le message de vérifier le statut
    if (isIOS) {
      // Sur iOS, on ne redirige jamais vers la page subscription
      return;
    }
    // Rediriger vers la page d'abonnement dédiée (Android uniquement)
    navigateOverlay('Subscription');
  };

  const loadSubscriptionPlans = async (): Promise<void> => {
    try {
      setLoadingPlans(true);
      const plans = await SubscriptionApi.getPlans();
      // Filter out plans without valid IDs
      const validPlans = plans.filter((plan: any) => 
        plan?.id && typeof plan.id === 'string' && plan.id.trim() !== ''
      );
      setSubscriptionPlans(validPlans);
    } catch (error: any) {
      throw error;
    } finally {
      setLoadingPlans(false);
    }
  };

  const handlePlanSelect = async (plan: any): Promise<void> => {
    try {
      setSelectedPlan(plan);
      setShowPaymentFlow(true);
    } catch (error: any) {
    }
  };

  const handlePaymentSuccess = async (paymentData: any): Promise<void> => {
    Toast.show({
      type: 'success',
      text1: 'Abonnement activé',
      text2: 'Votre abonnement a été activé avec succès',
    });
    
    // Rafraîchir toutes les données après activation de l'abonnement
    await Promise.all([
      checkSubscriptionStatus(),
      fetchDashboardData(),
      fetchAchievementsData(),
      fetchAgendaData(),
      fetchCommunityPosts(),
    ]);
    
    setShowPaymentFlow(false);
    setSelectedPlan(null);
    setShowPlansBottomSheet(false);
  };

  const handlePaymentError = (error: any): void => {
    Toast.show({
      type: 'error',
      text1: 'Erreur de paiement',
      text2: error.message || 'Une erreur est survenue lors du paiement',
    });
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
    // Set selected post ID if post exists, otherwise null
    setSelectedPostId(post?.id || null);
    // Always navigate to Community screen
    navigateOverlay('Community');
  };

  const handleCommentPress = (postId: string): void => {
  };

  const handleMarkContentComplete = async (contentId: string): Promise<void> => {
    try {
      await AgendaApi.markContentComplete(contentId);
      await fetchAgendaData();
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
      'subscription': 'Subscription',
      'security': 'Security',
      'language': 'Language',
      'notification-settings': 'NotificationSettings',
      'privacy-policy': 'PrivacyPolicy',
      'terms-of-service': 'TermsOfService',
      'platform-rules': 'PlatformRules',
      'contact-support': 'ContactSupport',
      'about': 'About',
    };
    return routeMap[screen] || null;
  };

  // Determine initial route for Stack Navigator
  const overlayInitialRoute = currentScreen !== 'home' && getOverlayRouteName(currentScreen) 
    ? getOverlayRouteName(currentScreen) || 'Home' 
    : 'Home';

  // Screen routing logic - Use Stack Navigator for overlay screens
  // Always render Stack Navigator, but only show it when currentScreen is an overlay screen
  if (currentScreen !== 'home' && getOverlayRouteName(currentScreen)) {
    return (
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
            // Reset to home - close overlay stack
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
      />
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
        communityPosts={communityPosts}
        agendaLoading={agendaLoading}
        communityLoading={communityLoading}
        refreshing={refreshing}
        isProfileComplete={isProfileComplete}
        shouldBlurMenu={shouldBlurMenu}
        showSubscriptionAlert={showSubscriptionAlert}
        subscriptionAlertType={subscriptionAlertType}
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
      />

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

      <SubscriptionPlansModal
        visible={showPlansBottomSheet}
        plans={subscriptionPlans}
        loading={loadingPlans}
        selectedPlan={selectedPlan}
        showPaymentFlow={showPaymentFlow}
        onClose={() => {
          setShowPlansBottomSheet(false);
          setShowPaymentFlow(false);
          setSelectedPlan(null);
        }}
        onPlanSelect={handlePlanSelect}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentError={handlePaymentError}
        onClosePaymentFlow={() => {
          setShowPaymentFlow(false);
          setSelectedPlan(null);
        }}
      />
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
