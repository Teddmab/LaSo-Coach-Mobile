import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Platform,
  Animated,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import YoutubePlayer from 'react-native-youtube-iframe';
import { theme } from '../../constants/theme';
import nutritionAPI from '../../services/nutritionApi';
import { Shimmer } from '../Shimmer';
import { useIOSSimulation } from '../../hooks/useIOSSimulation';
import { useAuth } from '../../context/FirebaseAuthContext';
import ImagePersistent from '../ImagePersistent';
import { mealTypeMap } from '../../screens/nutrition/utils/nutritionUtils';
import { calculatePlanDayFromDate, findMenuForPlanDay, getPlanProgress } from '../../screens/nutrition/utils/dateCalculations';
import { Meal, NutritionPlan, CompletionStatus } from '../../screens/nutrition/types';
// ✅ MealDetailModal retiré - On complète directement sans modal
import Toast from 'react-native-toast-message';
import { nutritionSync } from '../../utils/nutritionSync';

// Haptics is optional
let Haptics: any = null;
try {
  Haptics = require('expo-haptics');
} catch (e) {
  // Haptics not available
}

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
  // ✅ Callback pour compléter un repas (utilise les hooks de NutritionScreen)
  onMealComplete?: (mealId: string, planDayOverride?: number) => Promise<void>;
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
  onMealComplete: propsOnMealComplete,
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
  // ✅ showMealDetailModal et completingMealInModal retirés - On complète directement
  const [showVideoInCard, setShowVideoInCard] = useState(false);
  const [youtubePlaying, setYoutubePlaying] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const buttonPulseAnim = useRef(new Animated.Value(1)).current;
  
  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string | null | undefined): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

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
  
  // ✅ Écouter les changements depuis NutritionScreen pour synchronisation en temps réel
  useEffect(() => {
    const unsubscribeMealCompleted = nutritionSync.subscribe('meal-completed', async (data: any) => {
      // Rafraîchir les données quand un repas est complété dans NutritionScreen
      const planToUse = propsCurrentPlan || currentPlan;
      if (planToUse?.id) {
        try {
          const apiResponse = await nutritionAPI.getCompletionStatus(planToUse.id);
          const globalCompletionData = apiResponse?.data || apiResponse;
          setFreshCompletionData(globalCompletionData);
          setCompletionStatus(globalCompletionData);
        } catch (error) {
          console.warn('⚠️ [NutritionCard] Erreur rafraîchissement statut après complétion NutritionScreen:', error);
        }
      }
    });
    
    const unsubscribeStatusUpdated = nutritionSync.subscribe('completion-status-updated', async () => {
      // Rafraîchir le statut de complétion
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
    });
    
    return () => {
      unsubscribeMealCompleted();
      unsubscribeStatusUpdated();
    };
  }, [propsCurrentPlan, currentPlan]);

  // ✅ Même logique que NutritionScreen pour vérifier si un repas est complété
  // ✅ CORRECTION: Ajouter targetDate optionnel pour vérifier la date spécifique
  const isMealCompleted = useCallback((mealId: string, completionData: any, planDayToCheck?: number, targetDate?: Date): boolean => {
    if (!completionData) {
      return false;
    }

    if (planDayToCheck !== undefined) {
      if (completionData?.completionsByDay) {
        const dayKey = String(planDayToCheck);
        const dayCompletions = completionData.completionsByDay[dayKey] || completionData.completionsByDay[planDayToCheck];
        if (Array.isArray(dayCompletions)) {
          const found = dayCompletions.some(
            (completion: any) => {
              // Vérifier que le mealId correspond ET qu'il y a un completedAt
              const mealMatches = completion?.mealId === mealId && completion?.completedAt;
              if (!mealMatches) {
                return false;
              }
              
              // ✅ CORRECTION: Si targetDate est fourni, on DOIT TOUJOURS vérifier la date exacte
              // Même pour aujourd'hui, car il peut y avoir plusieurs complétions pour le même planDay
              if (targetDate) {
                // Si completionDate n'existe pas, on peut accepter seulement si c'est aujourd'hui (complétion récente)
                if (!completion?.completionDate) {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const targetDateNormalized = new Date(targetDate);
                  targetDateNormalized.setHours(0, 0, 0, 0);
                  const isToday = targetDateNormalized.getTime() === today.getTime();
                  if (isToday) {
                    if (__DEV__) {
                      console.log(`✅ [NutritionCard] Repas ${mealId} trouvé dans completionsByDay[${dayKey}] sans completionDate mais c'est aujourd'hui - Accepté`);
                    }
                    return true;
                  }
                  if (__DEV__) {
                    console.log(`⚠️ [NutritionCard] Repas ${mealId} trouvé dans completionsByDay[${dayKey}] mais SANS completionDate et ce n'est PAS aujourd'hui - Ne peut pas confirmer`);
                  }
                  return false;
                }
                
                try {
                  const completionDate = new Date(completion.completionDate);
                  completionDate.setHours(0, 0, 0, 0);
                  const targetDateNormalized = new Date(targetDate);
                  targetDateNormalized.setHours(0, 0, 0, 0);
                  
                  const completionDateISO = completionDate.toISOString().split('T')[0];
                  const targetDateISO = targetDateNormalized.toISOString().split('T')[0];
                  
                  // Le repas est complété seulement si completionDate correspond EXACTEMENT à targetDate
                  if (completionDateISO !== targetDateISO) {
                    if (__DEV__) {
                      console.log(`⚠️ [NutritionCard] Repas ${mealId} complété mais date différente: ${completionDateISO} !== ${targetDateISO} (planDay ${planDayToCheck})`);
                    }
                    return false;
                  }
                  
                  // Date correspond exactement
                  if (__DEV__) {
                    console.log(`✅ [NutritionCard] Repas ${mealId} complété pour la date exacte: ${completionDateISO} === ${targetDateISO} (planDay ${planDayToCheck})`);
                  }
                } catch (error) {
                  if (__DEV__) {
                    console.warn(`⚠️ [NutritionCard] Erreur parsing completionDate:`, completion.completionDate, error);
                  }
                  return false;
                }
              }
              
              // Si pas de targetDate, on accepte directement (comportement par défaut)
              return true;
              
              return true;
            }
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

    // ✅ CORRECTION: Utiliser les props en priorité si disponibles (données les plus récentes depuis DashboardScreen)
    // Sinon utiliser les données locales
    const completionDataToUse = propsCompletionData || freshCompletionData || completionStatus;
    
    if (!completionDataToUse || currentPlanDay === undefined) {
      return sortedMeals[0] || null;
    }
    
    // Sinon, chercher le premier non complété
    // ✅ CORRECTION: Vérifier la date exacte (aujourd'hui) pour éviter que les repas soient marqués comme complétés
    // lors du retour à une date précédente dans le cycle
    for (const meal of sortedMeals) {
      const isCompleted = isMealCompleted(meal.id, completionDataToUse, currentPlanDay, today);
      if (!isCompleted) {
        return meal;
      }
    }

    return null; // Tous complétés
  }, [dayMeals, currentPlanDay, propsCompletionData, freshCompletionData, completionStatus, isMealCompleted, today]);

  // ✅ Calculer youtubeVideoId et hasVideo AVANT le return null pour éviter l'erreur "rendered more hooks"
  // Toujours calculer même si nextMealToComplete est null pour maintenir l'ordre des hooks
  const youtubeVideoId = nextMealToComplete?.youtubeUrl ? getYouTubeVideoId(nextMealToComplete.youtubeUrl) : null;
  const hasVideo = !!youtubeVideoId;

  // ✅ Animations pour la carte de félicitations - DÉPLACÉ ICI pour respecter les règles des hooks
  // Ces hooks doivent être déclarés AVANT tous les retours conditionnels
  const celebrationScale = useRef(new Animated.Value(0.8)).current;
  const celebrationOpacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(1)).current;

  // ✅ Détecter quand tous les repas sont complétés pour déclencher l'animation
  const allMealsCompleted = !nextMealToComplete && dayMeals.length > 0;
  
  useEffect(() => {
    if (allMealsCompleted) {
      // Animation d'entrée avec rebond (sans rotation)
      Animated.parallel([
        Animated.spring(celebrationScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(celebrationOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.spring(iconScale, {
            toValue: 1.2,
            tension: 100,
            friction: 3,
            useNativeDriver: true,
          }),
          Animated.spring(iconScale, {
            toValue: 1,
            tension: 100,
            friction: 3,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [allMealsCompleted, celebrationScale, celebrationOpacity, iconScale]);

  // Animation du bouton clignotant - TOUJOURS appelé (même si hasVideo est false)
  useEffect(() => {
    if (hasVideo && !showVideoInCard) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(buttonPulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(buttonPulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [hasVideo, showVideoInCard, buttonPulseAnim]);

  // Animation fluide lors du remplacement de l'image par la vidéo - TOUJOURS appelé
  useEffect(() => {
    if (showVideoInCard) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
      // ✅ Forcer le démarrage de la vidéo avec un petit délai pour laisser le composant se charger
      setTimeout(() => {
        setYoutubePlaying(true);
        if (__DEV__) {
          console.log('🎬 [NutritionCard] Video should start playing now');
        }
      }, 300);
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(1);
      setYoutubePlaying(false);
    }
  }, [showVideoInCard, fadeAnim, scaleAnim]);

  const handleVideoButtonPress = () => {
    if (__DEV__) {
      console.log('🎬 [NutritionCard] Video button pressed, launching video immediately');
    }
    // ✅ D'abord afficher la vidéo, puis la lancer
    setShowVideoInCard(true);
    // Le useEffect ci-dessus va automatiquement mettre youtubePlaying à true
  };

  // ✅ isTimePassed retiré - On n'affiche plus l'urgence, juste l'heure

  // ✅ Compléter un repas - Utiliser le callback de DashboardScreen si disponible (même logique que NutritionScreen)
  const handleMealComplete = useCallback(async (mealId: string) => {
    // ✅ Vibration progressive avec dégradation
    if (Haptics) {
      // Vibration initiale forte
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Puis vibrations progressives avec dégradation
      for (let i = 1; i < 5; i++) {
        setTimeout(() => {
          // Dégradation progressive : Medium -> Light -> Light
          const intensity = i < 2 
            ? Haptics.ImpactFeedbackStyle.Medium 
            : Haptics.ImpactFeedbackStyle.Light;
          Haptics.impactAsync(intensity);
        }, i * 60); // Délai progressif
      }
    } else if (Platform.OS === 'android') {
      // Fallback pour Android - vibration progressive
      const { Vibration } = require('react-native');
      Vibration.vibrate(120); // Vibration initiale plus longue
      
      // Vibrations progressives avec dégradation
      for (let i = 1; i < 5; i++) {
        setTimeout(() => {
          const duration = i < 2 ? 80 - (i * 5) : 60 - (i * 3); // Dégradation progressive
          Vibration.vibrate(Math.max(30, duration)); // Minimum 30ms
        }, i * 60);
      }
    }
    
    // ✅ Démarrer l'animation de loader
    setIsCompleting(true);
    
    try {
      // Si un callback est fourni (depuis DashboardScreen), l'utiliser pour garantir la cohérence
      if (propsOnMealComplete) {
        try {
          const planDayToUse = propsCurrentPlanDay !== undefined ? propsCurrentPlanDay : currentPlanDay;
          
          // ✅ Mise à jour optimiste : marquer le repas comme complété immédiatement dans les données locales
          const completionDataToUse = freshCompletionData || completionStatus;
          if (completionDataToUse && planDayToUse !== undefined) {
            const optimisticUpdate = JSON.parse(JSON.stringify(completionDataToUse));
            
            // Ajouter le repas complété dans completionsByDay pour aujourd'hui
            if (!optimisticUpdate.completionsByDay) {
              optimisticUpdate.completionsByDay = {};
            }
            const dayKey = String(planDayToUse);
            if (!optimisticUpdate.completionsByDay[dayKey]) {
              optimisticUpdate.completionsByDay[dayKey] = [];
            }
            
            // Vérifier si le repas n'est pas déjà dans la liste
            const dayCompletions = optimisticUpdate.completionsByDay[dayKey];
            const alreadyCompleted = Array.isArray(dayCompletions) && dayCompletions.some(
              (c: any) => c.mealId === mealId
            );
            
            if (!alreadyCompleted) {
              const todayISO = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z';
              dayCompletions.push({
                mealId: mealId,
                completionDate: todayISO,
                completedAt: new Date().toISOString(),
                planDay: planDayToUse,
              });
              
              // Mettre à jour les données locales immédiatement pour un feedback visuel instantané
              setFreshCompletionData(optimisticUpdate);
              setCompletionStatus(optimisticUpdate);
            }
          }
          
          await propsOnMealComplete(mealId, planDayToUse);
          
          // ✅ Rafraîchir les données depuis le serveur après la complétion pour être sûr
          const planToUse = propsCurrentPlan || currentPlan;
          if (planToUse?.id) {
            try {
              const apiResponse = await nutritionAPI.getCompletionStatus(planToUse.id);
              const globalCompletionData = apiResponse?.data || apiResponse;
              setFreshCompletionData(globalCompletionData);
              setCompletionStatus(globalCompletionData);
            } catch (refreshError) {
              console.warn('⚠️ [NutritionCard] Erreur rafraîchissement statut après complétion:', refreshError);
            }
          }
          
          Toast.show({
            type: 'success',
            text1: 'Repas complété ! ✅',
            text2: 'Vous avez gagné 25 points. Passage au repas suivant...',
            visibilityTime: 2500,
          });
        } catch (error: any) {
          console.error('❌ [NutritionCard] Erreur complétion repas:', error);
          
          // ✅ En cas d'erreur, rafraîchir les données pour annuler la mise à jour optimiste
          const planToUse = propsCurrentPlan || currentPlan;
          if (planToUse?.id) {
            try {
              const apiResponse = await nutritionAPI.getCompletionStatus(planToUse.id);
              const globalCompletionData = apiResponse?.data || apiResponse;
              setFreshCompletionData(globalCompletionData);
              setCompletionStatus(globalCompletionData);
            } catch (refreshError) {
              console.warn('⚠️ [NutritionCard] Erreur rafraîchissement statut après erreur:', refreshError);
            }
          }
          
          Toast.show({
            type: 'error',
            text1: 'Erreur',
            text2: error?.message || 'Impossible de compléter le repas',
            visibilityTime: 2000,
          });
        } finally {
          setIsCompleting(false);
        }
        return;
      }

      // Fallback: logique locale si pas de callback (pour compatibilité)
      const planToUse = propsCurrentPlan || currentPlan;
      const planDayToUse = propsCurrentPlanDay !== undefined ? propsCurrentPlanDay : currentPlanDay;
      
      if (!planToUse?.id || planDayToUse === undefined) {
        setIsCompleting(false);
        return;
      }

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
        text1: 'Repas complété ! ✅',
        text2: 'Vous avez gagné 25 points. Passage au repas suivant...',
        visibilityTime: 2500,
      });
    } catch (error: any) {
      console.error('❌ [NutritionCard] Erreur complétion repas:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de compléter le repas',
        visibilityTime: 2000,
      });
    } finally {
      // ✅ Arrêter l'animation de loader
      setIsCompleting(false);
    }
  }, [propsOnMealComplete, propsCurrentPlan, currentPlan, propsCurrentPlanDay, currentPlanDay]);

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
        <Animated.View 
          style={[
            styles.card, 
            styles.completedCard,
            {
              opacity: celebrationOpacity,
              transform: [{ scale: celebrationScale }],
            }
          ]}
        >
          <View style={styles.completedContent}>
            {/* ✅ Icône animée sans rotation */}
            <Animated.View
              style={{
                transform: [
                  { scale: iconScale },
                ],
              }}
            >
              <View style={styles.celebrationIconContainer}>
                <Ionicons name="trophy" size={56} color="#FFD700" />
              </View>
            </Animated.View>
            
            {/* ✅ Titre principal */}
            <Text style={styles.completedTitle}>
              Félicitations !
            </Text>
            
            {/* ✅ Sous-titre avec message motivant */}
            <Text style={styles.completedSubtitle}>
              Vous avez complété tous les repas de la journée !
            </Text>
            <Text style={styles.completedMessage}>
              Continuez comme ça, vous êtes sur la bonne voie !
            </Text>
            
            {/* ✅ Statistiques du jour */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Ionicons name="restaurant" size={20} color={theme.colors.primary} />
                <Text style={styles.statText}>{dayMeals.length} repas</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.statText}>100% complété</Text>
              </View>
            </View>
            
            {/* ✅ Bouton pour voir le menu */}
            <View style={styles.viewAllButton}>
              <Text style={styles.viewAllButtonText}>Voir le menu complet</Text>
              <Ionicons name="arrow-forward-circle" size={20} color={theme.colors.primary} />
            </View>
          </View>
        </Animated.View>
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

        {/* Meal type avec icône */}
        <View style={styles.mealTypeRow}>
          <Text style={styles.mealTypeText}>
            {mealTitle} {mealIcon}
          </Text>
        </View>

        {/* Image/Video avec timer */}
        <View style={styles.mealImageContainer}>
          {showVideoInCard && youtubeVideoId ? (
            <Animated.View
              style={[
                {
                  width: '100%',
                  height: '100%',
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <YoutubePlayer
                height={200}
                width={Dimensions.get('window').width - 32}
                videoId={youtubeVideoId}
                play={youtubePlaying} // ✅ Démarre automatiquement car youtubePlaying est true
                onChangeState={(event: string) => {
                  if (event === 'playing') {
                    setYoutubePlaying(true);
                  } else if (event === 'paused' || event === 'ended') {
                    setYoutubePlaying(false);
                  }
                }}
                webViewStyle={{ 
                  opacity: 0.99,
                  borderRadius: 12,
                }}
                initialPlayerParams={{
                  autoplay: 1, // ✅ Autoplay activé (1 = true)
                  playsinline: 1, // ✅ Lecture en ligne (iOS)
                }}
              />
            </Animated.View>
          ) : (
            <>
              {nextMealToComplete.imageUrl ? (
                <ImagePersistent
                  source={{ uri: nextMealToComplete.imageUrl }}
                  style={styles.mealImage}
                />
              ) : (
                <View style={[styles.mealImage, styles.mealImagePlaceholder]}>
                  <Text style={styles.mealImagePlaceholderText}>{mealIcon}</Text>
                </View>
              )}
              
              {/* Bouton vidéo clignotant si vidéo disponible */}
              {hasVideo && (
                <TouchableOpacity
                  style={styles.videoButtonOverlay}
                  onPress={handleVideoButtonPress}
                  activeOpacity={0.8}
                >
                  <Animated.View
                    style={[
                      styles.videoButtonBadge,
                      {
                        transform: [{ scale: buttonPulseAnim }],
                      },
                    ]}
                  >
                    <Ionicons name="play-circle" size={28} color="#FFFFFF" />
                    <Text style={styles.videoButtonText}>Voir la vidéo</Text>
                  </Animated.View>
                </TouchableOpacity>
              )}
            </>
          )}
          
          {/* Timer overlay - Afficher uniquement l'heure, sans urgence */}
          {!showVideoInCard && (
            <View style={styles.timerOverlay}>
              <Ionicons 
                name="time-outline" 
                size={24} 
                color={theme.colors.text.primary} 
              />
              <Text style={styles.timerText}>
                {mealTime}
              </Text>
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
            style={[styles.actionButton, isCompleting && styles.actionButtonDisabled]}
            onPress={async () => {
              // ✅ Compléter directement le repas sans ouvrir le modal
              if (nextMealToComplete && !isCompleting) {
                await handleMealComplete(nextMealToComplete.id);
                // Le repas suivant s'affichera automatiquement grâce au useMemo de nextMealToComplete
              }
            }}
            activeOpacity={0.7}
            disabled={isCompleting}
          >
            {isCompleting ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.actionButtonText}>Complétion...</Text>
              </>
            ) : (
              <>
                <Text style={styles.actionButtonText}>Compléter ce repas</Text>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ✅ MealDetailModal retiré - On complète directement sans ouvrir le modal */}
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
  mealImagePlaceholder: {
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealImagePlaceholderText: {
    fontSize: 64,
  },
  videoButtonOverlay: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    zIndex: 10,
  },
  videoButtonBadge: {
    backgroundColor: '#FF0000', // ✅ Rouge YouTube
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  videoButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
  timerText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginLeft: 6,
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
  actionButtonDisabled: {
    opacity: 0.7,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  // Completed state - Design amélioré avec animations
  completedCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    backgroundColor: '#F8F9FA', // Fond clair et élégant
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  completedContent: {
    alignItems: 'center',
    width: '100%',
  },
  celebrationIconContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  completedTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text.primary,
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center',
  },
  completedSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  completedMessage: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 24,
    width: '100%',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: theme.colors.border,
    marginHorizontal: 16,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  viewAllButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
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
