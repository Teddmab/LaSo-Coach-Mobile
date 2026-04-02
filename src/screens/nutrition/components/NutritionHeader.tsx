import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { nutritionStyles } from './nutritionStyles';

interface NutritionHeaderProps {
  selectedDate: Date;
  formatDate: (date: Date) => string;
  profileData?: any;
  isIOS: boolean;
}

export const NutritionHeader: React.FC<NutritionHeaderProps> = ({
  selectedDate,
  formatDate,
  profileData,
  isIOS,
}) => {
  return (
    <View style={nutritionStyles.menuHeader}>
      <View style={nutritionStyles.menuTitleRow}>
        <Text style={nutritionStyles.menuIcon}>🍽️</Text>
        <Text style={nutritionStyles.menuTitle}>Menu du jour</Text>
        <Text style={nutritionStyles.menuDate}>{formatDate(selectedDate)}</Text>
      </View>
      {/* Phase actuel - Only on Android */}
      {!isIOS && profileData?.currentPhase && (
        <View style={nutritionStyles.phaseBanner}>
          <Text style={nutritionStyles.phaseText}>Phase actuel : {profileData.currentPhase}</Text>
        </View>
      )}
    </View>
  );
};

