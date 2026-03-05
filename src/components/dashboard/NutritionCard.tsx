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
  const [showCompletionConfirmation, setShowCompletionConfirmation] = useState(false);
  const [completedMealId, setCompletedMealId] = useState<string | null>(null);
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

  // ✅ Calculer today à chaque render pour avoir la date actuelle
  const getToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };
  
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
  // ✅ CORRECTION: Ne pas mettre à jour pendant la confirmation (délai de 2 secondes)
  const nextMealToComplete = useMemo(() => {
    // Si on affiche la confirmation, continuer à afficher le repas complété
    if (showCompletionConfirmation && completedMealId) {
      const meal = dayMeals.find(m => m.id === completedMealId);
      if (meal) {
        return meal;
      }
    }
    
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

    // ✅ CORRECTION: Utiliser freshCompletionData en priorité (données locales mises à jour immédiatement après complétion)
    // Puis propsCompletionData (données depuis DashboardScreen), puis completionStatus en fallback
    const completionDataToUse = freshCompletionData || propsCompletionData || completionStatus;
    
    if (!completionDataToUse || currentPlanDay === undefined) {
      return sortedMeals[0] || null;
    }
    
    // Sinon, chercher le premier non complété
    // ✅ SIMPLIFICATION: Vérifier si le repas est complété, peu importe la date
    for (const meal of sortedMeals) {
      const isCompleted = isMealCompleted(meal.id, completionDataToUse, currentPlanDay);
      if (!isCompleted) {
        return meal;
      }
    }

    return null; // Tous complétés
  }, [dayMeals, currentPlanDay, propsCompletionData, freshCompletionData, completionStatus, isMealCompleted, showCompletionConfirmation, completedMealId]);

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
          let optimisticUpdate: any = null;
          // ✅ CORRECTION: Utiliser la date locale, pas UTC, pour éviter le décalage de -1 jour
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const year = today.getFullYear();
          const month = String(today.getMonth() + 1).padStart(2, '0');
          const day = String(today.getDate()).padStart(2, '0');
          const todayISO = `${year}-${month}-${day}T00:00:00.000Z`;
          
          // ✅ Mise à jour optimiste : marquer le repas comme complété immédiatement dans les données locales
          const completionDataToUse = freshCompletionData || completionStatus;
          if (completionDataToUse && planDayToUse !== undefined) {
            optimisticUpdate = JSON.parse(JSON.stringify(completionDataToUse));
            
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
              (c: any) => c.mealId === mealId && c.completionDate === todayISO
            );
            
            if (!alreadyCompleted) {
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
          // Mais conserver la mise à jour optimiste si elle est plus récente
          const planToUse = propsCurrentPlan || currentPlan;
          if (planToUse?.id) {
            try {
              const apiResponse = await nutritionAPI.getCompletionStatus(planToUse.id);
              const globalCompletionData = apiResponse?.data || apiResponse;
              
              // ✅ Fusionner avec la mise à jour optimiste pour garantir que la complétion récente est incluse
              if (optimisticUpdate && optimisticUpdate.completionsByDay && planDayToUse !== undefined) {
                const dayKey = String(planDayToUse);
                const optimisticCompletions = optimisticUpdate.completionsByDay[dayKey] || [];
                const serverCompletions = globalCompletionData?.completionsByDay?.[dayKey] || [];
                
                // Fusionner les complétions : garder celles du serveur + celles de la mise à jour optimiste
                const mergedCompletions = [...serverCompletions];
                optimisticCompletions.forEach((optCompletion: any) => {
                  const exists = mergedCompletions.some((srvCompletion: any) => 
                    srvCompletion.mealId === optCompletion.mealId && 
                    srvCompletion.completionDate === optCompletion.completionDate
                  );
                  if (!exists) {
                    mergedCompletions.push(optCompletion);
                  }
                });
                
                if (!globalCompletionData.completionsByDay) {
                  globalCompletionData.completionsByDay = {};
                }
                globalCompletionData.completionsByDay[dayKey] = mergedCompletions;
              }
              
              setFreshCompletionData(globalCompletionData);
              setCompletionStatus(globalCompletionData);
            } catch (refreshError) {
              console.warn('⚠️ [NutritionCard] Erreur rafraîchissement statut après complétion:', refreshError);
            }
          }
          
          // ✅ Afficher la confirmation de complétion
          setShowCompletionConfirmation(true);
          setCompletedMealId(mealId);
          
          // ✅ Récupérer les points depuis le meal ou depuis la réponse API
          const completedMeal = dayMeals.find(m => m.id === mealId);
          const mealPoints = completedMeal?.points || completedMeal?.pointValue || 0;
          
          Toast.show({
            type: 'success',
            text1: 'Repas complété ! ✅',
            text2: mealPoints > 0 ? `Vous avez gagné ${mealPoints} points` : 'Repas complété !',
            visibilityTime: 2000,
          });
          
          // ✅ Attendre 2 secondes avant de passer au repas suivant
          // Cela permet au processus de complétion de se terminer complètement
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // ✅ Masquer la confirmation et réinitialiser
          setShowCompletionConfirmation(false);
          setCompletedMealId(null);
        } catch (error: any) {
          console.error('❌ [NutritionCard] Erreur complétion repas:', error);
          
          // ✅ Gérer l'erreur "already completed" en rafraîchissant les données
          const errorStatus = error?.status || error?.response?.status;
          const rawErrorMessage = error?.response?.data?.message || error?.data?.message || error?.message || '';
          const errorMessageLower = rawErrorMessage.toLowerCase();
          
          if (errorStatus === 400 || errorMessageLower.includes('already completed') || errorMessageLower.includes('déjà complété')) {
            // Repas déjà complété - rafraîchir les données pour mettre à jour l'affichage
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
              type: 'info',
              text1: 'Repas déjà complété',
              text2: 'Ce repas a déjà été marqué comme complété',
              visibilityTime: 2000,
            });
            return;
          }
          
          // ✅ iOS COMPANION MODE: Ignorer l'erreur 403 sur iOS car c'est en mode compagnon
          // Sur iOS, pas besoin d'abonnement pour compléter un repas
          if (isIOS && (errorStatus === 403 || errorMessageLower.includes('access denied') || errorMessageLower.includes('subscription'))) {
            console.log('⚠️ [NutritionCard] [iOS Companion Mode] Erreur 403 ignorée - Mode compagnon activé');
            // Ne pas afficher d'erreur à l'utilisateur sur iOS, juste logger
            return;
          }
          
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
          
          // ✅ Ne pas afficher l'erreur 403 sur Android non plus si c'est lié à l'abonnement
          // (mais on l'affiche quand même pour Android car c'est une vraie restriction)
          if (!isIOS && (errorStatus === 403 || errorMessageLower.includes('access denied') || errorMessageLower.includes('subscription'))) {
            Toast.show({
              type: 'error',
              text1: 'Accès refusé',
              text2: 'Un abonnement actif est requis pour compléter ce repas',
              visibilityTime: 4000,
            });
            return;
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

      // ✅ CORRECTION: Utiliser la date locale, pas UTC, pour éviter le décalage de -1 jour
      const selectedDateObj = new Date();
      selectedDateObj.setHours(0, 0, 0, 0);
      const year = selectedDateObj.getFullYear();
      const month = String(selectedDateObj.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDateObj.getDate()).padStart(2, '0');
      const completionDateISO = `${year}-${month}-${day}T00:00:00.000Z`;
      
      const response = await nutritionAPI.completeMeal(mealId, {
        planId: planToUse.id,
        planDay: planDayToUse,
        completionDate: completionDateISO,
      });

      // ✅ Récupérer les points depuis la réponse API ou depuis le meal
      const pointsFromResponse = response?.data?.pointsAwarded || response?.pointsAwarded || response?.data?.pointsEarned || response?.pointsEarned;
      const completedMeal = dayMeals.find(m => m.id === mealId);
      const mealPoints = completedMeal?.points || completedMeal?.pointValue || 0;
      const pointsEarned = pointsFromResponse || mealPoints || 0;

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
      
      // ✅ Afficher la confirmation de complétion
      setShowCompletionConfirmation(true);
      setCompletedMealId(mealId);
      
      Toast.show({
        type: 'success',
        text1: 'Repas complété ! ✅',
        text2: pointsEarned > 0 ? `Vous avez gagné ${pointsEarned} points` : 'Repas complété !',
        visibilityTime: 2000,
      });
      
      // ✅ Attendre 2 secondes avant de passer au repas suivant
      // Cela permet au processus de complétion de se terminer complètement
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // ✅ Masquer la confirmation et réinitialiser
      setShowCompletionConfirmation(false);
      setCompletedMealId(null);
    } catch (error: any) {
      console.error('❌ [NutritionCard] Erreur complétion repas:', error);
      
      const errorStatus = error?.status || error?.response?.status;
      const rawErrorMessage = error?.response?.data?.message || error?.data?.message || error?.message || '';
      const errorMessageLower = rawErrorMessage.toLowerCase();
      
      // ✅ iOS COMPANION MODE: Ignorer l'erreur 403 sur iOS car c'est en mode compagnon
      // Sur iOS, pas besoin d'abonnement pour compléter un repas
      if (isIOS && (errorStatus === 403 || errorMessageLower.includes('access denied') || errorMessageLower.includes('subscription'))) {
        console.log('⚠️ [NutritionCard] [iOS Companion Mode] Erreur 403 ignorée - Mode compagnon activé');
        // Ne pas afficher d'erreur à l'utilisateur sur iOS, juste logger
        return;
      }
      
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error?.message || 'Impossible de compléter le repas',
        visibilityTime: 2000,
      });
    } finally {
      // ✅ Arrêter l'animation de loader
      setIsCompleting(false);
      // ✅ S'assurer que la confirmation est masquée en cas d'erreur
      setShowCompletionConfirmation(false);
      setCompletedMealId(null);
    }
  }, [propsOnMealComplete, propsCurrentPlan, currentPlan, propsCurrentPlanDay, currentPlanDay]);

  // ✅ Vérifier si l'utilisateur a un abonnement actif (iOS et Android)
  const hasActiveSubscription = useMemo(() => {
    if (!subscriptionData) {
      return false;
    }
    
    const status = subscriptionData?.status || subscriptionData?.subscription?.status;
    const daysRemaining = (subscriptionData as any)?.daysRemaining;
    const isExpired = subscriptionData?.isExpired || subscriptionData?.subscription?.isExpired;
    
    // Abonnement actif si :
    // - Status est ACTIVE
    // - daysRemaining > 0 (si défini)
    // - Pas expiré
    // - Status n'est pas EXPIRED ou CANCELLED
    const hasActive = 
      (status === 'ACTIVE' || status?.toUpperCase() === 'ACTIVE') &&
      (daysRemaining === undefined || daysRemaining > 0) &&
      !isExpired &&
      status !== 'EXPIRED' &&
      status !== 'CANCELLED';
    
    if (hasActive) {
      return true;
    }
    
    // Fallback : vérifier hasActiveSubscription si disponible
    if (subscriptionData?.hasActiveSubscription === true) {
      return true;
    }
    
    return false;
  }, [subscriptionData]);
  
  // ✅ ANDROID: Bloquer l'accès complet si pas d'abonnement actif
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

  const today = getToday();
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

          {/* ✅ Afficher le bouton "Compléter ce repas" uniquement si l'utilisateur a un abonnement actif */}
          {hasActiveSubscription && (
            <TouchableOpacity 
              style={[styles.actionButton, (isCompleting || showCompletionConfirmation) && styles.actionButtonDisabled]}
              onPress={async () => {
                // ✅ Compléter directement le repas sans ouvrir le modal
                if (nextMealToComplete && !isCompleting && !showCompletionConfirmation) {
                // ✅ Vérifier une dernière fois avant de compléter pour éviter les appels API inutiles
                const completionDataToCheck = freshCompletionData || propsCompletionData || completionStatus;
                const isAlreadyCompleted = completionDataToCheck && currentPlanDay !== undefined
                  ? isMealCompleted(nextMealToComplete.id, completionDataToCheck, currentPlanDay)
                  : false;
                
                if (isAlreadyCompleted) {
                  // Repas déjà complété - rafraîchir les données
                  const planToUse = propsCurrentPlan || currentPlan;
                  if (planToUse?.id) {
                    try {
                      const apiResponse = await nutritionAPI.getCompletionStatus(planToUse.id);
                      const globalCompletionData = apiResponse?.data || apiResponse;
                      setFreshCompletionData(globalCompletionData);
                      setCompletionStatus(globalCompletionData);
                    } catch (refreshError) {
                      console.warn('⚠️ [NutritionCard] Erreur rafraîchissement:', refreshError);
                    }
                  }
                  Toast.show({
                    type: 'info',
                    text1: 'Repas déjà complété',
                    text2: 'Ce repas a déjà été marqué comme complété',
                    visibilityTime: 2000,
                  });
                  return;
                }
                
                await handleMealComplete(nextMealToComplete.id);
                // Le repas suivant s'affichera automatiquement après le délai de 2 secondes
              }
            }}
            activeOpacity={0.7}
            disabled={isCompleting || showCompletionConfirmation}
          >
            {isCompleting ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.actionButtonText}>Complétion...</Text>
              </>
            ) : showCompletionConfirmation ? (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.actionButtonText}>Repas complété !</Text>
              </>
            ) : (
              <>
                <Text style={styles.actionButtonText}>Compléter ce repas</Text>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              </>
            )}
            </TouchableOpacity>
          )}
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
