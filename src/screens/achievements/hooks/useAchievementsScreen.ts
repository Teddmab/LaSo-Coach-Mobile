import { useState, useEffect, useCallback, useMemo } from 'react';
import Toast from 'react-native-toast-message';
import { ProfileApi } from '../../../services/profileApi';
import api from '../../../services/api';
import { API_CONFIG } from '../../../config/apiConfig';
import BadgeApi from '../../../services/badgeApi';
import chatSocketService from '../../../services/chatSocketService';
import SubscriptionService from '../../../services/subscriptionService';
import DashboardService from '../../../services/dashboardService';
import {
  LeaderboardUser,
  UserPosition,
  Badge,
  BadgeSummary,
  Challenge,
  ChallengeTab,
  FloatingPointsData,
  AchievementsData,
} from '../types';
import { countryCodeToFlagEmoji } from '../utils/achievementsUtils';

// Haptics is optional
let Haptics: any = null;
try {
  Haptics = require('expo-haptics');
} catch (e) {
  console.log('⚠️ expo-haptics not available, haptic feedback disabled');
}

export const useAchievementsScreen = (onSubscriptionRenew?: () => void) => {
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [showBlurOverlay, setShowBlurOverlay] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [userPositionLoading, setUserPositionLoading] = useState(true);
  const [badgesSummary, setBadgesSummary] = useState<BadgeSummary | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [badgesLoading, setBadgesLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [showBadgeDetail, setShowBadgeDetail] = useState(false);
  const [featuredBadge, setFeaturedBadge] = useState<Badge | null>(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockedBadge, setUnlockedBadge] = useState<any>(null);
  const [showFloatingPoints, setShowFloatingPoints] = useState(false);
  const [floatingPointsData, setFloatingPointsData] = useState<FloatingPointsData | null>(null);
  const [socketSubscriptions, setSocketSubscriptions] = useState<Array<() => void>>([]);
  const [selectedTab, setSelectedTab] = useState<ChallengeTab>('pending');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [challengesLoading, setChallengesLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreChallenges, setHasMoreChallenges] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [achievementsData, setAchievementsData] = useState<AchievementsData | null>(null);

  useEffect(() => {
    checkSubscriptionStatus();
    fetchProfileData();
    fetchLeaderboardData();
    fetchUserPosition();
    fetchBadges();
    fetchChallenges();
    fetchAchievementsData();
    setupWebSocketListeners();
    
    return () => {
      socketSubscriptions.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  useEffect(() => {
    if (!challenges || challenges.length === 0) {
      setHasMoreChallenges(false);
      return;
    }
    
    let filtered: Challenge[];
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
    
    const endIndex = currentPage * 5;
    setHasMoreChallenges(filtered.length > endIndex);
  }, [challenges, selectedTab, currentPage]);

  const setupWebSocketListeners = useCallback(() => {
    if (!chatSocketService.getConnectionStatus()) {
      const checkConnection = setInterval(() => {
        if (chatSocketService.getConnectionStatus()) {
          clearInterval(checkConnection);
          setupWebSocketListeners();
        }
      }, 1000);
      setTimeout(() => clearInterval(checkConnection), 10000);
      return;
    }
    
    const subscriptions: Array<() => void> = [];
    
    const unsubscribePoints: any = chatSocketService.onPointsUpdated((data: any) => {
      if (data.newTotalPoints !== undefined) {
        setBadgesSummary(prev => prev ? {
          ...prev,
          totalPointsEarned: data.newTotalPoints,
        } : null);
      }
      
      if (data.pointsAdded && data.pointsAdded > 0) {
        setFloatingPointsData({
          points: `+${data.pointsAdded}`,
          reason: data.reason || 'Points gagnés',
        });
        setShowFloatingPoints(true);
        
        if (Haptics) {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (e) {
            // Ignore
          }
        }
        
        setTimeout(() => setShowFloatingPoints(false), 2000);
      }
    });
    subscriptions.push(unsubscribePoints);
    
    const unsubscribeBadgeUnlock: any = chatSocketService.onBadgeLevelUnlocked((data: any) => {
      setUnlockedBadge(data);
      setShowUnlockModal(true);
      
      if (Haptics) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {
          // Ignore
        }
      }
      
      fetchBadges();
    });
    subscriptions.push(unsubscribeBadgeUnlock);
    
    const unsubscribeBadgeUpdate: any = chatSocketService.onBadgeUpdated((data: any) => {
      if (data.badges) {
        setBadges(data.badges);
      }
      if (data.summary) {
        setBadgesSummary(data.summary);
      }
    });
    subscriptions.push(unsubscribeBadgeUpdate);
    
    setSocketSubscriptions(subscriptions);
  }, []);

  const checkSubscriptionStatus = async (): Promise<void> => {
    try {
      const data = await SubscriptionService.getSubscriptionStatus();
      setSubscriptionData(data);
      
      if ((data as any).requiresRenewal) {
        setShowBlurOverlay(true);
      }
    } catch (error) {
      console.error('❌ Achievements: Error checking subscription status:', error);
      setSubscriptionData({
        status: 'EXPIRED',
        isExpired: true,
        requiresRenewal: true,
      });
      setShowBlurOverlay(true);
    }
  };

  const fetchProfileData = async (): Promise<void> => {
    try {
      const data = await ProfileApi.getProfile();
      setProfileData(data);
    } catch (error) {
      console.error('❌ Achievements: Error fetching profile data:', error);
    }
  };

  const fetchLeaderboardData = async (): Promise<void> => {
    try {
      const response: any = await api.get(API_CONFIG.endpoints.tascc.leaderboardOverall);
      const responseData = response.data || response;
      
      if (responseData.status === 'success' && responseData.data) {
        const top5Users = responseData.data.slice(0, 5).map((user: any) => ({
          rank: user.rank || 1,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          points: user.points || 0,
          avatar: user.avatar || null,
          address: user.address || '',
          userId: user.userId || '',
          flag: countryCodeToFlagEmoji(user.address) || '🏳️',
        }));
        
        setLeaderboardData(top5Users);
      } else {
        setLeaderboardData([]);
      }
    } catch (error) {
      console.error('❌ Achievements: Error fetching leaderboard data:', error);
      setLeaderboardData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosition = async (): Promise<void> => {
    try {
      const response: any = await api.get(API_CONFIG.endpoints.tascc.leaderboardPosition);
      const responseData = response.data || response;
      
      if (responseData.status === 'success' && responseData.data) {
        const positionData: UserPosition = {
          rank: responseData.data.rank || 0,
          totalUsers: responseData.data.totalUsers || 0,
          userId: responseData.data.userId || '',
          firstName: responseData.data.firstName || '',
          lastName: responseData.data.lastName || '',
          avatar: responseData.data.avatar || null,
          address: responseData.data.address || '',
          points: responseData.data.points || 0,
          message: responseData.data.message || '',
          flag: countryCodeToFlagEmoji(responseData.data.address) || '🏳️',
        };
        
        setUserPosition(positionData);
      } else {
        setUserPosition(null);
      }
    } catch (error) {
      console.error('❌ Achievements: Error fetching user position:', error);
      setUserPosition(null);
    } finally {
      setUserPositionLoading(false);
    }
  };

  const fetchBadges = async (): Promise<void> => {
    try {
      setBadgesLoading(true);
      const response: any = await BadgeApi.getAllBadges();
      
      if (response.success && response.data) {
        const fetchedBadges = response.data.badges || [];
        setBadges(fetchedBadges);
        setBadgesSummary(response.data.summary || null);
        
        const unlockedBadge = fetchedBadges.find((b: Badge) => b.isUnlocked);
        const firstBadge = fetchedBadges[0];
        setFeaturedBadge(unlockedBadge || firstBadge || null);
      } else {
        setBadges([]);
        setBadgesSummary(null);
        setFeaturedBadge(null);
      }
    } catch (error) {
      console.error('❌ Achievements: Error fetching badges:', error);
      setBadges([]);
      setBadgesSummary(null);
    } finally {
      setBadgesLoading(false);
    }
  };

  const fetchChallenges = async (): Promise<void> => {
    try {
      setChallengesLoading(true);
      const response: any = await api.get(API_CONFIG.endpoints.challenges.getAll);
      const responseData = response.data || response;
      
      if (responseData.status === 'success' && responseData.data) {
        setChallenges(responseData.data);
      } else if (responseData.success && responseData.data) {
        setChallenges(responseData.data);
      } else if (Array.isArray(responseData)) {
        setChallenges(responseData);
      } else if (responseData.data && Array.isArray(responseData.data)) {
        setChallenges(responseData.data);
      } else {
        setChallenges([]);
      }
    } catch (error) {
      console.error('❌ Achievements: Error fetching challenges:', error);
      setChallenges([]);
    } finally {
      setChallengesLoading(false);
    }
  };

  const fetchAchievementsData = async (): Promise<void> => {
    try {
      const data = await DashboardService.getAchievementsSummary();
      setAchievementsData(data);
    } catch (error) {
      console.error('❌ Achievements: Error fetching achievements data:', error);
      setAchievementsData(null);
    }
  };

  const assignChallenge = async (challengeId: string): Promise<void> => {
    try {
      const response: any = await api.post(API_CONFIG.endpoints.challenges.assign(challengeId), {});
      
      if (response.data?.success) {
        fetchChallenges();
      }
    } catch (error) {
      console.error('❌ Achievements: Error assigning challenge:', error);
    }
  };

  const leaveChallenge = async (challengeId: string): Promise<void> => {
    try {
      const response: any = await api.post(API_CONFIG.endpoints.challenges.leave(challengeId), {});
      
      if (response.data?.success) {
        Toast.show({
          type: 'success',
          text1: 'Défi quitté',
          text2: 'Vous avez quitté ce défi avec succès',
        });
        fetchChallenges();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: 'Impossible de quitter ce défi',
        });
      }
    } catch (error) {
      console.error('❌ Achievements: Error leaving challenge:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de quitter ce défi',
      });
    }
  };

  const handleCompleteChallenge = (challenge: Challenge): void => {
    if (challenge.status === 'completed') {
      Toast.show({
        type: 'info',
        text1: 'Défi déjà complété',
        text2: 'Ce défi a déjà été complété',
      });
      return;
    }
    
    setSelectedChallenge(challenge);
    setShowCompletionModal(true);
  };

  const handleSubmitChallenge = async (challengeId: string, data: { photo?: string; text?: string }): Promise<void> => {
    try {
      let response: any;
      
      if (data.photo) {
        const formData = new FormData();
        formData.append('photo', {
          uri: data.photo,
          type: 'image/jpeg',
          name: 'challenge_photo.jpg',
        } as any);
        
        response = await api.post(
          API_CONFIG.endpoints.challenges.uploadPhoto(challengeId),
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
      } else if (data.text) {
        response = await api.post(
          API_CONFIG.endpoints.challenges.submitText(challengeId),
          { text: data.text }
        );
      } else {
        response = await api.post(
          API_CONFIG.endpoints.challenges.complete(challengeId),
          {}
        );
      }
      
      if (response.data?.success) {
        Toast.show({
          type: 'success',
          text1: 'Défi complété',
          text2: 'Félicitations! Vous avez complété ce défi',
        });
        
        fetchChallenges();
        setShowCompletionModal(false);
        setSelectedChallenge(null);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: 'Impossible de compléter ce défi',
        });
      }
    } catch (error) {
      console.error('❌ Achievements: Error completing challenge:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de compléter ce défi',
      });
    }
  };

  const handleTabChange = (tab: ChallengeTab): void => {
    setSelectedTab(tab);
    setCurrentPage(1);
  };

  const filteredChallenges = useMemo(() => {
    if (!challenges || challenges.length === 0) return [];
    
    let filtered: Challenge[];
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
    
    const startIndex = (currentPage - 1) * 5;
    const endIndex = startIndex + 5;
    return filtered.slice(startIndex, endIndex);
  }, [challenges, selectedTab, currentPage]);

  const getTabCounts = () => {
    if (!challenges || challenges.length === 0) return { pending: 0, my: 0, completed: 0 };
    
    return {
      pending: challenges.filter(c => c.status === 'not_assigned').length,
      my: challenges.filter(c => c.status === 'assigned' || c.status === 'in_progress').length,
      completed: challenges.filter(c => c.status === 'completed').length,
    };
  };

  const loadMoreChallenges = (): void => {
    setCurrentPage(prev => prev + 1);
  };

  const handleBadgePress = async (badge: Badge): Promise<void> => {
    try {
      const response: any = await BadgeApi.getBadgeById(badge.id);
      
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
      console.error('❌ Achievements: Error fetching badge details:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de charger les détails du badge',
      });
    }
  };

  const handleCloseBadgeDetail = (): void => {
    setShowBadgeDetail(false);
    setSelectedBadge(null);
  };

  const handleCloseUnlockModal = (): void => {
    setShowUnlockModal(false);
    setUnlockedBadge(null);
  };

  const handleSubscriptionRenew = (): void => {
    setShowBlurOverlay(false);
    if (onSubscriptionRenew) {
      onSubscriptionRenew();
    }
  };

  const handleCloseCompletionModal = (): void => {
    setShowCompletionModal(false);
    setSelectedChallenge(null);
  };

  return {
    subscriptionData,
    showBlurOverlay,
    profileData,
    leaderboardData,
    userPosition,
    loading,
    userPositionLoading,
    badgesSummary,
    badges,
    badgesLoading,
    selectedBadge,
    showBadgeDetail,
    featuredBadge,
    showUnlockModal,
    unlockedBadge,
    showFloatingPoints,
    floatingPointsData,
    selectedTab,
    challenges: filteredChallenges,
    challengesLoading,
    hasMoreChallenges,
    selectedChallenge,
    showCompletionModal,
    achievementsData,
    tabCounts: getTabCounts(),
    setSelectedTab: handleTabChange,
    loadMoreChallenges,
    assignChallenge,
    leaveChallenge,
    handleCompleteChallenge,
    handleSubmitChallenge,
    handleBadgePress,
    handleCloseBadgeDetail,
    handleCloseUnlockModal,
    handleSubscriptionRenew,
    handleCloseCompletionModal,
  };
};

