import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';

// Types de navigation pour les paramètres de route
export type RootStackParamList = {
  Login: {
    skipWelcomeSlides?: boolean;
    forceShowWelcomeSlides?: boolean;
    token?: string;
  } | undefined;
  Register: undefined;
  PasswordReset: {
    token?: string;
  } | undefined;
  Dashboard: undefined;
  Welcome: undefined;
};

export type DashboardTabParamList = {
  Home: undefined;
  Progress: undefined;
  Nutrition: undefined;
  Community: undefined;
  Profile: undefined;
  Achievements: undefined;
  Agenda: undefined;
  Defis: undefined;
  Chat: undefined;
  Notifications: undefined;
  Settings: undefined;
  Security: undefined;
  FAQ: undefined;
  Subscription: undefined;
};

// Types de navigation pour les props
export type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;
export type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;
export type PasswordResetScreenNavigationProp = StackNavigationProp<RootStackParamList, 'PasswordReset'>;
export type DashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Dashboard'>;

export interface DashboardScreenProps {
  user?: any;
  onLogout?: () => void;
  navigation: DashboardScreenNavigationProp;
}

export type HomeTabNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<DashboardTabParamList, 'Home'>,
  StackNavigationProp<RootStackParamList>
>;

export type ProgressTabNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<DashboardTabParamList, 'Progress'>,
  StackNavigationProp<RootStackParamList>
>;

export type NutritionTabNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<DashboardTabParamList, 'Nutrition'>,
  StackNavigationProp<RootStackParamList>
>;

export type CommunityTabNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<DashboardTabParamList, 'Community'>,
  StackNavigationProp<RootStackParamList>
>;

export type ProfileTabNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<DashboardTabParamList, 'Profile'>,
  StackNavigationProp<RootStackParamList>
>;

