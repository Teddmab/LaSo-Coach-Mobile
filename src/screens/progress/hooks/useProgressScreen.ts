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
  PhotoForm,
  ProgressTab,
} from '../types';
import { getCurrentWeight, getCurrentWaistSize, generateChartData } from '../utils/progressUtils';

export const useProgressScreen = (
  onSubscriptionRenew?: () => void
) => {
  const [activeTab, setActiveTab] = useState<ProgressTab>('measurements');
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
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [measurementForm, setMeasurementForm] = useState<MeasurementForm>({
    weight: '',
    waistSize: '',
    notes: '',
    error: '',
    saving: false,
  });
  const [photoForm, setPhotoForm] = useState<PhotoForm>({
    weight: '',
    notes: '',
    selectedPhoto: null,
    preview: null,
    uploading: false,
    error: '',
  });

  // Fetch profile data for avatar
  useEffect(() => {
    const fetchProfileForAvatar = async (): Promise<void> => {
      try {
        const data = await ProfileApi.getProfile();
        setProfileData(data);
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
        setInitialMeasurements({
          weight: profile.initialWeight,
          waistSize: profile.initialWaistSize,
          date: profile.createdAt || (profileData as any).createdAt || new Date().toISOString(),
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

  const handleMeasurementSubmit = async (): Promise<void> => {
    try {
      setMeasurementForm(prev => ({ ...prev, saving: true, error: '' }));

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

      await api.post('/onboarding/measurements', {
        weight,
        waistSize,
        notes: measurementForm.notes,
      });

      await fetchAllData();
      setMeasurementForm({
        weight: '',
        waistSize: '',
        notes: '',
        error: '',
        saving: false,
      });
      setShowMeasurementModal(false);
      Alert.alert('Succès', 'Mesure ajoutée avec succès!');
    } catch (error) {
      console.error('[ProgressScreen] ❌ Error adding measurement:', error);
      setMeasurementForm(prev => ({ 
        ...prev, 
        error: 'Erreur lors de l\'ajout de la mesure',
        saving: false,
      }));
    }
  };

  const handlePhotoSubmit = async (): Promise<void> => {
    try {
      setPhotoForm(prev => ({ ...prev, uploading: true, error: '' }));

      if (!photoForm.selectedPhoto) {
        setPhotoForm(prev => ({ ...prev, error: 'Veuillez sélectionner une photo', uploading: false }));
        return;
      }

      console.log('📤 Soumission photo - selectedPhoto:', {
        hasPhoto: !!photoForm.selectedPhoto,
        uri: photoForm.selectedPhoto?.uri ? photoForm.selectedPhoto.uri.substring(0, 50) + '...' : 'none',
        type: photoForm.selectedPhoto?.type,
        fileName: photoForm.selectedPhoto?.fileName,
      });

      const validation: any = ProgressPhotosApi.validatePhoto(photoForm.selectedPhoto);
      console.log('🔍 Résultat validation:', validation);
      
      if (!validation.isValid) {
        const errorMessage = (validation.errors || []).join(', ');
        console.error('❌ Validation échouée:', errorMessage);
        setPhotoForm(prev => ({ 
          ...prev, 
          error: errorMessage,
          uploading: false,
        }));
        return;
      }

      const formData = ProgressPhotosApi.createFormData(photoForm.selectedPhoto, {
        weight: photoForm.weight,
        notes: photoForm.notes,
      });

      // Utiliser directement l'API comme dans la version web
      const response = await api.post('/progress-photos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('[ProgressScreen] 📸 Photo ajoutée, réponse:', {
        success: response.data?.success,
        data: response.data?.data,
        fullResponse: response.data
      });

      // Rafraîchir les photos comme dans la version web (fetchProgressPhotos)
      // Le frontend web appelle fetchProgressPhotos() après l'ajout
      await fetchAllData();
      
      setPhotoForm({
        weight: '',
        notes: '',
        selectedPhoto: null,
        preview: null,
        uploading: false,
        error: '',
      });
      setShowPhotoModal(false);
      Alert.alert('Succès', 'Photo ajoutée avec succès!');
    } catch (error: any) {
      console.error('[ProgressScreen] ❌ Error adding photo:', error);
      let errorMessage = 'Erreur lors de l\'ajout de la photo';
      if (error.response) {
        errorMessage = error.response.data?.message || errorMessage;
      } else if (error.request) {
        errorMessage = 'Problème de connexion. Vérifiez votre internet.';
      } else {
        errorMessage = error.message || errorMessage;
      }
      setPhotoForm(prev => ({ 
        ...prev, 
        error: errorMessage,
        uploading: false,
      }));
    }
  };

  const handlePhotoSelection = async (): Promise<void> => {
    try {
      // Request permissions (comme dans ProfileScreen)
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission refusée',
          'Veuillez autoriser l\'accès à votre galerie pour ajouter une photo de progression'
        );
        return;
      }

      // Launch image picker (même logique que ProfileScreen)
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Désactivé pour éviter les problèmes de URI sur Android
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const imageUri = asset.uri;
        
        console.log('📸 Image asset sélectionné:', {
          uri: imageUri,
          type: asset.type,
          fileName: asset.fileName,
          width: asset.width,
          height: asset.height,
          fileSize: asset.fileSize
        });
        
        // CRITICAL: Déterminer le type MIME correct
        // Parfois ImagePicker retourne juste "image" au lieu de "image/jpeg" ou "image/png"
        let mimeType = asset.type || 'image/jpeg';
        
        // Si le type est juste "image" sans sous-type, déterminer depuis l'URI ou fileName
        if (mimeType === 'image' || !mimeType.includes('/')) {
          console.log('⚠️ Type MIME incomplet, détermination depuis URI/fileName...');
          const uri = imageUri || '';
          const fileName = asset.fileName || asset.name || '';
          
          if (uri.match(/\.(png)$/i) || fileName.match(/\.(png)$/i)) {
            mimeType = 'image/png';
            console.log('✅ Type déterminé: image/png');
          } else if (uri.match(/\.(jpg|jpeg)$/i) || fileName.match(/\.(jpg|jpeg)$/i)) {
            mimeType = 'image/jpeg';
            console.log('✅ Type déterminé: image/jpeg');
          } else if (uri.match(/\.(gif)$/i) || fileName.match(/\.(gif)$/i)) {
            mimeType = 'image/gif';
            console.log('✅ Type déterminé: image/gif');
          } else {
            // Par défaut JPEG
            mimeType = 'image/jpeg';
            console.log('✅ Type par défaut: image/jpeg');
          }
        }
        
        console.log('📸 Type MIME final:', mimeType);
        
        // CRITICAL: Copier le fichier vers un emplacement accessible (comme dans ProfileScreen)
        // Cela résout les problèmes de "Network request failed" sur Android avec content:// URIs
        console.log('📁 Préparation du fichier pour upload...');
        
        // Utiliser ProfileApi.copyFileToAccessibleLocation (déjà importé)
        const accessibleUri = await ProfileApi.copyFileToAccessibleLocation(imageUri, mimeType);
        
        // Préparer le nom de fichier avec la bonne extension
        const fileName = asset.fileName || asset.name || `progress_${Date.now()}.jpg`;
        const extension = mimeType.includes('png') ? 'png' : 
                         mimeType.includes('gif') ? 'gif' : 
                         'jpg';
        const finalFileName = fileName.includes('.') 
          ? fileName 
          : `${fileName.replace(/\.[^/.]+$/, '')}.${extension}`;
        
        // Créer un objet asset avec l'URI accessible
        // CRITICAL: S'assurer que le type MIME est bien défini pour la validation
        const accessibleAsset = {
          ...asset,
          uri: accessibleUri, // Utiliser l'URI accessible
          type: mimeType, // Type MIME explicite pour la validation
          mimeType: mimeType, // Aussi en mimeType pour compatibilité
          fileName: finalFileName,
          // S'assurer que fileSize est présent si disponible
          fileSize: asset.fileSize || asset.size,
        };
        
        console.log('✅ Fichier préparé:', {
          originalUri: imageUri.substring(0, 50) + '...',
          accessibleUri: accessibleUri.substring(0, 50) + '...',
          type: mimeType,
          mimeType: mimeType,
          name: finalFileName,
          fileSize: accessibleAsset.fileSize
        });
        
        console.log('✅ Asset accessible créé:', {
          hasUri: !!accessibleAsset.uri,
          hasType: !!accessibleAsset.type,
          hasMimeType: !!accessibleAsset.mimeType,
          hasFileName: !!accessibleAsset.fileName,
          type: accessibleAsset.type,
        });
        
        setPhotoForm(prev => ({
          ...prev,
          selectedPhoto: accessibleAsset,
          preview: accessibleUri, // Utiliser l'URI accessible pour la prévisualisation
        }));
      }
    } catch (error) {
      console.error('[ProgressScreen] ❌ Error selecting photo:', error);
      Alert.alert('Erreur', 'Erreur lors de la sélection de la photo');
    }
  };

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

  const handleDeletePhoto = async (photoId: string): Promise<void> => {
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
              // Utiliser directement l'API comme dans la version web
              await api.delete(`/progress-photos/${photoId}`);
              // Rafraîchir les photos comme dans la version web
              await fetchAllData();
              Alert.alert('Succès', 'Photo supprimée avec succès!');
            } catch (error) {
              console.error('[ProgressScreen] ❌ Error deleting photo:', error);
              Alert.alert('Erreur', 'Erreur lors de la suppression de la photo');
            }
          },
        },
      ]
    );
  };

  const getPhotoUrl = (photo: ProgressPhoto): string | null => {
    // Adapter comme la version web: photo.url.startsWith('http') ? photo.url : `${API_CONFIG.baseURL?.replace('/api/v1', '')}${photo.url}`
    const photoUrl = photo.url || photo.imageUrl;
    
    if (!photoUrl) {
      return null;
    }
    
    // Si l'URL est déjà absolue, la retourner telle quelle
    if (photoUrl.startsWith('http')) {
      return photoUrl;
    }
    
    // Construire l'URL complète comme dans la version web
    const baseUrl = API_CONFIG.BASE_URL || '';
    const rootUrl = baseUrl.replace('/api/v1', '');
    const fullUrl = `${rootUrl}${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`;
    
    return fullUrl;
  };

  const getAvatarUrl = (avatarPath?: string | null): string | null => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('http')) return avatarPath;
    const base = API_CONFIG.BASE_URL || '';
    const root = base.replace(/\/api\/v1$/, '');
    return `${root}${avatarPath.startsWith('/') ? '' : '/'}${avatarPath}`;
  };

  // Combine measurements with progress photos that have weight
  // Photos with weight should appear in recent measurements (comme dans la version web)
  const combinedMeasurements = React.useMemo(() => {
    const allMeasurements = [...measurements];
    
    // Add progress photos that have weight as measurements
    // Dans la version web, les photos avec poids apparaissent dans le tableau des mesures
    progressPhotos.forEach(photo => {
      if (photo.weight && photo.weight > 0) {
        // Convert photo to measurement format
        // Note: Photos may not have waistSize, so we use null/undefined instead of 0
        allMeasurements.push({
          id: photo.id || `photo-${photo.createdAt}`,
          weight: photo.weight,
          waistSize: null as any, // Photos don't have waist size, use null
          notes: photo.notes || 'Photo de progression',
          createdAt: photo.createdAt || photo.date || new Date().toISOString(),
          isFromPhoto: true, // Flag to identify it came from a photo
        });
      }
    });
    
    // Sort by date (most recent first)
    return allMeasurements.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [measurements, progressPhotos]);

  const currentWeight = getCurrentWeight(combinedMeasurements, profile?.profile?.weight);
  const currentWaistSize = getCurrentWaistSize(combinedMeasurements, profile?.profile?.waistSize);
  const chartData = generateChartData(initialMeasurements, combinedMeasurements);

  return {
    activeTab,
    setActiveTab,
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
    showPhotoModal,
    setShowPhotoModal,
    measurementForm,
    setMeasurementForm,
    photoForm,
    setPhotoForm,
    handleRefresh,
    handleSubscriptionRenew,
    handleMeasurementSubmit,
    handlePhotoSubmit,
    handlePhotoSelection,
    handleDeleteMeasurement,
    handleDeletePhoto,
    getPhotoUrl,
    getAvatarUrl,
    currentWeight,
    currentWaistSize,
    chartData,
  };
};

