import { useState, useMemo, useCallback } from 'react';
import { Platform } from 'react-native';
import { CompletionStatus, Meal, NutritionPlan, SubscriptionData } from '../types';
import nutritionAPI from '../../../services/nutritionApi';
import Toast from 'react-native-toast-message';
import { createLogger } from '../../../utils/logger';
import { calculatePlanDayFromDate, findMenuForPlanDay } from '../utils/dateCalculations';
import { translateErrorMessage } from '../../../utils/errorTranslator';
import { useIOSSimulation } from '../../../hooks/useIOSSimulation';

const logger = createLogger('useCompletionStatus');

export const useCompletionStatus = (
  currentPlan: NutritionPlan | null,
  subscriptionData: SubscriptionData | null,
  profileData: any,
  selectedDate: Date,
  dayMeals: Meal[],
  calculateNutritionPlanDay: (date: Date | number) => number,
  onLoadDayData?: () => void,
  isLoadingDayData?: boolean
) => {
  const { shouldShowIOSOnly } = useIOSSimulation();
  const isIOS = shouldShowIOSOnly();
  
  const [completionStatus, setCompletionStatus] = useState<CompletionStatus | null>(null);
  const [freshCompletionData, setFreshCompletionData] = useState<any>(null);

  // Helper function to check if a meal is completed
  const isMealCompleted = useCallback((
    mealId: string, 
    completionData: CompletionStatus | null | any, 
    planDayToCheck?: number
  ): boolean => {
    if (!completionData) {
      return false;
    }

    // ✅ IMPORTANT: Si planDayToCheck est fourni, vérifier UNIQUEMENT ce jour spécifique
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

    // ✅ Si pas de planDay spécifié, vérifier dans toutes les sources
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

  // Fetch completion status from API
  const fetchCompletionStatus = useCallback(async (planId: string) => {
    logger.group('📊 FETCH COMPLETION STATUS');
    logger.info('Fetching completion status for plan', { planId });
    
    try {
      const globalCompletionData = await nutritionAPI.getCompletionStatus(planId);
      
      if (__DEV__) {
        console.log('📥 [COMPLETION STATUS] Réponse reçue:', {
          hasData: !!globalCompletionData?.data,
          hasProgress: !!globalCompletionData?.data?.progress,
          progressPercentage: globalCompletionData?.data?.progress?.percentage,
          hasCompletionsByDay: !!globalCompletionData?.data?.completionsByDay,
        });
      }
      
      const completionData = globalCompletionData?.data || globalCompletionData;
      
      const updatedCompletionData = {
        ...completionData,
        progress: completionData?.progress,
        allCompletions: completionData?.allCompletions,
        dayProgress: completionData?.dayProgress,
        mealStatus: completionData?.mealStatus,
        completionsByDay: completionData?.completionsByDay,
      };
      
      setCompletionStatus(updatedCompletionData);
      setFreshCompletionData(JSON.parse(JSON.stringify(updatedCompletionData)));
      
      logger.info('✅ Completion status loaded', {
        hasProgress: !!updatedCompletionData.progress,
        completedMeals: updatedCompletionData.progress?.completedMeals,
        totalMeals: updatedCompletionData.progress?.totalMeals,
        percentage: updatedCompletionData.progress?.percentage,
      });
      
      logger.groupEnd();
    } catch (error: any) {
      logger.error('Failed to fetch completion status', error);
      
      const errorStatus = error?.response?.status || error?.status;
      const totalMeals = currentPlan?.menus?.reduce((sum: number, menu: any) => {
        return sum + (menu.meals?.length || 0);
      }, 0) || 0;
      
      const defaultCompletionData = {
        planId: planId,
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
      
      if (__DEV__) {
        console.log('⚠️ [COMPLETION STATUS] Erreur lors du fetch - Initialisation avec valeurs par défaut', {
          errorStatus,
          totalMeals,
          planId,
        });
      }
      
      setCompletionStatus(defaultCompletionData);
      setFreshCompletionData(JSON.parse(JSON.stringify(defaultCompletionData)));
      
      logger.groupEnd();
    }
  }, [currentPlan]);

  // Calculate past incomplete meals
  const pastIncompleteMeals = useMemo((): Array<{ meal: Meal; date: Date; planDay: number }> => {
    const completionDataToUse = freshCompletionData || completionStatus;
    
    if (!currentPlan || !completionDataToUse) {
      if (__DEV__) {
        console.log('⚠️ [PAST MEALS] useMemo - Données manquantes');
      }
      return [];
    }
    
    const pastMeals: Array<{ meal: Meal; date: Date; planDay: number }> = [];
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    
    // Determine if new account
    const hasNoCompletions = !completionDataToUse || 
                             (completionDataToUse.progress?.completedMeals === 0 || 
                              !completionDataToUse.progress?.completedMeals);
    const hasNoCompletionsByDay = !completionDataToUse?.completionsByDay || 
                                   Object.keys(completionDataToUse.completionsByDay).length === 0;
    const isNewAccount = hasNoCompletions && hasNoCompletionsByDay;
    
    let planStartDate: Date;
    
    if (isNewAccount) {
      planStartDate = todayDate;
      return [];
    } else {
      if (profileData?.createdAt) {
        planStartDate = new Date(profileData.createdAt);
        planStartDate.setHours(0, 0, 0, 0);
      } else if (subscriptionData?.subscription?.startDate) {
        planStartDate = new Date(subscriptionData.subscription.startDate);
        planStartDate.setHours(0, 0, 0, 0);
      } else if (currentPlan?.startDate) {
        planStartDate = new Date(currentPlan.startDate);
        planStartDate.setHours(0, 0, 0, 0);
      } else {
        planStartDate = todayDate;
      }
      
      if (planStartDate >= todayDate) {
        return [];
      }
    }
    
    const yesterday = new Date(todayDate);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const startDate = planStartDate > yesterday ? yesterday : planStartDate;
    
    // Calculate incomplete meals per day
    for (let date = new Date(startDate); date <= yesterday; date.setDate(date.getDate() + 1)) {
      const dateCopy = new Date(date);
      const planDay = calculatePlanDayFromDate(
        dateCopy,
        planStartDate,
        currentPlan.numDays || 7
      );
      
      const dayMenu = findMenuForPlanDay(currentPlan.menus, planDay);
      if (!dayMenu || !dayMenu.meals) continue;
      
      const dayCompletions = completionDataToUse.completionsByDay?.[String(planDay)] || 
                            completionDataToUse.completionsByDay?.[planDay] || [];
      const completedMealIds = Array.isArray(dayCompletions) 
        ? dayCompletions.map((c: any) => c?.mealId).filter(Boolean)
        : [];
      
      const incompleteMeals = dayMenu.meals.filter((meal: Meal) => {
        return !completedMealIds.includes(meal.id);
      });
      
      incompleteMeals.forEach((meal: Meal) => {
        pastMeals.push({
          meal,
          date: new Date(dateCopy),
          planDay,
        });
      });
    }
    
    pastMeals.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    const dayStats: Array<{ date: Date; planDay: number; totalMeals: number; completedMeals: number; incompleteMeals: number }> = [];
    for (let date = new Date(startDate); date <= yesterday; date.setDate(date.getDate() + 1)) {
      const dateCopy = new Date(date);
      const planDay = calculatePlanDayFromDate(
        dateCopy,
        planStartDate,
        currentPlan.numDays || 7
      );
      
      const dayMenu = findMenuForPlanDay(currentPlan.menus, planDay);
      if (!dayMenu || !dayMenu.meals) continue;
      
      const dayCompletions = completionDataToUse.completionsByDay?.[String(planDay)] || 
                            completionDataToUse.completionsByDay?.[planDay] || [];
      const completedMeals = Array.isArray(dayCompletions) ? dayCompletions.length : 0;
      const totalMeals = dayMenu.meals.length;
      const incompleteMeals = totalMeals - completedMeals;
      
      dayStats.push({
        date: new Date(dateCopy),
        planDay,
        totalMeals,
        completedMeals,
        incompleteMeals,
      });
    }
    
    const totalIncompleteMeals = dayStats.reduce((sum, day) => sum + day.incompleteMeals, 0);
    (pastMeals as any).__totalIncompleteMeals = totalIncompleteMeals;
    
    return pastMeals;
  }, [currentPlan, freshCompletionData, completionStatus, subscriptionData, profileData, isMealCompleted]);

  const totalPastIncompleteMeals = useMemo(() => {
    const count = (pastIncompleteMeals as any).__totalIncompleteMeals ?? pastIncompleteMeals.length;
    return count;
  }, [pastIncompleteMeals]);

  // Get completion progress percentage
  const getCompletionProgress = useCallback((): number => {
    if (!completionStatus) {
      return 0;
    }
    
    if (completionStatus.progress?.percentage !== undefined && completionStatus.progress.percentage >= 0) {
      return completionStatus.progress.percentage;
    }
    
    if (completionStatus.completionPercentage !== undefined && completionStatus.completionPercentage >= 0) {
      return completionStatus.completionPercentage;
    }
    
    return 0;
  }, [completionStatus]);

  // Get completed meals count
  const getCompletedMealsCount = useCallback((): number => {
    if (!completionStatus) return 0;
    
    if (completionStatus.progress?.completedMeals !== undefined && completionStatus.progress.completedMeals >= 0) {
      return completionStatus.progress.completedMeals;
    }
    
    if (completionStatus.completedMeals !== undefined && completionStatus.completedMeals >= 0) {
      return completionStatus.completedMeals;
    }
    
    if (completionStatus.allCompletions && Array.isArray(completionStatus.allCompletions) && completionStatus.allCompletions.length > 0) {
      return completionStatus.allCompletions.length;
    }
    
    const completedMealIds = completionStatus.dayProgress?.completedMealIds;
    if (completedMealIds && Array.isArray(completedMealIds) && completedMealIds.length > 0) {
      return completedMealIds.length;
    }
    
    if (completionStatus.mealStatus && typeof completionStatus.mealStatus === 'object') {
      const completedCount = Object.values(completionStatus.mealStatus).filter(
        (status: any) => status?.completed === true
      ).length;
      if (completedCount > 0) {
        return completedCount;
      }
    }
    
    return 0;
  }, [completionStatus]);

  // Get total meals count
  const getTotalMealsCount = useCallback((dayMeals: Meal[]): number => {
    if (completionStatus?.progress?.totalMeals !== undefined && completionStatus.progress.totalMeals > 0) {
      return completionStatus.progress.totalMeals;
    }
    
    if (completionStatus?.totalMeals !== undefined && completionStatus.totalMeals > 0) {
      return completionStatus.totalMeals;
    }
    
    if (currentPlan?.menus && Array.isArray(currentPlan.menus)) {
      const totalFromPlan = currentPlan.menus.reduce((sum: number, menu: any) => {
        return sum + (menu.meals?.length || 0);
      }, 0);
      if (totalFromPlan > 0) {
        return totalFromPlan;
      }
    }
    
    return dayMeals.length || 0;
  }, [completionStatus, currentPlan]);

  // Handle meal completion
  const handleMealComplete = useCallback(async (mealId: string, planDayOverride?: number) => {
    logger.group('✅ MEAL COMPLETE ACTION');
    logger.info('User Action: Meal complete button pressed', { mealId, planDayOverride });
    
    // Charger le statut de complétion à jour avant de vérifier
    let freshCompletionStatus = completionStatus;
    if (currentPlan?.id) {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDateObj = selectedDate instanceof Date ? selectedDate : today;
        selectedDateObj.setHours(0, 0, 0, 0);
        const planDay = planDayOverride !== undefined ? planDayOverride : calculateNutritionPlanDay(selectedDateObj);
        const globalCompletionData = await nutritionAPI.getCompletionStatus(currentPlan.id);
        const completionData = globalCompletionData?.data || globalCompletionData;
        freshCompletionStatus = completionData;
        setCompletionStatus(completionData);
        logger.debug('Fresh completion status loaded', { completionData });
      } catch (error: any) {
        logger.warn('Could not load fresh completion status, using cached', { error });
      }
    }
    
    // Vérifier si déjà complété
    const isCompletedByIds = freshCompletionStatus?.dayProgress?.completedMealIds?.includes(mealId) === true;
    const isCompletedByStatus = freshCompletionStatus?.mealStatus?.[mealId]?.completed === true;
    const isAlreadyCompleted = isCompletedByIds || isCompletedByStatus;
    
    if (isAlreadyCompleted) {
      logger.info('Meal already completed - Refreshing data silently');
      if (currentPlan?.id && !isLoadingDayData && onLoadDayData) {
        onLoadDayData();
      }
      Toast.show({
        type: 'info',
        text1: 'Repas déjà complété',
        text2: 'Ce repas a déjà été marqué comme complété',
        visibilityTime: 2000,
      });
      logger.groupEnd();
      return;
    }
    
    try {
      if (!currentPlan?.id) {
        throw new Error('Plan nutritionnel non disponible. Veuillez réessayer.');
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDateObj = selectedDate instanceof Date ? selectedDate : today;
      selectedDateObj.setHours(0, 0, 0, 0);
      const planDay = calculateNutritionPlanDay(selectedDateObj);
      const completionDate = new Date(selectedDateObj);
      completionDate.setHours(0, 0, 0, 0);
      const completionDateISO = completionDate.toISOString().split('T')[0] + 'T00:00:00.000Z';

      const completionData = {
        nutritionPlanId: currentPlan.id,
        completionDate: completionDateISO,
        planDay: planDay,
      };

      logger.debug('API Request: Marking meal as complete', { 
        mealId, 
        endpoint: 'POST /meals/{mealId}/complete',
      });
      
      const response = await nutritionAPI.completeMeal(mealId, completionData);
      
      logger.debug('API Response: Meal marked as complete successfully', {
        response: response?.data || response,
        pointsAwarded: response?.data?.pointsAwarded || response?.pointsAwarded || 25,
      });
      
      // Mettre à jour immédiatement le statut localement
      setCompletionStatus(prevStatus => {
        const newStatus = prevStatus ? { ...prevStatus } : {};
        
        if (!newStatus.progress) {
          const totalMealsFromPlan = currentPlan?.menus?.reduce((sum: number, menu: any) => {
            return sum + (menu.meals?.length || 0);
          }, 0) || dayMeals.length || 0;
          
          newStatus.progress = {
            percentage: 0,
            completedMeals: 0,
            totalMeals: totalMealsFromPlan,
            remainingMeals: totalMealsFromPlan,
          };
        } else {
          newStatus.progress = { ...newStatus.progress };
          if (!newStatus.progress.totalMeals || newStatus.progress.totalMeals === 0) {
            const totalMealsFromPlan = currentPlan?.menus?.reduce((sum: number, menu: any) => {
              return sum + (menu.meals?.length || 0);
            }, 0) || dayMeals.length || 0;
            newStatus.progress.totalMeals = totalMealsFromPlan;
          }
        }
        
        const wasAlreadyCompleted = newStatus.dayProgress?.completedMealIds?.includes(mealId) || 
                                   newStatus.mealStatus?.[mealId]?.completed;
        if (!wasAlreadyCompleted) {
          const currentCompleted = newStatus.progress.completedMeals || 0;
          newStatus.progress.completedMeals = currentCompleted + 1;
          newStatus.progress.remainingMeals = Math.max(0, (newStatus.progress.remainingMeals || 0) - 1);
        }
        
        const totalMeals = newStatus.progress.totalMeals || dayMeals.length || 1;
        const completedMeals = newStatus.progress.completedMeals || 0;
        newStatus.progress.percentage = totalMeals > 0 
          ? Math.round((completedMeals / totalMeals) * 100)
          : 0;
        
        if (!newStatus.dayProgress) {
          newStatus.dayProgress = {};
        }
        if (!newStatus.dayProgress.completedMealIds) {
          newStatus.dayProgress.completedMealIds = [];
        }
        if (!newStatus.dayProgress.completedMealIds.includes(mealId)) {
          newStatus.dayProgress.completedMealIds = [...newStatus.dayProgress.completedMealIds, mealId];
        }
        
        if (!newStatus.mealStatus) {
          newStatus.mealStatus = {};
        }
        newStatus.mealStatus = { ...newStatus.mealStatus };
        newStatus.mealStatus[mealId] = { 
          ...newStatus.mealStatus[mealId], 
          completed: true,
          completedAt: new Date().toISOString()
        };
        
        return newStatus;
      });
      
      Toast.show({
        type: 'success',
        text1: 'Repas terminé',
        text2: `+${response?.data?.pointsAwarded || response?.pointsAwarded || 25} points!`
      });
      
      // Rafraîchir le statut depuis le serveur
      if (currentPlan?.id) {
        try {
          const apiResponse = await nutritionAPI.getCompletionStatus(currentPlan.id);
          const globalCompletionData = apiResponse?.data || apiResponse;
          
          const newCompletionStatus = {
            ...globalCompletionData,
            progress: globalCompletionData?.progress,
            allCompletions: globalCompletionData?.allCompletions,
            completionsByDay: globalCompletionData?.completionsByDay,
            dayProgress: globalCompletionData?.dayProgress,
            mealStatus: globalCompletionData?.mealStatus,
          };
          
          setCompletionStatus(newCompletionStatus);
          const newFreshData = JSON.parse(JSON.stringify(newCompletionStatus));
          setFreshCompletionData(newFreshData);
          
          logger.debug('Completion status refreshed after meal completion', {
            progress: globalCompletionData?.progress,
            completedMeals: globalCompletionData?.progress?.completedMeals,
          });
        } catch (error) {
          logger.warn('Could not refresh completion status from server', { error });
          if (onLoadDayData) {
            setTimeout(() => {
              onLoadDayData();
            }, 300);
          }
        }
      }
      
      logger.groupEnd();
    } catch (error: any) {
      logger.error('Error completing meal', error);
      
      const errorStatus = error?.status || error?.response?.status;
      const rawErrorMessage = error?.response?.data?.message || error?.data?.message || error?.message || 'Erreur inconnue';
      const errorMessage = translateErrorMessage(rawErrorMessage);
      const errorMessageLower = errorMessage.toLowerCase();
      
      if (errorStatus === 400 || errorMessageLower.includes('already completed') || errorMessageLower.includes('déjà complété')) {
        logger.info('Meal already completed - Refreshing data silently');
        if (currentPlan?.id && onLoadDayData) {
          onLoadDayData();
        }
        Toast.show({
          type: 'info',
          text1: isIOS ? 'Plat déjà complété' : 'Repas déjà complété',
          text2: isIOS ? 'Ce plat a déjà été marqué comme complété' : 'Ce repas a déjà été marqué comme complété',
          visibilityTime: 2000,
        });
        logger.groupEnd();
        return;
      }
      
      if (errorStatus === 403 || errorMessageLower.includes('access denied') || errorMessageLower.includes('subscription')) {
        Toast.show({
          type: 'error',
          text1: 'Accès refusé',
          text2: 'Un abonnement actif est requis pour compléter ce repas',
          visibilityTime: 4000,
        });
        logger.groupEnd();
        return;
      }
      
      if (errorStatus === 404 || errorMessageLower.includes('not found') || errorMessageLower.includes('introuvable')) {
        Toast.show({
          type: 'error',
          text1: 'Repas introuvable',
          text2: 'Le repas ou le plan nutritionnel n\'a pas été trouvé',
          visibilityTime: 3000,
        });
        logger.groupEnd();
        return;
      }
      
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: isIOS 
          ? `Impossible de marquer le plat comme complété: ${errorMessage}`
          : `Impossible de marquer le repas comme complété: ${errorMessage}`
      });
      
      logger.groupEnd();
    }
  }, [
    completionStatus,
    currentPlan,
    selectedDate,
    dayMeals,
    calculateNutritionPlanDay,
    onLoadDayData,
    isLoadingDayData,
    isIOS
  ]);

  return {
    completionStatus,
    setCompletionStatus,
    freshCompletionData,
    setFreshCompletionData,
    isMealCompleted,
    fetchCompletionStatus,
    pastIncompleteMeals,
    totalPastIncompleteMeals,
    getCompletionProgress,
    getCompletedMealsCount,
    getTotalMealsCount,
    handleMealComplete,
  };
};

