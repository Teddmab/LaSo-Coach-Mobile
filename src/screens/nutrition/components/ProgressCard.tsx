import React from 'react';
import { View, Text } from 'react-native';
import { nutritionStyles } from './nutritionStyles';

interface ProgressCardProps {
  completedMeals: number;
  totalMeals: number;
  progressPercentage: number;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({
  completedMeals,
  totalMeals,
  progressPercentage,
}) => {
  return (
    <View style={nutritionStyles.progressCard}>
      {/* Nombre de repas complétés - Au-dessus de la progression */}
      <View style={nutritionStyles.progressMealsCountContainer}>
        <Text style={nutritionStyles.progressMealsCountLabel}>Repas complétés</Text>
        <Text style={nutritionStyles.progressMealsCountValue}>
          {completedMeals} / {totalMeals}
        </Text>
      </View>

      {/* Progression - Barre en longueur */}
      <View style={nutritionStyles.progressBarContainerFull}>
        <View style={nutritionStyles.progressBarBackgroundFull}>
          <View 
            style={[
              nutritionStyles.progressBarFillFull,
              { width: `${progressPercentage}%` }
            ]}
          />
        </View>
        <Text style={nutritionStyles.progressBarPercentageFull}>
          {Math.round(progressPercentage)}%
        </Text>
      </View>
    </View>
  );
};

