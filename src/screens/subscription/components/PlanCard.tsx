import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Plan } from '../types';
import { getPlanBackgroundColor } from '../utils/subscriptionUtils';
import imageCache from '../../../utils/imageCache';
import ImagePersistent from '../../../components/ImagePersistent';

interface PlanCardProps {
  plan: Plan;
  isCurrent?: boolean;
  hasActivePaidPlan?: boolean;
  onSelect: (plan: Plan) => void;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, isCurrent, hasActivePaidPlan, onSelect }) => {
  const features = plan.features || [];

  // Check if current plan is iOS default plan (contains "ios" in name, case-insensitive)
  const isCurrentIOSPlan = isCurrent && plan.name?.toLowerCase().includes('ios');
  // Check if this is a paid plan
  const isPaidPlan = plan.price > 0 && !plan.isFree;
  // If user has an active paid plan, disable other paid plans (but allow free plan)
  const isDisabled = hasActivePaidPlan && isPaidPlan && !isCurrent;
  // Allow upgrade from iOS plan to paid plans
  const isClickable = (!isCurrent || isCurrentIOSPlan) && !isDisabled;
  const buttonText = isDisabled 
    ? 'Non disponible' 
    : isCurrentIOSPlan 
      ? "Passer à ce plan" 
      : (isCurrent ? 'Plan actuel' : "S'abonner");

  // Déterminer si c'est un plan annuel
  const isAnnual = plan.name?.toLowerCase().includes('annuel') || plan.name?.toLowerCase().includes('year');
  
  // ✅ Déterminer si c'est un plan gratuit
  const isFreePlan = plan.price === 0 || plan.isFree || plan.name?.toLowerCase().includes('free') || plan.name?.toLowerCase().includes('gratuit');

  // Couleurs personnalisées selon la demande utilisateur
  // Plan annuel : fond orange clair, bouton orange vif
  // Plan gratuit : fond bleu, bouton blanc
  // Plan mensuel : fond #aece2e (vert/jaune), bouton blanc
  const cardBackgroundColor = isAnnual 
    ? '#FFB74D' 
    : isFreePlan 
      ? '#2196F3' // Bleu pour plan gratuit
      : (getPlanBackgroundColor(plan.name) || '#aece2e');
  const buttonBackgroundColor = isAnnual ? '#E65100' : '#FFFFFF'; // Orange vif pour annuel, Blanc pour mensuel/gratuit
  const buttonTextColor = isAnnual ? '#FFFFFF' : cardBackgroundColor;

  // Suffixe de prix
  const priceSuffix = isAnnual ? '/an' : '/mois';

  // Précharger l'image du plan si elle existe
  useEffect(() => {
    if (plan.imageUrl) {
      imageCache.preloadRemoteImage(plan.imageUrl).catch(() => {
        // Ignore les erreurs de préchargement
      });
    }
  }, [plan.imageUrl]);

  return (
    <View style={styles.planCardWithImage}>
      {plan.imageUrl ? (
        <ImagePersistent
          source={{ uri: plan.imageUrl }}
          style={styles.planCardImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.planCardImagePlaceholder, { backgroundColor: cardBackgroundColor + '20' }]}>
          <Ionicons name="images-outline" size={48} color={cardBackgroundColor} />
        </View>
      )}

      <View style={[styles.planCardContent, { backgroundColor: cardBackgroundColor }]}>
        <Text style={styles.planCardNameLarge}>{plan.name}</Text>

        <View style={styles.planCardPricing}>
          {plan.originalPrice && plan.originalPrice > plan.price && (
            <Text style={styles.planCardOldPrice}>
              {plan.currency || '$'}{plan.originalPrice} {priceSuffix}
            </Text>
          )}
          <Text style={styles.planCardPriceLarge}>
            {plan.price === 0 || plan.isFree ? 'Gratuit pour 7 jours' : `${plan.currency || '$'}${plan.price}${priceSuffix}`}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.planSubscribeButton, 
            { backgroundColor: buttonBackgroundColor },
            isDisabled && styles.planSubscribeButtonDisabled
          ]}
          onPress={() => onSelect(plan)}
          disabled={!isClickable}
        >
          <Text style={[
            styles.planSubscribeButtonText, 
            { color: buttonTextColor },
            isDisabled && styles.planSubscribeButtonTextDisabled
          ]}>
            {buttonText}
          </Text>
        </TouchableOpacity>
      </View>

      {features.length > 0 && (
        <View style={styles.planFeaturesSection}>
          <Text style={styles.planFeaturesTitle}>Inclus dans cette formule :</Text>
          {features.map((feature, index) => (
            <View key={index} style={styles.planFeatureItem}>
              <View style={[styles.planFeatureCheckmark, { backgroundColor: cardBackgroundColor }]}>
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
  planSubscribeButtonDisabled: {
    backgroundColor: '#E0E0E0',
    opacity: 0.6,
  },
  planSubscribeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  planSubscribeButtonTextDisabled: {
    color: '#9E9E9E',
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
});

export default PlanCard;

