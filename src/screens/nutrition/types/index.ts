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
  description?: string; // ✅ Description du plan
  totalPoints?: number; // ✅ Total de points du plan
  dietaryRestrictions?: string[]; // ✅ Restrictions alimentaires
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
  // ✅ NOUVEAU: Structure correspondant à la réponse API du backend (champs directs)
  planId?: string;
  totalMeals?: number;           // Nombre total de repas dans le plan
  completedMeals?: number;       // Nombre de repas complétés
  completionPercentage?: number; // Pourcentage de complétion (0-100)
  dailyCompletion?: Record<string, { completed: number; total: number }>;
  
  // Structure imbriquée alternative (pour compatibilité)
  plan?: {
    id: string;
    name: string;
    description?: string;
    numDays?: number;
    tascPhase?: string;
  };
  progress?: {
    percentage: number;        // Pourcentage de progression (0-100)
    completedMeals: number;    // Nombre de repas complétés
    totalMeals: number;        // Nombre total de repas
    remainingMeals: number;    // Nombre de repas restants
  };
  completionsByDay?: Record<number | string, any[]>;  // Complétions organisées par jour
  allCompletions?: any[];      // Toutes les complétions (array)
  mealStatus?: Record<string, { completed: boolean; completedAt?: string; feedback?: string }>;
  
  // ✅ GARDÉ pour compatibilité avec le code existant
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

