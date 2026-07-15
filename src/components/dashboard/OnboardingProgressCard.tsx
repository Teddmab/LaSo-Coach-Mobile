import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

// Onboarding steps configuration
const ONBOARDING_STEPS = [
  {
    key: 'profile_setup',
    label: 'Mon Profil',
    points: 100,
    route: 'ProfileSetup',
    icon: 'person-outline',
    description: 'Complétez votre profil',
  },
  {
    key: 'goals_setup',
    label: 'Mes Objectifs',
    points: 30,
    route: 'GoalsSetup',
    icon: 'flag-outline',
    description: 'Définissez vos objectifs',
  },
  {
    key: 'recommendations',
    label: 'Recommandations',
    points: 20,
    route: 'Recommendations',
    icon: 'bulb-outline',
    description: 'Découvrez vos recommandations',
  },
  {
    key: 'rendezvous',
    label: 'Rendez-vous',
    points: 25,
    route: 'Rendezvous',
    icon: 'calendar-outline',
    description: 'Planifiez votre rendez-vous',
  },
];

const OnboardingProgressCard = ({ progress, navigation }) => {
  // Safety check for progress data
  const completedSteps = progress?.completedSteps || [];
  const currentStep = progress?.currentStep || 'profile_setup';

  // DEBUG: Log the progress data

  // Calculate which steps are completed, current, or upcoming
  const getStepState = (stepKey) => {
    if (completedSteps.includes(stepKey)) {
      return 'completed';
    }
    if (currentStep === stepKey) {
      return 'current';
    }
    return 'upcoming';
  };

  // Handle step click
  const handleStepClick = (step) => {
    const stepIndex = ONBOARDING_STEPS.findIndex(s => s.key === step.key);
    const allPreviousCompleted = ONBOARDING_STEPS
      .slice(0, stepIndex)
      .every(s => completedSteps.includes(s.key));

    // Only profile_setup can be locked if previous steps aren't done
    // For this flow, all steps are clickable except if they require profile_setup
    if (stepIndex > 0 && !completedSteps.includes('profile_setup')) {
      // Show alert that profile must be completed first
      return;
    }

    // Navigate to the step
    if (navigation && step.route) {
      navigation.navigate(step.route);
    }
  };

  // ✅ MODIFICATION: Calculate total points COLLECTED (from completed steps)
  const totalPointsCollected = ONBOARDING_STEPS
    .filter(step => {
      const stepKey = step.key;
      return completedSteps.includes(stepKey);
    })
    .reduce((sum, step) => sum + step.points, 0);

  // Get current step for points display
  const currentStepData = ONBOARDING_STEPS.find(s => s.key === currentStep);

  // ✅ Calculer la largeur pour forcer 2x2 sur tous les écrans (même Z Fold)
  const screenWidth = Dimensions.get('window').width;
  const containerMargin = 32; // marginHorizontal 16 * 2
  const containerPadding = 40; // padding 20 * 2
  const gap = 8; // gap entre les cartes
  // Largeur disponible = largeur écran - marges conteneur - padding conteneur - gap entre cartes
  const availableWidth = screenWidth - containerMargin - containerPadding - gap;
  const stepWrapperWidth = Math.floor(availableWidth / 2);

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>Complétez votre profil</Text>
      <Text style={styles.subtitle}>
        Terminez les 4 étapes pour activer votre coaching personnalisé.
      </Text>

      {/* Steps Row */}
      <View style={styles.stepsContainer}>
        {ONBOARDING_STEPS.map((step, index) => {
          const state = getStepState(step.key);
          
          return (
            <TouchableOpacity
              key={step.key}
              style={styles.stepWrapper}
              onPress={() => handleStepClick(step)}
              activeOpacity={0.7}
            >
              {/* Step Circle with Icon */}
              <View
                style={[
                  styles.stepCircle,
                  state === 'completed' && styles.stepCircleCompleted,
                  state === 'current' && styles.stepCircleCurrent,
                  state === 'upcoming' && styles.stepCircleUpcoming,
                ]}
              >
                {state === 'completed' ? (
                  <Ionicons name="checkmark" size={20} color="#FFF" />
                ) : (
                  <Ionicons
                    name={step.icon as any}
                    size={20}
                    color={
                      state === 'current'
                        ? theme.colors.primary
                        : '#9CA3AF'
                    }
                  />
                )}
              </View>

              {/* Step Number (Étape X/4) */}
              <Text
                style={[
                  styles.stepNumber,
                  state === 'upcoming' && styles.stepNumberUpcoming,
                ]}
              >
                Étape {index + 1}/4
              </Text>

              {/* Step Label */}
              <Text
                style={[
                  styles.stepLabel,
                  state === 'upcoming' && styles.stepLabelUpcoming,
                ]}
                numberOfLines={2}
              >
                {step.label}
              </Text>

              {/* Points Badge */}
              <View
                style={[
                  styles.pointsBadge,
                  state === 'completed' && styles.pointsBadgeCompleted,
                ]}
              >
                <Text style={styles.pointsText}>+{step.points} pts</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Total Points Display */}
      <View style={styles.totalPointsContainer}>
        <Text style={styles.totalPointsText}>
          {totalPointsCollected} points collectés
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFD6D6',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C340E',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#2C340E',
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.8,
  },
  stepsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Permettre le wrap pour 2x2
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 8, // Espacement entre les éléments
  },
  stepWrapper: {
    alignItems: 'center',
    // Forcer la largeur exacte pour 2x2
    flexBasis: '48%',
    maxWidth: '48%',
    paddingHorizontal: 4,
    marginBottom: 12, // Espacement vertical entre les lignes
  },
  stepCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
  },
  stepCircleCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  stepCircleCurrent: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#2C340E',
  },
  stepCircleUpcoming: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    opacity: 0.6,
  },
  stepNumber: {
    fontSize: 9,
    fontWeight: '700',
    color: '#2C340E',
    textAlign: 'center',
    marginBottom: 2,
    opacity: 0.8,
  },
  stepNumberUpcoming: {
    opacity: 0.5,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2C340E',
    textAlign: 'center',
    marginBottom: 6,
    minHeight: 28,
  },
  stepLabelUpcoming: {
    opacity: 0.6,
  },
  pointsBadge: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pointsBadgeCompleted: {
    backgroundColor: '#D1FAE5',
    borderColor: '#6EE7B7',
  },
  pointsText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  totalPointsContainer: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
  },
  totalPointsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
  },
});

export default OnboardingProgressCard;
