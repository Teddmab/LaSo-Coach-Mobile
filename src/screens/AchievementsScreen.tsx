import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import SubscriptionBanner from '../components/SubscriptionBanner';
import BlurOverlay from '../components/BlurOverlay';
import BadgeUnlockModal from '../components/BadgeUnlockModal';
import FloatingPointsAnimation from '../components/FloatingPointsAnimation';
import AchievementsCard from '../components/dashboard/AchievementsCard';
import Avatar from '../components/Avatar';
import { AchievementsScreenProps } from './achievements/types';
import { useAchievementsScreen } from './achievements/hooks/useAchievementsScreen';
import LeaderboardCard from './achievements/components/LeaderboardCard';
import ChallengeCardWithComplete from './achievements/components/ChallengeCardWithComplete';
import ChallengeTabs from './defis/components/ChallengeTabs';
import BadgeGrid from './defis/components/BadgeGrid';
import FeaturedBadge from './defis/components/FeaturedBadge';
import BadgeDetailModal from './defis/components/BadgeDetailModal';
import SummaryCard from './defis/components/SummaryCard';
import ChallengeCompletionModal from './achievements/components/ChallengeCompletionModal';
import { formatPoints } from './achievements/utils/achievementsUtils';
import { ShimmerCard } from '../components/Shimmer';
import NouveautesBottomSheet from '../components/nouveautes/NouveautesBottomSheet';
import { useNouveautes } from '../hooks/useNouveautes';

const AchievementsScreen: React.FC<AchievementsScreenProps> = ({
  user,
  onTabPress,
  activeTab,
  onSubscriptionRenew,
}) => {
  const {
    subscriptionData,
    showBlurOverlay,
    profileData,
    leaderboardData,
    userPosition,
    loading,
    userPositionLoading,
    badgesSummary,
    badges,
    badgesLoading,
    selectedBadge,
    showBadgeDetail,
    featuredBadge,
    showUnlockModal,
    unlockedBadge,
    showFloatingPoints,
    floatingPointsData,
    selectedTab,
    challenges,
    challengesLoading,
    hasMoreChallenges,
    selectedChallenge,
    showCompletionModal,
    achievementsData,
    tabCounts,
    setSelectedTab,
    loadMoreChallenges,
    assignChallenge,
    leaveChallenge,
    handleCompleteChallenge,
    handleSubmitChallenge,
    handleBadgePress,
    handleCloseBadgeDetail,
    handleCloseUnlockModal,
    handleSubscriptionRenew,
    handleCloseCompletionModal,
  } = useAchievementsScreen(onSubscriptionRenew);

  const {
    visible: showNouveautesAchievements,
    onComplete: onNouveautesAchievementsComplete,
    steps: nouveautesAchievementsSteps,
  } = useNouveautes('achievements');

  const userPositionList: typeof leaderboardData = userPosition ? [{
    rank: userPosition.rank,
    firstName: userPosition.firstName,
    lastName: userPosition.lastName,
    name: `${userPosition.firstName} ${userPosition.lastName}`.trim(),
    points: userPosition.points,
    avatar: userPosition.avatar || null,
    address: userPosition.address || '',
    userId: userPosition.userId,
    flag: userPosition.flag || '🏳️',
  }] : [];

  // Loading state - same pattern as ProgressScreen
  if (loading) {
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
        >
          <View style={styles.sectionContainer}>
            <ShimmerCard />
            <ShimmerCard />
            <ShimmerCard />
          </View>
        </ScrollView>
      </>
    );
  }

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
      >
        <View style={styles.headerSection}>
          <Text style={styles.headerSubtitle}>
            Relevez des défis et collectez des badges
          </Text>
        </View>

        <LeaderboardCard
          title="Top 5 Général"
          icon="trophy"
          iconColor="#FFD700"
          users={leaderboardData}
          loading={loading}
        />

        <LeaderboardCard
          title="Votre classement"
          icon="person"
          iconColor="#3B82F6"
          users={userPositionList}
          loading={userPositionLoading}
        />

        {badgesSummary && (
          <SummaryCard summary={badgesSummary} />
        )}

        <AchievementsCard
          badgesData={achievementsData}
          onPress={() => {}}
          subscriptionData={subscriptionData}
          onSubscriptionRenew={onSubscriptionRenew}
        />

        <View style={styles.challengesSection}>
          <Text style={styles.challengesTitle}>Défis</Text>
          <Text style={styles.challengesDescription}>
            Chaque défis complété vaut des points mais surtout une grande fierté pour vous-même !
          </Text>

          <ChallengeTabs
            selectedTab={selectedTab}
            onTabChange={setSelectedTab}
            tabCounts={tabCounts}
          />

          <View style={styles.tabContent}>
            {challengesLoading ? (
              <View style={styles.tabContentContainer}>
                <ShimmerCard />
                <ShimmerCard />
                <ShimmerCard />
              </View>
            ) : challenges.length === 0 ? (
              <View style={styles.tabContentContainer}>
                <Text style={styles.emptyStateText}>
                  {selectedTab === 'not_assigned' ? 'Aucun défi à relever pour le moment' :
                   selectedTab === 'assigned' ? 'Aucun défi en cours' :
                   selectedTab === 'completed' ? 'Aucun défi complété' :
                   'Aucun défi disponible'}
                </Text>
              </View>
            ) : (
              <View style={styles.challengesList}>
                {challenges.map((challenge) => (
                  <ChallengeCardWithComplete
                    key={challenge.id}
                    challenge={challenge}
                    onAssign={assignChallenge}
                    onLeave={leaveChallenge}
                    onComplete={handleCompleteChallenge}
                  />
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
            )}
          </View>
        </View>

        <View style={styles.badgesSection}>
          <Text style={styles.challengesTitle}>Badges</Text>
          
          {badgesLoading ? (
            <View style={styles.loadingContainer}>
              <ShimmerCard />
              <ShimmerCard />
            </View>
          ) : badges.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="trophy-outline" size={64} color="#CCC" />
              <Text style={styles.emptyStateText}>Aucun badge disponible</Text>
            </View>
          ) : (
            <>
              <BadgeGrid badges={badges} onBadgePress={handleBadgePress} />
              
              {featuredBadge && (
                <FeaturedBadge badge={featuredBadge} onPress={handleBadgePress} />
              )}
              
              {badgesSummary && (
                <View style={styles.progressSummary}>
                  <View style={styles.progressSummaryHeader}>
                    <Ionicons name="stats-chart" size={20} color="#4CAF50" />
                    <Text style={styles.progressSummaryTitle}>Vos progrès</Text>
                  </View>
                  <View style={styles.progressSummaryContent}>
                    <View style={styles.progressSummaryItem}>
                      <Text style={styles.progressSummaryValue}>
                        {badgesSummary.badgesUnlocked || 0}
                      </Text>
                      <Text style={styles.progressSummaryLabel}>
                        badges débloqués sur {badgesSummary.totalBadges || 0}
                      </Text>
                    </View>
                    <View style={styles.progressSummaryDivider} />
                    <View style={styles.progressSummaryItem}>
                      <Text style={styles.progressSummaryValue}>
                        {(badgesSummary.overallProgressPercentage?.toFixed(1) || 0)}%
                      </Text>
                      <Text style={styles.progressSummaryLabel}>
                        Progression globale
                      </Text>
                    </View>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBarBackground}>
                      <View 
                        style={[
                          styles.progressBarFill, 
                          { 
                            width: `${badgesSummary.overallProgressPercentage || 0}%`,
                          }
                        ]} 
                      />
                    </View>
                  </View>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <ChallengeCompletionModal
        visible={showCompletionModal}
        challenge={selectedChallenge}
        onClose={handleCloseCompletionModal}
        onSubmit={handleSubmitChallenge}
      />

      <BlurOverlay
        visible={showBlurOverlay}
        onRenew={handleSubscriptionRenew}
      />

      <BadgeDetailModal
        visible={showBadgeDetail}
        badge={selectedBadge}
        onClose={handleCloseBadgeDetail}
      />

      <BadgeUnlockModal
        visible={showUnlockModal}
        badge={unlockedBadge}
        onClose={handleCloseUnlockModal}
      />

      <FloatingPointsAnimation
        visible={showFloatingPoints}
        points={floatingPointsData?.points}
        reason={floatingPointsData?.reason}
      />

      <NouveautesBottomSheet
        visible={showNouveautesAchievements}
        steps={nouveautesAchievementsSteps}
        onComplete={onNouveautesAchievementsComplete}
        variant="achievements"
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20, // Padding réduit car FixedLayout gère déjà l'espace pour la navigation
  },
  sectionContainer: {
    padding: 20,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#7F8C8D',
    lineHeight: 20,
    textAlign: 'center',
  },
  challengesSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 16,
    padding: 20,
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
  tabContent: {
    minHeight: 100,
  },
  tabContentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  challengesList: {
    gap: 16,
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
  badgesSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 16,
    padding: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 12,
    textAlign: 'center',
  },
  progressSummary: {
    marginTop: 24,
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderTopWidth: 2,
    borderTopColor: '#E8F5E8',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  progressSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    justifyContent: 'center',
  },
  progressSummaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginLeft: 8,
  },
  progressSummaryContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressSummaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  progressSummaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  progressSummaryLabel: {
    fontSize: 13,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  progressSummaryDivider: {
    width: 1,
    height: 50,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },
  progressBarContainer: {
    marginTop: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
});

export default AchievementsScreen;

