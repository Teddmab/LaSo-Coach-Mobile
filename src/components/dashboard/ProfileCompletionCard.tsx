import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import ProfileStep1BottomSheet from './ProfileStep1BottomSheet';
import ProfileStep2BottomSheet from './ProfileStep2BottomSheet';
import ProfileStep3BottomSheet from './ProfileStep3BottomSheet';
import ProfileStep4BottomSheet from './ProfileStep4BottomSheet';
import RendezvousDetailBottomSheet from './RendezvousDetailBottomSheet';
import { useAuth } from '../../context/FirebaseAuthContext';
import Toast from 'react-native-toast-message';

interface ProfileCompletionCardProps {
  onboardingData?: any;
  onCompleteProfile?: () => void;
  onStepPress?: (stepId: number) => void;
  subscriptionData?: any;
  onRefresh?: () => void;
  dashboardData?: any;
  rendezvousData?: any;
}

const ProfileCompletionCard: React.FC<ProfileCompletionCardProps> = ({ 
  onboardingData,
  onCompleteProfile,
  onStepPress,
  subscriptionData,
  onRefresh,
  dashboardData,
  rendezvousData
}) => {
  const { user } = useAuth();
  const [showStep1BottomSheet, setShowStep1BottomSheet] = useState(false);
  const [showStep2BottomSheet, setShowStep2BottomSheet] = useState(false);
  const [showStep3BottomSheet, setShowStep3BottomSheet] = useState(false);
  const [showStep4BottomSheet, setShowStep4BottomSheet] = useState(false);
  const [showRendezvousDetailBottomSheet, setShowRendezvousDetailBottomSheet] = useState(false);

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

  // ✅ MODIFICATION: Trouver la première étape non complétée pour la marquer comme active
  const getFirstIncompleteStepId = (): number | null => {
    if (!completedSteps.includes('profile_setup')) return 1;
    if (!completedSteps.includes('goals_setup')) return 2;
    if (!completedSteps.includes('recommendations')) return 3;
    if (!completedSteps.includes('rendezvous')) return 4;
    return null; // Toutes les étapes sont complétées
  };

  const firstIncompleteStepId = getFirstIncompleteStepId();

  // Update step completion status based on onboarding data
  const updatedSteps = steps.map(step => {
    let completed = false;
    // ✅ MODIFICATION: Une étape est active si elle est la première non complétée
    const isCurrent = step.id === firstIncompleteStepId && !completedSteps.includes(
      step.id === 1 ? 'profile_setup' :
      step.id === 2 ? 'goals_setup' :
      step.id === 3 ? 'recommendations' :
      'rendezvous'
    );

    switch (step.id) {
      case 1: // Mon Profil
        completed = completedSteps.includes('profile_setup');
        break;
      case 2: // Mes Objectifs
        completed = completedSteps.includes('goals_setup');
        break;
      case 3: // Recommandations
        completed = completedSteps.includes('recommendations');
        break;
      case 4: // Rendez-vous
        completed = completedSteps.includes('rendezvous');
        break;
    }

    return { ...step, completed, isCurrent };
  });

  // ✅ MODIFICATION: Ne pas filtrer les étapes complétées - afficher toutes les étapes
  const visibleSteps = updatedSteps;

  // ✅ MODIFICATION: Calculer les points COLLECTÉS (depuis les étapes complétées)
  const totalPointsCollected = updatedSteps
    .filter(step => step.completed)
    .reduce((sum, step) => sum + step.points, 0);

  // Calculate progress percentage
  const completedStepsCount = updatedSteps.filter(step => step.completed).length;
  const progressPercentage = (completedStepsCount / updatedSteps.length) * 100;
  const isComplete = completedStepsCount === updatedSteps.length;

  // Determine which step is active (first incomplete step)
  const activeStepIndex = visibleSteps.length > 0 ? 0 : -1;
  const currentActiveStep = activeStepIndex >= 0 ? activeStepIndex : 0;

  // ✅ MODIFICATION: Helper function to check if previous steps are completed
  // Étape 2 dépend de l'étape 1, mais étapes 3 et 4 sont indépendantes
  const arePreviousStepsCompleted = (stepId: number): boolean => {
    if (stepId === 1) return true; // Step 1 is always accessible
    if (stepId === 3) return true; // Step 3 is independent
    if (stepId === 4) return true; // Step 4 is independent
    
    // Step 2 depends on step 1
    if (stepId === 2) {
      return completedSteps.includes('profile_setup');
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

  // ✅ MODIFICATION: La carte garde toujours les couleurs par défaut
  // Seule l'étape 4 change de couleur selon le statut du rendez-vous

  const handleCompleteProfile = () => {
    // On a toujours un plan FREE par défaut, donc pas besoin de vérifier le renouvellement
    if (onCompleteProfile) {
      onCompleteProfile();
    }
  };

  const handleStepPress = (stepId: number) => {
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

  // ✅ MODIFICATION: Obtenir les données du rendez-vous pour l'étape 4
  const hasRendezvous = completedSteps.includes('rendezvous');
  const rendezvous = rendezvousData || dashboardData?.rendezvous || dashboardData?.rendezVous || null;
  
  // Un rendez-vous est assigné si :
  // - Le rendez-vous existe
  // - ET (statut ASSIGNED/CONFIRMED OU assignedCoach existe)
  const isRendezvousAssigned = rendezvous && (
    rendezvous.status === 'ASSIGNED' || 
    rendezvous.status === 'assigned' ||
    rendezvous.status === 'CONFIRMED' ||
    rendezvous.status === 'confirmed' ||
    !!rendezvous.assignedCoach
  );
  
  // Un rendez-vous est en attente si :
  // - L'étape rendezvous est complétée (hasRendezvous)
  // - ET le rendez-vous n'est pas assigné (soit il n'existe pas, soit il est PENDING)
  const isRendezvousPending = hasRendezvous && !isRendezvousAssigned;

  return (
    <View 
      style={styles.container}
      key={`profile-completion-${JSON.stringify(completedSteps)}`}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="help-circle-outline" size={20} color={theme.colors.text.primary} />
          <Text style={styles.title}>Complétez votre profil</Text>
        </View>
      </View>

      {/* ✅ MODIFICATION: Layout 2x2 avec flexWrap - Afficher toutes les étapes */}
      <View style={styles.stepsGridContainer}>
          {updatedSteps.map((step) => {
            const isActive = step.isCurrent;
            const isCompleted = step.completed;
            
            // ✅ MODIFICATION: Pour l'étape 4, appliquer les couleurs selon le statut du rendez-vous
            let stepCardStyle: any[] = [styles.stepCard];
            let stepIconStyle: any[] = [styles.stepIcon];
            let stepTextStyle: any[] = [styles.stepTitle];
            
            if (step.id === 4 && isCompleted && rendezvous) {
              // Étape 4 complétée : couleur selon le statut du rendez-vous
              if (isRendezvousAssigned) {
                stepCardStyle.push(styles.stepCardStep4Assigned);
                stepIconStyle.push(styles.stepIconStep4Assigned);
                stepTextStyle.push(styles.stepTextStep4Assigned);
              } else if (isRendezvousPending) {
                stepCardStyle.push(styles.stepCardStep4Pending);
                stepIconStyle.push(styles.stepIconStep4Pending);
                stepTextStyle.push(styles.stepTextStep4Pending);
              }
            } else if (isCompleted) {
              // Étapes complétées : vert
              stepCardStyle.push(styles.stepCardCompleted);
              stepIconStyle.push(styles.stepIconCompleted);
              stepTextStyle.push(styles.stepTitleCompleted);
            } else {
              // ✅ MODIFICATION: Toutes les étapes non complétées sont en violet
              // La première non complétée sera marquée comme active, mais toutes les non complétées sont violettes
              stepCardStyle.push(styles.stepCardActive);
              stepIconStyle.push(styles.stepIconActive);
              stepTextStyle.push(styles.stepTitleActive);
            }
            
            return (
              <TouchableOpacity 
                key={step.id} 
                style={stepCardStyle}
                onPress={() => {
                  // ✅ MODIFICATION: Si étape 4 complétée et rendez-vous existe, ouvrir RendezvousDetailBottomSheet
                  if (step.id === 4 && isCompleted && rendezvous) {
                    setShowRendezvousDetailBottomSheet(true);
                  } else {
                    handleStepPress(step.id);
                  }
                }}
                activeOpacity={0.7}
              >
                {/* Circular Icon */}
                <View style={stepIconStyle}>
                  {isCompleted ? (
                    <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
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
                <Text style={stepTextStyle}>
                  {step.title}
                </Text>

                {/* Points Badge */}
                {!isCompleted && (
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
                )}
              </TouchableOpacity>
            );
          })}
        </View>

      {/* ✅ MODIFICATION: Afficher les points collectés */}
      {totalPointsCollected > 0 && (
        <View style={styles.totalPointsContainer}>
          <Text style={styles.totalPointsText}>{totalPointsCollected} points collectés</Text>
        </View>
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
      
      {/* ✅ MODIFICATION: Bottom sheet pour afficher les détails du rendez-vous */}
      <RendezvousDetailBottomSheet
        visible={showRendezvousDetailBottomSheet}
        rendezvousData={rendezvous || null}
        onClose={() => {
          console.log('🔴 [ProfileCompletionCard] Closing rendezvous detail bottom sheet');
          setShowRendezvousDetailBottomSheet(false);
        }}
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
    borderColor: '#E5E5E5', // Gris clair tamisé comme les autres cartes
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
  // ✅ MODIFICATION: Grid 2x2 pour les étapes
  stepsGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  stepCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  stepCardCompleted: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  // ✅ MODIFICATION: Styles pour l'étape 4 selon le statut du rendez-vous
  stepCardStep4Assigned: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  stepCardStep4Pending: {
    backgroundColor: '#FFF9C4',
    borderColor: '#FBC02D',
    borderWidth: 2,
  },
  stepCardActive: {
    backgroundColor: '#F3E5F5', // Violet clair pour étape active
    borderColor: '#9C27B0', // Violet pour étape active
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
  stepIconCompleted: {
    backgroundColor: 'transparent',
  },
  stepIconStep4Assigned: {
    backgroundColor: 'transparent',
  },
  stepIconStep4Pending: {
    backgroundColor: 'transparent',
  },
  stepIconActive: {
    backgroundColor: '#9C27B0', // Violet pour étape active
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
    color: '#9C27B0', // Violet pour étape active
    fontSize: 15,
  },
  stepTitleCompleted: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  stepTextStep4Assigned: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  stepTextStep4Pending: {
    color: '#FBC02D',
    fontWeight: '600',
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
  totalPointsContainer: {
    marginTop: 16,
    alignItems: 'center',
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
  pendingRendezvousContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  pendingRendezvousText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FBC02D',
    marginTop: 12,
    textAlign: 'center',
  },
  pendingRendezvousSubtext: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginTop: 6,
    textAlign: 'center',
  },
  pendingInstructionText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  assignedRendezvousContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  assignedRendezvousText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginTop: 12,
    textAlign: 'center',
  },
  assignedInstructionText: {
    fontSize: 13,
    color: '#4CAF50',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
});

export default ProfileCompletionCard;
