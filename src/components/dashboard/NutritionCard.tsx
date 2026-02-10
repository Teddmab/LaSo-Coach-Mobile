import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import nutritionAPI from '../../services/nutritionApi';
import { Shimmer } from '../Shimmer';
import { useIOSSimulation } from '../../hooks/useIOSSimulation';
import { useAuth } from '../../context/FirebaseAuthContext';
import ImagePersistent from '../ImagePersistent';
import { mealTypeMap } from '../../screens/nutrition/utils/nutritionUtils';
import { calculatePlanDayFromDate, findMenuForPlanDay, getPlanProgress } from '../../screens/nutrition/utils/dateCalculations';
import { Meal, NutritionPlan, CompletionStatus } from '../../screens/nutrition/types';
import MealDetailModal from '../nutrition/MealDetailModal';
import Toast from 'react-native-toast-message';

interface NutritionCardProps {
  onPress?: () => void;
  subscriptionData?: any;
  onSubscriptionPress?: () => void;
  onTabPress?: (tabId: string) => void;
  // ✅ Props optionnelles pour utiliser les données de NutritionScreen directement
  dayMeals?: Meal[];
  currentPlanDay?: number;
  completionData?: any;
  currentPlan?: any;
}

const NutritionCard: React.FC<NutritionCardProps> = ({ 
  onPress, 
  subscriptionData, 
  onSubscriptionPress, 
  onTabPress,
  dayMeals: propsDayMeals,
  currentPlanDay: propsCurrentPlanDay,
  completionData: propsCompletionData,
  currentPlan: propsCurrentPlan,
}) => {
  const { shouldShowIOSOnly } = useIOSSimulation();
  const isIOS = shouldShowIOSOnly();
  const { refreshProfile } = useAuth();
  
  // ✅ Utiliser les données passées en props si disponibles (de NutritionScreen), sinon charger
  const usePropsData = !!(propsDayMeals && propsDayMeals.length > 0);
  
  const [currentPlan, setCurrentPlan] = useState<NutritionPlan | null>(propsCurrentPlan || null);
  const [loading, setLoading] = useState(!usePropsData);
  const [completionStatus, setCompletionStatus] = useState<CompletionStatus | null>(propsCompletionData || null);
  const [freshCompletionData, setFreshCompletionData] = useState<any>(propsCompletionData || null);
  const [planStartDate, setPlanStartDate] = useState<Date | null>(null);
  const [currentPlanDay, setCurrentPlanDay] = useState<number | undefined>(propsCurrentPlanDay);
  const [dayMeals, setDayMeals] = useState<Meal[]>(propsDayMeals || []);
  const [showMealDetailModal, setShowMealDetailModal] = useState(false);
  const [completingMealInModal, setCompletingMealInModal] = useState<string | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // ✅ Mettre à jour les données quand les props changent (données de NutritionScreen)
  useEffect(() => {
    if (propsDayMeals && propsDayMeals.length > 0) {
      setDayMeals(propsDayMeals);
      setLoading(false);
      if (__DEV__) {
        console.log('🍽️ [NutritionCard] Données mises à jour depuis NutritionScreen (props)', {
          mealsCount: propsDayMeals.length,
          breakfastMeal: propsDayMeals.find(m => m.type === 'breakfast')?.name || 'N/A',
          planDay: propsCurrentPlanDay,
        });
      }
    }
  }, [propsDayMeals, propsCurrentPlanDay]);
  
  useEffect(() => {
    if (propsCurrentPlanDay !== undefined) {
      setCurrentPlanDay(propsCurrentPlanDay);
    }
  }, [propsCurrentPlanDay]);
  
  useEffect(() => {
    if (propsCompletionData) {
      setCompletionStatus(propsCompletionData);
      setFreshCompletionData(propsCompletionData);
    }
  }, [propsCompletionData]);
  
  useEffect(() => {
    if (propsCurrentPlan) {
      setCurrentPlan(propsCurrentPlan);
    }
  }, [propsCurrentPlan]);

  // ✅ Même logique que NutritionScreen pour vérifier si un repas est complété
  const isMealCompleted = useCallback((mealId: string, completionData: any, planDayToCheck?: number): boolean => {
    if (!completionData) {
      return false;
    }

    if (planDayToCheck !== undefined) {
      if (completionData?.completionsByDay) {
        const dayKey = String(planDayToCheck);
        const dayCompletions = completionData.completionsByDay[dayKey] || completionData.completionsByDay[planDayToCheck];
        if (Array.isArray(dayCompletions)) {
          const found = dayCompletions.some(
            (completion: any) => completion?.mealId === mealId && completion?.completedAt
          );
          if (found) {
            return true;
          }
        }
      }
      return false;
    }

    if (completionData?.completionsByDay) {
      for (const dayKey in completionData.completionsByDay) {
        const dayCompletions = completionData.completionsByDay[dayKey];
        if (Array.isArray(dayCompletions)) {
          const found = dayCompletions.some(
            (completion: any) => completion?.mealId === mealId && completion?.completedAt
          );
          if (found) {
            return true;
          }
        }
      }
    }

    if (completionData?.dayProgress?.completedMealIds?.includes(mealId) === true) {
      return true;
    }
    
    if (completionData?.mealStatus?.[mealId]?.completed === true) {
      return true;
    }
    
    if (completionData?.allCompletions?.some(
      (completion: any) => completion?.mealId === mealId
    ) === true) {
      return true;
    }
    
    return false;
  }, []);

  // ✅ Chargement simplifié et rapide : tout en une fois
  // ⚠️ NE CHARGER QUE SI LES DONNÉES NE SONT PAS FOURNIES EN PROPS
  const fetchQuickData = useCallback(async () => {
    // Si les données sont déjà fournies via props (de NutritionScreen), ne pas charger
    if (usePropsData && propsDayMeals && propsDayMeals.length > 0) {
      if (__DEV__) {
        console.log('🍽️ [NutritionCard] Utilisation des données de NutritionScreen (props)', {
          mealsCount: propsDayMeals.length,
          breakfastMeal: propsDayMeals.find(m => m.type === 'breakfast')?.name || 'N/A',
        });
      }
      return;
    }
    
    try {
      setLoading(true);
      
      // 1. Charger les plans (rapide)
      const plansResponse = await nutritionAPI.getPlans();
      const plansData = plansResponse?.data || plansResponse;
      const allPlans = plansData?.data?.plans || plansData?.plans || [];
      
      if (allPlans.length === 0) {
        setCurrentPlan(null);
        setLoading(false);
        return;
      }
      
      const activePlan = allPlans.find((plan: any) => plan.isActive) || allPlans[0];
      setCurrentPlan(activePlan);
      
      // 2. Calculer immédiatement le planDay et charger les repas (sans attendre completion status)
      // ✅ Utiliser EXACTEMENT la même logique que useNutritionData.loadDayData pour garantir la cohérence
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDateObj = today;
      selectedDateObj.setHours(0, 0, 0, 0);
      
      // Determine plan start date (EXACTEMENT la même logique que useNutritionData.loadDayData)
      let planStartDate = today;
      if (subscriptionData?.subscription?.startDate) {
        planStartDate = new Date(subscriptionData.subscription.startDate);
        planStartDate.setHours(0, 0, 0, 0);
      } else if (activePlan?.startDate) {
        planStartDate = new Date(activePlan.startDate);
        planStartDate.setHours(0, 0, 0, 0);
      }
      
      setPlanStartDate(planStartDate);
      
      // Use shared utility to calculate plan day (EXACTEMENT la même logique que useNutritionData.loadDayData)
      const menuDay = calculatePlanDayFromDate(
        selectedDateObj,
        planStartDate,
        activePlan.numDays || 7
      );
      
      setCurrentPlanDay(menuDay);
      
      // Use shared utility for consistent menu finding logic (EXACTEMENT la même logique que useNutritionData.loadDayData)
      let dayMenu = findMenuForPlanDay(activePlan.menus, menuDay);
      
      // Final fallback: use first menu (EXACTEMENT la même logique que useNutritionData.loadDayData)
      if (!dayMenu && activePlan.menus && activePlan.menus.length > 0) {
        dayMenu = activePlan.menus[0];
      }
      
      if (dayMenu) {
        const meals = dayMenu.meals || [];
        setDayMeals(meals);
        
        // Log pour debug (uniquement en dev)
        if (__DEV__) {
          console.log('🍽️ [NutritionCard] Meals loaded', {
            menuDay,
            planStartDate: planStartDate.toISOString().split('T')[0],
            selectedDate: selectedDateObj.toISOString().split('T')[0],
            planNumDays: activePlan.numDays || 7,
            mealsCount: meals.length,
            breakfastMeal: meals.find(m => m.type === 'breakfast')?.name || 'N/A',
          });
        }
      } else {
        setDayMeals([]);
      }
      
      // ✅ Afficher la carte MAINTENANT (ne pas attendre completion status)
      setLoading(false);
      
      // 3. Charger completion status en arrière-plan (non bloquant)
      try {
        const completionResponse = await nutritionAPI.getCompletionStatus(activePlan.id);
        const completionData = completionResponse.success ? completionResponse.data : null;
        setCompletionStatus(completionData);
        setFreshCompletionData(completionData);
      } catch (completionError: any) {
        // Erreur non bloquante - initialiser avec valeurs par défaut
        const totalMeals = activePlan?.menus?.reduce((sum: number, menu: any) => {
          return sum + (menu.meals?.length || 0);
        }, 0) || 0;
        
        const defaultCompletionData = {
          planId: activePlan.id,
          progress: {
            percentage: 0,
            completedMeals: 0,
            totalMeals: totalMeals,
            remainingMeals: totalMeals,
          },
          completionsByDay: {},
          allCompletions: [],
          dayProgress: {
            completedMealIds: [],
          },
          mealStatus: {},
        };
        
        setCompletionStatus(defaultCompletionData);
        setFreshCompletionData(defaultCompletionData);
      }
    } catch (error) {
      console.error('❌ [NutritionCard] Erreur lors du chargement:', error);
      setCurrentPlan(null);
      setLoading(false);
    }
  }, [subscriptionData, usePropsData, propsDayMeals]);

  // Charger les données au montage et quand subscriptionData change
  // ⚠️ NE CHARGER QUE SI LES DONNÉES NE SONT PAS FOURNIES EN PROPS
  useEffect(() => {
    // Si les données sont fournies via props, ne pas charger
    if (usePropsData && propsDayMeals && propsDayMeals.length > 0) {
      return;
    }
    
    // Attendre que subscriptionData soit disponible avant de charger
    if (subscriptionData !== undefined) {
      fetchQuickData();
    }
  }, [fetchQuickData, subscriptionData, usePropsData, propsDayMeals]);

  useFocusEffect(
    useCallback(() => {
      // Si les données sont fournies via props, ne pas recharger
      if (usePropsData && propsDayMeals && propsDayMeals.length > 0) {
        return;
      }
      
      // Toujours recharger quand l'écran est focusé pour avoir les dernières données
      if (subscriptionData !== undefined) {
        fetchQuickData();
      }
    }, [fetchQuickData, subscriptionData, usePropsData, propsDayMeals])
  );

  // ✅ Trouver le premier repas non complété (simplifié et rapide)
  const nextMealToComplete = useMemo(() => {
    // Si pas de repas, retourner null
    if (!dayMeals.length) {
      return null;
    }

    // Ordre des repas
    const mealOrder = { 
      'breakfast': 1, 
      'lunch': 2, 
      'snack': 3,
      'dinner': 4,
      'bonus': 3
    };

    const sortedMeals = [...dayMeals].sort((a, b) => {
      const orderA = mealOrder[a.type] || 999;
      const orderB = mealOrder[b.type] || 999;
      return orderA - orderB;
    });

    // Si pas encore de completion status, retourner le premier repas
    const completionDataToUse = freshCompletionData || completionStatus;
    if (!completionDataToUse || currentPlanDay === undefined) {
      return sortedMeals[0] || null;
    }
    
    // Sinon, chercher le premier non complété
    for (const meal of sortedMeals) {
      const isCompleted = isMealCompleted(meal.id, completionDataToUse, currentPlanDay);
      if (!isCompleted) {
        return meal;
      }
    }

    return null; // Tous complétés
  }, [dayMeals, currentPlanDay, freshCompletionData, completionStatus, isMealCompleted]);

  // ✅ Calculer si l'heure recommandée est passée
  const isTimePassed = useMemo(() => {
    if (!nextMealToComplete) return false;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    switch (nextMealToComplete.type) {
      case 'breakfast':
        return currentHour > 9 || (currentHour === 9 && currentMinute > 0);
      case 'lunch':
        return currentHour > 14 || (currentHour === 14 && currentMinute > 0);
      case 'snack':
        return currentHour > 16 || (currentHour === 16 && currentMinute > 0);
      case 'dinner':
        return currentHour > 20 || (currentHour === 20 && currentMinute > 0);
      default:
        return false;
    }
  }, [nextMealToComplete]);

  // ✅ Compléter un repas (simplifié)
  const handleMealComplete = useCallback(async (mealId: string) => {
    // Utiliser les données de props si disponibles
    const planToUse = propsCurrentPlan || currentPlan;
    const planDayToUse = propsCurrentPlanDay !== undefined ? propsCurrentPlanDay : currentPlanDay;
    
    if (!planToUse?.id || planDayToUse === undefined) {
      return;
    }

    try {
      const selectedDateObj = new Date();
      selectedDateObj.setHours(0, 0, 0, 0);
      const completionDateISO = selectedDateObj.toISOString().split('T')[0] + 'T00:00:00.000Z';
      
      await nutritionAPI.completeMeal(mealId, {
        planId: planToUse.id,
        planDay: planDayToUse,
        completionDate: completionDateISO,
      });

      // Rafraîchir le statut en arrière-plan
      try {
        const apiResponse = await nutritionAPI.getCompletionStatus(planToUse.id);
        const globalCompletionData = apiResponse?.data || apiResponse;
        setCompletionStatus(globalCompletionData);
        setFreshCompletionData(globalCompletionData);
      } catch (refreshError) {
        // Erreur non bloquante
        console.warn('⚠️ [NutritionCard] Erreur rafraîchissement statut:', refreshError);
      }
      
      Toast.show({
        type: 'success',
        text1: 'Repas complété !',
        text2: 'Vous avez gagné 25 points',
        visibilityTime: 2000,
      });
    } catch (error: any) {
      console.error('❌ [NutritionCard] Erreur complétion repas:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de compléter le repas',
        visibilityTime: 2000,
      });
    }
  }, [propsCurrentPlan, currentPlan, propsCurrentPlanDay, currentPlanDay]);

  // ✅ ANDROID: Bloquer l'accès si pas d'abonnement actif
  const hasActiveSubscription = isIOS || 
    subscriptionData?.status === 'ACTIVE' || 
    subscriptionData?.hasActiveSubscription === true ||
    (subscriptionData?.subscription?.status?.toUpperCase() === 'ACTIVE' && !subscriptionData?.isExpired);
  
  if (Platform.OS === 'android' && !hasActiveSubscription) {
    return (
      <View style={styles.container}>
        <View style={styles.lockedContainer}>
          <View style={styles.lockIconContainer}>
            <Ionicons name="lock-closed" size={48} color="#FF9800" />
          </View>
          <Text style={styles.lockedTitle}>Menu du jour verrouillé</Text>
          <Text style={styles.lockedMessage}>
            Abonnez-vous pour accéder au menu du jour
          </Text>
          <TouchableOpacity 
            style={styles.subscribeButton}
            onPress={() => {
              if (onSubscriptionPress) {
                onSubscriptionPress();
              } else if (onPress) {
                onPress();
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="rocket" size={20} color="#FFFFFF" />
            <Text style={styles.subscribeButtonText}>Voir les plans d'abonnement</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ✅ Ne pas afficher le loading si les données sont déjà fournies via props
  if (loading && !usePropsData) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.shimmerContainer}>
            <Shimmer width={80} height={80} borderRadius={12} style={{ marginRight: 16 }} />
            <View style={{ flex: 1 }}>
              <Shimmer width="70%" height={20} style={{ marginBottom: 8 }} />
              <Shimmer width="50%" height={16} style={{ marginBottom: 12 }} />
              <Shimmer width="60%" height={14} />
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (!nextMealToComplete) {
    return (
      <TouchableOpacity 
        style={styles.container}
        onPress={() => {
          if (onTabPress) {
            onTabPress('nutrition');
          } else if (onPress) {
            onPress();
          }
        }}
        activeOpacity={0.7}
      >
        <View style={[styles.card, styles.completedCard]}>
          <View style={styles.completedContent}>
            <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
            <Text style={styles.completedTitle}>Tous les repas complétés !</Text>
            <Text style={styles.completedSubtitle}>Bravo pour votre journée 🎉</Text>
            <View style={styles.viewAllButton}>
              <Text style={styles.viewAllButtonText}>Voir le menu complet</Text>
              <Ionicons name="arrow-forward" size={16} color={theme.colors.primary} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  const mealType = mealTypeMap[nextMealToComplete.type] || mealTypeMap['snack'];
  const mealIcon = mealType.icon || '🍽️';
  const mealTime = mealType.time || '';
  const mealTitle = mealType.title || nextMealToComplete.type;

  const formattedDate = today.toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Header avec titre et date */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Ionicons name="restaurant" size={20} color={theme.colors.text.primary} />
            <Text style={styles.title}>Menu du jour</Text>
            <Text style={styles.date}>{formattedDate}</Text>
          </View>
        </View>

        {/* Meal type avec heure */}
        <View style={styles.mealTypeRow}>
          <Text style={styles.mealTypeText}>
            {mealTitle} ({mealTime})
          </Text>
        </View>

        {/* Image avec timer */}
        <View style={styles.mealImageContainer}>
          <ImagePersistent
            source={{ uri: nextMealToComplete.imageUrl }}
            style={styles.mealImage}
          />
          {/* Timer overlay */}
          <View style={[styles.timerOverlay, isTimePassed && styles.timerOverlayUrgent]}>
            <Ionicons 
              name={isTimePassed ? "time" : "time-outline"} 
              size={24} 
              color={isTimePassed ? "#FFFFFF" : theme.colors.text.primary} 
            />
            <Text style={[styles.timerText, isTimePassed && styles.timerTextUrgent]}>
              {isTimePassed ? "À compléter d'urgence" : mealTime}
            </Text>
          </View>
        </View>

        {/* Nutrition info */}
        <View style={styles.nutritionInfo}>
          {nextMealToComplete.calories && (
            <View style={styles.nutritionItem}>
              <Ionicons name="flame" size={14} color="#FF6B6B" />
              <Text style={styles.nutritionText}>{nextMealToComplete.calories} kcal</Text>
            </View>
          )}
          {nextMealToComplete.proteins !== undefined && (
            <View style={styles.nutritionItem}>
              <Ionicons name="fitness" size={14} color="#4ECDC4" />
              <Text style={styles.nutritionText}>{nextMealToComplete.proteins}g protéines</Text>
            </View>
          )}
          {nextMealToComplete.carbs !== undefined && (
            <View style={styles.nutritionItem}>
              <Ionicons name="leaf" size={14} color="#95E1D3" />
              <Text style={styles.nutritionText}>{nextMealToComplete.carbs}g glucides</Text>
            </View>
          )}
        </View>

        {/* Nom du repas */}
        <Text style={styles.mealName} numberOfLines={2}>
          {nextMealToComplete.name}
        </Text>

        {/* Actions buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={styles.viewMoreButton}
            onPress={() => {
              if (onTabPress) {
                onTabPress('nutrition');
              } else if (onPress) {
                onPress();
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="eye-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.viewMoreText}>Voir +</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, isTimePassed && styles.actionButtonUrgent]}
            onPress={() => {
              // ✅ Ouvrir le modal de détails du repas (comme dans NutritionScreen)
              setShowMealDetailModal(true);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonText}>Compléter ce repas</Text>
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ✅ MealDetailModal - Même que NutritionScreen quand on clique sur un repas */}
      {nextMealToComplete && (
        <MealDetailModal
          visible={showMealDetailModal}
          onClose={() => {
            setShowMealDetailModal(false);
            setCompletingMealInModal(null);
          }}
          meal={nextMealToComplete}
          isCompleted={isMealCompleted(
            nextMealToComplete.id, 
            propsCompletionData || freshCompletionData || completionStatus, 
            propsCurrentPlanDay !== undefined ? propsCurrentPlanDay : currentPlanDay
          )}
          isCompleting={completingMealInModal === nextMealToComplete.id}
          onComplete={async () => {
            if (!nextMealToComplete) return;
            setCompletingMealInModal(nextMealToComplete.id);
            try {
              await handleMealComplete(nextMealToComplete.id);
              // Rafraîchir le statut après complétion
              const planToUse = propsCurrentPlan || currentPlan;
              if (planToUse?.id) {
                try {
                  const apiResponse = await nutritionAPI.getCompletionStatus(planToUse.id);
                  const globalCompletionData = apiResponse?.data || apiResponse;
                  setFreshCompletionData(globalCompletionData);
                  setCompletionStatus(globalCompletionData);
                } catch (error) {
                  console.warn('⚠️ [NutritionCard] Erreur rafraîchissement statut:', error);
                }
              }
            } finally {
              setCompletingMealInModal(null);
            }
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginLeft: 8,
    marginRight: 8,
  },
  date: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginLeft: 'auto',
  },
  mealTypeRow: {
    marginBottom: 12,
  },
  mealTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  mealImageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  mealImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  timerOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  timerOverlayUrgent: {
    backgroundColor: '#FF4444',
  },
  timerText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginLeft: 6,
  },
  timerTextUrgent: {
    color: '#FFFFFF',
  },
  nutritionInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  nutritionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 4,
  },
  nutritionText: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  mealName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 16,
    lineHeight: 24,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: 'transparent',
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    marginLeft: 6,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  actionButtonUrgent: {
    backgroundColor: '#FF4444',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  // Completed state
  completedCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  completedContent: {
    alignItems: 'center',
  },
  completedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  completedSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 20,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  viewAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    marginRight: 4,
  },
  // Locked state
  lockedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  lockIconContainer: {
    marginBottom: 16,
  },
  lockedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  lockedMessage: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Shimmer
  shimmerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default NutritionCard;
