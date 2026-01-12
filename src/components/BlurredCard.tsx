import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  BlurView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';

interface BlurredCardProps {
  children: React.ReactNode;
  isBlurred?: boolean;
  onPress?: () => void;
  blurMessage?: string;
  customButton?: React.ReactNode; // Bouton personnalisé (pour iOS)
}

const BlurredCard: React.FC<BlurredCardProps> = ({ 
  children,
  isBlurred = false,
  onPress,
  blurMessage = "Fonctionnalité disponible avec un abonnement actif",
  customButton
}) => {
  if (!isBlurred) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      {/* Original content */}
      <View style={styles.content}>
        {children}
      </View>
      
      {/* Blur overlay */}
      <View style={styles.blurOverlay}>
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
          style={styles.gradient}
        >
          <View style={styles.blurContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="lock-closed" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.blurMessage}>{blurMessage}</Text>
            {customButton ? (
              customButton
            ) : onPress ? (
              <TouchableOpacity 
                style={styles.unlockButton}
                onPress={onPress}
              >
                <Ionicons name="card" size={16} color="#FFFFFF" />
                <Text style={styles.unlockButtonText}>Débloquer</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  content: {
    // Original content styling
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  blurContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  blurMessage: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.9,
    lineHeight: 20,
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  unlockButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default BlurredCard;


