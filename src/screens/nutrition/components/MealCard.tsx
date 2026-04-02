import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Meal } from '../types';
import { nutritionStyles } from './nutritionStyles';
import { createLogger } from '../../../utils/logger';

const logger = createLogger('MealCard');

const mealTypeMap = {
  breakfast: { 
    title: 'Petit-Déj', 
    icon: '🍳', 
    bg: '#E8F5E9',
    time: 'entre 7h30-9h00'
  },
  lunch: { 
    title: 'Déjeuner', 
    icon: '🍽️', 
    bg: '#E8F5E9',
    time: 'entre 12h00-14h00'
  },
  snack: { 
    title: 'Collation', 
    icon: '🥤', 
    bg: '#E8F5E9',
    time: 'à 16h'
  },
  dinner: { 
    title: 'Souper', 
    icon: '🍲', 
    bg: '#E8F5E9',
    time: 'entre 18h00-20h00'
  },
};

interface MealCardProps {
  meal: Meal;
  isCompleted: boolean;
  isSelected: boolean;
  onPress: (meal: Meal) => void;
}

export const MealCard: React.FC<MealCardProps> = ({
  meal,
  isCompleted,
  isSelected,
  onPress,
}) => {
  const mealType = mealTypeMap[meal.type] || mealTypeMap.breakfast;

  if (__DEV__) {
    console.log('🔍 [RENDER MEAL CARD] Vérification du statut de complétion', {
      mealId: meal.id,
      mealName: meal.name,
      isCompleted,
      willBeClickable: !isCompleted,
    });
  }

  return (
    <View 
      style={[
        nutritionStyles.mealCard, 
        { backgroundColor: mealType.bg },
        isSelected && nutritionStyles.selectedMealCard,
        isCompleted && nutritionStyles.completedMealCard
      ]}
    >
      <TouchableOpacity 
        style={nutritionStyles.mealContent}
        onPress={() => {
          onPress(meal);
          logger.info('User Action: Opening meal details modal from meal card', {
            mealId: meal.id,
            hasYoutubeUrl: !!meal.youtubeUrl,
            isCompleted
          });
        }}
        activeOpacity={0.8}
      >
        {/* Meal Image - Left thumbnail */}
        <View style={nutritionStyles.mealCardImageContainer}>
          {meal.imageUrl ? (
            <Image 
              source={{ uri: meal.imageUrl }}
              style={[nutritionStyles.mealCardImage, isCompleted && nutritionStyles.completedMealImage]}
              resizeMode="cover"
              onError={(error) => logger.warn('Meal image load error', { mealId: meal.id, mealName: meal.name, error })}
              onLoad={() => logger.debug('Meal image loaded successfully', { mealId: meal.id, imageUrl: meal.imageUrl })}
            />
          ) : (
            <View style={[nutritionStyles.placeholderImage, isCompleted && nutritionStyles.completedMealImage]}>
              <Text style={[nutritionStyles.placeholderText, isCompleted && nutritionStyles.completedMealText]}>🍽️</Text>
            </View>
          )}
        </View>
        
        {/* Meal Info - Right side */}
        <View style={nutritionStyles.mealInfo}>
          {/* Header: Type de repas à gauche, Heure à droite */}
          <View style={nutritionStyles.mealHeaderRow}>
            <Text style={[nutritionStyles.mealTypeTitle, isCompleted && nutritionStyles.completedMealText]}>{mealType.title}</Text>
            {mealType.time && (
              <Text style={[nutritionStyles.mealTime, isCompleted && nutritionStyles.completedMealText]}>{mealType.time}</Text>
            )}
          </View>
          
          {/* Ligne de séparation */}
          <View style={[nutritionStyles.mealDivider, isCompleted && nutritionStyles.completedMealDivider]} />
          
          {/* Nom du repas à gauche, Emoji à droite */}
          <View style={nutritionStyles.mealNameRow}>
            <Text style={[nutritionStyles.mealName, isCompleted && nutritionStyles.completedMealText]} numberOfLines={2}>
              {meal.name || 'Aucun plat'}
            </Text>
            <Text style={[nutritionStyles.mealIcon, isCompleted && nutritionStyles.completedMealIcon]}>{mealType.icon}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

