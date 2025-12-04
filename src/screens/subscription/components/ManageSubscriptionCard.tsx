import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CurrentSubscription, Invoice } from '../types';
import SubscriptionApi from '../../../services/subscriptionApi';
import { calculateBillingPeriod, getLatestActiveSubscription, formatDate } from '../utils/subscriptionUtils';

interface ManageSubscriptionCardProps {
  subscription: CurrentSubscription | null;
  invoices: Invoice[];
  onViewInvoices: () => void;
}

const ManageSubscriptionCard: React.FC<ManageSubscriptionCardProps> = ({
  subscription,
  invoices,
  onViewInvoices,
}) => {
  if (!subscription || !subscription.hasSubscription) {
    return null;
  }

  const sub = subscription.subscription;
  const planType = sub?.plan?.name || 'Individual';
  const price = sub?.plan?.price || 0;
  const currency = sub?.plan?.currency || '€';
  
  const latestActive = getLatestActiveSubscription(invoices);
  let billingPeriod = 'Mensuelle';
  let renewalDate = '-';

  if (latestActive) {
    const startDate = latestActive.startDate || latestActive.createdAt || latestActive.beginDate;
    const endDate = latestActive.endDate || latestActive.expiresAt || latestActive.nextBillingDate;
    
    if (startDate && endDate) {
      billingPeriod = calculateBillingPeriod(startDate, endDate);
    }
    
    if (endDate) {
      renewalDate = formatDate(endDate);
    }
  } else {
    renewalDate = sub?.nextBillingDate 
      ? formatDate(sub.nextBillingDate)
      : '-';
    billingPeriod = sub?.plan?.duration 
      ? SubscriptionApi.getBillingPeriod(sub.plan.duration)
      : 'Mensuelle';
  }

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.billingCard}>
        <Text style={styles.billingCardTitle}>Facturation</Text>
        <View style={styles.billingCardDivider} />
        <View style={styles.billingInfo}>
          <Text style={styles.billingInfoLabel}>Période de facturation:</Text>
          <Text style={styles.billingInfoValue}>{billingPeriod}</Text>
        </View>
        <View style={styles.billingInfo}>
          <Text style={styles.billingInfoLabel}>Date de Renouvellement:</Text>
          <Text style={styles.billingInfoValue}>{renewalDate}</Text>
        </View>
        <TouchableOpacity 
          style={styles.viewInvoicesButton}
          onPress={onViewInvoices}
        >
          <Text style={styles.viewInvoicesButtonText}>Voir les factures</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.cancelSubscriptionButton}
        onPress={() => {
          // TODO: Implement cancel subscription
        }}
      >
        <Text style={styles.cancelSubscriptionText}>Annuler l'abonnement</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  billingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  billingCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
  },
  billingCardDivider: {
    height: 2,
    backgroundColor: '#007AFF',
    marginBottom: 16,
    width: 40,
  },
  billingInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  billingInfoLabel: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  billingInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
  },
  viewInvoicesButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  viewInvoicesButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cancelSubscriptionButton: {
    marginTop: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelSubscriptionText: {
    fontSize: 16,
    color: '#2C3E50',
    textDecorationLine: 'underline',
  },
});

export default ManageSubscriptionCard;

