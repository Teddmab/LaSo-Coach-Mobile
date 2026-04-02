import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../constants/theme';
import { WelcomeScreenProps } from './welcome/types';
import { useWelcomeAnimations } from './welcome/hooks/useWelcomeAnimations';
import WelcomeLogo from './welcome/components/WelcomeLogo';
import WelcomeFeatures from './welcome/components/WelcomeFeatures';
import WelcomeActions from './welcome/components/WelcomeActions';

const { height } = Dimensions.get('window');

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const animations = useWelcomeAnimations();

  const handleGetStarted = (): void => {
    // For now, just log - we'll implement navigation later
    if (navigation) {
      navigation.navigate('Register');
    }
  };

  const handleSignIn = (): void => {
    if (navigation) {
      navigation.navigate('Login');
    }
  };

  return (
    <LinearGradient
      colors={[COLORS.gradientStart, COLORS.gradientEnd]}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Logo Section */}
        <WelcomeLogo animations={animations} />

        {/* Feature highlights */}
        <WelcomeFeatures animations={animations} />

        {/* Get Started Button */}
        <WelcomeActions
          animations={animations}
          onGetStarted={handleGetStarted}
          onSignIn={handleSignIn}
        />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: height * 0.1,
    paddingBottom: SPACING.xxl,
  },
});

export default WelcomeScreen;

