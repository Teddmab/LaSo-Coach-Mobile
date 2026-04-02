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
        <Text style={styles.title}>État du compte</Text>
        {isActive && (
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Actif</Text>
          </View>
        )}
      </View>
      
      <View style={styles.invoiceContent}>
        <View style={styles.invoiceRow}>
          <Text style={styles.invoiceLabel}>Plan actuel</Text>
          <Text style={styles.invoiceValue}>{planName}</Text>
        </View>
        
        <View style={styles.invoiceDivider} />
        
        <View style={styles.invoiceRow}>
          <Text style={styles.invoiceLabel}>Jours restants</Text>
          <Text style={[styles.invoiceValue, daysRemaining <= 7 && styles.invoiceValueWarning]}>
            {daysRemaining > 0 ? `${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}` : 'Expiré'}
          </Text>
        </View>
        
        {planPrice > 0 && (
          <>
            <View style={styles.invoiceDivider} />
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceLabel}>Montant</Text>
              <Text style={styles.invoiceValue}>
                {planCurrency}{planPrice}{priceSuffix}
              </Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
    marginRight: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4CAF50',
    textTransform: 'uppercase',
  },
  invoiceContent: {
    marginTop: 4,
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  invoiceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    flex: 1,
  },
  invoiceValue: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'right',
    flex: 1,
  },
  invoiceValueWarning: {
    color: '#FF6B35',
  },
  invoiceDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 4,
  },
});

export default YourPremiumCard;

