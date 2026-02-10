import { useState, useMemo, useCallback } from 'react';
import { WeekDay, SubscriptionData, NutritionPlan } from '../types';
import { calculatePlanDayFromDate } from '../utils/dateCalculations';

export const useNutritionDate = (
  subscriptionData: SubscriptionData | null,
  plansResponseStatus: number | null | undefined,
  currentPlan: NutritionPlan | null | undefined
) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [currentPlanDay, setCurrentPlanDay] = useState<number | undefined>(undefined);

  // Check if a date is outside subscription coverage
  const isDateOutsideSubscription = useCallback((date: Date): boolean => {
    // If status is 200, no restrictions on calendar
    if (plansResponseStatus === 200) {
      return false;
    }
    
    if (!subscriptionData) {
      return false;
    }
    
    // Logic: If subscription is EXPIRED or INACTIVE, all dates are outside
    if ((subscriptionData as any).status === 'EXPIRED' || (subscriptionData as any).status === 'INACTIVE') {
      return true;
    }
    
    // Check if date is after subscription end date
    const endDateString = (subscriptionData as any).endDate || subscriptionData.subscription?.endDate;
    
    if (endDateString) {
      const endDate = new Date(endDateString);
      endDate.setHours(23, 59, 59, 999); // End of day
      
      const dateToCheck = new Date(date);
      dateToCheck.setHours(0, 0, 0, 0); // Start of day
      
      const isOutside = dateToCheck > endDate;
      
      if (isOutside) {
        return true;
      }
    }
    
    return false;
  }, [subscriptionData, plansResponseStatus]);

  // Generate week days starting from plan start date (or today if start date is in the past)
  const generateWeekDays = useCallback((): WeekDay[] => {
    const weekDays: WeekDay[] = [];
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    
    // Determine start date: use plan start date if available, otherwise use today
    let startDate = todayDate;
    if (subscriptionData?.subscription?.startDate && currentPlan) {
      const planStartDate = new Date(subscriptionData.subscription.startDate);
      planStartDate.setHours(0, 0, 0, 0);
      // Use plan start date if it's today or in the future, otherwise use today
      if (planStartDate >= todayDate) {
        startDate = planStartDate;
      }
    }
    
    // Generate 7 days starting from start date (no past dates)
    for (let i = 0; i <= 6; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isPast = date < todayDate;
      
      weekDays.push({
        number: date.getDate(),
        day: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][date.getDay()],
        dayOfWeek: date.getDay() || 7, // Convert Sunday (0) to 7
        date: date,
        isToday: date.toDateString() === todayDate.toDateString(),
        isOutsideSubscription: isDateOutsideSubscription(date),
        isPast: isPast
      });
    }
    return weekDays;
  }, [subscriptionData, currentPlan, isDateOutsideSubscription]);

  // Recalculate weekDays whenever subscriptionData, plansResponseStatus, or currentPlan changes
  const weekDays = useMemo(() => generateWeekDays(), [generateWeekDays]);

  // Calculate nutrition plan day from selected date
  const calculateNutritionPlanDay = useCallback((selectedDate: Date | number): number => {
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    
    const selectedDateObj = selectedDate instanceof Date ? selectedDate : new Date(selectedDate);
    selectedDateObj.setHours(0, 0, 0, 0);
    
    if (!currentPlan) {
      return 1;
    }
    
    // Determine plan start date
    let planStartDate = todayDate;
    if (subscriptionData?.subscription?.startDate) {
      planStartDate = new Date(subscriptionData.subscription.startDate);
      planStartDate.setHours(0, 0, 0, 0);
    } else if (currentPlan?.startDate) {
      planStartDate = new Date(currentPlan.startDate);
      planStartDate.setHours(0, 0, 0, 0);
    }
    
    // Use shared utility to calculate plan day
    const planDay = calculatePlanDayFromDate(
      selectedDateObj,
      planStartDate,
      currentPlan.numDays || 7
    );
    
    return planDay;
  }, [currentPlan, subscriptionData]);

  // Format date helper
  const formatDate = useCallback((date: Date): string => {
    const months = [
      'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
      'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'
    ];
    
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    
    return `${days[date.getDay()]}, ${date.getDate()}-${months[date.getMonth()]}-${date.getFullYear()}`;
  }, []);

  // Helper function to compare dates (ignoring time)
  const isSameDate = useCallback((date1: Date, date2: Date): boolean => {
    if (!date1 || !date2) return false;
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }, []);

  return {
    today,
    selectedDate,
    setSelectedDate,
    currentPlanDay,
    setCurrentPlanDay,
    weekDays,
    calculateNutritionPlanDay,
    formatDate,
    isSameDate,
  };
};

