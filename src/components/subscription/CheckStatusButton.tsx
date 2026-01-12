import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { subscriptionStatusService } from '../../services/subscription/SubscriptionStatusService';
import { theme } from '../../constants/theme';
import Toast from 'react-native-toast-message';

interface CheckStatusButtonProps {
  onStatusChecked?: (hasActiveSubscription: boolean) => void;
  variant?: 'default' | 'compact';
}

/**
 * Bouton pour vérifier le statut d'abonnement
 * Utile pour iOS après qu'un utilisateur se soit abonné sur le site web
 */
const CheckStatusButton: React.FC<CheckStatusButtonProps> = ({
  onStatusChecked,
  variant = 'default',
}) => {
  const [loading, setLoading] = useState(false);

  const handleCheckStatus = async () => {
    try {
      setLoading(true);
      const status = await subscriptionStatusService.refreshStatus();

      if (status.hasActiveSubscription) {
        Toast.show({
          type: 'success',
          text1: 'Abonnement actif',
          text2: `Votre abonnement ${status.planName || ''} est actif.`,
        });
      } else {
        Toast.show({
          type: 'info',
          text1: 'Aucun abonnement actif',
          text2: 'Visitez app.lasocoach.com pour vous abonner.',
        });
      }

      if (onStatusChecked) {
        onStatusChecked(status.hasActiveSubscription);
      }
    } catch (error: any) {
      console.error('Erreur lors de la vérification du statut:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de vérifier le statut. Veuillez réessayer.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (variant === 'compact') {
    return (
      <TouchableOpacity
        style={styles.compactButton}
        onPress={handleCheckStatus}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : (
          <>
            <Ionicons name="refresh" size={18} color={theme.colors.primary} />
            <Text style={styles.compactButtonText}>Vérifier</Text>
          </>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handleCheckStatus}
      disabled={loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <>
          <Ionicons name="refresh" size={20} color="#FFFFFF" style={styles.icon} />
          <Text style={styles.buttonText}>
            Vérifier le statut
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  icon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  compactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    gap: 6,
  },
  compactButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default CheckStatusButton;

