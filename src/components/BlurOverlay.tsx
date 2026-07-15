import React from 'react';
import { 
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';

interface BlurOverlayProps {
  visible: boolean;
  onRenew?: () => void;
  customButton?: React.ReactNode; // Bouton personnalisé (pour iOS)
  message?: string;
}

const BlurOverlay: React.FC<BlurOverlayProps> = ({ 
  visible, 
  onRenew,
  customButton,
  message = "Cette fonctionnalité nécessite un abonnement actif. Renouvelez votre abonnement pour continuer à accéder à toutes les fonctionnalités."
}) => {
  const handleRenew = () => {
    if (onRenew) {
      onRenew();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.blurContainer}>
          <LinearGradient
            colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
            style={styles.gradient}
          >
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Ionicons name="lock-closed" size={48} color="#FFFFFF" />
            </View>

            {/* Title */}
            <Text style={styles.title}>Accès Restreint</Text>

            {/* Message */}
            <Text style={styles.message}>
              {message}
            </Text>

            {/* Actions */}
            <View style={styles.actions}>
              {customButton ? (
                customButton
              ) : onRenew ? (
                <TouchableOpacity 
                  style={styles.renewButton}
                  onPress={handleRenew}
                >
                  <Ionicons name="rocket" size={20} color="#FFFFFF" />
                  <Text style={styles.renewButtonText}>Voir le plan d'abonnement</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  blurContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gradient: {
    padding: 32,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 32,
  },
  actions: {
    gap: 16,
    width: '100%',
  },
  renewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9800',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  renewButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
});

export default BlurOverlay; 