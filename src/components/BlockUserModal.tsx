import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

interface BlockUserModalProps {
  visible: boolean;
  userId: string;
  userName?: string;
  isBlocked: boolean;
  onConfirm: (userId: string) => Promise<void>;
  onCancel: () => void;
}

/**
 * BlockUserModal - Modal for blocking or unblocking a user
 * 
 * Phase 8 - TODO #6: Add user profile preview in modal
 * Phase 8 - TODO #7: Show confirmation before blocking
 * 
 * Displays:
 * - User information
 * - Block/Unblock action
 * - Explanation of what blocking means
 */
const BlockUserModal: React.FC<BlockUserModalProps> = ({
  visible,
  userId,
  userName,
  isBlocked,
  onConfirm,
  onCancel,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      console.log(`🎯 [BlockUserModal] ${isBlocked ? 'Débloquer' : 'Bloquer'} utilisateur:`, userId);
      await onConfirm(userId);
      console.log(
        `✅ [BlockUserModal] Utilisateur ${isBlocked ? 'débloqué' : 'bloqué'} avec succès`
      );
      Alert.alert(
        isBlocked ? 'Utilisateur débloqué' : 'Utilisateur bloqué',
        isBlocked
          ? `${userName || 'Cet utilisateur'} a été débloqué. Vous verrez à nouveau son contenu.`
          : `${userName || 'Cet utilisateur'} a été bloqué. Vous ne verrez plus ses publications et ne recevrez plus ses messages.`
      );
      onCancel();
    } catch (error) {
      console.error('❌ [BlockUserModal] Error:', error);
      Alert.alert(
        'Erreur',
        `Erreur lors du ${isBlocked ? 'déblocage' : 'blocage'} de l'utilisateur. Veuillez réessayer.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Icon */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: isBlocked ? '#E8F5E9' : '#FFEBEE' },
            ]}
          >
            <Ionicons
              name={isBlocked ? 'lock-open-outline' : 'lock-closed-outline'}
              size={40}
              color={isBlocked ? '#4CAF50' : '#F44336'}
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {isBlocked ? 'Débloquer l\'utilisateur ?' : 'Bloquer l\'utilisateur ?'}
          </Text>

          {/* Username */}
          {userName && (
            <Text style={styles.userName}>{userName}</Text>
          )}

          {/* Description */}
          <Text style={styles.description}>
            {isBlocked
              ? "Débloquer cet utilisateur vous permettra de voir ses publications, commentaires et de recevoir à nouveau ses messages."
              : "Bloquer cet utilisateur va :\n• Masquer ses publications et commentaires\n• L'empêcher de vous envoyer des messages\n• Le supprimer de votre liste d'abonnés"}
          </Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                isBlocked ? styles.unblockButton : styles.blockButton,
              ]}
              onPress={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.colors.surface} size="small" />
              ) : (
                <Text style={styles.confirmButtonText}>
                  {isBlocked ? 'Débloquer' : 'Bloquer'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
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
    padding: 16,
  },
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  blockButton: {
    backgroundColor: '#F44336',
  },
  unblockButton: {
    backgroundColor: '#4CAF50',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.surface,
  },
});

export default BlockUserModal;
