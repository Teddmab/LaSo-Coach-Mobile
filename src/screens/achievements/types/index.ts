import { User } from '../../../types/auth';

export interface AchievementsScreenProps {
  user?: User | null;
  onLogout?: () => void;
  onTabPress?: (tabId: string) => void;
  activeTab?: string;
  onSubscriptionRenew?: () => void;
}

export interface LeaderboardUser {
  rank: number;
  firstName: string;
  lastName: string;
  name: string;
  points: number;
  avatar?: string | null;
  address?: string;
  userId: string;
  flag?: string;
}

export interface UserPosition {
  rank: number;
  totalUsers: number;
  userId: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  address?: string;
  points: number;
  message?: string;
  flag?: string;
}

export interface Badge {
  id: string;
  name: string;
  description?: string;
  isUnlocked: boolean;
  level?: number;
  maxLevel?: number;
  progress?: number;
  pointsRequired?: number;
  imageUrl?: string;
  currentLevel?: number;
  displayName?: string;
  color?: string;
  progressPercentage?: number;
  totalPointsEarned?: number;
  totalPointsRequired?: number;
  icon?: string;
  levels?: Array<{
    level: number;
    isUnlocked: boolean;
    description: string;
    pointsEarned: number;
    pointsRequired: number;
  }>;
}

export interface BadgeSummary {
  totalPointsEarned?: number;
  currentLevelSum?: number;
  badgesUnlocked?: number;
  totalBadges?: number;
  overallProgressPercentage?: number;
}

export interface Challenge {
  id: string;
  title: string;
  description?: string;
  category?: string;
  points?: number;
  status?: 'not_assigned' | 'assigned' | 'in_progress' | 'completed';
  validationMode?: string;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  type?: string;
  rewards?: {
    points?: number;
  };
  duration?: number;
  progress?: number;
}

export type ChallengeTab = 'pending' | 'my' | 'completed';

export interface FloatingPointsData {
  points: string;
  reason?: string;
}

export interface AchievementsData {
  totalPoints?: number;
  currentBadge?: string;
  pointsNeededForNext?: number;
  nextBadgeName?: string;
  unlockedBadges?: number;
  totalBadges?: number;
}

