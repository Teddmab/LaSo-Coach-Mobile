import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';

const BadgeUnlockModal = ({ visible, badge, onClose }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && badge) {
      // Start animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animation
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [visible, badge]);

  if (!badge) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={[badge.color || '#3B82F6', `${badge.color || '#3B82F6'}CC`]}
            style={styles.gradient}
          >
            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Celebration Icon */}
            <View style={styles.celebrationContainer}>
              <Ionicons name="trophy" size={80} color="#FFD700" />
            </View>

            {/* Badge Icon */}
            <View style={styles.badgeContainer}>
              {badge.icon ? (
                <Image source={{ uri: badge.icon }} style={styles.badgeIcon} />
              ) : (
                <Ionicons name="medal" size={64} color="#FFFFFF" />
              )}
            </View>

            {/* Badge Info */}
            <Text style={styles.unlockText}>Badge débloqué !</Text>
            <Text style={styles.badgeName}>{badge.displayName || badge.name}</Text>
            <Text style={styles.badgeLevel}>Niveau {badge.level}</Text>
            
            {badge.description && (
              <Text style={styles.badgeDescription}>{badge.description}</Text>
            )}

            {/* Points Info */}
            {badge.pointsRequired && (
              <View style={styles.pointsContainer}>
                <Ionicons name="star" size={20} color="#FFD700" />
                <Text style={styles.pointsText}>
                  {badge.pointsRequired} points requis
                </Text>
              </View>
            )}

            {/* Continue Button */}
            <TouchableOpacity style={styles.continueButton} onPress={onClose}>
              <Text style={styles.continueButtonText}>Continuer</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
  },
  gradient: {
    padding: 32,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 1,
  },
  celebrationContainer: {
    marginBottom: 16,
  },
  badgeContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  badgeIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  unlockText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  badgeLevel: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 12,
    opacity: 0.9,
  },
  badgeDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.9,
    lineHeight: 20,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  pointsText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
    minWidth: 150,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
  },
});

export default BadgeUnlockModal;

