import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface InvoicesBottomSheetProps {
  visible: boolean;
  onClose: () => void;
}

interface Invoice {
  id?: string;
  status?: string;
  subscriptionStatus?: string;
  planName?: string;
  plan?: {
    name?: string;
  };
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  beginDate?: string;
  expiresAt?: string;
  nextBillingDate?: string;
  price?: number;
  amount?: number;
  currency?: string;
  isFree?: boolean;
}

const InvoicesBottomSheet: React.FC<InvoicesBottomSheetProps> = ({
  visible,
  onClose,
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      fetchInvoices();
    }
  }, [visible]);

  const fetchInvoices = async () => {
    // Invoice history disabled - subscription payment system removed
    setInvoices([]);
    setLoading(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  const getStatusBadgeStyle = (status?: string) => {
    const normalizedStatus = (status || '').toUpperCase();
    if (normalizedStatus === 'ACTIVE' || normalizedStatus === 'CONFIRMED') {
      return { backgroundColor: 'rgba(76, 175, 80, 0.1)' };
    }
    if (normalizedStatus === 'EXPIRED' || normalizedStatus === 'CANCELLED') {
      return { backgroundColor: 'rgba(255, 107, 53, 0.1)' };
    }
    return { backgroundColor: 'rgba(158, 158, 158, 0.1)' };
  };

  const getStatusTextColor = (status?: string) => {
    const normalizedStatus = (status || '').toUpperCase();
    if (normalizedStatus === 'ACTIVE' || normalizedStatus === 'CONFIRMED') {
      return '#4CAF50';
    }
    if (normalizedStatus === 'EXPIRED' || normalizedStatus === 'CANCELLED') {
      return '#FF6B35';
    }
    return '#9E9E9E';
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Factures</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={onClose}
              >
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
          
          <ScrollView 
            style={styles.modalContent} 
            contentContainerStyle={styles.modalContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Chargement des factures...</Text>
              </View>
            ) : invoices.length > 0 ? (
              <View style={styles.invoicesList}>
                {invoices.map((invoice, index) => {
                  const status = invoice.status || invoice.subscriptionStatus || 'EXPIRED';
                  const planName = invoice.planName || invoice.plan?.name || 'N/A';
                  const startDate = formatDate(invoice.startDate || invoice.createdAt || invoice.beginDate);
                  const endDate = formatDate(invoice.endDate || invoice.expiresAt || invoice.nextBillingDate);
                  const price = invoice.price || invoice.amount || 0;
                  const currency = invoice.currency || '€';
                  const isFree = price === 0 || invoice.isFree || planName.toLowerCase().includes('free');
                  
                  return (
                    <View key={index} style={styles.invoiceCard}>
                      <View style={styles.invoiceHeader}>
                        <Text style={styles.planName}>{planName}</Text>
                        <View style={[styles.statusBadge, getStatusBadgeStyle(status)]}>
                          <Text style={[styles.statusText, { color: getStatusTextColor(status) }]}>
                            {status.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.invoiceDetails}>
                        <View style={styles.detailRow}>
                          <Ionicons name="calendar-outline" size={16} color={theme.colors.text.secondary} />
                          <Text style={styles.detailLabel}>Début:</Text>
                          <Text style={styles.detailValue}>{startDate}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Ionicons name="calendar-outline" size={16} color={theme.colors.text.secondary} />
                          <Text style={styles.detailLabel}>Fin:</Text>
                          <Text style={styles.detailValue}>{endDate}</Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Ionicons name="cash-outline" size={16} color={theme.colors.text.secondary} />
                          <Text style={styles.detailLabel}>Montant:</Text>
                          <Text style={[styles.detailValue, styles.priceValue]}>
                            {isFree ? 'Gratuit' : `${price} ${currency}`}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={64} color={theme.colors.text.secondary} />
                <Text style={styles.emptyText}>Aucune facture disponible</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
    minHeight: 400,
    flex: 1,
  },
  safeArea: {
    flex: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  invoicesList: {
    gap: 12,
  },
  invoiceCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  invoiceDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    minWidth: 60,
  },
  detailValue: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: '500',
    flex: 1,
  },
  priceValue: {
    fontWeight: '600',
    color: theme.colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginTop: 16,
  },
});

export default InvoicesBottomSheet;

