import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../../constants/theme';
import { WelcomeAnimations } from '../types';

interface WelcomeActionsProps {
  animations: WelcomeAnimations;
  onGetStarted: () => void;
  onSignIn: () => void;
}

const WelcomeActions: React.FC<WelcomeActionsProps> = ({
  animations,
  onGetStarted,
  onSignIn,
}) => {
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
      <TouchableOpacity style={styles.getStartedButton} onPress={onGetStarted}>
        <Text style={styles.getStartedText}>Get Started</Text>
        <Ionicons name="arrow-forward" size={20} color={COLORS.primary} />
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.loginButton} onPress={onSignIn}>
        <Text style={styles.loginText}>Already have an account? Sign In</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
    width: '100%',
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  getStartedText: {
    fontSize: TYPOGRAPHY.sizes.lg as number,
    fontWeight: TYPOGRAPHY.weights.semibold as any,
    color: COLORS.primary,
    marginRight: SPACING.sm,
  },
  loginButton: {
    paddingVertical: SPACING.md,
  },
  loginText: {
    fontSize: TYPOGRAPHY.sizes.md as number,
    fontWeight: TYPOGRAPHY.weights.medium as any,
    color: COLORS.white,
    opacity: 0.8,
  },
});

export default WelcomeActions;

