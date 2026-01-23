import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../constants/theme';
import SubscriptionPaymentFlowImproved from '../../../components/SubscriptionPaymentFlowImproved';
import SubscriptionApi from '../../../services/subscriptionApi';
import { ShimmerCard } from '../../../components/Shimmer';

interface SubscriptionPlansModalProps {
  visible: boolean;
  plans: any[];
  loading: boolean;
  selectedPlan: any | null;
  showPaymentFlow: boolean;
  onClose: () => void;
  onPlanSelect: (plan: any) => Promise<void>;
  onPaymentSuccess: (paymentData: any) => Promise<void>;
  onPaymentError: (error: any) => void;
  onClosePaymentFlow: () => void;
}

const SubscriptionPlansModal: React.FC<SubscriptionPlansModalProps> = ({
  visible,
  plans,
  loading,
  selectedPlan,
  showPaymentFlow,
  onClose,
  onPlanSelect,
  onPaymentSuccess,
  onPaymentError,
  onClosePaymentFlow,
}) => {
  return (
    <>
      <Modal
        visible={visible && !showPaymentFlow}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={onClose}
          />
          <View style={styles.container}>
            {/* Handle */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Choisissez votre abonnement</Text>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ShimmerCard />
                  <ShimmerCard />
                  <ShimmerCard />
                </View>
              ) : plans.length > 0 ? (
                plans.map((plan) => {
                  if (!plan?.id || typeof plan.id !== 'string' || plan.id.trim() === '') {
                    return null;
                  }

                  let backgroundColor = '#4CAF50';
                  if (plan.name?.toLowerCase().includes('premium')) {
                    backgroundColor = '#8B5CF6';
                  } else if (plan.name?.toLowerCase().includes('flexy')) {
                    backgroundColor = '#FF6B35';
                  } else if (plan.name?.toLowerCase().includes('basic')) {
                    backgroundColor = '#2196F3';
                  }

                  return (
                    <TouchableOpacity
                      key={plan.id}
                      style={[styles.planItem, { borderLeftColor: backgroundColor }]}
                      onPress={() => onPlanSelect(plan)}
                    >
                      <View style={styles.planContent}>
                        <Text style={styles.planName}>{plan.name}</Text>
                        <View style={styles.planPricing}>
                          {plan.discountPrice && plan.discountPrice < plan.price ? (
                            <View style={styles.pricingRow}>
                              <Text style={[styles.planPrice, { color: theme.colors.primary }]}>
                                {plan.currency || '€'}{plan.discountPrice}
                              </Text>
                              <Text style={[styles.planPrice, styles.discountedPrice]}>
                                {plan.currency || '€'}{plan.price}
                              </Text>
                            </View>
                          ) : (
                            <Text style={styles.planPrice}>
                              {plan.currency || '€'}{plan.price}
                            </Text>
                          )}
                          {plan.duration && (
                            <Text style={styles.planDuration}>
                              / {plan.duration}
                            </Text>
                          )}
                        </View>
                        {plan.features && plan.features.length > 0 && (
                          <Text style={styles.planFeatures}>
                            {plan.features.slice(0, 2).join(' • ')}
                          </Text>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="card-outline" size={48} color={theme.colors.text.secondary} />
                  <Text style={styles.emptyText}>Aucun plan disponible</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Payment Flow - Rendered independently */}
      <SubscriptionPaymentFlowImproved
        visible={showPaymentFlow && !!selectedPlan}
        plan={selectedPlan}
        onClose={onClosePaymentFlow}
        onSuccess={onPaymentSuccess}
        onError={onPaymentError}
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: theme.colors.text.secondary,
  },
  planItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginVertical: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  planContent: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  planPricing: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  discountedPrice: {
    textDecorationLine: 'line-through',
    color: theme.colors.text.secondary,
    fontSize: 14,
  },
  planDuration: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginLeft: 4,
  },
  planFeatures: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 12,
    color: theme.colors.text.secondary,
  },
});

export default SubscriptionPlansModal;

