import React, { useState, useEffect } from 'react';
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
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../constants/theme';
import BottomNavigation from '../components/BottomNavigation';
import ProgressCard from '../components/dashboard/ProgressCard';
import ProfileCompletionCard from '../components/dashboard/ProfileCompletionCard';
import AgoraContentCard from '../components/dashboard/AgoraContentCard';
import LAgoraCard from '../components/dashboard/LAgoraCard';
import AgoraIcon from '../components/icons/AgoraIcon';
import SubscriptionAlert from '../components/SubscriptionAlert';
import SubscriptionBanner from '../components/SubscriptionBanner';
import DashboardService from '../services/dashboardService';
import AgendaApi from '../services/agendaApi';
import CommunityApi from '../services/communityApi';
import SubscriptionService, { SUBSCRIPTION_STATUS } from '../services/subscriptionService';
import ProgressScreen from './ProgressScreen';
import NutritionScreen from './NutritionScreen';
import AchievementsScreen from './AchievementsScreen';
import ChatScreen from './ChatScreen';
import CommunityScreen from './CommunityScreen';
import AgendaScreen from './AgendaScreen';
import NotificationsScreen from './NotificationsScreen';
import MoreMenu from '../components/MoreMenu';
import SettingsScreen from './SettingsScreen';
import ProfileScreen from './ProfileScreen';

const DashboardScreen = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('home'); // home, chat, community, agenda, notifications, settings, profile, etc.
  const [initialProfileStep, setInitialProfileStep] = useState(1); // Track which step to start on
  const [dashboardData, setDashboardData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [showCompleteDayModal, setShowCompleteDayModal] = useState(false);
  const [selectedMeals, setSelectedMeals] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [agendaData, setAgendaData] = useState([]);
  const [agendaLoading, setAgendaLoading] = useState(false);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  
  // Subscription state
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [showSubscriptionAlert, setShowSubscriptionAlert] = useState(false);
  const [subscriptionAlertType, setSubscriptionAlertType] = useState(null);
  const [subscriptionDaysRemaining, setSubscriptionDaysRemaining] = useState(0);
  const requiresRenewal = subscriptionData?.requiresRenewal || false;

  // Check if profile is complete
  const isProfileComplete = dashboardData?.profile && 
    dashboardData.profile.initialWeight && 
    dashboardData.profile.targetWeight && 
    dashboardData.profile.initialWaistSize && 
    dashboardData.profile.targetWaistSize;

  useEffect(() => {
    // Fetch data on initial mount when starting on home tab
    if (activeTab === 'home' && currentScreen === 'home') {
      console.log('🏠 useEffect triggered - fetching dashboard data');
      fetchDashboardData();
    }
  }, [activeTab, currentScreen]);

  // Also fetch data on component mount
  useEffect(() => {
    console.log('🏠 Component mounted - initial data fetch');
    fetchDashboardData();
    fetchAgendaData();
    fetchCommunityPosts();
    checkSubscriptionStatus();
  }, []);

  // Check subscription status
  const checkSubscriptionStatus = async () => {
    try {
      console.log('💳 Dashboard: Checking subscription status...');
      const data = await SubscriptionService.getSubscriptionStatus();
      setSubscriptionData(data);
      
      console.log('💳 Dashboard: Subscription status:', {
        status: data.status,
        isExpired: data.isExpired,
        isExpiringSoon: data.isExpiringSoon,
        daysRemaining: data.daysRemaining
      });
      
      // Show alert if subscription needs attention
      if (data.isExpired) {
        setSubscriptionAlertType('expired');
        setSubscriptionDaysRemaining(data.daysRemaining);
        setShowSubscriptionAlert(true);
      } else if (data.isExpiringSoon) {
        setSubscriptionAlertType('expiring_soon');
        setSubscriptionDaysRemaining(data.daysRemaining);
        setShowSubscriptionAlert(true);
      }
      
    } catch (error) {
      console.error('❌ Dashboard: Error checking subscription status:', error);
      // Default to expired status on error
      setSubscriptionData({
        status: SUBSCRIPTION_STATUS.EXPIRED,
        isExpired: true,
        isExpiringSoon: false,
        daysRemaining: 0,
        requiresRenewal: true
      });
      setSubscriptionAlertType('expired');
      setShowSubscriptionAlert(true);
    }
  };

  const fetchDashboardData = async () => {
    try {
      console.log('🏠 Dashboard: Fetching data for home tab...');
      const data = await DashboardService.getDashboardData();
      setDashboardData(data);
      console.log('🏠 Dashboard: Data loaded successfully');
    } catch (error) {
      console.error('❌ Dashboard: Error fetching data:', error);
    }
  };

  const fetchAgendaData = async () => {
    try {
      setAgendaLoading(true);
      console.log('📅 Dashboard: Fetching agenda data...');
      console.log('📅 Dashboard: Starting agenda API call...');
      
      const data = await AgendaApi.getAgenda();
      console.log('📅 Dashboard: Raw agenda data received:', data);
      
      const filteredData = AgendaApi.filterAgendaItems(data);
      console.log('📅 Dashboard: Filtered agenda data:', filteredData);
      
      setAgendaData(filteredData);
      console.log('📅 Dashboard: Agenda data loaded successfully');
      console.log('📅 Dashboard: Final agenda items count:', filteredData.length);
    } catch (error) {
      console.error('❌ Dashboard: Error fetching agenda data:', error);
      console.error('❌ Dashboard: Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      setAgendaData([]);
    } finally {
      setAgendaLoading(false);
      console.log('📅 Dashboard: Agenda loading completed');
    }
  };

  const fetchCommunityPosts = async () => {
    try {
      setCommunityLoading(true);
      console.log('👥 Dashboard: Fetching community posts...');
      const response = await CommunityApi.getPosts();
      setCommunityPosts(response.data?.posts || []);
      console.log('👥 Dashboard: Community posts loaded successfully');
    } catch (error) {
      console.error('❌ Dashboard: Error fetching community posts:', error);
      console.error('❌ Dashboard: Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      setCommunityPosts([]);
    } finally {
      setCommunityLoading(false);
      console.log('👥 Dashboard: Community posts loading completed');
    }
  };

  const handleMarkContentComplete = async (contentId) => {
    try {
      console.log('✅ Dashboard: Marking content as complete:', contentId);
      console.log('✅ Dashboard: Current agenda data before update:', agendaData);
      
      await AgendaApi.markContentComplete(contentId);
      console.log('✅ Dashboard: API call successful for content completion');
      
      // Update the local state to reflect the completion
      setAgendaData(prevData => {
        const updatedData = prevData.map(item => 
          item.id === contentId 
            ? { ...item, completed: true }
            : item
        );
        console.log('✅ Dashboard: Updated agenda data:', updatedData);
        return updatedData;
      });
      
      console.log('✅ Dashboard: Local state updated successfully');
      Alert.alert('Succès', 'Contenu marqué comme terminé !');
    } catch (error) {
      console.error('❌ Dashboard: Error marking content as complete:', error);
      console.error('❌ Dashboard: Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      Alert.alert('Erreur', 'Impossible de marquer le contenu comme terminé.');
    }
  };

  const handleTabPress = (tabId) => {
    if (tabId === 'more') {
      // Toggle the more menu instead of changing tab
      setShowMoreMenu(true);
      console.log('Tab pressed: more - showing menu');
    } else {
      console.log('Tab pressed:', tabId);
      
      // Handle home tab specific functionality BEFORE setting active tab
      if (tabId === 'home') {
        console.log('🏠 Home tab pressed - refreshing dashboard data');
        
        // Clear current data to force refresh
        setDashboardData(null);
        setAgendaData([]);
        setCommunityPosts([]); // Clear community posts on home tab press
        
        // Fetch fresh data
        fetchDashboardData();
        fetchAgendaData();
        fetchCommunityPosts();
        
        console.log('🏠 Dashboard refresh triggered');
      }
      
      setActiveTab(tabId);
      setCurrentScreen('home'); // Reset to main app when using bottom nav
    }
  };

  const handleMoreMenuClose = () => {
    setShowMoreMenu(false);
    console.log('More menu closed');
  };

  const handleMoreMenuItemPress = (itemId) => {
    console.log('More menu item pressed:', itemId);
    // Handle menu item actions here
    switch (itemId) {
      case 'chat':
        setCurrentScreen('chat');
        setActiveTab('home'); // Keep home tab active when in chat
        break;
      case 'notifications':
        setCurrentScreen('notifications');
        setActiveTab('home'); // Keep home tab active when in notifications
        break;
      case 'community':
        setCurrentScreen('community');
        setActiveTab('home'); // Keep home tab active when in community
        break;
      case 'agenda':
        setCurrentScreen('agenda');
        setActiveTab('home'); // Keep home tab active when in agenda
        break;
      case 'settings':
        setCurrentScreen('settings');
        setActiveTab('home'); // Keep home tab active when in settings
        break;
      default:
        break;
    }
  };

  const handleChatClose = () => {
    setCurrentScreen('home');
    console.log('Chat closed, returning to dashboard');
  };

  const handleCommunityClose = () => {
    setCurrentScreen('home');
    setSelectedPostId(null); // Clear selected post when closing community screen
    console.log('Community closed, returning to dashboard');
  };

  const handleAgendaClose = () => {
    setCurrentScreen('home');
    console.log('Agenda closed, returning to dashboard');
  };

  const handleNotificationsClose = () => {
    setCurrentScreen('home');
    console.log('Notifications closed, returning to dashboard');
  };

  const handleSettingsClose = (navigationTarget) => {
    if (navigationTarget === 'profile') {
      setCurrentScreen('profile');
      setInitialProfileStep(1); // Default to step 1
    } else if (navigationTarget === 'mon-profile') {
      setCurrentScreen('profile');
      setInitialProfileStep(1); // Start at step 1 - Mon Profile
    } else if (navigationTarget === 'mes-objectifs') {
      setCurrentScreen('profile');
      setInitialProfileStep(2); // Start at step 2 - Mes Objectifs
    } else if (navigationTarget === 'recommandations') {
      setCurrentScreen('profile');
      setInitialProfileStep(3); // Start at step 3 - Recommandations
    } else if (navigationTarget === 'rendez-vous') {
      setCurrentScreen('profile');
      setInitialProfileStep(4); // Start at step 4 - Rendez-vous
    } else if (navigationTarget === 'confirmation') {
      setCurrentScreen('profile');
      setInitialProfileStep(6); // Start at step 6 - Summary/Confirmation
    } else {
      setCurrentScreen('home');
    }
    console.log('Settings closed, returning to dashboard or navigating to:', navigationTarget);
  };

  const handleProfileClose = () => {
    setCurrentScreen('home');
    setInitialProfileStep(1); // Reset to step 1 for next time
    console.log('Profile closed, returning to dashboard');
  };

  const onRefresh = async () => {
    console.log('🔄 Pull-to-refresh triggered');
    setRefreshing(true);
    
    try {
      // Clear current data
      setDashboardData(null);
      setAgendaData([]);
      setCommunityPosts([]); // Clear community posts on refresh
      
      // Fetch fresh data
      await Promise.all([
        fetchDashboardData(),
        fetchAgendaData(),
        fetchCommunityPosts()
      ]);
      
      console.log('🔄 Refresh completed successfully');
    } catch (error) {
      console.error('❌ Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleProgressRefresh = () => {
    console.log('📊 Progress card refresh triggered');
    fetchDashboardData();
  };

  const handleMealSelection = (meal) => {
    console.log('🍽️ Meal selected:', meal);
    const isSelected = selectedMeals.find(m => m.id === meal.id);
    
    if (isSelected) {
      // Remove meal from selection
      const updatedMeals = selectedMeals.filter(m => m.id !== meal.id);
      setSelectedMeals(updatedMeals);
      setTotalPoints(updatedMeals.reduce((sum, m) => sum + m.points, 0));
    } else {
      // Add meal to selection
      const updatedMeals = [...selectedMeals, meal];
      setSelectedMeals(updatedMeals);
      setTotalPoints(updatedMeals.reduce((sum, m) => sum + m.points, 0));
    }
  };

  const handleCompleteDay = async () => {
    try {
      console.log('✅ Dashboard: Completing day with meals:', selectedMeals);
      
      // Calculate total points from selected meals
      const calculatedPoints = selectedMeals.reduce((total, meal) => total + (meal.points || 0), 0);
      setTotalPoints(calculatedPoints);
      
      console.log('✅ Dashboard: Calculated total points:', calculatedPoints);
      
      // Here you would typically send the data to your backend
      // For now, we'll just show a success message
      Alert.alert(
        'Jour terminé !', 
        `Vous avez gagné ${calculatedPoints} points !`,
        [{ text: 'OK', onPress: () => setShowCompleteDayModal(false) }]
      );
      
      // Reset selections
      setSelectedMeals([]);
      setTotalPoints(0);
      
    } catch (error) {
      console.error('❌ Dashboard: Error completing day:', error);
      Alert.alert('Erreur', 'Impossible de terminer le jour.');
    }
  };

  const handlePostPress = (post) => {
    console.log('📱 Dashboard: Post pressed:', post.id);
    setSelectedPostId(post.id);
    setCurrentScreen('community');
    setActiveTab('home'); // Keep home tab active when in community
    console.log('📱 Dashboard: Navigating to community screen with post:', post.id);
  };

  const handleLikePress = async (postId) => {
    try {
      console.log('👍 Dashboard: Liking post:', postId);
      await CommunityApi.likePost(postId);
      
      // Update local state to reflect the like
      setCommunityPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, _count: { ...post._count, likes: (post._count?.likes || 0) + 1 } }
            : post
        )
      );
      
      console.log('👍 Dashboard: Post liked successfully');
    } catch (error) {
      console.error('❌ Dashboard: Error liking post:', error);
      Alert.alert('Erreur', 'Impossible de liker le post.');
    }
  };

  const handleCommentPress = (postId) => {
    console.log('💬 Dashboard: Comment pressed for post:', postId);
    // Navigate to comments or open comment modal
  };

  // Subscription alert handlers
  const handleSubscriptionAlertClose = () => {
    // Prevent users from closing the alert - redirect to subscription renewal instead
    console.log('💳 Subscription alert close attempted - redirecting to renewal');
    handleSubscriptionRenew();
  };

  const handleSubscriptionRenew = () => {
    console.log('🔄 Navigating to subscription renewal page');
    setShowSubscriptionAlert(false);
    
    // Navigate to subscription page (step 5 of profile) with subscription tab selected
    setCurrentScreen('profile');
    setInitialProfileStep(5); // Start at subscription step
  };

  const handleSubscriptionRenewFromRestricted = () => {
    console.log('🔄 Navigating to subscription renewal page from restricted screen');
    
    // Navigate to subscription page (step 5 of profile) with subscription tab selected
    setCurrentScreen('profile');
    setInitialProfileStep(5); // Start at subscription step
  };

  // Profile completion handler
  const handleCompleteProfile = () => {
    console.log('👤 Navigating to profile completion');
    setCurrentScreen('profile');
    setInitialProfileStep(1); // Start at step 1 - Mon Profile
  };

  // If notifications screen is active, show NotificationsScreen
  if (currentScreen === 'notifications') {
    return (
      <>
        <NotificationsScreen 
          user={user} 
          onLogout={onLogout} 
          onTabPress={handleTabPress}
          activeTab={activeTab}
          onClose={handleNotificationsClose}
        />
        <MoreMenu 
          visible={showMoreMenu}
          onClose={handleMoreMenuClose}
          onMenuItemPress={handleMoreMenuItemPress}
        />
      </>
    );
  }

  // If agenda screen is active, show AgendaScreen
  if (currentScreen === 'agenda') {
    return (
      <>
        <AgendaScreen 
          user={user} 
          onLogout={onLogout} 
          onTabPress={handleTabPress}
          activeTab={activeTab}
          onClose={handleAgendaClose}
        />
        <MoreMenu 
          visible={showMoreMenu}
          onClose={handleMoreMenuClose}
          onMenuItemPress={handleMoreMenuItemPress}
        />
      </>
    );
  }

  // If community screen is active, show CommunityScreen
  if (currentScreen === 'community') {
    return (
      <>
        <CommunityScreen 
          user={user} 
          onLogout={onLogout} 
          onTabPress={handleTabPress}
          activeTab={activeTab}
          onClose={handleCommunityClose}
          selectedPostId={selectedPostId}
          onPostPress={handlePostPress}
        />
        <MoreMenu 
          visible={showMoreMenu}
          onClose={handleMoreMenuClose}
          onMenuItemPress={handleMoreMenuItemPress}
        />
      </>
    );
  }

  // If chat screen is active, show ChatScreen
  if (currentScreen === 'chat') {
    return (
      <>
        <ChatScreen 
          user={user} 
          onLogout={onLogout} 
          onTabPress={handleTabPress}
          activeTab={activeTab}
          onClose={handleChatClose}
        />
        <MoreMenu 
          visible={showMoreMenu}
          onClose={handleMoreMenuClose}
          onMenuItemPress={handleMoreMenuItemPress}
        />
      </>
    );
  }

  // If progress tab is active, show ProgressScreen
  if (activeTab === 'progress') {
    return (
      <>
        <ProgressScreen 
          user={user} 
          onLogout={onLogout} 
          onTabPress={handleTabPress}
          activeTab={activeTab}
          onSubscriptionRenew={handleSubscriptionRenewFromRestricted}
        />
        <MoreMenu 
          visible={showMoreMenu}
          onClose={handleMoreMenuClose}
          onMenuItemPress={handleMoreMenuItemPress}
        />
      </>
    );
  }

  // If nutrition tab is active, show NutritionScreen
  if (activeTab === 'nutrition') {
    return (
      <>
        <NutritionScreen 
          user={user} 
          onLogout={onLogout} 
          onTabPress={handleTabPress}
          activeTab={activeTab}
          onSubscriptionRenew={handleSubscriptionRenewFromRestricted}
        />
        <MoreMenu 
          visible={showMoreMenu}
          onClose={handleMoreMenuClose}
          onMenuItemPress={handleMoreMenuItemPress}
        />
      </>
    );
  }

  // If achievements tab is active, show AchievementsScreen
  if (activeTab === 'achievements') {
    return (
      <>
        <AchievementsScreen 
          user={user} 
          onLogout={onLogout} 
          onTabPress={handleTabPress}
          activeTab={activeTab}
          onSubscriptionRenew={handleSubscriptionRenewFromRestricted}
        />
        <MoreMenu 
          visible={showMoreMenu}
          onClose={handleMoreMenuClose}
          onMenuItemPress={handleMoreMenuItemPress}
        />
      </>
    );
  }

  // If profile screen is active, show ProfileScreen
  if (currentScreen === 'profile') {
    return (
      <>
        <ProfileScreen 
          user={user} 
          onLogout={onLogout} 
          onTabPress={handleTabPress}
          activeTab={activeTab}
          onClose={handleProfileClose}
          initialStep={initialProfileStep}
        />
        <MoreMenu 
          visible={showMoreMenu}
          onClose={handleMoreMenuClose}
          onMenuItemPress={handleMoreMenuItemPress}
        />
      </>
    );
  }

  // If settings screen is active, show SettingsScreen
  if (currentScreen === 'settings') {
    return (
      <>
        <SettingsScreen 
          user={user} 
          onLogout={onLogout} 
          onTabPress={handleTabPress}
          activeTab={activeTab}
          onClose={handleSettingsClose}
        />
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tableau de bord</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.helpButton}>
            <Ionicons name="help-circle-outline" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          
          {/* Debug Button */}
          <TouchableOpacity 
            style={styles.debugButton}
            onPress={() => setShowDebugModal(true)}
          >
            <Ionicons name="bug" size={20} color="#FF9800" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={theme.colors.text.primary} />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>6</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.profileButton} onPress={() => setCurrentScreen('settings')}>
            <Image 
              source={{ uri: user?.avatar || 'https://via.placeholder.com/40' }} 
              style={styles.profileImage}
            />
          </TouchableOpacity>
        </View>
      </View>

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
        {/* Achievement Banner */}
        <LinearGradient
          colors={['#1a1a1a', '#2d2d2d']}
          style={styles.achievementBanner}
        >
          <View style={styles.achievementContent}>
            <Ionicons name="trophy" size={24} color="#FFD700" />
            <View style={styles.achievementText}>
              <Text style={styles.achievementTitle}>Plus que 50pts pour avoir le badge</Text>
              <Text style={styles.achievementSubtitle}>Mpiko</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.challengeButton}>
            <Text style={styles.challengeButtonText}>Voir les défis</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Profile Completion Card or Progress Section */}
        {!isProfileComplete ? (
          <ProfileCompletionCard 
            onboardingData={dashboardData?.onboarding}
            onCompleteProfile={handleCompleteProfile}
          />
        ) : (
          <ProgressCard 
            key={dashboardData?.fetchedAt || 'initial'}
            dashboardData={dashboardData} 
            subscriptionData={subscriptionData}
            onRefresh={handleProgressRefresh}
            onSubscriptionRenew={handleSubscriptionRenew}
          />
        )}

        {/* L'Agora Section */}
        <View style={styles.agoraSection}>
          <View style={styles.agoraHeader}>
            <Ionicons name="notifications" size={20} color={theme.colors.text.primary} />
            <Text style={styles.agoraTitle}>News</Text>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.agoraPostsContainer}
          >
            {agendaLoading ? (
              <View style={styles.agoraLoadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.agoraLoadingText}>Chargement des contenus...</Text>
              </View>
            ) : agendaData.length > 0 ? (
              agendaData.map((item, index) => (
                <AgoraContentCard
                  key={item.id}
                  content={item}
                  onMarkComplete={handleMarkContentComplete}
                  onPress={() => console.log('Content pressed:', item)}
                />
              ))
            ) : (
              <View style={styles.agoraEmptyContainer}>
                <Ionicons name="document-text-outline" size={48} color={theme.colors.text.secondary} />
                <Text style={styles.agoraEmptyText}>Aucun contenu disponible</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Menu du jour Section */}
        <View style={[
          styles.menuSection,
          requiresRenewal && styles.menuSectionDisabled
        ]}>
          <View style={styles.menuHeader}>
            <Ionicons name="restaurant" size={20} color={theme.colors.text.primary} />
            <Text style={styles.menuTitle}>Menu du jour</Text>
            <Text style={styles.menuDate}>samedi 19 juillet 2025</Text>
          </View>
          
          <View style={styles.phaseBanner}>
            <Text style={styles.phaseText}>Phase actuelle: Test</Text>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.datePickerContainer}
          >
            {['17 Jeu', '18 Ven', '19 Sam', '20 Dim', '21 Lun', '22 Mar', '23 Mer'].map((date, index) => (
              <TouchableOpacity 
                key={index}
                style={[
                  styles.datePickerItem,
                  index === 2 && styles.datePickerItemActive
                ]}
                disabled={requiresRenewal}
              >
                <Text style={[
                  styles.datePickerText,
                  index === 2 && styles.datePickerTextActive
                ]}>
                  {date}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <View style={styles.mealsContainer}>
            {/* Petit-Déj */}
            <View style={[styles.mealCard, styles.mealCardBreakfast]}>
              <View style={styles.mealHeader}>
                <Ionicons name="restaurant" size={16} color="#8BC34A" />
                <Text style={styles.mealTitle}>Petit-Déj</Text>
                <Ionicons name="sunny" size={16} color="#FFD700" />
              </View>
              <Text style={styles.mealStatus}>Aucun plat</Text>
              <Text style={styles.mealTime}>entre 7h30-9h00</Text>
            </View>

            {/* Déjeuner */}
            <View style={[styles.mealCard, styles.mealCardLunch]}>
              <View style={styles.mealHeader}>
                <Ionicons name="restaurant" size={16} color="#FF9800" />
                <Text style={styles.mealTitle}>Déjeuner</Text>
                <Ionicons name="fast-food" size={16} color="#FF9800" />
              </View>
              <Text style={styles.mealStatus}>Aucun plat</Text>
              <Text style={styles.mealTime}>entre 12h00-14h00</Text>
            </View>

            {/* Souper */}
            <View style={[styles.mealCard, styles.mealCardDinner]}>
              <View style={styles.mealHeader}>
                <Ionicons name="restaurant" size={16} color="#9C27B0" />
                <Text style={styles.mealTitle}>Souper</Text>
                <Ionicons name="moon" size={16} color="#2196F3" />
              </View>
              <Text style={styles.mealStatus}>Aucun plat</Text>
              <Text style={styles.mealTime}>entre 19h00-21h00</Text>
            </View>

            {/* Bonus */}
            <View style={[styles.mealCard, styles.mealCardBonus]}>
              <View style={styles.mealHeader}>
                <Ionicons name="restaurant" size={16} color="#FFD700" />
                <Text style={styles.mealTitle}>Bonus</Text>
                <Ionicons name="star" size={16} color="#FFD700" />
              </View>
              <Text style={styles.mealStatus}>Aucun plat</Text>
              <Text style={styles.mealTime}></Text>
            </View>

            {/* Mark Day as Completed Button */}
            <TouchableOpacity 
              style={[
                styles.completeDayButton,
                requiresRenewal && styles.completeDayButtonDisabled
              ]}
              onPress={() => setShowCompleteDayModal(true)}
              disabled={requiresRenewal}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.completeDayButtonText}>
                {requiresRenewal ? 'Renouveler l\'abonnement' : 'Marquer le jour comme terminé'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* L'Agora Community Posts */}
        <LAgoraCard 
          posts={communityPosts}
          loading={communityLoading}
          onPostPress={handlePostPress}
          onLikePress={handleLikePress}
          onCommentPress={handleCommentPress}
        />

      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabPress={handleTabPress} />

      {/* More Menu Overlay */}
      <MoreMenu 
        visible={showMoreMenu}
        onClose={handleMoreMenuClose}
        onMenuItemPress={handleMoreMenuItemPress}
      />

      {/* Subscription Alert */}
      <SubscriptionAlert
        visible={showSubscriptionAlert}
        type={subscriptionAlertType}
        daysRemaining={subscriptionDaysRemaining}
        onRenew={handleSubscriptionRenew}
      />

      {/* Debug Modal */}
      <Modal
        visible={showDebugModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDebugModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.debugModal}>
            <View style={styles.debugModalHeader}>
              <Text style={styles.debugModalTitle}>Debug Tools</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowDebugModal(false)}
              >
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.debugModalContent}>
              {/* Check Stored Tokens */}
              <TouchableOpacity 
                style={styles.debugButton}
                onPress={async () => {
                  try {
                    console.log('🔑 Debug: Checking stored tokens...');
                    
                    const token = await AsyncStorage.getItem('@LasoCoach:authToken');
                    const refreshToken = await AsyncStorage.getItem('@LasoCoach:refreshToken');
                    
                    console.log('🔑 Direct AsyncStorage check:', {
                      hasToken: !!token,
                      hasRefreshToken: !!refreshToken,
                      tokenPreview: token ? token.substring(0, 30) + '...' : 'null',
                      refreshTokenPreview: refreshToken ? refreshToken.substring(0, 30) + '...' : 'null'
                    });
                    
                    Alert.alert('Debug: Stored Tokens', 
                      `Token: ${token ? 'Found (' + token.length + ' chars)' : 'Not Found'}\n` +
                      `RefreshToken: ${refreshToken ? 'Found (' + refreshToken.length + ' chars)' : 'Not Found'}\n\n` +
                      `Preview: ${token ? token.substring(0, 50) + '...' : 'N/A'}`
                    );
                  } catch (error) {
                    console.error('❌ Debug token error:', error);
                    Alert.alert('Debug Error', error.message);
                  }
                }}
              >
                <View style={styles.debugButtonContent}>
                  <Ionicons name="key" size={20} color="#FF9800" />
                  <Text style={styles.debugButtonText}>Check Stored Tokens</Text>
                </View>
              </TouchableOpacity>

              {/* Simple API Test */}
              <TouchableOpacity 
                style={styles.debugButton}
                onPress={async () => {
                  try {
                    console.log('🧪 Test API Request - Starting...');
                    
                    const api = (await import('../services/api')).default;
                    
                    console.log('🧪 Making test request to /tascc/progress...');
                    const response = await api.get('/tascc/progress');
                    console.log('✅ Test request successful:', response.status);
                    Alert.alert('Test API Request', 'Request successful! Check console for details.');
                  } catch (error) {
                    console.error('❌ Test API request failed:', error);
                    Alert.alert('Test API Request', `Request failed: ${error.message}`);
                  }
                }}
              >
                <View style={styles.debugButtonContent}>
                  <Ionicons name="flash" size={20} color="#4CAF50" />
                  <Text style={styles.debugButtonText}>Simple API Test</Text>
                </View>
              </TouchableOpacity>

              {/* Comprehensive API Test */}
              <TouchableOpacity 
                style={styles.debugButton}
                onPress={async () => {
                  try {
                    console.log('🧪 Comprehensive API Test - Starting...');
                    
                    const endpoints = [
                      '/tascc/progress',
                      '/profile', 
                      '/onboarding/progress',
                      '/onboarding/measurements'
                    ];
                    
                    for (const endpoint of endpoints) {
                      try {
                        console.log(`🧪 Testing endpoint: ${endpoint}`);
                        const api = (await import('../services/api')).default;
                        const response = await api.get(endpoint);
                        
                        console.log(`✅ ${endpoint} - Status: ${response.status}`);
                        console.log(`📥 ${endpoint} - Data type: ${typeof response.data}`);
                        console.log(`📥 ${endpoint} - Data keys:`, response.data ? Object.keys(response.data) : 'null');
                        console.log(`📥 ${endpoint} - Raw data:`, JSON.stringify(response.data, null, 2));
                        
                      } catch (error) {
                        console.error(`❌ ${endpoint} failed:`, {
                          status: error.response?.status,
                          message: error.message,
                          data: error.response?.data
                        });
                      }
                    }
                    
                    Alert.alert('Comprehensive Test', 'All tests completed! Check console for detailed results.');
                  } catch (error) {
                    console.error('❌ Comprehensive test failed:', error);
                    Alert.alert('Test Failed', `Error: ${error.message}`);
                  }
                }}
              >
                <View style={styles.debugButtonContent}>
                  <Ionicons name="analytics" size={20} color="#2196F3" />
                  <Text style={styles.debugButtonText}>Comprehensive API Test</Text>
                </View>
              </TouchableOpacity>

              {/* Agenda API Test */}
              <TouchableOpacity 
                style={styles.debugButton}
                onPress={async () => {
                  try {
                    console.log('📅 Agenda API Test - Starting...');
                    
                    const AgendaApi = (await import('../services/agendaApi')).default;
                    console.log('📅 AgendaApi imported successfully');
                    
                    const data = await AgendaApi.getAgenda();
                    console.log('📅 Agenda API test successful');
                    console.log('📅 Agenda data received:', data);
                    
                    Alert.alert('Agenda API Test', `Success! Received ${data.length} agenda items. Check console for details.`);
                  } catch (error) {
                    console.error('❌ Agenda API test failed:', error);
                    Alert.alert('Agenda API Test Failed', `Error: ${error.message}`);
                  }
                }}
              >
                <View style={styles.debugButtonContent}>
                  <Ionicons name="calendar" size={20} color="#9C27B0" />
                  <Text style={styles.debugButtonText}>Test Agenda API</Text>
                </View>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Complete Day Modal */}
      <Modal
        visible={showCompleteDayModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCompleteDayModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.debugModal}>
            <View style={styles.debugModalHeader}>
              <Text style={styles.debugModalTitle}>Marquer le jour comme terminé</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowCompleteDayModal(false)}
              >
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.debugModalContent}>
              <Text style={{ fontSize: 16, marginBottom: 20, color: theme.colors.text.primary }}>
                Sélectionnez les repas que vous avez terminés aujourd'hui :
              </Text>
              
              {['Petit-Déj', 'Déjeuner', 'Souper', 'Bonus'].map((meal, index) => (
                <TouchableOpacity 
                  key={index}
                  style={[
                    styles.debugButton,
                    selectedMeals.includes(meal) && { backgroundColor: '#E8F5E9' }
                  ]}
                  onPress={() => {
                    if (selectedMeals.includes(meal)) {
                      setSelectedMeals(selectedMeals.filter(m => m !== meal));
                      setTotalPoints(prev => prev - 10);
                    } else {
                      setSelectedMeals([...selectedMeals, meal]);
                      setTotalPoints(prev => prev + 10);
                    }
                  }}
                >
                  <View style={styles.debugButtonContent}>
                    <Ionicons 
                      name={selectedMeals.includes(meal) ? "checkmark-circle" : "ellipse-outline"} 
                      size={20} 
                      color={selectedMeals.includes(meal) ? "#4CAF50" : theme.colors.text.secondary} 
                    />
                    <Text style={styles.debugButtonText}>{meal}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              
              <TouchableOpacity 
                style={[styles.debugButton, { backgroundColor: '#007BFF', marginTop: 20 }]}
                onPress={handleCompleteDay}
              >
                <View style={styles.debugButtonContent}>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={[styles.debugButtonText, { color: '#FFFFFF' }]}>
                    Terminer le jour ({totalPoints} points)
                  </Text>
                </View>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Subscription Alert */}
      <SubscriptionAlert
        visible={showSubscriptionAlert}
        type={subscriptionAlertType}
        daysRemaining={subscriptionDaysRemaining}
        onRenew={handleSubscriptionRenew}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  helpButton: {
    padding: 4,
  },
  debugButton: {
    padding: 4,
  },
  notificationButton: {
    position: 'relative',
    padding: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  profileButton: {
    padding: 2,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  achievementBanner: {
    margin: 20,
    padding: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  achievementContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  achievementText: {
    marginLeft: 12,
    flex: 1,
  },
  achievementTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  achievementSubtitle: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  challengeButton: {
    backgroundColor: '#C8A8E8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  challengeButtonText: {
    color: '#1a1a1a',
    fontSize: 14,
    fontWeight: '600',
  },
  agoraSection: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  agoraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  agoraTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginLeft: 8,
  },
  agoraSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginLeft: 8,
    marginTop: 2,
  },
  agoraPostsContainer: {
    paddingHorizontal: 5,
  },
  agoraLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    width: 300,
  },
  agoraLoadingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  agoraEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    width: 300,
  },
  agoraEmptyText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  menuSectionDisabled: {
    opacity: 0.6,
    backgroundColor: '#F5F5F5',
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginLeft: 8,
  },
  menuDate: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginLeft: 8,
  },
  phaseBanner: {
    backgroundColor: '#E0F2F7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  phaseText: {
    fontSize: 14,
    color: '#007BFF',
    fontWeight: 'bold',
  },
  datePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  datePickerItem: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  datePickerItemActive: {
    backgroundColor: '#007BFF',
    borderRadius: 20,
  },
  datePickerText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  datePickerTextActive: {
    color: '#FFFFFF',
  },
  mealsContainer: {
    flexDirection: 'column',
    gap: 10,
  },
  mealCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    padding: 15,
    marginVertical: 5,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mealCardBreakfast: {
    backgroundColor: '#E8F5E9',
    borderLeftWidth: 5,
    borderLeftColor: '#4CAF50',
  },
  mealCardLunch: {
    backgroundColor: '#FFF3E0',
    borderLeftWidth: 5,
    borderLeftColor: '#FF9800',
  },
  mealCardDinner: {
    backgroundColor: '#E1BEE7',
    borderLeftWidth: 5,
    borderLeftColor: '#9C27B0',
  },
  mealCardBonus: {
    backgroundColor: '#FFF9C4',
    borderLeftWidth: 5,
    borderLeftColor: '#FFD700',
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  mealTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginLeft: 8,
  },
  mealStatus: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 5,
  },
  mealTime: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  completeDayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 15,
    marginTop: 15,
    width: '100%',
    alignSelf: 'center',
  },
  completeDayButtonDisabled: {
    backgroundColor: '#FF9800',
  },
  completeDayButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  debugModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  debugModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  debugModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: 5,
  },
  debugModalContent: {
    padding: 15,
  },
  debugButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    marginBottom: 10,
  },
  debugButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  debugButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
});

export default DashboardScreen;