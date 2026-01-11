import React, { useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import ProfileStep1BottomSheet from './ProfileStep1BottomSheet';
import ProfileStep2BottomSheet from './ProfileStep2BottomSheet';
import ProfileStep3BottomSheet from './ProfileStep3BottomSheet';
import ProfileStep4BottomSheet from './ProfileStep4BottomSheet';
import { useAuth } from '../../context/FirebaseAuthContext';
import Toast from 'react-native-toast-message';

const ProfileCompletionCard = ({ 
  onboardingData,
  onCompleteProfile,
  onStepPress,
  subscriptionData,
  onSubscriptionRenew,
  onRefresh,
  dashboardData
}) => {
  const { user } = useAuth();
  const [showStep1BottomSheet, setShowStep1BottomSheet] = useState(false);
  const [showStep2BottomSheet, setShowStep2BottomSheet] = useState(false);
  const [showStep3BottomSheet, setShowStep3BottomSheet] = useState(false);
  const [showStep4BottomSheet, setShowStep4BottomSheet] = useState(false);
  // Force re-render when onboarding data changes
  React.useEffect(() => {
    // Data structure logged for debugging
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
        completed = completedSteps.includes('rendezvous');
        isCurrent = currentStep === 'rendezvous';
        break;
    }

    return { ...step, completed, isCurrent };
  });

  // Filter out completed steps - only show incomplete steps
  const visibleSteps = updatedSteps.filter(step => !step.completed);

  // Calculate total points (only for visible/incomplete steps)
  const totalPoints = visibleSteps.length > 0 
    ? visibleSteps.reduce((sum, step) => sum + step.points, 0)
    : 0;

  // Calculate progress percentage
  const completedStepsCount = updatedSteps.filter(step => step.completed).length;
  const progressPercentage = (completedStepsCount / updatedSteps.length) * 100;
  const isComplete = completedStepsCount === updatedSteps.length;

  // Determine which step is active (first incomplete step)
  const activeStepIndex = visibleSteps.length > 0 ? 0 : -1;
  const currentActiveStep = activeStepIndex >= 0 ? activeStepIndex : 0;

  // Helper function to check if previous steps are completed
  const arePreviousStepsCompleted = (stepId: number): boolean => {
    if (stepId === 1) return true; // Step 1 is always accessible
    
    const stepMap: Record<number, string> = {
      1: 'profile_setup',
      2: 'goals_setup',
      3: 'recommendations',
      4: 'rendezvous',
    };
    
    // Check all previous steps
    for (let i = 1; i < stepId; i++) {
      if (!completedSteps.includes(stepMap[i])) {
        return false;
      }
    }
    return true;
  };

  // Get current incomplete step ID
  const getCurrentIncompleteStepId = (): number | null => {
    if (!completedSteps.includes('profile_setup')) return 1;
    if (!completedSteps.includes('goals_setup')) return 2;
    if (!completedSteps.includes('recommendations')) return 3;
    if (!completedSteps.includes('rendezvous')) return 4;
    return null;
  };

  const handleCompleteProfile = () => {
    // Check subscription status before proceeding
    const requiresRenewal = subscriptionData?.requiresRenewal || false;
    
    if (requiresRenewal && onSubscriptionRenew) {
      onSubscriptionRenew();
      return;
    }
    
    if (onCompleteProfile) {
      onCompleteProfile();
    }
  };

  const scrollRef = useRef<ScrollView | null>(null);

  const handleStepPress = (stepId) => {
    // Vérifier si les étapes précédentes sont complétées
    if (!arePreviousStepsCompleted(stepId)) {
      const currentStepId = getCurrentIncompleteStepId();
      const stepNames: Record<number, string> = {
        1: 'Mon Profil',
        2: 'Mes Objectifs',
        3: 'Recommandations',
        4: 'Rendez-vous',
      };
      
      Toast.show({
        type: 'info',
        text1: 'Étape requise',
        text2: `Veuillez d'abord compléter l'étape: ${stepNames[currentStepId || 1]}`,
        visibilityTime: 3000,
      });
      return;
    }

    // Ouvrir le bottom sheet correspondant
    switch (stepId) {
      case 1:
        setShowStep1BottomSheet(true);
        break;
      case 2:
        setShowStep2BottomSheet(true);
        break;
      case 3:
        setShowStep3BottomSheet(true);
        break;
      case 4:
        setShowStep4BottomSheet(true);
        break;
      default:
        // Fallback vers le handler par défaut si nécessaire
        if (onStepPress) {
          onStepPress(stepId);
        }
    }
  };

  const handleStepComplete = (stepId: number) => {
    // Fermer le bottom sheet correspondant
    switch (stepId) {
      case 1:
        setShowStep1BottomSheet(false);
        break;
      case 2:
        setShowStep2BottomSheet(false);
        break;
      case 3:
        setShowStep3BottomSheet(false);
        break;
      case 4:
        setShowStep4BottomSheet(false);
        break;
    }
    
    // Rafraîchir les données pour mettre à jour les points
    if (onRefresh) {
      onRefresh();
    }
  };

  // Centrer automatiquement l'étape active dans le carrousel
  React.useEffect(() => {
    if (!scrollRef.current || visibleSteps.length === 0) return;

    const cardWidth = 152; // largeur approximative (140) + marge
    const targetIndex = currentActiveStep;
    const x = Math.max(0, cardWidth * targetIndex - cardWidth); // décale pour centrer visuellement

    scrollRef.current.scrollTo({ x, animated: true });
  }, [currentActiveStep, visibleSteps.length]);

  return (
    <View style={styles.container} key={`profile-completion-${JSON.stringify(completedSteps)}`}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="help-circle-outline" size={20} color={theme.colors.text.primary} />
          <Text style={styles.title}>Complétez votre profil</Text>
        </View>
      </View>

      {/* Steps Cards - Only show incomplete steps */}
      {visibleSteps.length > 0 ? (
        <ScrollView 
          ref={scrollRef}
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stepsContainer}
        >
          {visibleSteps.map((step, index) => {
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
                  <View style={[
                    styles.stepIconDot,
                    isActive && styles.stepIconDotActive
                  ]} />
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
      ) : (
        <View style={styles.allStepsCompletedContainer}>
          <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
          <Text style={styles.allStepsCompletedText}>
            Toutes les étapes sont complétées !
          </Text>
        </View>
      )}

      {/* Instruction Text */}
      {visibleSteps.length > 0 && (
        <Text style={styles.instructionText}>
          {visibleSteps.length === 1 
            ? 'Terminez cette dernière étape pour activer votre coaching personnalisé.'
            : `Terminez les ${visibleSteps.length} étapes restantes pour activer votre coaching personnalisé.`
          }
        </Text>
      )}

      {/* Total Points Button - Only show if there are visible steps */}
      {visibleSteps.length > 0 && (
        <TouchableOpacity 
          style={styles.totalPointsButton}
          onPress={handleCompleteProfile}
        >
          <Text style={styles.totalPointsText}>{totalPoints} points offerts</Text>
        </TouchableOpacity>
      )}

      {/* Step Bottom Sheets */}
      <ProfileStep1BottomSheet
        visible={showStep1BottomSheet}
        onClose={() => setShowStep1BottomSheet(false)}
        onComplete={() => handleStepComplete(1)}
        user={user}
        dashboardData={dashboardData}
      />
      
      <ProfileStep2BottomSheet
        visible={showStep2BottomSheet}
        onClose={() => setShowStep2BottomSheet(false)}
        onComplete={() => handleStepComplete(2)}
        dashboardData={dashboardData}
      />
      
      <ProfileStep3BottomSheet
        visible={showStep3BottomSheet}
        onClose={() => setShowStep3BottomSheet(false)}
        onComplete={() => handleStepComplete(3)}
      />
      
      <ProfileStep4BottomSheet
        visible={showStep4BottomSheet}
        onClose={() => setShowStep4BottomSheet(false)}
        onComplete={() => handleStepComplete(4)}
        dashboardData={dashboardData}
      />
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
  stepCardCompleted: {
    opacity: 0.4,
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
  stepTitleCompleted: {
    color: theme.colors.text.secondary,
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
  allStepsCompletedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  allStepsCompletedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginTop: 16,
  },
});

export default ProfileCompletionCard;
