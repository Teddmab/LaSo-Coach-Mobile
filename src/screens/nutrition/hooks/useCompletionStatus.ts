import { useState, useMemo, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { CompletionStatus, Meal, NutritionPlan, SubscriptionData } from '../types';
import nutritionAPI from '../../../services/nutritionApi';
import Toast from 'react-native-toast-message';
import { createLogger } from '../../../utils/logger';
import { calculatePlanDayFromDate, findMenuForPlanDay } from '../utils/dateCalculations';
import { translateErrorMessage } from '../../../utils/errorTranslator';
import { useIOSSimulation } from '../../../hooks/useIOSSimulation';
import { useAuth } from '../../../context/FirebaseAuthContext';

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
  const { user: currentUser } = useAuth(); // ✅ Pour accéder à user.createdAt si profileData n'a pas createdAt
  
  const [completionStatus, setCompletionStatus] = useState<CompletionStatus | null>(null);
  const [freshCompletionData, setFreshCompletionData] = useState<any>(null);
  
  // ✅ Protection contre les appels multiples simultanés à fetchCompletionStatus
  const isFetchingCompletionStatusRef = useRef(false);
  const lastFetchedPlanIdRef = useRef<string | null>(null);

  // ✅ Helper function to check if a meal is completed for a SPECIFIC DATE
  // Utilisé pour pastMeals : vérifie que le repas est complété pour la date réelle, pas seulement le planDay
  // ✅ CORRECTION: Pour les plans cycliques, on DOIT avoir completionDate pour être sûr
  const isMealCompletedForDate = useCallback((
    mealId: string,
    completionData: CompletionStatus | null | any,
    targetDate: Date,
    planDay: number
  ): boolean => {
    if (!completionData) {
      return false;
    }

    // Normaliser la date cible
    const targetDateNormalized = new Date(targetDate);
    targetDateNormalized.setHours(0, 0, 0, 0);
    const targetDateISO = targetDateNormalized.toISOString().split('T')[0]; // Format YYYY-MM-DD

    // Vérifier dans completionsByDay pour ce planDay
    if (completionData?.completionsByDay) {
      const dayKeyString = String(planDay);
      const dayKeyNumber = planDay;
      
      const dayCompletions = completionData.completionsByDay[dayKeyString] || 
                            completionData.completionsByDay[dayKeyNumber];
      
      if (Array.isArray(dayCompletions)) {
        const found = dayCompletions.some(
          (completion: any) => {
            const mealMatches = completion?.mealId === mealId;
            const hasCompletedAt = !!completion?.completedAt;
            
            if (!mealMatches || !hasCompletedAt) {
              return false;
            }
            
            // ✅ CRITIQUE: Pour les past meals, on DOIT avoir completionDate pour être sûr
            // Sans completionDate, on ne peut pas confirmer que c'est complété pour cette date spécifique
            // (important pour les plans cycliques où le même planDay revient plusieurs fois)
            if (completion?.completionDate) {
              try {
                const completionDate = new Date(completion.completionDate);
                completionDate.setHours(0, 0, 0, 0);
                const completionDateISO = completionDate.toISOString().split('T')[0];
                
                // Le repas est complété pour cette date si completionDate correspond EXACTEMENT
                if (completionDateISO === targetDateISO) {
                  if (__DEV__) {
                    console.log(`✅ [isMealCompletedForDate] Repas ${mealId} complété pour date ${targetDateISO} (planDay ${planDay})`);
                  }
                  return true;
                } else {
                  if (__DEV__) {
                    console.log(`⚠️ [isMealCompletedForDate] Repas ${mealId} complété mais date différente: ${completionDateISO} !== ${targetDateISO} (planDay ${planDay})`);
                  }
                  return false;
                }
              } catch (error) {
                if (__DEV__) {
                  console.warn(`⚠️ [isMealCompletedForDate] Erreur parsing completionDate:`, completion.completionDate, error);
                }
                return false;
              }
            }
            
            // ✅ CORRECTION: Si pas de completionDate, utiliser une logique intelligente
            // Pour un plan cyclique, on doit vérifier si c'est la première occurrence de ce planDay
            // Calculer planStartDate de la même manière que dans pastIncompleteMeals
            let calculatedPlanStartDate: Date | null = null;
            
            if (isIOS) {
              // iOS: Utiliser la date de création du compte (chercher dans plusieurs sources)
              const createdAt = 
                profileData?.createdAt || 
                profileData?.Profile?.createdAt || 
                profileData?.user?.createdAt ||
                currentUser?.createdAt;
              
              if (createdAt) {
                calculatedPlanStartDate = new Date(createdAt);
                calculatedPlanStartDate.setHours(0, 0, 0, 0);
              }
            } else {
              // Android: Utiliser la date de souscription
              if (subscriptionData?.subscription?.startDate) {
                calculatedPlanStartDate = new Date(subscriptionData.subscription.startDate);
                calculatedPlanStartDate.setHours(0, 0, 0, 0);
              }
            }
            
            if (!calculatedPlanStartDate) {
              // Si on ne peut pas calculer planStartDate, on ne peut pas confirmer
              if (__DEV__) {
                console.warn(`⚠️ [isMealCompletedForDate] Repas ${mealId} trouvé mais impossible de calculer planStartDate - Ne peut pas confirmer pour date ${targetDateISO}`);
              }
              return false;
            }
            
            const planNumDays = currentPlan?.numDays || 7;
            const isCyclicPlan = planNumDays > 0 && planNumDays < 100; // Plans cycliques typiquement < 100 jours
            
            if (!isCyclicPlan) {
              // Plan non cyclique : si le repas est dans completionsByDay[planDay], c'est complété
              if (__DEV__) {
                console.log(`✅ [isMealCompletedForDate] Repas ${mealId} complété (plan non cyclique, planDay ${planDay})`);
              }
              return true;
            } else {
              // Plan cyclique : sans completionDate, on doit vérifier si c'est la première occurrence
              try {
                // Calculer le nombre de jours depuis le début du plan jusqu'à la date cible
                const daysSinceStart = Math.floor((targetDateNormalized.getTime() - calculatedPlanStartDate.getTime()) / (1000 * 60 * 60 * 24));
                
                // Si la date cible est avant le début du plan, ce n'est pas complété
                if (daysSinceStart < 0) {
                  return false;
                }
                
                // Calculer quel cycle on est (0 = premier cycle, 1 = deuxième cycle, etc.)
                const cycleNumber = Math.floor(daysSinceStart / planNumDays);
                
                // Si on est dans le premier cycle (cycleNumber === 0), alors c'est la première occurrence
                // Dans ce cas, si le repas est dans completionsByDay[planDay], c'est complété pour cette date
                if (cycleNumber === 0) {
                  if (__DEV__) {
                    console.log(`✅ [isMealCompletedForDate] Repas ${mealId} complété (premier cycle, planDay ${planDay}, date ${targetDateISO})`);
                  }
                  return true;
                }
                
                // Pour les cycles suivants, sans completionDate, on ne peut pas être sûr
                // On retourne false pour être sûr (mieux vaut afficher un repas non complété que l'inverse)
                if (__DEV__) {
                  console.warn(`⚠️ [isMealCompletedForDate] Repas ${mealId} trouvé dans completionsByDay[${planDay}] mais SANS completionDate - Cycle ${cycleNumber + 1} (${planNumDays} jours) - Ne peut pas confirmer pour date ${targetDateISO}`);
                }
                return false;
              } catch (error) {
                if (__DEV__) {
                  console.warn(`⚠️ [isMealCompletedForDate] Erreur calcul cycle:`, error);
                }
                return false;
              }
            }
          }
        );
        if (found) {
          return true;
        }
      }
    }
    
    return false;
  }, [currentPlan, profileData, subscriptionData, isIOS, currentUser]);

  // Helper function to check if a meal is completed
  // ✅ CORRECTION: Ajouter targetDate optionnel pour vérifier la date spécifique
  const isMealCompleted = useCallback((
    mealId: string, 
    completionData: CompletionStatus | null | any, 
    planDayToCheck?: number,
    targetDate?: Date // ✅ NOUVEAU: Date optionnelle pour vérifier la date spécifique
  ): boolean => {
    if (!completionData) {
      return false;
    }

    // ✅ IMPORTANT: Si planDayToCheck est fourni, vérifier UNIQUEMENT ce jour spécifique dans completionsByDay
    // Ne pas vérifier dans allCompletions ou mealStatus car ils contiennent des complétions pour TOUS les jours
    // On veut savoir si le repas est complété pour CE planDay spécifique uniquement
    if (planDayToCheck !== undefined) {
      if (completionData?.completionsByDay) {
        // ✅ Vérifier avec les deux formats de clé (string et number) pour être sûr
        const dayKeyString = String(planDayToCheck);
        const dayKeyNumber = planDayToCheck;
        
        // Essayer d'abord avec la clé string, puis avec la clé number
        const dayCompletions = completionData.completionsByDay[dayKeyString] || 
                              completionData.completionsByDay[dayKeyNumber];
        
        if (Array.isArray(dayCompletions)) {
          const found = dayCompletions.some(
            (completion: any) => {
              // ✅ SIMPLIFICATION: Vérifier simplement si le repas est complété, peu importe la date
              const mealMatches = completion?.mealId === mealId;
              const hasCompletedAt = !!completion?.completedAt;
              
              // Si le repas correspond et a un completedAt, il est complété (peu importe la date)
              return mealMatches && hasCompletedAt;
            }
          );
          if (found) {
            return true;
          }
        }
      }
      
      // ✅ Ne pas vérifier dans les autres sources car elles ne sont pas spécifiques au planDay
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
    // ✅ Protection contre les appels multiples simultanés
    if (isFetchingCompletionStatusRef.current) {
      if (__DEV__) {
        logger.debug('⏸️ [FETCH COMPLETION STATUS] Déjà en cours, ignoré', { planId });
      }
      return;
    }
    
    // ✅ Éviter les appels redondants pour le même planId
    if (lastFetchedPlanIdRef.current === planId && completionStatus?.planId === planId) {
      if (__DEV__) {
        logger.debug('⏸️ [FETCH COMPLETION STATUS] Déjà chargé pour ce planId, ignoré', { planId });
      }
      return;
    }
    
    isFetchingCompletionStatusRef.current = true;
    lastFetchedPlanIdRef.current = planId;
    
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
      const rawErrorMessage = error?.response?.data?.message || error?.data?.message || error?.message || '';
      const errorMessageLower = rawErrorMessage.toLowerCase();
      
      // ✅ iOS COMPANION MODE: Sur iOS, si c'est une erreur 403, ne pas initialiser avec des valeurs par défaut vides
      // Cela permet de conserver les données existantes et de détecter les repas complétés
      if (isIOS && (errorStatus === 403 || errorMessageLower.includes('access denied') || errorMessageLower.includes('subscription'))) {
        logger.info('⚠️ [iOS Companion Mode] Erreur 403 lors du fetch - Conservation des données existantes');
        // Ne pas initialiser avec des valeurs par défaut vides, conserver les données existantes
        // Si pas de données existantes, initialiser avec une structure minimale mais non vide
        if (!completionStatus || !completionStatus.completionsByDay) {
          const totalMeals = currentPlan?.menus?.reduce((sum: number, menu: any) => {
            return sum + (menu.meals?.length || 0);
          }, 0) || 0;
          
          const minimalCompletionData = {
            planId: planId,
            progress: {
              percentage: 0,
              completedMeals: 0,
              totalMeals: totalMeals,
              remainingMeals: totalMeals,
            },
            completionsByDay: {}, // Structure vide mais présente pour éviter les erreurs
            allCompletions: [],
            dayProgress: {
              completedMealIds: [],
            },
            mealStatus: {},
          };
          
          setCompletionStatus(minimalCompletionData);
          setFreshCompletionData(JSON.parse(JSON.stringify(minimalCompletionData)));
        }
        // Si on a déjà des données, on les conserve (ne pas les écraser)
        logger.groupEnd();
        return;
      }
      
      // Pour les autres erreurs ou sur Android, initialiser avec des valeurs par défaut
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
    } finally {
      // ✅ Réinitialiser le flag après le fetch (succès ou erreur)
      isFetchingCompletionStatusRef.current = false;
    }
  }, [currentPlan, completionStatus]);

  // ✅ NOUVELLE LOGIQUE SIMPLIFIÉE: Calculer les past meals depuis le début
  // Règles:
  // - iOS: Plan commence le jour de création du compte (profileData.createdAt), toujours Day 1
  // - Android: Plan commence le jour de souscription (subscriptionData.subscription.startDate)
  // - Pour chaque jour passé, vérifier CHAQUE repas individuellement
  // - Ne compter QUE les repas NON complétés pour cette date spécifique
  const pastIncompleteMeals = useMemo((): Array<{ meal: Meal; date: Date; planDay: number }> => {
    const completionDataToUse = freshCompletionData || completionStatus;
    
    // Vérifications de base
    if (!currentPlan || !completionDataToUse) {
      return [];
    }
    
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    
    // ✅ ÉTAPE 1: Déterminer la date de début du plan selon la plateforme
    let planStartDate: Date | null = null;
    
    if (isIOS) {
      // iOS: Utiliser UNIQUEMENT la date de création du compte
      // Chercher createdAt dans plusieurs sources possibles
      const createdAt = 
        profileData?.createdAt || 
        profileData?.Profile?.createdAt || 
        profileData?.user?.createdAt ||
        currentUser?.createdAt;
      
      if (!createdAt) {
        if (__DEV__) {
          console.warn('⚠️ [PAST MEALS] iOS: createdAt non disponible dans:', {
            hasProfileData: !!profileData,
            hasProfileDataCreatedAt: !!profileData?.createdAt,
            hasProfileProfileCreatedAt: !!profileData?.Profile?.createdAt,
            hasProfileUserCreatedAt: !!profileData?.user?.createdAt,
            hasCurrentUser: !!currentUser,
            hasCurrentUserCreatedAt: !!currentUser?.createdAt,
            profileDataKeys: profileData ? Object.keys(profileData) : [],
          });
        }
        return [];
      }
      
      planStartDate = new Date(createdAt);
      planStartDate.setHours(0, 0, 0, 0);
      
      if (__DEV__) {
        console.log('✅ [PAST MEALS] iOS: Date de création trouvée:', {
          createdAt,
          planStartDate: planStartDate.toISOString().split('T')[0],
          source: profileData?.createdAt ? 'profileData.createdAt' :
                 profileData?.Profile?.createdAt ? 'profileData.Profile.createdAt' :
                 profileData?.user?.createdAt ? 'profileData.user.createdAt' :
                 'currentUser.createdAt',
        });
      }
    } else {
      // Android: Utiliser UNIQUEMENT la date de souscription
      if (!subscriptionData?.subscription?.startDate) {
        if (__DEV__) {
          console.warn('⚠️ [PAST MEALS] Android: subscription.startDate non disponible');
        }
        return [];
      }
      planStartDate = new Date(subscriptionData.subscription.startDate);
      planStartDate.setHours(0, 0, 0, 0);
    }
    
    if (!planStartDate) {
      return [];
    }
    
    // ✅ ÉTAPE 2: Vérifier que le plan a commencé dans le passé
    if (planStartDate >= todayDate) {
      return []; // Plan commence aujourd'hui ou dans le futur
    }
    
    // ✅ ÉTAPE 3: Calculer la date de fin (hier) et limiter à 30 jours
    const yesterday = new Date(todayDate);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const maxDaysBack = 30;
    const maxStartDate = new Date(todayDate);
    maxStartDate.setDate(maxStartDate.getDate() - maxDaysBack);
    maxStartDate.setHours(0, 0, 0, 0);
    
    // Utiliser la date la plus récente (on ne peut pas analyser avant que le plan existe)
    const startDate = planStartDate > maxStartDate ? planStartDate : maxStartDate;
    
    if (startDate > yesterday) {
      return []; // Pas de dates passées à analyser
    }
    
    // ✅ ÉTAPE 4: Parcourir chaque jour passé et vérifier chaque repas individuellement
    const pastMeals: Array<{ meal: Meal; date: Date; planDay: number }> = [];
    
    for (let date = new Date(startDate); date <= yesterday; date.setDate(date.getDate() + 1)) {
      const dateCopy = new Date(date);
      dateCopy.setHours(0, 0, 0, 0);
      
      // Ignorer les dates futures
      if (dateCopy >= todayDate) {
        continue;
      }
      
      // Calculer le planDay pour cette date (Day 1, 2, 3, etc. selon le cycle)
      const planDay = calculatePlanDayFromDate(
        dateCopy,
        planStartDate,
        currentPlan.numDays || 7
      );
      
      if (__DEV__) {
        const daysSinceStart = Math.floor((dateCopy.getTime() - planStartDate.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`📅 [PAST MEALS] Analyse date ${dateCopy.toISOString().split('T')[0]}: planDay=${planDay}, jours depuis début=${daysSinceStart}`);
      }
      
      // Récupérer le menu pour ce planDay
      const dayMenu = findMenuForPlanDay(currentPlan.menus, planDay);
      if (!dayMenu || !dayMenu.meals || dayMenu.meals.length === 0) {
        if (__DEV__) {
          console.warn(`⚠️ [PAST MEALS] Pas de menu trouvé pour planDay ${planDay} (date ${dateCopy.toISOString().split('T')[0]})`);
        }
        continue;
      }
      
      // ✅ ÉTAPE 5: Vérifier CHAQUE repas individuellement pour cette date
      let completedCount = 0;
      let incompleteCount = 0;
      
      dayMenu.meals.forEach((meal: Meal) => {
        const isCompleted = isMealCompletedForDate(
          meal.id,
          completionDataToUse,
          dateCopy,
          planDay
        );
        
        if (isCompleted) {
          completedCount++;
        } else {
          incompleteCount++;
          // Seulement ajouter les repas NON complétés
          pastMeals.push({
            meal,
            date: new Date(dateCopy),
            planDay,
          });
        }
      });
      
      if (__DEV__ && (completedCount > 0 || incompleteCount > 0)) {
        console.log(`📊 [PAST MEALS] ${dateCopy.toISOString().split('T')[0]} (planDay ${planDay}): ${incompleteCount} non complétés, ${completedCount} complétés, sur ${dayMenu.meals.length} total`);
      }
    }
    
    // Trier par date décroissante (plus récent en premier)
    pastMeals.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    if (__DEV__) {
      const datesAnalyzed = Math.floor((yesterday.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const mealsByDate = pastMeals.reduce((acc, pm) => {
        const dateKey = pm.date.toISOString().split('T')[0];
        acc[dateKey] = (acc[dateKey] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Analyser les complétions pour comprendre le décalage
      const allCompletions = completionDataToUse?.completionsByDay || {};
      const completionsByDate: Record<string, any[]> = {};
      Object.keys(allCompletions).forEach(dayKey => {
        const dayCompletions = allCompletions[dayKey];
        if (Array.isArray(dayCompletions)) {
          dayCompletions.forEach((comp: any) => {
            if (comp.completionDate) {
              const compDate = new Date(comp.completionDate).toISOString().split('T')[0];
              if (!completionsByDate[compDate]) {
                completionsByDate[compDate] = [];
              }
              completionsByDate[compDate].push({
                mealId: comp.mealId,
                planDay: comp.planDay || dayKey,
                completionDate: compDate,
              });
            }
          });
        }
      });
      
      console.log(`✅ [PAST MEALS] Résultat: ${pastMeals.length} repas non complétés`, {
        platform: isIOS ? 'iOS' : 'Android',
        planStartDate: planStartDate.toISOString().split('T')[0],
        startDate: startDate.toISOString().split('T')[0],
        yesterday: yesterday.toISOString().split('T')[0],
        datesAnalyzed,
        mealsByDate,
        completionsByDate, // ✅ NOUVEAU: Afficher toutes les complétions par date
      });
    }
    
    return pastMeals;
  }, [
    currentPlan,
    freshCompletionData,
    completionStatus,
    subscriptionData,
    profileData,
    isMealCompletedForDate,
    isIOS
  ]);

  const totalPastIncompleteMeals = useMemo(() => {
    // ✅ Utiliser directement la longueur de pastIncompleteMeals car il est déjà correctement filtré
    // avec isMealCompletedForDate pour exclure tous les repas complétés par date réelle
    const count = pastIncompleteMeals.length;
    
    if (__DEV__) {
      console.log(`🔢 [totalPastIncompleteMeals] Total calculé: ${count} repas non complétés`, {
        pastIncompleteMealsLength: pastIncompleteMeals.length,
        pastMealsDetails: pastIncompleteMeals.map(pm => ({
          mealName: pm.meal.name,
          mealId: pm.meal.id,
          date: pm.date.toISOString().split('T')[0],
          planDay: pm.planDay,
        })),
      });
    }
    
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
  // ✅ CORRECTION: Ajouter completionDateOverride pour les past meals
  const handleMealComplete = useCallback(async (
    mealId: string, 
    planDayOverride?: number,
    completionDateOverride?: Date  // ✅ NOUVEAU: Date de complétion pour les past meals
  ) => {
    logger.group('✅ MEAL COMPLETE ACTION');
    logger.info('User Action: Meal complete button pressed', { 
      mealId, 
      planDayOverride,
      completionDateOverride: completionDateOverride?.toISOString().split('T')[0]
    });
    
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
    
    // ✅ CORRECTION: Vérifier si déjà complété en utilisant la date de complétion si fournie
    let isAlreadyCompleted = false;
    if (completionDateOverride && planDayOverride !== undefined) {
      // Pour les past meals, vérifier si complété pour cette date spécifique
      isAlreadyCompleted = isMealCompletedForDate(
        mealId,
        freshCompletionStatus,
        completionDateOverride,
        planDayOverride
      );
    } else {
      // Pour les repas du jour, vérifier avec la logique normale
      const isCompletedByIds = freshCompletionStatus?.dayProgress?.completedMealIds?.includes(mealId) === true;
      const isCompletedByStatus = freshCompletionStatus?.mealStatus?.[mealId]?.completed === true;
      isAlreadyCompleted = isCompletedByIds || isCompletedByStatus;
    }
    
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

      // ✅ CORRECTION: Utiliser completionDateOverride si fourni (pour past meals), sinon utiliser selectedDate
      let completionDate: Date;
      let planDay: number;
      
      if (completionDateOverride && planDayOverride !== undefined) {
        // Cas des past meals : utiliser la date du past meal
        completionDate = new Date(completionDateOverride);
        completionDate.setHours(0, 0, 0, 0);
        planDay = planDayOverride;
        logger.debug('Using past meal date for completion', {
          completionDate: completionDate.toISOString().split('T')[0],
          planDay
        });
      } else {
        // Cas normal : utiliser selectedDate
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDateObj = selectedDate instanceof Date ? selectedDate : today;
        selectedDateObj.setHours(0, 0, 0, 0);
        completionDate = new Date(selectedDateObj);
        completionDate.setHours(0, 0, 0, 0);
        planDay = planDayOverride !== undefined ? planDayOverride : calculateNutritionPlanDay(selectedDateObj);
        logger.debug('Using selected date for completion', {
          completionDate: completionDate.toISOString().split('T')[0],
          planDay
        });
      }
      
      // ✅ CORRECTION: Utiliser la date locale, pas UTC, pour éviter le décalage de -1 jour
      const year = completionDate.getFullYear();
      const month = String(completionDate.getMonth() + 1).padStart(2, '0');
      const day = String(completionDate.getDate()).padStart(2, '0');
      const completionDateISO = `${year}-${month}-${day}T00:00:00.000Z`;

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
      
      // ✅ Récupérer les points depuis la réponse API ou depuis le meal
      const pointsFromResponse = response?.data?.pointsAwarded || response?.pointsAwarded || response?.data?.pointsEarned || response?.pointsEarned;
      const completedMeal = dayMeals.find((m: Meal) => m.id === mealId);
      const mealPoints = completedMeal?.points || completedMeal?.pointValue || 0;
      const pointsEarned = pointsFromResponse || mealPoints || 0;

      logger.debug('API Response: Meal marked as complete successfully', {
        response: response?.data || response,
        pointsAwarded: pointsEarned,
        pointsFromResponse,
        mealPoints,
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
        
        // ✅ CORRECTION: Ajouter aussi dans completionsByDay pour que isMealCompleted fonctionne correctement
        if (!newStatus.completionsByDay) {
          newStatus.completionsByDay = {};
        }
        const dayKey = String(planDay);
        if (!newStatus.completionsByDay[dayKey]) {
          newStatus.completionsByDay[dayKey] = [];
        }
        
        // Vérifier si le repas n'est pas déjà dans la liste
        const dayCompletions = newStatus.completionsByDay[dayKey];
        const alreadyInCompletions = Array.isArray(dayCompletions) && dayCompletions.some(
          (c: any) => c.mealId === mealId && c.completionDate === completionDateISO
        );
        
        if (!alreadyInCompletions) {
          newStatus.completionsByDay[dayKey] = [
            ...dayCompletions,
            {
              mealId: mealId,
              completionDate: completionDateISO,
              completedAt: new Date().toISOString(),
              planDay: planDay,
            }
          ];
        }
        
        return newStatus;
      });
      
      // ✅ CORRECTION: Mettre à jour aussi freshCompletionData avec la même logique
      setFreshCompletionData(prevData => {
        const newData = prevData ? { ...prevData } : {};
        
        // Copier la même structure que completionStatus
        if (!newData.completionsByDay) {
          newData.completionsByDay = {};
        }
        const dayKey = String(planDay);
        if (!newData.completionsByDay[dayKey]) {
          newData.completionsByDay[dayKey] = [];
        }
        
        const dayCompletions = newData.completionsByDay[dayKey];
        const alreadyInCompletions = Array.isArray(dayCompletions) && dayCompletions.some(
          (c: any) => c.mealId === mealId && c.completionDate === completionDateISO
        );
        
        if (!alreadyInCompletions) {
          newData.completionsByDay[dayKey] = [
            ...dayCompletions,
            {
              mealId: mealId,
              completionDate: completionDateISO,
              completedAt: new Date().toISOString(),
              planDay: planDay,
            }
          ];
        }
        
        return newData;
      });
      
      Toast.show({
        type: 'success',
        text1: 'Repas terminé',
        text2: pointsEarned > 0 ? `+${pointsEarned} points!` : 'Repas terminé !'
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
          
          // ✅ CORRECTION: Rafraîchir aussi les données du jour pour mettre à jour l'affichage
          if (onLoadDayData) {
            setTimeout(() => {
              onLoadDayData();
            }, 200);
          }
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
      
      // ✅ iOS COMPANION MODE: Ignorer l'erreur 403 sur iOS car c'est en mode compagnon
      // Sur iOS, pas besoin d'abonnement pour compléter un repas
      // ✅ IMPORTANT: Ne JAMAIS afficher de notifications d'abonnement sur iOS
      if (isIOS && (errorStatus === 403 || errorMessageLower.includes('access denied') || errorMessageLower.includes('subscription'))) {
        logger.info('⚠️ [iOS Companion Mode] Erreur 403 ignorée - Mode compagnon activé');
        // Ne pas afficher d'erreur à l'utilisateur sur iOS, juste logger
        logger.groupEnd();
        return;
      }
      
      // ✅ Sur Android uniquement, afficher l'erreur d'accès refusé
      if (!isIOS && (errorStatus === 403 || errorMessageLower.includes('access denied') || errorMessageLower.includes('subscription'))) {
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
    isIOS,
    isMealCompletedForDate  // ✅ Ajouter isMealCompletedForDate aux dépendances
  ]);

  return {
    completionStatus,
    setCompletionStatus,
    freshCompletionData,
    setFreshCompletionData,
    isMealCompleted,
    isMealCompletedForDate, // ✅ Exporter pour utilisation dans PastMealsBottomSheet
    fetchCompletionStatus,
    pastIncompleteMeals,
    totalPastIncompleteMeals,
    getCompletionProgress,
    getCompletedMealsCount,
    getTotalMealsCount,
    handleMealComplete,
  };
};

