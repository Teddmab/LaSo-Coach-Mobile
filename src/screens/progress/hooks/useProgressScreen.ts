import { useState, useEffect } from 'react';
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
      
      try {
        const progressRes = await api.get('/progress/overview');
        if (progressRes.data?.success && progressRes.data?.data) {
          const data = progressRes.data.data;
          setProfile(data.profile?.profile || data.profile);
          setMeasurements(data.measurements || []);
          setProgressPhotos(data.progressPhotos || []);
          
          const profileData = data.profile?.profile || data.profile;
          if (profileData) {
            setInitialMeasurements({
              weight: profileData.initialWeight,
              waistSize: profileData.initialWaistSize,
              date: profileData.createdAt || new Date().toISOString(),
            });
          }
          return;
        }
      } catch (progressError) {
        console.log('[ProgressScreen] ⚠️ Progress overview endpoint failed, trying individual endpoints');
      }
      
      const [profileRes, measurementsRes, photosRes] = await Promise.allSettled([
        ProfileApi.getProfile(),
        api.get('/onboarding/measurements'),
        ProgressPhotosApi.getProgressPhotos(),
      ]);

      const profileData = profileRes.status === 'fulfilled' ? profileRes.value : null;
      const measurementsData = measurementsRes.status === 'fulfilled'
        ? (measurementsRes.value.data?.data?.measurements || measurementsRes.value.data?.measurements || [])
        : [];
      const photosData = photosRes.status === 'fulfilled'
        ? (photosRes.value.success ? (photosRes.value.data || []) : [])
        : [];

      setProfile(profileData);
      setMeasurements(measurementsData);
      setProgressPhotos(photosData);
      
      if (profileData) {
        setInitialMeasurements({
          weight: (profileData as any).initialWeight,
          waistSize: (profileData as any).initialWaistSize,
          date: (profileData as any).createdAt || new Date().toISOString(),
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

      const result = await ProgressPhotosApi.addProgressPhoto(formData);

      if (result.success) {
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
      } else {
        setPhotoForm(prev => ({ 
          ...prev, 
          error: result.error || 'Erreur lors de l\'ajout de la photo',
          uploading: false,
        }));
      }
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
              await api.delete(`/progress-photos/${photoId}`);
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
    const photoUrl = photo.url || photo.imageUrl;
    if (!photoUrl) return null;
    return photoUrl.startsWith('http') 
      ? photoUrl 
      : `${(API_CONFIG as any).BASE_URL?.replace('/api/v1', '') || ''}${photoUrl}`;
  };

  const getAvatarUrl = (avatarPath?: string | null): string | null => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith('http')) return avatarPath;
    const base = API_CONFIG.BASE_URL || '';
    const root = base.replace(/\/api\/v1$/, '');
    return `${root}${avatarPath.startsWith('/') ? '' : '/'}${avatarPath}`;
  };

  const currentWeight = getCurrentWeight(measurements, profile?.profile?.weight);
  const currentWaistSize = getCurrentWaistSize(measurements, profile?.profile?.waistSize);
  const chartData = generateChartData(initialMeasurements, measurements);

  return {
    activeTab,
    setActiveTab,
    profile,
    profileData,
    initialMeasurements,
    measurements,
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

