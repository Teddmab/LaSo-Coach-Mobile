import type { User } from '../../../types/auth';
import type { DashboardScreenNavigationProp } from '../../../types/navigation';

export interface DashboardScreenProps {
  user?: User | null;
  onLogout?: () => void;
  navigation: DashboardScreenNavigationProp;
}

export interface DashboardState {
  activeTab: string;
  currentScreen: string;
  dashboardData: any;
  achievementsData: any;
  subscriptionData: any;
  agendaData: any[];
  communityPosts: any[];
  refreshing: boolean;
  loading: boolean;
}

export interface DashboardHandlers {
  handleTabPress: (tabId: string) => void;
  handleMoreMenuItemPress: (itemId: string) => void;
  handleSubscriptionRenew: () => Promise<void>;
  handleCompleteProfile: () => void;
  handleProfileStepPress: (stepId: number) => void;
  handleMealPress: (meal: any) => Promise<void>;
  handlePostPress: (post: any) => void;
  handleLikePress: (postId: string) => Promise<void>;
  handleCommentPress: (postId: string) => void;
  onRefresh: () => Promise<void>;
}

