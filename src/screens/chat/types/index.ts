import { User } from '../../../types/auth';

export interface ChatScreenProps {
  user?: User | null;
  onLogout?: () => void;
  onTabPress?: (tabId: string) => void;
  activeTab?: string;
  onClose?: () => void;
  onFAQPress?: () => void;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  sender?: {
    id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  createdAt: string;
  read?: boolean;
}

export interface Participant {
  id?: string;
  userId?: string;
  participantId?: string;
  role?: string;
  userRole?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  user?: {
    id?: string;
    userId?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
    userRole?: string;
  };
}

export interface Conversation {
  id: string;
  type?: 'GROUP' | 'DIRECT';
  name?: string;
  participants?: Participant[];
  participantUsers?: Participant[];
  users?: Participant[];
  lastMessage?: {
    id?: string;
    content?: string;
    createdAt?: string;
    sender?: {
      id?: string;
      name?: string;
      firstName?: string;
    };
  };
  unreadCount?: number;
}

