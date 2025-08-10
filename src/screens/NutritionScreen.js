import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Image,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';
import BlurOverlay from '../components/BlurOverlay';
import SubscriptionBanner from '../components/SubscriptionBanner';
import SubscriptionService from '../services/subscriptionService';

const NutritionScreen = ({ user, onLogout, onTabPress, activeTab, onSubscriptionRenew }) => {
  const [selectedDate, setSelectedDate] = useState(18); // Friday 18th
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [showBlurOverlay, setShowBlurOverlay] = useState(false);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      console.log('💳 Nutrition: Checking subscription status...');
      const data = await SubscriptionService.getSubscriptionStatus();
      setSubscriptionData(data);
      
      if (data.requiresRenewal) {
        setShowBlurOverlay(true);
      }
      
    } catch (error) {
      console.error('❌ Nutrition: Error checking subscription status:', error);
      // Default to expired status on error
      setSubscriptionData({
        status: 'EXPIRED',
        isExpired: true,
        requiresRenewal: true
      });
      setShowBlurOverlay(true);
    }
  };

  const handleSubscriptionRenew = () => {
    console.log('🔄 Nutrition: Navigating to subscription renewal page');
    setShowBlurOverlay(false);
    if (onSubscriptionRenew) {
      onSubscriptionRenew();
    }
  };

  // Generate week days around the selected date
  const weekDays = [
    { number: 16, day: 'Mer' },
    { number: 17, day: 'Jeu' },
    { number: 18, day: 'Ven' },
    { number: 19, day: 'Sam' },
    { number: 20, day: 'Dim' },
    { number: 21, day: 'Lun' },
    { number: 22, day: 'Mar' },
  ];

  const meals = [
    {
      id: 'breakfast',
      title: 'Petit-Déj',
      subtitle: 'Aucun plat',
      timeRange: 'entre 7h30-9h00',
      icon: '☀️',
      backgroundColor: '#F5F5F5'
    },
    {
      id: 'lunch',
      title: 'Déjeuner',
      subtitle: 'Aucun plat',
      timeRange: 'entre 12h00-14h00',
      icon: '🥘',
      backgroundColor: '#F5F5F5'
    },
    {
      id: 'dinner',
      title: 'Souper',
      subtitle: 'Aucun plat',
      timeRange: 'entre 19h00-21h00',
      icon: '🌙',
      backgroundColor: '#F5F5F5'
    },
    {
      id: 'bonus',
      title: 'Bonus',
      subtitle: 'Aucun plat',
      timeRange: '',
      icon: '⭐',
      backgroundColor: '#FFF9E6',
      isSpecial: true
    }
  ];

  const formatDate = (dateNum) => {
    const months = [
      'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ];
    
    const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    
    // For demo, assuming July 2025 and Friday for 18th
    return `vendredi ${dateNum} juillet 2025`;
  };

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
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>6</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.profileButton} onPress={() => onTabPress ? onTabPress('settings') : null}>
            <Image 
              source={{ uri: user?.avatar || 'https://via.placeholder.com/40' }} 
              style={styles.profileImage}
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
      >
        {/* Menu du jour section */}
        <View style={styles.menuHeader}>
          <View style={styles.menuTitleRow}>
            <Text style={styles.menuIcon}>🍽️</Text>
            <Text style={styles.menuTitle}>Menu du jour</Text>
            <Text style={styles.menuDate}>{formatDate(selectedDate)}</Text>
          </View>
        </View>

        {/* Current Phase */}
        <View style={styles.phaseCard}>
          <Text style={styles.phaseText}>Phase actuelle: Test</Text>
        </View>

        {/* Week Calendar */}
        <View style={styles.calendarContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.calendarContent}
          >
            {weekDays.map((day) => (
              <TouchableOpacity
                key={day.number}
                style={[
                  styles.calendarDay,
                  selectedDate === day.number && styles.selectedDay
                ]}
                onPress={() => setSelectedDate(day.number)}
              >
                <Text style={[
                  styles.dayNumber,
                  selectedDate === day.number && styles.selectedDayNumber
                ]}>
                  {day.number}
                </Text>
                <Text style={[
                  styles.dayName,
                  selectedDate === day.number && styles.selectedDayName
                ]}>
                  {day.day}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Meal Preview Card */}
        <View style={styles.mealPreviewCard}>
          {/* Header Section */}
          <View style={styles.mealPreviewHeader}>
            <View style={styles.mealPreviewTitleRow}>
              <Text style={styles.mealPreviewTitle}>Boiled Plantain with Egg Sauce</Text>
            </View>
            <Text style={styles.mealPreviewTime}>entre 7h30-9h00</Text>
            
            {/* Nutritional Information */}
            <View style={styles.nutritionalInfo}>
              <View style={styles.nutritionalItem}>
                <Ionicons name="flame" size={16} color="#FF6B35" />
                <Text style={styles.nutritionalValue}>400 kcal</Text>
              </View>
              <View style={styles.nutritionalItem}>
                <Ionicons name="fitness" size={16} color="#4CAF50" />
                <Text style={styles.nutritionalValue}>20g</Text>
              </View>
              <View style={styles.nutritionalItem}>
                <Ionicons name="leaf" size={16} color="#8BC34A" />
                <Text style={styles.nutritionalValue}>50g</Text>
              </View>
              <View style={styles.nutritionalItem}>
                <Ionicons name="water" size={16} color="#FFC107" />
                <Text style={styles.nutritionalValue}>15g</Text>
              </View>
            </View>
          </View>

          {/* Meal Image and Video Overlay */}
          <View style={styles.mealImageContainer}>
            <Image 
              source={{ uri: 'https://via.placeholder.com/400x250/FFD700/FFFFFF?text=Boiled+Plantain+with+Egg+Sauce' }}
              style={styles.mealImage}
              resizeMode="cover"
            />
            
            {/* Video Button Overlay */}
            <TouchableOpacity style={styles.videoButton}>
              <Ionicons name="play" size={20} color="#FFFFFF" />
              <Text style={styles.videoButtonText}>Voir la vidéo de la recette</Text>
            </TouchableOpacity>
            
            {/* Image Icon */}
            <View style={styles.imageIcon}>
              <Ionicons name="images" size={16} color={theme.colors.primary} />
            </View>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.mealTabs}>
            <TouchableOpacity style={[styles.mealTab, styles.activeMealTab]}>
              <Text style={[styles.mealTabText, styles.activeMealTabText]}>Recette</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mealTab}>
              <Text style={styles.mealTabText}>Liste de course</Text>
            </TouchableOpacity>
            
            {/* Interaction Buttons */}
            <View style={styles.interactionButtons}>
              <TouchableOpacity style={styles.interactionButton}>
                <Ionicons name="thumbs-up" size={20} color="#666666" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.interactionButton}>
                <Ionicons name="thumbs-down" size={20} color="#FF4444" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Recipe Content */}
          <View style={styles.recipeContent}>
            <Text style={styles.recipeStep}>1. Boil plantains. Prepare egg sauce with tomato and onion, then serve.</Text>
          </View>
        </View>

        {/* Meals List */}
        <View style={styles.mealsContainer}>
          {meals.map((meal) => (
            <TouchableOpacity key={meal.id} style={styles.mealCardContainer}>
              {meal.isSpecial ? (
                <LinearGradient
                  colors={['#E1BEE7', '#FFE082']}
                  style={styles.mealCardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={[styles.mealCard, { backgroundColor: 'transparent' }]}>
                    <View style={styles.mealIconContainer}>
                      <Text style={styles.mealEmoji}>{meal.icon}</Text>
                    </View>
                    
                    <View style={styles.mealContent}>
                      <Text style={styles.mealTitle}>{meal.title}</Text>
                      <Text style={styles.mealSubtitle}>{meal.subtitle}</Text>
                      {meal.timeRange && (
                        <Text style={styles.mealTime}>{meal.timeRange}</Text>
                      )}
                    </View>

                    <View style={styles.mealStatusIcon}>
                      <Text style={styles.statusEmoji}>{meal.icon}</Text>
                    </View>
                  </View>
                </LinearGradient>
              ) : (
                <View style={[styles.mealCard, { backgroundColor: meal.backgroundColor }]}>
                  <View style={styles.mealIconContainer}>
                    <Text style={styles.mealEmoji}>🍽️</Text>
                  </View>
                  
                  <View style={styles.mealContent}>
                    <Text style={styles.mealTitle}>{meal.title}</Text>
                    <Text style={styles.mealSubtitle}>{meal.subtitle}</Text>
                    {meal.timeRange && (
                      <Text style={styles.mealTime}>{meal.timeRange}</Text>
                    )}
                  </View>

                  <View style={styles.mealStatusIcon}>
                    <Text style={styles.statusEmoji}>{meal.icon}</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('home')}>
          <Ionicons name="home" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('progress')}>
          <Ionicons name="trending-up-outline" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('nutrition')}>
          <Ionicons name="restaurant" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('achievements')}>
          <Ionicons name="trophy-outline" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('more')}>
          <Ionicons name="add-outline" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Blur Overlay for Expired Subscription */}
      <BlurOverlay
        visible={showBlurOverlay}
        onRenew={handleSubscriptionRenew}
      />
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
  },
  calendarDay: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    minWidth: 60,
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
  selectedDayNumber: {
    color: '#FFFFFF',
  },
  dayName: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  selectedDayName: {
    color: '#FFFFFF',
  },
  mealsContainer: {
    paddingHorizontal: 20,
  },
  mealCardContainer: {
    marginBottom: 16,
  },
  mealCardGradient: {
    borderRadius: 16,
    padding: 2, // This creates the gradient border effect
  },
  mealCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mealIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  mealEmoji: {
    fontSize: 24,
  },
  mealContent: {
    flex: 1,
  },
  mealTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  mealSubtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  mealTime: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  mealStatusIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusEmoji: {
    fontSize: 20,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
  },
  activeNavTab: {
    backgroundColor: theme.colors.primaryLight,
  },
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
  },
  mealPreviewTime: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  nutritionalInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  nutritionalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nutritionalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
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
  mealTabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  mealTab: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeMealTab: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  activeMealTabText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  mealTabText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  interactionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  interactionButton: {
    padding: 8,
  },
  recipeContent: {
    marginTop: 10,
  },
  recipeStep: {
    fontSize: 14,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
});

export default NutritionScreen; 