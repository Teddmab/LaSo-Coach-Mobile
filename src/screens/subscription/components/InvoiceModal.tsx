import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../constants/theme';
import { Invoice } from '../types';

interface InvoiceModalProps {
  visible: boolean;
  invoices: Invoice[];
  loading?: boolean;
  onClose: () => void;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({
  visible,
  invoices,
  loading = false,
  onClose,
}) => {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatAmount = (amount: number, currency: string = '$') => {
    return `${currency}${amount.toFixed(2)}`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Factures</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : invoices.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={48} color={theme.colors.text.secondary} />
              <Text style={styles.emptyText}>Aucune facture disponible</Text>
            </View>
          ) : (
            <ScrollView style={styles.list}>
              {invoices.map((invoice) => (
                <View key={invoice.id} style={styles.invoiceItem}>
                  <View style={styles.invoiceHeader}>
                    <Text style={styles.invoicePlan}>{invoice.planName || 'Abonnement'}</Text>
                    <Text style={styles.invoiceAmount}>
                      {formatAmount(invoice.amount, invoice.currency)}
                    </Text>
                  </View>
                  <View style={styles.invoiceDetails}>
                    <Text style={styles.invoiceDate}>
                      {formatDate(invoice.createdAt)}
                    </Text>
                    <View style={[
                      styles.statusBadge,
                      invoice.status === 'paid' && styles.statusPaid,
                    ]}>
                      <Text style={styles.statusText}>
                        {invoice.status === 'paid' ? 'Payée' : 'En attente'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginTop: 16,
  },
  list: {
    padding: 20,
  },
  invoiceItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  invoicePlan: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  invoiceAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  invoiceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceDate: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FFF3CD',
  },
  statusPaid: {
    backgroundColor: '#D4EDDA',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
});

export default InvoiceModal;

