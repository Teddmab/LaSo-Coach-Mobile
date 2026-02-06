import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface SubscriptionAlertProps {
  subscription: any;
  onRenew?: () => void;
}

const SubscriptionAlert: React.FC<SubscriptionAlertProps> = ({ subscription, onRenew }) => {
  if (!subscription) return null;

  // Check if user is on free trial
  const isFreeTrial = subscription?.status === 'FREE' || subscription?.planName?.toLowerCase().includes('free');
  
  // Check if subscription is expired (only for paid subscriptions)
  const isExpired = subscription?.status === 'EXPIRED' || subscription?.status === 'CANCELLED';
  
  // Check if subscription is expiring soon (only for paid subscriptions)
  const isExpiringSoon = !isFreeTrial && 
                         subscription?.status !== 'EXPIRED' && 
                         subscription?.daysRemaining > 0 && 
                         subscription?.daysRemaining <= 7;

  // For free trial, show alert if trial is ending soon (within 1 day)
  const isTrialEndingSoon = isFreeTrial && 
                            subscription?.daysRemaining !== null && 
                            subscription?.daysRemaining <= 1;

  // Don't show alert if none of the conditions are met
  if (!isExpired && !isExpiringSoon && !isTrialEndingSoon) {
    return null;
  }

  // Determine colors and content based on status
  const gradientColors = isFreeTrial 
    ? ['#3B82F6', '#8B5CF6'] 
    : ['#F97316', '#EF4444'];
  
  const iconName = isFreeTrial 
    ? 'time-outline' 
    : isExpired 
      ? 'alert-circle-outline' 
      : 'crown-outline';
  
  const title = isFreeTrial 
    ? 'Essai gratuit en cours' 
    : isExpired 
      ? subscription?.status === 'CANCELLED' ? 'Abonnement annulé' : 'Abonnement expiré'
      : 'Abonnement expire bientôt';
  
  const message = isFreeTrial 
    ? `Votre essai gratuit se termine dans ${subscription?.daysRemaining || 0} jour(s). Passez à un abonnement premium pour continuer.`
    : isExpired 
      ? subscription?.status === 'CANCELLED' 
        ? 'Votre abonnement a été annulé. Renouvelez pour continuer à accéder à tous les services.'
        : 'Votre abonnement a expiré. Renouvelez pour continuer à accéder à tous les services.'
      : `Votre abonnement expire dans ${subscription?.daysRemaining} jour(s). Renouvelez pour continuer.`;
  
  const buttonText = isFreeTrial ? 'Passer au premium' : 'Renouveler';

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name={iconName as any} size={24} color="#FFFFFF" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
      {onRenew && (
        <TouchableOpacity 
          style={styles.button}
          onPress={onRenew}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>{buttonText}</Text>
        </TouchableOpacity>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  message: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#F97316',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SubscriptionAlert;

