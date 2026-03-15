import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { nutritionStyles } from './nutritionStyles';

interface CompleteMealsButtonProps {
  remainingCount: number;
  onPress: () => void;
}

export const CompleteMealsButton: React.FC<CompleteMealsButtonProps> = ({
  remainingCount,
  onPress,
}) => {
  const label = remainingCount > 0
    ? (remainingCount === 1
        ? '1 repas à compléter'
        : `${remainingCount} repas à compléter`)
    : 'Compléter des repas';

  return (
    <View style={nutritionStyles.completeMealsButtonContainer}>
      <TouchableOpacity
        style={nutritionStyles.completeMealsButton}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
        <Text style={nutritionStyles.completeMealsButtonText}>{label}</Text>
      </TouchableOpacity>
    </View>
  );
};

