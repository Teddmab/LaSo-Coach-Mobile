import { User } from '../../../types/auth';

export interface DefisScreenProps {
  user?: User | null;
  onLogout?: () => void;
  onTabPress?: (tabId: string) => void;
  activeTab?: string;
  onSubscriptionRenew?: () => void;
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
}

export interface BadgeSummary {
  totalPointsEarned?: number;
  currentLevelSum?: number;
  badgesUnlocked?: number;
  totalBadges?: number;
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
}

export type ChallengeTab = 'pending' | 'my' | 'completed';

export interface FloatingPointsData {
  points: string;
  reason?: string;
}

