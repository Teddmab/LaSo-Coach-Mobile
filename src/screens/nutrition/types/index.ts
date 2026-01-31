import { User } from '../../../types/auth';

export interface NutritionScreenProps {
  user?: User | null;
  onLogout?: () => void;
  onTabPress?: (tabId: string) => void;
  activeTab?: string;
  onSubscriptionRenew?: () => void;
  onFAQPress?: () => void;
}

export interface NutritionPlan {
  id: string;
  name: string;
  isActive?: boolean;
  numDays?: number;
  menus?: Menu[];
  youtubeUrl?: string;
  startDate?: string; // ✅ Date de début du plan nutritionnel (source principale pour calcul du jour)
}

export interface Menu {
  day: number;
  meals?: Meal[];
}

export interface Meal {
  id: string;
  name: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  imageUrl?: string;
  youtubeUrl?: string;
  calories?: number;
  calorieCount?: number;
  proteins?: number;
  carbs?: number;
  carbohydrates?: number;
  fats?: number;
  fat?: number;
  points?: number;
  pointValue?: number;
  ingredients?: string[] | Ingredient[];
  instructions?: string[] | string;
  nutritionalComposition?: {
    calories?: number;
    proteins?: number;
    carbs?: number;
    carbohydrates?: number;
    fats?: number;
    fat?: number;
  };
}

export interface Ingredient {
  name?: string;
  amount?: number;
  unit?: string;
}

export interface MealTypeConfig {
  title: string;
  icon: string;
  bg: string;
  time: string;
}

export interface CompletionStatus {
  dayProgress?: {
    completedMealIds?: string[];
  };
  mealStatus?: {
    [mealId: string]: {
      completed?: boolean;
    };
  };
}

export interface WeekDay {
  number: number;
  day: string;
  dayOfWeek: number;
  date: Date;
  isToday: boolean;
  isOutsideSubscription: boolean;
  isPast?: boolean; // Dates passées (non cliquables)
}

export interface MealInteraction {
  [mealId: string]: 'like' | 'dislike' | null;
}

export interface SubscriptionData {
  status?: string;
  isExpired?: boolean;
  endDate?: string;
  subscription?: {
    startDate?: string;
    endDate?: string;
  };
}

