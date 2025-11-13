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

const SubscriptionBanner = ({ 
  subscriptionData,
  onRenew 
}) => {
  // Don't show banner if no subscription data
  if (!subscriptionData) {
    return null;
  }

  // Show banner if:
  // 1. Status is EXPIRED, CANCELLED, or INACTIVE
  // 2. OR ≤3 days remaining (paid) or ≤1 day (free trial)
  const statusRequiresAlert = subscriptionData.status === 'EXPIRED' || 
                               subscriptionData.status === 'CANCELLED' || 
                               subscriptionData.status === 'INACTIVE';
  
  const daysThreshold = subscriptionData.isTrial ? 1 : 3;
  const daysRequireAlert = subscriptionData.daysRemaining !== undefined && 
                           subscriptionData.daysRemaining > 0 && 
                           subscriptionData.daysRemaining <= daysThreshold;
  
  // Don't show if subscription is active and not expiring soon
  if (!statusRequiresAlert && !daysRequireAlert) {
    return null;
  }

  const isExpired = statusRequiresAlert || (subscriptionData.daysRemaining !== undefined && subscriptionData.daysRemaining <= 0);
  const isExpiringSoon = !isExpired && daysRequireAlert;

  const getBannerConfig = () => {
    if (isExpired) {
      return {
        icon: 'warning',
        iconColor: '#F44336',
        gradientColors: ['#F44336', '#D32F2F'],
        title: 'Abonnement Expiré',
        subtitle: 'Renouvelez pour continuer l\'accès',
        buttonText: 'Renouveler',
        buttonColor: '#FFFFFF',
        buttonTextColor: '#F44336'
      };
    } else if (isExpiringSoon) {
      return {
        icon: 'time',
        iconColor: '#FF9800',
        gradientColors: ['#FF9800', '#F57C00'],
        title: `Expire dans ${subscriptionData.daysRemaining} jour(s)`,
        subtitle: 'Renouvelez pour éviter l\'interruption',
        buttonText: 'Renouveler',
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

  const handleRenew = () => {
    if (onRenew) {
      onRenew();
    }
  };

  return (
    <LinearGradient
      colors={config.gradientColors}
      style={styles.banner}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
    >
      <View style={styles.bannerContent}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons 
            name={config.icon} 
            size={24} 
            color={config.iconColor} 
          />
        </View>

        {/* Text Content */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{config.title}</Text>
          <Text style={styles.subtitle}>{config.subtitle}</Text>
        </View>

        {/* Action Button */}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default SubscriptionBanner; 