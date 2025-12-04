import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

const ProfileCompletionCard = ({ 
  onboardingData,
  onCompleteProfile,
  onStepPress,
  subscriptionData,
  onSubscriptionRenew
}) => {
  // Force re-render when onboarding data changes
  React.useEffect(() => {
    console.log('🎯 ProfileCompletionCard - Onboarding data changed:', {
      onboardingData,
      completedSteps: onboardingData?.data?.completedSteps,
      currentStep: onboardingData?.data?.currentStep
    });
  }, [onboardingData]);

  // Only 4 steps as per design
  const steps = [
    { id: 1, title: 'Mon Profil', points: 100 },
    { id: 2, title: 'Mes Objectifs', points: 30 },
    { id: 3, title: 'Recommandations', points: 20 },
    { id: 4, title: 'Rendez-vous', points: 25 }
  ];

  // Ensure we have valid onboarding data with fallbacks
  const onboardingDataSafe = onboardingData || {};
  const completedSteps = onboardingDataSafe?.data?.completedSteps || [];
  const currentStep = onboardingDataSafe?.data?.currentStep || 'profile_setup';

  // Update step completion status based on onboarding data
  const updatedSteps = steps.map(step => {
    let completed = false;
    let isCurrent = false;

    switch (step.id) {
      case 1: // Mon Profil
        completed = completedSteps.includes('profile_setup');
        isCurrent = currentStep === 'profile_setup';
        break;
      case 2: // Mes Objectifs
        completed = completedSteps.includes('goals_setup');
        isCurrent = currentStep === 'goals_setup';
        break;
      case 3: // Recommandations
        completed = completedSteps.includes('recommendations');
        isCurrent = currentStep === 'recommendations';
        break;
      case 4: // Rendez-vous
        completed = completedSteps.includes('appointment');
        isCurrent = currentStep === 'appointment';
        break;
    }

    return { ...step, completed, isCurrent };
  });

  // Calculate total points (all steps combined)
  const totalPoints = steps.reduce((sum, step) => sum + step.points, 0);

  // Calculate progress percentage
  const completedStepsCount = updatedSteps.filter(step => step.completed).length;
  const progressPercentage = (completedStepsCount / updatedSteps.length) * 100;
  const isComplete = completedStepsCount === updatedSteps.length;

  // Determine which step is active (first incomplete step, or last if all complete)
  const activeStepIndex = updatedSteps.findIndex(step => !step.completed);
  const currentActiveStep = activeStepIndex >= 0 ? activeStepIndex : updatedSteps.length - 1;

  const handleCompleteProfile = () => {
    // Check subscription status before proceeding
    const requiresRenewal = subscriptionData?.requiresRenewal || false;
    
    if (requiresRenewal && onSubscriptionRenew) {
      console.log('💳 Profile completion blocked - subscription renewal required');
      onSubscriptionRenew();
      return;
    }
    
    if (onCompleteProfile) {
      onCompleteProfile();
    }
  };

  const handleStepPress = (stepId) => {
    if (onStepPress) {
      onStepPress(stepId);
    }
  };

  return (
    <View style={styles.container} key={`profile-completion-${JSON.stringify(completedSteps)}`}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="help-circle-outline" size={20} color={theme.colors.text.primary} />
          <Text style={styles.title}>Complétez votre profil</Text>
        </View>
      </View>

      {/* Steps Cards */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stepsContainer}
      >
        {updatedSteps.map((step, index) => {
          const isActive = index === currentActiveStep;
          
          return (
            <TouchableOpacity 
              key={step.id} 
              style={[
                styles.stepCard,
                isActive && styles.stepCardActive
              ]}
              onPress={() => handleStepPress(step.id)}
              activeOpacity={0.7}
            >
              {/* Circular Icon */}
              <View style={[
                styles.stepIcon,
                isActive && styles.stepIconActive
              ]}>
                {step.completed ? (
                  <Ionicons name="checkmark" size={20} color={isActive ? "#FFFFFF" : "#4CAF50"} />
                ) : (
                  <View style={[
                    styles.stepIconDot,
                    isActive && styles.stepIconDotActive
                  ]} />
                )}
              </View>

              {/* Step Number */}
              <Text style={[
                styles.stepNumber,
                isActive && styles.stepNumberActive
              ]}>
                ÉTAPE {step.id}
              </Text>

              {/* Step Title */}
              <Text style={[
                styles.stepTitle,
                isActive && styles.stepTitleActive
              ]}>
                {step.title}
              </Text>

              {/* Points Badge */}
              <View style={[
                styles.pointsBadge,
                isActive && styles.pointsBadgeActive
              ]}>
                <Text style={[
                  styles.pointsText,
                  isActive && styles.pointsTextActive
                ]}>
                  +{step.points} pts
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Instruction Text */}
      <Text style={styles.instructionText}>
        Terminez les 4 étapes pour activer votre coaching personnalisé.
      </Text>

      {/* Total Points Button */}
      <TouchableOpacity 
        style={styles.totalPointsButton}
        onPress={handleCompleteProfile}
      >
        <Text style={styles.totalPointsText}>{totalPoints} points offerts</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  stepsContainer: {
    paddingHorizontal: 4,
    paddingVertical: 8,
    gap: 12,
  },
  stepCard: {
    width: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 12,
  },
  stepCardActive: {
    backgroundColor: '#F3E5F5',
    borderColor: '#9C27B0',
    borderWidth: 2,
  },
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepIconActive: {
    backgroundColor: '#9C27B0',
  },
  stepIconDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#9E9E9E',
  },
  stepIconDotActive: {
    backgroundColor: '#FFFFFF',
  },
  stepNumber: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  stepNumberActive: {
    color: theme.colors.text.primary,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  stepTitleActive: {
    color: '#9C27B0',
    fontSize: 15,
  },
  pointsBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
  },
  pointsBadgeActive: {
    backgroundColor: '#E8F5E9',
  },
  pointsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  pointsTextActive: {
    color: '#4CAF50',
  },
  instructionText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 16,
    lineHeight: 20,
  },
  totalPointsButton: {
    backgroundColor: '#E8F5E9',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  totalPointsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
});

export default ProfileCompletionCard;
