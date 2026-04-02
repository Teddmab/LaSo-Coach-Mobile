import React from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../../constants/theme';
import { WelcomeAnimations } from '../types';

const { width } = Dimensions.get('window');

interface WelcomeFeaturesProps {
  animations: WelcomeAnimations;
}

const features = [
  { icon: 'nutrition', text: 'Personalized Nutrition' },
  { icon: 'trending-up', text: 'Progress Tracking' },
  { icon: 'people', text: 'Community Support' },
];

const WelcomeFeatures: React.FC<WelcomeFeaturesProps> = ({ animations }) => {
  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: animations.fadeAnim,
          transform: [{ translateY: animations.slideAnim }],
        },
      ]}
    >
      {features.map((feature, index) => (
        <View key={index} style={styles.featureItem}>
          <Ionicons name={feature.icon as any} size={24} color={COLORS.white} />
          <Text style={styles.featureText}>{feature.text}</Text>
        </View>
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    minWidth: width * 0.7,
  },
  featureText: {
    fontSize: TYPOGRAPHY.sizes.md as number,
    fontWeight: TYPOGRAPHY.weights.medium as any,
    color: COLORS.white,
    marginLeft: SPACING.md,
  },
});

export default WelcomeFeatures;

