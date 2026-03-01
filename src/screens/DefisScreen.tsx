import React from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import AppHeader from '../components/AppHeader';
import SubscriptionBanner from '../components/SubscriptionBanner';
import BadgeUnlockModal from '../components/BadgeUnlockModal';
import FloatingPointsAnimation from '../components/FloatingPointsAnimation';
import { DefisScreenProps } from './defis/types';
import { useDefisScreen } from './defis/hooks/useDefisScreen';
import SummaryCard from './defis/components/SummaryCard';
import ChallengeTabs from './defis/components/ChallengeTabs';
import ChallengeCard from './defis/components/ChallengeCard';
import BadgeGrid from './defis/components/BadgeGrid';
import FeaturedBadge from './defis/components/FeaturedBadge';
import BadgeDetailModal from './defis/components/BadgeDetailModal';
import { ShimmerCard, ShimmerGrid } from '../components/Shimmer';

const DefisScreen: React.FC<DefisScreenProps> = ({
  user,
  onTabPress,
  activeTab,
  onSubscriptionRenew,
}) => {
  const {
    subscriptionData,
    profileData,
    badges,
    summary,
    loading,
    refreshing,
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
    tabCounts,
    setSelectedTab,
    loadMoreChallenges,
    onRefresh,
    handleBadgePress,
    handleCloseBadgeDetail,
    handleCloseUnlockModal,
    handleSubscriptionRenew,
    assignChallenge,
    leaveChallenge,
  } = useDefisScreen(onSubscriptionRenew);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <AppHeader
        title="Défis"
        onHelpPress={() => {
          if (onTabPress) {
            onTabPress('faq');
          }
        }}
        onNotificationPress={() => {
          if (onTabPress) {
            onTabPress('notifications');
          }
        }}
        onProfilePress={() => {
          if (onTabPress) {
            onTabPress('settings');
          }
        }}
        avatarSource={profileData?.avatar || user?.avatar}
        avatarFallbackText={user?.firstName?.charAt(0) || user?.name?.charAt(0)}
      />

      <SubscriptionBanner 
        subscriptionData={subscriptionData} 
        onRenew={handleSubscriptionRenew} 
      />

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <SummaryCard summary={summary} />

        {/* Challenges Section */}
        <View style={styles.challengesSection}>
          <Text style={styles.sectionTitle}>Défis</Text>
          <Text style={styles.sectionDescription}>
            Relevez des défis pour gagner des points et débloquer de nouveaux badges
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
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    onAssign={assignChallenge}
                    onLeave={leaveChallenge}
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

        {/* Badges Section */}
        <View style={styles.badgesSection}>
          <Text style={styles.sectionTitle}>Badges</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ShimmerGrid columns={3} count={6} />
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
              
              {summary && (
                <View style={styles.progressSummary}>
                  <Text style={styles.progressSummaryText}>
                    {summary.badgesUnlocked || 0} badges débloqués sur {summary.totalBadges || 0}
                  </Text>
                  <Text style={styles.progressSummaryText}>
                    Progression globale : {((summary as any).overallProgressPercentage?.toFixed(1) || 0)}%
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      {onTabPress && (
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('home')}>
            <Ionicons name="home" size={24} color={activeTab === 'home' ? theme.colors.primary : theme.colors.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('progress')}>
            <Ionicons name="trending-up-outline" size={24} color={activeTab === 'progress' ? theme.colors.primary : theme.colors.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('nutrition')}>
            <Ionicons name="restaurant" size={24} color={activeTab === 'nutrition' ? theme.colors.primary : theme.colors.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('achievements')}>
            <Ionicons name="trophy-outline" size={24} color={activeTab === 'achievements' ? theme.colors.primary : theme.colors.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.navTab, styles.activeNavTab]} onPress={() => onTabPress('defis')}>
            <Ionicons name="medal" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('more')}>
            <Ionicons name="add-outline" size={24} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </View>
      )}

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
    </SafeAreaView>
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
    paddingBottom: 20,
  },
  challengesSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 16,
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
    paddingHorizontal: 20,
    marginBottom: 24,
    marginTop: 24,
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
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  progressSummaryText: {
    fontSize: 14,
    color: '#2C3E50',
    marginBottom: 4,
    textAlign: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  activeNavTab: {
    // Active tab styling handled by icon color
  },
});

export default DefisScreen;

