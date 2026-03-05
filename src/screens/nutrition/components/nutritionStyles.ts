import { StyleSheet } from 'react-native';
import { theme } from '../../../constants/theme';

export const nutritionStyles = StyleSheet.create({
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
  phaseBanner: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  phaseText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '500',
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  calendarScrollHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
    marginBottom: 4,
    gap: 6,
  },
  calendarScrollHintTextContainer: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 4,
  },
  calendarScrollHintText: {
    fontSize: 12,
    color: '#999999',
    fontStyle: 'italic',
    paddingHorizontal: 4,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 80,
    backgroundColor: 'rgba(76, 175, 80, 0.3)', // ✅ Vert thème de l'application (#4CAF50 avec opacité)
    borderRadius: 4,
    // Gradient effect avec shadow
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 3,
  },
  calendarContent: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
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
    maxWidth: 80,
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
    opacity: 0.5,
  },
  outsideSubscriptionText: {
    color: '#F44336',
  },
  pastDay: {
    opacity: 0.4,
  },
  mealsContainer: {
    paddingHorizontal: 8, // ✅ Réduit encore plus pour des cartes plus larges (moins d'espace vide à gauche et à droite)
    marginBottom: 20,
  },
  mealsSectionHeader: {
    marginBottom: 16,
  },
  mealsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  mealCard: {
    position: 'relative',
    borderRadius: 16, // Coins plus arrondis comme dans le design
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 0, // Pas de bordure comme dans le design
    // Ombres retirées selon la demande
  },
  mealContent: {
    flexDirection: 'row',
    height: 80, // Hauteur originale du backup
    padding: 0,
  },
  mealCardImageContainer: {
    width: 80, // Taille originale du backup
    height: 80, // Taille originale du backup
    borderRadius: 0, // Pas de border radius pour que l'image colle au bord gauche
    margin: 0,
    overflow: 'hidden',
  },
  mealCardImage: {
    width: 80, // Taille originale du backup
    height: 80, // Taille originale du backup
    borderRadius: 0,
  },
  placeholderImage: {
    width: 80, // Taille originale du backup
    height: 80, // Taille originale du backup
    borderRadius: 0,
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
    paddingVertical: 12,
    justifyContent: 'flex-start',
  },
  mealHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: -1,
  },
  mealTypeTitle: {
    fontSize: 12, // ✅ Même taille que mealTime
    fontWeight: '400', // ✅ Même poids que mealTime
    color: '#666666', // ✅ Même couleur que mealTime
  },
  mealTime: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '400',
  },
  mealDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E0E0E0',
    marginBottom: 2,
    marginTop: 2,
  },
  mealNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  mealName: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
    lineHeight: 20,
    paddingTop: -2,
    minHeight: 14, // Hauteur minimale pour 2 lignes
    flex: 1, // Prend tout l'espace disponible
    marginRight: 8, // Espacement avant l'emoji
  },
  mealIcon: {
    fontSize: 24, // Taille ajustée pour correspondre au design du backup
  },
  selectedMealCard: {
    borderWidth: 2,
    borderColor: '#7B1FA2',
  },
  completedMealCard: {
    opacity: 0.6,
  },
  completedMealImage: {
    opacity: 0.5,
  },
  completedMealText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  completedMealDivider: {
    opacity: 0.3,
  },
  completedMealIcon: {
    opacity: 0.5,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 8, // Remonté pour être moins bas
    marginBottom: 12, // Réduit de 16 à 12
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressMealsCountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressMealsCountLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  progressMealsCountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  progressBarContainerFull: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarBackgroundFull: {
    flex: 1,
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressBarFillFull: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 6,
  },
  progressBarPercentageFull: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    minWidth: 45,
  },
  completeMealsButtonContainer: {
    paddingHorizontal: 20,
    marginTop: 4, // Remonté pour être moins bas
    marginBottom: 16, // Réduit de 20 à 16
  },
  completeMealsButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  completeMealsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  pastMealsButton: {
    backgroundColor: '#FF9800',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // ✅ Centrer le contenu
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8, // ✅ Espacement entre les icônes et le texte
  },
  pastMealsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
});

