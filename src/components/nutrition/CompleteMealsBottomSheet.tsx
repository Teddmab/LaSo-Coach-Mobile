import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import Toast from 'react-native-toast-message';
import { Meal, CompletionStatus } from '../../screens/nutrition/types';

interface CompleteMealsBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  meals: Meal[];
  completionStatus: CompletionStatus | null;
  freshCompletionData: any;
  onMealComplete: (mealId: string) => Promise<void>;
  onRefresh: () => void;
  onUpdateCompletionData?: (data: any) => void;
  isIOS?: boolean;
}

// Meal type configuration
const mealTypeMap = {
  breakfast: { 
    title: 'Petit-Déj', 
    icon: '🍳', 
    bg: '#E8F5E8',
    time: 'entre 7h30-9h00'
  },
  lunch: { 
    title: 'Dejeuner', 
    icon: '🍽️', 
    bg: '#F0F8FF',
    time: 'entre 12h00-14h00'
  },
  snack: { 
    title: 'Collation', 
    icon: '🥤', 
    bg: '#FFF9E6',
    time: 'à 16h'
  },
  dinner: { 
    title: 'Souper', 
    icon: '🍲', 
    bg: '#FFF8DC',
    time: 'entre 18h00-20h00'
  },
};

const CompleteMealsBottomSheet: React.FC<CompleteMealsBottomSheetProps> = ({
  visible,
  onClose,
  meals,
  completionStatus,
  freshCompletionData,
  onMealComplete,
  onRefresh,
  onUpdateCompletionData,
  isIOS = false,
}) => {
  const insets = useSafeAreaInsets();
  const [completingMealIds, setCompletingMealIds] = useState<Set<string>>(new Set());
  const [completedMealIds, setCompletedMealIds] = useState<Set<string>>(new Set());
  const [localCompletionData, setLocalCompletionData] = useState<any>(null);

  // Réinitialiser les états quand le bottomsheet se ferme
  useEffect(() => {
    if (!visible) {
      setCompletingMealIds(new Set());
      setCompletedMealIds(new Set());
      setLocalCompletionData(null);
    }
  }, [visible]);

  // Mettre à jour localCompletionData quand freshCompletionData change ou quand le bottomsheet s'ouvre
  useEffect(() => {
    if (visible) {
      // Quand le bottomsheet s'ouvre, utiliser freshCompletionData ou completionStatus
      const dataToUse = freshCompletionData || completionStatus;
      if (dataToUse) {
        if (__DEV__) {
          console.log('🔄 [CompleteMealsBottomSheet] Mise à jour localCompletionData à l\'ouverture:', {
            hasFreshData: !!freshCompletionData,
            hasCompletionStatus: !!completionStatus,
            hasCompletionsByDay: !!dataToUse?.completionsByDay,
            completionsByDayKeys: dataToUse?.completionsByDay ? Object.keys(dataToUse.completionsByDay) : [],
            totalCompletions: dataToUse?.completionsByDay ? Object.values(dataToUse.completionsByDay).reduce((total: number, dayCompletions: any) => {
              return total + (Array.isArray(dayCompletions) ? dayCompletions.length : 0);
            }, 0) : 0,
          });
        }
        setLocalCompletionData(dataToUse);
      } else {
        if (__DEV__) {
          console.warn('⚠️ [CompleteMealsBottomSheet] Aucune donnée de complétion disponible à l\'ouverture');
        }
      }
    }
  }, [visible, freshCompletionData, completionStatus]);

  // Fonction helper pour vérifier si un repas est complété
  const isMealCompleted = (mealId: string, completionData: any): boolean => {
    if (!completionData) {
      return false;
    }

    // ✅ PRIORITÉ 1: Vérifier dans completionsByDay (source principale selon les logs du backend)
    // Le backend retourne uniquement completionsByDay, donc c'est la source la plus fiable
    if (completionData?.completionsByDay) {
      // Parcourir tous les jours (les clés peuvent être des strings "1", "7", etc.)
      for (const dayKey in completionData.completionsByDay) {
        const dayCompletions = completionData.completionsByDay[dayKey];
        if (Array.isArray(dayCompletions)) {
          const found = dayCompletions.some(
            (completion: any) => {
              // Vérifier que le mealId correspond ET qu'il y a un completedAt
              const matches = completion?.mealId === mealId && completion?.completedAt;
              if (matches && __DEV__) {
                console.log(`✅ [isMealCompleted] Repas ${mealId} trouvé dans completionsByDay[${dayKey}]`);
              }
              return matches;
            }
          );
          if (found) {
            return true; // Repas trouvé dans completionsByDay = déjà complété
          }
        }
      }
    }

    // ✅ PRIORITÉ 2: Vérifier dans dayProgress.completedMealIds (pour compatibilité)
    const isCompletedByIds = completionData?.dayProgress?.completedMealIds?.includes(mealId) === true;
    if (isCompletedByIds) {
      return true;
    }
    
    // ✅ PRIORITÉ 3: Vérifier dans mealStatus (pour compatibilité)
    const isCompletedByStatus = completionData?.mealStatus?.[mealId]?.completed === true;
    if (isCompletedByStatus) {
      return true;
    }
    
    // ✅ PRIORITÉ 4: Vérifier dans allCompletions (pour compatibilité)
    const isCompletedInAllCompletions = completionData?.allCompletions?.some(
      (completion: any) => completion?.mealId === mealId
    ) === true;
    if (isCompletedInAllCompletions) {
      return true;
    }
    
    return false; // Repas non complété
  };

  // Filtrer les repas non complétés
  const getIncompleteMeals = () => {
    // Utiliser les données locales mises à jour en priorité, puis freshCompletionData, puis completionStatus
    const completionDataToUse = localCompletionData || freshCompletionData || completionStatus;
    
    // Log pour déboguer
    if (__DEV__) {
      console.log('🔍 [CompleteMealsBottomSheet] Filtrage des repas:', {
        totalMeals: meals.length,
        hasLocalData: !!localCompletionData,
        hasFreshData: !!freshCompletionData,
        hasCompletionStatus: !!completionStatus,
        usingData: completionDataToUse ? 'local/fresh/status' : 'none',
        hasCompletionsByDay: !!completionDataToUse?.completionsByDay,
        completionsByDayKeys: completionDataToUse?.completionsByDay ? Object.keys(completionDataToUse.completionsByDay) : [],
        totalCompletions: completionDataToUse?.completionsByDay ? Object.values(completionDataToUse.completionsByDay).reduce((total: number, dayCompletions: any) => {
          return total + (Array.isArray(dayCompletions) ? dayCompletions.length : 0);
        }, 0) : 0,
      });
    }
    
    const incompleteMeals = meals.filter((meal: Meal) => {
      // Si le repas a déjà été complété dans cette session, le masquer
      if (completedMealIds.has(meal.id)) {
        if (__DEV__) {
          console.log(`🚫 [CompleteMealsBottomSheet] Repas ${meal.name} (${meal.id}) masqué car complété dans cette session`);
        }
        return false;
      }

      // Vérifier dans la source de données la plus récente disponible
      if (completionDataToUse) {
        const isCompleted = isMealCompleted(meal.id, completionDataToUse);
        if (isCompleted) {
          if (__DEV__) {
            console.log(`🚫 [CompleteMealsBottomSheet] Repas ${meal.name} (${meal.id}) masqué car déjà complété dans les données`);
          }
          return false;
        }
      }
      
      // Si aucune donnée n'est disponible, on considère le repas comme non complété (par sécurité)
      return true;
    });
    
    if (__DEV__) {
      console.log('✅ [CompleteMealsBottomSheet] Résultat du filtrage:', {
        totalMeals: meals.length,
        incompleteMeals: incompleteMeals.length,
        incompleteMealIds: incompleteMeals.map((m: Meal) => m.id),
        completedInSession: Array.from(completedMealIds),
      });
    }
    
    return incompleteMeals;
  };

  // Utiliser useMemo pour recalculer la liste quand les données changent
  const incompleteMeals = useMemo(() => {
    return getIncompleteMeals();
  }, [meals, localCompletionData, freshCompletionData, completionStatus, completedMealIds]);

  const handleMealComplete = async (mealId: string) => {
    // Éviter les doubles clics
    if (completingMealIds.has(mealId)) {
      return;
    }

    // Vérifier AVANT d'appeler l'API si le repas est déjà complété
    const completionDataToCheck = localCompletionData || freshCompletionData || completionStatus;
    
    if (__DEV__) {
      console.log('🔍 [CompleteMealsBottomSheet] Vérification avant complétion:', {
        mealId,
        hasLocalData: !!localCompletionData,
        hasFreshData: !!freshCompletionData,
        hasCompletionStatus: !!completionStatus,
        hasCompletionsByDay: !!completionDataToCheck?.completionsByDay,
        completionsByDayKeys: completionDataToCheck?.completionsByDay ? Object.keys(completionDataToCheck.completionsByDay) : [],
      });
    }
    
    if (isMealCompleted(mealId, completionDataToCheck)) {
      console.log('⚠️ [CompleteMealsBottomSheet] Repas déjà complété, ignoré:', mealId);
      Toast.show({
        type: 'info',
        text1: isIOS ? 'Plat déjà complété' : 'Repas déjà complété',
        text2: 'Ce repas a déjà été marqué comme complété',
        visibilityTime: 2000,
      });
      // Rafraîchir les données pour mettre à jour l'affichage
      setTimeout(() => {
        onRefresh();
      }, 300);
      return;
    }

    try {
      setCompletingMealIds(prev => new Set(prev).add(mealId));
      
      await onMealComplete(mealId);
      
      // Marquer le repas comme complété pour le retirer de la liste
      setCompletedMealIds(prev => new Set(prev).add(mealId));
      
      // Mettre à jour immédiatement les données locales pour refléter la complétion
      const currentData = localCompletionData || freshCompletionData || completionStatus;
      if (currentData) {
        const updatedData = { ...currentData };
        const now = new Date().toISOString();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const completionDateISO = today.toISOString();
        
        // Ajouter le mealId à completedMealIds
        if (!updatedData.dayProgress) {
          updatedData.dayProgress = {};
        }
        if (!updatedData.dayProgress.completedMealIds) {
          updatedData.dayProgress.completedMealIds = [];
        }
        if (!updatedData.dayProgress.completedMealIds.includes(mealId)) {
          updatedData.dayProgress.completedMealIds = [...updatedData.dayProgress.completedMealIds, mealId];
        }
        
        // Mettre à jour mealStatus
        if (!updatedData.mealStatus) {
          updatedData.mealStatus = {};
        }
        updatedData.mealStatus = {
          ...updatedData.mealStatus,
          [mealId]: { ...updatedData.mealStatus[mealId], completed: true }
        };
        
        // Mettre à jour completionsByDay pour refléter la complétion
        // On doit trouver le jour du plan pour ce repas, mais pour l'instant on met à jour tous les jours possibles
        if (!updatedData.completionsByDay) {
          updatedData.completionsByDay = {};
        }
        
        // Ajouter la complétion dans completionsByDay pour tous les jours (le backend filtrera)
        // On crée une nouvelle entrée de complétion
        const completionEntry = {
          mealId: mealId,
          completionDate: completionDateISO,
          completedAt: now
        };
        
        // Parcourir tous les jours et ajouter la complétion si elle n'existe pas déjà
        Object.keys(updatedData.completionsByDay).forEach(dayKey => {
          const dayCompletions = updatedData.completionsByDay[dayKey];
          if (Array.isArray(dayCompletions)) {
            const alreadyExists = dayCompletions.some(c => c.mealId === mealId);
            if (!alreadyExists) {
              updatedData.completionsByDay[dayKey] = [...dayCompletions, completionEntry];
            }
          }
        });
        
        // Si aucun jour n'existe, créer une entrée pour le jour 1 par défaut
        if (Object.keys(updatedData.completionsByDay).length === 0) {
          updatedData.completionsByDay['1'] = [completionEntry];
        }
        
        // Mettre à jour la progression
        if (updatedData.progress) {
          updatedData.progress = {
            ...updatedData.progress,
            completedMeals: (updatedData.progress.completedMeals || 0) + 1,
            remainingMeals: Math.max(0, (updatedData.progress.remainingMeals || 0) - 1),
            percentage: updatedData.progress.totalMeals > 0 
              ? Math.round(((updatedData.progress.completedMeals || 0) + 1) / updatedData.progress.totalMeals * 100)
              : 0
          };
        }
        
        setLocalCompletionData(updatedData);
        
        // Notifier le parent pour mettre à jour freshCompletionData
        if (onUpdateCompletionData) {
          onUpdateCompletionData(updatedData);
        }
      }
      
      // Rafraîchir les données après un court délai pour synchroniser avec le serveur
      setTimeout(() => {
        onRefresh();
      }, 300);
      
    } catch (error: any) {
      console.error('❌ [CompleteMealsBottomSheet] Erreur lors de la complétion:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error?.message || 'Impossible de compléter le repas',
      });
    } finally {
      setCompletingMealIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(mealId);
        return newSet;
      });
    }
  };

  const handleCompleteAll = async () => {
    // Filtrer à nouveau pour ne garder que les repas vraiment non complétés
    const reallyIncompleteMeals = incompleteMeals.filter(meal => {
      const completionDataToCheck = localCompletionData || freshCompletionData || completionStatus;
      return !isMealCompleted(meal.id, completionDataToCheck) && !completedMealIds.has(meal.id);
    });

    if (reallyIncompleteMeals.length === 0) {
      Toast.show({
        type: 'info',
        text1: 'Information',
        text2: isIOS ? 'Tous les plats sont déjà complétés' : 'Tous les repas sont déjà complétés'
      });
      return;
    }

    try {
      // Compléter tous les repas vraiment non complétés un par un
      let completedCount = 0;
      for (const meal of reallyIncompleteMeals) {
        // Vérifier une dernière fois avant de compléter
        const completionDataToCheck = localCompletionData || freshCompletionData || completionStatus;
        if (!isMealCompleted(meal.id, completionDataToCheck) && !completedMealIds.has(meal.id)) {
          await handleMealComplete(meal.id);
          completedCount++;
          // Petit délai entre chaque complétion pour éviter la surcharge
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      Toast.show({
        type: 'success',
        text1: 'Succès',
        text2: isIOS 
          ? `${completedCount} ${completedCount === 1 ? 'plat' : 'plats'} marqué${completedCount === 1 ? '' : 's'} comme complété${completedCount === 1 ? '' : 's'}`
          : `${completedCount} repas marqués comme complétés`
      });

      // Rafraîchir après un court délai
      setTimeout(() => {
        onRefresh();
      }, 500);
    } catch (error: any) {
      console.error('❌ [CompleteMealsBottomSheet] Erreur lors de la complétion de tous les repas:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <BlurView intensity={20} style={styles.blurContainer}>
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.bottomSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          {/* Handle bar */}
          <View style={styles.handleBar} />
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {isIOS ? 'Marquer des plats comme complétés' : 'Marquer des repas comme complétés'}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView 
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={true}
          >
            {incompleteMeals.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle" size={48} color="#4CAF50" style={{ marginBottom: 12 }} />
                <Text style={styles.emptyStateTitle}>
                  {isIOS ? 'Tous les plats sont déjà complétés pour aujourd\'hui' : 'Tous les repas sont déjà complétés pour aujourd\'hui'}
                </Text>
                <Text style={styles.emptyStateSubtitle}>
                  Bravo ! Continuez comme ça 🎉
                </Text>
              </View>
            ) : (
              incompleteMeals.map((meal: Meal) => {
                const mealType = mealTypeMap[meal.type as keyof typeof mealTypeMap] || mealTypeMap.breakfast;
                const isCompleting = completingMealIds.has(meal.id);
                const isCompleted = completedMealIds.has(meal.id);

                return (
                  <View key={meal.id} style={styles.mealItem}>
                    <View style={styles.mealImageContainer}>
                      {meal.imageUrl ? (
                        <Image 
                          source={{ uri: meal.imageUrl }}
                          style={styles.mealImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.mealPlaceholder}>
                          <Text style={styles.mealPlaceholderText}>{mealType.icon}</Text>
                        </View>
                      )}
                      <View style={styles.mealTypeBadge}>
                        <Text style={styles.mealTypeIcon}>{mealType.icon}</Text>
                        <Text style={styles.mealTypeText}>{mealType.title}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.mealInfo}>
                      <Text style={styles.mealName}>{meal.name}</Text>
                      <Text style={styles.mealTime}>{mealType.time}</Text>
                      <View style={styles.mealDetails}>
                        <Text style={styles.mealCalories}>
                          {meal.calories || meal.calorieCount || 'N/A'} kcal
                        </Text>
                        <Text style={styles.mealPoints}>
                          {meal.points || meal.pointValue || 0} points
                        </Text>
                      </View>
                    </View>
                    
                    {(() => {
                      // Vérification supplémentaire avant d'afficher le bouton compléter
                      const completionDataToCheck = localCompletionData || freshCompletionData || completionStatus;
                      const isActuallyCompleted = isMealCompleted(meal.id, completionDataToCheck);
                      
                      // Si le repas est complété mais qu'il apparaît encore dans la liste, c'est un bug
                      if (isActuallyCompleted && __DEV__) {
                        console.error(`🚨 [CompleteMealsBottomSheet] BUG: Repas ${meal.name} (${meal.id}) est complété mais apparaît dans la liste!`, {
                          mealId: meal.id,
                          mealName: meal.name,
                          hasLocalData: !!localCompletionData,
                          hasFreshData: !!freshCompletionData,
                          hasCompletionStatus: !!completionStatus,
                          completionsByDay: completionDataToCheck?.completionsByDay,
                        });
                      }
                      
                      // Ne pas afficher le bouton si le repas est complété
                      if (isCompleted || isActuallyCompleted) {
                        return null;
                      }
                      
                      return (
                        <View style={styles.mealActions}>
                          <TouchableOpacity 
                            style={styles.detailsButton}
                            onPress={() => {
                              Alert.alert(
                                meal.name,
                                `Détails nutritionnels:\n\n` +
                                `🔥 Calories: ${meal.calories || 0} kcal\n` +
                                `🥩 Protéines: ${meal.proteins || 0}g\n` +
                                `🍚 Glucides: ${meal.carbs || 0}g\n` +
                                `🥑 Lipides: ${meal.fats || 0}g\n\n` +
                                `⭐ Points: ${meal.points || 0}`,
                                [{ text: 'OK', style: 'cancel' }]
                              );
                            }}
                          >
                            <Ionicons name="information-circle-outline" size={20} color={theme.colors.primary} />
                          </TouchableOpacity>
                          
                          <TouchableOpacity 
                            style={[styles.completeButton, isCompleting && styles.completeButtonDisabled]}
                            onPress={() => handleMealComplete(meal.id)}
                            disabled={isCompleting}
                          >
                            {isCompleting ? (
                              <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                              <Ionicons name="checkmark-outline" size={20} color="#FFFFFF" />
                            )}
                          </TouchableOpacity>
                        </View>
                      );
                    })()}
                  </View>
                );
              })
            )}
          </ScrollView>
          
          {/* Footer */}
          {incompleteMeals.length > 0 && (
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.completeAllButton}
                onPress={handleCompleteAll}
                disabled={completingMealIds.size > 0}
              >
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.completeAllButtonText}>Tout compléter</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#CCCCCC',
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
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    marginTop: 8,
    color: '#757575',
    textAlign: 'center',
  },
  mealItem: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  mealImageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  mealImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  mealPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealPlaceholderText: {
    fontSize: 24,
  },
  mealTypeBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  mealTypeIcon: {
    fontSize: 12,
  },
  mealTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  mealTime: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  mealDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  mealCalories: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '500',
  },
  mealPoints: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  mealActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  detailsButton: {
    padding: 8,
  },
  completeButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeButtonDisabled: {
    opacity: 0.6,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  completeAllButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    gap: 8,
  },
  completeAllButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
});

export default CompleteMealsBottomSheet;

