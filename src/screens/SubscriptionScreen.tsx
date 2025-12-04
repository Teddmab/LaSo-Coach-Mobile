import React from 'react';
import { View, Text, ScrollView, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { theme } from '../constants/theme';
import FixedLayout from '../components/FixedLayout';
import SubscriptionPaymentFlow from '../components/SubscriptionPaymentFlow';
import { useAuth } from '../context/FirebaseAuthContext';
import { SubscriptionScreenProps, PaymentData } from './subscription/types';
import { useSubscriptionScreen } from './subscription/hooks/useSubscriptionScreen';
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
}) => {
  const { user: authUser, refreshProfile, currentUser } = useAuth();
  const user = propUser || authUser || currentUser;

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
  } = useSubscriptionScreen(navigation, refreshProfile);

  const handleFAQPress = () => {
    if (onTabPress) {
      onTabPress('faq');
    } else if (navigation) {
      console.log('Navigate to FAQ');
    }
  };

  const currentPlanId = currentSubscription?.subscription?.plan?.id;

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
        
        <ManageSubscriptionCard
          subscription={currentSubscription}
          invoices={invoices}
          onViewInvoices={handleViewInvoices}
        />
        
        <View style={styles.sectionContainer}>
          <TouchableOpacity 
            style={styles.faqLink}
            onPress={handleFAQPress}
          >
            <Text style={styles.faqLinkText}>
              Vous avez des questions? Consultez notre centre d'aide et FAQ
            </Text>
          </TouchableOpacity>

          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrent={plan.id === currentPlanId}
              onSelect={handlePlanSelect}
            />
          ))}
        </View>
      </ScrollView>

      <InvoiceModal
        visible={showInvoiceModal}
        invoices={invoices}
        loading={loadingInvoices}
        onClose={() => setShowInvoiceModal(false)}
      />

      {showPaymentFlow && selectedPlan && (
        <Modal
          visible={showPaymentFlow}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            setShowPaymentFlow(false);
            setSelectedPlan(null);
          }}
        >
          <View style={styles.bottomSheetOverlay}>
            <TouchableOpacity
              style={styles.bottomSheetBackdrop}
              activeOpacity={1}
              onPress={() => {
                setShowPaymentFlow(false);
                setSelectedPlan(null);
              }}
            />
            <View style={styles.bottomSheetContainer}>
              <View style={styles.bottomSheetHandleContainer}>
                <View style={styles.bottomSheetHandle} />
              </View>
              
              <View style={styles.bottomSheetContent}>
                <SubscriptionPaymentFlow
                  visible={true}
                  isEmbedded={true}
                  plan={selectedPlan}
                  onClose={() => {
                    setShowPaymentFlow(false);
                    setSelectedPlan(null);
                  }}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}
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
    paddingBottom: 20,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
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
});

export default SubscriptionScreen;

