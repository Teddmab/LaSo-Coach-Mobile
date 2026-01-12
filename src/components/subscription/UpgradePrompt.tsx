import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface UpgradePromptProps {
  onCheckStatus?: () => void;
  onClose?: () => void;
}

/**
 * Composant pour afficher le message d'upgrade sur iOS
 * Conforme aux guidelines Apple (Reader App model)
 * Affiche uniquement du texte informatif, pas de liens cliquables
 */
const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  onCheckStatus,
  onClose,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="star" size={48} color={theme.colors.primary} />
      </View>

      <Text style={styles.title}>Débloquer les fonctionnalités Premium</Text>

      <Text style={styles.description}>
        Accédez à des entraînements personnalisés illimités, un coaching personnalisé et des plans nutritionnels avancés.
      </Text>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={20} color={theme.colors.text.secondary} />
        <Text style={styles.infoText}>
          Pour vous abonner, visitez notre site web :{'\n'}
          <Text style={styles.websiteText}>lasocoach.com</Text>
        </Text>
      </View>

      <Text style={styles.instructionText}>
        Ouvrez votre navigateur et choisissez le plan qui vous convient.
      </Text>

      <View style={styles.buttonContainer}>
        {onCheckStatus && (
          <TouchableOpacity
            style={styles.checkStatusButton}
            onPress={onCheckStatus}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={20} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.checkStatusButtonText}>
              J'ai déjà souscrit - Vérifier le statut
            </Text>
          </TouchableOpacity>
        )}

        {onClose && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.closeButtonText}>Retour</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginLeft: 12,
    lineHeight: 20,
  },
  websiteText: {
    fontWeight: '600',
    color: theme.colors.primary,
  },
  instructionText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  checkStatusButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  checkStatusButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  closeButtonText: {
    color: theme.colors.text.secondary,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default UpgradePrompt;

