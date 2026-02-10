import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import Toast from 'react-native-toast-message';
import { Meal, CompletionStatus } from '../../screens/nutrition/types';
import { translateErrorMessage } from '../../utils/errorTranslator';

interface PastMeal {
  meal: Meal;
  date: Date;
  planDay: number;
}

interface PastMealsBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  pastMeals: PastMeal[];
  onMealComplete: (mealId: string, planDay: number) => Promise<void>;
  completionStatus?: CompletionStatus | null;
  freshCompletionData?: any;
  onUpdateCompletionData?: (data: any) => void;
  isIOS?: boolean;
}

// Meal type configuration
const mealTypeMap = {
  breakfast: { 
    title: 'Petit-Déj', 
    icon: '🍳', 
    bg: '#E8F5E8',
  },
  lunch: { 
    title: 'Dejeuner', 
    icon: '🍽️', 
    bg: '#F0F8FF',
  },
  snack: { 
    title: 'Collation', 
    icon: '🥤', 
    bg: '#FFF9E6',
  },
  dinner: { 
    title: 'Souper', 
    icon: '🌙', 
    bg: '#F5E6FF',
  },
};

const formatDate = (date: Date): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateCopy = new Date(date);
  dateCopy.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - dateCopy.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Aujourd\'hui';
  if (diffDays === 1) return 'Hier';
  return `Il y a ${diffDays} jours`;
};

const PastMealsBottomSheet: React.FC<PastMealsBottomSheetProps> = ({
  visible,
  onClose,
  pastMeals,
  onMealComplete,
  completionStatus,
  freshCompletionData,
  onUpdateCompletionData,
  isIOS = false,
}) => {
  const insets = useSafeAreaInsets();
  const [completingMealId, setCompletingMealId] = useState<string | null>(null);
  const [completedMealIds, setCompletedMealIds] = useState<Set<string>>(new Set());
  const [localCompletionData, setLocalCompletionData] = useState<any>(null);

  // ✅ NE PAS réinitialiser localCompletionData à la fermeture pour persister les données
  // Seulement réinitialiser completedMealIds (pour les mises à jour optimistes)
  useEffect(() => {
    if (!visible) {
      setCompletedMealIds(new Set());
      // ✅ NE PAS réinitialiser localCompletionData pour persister les données après fermeture
      // Cela permet de garder les données mises à jour même après fermeture/réouverture
    }
  }, [visible]);

  // ✅ Même logique que CompleteMealsBottomSheet : mettre à jour localCompletionData quand freshCompletionData change
  // ✅ IMPORTANT: Synchroniser TOUJOURS (même si le bottomsheet est fermé) pour que les données soient à jour à l'ouverture
  useEffect(() => {
    // ✅ Synchroniser quand freshCompletionData change (après complétion) OU quand completionStatus change
    // Utiliser freshCompletionData en PRIORITÉ (données les plus récentes et persistantes)
    const dataToUse = freshCompletionData || completionStatus;
    if (dataToUse) {
      // ✅ Créer une copie profonde pour éviter les mutations (comme CompleteMealsBottomSheet)
      const dataCopy = JSON.parse(JSON.stringify(dataToUse));
      setLocalCompletionData(dataCopy);
      
      if (__DEV__) {
        // Log détaillé pour voir les données reçues
        const allCompletedMealIds = new Set<string>();
        if (dataCopy?.completionsByDay) {
          Object.values(dataCopy.completionsByDay).forEach((dayCompletions: any) => {
            if (Array.isArray(dayCompletions)) {
              dayCompletions.forEach((completion: any) => {
                if (completion?.mealId) {
                  allCompletedMealIds.add(completion.mealId);
                }
              });
            }
          });
        }
        
        console.log('🔄 [PastMealsBottomSheet] Synchronisation localCompletionData avec données du parent:', {
          visible,
          hasFreshData: !!freshCompletionData,
          hasCompletionStatus: !!completionStatus,
          usingFreshData: !!freshCompletionData,
          hasCompletionsByDay: !!dataCopy?.completionsByDay,
          completionsByDayKeys: dataCopy?.completionsByDay ? Object.keys(dataCopy.completionsByDay) : [],
          totalCompletions: dataCopy?.completionsByDay ? Object.values(dataCopy.completionsByDay).reduce((total: number, dayCompletions: any) => {
            return total + (Array.isArray(dayCompletions) ? dayCompletions.length : 0);
          }, 0) : 0,
          allCompletedMealIds: Array.from(allCompletedMealIds),
          pastMealsReceived: pastMeals.length,
          hasProgress: !!dataCopy?.progress,
          progressPercentage: dataCopy?.progress?.percentage,
          progressCompletedMeals: dataCopy?.progress?.completedMeals,
          note: 'localCompletionData synchronisé avec freshCompletionData (persistant) - MÊME LOGIQUE que pastIncompleteMeals',
        });
      }
    } else {
      if (__DEV__) {
        console.warn('⚠️ [PastMealsBottomSheet] Aucune donnée de complétion disponible pour synchronisation');
      }
    }
  }, [freshCompletionData, completionStatus, pastMeals.length, visible]);

  // Fonction helper pour vérifier si un repas est complété
  // ✅ MÊME LOGIQUE EXACTE que NutritionScreen.isMealCompleted avec planDay
  const isMealCompleted = (mealId: string, planDay: number, completionData: any): boolean => {
    if (!completionData) {
      return false;
    }

    // ✅ IMPORTANT: Vérifier UNIQUEMENT dans completionsByDay pour le jour spécifique (planDay)
    // Ne pas utiliser les sources globales (allCompletions, mealStatus) car elles contiennent
    // les complétions de TOUS les jours, ce qui causerait des faux positifs
    if (completionData?.completionsByDay) {
      const dayKey = String(planDay);
      const dayCompletions = completionData.completionsByDay[dayKey] || completionData.completionsByDay[planDay];
      
      if (Array.isArray(dayCompletions)) {
        const found = dayCompletions.some(
          (completion: any) => completion?.mealId === mealId && completion?.completedAt
        );
        if (found) {
          return true;
        }
      }
    }
    
    // ✅ Si planDay est fourni, on ne vérifie QUE ce jour - retourner false si pas trouvé
    // (MÊME LOGIQUE que NutritionScreen.isMealCompleted)
    return false;
  };

  // Grouper les plats par jour et trier par ancienneté (plus ancien en premier)
  // ✅ IMPORTANT: pastMeals passé au bottomsheet est DÉJÀ filtré dans pastIncompleteMeals (ne contient QUE les plats non complétés)
  // On refiltre uniquement pour gérer les mises à jour optimistes (plats complétés dans cette session)
  // ✅ MÊME LOGIQUE que NutritionScreen.pastIncompleteMeals
  const groupedMeals = useMemo(() => {
    // ✅ Utiliser freshCompletionData en PRIORITÉ (données les plus récentes et persistantes du parent après complétion)
    // Puis completionStatus (données du serveur)
    // MÊME PRIORITÉ que NutritionScreen.pastIncompleteMeals (pas localCompletionData car il peut être obsolète)
    // ✅ IMPORTANT: Utiliser les mêmes données que pastIncompleteMeals pour garantir la cohérence
    const completionDataToUse = freshCompletionData || completionStatus;
    
    // Logs de débogage (comme CompleteMealsBottomSheet)
    if (__DEV__) {
      // Calculer tous les mealIds complétés pour le log
      const allCompletedMealIds = new Set<string>();
      if (completionDataToUse?.completionsByDay) {
        Object.values(completionDataToUse.completionsByDay).forEach((dayCompletions: any) => {
          if (Array.isArray(dayCompletions)) {
            dayCompletions.forEach((completion: any) => {
              if (completion?.mealId) {
                allCompletedMealIds.add(completion.mealId);
              }
            });
          }
        });
      }
      
      console.log('🔍 [PastMealsBottomSheet] Calcul de groupedMeals (comme CompleteMealsBottomSheet):', {
        platform: isIOS ? 'iOS' : 'Android',
        pastMealsCount: pastMeals.length,
        hasCompletionStatus: !!completionStatus,
        hasFreshCompletionData: !!freshCompletionData,
        usingData: freshCompletionData ? 'freshCompletionData' : completionStatus ? 'completionStatus' : 'none',
        note: 'Utiliser freshCompletionData || completionStatus (MÊME LOGIQUE que pastIncompleteMeals)',
        completedMealIdsCount: completedMealIds.size,
        hasCompletionsByDay: !!completionDataToUse?.completionsByDay,
        completionsByDayKeys: completionDataToUse?.completionsByDay ? Object.keys(completionDataToUse.completionsByDay) : [],
        allCompletedMealIds: Array.from(allCompletedMealIds),
        pastMeals: pastMeals.map(p => ({
          mealId: p.meal.id,
          mealName: p.meal.name,
          planDay: p.planDay,
          date: p.date.toDateString(),
        })),
      });
    }

    // ✅ IMPORTANT: pastMeals passé au bottomsheet est DÉJÀ filtré dans pastIncompleteMeals (ne contient QUE les plats non complétés)
    // On refiltre UNIQUEMENT pour gérer les mises à jour optimistes (plats complétés dans cette session)
    // ✅ MÊME LOGIQUE EXACTE que NutritionScreen.pastIncompleteMeals (utiliser freshCompletionData || completionStatus)
    // ✅ IMPORTANT: Vérifier pour chaque planDay spécifique (un plat complété pour day1 ne doit pas apparaître pour day1, mais peut apparaître pour day3 s'il n'est pas complété pour day3)
    const incompleteMeals = pastMeals.filter((pastMeal) => {
      // ✅ Si le plat a déjà été complété dans cette session, le masquer immédiatement (feedback optimiste)
      if (completedMealIds.has(pastMeal.meal.id)) {
        if (__DEV__) {
          console.log(`🚫 [PastMealsBottomSheet] Plat ${pastMeal.meal.name} (${pastMeal.meal.id}) masqué car complété dans cette session (optimiste) pour planDay ${pastMeal.planDay}`);
        }
        return false;
      }

      // ✅ Vérifier dans la source de données la plus récente disponible (MÊME LOGIQUE que NutritionScreen.isMealCompleted)
      // Utiliser freshCompletionData en priorité (données les plus récentes après complétion)
      // ✅ IMPORTANT: Utiliser les mêmes données que pastIncompleteMeals pour garantir la cohérence
      // ✅ CRITIQUE: Vérifier UNIQUEMENT pour le planDay spécifique (pastMeal.planDay)
      // Un plat complété pour day1 ne doit PAS apparaître pour day1, mais peut apparaître pour day3 s'il n'est pas complété pour day3
      if (completionDataToUse) {
        // ✅ Vérifier UNIQUEMENT dans completionsByDay pour le planDay spécifique (comme dans NutritionScreen)
        const isCompleted = isMealCompleted(pastMeal.meal.id, pastMeal.planDay, completionDataToUse);
        
        if (__DEV__) {
          const dayKey = String(pastMeal.planDay);
          const dayCompletions = completionDataToUse?.completionsByDay?.[dayKey] || completionDataToUse?.completionsByDay?.[pastMeal.planDay] || [];
          const mealIdInCompletions = Array.isArray(dayCompletions) ? dayCompletions.some((c: any) => c.mealId === pastMeal.meal.id) : false;
          
          console.log(`🔍 [PastMealsBottomSheet] Vérification plat ${pastMeal.meal.name} (${pastMeal.meal.id}) pour planDay ${pastMeal.planDay}:`, {
            planDay: pastMeal.planDay,
            dayKey,
            isCompleted,
            mealIdInCompletions,
            dayCompletionsCount: Array.isArray(dayCompletions) ? dayCompletions.length : 0,
            dayCompletionsMealIds: Array.isArray(dayCompletions) ? dayCompletions.map((c: any) => c.mealId) : [],
            usingData: freshCompletionData ? 'freshCompletionData' : completionStatus ? 'completionStatus' : 'none',
            note: 'Vérification pour ce planDay spécifique uniquement',
          });
        }
        
        if (isCompleted) {
          if (__DEV__) {
            console.log(`🚫 [PastMealsBottomSheet] Plat ${pastMeal.meal.name} (${pastMeal.meal.id}) masqué car déjà complété pour planDay ${pastMeal.planDay}`);
          }
          return false;
        }
      }
      
      // ✅ Si aucune donnée n'est disponible, on considère le plat comme non complété (par sécurité)
      // pastMeals est déjà filtré, donc normalement tous les plats devraient passer ce filtre
      if (__DEV__) {
        console.log(`✅ [PastMealsBottomSheet] Plat ${pastMeal.meal.name} (${pastMeal.meal.id}) conservé car NON complété pour planDay ${pastMeal.planDay}`);
      }
      return true;
    });

    if (__DEV__) {
      console.log('🔍 [PastMealsBottomSheet] Résultat du filtrage:', {
        totalPastMeals: pastMeals.length,
        incompleteMealsCount: incompleteMeals.length,
        filteredOut: pastMeals.length - incompleteMeals.length,
        platform: isIOS ? 'iOS' : 'Android',
      });
    }

    const grouped: { [key: string]: PastMeal[] } = {};
    
    incompleteMeals.forEach((pastMeal) => {
      const dateKey = pastMeal.date.toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(pastMeal);
    });

    // Convertir en tableau et trier par date (plus ancien en premier)
    const sortedGroups = Object.entries(grouped)
      .map(([dateKey, meals]) => ({
        date: new Date(dateKey),
        meals: meals.sort((a, b) => {
          // Trier les repas par type (breakfast, lunch, snack, dinner)
          const typeOrder = ['breakfast', 'lunch', 'snack', 'dinner'];
          const aIndex = typeOrder.indexOf(a.meal.type);
          const bIndex = typeOrder.indexOf(b.meal.type);
          return aIndex - bIndex;
        }),
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime()); // Plus ancien en premier

    return sortedGroups;
  }, [pastMeals, completedMealIds, freshCompletionData, completionStatus]);

  const handleCompleteMeal = async (mealId: string, planDay: number) => {
    // Éviter les doubles clics
    if (completingMealId === mealId) {
      return;
    }

    // Vérifier AVANT d'appeler l'API si le repas est déjà complété (comme CompleteMealsBottomSheet)
    const completionDataToCheck = localCompletionData || freshCompletionData || completionStatus;
    
    if (__DEV__) {
      console.log('🔍 [PastMealsBottomSheet] Vérification avant complétion:', {
        mealId,
        planDay,
        hasLocalData: !!localCompletionData,
        hasFreshData: !!freshCompletionData,
        hasCompletionStatus: !!completionStatus,
        hasCompletionsByDay: !!completionDataToCheck?.completionsByDay,
        completionsByDayKeys: completionDataToCheck?.completionsByDay ? Object.keys(completionDataToCheck.completionsByDay) : [],
      });
    }
    
    if (isMealCompleted(mealId, planDay, completionDataToCheck)) {
      console.log('⚠️ [PastMealsBottomSheet] Repas déjà complété, ignoré:', mealId);
      Toast.show({
        type: 'info',
        text1: 'Repas déjà complété',
        text2: 'Ce repas a déjà été marqué comme complété',
        visibilityTime: 2000,
      });
      // ✅ Rafraîchir les données pour mettre à jour l'affichage (comme CompleteMealsBottomSheet)
      // Le useEffect va synchroniser localCompletionData avec freshCompletionData automatiquement
      return;
    }

    setCompletingMealId(mealId);
    try {
      // ✅ Marquer le repas comme complété pour le retirer de la liste immédiatement (feedback optimiste)
      setCompletedMealIds((prev) => {
        const newSet = new Set(prev);
        newSet.add(mealId);
        return newSet;
      });
      
      // ✅ Appeler onMealComplete qui va mettre à jour freshCompletionData avec les données du serveur
      // handleMealComplete dans le parent fait un appel API et met à jour freshCompletionData avec les données du serveur
      await onMealComplete(mealId, planDay);
      
      // ✅ IMPORTANT: Ne PAS mettre à jour localCompletionData ici avec des données locales
      // handleMealComplete dans le parent met déjà à jour freshCompletionData avec les données du serveur
      // Le useEffect va synchroniser localCompletionData avec freshCompletionData automatiquement
      // Cela garantit que les données sont toujours synchronisées avec le serveur et persistent correctement
      
      if (__DEV__) {
        console.log('✅ [PastMealsBottomSheet] Complétion réussie, freshCompletionData mis à jour par le parent:', {
          mealId,
          planDay,
          note: 'Le useEffect va synchroniser localCompletionData avec freshCompletionData automatiquement',
        });
      }
      
      Toast.show({
        type: 'success',
        text1: 'Repas complété',
        text2: 'Le repas a été marqué comme complété avec succès.',
        visibilityTime: 2000,
      });
    } catch (error: any) {
      console.error('❌ [PastMealsBottomSheet] Erreur lors de la complétion:', error);
      
      // ✅ Retirer le mealId de completedMealIds en cas d'erreur (comme CompleteMealsBottomSheet)
      setCompletedMealIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(mealId);
        return newSet;
      });
      
      // ✅ Traduire les messages d'erreur en anglais en français (comme CompleteMealsBottomSheet)
      const rawErrorMessage = error?.message || 'Impossible de compléter le repas';
      const errorMessage = translateErrorMessage(rawErrorMessage);
      
      // ✅ Si l'erreur est "already completed", afficher un message info et rafraîchir (comme CompleteMealsBottomSheet)
      const errorLower = rawErrorMessage.toLowerCase();
      if (errorLower.includes('already completed') || errorLower.includes('déjà complété')) {
        Toast.show({
          type: 'info',
          text1: isIOS ? 'Plat déjà complété' : 'Repas déjà complété',
          text2: 'Ce repas a déjà été marqué comme complété',
          visibilityTime: 2000,
        });
        // ✅ Rafraîchir les données pour mettre à jour l'affichage
        // Le useEffect va synchroniser localCompletionData avec freshCompletionData automatiquement
        return;
      }
      
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: errorMessage,
        visibilityTime: 3000,
      });
    } finally {
      setCompletingMealId(null);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={[
            styles.bottomSheet,
            {
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
        >
          {isIOS ? (
            <BlurView intensity={20} style={styles.blurContainer}>
              <View style={styles.handle} />
              <View style={styles.header}>
                <Text style={styles.title}>Plats passés à compléter</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
              </View>
              <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
              >
                {groupedMeals.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
                    <Text style={styles.emptyText}>Tous les plats sont complétés !</Text>
                  </View>
                ) : (
                  groupedMeals.map((group, groupIndex) => {
                    const daysAgo = Math.floor(
                      (new Date().getTime() - group.date.getTime()) / (1000 * 60 * 60 * 24)
                    );
                    const isOverdue = daysAgo > 0;

                    return (
                      <View key={groupIndex} style={styles.dayGroup}>
                        <View style={[styles.dayHeader, isOverdue && styles.dayHeaderOverdue]}>
                          <Ionicons
                            name="calendar-outline"
                            size={18}
                            color={isOverdue ? '#FF6B6B' : '#666'}
                          />
                          <Text style={[styles.dayTitle, isOverdue && styles.dayTitleOverdue]}>
                            {formatDate(group.date)}
                          </Text>
                          {isOverdue && (
                            <View style={styles.overdueBadge}>
                              <Text style={styles.overdueBadgeText}>
                                {daysAgo === 1 ? 'Hier' : `${daysAgo}j`}
                              </Text>
                            </View>
                          )}
                        </View>

                        {group.meals.map((pastMeal) => {
                          const mealType = mealTypeMap[pastMeal.meal.type as keyof typeof mealTypeMap] || mealTypeMap.breakfast;
                          const isCompleting = completingMealId === pastMeal.meal.id;

                          return (
                            <View
                              key={`${pastMeal.meal.id}-${pastMeal.date.getTime()}`}
                              style={[styles.mealItem, { backgroundColor: mealType.bg }]}
                            >
                              <View style={styles.mealInfo}>
                                {pastMeal.meal.imageUrl && (
                                  <Image
                                    source={{ uri: pastMeal.meal.imageUrl }}
                                    style={styles.mealImage}
                                    resizeMode="cover"
                                  />
                                )}
                                <View style={styles.mealDetails}>
                                  <View style={styles.mealTypeRow}>
                                    <Text style={styles.mealTypeIcon}>{mealType.icon}</Text>
                                    <Text style={styles.mealTypeTitle}>{mealType.title}</Text>
                                  </View>
                                  <Text style={styles.mealName} numberOfLines={2}>
                                    {pastMeal.meal.name}
                                  </Text>
                                </View>
                              </View>
                              <TouchableOpacity
                                style={[
                                  styles.completeButton,
                                  isCompleting && styles.completeButtonDisabled,
                                ]}
                                onPress={() => handleCompleteMeal(pastMeal.meal.id, pastMeal.planDay)}
                                disabled={isCompleting}
                              >
                                {isCompleting ? (
                                  <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                  <>
                                    <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                                    <Text style={styles.completeButtonText}>Compléter</Text>
                                  </>
                                )}
                              </TouchableOpacity>
                            </View>
                          );
                        })}
                      </View>
                    );
                  })
                )}
              </ScrollView>
            </BlurView>
          ) : (
            <>
              <View style={styles.handle} />
              <View style={styles.header}>
                <Text style={styles.title}>Plats passés à compléter</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
              </View>
              <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
              >
                {groupedMeals.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
                    <Text style={styles.emptyText}>Tous les plats sont complétés !</Text>
                  </View>
                ) : (
                  groupedMeals.map((group, groupIndex) => {
                    const daysAgo = Math.floor(
                      (new Date().getTime() - group.date.getTime()) / (1000 * 60 * 60 * 24)
                    );
                    const isOverdue = daysAgo > 0;

                    return (
                      <View key={groupIndex} style={styles.dayGroup}>
                        <View style={[styles.dayHeader, isOverdue && styles.dayHeaderOverdue]}>
                          <Ionicons
                            name="calendar-outline"
                            size={18}
                            color={isOverdue ? '#FF6B6B' : '#666'}
                          />
                          <Text style={[styles.dayTitle, isOverdue && styles.dayTitleOverdue]}>
                            {formatDate(group.date)}
                          </Text>
                          {isOverdue && (
                            <View style={styles.overdueBadge}>
                              <Text style={styles.overdueBadgeText}>
                                {daysAgo === 1 ? 'Hier' : `${daysAgo}j`}
                              </Text>
                            </View>
                          )}
                        </View>

                        {group.meals.map((pastMeal) => {
                          const mealType = mealTypeMap[pastMeal.meal.type as keyof typeof mealTypeMap] || mealTypeMap.breakfast;
                          const isCompleting = completingMealId === pastMeal.meal.id;

                          return (
                            <View
                              key={`${pastMeal.meal.id}-${pastMeal.date.getTime()}`}
                              style={[styles.mealItem, { backgroundColor: mealType.bg }]}
                            >
                              <View style={styles.mealInfo}>
                                {pastMeal.meal.imageUrl && (
                                  <Image
                                    source={{ uri: pastMeal.meal.imageUrl }}
                                    style={styles.mealImage}
                                    resizeMode="cover"
                                  />
                                )}
                                <View style={styles.mealDetails}>
                                  <View style={styles.mealTypeRow}>
                                    <Text style={styles.mealTypeIcon}>{mealType.icon}</Text>
                                    <Text style={styles.mealTypeTitle}>{mealType.title}</Text>
                                  </View>
                                  <Text style={styles.mealName} numberOfLines={2}>
                                    {pastMeal.meal.name}
                                  </Text>
                                </View>
                              </View>
                              <TouchableOpacity
                                style={[
                                  styles.completeButton,
                                  isCompleting && styles.completeButtonDisabled,
                                ]}
                                onPress={() => handleCompleteMeal(pastMeal.meal.id, pastMeal.planDay)}
                                disabled={isCompleting}
                              >
                                {isCompleting ? (
                                  <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                  <>
                                    <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                                    <Text style={styles.completeButtonText}>Compléter</Text>
                                  </>
                                )}
                              </TouchableOpacity>
                            </View>
                          );
                        })}
                      </View>
                    );
                  })
                )}
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '95%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  blurContainer: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D1D1',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginTop: 16,
  },
  dayGroup: {
    marginBottom: 24,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  dayHeaderOverdue: {
    borderBottomColor: '#FFE0E0',
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    flex: 1,
  },
  dayTitleOverdue: {
    color: '#FF6B6B',
  },
  overdueBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  overdueBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  mealInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  mealImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  mealDetails: {
    flex: 1,
  },
  mealTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  mealTypeIcon: {
    fontSize: 16,
  },
  mealTypeTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  mealName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    justifyContent: 'center',
  },
  completeButtonDisabled: {
    opacity: 0.6,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PastMealsBottomSheet;


