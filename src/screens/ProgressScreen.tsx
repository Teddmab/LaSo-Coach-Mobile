import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Image, TouchableOpacity, Alert, Dimensions, Modal, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import AppHeader from '../components/AppHeader';
import SubscriptionBanner from '../components/SubscriptionBanner';
import ProgressChart from '../components/ProgressChart';
import { ProgressScreenProps, ProgressPhoto } from './progress/types';
import { useProgressScreen } from './progress/hooks/useProgressScreen';
import ProgressCard from './progress/components/ProgressCard';
import MeasurementModal from './progress/components/MeasurementModal';
import MeasurementHistoryBottomSheet from '../components/progress/MeasurementHistoryBottomSheet';
import MeasurementComparisonBottomSheet from '../components/progress/MeasurementComparisonBottomSheet';
import { ShimmerCard } from '../components/Shimmer';

const { width } = Dimensions.get('window');

const formatPhotoDate = (dateString?: string | null) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const ProgressScreen: React.FC<ProgressScreenProps> = ({
  user,
  onTabPress,
  onSubscriptionRenew,
  onFAQPress,
}) => {
  const [selectedPhotoForDescription, setSelectedPhotoForDescription] = useState<ProgressPhoto | null>(null);
  const {
    profile,
    profileData,
    initialMeasurements,
    measurements,
    combinedMeasurements,
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
    initialProgressPhoto,
    getAvatarUrl,
    getPhotoUrl,
    progressPhotos,
    currentWeight,
    currentWaistSize,
    chartData,
  } = useProgressScreen(onSubscriptionRenew);

  const sortedPhotosByDate = useMemo(() =>
    progressPhotos && progressPhotos.length > 0
      ? [...progressPhotos].sort((a, b) => new Date(a.createdAt || a.date || 0).getTime() - new Date(b.createdAt || b.date || 0).getTime())
      : [],
    [progressPhotos]
  );

  /** Photos avec l'initiale toujours en premier (à gauche), puis les suivantes par date — pour grille 2x2 */
  const photosForGrid = useMemo(() => {
    if (!progressPhotos || progressPhotos.length === 0) return [];
    const isInitial = (p: ProgressPhoto) => (p.notes && p.notes.toLowerCase().includes('initial')) || false;
    const initial = progressPhotos.find(isInitial);
    const others = progressPhotos.filter((p) => !isInitial(p)).sort((a, b) => new Date(a.createdAt || a.date || 0).getTime() - new Date(b.createdAt || b.date || 0).getTime());
    return initial ? [initial, ...others] : others;
  }, [progressPhotos]);

  const getPhotoDescription = (photo: ProgressPhoto): string => {
    const isInitial = (p: ProgressPhoto) => (p.notes && p.notes.toLowerCase().includes('initial')) || false;
    const idx = sortedPhotosByDate.findIndex((p) => p.id === photo.id || p.createdAt === photo.createdAt);
    if (idx < 0) {
      const w = photo.weight != null ? `${photo.weight} kg` : '';
      return w ? `Poids: ${w} (${formatPhotoDate(photo.createdAt || photo.date)})` : formatPhotoDate(photo.createdAt || photo.date);
    }
    if (idx === 0 || isInitial(photo)) {
      const w = initialMeasurements?.weight ?? photo.weight;
      const waist = initialMeasurements?.waistSize;
      const parts = [w != null ? `Poids: ${w} kg` : '', waist != null ? `Tour de taille: ${waist} cm` : ''].filter(Boolean);
      return `Photo initiale. ${parts.join(', ')} (${formatPhotoDate(photo.createdAt || photo.date)})`;
    }
    const prev = sortedPhotosByDate[idx - 1];
    const prevWeight = prev?.weight ?? (isInitial(prev) ? initialMeasurements?.weight : null) ?? prev?.weight;
    const currWeight = photo.weight;
    const prevWaist = initialMeasurements?.waistSize ?? null;
    const currMeas = combinedMeasurements?.find((m) => {
      const mDate = m.date || m.createdAt;
      const pDate = photo.createdAt || photo.date;
      return mDate && pDate && new Date(mDate).getTime() === new Date(pDate).getTime();
    });
    const currWaist = currMeas?.waistSize ?? null;
    const diffKg = currWeight != null && prevWeight != null ? currWeight - prevWeight : null;
    const diffCm = currWaist != null && prevWaist != null ? currWaist - prevWaist : null;
    const improvements: string[] = [];
    if (diffKg != null && diffKg !== 0) improvements.push(diffKg < 0 ? `${Math.abs(diffKg).toFixed(1)} kg en moins` : `+${diffKg.toFixed(1)} kg`);
    if (diffCm != null && diffCm !== 0) improvements.push(diffCm < 0 ? `${Math.abs(diffCm).toFixed(0)} cm en moins` : `+${diffCm} cm`);
    const desc = improvements.length > 0 ? `Amélioration depuis la précédente: ${improvements.join(', ')}.` : 'Mesure suivante.';
    return `${desc} Poids: ${currWeight} kg${currWaist != null ? `, Tour de taille: ${currWaist} cm` : ''} (${formatPhotoDate(photo.createdAt || photo.date)})`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.sectionContainer}>
            <ShimmerCard />
            <ShimmerCard />
            <ShimmerCard />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const rawAvatar = profileData?.avatar 
    || profile?.avatar 
    || profile?.Profile?.avatar 
    || user?.avatar;
  const avatarSource = rawAvatar ? (getAvatarUrl(rawAvatar) || undefined) : undefined;

  return (
    <>
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
        {/* En-tête de page */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Ma progression</Text>
          <Text style={styles.pageSubtitle}>Suivez votre évolution poids et tour de taille</Text>
        </View>

        {/* Section 1 : Résumé (où j'en suis) */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Résumé</Text>
          <ProgressCard
            initialWeight={profile?.initialWeight ?? profile?.Profile?.initialWeight ?? null}
            currentWeight={currentWeight}
            targetWeight={profile?.targetWeight ?? profile?.Profile?.targetWeight ?? null}
            initialWaistSize={profile?.initialWaistSize ?? profile?.Profile?.initialWaistSize ?? null}
            currentWaistSize={currentWaistSize}
            targetWaistSize={profile?.targetWaistSize ?? profile?.Profile?.targetWaistSize ?? null}
          />
        </View>

        {/* Section 2 : Historique des mesures (graphique + tableau) */}
        <View style={styles.section}>
          <ProgressChart 
          chartData={chartData}
          initialProgressPhoto={initialProgressPhoto}
          initialMeasurements={(() => {
            // Toujours utiliser les valeurs du profil si initialMeasurements est null ou incomplet
            const profileInitialWeight = profile?.initialWeight ?? profile?.Profile?.initialWeight;
            const profileInitialWaistSize = profile?.initialWaistSize ?? profile?.Profile?.initialWaistSize;
            
            // Si initialMeasurements existe et a des valeurs, l'utiliser
            if (initialMeasurements && (initialMeasurements.weight || initialMeasurements.waistSize)) {
              return {
                weight: initialMeasurements.weight ?? profileInitialWeight ?? null,
                waistSize: initialMeasurements.waistSize ?? profileInitialWaistSize ?? null,
                date: initialMeasurements.date ?? profile?.createdAt ?? profile?.Profile?.createdAt ?? new Date().toISOString(),
              };
            }
            
            // Sinon, utiliser les valeurs du profil
            if (profileInitialWeight || profileInitialWaistSize) {
              return {
                weight: profileInitialWeight ?? null,
                waistSize: profileInitialWaistSize ?? null,
                date: profile?.createdAt ?? profile?.Profile?.createdAt ?? new Date().toISOString(),
              };
            }
            
            return initialMeasurements;
          })()}
          measurements={combinedMeasurements as any}
          onDataPointPress={(dataPoint: any, index: number) => {
            console.log('[ProgressScreen] 📊 Chart: Data point pressed:', dataPoint, index);
          }}
          onDeleteMeasurement={handleDeleteMeasurement}
          onAddMeasurement={() => {
            setShowMeasurementModal(true);
          }}
          onEditMeasurement={handleEditMeasurement}
          onViewHistory={handleViewHistory}
          onMeasurementClick={handleMeasurementClick}
          getPhotoUrl={getPhotoUrl}
        />
        </View>

        {/* Section 3 : Photos de progression */}
        <View style={[styles.section, styles.sectionPhotos]}>
          <Text style={styles.sectionLabel}>Photos de progression</Text>
          {photosForGrid.length > 0 ? (
            <View style={styles.photosGridContainer}>
              {photosForGrid.map((photo) => {
                const photoUrl = getPhotoUrl(photo);
                if (!photoUrl) return null;
                return (
                  <TouchableOpacity
                    key={photo.id ?? photo.createdAt}
                    style={styles.photoCard}
                    activeOpacity={0.9}
                    onPress={() => setSelectedPhotoForDescription(photo)}
                  >
                    <Image source={{ uri: photoUrl }} style={styles.photoImage} resizeMode="cover" />
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.photosEmpty}>
              <Ionicons name="images-outline" size={40} color="#D1D5DB" />
              <Text style={styles.photosEmptyText}>Aucune photo pour l’instant</Text>
              <Text style={styles.photosEmptySubtext}>Ajoutez des photos à vos mesures pour suivre votre évolution visuelle</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <MeasurementModal
        visible={showMeasurementModal}
        form={measurementForm}
        onFormChange={(updates) => setMeasurementForm(prev => ({ ...prev, ...updates }))}
        onSubmit={handleMeasurementSubmit}
        onClose={() => {
          setShowMeasurementModal(false);
          setMeasurementForm({
            weight: '',
            waistSize: '',
            notes: '',
            error: '',
            saving: false,
            selectedPhoto: null,
            preview: null,
          });
        }}
        onPhotoSelect={handlePhotoSelection}
      />

      {/* Measurement Comparison Bottom Sheet */}
      {showComparisonModal && selectedMeasurementForComparison && (() => {
        // Déterminer la première mesure (initial ou la plus ancienne)
        // Priorité : utiliser la mesure initiale depuis combinedMeasurements car elle contient déjà la photo
        let firstMeasurement: any;
        
        // Si la mesure sélectionnée est la mesure initiale, utiliser la même mesure pour firstMeasurement
        const isSelectedInitial = selectedMeasurementForComparison.isInitial || selectedMeasurementForComparison.id === 'initial';
        
        // Chercher la mesure initiale dans combinedMeasurements (elle contient déjà la photo initiale)
        const initialMeasurementFromCombined = combinedMeasurements.find(m => m.isInitial);
        
        if (isSelectedInitial && initialMeasurementFromCombined) {
          // Si on clique sur la mesure initiale, utiliser la mesure initiale comme firstMeasurement
          const baselinePhotoUrl = initialProgressPhoto 
            ? (initialProgressPhoto.url || initialProgressPhoto.photoUrl || initialProgressPhoto.imageUrl || getPhotoUrl(initialProgressPhoto))
            : null;
            
          // Prioriser selectedMeasurementForComparison.photoUrl (qui a été enrichi dans handleMeasurementClick)
          // puis initialMeasurementFromCombined.photoUrl, puis baselinePhotoUrl
          firstMeasurement = {
            ...initialMeasurementFromCombined,
            photoUrl: selectedMeasurementForComparison.photoUrl ||
              initialMeasurementFromCombined.photoUrl || 
              (initialMeasurementFromCombined as any).url || 
              (initialMeasurementFromCombined as any).imageUrl ||
              baselinePhotoUrl
          };
          
          console.log('[ProgressScreen] 📸 Initial measurement photo:', {
            selectedPhotoUrl: selectedMeasurementForComparison.photoUrl,
            combinedPhotoUrl: initialMeasurementFromCombined.photoUrl,
            baselinePhotoUrl,
            finalPhotoUrl: firstMeasurement.photoUrl
          });
        } else if (initialMeasurementFromCombined) {
          // Utiliser la mesure initiale depuis combinedMeasurements (elle a déjà la photo)
          // Mais s'assurer que la photo est bien présente en utilisant initialProgressPhoto comme fallback
          const baselinePhotoUrl = initialProgressPhoto 
            ? (initialProgressPhoto.url || initialProgressPhoto.photoUrl || initialProgressPhoto.imageUrl || getPhotoUrl(initialProgressPhoto))
            : null;
            
          firstMeasurement = {
            ...initialMeasurementFromCombined,
            photoUrl: initialMeasurementFromCombined.photoUrl || 
              (initialMeasurementFromCombined as any).url || 
              (initialMeasurementFromCombined as any).imageUrl ||
              baselinePhotoUrl
          };
        } else if (initialProgressPhoto || initialMeasurements) {
          // Fallback : construire la mesure initiale si elle n'est pas dans combinedMeasurements
          // Utiliser directement les propriétés de initialProgressPhoto comme dans la version web
          const baselinePhotoUrl = initialProgressPhoto 
            ? (initialProgressPhoto.url || initialProgressPhoto.photoUrl || initialProgressPhoto.imageUrl || getPhotoUrl(initialProgressPhoto))
            : null;
            
          firstMeasurement = {
            id: initialMeasurements ? 'initial' : (initialProgressPhoto?.id || 'initial'),
            weight: initialMeasurements?.weight ?? initialProgressPhoto?.weight ?? null,
            waistSize: initialMeasurements?.waistSize ?? null,
            photoUrl: baselinePhotoUrl,
            notes: 'Mesure initiale',
            createdAt:
              initialMeasurements?.date ||
              initialProgressPhoto?.date ||
              initialProgressPhoto?.createdAt ||
              profile?.createdAt ||
              profile?.Profile?.createdAt,
            date: initialMeasurements?.date ||
              initialProgressPhoto?.date ||
              initialProgressPhoto?.createdAt ||
              profile?.createdAt ||
              profile?.Profile?.createdAt,
          };
        } else if (combinedMeasurements.length > 0) {
          // Fallback : utiliser la plus ancienne mesure si pas de mesure initiale
          const sortedMeasurements = [...combinedMeasurements].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          const oldestMeasurement = sortedMeasurements[0];
          firstMeasurement = {
            ...oldestMeasurement,
            photoUrl: oldestMeasurement.photoUrl || (oldestMeasurement as any).url || null
          };
        }

        if (!firstMeasurement) return null;

        return (
          <MeasurementComparisonBottomSheet
            visible={showComparisonModal}
            firstMeasurement={firstMeasurement}
            selectedMeasurement={selectedMeasurementForComparison}
            onClose={() => {
              setShowComparisonModal(false);
            }}
            getPhotoUrl={getPhotoUrl}
            initialProgressPhoto={initialProgressPhoto}
          />
        );
      })()}

      <MeasurementHistoryBottomSheet
        visible={showHistoryModal}
        measurements={combinedMeasurements}
        initialMeasurements={initialMeasurements}
        onClose={() => setShowHistoryModal(false)}
        getPhotoUrl={getPhotoUrl}
        onEditMeasurement={handleEditMeasurement}
        onDeleteMeasurement={handleDeleteMeasurement}
      />

      {/* Modal description photo de progression */}
      <Modal
        visible={!!selectedPhotoForDescription}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPhotoForDescription(null)}
      >
        <Pressable style={styles.photoModalOverlay} onPress={() => setSelectedPhotoForDescription(null)}>
          <Pressable style={styles.photoModalContent} onPress={() => {}}>
            {selectedPhotoForDescription && (
              <>
                {getPhotoUrl(selectedPhotoForDescription) && (
                  <Image
                    source={{ uri: getPhotoUrl(selectedPhotoForDescription)! }}
                    style={styles.photoModalImage}
                    resizeMode="contain"
                  />
                )}
                <Text style={styles.photoModalDescription}>
                  {getPhotoDescription(selectedPhotoForDescription)}
                </Text>
                <TouchableOpacity
                  style={styles.photoModalCloseBtn}
                  onPress={() => setSelectedPhotoForDescription(null)}
                >
                  <Ionicons name="close" size={24} color="#374151" />
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  sectionContainer: {
    padding: 20,
  },
  content: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  pageHeader: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
  section: {
    marginTop: 24,
  },
  sectionPhotos: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  photosGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoCard: {
    width: (width - 40 - 12) / 2,
    aspectRatio: 120 / 160,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photosEmpty: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  photosEmptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  photosEmptySubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 18,
  },
  photoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  photoModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    maxWidth: width - 40,
    width: '100%',
    maxHeight: '85%',
  },
  photoModalImage: {
    width: '100%',
    height: 280,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  photoModalDescription: {
    marginTop: 12,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  photoModalCloseBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 6,
  },
});

export default ProgressScreen;

