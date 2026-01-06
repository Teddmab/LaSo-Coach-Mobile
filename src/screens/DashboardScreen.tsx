import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BackHandler, Platform, View, Text, StyleSheet } from 'react-native';
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
import WebViewScreen from './WebViewScreen';
import ContactSupportScreen from './ContactSupportScreen';
import AboutScreen from './AboutScreen';
import SecurityScreen from './SecurityScreen';
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
    previousScreen,
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
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  // État pour savoir d'où on vient (settings ou security) pour les webviews
  const [webViewSource, setWebViewSource] = useState<string>('settings');
  
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

  // Handlers
  const handleSubscriptionRenew = async (): Promise<void> => {
    // Rediriger vers la page d'abonnement dédiée
    setCurrentScreen('subscription');
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
    await checkSubscriptionStatus();
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
    // Meal press handler logic
  };

  const handlePostPress = (post: any): void => {
    setSelectedPostId(post?.id || null);
    setCurrentScreen('community');
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

  // Screen routing logic
  // IMPORTANT: Vérifier currentScreen AVANT activeTab pour permettre la navigation vers settings depuis n'importe quel tab
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
              setCurrentScreen('security');
            } else if (target === 'language') {
              setCurrentScreen('language');
            } else if (target === 'notifications') {
              setCurrentScreen('notification-settings');
            } else if (target === 'privacy-policy') {
              setWebViewSource('settings');
              setCurrentScreen('privacy-policy');
            } else if (target === 'terms-of-service') {
              setWebViewSource('settings');
              setCurrentScreen('terms-of-service');
            } else if (target === 'platform-rules') {
              setWebViewSource('settings');
              setCurrentScreen('platform-rules');
            } else if (target === 'contact-support') {
              setCurrentScreen('contact-support');
            } else if (target === 'about') {
              setCurrentScreen('about');
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
          onProfilePress={() => {
            setCurrentScreen('settings');
          }}
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
          onProfilePress={() => {
            setCurrentScreen('settings');
          }}
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
          onProfilePress={() => {
            setCurrentScreen('settings');
          }}
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
          onProfilePress={() => {
            setCurrentScreen('settings');
          }}
          avatarSource={avatarData.avatarSource}
          avatarFallbackText={avatarData.avatarFallbackText}
        >
          <CommunityScreen
            user={user}
            onTabPress={handleTabPress}
            activeTab={activeTab}
            selectedPostId={selectedPostId}
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
          onProfilePress={() => {
            setCurrentScreen('settings');
          }}
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

  // IMPORTANT: Vérifier tous les currentScreen overlay AVANT les activeTab
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
          onProfilePress={() => {
            setCurrentScreen('settings');
          }}
          avatarSource={avatarData.avatarSource}
          avatarFallbackText={avatarData.avatarFallbackText}
        >
          <ProfileScreen 
            user={user} 
            onLogout={handleLogout} 
            onTabPress={handleTabPress}
            activeTab={activeTab}
            onClose={(target?: string) => {
              if (target === 'home') {
                // Refresh dashboard data when onboarding is completed
                onRefresh();
                setCurrentScreen('home');
              } else {
                // TOUJOURS retourner à settings depuis ProfileScreen
                // car ProfileScreen est accessible uniquement depuis Settings
                setCurrentScreen('settings');
              }
            }}
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
          onProfilePress={() => {
            setCurrentScreen('settings');
          }}
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
          headerTitle="P. Notification"
          activeTab={activeTab}
          onTabPress={handleTabPress}
          onHelpPress={() => setCurrentScreen('faq')}
          onNotificationPress={() => setCurrentScreen('notifications')}
          onProfilePress={() => {
            setCurrentScreen('settings');
          }}
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

  if (currentScreen === 'security') {
    return (
      <>
        <SecurityScreen
          onClose={() => setCurrentScreen('settings')}
          activeTab={activeTab}
          onTabPress={handleTabPress}
          avatarSource={avatarData.avatarSource}
          avatarFallbackText={avatarData.avatarFallbackText}
          onLinkPress={(linkId) => {
            setWebViewSource('security');
            setCurrentScreen(linkId);
          }}
        />
        <MoreMenu 
          visible={showMoreMenu}
          onClose={handleMoreMenuClose}
          onMenuItemPress={handleMoreMenuItemPress}
        />
      </>
    );
  }

  if (currentScreen === 'privacy-policy') {
    return (
      <>
        <WebViewScreen
          url="https://lasocoach.com/politique-de-confidentialite"
          title="Politique de confidentialité"
          onClose={() => setCurrentScreen(webViewSource)}
          activeTab={activeTab}
          onTabPress={handleTabPress}
          avatarSource={avatarData.avatarSource}
          avatarFallbackText={avatarData.avatarFallbackText}
        />
        <MoreMenu 
          visible={showMoreMenu}
          onClose={handleMoreMenuClose}
          onMenuItemPress={handleMoreMenuItemPress}
        />
      </>
    );
  }

  if (currentScreen === 'terms-of-service') {
    return (
      <>
        <WebViewScreen
          url="https://lasocoach.com/termes-de-service"
          title="Termes de service"
          onClose={() => setCurrentScreen(webViewSource)}
          activeTab={activeTab}
          onTabPress={handleTabPress}
          avatarSource={avatarData.avatarSource}
          avatarFallbackText={avatarData.avatarFallbackText}
        />
        <MoreMenu 
          visible={showMoreMenu}
          onClose={handleMoreMenuClose}
          onMenuItemPress={handleMoreMenuItemPress}
        />
      </>
    );
  }

  if (currentScreen === 'platform-rules') {
    return (
      <>
        <WebViewScreen
          url="https://lasocoach.com/regles-de-plateforme/"
          title="Règles de la plateforme"
          onClose={() => setCurrentScreen(webViewSource)}
          activeTab={activeTab}
          onTabPress={handleTabPress}
          avatarSource={avatarData.avatarSource}
          avatarFallbackText={avatarData.avatarFallbackText}
        />
        <MoreMenu 
          visible={showMoreMenu}
          onClose={handleMoreMenuClose}
          onMenuItemPress={handleMoreMenuItemPress}
        />
      </>
    );
  }

  if (currentScreen === 'contact-support') {
    return (
      <>
        <ContactSupportScreen
          onClose={() => setCurrentScreen('settings')}
          activeTab={activeTab}
          onTabPress={handleTabPress}
          avatarSource={avatarData.avatarSource}
          avatarFallbackText={avatarData.avatarFallbackText}
          user={user}
        />
        <MoreMenu 
          visible={showMoreMenu}
          onClose={handleMoreMenuClose}
          onMenuItemPress={handleMoreMenuItemPress}
        />
      </>
    );
  }

  if (currentScreen === 'about') {
    return (
      <>
        <AboutScreen
          onClose={() => setCurrentScreen('settings')}
          activeTab={activeTab}
          onTabPress={handleTabPress}
          avatarSource={avatarData.avatarSource}
          avatarFallbackText={avatarData.avatarFallbackText}
        />
        <MoreMenu 
          visible={showMoreMenu}
          onClose={handleMoreMenuClose}
          onMenuItemPress={handleMoreMenuItemPress}
        />
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
          onHelpPress={() => setCurrentScreen('faq')}
          onNotificationPress={() => setCurrentScreen('notifications')}
          onProfilePress={() => {
            setCurrentScreen('settings');
          }}
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
          onProfilePress={() => {
            setCurrentScreen('settings');
          }}
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
          onProfilePress={() => {
            setCurrentScreen('settings');
          }}
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
