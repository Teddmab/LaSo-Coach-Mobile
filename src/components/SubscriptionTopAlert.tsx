import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';

const SubscriptionTopAlert = ({ 
  visible, 
  type, // 'expired', 'expiring_soon', 'renewal'
  daysRemaining = 0,
  onRenew,
  onDismiss
}) => {
  if (!visible) return null;

  const getAlertConfig = () => {
    switch (type) {
      case 'expired':
        return {
          title: 'Abonnement Expiré',
          message: 'Renouvelez pour continuer l\'accès',
          icon: 'warning',
          iconColor: '#FFFFFF',
          gradientColors: ['#F44336', '#D32F2F'],
          buttonText: 'Renouveler',
          buttonColor: '#FFFFFF',
          buttonTextColor: '#F44336'
        };
      case 'expiring_soon':
        return {
          title: 'Abonnement Expire Bientôt',
          message: `${daysRemaining} jour(s) restant(s)`,
          icon: 'time',
          iconColor: '#FFFFFF',
          gradientColors: ['#FF9800', '#F57C00'],
          buttonText: 'Renouveler',
          buttonColor: '#FFFFFF',
          buttonTextColor: '#FF9800'
        };
      case 'renewal':
        return {
          title: 'Accès Restreint',
          message: 'Renouvelez pour accéder à cette fonctionnalité',
          icon: 'lock-closed',
          iconColor: '#FFFFFF',
          gradientColors: ['#F44336', '#D32F2F'],
          buttonText: 'Renouveler',
          buttonColor: '#FFFFFF',
          buttonTextColor: '#F44336'
        };
      default:
        return {
          title: 'Abonnement',
          message: 'Vérification de votre abonnement...',
          icon: 'information-circle',
          iconColor: '#FFFFFF',
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
    }
  };

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={config.gradientColors}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        {/* Content */}
        <View style={styles.content}>
          <View style={styles.leftSection}>
            <View style={styles.iconContainer}>
              <Ionicons 
                name={config.icon} 
                size={20} 
                color={config.iconColor} 
              />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.title}>{config.title}</Text>
              <Text style={styles.message}>{config.message}</Text>
            </View>
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
            
            {type !== 'expired' && (
              <TouchableOpacity 
                style={styles.dismissButton}
                onPress={handleDismiss}
              >
                <Ionicons name="close" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gradient: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  renewButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 80,
  },
  renewButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  dismissButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SubscriptionTopAlert;


