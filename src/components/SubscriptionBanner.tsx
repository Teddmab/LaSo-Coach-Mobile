import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';

interface SubscriptionBannerProps {
  subscriptionData?: any;
  onRenew?: () => void;
}

const SubscriptionBanner: React.FC<SubscriptionBannerProps> = ({
  subscriptionData,
  onRenew
}) => {
  if (!subscriptionData) {
    return null;
  }

  const status = subscriptionData.status || subscriptionData.subscription?.status;
  const isExpired = subscriptionData.isExpired || false;
  const daysRemaining = subscriptionData.daysRemaining ?? subscriptionData.subscription?.daysRemaining ?? 0;
  const isTrial = subscriptionData.isTrial ?? subscriptionData.subscription?.isTrial ?? false;

  // Ne pas afficher l'alerte si le statut est ACTIVE (même pour plan FREE par défaut)
  // On a toujours un plan par défaut en cas de non-abonnement, donc on ne doit pas voir "abonnement expiré"
  const hasActivePlan = status === 'ACTIVE' ||
    subscriptionData.subscription?.status?.toUpperCase() === 'ACTIVE';

  // Désactivé complètement selon la demande utilisateur : "retire moi ca de partout"
  // Si pas d'abonnement -> Plan Test/Free. Si abonnement -> Plan en cours.
  // Pas de messages d'expiration.
  const statusRequiresAlert = false;

  const daysThreshold = isTrial ? 1 : 3;
  const daysRequireAlert = false;

  if (!statusRequiresAlert && !daysRequireAlert) {
    return null;
  }

  const isExpiredStatus = statusRequiresAlert || (daysRemaining !== undefined && daysRemaining <= 0);
  const isExpiringSoon = !isExpiredStatus && daysRequireAlert;

  const getBannerConfig = () => {
    if (isExpiredStatus) {
      return {
        icon: 'warning' as const,
        iconColor: '#F44336',
        gradientColors: ['#F44336', '#D32F2F'],
        title: 'Abonnement Expiré',
        subtitle: 'Veuillez vous réabonner pour continuer l\'accès',
        buttonText: 'S\'abonner',
        buttonColor: '#FFFFFF',
        buttonTextColor: '#F44336'
      };
    } else if (isExpiringSoon) {
      return {
        icon: 'time' as const,
        iconColor: '#FF9800',
        gradientColors: ['#FF9800', '#F57C00'],
        title: `Expire dans ${daysRemaining} jour(s)`,
        subtitle: 'Veuillez vous réabonner pour éviter l\'interruption',
        buttonText: 'S\'abonner',
        buttonColor: '#FFFFFF',
        buttonTextColor: '#FF9800'
      };
    }

    return null;
  };

  const config = getBannerConfig();

  if (!config) {
    return null;
  }

  // Sur iOS, ne pas afficher le banner - on affichera juste un message dans le header
  if (Platform.OS === 'ios') {
    return null;
  }

  const handleRenew = () => {
    if (onRenew) {
      onRenew();
    }
  };

  return (
    <LinearGradient
      colors={config.gradientColors as [string, string]}
      style={styles.banner}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
    >
      <View style={styles.bannerContent}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={config.icon}
            size={24}
            color={config.iconColor}
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>{config.title}</Text>
          <Text style={styles.subtitle}>{config.subtitle}</Text>
        </View>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: config.buttonColor }]}
          onPress={handleRenew}
        >
          <Text style={[styles.actionButtonText, { color: config.buttonTextColor }]}>
            {config.buttonText}
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default SubscriptionBanner;

