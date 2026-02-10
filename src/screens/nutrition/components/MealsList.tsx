import React from 'react';
import { View, Text } from 'react-native';
import { Meal } from '../types';
import { MealCard } from './MealCard';
import { nutritionStyles } from './nutritionStyles';

interface MealsListProps {
  meals: Meal[];
  dayMeals: Meal[];
  selectedDate: Date;
  today: Date;
  formatDate: (date: Date) => string;
  isSameDate: (date1: Date, date2: Date) => boolean;
  isMealCompleted: (mealId: string, completionData: any, planDay?: number) => boolean;
  completionData: any;
  currentPlanDay?: number;
  selectedMeal: Meal | null;
  onMealPress: (meal: Meal) => void;
}

// Function to sort meals by type in correct order
const sortMealsByType = (meals: Meal[]): Meal[] => {
  const typeOrder = ['breakfast', 'lunch', 'snack', 'dinner'];
  return meals.sort((a: Meal, b: Meal) => {
    return typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
  });
};

export const MealsList: React.FC<MealsListProps> = ({
  meals,
  dayMeals,
  selectedDate,
  today,
  formatDate,
  isSameDate,
  isMealCompleted,
  completionData,
  currentPlanDay,
  selectedMeal,
  onMealPress,
}) => {
  if (meals.length === 0) {
    return null;
  }

  // Check if selected date is today
  const selectedDateObj = selectedDate instanceof Date ? selectedDate : today;
  selectedDateObj.setHours(0, 0, 0, 0);
  const isToday = isSameDate(selectedDateObj, today);
  const dayLabel = isToday ? 'Aujourd\'hui' : formatDate(selectedDateObj);

  return (
    <View style={nutritionStyles.mealsContainer}>
      <View style={nutritionStyles.mealsSectionHeader}>
        <Text style={nutritionStyles.mealsSectionTitle}>{dayLabel}</Text>
      </View>
      {sortMealsByType(meals).map((meal: Meal) => {
        const isCompleted = isMealCompleted(meal.id, completionData, currentPlanDay);
        const isSelected = selectedMeal?.id === meal.id;
        
        return (
          <MealCard
            key={meal.id}
            meal={meal}
            isCompleted={isCompleted}
            isSelected={isSelected}
            onPress={onMealPress}
          />
        );
      })}
    </View>
  );
};

