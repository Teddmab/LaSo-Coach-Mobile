import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../types/navigation';

export interface WelcomeScreenProps {
  navigation?: StackNavigationProp<RootStackParamList>;
}

export interface WelcomeAnimations {
  fadeAnim: any; // Animated.Value
  slideAnim: any; // Animated.Value
  scaleAnim: any; // Animated.Value
}

