import React from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../constants/theme';
import AppHeader from '../components/AppHeader';
import SubscriptionBanner from '../components/SubscriptionBanner';
import ProgressChart from '../components/ProgressChart';
import AchievementsCard from '../components/dashboard/AchievementsCard';
import { ProgressScreenProps } from './progress/types';
import { useProgressScreen } from './progress/hooks/useProgressScreen';
import ProgressTabs from './progress/components/ProgressTabs';
import ProgressCard from './progress/components/ProgressCard';
import PhotosGrid from './progress/components/PhotosGrid';
import MeasurementModal from './progress/components/MeasurementModal';
import PhotoModal from './progress/components/PhotoModal';
import { ShimmerCard } from '../components/Shimmer';

const ProgressScreen: React.FC<ProgressScreenProps> = ({
  user,
  onTabPress,
  onSubscriptionRenew,
  onFAQPress,
}) => {
  const {
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
        <ProgressTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <ProgressCard
          initialWeight={profile?.initialWeight ?? profile?.Profile?.initialWeight ?? null}
          currentWeight={currentWeight}
          targetWeight={profile?.targetWeight ?? profile?.Profile?.targetWeight ?? null}
          initialWaistSize={profile?.initialWaistSize ?? profile?.Profile?.initialWaistSize ?? null}
          currentWaistSize={currentWaistSize}
          targetWaistSize={profile?.targetWaistSize ?? profile?.Profile?.targetWaistSize ?? null}
        />

        {activeTab === 'measurements' ? (
          <>
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
              onAddMeasurement={() => setShowMeasurementModal(true)}
            />

            <AchievementsCard
              badgesData={achievementsData}
              onPress={() => {
                if (onTabPress) {
                  onTabPress('achievements');
                }
              }}
              subscriptionData={subscriptionData}
              onSubscriptionRenew={onSubscriptionRenew}
            />
          </>
        ) : (
          <PhotosGrid
            photos={progressPhotos}
            getPhotoUrl={getPhotoUrl}
            onAddPhoto={() => setShowPhotoModal(true)}
            onDeletePhoto={handleDeletePhoto}
          />
        )}
      </ScrollView>

      <MeasurementModal
        visible={showMeasurementModal}
        form={measurementForm}
        onFormChange={(updates) => setMeasurementForm(prev => ({ ...prev, ...updates }))}
        onSubmit={handleMeasurementSubmit}
        onClose={() => setShowMeasurementModal(false)}
      />

      <PhotoModal
        visible={showPhotoModal}
        form={photoForm}
        onFormChange={(updates) => setPhotoForm(prev => ({ ...prev, ...updates }))}
        onPhotoSelect={handlePhotoSelection}
        onSubmit={handlePhotoSubmit}
        onClose={() => setShowPhotoModal(false)}
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

