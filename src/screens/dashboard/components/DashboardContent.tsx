import React from 'react';
import { View, ScrollView, RefreshControl, StyleSheet, Text } from 'react-native';
import { theme } from '../../../constants/theme';
import ProgressCard from '../../../components/dashboard/ProgressCard';
import ProfileCompletionCard from '../../../components/dashboard/ProfileCompletionCard';
import AchievementsCard from '../../../components/dashboard/AchievementsCard';
import NutritionCard from '../../../components/dashboard/NutritionCard';
import BlurredCard from '../../../components/BlurredCard';
import AgoraContentCard from '../../../components/dashboard/AgoraContentCard';
import LAgoraCard from '../../../components/dashboard/LAgoraCard';
import { Ionicons } from '@expo/vector-icons';
import { ShimmerCard } from '../../../components/Shimmer';

interface DashboardContentProps {
  isProfileComplete: boolean;
  dashboardData: any;
  achievementsData: any;
  subscriptionData: any;
  agendaData: any[];
  communityPosts: any[];
  agendaLoading: boolean;
  communityLoading: boolean;
  refreshing: boolean;
  shouldBlurMenu: boolean;
  onRefresh: () => void;
  onProgressRefresh: () => void;
  onSubscriptionRenew: () => Promise<void>;
  onCompleteProfile: () => void;
  onProfileStepPress: (stepId: number) => void;
  onTabPress: (tabId: string) => void;
  onMealPress: (meal: any) => Promise<void>;
  onPostPress: (post: any) => void;
  onLikePress: (postId: string) => Promise<void>;
  onCommentPress: (postId: string) => void;
  onMarkContentComplete: (contentId: string) => Promise<void>;
  onCompleteDayPress: () => void;
}

const DashboardContent: React.FC<DashboardContentProps> = ({
  isProfileComplete,
  dashboardData,
  achievementsData,
  subscriptionData,
  agendaData,
  communityPosts,
  agendaLoading,
  communityLoading,
  refreshing,
  shouldBlurMenu,
  onRefresh,
  onProgressRefresh,
  onSubscriptionRenew,
  onCompleteProfile,
  onProfileStepPress,
  onTabPress,
  onMealPress,
  onPostPress,
  onLikePress,
  onCommentPress,
  onMarkContentComplete,
  onCompleteDayPress,
}) => {
  // Harmoniser les points de badges sur le Home avec la progression (profil / onboarding)
  const mergedAchievementsData = React.useMemo(() => {
    if (!achievementsData) return achievementsData;

    let totalPoints = achievementsData.totalPoints || 0;

    // Si le backend ne remonte pas encore de points mais que l'on connaît les étapes complétées,
    // on dérive un score local basé sur les points définis dans la carte de complétion du profil.
    if (
      totalPoints === 0 &&
      dashboardData?.onboarding?.data?.completedSteps &&
      Array.isArray(dashboardData.onboarding.data.completedSteps)
    ) {
      const completed = dashboardData.onboarding.data.completedSteps as string[];
      let bonus = 0;

      if (completed.includes('profile_setup')) bonus += 100;
      if (completed.includes('goals_setup')) bonus += 30;
      if (completed.includes('recommandations') || completed.includes('recommendations')) bonus += 20;
      if (completed.includes('appointment')) bonus += 25;

      totalPoints = bonus;
    }

    return {
      ...achievementsData,
      totalPoints,
    };
  }, [achievementsData, dashboardData?.onboarding]);

  return (
    <ScrollView 
      style={styles.content} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Profile Completion Card or Progress Section */}
      {!isProfileComplete ? (
        <ProfileCompletionCard 
          key={`profile-completion-${dashboardData?.onboarding?.data?.completedSteps?.length || 0}-${dashboardData?.fetchedAt || 'initial'}`}
          onboardingData={dashboardData?.onboarding}
          onCompleteProfile={onCompleteProfile}
          onStepPress={onProfileStepPress}
          subscriptionData={subscriptionData}
          onSubscriptionRenew={onSubscriptionRenew}
        />
      ) : (
        <ProgressCard 
          key={dashboardData?.fetchedAt || 'initial'}
          dashboardData={dashboardData} 
          onRefresh={onProgressRefresh}
          onProgressPress={onTabPress}
        />
      )}

      {/* Achievements Card */}
      <AchievementsCard
        key={achievementsData?.fetchedAt || 'initial'}
        badgesData={mergedAchievementsData}
        onPress={() => onTabPress('achievements')}
        subscriptionData={subscriptionData}
        onSubscriptionRenew={onSubscriptionRenew}
      />

      {/* Nutrition Card */}
      <BlurredCard
        isBlurred={shouldBlurMenu}
        onPress={onSubscriptionRenew}
        blurMessage="Menu du jour disponible avec un abonnement actif"
      >
        <NutritionCard 
          onPress={() => {
            if (shouldBlurMenu) {
              onSubscriptionRenew();
            } else {
              onCompleteDayPress();
            }
          }}
          onMealPress={(meal: any) => {
            if (!shouldBlurMenu) {
              onMealPress(meal);
            }
          }}
          subscriptionData={subscriptionData}
          onSubscriptionPress={onSubscriptionRenew}
        />
      </BlurredCard>

      {/* L'Agora Section */}
      <View style={styles.agoraSection}>
        <View style={styles.agoraHeader}>
          <Ionicons name="notifications" size={20} color={theme.colors.text.primary} />
          <Text style={styles.agoraTitle}>News</Text>
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.agoraPostsContainer}
        >
          {agendaLoading ? (
            <View style={styles.agoraLoadingContainer}>
              <ShimmerCard />
              <ShimmerCard />
            </View>
          ) : agendaData.length > 0 ? (
            agendaData.map((item) => (
              <AgoraContentCard
                key={item.id}
                content={item}
                onMarkComplete={onMarkContentComplete}
                onPress={() => console.log('Content pressed:', item)}
              />
            ))
          ) : (
            <View style={styles.agoraEmptyContainer}>
              <Ionicons name="document-text-outline" size={48} color={theme.colors.text.secondary} />
              <Text style={styles.agoraEmptyText}>Aucun contenu disponible</Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* L'Agora Community Posts */}
      <LAgoraCard 
        posts={communityPosts}
        loading={communityLoading}
        onPostPress={onPostPress}
        onLikePress={onLikePress}
        onCommentPress={onCommentPress}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  agoraSection: {
    marginTop: 20,
    marginHorizontal: 20,
  },
  agoraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  agoraTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  agoraPostsContainer: {
    paddingRight: 20,
  },
  agoraLoadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agoraLoadingText: {
    marginTop: 12,
    color: theme.colors.text.secondary,
  },
  agoraEmptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agoraEmptyText: {
    marginTop: 12,
    color: theme.colors.text.secondary,
  },
});

export default DashboardContent;

