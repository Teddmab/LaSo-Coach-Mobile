import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, APP_CONFIG } from '../../../constants/theme';
import { WelcomeAnimations } from '../types';

interface WelcomeLogoProps {
  animations: WelcomeAnimations;
}

const WelcomeLogo: React.FC<WelcomeLogoProps> = ({ animations }) => {
  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: animations.fadeAnim,
          transform: [
            { translateY: animations.slideAnim },
            { scale: animations.scaleAnim },
          ],
        },
      ]}
    >
      {/* Temporary logo placeholder - replace with actual logo */}
      <View style={styles.logoPlaceholder}>
        <Ionicons name="leaf" size={80} color={COLORS.white} />
      </View>
      
      <Text style={styles.appName}>{APP_CONFIG.name}</Text>
      <Text style={styles.tagline}>{APP_CONFIG.tagline}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: SPACING.xxl,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: BORDER_RADIUS.xxl,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  appName: {
    fontSize: TYPOGRAPHY.sizes.xxxl as number,
    fontWeight: TYPOGRAPHY.weights.bold as any,
    color: COLORS.white,
    textAlign: 'center' as const,
    marginBottom: SPACING.sm,
  },
  tagline: {
    fontSize: TYPOGRAPHY.sizes.lg as number,
    fontWeight: TYPOGRAPHY.weights.medium as any,
    color: COLORS.white,
    textAlign: 'center' as const,
    opacity: 0.9,
  },
});

export default WelcomeLogo;

