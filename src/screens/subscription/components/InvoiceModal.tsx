import React from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../constants/theme';
import { Invoice } from '../types';
import { formatDate, getStatusBadgeStyle, getStatusTextColor } from '../utils/subscriptionUtils';
import { ShimmerCard } from '../../../components/Shimmer';

interface InvoiceModalProps {
  visible: boolean;
  invoices: Invoice[];
  loading: boolean;
  onClose: () => void;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({
  visible,
  invoices,
  loading,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Historique des Abonnements</Text>
          <TouchableOpacity 
            style={styles.modalCloseButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.modalLoadingContainer}>
              <ShimmerCard />
              <ShimmerCard />
              <ShimmerCard />
            </View>
          ) : invoices.length > 0 ? (
            <View style={styles.historyTable}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderText}>Plan</Text>
                <Text style={styles.tableHeaderText}>Statut</Text>
                <Text style={styles.tableHeaderText}>Début</Text>
                <Text style={styles.tableHeaderText}>Fin</Text>
                <Text style={styles.tableHeaderText}>Prix</Text>
              </View>
              
              {invoices.map((invoice, index) => {
                const status = invoice.status || invoice.subscriptionStatus || 'EXPIRED';
                const planName = invoice.planName || invoice.plan?.name || 'N/A';
                const startDate = formatDate(invoice.startDate || invoice.createdAt || invoice.beginDate);
                const endDate = formatDate(invoice.endDate || invoice.expiresAt || invoice.nextBillingDate);
                const price = invoice.price || invoice.amount || 0;
                const currency = invoice.currency || '€';
                const isFree = price === 0 || invoice.isFree || planName.toLowerCase().includes('free');
                
                return (
                  <View key={index} style={styles.tableRow}>
                    <View style={styles.tableCell}>
                      <Text style={styles.tableCellText}>{planName}</Text>
                    </View>
                    <View style={[styles.tableCell, { alignItems: 'center' }]}>
                      <View style={[styles.statusBadge, getStatusBadgeStyle(status)]}>
                        <Text style={[styles.statusBadgeText, { color: getStatusTextColor(status) }]}>
                          {status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.tableCell}>
                      <Text style={styles.tableCellText}>{startDate}</Text>
                    </View>
                    <View style={styles.tableCell}>
                      <Text style={styles.tableCellText}>{endDate}</Text>
                    </View>
                    <View style={styles.tableCell}>
                      <Text style={styles.tableCellText}>
                        {isFree ? 'Gratuit' : `${currency}${price}`}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.modalEmptyContainer}>
              <Ionicons name="receipt-outline" size={48} color={theme.colors.text.secondary} />
              <Text style={styles.modalEmptyText}>Aucun historique disponible</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
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
    padding: 20,
  },
  modalLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  modalEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  modalEmptyText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginTop: 16,
  },
  historyTable: {
    marginTop: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#E0E0E0',
    marginBottom: 8,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#7F8C8D',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tableCell: {
    flex: 1,
    justifyContent: 'center',
  },
  tableCellText: {
    fontSize: 12,
    color: '#2C3E50',
    textAlign: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default InvoiceModal;

