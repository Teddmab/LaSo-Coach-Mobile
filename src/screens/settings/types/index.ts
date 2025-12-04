import { User } from '../../../types/auth';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../types/navigation';

export interface SettingsScreenProps {
  user?: User | null;
  onLogout?: () => void;
  onTabPress?: (tabId: string) => void;
  activeTab?: string;
  onClose?: (target?: string) => void;
  navigation?: StackNavigationProp<RootStackParamList>;
}

export interface SecurityScreenProps {
  navigation?: StackNavigationProp<RootStackParamList>;
  onClose?: () => void;
  user?: User | null;
  onTabPress?: (tabId: string) => void;
  activeTab?: string;
}

export interface SecurityFormData {
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface SecurityInfo {
  lastLogin: string;
  lastPasswordChange: string;
}

export interface SettingsItem {
  id: string;
  title: string;
  icon: string;
  color: string;
  expandable?: boolean;
  subItems?: SettingsSubItem[];
}

export interface SettingsSubItem {
  id: string;
  title: string;
}

export interface ExpandedSections {
  [key: string]: boolean;
}
