import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../constants/theme';
import { SubscriptionData, Invoice } from '../types';

interface ManageSubscriptionCardProps {
  subscription?: SubscriptionData | null;
  invoices?: Invoice[];
  onViewInvoices?: () => void;
}

const ManageSubscriptionCard: React.FC<ManageSubscriptionCardProps> = ({
  subscription,
  invoices,
  onViewInvoices,
}) => {
  const invoiceCount = invoices?.length || 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gérer votre abonnement</Text>
      
      <View style={styles.actions}>
        {invoiceCount > 0 && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onViewInvoices}
          >
            <Ionicons name="receipt-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.actionText}>
              Voir les factures ({invoiceCount})
            </Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.infoText}>
          <Text style={styles.info}>
            Pour modifier ou annuler votre abonnement, veuillez contacter le support.
          </Text>
        </View>
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  actions: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  actionText: {
    fontSize: 16,
    color: theme.colors.primary,
    marginLeft: 8,
  },
  infoText: {
    marginTop: 8,
  },
  info: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
});

export default ManageSubscriptionCard;

