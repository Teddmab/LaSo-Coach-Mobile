import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, ScrollView, RefreshControl, Platform, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { ShimmerCard } from '../../../components/Shimmer';
import MealDetailBottomSheet from '../../../components/nutrition/MealDetailModal';
import CompleteMealsBottomSheet from '../../../components/nutrition/CompleteMealsBottomSheet';
import PastMealsBottomSheet from '../../../components/nutrition/PastMealsBottomSheet';
import SubscriptionAlert from '../../../components/nutrition/SubscriptionAlert';
import { NutritionHeader } from './NutritionHeader';
import { WeekCalendar } from './WeekCalendar';
import { MealsList } from './MealsList';
import { ProgressCard } from './ProgressCard';
import { CompleteMealsButton } from './CompleteMealsButton';
import { PastMealsButton } from './PastMealsButton';
import { useNutritionDate } from '../hooks/useNutritionDate';
import { useSubscription } from '../hooks/useSubscription';
import { useNutritionData } from '../hooks/useNutritionData';
import { useCompletionStatus } from '../hooks/useCompletionStatus';
import { useMealInteractions } from '../hooks/useMealInteractions';
import { Meal, NutritionScreenProps } from '../types';
import { createLogger } from '../../../utils/logger';
import nutritionAPI from '../../../services/nutritionApi';
import Toast from 'react-native-toast-message';

const logger = createLogger('NutritionLayout');

// Extract YouTube video ID from URL
const getYouTubeVideoId = (url: string | null | undefined): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export const NutritionLayout: React.FC<NutritionScreenProps> = ({
  onSubscriptionRenew,
}) => {
  // Subscription state
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const { hasActiveSubscription, isIOS } = useSubscription(subscriptionData);

  // Temporary state for plansResponseStatus and currentPlan
  const [plansResponseStatus, setPlansResponseStatus] = useState<number | null>(null);
  const [currentPlan, setCurrentPlan] = useState<any>(null);

  // Date management
  const {
    today,
    selectedDate,
    setSelectedDate,
    currentPlanDay,
    setCurrentPlanDay,
    weekDays,
    calculateNutritionPlanDay,
    formatDate,
    isSameDate,
  } = useNutritionDate(subscriptionData, plansResponseStatus, currentPlan);

  // Completion status hook
  const completionStatusHook = useCompletionStatus(
    currentPlan,
    subscriptionData,
    null,
    selectedDate,
    [],
    calculateNutritionPlanDay,
    undefined,
    false
  );

  // Nutrition data hook
  const nutritionDataHook = useNutritionData(
    subscriptionData,
    setSubscriptionData,
    weekDays,
    selectedDate,
    completionStatusHook.fetchCompletionStatus
  );

  // Update plansResponseStatus and currentPlan from nutritionDataHook
  useEffect(() => {
    setPlansResponseStatus(nutritionDataHook.plansResponseStatus);
    setCurrentPlan(nutritionDataHook.currentPlan);
  }, [nutritionDataHook.plansResponseStatus, nutritionDataHook.currentPlan]);

  // Update currentPlan in completion hook
  useEffect(() => {
    if (nutritionDataHook.currentPlan) {
      // Re-initialize completion hook with current plan
    }
  }, [nutritionDataHook.currentPlan]);

  // Meal interactions
  const mealInteractionsHook = useMealInteractions(
    nutritionDataHook.dayMeals,
    null
  );

  // Modal states
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [youtubePlaying, setYoutubePlaying] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [mealsToComplete, setMealsToComplete] = useState<Meal[]>([]);
  const [showPastMealsBottomSheet, setShowPastMealsBottomSheet] = useState(false);

  // Update currentPlanDay when selectedDate changes
  useEffect(() => {
    if (nutritionDataHook.currentPlan) {
      const planDay = calculateNutritionPlanDay(selectedDate);
      setCurrentPlanDay(planDay);
    }
  }, [selectedDate, nutritionDataHook.currentPlan, calculateNutritionPlanDay, setCurrentPlanDay]);

  // Initial load
  useEffect(() => {
    if (!nutritionDataHook.hasInitialLoadRef.current) {
      nutritionDataHook.fetchAllData();
      nutritionDataHook.hasInitialLoadRef.current = true;
    }
  }, []);

  // Focus effect
  useFocusEffect(
    useCallback(() => {
      if (nutritionDataHook.isFetchingAllData || nutritionDataHook.isLoadingDayData || !nutritionDataHook.hasInitialLoadRef.current) {
        return;
      }

      if (!nutritionDataHook.currentPlan?.id || !subscriptionData || !weekDays || weekDays.length === 0) {
        nutritionDataHook.fetchAllData();
        return;
      }

      if (!nutritionDataHook.dayMeals || nutritionDataHook.dayMeals.length === 0) {
        if (Platform.OS === 'android') {
          requestAnimationFrame(() => {
            setTimeout(() => {
              nutritionDataHook.loadDayData();
            }, 50);
          });
        } else {
          nutritionDataHook.loadDayData();
        }
        return;
      }

      if (nutritionDataHook.currentPlan?.id) {
        completionStatusHook.fetchCompletionStatus(nutritionDataHook.currentPlan.id);
      }
    }, [])
  );

  // Auto-load day data when plan/subscription/weekDays are available
  useEffect(() => {
    if (!nutritionDataHook.hasInitialLoadRef.current) {
      return;
    }

    if (!nutritionDataHook.currentPlan?.id || !subscriptionData || !weekDays || weekDays.length === 0) {
      return;
    }

    if (nutritionDataHook.isLoadingDayData || nutritionDataHook.isFetchingAllData) {
      return;
    }

    const selectedDateKey = selectedDate instanceof Date ? selectedDate.getTime() : selectedDate;
    const shouldLoad = !nutritionDataHook.dayMeals || nutritionDataHook.dayMeals.length === 0;

    if (shouldLoad) {
      if (Platform.OS === 'android') {
        requestAnimationFrame(() => {
          setTimeout(() => {
            nutritionDataHook.loadDayData();
          }, 50);
        });
      } else {
        queueMicrotask(() => {
          nutritionDataHook.loadDayData();
        });
      }
    }
  }, [nutritionDataHook.currentPlan?.id, subscriptionData, weekDays?.length, selectedDate, nutritionDataHook.dayMeals?.length]);

  // Load day data when selectedDate changes
  useEffect(() => {
    if (!nutritionDataHook.hasInitialLoadRef.current || !nutritionDataHook.currentPlan || !subscriptionData || !weekDays || weekDays.length === 0) {
      return;
    }

    if (!nutritionDataHook.isLoadingDayData && !nutritionDataHook.isFetchingAllData) {
      nutritionDataHook.loadDayData();
    }
  }, [selectedDate]);

  // Handle meal press
  // ✅ CORRECTION: Ouvrir le MealDetailModal (bottomsheet avec détails, ingrédients et bouton compléter)
  const handleMealPress = useCallback((meal: Meal) => {
    setSelectedMeal(meal);
    if (meal.youtubeUrl) {
      const videoId = getYouTubeVideoId(meal.youtubeUrl);
      setYoutubeVideoId(videoId);
      setYoutubePlaying(true);
    } else {
      setYoutubeVideoId(null);
      setYoutubePlaying(false);
    }
    setShowYoutubeModal(true);
  }, []);

  // Handle date select
  const handleDateSelect = useCallback((date: Date, dayOfWeek: number) => {
    setSelectedDate(date);
    setSelectedMeal(null);
  }, [setSelectedDate]);

  // Check if there are incomplete meals
  const hasIncompleteMeals = useMemo(() => {
    if (!nutritionDataHook.currentPlan || nutritionDataHook.dayMeals.length === 0) {
      return false;
    }

    const completionDataToUse = completionStatusHook.completionStatus || completionStatusHook.freshCompletionData;
    return nutritionDataHook.dayMeals.some((meal: Meal) => {
      return !completionStatusHook.isMealCompleted(meal.id, completionDataToUse, currentPlanDay);
    });
  }, [nutritionDataHook.dayMeals, completionStatusHook.completionStatus, completionStatusHook.freshCompletionData, nutritionDataHook.currentPlan, currentPlanDay, completionStatusHook.isMealCompleted]);

  // Handle complete meals button press
  const handleCompleteMealsPress = useCallback(async () => {
    if (!nutritionDataHook.currentPlan?.id) return;

    try {
      const apiResponse = await nutritionAPI.getCompletionStatus(nutritionDataHook.currentPlan.id);
      const globalCompletionData = apiResponse?.data || apiResponse;
      
      completionStatusHook.setFreshCompletionData(globalCompletionData);
      completionStatusHook.setCompletionStatus(prevStatus => ({
        ...prevStatus,
        ...globalCompletionData,
        progress: globalCompletionData?.progress || prevStatus?.progress,
        allCompletions: globalCompletionData?.allCompletions || prevStatus?.allCompletions,
        dayProgress: globalCompletionData?.dayProgress || prevStatus?.dayProgress,
        mealStatus: globalCompletionData?.mealStatus || prevStatus?.mealStatus,
        completionsByDay: globalCompletionData?.completionsByDay || prevStatus?.completionsByDay,
      }));

      const selectedDateObj = selectedDate instanceof Date ? selectedDate : today;
      selectedDateObj.setHours(0, 0, 0, 0);
      const planDayForFilter = calculateNutritionPlanDay(selectedDateObj);

      const incompleteMeals = nutritionDataHook.dayMeals.filter((meal: Meal) => {
        return !completionStatusHook.isMealCompleted(meal.id, globalCompletionData, planDayForFilter);
      });

      setMealsToComplete(incompleteMeals);
      setShowCompletionModal(true);
    } catch (error: any) {
      const errorStatus = error?.response?.status || error?.status;
      if (errorStatus === 401) {
        Toast.show({
          type: 'error',
          text1: 'Erreur d\'authentification',
          text2: 'Votre session a expiré. Veuillez vous reconnecter.',
          visibilityTime: 4000,
        });
        return;
      }

      const selectedDateObj = selectedDate instanceof Date ? selectedDate : today;
      selectedDateObj.setHours(0, 0, 0, 0);
      const planDayForFilter = calculateNutritionPlanDay(selectedDateObj);

      const incompleteMeals = nutritionDataHook.dayMeals.filter((meal: Meal) => {
        return !completionStatusHook.isMealCompleted(meal.id, completionStatusHook.completionStatus, planDayForFilter);
      });

      setMealsToComplete(incompleteMeals);
      setShowCompletionModal(true);
    }
  }, [nutritionDataHook.currentPlan, nutritionDataHook.dayMeals, selectedDate, today, calculateNutritionPlanDay, completionStatusHook]);

  // Handle past meals button press
  const handlePastMealsPress = useCallback(async () => {
    if (!nutritionDataHook.currentPlan?.id) {
      setShowPastMealsBottomSheet(true);
      return;
    }

    try {
      const apiResponse = await nutritionAPI.getCompletionStatus(nutritionDataHook.currentPlan.id);
      const globalCompletionData = apiResponse?.data || apiResponse;
      const newFreshData = JSON.parse(JSON.stringify(globalCompletionData));
      
      completionStatusHook.setCompletionStatus(prevStatus => ({
        ...prevStatus,
        ...newFreshData,
        progress: newFreshData?.progress || prevStatus?.progress,
        allCompletions: newFreshData?.allCompletions || prevStatus?.allCompletions,
        dayProgress: newFreshData?.dayProgress || prevStatus?.dayProgress,
        mealStatus: newFreshData?.mealStatus || prevStatus?.mealStatus,
        completionsByDay: newFreshData?.completionsByDay || prevStatus?.completionsByDay,
      }));
      
      completionStatusHook.setFreshCompletionData(newFreshData);
      
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            setShowPastMealsBottomSheet(true);
            resolve(undefined);
          }, 100);
        });
      });
    } catch (error) {
      console.error('❌ [PAST MEALS] Erreur lors du rafraîchissement du statut:', error);
      setShowPastMealsBottomSheet(true);
    }
  }, [nutritionDataHook.currentPlan, completionStatusHook]);

  // Handle meal complete
  const handleMealComplete = useCallback(async (mealId: string, planDayOverride?: number) => {
    if (!nutritionDataHook.currentPlan) return;
    
    await completionStatusHook.handleMealComplete(mealId, planDayOverride);
    if (nutritionDataHook.currentPlan.id) {
      await completionStatusHook.fetchCompletionStatus(nutritionDataHook.currentPlan.id);
    }
  }, [nutritionDataHook.currentPlan, completionStatusHook]);

  if (nutritionDataHook.loading) {
    return (
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.sectionContainer}>
          <ShimmerCard />
          <ShimmerCard />
          <ShimmerCard />
          <ShimmerCard />
        </View>
      </ScrollView>
    );
  }

  // Android: Show locked card if no active subscription
  if (Platform.OS === 'android' && !hasActiveSubscription) {
    return (
      <View style={[styles.content, { backgroundColor: '#F0F0F0' }]}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.lockedScrollContent}
          refreshControl={
            <RefreshControl refreshing={nutritionDataHook.refreshing} onRefresh={nutritionDataHook.onRefresh} />
          }
        >
          <View style={styles.lockedContainer}>
            <View style={styles.lockIconContainer}>
              <Ionicons name="lock-closed" size={64} color="#FF9800" />
            </View>
            <Text style={styles.lockedTitle}>Nutrition verrouillée</Text>
            <Text style={styles.lockedMessage}>
              Abonnez-vous pour accéder au menu du jour et débloquer tous les plans nutritionnels personnalisés
            </Text>
            <TouchableOpacity 
              style={styles.subscribeButton}
              onPress={() => {
                if (onSubscriptionRenew) {
                  onSubscriptionRenew();
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="rocket" size={20} color="#FFFFFF" />
              <Text style={styles.subscribeButtonText}>Voir les plans d'abonnement</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  const completionDataToUse = completionStatusHook.completionStatus || completionStatusHook.freshCompletionData;
  const isMealCompletedForModal = selectedMeal 
    ? completionStatusHook.isMealCompleted(selectedMeal.id, completionDataToUse, currentPlanDay)
    : false;

  return (
    <>
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={nutritionDataHook.refreshing} onRefresh={nutritionDataHook.onRefresh} />
        }
      >
        <NutritionHeader
          selectedDate={selectedDate}
          formatDate={formatDate}
          profileData={nutritionDataHook.profileData}
          isIOS={isIOS}
        />

        <WeekCalendar
          weekDays={weekDays}
          selectedDate={selectedDate}
          plansResponseStatus={nutritionDataHook.plansResponseStatus}
          isIOS={isIOS}
          isSameDate={isSameDate}
          onDateSelect={handleDateSelect}
          onSubscriptionRenew={onSubscriptionRenew}
        />

        {Platform.OS === 'android' && subscriptionData && hasActiveSubscription && (
          <SubscriptionAlert 
            subscription={subscriptionData}
            onRenew={() => {
              if (onSubscriptionRenew) {
                onSubscriptionRenew();
              }
            }}
          />
        )}

        {(nutritionDataHook.plansResponseStatus === 200 || (nutritionDataHook.currentPlan && hasActiveSubscription) || nutritionDataHook.dayMeals.length > 0) && (
          <View style={styles.mealsContainer}>
            {completionStatusHook.totalPastIncompleteMeals > 0 && (
              <PastMealsButton
                totalPastIncompleteMeals={completionStatusHook.totalPastIncompleteMeals}
                onPress={handlePastMealsPress}
              />
            )}

            <MealsList
              meals={nutritionDataHook.dayMeals}
              dayMeals={nutritionDataHook.dayMeals}
              selectedDate={selectedDate}
              today={today}
              formatDate={formatDate}
              isSameDate={isSameDate}
              isMealCompleted={completionStatusHook.isMealCompleted}
              completionData={completionDataToUse}
              currentPlanDay={currentPlanDay}
              selectedMeal={selectedMeal}
              onMealPress={handleMealPress}
            />
          </View>
        )}

        {nutritionDataHook.currentPlan && (
          <ProgressCard
            completedMeals={completionStatusHook.getCompletedMealsCount()}
            totalMeals={completionStatusHook.getTotalMealsCount(nutritionDataHook.dayMeals)}
            progressPercentage={completionStatusHook.getCompletionProgress()}
          />
        )}

        {nutritionDataHook.currentPlan && nutritionDataHook.dayMeals.length > 0 && hasIncompleteMeals && (
          <CompleteMealsButton onPress={handleCompleteMealsPress} />
        )}
      </ScrollView>

      {/* Modals and Bottom Sheets */}
      {selectedMeal && (
        <MealDetailBottomSheet
          visible={showYoutubeModal}
          onClose={() => {
            setShowYoutubeModal(false);
            setYoutubePlaying(false);
            setSelectedMeal(null);
          }}
          meal={selectedMeal}
          isCompleted={isMealCompletedForModal}
          isCompleting={false}
          onComplete={async () => {
            if (selectedMeal) {
              await handleMealComplete(selectedMeal.id);
            }
          }}
          mealInteractions={mealInteractionsHook.mealInteractions}
          onLike={mealInteractionsHook.handleMealLike}
          onDislike={mealInteractionsHook.handleMealDislike}
        />
      )}

      <CompleteMealsBottomSheet
        visible={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        meals={mealsToComplete}
        currentPlan={nutritionDataHook.currentPlan}
        selectedDate={selectedDate}
        completionStatus={completionStatusHook.completionStatus}
        freshCompletionData={completionStatusHook.freshCompletionData}
        onMealComplete={handleMealComplete}
        onRefreshCompletionStatus={async () => {
          if (nutritionDataHook.currentPlan?.id) {
            await completionStatusHook.fetchCompletionStatus(nutritionDataHook.currentPlan.id);
          }
        }}
      />

      <PastMealsBottomSheet
        visible={showPastMealsBottomSheet}
        onClose={() => setShowPastMealsBottomSheet(false)}
        pastMeals={completionStatusHook.pastIncompleteMeals}
        currentPlan={nutritionDataHook.currentPlan}
        completionStatus={completionStatusHook.completionStatus}
        freshCompletionData={completionStatusHook.freshCompletionData}
        onMealComplete={handleMealComplete}
        onRefreshCompletionStatus={async () => {
          if (nutritionDataHook.currentPlan?.id) {
            await completionStatusHook.fetchCompletionStatus(nutritionDataHook.currentPlan.id);
          }
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  lockedScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100%',
  },
  sectionContainer: {
    padding: 20,
  },
  mealsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  lockedContainer: {
    alignItems: 'center',
    padding: 40,
  },
  lockIconContainer: {
    marginBottom: 24,
  },
  lockedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#424242',
    marginBottom: 12,
    textAlign: 'center',
  },
  lockedMessage: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  subscribeButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

