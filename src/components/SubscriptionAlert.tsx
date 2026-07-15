import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';

interface SubscriptionAlertProps {
  visible: boolean;
  type: 'expired' | 'expiring_soon' | string;
  daysRemaining?: number;
  onRenew?: () => void;
}
const SubscriptionAlert = ({
  visible,
  type,
  daysRemaining = 0,
  onRenew,
}: SubscriptionAlertProps) => {
  const getAlertConfig = () => {
    switch (type) {
      case 'expired':
        return {
          title: 'Abonnement Expiré',
          message: 'Votre abonnement a expiré. Renouvelez pour continuer à accéder à toutes les fonctionnalités.',
          icon: 'warning',
          iconColor: '#F44336',
          gradientColors: ['#F44336', '#D32F2F'],
          buttonText: 'Renouveler Maintenant',
          buttonColor: '#FFFFFF',
          buttonTextColor: '#F44336'
        };
      case 'expiring_soon':
        return {
          title: 'Abonnement Expire Bientôt',
          message: `Votre abonnement expire dans ${daysRemaining} jour(s). Renouvelez pour éviter l'interruption de service.`,
          icon: 'time',
          iconColor: '#FF9800',
          gradientColors: ['#FF9800', '#F57C00'],
          buttonText: 'Renouveler',
          buttonColor: '#FFFFFF',
          buttonTextColor: '#FF9800'
        };
      default:
        return {
          title: 'Abonnement',
          message: 'Vérification de votre abonnement...',
          icon: 'information-circle',
          iconColor: '#2196F3',
          gradientColors: ['#2196F3', '#1976D2'],
          buttonText: 'OK',
          buttonColor: '#FFFFFF',
          buttonTextColor: '#2196F3'
        };
    }
  };

  const config = getAlertConfig();

  const handleRenew = () => {
    if (onRenew) {
      onRenew();
    } else {
      // Default behavior - navigate to subscription page
      // This will be handled by the parent component
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient
            colors={config.gradientColors as [string, string]}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons
                  name={config.icon as any}
                  size={32}
                  color={config.iconColor}
                />
              </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
              <Text style={styles.title}>{config.title}</Text>
              <Text style={styles.message}>{config.message}</Text>
              
              {type === 'expiring_soon' && (
                <View style={styles.daysContainer}>
                  <Ionicons name="calendar" size={16} color="#FFFFFF" />
                  <Text style={styles.daysText}>
                    {daysRemaining} jour(s) restant(s)
                  </Text>
                </View>
              )}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity 
                style={[styles.renewButton, { backgroundColor: config.buttonColor }]}
                onPress={handleRenew}
              >
                <Text style={[styles.renewButtonText, { color: config.buttonTextColor }]}>
                  {config.buttonText}
                </Text>
              </TouchableOpacity>
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
  container: {
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
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    textAlign: 'center',
    opacity: 0.9,
  },
  daysContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    alignSelf: 'center',
  },
  daysText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '600',
  },
  actions: {
    gap: 12,
  },
  renewButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  renewButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  laterButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  laterButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
});

export default SubscriptionAlert; 