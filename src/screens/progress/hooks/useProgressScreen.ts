import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ProfileApi } from '../../../services/profileApi';
import api from '../../../services/api';
import { API_CONFIG } from '../../../config/apiConfig';
import ProgressPhotosApi from '../../../services/progressPhotosApi';
import DashboardService from '../../../services/dashboardService';
import SubscriptionService from '../../../services/subscriptionService';
import {
  Measurement,
  InitialMeasurement,
  ProgressPhoto,
  MeasurementForm,
} from '../types';
import { getCurrentWeight, getCurrentWaistSize, generateChartData } from '../utils/progressUtils';

export const useProgressScreen = (
  onSubscriptionRenew?: () => void
) => {
  const [profile, setProfile] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [initialMeasurements, setInitialMeasurements] = useState<InitialMeasurement | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [progressPhotos, setProgressPhotos] = useState<ProgressPhoto[]>([]);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [achievementsData, setAchievementsData] = useState<any>(null);
  const [showMeasurementModal, setShowMeasurementModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState<Measurement | null>(null);
  const [measurementForm, setMeasurementForm] = useState<MeasurementForm>({
    weight: '',
    waistSize: '',
    notes: '',
    error: '',
    saving: false,
    selectedPhoto: null,
    preview: null,
  });

  // Fetch profile data for avatar
  useEffect(() => {
    const fetchProfileForAvatar = async (): Promise<void> => {
      try {
        const data = await ProfileApi.getProfile();
        // Handle case where profile might be null due to Prisma errors
        if (data) {
        setProfileData(data);
        } else {
          console.warn('⚠️ [ProgressScreen] Profile data is null - Prisma error or missing data');
          setProfileData(null);
        }
      } catch (error) {
        console.error('[ProgressScreen] ❌ Error fetching profile for avatar:', error);
        setProfileData(null);
      }
    };
    fetchProfileForAvatar();
  }, []);

  useEffect(() => {
    fetchAllData();
    checkSubscriptionStatus();
    fetchAchievementsData();
  }, []);

  const fetchAchievementsData = async (): Promise<void> => {
    try {
      const data = await DashboardService.getAchievementsSummary();
      setAchievementsData(data);
    } catch (error) {
      console.error('[ProgressScreen] ❌ Error fetching achievements data:', error);
      setAchievementsData(null);
    }
  };

  const handleRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  const fetchAllData = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Comme dans la version web, récupérer les données séparément
      // Le frontend web utilise /progress/overview pour profile/measurements mais récupère les photos séparément
      const [profileRes, measurementsRes, photosRes] = await Promise.allSettled([
        ProfileApi.getProfile(),
        api.get('/onboarding/measurements'),
        api.get('/progress-photos'), // Récupérer les photos séparément comme dans la version web
      ]);

      const profileData = profileRes.status === 'fulfilled' ? profileRes.value : null;
      const measurementsData = measurementsRes.status === 'fulfilled'
        ? (measurementsRes.value.data?.data?.measurements || measurementsRes.value.data?.measurements || [])
        : [];
      
      // Adapter la récupération des photos comme dans la version web
      // La version web utilise: response.data.data || []
      // Le backend retourne: { success: true, data: [...], pagination: {...} }
      const photosData = photosRes.status === 'fulfilled'
        ? (photosRes.value.data?.data || [])
        : [];

      console.log('[ProgressScreen] 📸 Photos récupérées:', {
        count: photosData.length,
        responseStructure: photosRes.status === 'fulfilled' ? {
          hasSuccess: !!photosRes.value.data?.success,
          hasData: !!photosRes.value.data?.data,
          dataType: Array.isArray(photosRes.value.data?.data) ? 'array' : typeof photosRes.value.data?.data,
          dataLength: Array.isArray(photosRes.value.data?.data) ? photosRes.value.data.data.length : 'N/A'
        } : 'failed',
        photos: photosData.map(p => ({
          id: p.id,
          hasUrl: !!(p.url || p.imageUrl),
          hasWeight: !!(p.weight && p.weight > 0),
          weight: p.weight,
          url: p.url || p.imageUrl,
          date: p.date || p.createdAt
        }))
      });

      setProfile(profileData);
      setMeasurements(measurementsData);
      setProgressPhotos(photosData);
      
      console.log('[ProgressScreen] ✅ Données mises à jour:', {
        profile: !!profileData,
        measurementsCount: measurementsData.length,
        photosCount: photosData.length
      });
      
      if (profileData) {
        const profile = (profileData as any).profile || profileData;
        // Récupérer les valeurs initiales avec fallback sur Profile
        const initialWeight = profile.initialWeight ?? profile.Profile?.initialWeight ?? null;
        const initialWaistSize = profile.initialWaistSize ?? profile.Profile?.initialWaistSize ?? null;
        const createdAt = profile.createdAt ?? profile.Profile?.createdAt ?? (profileData as any).createdAt ?? new Date().toISOString();
        
        setInitialMeasurements({
          weight: initialWeight,
          waistSize: initialWaistSize,
          date: createdAt,
        });
      } else {
        setProfile({
          initialWeight: null,
          weight: null,
          goalWeight: null,
          initialWaistSize: null,
          waistSize: null,
          completedChallenges: 0,
          collectedBadges: 0,
        });
        setInitialMeasurements(null);
      }
    } catch (error) {
      console.error('[ProgressScreen] ❌ Error fetching data:', error);
      setProfile({
        initialWeight: null,
        weight: null,
        goalWeight: null,
        initialWaistSize: null,
        waistSize: null,
        completedChallenges: 0,
        collectedBadges: 0,
      });
      setInitialMeasurements(null);
      setMeasurements([]);
      setProgressPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  const checkSubscriptionStatus = async (): Promise<void> => {
    try {
      const data = await SubscriptionService.getSubscriptionStatus();
      setSubscriptionData(data);
    } catch (error) {
      console.error('[ProgressScreen] ❌ Error checking subscription status:', error);
      setSubscriptionData({
        status: 'EXPIRED',
        isExpired: true,
        requiresRenewal: true,
      });
    }
  };

  const handleSubscriptionRenew = (): void => {
    if (onSubscriptionRenew) {
      onSubscriptionRenew();
    }
  };

  const handlePhotoSelection = async (): Promise<void> => {
    try {
      console.log('[ProgressScreen] 📸 handlePhotoSelection called');
      
      // Demander les permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('[ProgressScreen] 📸 Permission status:', status);
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission refusée',
          'Veuillez autoriser l\'accès à votre galerie pour ajouter une photo de progression'
        );
        return;
      }

      console.log('[ProgressScreen] 📸 Launching image library...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });
      
      console.log('[ProgressScreen] 📸 Image picker result:', {
        canceled: result.canceled,
        hasAssets: !!result.assets,
        assetsCount: result.assets?.length || 0,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const imageUri = asset.uri;
        
        let mimeType = asset.type || 'image/jpeg';
        if (mimeType === 'image' || !mimeType.includes('/')) {
          const uri = imageUri || '';
          const fileName = asset.fileName || asset.name || '';
          
          if (uri.match(/\.(png)$/i) || fileName.match(/\.(png)$/i)) {
            mimeType = 'image/png';
          } else if (uri.match(/\.(jpg|jpeg)$/i) || fileName.match(/\.(jpg|jpeg)$/i)) {
            mimeType = 'image/jpeg';
          } else if (uri.match(/\.(gif)$/i) || fileName.match(/\.(gif)$/i)) {
            mimeType = 'image/gif';
          } else {
            mimeType = 'image/jpeg';
          }
        }
        
        const accessibleUri = await ProfileApi.copyFileToAccessibleLocation(imageUri, mimeType);
        const fileName = asset.fileName || asset.name || `progress_${Date.now()}.jpg`;
        const extension = mimeType.includes('png') ? 'png' : 
                         mimeType.includes('gif') ? 'gif' : 
                         'jpg';
        const finalFileName = fileName.includes('.') 
          ? fileName 
          : `${fileName.replace(/\.[^/.]+$/, '')}.${extension}`;
        
        const accessibleAsset = {
          ...asset,
          uri: accessibleUri,
          type: mimeType,
          mimeType: mimeType,
          fileName: finalFileName,
          fileSize: asset.fileSize || asset.size,
        };
        
        setMeasurementForm(prev => ({
          ...prev,
          selectedPhoto: accessibleAsset,
          preview: accessibleUri,
        }));
      }
    } catch (error) {
      console.error('[ProgressScreen] ❌ Error selecting photo:', error);
      Alert.alert('Erreur', 'Erreur lors de la sélection de la photo');
    }
  };

  const handleMeasurementSubmit = async (): Promise<void> => {
    try {
      setMeasurementForm(prev => ({ ...prev, saving: true, error: '' }));

      const weight = parseFloat(measurementForm.weight);
      const waistSize = measurementForm.waistSize ? parseFloat(measurementForm.waistSize) : undefined;

      if (!weight || weight < 10 || weight > 300) {
        setMeasurementForm(prev => ({ ...prev, error: 'Le poids doit être entre 10 et 300 kg.', saving: false }));
        return;
      }

      // Le tour de taille est optionnel, mais s'il est fourni, il doit être valide
      if (waistSize !== undefined && (isNaN(waistSize) || waistSize < 10 || waistSize > 300)) {
        setMeasurementForm(prev => ({ ...prev, error: 'Le tour de taille doit être entre 10 et 300 cm.', saving: false }));
        return;
      }

      // Si on édite une mesure existante
      if (editingMeasurement && editingMeasurement.id) {
        await api.put(`/onboarding/measurements/${editingMeasurement.id}`, {
          weight,
          ...(waistSize !== undefined && { waistSize }),
          notes: measurementForm.notes,
        });
      } else {
        // Nouvelle mesure
        await api.post('/onboarding/measurements', {
          weight,
          ...(waistSize !== undefined && { waistSize }),
          notes: measurementForm.notes,
        });
      }

      // Si une photo est sélectionnée, l'uploader comme photo de progression
      if (measurementForm.selectedPhoto) {
        const validation: any = ProgressPhotosApi.validatePhoto(measurementForm.selectedPhoto);
        if (!validation.isValid) {
          const errorMessage = (validation.errors || []).join(', ');
          setMeasurementForm(prev => ({ ...prev, error: errorMessage, saving: false }));
          return;
        }

        const formData = ProgressPhotosApi.createFormData(measurementForm.selectedPhoto, {
          weight: measurementForm.weight,
          notes: measurementForm.notes,
        });

        await api.post('/progress-photos', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      await fetchAllData();
      const wasEditing = !!editingMeasurement;
      setMeasurementForm({
        weight: '',
        waistSize: '',
        notes: '',
        error: '',
        saving: false,
        selectedPhoto: null,
        preview: null,
      });
      setEditingMeasurement(null);
      setShowMeasurementModal(false);
      Alert.alert('Succès', wasEditing ? 'Mesure modifiée avec succès!' : 'Mesure ajoutée avec succès!');
    } catch (error) {
      console.error('[ProgressScreen] ❌ Error saving measurement:', error);
      setMeasurementForm(prev => ({ 
        ...prev, 
        error: 'Erreur lors de l\'enregistrement de la mesure',
        saving: false,
      }));
    }
  };

  const handleEditMeasurement = (measurement: Measurement): void => {
    setEditingMeasurement(measurement);
    
    // Si la mesure vient d'une photo, charger la photo existante
    let preview = null;
    if (measurement.isFromPhoto && measurement.photoUrl) {
      preview = measurement.photoUrl;
    } else if (measurement.photoUrl) {
      preview = measurement.photoUrl;
    }
    
    setMeasurementForm({
      weight: measurement.weight.toString(),
      waistSize: measurement.waistSize?.toString() || '',
      notes: measurement.notes || '',
      error: '',
      saving: false,
      selectedPhoto: null, // On ne charge pas l'asset complet, juste la preview
      preview: preview,
    });
    setShowMeasurementModal(true);
  };

  const handleViewHistory = (measurement: Measurement): void => {
    console.log('[ProgressScreen] 📊 View history for measurement:', measurement);
    console.log('[ProgressScreen] 📊 Setting showHistoryModal to true');
    setShowHistoryModal(true);
  };

  // Fonctions liées aux photos supprimées - seul l'onglet "Mesures & Statistiques" est disponible

  const handleDeleteMeasurement = async (measurementId: string): Promise<void> => {
    // Check if this measurement comes from a photo
    const measurement = combinedMeasurements.find(m => m.id === measurementId);
    const isFromPhoto = measurement?.isFromPhoto || false;
    
    Alert.alert(
      isFromPhoto ? 'Supprimer la photo' : 'Supprimer la mesure',
      isFromPhoto 
        ? 'Êtes-vous sûr de vouloir supprimer cette photo de progression ?'
        : 'Êtes-vous sûr de vouloir supprimer cette mesure ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              if (isFromPhoto) {
                // Delete the photo instead
                await ProgressPhotosApi.deleteProgressPhoto(measurementId);
                await fetchAllData();
                Alert.alert('Succès', 'Photo supprimée avec succès!');
              } else {
                // Delete the measurement
                await api.delete(`/onboarding/measurements/${measurementId}`);
                await fetchAllData();
                Alert.alert('Succès', 'Mesure supprimée avec succès!');
              }
            } catch (error) {
              console.error('[ProgressScreen] ❌ Error deleting:', error);
              Alert.alert('Erreur', `Erreur lors de la suppression${isFromPhoto ? ' de la photo' : ' de la mesure'}`);
            }
          },
        },
      ]
    );
  };

  // Fonction handleDeletePhoto supprimée - les photos sont gérées via handleDeleteMeasurement
  // Fonction getPhotoUrl supprimée - non nécessaire pour l'onglet "Mesures & Statistiques" uniquement

  const getAvatarUrl = (avatarPath?: string | null): string | null => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('http')) return avatarPath;
    const base = API_CONFIG.BASE_URL || '';
    const root = base.replace(/\/api\/v1$/, '');
    return `${root}${avatarPath.startsWith('/') ? '' : '/'}${avatarPath}`;
  };

  const getPhotoUrl = (photo: ProgressPhoto): string | null => {
    const photoUrl = photo.url || photo.imageUrl;
    if (!photoUrl) return null;
    if (photoUrl.startsWith('http')) return photoUrl;
    const baseUrl = API_CONFIG.BASE_URL || '';
    const rootUrl = baseUrl.replace('/api/v1', '');
    return `${rootUrl}${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`;
  };

  // Combine measurements with progress photos that have weight
  // Photos with weight should appear in recent measurements (comme dans la version web)
  const combinedMeasurements = React.useMemo(() => {
    const allMeasurements = [...measurements];
    
    // Add progress photos that have weight as measurements
    // Dans la version web, les photos avec poids apparaissent dans le tableau des mesures
    progressPhotos.forEach(photo => {
      if (photo.weight && photo.weight > 0) {
        const photoUrl = getPhotoUrl(photo);
        // Convert photo to measurement format
        // Note: Photos may not have waistSize, so we use null/undefined instead of 0
        allMeasurements.push({
          id: photo.id || `photo-${photo.createdAt}`,
          weight: photo.weight,
          waistSize: null as any, // Photos don't have waist size, use null
          notes: photo.notes || 'Photo de progression',
          createdAt: photo.createdAt || photo.date || new Date().toISOString(),
          isFromPhoto: true, // Flag to identify it came from a photo
          photoUrl: photoUrl || undefined,
          photoId: photo.id,
        });
      }
    });
    
    // Sort by date (most recent first)
    return allMeasurements.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [measurements, progressPhotos]);

  const currentWeight = getCurrentWeight(combinedMeasurements, profile?.Profile?.weight);
  const currentWaistSize = getCurrentWaistSize(combinedMeasurements, profile?.Profile?.waistSize);
  const chartData = generateChartData(initialMeasurements, combinedMeasurements);

  return {
    profile,
    profileData,
    initialMeasurements,
    measurements,
    combinedMeasurements,
    progressPhotos,
    subscriptionData,
    loading,
    refreshing,
    achievementsData,
    showMeasurementModal,
    setShowMeasurementModal,
    showHistoryModal,
    setShowHistoryModal,
    measurementForm,
    setMeasurementForm,
    editingMeasurement,
    handleRefresh,
    handleSubscriptionRenew,
    handleMeasurementSubmit,
    handlePhotoSelection,
    handleEditMeasurement,
    handleViewHistory,
    handleDeleteMeasurement,
    getAvatarUrl,
    getPhotoUrl,
    currentWeight,
    currentWaistSize,
    chartData,
  };
};

