import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Plan } from '../types';
import { getPlanBackgroundColor } from '../utils/subscriptionUtils';
import { useIOSSimulation } from '../../../hooks/useIOSSimulation';

interface PlanCardProps {
  plan: Plan;
  isCurrent?: boolean;
  onSelect: (plan: Plan) => void;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, isCurrent, onSelect }) => {
  const { shouldShowIOSOnly } = useIOSSimulation();
  const isIOS = shouldShowIOSOnly();
  const backgroundColor = getPlanBackgroundColor(plan.name);
  const features = plan.features || [];

  return (
    <View style={styles.planCardWithImage}>
      {plan.imageUrl ? (
        <Image 
          source={{ uri: plan.imageUrl }} 
          style={styles.planCardImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.planCardImagePlaceholder, { backgroundColor: backgroundColor + '20' }]}>
          <Ionicons name="images-outline" size={48} color={backgroundColor} />
        </View>
      )}
      
      <View style={[styles.planCardContent, { backgroundColor }]}>
        <Text style={styles.planCardNameLarge}>{plan.name}</Text>
        
        {/* Masquer les prix sur iOS (Reader App model) */}
        {!isIOS && (
          <View style={styles.planCardPricing}>
            {plan.originalPrice && plan.originalPrice > plan.price && (
              <Text style={styles.planCardOldPrice}>
                {plan.currency || '€'}{plan.originalPrice} /mois
              </Text>
            )}
            <Text style={styles.planCardPriceLarge}>
              {plan.currency || '€'}{plan.price}
            </Text>
          </View>
        )}
        
        {/* Sur iOS, masquer le bouton "S'abonner" et afficher seulement "Plan actuel" si c'est le plan actuel */}
        {isIOS ? (
          isCurrent ? (
            <View style={styles.planCurrentBadge}>
              <Text style={[styles.planCurrentBadgeText, { color: backgroundColor }]}>
                Plan actuel
              </Text>
            </View>
          ) : null
        ) : (
          <TouchableOpacity 
            style={styles.planSubscribeButton}
            onPress={() => onSelect(plan)}
            disabled={isCurrent}
          >
            <Text style={[styles.planSubscribeButtonText, { color: backgroundColor }]}>
              {isCurrent ? 'Plan actuel' : "S'abonner"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {features.length > 0 && (
        <View style={styles.planFeaturesSection}>
          <Text style={styles.planFeaturesTitle}>Inclus dans cette formule :</Text>
          {features.map((feature, index) => (
            <View key={index} style={styles.planFeatureItem}>
              <View style={[styles.planFeatureCheckmark, { backgroundColor }]}>
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              </View>
              <Text style={styles.planFeatureText}>{feature}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  planCardWithImage: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  planCardImage: {
    width: '100%',
    height: 200,
  },
  planCardImagePlaceholder: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planCardContent: {
    padding: 20,
  },
  planCardNameLarge: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  planCardPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  planCardOldPrice: {
    fontSize: 16,
    color: '#FFFFFF',
    textDecorationLine: 'line-through',
    marginRight: 12,
    opacity: 0.8,
  },
  planCardPriceLarge: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  planSubscribeButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    opacity: 1,
  },
  planSubscribeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  planFeaturesSection: {
    backgroundColor: '#F5F5DC',
    padding: 20,
  },
  planFeaturesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  planFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  planFeatureCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  planFeatureText: {
    fontSize: 14,
    color: '#2C3E50',
    flex: 1,
  },
  planCurrentBadge: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    opacity: 0.9,
  },
  planCurrentBadgeText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PlanCard;

