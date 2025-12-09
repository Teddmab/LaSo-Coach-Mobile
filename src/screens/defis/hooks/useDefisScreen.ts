import { useState, useEffect, useCallback, useMemo } from 'react';
import Toast from 'react-native-toast-message';
import { ProfileApi } from '../../../services/profileApi';
import BadgeApi from '../../../services/badgeApi';
import chatSocketService from '../../../services/chatSocketService';
import api from '../../../services/api';
import { API_CONFIG } from '../../../config/apiConfig';
import SubscriptionService from '../../../services/subscriptionService';
import {
  Badge,
  BadgeSummary,
  Challenge,
  ChallengeTab,
  FloatingPointsData,
} from '../types';

// Haptics is optional
let Haptics: any = null;
try {
  Haptics = require('expo-haptics');
} catch (e) {
}

export const useDefisScreen = (onSubscriptionRenew?: () => void) => {
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [summary, setSummary] = useState<BadgeSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  useEffect(() => {
    checkSubscriptionStatus();
    fetchProfileData();
    fetchBadges();
    fetchChallenges();
    setupWebSocketListeners();
    
    return () => {
      socketSubscriptions.forEach(unsubscribe => unsubscribe());
    };
  }, []);

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
        setSummary(prev => prev ? {
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
        setSummary(data.summary);
      }
    });
    subscriptions.push(unsubscribeBadgeUpdate);
    
    setSocketSubscriptions(subscriptions);
  }, []);

  const checkSubscriptionStatus = async (): Promise<void> => {
    try {
      const data = await SubscriptionService.getSubscriptionStatus();
      setSubscriptionData(data);
    } catch (error) {
      setSubscriptionData({
        status: 'EXPIRED',
        isExpired: true,
        requiresRenewal: true,
      });
    }
  };

  const fetchProfileData = async (): Promise<void> => {
    try {
      const data = await ProfileApi.getProfile();
      setProfileData(data);
    } catch (error) {
    }
  };

  const fetchBadges = async (): Promise<void> => {
    try {
      setLoading(true);
      const response: any = await BadgeApi.getAllBadges();
      
      if (response.success && response.data) {
        const fetchedBadges = response.data.badges || [];
        setBadges(fetchedBadges);
        setSummary(response.data.summary || null);
        
        const unlockedBadge = fetchedBadges.find((b: Badge) => b.isUnlocked);
        const firstBadge = fetchedBadges[0];
        setFeaturedBadge(unlockedBadge || firstBadge || null);
      } else {
        setBadges([]);
        setSummary(null);
        setFeaturedBadge(null);
      }
    } catch (error) {
      setBadges([]);
      setSummary(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
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
      setChallenges([]);
    } finally {
      setChallengesLoading(false);
    }
  };

  const assignChallenge = async (challengeId: string): Promise<void> => {
    try {
      const response: any = await api.post(API_CONFIG.endpoints.challenges.assign(challengeId), {});
      
      if (response.data?.success) {
        Toast.show({
          type: 'success',
          text1: 'Défi accepté',
          text2: 'Vous avez accepté ce défi avec succès',
        });
        fetchChallenges();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: 'Impossible d\'accepter ce défi',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible d\'accepter ce défi',
      });
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
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de quitter ce défi',
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
    
    const totalFiltered = filtered.length;
    const startIndex = (currentPage - 1) * 5;
    const displayedCount = Math.min(5, totalFiltered - startIndex);
    
    setHasMoreChallenges(startIndex + displayedCount < totalFiltered);
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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBadges();
    fetchProfileData();
    fetchChallenges();
  }, []);

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
    if (onSubscriptionRenew) {
      onSubscriptionRenew();
    }
  };

  return {
    subscriptionData,
    profileData,
    badges,
    summary,
    loading,
    refreshing,
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
    tabCounts: getTabCounts(),
    setSelectedTab: handleTabChange,
    loadMoreChallenges,
    onRefresh,
    handleBadgePress,
    handleCloseBadgeDetail,
    handleCloseUnlockModal,
    handleSubscriptionRenew,
    assignChallenge,
    leaveChallenge,
  };
};

