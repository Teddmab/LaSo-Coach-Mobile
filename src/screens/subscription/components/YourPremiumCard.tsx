import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CurrentSubscription } from '../types';

interface YourPremiumCardProps {
  subscription: CurrentSubscription | null;
}

const YourPremiumCard: React.FC<YourPremiumCardProps> = ({ subscription }) => {
  if (!subscription || !subscription.hasSubscription) {
    return null;
  }

  const planType = subscription.subscription?.plan?.name || 'Individual';

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.premiumCard}>
        <View style={styles.subscriptionTag}>
          <Text style={styles.subscriptionTagText}>Subscription</Text>
        </View>
        
        <View style={styles.premiumHeader}>
          <Text style={styles.premiumLogo}>LaSo Coach</Text>
          <Text style={styles.premiumText}>Premium</Text>
        </View>
        
        <Text style={styles.planTypeText}>{planType}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  premiumCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subscriptionTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 12,
  },
  subscriptionTagText: {
    fontSize: 12,
    color: '#7F8C8D',
    fontWeight: '600',
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  premiumLogo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginRight: 8,
  },
  premiumText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  planTypeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B9D',
    marginBottom: 16,
  },
});

export default YourPremiumCard;

