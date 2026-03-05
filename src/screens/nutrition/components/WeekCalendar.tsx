import React, { useEffect, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet, Alert, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { WeekDay } from '../types';
import { nutritionStyles } from './nutritionStyles';
import { createLogger } from '../../../utils/logger';

const logger = createLogger('WeekCalendar');

interface WeekCalendarProps {
  weekDays: WeekDay[];
  selectedDate: Date;
  plansResponseStatus: number | null;
  isIOS: boolean;
  isSameDate: (date1: Date, date2: Date) => boolean;
  onDateSelect: (date: Date, dayOfWeek: number) => void;
  onSubscriptionRenew?: () => void;
}

export const WeekCalendar: React.FC<WeekCalendarProps> = ({
  weekDays,
  selectedDate,
  plansResponseStatus,
  isIOS,
  isSameDate,
  onDateSelect,
  onSubscriptionRenew,
}) => {
  // ✅ Animation de surbrillance pour l'indicateur
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animation infinie qui se répète
    const startAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startAnimation();
  }, [shimmerAnim]);

  // Interpolation pour le déplacement de la surbrillance (de droite à gauche - sens inverse)
  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [200, -150], // ✅ Se déplace de droite à gauche (sens inverse)
  });

  // Interpolation pour l'opacité (fade in/out)
  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 0.3, 0.7, 1],
    outputRange: [0, 0.8, 0.8, 0], // Fade in, reste visible, puis fade out
  });

  const handleDatePress = (day: WeekDay) => {
    // Ne pas permettre de sélectionner les dates passées
    if (day.isPast) {
      return;
    }
    
    // If status is 200, allow all dates (no restrictions)
    if (plansResponseStatus === 200) {
      logger.info('User Action: Date selected (status 200 - no restrictions)', {
        selectedDate: day.date.toDateString(),
        selectedDayOfWeek: day.dayOfWeek,
        isToday: day.isToday,
      });
      const newDate = new Date(day.date);
      onDateSelect(newDate, day.dayOfWeek);
    } else if (day.isOutsideSubscription) {
      // Sur iOS, afficher une notification Toast au lieu d'une Alert
      if (isIOS) {
        Toast.show({
          type: 'info',
          text1: 'Statut non vérifié',
          text2: 'L\'accès à ce contenu dépend de votre statut actuel. Veuillez vérifier votre accès pour continuer.',
          visibilityTime: 5000,
        });
      } else {
        // Sur Android, afficher l'alerte classique
        Alert.alert(
          '⚠️ Hors Abonnement',
          'Cette date est en dehors de votre période d\'abonnement. Renouvelez votre abonnement pour accéder aux menus.',
          [
            { text: 'Annuler', style: 'cancel' },
            { 
              text: 'Renouveler', 
              onPress: () => {
                if (onSubscriptionRenew) {
                  onSubscriptionRenew();
                }
              }
            }
          ]
        );
      }
    } else {
      logger.info('User Action: Date selected', {
        selectedDate: day.date.toDateString(),
        selectedDayOfWeek: day.dayOfWeek,
        isToday: day.isToday,
        isOutsideSubscription: day.isOutsideSubscription,
      });
      const newDate = new Date(day.date);
      onDateSelect(newDate, day.dayOfWeek);
    }
  };

  return (
    <>
      {/* ✅ Indicateur UX pour défiler les dates - Au-dessus du calendrier */}
      <View style={nutritionStyles.calendarScrollHint}>
        <View style={nutritionStyles.calendarScrollHintTextContainer}>
          <Text style={nutritionStyles.calendarScrollHintText}>Défiler pour voir le reste de la semaine</Text>
          {/* ✅ Animation de surbrillance - Sens inverse (de droite à gauche) */}
          <Animated.View
            style={[
              nutritionStyles.shimmerOverlay,
              {
                transform: [{ translateX: shimmerTranslateX }],
                opacity: shimmerOpacity,
              },
            ]}
          />
        </View>
        <Ionicons name="chevron-back" size={16} color="#999999" />
      </View>
      <View style={nutritionStyles.calendarContainer}>
        <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={nutritionStyles.calendarContent}
      >
        {weekDays.map((day) => (
          <TouchableOpacity
            key={day.number + '-' + day.dayOfWeek}
            style={[
              nutritionStyles.calendarDay,
              day.isToday && nutritionStyles.todayDay,
              isSameDate(selectedDate, day.date) && nutritionStyles.selectedDay,
              day.isOutsideSubscription && nutritionStyles.outsideSubscriptionDay,
              day.isPast && nutritionStyles.pastDay
            ]}
            disabled={day.isPast}
            onPress={() => handleDatePress(day)}
          >
            <Text style={[
              nutritionStyles.dayNumber,
              day.isToday && nutritionStyles.todayDayNumber,
              isSameDate(selectedDate, day.date) && nutritionStyles.selectedDayNumber,
              day.isOutsideSubscription && nutritionStyles.outsideSubscriptionText,
            ]}>
              {day.number}
            </Text>
            <Text style={[
              nutritionStyles.dayName,
              day.isToday && nutritionStyles.todayDayName,
              isSameDate(selectedDate, day.date) && nutritionStyles.selectedDayName,
              day.isOutsideSubscription && nutritionStyles.outsideSubscriptionText,
            ]}>
              {day.day}
            </Text>
            {day.isOutsideSubscription && (
              <Ionicons 
                name="warning" 
                size={12} 
                color="#F44336" 
                style={{ marginTop: 2 }}
              />
            )}
          </TouchableOpacity>
        ))}
        </ScrollView>
      </View>
    </>
  );
};

