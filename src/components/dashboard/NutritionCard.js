import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Image,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import nutritionAPI from '../../services/nutritionApi';

const NutritionCard = ({ onPress, onMealPress, subscriptionData, onSubscriptionPress }) => {
  const [nutritionData, setNutritionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(1);

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
      progress: 100
    }
  };

  useEffect(() => {
    const fetchNutritionData = async () => {
      try {
        setLoading(true);
        
        // Fetch nutrition plans
        const plansResponse = await nutritionAPI.getPlans();
        console.log('🥗 Plans response:', plansResponse);
        
        if (plansResponse.success && plansResponse.data.plans && plansResponse.data.plans.length > 0) {
          const currentPlan = plansResponse.data.plans[0]; // Get the first plan for now
          console.log('🥗 Current plan:', currentPlan);
          
          // Fetch completion status for the current plan
          try {
            const completionResponse = await nutritionAPI.getCompletionStatus(currentPlan.id);
            console.log('🥗 Completion response:', completionResponse);
            
            const nutritionData = {
              plan: currentPlan,
              completionStatus: completionResponse.success ? completionResponse.data : {
                totalMeals: 0,
                completedMeals: 0,
                completionPercentage: 0,
                pointsEarned: 0,
                totalPoints: currentPlan.totalPoints || 0,
                progress: 0
              }
            };
            
            setNutritionData(nutritionData);
          } catch (completionError) {
            console.error('❌ Error fetching completion status:', completionError);
            // Use plan data without completion status
            const nutritionData = {
              plan: currentPlan,
              completionStatus: {
                totalMeals: currentPlan.menus?.[0]?.meals?.length || 0,
                completedMeals: 0,
                completionPercentage: 0,
                pointsEarned: 0,
                totalPoints: currentPlan.totalPoints || 0,
                progress: 0
              }
            };
            setNutritionData(nutritionData);
          }
        } else {
          console.log('🥗 No nutrition plans available');
          setNutritionData(null);
        }
      } catch (error) {
        console.error('❌ Error fetching nutrition data:', error);
        // Fallback to mock data for development
        setNutritionData(mockNutritionData);
      } finally {
        setLoading(false);
      }
    };

    fetchNutritionData();
  }, []);

  const getMealTypeIcon = (type) => {
    switch (type) {
      case 'breakfast':
        return { name: 'sunny', color: '#FFD700' };
      case 'lunch':
        return { name: 'restaurant', color: '#FF8C00' };
      case 'dinner':
        return { name: 'moon', color: '#4169E1' };
      case 'bonus':
        return { name: 'star', color: '#FFD700' };
      default:
        return { name: 'restaurant', color: '#666' };
    }
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
        return 'Déjeuner';
      case 'dinner':
        return 'Souper';
      case 'bonus':
        return 'Bonus';
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
      case 'dinner':
        return 'entre 19h00-21h00';
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
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement du menu...</Text>
        </View>
      </View>
    );
  }

  // Check if subscription is expired or inactive
  // Show locked menu only when: EXPIRED, INACTIVE, CANCELLED, or no subscription
  // Show actual menu when: ACTIVE, EXPIRING_SOON, FREE_TRIAL, or TRIAL
  const subscriptionStatus = subscriptionData?.status?.toUpperCase();
  const isSubscriptionExpired = subscriptionStatus === 'EXPIRED' || 
                                 subscriptionStatus === 'INACTIVE' || 
                                 subscriptionStatus === 'CANCELLED' ||
                                 (!subscriptionData && !nutritionData);
  
  // Show locked menu only if subscription is expired/inactive AND no nutrition data
  // OR if we have subscription data but it's expired/inactive
  const shouldShowLockedMenu = isSubscriptionExpired || (!subscriptionData && !nutritionData);
  
  if (shouldShowLockedMenu) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="restaurant" size={20} color={theme.colors.text.primary} />
          <Text style={styles.title}>Menu du jour</Text>
        </View>
        
        {/* Locked Menu Message */}
        <View style={styles.lockedContainer}>
          {/* Plate Icon */}
          <View style={styles.plateIconContainer}>
            <View style={styles.plateIcon}>
              <Ionicons name="restaurant" size={40} color="#9C27B0" />
              <View style={styles.forkIcon}>
                <Ionicons name="restaurant-outline" size={16} color="#9C27B0" />
              </View>
              <View style={styles.knifeIcon}>
                <Ionicons name="restaurant-outline" size={16} color="#9C27B0" />
              </View>
            </View>
          </View>
          
          {/* Title */}
          <Text style={styles.lockedTitle}>Menus verrouillés</Text>
          
          {/* Description */}
          <Text style={styles.lockedDescription}>
            Abonnez-vous à un plan pour accéder à vos menus personnalisés et commencer votre parcours nutritionnel.
          </Text>
          
          {/* Primary Button */}
          <TouchableOpacity 
            style={styles.subscriptionButton}
            onPress={() => {
              if (onSubscriptionPress) {
                onSubscriptionPress();
              }
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#BA68C8', '#9C27B0']}
              style={styles.subscriptionButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.subscriptionButtonText}>Voir les plans d'abonnement</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          {/* Free Trial Link */}
          <TouchableOpacity 
            style={styles.freeTrialLink}
            onPress={() => {
              if (onSubscriptionPress) {
                onSubscriptionPress();
              }
            }}
          >
            <Text style={styles.freeTrialText}>Commencer avec l'essai gratuit</Text>
          </TouchableOpacity>
          
          {/* Additional Text */}
          <Text style={styles.freeTrialDescription}>
            Commencez gratuitement avec notre essai gratuit !
          </Text>
        </View>
      </View>
    );
  }

  // Safety check: if nutritionData is null or doesn't have a plan, show locked menu
  if (!nutritionData || !nutritionData.plan || !nutritionData.plan.menus || nutritionData.plan.menus.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="restaurant" size={20} color={theme.colors.text.primary} />
          <Text style={styles.title}>Menu du jour</Text>
        </View>
        
        <View style={styles.lockedContainer}>
          <View style={styles.plateIconContainer}>
            <View style={styles.plateIcon}>
              <Ionicons name="restaurant" size={40} color="#9C27B0" />
              <View style={styles.forkIcon}>
                <Ionicons name="restaurant-outline" size={16} color="#9C27B0" />
              </View>
              <View style={styles.knifeIcon}>
                <Ionicons name="restaurant-outline" size={16} color="#9C27B0" />
              </View>
            </View>
          </View>
          
          <Text style={styles.lockedTitle}>Menus verrouillés</Text>
          <Text style={styles.lockedDescription}>
            Abonnez-vous à un plan pour accéder à vos menus personnalisés et commencer votre parcours nutritionnel.
          </Text>
          
          <TouchableOpacity 
            style={styles.subscriptionButton}
            onPress={() => {
              if (onSubscriptionPress) {
                onSubscriptionPress();
              }
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#BA68C8', '#9C27B0']}
              style={styles.subscriptionButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.subscriptionButtonText}>Voir les plans d'abonnement</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.freeTrialLink}
            onPress={() => {
              if (onSubscriptionPress) {
                onSubscriptionPress();
              }
            }}
          >
            <Text style={styles.freeTrialText}>Commencer avec l'essai gratuit</Text>
          </TouchableOpacity>
          
          <Text style={styles.freeTrialDescription}>
            Commencez gratuitement avec notre essai gratuit !
          </Text>
        </View>
      </View>
    );
  }

  // Get the menu for the selected day (1-based index)
  const currentMenu = nutritionData.plan.menus.find(menu => menu.day === selectedDay) || nutritionData.plan.menus[0];
  const { completionStatus } = nutritionData;

  // Check if selected date is today
  const today = new Date();
  const selectedDateObj = weekDates[selectedDay - 1]; // selectedDay is 1-based, so subtract 1 for array index
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
                console.log('🥗 Day navigation: Selected day', index + 1);
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
            // Sort meals in the correct order: Petit-Déj, Déjeuner, Souper, Bonus
            const order = { 
              'breakfast': 1, 
              'lunch': 2, 
              'dinner': 3, 
              'bonus': 4 
            };
            const orderA = order[a.type] || 999;
            const orderB = order[b.type] || 999;
            return orderA - orderB;
          })
          .map((meal, index) => {
            const icon = getMealTypeIcon(meal.type);
            const backgroundColor = getMealTypeColor(meal.type);
            
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
                  {/* Image on the left - flush with edges */}
                  <Image 
                    source={{ uri: meal.imageUrl }} 
                    style={styles.mealImage}
                    resizeMode="cover"
                    onError={(error) => {
                      console.log('❌ Image loading error for meal:', meal.name, error);
                    }}
                    defaultSource={{ uri: 'https://via.placeholder.com/80x80/CCCCCC/666666?text=Meal' }}
                  />
                  
                  {/* Text content on the right */}
                  <View style={styles.mealInfo}>
                    {/* Header with title and icon */}
                    <View style={styles.mealHeader}>
                      <Text style={styles.mealTypeTitle}>{getMealTypeTitle(meal.type)}</Text>
                      <Ionicons name={icon.name} size={20} color={icon.color} />
                    </View>
                    
                    <Text style={styles.mealName} numberOfLines={2}>{meal.name}</Text>
                    {getMealTimeRange(meal.type) && (
                      <Text style={styles.mealTime}>{getMealTimeRange(meal.type)}</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
      </View>

      {/* Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Ionicons name="information-circle-outline" size={16} color={theme.colors.text.secondary} />
          <Text style={styles.summaryLabel}>Description</Text>
          <Text style={styles.summaryValue}>{nutritionData.plan.description}</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Ionicons name="checkmark-circle-outline" size={16} color={theme.colors.text.secondary} />
          <Text style={styles.summaryLabel}>Progression</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${completionStatus.completionPercentage}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{completionStatus.completionPercentage}%</Text>
          </View>
        </View>
      </View>

      {/* Complete Day Button - Only show for today */}
      {isToday && (
        <TouchableOpacity 
          style={styles.completeButton} 
          onPress={async () => {
            if (onPress) {
              onPress();
            }
            
            // TODO: Call API to mark day as complete
            // if (nutritionData?.plan?.id) {
            //   try {
            //     await nutritionAPI.markDayComplete(nutritionData.plan.id, selectedDay);
            //     // Refresh data after completion
            //     // fetchNutritionData();
            //   } catch (error) {
            //     console.error('Error marking day as complete:', error);
            //   }
            // }
          }}
        >
          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          <Text style={styles.completeButtonText}>Marquer le jour comme terminé</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
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
  },
  dateNavigationContent: {
    paddingHorizontal: 4,
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
    marginBottom: 20,
  },
  mealCard: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden', // Ensure the image doesn't overflow the rounded corners
  },
  mealContent: {
    flexDirection: 'row',
    height: 80, // Fixed height for the content area
  },
  mealImage: {
    width: 80,
    height: 80,
    borderRadius: 0, // No border radius
    margin: 0, // No margin - flush with edges
  },
  mealInfo: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'space-between', // Distribute content evenly
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  mealTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealTypeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  mealName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  mealTime: {
    fontSize: 12,
    color: theme.colors.text.secondary,
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
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
});

export default NutritionCard;
