import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../constants/theme';
import { SubscriptionData } from '../types';

interface YourPremiumCardProps {
  subscription?: SubscriptionData | null;
}

const YourPremiumCard: React.FC<YourPremiumCardProps> = ({ subscription }) => {
  if (!subscription?.subscription) {
    return null;
  }

  const plan = subscription.subscription?.plan;
  const planName = plan?.name || 'Premium';
  const daysRemaining = subscription.subscription?.daysRemaining || subscription.daysRemaining || 0;
  const planPrice = plan?.price || plan?.effectivePrice || 0;
  const planCurrency = plan?.currency || '$';
  const isAnnual = planName?.toLowerCase().includes('annuel') || planName?.toLowerCase().includes('year');
  const priceSuffix = isAnnual ? '/an' : '/mois';
  const isActive = subscription.status === 'ACTIVE' || subscription.subscription?.status === 'ACTIVE';
  const isFreePlan = planPrice === 0 || plan?.isFree;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="star" size={28} color="#FFD700" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Votre abonnement</Text>
          <Text style={styles.planName}>{planName}</Text>
        </View>
        {isActive && (
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Actif</Text>
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={20} color={theme.colors.text.secondary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Jours restants</Text>
              <Text style={[styles.detailValue, daysRemaining <= 7 && styles.detailValueWarning]}>
                {daysRemaining > 0 ? `${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}` : 'Expiré'}
              </Text>
            </View>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={20} color={theme.colors.text.secondary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Prix</Text>
              <Text style={styles.detailValue}>
                {isFreePlan ? 'Gratuit' : `${planCurrency}${planPrice}${priceSuffix}`}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF9E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  planName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  content: {
    marginTop: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
  },
  detailContent: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  detailValueWarning: {
    color: '#FF6B35',
  },
});

export default YourPremiumCard;

