import React from 'react';
import { View, ScrollView, RefreshControl, StyleSheet, Text, TouchableOpacity, NativeSyntheticEvent, LayoutChangeEvent, Platform } from 'react-native';
import { theme } from '../../../constants/theme';
import ProgressCard from '../../../components/dashboard/ProgressCard';
import ProfileCompletionCard from '../../../components/dashboard/ProfileCompletionCard';
import AchievementsCard from '../../../components/dashboard/AchievementsCard';
import SystemReminderBanner from '../../../components/dashboard/SystemReminderBanner';
import NutritionCard from '../../../components/dashboard/NutritionCard';
import AgoraContentCard from '../../../components/dashboard/AgoraContentCard';
import LAgoraCard from '../../../components/dashboard/LAgoraCard';
import NewsCard from '../../../components/dashboard/NewsCard';
import { Ionicons } from '@expo/vector-icons';
import { ShimmerCard } from '../../../components/Shimmer';
import { useIOSSimulation } from '../../../hooks/useIOSSimulation';
import { useAuth } from '../../../context/FirebaseAuthContext';

interface DashboardContentProps {
  isProfileComplete: boolean;
  dashboardData: any;
  achievementsData: any;
  subscriptionData: any;
  agendaData: any[];
  rendezvousData?: any;
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
  // ✅ Nutrition data from NutritionScreen hooks
  nutritionDayMeals?: any[];
  nutritionCurrentPlanDay?: number;
  nutritionCompletionData?: any;
  nutritionCurrentPlan?: any;
  onNutritionMealComplete?: (mealId: string, planDayOverride?: number) => Promise<void>;
  onOpenVideo?: (videoId: string, title?: string) => void;
  /** Pour le tuto guidé Home : ref du ScrollView et rapport des positions des sections */
  scrollViewRef?: React.RefObject<ScrollView | null>;
  onSectionLayout?: (index: number, y: number, height: number) => void;
  /** Enregistre une fonction pour mesurer la position écran d’une section (spotlight) */
  onRegisterGetSectionRect?: (getter: (index: number) => Promise<{ x: number; y: number; width: number; height: number } | null>) => void;
}

const DashboardContent: React.FC<DashboardContentProps> = ({
  isProfileComplete,
  dashboardData,
  achievementsData,
  subscriptionData,
  agendaData,
  rendezvousData,
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
  nutritionDayMeals,
  nutritionCurrentPlanDay,
  nutritionCompletionData,
  nutritionCurrentPlan,
  onNutritionMealComplete,
  onOpenVideo,
  scrollViewRef,
  onSectionLayout,
  onRegisterGetSectionRect,
}) => {
  const sectionRefs = React.useRef<(View | null)[]>([]);

  React.useEffect(() => {
    if (!onRegisterGetSectionRect) return;
    onRegisterGetSectionRect(async (index: number) => {
      const ref = sectionRefs.current[index];
      if (ref == null) return null;
      return new Promise<{ x: number; y: number; width: number; height: number } | null>((resolve) => {
        (ref as any).measureInWindow?.((x: number, y: number, w: number, h: number) => {
          resolve({ x, y, width: w, height: h });
        });
      });
    });
  }, [onRegisterGetSectionRect]);

  const handleSectionLayout = (index: number) => (e: NativeSyntheticEvent<LayoutChangeEvent>) => {
    const { y, height } = e.nativeEvent.layout;
    onSectionLayout?.(index, y, height);
  };

  const { shouldShowIOSOnly } = useIOSSimulation();
  const isIOS = shouldShowIOSOnly();

  // Vérifier si l'utilisateur a un abonnement actif
  // Aligné avec la logique de NutritionScreen pour cohérence
  const hasActiveSubscription = 
    subscriptionData?.status === 'ACTIVE' ||
    subscriptionData?.hasActiveSubscription === true ||
    subscriptionData?.subscription?.status?.toUpperCase() === 'ACTIVE';

  // Log pour debug
  if (__DEV__) {
    console.log('🏠 [DashboardContent] Vérification abonnement:', {
      status: subscriptionData?.status,
      hasActiveSubscription: subscriptionData?.hasActiveSubscription,
      subscriptionStatus: subscriptionData?.subscription?.status,
      isExpired: subscriptionData?.isExpired,
      finalHasActive: hasActiveSubscription,
    });
  }

  // Sur Android : Si pas d'abonnement, NutritionCard affiche la carte "Menus verrouillés"
  // Sur iOS : Si pas d'abonnement, NutritionCard affiche une carte iOS spéciale (sans blur)
  const shouldBlurOnIOS = isIOS && !hasActiveSubscription;

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
      if (completed.includes('rendezvous')) bonus += 25;

      totalPoints = bonus;
    }

    return {
      ...achievementsData,
      totalPoints,
    };
  }, [achievementsData, dashboardData?.onboarding]);

  // Ajout d'un état pour gérer l'affichage de la carte
  const [showComingSoonCard, setShowComingSoonCard] = React.useState(false);

  // Supprime la redirection et affiche directement la carte "Fonctionnalité à venir" dans le Home
  const handleAgoraPress = () => {
    // Désactivé : redirection ou autre logique
  };

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.content}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Section 0 : Onboarding / Profil complété + Progression */}
      <View ref={(r) => { sectionRefs.current[0] = r; }} onLayout={handleSectionLayout(0)} collapsable={false}>
      {/* Profile Completion Card or Progress Section */}
      {/* 
        IMPORTANT: Show ProfileCompletionCard only if onboarding is NOT complete.
        Onboarding is complete when ALL 4 steps are done:
        1. profile_setup
        2. goals_setup  
        3. recommendations
        4. rendezvous
        Once all 4 steps are complete, ProfileCompletionCard disappears and is replaced by ProgressCard.
      */}
      {!isProfileComplete ? (
        <ProfileCompletionCard
          key={`profile-completion-${dashboardData?.onboarding?.data?.completedSteps?.length || 0}-${dashboardData?.fetchedAt || 'initial'}`}
          onboardingData={dashboardData?.onboarding}
          onCompleteProfile={onCompleteProfile}
          onStepPress={onProfileStepPress}
          subscriptionData={subscriptionData}
          onRefresh={onRefresh}
          dashboardData={dashboardData}
          rendezvousData={rendezvousData}
        />
      ) : (
        <>
          {/* Badge pour profil complété ou abonnement expiré */}
          {hasActiveSubscription ? (
            <View style={styles.profileCompleteBadge}>
              <View style={styles.badgeContent}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                <Text style={styles.badgeText}>Profil complété +175 pts</Text>
              </View>
            </View>
          ) : null}
          <ProgressCard
            key={dashboardData?.fetchedAt || 'initial'}
            dashboardData={dashboardData}
            onRefresh={onProgressRefresh}
            onProgressPress={onTabPress}
          />
        </>
      )}
      </View>

      <SystemReminderBanner />

      {/* Section 1 : Badge et progression (points / succès) */}
      <View ref={(r) => { sectionRefs.current[1] = r; }} onLayout={handleSectionLayout(1)} collapsable={false}>
      <AchievementsCard
        key={achievementsData?.fetchedAt || 'initial'}
        badgesData={mergedAchievementsData}
        onPress={() => onTabPress('defis')}
        subscriptionData={subscriptionData}
        onSubscriptionRenew={onSubscriptionRenew}
      />
      </View>

      {/* Section 2 : Menu du jour */}
      <View ref={(r) => { sectionRefs.current[2] = r; }} onLayout={handleSectionLayout(2)} collapsable={false}>
      <NutritionCard
        onPress={() => {
          if (shouldBlurOnIOS) {
            if (!isIOS) {
              onSubscriptionRenew();
            }
          } else {
            onCompleteDayPress();
          }
        }}
        onTabPress={onTabPress}
        onMealPress={(meal: any) => {
          if (!shouldBlurOnIOS) {
            onMealPress(meal);
          }
        }}
        subscriptionData={subscriptionData}
        onSubscriptionPress={onSubscriptionRenew}
        // ✅ Passer les données de NutritionScreen pour garantir la cohérence
        dayMeals={nutritionDayMeals}
        currentPlanDay={nutritionCurrentPlanDay}
        completionData={nutritionCompletionData}
        currentPlan={nutritionCurrentPlan}
        onMealComplete={onNutritionMealComplete}
        onOpenVideo={onOpenVideo}
      />
      </View>

      {/* Section 3 : News */}
      <View ref={(r) => { sectionRefs.current[3] = r; }} onLayout={handleSectionLayout(3)} collapsable={false}>
      <NewsCard
        news={(() => {
          // ✅ Filtrer uniquement les items de type 'content' (exclure les rendezvous)
          const newsItems = agendaData?.filter((item: any) => item.type === 'content') || [];
          
          if (__DEV__) {
            console.log('📰 [DashboardContent] News items filtrés:', {
              totalAgendaItems: agendaData?.length || 0,
              newsItemsCount: newsItems.length,
              newsItems: newsItems.map((item: any) => ({
                id: item.id,
                type: item.type,
                title: item.title || item.content?.title,
                hasThumbnail: !!(item.thumbnailUrl || item.content?.thumbnailUrl),
              })),
            });
          }
          
          return newsItems;
        })()}
        loading={agendaLoading}
        onNewsPress={(news: any) => {
          onPostPress(news);
        }}
        onMarkComplete={onMarkContentComplete}
      />
      </View>

      {/* Section 4 : L'Agora */}
      <View ref={(r) => { sectionRefs.current[4] = r; }} onLayout={handleSectionLayout(4)} collapsable={false}>
      <LAgoraCard
        posts={communityPosts}
        loading={communityLoading}
        onPostPress={(post: any) => {
          // Redirection vers l'écran L'Agora (community) avec un message "coming soon"
          // La logique de navigation est gérée dans DashboardScreen via onPostPress
          onPostPress(post);
        }}
        onLikePress={onLikePress}
        onCommentPress={onCommentPress}
      />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'android' ? 48 : 20,
  },
  profileCompleteBadge: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#15803D',
  },
  subscriptionExpiredBadge: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F44336',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  subscriptionExpiredText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F44336',
    marginLeft: 6,
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
  comingSoonCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    margin: 20,
  },
  comingSoonCardText: {
    marginTop: 12,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DashboardContent;

