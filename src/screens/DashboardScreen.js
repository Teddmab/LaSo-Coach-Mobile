import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/FirebaseAuthContext';
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
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import YoutubePlayer from 'react-native-youtube-iframe';
import Toast from 'react-native-toast-message';
import { theme } from '../constants/theme';
import BottomNavigation from '../components/BottomNavigation';
import ProgressCard from '../components/dashboard/ProgressCard';
import ProfileCompletionCard from '../components/dashboard/ProfileCompletionCard';
import AchievementsCard from '../components/dashboard/AchievementsCard';
import AgoraContentCard from '../components/dashboard/AgoraContentCard';
import LAgoraCard from '../components/dashboard/LAgoraCard';
import NutritionCard from '../components/dashboard/NutritionCard';
import AgoraIcon from '../components/icons/AgoraIcon';
import Avatar from '../components/Avatar';
import NotificationBadge from '../components/NotificationBadge';
import AppHeader from '../components/AppHeader';
import SubscriptionAlert from '../components/SubscriptionAlert';
import BlurredCard from '../components/BlurredCard';
import SubscriptionBanner from '../components/SubscriptionBanner';
import DashboardService from '../services/dashboardService';
import { AgendaApi } from '../services/agendaApi';
import CommunityApi from '../services/communityApi';
import SubscriptionService, { SUBSCRIPTION_STATUS } from '../services/subscriptionService';
import { ProfileApi } from '../services/profileApi';
import nutritionAPI from '../services/nutritionApi';
import SubscriptionApi from '../services/subscriptionApi';
import firebaseAuthService from '../services/firebaseAuthServiceNew';
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
import FAQScreen from './FAQScreen';
import SubscriptionScreen from './SubscriptionScreen';
import SecurityScreen from './SecurityScreen';
import SubscriptionPaymentFlow from '../components/SubscriptionPaymentFlow';

// Stub function for page navigation logging (analytics)
const logPageNavigation = (pageName, breadcrumbs = []) => {
  // This can be extended to log to analytics service
  if (__DEV__) {
    console.log(`📊 Page Navigation: ${pageName}`, breadcrumbs.length > 0 ? breadcrumbs : '');
  }
};

const DashboardScreen = ({ user, onLogout, navigation }) => {
  const { logout: authLogout } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('home'); // home, chat, community, agenda, notifications, settings, profile, etc.
  const [initialProfileStep, setInitialProfileStep] = useState(1); // Track which step to start on
  const [dashboardData, setDashboardData] = useState(null);
  const [achievementsData, setAchievementsData] = useState(null);
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
  
  // Subscription plans bottom sheet state
  const [showPlansBottomSheet, setShowPlansBottomSheet] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  
  // Payment flow state (replaces WebView)
  const [showPaymentFlow, setShowPaymentFlow] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  
  // Legacy WebView state (kept for backward compatibility, but not used)
  const [showSubscriptionWebView, setShowSubscriptionWebView] = useState(false);
  const [subscriptionWebViewUrl, setSubscriptionWebViewUrl] = useState(null);
  const [subscriptionWebViewLoading, setSubscriptionWebViewLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [webAuthToken, setWebAuthToken] = useState(null);
  const [apiBaseUrl, setApiBaseUrl] = useState(null);
  
  // Only blur MenuDuJour when status is EXPIRED or INACTIVE (not just expiring soon)
  const shouldBlurMenu = subscriptionData?.status === 'EXPIRED' || subscriptionData?.status === 'INACTIVE';
  const requiresRenewal = subscriptionData?.requiresRenewal || false;
  
  // Meal modal state
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [showMealModal, setShowMealModal] = useState(false);
  const [youtubeVideoId, setYoutubeVideoId] = useState(null);
  const [youtubePlaying, setYoutubePlaying] = useState(false);
  const [mealModalTab, setMealModalTab] = useState('composition');
  const [mealInteractions, setMealInteractions] = useState({});

  // Check if profile is complete based on onboarding progress
  const isProfileComplete = dashboardData?.onboarding?.data?.isComplete || 
    (dashboardData?.onboarding?.data?.completedSteps && 
     dashboardData.onboarding.data.completedSteps.length >= 6);

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
    fetchAchievementsData();
    fetchAgendaData();
    fetchCommunityPosts();
    checkSubscriptionStatus();
  }, []);

  // Refresh data when screen comes into focus (when navigating back to dashboard)
  useEffect(() => {
    const unsubscribe = navigation?.addListener?.('focus', () => {
      console.log('🏠 Dashboard screen focused - refreshing data');
      if (activeTab === 'home' && currentScreen === 'home') {
        fetchDashboardData();
        fetchAgendaData();
        fetchCommunityPosts();
        checkSubscriptionStatus();
      }
    });

    return unsubscribe;
  }, [navigation, activeTab, currentScreen]);

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
        daysRemaining: data.daysRemaining,
        isTrial: data.isTrial
      });
      
      // Show modal ONLY if status is EXPIRED, INACTIVE, or CANCELLED (automatically on dashboard load)
      const statusRequiresModal = data.status === 'EXPIRED' || data.status === 'CANCELLED' || data.status === 'INACTIVE';
      
      if (statusRequiresModal) {
        setSubscriptionAlertType('expired');
        setShowSubscriptionAlert(true);
      } else {
        setShowSubscriptionAlert(false);
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
      setShowSubscriptionAlert(true); // Show modal on expired
    }
  };

  const fetchDashboardData = async () => {
    try {
      console.log('🏠 Dashboard: Fetching data for home tab...');
      
      // Fetch dashboard data and profile data in parallel
      const [dashboardData, profileData] = await Promise.all([
        DashboardService.getDashboardData(),
        ProfileApi.getProfile()
      ]);
      
      // Merge profile data with dashboard data to ensure we have the latest avatar
      const enhancedData = {
        ...dashboardData,
        profile: {
          ...dashboardData?.profile,
          ...profileData,
          avatar: profileData?.avatar || dashboardData?.profile?.avatar
        }
      };
      
      setDashboardData(enhancedData);
      console.log('🏠 Dashboard: Data loaded successfully with latest profile info');
      console.log('🏠 Dashboard: Avatar source:', enhancedData?.profile?.avatar);
    } catch (error) {
      console.error('❌ Dashboard: Error fetching data:', error);
      // Fallback to just dashboard data if profile fetch fails
      try {
        const data = await DashboardService.getDashboardData();
        setDashboardData(data);
        console.log('🏠 Dashboard: Fallback data loaded successfully');
      } catch (fallbackError) {
        console.error('❌ Dashboard: Fallback data fetch also failed:', fallbackError);
      }
    }
  };

  const fetchAchievementsData = async () => {
    try {
      console.log('🏆 Dashboard: Fetching achievements data...');
      
      const data = await DashboardService.getAchievementsSummary();
      console.log('✅ Dashboard: Achievements data fetched successfully:', data);
      
      setAchievementsData(data);
    } catch (error) {
      console.error('❌ Dashboard: Error fetching achievements data:', error);
    }
  };

  // Auto-refresh achievements data every 30 seconds (BadgeProgressWidget requirement)
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing achievements data (30s interval)');
      fetchAchievementsData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

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

  /**
   * Load subscription data
   */
  const loadSubscriptionData = async () => {
    try {
      console.log('💳 Dashboard: Loading subscription data...');
      const data = await SubscriptionService.getSubscriptionStatus();
      setSubscriptionData(data);
      console.log('✅ Dashboard: Subscription data loaded successfully');
    } catch (error) {
      console.error('❌ Dashboard: Error loading subscription data:', error);
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

  const handleLogout = async () => {
    try {
      console.log('🚪 Dashboard: Starting logout process...');
      
      // Call the parent onLogout function if it exists
      if (onLogout && typeof onLogout === 'function') {
        onLogout();
      } else {
        console.log('🚪 Dashboard: Using AuthContext logout');
        // Use the AuthContext's logout function which handles everything
        await authLogout();
      }
      
      console.log('🚪 Dashboard: Logout completed successfully');
    } catch (error) {
      console.error('❌ Dashboard: Error during logout:', error);
      
      // Even if there's an error, try to logout using AuthContext
      try {
        await authLogout();
      } catch (logoutError) {
        console.error('❌ Dashboard: Error with AuthContext logout:', logoutError);
      }
    }
  };

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Handle meal press - open modal
  const handleMealPress = async (meal) => {
    setSelectedMeal(meal);
    setShowMealModal(true);
    setMealModalTab('composition');
    
    // Extract YouTube video ID if available
    if (meal.youtubeUrl) {
      const videoId = getYouTubeVideoId(meal.youtubeUrl);
      setYoutubeVideoId(videoId);
    } else {
      setYoutubeVideoId(null);
    }
    
    // Fetch meal interaction status
    if (meal.id) {
      try {
        const interaction = await nutritionAPI.getMealInteraction(meal.id);
        const userInteraction = interaction?.data?.userInteraction || interaction?.userInteraction || null;
        const normalizedInteraction = userInteraction?.toLowerCase() === 'like' ? 'like' : 
                                     userInteraction?.toLowerCase() === 'dislike' ? 'dislike' : 
                                     null;
        setMealInteractions(prev => ({ ...prev, [meal.id]: normalizedInteraction }));
      } catch (error) {
        console.error('Error fetching meal interaction:', error);
      }
    }
  };

  // Handle meal like
  const handleMealLike = async (mealId) => {
    try {
      const meal = selectedMeal;
      const mealName = meal?.name || 'ce repas';
      const response = await nutritionAPI.likeMeal(mealId);
      const userInteraction = response?.data?.userInteraction || 
                             response?.data?.data?.userInteraction ||
                             response?.userInteraction || 
                             null;
      const updatedInteraction = userInteraction?.toLowerCase() === 'like' ? 'like' : 
                                userInteraction?.toLowerCase() === 'dislike' ? 'dislike' : 
                                null;
      setMealInteractions(prev => ({ ...prev, [mealId]: updatedInteraction }));
      
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
    } catch (error) {
      console.error('Error handling meal like:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de sauvegarder votre choix'
      });
    }
  };

  // Handle meal dislike
  const handleMealDislike = async (mealId) => {
    try {
      const meal = selectedMeal;
      const mealName = meal?.name || 'ce repas';
      const response = await nutritionAPI.dislikeMeal(mealId);
      const userInteraction = response?.data?.userInteraction || 
                             response?.data?.data?.userInteraction ||
                             response?.userInteraction || 
                             null;
      const updatedInteraction = userInteraction?.toLowerCase() === 'like' ? 'like' : 
                                userInteraction?.toLowerCase() === 'dislike' ? 'dislike' : 
                                null;
      setMealInteractions(prev => ({ ...prev, [mealId]: updatedInteraction }));
      
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
    } catch (error) {
      console.error('Error handling meal dislike:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de sauvegarder votre choix'
      });
    }
  };

  const handleTabPress = (tabId) => {
    if (tabId === 'more') {
      // Toggle the more menu instead of changing tab
      setShowMoreMenu(true);
      console.log('Tab pressed: more - showing menu');
    } else {
      console.log('Tab pressed:', tabId);
      
      // List of modal/overlay screens that should use setCurrentScreen instead of setActiveTab
      const modalScreens = ['settings', 'notifications', 'faq', 'chat', 'community', 'agenda', 'profile'];
      
      // Check if this is a modal screen (not a bottom navigation tab)
      if (modalScreens.includes(tabId)) {
        console.log(`📱 Modal screen navigation: ${tabId}`);
        setCurrentScreen(tabId);
        // Keep the current activeTab when navigating to modal screens
        // Don't reset to 'home' to maintain the current tab context
      } else {
        // This is a bottom navigation tab (home, progress, nutrition, achievements, more)
        
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
    }
  };

  const handleMoreMenuClose = () => {
    setShowMoreMenu(false);
    console.log('More menu closed');
  };

  const handleMoreMenuItemPress = (itemId) => {
    // Handle menu item actions here
    const pageNames = {
      'chat': 'Chat',
      'notifications': 'Notifications',
      'community': 'Community',
      'agenda': 'Agenda',
      'settings': 'Settings',
    };
    
    const pageName = pageNames[itemId] || itemId;
    logPageNavigation(pageName);
    
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
    } else if (navigationTarget === 'subscription') {
      setCurrentScreen('subscription');
    } else if (navigationTarget === 'security') {
      setCurrentScreen('security');
    } else {
      setCurrentScreen('home');
    }
    console.log('Settings closed, returning to dashboard or navigating to:', navigationTarget);
  };

  const handleProfileClose = () => {
    setCurrentScreen('home');
    setInitialProfileStep(1); // Reset to step 1 for next time
    console.log('Profile closed, returning to dashboard');
    
    // Refresh data when returning from profile screen to show updated avatar and data
    console.log('🔄 Refreshing dashboard data after profile completion');
    fetchDashboardData();
    fetchAgendaData();
    fetchCommunityPosts();
    checkSubscriptionStatus();
  };

  const handleFAQClose = () => {
    setCurrentScreen('home');
    console.log('FAQ closed, returning to dashboard');
  };

  const onRefresh = async () => {
    console.log('🔄 Pull-to-refresh triggered');
    setRefreshing(true);
    
    try {
      // Clear current data
      setDashboardData(null);
      setAgendaData([]);
      setCommunityPosts([]); // Clear community posts on refresh
      
      // Fetch fresh data including profile data
      await Promise.all([
        fetchDashboardData(),
        fetchAgendaData(),
        fetchCommunityPosts(),
        checkSubscriptionStatus() // Also refresh subscription status
      ]);
      
      console.log('🔄 Refresh completed successfully with all data including profile');
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

  // Function to refresh profile data specifically (for avatar updates)
  const refreshProfileData = async () => {
    console.log('👤 Refreshing profile data specifically');
    try {
      const profileData = await ProfileApi.getProfile();
      
      // Update dashboard data with latest profile information
      setDashboardData(prevData => ({
        ...prevData,
        profile: {
          ...prevData?.profile,
          ...profileData,
          avatar: profileData?.avatar || prevData?.profile?.avatar
        }
      }));
      
      console.log('👤 Profile data refreshed successfully');
      console.log('👤 New avatar source:', profileData?.avatar);
    } catch (error) {
      console.error('❌ Error refreshing profile data:', error);
    }
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

  /**
   * Load subscription plans for bottom sheet
   */
  const loadSubscriptionPlans = async () => {
    try {
      setLoadingPlans(true);
      const plans = await SubscriptionApi.getPlans();
      
      // Validate and filter plans - only keep plans with valid IDs
      const validPlans = plans.filter(plan => {
        const hasValidId = plan?.id && typeof plan.id === 'string' && plan.id.trim() !== '';
        
        if (!hasValidId) {
          console.warn('⚠️ Plan without valid ID found:', {
            name: plan?.name || 'Unknown',
            id: plan?.id,
            plan: plan
          });
        }
        
        return hasValidId;
      });
      
      // Log warning if some plans were filtered out
      if (validPlans.length < plans.length) {
        const filteredCount = plans.length - validPlans.length;
        console.warn(`⚠️ ${filteredCount} plan(s) without valid ID were filtered out`);
        Toast.show({
          type: 'warning',
          text1: 'Attention',
          text2: `${filteredCount} plan(s) non disponible(s) (ID manquant)`,
        });
      }
      
      setSubscriptionPlans(validPlans);
      console.log('✅ Subscription plans loaded:', validPlans.length, 'valid plan(s)');
      
      // Log each plan's ID for debugging
      validPlans.forEach(plan => {
        console.log(`  📋 Plan: ${plan.name} (ID: ${plan.id})`);
      });
    } catch (error) {
      console.error('❌ Error loading subscription plans:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de charger les plans d\'abonnement',
      });
    } finally {
      setLoadingPlans(false);
    }
  };

  /**
   * Handle subscription renewal - show plans bottom sheet
   */
  const handleSubscriptionRenew = async () => {
    console.log('🔄 Opening subscription plans bottom sheet');
    setShowSubscriptionAlert(false);
    
    // Load plans if not already loaded
    if (subscriptionPlans.length === 0) {
      await loadSubscriptionPlans();
    }
    
    // Show bottom sheet with plans
    setShowPlansBottomSheet(true);
  };

  /**
   * Handle plan selection - open payment flow component
   */
  const handlePlanSelect = async (plan) => {
    try {
      // Validate plan and plan ID before proceeding
      if (!plan) {
        console.error('❌ No plan provided to handlePlanSelect');
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: 'Plan d\'abonnement invalide',
        });
        return;
      }
      
      // Validate plan ID - must be a non-empty string
      const planId = plan?.id;
      if (!planId || typeof planId !== 'string' || planId.trim() === '') {
        console.error('❌ Plan without valid ID selected:', {
          planName: plan?.name || 'Unknown',
          planId: planId,
          plan: plan
        });
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: 'Ce plan d\'abonnement n\'a pas d\'ID valide. Veuillez réessayer.',
        });
        return;
      }
      
      console.log('💳 Opening payment flow for plan:', {
        id: planId,
        name: plan?.name || 'Unknown'
      });
      
      // Close plans bottom sheet
      setShowPlansBottomSheet(false);
      
      // Store selected plan (only id and name needed for mobile payment)
      const planForPayment = {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        discountPrice: plan.discountPrice,
        duration: plan.duration,
        features: plan.features || [],
        currency: plan.currency || 'EUR'
      };
      
      console.log('💳 Plan data for payment:', planForPayment);
      
      // Store selected plan and open payment flow (NO WEBVIEW)
      setSelectedPlan(planForPayment);
      setShowPaymentFlow(true);
      
      console.log('✅ Payment flow opened - showPaymentFlow:', true);
    } catch (error) {
      console.error('❌ Error opening payment flow:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible d\'ouvrir le flux de paiement',
      });
    }
  };

  /**
   * Handle payment success
   */
  const handlePaymentSuccess = async (paymentData) => {
    console.log('✅ Payment successful:', paymentData);
    
    Toast.show({
      type: 'success',
      text1: 'Abonnement activé',
      text2: 'Votre abonnement a été activé avec succès',
    });
    
    // Refresh subscription data
    await loadSubscriptionData();
    
    // Close payment flow
    setShowPaymentFlow(false);
    setSelectedPlan(null);
  };

  /**
   * Handle payment error
   */
  const handlePaymentError = (error) => {
    console.error('❌ Payment error:', error);
    
    Toast.show({
      type: 'error',
      text1: 'Erreur de paiement',
      text2: error?.message || 'Une erreur est survenue lors du paiement',
    });
  };

  const handleSubscriptionRenewFromRestricted = () => {
    console.log('🔄 Navigating to subscription renewal page from restricted screen');
    
    // Navigate to subscription page (step 5 of profile) with subscription tab selected
    setCurrentScreen('profile');
    setInitialProfileStep(5); // Start at subscription step
  };

  // Profile completion handler
  const handleCompleteProfile = () => {
    logPageNavigation('Profile', ['Profile Steps (Mon Profile, Mes Objectifs, Recommandations, Rendez-vous, Abonnement)']);
    setCurrentScreen('profile');
    setInitialProfileStep(1); // Start at step 1 - Mon Profile
  };

  // Profile step navigation handler
  const handleProfileStepPress = (stepId) => {
    const stepNames = {
      1: 'Mon Profile',
      2: 'Mes Objectifs',
      3: 'Recommandations',
      4: 'Rendez-vous',
      5: 'Abonnement',
      6: 'Confirmation',
    };
    
    logPageNavigation(`Profile - ${stepNames[stepId] || `Step ${stepId}`}`);
    
    setCurrentScreen('profile');
    setInitialProfileStep(stepId);
  };

  // If FAQ screen is active, show FAQScreen
  if (currentScreen === 'faq') {
    return (
      <>
        <FAQScreen 
          onClose={handleFAQClose}
          user={user}
          onTabPress={handleTabPress}
        />
        <BottomNavigation activeTab={activeTab} onTabPress={handleTabPress} />
      </>
    );
  }

  // If notifications screen is active, show NotificationsScreen
  if (currentScreen === 'notifications') {
    return (
      <>
        <NotificationsScreen 
          user={user} 
          onLogout={handleLogout} 
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
          onLogout={handleLogout} 
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
          onLogout={handleLogout} 
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
          onLogout={handleLogout} 
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

  // If settings screen is active, show SettingsScreen
  // NOTE: This must come BEFORE activeTab checks so modal screens take priority
  if (currentScreen === 'settings') {
    return (
      <>
        <SettingsScreen 
          user={user} 
          onLogout={handleLogout} 
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

  // If subscription screen is active, show SubscriptionScreen
  if (currentScreen === 'subscription') {
    return (
      <>
        <SubscriptionScreen 
          navigation={navigation}
          onClose={() => setCurrentScreen('settings')}
          user={user}
          onTabPress={handleTabPress}
          isStandalone={true}
        />
        <MoreMenu 
          visible={showMoreMenu}
          onClose={handleMoreMenuClose}
          onMenuItemPress={handleMoreMenuItemPress}
        />
      </>
    );
  }

  // If security screen is active, show SecurityScreen
  if (currentScreen === 'security') {
    return (
      <>
        <SecurityScreen 
          navigation={navigation}
          onClose={() => setCurrentScreen('settings')}
          user={user}
          onTabPress={handleTabPress}
          activeTab={activeTab}
        />
        <MoreMenu 
          visible={showMoreMenu}
          onClose={handleMoreMenuClose}
          onMenuItemPress={handleMoreMenuItemPress}
        />
      </>
    );
  }

  // If progress tab is active, show ProgressScreen but keep BottomNavigation visible
  if (activeTab === 'progress') {
    return (
      <>
        <ProgressScreen 
          user={user} 
          onLogout={handleLogout} 
          onTabPress={handleTabPress}
          activeTab={activeTab}
          onSubscriptionRenew={handleSubscriptionRenewFromRestricted}
          onFAQPress={() => setCurrentScreen('faq')}
        />
        {/* Navigation bas persistante pour une meilleure fluidité */}
        <BottomNavigation activeTab={activeTab} onTabPress={handleTabPress} />
        <MoreMenu 
          visible={showMoreMenu}
          onClose={handleMoreMenuClose}
          onMenuItemPress={handleMoreMenuItemPress}
        />
      </>
    );
  }

  // If nutrition tab is active, show NutritionScreen but keep BottomNavigation visible
  if (activeTab === 'nutrition') {
    return (
      <>
        <NutritionScreen 
          user={user} 
          onLogout={handleLogout} 
          onTabPress={handleTabPress}
          activeTab={activeTab}
          onSubscriptionRenew={handleSubscriptionRenewFromRestricted}
          onFAQPress={() => setCurrentScreen('faq')}
        />
        {/* Navigation bas persistante pour une meilleure fluidité */}
        <BottomNavigation activeTab={activeTab} onTabPress={handleTabPress} />
        <MoreMenu 
          visible={showMoreMenu}
          onClose={handleMoreMenuClose}
          onMenuItemPress={handleMoreMenuItemPress}
        />
      </>
    );
  }

  // If achievements tab is active, show AchievementsScreen but keep BottomNavigation visible
  if (activeTab === 'achievements') {
    return (
      <>
        <AchievementsScreen 
          user={user} 
          onLogout={handleLogout} 
          onTabPress={handleTabPress}
          activeTab={activeTab}
          onSubscriptionRenew={handleSubscriptionRenewFromRestricted}
        />
        {/* Navigation bas persistante pour une meilleure fluidité */}
        <BottomNavigation activeTab={activeTab} onTabPress={handleTabPress} />
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
          onLogout={handleLogout} 
          onTabPress={handleTabPress}
          activeTab={activeTab}
          onClose={handleProfileClose}
          initialStep={initialProfileStep}
          onFAQPress={() => setCurrentScreen('faq')}
          navigation={navigation}
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
      <AppHeader
        showLogo={true}
        onHelpPress={() => {
          logPageNavigation('FAQ', ['FAQ List', 'Search', 'Categories']);
          setCurrentScreen('faq');
        }}
        onNotificationPress={() => {
          logPageNavigation('Notifications');
          setCurrentScreen('notifications');
        }}
        onProfilePress={() => {
          logPageNavigation('Settings');
          setCurrentScreen('settings');
        }}
        avatarSource={dashboardData?.profile?.avatar || user?.avatar}
        avatarFallbackText={user?.firstName?.charAt(0) || user?.name?.charAt(0)}
      />

      {/* Subscription Banner - Shows when expired/cancelled/inactive OR ≤3 days (paid) or ≤1 day (trial) */}
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

        {/* Profile Completion Card or Progress Section */}
        {console.log('🏠 Dashboard debug - Profile completion check:', {
          isProfileComplete,
          onboardingData: dashboardData?.onboarding,
          completedSteps: dashboardData?.onboarding?.data?.completedSteps,
          completedStepsLength: dashboardData?.onboarding?.data?.completedSteps?.length,
          isComplete: dashboardData?.onboarding?.data?.isComplete
        })}
        {!isProfileComplete ? (
          <ProfileCompletionCard 
            key={`profile-completion-${dashboardData?.onboarding?.data?.completedSteps?.length || 0}-${dashboardData?.fetchedAt || 'initial'}`}
            onboardingData={dashboardData?.onboarding}
            onCompleteProfile={handleCompleteProfile}
            onStepPress={handleProfileStepPress}
            subscriptionData={subscriptionData}
            onSubscriptionRenew={handleSubscriptionRenew}
          />
        ) : (
          <ProgressCard 
            key={dashboardData?.fetchedAt || 'initial'}
            dashboardData={dashboardData} 
            subscriptionData={subscriptionData}
            onRefresh={handleProgressRefresh}
            onSubscriptionRenew={handleSubscriptionRenew}
            onProgressPress={handleTabPress}
          />
        )}

        {/* Achievements Card */}
        <AchievementsCard
          key={achievementsData?.fetchedAt || 'initial'}
          badgesData={achievementsData}
          onPress={() => handleTabPress('achievements')}
          subscriptionData={subscriptionData}
          onSubscriptionRenew={handleSubscriptionRenew}
        />

        {/* Nutrition Card */}
        <BlurredCard
          isBlurred={shouldBlurMenu}
          onPress={handleSubscriptionRenew}
          blurMessage="Menu du jour disponible avec un abonnement actif"
        >
          <NutritionCard 
            onPress={() => {
              if (shouldBlurMenu) {
                handleSubscriptionRenew();
              } else {
                setShowCompleteDayModal(true);
              }
            }}
            onMealPress={(meal) => {
              if (!shouldBlurMenu) {
                handleMealPress(meal);
              }
            }}
            subscriptionData={subscriptionData}
            onSubscriptionPress={handleSubscriptionRenew}
          />
        </BlurredCard>

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

      {/* Subscription Modal - Shows ONLY when status is EXPIRED, INACTIVE, or CANCELLED */}
      <SubscriptionAlert
        visible={showSubscriptionAlert}
        type={subscriptionAlertType}
        daysRemaining={subscriptionData?.daysRemaining}
        onRenew={handleSubscriptionRenew}
      />

      {/* Subscription Plans Bottom Sheet */}
      <Modal
        visible={showPlansBottomSheet}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPlansBottomSheet(false)}
      >
        <View style={styles.bottomSheetOverlay}>
          <TouchableOpacity
            style={styles.bottomSheetBackdrop}
            activeOpacity={1}
            onPress={() => setShowPlansBottomSheet(false)}
          />
          <View style={styles.bottomSheetContainer}>
            {/* BottomSheet Handle */}
            <View style={styles.bottomSheetHandleContainer}>
              <View style={styles.bottomSheetHandle} />
            </View>
            
            {/* BottomSheet Header */}
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Choisissez votre abonnement</Text>
              <TouchableOpacity 
                onPress={() => setShowPlansBottomSheet(false)} 
                style={styles.bottomSheetCloseButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            {/* Plans List or Payment Flow */}
            {showPaymentFlow && selectedPlan ? (
              <SubscriptionPaymentFlow
                visible={true}
                plan={selectedPlan}
                onClose={() => {
                  setShowPaymentFlow(false);
                  setSelectedPlan(null);
                }}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
                isEmbedded={true}
              />
            ) : (
            <ScrollView style={styles.bottomSheetContent} showsVerticalScrollIndicator={false}>
              {loadingPlans ? (
                <View style={styles.bottomSheetLoadingContainer}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={styles.bottomSheetLoadingText}>Chargement des plans...</Text>
                </View>
              ) : subscriptionPlans.length > 0 ? (
                subscriptionPlans.map((plan) => {
                  // Double-check plan ID validity (should already be filtered, but safety check)
                  if (!plan?.id || typeof plan.id !== 'string' || plan.id.trim() === '') {
                    console.warn('⚠️ Plan without valid ID in render (should have been filtered):', plan);
                    return null; // Don't render plans without valid ID
                  }
                  
                  let backgroundColor = '#4CAF50';
                  
                  if (plan.name?.toLowerCase().includes('premium')) {
                    backgroundColor = '#8B5CF6';
                  } else if (plan.name?.toLowerCase().includes('flexy')) {
                    backgroundColor = '#FF6B35';
                  } else if (plan.name?.toLowerCase().includes('basic')) {
                    backgroundColor = '#2196F3';
                  }
                  
                  return (
                    <TouchableOpacity
                      key={plan.id}
                      style={[styles.planBottomSheetItem, { borderLeftColor: backgroundColor }]}
                      onPress={() => handlePlanSelect(plan)}
                    >
                      <View style={styles.planBottomSheetContent}>
                        <Text style={styles.planBottomSheetName}>{plan.name}</Text>
                        <View style={styles.planBottomSheetPricing}>
                          {plan.discountPrice && plan.discountPrice < plan.price ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <Text style={[styles.planBottomSheetPrice, { color: theme.colors.primary }]}>
                                {plan.currency || '€'}{plan.discountPrice}
                              </Text>
                              <Text style={[styles.planBottomSheetPrice, { 
                                textDecorationLine: 'line-through', 
                                color: theme.colors.text.secondary,
                                fontSize: 14 
                              }]}>
                                {plan.currency || '€'}{plan.price}
                              </Text>
                            </View>
                          ) : (
                            <Text style={styles.planBottomSheetPrice}>
                              {plan.currency || '€'}{plan.price}
                            </Text>
                          )}
                          {plan.duration && (
                            <Text style={styles.planBottomSheetDuration}>
                              / {SubscriptionApi.getBillingPeriod(plan.duration)}
                            </Text>
                          )}
                        </View>
                        {plan.features && plan.features.length > 0 && (
                          <Text style={styles.planBottomSheetFeatures}>
                            {plan.features.slice(0, 2).join(' • ')}
                          </Text>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.bottomSheetEmptyContainer}>
                  <Ionicons name="card-outline" size={48} color={theme.colors.text.secondary} />
                  <Text style={styles.bottomSheetEmptyText}>Aucun plan disponible</Text>
                </View>
              )}
            </ScrollView>
            )}
          </View>
        </View>
      </Modal>


      {/* Subscription WebView BottomSheet - REMOVED: Now using native payment flow component above */}
      {/* Legacy code removed - no longer needed */}
      {false && (
      <Modal
        visible={false}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {}}
      >
        <View style={styles.bottomSheetOverlay}>
          <TouchableOpacity
            style={styles.bottomSheetBackdrop}
            activeOpacity={1}
            onPress={() => setShowSubscriptionWebView(false)}
          />
          <View style={styles.bottomSheetContainer}>
            {/* BottomSheet Handle */}
            <View style={styles.bottomSheetHandleContainer}>
              <View style={styles.bottomSheetHandle} />
            </View>
            
            {/* BottomSheet Header */}
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Paiement Abonnement</Text>
              <TouchableOpacity 
                onPress={() => {
                  setShowSubscriptionWebView(false);
                  setSelectedPlanId(null); // Clear selected plan ID when closing
                }} 
                style={styles.bottomSheetCloseButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            {/* WebView Content */}
            <View style={styles.bottomSheetContent}>
              {subscriptionWebViewUrl ? (
                <WebView
                  source={{ 
                    uri: subscriptionWebViewUrl, 
                    headers: webAuthToken ? { Authorization: `Bearer ${webAuthToken}` } : {} 
                  }}
                  onLoadStart={() => setSubscriptionWebViewLoading(true)}
                  onLoadEnd={() => setSubscriptionWebViewLoading(false)}
                  onNavigationStateChange={(nav) => {
                    const url = nav.url || '';
                    console.log('🌐 Subscription WebView navigation:', url);
                    
                    // Check if redirected to login (token not working)
                    if (url.includes('/login') || url.includes('/auth/login') || url.includes('/signin')) {
                      console.error('❌ Redirected to login page - token authentication failed');
                      Toast.show({
                        type: 'error',
                        text1: 'Erreur d\'authentification',
                        text2: 'La connexion automatique a échoué. Vérifiez votre connexion.',
                      });
                    }
                    
                    // Check if we're NOT on the correct subscription page with the plan ID
                    if (selectedPlanId) {
                      const expectedPath = `/onboarding/subscription/${selectedPlanId}`;
                      const isOnCorrectPage = url.includes(expectedPath);
                      
                      // If redirected to dashboard, home, or any other page (except success/cancel), redirect to subscription page
                      if (!isOnCorrectPage && 
                          !url.includes('/onboarding/subscription-success') && 
                          !url.includes('/onboarding/subscription-cancel') &&
                          (url.includes('/dashboard') || url.includes('/home') || url === 'https://app.lasocoach.com/' || url === 'https://app.lasocoach.com' || !url.includes('/onboarding/subscription/'))) {
                        console.log('🔄 Not on correct subscription page, forcing navigation to:', expectedPath);
                        console.log('🔄 Current URL:', url);
                        
                        // Get token from current URL or use stored token
                        const urlParams = new URLSearchParams(nav.url?.split('?')[1] || '');
                        const token = urlParams.get('token') || webAuthToken;
                        
                        // Build subscription URL with plan ID
                        const subscriptionUrl = `https://app.lasocoach.com/onboarding/subscription/${selectedPlanId}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
                        
                        console.log('🔄 Redirecting to:', subscriptionUrl.replace(token || '', '***TOKEN***'));
                        
                        // Force navigation to subscription page
                        setTimeout(() => {
                          setSubscriptionWebViewUrl(subscriptionUrl);
                        }, 100);
                      } else if (isOnCorrectPage) {
                        console.log('✅ On correct subscription page with plan ID:', selectedPlanId);
                      }
                    }
                    
                    // Check for success/cancel
                    if (url.includes('/onboarding/subscription-success')) {
                      Toast.show({ 
                        type: 'success', 
                        text1: 'Abonnement activé', 
                        text2: 'Merci pour votre souscription !' 
                      });
                      setShowSubscriptionWebView(false);
                      setSelectedPlanId(null); // Clear selected plan ID
                      // Refresh subscription data
                      loadSubscriptionData();
                    } else if (url.includes('/onboarding/subscription-cancel')) {
                      Toast.show({ 
                        type: 'info', 
                        text1: 'Abonnement annulé', 
                        text2: 'Processus annulé.' 
                      });
                      setShowSubscriptionWebView(false);
                      setSelectedPlanId(null); // Clear selected plan ID
                    }
                  }}
                  onError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.error('❌ Subscription WebView error:', nativeEvent);
                    Toast.show({
                      type: 'error',
                      text1: 'Erreur de chargement',
                      text2: 'Impossible de charger la page de souscription',
                    });
                  }}
                  injectedJavaScriptBeforeContentLoaded={webAuthToken && selectedPlanId ? `
                    (function() {
                      try {
                        // Get token from URL first (most reliable)
                        const urlParams = new URLSearchParams(window.location.search);
                        const urlToken = urlParams.get('token');
                        const firebaseIdToken = urlToken || '${webAuthToken ? webAuthToken.replace(/'/g, "\\'").replace(/\\/g, '\\\\').replace(/\n/g, '\\n') : ''}';
                        const planId = '${selectedPlanId}';
                        const expectedPath = '/onboarding/subscription/' + planId;
                        const apiBaseUrl = '${apiBaseUrl || 'https://laso-coach-backend.onrender.com/api/v1'}';
                        
                        console.log('🔐 Starting authentication with Firebase ID token...');
                        console.log('📋 Plan ID:', planId);
                        console.log('🔗 Expected path:', expectedPath);
                        console.log('🔗 API Base URL:', apiBaseUrl);
                        
                        // CRITICAL: Intercept fetch and XMLHttpRequest BEFORE storing tokens
                        // This ensures ALL requests (including auth checks) get the token
                        const originalFetch = window.fetch;
                        const originalXHROpen = XMLHttpRequest.prototype.open;
                        const originalXHRSend = XMLHttpRequest.prototype.send;
                        
                        // Store backend token when available
                        let backendToken = null;
                        let tokenPromise = null;
                        
                        // Intercept fetch to add Authorization header
                        window.fetch = function(...args) {
                          const [url, options = {}] = args;
                          const headers = options.headers || {};
                          
                          // Add token to headers if available
                          const token = backendToken || firebaseIdToken;
                          if (token && !headers['Authorization'] && !headers['authorization']) {
                            if (headers instanceof Headers) {
                              headers.set('Authorization', 'Bearer ' + token);
                            } else {
                              options.headers = {
                                ...headers,
                                'Authorization': 'Bearer ' + token
                              };
                            }
                          }
                          
                          return originalFetch.apply(this, [url, options]);
                        };
                        
                        // Intercept XMLHttpRequest to add Authorization header
                        XMLHttpRequest.prototype.open = function(method, url, ...rest) {
                          this._url = url;
                          this._method = method;
                          return originalXHROpen.apply(this, [method, url, ...rest]);
                        };
                        
                        XMLHttpRequest.prototype.send = function(...args) {
                          const token = backendToken || firebaseIdToken;
                          if (token && this._url && !this.getRequestHeader('Authorization')) {
                            this.setRequestHeader('Authorization', 'Bearer ' + token);
                          }
                          return originalXHRSend.apply(this, args);
                        };
                        
                        console.log('✅ HTTP interceptors installed for automatic token injection');
                        
                        // Store Firebase token IMMEDIATELY (synchronously)
                        if (firebaseIdToken) {
                          localStorage.setItem('token', firebaseIdToken);
                          localStorage.setItem('firebase_id_token', firebaseIdToken);
                          localStorage.setItem('mobile_auth_token', firebaseIdToken);
                          sessionStorage.setItem('token', firebaseIdToken);
                          sessionStorage.setItem('firebase_id_token', firebaseIdToken);
                          sessionStorage.setItem('mobile_auth_token', firebaseIdToken);
                          window.authToken = firebaseIdToken;
                          console.log('✅ Firebase token stored IMMEDIATELY in localStorage (synchronous)');
                        }
                        
                        // Authenticate with backend to get backend token (PRIORITY: do this ASAP)
                        if (firebaseIdToken) {
                          console.log('🔄 Authenticating with backend to get admin token...');
                          
                          // Use async fetch but set up token promise for immediate use
                          tokenPromise = fetch(apiBaseUrl + '/auth/login', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': 'Bearer ' + firebaseIdToken
                            },
                            body: JSON.stringify({ idToken: firebaseIdToken })
                          })
                          .then(response => {
                            if (!response.ok) {
                              console.warn('⚠️ Backend authentication returned status:', response.status);
                              return response.text().then(text => {
                                console.warn('⚠️ Response:', text);
                                throw new Error('Authentication failed: ' + response.status);
                              });
                            }
                            return response.json();
                          })
                          .then(data => {
                            console.log('✅ Backend authentication successful:', data);
                            
                            // Update with backend token
                            if (data.token || data.data?.token) {
                              backendToken = data.token || data.data.token;
                              localStorage.setItem('token', backendToken);
                              sessionStorage.setItem('token', backendToken);
                              window.authToken = backendToken;
                              console.log('✅ Backend token stored in localStorage (replaces Firebase token)');
                              
                              // Update interceptors to use backend token
                              return backendToken;
                            } else {
                              console.warn('⚠️ No backend token in response, using Firebase token');
                              return firebaseIdToken;
                            }
                          })
                          .catch(error => {
                            console.error('❌ Backend authentication error:', error);
                            console.warn('⚠️ Falling back to Firebase token for requests');
                            return firebaseIdToken;
                          });
                          
                          // Start authentication immediately (don't wait)
                          tokenPromise.catch(() => {}); // Suppress unhandled rejection
                        }
                        
                        // Force redirection to subscription page if not already there
                        const currentPath = window.location.pathname;
                        if (planId && !currentPath.includes('/onboarding/subscription/' + planId) && 
                            !currentPath.includes('/onboarding/subscription-success') && 
                            !currentPath.includes('/onboarding/subscription-cancel')) {
                          console.log('🔄 Redirecting to subscription page with plan ID:', planId);
                          const token = backendToken || firebaseIdToken;
                          const subscriptionUrl = expectedPath + (token ? '?token=' + encodeURIComponent(token) : '');
                          console.log('🔄 Redirecting to:', subscriptionUrl);
                          window.location.replace(subscriptionUrl);
                        } else {
                          console.log('✅ Already on correct subscription page with plan ID:', planId);
                        }
                      } catch (e) {
                        console.error('❌ Error in injection script:', e);
                      }
                    })();
                  ` : webAuthToken ? `
                    (function() {
                      try {
                        // Get token from URL first (most reliable)
                        const urlParams = new URLSearchParams(window.location.search);
                        const urlToken = urlParams.get('token');
                        const token = urlToken || '${webAuthToken.replace(/'/g, "\\'").replace(/\\/g, '\\\\').replace(/\n/g, '\\n')}';
                        
                        // Set token in localStorage immediately before page loads
                        if (token) {
                          // Store with multiple keys for compatibility
                          localStorage.setItem('token', token); // Frontend web expects this key
                          localStorage.setItem('firebase_id_token', token);
                          localStorage.setItem('mobile_auth_token', token);
                          
                          // Also store in sessionStorage as backup
                          sessionStorage.setItem('token', token); // Frontend web expects this key
                          sessionStorage.setItem('firebase_id_token', token);
                          sessionStorage.setItem('mobile_auth_token', token);
                          
                          // Set Authorization header for fetch requests
                          window.authToken = token;
                          
                          console.log('✅ Mobile auth token set in localStorage (multiple keys for compatibility)');
                        }
                      } catch (e) {
                        console.error('❌ Error setting auth token:', e);
                      }
                    })();
                  ` : ''}
                  injectedJavaScript={webAuthToken && selectedPlanId ? `
                    (function() {
                      try {
                        // Re-intercept fetch and XMLHttpRequest after page load
                        // This ensures the interceptors are still active even if page reloads
                        const token = localStorage.getItem('token') || localStorage.getItem('firebase_id_token') || '${webAuthToken ? webAuthToken.replace(/'/g, "\\'").replace(/\\/g, '\\\\').replace(/\n/g, '\\n') : ''}';
                        
                        if (token) {
                          // Intercept fetch
                          const originalFetch = window.fetch;
                          window.fetch = function(...args) {
                            const [url, options = {}] = args;
                            const headers = options.headers || {};
                            
                            if (!headers['Authorization'] && !headers['authorization']) {
                              if (headers instanceof Headers) {
                                headers.set('Authorization', 'Bearer ' + token);
                              } else {
                                options.headers = {
                                  ...headers,
                                  'Authorization': 'Bearer ' + token
                                };
                              }
                            }
                            
                            return originalFetch.apply(this, [url, options]);
                          };
                          
                          // Intercept XMLHttpRequest
                          const originalXHROpen = XMLHttpRequest.prototype.open;
                          const originalXHRSend = XMLHttpRequest.prototype.send;
                          
                          XMLHttpRequest.prototype.open = function(method, url, ...rest) {
                            this._url = url;
                            this._method = method;
                            return originalXHROpen.apply(this, [method, url, ...rest]);
                          };
                          
                          XMLHttpRequest.prototype.send = function(...args) {
                            if (token && this._url && !this.getRequestHeader('Authorization')) {
                              this.setRequestHeader('Authorization', 'Bearer ' + token);
                            }
                            return originalXHRSend.apply(this, args);
                          };
                          
                          console.log('✅ HTTP interceptors re-installed after page load');
                        }
                      } catch (e) {
                        console.error('❌ Error in post-load injection script:', e);
                      }
                    })();
                    true; // Required for injectedJavaScript
                  ` : ''}
                  style={styles.bottomSheetWebView}
                />
              ) : null}
              {subscriptionWebViewLoading && (
                <View style={styles.bottomSheetLoadingOverlay}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
      )}

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
                    
                    const { AgendaApi } = await import('../services/agendaApi');
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
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Marquer le jour comme terminé</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowCompleteDayModal(false)}
              >
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <Text style={{ fontSize: 16, marginBottom: 20, color: theme.colors.text.primary }}>
                Sélectionnez les repas que vous avez terminés aujourd'hui :
              </Text>
              
              {['Petit-Déj', 'Déjeuner', 'Souper', 'Bonus'].map((meal, index) => (
                                  <TouchableOpacity 
                    key={index}
                    style={[
                      styles.modalButton,
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
                    <View style={styles.modalButtonContent}>
                      <Ionicons 
                        name={selectedMeals.includes(meal) ? "checkmark-circle" : "ellipse-outline"} 
                        size={20} 
                        color={selectedMeals.includes(meal) ? "#4CAF50" : theme.colors.text.secondary} 
                      />
                      <Text style={styles.modalButtonText}>{meal}</Text>
                    </View>
                  </TouchableOpacity>
              ))}
              
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: '#007BFF', marginTop: 20 }]}
                onPress={handleCompleteDay}
              >
                <View style={styles.modalButtonContent}>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                    Terminer le jour ({totalPoints} points)
                  </Text>
                </View>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

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
        <View style={styles.mealModalOverlay}>
          <View style={styles.mealModalContent}>
            <View style={styles.mealModalHeader}>
              {/* Meal Image */}
              {selectedMeal?.imageUrl && (
                <Image
                  source={{ uri: selectedMeal.imageUrl }}
                  style={styles.mealModalHeaderImage}
                  resizeMode="cover"
                />
              )}
              <View style={styles.mealModalTitleContainer}>
                <Text style={styles.mealModalTitle}>
                  {selectedMeal?.name || 'Détails du repas'}
                </Text>
              </View>
              {/* Like/Dislike Buttons */}
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
              <TouchableOpacity
                onPress={() => {
                  setShowMealModal(false);
                  setYoutubePlaying(false);
                }}
                style={styles.mealModalCloseButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.mealModalBody}
              contentContainerStyle={styles.mealModalBodyContent}
              showsVerticalScrollIndicator={true}
            >
              {/* YouTube Video */}
              {youtubeVideoId && (() => {
                const screenWidth = Dimensions.get('window').width;
                const videoWidth = screenWidth - 32;
                const videoHeight = Math.round((videoWidth * 9) / 16);
                
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
                      onError={(error) => {
                        console.error('YouTube player error:', error);
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
              
              {/* Navigation Tabs */}
              {selectedMeal && (
                <View style={styles.mealModalTabsContainer}>
                  <View style={styles.mealModalTabs}>
                    <TouchableOpacity 
                      style={[styles.mealModalTab, mealModalTab === 'composition' && styles.activeMealModalTab]}
                      onPress={() => setMealModalTab('composition')}
                    >
                      <Ionicons 
                        name="nutrition" 
                        size={20} 
                        color={mealModalTab === 'composition' ? "#000000" : "#666666"} 
                      />
                      {mealModalTab === 'composition' && (
                        <Text style={styles.mealModalTabTitle}>Composition</Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.mealModalTab, mealModalTab === 'recipe' && styles.activeMealModalTab]}
                      onPress={() => setMealModalTab('recipe')}
                    >
                      <Ionicons 
                        name="restaurant" 
                        size={20} 
                        color={mealModalTab === 'recipe' ? "#000000" : "#666666"} 
                      />
                      {mealModalTab === 'recipe' && (
                        <Text style={styles.mealModalTabTitle}>Instructions</Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.mealModalTab, mealModalTab === 'ingredients' && styles.activeMealModalTab]}
                      onPress={() => setMealModalTab('ingredients')}
                    >
                      <Ionicons 
                        name="list" 
                        size={20} 
                        color={mealModalTab === 'ingredients' ? "#000000" : "#666666"} 
                      />
                      {mealModalTab === 'ingredients' && (
                        <Text style={styles.mealModalTabTitle}>Ingrédients</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              
              {/* Tab Content */}
              {selectedMeal && (() => {
                if (mealModalTab === 'composition') {
                  const nutritionalData = selectedMeal.nutritionalComposition || {};
                  const calories = selectedMeal.calories || selectedMeal.calorieCount || nutritionalData.calories || 0;
                  const proteins = selectedMeal.proteins || nutritionalData.proteins || 0;
                  const carbs = selectedMeal.carbs || selectedMeal.carbohydrates || nutritionalData.carbs || nutritionalData.carbohydrates || 0;
                  const fats = selectedMeal.fats || selectedMeal.fat || nutritionalData.fats || nutritionalData.fat || 0;
                  const hasNutritionalData = calories > 0 || proteins > 0 || carbs > 0 || fats > 0;
                  
                  return (
                    <View style={styles.mealModalTabContent}>
                      <Text style={styles.contentTitle}>Composition nutritionnelle</Text>
                      {hasNutritionalData ? (
                        <View style={styles.nutritionalDataContainer}>
                          <View style={styles.nutritionalRow}>
                            <Text style={styles.nutritionalLabel}>Calories:</Text>
                            <Text style={styles.nutritionalValue}>{calories} kcal</Text>
                          </View>
                          <View style={styles.nutritionalRow}>
                            <Text style={styles.nutritionalLabel}>Protéines:</Text>
                            <Text style={styles.nutritionalValue}>{proteins} g</Text>
                          </View>
                          <View style={styles.nutritionalRow}>
                            <Text style={styles.nutritionalLabel}>Glucides:</Text>
                            <Text style={styles.nutritionalValue}>{carbs} g</Text>
                          </View>
                          <View style={styles.nutritionalRow}>
                            <Text style={styles.nutritionalLabel}>Lipides:</Text>
                            <Text style={styles.nutritionalValue}>{fats} g</Text>
                          </View>
                        </View>
                      ) : (
                        <Text style={styles.noContentText}>
                          Aucune donnée nutritionnelle disponible pour ce repas
                        </Text>
                      )}
                    </View>
                  );
                } else if (mealModalTab === 'recipe') {
                  let instructions = selectedMeal.instructions;
                  if (typeof instructions === 'string') {
                    try {
                      instructions = JSON.parse(instructions);
                    } catch (e) {
                      instructions = [instructions];
                    }
                  }
                  
                  return (
                    <View style={styles.mealModalTabContent}>
                      <Text style={styles.contentTitle}>Instructions de préparation</Text>
                      {instructions && instructions.length > 0 ? (
                        instructions.map((instruction, index) => (
                          <Text key={index} style={styles.recipeStep}>
                            {index + 1}. {instruction}
                          </Text>
                        ))
                      ) : (
                        <Text style={styles.noContentText}>
                          Aucune instruction disponible pour ce repas
                        </Text>
                      )}
                    </View>
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
                    <View style={styles.mealModalTabContent}>
                      <Text style={styles.contentTitle}>Liste des ingrédients</Text>
                      {ingredients && ingredients.length > 0 ? (
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
                      )}
                    </View>
                  );
                }
              })()}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
    paddingBottom: 100, // Espace pour la navigation fixe en bas (hauteur nav + safe area + marge)
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
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginVertical: 5,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    margin: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  modalContent: {
    padding: 15,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    marginBottom: 10,
  },
  modalButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: theme.colors.text.primary,
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
  // Meal Modal Styles
  mealModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  mealModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    height: '90%',
    flexDirection: 'column',
  },
  mealModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    gap: 12,
  },
  mealModalHeaderImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  mealModalTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  mealModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  mealModalCloseButton: {
    padding: 4,
  },
  headerInteractionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginRight: 8,
  },
  headerInteractionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  activeHeaderInteractionButton: {
    backgroundColor: '#E3F2FD',
  },
  mealModalBody: {
    flex: 1,
  },
  mealModalBodyContent: {
    paddingBottom: 20,
  },
  mealModalTabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    marginBottom: 8,
  },
  mealModalTabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  mealModalTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 6,
    minWidth: 100,
    justifyContent: 'center',
  },
  activeMealModalTab: {
    backgroundColor: '#F0F0F0',
  },
  mealModalTabTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  mealModalTabContent: {
    padding: 20,
    paddingTop: 16,
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  nutritionalDataContainer: {
    gap: 12,
  },
  nutritionalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  nutritionalLabel: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  nutritionalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  noContentText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  recipeStep: {
    fontSize: 15,
    color: theme.colors.text.primary,
    lineHeight: 22,
    marginBottom: 12,
  },
  ingredientItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  ingredientNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginRight: 8,
    minWidth: 20,
  },
  ingredientDetails: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  ingredientText: {
    fontSize: 15,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  ingredientAmount: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
  youtubePlayerContainer: {
    alignSelf: 'center',
    marginTop: 16,
    marginBottom: 0,
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: '#000000',
  },
  // Bottom Sheet Styles
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheetBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bottomSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  bottomSheetHandleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  bottomSheetTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  bottomSheetCloseButton: {
    padding: 8,
    marginRight: -8,
  },
  bottomSheetContent: {
    flex: 1,
    minHeight: 400,
  },
  bottomSheetWebView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  bottomSheetLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  bottomSheetLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  bottomSheetLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSheetEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  bottomSheetEmptyText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  // Plan Bottom Sheet Item Styles
  planBottomSheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    borderLeftWidth: 4,
    backgroundColor: '#FFFFFF',
  },
  planBottomSheetContent: {
    flex: 1,
  },
  planBottomSheetName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  planBottomSheetPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  planBottomSheetPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  planBottomSheetDuration: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginLeft: 4,
  },
  planBottomSheetFeatures: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
});

export default DashboardScreen;