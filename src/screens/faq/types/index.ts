import { User } from '../../../types/auth';

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export interface FAQScreenProps {
  onClose?: () => void;
  user?: User | null;
  onTabPress?: (tabId: string) => void;
}

export interface FAQState {
  faqs: FAQ[];
  loading: boolean;
  searchQuery: string;
  selectedCategory: string;
  expandedItems: Record<string, boolean>;
}

