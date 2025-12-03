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
  ActivityIndicator,
  FlatList,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../constants/theme';
import SubscriptionBanner from '../components/SubscriptionBanner';
import SubscriptionService from '../services/subscriptionService';
import Avatar from '../components/Avatar';
import AppHeader from '../components/AppHeader';
import ProgressChart from '../components/ProgressChart';
import AchievementsCard from '../components/dashboard/AchievementsCard';
import NotificationBadge from '../components/NotificationBadge';
import { ProfileApi } from '../services/profileApi';
import api from '../services/api';
import { API_CONFIG } from '../config/apiConfig';
import ProgressPhotosApi from '../services/progressPhotosApi';
import DashboardService from '../services/dashboardService';

const { width } = Dimensions.get('window');

const ProgressScreen = ({ user, onLogout, onTabPress, activeTab, onSubscriptionRenew, onFAQPress }) => {
  // Main state
  const [activeTabState, setActiveTabState] = useState('measurements');
  const [profile, setProfile] = useState(null);
  const [profileData, setProfileData] = useState(null); // Separate state for avatar from GET /profile
  const [initialMeasurements, setInitialMeasurements] = useState(null);
  const [measurements, setMeasurements] = useState([]);
  const [progressPhotos, setProgressPhotos] = useState([]);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [achievementsData, setAchievementsData] = useState(null);

  // Modal states
  const [showMeasurementModal, setShowMeasurementModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // Form states
  const [measurementForm, setMeasurementForm] = useState({
    weight: '',
    waistSize: '',
    notes: '',
    error: '',
    saving: false
  });

  const [photoForm, setPhotoForm] = useState({
    weight: '',
    notes: '',
    selectedPhoto: null,
    preview: null,
    uploading: false,
    error: ''
  });

  // Fetch profile data separately for avatar (like ChatScreen)
  useEffect(() => {
    const fetchProfileForAvatar = async () => {
      try {
        const data = await ProfileApi.getProfile();
        setProfileData(data);
        console.log('[ProgressScreen] 📊 Profile data fetched for avatar:', data);
        console.log('[ProgressScreen] 📊 Avatar from profileData:', data?.avatar);
      } catch (error) {
        console.error('[ProgressScreen] ❌ Error fetching profile for avatar:', error);
      }
    };
    fetchProfileForAvatar();
  }, []);

  useEffect(() => {
    fetchAllData();
    checkSubscriptionStatus();
    fetchAchievementsData();
  }, []);

  const fetchAchievementsData = async () => {
    try {
      console.log('[ProgressScreen] 🏆 Fetching achievements data for card...');
      const data = await DashboardService.getAchievementsSummary();
      console.log('[ProgressScreen] ✅ Achievements data fetched successfully:', data);
      setAchievementsData(data);
    } catch (error) {
      console.error('[ProgressScreen] ❌ Error fetching achievements data:', error);
      setAchievementsData(null);
    }
  };

  // Add pull-to-refresh functionality
  const handleRefresh = async () => {
    console.log('[ProgressScreen] 🔄 Pull-to-refresh triggered');
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      console.log('[ProgressScreen] 📊 Fetching all data...');
      console.log('[ProgressScreen] 📊 API Base URL:', api.defaults.baseURL);
      
      // Try to fetch from the progress overview endpoint first (original approach)
      try {
        console.log('[ProgressScreen] 📊 Trying progress overview endpoint: /progress/overview');
        const progressRes = await api.get('/progress/overview');
        console.log('[ProgressScreen] 📊 Progress overview data:', progressRes.data);
        
        if (progressRes.data?.success && progressRes.data?.data) {
          const data = progressRes.data.data;
          setProfile(data.profile?.profile || data.profile);
          setMeasurements(data.measurements || []);
          setProgressPhotos(data.progressPhotos || []);
          
          // Set initial measurements from profile
          const profileData = data.profile?.profile || data.profile;
          if (profileData) {
            setInitialMeasurements({
              weight: profileData.initialWeight,
              waistSize: profileData.initialWaistSize,
              date: profileData.createdAt || new Date().toISOString()
            });
          }
          
          console.log('[ProgressScreen] ✅ Data fetched from progress overview endpoint');
          return;
        }
      } catch (progressError) {
        console.log('[ProgressScreen] ⚠️ Progress overview endpoint failed, trying individual endpoints:', progressError.message);
      }
      
      // Fallback to individual endpoints
      console.log('[ProgressScreen] 📊 Trying individual endpoints...');
      const [profileRes, measurementsRes, photosRes] = await Promise.allSettled([
        ProfileApi.getProfile(),
        api.get('/onboarding/measurements'),
        ProgressPhotosApi.getProgressPhotos()
      ]);

      // Log the full GET /Profile response structure
      if (profileRes.status === 'fulfilled') {
        console.log('[ProgressScreen] 📊 GET /Profile full response:', JSON.stringify(profileRes.value, null, 2));
        console.log('[ProgressScreen] 📊 GET /Profile avatar paths:', {
          'profileRes.value.avatar': profileRes.value?.avatar,
          'profileRes.value.profile?.avatar': profileRes.value?.profile?.avatar,
          'profileRes.value.data?.avatar': profileRes.value?.data?.avatar,
          'profileRes.value.data?.profile?.avatar': profileRes.value?.data?.profile?.avatar,
        });
      } else {
        console.error('[ProgressScreen] ❌ GET /Profile failed:', profileRes.reason?.message);
      }

      console.log('[ProgressScreen] 📊 Individual API responses:', {
        profile: profileRes.status === 'fulfilled' ? profileRes.value : profileRes.reason?.message,
        measurements: measurementsRes.status === 'fulfilled' ? measurementsRes.value.data : measurementsRes.reason?.message,
        photos: photosRes.status === 'fulfilled' ? photosRes.value.data : photosRes.reason?.message
      });

      // Extract and set data with proper fallbacks
      const profileData = profileRes.status === 'fulfilled' 
        ? profileRes.value
        : null;
      
      const measurementsData = measurementsRes.status === 'fulfilled'
        ? (measurementsRes.value.data?.data?.measurements || measurementsRes.value.data?.measurements || [])
        : [];
      
      const photosData = photosRes.status === 'fulfilled'
        ? (photosRes.value.success ? photosRes.value.data : [])
        : [];

      setProfile(profileData);
      setMeasurements(measurementsData);
      setProgressPhotos(photosData);
      
      // Debug logging
      console.log('[ProgressScreen] 📊 Final data set:', {
        profile: profileData,
        measurements: measurementsData,
        photos: photosData,
        initialMeasurements: profileData ? {
          weight: profileData.initialWeight,
          waistSize: profileData.initialWaistSize,
          date: profileData.createdAt
        } : null
      });

      // Set initial measurements from profile
      if (profileData) {
        setInitialMeasurements({
          weight: profileData.initialWeight,
          waistSize: profileData.initialWaistSize,
          date: profileData.createdAt || new Date().toISOString()
        });
      } else {
        // If no profile data, set minimal fallback
        setProfile({
          initialWeight: null,
          weight: null,
          goalWeight: null,
          initialWaistSize: null,
          waistSize: null,
          completedChallenges: 0,
          collectedBadges: 0
        });
        setInitialMeasurements(null);
      }

      console.log('[ProgressScreen] ✅ Data fetched from individual endpoints');
    } catch (error) {
      console.error('[ProgressScreen] ❌ Error fetching data:', error);
      // Set minimal fallback data - no hardcoded values
      setProfile({
        initialWeight: null,
        weight: null,
        goalWeight: null,
        initialWaistSize: null,
        waistSize: null,
        completedChallenges: 0,
        collectedBadges: 0
      });
      setInitialMeasurements(null);
      setMeasurements([]);
      setProgressPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      console.log('[ProgressScreen] 💳 Checking subscription status...');
      const data = await SubscriptionService.getSubscriptionStatus();
      setSubscriptionData(data);
    } catch (error) {
      console.error('[ProgressScreen] ❌ Error checking subscription status:', error);
      setSubscriptionData({
        status: 'EXPIRED',
        isExpired: true,
        requiresRenewal: true
      });
    }
  };

  const handleSubscriptionRenew = () => {
    console.log('[ProgressScreen] 🔄 Navigating to subscription renewal page');
    if (onSubscriptionRenew) {
      onSubscriptionRenew();
    }
  };

  // Calculate current weight with priority order as per specification
  const getCurrentWeight = () => {
    const sortedMeasurements = [...measurements].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    const latestMeasurement = sortedMeasurements[0];
    const currentWeight = latestMeasurement?.weight ?? profile?.profile?.weight ?? '-';
    console.log('[ProgressScreen] 📊 Current weight calculation:', {
      latestMeasurement: latestMeasurement?.weight,
      profileWeight: profile?.profile?.weight,
      finalWeight: currentWeight
    });
    return currentWeight;
  };

  // Calculate current waist size with priority order as per specification
  const getCurrentWaistSize = () => {
    const sortedMeasurements = [...measurements].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    const latestMeasurement = sortedMeasurements[0];
    const currentWaist = latestMeasurement?.waistSize ?? profile?.profile?.waistSize ?? '-';
    console.log('[ProgressScreen] 📊 Current waist calculation:', {
      latestMeasurement: latestMeasurement?.waistSize,
      profileWaist: profile?.profile?.waistSize,
      finalWaist: currentWaist
    });
    return currentWaist;
  };

  // Generate chart data from real measurements
  const generateChartData = () => {
    const chartData = [];
    
    // Add initial measurement if available
    if (initialMeasurements) {
      const weight = parseFloat(initialMeasurements.weight);
      const waistSize = parseFloat(initialMeasurements.waistSize);
      
      if (!isNaN(weight) && !isNaN(waistSize)) {
        chartData.push({
          date: initialMeasurements.date,
          weight: weight,
          waistSize: waistSize,
          notes: 'Mesure initiale',
          isInitial: true
        });
      }
    }
    
    // Add user measurements (sorted by date, oldest first for chart)
    const sortedMeasurements = [...measurements].sort((a, b) => 
      new Date(a.createdAt) - new Date(b.createdAt)
    );
    
    sortedMeasurements.forEach(measurement => {
      const weight = parseFloat(measurement.weight);
      const waistSize = parseFloat(measurement.waistSize);
      
      if (!isNaN(weight) && !isNaN(waistSize)) {
        chartData.push({
          date: measurement.createdAt,
          weight: weight,
          waistSize: waistSize,
          notes: measurement.notes || '',
          isInitial: false
        });
      }
    });
    
    console.log('[ProgressScreen] 📊 Generated chart data:', chartData);
    return chartData;
  };

  // Calculate chart Y-axis range and labels
  const getChartYAxisData = () => {
    const chartData = generateChartData();
    
    if (chartData.length === 0) {
      return {
        weightRange: { min: 0, max: 100 },
        waistRange: { min: 0, max: 100 },
        weightLabels: [100, 75, 50, 25, 0],
        waistLabels: [100, 75, 50, 25, 0]
      };
    }
    
    const weights = chartData.map(d => d.weight).filter(w => w != null);
    const waists = chartData.map(d => d.waistSize).filter(w => w != null);
    
    const weightMin = Math.min(...weights);
    const weightMax = Math.max(...weights);
    const waistMin = Math.min(...waists);
    const waistMax = Math.max(...waists);
    
    // Add some padding to the range
    const weightPadding = (weightMax - weightMin) * 0.1 || 5;
    const waistPadding = (waistMax - waistMin) * 0.1 || 5;
    
    const weightRange = {
      min: Math.max(0, weightMin - weightPadding),
      max: weightMax + weightPadding
    };
    
    const waistRange = {
      min: Math.max(0, waistMin - waistPadding),
      max: waistMax + waistPadding
    };
    
    // Generate 5 labels for each axis
    const weightLabels = [];
    const waistLabels = [];
    
    for (let i = 4; i >= 0; i--) {
      const weightValue = weightRange.min + (weightRange.max - weightRange.min) * (i / 4);
      const waistValue = waistRange.min + (waistRange.max - waistRange.min) * (i / 4);
      weightLabels.push(Math.round(weightValue));
      waistLabels.push(Math.round(waistValue));
    }
    
    return {
      weightRange,
      waistRange,
      weightLabels,
      waistLabels
    };
  };



  // Format date to French locale
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  // Handle measurement form submission
  const handleMeasurementSubmit = async () => {
    try {
      setMeasurementForm(prev => ({ ...prev, saving: true, error: '' }));

      // Validation
      const weight = parseFloat(measurementForm.weight);
      const waistSize = parseFloat(measurementForm.waistSize);

      if (!weight || weight < 10 || weight > 300) {
        setMeasurementForm(prev => ({ ...prev, error: 'Le poids doit être entre 10 et 300 kg.' }));
        return;
      }

      if (!waistSize || waistSize < 10 || waistSize > 300) {
        setMeasurementForm(prev => ({ ...prev, error: 'Le tour de taille doit être entre 10 et 300 cm.' }));
        return;
      }

      // Submit measurement
      const response = await api.post('/onboarding/measurements', {
        weight,
        waistSize,
        notes: measurementForm.notes
      });

      console.log('[ProgressScreen] ✅ Measurement added successfully:', response.data);

      // Refresh data
      await fetchAllData();

      // Reset form and close modal
      setMeasurementForm({
        weight: '',
        waistSize: '',
        notes: '',
        error: '',
        saving: false
      });
      setShowMeasurementModal(false);

      Alert.alert('Succès', 'Mesure ajoutée avec succès!');
    } catch (error) {
      console.error('[ProgressScreen] ❌ Error adding measurement:', error);
      setMeasurementForm(prev => ({ 
        ...prev, 
        error: 'Erreur lors de l\'ajout de la mesure',
        saving: false 
      }));
    }
  };

  // Handle photo form submission
  const handlePhotoSubmit = async () => {
    try {
      setPhotoForm(prev => ({ ...prev, uploading: true, error: '' }));

      if (!photoForm.selectedPhoto) {
        setPhotoForm(prev => ({ ...prev, error: 'Veuillez sélectionner une photo' }));
        return;
      }

      // Validate photo
      const validation = ProgressPhotosApi.validatePhoto(photoForm.selectedPhoto);
      if (!validation.isValid) {
        setPhotoForm(prev => ({ 
          ...prev, 
          error: validation.errors.join(', '),
          uploading: false 
        }));
        return;
      }

      // Create form data using the service
      const formData = ProgressPhotosApi.createFormData(photoForm.selectedPhoto, {
        weight: photoForm.weight,
        notes: photoForm.notes
      });

      // Submit photo using the service
      const result = await ProgressPhotosApi.addProgressPhoto(formData);

      if (result.success) {
        console.log('[ProgressScreen] ✅ Photo added successfully:', result.data);

        // Refresh data
        await fetchAllData();

        // Reset form and close modal
        setPhotoForm({
          weight: '',
          notes: '',
          selectedPhoto: null,
          preview: null,
          uploading: false,
          error: ''
        });
        setShowPhotoModal(false);

        Alert.alert('Succès', 'Photo ajoutée avec succès!');
      } else {
        setPhotoForm(prev => ({ 
          ...prev, 
          error: result.error || 'Erreur lors de l\'ajout de la photo',
          uploading: false 
        }));
      }
    } catch (error) {
      console.error('[ProgressScreen] ❌ Error adding photo:', error);
      
      let errorMessage = 'Erreur lors de l\'ajout de la photo';
      
      if (error.response) {
        // Server responded with error status
        console.error('[ProgressScreen] ❌ Server error response:', error.response.data);
        errorMessage = error.response.data?.message || errorMessage;
      } else if (error.request) {
        // Request was made but no response received
        console.error('[ProgressScreen] ❌ No response received:', error.request);
        errorMessage = 'Problème de connexion. Vérifiez votre internet.';
      } else {
        // Something else happened
        console.error('[ProgressScreen] ❌ Error setting up request:', error.message);
        errorMessage = error.message || errorMessage;
      }
      
      setPhotoForm(prev => ({ 
        ...prev, 
        error: errorMessage,
        uploading: false 
      }));
    }
  };

  // Handle photo selection
  const handlePhotoSelection = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setPhotoForm(prev => ({
          ...prev,
          selectedPhoto: asset,
          preview: asset.uri
        }));
      }
    } catch (error) {
      console.error('[ProgressScreen] ❌ Error selecting photo:', error);
      Alert.alert('Erreur', 'Erreur lors de la sélection de la photo');
    }
  };

  // Handle measurement deletion
  const handleDeleteMeasurement = async (measurementId) => {
    Alert.alert(
      'Supprimer la mesure',
      'Êtes-vous sûr de vouloir supprimer cette mesure ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/onboarding/measurements/${measurementId}`);
              await fetchAllData();
              Alert.alert('Succès', 'Mesure supprimée avec succès!');
            } catch (error) {
              console.error('[ProgressScreen] ❌ Error deleting measurement:', error);
              Alert.alert('Erreur', 'Erreur lors de la suppression de la mesure');
            }
          }
        }
      ]
    );
  };

  // Handle photo deletion
  const handleDeletePhoto = async (photoId) => {
    Alert.alert(
      'Supprimer la photo',
      'Êtes-vous sûr de vouloir supprimer cette photo ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/progress-photos/${photoId}`);
              await fetchAllData();
              Alert.alert('Succès', 'Photo supprimée avec succès!');
            } catch (error) {
              console.error('[ProgressScreen] ❌ Error deleting photo:', error);
              Alert.alert('Erreur', 'Erreur lors de la suppression de la photo');
            }
          }
        }
      ]
    );
  };

  // Get photo URL (handle both relative and absolute URLs)
  const getPhotoUrl = (photo) => {
    if (!photo.url) return null;
    return photo.url.startsWith('http') 
      ? photo.url 
      : `${API_CONFIG.baseURL?.replace('/api/v1', '')}${photo.url}`;
  };

  // Get avatar URL (handle both relative and absolute URLs)
  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('http')) return avatarPath;
    const base = API_CONFIG.BASE_URL || '';
    const root = base.replace(/\/api\/v1$/, '');
    return `${root}${avatarPath.startsWith('/') ? '' : '/'}${avatarPath}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header - aligned with Dashboard */}
      <AppHeader
        title="Progression"
        onHelpPress={() => {
          if (onFAQPress) {
            onFAQPress();
          } else if (onTabPress) {
            onTabPress('faq');
          }
        }}
        onNotificationPress={() => {
          if (onTabPress) {
            onTabPress('notifications');
          }
        }}
        onProfilePress={() => {
          console.log('📊 Progress: Avatar clicked, navigating to settings');
          if (onTabPress && typeof onTabPress === 'function') {
            onTabPress('settings');
          } else if (navigation && typeof navigation.navigate === 'function') {
            navigation.navigate('Settings');
          } else {
            console.log('📊 Progress: No navigation handler available for settings');
          }
        }}
        avatarSource={(() => {
          // Get avatar from profileData first (from GET /profile), then fallback to profile and user
          // This matches the pattern used in ChatScreen, NutritionScreen, etc.
          const rawAvatar = profileData?.avatar 
            || profile?.avatar 
            || profile?.profile?.avatar 
            || user?.avatar;
          
          // Debug logging
          console.log('[ProgressScreen] 📊 Avatar sources:', {
            'profileData?.avatar': profileData?.avatar,
            'profile?.avatar': profile?.avatar,
            'profile?.profile?.avatar': profile?.profile?.avatar,
            'user?.avatar': user?.avatar,
            'rawAvatar': rawAvatar,
            'profileData structure': profileData ? Object.keys(profileData) : null,
            'profile structure': profile ? Object.keys(profile) : null
          });
          
          // Process avatar URL if it exists
          if (rawAvatar) {
            const processedAvatar = getAvatarUrl(rawAvatar);
            console.log('[ProgressScreen] 📊 Processed avatar URL:', processedAvatar);
            return processedAvatar;
          }
          
          console.log('[ProgressScreen] 📊 No avatar found, using fallback');
          return null;
        })()}
        avatarFallbackText={user?.firstName?.charAt(0) || user?.name?.charAt(0) || 'U'}
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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTabState === 'measurements' && styles.activeTab]}
            onPress={() => setActiveTabState('measurements')}
          >
            <Ionicons 
              name="trending-up" 
              size={20} 
              color={activeTabState === 'measurements' ? '#FFFFFF' : theme.colors.text.secondary} 
            />
            <Text style={[styles.tabText, activeTabState === 'measurements' && styles.activeTabText]}>
              Mesures & Statistiques
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, activeTabState === 'photos' && styles.activeTab]}
            onPress={() => setActiveTabState('photos')}
          >
            <Ionicons 
              name="image" 
              size={20} 
              color={activeTabState === 'photos' ? '#FFFFFF' : theme.colors.text.secondary} 
            />
            <Text style={[styles.tabText, activeTabState === 'photos' && styles.activeTabText]}>
              Photos de progression
            </Text>
          </TouchableOpacity>
        </View>

        {/* Progress Card - Combined Weight and Waist */}
        <View style={styles.progressCardsSection}>
          {console.log('[ProgressScreen] 📊 Profile data for cards:', {
            profile: profile,
            initialWeight: profile?.initialWeight,
            profileInitialWeight: profile?.profile?.initialWeight,
            targetWeight: profile?.targetWeight,
            profileTargetWeight: profile?.profile?.targetWeight,
            initialWaistSize: profile?.initialWaistSize,
            profileInitialWaistSize: profile?.profile?.initialWaistSize,
            targetWaistSize: profile?.targetWaistSize,
            profileTargetWaistSize: profile?.profile?.targetWaistSize
          })}
          
          <View style={styles.combinedProgressCard}>
            {/* Poids Section */}
            <View style={styles.measurementSection}>
              <Text style={styles.measurementTitle}>Poids</Text>
              <View style={styles.measurementRow}>
                <View style={styles.measurementItem}>
                  <Text style={styles.measurementLabel}>Initial</Text>
                  <Text style={styles.measurementValue}>
                    {profile?.initialWeight ?? profile?.profile?.initialWeight ?? '-'}
                  </Text>
                  <Text style={styles.measurementUnit}>kg</Text>
                </View>
                
                <View style={styles.measurementItem}>
                  <Text style={styles.measurementLabel}>Actuel</Text>
                  <Text style={[
                    styles.measurementValue, 
                    getCurrentWeight() !== '-' && styles.currentWeightValue
                  ]}>
                    {getCurrentWeight()}
                  </Text>
                  <Text style={[
                    styles.measurementUnit, 
                    getCurrentWeight() !== '-' && styles.currentWeightUnit
                  ]}>
                    kg
                  </Text>
                </View>
                
                <View style={styles.measurementItem}>
                  <Text style={styles.measurementLabel}>Objectif</Text>
                  <Text style={styles.measurementValue}>
                    {profile?.targetWeight ?? profile?.profile?.targetWeight ?? '-'}
                  </Text>
                  <Text style={styles.measurementUnit}>kg</Text>
                </View>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.sectionDivider} />

            {/* Tour de taille Section */}
            <View style={styles.measurementSection}>
              <Text style={styles.measurementTitle}>Tour de taille</Text>
              <View style={styles.measurementRow}>
                <View style={styles.measurementItem}>
                  <Text style={styles.measurementLabel}>Initial</Text>
                  <Text style={styles.measurementValue}>
                    {profile?.initialWaistSize ?? profile?.profile?.initialWaistSize ?? '-'}
                  </Text>
                  <Text style={styles.measurementUnit}>cm</Text>
                </View>
                
                <View style={styles.measurementItem}>
                  <Text style={styles.measurementLabel}>Actuel</Text>
                  <Text style={[
                    styles.measurementValue, 
                    getCurrentWaistSize() !== '-' && styles.currentWaistValue
                  ]}>
                    {getCurrentWaistSize()}
                  </Text>
                  <Text style={[
                    styles.measurementUnit, 
                    getCurrentWaistSize() !== '-' && styles.currentWaistUnit
                  ]}>
                    cm
                  </Text>
                </View>
                
                <View style={styles.measurementItem}>
                  <Text style={styles.measurementLabel}>Objectif</Text>
                  <Text style={styles.measurementValue}>
                    {profile?.targetWaistSize ?? profile?.profile?.targetWaistSize ?? '-'}
                  </Text>
                  <Text style={styles.measurementUnit}>cm</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {activeTabState === 'measurements' ? (
          <>
            {/* Chart Section */}
            <ProgressChart 
              chartData={generateChartData()}
              initialMeasurements={initialMeasurements}
              measurements={measurements}
              onDataPointPress={(dataPoint, index) => {
                console.log('[ProgressScreen] 📊 Chart: Data point pressed:', dataPoint, index);
              }}
              onDeleteMeasurement={handleDeleteMeasurement}
              onAddMeasurement={() => setShowMeasurementModal(true)}
            />

            {/* Achievement Card */}
            <AchievementsCard
              badgesData={achievementsData}
              onPress={() => {
                // Navigate to achievements tab
                if (onTabPress) {
                  onTabPress('achievements');
                }
              }}
              subscriptionData={subscriptionData}
              onSubscriptionRenew={onSubscriptionRenew}
            />
          </>
        ) : (
          /* Photos Tab */
          <View style={styles.photosSection}>
            <Text style={styles.photosTitle}>Photos de progression</Text>
            <Text style={styles.photosSubtitle}>Suivez visuellement votre transformation avec des photos de progression.</Text>
            
            {/* Photos Grid */}
            <View style={styles.photosGrid}>
              {/* Add Photo Button - Always first */}
              <TouchableOpacity 
                style={styles.addPhotoButton}
                onPress={() => setShowPhotoModal(true)}
              >
                <View style={styles.addPhotoContainer}>
                  <Ionicons name="add" size={48} color="#9CA3AF" />
                  <Text style={styles.addPhotoText}>Ajouter une photo</Text>
                </View>
              </TouchableOpacity>

              {/* Photo Cards */}
              {progressPhotos.map((photo) => (
                <View key={photo.id} style={styles.photoCard}>
                  <Image 
                    source={{ uri: getPhotoUrl(photo) }} 
                    style={styles.photoImage}
                    resizeMode="cover"
                  />
                  <View style={styles.photoOverlay}>
                    <TouchableOpacity 
                      style={styles.photoDeleteButton}
                      onPress={() => handleDeletePhoto(photo.id)}
                    >
                      <Ionicons name="trash" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.photoInfo}>
                    <Text style={styles.photoDate}>{formatDate(photo.date || photo.createdAt)}</Text>
                    {photo.weight && (
                      <View style={styles.photoWeightBadge}>
                        <Text style={styles.photoWeightText}>{photo.weight} kg</Text>
                      </View>
                    )}
                    {photo.notes && (
                      <Text style={styles.photoNotes} numberOfLines={2}>{photo.notes}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Add Measurement Modal */}
      <Modal
        visible={showMeasurementModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMeasurementModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ajouter une nouvelle mesure</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Poids (kg) *</Text>
              <TextInput
                style={styles.textInput}
                value={measurementForm.weight}
                onChangeText={(text) => setMeasurementForm(prev => ({ ...prev, weight: text }))}
                placeholder="Ex: 75.5"
                keyboardType="numeric"
                maxLength={5}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tour de taille (cm) *</Text>
              <TextInput
                style={styles.textInput}
                value={measurementForm.waistSize}
                onChangeText={(text) => setMeasurementForm(prev => ({ ...prev, waistSize: text }))}
                placeholder="Ex: 85.0"
                keyboardType="numeric"
                maxLength={5}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes (optionnel)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={measurementForm.notes}
                onChangeText={(text) => setMeasurementForm(prev => ({ ...prev, notes: text }))}
                placeholder="Notes..."
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {measurementForm.error ? (
              <Text style={styles.errorText}>{measurementForm.error}</Text>
            ) : null}

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowMeasurementModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.submitButton, measurementForm.saving && styles.submitButtonDisabled]}
                onPress={handleMeasurementSubmit}
                disabled={measurementForm.saving}
              >
                <LinearGradient
                  colors={['#16a34a', '#3b82f6']}
                  style={styles.submitButtonGradient}
                >
                  <Text style={styles.submitButtonText}>
                    {measurementForm.saving ? 'Sauvegarde...' : 'Ajouter'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Photo Modal */}
      <Modal
        visible={showPhotoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPhotoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ajouter une photo de progression</Text>
            
            {/* Photo Upload */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Photo *</Text>
              <TouchableOpacity 
                style={styles.photoSelector}
                onPress={handlePhotoSelection}
              >
                {photoForm.preview ? (
                  <Image source={{ uri: photoForm.preview }} style={styles.photoPreview} />
                ) : (
                  <Text style={styles.photoSelectorText}>Sélectionner une photo</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Poids actuel (optionnel)</Text>
              <TextInput
                style={styles.textInput}
                value={photoForm.weight}
                onChangeText={(text) => setPhotoForm(prev => ({ ...prev, weight: text }))}
                placeholder="Ex: 75.5"
                keyboardType="numeric"
                maxLength={5}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes (optionnel)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={photoForm.notes}
                onChangeText={(text) => setPhotoForm(prev => ({ ...prev, notes: text }))}
                placeholder="Comment vous sentez-vous aujourd'hui ?"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {photoForm.error ? (
              <Text style={styles.errorText}>{photoForm.error}</Text>
            ) : null}

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowPhotoModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.submitButton, photoForm.uploading && styles.submitButtonDisabled]}
                onPress={handlePhotoSubmit}
                disabled={photoForm.uploading || !photoForm.selectedPhoto}
              >
                <LinearGradient
                  colors={photoForm.uploading ? ['#BDBDBD', '#9E9E9E'] : ['#8BC34A', '#689F38']}
                  style={styles.submitButtonGradient}
                >
                  <Text style={styles.submitButtonText}>
                    {photoForm.uploading ? 'Téléchargement...' : 'Ajouter'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Espace pour la navigation fixe en bas (hauteur nav + safe area + marge)
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginLeft: 8,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  progressCardsSection: {
    margin: 20,
    marginTop: 0,
  },
  combinedProgressCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  measurementSection: {
    marginBottom: 20,
  },
  measurementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  measurementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  measurementItem: {
    alignItems: 'center',
    flex: 1,
  },
  measurementLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  measurementValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  currentWeightValue: {
    color: '#10b981',
  },
  currentWaistValue: {
    color: '#60a5fa',
  },
  measurementUnit: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  currentWeightUnit: {
    color: '#10b981',
  },
  currentWaistUnit: {
    color: '#60a5fa',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 20,
  },
  addMeasurementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dcfce7',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    margin: 20,
    marginTop: 0,
    gap: 8,
  },
  addMeasurementText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#166534',
  },
  photosSection: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  photosTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  photosSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 20,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  addPhotoButton: {
    width: (width - 72) / 2,
    height: 192,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  photoCard: {
    width: (width - 72) / 2,
    height: 192,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 8,
  },
  photoDeleteButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.8)',
    borderRadius: 16,
    padding: 8,
  },
  photoInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
  },
  photoDate: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  photoWeightBadge: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  photoWeightText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  photoNotes: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 384,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C340E',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2C340E',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.colors.text.primary,
    minHeight: 48,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  photoSelector: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  photoSelectorText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  photoPreview: {
    width: 128,
    height: 128,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#757575',
  },
  submitButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ProgressScreen;