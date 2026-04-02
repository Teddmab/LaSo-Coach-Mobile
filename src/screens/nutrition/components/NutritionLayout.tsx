import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, ScrollView, RefreshControl, Platform, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { ShimmerCard } from '../../../components/Shimmer';
import MealDetailBottomSheet from '../../../components/nutrition/MealDetailModal';
import VideoBottomSheet from '../../../components/nutrition/VideoBottomSheet';
import CompleteMealsBottomSheet from '../../../components/nutrition/CompleteMealsBottomSheet';
// ✅ PastMealsBottomSheet supprimé - Le bouton complète maintenant tous les plats d'un coup
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
import NouveautesBottomSheet from '../../../components/nouveautes/NouveautesBottomSheet';
import { useNouveautes } from '../../../hooks/useNouveautes';
import Toast from 'react-native-toast-message';
import { nutritionSync } from '../../../utils/nutritionSync';

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
  
  // ✅ CORRECTION: État local pour profileData (sera mis à jour quand nutritionDataHook est chargé)
  const [profileData, setProfileData] = useState<any>(null);

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

  // ✅ CORRECTION: Créer completionStatusHook AVANT nutritionDataHook pour éviter la dépendance circulaire
  // onLoadDayData sera appelé directement dans handleMealComplete
  const completionStatusHook = useCompletionStatus(
    currentPlan,
    subscriptionData,
    profileData, // ✅ Utiliser l'état local qui sera mis à jour
    selectedDate,
    [],
    calculateNutritionPlanDay,
    undefined, // ✅ Ne pas passer loadDayData ici, on l'appellera directement dans handleMealComplete
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

  // ✅ CORRECTION: Mettre à jour profileData quand nutritionDataHook.profileData est disponible
  useEffect(() => {
    if (nutritionDataHook.profileData) {
      setProfileData(nutritionDataHook.profileData);
    }
  }, [nutritionDataHook.profileData]);

  // Ref pour tracker le dernier currentPlanDay chargé pour éviter les boucles
  const lastLoadedPlanDayRef = useRef<number | undefined>(undefined);
  const lastLoadedPlanIdRef = useRef<string | null>(null);

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

  // ✅ Recharger les données du jour avec le currentPlanDay calculé automatiquement
  // Cela garantit que le bon jour est affiché dès le chargement initial
  useEffect(() => {
    const planId = nutritionDataHook.currentPlan?.id;
    const shouldLoad = 
      planId && 
      currentPlanDay !== undefined && 
      weekDays && 
      weekDays.length > 0 &&
      !nutritionDataHook.isLoadingDayData &&
      (lastLoadedPlanDayRef.current !== currentPlanDay || lastLoadedPlanIdRef.current !== planId);
    
    if (shouldLoad) {
      if (__DEV__) {
        console.log('📅 [NutritionLayout] Chargement des données avec currentPlanDay:', {
          currentPlanDay,
          planId,
          lastLoadedPlanDay: lastLoadedPlanDayRef.current,
          lastLoadedPlanId: lastLoadedPlanIdRef.current,
        });
      }
      lastLoadedPlanDayRef.current = currentPlanDay;
      lastLoadedPlanIdRef.current = planId;
      nutritionDataHook.loadDayData(nutritionDataHook.currentPlan, currentPlanDay);
    }
    // ✅ Ne pas inclure isLoadingDayData dans les dépendances pour éviter les boucles
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlanDay, nutritionDataHook.currentPlan?.id, weekDays?.length]);

  // Meal interactions
  const mealInteractionsHook = useMealInteractions(
    nutritionDataHook.dayMeals,
    null
  );

  // Nouveautés Nutrition : affiché une seule fois au premier passage sur l'onglet
  const {
    visible: showNouveautesNutrition,
    onComplete: onNouveautesNutritionComplete,
    steps: nouveautesNutritionSteps,
  } = useNouveautes('nutrition');

  // Modal states
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [youtubePlaying, setYoutubePlaying] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [mealsToComplete, setMealsToComplete] = useState<Meal[]>([]);
  const [videoSheetVideoId, setVideoSheetVideoId] = useState<string | null>(null);
  const [videoSheetTitle, setVideoSheetTitle] = useState<string | null>(null);
  // ✅ showPastMealsBottomSheet supprimé - Le bouton complète maintenant tous les plats d'un coup

  // ✅ Ne plus mettre à jour currentPlanDay manuellement ici
  // useNutritionDate le calcule automatiquement quand currentPlan, selectedDate ou subscriptionData changent

  // Initial load
  useEffect(() => {
    if (!nutritionDataHook.hasInitialLoadRef.current) {
      nutritionDataHook.fetchAllData();
      nutritionDataHook.hasInitialLoadRef.current = true;
    }
  }, []);

  // Ref pour tracker si on a déjà appelé fetchAllData dans useFocusEffect
  const focusEffectFetchRef = useRef(false);
  
  // Focus effect
  useFocusEffect(
    useCallback(() => {
      // Protection contre les appels multiples sur Android
      if (nutritionDataHook.isFetchingAllData || nutritionDataHook.isLoadingDayData || !nutritionDataHook.hasInitialLoadRef.current) {
        return;
      }

      // Si on a déjà les données nécessaires, ne pas recharger
      if (nutritionDataHook.currentPlan?.id && subscriptionData && weekDays && weekDays.length > 0) {
        // Rafraîchir seulement le statut de complétion si nécessaire
        if (nutritionDataHook.currentPlan?.id) {
          completionStatusHook.fetchCompletionStatus(nutritionDataHook.currentPlan.id);
        }
        focusEffectFetchRef.current = true;
        return;
      }

      // Ne charger que si on n'a pas déjà chargé dans ce focus effect
      if (!focusEffectFetchRef.current) {
        focusEffectFetchRef.current = true;
        nutritionDataHook.fetchAllData();
      }
      
      // Réinitialiser le flag quand l'écran perd le focus
      return () => {
        focusEffectFetchRef.current = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nutritionDataHook.currentPlan?.id, subscriptionData, weekDays?.length])
  );

  // ✅ Ces useEffect sont supprimés car le useEffect principal (ligne 101) gère déjà le chargement
  // avec le currentPlanDay calculé automatiquement. Cela évite les conflits et garantit le bon jour.

  // Handle meal press
  // ✅ CORRECTION: Ouvrir le MealDetailModal (bottomsheet avec détails, ingrédients et bouton compléter)
  const handleMealPress = useCallback((meal: Meal) => {
    if (__DEV__) {
      console.log('🎯 [NutritionLayout] handleMealPress called', {
        mealId: meal.id,
        mealName: meal.name,
        hasYoutubeUrl: !!meal.youtubeUrl,
      });
    }
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
    if (__DEV__) {
      console.log('✅ [NutritionLayout] showYoutubeModal set to true');
    }
  }, []);

  // Handle date select
  const handleDateSelect = useCallback((date: Date, dayOfWeek: number) => {
    setSelectedDate(date);
    setSelectedMeal(null);
  }, [setSelectedDate]);

  // ✅ Vérifier si la date sélectionnée est aujourd'hui
  const isToday = useMemo(() => {
    const selectedDateObj = selectedDate instanceof Date ? selectedDate : today;
    selectedDateObj.setHours(0, 0, 0, 0);
    const todayObj = new Date(today);
    todayObj.setHours(0, 0, 0, 0);
    return selectedDateObj.getTime() === todayObj.getTime();
  }, [selectedDate, today]);

  // Nombre de repas restant à compléter pour la journée (aujourd'hui uniquement)
  const incompleteMealsCountForDay = useMemo(() => {
    if (!isToday || !nutritionDataHook.currentPlan || nutritionDataHook.dayMeals.length === 0) {
      return 0;
    }
    const completionDataToUse = completionStatusHook.freshCompletionData || completionStatusHook.completionStatus;
    const d = new Date(selectedDate instanceof Date ? selectedDate : today);
    d.setHours(0, 0, 0, 0);
    return nutritionDataHook.dayMeals.filter((meal: Meal) =>
      !completionStatusHook.isMealCompleted(meal.id, completionDataToUse, currentPlanDay, d)
    ).length;
  }, [nutritionDataHook.dayMeals, completionStatusHook.completionStatus, completionStatusHook.freshCompletionData, nutritionDataHook.currentPlan, currentPlanDay, completionStatusHook.isMealCompleted, isToday, selectedDate, today]);

  const hasIncompleteMeals = incompleteMealsCountForDay > 0;

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

      const d = new Date(selectedDate instanceof Date ? selectedDate : today);
      d.setHours(0, 0, 0, 0);
      const planDayForFilter = calculateNutritionPlanDay(d);

      const incompleteMeals = nutritionDataHook.dayMeals.filter((meal: Meal) => {
        return !completionStatusHook.isMealCompleted(meal.id, globalCompletionData, planDayForFilter, d);
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

      const d = new Date(selectedDate instanceof Date ? selectedDate : today);
      d.setHours(0, 0, 0, 0);
      const planDayForFilter = calculateNutritionPlanDay(d);

      const incompleteMeals = nutritionDataHook.dayMeals.filter((meal: Meal) => {
        return !completionStatusHook.isMealCompleted(meal.id, completionStatusHook.completionStatus, planDayForFilter, d);
      });

      setMealsToComplete(incompleteMeals);
      setShowCompletionModal(true);
    }
  }, [nutritionDataHook.currentPlan, nutritionDataHook.dayMeals, selectedDate, today, calculateNutritionPlanDay, completionStatusHook]);

  // ✅ Handle past meals button press - Compléter TOUS les plats passés non complétés d'un coup
  const handlePastMealsPress = useCallback(async () => {
    if (!nutritionDataHook.currentPlan?.id) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de compléter les repas passés',
      });
      return;
    }

    const pastMeals = completionStatusHook.pastIncompleteMeals;
    if (!pastMeals || pastMeals.length === 0) {
      Toast.show({
        type: 'info',
        text1: 'Aucun repas à compléter',
        text2: 'Tous les repas passés sont déjà complétés',
      });
      return;
    }

    try {
      // Afficher un toast de chargement
      Toast.show({
        type: 'info',
        text1: 'Complétion en cours...',
        text2: `Complétion de ${pastMeals.length} repas passés`,
        visibilityTime: 2000,
      });

      // ✅ CORRECTION: Compléter tous les pastMeals un par un avec les bonnes dates
      let completedCount = 0;
      let errorCount = 0;

      for (const pastMeal of pastMeals) {
        try {
          // ✅ CORRECTION: Passer la date du past meal pour que la complétion soit enregistrée avec la bonne date
          await completionStatusHook.handleMealComplete(
            pastMeal.meal.id, 
            pastMeal.planDay,
            pastMeal.date  // ✅ Date du past meal (pas aujourd'hui!)
          );
          completedCount++;
        } catch (error) {
          console.error(`❌ [PAST MEALS] Erreur lors de la complétion du repas ${pastMeal.meal.id}:`, error);
          errorCount++;
        }
      }

      // Rafraîchir le statut de complétion après toutes les complétions
      if (nutritionDataHook.currentPlan?.id) {
        await completionStatusHook.fetchCompletionStatus(nutritionDataHook.currentPlan.id);
      }

      // Afficher un message de succès
      if (completedCount > 0) {
        Toast.show({
          type: 'success',
          text1: 'Repas complétés !',
          text2: `${completedCount} repas passé${completedCount > 1 ? 's' : ''} complété${completedCount > 1 ? 's' : ''}${errorCount > 0 ? ` (${errorCount} erreur${errorCount > 1 ? 's' : ''})` : ''}`,
          visibilityTime: 3000,
        });
      }

      if (errorCount > 0 && completedCount === 0) {
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: `Impossible de compléter les repas (${errorCount} erreur${errorCount > 1 ? 's' : ''})`,
          visibilityTime: 3000,
        });
      }
    } catch (error) {
      console.error('❌ [PAST MEALS] Erreur lors de la complétion des repas passés:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de compléter les repas passés',
        visibilityTime: 3000,
      });
    }
  }, [nutritionDataHook.currentPlan, completionStatusHook]);

  // Handle meal complete
  const handleMealComplete = useCallback(async (mealId: string, planDayOverride?: number) => {
    if (!nutritionDataHook.currentPlan) return;
    
    await completionStatusHook.handleMealComplete(mealId, planDayOverride);
    
    // ✅ Rafraîchir les données du jour pour mettre à jour l'affichage
    if (nutritionDataHook.currentPlan.id) {
      await completionStatusHook.fetchCompletionStatus(nutritionDataHook.currentPlan.id);
      // ✅ CORRECTION: Rafraîchir aussi les données du jour pour mettre à jour la liste des repas
      await nutritionDataHook.loadDayData();
    }
    
    // ✅ Notifier les autres écrans (DashboardScreen) du changement
    nutritionSync.emit('meal-completed', { mealId, planDayOverride });
    nutritionSync.emit('completion-status-updated');
  }, [nutritionDataHook.currentPlan, completionStatusHook, nutritionDataHook]);
  
  // ✅ Écouter les changements depuis DashboardScreen (NutritionCard)
  useEffect(() => {
    const unsubscribeMealCompleted = nutritionSync.subscribe('meal-completed', async (data: any) => {
      // Rafraîchir les données quand un repas est complété dans DashboardScreen
      if (nutritionDataHook.currentPlan?.id) {
        try {
          await completionStatusHook.fetchCompletionStatus(nutritionDataHook.currentPlan.id);
          await nutritionDataHook.loadDayData();
        } catch (error) {
          console.error('❌ [NutritionLayout] Erreur lors du rafraîchissement après complétion:', error);
        }
      }
    });
    
    const unsubscribeStatusUpdated = nutritionSync.subscribe('completion-status-updated', async () => {
      // Rafraîchir le statut de complétion
      if (nutritionDataHook.currentPlan?.id) {
        try {
          await completionStatusHook.fetchCompletionStatus(nutritionDataHook.currentPlan.id);
        } catch (error) {
          console.error('❌ [NutritionLayout] Erreur lors du rafraîchissement du statut:', error);
        }
      }
    });
    
    return () => {
      unsubscribeMealCompleted();
      unsubscribeStatusUpdated();
    };
    // ✅ Ne pas inclure completionStatusHook et nutritionDataHook dans les dépendances pour éviter les boucles
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nutritionDataHook.currentPlan?.id]);

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

    // ✅ CORRECTION: Utiliser freshCompletionData en priorité
    const completionDataToUse = completionStatusHook.freshCompletionData || completionStatusHook.completionStatus;
  const selectedDateObj = selectedDate instanceof Date ? selectedDate : today;
  selectedDateObj.setHours(0, 0, 0, 0);
  const isMealCompletedForModal = selectedMeal 
    ? completionStatusHook.isMealCompleted(
        selectedMeal.id, 
        completionDataToUse, 
        currentPlanDay,
        selectedDateObj
      )
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

        {/* ✅ Bouton "Compléter des repas" - Monté juste après le calendrier */}
        {/* ✅ Afficher uniquement si l'utilisateur a un abonnement actif */}
        {nutritionDataHook.currentPlan && nutritionDataHook.dayMeals.length > 0 && hasIncompleteMeals && hasActiveSubscription && (
          <CompleteMealsButton
            remainingCount={incompleteMealsCountForDay}
            onPress={handleCompleteMealsPress}
          />
        )}

        {(nutritionDataHook.plansResponseStatus === 200 || (nutritionDataHook.currentPlan && hasActiveSubscription) || nutritionDataHook.dayMeals.length > 0) && (
          <View style={styles.mealsContainer}>
            {/* ✅ PastMealsButton caché */}
            {/* {completionStatusHook.totalPastIncompleteMeals > 0 && (
              <PastMealsButton
                totalPastIncompleteMeals={completionStatusHook.totalPastIncompleteMeals}
                onPress={handlePastMealsPress}
              />
            )} */}

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

        {/* ✅ ProgressCard caché */}
        {/* {nutritionDataHook.currentPlan && (
          <ProgressCard
            completedMeals={completionStatusHook.getCompletedMealsCount()}
            totalMeals={completionStatusHook.getTotalMealsCount(nutritionDataHook.dayMeals)}
            progressPercentage={completionStatusHook.getCompletionProgress()}
          />
        )} */}
      </ScrollView>

      {/* Modals and Bottom Sheets */}
      {selectedMeal && (
        <MealDetailBottomSheet
          visible={showYoutubeModal}
          onClose={() => {
            if (__DEV__) {
              console.log('🔴 [NutritionLayout] Closing modal');
            }
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
          hasActiveSubscription={hasActiveSubscription}
          selectedDate={selectedDate}
          onOpenVideo={(videoId, title) => {
            setVideoSheetVideoId(videoId);
            setVideoSheetTitle(title ?? null);
            setShowYoutubeModal(false);
          }}
        />
      )}

      <VideoBottomSheet
        visible={!!videoSheetVideoId}
        videoId={videoSheetVideoId}
        title={videoSheetTitle ?? undefined}
        onClose={() => {
          setVideoSheetVideoId(null);
          setVideoSheetTitle(null);
          setShowYoutubeModal(true);
        }}
      />

      <CompleteMealsBottomSheet
        visible={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        meals={mealsToComplete}
        planDay={currentPlanDay}
        selectedDate={selectedDate}
        completionStatus={completionStatusHook.completionStatus}
        freshCompletionData={completionStatusHook.freshCompletionData}
        onMealComplete={handleMealComplete}
        onRefresh={async () => {
          if (nutritionDataHook.currentPlan?.id) {
            await completionStatusHook.fetchCompletionStatus(nutritionDataHook.currentPlan.id);
          }
        }}
        hasActiveSubscription={hasActiveSubscription}
      />

      {/* Nouveautés Nutrition - une seule fois */}
      <NouveautesBottomSheet
        visible={showNouveautesNutrition}
        steps={nouveautesNutritionSteps}
        onComplete={onNouveautesNutritionComplete}
        variant="nutrition"
      />

      {/* ✅ PastMealsBottomSheet supprimé - Le bouton complète maintenant tous les plats d'un coup */}
    </>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 48,
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
    marginBottom: 32,
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

