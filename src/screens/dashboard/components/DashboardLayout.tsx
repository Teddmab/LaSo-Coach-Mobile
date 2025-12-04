import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import DashboardHeader from './DashboardHeader';
import DashboardContent from './DashboardContent';
import SubscriptionBanner from '../../../components/SubscriptionBanner';
import BottomNavigation from '../../../components/BottomNavigation';
import MoreMenu from '../../../components/MoreMenu';
import SubscriptionAlert from '../../../components/SubscriptionAlert';
import type { User } from '../../../types/auth';

interface DashboardLayoutProps {
  user?: User | null;
  activeTab: string;
  showMoreMenu: boolean;
  dashboardData: any;
  achievementsData: any;
  subscriptionData: any;
  agendaData: any[];
  communityPosts: any[];
  agendaLoading: boolean;
  communityLoading: boolean;
  refreshing: boolean;
  isProfileComplete: boolean;
  shouldBlurMenu: boolean;
  showSubscriptionAlert: boolean;
  subscriptionAlertType: string | null;
  onHelpPress: () => void;
  onNotificationPress: () => void;
  onProfilePress: () => void;
  onTabPress: (tabId: string) => void;
  onMoreMenuClose: () => void;
  onMoreMenuItemPress: (itemId: string) => void;
  onSubscriptionRenew: () => Promise<void>;
  onRefresh: () => void;
  onProgressRefresh: () => void;
  onCompleteProfile: () => void;
  onProfileStepPress: (stepId: number) => void;
  onMealPress: (meal: any) => Promise<void>;
  onPostPress: (post: any) => void;
  onLikePress: (postId: string) => Promise<void>;
  onCommentPress: (postId: string) => void;
  onMarkContentComplete: (contentId: string) => Promise<void>;
  onCompleteDayPress: () => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  user,
  activeTab,
  showMoreMenu,
  dashboardData,
  achievementsData,
  subscriptionData,
  agendaData,
  communityPosts,
  agendaLoading,
  communityLoading,
  refreshing,
  isProfileComplete,
  shouldBlurMenu,
  showSubscriptionAlert,
  subscriptionAlertType,
  onHelpPress,
  onNotificationPress,
  onProfilePress,
  onTabPress,
  onMoreMenuClose,
  onMoreMenuItemPress,
  onSubscriptionRenew,
  onRefresh,
  onProgressRefresh,
  onCompleteProfile,
  onProfileStepPress,
  onMealPress,
  onPostPress,
  onLikePress,
  onCommentPress,
  onMarkContentComplete,
  onCompleteDayPress,
}) => {
  const insets = useSafeAreaInsets();
  const bottomNavHeight = 12 + 24 + 8 + Math.max(insets.bottom, 8);
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      
      {/* Header fixe */}
      <View style={styles.headerContainer}>
        <DashboardHeader
          user={user}
          dashboardData={dashboardData}
          onHelpPress={onHelpPress}
          onNotificationPress={onNotificationPress}
          onProfilePress={onProfilePress}
        />
      </View>

      <SubscriptionBanner 
        subscriptionData={subscriptionData}
        onRenew={onSubscriptionRenew}
      />

      {/* Contenu avec padding pour la navigation */}
      <View style={[styles.contentContainer, { paddingBottom: bottomNavHeight }]}>
        <DashboardContent
          isProfileComplete={isProfileComplete}
          dashboardData={dashboardData}
          achievementsData={achievementsData}
          subscriptionData={subscriptionData}
          agendaData={agendaData}
          communityPosts={communityPosts}
          agendaLoading={agendaLoading}
          communityLoading={communityLoading}
          refreshing={refreshing}
          shouldBlurMenu={shouldBlurMenu}
          onRefresh={onRefresh}
          onProgressRefresh={onProgressRefresh}
          onSubscriptionRenew={onSubscriptionRenew}
          onCompleteProfile={onCompleteProfile}
          onProfileStepPress={onProfileStepPress}
          onTabPress={onTabPress}
          onMealPress={onMealPress}
          onPostPress={onPostPress}
          onLikePress={onLikePress}
          onCommentPress={onCommentPress}
          onMarkContentComplete={onMarkContentComplete}
          onCompleteDayPress={onCompleteDayPress}
        />
      </View>

      {/* Barre de navigation fixe */}
      <BottomNavigation activeTab={activeTab} onTabPress={onTabPress} />

      <MoreMenu 
        visible={showMoreMenu}
        onClose={onMoreMenuClose}
        onMenuItemPress={onMoreMenuItemPress}
      />

      <SubscriptionAlert
        visible={showSubscriptionAlert}
        type={subscriptionAlertType}
        daysRemaining={subscriptionData?.daysRemaining}
        onRenew={onSubscriptionRenew}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    zIndex: 100,
  },
  contentContainer: {
    flex: 1,
  },
});

export default DashboardLayout;

