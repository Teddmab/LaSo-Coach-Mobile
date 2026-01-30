import React from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Image, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import AppHeader from '../components/AppHeader';
import SubscriptionBanner from '../components/SubscriptionBanner';
import ProgressChart, { RecentMeasurements } from '../components/ProgressChart';
import { ProgressScreenProps } from './progress/types';
import { useProgressScreen } from './progress/hooks/useProgressScreen';
import ProgressTabs from './progress/components/ProgressTabs';
import ProgressCard from './progress/components/ProgressCard';
import MeasurementModal from './progress/components/MeasurementModal';
import MeasurementHistoryBottomSheet from '../components/progress/MeasurementHistoryBottomSheet';
import { ShimmerCard } from '../components/Shimmer';

const { width } = Dimensions.get('window');

const ProgressScreen: React.FC<ProgressScreenProps> = ({
  user,
  onTabPress,
  onSubscriptionRenew,
  onFAQPress,
}) => {
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
    getAvatarUrl,
    getPhotoUrl,
    progressPhotos,
    currentWeight,
    currentWaistSize,
    chartData,
  } = useProgressScreen(onSubscriptionRenew);

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
        <ProgressTabs />

        <ProgressCard
          initialWeight={profile?.initialWeight ?? profile?.Profile?.initialWeight ?? null}
          currentWeight={currentWeight}
          targetWeight={profile?.targetWeight ?? profile?.Profile?.targetWeight ?? null}
          initialWaistSize={profile?.initialWaistSize ?? profile?.Profile?.initialWaistSize ?? null}
          currentWaistSize={currentWaistSize}
          targetWaistSize={profile?.targetWaistSize ?? profile?.Profile?.targetWaistSize ?? null}
        />

        {/* Un seul onglet disponible : Mesures & Statistiques */}
        <ProgressChart 
          chartData={chartData}
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
          getPhotoUrl={getPhotoUrl}
        />

        {/* Photos de progression - à la place de la carte de badge */}
        {progressPhotos && progressPhotos.length > 0 && (
          <View style={styles.photosSection}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photosGrid}
            >
              {progressPhotos.map((photo) => {
                const photoUrl = getPhotoUrl(photo);
                if (!photoUrl) return null;
                
                return (
                  <View key={photo.id} style={styles.photoCard}>
                    <Image source={{ uri: photoUrl }} style={styles.photoImage} resizeMode="cover" />
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Mesures récentes - en bas, en dehors du ProgressChart */}
        <RecentMeasurements
          measurements={combinedMeasurements}
          initialMeasurements={initialMeasurements}
          onEditMeasurement={handleEditMeasurement}
          onViewHistory={handleViewHistory}
          onDeleteMeasurement={handleDeleteMeasurement}
          onAddMeasurement={() => setShowMeasurementModal(true)}
        />
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

      <MeasurementHistoryBottomSheet
        visible={showHistoryModal}
        measurements={combinedMeasurements}
        initialMeasurements={initialMeasurements}
        onClose={() => {
          console.log('[ProgressScreen] 🔴 Closing history modal');
          setShowHistoryModal(false);
        }}
        getPhotoUrl={getPhotoUrl}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  sectionContainer: {
    padding: 20,
  },
  content: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  scrollContent: {
    paddingBottom: 20,
  },
});

export default ProgressScreen;

