import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { nutritionStyles } from './nutritionStyles';

interface CompleteMealsButtonProps {
  onPress: () => void;
}

export const CompleteMealsButton: React.FC<CompleteMealsButtonProps> = ({
  onPress,
}) => {
  return (
    <View style={nutritionStyles.completeMealsButtonContainer}>
      <TouchableOpacity
        style={nutritionStyles.completeMealsButton}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
        <Text style={nutritionStyles.completeMealsButtonText}>Compléter des repas</Text>
      </TouchableOpacity>
    </View>
  );
};

