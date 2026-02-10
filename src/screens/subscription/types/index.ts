import { NavigationProp } from '@react-navigation/native';

export interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  currency?: string;
  billingPeriod?: string;
  features?: string[];
  imageUrl?: string;
  isFree?: boolean;
}

export interface Subscription {
  id?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  daysRemaining?: number;
  plan?: Plan;
}

export interface SubscriptionData {
  status?: string;
  isExpired?: boolean;
  hasActiveSubscription?: boolean;
  subscription?: Subscription;
  message?: string;
}

export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  planName?: string;
}

export interface PaymentData {
  transactionId?: string;
  amount?: number;
  currency?: string;
  status?: string;
  method?: string;
}

export interface SubscriptionScreenProps {
  navigation?: NavigationProp<any>;
  onClose?: () => void;
  onNext?: () => void;
  isStandalone?: boolean;
  onTabPress?: (tab: string) => void;
  user?: any;
  activeTab?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  onRefresh?: () => void | Promise<void>; // ✅ Callback pour rafraîchir le dashboard après activation
}

