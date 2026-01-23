import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import InvoicesBottomSheet from './InvoicesBottomSheet';

interface ProfileOtherInfosSectionProps {
  subscriptionData: any;
  onViewInvoices?: () => void;
  onRenewSubscription?: () => void;
}

const ProfileOtherInfosSection: React.FC<ProfileOtherInfosSectionProps> = ({
  subscriptionData,
  onViewInvoices,
  onRenewSubscription,
}) => {
  const [showInvoicesSheet, setShowInvoicesSheet] = useState(false);

  // Calculate days remaining
  const getDaysRemaining = (endDate: string) => {
    if (!endDate) return 0;
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Non renseigné';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const subscription = subscriptionData?.subscription || subscriptionData;
  const plan = subscription?.plan || {};
  const daysRemaining = subscription?.endDate
    ? getDaysRemaining(subscription.endDate)
    : null;

  const infoItems = [
    {
      icon: 'card-outline',
      label: 'Plan d\'abonnement',
      value: (subscription?.status === 'expired' || subscription?.status === 'inactive') ? 'Plan Test' : (plan.name || 'Aucun abonnement actif'),
      color: (plan.name || subscription?.status === 'expired' || subscription?.status === 'inactive') ? theme.colors.primary : theme.colors.text.secondary,
    },
    {
      icon: 'calendar-outline',
      label: 'Date de début',
      value: formatDate(subscription?.startDate),
    },
    {
      icon: 'calendar-outline',
      label: 'Date de fin',
      value: formatDate(subscription?.endDate),
    },
    {
      icon: 'time-outline',
      label: 'Jours restants',
      value: daysRemaining !== null
        ? `${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}`
        : 'Non renseigné',
      color: daysRemaining !== null && daysRemaining < 7 ? '#FF6B35' : undefined,
    },
    {
      icon: 'cash-outline',
      label: 'Prix',
      value: plan.price ? `${plan.price}€ / mois` : 'Non renseigné',
    },
    {
      icon: 'checkmark-circle-outline',
      label: 'Statut',
      value: subscription?.status === 'active' ? 'Actif' :
        (subscription?.status === 'expired' || subscription?.status === 'inactive') ? 'Actif' : // Plan Test par défaut
          subscription?.status === 'cancelled' ? 'Annulé' : 'Non renseigné',
      color: (subscription?.status === 'active' || subscription?.status === 'expired' || subscription?.status === 'inactive') ? '#4CAF50' : undefined,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="information-circle-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.title}>Autre infos</Text>
        </View>
      </View>

      <View style={styles.content}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {infoItems.map((item, index) => (
            <View key={index} style={styles.infoItem}>
              <View style={styles.infoItemLeft}>
                <Ionicons
                  name={item.icon as any}
                  size={20}
                  color={item.color || theme.colors.text.secondary}
                />
                <Text style={styles.infoLabel}>{item.label}</Text>
              </View>
              <Text
                style={[
                  styles.infoValue,
                  item.color && { color: item.color, fontWeight: '600' }
                ]}
                numberOfLines={2}
              >
                {item.value}
              </Text>
            </View>
          ))}

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowInvoicesSheet(true)}
          >
            <Ionicons name="document-text-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.actionButtonText}>Voir les factures</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
          </TouchableOpacity>

        </ScrollView>
      </View>

      <InvoicesBottomSheet
        visible={showInvoicesSheet}
        onClose={() => setShowInvoicesSheet(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  content: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  infoItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: '400',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.primary,
    flex: 1,
  },
  renewButton: {
    backgroundColor: theme.colors.primary,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderTopWidth: 0,
  },
  renewButtonText: {
    color: '#FFFFFF',
  },
});

export default ProfileOtherInfosSection;

