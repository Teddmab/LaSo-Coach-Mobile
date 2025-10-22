import React, { useState, useEffect } from 'react';
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
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { theme } from '../constants/theme';
import BlurOverlay from '../components/BlurOverlay';
import SubscriptionBanner from '../components/SubscriptionBanner';
import SubscriptionService from '../services/subscriptionService';
import Avatar from '../components/Avatar';
import { ProfileApi } from '../services/profileApi';
import api from '../services/api';
import { API_CONFIG } from '../config/apiConfig';

const { width: screenWidth } = Dimensions.get('window');

const AchievementsScreen = ({ user, onLogout, onTabPress, activeTab, onSubscriptionRenew }) => {
  const [selectedTab, setSelectedTab] = useState('pending'); // pending, my, completed
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [showBlurOverlay, setShowBlurOverlay] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [userPosition, setUserPosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userPositionLoading, setUserPositionLoading] = useState(true);
  const [challengesData, setChallengesData] = useState(null);
  const [badgesData, setBadgesData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [challenges, setChallenges] = useState([]);
  const [challengesLoading, setChallengesLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreChallenges, setHasMoreChallenges] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  useEffect(() => {
    console.log('🚀 Achievements: useEffect triggered');
    checkSubscriptionStatus();
    fetchProfileData();
    fetchLeaderboardData();
    fetchUserPosition();
    fetchChallengesData();
    fetchBadgesData();
    console.log('🎯 Achievements: About to call fetchChallenges');
    fetchChallenges();
    console.log('🎯 Achievements: fetchChallenges called');
  }, []);

  // Update hasMoreChallenges when challenges or selectedTab changes
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
    
    const endIndex = currentPage * 5;
    setHasMoreChallenges(filtered.length > endIndex);
  }, [challenges, selectedTab, currentPage]);

  const fetchProfileData = async () => {
    try {
      console.log('👤 Achievements: Fetching profile data...');
      const data = await ProfileApi.getProfile();
      setProfileData(data);
      console.log('✅ Achievements: Profile data fetched successfully');
    } catch (error) {
      console.error('❌ Achievements: Error fetching profile data:', error);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      console.log('💳 Achievements: Checking subscription status...');
      const data = await SubscriptionService.getSubscriptionStatus();
      setSubscriptionData(data);
      
      if (data.requiresRenewal) {
        setShowBlurOverlay(true);
      }
      
    } catch (error) {
      console.error('❌ Achievements: Error checking subscription status:', error);
      setSubscriptionData({
        status: 'EXPIRED',
        isExpired: true,
        requiresRenewal: true
      });
      setShowBlurOverlay(true);
    }
  };

  const fetchLeaderboardData = async () => {
    try {
      console.log('🏆 Achievements: Fetching leaderboard data...');
      console.log('🔗 API endpoint:', API_CONFIG.endpoints.tascc.leaderboardOverall);
      
      const response = await api.get(API_CONFIG.endpoints.tascc.leaderboardOverall);
      console.log('📥 Raw API response:', response);
      
      // Check if response has data property (axios response structure)
      const responseData = response.data || response;
      console.log('📥 Response data:', responseData);
      
      if (responseData.status === 'success' && responseData.data) {
        // Take only the first 5 users
        const top5Users = responseData.data.slice(0, 5).map((user) => ({
          rank: user.rank || 1,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          points: user.points || 0,
          avatar: user.avatar || null,
          address: user.address || '',
          userId: user.userId || '',
          flag: countryCodeToFlagEmoji(user.address) || '🏳️'
        }));
        
        setLeaderboardData(top5Users);
        console.log('✅ Achievements: Leaderboard data fetched successfully', top5Users);
      } else {
        console.log('⚠️ Achievements: No data in response or status not success');
        setLeaderboardData([]);
      }
    } catch (error) {
      console.error('❌ Achievements: Error fetching leaderboard data:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      // Set fallback data
      setLeaderboardData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosition = async () => {
    try {
      console.log('🏆 Achievements: Fetching user position...');
      console.log('🔗 API endpoint:', API_CONFIG.endpoints.tascc.leaderboardPosition);
      
      const response = await api.get(API_CONFIG.endpoints.tascc.leaderboardPosition);
      console.log('📥 Raw user position response:', response);
      
      // Check if response has data property (axios response structure)
      const responseData = response.data || response;
      console.log('📥 User position data:', responseData);
      
      if (responseData.status === 'success' && responseData.data) {
        const positionData = {
          rank: responseData.data.rank || 0,
          totalUsers: responseData.data.totalUsers || 0,
          userId: responseData.data.userId || '',
          firstName: responseData.data.firstName || '',
          lastName: responseData.data.lastName || '',
          avatar: responseData.data.avatar || null,
          address: responseData.data.address || '',
          points: responseData.data.points || 0,
          message: responseData.data.message || '',
          flag: countryCodeToFlagEmoji(responseData.data.address) || '🏳️'
        };
        
        setUserPosition(positionData);
        console.log('✅ Achievements: User position fetched successfully', positionData);
      } else {
        console.log('⚠️ Achievements: No user position data in response or status not success');
        setUserPosition(null);
      }
    } catch (error) {
      console.error('❌ Achievements: Error fetching user position:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setUserPosition(null);
    } finally {
      setUserPositionLoading(false);
    }
  };

  const fetchChallengesData = async () => {
    try {
      console.log('🏆 Achievements: Fetching challenges data...');
      console.log('🔗 API endpoint:', API_CONFIG.endpoints.user.progress);
      
      const response = await api.get(API_CONFIG.endpoints.user.progress);
      console.log('📥 Raw challenges response:', response);
      
      // Check if response has data property (axios response structure)
      const responseData = response.data || response;
      console.log('📥 Challenges data:', responseData);
      
      if (responseData.status === 'success' && responseData.data) {
        setChallengesData(responseData.data);
        console.log('✅ Achievements: Challenges data fetched successfully', responseData.data);
      } else {
        console.log('⚠️ Achievements: No challenges data in response or status not success');
        setChallengesData(null);
      }
    } catch (error) {
      console.error('❌ Achievements: Error fetching challenges data:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setChallengesData(null);
    }
  };

  const fetchBadgesData = async () => {
    try {
      console.log('🏆 Achievements: Fetching badges data...');
      console.log('🔗 API endpoint:', '/profile');
      
      const response = await api.get('/profile');
      console.log('📥 Raw badges response:', response);
      
      // Check if response has data property (axios response structure)
      const responseData = response.data || response;
      console.log('📥 Badges data:', responseData);
      
      if (responseData.success && responseData.data?.badgeProgress?.summary) {
        setBadgesData(responseData.data.badgeProgress.summary);
        // Also store the full profile data for avatar and other info
        setProfileData(responseData.data);
        console.log('✅ Achievements: Badges data fetched successfully', responseData.data.badgeProgress.summary);
      } else {
        console.log('⚠️ Achievements: No badges data in response or status not success');
        setBadgesData(null);
      }
    } catch (error) {
      console.error('❌ Achievements: Error fetching badges data:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setBadgesData(null);
    } finally {
      setSummaryLoading(false);
    }
  };

    const fetchChallenges = async () => {
    try {
      console.log('🎯 Achievements: Fetching challenges...');
      console.log('🔗 API endpoint:', API_CONFIG.endpoints.challenges.getAll);
      
      const response = await api.get(API_CONFIG.endpoints.challenges.getAll);
      console.log('📥 Raw challenges response:', response);
      
      // Check if response has data property (axios response structure)
      const responseData = response.data || response;
      console.log('📥 Challenges data:', responseData);
      
      // Check for different possible response formats
      if (responseData.status === 'success' && responseData.data) {
        setChallenges(responseData.data);
        console.log('✅ Achievements: Challenges fetched successfully', responseData.data);
      } else if (responseData.success && responseData.data) {
        setChallenges(responseData.data);
        console.log('✅ Achievements: Challenges fetched successfully (success format)', responseData.data);
      } else if (Array.isArray(responseData)) {
        setChallenges(responseData);
        console.log('✅ Achievements: Challenges fetched successfully (array format)', responseData);
      } else if (responseData.data && Array.isArray(responseData.data)) {
        setChallenges(responseData.data);
        console.log('✅ Achievements: Challenges fetched successfully (data array format)', responseData.data);
      } else {
        console.log('⚠️ Achievements: No challenges data in response or status not success');
        console.log('📥 ResponseData:', responseData);
        setChallenges([]);
      }
    } catch (error) {
      console.error('❌ Achievements: Error fetching challenges:', error);
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
      console.log('🎯 Achievements: Assigning challenge:', challengeId);
      
      const response = await api.post(API_CONFIG.endpoints.challenges.assign(challengeId), {});
      console.log('📥 Assign challenge response:', response);
      
      if (response.data?.success) {
        console.log('✅ Achievements: Challenge assigned successfully');
        // Refresh challenges to update status
        fetchChallenges();
        // Show success message
        // You can add a toast notification here
      } else {
        console.log('⚠️ Achievements: Challenge assignment failed');
      }
    } catch (error) {
      console.error('❌ Achievements: Error assigning challenge:', error);
      // Show error message
      // You can add a toast notification here
    }
  };

  const leaveChallenge = async (challengeId) => {
    try {
      console.log('🚪 Achievements: Leaving challenge:', challengeId);
      
      const response = await api.post(API_CONFIG.endpoints.challenges.leave(challengeId), {});
      console.log('📥 Leave challenge response:', response);
      
      if (response.data?.success) {
        console.log('✅ Achievements: Challenge left successfully');
        // Refresh challenges to update status
        fetchChallenges();
        // Show success message
        Toast.show({
          type: 'success',
          text1: 'Défi quitté',
          text2: 'Vous avez quitté ce défi avec succès',
        });
      } else {
        console.log('⚠️ Achievements: Challenge leave failed');
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: 'Impossible de quitter ce défi',
        });
      }
    } catch (error) {
      console.error('❌ Achievements: Error leaving challenge:', error);
      // Show error message
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de quitter ce défi',
      });
    }
  };

  const loadMoreChallenges = () => {
    setCurrentPage(prev => prev + 1);
  };

  const handleCompleteChallenge = (challenge) => {
    // Don't allow completion of already completed challenges
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

  const handleTakePhoto = async () => {
    try {
      // Show action sheet for camera or gallery
      Alert.alert(
        'Prendre une photo',
        'Choisissez une option',
        [
          {
            text: 'Appareil photo',
            onPress: () => openCamera(),
          },
          {
            text: 'Galerie',
            onPress: () => openGallery(),
          },
          {
            text: 'Annuler',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Error showing photo options:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible d\'ouvrir les options de photo',
      });
    }
  };

  const openCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Permission refusée',
          text2: 'Veuillez autoriser l\'accès à l\'appareil photo',
        });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedPhoto(result.assets[0].uri);
        Toast.show({
          type: 'success',
          text1: 'Photo prise',
          text2: 'Photo ajoutée avec succès',
        });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de prendre la photo',
      });
    }
  };

  const openGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Permission refusée',
          text2: 'Veuillez autoriser l\'accès à votre galerie',
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedPhoto(result.assets[0].uri);
        Toast.show({
          type: 'success',
          text1: 'Photo sélectionnée',
          text2: 'Photo ajoutée avec succès',
        });
      }
    } catch (error) {
      console.error('Error selecting photo:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de sélectionner la photo',
      });
    }
  };

  const handleCloseModal = () => {
    setShowCompletionModal(false);
    setSelectedPhoto(null);
    setSelectedChallenge(null);
  };

  const handleSubmitChallenge = async () => {
    if (!selectedChallenge) return;

    try {
      setPhotoUploading(true);
      console.log('📤 Achievements: Submitting challenge completion:', selectedChallenge.id);

      let response;
      
      switch (selectedChallenge.validationMode) {
        case 'PHOTO':
          if (!selectedPhoto) {
            Toast.show({
              type: 'error',
              text1: 'Photo requise',
              text2: 'Veuillez prendre ou sélectionner une photo',
            });
            return;
          }
          
          // Upload photo for challenge completion
          const formData = new FormData();
          formData.append('photo', {
            uri: selectedPhoto,
            type: 'image/jpeg',
            name: 'challenge_photo.jpg',
          });
          
          response = await api.post(
            API_CONFIG.endpoints.challenges.uploadPhoto(selectedChallenge.id),
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            }
          );
          break;
          
        case 'TEXT':
          // For text validation, we would need to get the text input value
          // For now, we'll use a placeholder
          response = await api.post(
            API_CONFIG.endpoints.challenges.submitText(selectedChallenge.id),
            { text: 'Challenge completed' }
          );
          break;
          
        case 'QUIZ':
          // For quiz validation, we would need to get the quiz answers
          // For now, we'll use a placeholder
          response = await api.post(
            API_CONFIG.endpoints.challenges.submitQuiz(selectedChallenge.id),
            { answers: [] }
          );
          break;
          
        default:
          // For other validation modes, use the general complete endpoint
          response = await api.post(
            API_CONFIG.endpoints.challenges.complete(selectedChallenge.id),
            {}
          );
      }

      console.log('📥 Challenge completion response:', response);
      
      if (response.data?.success) {
        console.log('✅ Achievements: Challenge completed successfully');
        Toast.show({
          type: 'success',
          text1: 'Défi complété',
          text2: 'Félicitations! Vous avez complété ce défi',
        });
        
        // Refresh challenges to update status
        fetchChallenges();
        handleCloseModal();
      } else {
        console.log('⚠️ Achievements: Challenge completion failed');
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
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleTabChange = (tab) => {
    setSelectedTab(tab);
    setCurrentPage(1); // Reset to first page when changing tabs
  };

  // Helper function to convert country name to flag emoji
  const countryCodeToFlagEmoji = (address) => {
    const countryMap = {
      'azerbaijan': '🇦🇿',
      'algeria': '🇩🇿',
      'congo': '🇨🇬',
      'trinidad and tobago': '🇹🇹',
      'france': '🇫🇷',
      'côte d\'ivoire': '🇨🇮',
      'ivory coast': '🇨🇮',
      'belgique': '🇧🇪',
      'tunisie': '🇹🇳',
      'portugal': '🇵🇹',
      'kinshasa': '🇨🇩',
      'united states': '🇺🇸',
      'usa': '🇺🇸',
      'canada': '🇨🇦',
      'united kingdom': '🇬🇧',
      'uk': '🇬🇧',
      'germany': '🇩🇪',
      'spain': '🇪🇸',
      'italy': '🇮🇹',
      'netherlands': '🇳🇱',
      'belgium': '🇧🇪',
      'switzerland': '🇨🇭',
      'australia': '🇦🇺',
      'japan': '🇯🇵',
      'china': '🇨🇳',
      'india': '🇮🇳',
      'brazil': '🇧🇷',
      'mexico': '🇲🇽',
      'argentina': '🇦🇷',
      'chile': '🇨🇱',
      'colombia': '🇨🇴',
      'peru': '🇵🇪',
      'venezuela': '🇻🇪',
      'ecuador': '🇪🇨',
      'bolivia': '🇧🇴',
      'paraguay': '🇵🇾',
      'uruguay': '🇺🇾',
      'guyana': '🇬🇾',
      'suriname': '🇸🇷',
      'french guiana': '🇬🇫'
    };
    
    if (!address) return '🏳️';
    
    // Extract country from address format: "city; city; postal; country"
    const addressParts = address.split(';');
    const country = addressParts[addressParts.length - 1]?.trim();
    
    if (!country) return '🏳️';
    
    const normalizedCountry = country.toLowerCase().trim();
    return countryMap[normalizedCountry] || '🏳️';
  };

  const handleSubscriptionRenew = () => {
    console.log('🔄 Achievements: Navigating to subscription renewal page');
    setShowBlurOverlay(false);
    if (onSubscriptionRenew) {
      onSubscriptionRenew();
    }
  };

  // Helper function to get category icon
  const getCategoryIcon = (category) => {
    const categoryIcons = {
      'fitness': 'fitness',
      'nutrition': 'restaurant',
      'hydration': 'water',
      'sleep': 'bed',
      'mindfulness': 'leaf',
      'ACTIVITE_PHYSIQUE': 'fitness',
      'ALIMENTAIRE': 'restaurant',
      'HYDRATATION': 'water',
      'SOCIAL_PARTICIPATION': 'people',
      'default': 'trophy'
    };
    return categoryIcons[category?.toUpperCase()] || categoryIcons.default;
  };

  // Helper function to format category text for display
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

  // Helper function to filter challenges by status
  const getFilteredChallenges = () => {
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
    const paginatedChallenges = filtered.slice(startIndex, endIndex);
    
    return paginatedChallenges;
  };

  // Helper function to get tab counts
  const getTabCounts = () => {
    if (!challenges || challenges.length === 0) return { pending: 0, my: 0, completed: 0 };
    
    return {
      pending: challenges.filter(c => c.status === 'not_assigned').length,
      my: challenges.filter(c => c.status === 'assigned' || c.status === 'in_progress').length,
      completed: challenges.filter(c => c.status === 'completed').length
    };
  };



  // Helper function to format points with K suffix
  const formatPoints = (points) => {
    if (points >= 1000) {
      return `${(points / 1000).toFixed(1)}K`;
    }
    return points.toString();
  };

  const currentUserRank = userPosition?.rank || 0;
  const totalUsers = userPosition?.totalUsers || 0;
  const userPoints = badgesData?.totalPointsEarned || 0; // Use points from badgeProgress
  const formattedUserPoints = formatPoints(userPoints || 0);
  const completedChallenges = challengesData?.completedChallenges || 0;
  const totalChallenges = challengesData?.totalChallenges || 0;
  const unlockedBadges = badgesData?.unlockedBadges || 0;
  const totalBadges = badgesData?.totalBadges || 0;

  const renderTabContent = () => {
    const filteredChallenges = getFilteredChallenges();
    const tabCounts = getTabCounts();

    if (challengesLoading) {
      return (
        <View style={styles.tabContentContainer}>
          <Text style={styles.loadingText}>Chargement des défis...</Text>
        </View>
      );
    }

    if (filteredChallenges.length === 0) {
      let emptyMessage = '';
      switch (selectedTab) {
        case 'pending':
          emptyMessage = 'Aucun défi à relever pour le moment';
          break;
        case 'my':
          emptyMessage = 'Aucun défi en cours';
          break;
        case 'completed':
          emptyMessage = 'Aucun défi complété';
          break;
        default:
          emptyMessage = 'Aucun défi disponible';
      }
      
      return (
        <View style={styles.tabContentContainer}>
          <Text style={styles.emptyStateText}>{emptyMessage}</Text>
        </View>
      );
    }

    return (
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
                    style={styles.completeButton}
                    onPress={() => handleCompleteChallenge(challenge)}
                  >
                    <Text style={styles.completeButtonText}>Compléter</Text>
                  </TouchableOpacity>
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
    );
  };

  // Challenge Completion Modal
  const renderCompletionModal = () => {
    if (!selectedChallenge || !showCompletionModal) return null;
    
    // Don't show completion modal for already completed challenges
    if (selectedChallenge.status === 'completed') {
      return null;
    }

    const getValidationInput = () => {
      // If challenge is already completed, show completion info instead of input
      if (selectedChallenge.status === 'completed') {
        return (
          <View style={styles.validationInput}>
            <View style={styles.completedInfo}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              <Text style={styles.completedText}>Ce défi a été complété</Text>
            </View>
          </View>
        );
      }

      switch (selectedChallenge.validationMode) {
        case 'PHOTO':
          return (
            <View style={styles.validationInput}>
              <Text style={styles.validationLabel}>Prenez une photo :</Text>
              <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
                <Ionicons name="camera" size={24} color="#3B82F6" />
                <Text style={styles.photoButtonText}>
                  {selectedPhoto ? 'Photo sélectionnée' : 'Prendre une photo'}
                </Text>
              </TouchableOpacity>
              {selectedPhoto && (
                <View style={styles.selectedPhotoContainer}>
                  <Image source={{ uri: selectedPhoto }} style={styles.selectedPhoto} />
                  <TouchableOpacity 
                    style={styles.removePhotoButton}
                    onPress={() => setSelectedPhoto(null)}
                  >
                    <Ionicons name="close-circle" size={24} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        case 'TEXT':
          return (
            <View style={styles.validationInput}>
              <Text style={styles.validationLabel}>Décrivez votre expérience :</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Racontez comment vous avez relevé ce défi..."
                multiline
                numberOfLines={4}
              />
            </View>
          );
        case 'QUIZ':
          return (
            <View style={styles.validationInput}>
              <Text style={styles.validationLabel}>Répondez aux questions :</Text>
              {selectedChallenge.quizQuestions?.map((question, index) => (
                <View key={index} style={styles.quizQuestion}>
                  <Text style={styles.questionText}>{question}</Text>
                  <TextInput
                    style={styles.quizInput}
                    placeholder="Votre réponse..."
                  />
                </View>
              ))}
            </View>
          );
        case 'AUTO_CHECK':
          return (
            <View style={styles.validationInput}>
              <View style={styles.autoCheckInfo}>
                <Ionicons name="checkmark-circle-outline" size={24} color="#4CAF50" />
                <Text style={styles.autoCheckText}>Validation automatique</Text>
              </View>
            </View>
          );
        case 'COACH':
          return (
            <View style={styles.validationInput}>
              <View style={styles.coachValidationInfo}>
                <Ionicons name="person-outline" size={24} color="#FF9800" />
                <Text style={styles.coachValidationText}>Validation par un coach</Text>
              </View>
            </View>
          );
        default:
          return (
            <View style={styles.validationInput}>
              <Text style={styles.validationLabel}>
                {selectedChallenge.validationDescription}
              </Text>
            </View>
          );
      }
    };

    return (
      <Modal
        visible={showCompletionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Compléter le défi</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={handleCloseModal}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.challengeTitle}>{selectedChallenge.title}</Text>
              <Text style={styles.challengeDescription}>{selectedChallenge.description}</Text>
              
              <View style={styles.challengeInfo}>
                <View style={styles.infoRow}>
                  <Ionicons 
                    name={getCategoryIcon(selectedChallenge.type)} 
                    size={16} 
                    color="#3B82F6" 
                  />
                  <Text style={styles.infoText}>{formatCategoryText(selectedChallenge.type)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={16} color="#666" />
                  <Text style={styles.infoText}>{selectedChallenge.duration} jours</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="trophy-outline" size={16} color="#FFD700" />
                  <Text style={styles.infoText}>{formatPoints(selectedChallenge.rewards?.points || 0)} points</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons 
                    name={getValidationIcon(selectedChallenge.validationMode)} 
                    size={16} 
                    color="#10B981" 
                  />
                  <Text style={styles.infoText}>{selectedChallenge.validationDescription}</Text>
                </View>
              </View>
              
              {getValidationInput()}
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={handleCloseModal}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.submitButton, photoUploading && styles.submitButtonDisabled]}
                onPress={handleSubmitChallenge}
                disabled={photoUploading}
              >
                <Text style={styles.submitButtonText}>
                  {photoUploading ? 'Soumission...' : 'Soumettre'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Défis</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.helpButton}>
            <Ionicons name="help-circle-outline" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={theme.colors.text.primary} />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>6</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.profileButton} onPress={() => onTabPress ? onTabPress('settings') : null}>
            <Avatar 
              source={{ uri: profileData?.avatar || user?.avatar }} 
              size={40}
              style={styles.profileImage}
              fallbackText={user?.firstName?.charAt(0) || user?.name?.charAt(0)}
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
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.headerSubtitle}>
            Relevez des défis et collectez des badges pour progresser
          </Text>
        </View>

        {/* Top 5 General Leaderboard Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="trophy" size={20} color="#FFD700" />
              <Text style={styles.cardTitle}>Top 5 Général</Text>
            </View>
            <TouchableOpacity style={styles.shareButton}>
              <Ionicons name="megaphone-outline" size={20} color="#4CAF50" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Chargement du classement...</Text>
            </View>
          ) : leaderboardData.length > 0 ? (
            leaderboardData.map((item, index) => (
            <View key={index} style={styles.leaderboardItem}>
                <View style={styles.rankContainer}>
                  <Text style={styles.rankNumber}>{item.rank}</Text>
                </View>
                
                <View style={styles.userInfo}>
                              <Avatar 
                  source={{ uri: item.avatar }} 
                    size={32}
                    style={styles.userAvatar}
                  fallbackText={item.name?.charAt(0)}
                />
                  <Text style={styles.flagEmoji}>{item.flag}</Text>
                  <Text style={styles.userName} numberOfLines={1}>{item.name}</Text>
                </View>
                
                <View style={styles.pointsContainer}>
                <Text style={styles.pointsText}>{item.points}pts</Text>
              </View>
            </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Aucun classement disponible</Text>
            </View>
          )}
        </View>

        {/* User's Current Ranking Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Ionicons name="person" size={20} color="#3B82F6" />
              <Text style={styles.cardTitle}>Votre classement</Text>
            </View>
          </View>
          
          {userPositionLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Chargement de votre classement...</Text>
            </View>
          ) : userPosition ? (
                         <View style={styles.leaderboardItem}>
               <View style={styles.rankContainer}>
                 <Text style={styles.rankNumber}>{userPosition.rank}</Text>
               </View>
               
               <View style={styles.userInfo}>
                 <Avatar 
                   source={{ uri: profileData?.avatar || user?.avatar }} 
                   size={32}
                   style={styles.userAvatar}
                   fallbackText={profileData?.firstName?.charAt(0) || user?.firstName?.charAt(0) || user?.name?.charAt(0)}
                 />
                 <Text style={styles.flagEmoji}>{userPosition.flag}</Text>
                 <Text style={styles.userName} numberOfLines={1}>
                   {profileData?.firstName || userPosition.firstName} {profileData?.lastName || userPosition.lastName}
                 </Text>
               </View>
               
               <View style={styles.pointsContainer}>
                 <Text style={styles.pointsText}>{formatPoints(userPoints || 0)}pts</Text>
               </View>
             </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Aucun classement disponible</Text>
            </View>
          )}
        </View>

                {/* Challenges and Badges Summary Card */}
        <View style={styles.card}>
          {summaryLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Chargement des données...</Text>
            </View>
          ) : (
            <View style={styles.summaryContainer}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Défis complétés</Text>
                <Text style={styles.summaryValue}>{completedChallenges}/{totalChallenges}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Badges collectés</Text>
                <Text style={styles.summaryValue}>{unlockedBadges}/{totalBadges}</Text>
              </View>
            </View>
          )}
        </View>

        {/* User's Badge and Points Card */}
        <View style={styles.card}>
          <View style={styles.badgePointsContainer}>
            <View style={styles.pointsDisplay}>
              <Text style={styles.pointsDisplayText}>{formatPoints(userPoints || 0)}pts</Text>
            </View>
            
            <View style={styles.badgeInfo}>
              <View style={styles.badgeIconContainer}>
                <Ionicons name="star" size={24} color="#3B82F6" />
              </View>
              <View style={styles.badgeTextContainer}>
                <Text style={styles.badgeLabel}>Mon badge actuel :</Text>
                <Text style={styles.badgeName}>AUCUN</Text>
              </View>
            </View>
            
            <View style={styles.medalInfo}>
              <Ionicons name="medal" size={20} color="#FFD700" />
              <Text style={styles.medalText}>
                Vous avez <Text style={styles.medalPoints}>{formatPoints(userPoints || 0)} Points</Text>
              </Text>
            </View>
            
            <Text style={styles.nextLevelText}>
              Plus que <Text style={styles.nextLevelPoints}>0pts</Text> pour le niveau 1 du badge <Text style={styles.nextLevelBadge}>Suivant</Text>
            </Text>
          </View>
        </View>

        {/* Challenges Section */}
        <View style={styles.challengesSection}>
          <Text style={styles.challengesTitle}>Défis</Text>
          <Text style={styles.challengesDescription}>
            Chaque défis complété vaut des points mais surtout une grande fierté pour vous-même !
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
          {renderTabContent()}
          </View>
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
        <TouchableOpacity style={[styles.navTab, styles.activeNavTab]} onPress={() => onTabPress('achievements')}>
          <Ionicons name="trophy" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('more')}>
          <Ionicons name="add-outline" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Challenge Completion Modal */}
      {renderCompletionModal()}
      
      {/* Blur Overlay for Expired Subscription */}
      <BlurOverlay
        visible={showBlurOverlay}
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
  
  // Header Section
  headerSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    lineHeight: 22,
  },

  // Card Styles
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  // Leaderboard Card
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginLeft: 8,
  },
  shareButton: {
    padding: 4,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rankContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    marginRight: 8,
  },
  flagEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  userName: {
    fontSize: 14,
    color: '#2C3E50',
    flex: 1,
  },
  pointsContainer: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  pointsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
  },

  // User Ranking Card
  userRankingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userRankingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  userRankingAvatar: {
    marginRight: 8,
  },
  userRankingInfo: {
    flex: 1,
  },
  userRankingText: {
    fontSize: 14,
    color: '#2C3E50',
    marginBottom: 4,
  },
  userRankingNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  userPointsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },

  // Summary Card
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
  },

  // Badge and Points Card
  badgePointsContainer: {
    alignItems: 'center',
  },
  pointsDisplay: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
    marginBottom: 16,
  },
  pointsDisplayText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  badgeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  badgeTextContainer: {
    flex: 1,
  },
  badgeLabel: {
    fontSize: 14,
    color: '#2C3E50',
    marginBottom: 4,
  },
  badgeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  medalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  medalText: {
    fontSize: 14,
    color: '#2C3E50',
    marginLeft: 8,
  },
  medalPoints: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  nextLevelText: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  nextLevelPoints: {
    color: '#FF9800',
    fontWeight: 'bold',
  },
  nextLevelBadge: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },

  // Challenges Section
  challengesSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  challengesTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  challengesDescription: {
    fontSize: 14,
    color: '#7F8C8D',
    lineHeight: 20,
    marginBottom: 20,
  },
  challengeTabs: {
    flexDirection: 'row',
    marginBottom: 20,
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
    marginRight: 8,
  },
  activeTabText: {
    color: '#2C3E50',
    fontWeight: '600',
  },
  tabBadge: {
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
  },
  activeTabBadge: {
    backgroundColor: '#FFC107',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#7F8C8D',
  },
  activeTabBadgeText: {
    color: '#FFFFFF',
  },
  tabContent: {
    minHeight: 100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#7F8C8D',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#7F8C8D',
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
  pointsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
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
  detailIcon: {
    fontSize: 16,
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
  progressContainer: {
    marginTop: 8,
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
  assignedContainer: {
    marginTop: 8,
  },
  assignedButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 12,
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  leaveButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  leaveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  challengeInfo: {
    marginVertical: 16,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  validationInput: {
    marginTop: 16,
  },
  validationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 12,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#F0F9FF',
  },
  photoButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  selectedPhotoContainer: {
    marginTop: 16,
    position: 'relative',
    alignItems: 'center',
  },
  selectedPhoto: {
    width: 200,
    height: 150,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  completedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  completedText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  autoCheckInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  autoCheckText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  coachValidationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  coachValidationText: {
    color: '#FF9800',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  quizQuestion: {
    marginBottom: 16,
  },
  questionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  quizInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
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

export default AchievementsScreen; 