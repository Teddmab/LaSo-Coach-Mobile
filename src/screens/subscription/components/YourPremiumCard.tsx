import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../../constants/theme';
import { SubscriptionData } from '../types';

interface YourPremiumCardProps {
  subscription?: SubscriptionData | null;
}

const YourPremiumCard: React.FC<YourPremiumCardProps> = ({ subscription }) => {
  if (!subscription?.subscription) {
    return null;
  }

  const plan = subscription.subscription.plan;
  const planName = plan?.name || 'Premium';
  const daysRemaining = subscription.subscription.daysRemaining || 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="star" size={24} color="#FFD700" />
        <Text style={styles.title}>Votre abonnement {planName}</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.statusText}>
          {subscription.status === 'ACTIVE' ? 'Actif' : 'Inactif'}
        </Text>
        
        {daysRemaining > 0 && (
          <Text style={styles.daysText}>
            {daysRemaining} jour{daysRemaining > 1 ? 's' : ''} restant{daysRemaining > 1 ? 's' : ''}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginLeft: 8,
  },
  content: {
    marginTop: 8,
  },
  statusText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  daysText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
});

export default YourPremiumCard;

