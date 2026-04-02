import { User } from '../../../types/auth';

export interface Notification {
  id: string;
  title: string;
  message?: string;
  description?: string;
  type: 'chat_message' | 'content_assigned' | 'session' | 'system' | 'payment' | string;
  read: boolean;
  createdAt: string;
  data?: any;
}

export interface NotificationsScreenProps {
  user?: User | null;
  onLogout?: () => void;
  onTabPress?: (tabId: string) => void;
  activeTab?: string;
  onClose?: () => void;
}

export type NotificationTab = 'all' | 'unread' | 'messages' | 'content' | 'payments' | 'system';

export interface NotificationPreferences {
  messages: boolean;
  content: boolean;
  payments: boolean;
  system: boolean;
  marketing: boolean;
}

export interface Pagination {
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface NotificationIcon {
  name: string;
  color: string;
}

