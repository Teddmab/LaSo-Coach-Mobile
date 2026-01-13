import { User } from '../../../types/auth';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../types/navigation';

export interface SubscriptionScreenProps {
  navigation?: StackNavigationProp<RootStackParamList>;
  onClose?: () => void;
  onNext?: () => void;
  isStandalone?: boolean;
  onTabPress?: (tabId: string) => void;
  user?: User | null;
  activeTab?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discountPrice?: number;
  currency?: string;
  duration?: number | string;
  features?: string[];
  imageUrl?: string;
  isFree?: boolean;
  plan?: {
    id?: string;
    name?: string;
    price?: number;
    currency?: string;
    duration?: number | string;
  };
}

export interface Subscription {
  id?: string;
  status?: string;
  isTrial?: boolean;
  plan?: Plan;
  nextBillingDate?: string;
  startDate?: string;
  endDate?: string;
}

export interface CurrentSubscription {
  hasSubscription: boolean;
  subscription?: Subscription;
}

export interface Invoice {
  id?: string;
  status?: string;
  subscriptionStatus?: string;
  planName?: string;
  plan?: {
    name?: string;
  };
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  beginDate?: string;
  expiresAt?: string;
  nextBillingDate?: string;
  price?: number;
  amount?: number;
  currency?: string;
  isFree?: boolean;
  paymentMethod?: string;
  payment?: {
    method?: string;
    amount?: number;
    status?: string;
  };
  paymentAmount?: number;
  paymentStatus?: string;
}

export interface PaymentData {
  planId: string;
  paymentMethod?: string;
  transactionId?: string;
}

