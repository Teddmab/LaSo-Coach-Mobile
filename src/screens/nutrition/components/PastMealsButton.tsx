import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
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
  if (totalPastIncompleteMeals === 0) {
    return null;
  }

  return (
    <TouchableOpacity
      style={nutritionStyles.pastMealsButton}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name="time-outline" size={20} color="#FFFFFF" />
      <Text style={nutritionStyles.pastMealsButtonText}>
        {totalPastIncompleteMeals} plat{totalPastIncompleteMeals > 1 ? 's' : ''} passé{totalPastIncompleteMeals > 1 ? 's' : ''} à compléter
      </Text>
      <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
    </TouchableOpacity>
  );
};

