import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Image,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import nutritionAPI from '../../services/nutritionApi';
import { Shimmer } from '../Shimmer';
import { useIOSSimulation } from '../../hooks/useIOSSimulation';
import { useAuth } from '../../context/FirebaseAuthContext';
import ImagePersistent from '../ImagePersistent';
import imageCache from '../../utils/imageCache';
import { mealTypeMap } from '../../screens/nutrition/utils/nutritionUtils';
import { calculatePlanDayFromDate, findMenuForPlanDay, getPlanProgress } from '../../screens/nutrition/utils/dateCalculations';

const NutritionCard = ({ onPress, onMealPress, subscriptionData, onSubscriptionPress }) => {
  const { shouldShowIOSOnly } = useIOSSimulation();
  const isIOS = shouldShowIOSOnly();
  const { refreshProfile } = useAuth();
  const [nutritionData, setNutritionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(1);
  
  // ✅ NEW: Track plan start date for accurate plan day calculation
  const [planStartDate, setPlanStartDate] = useState(null);

  // Generate dates for the week
  const generateWeekDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = generateWeekDates();

  // Mock data structure based on your API with multiple days
  const mockNutritionData = {
    plan: {
      id: "plan_123",
      name: "Test Nutrition Plan",
      description: "Test",
      type: "test",
      tascPhase: "Test",
      totalPoints: 554,
      menus: [
        {
          day: 1,
          title: "Day 1",
          description: "Test menu",
          type: "test",
          meals: [
            {
              id: "meal_123",
              name: "Boiled Plantain with Egg Sauce",
              type: "breakfast",
              imageUrl: "https://via.placeholder.com/80x80/90EE90/000000?text=Plantain",
              kcal: 300,
              protein: 15,
              carbs: 45,
              fats: 10,
              points: 50
            },
            {
              id: "meal_124",
              name: "Chicken Bowl",
              type: "lunch",
              imageUrl: "https://via.placeholder.com/80x80/FFB366/000000?text=Chicken",
              kcal: 450,
              protein: 25,
              carbs: 35,
              fats: 15,
              points: 75
            },
            {
              id: "meal_125",
              name: "Groundnut Soup with Fufu",
              type: "dinner",
              imageUrl: "https://via.placeholder.com/80x80/87CEEB/000000?text=Soup",
              kcal: 380,
              protein: 20,
              carbs: 40,
              fats: 12,
              points: 65
            },
            {
              id: "meal_126",
              name: "Test",
              type: "bonus",
              imageUrl: "https://via.placeholder.com/80x80/FFFF99/000000?text=Bonus",
              kcal: 150,
              protein: 8,
              carbs: 20,
              fats: 5,
              points: 25
            }
          ]
        },
        {
          day: 2,
          title: "Day 2",
          description: "Test menu day 2",
          type: "test",
          meals: [
            {
              id: "meal_127",
              name: "Oatmeal with Berries",
              type: "breakfast",
              imageUrl: "https://via.placeholder.com/80x80/FFE4B5/000000?text=Oatmeal",
              kcal: 280,
              protein: 12,
              carbs: 50,
              fats: 8,
              points: 45
            },
            {
              id: "meal_128",
              name: "Salmon Salad",
              type: "lunch",
              imageUrl: "https://via.placeholder.com/80x80/98FB98/000000?text=Salmon",
              kcal: 420,
              protein: 30,
              carbs: 25,
              fats: 18,
              points: 70
            },
            {
              id: "meal_129",
              name: "Vegetable Stir Fry",
              type: "dinner",
              imageUrl: "https://via.placeholder.com/80x80/FFB6C1/000000?text=StirFry",
              kcal: 350,
              protein: 18,
              carbs: 35,
              fats: 14,
              points: 60
            },
            {
              id: "meal_130",
              name: "Protein Shake",
              type: "bonus",
              imageUrl: "https://via.placeholder.com/80x80/DDA0DD/000000?text=Shake",
              kcal: 180,
              protein: 25,
              carbs: 15,
              fats: 3,
              points: 30
            }
          ]
        },
        {
          day: 3,
          title: "Day 3",
          description: "Test menu day 3",
          type: "test",
          meals: [
            {
              id: "meal_131",
              name: "Greek Yogurt with Honey",
              type: "breakfast",
              imageUrl: "https://via.placeholder.com/80x80/F0E68C/000000?text=Yogurt",
              kcal: 220,
              protein: 20,
              carbs: 25,
              fats: 5,
              points: 40
            },
            {
              id: "meal_132",
              name: "Quinoa Bowl",
              type: "lunch",
              imageUrl: "https://via.placeholder.com/80x80/DEB887/000000?text=Quinoa",
              kcal: 380,
              protein: 22,
              carbs: 45,
              fats: 12,
              points: 65
            },
            {
              id: "meal_133",
              name: "Grilled Chicken with Vegetables",
              type: "dinner",
              imageUrl: "https://via.placeholder.com/80x80/87CEEB/000000?text=Chicken",
              kcal: 400,
              protein: 35,
              carbs: 20,
              fats: 16,
              points: 75
            },
            {
              id: "meal_134",
              name: "Fruit Salad",
              type: "bonus",
              imageUrl: "https://via.placeholder.com/80x80/FFA07A/000000?text=Fruit",
              kcal: 120,
              protein: 2,
              carbs: 25,
              fats: 1,
              points: 20
            }
          ]
        }
      ]
    },
    completionStatus: {
      totalMeals: 4,
      completedMeals: 0,
      completionPercentage: 0,
      pointsEarned: 0,
      totalPoints: 554,
    }
  };

  const fetchNutritionData = React.useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch nutrition plans - même logique que NutritionScreen
      const plansResponse = await nutritionAPI.getPlans();
      
      // Support both old and new format (comme dans NutritionScreen)
      const plansData = plansResponse?.data || plansResponse;
      const httpStatus = plansResponse?.status || 200;
      
      // Vérifier si on a des plans (même logique que NutritionScreen)
      const plansCount = plansData?.data?.plans?.length || plansData?.plans?.length || 0;
      const allPlans = plansData?.data?.plans || plansData?.plans || [];
      
      if (__DEV__) {
        console.log('🍽️ [NutritionCard] Plans chargés:', {
          httpStatus,
          plansCount,
          hasPlansData: !!plansData,
          plansStructure: {
            hasDataField: !!plansData?.data,
            hasPlansArray: Array.isArray(plansData?.data?.plans) || Array.isArray(plansData?.plans),
            plansArrayLength: allPlans.length,
          },
        });
      }
      
      // Si on a des plans, utiliser le premier plan actif ou le premier disponible
      if (plansCount > 0 && allPlans.length > 0) {
        const currentPlan = allPlans.find((plan: any) => plan.isActive) || allPlans[0];
        
        if (__DEV__) {
          console.log('✅ [NutritionCard] Plan sélectionné:', {
            planId: currentPlan?.id,
            planName: currentPlan?.name,
            isActive: currentPlan?.isActive,
            menusCount: currentPlan?.menus?.length || 0,
          });
        }
        
        // Fetch completion status for the current plan
        try {
          const completionResponse = await nutritionAPI.getCompletionStatus(currentPlan.id);
          
          // Extract completion data from response
          const completionData = completionResponse.success ? completionResponse.data : null;
          
          // Calculate completion percentage based on actual completed meals
          // Handle both 'progress' and 'completionPercentage' fields from API
          let completionPercentage = 0;
          if (completionData) {
            // If API returns completionPercentage, use it
            if (completionData.completionPercentage !== undefined) {
              completionPercentage = completionData.completionPercentage;
            }
            // If API returns progress, use it but ensure it's based on actual completion
            else if (completionData.progress !== undefined) {
              // Only use progress if it's calculated from actual completed meals
              // Otherwise calculate it ourselves
              const totalMeals = completionData.totalMeals || currentPlan.menus?.[0]?.meals?.length || 0;
              const completedMeals = completionData.completedMeals || 0;
              if (totalMeals > 0) {
                completionPercentage = Math.round((completedMeals / totalMeals) * 100);
              } else {
                completionPercentage = completionData.progress || 0;
              }
            }
            // Calculate from completedMeals and totalMeals if available
            else {
              const totalMeals = completionData.totalMeals || currentPlan.menus?.[0]?.meals?.length || 0;
              const completedMeals = completionData.completedMeals || 0;
              if (totalMeals > 0) {
                completionPercentage = Math.round((completedMeals / totalMeals) * 100);
              }
            }
          }
          
          const nutritionData = {
            plan: currentPlan,
            completionStatus: {
              totalMeals: completionData?.totalMeals || currentPlan.menus?.[0]?.meals?.length || 0,
              completedMeals: completionData?.completedMeals || 0,
              completionPercentage: completionPercentage,
              pointsEarned: completionData?.pointsEarned || 0,
              totalPoints: currentPlan.totalPoints || 0,
            }
          };
          
          setNutritionData(nutritionData);
          
          // ✅ NEW: Store plan start date for accurate plan day calculation
          // Try to get from subscription data, or fallback to today
          const startDate = subscriptionData?.subscription?.startDate 
            ? new Date(subscriptionData.subscription.startDate)
            : currentPlan?.startDate 
            ? new Date(currentPlan.startDate)
            : new Date();
          startDate.setHours(0, 0, 0, 0);
          setPlanStartDate(startDate);
          
          if (__DEV__) {
            console.log('✅ [NutritionCard] Plan start date set:', {
              planStartDate: startDate.toDateString(),
              source: subscriptionData?.subscription?.startDate ? 'subscription' : 
                      currentPlan?.startDate ? 'plan' : 'today (fallback)'
            });
          }
        } catch (completionError) {
          // Use plan data without completion status
          const nutritionData = {
            plan: currentPlan,
            completionStatus: {
              totalMeals: currentPlan.menus?.[0]?.meals?.length || 0,
              completedMeals: 0,
              completionPercentage: 0,
              pointsEarned: 0,
              totalPoints: currentPlan.totalPoints || 0,
            }
          };
          setNutritionData(nutritionData);
          
          // ✅ NEW: Store plan start date even when completion fetch fails
          const startDate = subscriptionData?.subscription?.startDate 
            ? new Date(subscriptionData.subscription.startDate)
            : currentPlan?.startDate 
            ? new Date(currentPlan.startDate)
            : new Date();
          startDate.setHours(0, 0, 0, 0);
          setPlanStartDate(startDate);
          
          if (__DEV__) {
            console.log('✅ [NutritionCard] NutritionData défini avec succès');
          }
        }
      } else {
        // Pas de plans disponibles
        if (__DEV__) {
          console.log('⚠️ [NutritionCard] Aucun plan disponible:', {
            httpStatus,
            plansCount,
            hasPlansData: !!plansData,
          });
        }
        setNutritionData(null);
      }
    } catch (error) {
      console.error('❌ [NutritionCard] Erreur lors du chargement des plans:', error);
      // Ne pas utiliser mock data en production - retourner null
      setNutritionData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchNutritionData();
  }, [fetchNutritionData]);

  // Refresh data when screen comes into focus (e.g., after completing a meal)
  useFocusEffect(
    React.useCallback(() => {
      fetchNutritionData();
    }, [fetchNutritionData])
  );

  const getMealTypeIcon = (type) => {
    // Utiliser les emojis de mealTypeMap comme dans NutritionScreen
    const mealType = mealTypeMap[type] || mealTypeMap['snack']; // fallback sur snack si type inconnu
    return mealType?.icon || '🍽️';
  };

  const getMealTypeColor = (type) => {
    switch (type) {
      case 'breakfast':
        return '#E8F5E8';
      case 'lunch':
        return '#FFF3E0';
      case 'dinner':
        return '#E3F2FD';
      case 'bonus':
        return '#FFFDE7';
      default:
        return '#F5F5F5';
    }
  };

  const getMealTypeTitle = (type) => {
    switch (type) {
      case 'breakfast':
        return 'Petit-Déj';
      case 'lunch':
        return 'Dejeuner';
      case 'dinner':
        return 'Souper';
      case 'snack':
        return 'Collation';
      case 'bonus':
        return 'Collation'; // Fallback pour bonus
      default:
        return type;
    }
  };

  const getMealTimeRange = (type) => {
    switch (type) {
      case 'breakfast':
        return 'entre 7h30-9h00';
      case 'lunch':
        return 'entre 12h00-14h00';
      case 'snack':
        return 'à 16h';
      case 'dinner':
        return 'entre 18h00-20h00';
      default:
        return '';
    }
  };

  const formatDate = (date) => {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return `${date.getDate()} ${days[date.getDay()]}`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="restaurant" size={20} color={theme.colors.text.primary} />
          <Text style={styles.title}>Menu du jour</Text>
          <Text style={styles.date}>{selectedDate.toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <View style={styles.mealShimmerCard}>
            <Shimmer width={80} height={80} borderRadius={0} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Shimmer width="60%" height={18} style={{ marginBottom: 8 }} />
              <Shimmer width="100%" height={16} style={{ marginBottom: 6 }} />
              <Shimmer width="40%" height={14} />
            </View>
          </View>
          <View style={styles.mealShimmerCard}>
            <Shimmer width={80} height={80} borderRadius={0} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Shimmer width="60%" height={18} style={{ marginBottom: 8 }} />
              <Shimmer width="100%" height={16} style={{ marginBottom: 6 }} />
              <Shimmer width="40%" height={14} />
            </View>
          </View>
        </View>
      </View>
    );
  }

  // ✅ ANDROID: Bloquer l'accès si pas d'abonnement actif
  // ✅ iOS: Laisser l'accès (mode compagnon)
  const hasActiveSubscription = isIOS || 
    subscriptionData?.status === 'ACTIVE' || 
    subscriptionData?.hasActiveSubscription === true ||
    (subscriptionData?.subscription?.status?.toUpperCase() === 'ACTIVE' && !subscriptionData?.isExpired);
  
  // Sur Android, si pas d'abonnement, afficher la carte verrouillée
  if (Platform.OS === 'android' && !hasActiveSubscription) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="restaurant" size={20} color={theme.colors.text.primary} />
          <Text style={styles.title}>Menu du jour</Text>
          <Text style={styles.date}>{selectedDate.toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })}</Text>
        </View>
        <View style={styles.lockedContainer}>
          <View style={styles.lockIconContainer}>
            <Ionicons name="lock-closed" size={48} color="#FF9800" />
          </View>
          <Text style={styles.lockedTitle}>Menu du jour verrouillé</Text>
          <Text style={styles.lockedMessage}>
            Abonnez-vous pour accéder au menu du jour et débloquer tous les plans nutritionnels
          </Text>
          <TouchableOpacity 
            style={styles.subscribeButton}
            onPress={() => {
              console.log('🔘 [NutritionCard] Bouton "Voir les plans d\'abonnement" cliqué');
              console.log('🔘 [NutritionCard] onSubscriptionPress:', onSubscriptionPress);
              console.log('🔘 [NutritionCard] onPress:', onPress);
              if (onSubscriptionPress) {
                console.log('✅ [NutritionCard] Appel de onSubscriptionPress()');
                onSubscriptionPress();
              } else if (onPress) {
                console.log('⚠️ [NutritionCard] Appel de onPress() (fallback)');
                onPress();
              } else {
                console.error('❌ [NutritionCard] Aucune fonction de callback disponible');
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
  
  // Si pas de nutritionData, ne rien afficher
  if (!nutritionData || !nutritionData.plan || !nutritionData.plan.menus || nutritionData.plan.menus.length === 0) {
    return null;
  }

  // ✅ NEW: Calculate actual plan day from selected calendar date
  // This ensures NutritionCard shows the same meals as NutritionScreen
  const selectedDateObj = weekDates[selectedDay - 1]; // selectedDay is 1-based
  
  // Use shared utility to calculate plan day (handles all plan lengths)
  const menuDay = planStartDate && nutritionData.plan?.numDays
    ? calculatePlanDayFromDate(
        selectedDateObj,
        planStartDate,
        nutritionData.plan.numDays
      )
    : selectedDay; // Fallback to simple day index if no plan info
  
  // Use shared utility to find menu (consistent with NutritionScreen)
  const currentMenu = findMenuForPlanDay(nutritionData.plan.menus, menuDay) || nutritionData.plan.menus[0];
  
  // Get plan progress information for potential display
  const planProgress = planStartDate && nutritionData.plan?.numDays
    ? getPlanProgress(
        selectedDateObj,
        planStartDate,
        nutritionData.plan.numDays
      )
    : null;
  
  if (__DEV__) {
    console.log('🍽️ [NutritionCard] Menu selection', {
      selectedDay,
      selectedDate: selectedDateObj?.toDateString(),
      planStartDate: planStartDate?.toDateString(),
      planNumDays: nutritionData.plan?.numDays,
      calculatedMenuDay: menuDay,
      foundMenuDay: currentMenu?.day,
      isExactMatch: currentMenu?.day === menuDay,
      planProgress: planProgress ? {
        daysElapsed: planProgress.daysElapsed,
        cycleNumber: planProgress.cycleNumber,
        progressInCycle: `${planProgress.progressInCycle}%`
      } : 'N/A'
    });
  }

  const { completionStatus } = nutritionData;

  // Check if selected date is today (selectedDateObj already declared above)
  const today = new Date();
  const isToday = selectedDateObj && 
    selectedDateObj.getDate() === today.getDate() &&
    selectedDateObj.getMonth() === today.getMonth() &&
    selectedDateObj.getFullYear() === today.getFullYear();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="restaurant" size={20} color={theme.colors.text.primary} />
        <Text style={styles.title}>Menu du jour</Text>
        {planProgress && nutritionData.plan.numDays > 7 && (
          <View style={styles.planDayBadge}>
            <Text style={styles.planDayBadgeText}>
              Jour {menuDay}/{nutritionData.plan.numDays}
            </Text>
          </View>
        )}
        <Text style={styles.date}>{selectedDate.toLocaleDateString('fr-FR', { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        })}</Text>
      </View>

      {/* Date Navigation */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.dateNavigation}
        contentContainerStyle={styles.dateNavigationContent}
      >
        {weekDates.map((date, index) => {
          const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dateButton,
                selectedDay === index + 1 && styles.dateButtonActive,
                isWeekend && !(selectedDay === index + 1) && styles.dateButtonWeekend
              ]}
              onPress={() => {
                setSelectedDay(index + 1);
              }}
            >
              <Text style={[
                styles.dateButtonText,
                selectedDay === index + 1 && styles.dateButtonTextActive,
                isWeekend && !(selectedDay === index + 1) && styles.dateButtonTextWeekend
              ]}>
                {formatDate(date)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Meals */}
      <View style={styles.mealsContainer}>
        {currentMenu?.meals
          .sort((a, b) => {
            // Ordre correct : Petit-Déj, Dejeuner, Collation, Souper
            const order = { 
              'breakfast': 1, 
              'lunch': 2, 
              'snack': 3,
              'dinner': 4,
              'bonus': 3 // bonus = snack
            };
            const orderA = order[a.type] || 999;
            const orderB = order[b.type] || 999;
            return orderA - orderB;
          })
          .map((meal, index) => {
            const iconEmoji = getMealTypeIcon(meal.type);
            const backgroundColor = getMealTypeColor(meal.type);
            
            // Précharger l'image du repas si elle existe
            if (meal.imageUrl) {
              imageCache.preloadRemoteImage(meal.imageUrl).catch(() => {
                // Ignore les erreurs de préchargement
              });
            }
            
            return (
              <TouchableOpacity 
                key={meal.id} 
                style={[styles.mealCard, { backgroundColor }]}
                onPress={() => {
                  if (onMealPress) {
                    onMealPress(meal);
                  }
                }}
                activeOpacity={0.7}
              >
                {/* Content area with image and text */}
                <View style={styles.mealContent}>
                  {/* Image on the left - avec container comme dans NutritionScreen */}
                  <View style={styles.mealImageContainer}>
                    <ImagePersistent
                      source={{ uri: meal.imageUrl }} 
                      style={styles.mealImage}
                      resizeMode="cover"
                      onError={(error) => {
                      }}
                      fallbackSource={{ uri: 'https://via.placeholder.com/80x80/CCCCCC/666666?text=Meal' }}
                    />
                  </View>
                  
                  {/* Text content on the right */}
                  <View style={styles.mealInfo}>
                    {/* Header with title and icon - structure comme dans NutritionScreen */}
                    <View style={styles.mealHeader}>
                      <Text style={styles.mealTypeTitle}>{getMealTypeTitle(meal.type)}</Text>
                      <Text style={styles.mealName} numberOfLines={2}>{meal.name}</Text>
                      {getMealTimeRange(meal.type) && (
                        <Text style={styles.mealTime}>{getMealTimeRange(meal.type)}</Text>
                      )}
                    </View>
                  </View>

                  {/* Icon and Status - Right */}
                  <View style={styles.mealRightSection}>
                    <Text style={styles.mealIconEmoji}>{iconEmoji}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 0, // Pas de margin horizontal, le padding sera géré par le contenu
    marginBottom: 20,
    borderRadius: 0, // Pas de border radius sur le container principal
    padding: 0, // Pas de padding sur le container, on le met sur les sections internes
    borderWidth: 0, // Pas de border sur le container
    borderColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, // Padding horizontal pour le header
    paddingTop: 20,
    paddingBottom: 16,
    marginBottom: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    flex: 1,
    marginLeft: 8,
  },
  date: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  planDayBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  planDayBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976D2',
  },
  phaseBanner: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  phaseText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '500',
  },
  dateNavigation: {
    marginBottom: 16,
    paddingHorizontal: 20, // Padding horizontal pour la navigation des dates
  },
  dateNavigationContent: {
    paddingHorizontal: 0, // Pas de padding supplémentaire
    justifyContent: 'center',
    flexGrow: 1,
  },
  dateButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  dateButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  dateButtonText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  dateButtonTextActive: {
    color: '#FFFFFF',
  },
  dateButtonWeekend: {
    backgroundColor: '#FFF5F5',
  },
  dateButtonTextWeekend: {
    color: '#FF6B6B',
  },
  mealsContainer: {
    paddingHorizontal: 20, // Padding horizontal pour les repas
    paddingBottom: 24, // Padding bottom comme dans NutritionScreen
    marginBottom: 0,
  },
  mealCard: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden', // Ensure the image doesn't overflow the rounded corners
    borderWidth: 1,
    borderColor: '#E0E0E0', // Border comme dans NutritionScreen
  },
  mealContent: {
    flexDirection: 'row',
    height: 80, // Fixed height for the content area
  },
  mealImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    margin: 0,
    overflow: 'hidden',
  },
  mealImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  mealInfo: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'space-between', // Distribute content evenly
  },
  mealHeader: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    height: '100%',
  },
  mealRightSection: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 16,
  },
  mealIconEmoji: {
    fontSize: 20,
  },
  mealTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealTypeTitle: {
    fontSize: 16,
    fontWeight: 'normal',
    color: '#333333', // Comme dans NutritionScreen
    marginBottom: 4,
  },
  mealName: {
    fontSize: 14,
    color: '#000000', // Comme dans NutritionScreen
    fontWeight: 'normal',
    marginBottom: 4,
  },
  mealTime: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: 'normal',
  },
  summaryContainer: {
    marginBottom: 20,
  },
  summaryItem: {
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  pointsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  pointsText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  completeButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingContainer: {
    paddingVertical: 20,
  },
  mealShimmerCard: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 12,
    padding: 0,
    overflow: 'hidden',
    height: 80,
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 8,
  },
  // Locked Menu Styles
  lockedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  // iOS Locked Card Styles (remplace la carte Android)
  iosLockedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    minHeight: 200, // Assure une hauteur minimale similaire à la carte Android
  },
  iosCheckStatusContainer: {
    width: '100%',
    marginTop: 16,
    alignItems: 'center',
  },
  plateIconContainer: {
    marginBottom: 24,
  },
  plateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3E5F5',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  forkIcon: {
    position: 'absolute',
    left: -8,
    top: '50%',
    transform: [{ translateY: -8 }],
  },
  knifeIcon: {
    position: 'absolute',
    right: -8,
    top: '50%',
    transform: [{ translateY: -8 }],
  },
  lockedTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  lockedDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  websiteHighlight: {
    color: '#10B981', // Vert
    fontStyle: 'italic',
    fontWeight: '600',
  },
  lasocoachHighlight: {
    color: '#10B981', // Vert
    fontStyle: 'italic',
    fontWeight: '600',
  },
  subscriptionButton: {
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
    marginBottom: 16,
  },
  subscriptionButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscriptionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  freeTrialLink: {
    marginBottom: 8,
  },
  freeTrialText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  freeTrialDescription: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: 4,
  },
  // Styles pour la carte verrouillée (Android sans abonnement)
  lockedContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  lockIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  lockedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  lockedMessage: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9800',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default NutritionCard;
