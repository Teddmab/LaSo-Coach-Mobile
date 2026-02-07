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
  isIOS = false,
}) => {
  const insets = useSafeAreaInsets();
  const [completingMealId, setCompletingMealId] = useState<string | null>(null);
  const [completedMealIds, setCompletedMealIds] = useState<Set<string>>(new Set());
  const [localCompletionData, setLocalCompletionData] = useState<any>(null);

  // Réinitialiser les états quand le bottomsheet se ferme
  useEffect(() => {
    if (!visible) {
      setCompletedMealIds(new Set());
      setLocalCompletionData(null);
    }
  }, [visible]);

  // Mettre à jour localCompletionData quand freshCompletionData change ou quand le bottomsheet s'ouvre
  useEffect(() => {
    if (visible) {
      const dataToUse = freshCompletionData || completionStatus;
      if (dataToUse) {
        setLocalCompletionData(dataToUse);
      }
    }
  }, [visible, freshCompletionData, completionStatus]);

  // Fonction helper pour vérifier si un repas est complété
  const isMealCompleted = (mealId: string, planDay: number, completionData: any): boolean => {
    if (!completionData) {
      return false;
    }

    // Vérifier UNIQUEMENT dans completionsByDay pour le jour spécifique
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
    
    return false;
  };

  // Grouper les plats par jour et trier par ancienneté (plus ancien en premier)
  // ✅ Filtrer uniquement les plats complétés dans cette session (les autres sont déjà filtrés dans pastIncompleteMeals)
  const groupedMeals = useMemo(() => {
    // Logs de débogage pour iOS
    if (__DEV__) {
      console.log('🔍 [PastMealsBottomSheet] Calcul de groupedMeals:', {
        platform: isIOS ? 'iOS' : 'Android',
        pastMealsCount: pastMeals.length,
        hasCompletionStatus: !!completionStatus,
        hasFreshCompletionData: !!freshCompletionData,
        hasLocalCompletionData: !!localCompletionData,
        completedMealIdsCount: completedMealIds.size,
        pastMeals: pastMeals.map(p => ({
          mealId: p.meal.id,
          mealName: p.meal.name,
          planDay: p.planDay,
          date: p.date.toDateString(),
        })),
      });
    }

    // ✅ IMPORTANT: Les plats passés sont DÉJÀ filtrés dans pastIncompleteMeals
    // On ne filtre ici QUE les plats complétés dans cette session (optimiste)
    const incompleteMeals = pastMeals.filter((pastMeal) => {
      // Si le plat a déjà été complété dans cette session, le masquer immédiatement
      if (completedMealIds.has(pastMeal.meal.id)) {
        if (__DEV__) {
          console.log(`🚫 [PastMealsBottomSheet] Plat ${pastMeal.meal.name} (${pastMeal.meal.id}) masqué car complété dans cette session`);
        }
        return false;
      }

      // ✅ Ne pas refiltrer avec completionStatus car les plats sont déjà filtrés
      // dans pastIncompleteMeals. On fait confiance à cette liste.
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
  }, [pastMeals, completedMealIds, localCompletionData, freshCompletionData, completionStatus]);

  const handleCompleteMeal = async (mealId: string, planDay: number) => {
    setCompletingMealId(mealId);
    try {
      await onMealComplete(mealId, planDay);
      
      // ✅ Ajouter le plat à l'ensemble des plats complétés pour le masquer immédiatement
      setCompletedMealIds((prev) => {
        const newSet = new Set(prev);
        newSet.add(mealId);
        return newSet;
      });
      
      // ✅ Mettre à jour localCompletionData pour refléter la complétion
      if (localCompletionData) {
        const updatedData = { ...localCompletionData };
        const dayKey = String(planDay);
        if (!updatedData.completionsByDay) {
          updatedData.completionsByDay = {};
        }
        if (!updatedData.completionsByDay[dayKey]) {
          updatedData.completionsByDay[dayKey] = [];
        }
        // Ajouter la complétion si elle n'existe pas déjà
        const dayCompletions = updatedData.completionsByDay[dayKey];
        if (!dayCompletions.some((c: any) => c.mealId === mealId)) {
          dayCompletions.push({
            mealId,
            completionDate: new Date().toISOString().split('T')[0] + 'T00:00:00.000Z',
            completedAt: new Date().toISOString(),
          });
        }
        setLocalCompletionData(updatedData);
      }
      
      Toast.show({
        type: 'success',
        text1: 'Repas complété',
        text2: 'Le repas a été marqué comme complété avec succès.',
        visibilityTime: 2000,
      });
    } catch (error: any) {
      console.error('Error completing meal:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error?.message || 'Impossible de compléter le repas. Veuillez réessayer.',
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

