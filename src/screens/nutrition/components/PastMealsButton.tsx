import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { nutritionStyles } from './nutritionStyles';

interface PastMealsButtonProps {
  totalPastIncompleteMeals: number;
  onPress: () => void;
}

export const PastMealsButton: React.FC<PastMealsButtonProps> = ({
  totalPastIncompleteMeals,
  onPress,
}) => {
  if (__DEV__) {
    console.log(`🔢 [PastMealsButton] Affichage du bouton avec ${totalPastIncompleteMeals} plats non complétés`);
  }
  
  if (totalPastIncompleteMeals === 0) {
    return null;
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        {/* Icône */}
        <View style={styles.iconContainer}>
          <Ionicons name="time-outline" size={22} color="#FFFFFF" />
        </View>
        
        {/* Texte principal */}
        <View style={styles.textContainer}>
          <Text style={styles.mainText}>Plats passés à compléter</Text>
          <Text style={styles.subText}>
            {totalPastIncompleteMeals} plat{totalPastIncompleteMeals > 1 ? 's' : ''} en attente
          </Text>
        </View>
        
        {/* Badge avec nombre */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{totalPastIncompleteMeals}</Text>
        </View>
        
        {/* Icône flèche */}
        <Ionicons name="chevron-forward" size={20} color="#FFFFFF" style={styles.arrowIcon} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FF9800',
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 20,
    shadowColor: '#FF9800',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    flexDirection: 'column',
    gap: 2,
  },
  mainText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  subText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '500',
  },
  badge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    minWidth: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  badgeText: {
    color: '#FF9800',
    fontSize: 16,
    fontWeight: '700',
  },
  arrowIcon: {
    marginLeft: 4,
  },
});

