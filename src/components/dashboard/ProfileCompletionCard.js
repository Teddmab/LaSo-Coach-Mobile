import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
  console.log('🎯 ProfileCompletionCard - Received props:', {
    onboardingData,
    hasOnboardingData: !!onboardingData,
    onboardingDataType: typeof onboardingData
  });
  const steps = [
    { id: 1, title: 'Mon Profil', completed: true, points: 250 },
    { id: 2, title: 'Mes Objectifs', completed: false, points: 200 },
    { id: 3, title: 'Recommandations', completed: false, points: 150 },
    { id: 4, title: 'Rendez-vous', completed: false, points: 100 },
    { id: 5, title: 'Mon Abonnement', completed: false, points: 100 },
    { id: 6, title: 'Confirmation', completed: false, points: 50 }
  ];

  // Ensure we have valid onboarding data with fallbacks
  const onboardingDataSafe = onboardingData || {};
  const completedSteps = onboardingDataSafe?.data?.completedSteps || [];
  const currentStep = onboardingDataSafe?.data?.currentStep || 'profile_setup';

  console.log('🎯 ProfileCompletionCard - Step data:', {
    completedSteps,
    currentStep,
    completedStepsLength: completedSteps.length
  });

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
      case 5: // Mon Abonnement
        completed = completedSteps.includes('subscription');
        isCurrent = currentStep === 'subscription';
        break;
      case 6: // Confirmation
        completed = completedSteps.includes('confirmation');
        isCurrent = currentStep === 'confirmation';
        break;
    }

    return { ...step, completed, isCurrent };
  });

  const totalPoints = updatedSteps.reduce((sum, step) => 
    step.completed ? sum + step.points : sum, 0
  );

  // Calculate progress percentage
  const completedStepsCount = updatedSteps.filter(step => step.completed).length;
  const progressPercentage = (completedStepsCount / updatedSteps.length) * 100;
  const isComplete = completedStepsCount === updatedSteps.length;

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
          <Ionicons name="person-circle" size={20} color={theme.colors.primary} />
          <Text style={styles.title}>Complétez votre Profil</Text>
        </View>
        
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>+{totalPoints}pts</Text>
        </View>
      </View>

      {/* Progress Steps - Click on any step to navigate */}
      <View style={styles.progressContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stepsContainer}
        >
          {/* Navigation Arrow Left */}
          <TouchableOpacity style={styles.navArrow}>
            <Ionicons name="chevron-back" size={16} color={theme.colors.text.secondary} />
          </TouchableOpacity>

          {/* Steps */}
          {updatedSteps.map((step, index) => (
            <TouchableOpacity 
              key={step.id} 
              style={styles.stepContainer}
              onPress={() => handleStepPress(step.id)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.stepCircle,
                step.completed && styles.stepCircleCompleted,
                step.isCurrent && styles.stepCircleCurrent
              ]}>
                {step.completed ? (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                ) : step.isCurrent ? (
                  <Ionicons name="crown" size={16} color="#FFFFFF" />
                ) : (
                  <Text style={[
                    styles.stepNumber,
                    step.isCurrent && styles.stepNumberCurrent
                  ]}>
                    {step.id}
                  </Text>
                )}
              </View>
              <Text style={[
                styles.stepTitle,
                step.completed && styles.stepTitleCompleted,
                step.isCurrent && styles.stepTitleCurrent
              ]}>
                {step.title}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Navigation Arrow Right */}
          <TouchableOpacity style={styles.navArrow}>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${progressPercentage}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round(progressPercentage)}% complété
        </Text>
      </View>

      {/* Profile Section */}
      <View style={styles.profileSection}>
        <Text style={styles.profileTitle}>Mon Profil</Text>
        <View style={styles.profilePointsBadge}>
          <Text style={styles.profilePointsText}>+250pts</Text>
        </View>
      </View>

      {/* Complete Profile Button */}
      <TouchableOpacity 
        style={styles.completeButton}
        onPress={handleCompleteProfile}
      >
        <LinearGradient
          colors={isComplete ? ['#4CAF50', '#45a049'] : [theme.colors.primary, '#0056b3']}
          style={styles.completeButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Ionicons 
            name={isComplete ? "checkmark-circle" : "person-add"} 
            size={20} 
            color="#FFFFFF" 
          />
          <Text style={styles.completeButtonText}>
            {isComplete ? "Profil Complété" : "Compléter mon profil"}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  pointsBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  pointsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBarContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  stepsContainer: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  navArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  stepContainer: {
    alignItems: 'center',
    marginHorizontal: 8,
    minWidth: 60,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepCircleCompleted: {
    backgroundColor: '#4CAF50',
  },
  stepCircleCurrent: {
    backgroundColor: theme.colors.primary,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text.secondary,
  },
  stepNumberCurrent: {
    color: '#FFFFFF',
  },
  stepTitle: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  stepTitleCompleted: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  stepTitleCurrent: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  profileSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  profileTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  profilePointsBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  profilePointsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  completeButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  completeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default ProfileCompletionCard; 