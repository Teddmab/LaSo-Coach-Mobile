import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import DashboardHeader from './DashboardHeader';
import DashboardContent from './DashboardContent';
import BottomNavigation from '../../../components/BottomNavigation';
import MoreMenu from '../../../components/MoreMenu';
import NetworkStatus from '../../../components/NetworkStatus';
import type { User } from '../../../types/auth';

interface DashboardLayoutProps {
  user?: User | null;
  activeTab: string;
  showMoreMenu: boolean;
  dashboardData: any;
  achievementsData: any;
  subscriptionData: any;
  agendaData: any[];
  rendezvousData?: any;
  communityPosts: any[];
  agendaLoading: boolean;
  communityLoading: boolean;
  refreshing: boolean;
  isProfileComplete: boolean;
  shouldBlurMenu: boolean;
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
  // ✅ Nutrition data from NutritionScreen hooks
  nutritionDayMeals?: any[];
  nutritionCurrentPlanDay?: number;
  nutritionCompletionData?: any;
  nutritionCurrentPlan?: any;
  onNutritionMealComplete?: (mealId: string, planDayOverride?: number) => Promise<void>;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  user,
  activeTab,
  showMoreMenu,
  dashboardData,
  achievementsData,
  subscriptionData,
  agendaData,
  rendezvousData,
  communityPosts,
  agendaLoading,
  communityLoading,
  refreshing,
  isProfileComplete,
  shouldBlurMenu,
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
  nutritionDayMeals,
  nutritionCurrentPlanDay,
  nutritionCompletionData,
  nutritionCurrentPlan,
  onNutritionMealComplete,
}) => {
  const insets = useSafeAreaInsets();
  // Use a minimum safe area bottom padding, defaulting to 8 if insets aren't ready yet
  // This ensures consistent positioning even on first launch
  const safeBottomInset = insets.bottom > 0 ? Math.max(insets.bottom, 5) : 5;
  // ✅ PaddingBottom réduit à 38 pour optimiser l'espace
  const contentBottomPadding = 38;
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      {/* Banniere réseau flottante (offline / reconnexion) */}
      <NetworkStatus />
      
      {/* Header fixe - position absolute comme FixedLayout */}
      <View style={styles.headerContainer}>
        <DashboardHeader
          user={user}
          dashboardData={dashboardData}
          onHelpPress={onHelpPress}
          onNotificationPress={onNotificationPress}
          onProfilePress={onProfilePress}
        />
      </View>

      {/* SubscriptionBanner supprimé - on a toujours un plan FREE par défaut avec accessLevel ACTIVE */}

      {/* Contenu avec padding pour le header en haut et la navigation en bas */}
      <View style={[styles.contentContainer, { 
        paddingTop: 64, // Hauteur fixe du header (64px) pour cohérence avec FixedLayout
        paddingBottom: contentBottomPadding 
      }]}>
        <DashboardContent
          isProfileComplete={isProfileComplete}
          dashboardData={dashboardData}
          achievementsData={achievementsData}
          subscriptionData={subscriptionData}
          agendaData={agendaData}
          rendezvousData={rendezvousData}
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
          nutritionDayMeals={nutritionDayMeals}
          nutritionCurrentPlanDay={nutritionCurrentPlanDay}
          nutritionCompletionData={nutritionCompletionData}
          nutritionCurrentPlan={nutritionCurrentPlan}
          onNutritionMealComplete={onNutritionMealComplete}
        />
      </View>

      {/* Barre de navigation fixe - position absolute comme FixedLayout */}
      <View style={styles.bottomNavContainer}>
        <BottomNavigation activeTab={activeTab} onTabPress={onTabPress} />
      </View>

      <MoreMenu 
        visible={showMoreMenu}
        onClose={onMoreMenuClose}
        onMenuItemPress={onMoreMenuItemPress}
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
    backgroundColor: 'white',
    position: 'absolute',
    top: 15,
    height: 30,
    left: 0,
    right: 0,
    zIndex: 1000,
    // Pas de paddingTop ici, SafeAreaView le gère déjà
  },
  contentContainer: {
    flex: 1,
    // Le padding est géré dynamiquement pour le header et la navigation
  },
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 0, // Les marges sont gérées par BottomNavigation lui-même
    // Note: paddingBottom est géré par BottomNavigation avec useSafeAreaInsets
    // Ne pas ajouter de paddingBottom ici pour éviter le double padding
  },
});

export default DashboardLayout;

