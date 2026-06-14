import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { ProfileApi } from '../../../services/profileApi';
import api from '../../../services/api';
import { API_CONFIG } from '../../../config/apiConfig';
import ProgressPhotosApi from '../../../services/progressPhotosApi';
import DashboardService from '../../../services/dashboardService';
import SubscriptionService from '../../../services/subscriptionService';
import OnboardingApi from '../../../services/onboardingApi';
import {
  Measurement,
  InitialMeasurement,
  ProgressPhoto,
  MeasurementForm,
  UserActivity,
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
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [achievementsData, setAchievementsData] = useState<any>(null);
  const [showMeasurementModal, setShowMeasurementModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [selectedMeasurementForComparison, setSelectedMeasurementForComparison] = useState<Measurement | null>(null);
  const [initialProgressPhoto, setInitialProgressPhoto] = useState<ProgressPhoto | null>(null);
  const [step1Completed, setStep1Completed] = useState(false);
  const [addInitialPhotoLoading, setAddInitialPhotoLoading] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState<Measurement | null>(null);
  const [measurementForm, setMeasurementForm] = useState<MeasurementForm>({
    weight: '',
    waistSize: '',
    notes: '',
    error: '',
    saving: false,
    selectedPhoto: null,
    preview: null,
    activityType: '',
    activityDuration: '',
    activityCalories: '',
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
      const [profileRes, measurementsRes, photosRes, initialPhotoRes, activitiesRes] = await Promise.allSettled([
        ProfileApi.getProfile(),
        api.get('/onboarding/measurements'),
        api.get('/progress-photos'),
        api.get('/progress-photos/initial').catch(() => ({ data: { data: null } })),
        api.get('/user-settings/activities').catch(() => ({ data: { data: [], activities: [] } })),
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

      const activitiesData = activitiesRes.status === 'fulfilled'
        ? (activitiesRes.value.data?.data ?? activitiesRes.value.data?.activities ?? activitiesRes.value.data ?? [])
        : [];
      setActivities(Array.isArray(activitiesData) ? activitiesData : []);

      setProfile(profileData);
      setMeasurements(measurementsData);
      setProgressPhotos(photosData);
      
      // Récupérer la photo initiale si disponible
      let baselinePhoto: any = null;
      if (initialPhotoRes.status === 'fulfilled') {
        const initialPhotoData = initialPhotoRes.value.data?.data ?? initialPhotoRes.value.data;
        baselinePhoto = Array.isArray(initialPhotoData) ? initialPhotoData[0] : initialPhotoData;
      }
      
      // Si pas de photo initiale via l'endpoint /initial, chercher dans la liste des photos
      // La photo initiale peut être identifiée par ses notes "Photo initiale de progression"
      // ou être la photo la plus ancienne
      if (!baselinePhoto || (typeof baselinePhoto === 'object' && !baselinePhoto.id)) {
        // Chercher la photo avec les notes "Photo initiale de progression"
        const photoWithInitialNotes = photosData.find((photo: any) => 
          photo.notes && photo.notes.toLowerCase().includes('photo initiale')
        );
        
        if (photoWithInitialNotes) {
          baselinePhoto = photoWithInitialNotes;
          console.log('[ProgressScreen] 📸 Photo initiale trouvée via notes:', photoWithInitialNotes.id);
        } else if (photosData.length > 0) {
          // Si aucune photo avec notes spécifiques, prendre la plus ancienne
          const sortedPhotos = [...photosData].sort((a: any, b: any) => {
            const dateA = new Date(a.createdAt || a.date || 0);
            const dateB = new Date(b.createdAt || b.date || 0);
            return dateA.getTime() - dateB.getTime();
          });
          baselinePhoto = sortedPhotos[0];
          console.log('[ProgressScreen] 📸 Photo initiale trouvée (plus ancienne):', baselinePhoto.id);
        }
      }
      
      if (baselinePhoto && typeof baselinePhoto === 'object' && baselinePhoto.id) {
        setInitialProgressPhoto(baselinePhoto);
        console.log('[ProgressScreen] ✅ Photo initiale définie:', {
          id: baselinePhoto.id,
          hasUrl: !!(baselinePhoto.url || baselinePhoto.imageUrl),
          url: baselinePhoto.url || baselinePhoto.imageUrl
        });
      } else {
        setInitialProgressPhoto(null);
        console.log('[ProgressScreen] ⚠️ Aucune photo initiale trouvée');
      }
      
      console.log('[ProgressScreen] ✅ Données mises à jour:', {
        profile: !!profileData,
        measurementsCount: measurementsData.length,
        photosCount: photosData.length
      });

      // Vérifier si l'étape 1 (profile_setup) est complétée pour proposer la photo initiale en mise à jour
      try {
        const onboardingRes = await OnboardingApi.getOnboardingProgress();
        const completedSteps = onboardingRes?.data?.completedSteps ?? onboardingRes?.data?.data?.completedSteps ?? [];
        setStep1Completed(Array.isArray(completedSteps) && completedSteps.includes('profile_setup'));
      } catch (_) {
        setStep1Completed(false);
      }
      
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
        const asset: any = result.assets[0];
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

  /** Ajouter la photo initiale (mise à jour pour les utilisateurs ayant complété l'étape 1 sans photo) */
  const handleAddInitialPhoto = async (): Promise<void> => {
    try {
      setAddInitialPhotoLoading(true);
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission refusée',
          'Veuillez autoriser l\'accès à votre galerie pour ajouter la photo initiale.'
        );
        setAddInitialPhotoLoading(false);
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]) {
        setAddInitialPhotoLoading(false);
        return;
      }
      const asset: any = result.assets[0];
      const imageUri = asset.uri;
      let mimeType = asset.type || 'image/jpeg';
      if (mimeType === 'image' || !mimeType.includes('/')) {
        const uri = imageUri || '';
        const fileName = asset.fileName || asset.name || '';
        if (uri.match(/\.(png)$/i) || fileName.match(/\.(png)$/i)) mimeType = 'image/png';
        else if (uri.match(/\.(jpg|jpeg)$/i) || fileName.match(/\.(jpg|jpeg)$/i)) mimeType = 'image/jpeg';
        else mimeType = 'image/jpeg';
      }
      const accessibleUri = await ProfileApi.copyFileToAccessibleLocation(imageUri, mimeType);
      const fileName = asset.fileName || asset.name || `progress_${Date.now()}.jpg`;
      const extension = mimeType.includes('png') ? 'png' : mimeType.includes('gif') ? 'gif' : 'jpg';
      const finalFileName = fileName.includes('.') ? fileName : `${fileName.replace(/\.[^/.]+$/, '')}.${extension}`;
      const accessibleAsset = {
        ...asset,
        uri: accessibleUri,
        type: mimeType,
        mimeType,
        fileName: finalFileName,
      };
      const validation: any = ProgressPhotosApi.validatePhoto(accessibleAsset);
      if (!validation.isValid) {
        Toast.show({ type: 'error', text1: (validation.errors || []).join(', ') });
        setAddInitialPhotoLoading(false);
        return;
      }
      const formData = ProgressPhotosApi.createFormData(accessibleAsset, {
        date: new Date().toISOString(),
        notes: 'Photo initiale de progression',
      });
      const photoResult = await ProgressPhotosApi.addProgressPhoto(formData);
      if (!photoResult.success) {
        Toast.show({ type: 'error', text1: photoResult.error || 'Erreur lors de l\'enregistrement.' });
        setAddInitialPhotoLoading(false);
        return;
      }
      await fetchAllData();
      Toast.show({ type: 'success', text1: 'Photo initiale ajoutée avec succès.' });
    } catch (error) {
      console.error('[ProgressScreen] ❌ handleAddInitialPhoto:', error);
      Toast.show({ type: 'error', text1: 'Erreur lors de l\'ajout de la photo.' });
    } finally {
      setAddInitialPhotoLoading(false);
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

      // Inclure la durée d'activité dans les notes pour que le graphique puisse l'afficher (courbe Activité)
      const activityDurationNum = parseInt(measurementForm.activityDuration || '0', 10);
      const activityPart = (measurementForm.activityType?.trim() && activityDurationNum > 0)
        ? ` ${measurementForm.activityType.trim()} ${activityDurationNum} min`
        : '';
      const notesWithActivity = [measurementForm.notes, activityPart].filter(Boolean).join('').trim() || measurementForm.notes;

      // Si on édite une mesure existante
      if (editingMeasurement && editingMeasurement.id) {
        await api.put(`/onboarding/measurements/${editingMeasurement.id}`, {
          weight,
          ...(waistSize !== undefined && { waistSize }),
          notes: notesWithActivity,
        });
      } else {
        // Nouvelle mesure
        await api.post('/onboarding/measurements', {
          weight,
          ...(waistSize !== undefined && { waistSize }),
          notes: notesWithActivity,
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

      // Enregistrer l'activité physique si des données sont fournies (comme sur la version web)
      const hasAnyActivityField = 
        !!(measurementForm.activityType?.trim()) || 
        !!(measurementForm.activityDuration) || 
        !!(measurementForm.activityCalories);

      if (hasAnyActivityField) {
        const duration = parseInt(measurementForm.activityDuration || '0', 10);
        const caloriesBurned = parseFloat(measurementForm.activityCalories || '0');

        if (!measurementForm.activityType?.trim()) {
          setMeasurementForm(prev => ({ 
            ...prev, 
            error: 'Veuillez renseigner le type d\'activité physique.', 
            saving: false 
          }));
          return;
        } else if (!Number.isInteger(duration) || duration < 1 || duration > 1440) {
          setMeasurementForm(prev => ({ 
            ...prev, 
            error: 'La durée doit être un entier entre 1 et 1440 minutes.', 
            saving: false 
          }));
          return;
        } else if (!Number.isFinite(caloriesBurned) || caloriesBurned <= 0) {
          setMeasurementForm(prev => ({ 
            ...prev, 
            error: 'Veuillez renseigner des calories brûlées valides.', 
            saving: false 
          }));
          return;
        } else {
          try {
            const submissionTimestamp = new Date().toISOString();
            const activityEntryDate = editingMeasurement?.createdAt || submissionTimestamp;
            
            await api.post('/user-settings/activities', {
              type: measurementForm.activityType.trim(),
              duration,
              caloriesBurned,
              date: activityEntryDate,
            });
          } catch (activityErr) {
            console.error('[ProgressScreen] ❌ Error creating physical activity:', activityErr);
            // On continue même si l'activité échoue, comme sur la version web
            Alert.alert('Attention', 'Mesure enregistrée, mais l\'activité physique n\'a pas pu être sauvegardée.');
          }
        }
      }

      await fetchAllData();
      const { reviewEligibilityService } = await import('../../../services/review/reviewEligibilityService');
      const { reviewEngagementBridge } = await import('../../../utils/reviewEngagementBridge');
      void reviewEligibilityService.recordCoreAction();
      reviewEngagementBridge.notify();
      const wasEditing = !!editingMeasurement;
      setMeasurementForm({
        weight: '',
        waistSize: '',
        notes: '',
        error: '',
        saving: false,
        selectedPhoto: null,
        preview: null,
        activityType: '',
        activityDuration: '',
        activityCalories: '',
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
    let preview: string | null = null;
    if (measurement.isFromPhoto && (measurement as any).photoUrl) {
      preview = (measurement as any).photoUrl;
    } else if ((measurement as any).photoUrl) {
      preview = (measurement as any).photoUrl;
    }
    
    setMeasurementForm({
      weight: measurement.weight.toString(),
      waistSize: measurement.waistSize?.toString() || '',
      notes: measurement.notes || '',
      error: '',
      saving: false,
      selectedPhoto: null, // On ne charge pas l'asset complet, juste la preview
      preview: preview,
      activityType: '',
      activityDuration: '',
      activityCalories: '',
    });
    setShowMeasurementModal(true);
  };

  const handleViewHistory = (measurement: Measurement): void => {
    console.log('[ProgressScreen] 📊 View history for measurement:', measurement);
    console.log('[ProgressScreen] 📊 Setting showHistoryModal to true');
    setShowHistoryModal(true);
  };

  const handleMeasurementClick = (measurement: Measurement): void => {
    // Si c'est la mesure initiale, on peut quand même l'afficher pour voir les détails
    // ou la comparer avec une autre mesure si nécessaire
    const sortedMeasurements = [...combinedMeasurements].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const firstMeasurement = sortedMeasurements[0];
    
    // Enrichir la mesure avec photoUrl si disponible
    // Pour la mesure initiale, utiliser initialProgressPhoto comme source principale
    let photoUrl = measurement.photoUrl || (measurement as any).url || (measurement as any).imageUrl;
    
    // Si c'est la mesure initiale et qu'on n'a pas d'URL, utiliser initialProgressPhoto
    if ((measurement.isInitial || measurement.id === 'initial') && !photoUrl && initialProgressPhoto) {
      photoUrl = initialProgressPhoto.url || 
        (initialProgressPhoto as any).photoUrl ||
        initialProgressPhoto.imageUrl ||
        getPhotoUrl(initialProgressPhoto);
    }
    
    // Fallback avec photoId si disponible
    if (!photoUrl && measurement.photoId) {
      photoUrl = getPhotoUrl({ id: measurement.photoId, url: null, imageUrl: null } as unknown as ProgressPhoto);
    }
    
    const enrichedMeasurement = {
      ...measurement,
      photoUrl: photoUrl || null
    };
    
    setSelectedMeasurementForComparison(enrichedMeasurement);
    setShowComparisonModal(true);
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
    
    // Ajouter la mesure initiale si elle existe et a des valeurs
    if (initialMeasurements && (initialMeasurements.weight || initialMeasurements.waistSize)) {
      // Vérifier qu'elle n'existe pas déjà dans les mesures
      const hasInitialInMeasurements = allMeasurements.some(m => m.isInitial);
      if (!hasInitialInMeasurements) {
        // Récupérer l'URL de la photo initiale si elle existe
        let initialPhotoUrl: string | undefined = undefined;
        if (initialProgressPhoto) {
          const photoUrl = getPhotoUrl(initialProgressPhoto);
          if (photoUrl) {
            initialPhotoUrl = photoUrl;
          }
        }
        
        allMeasurements.push({
          id: 'initial',
          weight: initialMeasurements.weight || 0,
          waistSize: initialMeasurements.waistSize || 0,
          notes: 'Mesure initiale',
          createdAt: initialMeasurements.date || profile?.createdAt || profile?.Profile?.createdAt || new Date().toISOString(),
          isInitial: true,
          photoUrl: initialPhotoUrl,
        });
      }
    }
    
    // Add progress photos that have weight as measurements
    // Dans la version web, les photos avec poids apparaissent dans le tableau des mesures
    // Mais on doit éviter les doublons : si une mesure existe déjà avec le même poids et la même date,
    // on enrichit la mesure existante avec la photo au lieu de créer une nouvelle entrée
    progressPhotos.forEach(photo => {
      if (photo.weight && photo.weight > 0) {
        const photoUrl = getPhotoUrl(photo);
        const photoDate = photo.createdAt || photo.date || new Date().toISOString();
        
        // Vérifier si une mesure existe déjà avec le même poids et la même date (à 1 jour près)
        // ou si une mesure a déjà le même photoId
        const photoDateObj = new Date(photoDate);
        const existingMeasurementIndex = allMeasurements.findIndex(m => {
          if (m.isInitial) return false; // Ne pas remplacer la mesure initiale
          
          // Si la mesure a déjà le même photoId, c'est un doublon
          if (photo.id && m.photoId === photo.id) {
            return true;
          }
          
          const measurementDateObj = new Date(m.createdAt || m.date || m.updatedAt || '');
          const dateDiff = Math.abs(photoDateObj.getTime() - measurementDateObj.getTime());
          const daysDiff = dateDiff / (1000 * 60 * 60 * 24);
          
          // Si la date est à moins de 1 jour d'écart et le poids correspond (tolérance de 0.1 kg)
          return daysDiff < 1 && Math.abs((m.weight || 0) - (photo.weight ?? 0)) < 0.1;
        });
        
        if (existingMeasurementIndex >= 0) {
          // Enrichir la mesure existante avec la photo
          const existingMeasurement = allMeasurements[existingMeasurementIndex];
          allMeasurements[existingMeasurementIndex] = {
            ...existingMeasurement,
            photoUrl: photoUrl || existingMeasurement.photoUrl,
            photoId: photo.id || existingMeasurement.photoId,
            isFromPhoto: true, // Marquer comme venant d'une photo
          };
        } else {
          // Aucune mesure correspondante trouvée, ajouter la photo comme nouvelle mesure
          allMeasurements.push({
            id: photo.id || `photo-${photo.createdAt}`,
            weight: photo.weight,
            waistSize: null as any, // Photos don't have waist size, use null
            notes: photo.notes || 'Photo de progression',
            createdAt: photoDate,
            isFromPhoto: true, // Flag to identify it came from a photo
            photoUrl: photoUrl || undefined,
            photoId: photo.id,
          });
        }
      }
    });
    
    // Sort by date (most recent first, but initial measurement stays on top)
    return allMeasurements.sort((a, b) => {
      // La mesure initiale reste toujours en première position
      if (a.isInitial) return -1;
      if (b.isInitial) return 1;
      
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [measurements, progressPhotos, initialMeasurements, profile, initialProgressPhoto, getPhotoUrl]);

  const currentWeight = getCurrentWeight(combinedMeasurements, profile?.Profile?.weight);
  const currentWaistSize = getCurrentWaistSize(combinedMeasurements, profile?.Profile?.waistSize);
  const chartData = generateChartData(initialMeasurements, combinedMeasurements, activities);

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
    handleMeasurementClick,
    showComparisonModal,
    setShowComparisonModal,
    selectedMeasurementForComparison,
    setSelectedMeasurementForComparison,
    initialProgressPhoto,
    getAvatarUrl,
    getPhotoUrl,
    currentWeight,
    currentWaistSize,
    chartData,
    showAddInitialPhotoPrompt: step1Completed && !initialProgressPhoto,
    handleAddInitialPhoto,
    addInitialPhotoLoading,
  };
};

