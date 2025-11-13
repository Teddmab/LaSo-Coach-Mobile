import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Image,
  StatusBar,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';
import BlurOverlay from '../components/BlurOverlay';
import SubscriptionBanner from '../components/SubscriptionBanner';
import SubscriptionService from '../services/subscriptionService';
import Avatar from '../components/Avatar';
import NotificationBadge from '../components/NotificationBadge';
import { ProfileApi } from '../services/profileApi';
import nutritionAPI from '../services/nutritionApi';
import Toast from 'react-native-toast-message';
import BottomNavigation from '../components/BottomNavigation';

const NutritionScreen = ({ user, onLogout, onTabPress, activeTab, onSubscriptionRenew }) => {
  // State management
  const today = new Date();
  const [currentDate] = useState(today); // Keep current date constant
  const [selectedDate, setSelectedDate] = useState(today.getDate());
  const [selectedDay, setSelectedDay] = useState(today.getDay() || 7); // Use current day of week
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [showBlurOverlay, setShowBlurOverlay] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [nutritionPlans, setNutritionPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [dayMeals, setDayMeals] = useState([]);
  const [completionStatus, setCompletionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Meal interaction states
  const [mealInteractions, setMealInteractions] = useState({});
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedMealForFeedback, setSelectedMealForFeedback] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  
  // Selected meal for preview
  const [selectedMeal, setSelectedMeal] = useState(null);
  
  // Tab state for meal preview
  const [activeMealTab, setActiveMealTab] = useState('composition'); // 'composition', 'recipe', or 'ingredients'

  // Meal type configuration - minimal UI mapping only
  const mealTypeMap = {
    breakfast: { 
      title: 'Petit-Déj', 
      icon: '🍳', 
      bg: '#E8F5E8',
      time: 'entre 7h30-9h00'
    },
    lunch: { 
      title: 'Déjeuner', 
      icon: '🍽️', 
      bg: '#F0F8FF',
      time: 'entre 12h00-14h00'
    },
    dinner: { 
      title: 'Souper', 
      icon: '🍲', 
      bg: '#FFF8DC',
      time: 'entre 19h00-21h00'
    },
    snack: { 
      title: 'Bonus', 
      icon: '🥤', 
      bg: '#FFF9E6',
      time: 'Snack'
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (currentPlan && subscriptionData) {
      loadDayData();
    }
  }, [currentPlan, selectedDate, subscriptionData]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      console.log('🥗 Nutrition: Fetching all data...');
      
      // Fetch all data in parallel
      const [profileRes, subscriptionRes, plansRes] = await Promise.allSettled([
        ProfileApi.getProfile(),
        SubscriptionService.getSubscriptionStatus(),
        nutritionAPI.getPlans()
      ]);

      // Handle profile data
      if (profileRes.status === 'fulfilled') {
        setProfileData(profileRes.value);
        console.log('✅ Nutrition: Profile data loaded');
      }

      // Handle subscription data
      if (subscriptionRes.status === 'fulfilled') {
        const subscription = subscriptionRes.value;
        console.log('🔍 SUBSCRIPTION DATA STRUCTURE:', JSON.stringify(subscription, null, 2));
        setSubscriptionData(subscription);
        
        // Only blur when status is EXPIRED or INACTIVE (not just expiring soon)
        if (subscription?.status === 'EXPIRED' || subscription?.status === 'INACTIVE') {
          setShowBlurOverlay(true);
        }
        console.log('✅ Nutrition: Subscription data loaded');
        console.log('✅ End date from subscription:', subscription?.endDate || subscription?.subscription?.endDate);
      }

      // Handle nutrition plans
      if (plansRes.status === 'fulfilled') {
        const plansData = plansRes.value;
        setNutritionPlans(plansData?.data?.plans || []);
        
        // Set current plan (first active plan or first available)
        const activePlan = plansData?.data?.plans?.find(plan => plan.isActive) || plansData?.data?.plans?.[0];
        if (activePlan) {
          setCurrentPlan(activePlan);
          console.log('✅ Nutrition: Current plan set:', activePlan.name);
        }
      }

    } catch (error) {
      console.error('❌ Nutrition: Error fetching data:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur de chargement',
        text2: 'Impossible de charger les données des menus'
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate which day in the nutrition plan cycle based on selected date
  const calculateNutritionPlanDay = (selectedDate) => {
    if (!subscriptionData?.subscription?.startDate || !currentPlan?.numDays) {
      console.log('⚠️ Missing subscription start date or plan numDays');
      return 1; // Default to day 1
    }

    const startDate = new Date(subscriptionData.subscription.startDate);
    startDate.setHours(0, 0, 0, 0);
    
    const currentDate = new Date(selectedDate);
    currentDate.setHours(0, 0, 0, 0);
    
    // Calculate days since subscription started (0-indexed)
    const daysSinceStart = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
    
    // Calculate which day in the plan cycle (1-indexed, repeating)
    // Example: 3-day plan cycles as 1,2,3,1,2,3...
    const planDay = (daysSinceStart % currentPlan.numDays) + 1;
    
    console.log(`📅 Date: ${currentDate.toDateString()}, Days since start: ${daysSinceStart}, Plan cycle day: ${planDay}/${currentPlan.numDays}`);
    
    return planDay;
  };

  const loadDayData = async () => {
    if (!currentPlan?.id) return;
    
    try {
      // Calculate which day in the nutrition plan cycle
      const planDay = calculateNutritionPlanDay(selectedDate ? new Date(today.getFullYear(), today.getMonth(), selectedDate) : today);
      
      console.log(`🥗 Nutrition: Loading data for calendar date ${selectedDate}, plan day ${planDay}`);
      console.log(`🥗 Nutrition: Current plan:`, currentPlan.name, `(${currentPlan.numDays} days)`);
      console.log(`🥗 Nutrition: Plan menus:`, currentPlan.menus);
      
      // Get meals for the calculated plan day
      const dayMenu = currentPlan.menus?.find(menu => menu.day === planDay);
      console.log(`🥗 Nutrition: Found day menu for plan day ${planDay}:`, dayMenu);
      
      if (dayMenu) {
        console.log(`🥗 Nutrition: Day meals:`, dayMenu.meals);
        setDayMeals(dayMenu.meals || []);
      } else {
        console.log(`🥗 Nutrition: No menu found for plan day ${planDay}`);
        setDayMeals([]);
      }

      // Get completion status for the plan day
      const completionRes = await nutritionAPI.getDayCompletionStatus(currentPlan.id, planDay);
      if (completionRes.status === 'fulfilled') {
        setCompletionStatus(completionRes.value.data);
      }
      
    } catch (error) {
      console.error('❌ Nutrition: Error loading day data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  const handleSubscriptionRenew = () => {
    console.log('🔄 Nutrition: Navigating to subscription renewal page');
    setShowBlurOverlay(false);
    if (onSubscriptionRenew) {
      onSubscriptionRenew();
    }
  };

  // Meal interaction functions
  const handleMealLike = async (mealId) => {
    try {
      const currentInteraction = mealInteractions[mealId];
      
      if (currentInteraction === 'like') {
        // Remove like
        await nutritionAPI.removeMealInteraction(mealId);
        setMealInteractions(prev => ({ ...prev, [mealId]: null }));
        Toast.show({
          type: 'success',
          text1: 'Like supprimé',
          text2: 'Votre like a été retiré'
        });
      } else {
        // Add like
        await nutritionAPI.likeMeal(mealId);
        setMealInteractions(prev => ({ ...prev, [mealId]: 'like' }));
        Toast.show({
          type: 'success',
          text1: 'Repas aimé',
          text2: 'Merci pour votre retour!'
        });
      }
    } catch (error) {
      console.error('❌ Nutrition: Error handling meal like:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de sauvegarder votre choix'
      });
    }
  };

  const handleMealDislike = async (mealId) => {
    try {
      const currentInteraction = mealInteractions[mealId];
      
      if (currentInteraction === 'dislike') {
        // Remove dislike
        await nutritionAPI.removeMealInteraction(mealId);
        setMealInteractions(prev => ({ ...prev, [mealId]: null }));
        Toast.show({
          type: 'success',
          text1: 'Dislike supprimé',
          text2: 'Votre dislike a été retiré'
        });
      } else {
        // Add dislike
        await nutritionAPI.dislikeMeal(mealId);
        setMealInteractions(prev => ({ ...prev, [mealId]: 'dislike' }));
        Toast.show({
          type: 'success',
          text1: 'Repas non aimé',
          text2: 'Merci pour votre retour!'
        });
      }
    } catch (error) {
      console.error('❌ Nutrition: Error handling meal dislike:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de sauvegarder votre choix'
      });
    }
  };

  const handleMealComplete = async (mealId) => {
    try {
      await nutritionAPI.completeMeal(mealId);
      Toast.show({
        type: 'success',
        text1: 'Repas terminé',
        text2: 'Félicitations!'
      });
      
      // Refresh completion status
      if (currentPlan?.id) {
        loadDayData();
      }
    } catch (error) {
      console.error('❌ Nutrition: Error completing meal:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de marquer le repas comme terminé'
      });
    }
  };

  const handleMealFeedback = (meal) => {
    setSelectedMealForFeedback(meal);
    setFeedbackText('');
    setFeedbackRating(5);
    setShowFeedbackModal(true);
  };

  const submitMealFeedback = async () => {
    if (!selectedMealForFeedback) return;
    
    try {
      await nutritionAPI.submitMealFeedback(selectedMealForFeedback.id, {
        feedback: feedbackText,
        rating: feedbackRating,
        suggestions: feedbackText // Using feedback as suggestions for now
      });
      
      Toast.show({
        type: 'success',
        text1: 'Feedback envoyé',
        text2: 'Merci pour votre retour détaillé!'
      });
      
      setShowFeedbackModal(false);
      setSelectedMealForFeedback(null);
    } catch (error) {
      console.error('❌ Nutrition: Error submitting feedback:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible d\'envoyer votre feedback'
      });
    }
  };

  // Check if a date is outside subscription coverage
  const isDateOutsideSubscription = (date) => {
    if (!subscriptionData) {
      console.log('🗓️ No subscription data available');
      return false;
    }
    
    console.log('🗓️ Full subscription data:', JSON.stringify(subscriptionData, null, 2));
    
    // If subscription is EXPIRED or INACTIVE, all dates are outside
    if (subscriptionData.status === 'EXPIRED' || subscriptionData.status === 'INACTIVE') {
      console.log('🗓️ Date outside: Subscription is EXPIRED/INACTIVE');
      return true;
    }
    
    // Check if date is after subscription end date
    // endDate might be in subscriptionData.endDate or subscriptionData.subscription.endDate
    const endDateString = subscriptionData.endDate || subscriptionData.subscription?.endDate;
    
    if (endDateString) {
      console.log('🗓️ End date string from API:', endDateString);
      
      const endDate = new Date(endDateString);
      endDate.setHours(23, 59, 59, 999); // End of day
      
      const dateToCheck = new Date(date);
      dateToCheck.setHours(0, 0, 0, 0); // Start of day
      
      const isOutside = dateToCheck > endDate;
      console.log(`🗓️ Checking date ${dateToCheck.toISOString()} (${dateToCheck.toDateString()}) vs end date ${endDate.toISOString()} (${endDate.toDateString()}): ${isOutside ? 'OUTSIDE ❌' : 'INSIDE ✅'}`);
      
      if (isOutside) {
        return true;
      }
    } else {
      console.log('🗓️ No end date found in subscription data');
    }
    
    return false;
  };

  // Generate week days centered around current date
  const generateWeekDays = () => {
    const weekDays = [];
    const today = new Date();
    
    // Generate 7 days starting from 3 days before today
    for (let i = -3; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      weekDays.push({
        number: date.getDate(),
        day: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][date.getDay()],
        dayOfWeek: date.getDay() || 7, // Convert Sunday (0) to 7
        date: date,
        isToday: date.toDateString() === today.toDateString(),
        isOutsideSubscription: isDateOutsideSubscription(date)
      });
    }
    return weekDays;
  };

  // Recalculate weekDays whenever subscriptionData changes
  const weekDays = useMemo(() => generateWeekDays(), [subscriptionData]);

  const formatDate = (date) => {
    const months = [
      'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
      'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'
    ];
    
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    
    return `${days[date.getDay()]}, ${date.getDate()}-${months[date.getMonth()]}-${date.getFullYear()}`;
  };

  // Function to sort meals by type in correct order
  const sortMealsByType = (meals) => {
    const typeOrder = ['breakfast', 'lunch', 'dinner', 'snack'];
    return meals.sort((a, b) => {
      return typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
    });
  };

  const renderMealCard = (meal) => {
    const mealType = mealTypeMap[meal.type] || mealTypeMap.breakfast;
    const isCompleted = completionStatus?.dayProgress?.completedMealIds?.includes(meal.id);
    const interaction = mealInteractions[meal.id];
    const isSelected = selectedMeal?.id === meal.id;
    
    console.log(`🥗 Rendering meal card for: ${meal.name} (${meal.type})`);
    console.log(`🥗 Meal imageUrl: ${meal.imageUrl}`);
    
    return (
      <TouchableOpacity 
        key={meal.id} 
        style={[
          styles.mealCard, 
          { backgroundColor: mealType.bg },
          isSelected && styles.selectedMealCard
        ]}
        onPress={() => setSelectedMeal(meal)}
      >
        <View style={styles.mealContent}>
          {/* Meal Image - Left thumbnail */}
          <View style={styles.mealCardImageContainer}>
            {meal.imageUrl ? (
              <Image 
                source={{ uri: meal.imageUrl }}
                style={styles.mealCardImage}
                resizeMode="cover"
                onError={(error) => console.log('❌ Image load error:', error)}
                onLoad={() => console.log('✅ Image loaded successfully')}
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.placeholderText}>🍽️</Text>
              </View>
            )}
          </View>
          
          {/* Meal Info - Center */}
          <View style={styles.mealInfo}>
            <View style={styles.mealHeader}>
              <Text style={styles.mealTypeTitle}>{mealType.title}</Text>
              <Text style={styles.mealName}>{meal.name || 'Aucun plat'}</Text>
              {mealType.time && (
                <Text style={styles.mealTime}>{mealType.time}</Text>
              )}
            </View>
          </View>

          {/* Icon and Status - Right */}
          <View style={styles.mealRightSection}>
            <Text style={styles.mealIcon}>{mealType.icon}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMealPreviewCard = () => {
    if (!selectedMeal) {
      return (
        <View style={styles.mealPreviewCard}>
          <View style={styles.emptyPreviewContainer}>
            <Text style={styles.emptyPreviewIcon}>🍽️</Text>
            <Text style={styles.emptyPreviewTitle}>Sélectionnez un repas</Text>
            <Text style={styles.emptyPreviewSubtitle}>
              Choisissez un repas dans la liste ci-dessous pour voir les détails
            </Text>
          </View>
        </View>
      );
    }

    const mealType = mealTypeMap[selectedMeal.type] || mealTypeMap.breakfast;
    const isCompleted = completionStatus?.mealStatus?.[selectedMeal.id]?.completed;
    const interaction = mealInteractions[selectedMeal.id];

    return (
      <View style={styles.mealPreviewCard}>
        {/* Header Section */}
        <View style={styles.mealPreviewHeader}>
          <View style={styles.mealPreviewTitleRow}>
            <Text style={styles.mealPreviewTitle}>{selectedMeal.name}</Text>
            <Text style={styles.mealPreviewType}>{mealType.title}</Text>
          </View>
          <Text style={styles.mealPreviewTime}>{mealType.time}</Text>
          
          {/* Interaction Buttons */}
          <View style={styles.headerInteractionButtons}>
            <TouchableOpacity 
              style={[styles.headerInteractionButton, interaction === 'like' && styles.activeHeaderInteractionButton]}
              onPress={() => handleMealLike(selectedMeal.id)}
            >
              <Ionicons 
                name="thumbs-up-outline" 
                size={22} 
                color={interaction === 'like' ? '#1877F2' : '#8E8E93'} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.headerInteractionButton, interaction === 'dislike' && styles.activeHeaderInteractionButton]}
              onPress={() => handleMealDislike(selectedMeal.id)}
            >
              <Ionicons 
                name="thumbs-down-outline" 
                size={22} 
                color={interaction === 'dislike' ? '#FF3B30' : '#8E8E93'} 
              />
            </TouchableOpacity>
          </View>

        </View>

        {/* Meal Image and Video Overlay */}
        {selectedMeal.imageUrl && (
          <View style={styles.mealImageContainer}>
            <Image 
              source={{ uri: selectedMeal.imageUrl }}
              style={styles.mealImage}
              resizeMode="cover"
            />
            
            {/* Video Button Overlay */}
            {selectedMeal.youtubeUrl && (
              <TouchableOpacity 
                style={styles.videoButton}
                onPress={() => {
                  if (selectedMeal.youtubeUrl) {
                    Linking.openURL(selectedMeal.youtubeUrl)
                      .catch(err => {
                        console.error('Failed to open YouTube URL:', err);
                        Toast.show({
                          type: 'error',
                          text1: 'Erreur',
                          text2: 'Impossible d\'ouvrir la vidéo'
                        });
                      });
                  }
                }}
              >
                <Ionicons name="play" size={20} color="#FFFFFF" />
                <Text style={styles.videoButtonText}>Voir la vidéo de la recette</Text>
              </TouchableOpacity>
            )}
            
            {/* Image Icon */}
            <View style={styles.imageIcon}>
              <Ionicons name="images" size={16} color={theme.colors.primary} />
            </View>
          </View>
        )}

        {/* Completion Button */}
        <TouchableOpacity 
          style={[styles.completeButton, isCompleted && styles.completedButtonStyle]}
          onPress={() => handleMealComplete(selectedMeal.id)}
        >
          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          <Text style={styles.completeButtonText}>
            {isCompleted ? 'Complété' : 'Marquer comme complété'}
          </Text>
        </TouchableOpacity>

        {/* Navigation Tabs and Interaction Buttons */}
        <View style={styles.mealTabsContainer}>
          {/* Left Side - Navigation Tabs */}
          <View style={styles.mealTabs}>
            <TouchableOpacity 
              style={[styles.mealTab, activeMealTab === 'composition' && styles.activeMealTab]}
              onPress={() => setActiveMealTab('composition')}
            >
              <Ionicons 
                name="nutrition" 
                size={20} 
                color={activeMealTab === 'composition' ? "#000000" : "#666666"} 
              />
              {activeMealTab === 'composition' && (
                <Text style={styles.tabTitle}>Composition</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.mealTab, activeMealTab === 'recipe' && styles.activeMealTab]}
              onPress={() => setActiveMealTab('recipe')}
            >
              <Ionicons 
                name="restaurant" 
                size={20} 
                color={activeMealTab === 'recipe' ? "#000000" : "#666666"} 
              />
              {activeMealTab === 'recipe' && (
                <Text style={styles.tabTitle}>Instructions</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.mealTab, activeMealTab === 'ingredients' && styles.activeMealTab]}
              onPress={() => setActiveMealTab('ingredients')}
            >
              <Ionicons 
                name="list" 
                size={20} 
                color={activeMealTab === 'ingredients' ? "#000000" : "#666666"} 
              />
              {activeMealTab === 'ingredients' && (
                <Text style={styles.tabTitle}>Ingrédients</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Content based on active tab */}
        {activeMealTab === 'composition' ? (
          /* Composition Content */
          <View style={styles.compositionContent}>
            <Text style={styles.contentTitle}>Composition nutritionnelle</Text>
            <View style={styles.mockDataContent}>
              <Text style={styles.mockDataText}>
                • Riche en fibres alimentaires
              </Text>
              <Text style={styles.mockDataText}>
                • Source de potassium et magnésium
              </Text>
              <Text style={styles.mockDataText}>
                • Contient des vitamines B6 et C
              </Text>
              <Text style={styles.mockDataText}>
                • Faible en sodium
              </Text>
              <Text style={styles.mockDataText}>
                • Antioxydants naturels présents
              </Text>
            </View>
          </View>
        ) : activeMealTab === 'recipe' ? (
          /* Recipe Content */
          <View style={styles.recipeContent}>
            <Text style={styles.contentTitle}>Instructions de préparation</Text>
            {selectedMeal.instructions && selectedMeal.instructions.length > 0 ? (
              (() => {
                // Parse instructions - they come as string array from API
                let instructions = selectedMeal.instructions;
                if (typeof instructions === 'string') {
                  try {
                    instructions = JSON.parse(instructions);
                  } catch (e) {
                    instructions = [instructions];
                  }
                }
                return instructions.map((instruction, index) => (
                  <Text key={index} style={styles.recipeStep}>
                    {index + 1}. {instruction}
                  </Text>
                ));
              })()
            ) : (
              <Text style={styles.noContentText}>
                Aucune instruction disponible pour ce repas
              </Text>
            )}
          </View>
        ) : (
          /* Ingredients Content */
          <View style={styles.ingredientsContent}>
            <Text style={styles.contentTitle}>Liste des ingrédients</Text>
            {(() => {
              // Parse ingredients from API format
              let ingredients = selectedMeal.ingredients;
              if (typeof ingredients === 'string') {
                try {
                  ingredients = JSON.parse(ingredients);
                } catch (e) {
                  console.error('❌ Error parsing ingredients:', e);
                  ingredients = [];
                }
              }
              
              return ingredients && ingredients.length > 0 ? (
                ingredients.map((ingredient, index) => (
                  <View key={index} style={styles.ingredientItem}>
                    <Text style={styles.ingredientNumber}>{index + 1}.</Text>
                    {ingredient.amount && ingredient.unit && (
                      <Text style={styles.ingredientAmount}>
                        {ingredient.amount} {ingredient.unit}
                      </Text>
                    )}
                    <Text style={styles.ingredientText}>
                      {ingredient.name || ingredient}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noContentText}>
                  Aucun ingrédient disponible pour ce repas
                </Text>
              );
            })()}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement des menus...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Menus</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.helpButton}>
            <Ionicons name="help-circle-outline" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={theme.colors.text.primary} />
            <NotificationBadge />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.profileButton} onPress={() => onTabPress ? onTabPress('settings') : null}>
            <Avatar 
              source={{ uri: profileData?.avatar || user?.avatar }} 
              size={40}
              style={styles.profileImage}
              fallbackText={user?.firstName?.charAt(0) || user?.name?.charAt(0)}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Subscription Banner */}
      <SubscriptionBanner 
        subscriptionData={subscriptionData}
        onRenew={handleSubscriptionRenew}
      />

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Menu du jour section */}
        <View style={styles.menuHeader}>
          <View style={styles.menuTitleRow}>
            <Text style={styles.menuIcon}>🍽️</Text>
            <Text style={styles.menuTitle}>Menu du jour</Text>
            <Text style={styles.menuDate}>{formatDate(currentDate)}</Text>
          </View>
        </View>

        {/* Current Phase */}
        <View style={styles.phaseCard}>
          <Text style={styles.phaseText}>
            Phase actuelle: {profileData?.currentPhase || 'Test'}
          </Text>
        </View>

        {/* Week Calendar */}
        <View style={styles.calendarContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.calendarContent}
            initialScrollIndex={3}
          >
            {weekDays.map((day) => (
              <TouchableOpacity
                key={day.number + '-' + day.dayOfWeek}
                style={[
                  styles.calendarDay,
                  day.isToday && styles.todayDay,
                  selectedDate === day.number && styles.selectedDay,
                  day.isOutsideSubscription && styles.outsideSubscriptionDay
                ]}
                onPress={() => {
                  if (day.isOutsideSubscription) {
                    // Show alert for dates outside subscription
                    Alert.alert(
                      '⚠️ Hors Abonnement',
                      'Cette date est en dehors de votre période d\'abonnement. Renouvelez votre abonnement pour accéder aux menus.',
                      [
                        { text: 'Annuler', style: 'cancel' },
                        { 
                          text: 'Renouveler', 
                          onPress: () => {
                            if (onSubscriptionRenew) {
                              onSubscriptionRenew();
                            }
                          }
                        }
                      ]
                    );
                  } else {
                    setSelectedDate(day.number);
                    setSelectedDay(day.dayOfWeek);
                  }
                }}
              >
                <Text style={[
                  styles.dayNumber,
                  day.isToday && styles.todayDayNumber,
                  selectedDate === day.number && styles.selectedDayNumber,
                  day.isOutsideSubscription && styles.outsideSubscriptionText
                ]}>
                  {day.number}
                </Text>
                <Text style={[
                  styles.dayName,
                  day.isToday && styles.todayDayName,
                  selectedDate === day.number && styles.selectedDayName,
                  day.isOutsideSubscription && styles.outsideSubscriptionText
                ]}>
                  {day.day}
                </Text>
                {day.isOutsideSubscription && (
                  <Ionicons 
                    name="warning" 
                    size={12} 
                    color="#F44336" 
                    style={styles.warningIcon}
                  />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Meal Preview Card */}
        {renderMealPreviewCard()}

        {/* Meals List */}
        <View style={styles.mealsContainer}>
          <Text style={styles.mealsSectionTitle}>Repas disponibles</Text>
          {dayMeals.length > 0 ? (
            sortMealsByType(dayMeals).map((meal) => renderMealCard(meal))
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateIcon}>🍽️</Text>
              <Text style={styles.emptyStateTitle}>Aucun repas planifié</Text>
              <Text style={styles.emptyStateSubtitle}>
                Pas de repas prévus pour ce jour
              </Text>
              <Text style={styles.debugText}>Debug: Selected day: {selectedDay}, Meals count: {dayMeals.length}</Text>
              </View>
          )}
              </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab={activeTab} 
        onTabPress={onTabPress} 
      />

      {/* Feedback Modal */}
      <Modal
        visible={showFeedbackModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFeedbackModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Feedback sur le repas</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowFeedbackModal(false)}
              >
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

            {selectedMealForFeedback && (
              <View style={styles.modalBody}>
                <Text style={styles.modalMealName}>{selectedMealForFeedback.name}</Text>
                
                <View style={styles.ratingContainer}>
                  <Text style={styles.ratingLabel}>Note:</Text>
                  <View style={styles.starRating}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        onPress={() => setFeedbackRating(star)}
                      >
                        <Ionicons 
                          name={star <= feedbackRating ? "star" : "star-outline"} 
                          size={24} 
                          color="#FFD700" 
                        />
              </TouchableOpacity>
                    ))}
            </View>
          </View>

                <TextInput
                  style={styles.feedbackInput}
                  placeholder="Votre avis sur ce repas..."
                  multiline
                  numberOfLines={4}
                  value={feedbackText}
                  onChangeText={setFeedbackText}
                />
                
                <TouchableOpacity 
                  style={styles.submitFeedbackButton}
                  onPress={submitMealFeedback}
                >
                  <Text style={styles.submitFeedbackButtonText}>Envoyer le feedback</Text>
                </TouchableOpacity>
                    </View>
                      )}
                    </View>
                    </View>
      </Modal>

      {/* Blur Overlay for Expired Subscription */}
      <BlurOverlay
        visible={showBlurOverlay}
        onRenew={handleSubscriptionRenew}
      />
      
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  helpButton: {
    padding: 4,
  },
  notificationButton: {
    position: 'relative',
    padding: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  profileButton: {
    padding: 2,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  menuHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 16,
  },
  menuTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginRight: 16,
  },
  menuDate: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  phaseCard: {
    backgroundColor: '#E1BEE7',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  phaseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7B1FA2',
    textAlign: 'left',
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  calendarContent: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDay: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginHorizontal: 6,
    borderRadius: 12,
    minWidth: 65,
    flex: 1,
  },
  todayDay: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  selectedDay: {
    backgroundColor: '#7B1FA2',
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  todayDayNumber: {
    color: '#2196F3',
  },
  selectedDayNumber: {
    color: '#FFFFFF',
  },
  dayName: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  todayDayName: {
    color: '#2196F3',
  },
  selectedDayName: {
    color: '#FFFFFF',
  },
  outsideSubscriptionDay: {
    backgroundColor: '#FFEBEE',
    borderWidth: 2,
    borderColor: '#F44336',
    opacity: 0.7,
  },
  outsideSubscriptionText: {
    color: '#F44336',
    fontWeight: '600',
  },
  warningIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  completionStatusCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  completionStatusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  completionProgress: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  mealsContainer: {
    paddingHorizontal: 20,
  },
  mealsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  mealCard: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedMealCard: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  mealContent: {
    flexDirection: 'row',
    height: 80,
  },
  mealCardImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    margin: 0,
    overflow: 'hidden',
  },
  mealCardImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 32,
    color: '#CCCCCC',
  },
  mealInfo: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'space-between',
  },
  mealHeader: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    height: '100%',
  },
  mealTypeTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  mealName: {
    fontSize: 16,
    color: '#000000',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  mealTime: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
  },
  mealRightSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  mealIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  mealDetails: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  mealTime: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  mealNutritionInfo: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  nutritionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nutritionValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  mealActions: {
    alignItems: 'center',
  },
  completedButton: {
    marginBottom: 8,
  },
  interactionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  interactionButton: {
    padding: 12,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  activeInteractionButton: {
    backgroundColor: '#E3F2FD',
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  debugText: {
    fontSize: 12,
    color: '#FF6B35',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalMealName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 20,
  },
  ratingContainer: {
    marginBottom: 20,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  starRating: {
    flexDirection: 'row',
    gap: 8,
  },
  feedbackInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: theme.colors.text.primary,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  submitFeedbackButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitFeedbackButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Meal Preview Card styles
  mealPreviewCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyPreviewContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyPreviewIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyPreviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  emptyPreviewSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  mealPreviewHeader: {
    marginBottom: 16,
  },
  mealPreviewTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealPreviewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginRight: 8,
  },
  mealPreviewType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  mealPreviewTime: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  nutritionalInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 0,
  },
  nutritionalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  nutritionalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  completeButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 24,
    gap: 8,
  },
  completedButtonStyle: {
    backgroundColor: '#4CAF50',
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mealImageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  mealImage: {
    width: '100%',
    height: '100%',
  },
  videoButton: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  videoButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  imageIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 5,
  },
  mealTabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mealTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mealTab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
    flexDirection: 'column',
  },
  tabTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    marginTop: 4,
  },
  activeMealTab: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  activeMealTabText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  mealTabText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  recipeContent: {
    marginTop: 10,
  },
  recipeStep: {
    fontSize: 14,
    color: theme.colors.text.primary,
    lineHeight: 22,
    marginBottom: 8,
  },
  ingredientsContent: {
    marginTop: 10,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 6,
    gap: 8,
  },
  ingredientText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  ingredientAmount: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '600',
    backgroundColor: '#E9ECEF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  noIngredientsText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  compositionContent: {
    marginTop: 10,
  },
  noContentText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  headerInteractionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  headerInteractionButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
    minHeight: 36,
  },
  activeHeaderInteractionButton: {
    backgroundColor: '#E3F2FD',
  },
  mockDataContent: {
    marginTop: 8,
  },
  mockDataText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    lineHeight: 22,
    marginBottom: 6,
  },
  ingredientNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginRight: 8,
    minWidth: 20,
  },
});

export default NutritionScreen; 