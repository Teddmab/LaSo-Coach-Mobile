import React from 'react';
import { View, Text, ScrollView, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { theme } from '../constants/theme';
import FixedLayout from '../components/FixedLayout';
import SubscriptionPaymentFlowImproved from '../components/SubscriptionPaymentFlowImproved';
import { useAuth } from '../context/FirebaseAuthContext';
import { SubscriptionScreenProps, PaymentData } from './subscription/types';
import { useSubscriptionScreen } from './subscription/hooks/useSubscriptionScreen';
import useCompanionMode from '../hooks/useCompanionMode';
import YourPremiumCard from './subscription/components/YourPremiumCard';
import ManageSubscriptionCard from './subscription/components/ManageSubscriptionCard';
import PlanCard from './subscription/components/PlanCard';
import InvoiceModal from './subscription/components/InvoiceModal';
import { ShimmerCard, ShimmerList } from '../components/Shimmer';

const SubscriptionScreen: React.FC<SubscriptionScreenProps> = ({
  navigation,
  onClose,
  onNext,
  isStandalone = true,
  onTabPress,
  user: propUser,
  activeTab = 'home',
  showBackButton = false,
  onBackPress,
  onRefresh, // ✅ Callback optionnel pour rafraîchir le dashboard
  onFAQPress: onFAQPressProp,
}) => {
  const { user: authUser, refreshProfile, currentUser } = useAuth();
  const user = propUser || authUser || currentUser;
  const { isCompanionMode, companionMessage } = useCompanionMode();

  const {
    loading,
    plans,
    currentSubscription,
    selectedPlan,
    showInvoiceModal,
    invoices,
    loadingInvoices,
    profileData,
    showPaymentFlow,
    setShowInvoiceModal,
    setShowPaymentFlow,
    setSelectedPlan,
    handlePlanSelect,
    handlePaymentSuccess,
    handlePaymentError,
    handleViewInvoices,
    isPlanClickable,
  } = useSubscriptionScreen(navigation, refreshProfile, onRefresh); // ✅ Passer onRefresh au hook

  const handleFAQPress = () => {
    if (onFAQPressProp) {
      onFAQPressProp();
    } else if (onTabPress) {
      onTabPress('faq');
    } else if (navigation?.navigate) {
      navigation.navigate('FAQ');
    }
  };

  const currentPlanId = currentSubscription?.subscription?.plan?.id;
  const currentPlan = currentSubscription?.subscription?.plan;
  const hasActivePaidPlan = currentSubscription?.status === 'ACTIVE' && 
                            currentPlan && 
                            currentPlan.price > 0 && 
                            !currentPlan.isFree;

  if (loading) {
    return (
      <FixedLayout
        headerTitle="Abonnement"
        onHelpPress={handleFAQPress}
        onNotificationPress={() => {
          if (onTabPress) {
            onTabPress('notifications');
          }
        }}
        onProfilePress={() => {
          if (onTabPress) {
            onTabPress('settings');
          }
        }}
        avatarSource={profileData?.avatar || user?.avatar}
        avatarFallbackText={user?.firstName?.charAt(0) || user?.name?.charAt(0) || 'U'}
        activeTab={activeTab || 'home'}
        onTabPress={onTabPress}
        showBackButton={showBackButton}
        onBackPress={onBackPress}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.sectionContainer}>
            <ShimmerCard />
            <ShimmerCard />
            <ShimmerCard />
          </View>
        </ScrollView>
      </FixedLayout>
    );
  }

  return (
    <FixedLayout
      headerTitle="Abonnement"
      onHelpPress={handleFAQPress}
      onNotificationPress={() => {
        if (onTabPress) {
          onTabPress('notifications');
        }
      }}
      onProfilePress={() => {
        if (onTabPress) {
          onTabPress('settings');
        }
      }}
      avatarSource={profileData?.avatar || user?.avatar}
      avatarFallbackText={user?.firstName?.charAt(0) || user?.name?.charAt(0) || 'U'}
      activeTab={activeTab || 'home'}
      onTabPress={onTabPress}
      showBackButton={showBackButton}
      onBackPress={onBackPress}
    >
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.sectionContainer}>
          <View style={styles.encouragementBanner}>
            <Text style={styles.encouragementText}>
              Un abonnement, c'est investir en vous-même. Choisissez la formule qui vous accompagnera vers vos objectifs !
            </Text>
          </View>
        </View>

        <YourPremiumCard subscription={currentSubscription} />

        <View style={styles.sectionContainer}>
          <TouchableOpacity
            style={styles.faqLink}
            onPress={handleFAQPress}
          >
            <Text style={styles.faqLinkText}>
              Vous avez des questions? Consultez notre centre d'aide et FAQ
            </Text>
          </TouchableOpacity>

          {/* ✅ COMPLIANCE: iOS Companion Mode - Hide paid plans */}
          {isCompanionMode ? (
            <View style={styles.companionModeContainer}>
              <Text style={styles.companionModeTitle}>Gestion des abonnements</Text>
              <Text style={styles.companionModeMessage}>
                {companionMessage || 'Gérez votre abonnement sur le site web à lasocoach.com'}
              </Text>
            </View>
          ) : plans.length > 0 ? (
            plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isCurrent={plan.id === currentPlanId}
                hasActivePaidPlan={hasActivePaidPlan}
                onSelect={handlePlanSelect}
              />
            ))
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>
                Aucun plan d'abonnement disponible pour le moment.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <InvoiceModal
        visible={showInvoiceModal}
        invoices={invoices}
        loading={loadingInvoices}
        onClose={() => setShowInvoiceModal(false)}
      />

      {/* Debug: Log state changes */}
      {(() => {
        const isVisible = showPaymentFlow && !!selectedPlan;
        console.log('🔄 [SubscriptionScreen] Render - State check:', {
          showPaymentFlow,
          selectedPlan: selectedPlan?.id,
          selectedPlanName: selectedPlan?.name,
          hasSelectedPlan: !!selectedPlan,
          visible: isVisible,
          willRenderModal: showPaymentFlow && !!selectedPlan
        });
        
        if (showPaymentFlow && selectedPlan) {
          console.log('✅ [SubscriptionScreen] Modal SHOULD BE RENDERED');
        } else {
          console.log('❌ [SubscriptionScreen] Modal WILL NOT BE RENDERED');
        }
        return null;
      })()}

      {showPaymentFlow && selectedPlan ? (
        <SubscriptionPaymentFlowImproved
          visible={true}
          plan={selectedPlan}
          onClose={() => {
            console.log('🔄 [SubscriptionScreen] Closing payment flow');
            setShowPaymentFlow(false);
            setSelectedPlan(null);
          }}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
      ) : null}
    </FixedLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingBottom: 48,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  encouragementBanner: {
    backgroundColor: '#FFF9C4',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  encouragementText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    textAlign: 'center',
    lineHeight: 20,
  },
  faqLink: {
    marginBottom: 20,
    paddingVertical: 8,
  },
  faqLinkText: {
    fontSize: 14,
    color: '#007AFF',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  bottomSheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bottomSheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '70%',
    height: '85%',
  },
  bottomSheetContent: {
    flex: 1,
    overflow: 'hidden',
  },
  bottomSheetHandleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#CCCCCC',
    borderRadius: 2,
  },
  companionModeContainer: {
    backgroundColor: theme.colors.surface,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  companionModeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  companionModeMessage: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyStateContainer: {
    backgroundColor: theme.colors.surface,
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default SubscriptionScreen;

