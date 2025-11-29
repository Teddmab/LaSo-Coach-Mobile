import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Image,
  StatusBar,
  Dimensions,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
// Haptics is optional - check if available
let Haptics = null;
try {
  Haptics = require('expo-haptics');
} catch (e) {
  console.log('⚠️ expo-haptics not available, haptic feedback disabled');
}
import { theme } from '../constants/theme';
import SubscriptionBanner from '../components/SubscriptionBanner';
import SubscriptionService from '../services/subscriptionService';
import Avatar from '../components/Avatar';
import AppHeader from '../components/AppHeader';
import { ProfileApi } from '../services/profileApi';
import BadgeApi from '../services/badgeApi';
import chatSocketService from '../services/chatSocketService';
import BadgeUnlockModal from '../components/BadgeUnlockModal';
import FloatingPointsAnimation from '../components/FloatingPointsAnimation';
import api from '../services/api';
import { API_CONFIG } from '../config/apiConfig';

const { width: screenWidth } = Dimensions.get('window');

// Badge name to image mapping
const getBadgeImage = (badgeName) => {
  const badgeMap = {
    'botosi': require('../../assets/badge/Badge-Botosi.png'),
    'elengi': require('../../assets/badge/Badge-Elengi.png'),
    'makasi': require('../../assets/badge/Badge-Makasi.png'),
    'molende': require('../../assets/badge/Badge-Molende.png'),
    'mopao': require('../../assets/badge/Badge-MOPAO.png'),
    'moto': require('../../assets/badge/Badge-MOTO.png'),
    'mpiko': require('../../assets/badge/Badge-Mpiko.png'),
    'nzuri': require('../../assets/badge/Badge-Nzuri.png'),
    'safi': require('../../assets/badge/Badge-Safi.png'),
    'sawa': require('../../assets/badge/Badge-SAWA.png'),
  };
  
  const normalizedName = badgeName?.toLowerCase() || '';
  return badgeMap[normalizedName] || null;
};

const DefisScreen = ({ user, onLogout, onTabPress, activeTab, onSubscriptionRenew }) => {
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [badges, setBadges] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [showBadgeDetail, setShowBadgeDetail] = useState(false);
  const [featuredBadge, setFeaturedBadge] = useState(null);
  
  // Badge unlock modal
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockedBadge, setUnlockedBadge] = useState(null);
  
  // Floating points animation
  const [showFloatingPoints, setShowFloatingPoints] = useState(false);
  const [floatingPointsData, setFloatingPointsData] = useState(null);
  
  // WebSocket subscriptions
  const [socketSubscriptions, setSocketSubscriptions] = useState([]);

  // Challenges state
  const [selectedTab, setSelectedTab] = useState('pending');
  const [challenges, setChallenges] = useState([]);
  const [challengesLoading, setChallengesLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreChallenges, setHasMoreChallenges] = useState(false);

  useEffect(() => {
    console.log('🏆 Defis: useEffect triggered');
    checkSubscriptionStatus();
    fetchProfileData();
    fetchBadges();
    fetchChallenges();
    
    // Subscribe to WebSocket events
    setupWebSocketListeners();
    
    return () => {
      // Cleanup WebSocket subscriptions
      socketSubscriptions.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  const setupWebSocketListeners = useCallback(() => {
    console.log('🔌 Defis: Setting up WebSocket listeners...');
    
    // Check if socket is connected
    if (!chatSocketService.getConnectionStatus()) {
      console.log('⚠️ Defis: Socket not connected, waiting for connection...');
      // Wait for socket connection
      const checkConnection = setInterval(() => {
        if (chatSocketService.getConnectionStatus()) {
          clearInterval(checkConnection);
          setupWebSocketListeners();
        }
      }, 1000);
      
      // Clear interval after 10 seconds
      setTimeout(() => clearInterval(checkConnection), 10000);
      return;
    }
    
    const subscriptions = [];
    
    // Listen for points updates
    const unsubscribePoints = chatSocketService.onPointsUpdated((data) => {
      console.log('💰 Defis: Points updated via WebSocket:', data);
      
      // Update summary if available
      if (data.newTotalPoints !== undefined) {
        setSummary(prev => prev ? {
          ...prev,
          totalPointsEarned: data.newTotalPoints,
        } : null);
      }
      
      // Show floating points animation
      if (data.pointsAdded && data.pointsAdded > 0) {
        setFloatingPointsData({
          points: `+${data.pointsAdded}`,
          reason: data.reason || 'Points gagnés',
        });
        setShowFloatingPoints(true);
        
        // Haptic feedback
        if (Haptics) {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (e) {
            // Haptics not available, ignore
          }
        }
        
        // Hide after animation
        setTimeout(() => setShowFloatingPoints(false), 2000);
      }
      
      // Check for level up
      if (data.newLevel && summary && data.newLevel > summary.currentLevelSum) {
        // Level up detected - could trigger confetti
        if (Haptics) {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (e) {
            // Haptics not available, ignore
          }
        }
      }
    });
    subscriptions.push(unsubscribePoints);
    
    // Listen for badge level unlocks
    const unsubscribeBadgeUnlock = chatSocketService.onBadgeLevelUnlocked((data) => {
      console.log('🏆 Defis: Badge level unlocked via WebSocket:', data);
      
      // Show unlock modal with celebration
      setUnlockedBadge(data);
      setShowUnlockModal(true);
      
      // Haptic feedback
      if (Haptics) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {
          // Haptics not available, ignore
        }
      }
      
      // Refresh badges to get updated state
      fetchBadges();
    });
    subscriptions.push(unsubscribeBadgeUnlock);
    
    // Listen for full badge state updates
    const unsubscribeBadgeUpdate = chatSocketService.onBadgeUpdated((data) => {
      console.log('🔄 Defis: Badges updated via WebSocket:', data);
      
      // Update badges and summary
      if (data.badges) {
        setBadges(data.badges);
      }
      if (data.summary) {
        setSummary(data.summary);
      }
    });
    subscriptions.push(unsubscribeBadgeUpdate);
    
    setSocketSubscriptions(subscriptions);
    console.log('✅ Defis: WebSocket listeners setup complete');
  }, [summary]);

  const checkSubscriptionStatus = async () => {
    try {
      console.log('💳 Defis: Checking subscription status...');
      const data = await SubscriptionService.getSubscriptionStatus();
      setSubscriptionData(data);
    } catch (error) {
      console.error('❌ Defis: Error checking subscription status:', error);
      setSubscriptionData({
        status: 'EXPIRED',
        isExpired: true,
        requiresRenewal: true
      });
    }
  };

  const fetchProfileData = async () => {
    try {
      console.log('👤 Defis: Fetching profile data...');
      const data = await ProfileApi.getProfile();
      setProfileData(data);
      console.log('✅ Defis: Profile data fetched successfully');
    } catch (error) {
      console.error('❌ Defis: Error fetching profile data:', error);
    }
  };

  const fetchBadges = async () => {
    try {
      setLoading(true);
      console.log('🏆 Defis: Fetching badges...');
      
      const response = await BadgeApi.getAllBadges();
      
      if (response.success && response.data) {
        const fetchedBadges = response.data.badges || [];
        setBadges(fetchedBadges);
        setSummary(response.data.summary || null);
        
        // Set featured badge (first unlocked badge or first badge if none unlocked)
        const unlockedBadge = fetchedBadges.find(b => b.isUnlocked);
        const firstBadge = fetchedBadges[0];
        setFeaturedBadge(unlockedBadge || firstBadge || null);
        
        console.log('✅ Defis: Badges fetched successfully', {
          badgesCount: fetchedBadges.length,
          summary: response.data.summary,
          featuredBadge: unlockedBadge?.name || firstBadge?.name,
        });
      } else {
        console.warn('⚠️ Defis: Failed to fetch badges:', response.error);
        setBadges([]);
        setSummary(null);
        setFeaturedBadge(null);
      }
    } catch (error) {
      console.error('❌ Defis: Error fetching badges:', error);
      setBadges([]);
      setSummary(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchChallenges = async () => {
    try {
      console.log('🎯 Defis: Fetching challenges...');
      setChallengesLoading(true);
      
      const response = await api.get(API_CONFIG.endpoints.challenges.getAll);
      console.log('📥 Raw challenges response:', response);
      
      // Check if response has data property (axios response structure)
      const responseData = response.data || response;
      console.log('📥 Challenges data:', responseData);
      
      // Check for different possible response formats
      if (responseData.status === 'success' && responseData.data) {
        setChallenges(responseData.data);
        console.log('✅ Defis: Challenges fetched successfully', responseData.data);
      } else if (responseData.success && responseData.data) {
        setChallenges(responseData.data);
        console.log('✅ Defis: Challenges fetched successfully (success format)', responseData.data);
      } else if (Array.isArray(responseData)) {
        setChallenges(responseData);
        console.log('✅ Defis: Challenges fetched successfully (array format)', responseData);
      } else if (responseData.data && Array.isArray(responseData.data)) {
        setChallenges(responseData.data);
        console.log('✅ Defis: Challenges fetched successfully (data array format)', responseData.data);
      } else {
        console.log('⚠️ Defis: No challenges data in response or status not success');
        console.log('📥 ResponseData:', responseData);
        setChallenges([]);
      }
      
      // hasMoreChallenges will be updated when getFilteredChallenges is called
    } catch (error) {
      console.error('❌ Defis: Error fetching challenges:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setChallenges([]);
    } finally {
      setChallengesLoading(false);
    }
  };

  const assignChallenge = async (challengeId) => {
    try {
      console.log('🎯 Defis: Assigning challenge:', challengeId);
      
      const response = await api.post(API_CONFIG.endpoints.challenges.assign(challengeId), {});
      console.log('📥 Assign challenge response:', response);
      
      if (response.data?.success) {
        console.log('✅ Defis: Challenge assigned successfully');
        Toast.show({
          type: 'success',
          text1: 'Défi accepté',
          text2: 'Vous avez accepté ce défi avec succès',
        });
        // Refresh challenges to update status
        fetchChallenges();
      } else {
        console.log('⚠️ Defis: Challenge assignment failed');
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: 'Impossible d\'accepter ce défi',
        });
      }
    } catch (error) {
      console.error('❌ Defis: Error assigning challenge:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible d\'accepter ce défi',
      });
    }
  };

  const leaveChallenge = async (challengeId) => {
    try {
      console.log('🚪 Defis: Leaving challenge:', challengeId);
      
      const response = await api.post(API_CONFIG.endpoints.challenges.leave(challengeId), {});
      console.log('📥 Leave challenge response:', response);
      
      if (response.data?.success) {
        console.log('✅ Defis: Challenge left successfully');
        Toast.show({
          type: 'success',
          text1: 'Défi quitté',
          text2: 'Vous avez quitté ce défi avec succès',
        });
        // Refresh challenges to update status
        fetchChallenges();
      } else {
        console.log('⚠️ Defis: Challenge leave failed');
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: 'Impossible de quitter ce défi',
        });
      }
    } catch (error) {
      console.error('❌ Defis: Error leaving challenge:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de quitter ce défi',
      });
    }
  };

  const handleTabChange = (tab) => {
    setSelectedTab(tab);
    setCurrentPage(1); // Reset to first page when changing tabs
  };

  // Helper function to get category icon
  const getCategoryIcon = (category) => {
    const categoryIcons = {
      'ACTIVITE_PHYSIQUE': 'barbell',
      'ALIMENTAIRE': 'restaurant',
      'HYDRATATION': 'water',
      'SOCIAL_PARTICIPATION': 'people',
      'fitness': 'barbell',
      'nutrition': 'restaurant',
      'hydration': 'water',
      'sleep': 'moon',
      'mindfulness': 'leaf',
      'default': 'star'
    };
    return categoryIcons[category?.toUpperCase()] || categoryIcons.default;
  };

  // Helper function to format category text
  const formatCategoryText = (category) => {
    const categoryLabels = {
      'ACTIVITE_PHYSIQUE': 'Activité Physique',
      'ALIMENTAIRE': 'Alimentaire',
      'HYDRATATION': 'Hydratation',
      'SOCIAL_PARTICIPATION': 'Participation Sociale',
      'fitness': 'Activité Physique',
      'nutrition': 'Alimentaire',
      'hydration': 'Hydratation',
      'sleep': 'Sommeil',
      'mindfulness': 'Pleine Conscience',
      'default': 'Autre'
    };
    return categoryLabels[category?.toUpperCase()] || categoryLabels.default;
  };

  // Helper function to get validation icon
  const getValidationIcon = (validationMode) => {
    const validationIcons = {
      'PHOTO': 'camera',
      'TEXT': 'document-text',
      'QUIZ': 'help-circle',
      'COACH': 'person',
      'AUTO_CHECK': 'checkmark-circle',
      'VIDEO': 'videocam',
      'default': 'checkmark-circle'
    };
    return validationIcons[validationMode?.toUpperCase()] || validationIcons.default;
  };

  // Memoized filtered challenges to avoid infinite loops
  const filteredChallenges = useMemo(() => {
    if (!challenges || challenges.length === 0) return [];
    
    let filtered;
    switch (selectedTab) {
      case 'pending':
        filtered = challenges.filter(challenge => challenge.status === 'not_assigned');
        break;
      case 'my':
        filtered = challenges.filter(challenge => 
          challenge.status === 'assigned' || challenge.status === 'in_progress'
        );
        break;
      case 'completed':
        filtered = challenges.filter(challenge => challenge.status === 'completed');
        break;
      default:
        filtered = challenges;
    }
    
    // Apply pagination - show max 5 challenges per page
    const startIndex = (currentPage - 1) * 5;
    const endIndex = startIndex + 5;
    return filtered.slice(startIndex, endIndex);
  }, [challenges, selectedTab, currentPage]);

  // Update hasMoreChallenges based on filtered challenges
  useEffect(() => {
    if (!challenges || challenges.length === 0) {
      setHasMoreChallenges(false);
      return;
    }
    
    let filtered;
    switch (selectedTab) {
      case 'pending':
        filtered = challenges.filter(challenge => challenge.status === 'not_assigned');
        break;
      case 'my':
        filtered = challenges.filter(challenge => 
          challenge.status === 'assigned' || challenge.status === 'in_progress'
        );
        break;
      case 'completed':
        filtered = challenges.filter(challenge => challenge.status === 'completed');
        break;
      default:
        filtered = challenges;
    }
    
    const totalFiltered = filtered.length;
    const startIndex = (currentPage - 1) * 5;
    const displayedCount = Math.min(5, totalFiltered - startIndex);
    
    setHasMoreChallenges(startIndex + displayedCount < totalFiltered);
  }, [challenges, selectedTab, currentPage]);

  // Helper function to get tab counts
  const getTabCounts = () => {
    if (!challenges || challenges.length === 0) return { pending: 0, my: 0, completed: 0 };
    
    return {
      pending: challenges.filter(c => c.status === 'not_assigned').length,
      my: challenges.filter(c => c.status === 'assigned' || c.status === 'in_progress').length,
      completed: challenges.filter(c => c.status === 'completed').length
    };
  };

  const loadMoreChallenges = () => {
    setCurrentPage(prev => prev + 1);
  };

  const onRefresh = useCallback(() => {
    console.log('🔄 Defis: Pull to refresh triggered');
    setRefreshing(true);
    fetchBadges();
    fetchProfileData();
    fetchChallenges();
  }, []);

  const handleBadgePress = async (badge) => {
    try {
      console.log('🏆 Defis: Badge pressed:', badge.id);
      const response = await BadgeApi.getBadgeById(badge.id);
      
      if (response.success && response.data?.badge) {
        setSelectedBadge(response.data.badge);
        setShowBadgeDetail(true);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: 'Impossible de charger les détails du badge',
        });
      }
    } catch (error) {
      console.error('❌ Defis: Error fetching badge details:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de charger les détails du badge',
      });
    }
  };

  const handleCloseBadgeDetail = () => {
    setShowBadgeDetail(false);
    setSelectedBadge(null);
  };

  const handleCloseUnlockModal = () => {
    setShowUnlockModal(false);
    setUnlockedBadge(null);
  };

  const handleSubscriptionRenew = () => {
    console.log('🔄 Defis: Navigating to subscription renewal page');
    if (onSubscriptionRenew) {
      onSubscriptionRenew();
    }
  };

  const formatPoints = (points) => {
    if (!points) return '0';
    if (points >= 1000) {
      return `${(points / 1000).toFixed(1)}K`;
    }
    return points.toString();
  };

  const renderFeaturedBadge = () => {
    if (!featuredBadge) return null;

    const badgeImage = getBadgeImage(featuredBadge.name);
    const isLocked = !featuredBadge.isUnlocked && featuredBadge.currentLevel === 0;
    const isAvailable = featuredBadge.isUnlocked || featuredBadge.currentLevel > 0;

    return (
      <View style={styles.featuredBadgeContainer}>
        {/* Badge Icon */}
        <View style={styles.featuredBadgeIconContainer}>
          {badgeImage ? (
            <Image 
              source={badgeImage} 
              style={styles.featuredBadgeIcon}
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.featuredBadgeIconPlaceholder, { backgroundColor: `${featuredBadge.color || '#3B82F6'}20` }]}>
              <Ionicons name="trophy" size={64} color={featuredBadge.color || '#3B82F6'} />
            </View>
          )}
          {/* Level indicator on badge */}
          {featuredBadge.currentLevel > 0 && (
            <View style={styles.badgeLevelIndicator}>
              <Text style={styles.badgeLevelIndicatorText}>{featuredBadge.currentLevel}</Text>
            </View>
          )}
        </View>

        {/* Badge Info */}
        <View style={styles.featuredBadgeInfo}>
          <View style={styles.featuredBadgeHeader}>
            <View style={styles.featuredBadgeTitleContainer}>
              <Text style={styles.featuredBadgeLabel}>Badge</Text>
              <Text style={styles.featuredBadgeName}>{featuredBadge.displayName || featuredBadge.name?.toUpperCase()}</Text>
            </View>
            {isAvailable && (
              <TouchableOpacity style={styles.disponibleButton}>
                <Text style={styles.disponibleButtonText}>DISPONIBLE</Text>
                <View style={styles.disponibleDot} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.featuredBadgeStats}>
            <Text style={styles.featuredBadgeStat}>
              Progression: {featuredBadge.progressPercentage || 0}%
            </Text>
            <Text style={styles.featuredBadgeStat}>
              Points gagnés: {featuredBadge.totalPointsEarned || 0}
            </Text>
          </View>

          <Text style={styles.featuredBadgeDescription}>
            {featuredBadge.description || 'Description du badge'}
          </Text>

          <View style={styles.featuredBadgeProgress}>
            <Text style={styles.featuredBadgeLevelText}>Niveau {featuredBadge.currentLevel || 1}</Text>
            <View style={styles.featuredProgressBar}>
              <View 
                style={[
                  styles.featuredProgressFill, 
                  { 
                    width: `${featuredBadge.progressPercentage || 0}%`,
                    backgroundColor: featuredBadge.color || '#3B82F6',
                  }
                ]} 
              />
            </View>
          </View>

          {isLocked && (
            <Text style={styles.featuredLockMessage}>
              Badge verrouillé - complétez les badges précédents
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderBadgeGridItem = (badge, index) => {
    const badgeImage = getBadgeImage(badge.name);
    const isLocked = !badge.isUnlocked && badge.currentLevel === 0;

    return (
      <TouchableOpacity
        key={badge.id || index}
        style={styles.badgeGridItem}
        onPress={() => handleBadgePress(badge)}
        activeOpacity={0.7}
      >
        <View style={styles.badgeGridIconContainer}>
          {badgeImage ? (
            <Image 
              source={badgeImage} 
              style={[styles.badgeGridIcon, isLocked && styles.badgeGridIconLocked]}
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.badgeGridIconPlaceholder, { backgroundColor: `${badge.color || '#3B82F6'}20` }]}>
              <Ionicons 
                name="trophy" 
                size={40} 
                color={isLocked ? '#CCC' : (badge.color || '#3B82F6')} 
              />
            </View>
          )}
          
          {/* Lock icon or level indicator */}
          {isLocked ? (
            <View style={styles.badgeGridLock}>
              <Ionicons name="lock-closed" size={16} color="#FF9800" />
            </View>
          ) : badge.currentLevel > 0 ? (
            <View style={styles.badgeGridLevel}>
              <Text style={styles.badgeGridLevelText}>{badge.currentLevel}</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.badgeGridName, isLocked && styles.badgeGridNameLocked]}>
          {badge.displayName || badge.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderBadgeGrid = () => {
    // This function is only called when badges exist and not loading
    // Arrange badges in grid: 4, 4, 2
    const rows = [];
    for (let i = 0; i < badges.length; i += 4) {
      const rowItems = badges.slice(i, i + 4);
      rows.push(rowItems);
    }

    return (
      <View style={styles.badgeGrid}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.badgeGridRow}>
            {row.map((badge, colIndex) => renderBadgeGridItem(badge, rowIndex * 4 + colIndex))}
            {/* Fill empty slots in last row if needed */}
            {rowIndex === rows.length - 1 && row.length < 4 && (
              Array.from({ length: 4 - row.length }).map((_, emptyIndex) => (
                <View key={`empty-${emptyIndex}`} style={styles.badgeGridItem} />
              ))
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderBadgeDetail = () => {
    if (!selectedBadge) return null;

    return (
      <Modal
        visible={showBadgeDetail}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseBadgeDetail}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Détails du badge</Text>
              <TouchableOpacity onPress={handleCloseBadgeDetail}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {/* Badge Header */}
              <View style={styles.badgeDetailHeader}>
                <View style={[styles.badgeDetailIconContainer, { backgroundColor: `${selectedBadge.color || '#3B82F6'}20` }]}>
                  {selectedBadge.icon ? (
                    <Image 
                      source={{ uri: selectedBadge.icon }} 
                      style={styles.badgeDetailIcon}
                    />
                  ) : (
                    <Ionicons name="trophy" size={48} color={selectedBadge.color || '#3B82F6'} />
                  )}
                </View>
                <Text style={styles.badgeDetailName}>{selectedBadge.displayName || selectedBadge.name}</Text>
                <Text style={styles.badgeDetailLevel}>Niveau {selectedBadge.currentLevel || 0}</Text>
                <Text style={styles.badgeDetailDescription}>{selectedBadge.description}</Text>
              </View>
              
              {/* Progress Section */}
              <View style={styles.badgeDetailProgress}>
                <View style={styles.badgeDetailProgressHeader}>
                  <Text style={styles.badgeDetailProgressTitle}>Progression</Text>
                  <Text style={styles.badgeDetailProgressValue}>
                    {selectedBadge.totalPointsEarned || 0} / {selectedBadge.totalPointsRequired || 0} points
                  </Text>
                </View>
                <View style={styles.progressBarBackground}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { 
                        width: `${selectedBadge.progressPercentage || 0}%`,
                        backgroundColor: selectedBadge.color || '#3B82F6',
                      }
                    ]} 
                  />
                </View>
              </View>
              
              {/* Levels List */}
              {selectedBadge.levels && selectedBadge.levels.length > 0 && (
                <View style={styles.badgeDetailLevels}>
                  <Text style={styles.badgeDetailLevelsTitle}>Niveaux</Text>
                  {selectedBadge.levels.map((level, index) => (
                    <View key={index} style={styles.levelItem}>
                      <View style={styles.levelItemHeader}>
                        <Text style={styles.levelItemNumber}>Niveau {level.level}</Text>
                        {level.isUnlocked ? (
                          <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                        ) : (
                          <Ionicons name="lock-closed" size={20} color="#CCC" />
                        )}
                      </View>
                      <Text style={styles.levelItemDescription}>{level.description}</Text>
                      <Text style={styles.levelItemPoints}>
                        {level.pointsEarned || 0} / {level.pointsRequired || 0} points
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      
      {/* Header */}
      <AppHeader
        title="Défis"
        onHelpPress={() => {
          if (onTabPress) {
            onTabPress('faq');
          }
        }}
        onNotificationPress={() => {
          if (onTabPress) {
            onTabPress('notifications');
          }
        }}
        onProfilePress={() => {
          if (onTabPress) {
            onTabPress('settings');
          }
        }}
        avatarSource={profileData?.avatar || user?.avatar}
        avatarFallbackText={user?.firstName?.charAt(0) || user?.name?.charAt(0)}
      />

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
        {/* Summary Card */}
        {summary && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Ionicons name="trophy" size={24} color="#FFD700" />
              <Text style={styles.summaryTitle}>Vos progrès</Text>
            </View>
            
            <View style={styles.summaryStats}>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatValue}>{summary.unlockedBadges || 0}</Text>
                <Text style={styles.summaryStatLabel}>Badges débloqués</Text>
              </View>
              
              <View style={styles.summaryDivider} />
              
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatValue}>{formatPoints(summary.totalPointsEarned || 0)}</Text>
                <Text style={styles.summaryStatLabel}>Points totaux</Text>
              </View>
              
              <View style={styles.summaryDivider} />
              
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatValue}>{summary.overallProgressPercentage || 0}%</Text>
                <Text style={styles.summaryStatLabel}>Progression</Text>
              </View>
            </View>
            
            {/* Overall Progress Bar */}
            <View style={styles.overallProgressContainer}>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { 
                      width: `${summary.overallProgressPercentage || 0}%`,
                      backgroundColor: theme.colors.primary,
                    }
                  ]} 
                />
              </View>
            </View>
          </View>
        )}

        {/* Challenges Section */}
        <View style={styles.challengesSection}>
          <Text style={styles.sectionTitle}>Défis</Text>
          <Text style={styles.sectionDescription}>
            Relevez des défis pour gagner des points et débloquer de nouveaux badges
          </Text>

          {/* Challenge Tabs */}
          <View style={styles.challengeTabs}>
            <TouchableOpacity 
              style={[styles.challengeTab, selectedTab === 'pending' && styles.activeTab]}
              onPress={() => handleTabChange('pending')}
            >
              <Text style={[styles.tabText, selectedTab === 'pending' && styles.activeTabText]}>
                {getTabCounts().pending} À relever
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.challengeTab, selectedTab === 'my' && styles.activeTab]}
              onPress={() => handleTabChange('my')}
            >
              <Text style={[styles.tabText, selectedTab === 'my' && styles.activeTabText]}>
                {getTabCounts().my} Acceptés
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.challengeTab, selectedTab === 'completed' && styles.activeTab]}
              onPress={() => handleTabChange('completed')}
            >
              <Text style={[styles.tabText, selectedTab === 'completed' && styles.activeTabText]}>
                {getTabCounts().completed} Complétés
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          <View style={styles.tabContent}>
            {challengesLoading ? (
              <View style={styles.tabContentContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Chargement des défis...</Text>
              </View>
            ) : filteredChallenges.length === 0 ? (
              <View style={styles.tabContentContainer}>
                <Text style={styles.emptyStateText}>
                  {selectedTab === 'pending' ? 'Aucun défi à relever pour le moment' :
                   selectedTab === 'my' ? 'Aucun défi en cours' :
                   selectedTab === 'completed' ? 'Aucun défi complété' :
                   'Aucun défi disponible'}
                </Text>
              </View>
            ) : (
              <View style={styles.challengesList}>
                {filteredChallenges.map((challenge) => (
                  <View key={challenge.id} style={styles.challengeCard}>
                    <View style={styles.challengeHeader}>
                      <View style={styles.challengeTitleContainer}>
                        <Text style={styles.challengeTitle}>{challenge.title}</Text>
                        <View style={styles.pointsBadge}>
                          <Text style={styles.pointsText}>{formatPoints(challenge.rewards?.points || 0)}pts</Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={styles.challengeDetails}>
                      <View style={styles.challengeDetailRow}>
                        <Text style={styles.detailLabel}>Catégorie : </Text>
                        <Ionicons 
                          name={getCategoryIcon(challenge.type)} 
                          size={16} 
                          color="#3B82F6" 
                        />
                        <Text style={[styles.detailValue, { color: '#424242', marginLeft: 8 }]}>
                          {formatCategoryText(challenge.type)}
                        </Text>
                      </View>
                      
                      <View style={styles.challengeDetailRow}>
                        <Text style={styles.detailLabel}>Validation : </Text>
                        <Ionicons 
                          name={getValidationIcon(challenge.validationMode)} 
                          size={16} 
                          color="#10B981" 
                        />
                      </View>
                      
                      <View style={styles.challengeDetailRow}>
                        <Text style={styles.detailLabel}>Durée : </Text>
                        <Ionicons name="time-outline" size={16} color="#666" />
                        <Text style={[styles.detailValue, { color: '#666' }]}>
                          {challenge.duration} jours
                        </Text>
                        <Ionicons name="hourglass-outline" size={16} color="#666" />
                      </View>
                    </View>
                    
                    <Text style={styles.challengeDescription}>{challenge.description}</Text>
                    
                    {challenge.status === 'not_assigned' && (
                      <TouchableOpacity 
                        style={styles.acceptButton}
                        onPress={() => assignChallenge(challenge.id)}
                      >
                        <Text style={styles.acceptButtonText}>Accepter le défi</Text>
                      </TouchableOpacity>
                    )}
                    
                    {challenge.status === 'assigned' && (
                      <View style={styles.assignedContainer}>
                        <View style={styles.progressContainer}>
                          <View style={styles.progressBar}>
                            <View 
                              style={[
                                styles.progressFill, 
                                { width: `${challenge.progress || 0}%` }
                              ]} 
                            />
                          </View>
                          <Text style={styles.progressText}>{challenge.progress || 0}%</Text>
                        </View>
                        <View style={styles.assignedButtonsContainer}>
                          <TouchableOpacity 
                            style={styles.leaveButton}
                            onPress={() => leaveChallenge(challenge.id)}
                          >
                            <Text style={styles.leaveButtonText}>Quitter</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                    
                    {challenge.status === 'completed' && (
                      <View style={styles.completedBadge}>
                        <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                        <Text style={styles.completedText}>Complété</Text>
                      </View>
                    )}
                  </View>
                ))}
                
                {hasMoreChallenges && (
                  <TouchableOpacity 
                    style={styles.loadMoreButton}
                    onPress={loadMoreChallenges}
                  >
                    <Text style={styles.loadMoreButtonText}>Charger plus de défis</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Badges Section - directly under challenges */}
        <View style={styles.badgesSection}>
          <Text style={styles.sectionTitle}>Badges</Text>
          
          {/* Always show badge content - loading, empty, or badges */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Chargement des badges...</Text>
            </View>
          ) : badges.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="trophy-outline" size={64} color="#CCC" />
              <Text style={styles.emptyStateText}>Aucun badge disponible</Text>
            </View>
          ) : (
            <>
              {/* Badge Grid */}
              {renderBadgeGrid()}
              
              {/* Featured Badge - show after grid if available */}
              {renderFeaturedBadge()}
              
              {/* Progress Summary */}
              {summary && (
                <View style={styles.progressSummary}>
                  <Text style={styles.progressSummaryText}>
                    {summary.unlockedBadges || 0} badges débloqués sur {summary.totalBadges || 0}
                  </Text>
                  <Text style={styles.progressSummaryText}>
                    Progression globale : {summary.overallProgressPercentage?.toFixed(1) || 0}%
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('home')}>
          <Ionicons name="home" size={24} color={activeTab === 'home' ? theme.colors.primary : theme.colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('progress')}>
          <Ionicons name="trending-up-outline" size={24} color={activeTab === 'progress' ? theme.colors.primary : theme.colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('nutrition')}>
          <Ionicons name="restaurant" size={24} color={activeTab === 'nutrition' ? theme.colors.primary : theme.colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('achievements')}>
          <Ionicons name="trophy-outline" size={24} color={activeTab === 'achievements' ? theme.colors.primary : theme.colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navTab, styles.activeNavTab]} onPress={() => onTabPress('defis')}>
          <Ionicons name="medal" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('more')}>
          <Ionicons name="add-outline" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Badge Detail Modal */}
      {renderBadgeDetail()}

      {/* Badge Unlock Modal */}
      <BadgeUnlockModal
        visible={showUnlockModal}
        badge={unlockedBadge}
        onClose={handleCloseUnlockModal}
      />

      {/* Floating Points Animation */}
      <FloatingPointsAnimation
        visible={showFloatingPoints}
        points={floatingPointsData?.points}
        reason={floatingPointsData?.reason}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginLeft: 8,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  summaryStat: {
    alignItems: 'center',
    flex: 1,
  },
  summaryStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  summaryStatLabel: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
  },
  overallProgressContainer: {
    marginTop: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  badgesSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 16,
  },
  // Featured Badge Styles
  featuredBadgeContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  featuredBadgeIconContainer: {
    width: 120,
    height: 120,
    marginRight: 16,
    position: 'relative',
  },
  featuredBadgeIcon: {
    width: 120,
    height: 120,
  },
  featuredBadgeIconPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeLevelIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF69B4',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeLevelIndicatorText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  featuredBadgeInfo: {
    flex: 1,
  },
  featuredBadgeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  featuredBadgeTitleContainer: {
    flex: 1,
  },
  featuredBadgeLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  featuredBadgeName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    textTransform: 'uppercase',
  },
  disponibleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  disponibleButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 6,
  },
  disponibleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F44336',
  },
  featuredBadgeStats: {
    marginBottom: 12,
  },
  featuredBadgeStat: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  featuredBadgeDescription: {
    fontSize: 14,
    color: '#2C3E50',
    lineHeight: 20,
    marginBottom: 16,
  },
  featuredBadgeProgress: {
    marginBottom: 8,
  },
  featuredBadgeLevelText: {
    fontSize: 14,
    color: '#2C3E50',
    marginBottom: 8,
    fontWeight: '600',
  },
  featuredProgressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  featuredProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  featuredLockMessage: {
    fontSize: 12,
    color: '#FF9800',
    fontStyle: 'italic',
    marginTop: 8,
  },
  // Badge Grid Styles
  badgeGrid: {
    marginBottom: 20,
  },
  badgeGridRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
  badgeGridItem: {
    width: (screenWidth - 60) / 4, // 4 items per row with padding (20px each side + 20px gaps)
    alignItems: 'center',
    marginRight: 12, // spacing between items
  },
  badgeGridIconContainer: {
    width: (screenWidth - 60) / 4 - 12,
    height: (screenWidth - 60) / 4 - 12,
    position: 'relative',
    marginBottom: 8,
  },
  badgeGridIcon: {
    width: '100%',
    height: '100%',
  },
  badgeGridIconLocked: {
    opacity: 0.5,
  },
  badgeGridIconPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  badgeGridLock: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeGridLevel: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF69B4',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  badgeGridLevelText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  badgeGridName: {
    fontSize: 11,
    color: '#2C3E50',
    textAlign: 'center',
    fontWeight: '500',
  },
  badgeGridNameLocked: {
    color: '#7F8C8D',
  },
  progressSummary: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  progressSummaryText: {
    fontSize: 14,
    color: '#2C3E50',
    marginBottom: 4,
    textAlign: 'center',
  },
  challengesSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  challengeTabs: {
    flexDirection: 'row',
    marginBottom: 20,
    marginTop: 16,
  },
  challengeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2C3E50',
  },
  tabText: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  activeTabText: {
    color: '#2C3E50',
    fontWeight: '600',
  },
  tabContent: {
    minHeight: 100,
  },
  tabContentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  challengesList: {
    gap: 16,
  },
  challengeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  challengeHeader: {
    marginBottom: 12,
  },
  challengeTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    flex: 1,
    marginRight: 12,
  },
  pointsBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  challengeDetails: {
    marginBottom: 12,
  },
  challengeDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    marginRight: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  challengeDescription: {
    fontSize: 14,
    color: '#7F8C8D',
    lineHeight: 20,
    marginBottom: 16,
  },
  acceptButton: {
    backgroundColor: '#2C3E50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  assignedContainer: {
    marginTop: 8,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  assignedButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 12,
  },
  leaveButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  leaveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E8',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 8,
  },
  completedText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 4,
  },
  loadMoreButton: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  loadMoreButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#7F8C8D',
    marginTop: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  modalBody: {
    padding: 20,
  },
  badgeDetailHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  badgeDetailIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeDetailIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  badgeDetailName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  badgeDetailLevel: {
    fontSize: 16,
    color: '#7F8C8D',
    marginBottom: 8,
  },
  badgeDetailDescription: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 20,
  },
  badgeDetailProgress: {
    marginBottom: 24,
  },
  badgeDetailProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeDetailProgressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  badgeDetailProgressValue: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  badgeDetailLevels: {
    marginTop: 16,
  },
  badgeDetailLevelsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
  },
  levelItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  levelItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelItemNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  levelItemDescription: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  levelItemPoints: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
  },
  activeNavTab: {
    backgroundColor: theme.colors.primaryLight,
  },
});

export default DefisScreen;

