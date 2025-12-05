import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BackHandler, Platform } from 'react-native';
import { useAuth } from '../context/FirebaseAuthContext';
import DashboardLayout from './dashboard/components/DashboardLayout';
import SubscriptionPlansModal from './dashboard/modals/SubscriptionPlansModal';
import FixedLayout from '../components/FixedLayout';
import { useDashboardData } from './dashboard/hooks/useDashboardData';
import { useSubscription } from './dashboard/hooks/useSubscription';
import { useDashboardNavigation } from './dashboard/hooks/useDashboardNavigation';
import { useAchievements } from './dashboard/hooks/useAchievements';
import { useAgenda } from './dashboard/hooks/useAgenda';
import { useCommunity } from './dashboard/hooks/useCommunity';
import SubscriptionApi from '../services/subscriptionApi';
import { AgendaApi } from '../services/agendaApi';
import Toast from 'react-native-toast-message';
import type { DashboardScreenProps } from './dashboard/types';

// Import all screen components (still in .js, will be migrated later)
import ProgressScreen from './ProgressScreen';
import NutritionScreen from './NutritionScreen';
import AchievementsScreen from './AchievementsScreen';
import ChatScreen from './ChatScreen';
import CommunityScreen from './CommunityScreen';
import AgendaScreen from './AgendaScreen';
import NotificationsScreen from './NotificationsScreen';
import SettingsScreen from './SettingsScreen';
import ProfileScreen from './ProfileScreen';
import FAQScreen from './FAQScreen';
import SubscriptionScreen from './SubscriptionScreen';
import LanguageScreen from './settings/LanguageScreen';
import NotificationSettingsScreen from './settings/NotificationSettingsScreen';
import MoreMenu from '../components/MoreMenu';

const DashboardScreen: React.FC<DashboardScreenProps> = ({ user, onLogout, navigation }) => {
  const { logout: authLogout } = useAuth();
  
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
  
  // Navigation hook
  const {
    activeTab,
    currentScreen,
    showMoreMenu,
    initialProfileStep,
    handleTabPress,
    handleMoreMenuItemPress,
    handleMoreMenuClose,
    handleProfileStepPress,
    setCurrentScreen,
  } = useDashboardNavigation();

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
  
  // BackHandler: gestion du bouton retour Android
  const backHandlerTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  useEffect(() => {
    // Seulement sur Android
    if (Platform.OS !== 'android') {
      return;
    }

    const backAction = (): boolean => {
      // Si on n'est pas sur home, rediriger vers home
      if (currentScreen !== 'home' || activeTab !== 'home') {
        handleTabPress('home');
        setCurrentScreen('home');
        return true; // Empêcher le comportement par défaut
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
  }, [currentScreen, activeTab, handleTabPress, setCurrentScreen]);

  // Check if profile is complete
  const isProfileComplete = dashboardData?.onboarding?.data?.isComplete || 
    (dashboardData?.onboarding?.data?.completedSteps && 
     dashboardData.onboarding.data.completedSteps.length >= 6);

  // Mémoriser l'avatar pour éviter les rechargements à chaque changement de page
  const avatarData = useMemo(() => {
    const avatarSource = dashboardData?.profile?.avatar || user?.avatar;
    const avatarFallbackText = user?.firstName?.charAt(0) || user?.name?.charAt(0) || 'U';
    return { avatarSource, avatarFallbackText };
  }, [dashboardData?.profile?.avatar, user?.avatar, user?.firstName, user?.name]);

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

  // Handlers
  const handleSubscriptionRenew = async (): Promise<void> => {
    try {
      setShowPlansBottomSheet(true);
      await loadSubscriptionPlans();
    } catch (error: any) {
      console.error('❌ Error opening subscription plans:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de charger les plans d\'abonnement',
      });
    }
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
      console.error('❌ Error loading subscription plans:', error);
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
      console.error('❌ Error selecting plan:', error);
    }
  };

  const handlePaymentSuccess = async (paymentData: any): Promise<void> => {
    console.log('✅ Payment successful:', paymentData);
    Toast.show({
      type: 'success',
      text1: 'Abonnement activé',
      text2: 'Votre abonnement a été activé avec succès',
    });
    await checkSubscriptionStatus();
    setShowPaymentFlow(false);
    setSelectedPlan(null);
    setShowPlansBottomSheet(false);
  };

  const handlePaymentError = (error: any): void => {
    console.error('❌ Payment error:', error);
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
    // Meal press handler logic
    console.log('🍽️ Meal pressed:', meal);
  };

  const handlePostPress = (post: any): void => {
    console.log('📱 Dashboard: Post pressed:', post.id);
    setCurrentScreen('community');
  };

  const handleCommentPress = (postId: string): void => {
    console.log('💬 Dashboard: Comment pressed for post:', postId);
  };

  const handleMarkContentComplete = async (contentId: string): Promise<void> => {
    try {
      await AgendaApi.markContentComplete(contentId);
      await fetchAgendaData();
    } catch (error: any) {
      console.error('❌ Error marking content as complete:', error);
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
      console.error('❌ Error during logout:', error);
    }
  };

  // Screen routing logic
  if (currentScreen === 'faq') {
    return (
      <>
        <FixedLayout
          headerTitle="FAQ"
          showLogo={false}
          activeTab={activeTab}
          onTabPress={handleTabPress}
          onHelpPress={() => {
            // Already on FAQ page
          }}
          onNotificationPress={() => setCurrentScreen('notifications')}
          onProfilePress={() => setCurrentScreen('settings')}
          avatarSource={avatarData.avatarSource}
          avatarFallbackText={avatarData.avatarFallbackText}
        >
          <FAQScreen 
            onClose={() => setCurrentScreen('home')}
            user={user}
            onTabPress={handleTabPress}
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

  if (currentScreen === 'notifications') {
    return (
      <>
        <FixedLayout
          headerTitle="Notifications"
          activeTab={activeTab}
          onTabPress={handleTabPress}
          onHelpPress={() => setCurrentScreen('faq')}
          onNotificationPress={() => {
            // Already on notifications page
          }}
          onProfilePress={() => setCurrentScreen('settings')}
          avatarSource={avatarData.avatarSource}
          avatarFallbackText={avatarData.avatarFallbackText}
          showNotificationBadge={false}
        >
          <NotificationsScreen 
            user={user} 
            onLogout={handleLogout} 
            onTabPress={handleTabPress}
            activeTab={activeTab}
            onClose={() => setCurrentScreen('home')}
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

  if (currentScreen === 'agenda') {
    return (
      <>
        <FixedLayout
          headerTitle="Agenda"
          activeTab={activeTab}
          onTabPress={handleTabPress}
          onHelpPress={() => setCurrentScreen('faq')}
          onNotificationPress={() => setCurrentScreen('notifications')}
          onProfilePress={() => setCurrentScreen('settings')}
          avatarSource={avatarData.avatarSource}
          avatarFallbackText={avatarData.avatarFallbackText}
        >
          <AgendaScreen 
            user={user} 
            onLogout={handleLogout} 
            onTabPress={handleTabPress}
            activeTab={activeTab}
            onClose={() => setCurrentScreen('home')}
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

  if (currentScreen === 'community') {
    return (
      <>
        <FixedLayout
          headerTitle="L'Agora"
          activeTab={activeTab}
          onTabPress={handleTabPress}
          onHelpPress={() => setCurrentScreen('faq')}
          onNotificationPress={() => setCurrentScreen('notifications')}
          onProfilePress={() => setCurrentScreen('settings')}
          avatarSource={avatarData.avatarSource}
          avatarFallbackText={avatarData.avatarFallbackText}
        >
          <CommunityScreen 
            user={user} 
            onLogout={handleLogout} 
            onTabPress={handleTabPress}
            activeTab={activeTab}
            onClose={() => setCurrentScreen('home')}
            selectedPostId={null}
            onPostPress={handlePostPress}
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

  if (currentScreen === 'chat') {
    return (
      <>
        <FixedLayout
          headerTitle="Messages"
          activeTab={activeTab}
          onTabPress={handleTabPress}
          onHelpPress={() => setCurrentScreen('faq')}
          onNotificationPress={() => setCurrentScreen('notifications')}
          onProfilePress={() => setCurrentScreen('settings')}
          avatarSource={avatarData.avatarSource}
          avatarFallbackText={avatarData.avatarFallbackText}
        >
          <ChatScreen 
            user={user} 
            onLogout={handleLogout} 
            onTabPress={handleTabPress}
            activeTab={activeTab}
            onClose={() => setCurrentScreen('home')}
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

  if (activeTab === 'progress') {
    return (
      <>
        <FixedLayout
          headerTitle="Progression"
          activeTab={activeTab}
          onTabPress={handleTabPress}
          onHelpPress={() => setCurrentScreen('faq')}
          onNotificationPress={() => setCurrentScreen('notifications')}
          onProfilePress={() => setCurrentScreen('settings')}
          avatarSource={avatarData.avatarSource}
          avatarFallbackText={avatarData.avatarFallbackText}
        >
          <ProgressScreen 
            user={user} 
            onLogout={handleLogout} 
            onTabPress={handleTabPress}
            activeTab={activeTab}
            onSubscriptionRenew={handleSubscriptionRenew}
            onFAQPress={() => setCurrentScreen('faq')}
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
          onHelpPress={() => setCurrentScreen('faq')}
          onNotificationPress={() => setCurrentScreen('notifications')}
          onProfilePress={() => setCurrentScreen('settings')}
          avatarSource={avatarData.avatarSource}
          avatarFallbackText={avatarData.avatarFallbackText}
        >
          <NutritionScreen 
            user={user} 
            onLogout={handleLogout} 
            onTabPress={handleTabPress}
            activeTab={activeTab}
            onSubscriptionRenew={handleSubscriptionRenew}
            onFAQPress={() => setCurrentScreen('faq')}
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
          onHelpPress={() => setCurrentScreen('faq')}
          onNotificationPress={() => setCurrentScreen('notifications')}
          onProfilePress={() => setCurrentScreen('settings')}
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

  if (currentScreen === 'settings') {
    return (
      <>
        <FixedLayout
        headerTitle="Configurations"
        activeTab={activeTab}
        onTabPress={handleTabPress}
        onHelpPress={() => setCurrentScreen('faq')}
        onNotificationPress={() => setCurrentScreen('notifications')}
        onProfilePress={() => setCurrentScreen('settings')}
        avatarSource={avatarData.avatarSource}
        avatarFallbackText={avatarData.avatarFallbackText}
      >
        <SettingsScreen 
          user={user} 
          onLogout={handleLogout} 
          onTabPress={handleTabPress}
          activeTab={activeTab}
          onClose={(target?: string) => {
            console.log('Settings onClose called with target:', target);
            
            // Handle profile sub-items - map to ProfileScreen steps
            if (target === 'profile' || target === 'mon-profile') {
              setCurrentScreen('profile');
              handleProfileStepPress(1); // Mon Profile
            } else if (target === 'mes-objectifs') {
              setCurrentScreen('profile');
              handleProfileStepPress(2); // Mes Objectifs
            } else if (target === 'recommandations') {
              setCurrentScreen('profile');
              handleProfileStepPress(3); // Recommandations
            } else if (target === 'rendez-vous') {
              setCurrentScreen('profile');
              handleProfileStepPress(4); // Rendez-vous
            } else if (target === 'confirmation') {
              setCurrentScreen('profile');
              handleProfileStepPress(6); // Confirmation
            } else if (target === 'subscription') {
              setCurrentScreen('subscription');
            } else if (target === 'security') {
              // Security screen navigation - will be handled separately if needed
              setCurrentScreen('home');
            } else if (target === 'language') {
              setCurrentScreen('language');
            } else if (target === 'notifications') {
              setCurrentScreen('notification-settings');
            } else {
              // Default: go back to home
              setCurrentScreen('home');
            }
          }}
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

  if (currentScreen === 'profile') {
    // Déterminer le titre du header selon l'étape du profil
    const getProfileHeaderTitle = () => {
      switch (initialProfileStep) {
        case 1:
          return 'Profil';
        case 2:
          return 'Objectifs';
        case 3:
          return 'Recommandations';
        case 4:
          return 'Rendez-vous';
        case 5:
        case 6:
          return 'Abonnement';
        default:
          return 'Profil';
      }
    };

    return (
      <>
        <FixedLayout
          headerTitle={getProfileHeaderTitle()}
          activeTab={activeTab}
          onTabPress={handleTabPress}
          onHelpPress={() => setCurrentScreen('faq')}
          onNotificationPress={() => setCurrentScreen('notifications')}
          onProfilePress={() => setCurrentScreen('settings')}
          avatarSource={avatarData.avatarSource}
          avatarFallbackText={avatarData.avatarFallbackText}
        >
          <ProfileScreen 
            user={user} 
            onLogout={handleLogout} 
            onTabPress={handleTabPress}
            activeTab={activeTab}
            onClose={() => setCurrentScreen('settings')}
            initialStep={initialProfileStep}
            onFAQPress={() => setCurrentScreen('faq')}
            navigation={navigation}
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

  if (currentScreen === 'subscription') {
    return (
      <>
        <SubscriptionScreen 
          navigation={navigation}
          onClose={() => setCurrentScreen('settings')}
          onNext={() => {}}
          user={user}
          onTabPress={handleTabPress}
          isStandalone={true}
        />
      </>
    );
  }

  if (currentScreen === 'language') {
    return (
      <>
        <FixedLayout
          headerTitle="Langue & Région"
          activeTab={activeTab}
          onTabPress={handleTabPress}
          onHelpPress={() => setCurrentScreen('faq')}
          onNotificationPress={() => setCurrentScreen('notifications')}
          onProfilePress={() => setCurrentScreen('settings')}
          avatarSource={avatarData.avatarSource}
          avatarFallbackText={avatarData.avatarFallbackText}
        >
          <LanguageScreen
            onClose={() => setCurrentScreen('settings')}
            onTabPress={handleTabPress}
            activeTab={activeTab}
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

  if (currentScreen === 'notification-settings') {
    return (
      <>
        <FixedLayout
          headerTitle="Paramètres de Notifications"
          activeTab={activeTab}
          onTabPress={handleTabPress}
          onHelpPress={() => setCurrentScreen('faq')}
          onNotificationPress={() => setCurrentScreen('notifications')}
          onProfilePress={() => setCurrentScreen('settings')}
          avatarSource={avatarData.avatarSource}
          avatarFallbackText={avatarData.avatarFallbackText}
        >
          <NotificationSettingsScreen
            onClose={() => setCurrentScreen('settings')}
            onTabPress={handleTabPress}
            activeTab={activeTab}
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
        onHelpPress={() => setCurrentScreen('faq')}
        onNotificationPress={() => setCurrentScreen('notifications')}
        onProfilePress={() => setCurrentScreen('settings')}
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

export default DashboardScreen as React.ComponentType<any>;

