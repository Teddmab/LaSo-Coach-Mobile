import { User } from '../../../types/auth';

export interface CommunityScreenProps {
  user?: User | null;
  onLogout?: () => void;
  onTabPress?: (tabId: string) => void;
  activeTab?: string;
  onClose?: () => void;
  selectedPostId?: string | null;
  onPostPress?: (post: Post) => void;
}

export interface Post {
  id: string;
  content?: string;
  mediaUrls?: string[];
  createdAt: string;
  user?: {
    id?: string;
    firstName?: string;
    name?: string;
    avatar?: string;
  };
  likes?: Array<{
    userId?: string;
    user?: {
      id?: string;
    };
  }>;
  _count?: {
    likes?: number;
    comments?: number;
  };
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user?: {
    id?: string;
    firstName?: string;
    name?: string;
    avatar?: string;
  };
}

export interface SelectedImage {
  uri: string;
  type?: string;
  fileName?: string;
  name?: string;
  width?: number;
  height?: number;
}

