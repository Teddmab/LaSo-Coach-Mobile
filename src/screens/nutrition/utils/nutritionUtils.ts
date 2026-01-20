import { Meal, MealTypeConfig, WeekDay, SubscriptionData } from '../types';

export const getYouTubeVideoId = (url?: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export const mealTypeMap: { [key: string]: MealTypeConfig } = {
  breakfast: { 
    title: 'Petit-Déj', 
    icon: '🍳', 
    bg: '#E8F5E8',
    time: 'entre 7h30-9h00'
  },
  lunch: { 
    title: 'Déjeuner', 
    icon: '🍽️', 
    bg: '#F0F8FF',
    time: 'entre 12h00-14h00'
  },
  dinner: { 
    title: 'Souper', 
    icon: '🍲', 
    bg: '#FFF8DC',
    time: 'entre 19h00-21h00'
  },
  snack: { 
    title: 'Bonus', 
    icon: '🥤', 
    bg: '#FFF9E6',
    time: 'Snack'
  }
};

export const formatDate = (date: Date): string => {
  const months = [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
    'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'
  ];
  
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  
  return `${days[date.getDay()]}, ${date.getDate()}-${months[date.getMonth()]}-${date.getFullYear()}`;
};

export const sortMealsByType = (meals: Meal[]): Meal[] => {
  const typeOrder = ['breakfast', 'lunch', 'dinner', 'snack'];
  return [...meals].sort((a, b) => {
    return typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
  });
};

export const isDateOutsideSubscription = (date: Date, subscriptionData?: SubscriptionData | null): boolean => {
  if (!subscriptionData) {
    return false;
  }
  
  if (subscriptionData.status === 'EXPIRED' || subscriptionData.status === 'INACTIVE') {
    return true;
  }
  
  const endDateString = subscriptionData.endDate || subscriptionData.subscription?.endDate;
  
  if (endDateString) {
    const endDate = new Date(endDateString);
    endDate.setHours(23, 59, 59, 999);
    
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);
    
    return dateToCheck > endDate;
  }
  
  return false;
};

export const generateWeekDays = (subscriptionData?: SubscriptionData | null): WeekDay[] => {
  const weekDays: WeekDay[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normaliser à minuit
  
  // Générer les dates à partir d'aujourd'hui jusqu'à 7 jours devant (pas de dates passées)
  for (let i = 0; i <= 6; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    const isPast = date < today;
    
    weekDays.push({
      number: date.getDate(),
      day: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][date.getDay()],
      dayOfWeek: date.getDay() || 7,
      date: date,
      isToday: date.toDateString() === today.toDateString(),
      isOutsideSubscription: isDateOutsideSubscription(date, subscriptionData),
      isPast: isPast // Ajouter un flag pour les dates passées
    });
  }
  
  return weekDays;
};

export const calculateNutritionPlanDay = (
  selectedDate: Date,
  subscriptionData?: SubscriptionData | null,
  currentPlan?: { numDays?: number } | null
): number => {
  if (!subscriptionData?.subscription?.startDate || !currentPlan?.numDays) {
    return 1;
  }

  const startDate = new Date(subscriptionData.subscription?.startDate);
  startDate.setHours(0, 0, 0, 0);
  
  const currentDate = new Date(selectedDate);
  currentDate.setHours(0, 0, 0, 0);
  
  const daysSinceStart = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const planDay = (daysSinceStart % currentPlan.numDays) + 1;
  
  return planDay;
};

