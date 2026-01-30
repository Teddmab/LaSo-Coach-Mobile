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
import RendezvousDetailBottomSheet from './RendezvousDetailBottomSheet';
import { useAuth } from '../../context/FirebaseAuthContext';
import Toast from 'react-native-toast-message';

const ProfileCompletionCard = ({ 
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

  // ✅ MODIFICATION: Fonction pour déterminer la couleur de la carte selon l'état du rendez-vous
  const getCardColor = () => {
    const hasRendezvous = completedSteps.includes('rendezvous');
    const rendezvous = rendezvousData || dashboardData?.rendezvous || dashboardData?.rendezVous || null;
    
    // Debug log pour vérifier les données
    if (__DEV__) {
      console.log('🎨 [ProfileCompletionCard] getCardColor:', {
        hasRendezvous,
        rendezvousExists: !!rendezvous,
        rendezvousStatus: rendezvous?.status,
        hasAssignedCoach: !!rendezvous?.assignedCoach,
        assignedCoachName: rendezvous?.assignedCoach?.name,
      });
    }
    
    // Vert : Rendez-vous assigné (statut ASSIGNED/CONFIRMED ou assignedCoach existe)
    // Vérifier aussi si le statut est une chaîne en minuscules
    const isAssigned = rendezvous && (
      rendezvous.status === 'ASSIGNED' || 
      rendezvous.status === 'assigned' ||
      rendezvous.status === 'CONFIRMED' ||
      rendezvous.status === 'confirmed' ||
      !!rendezvous.assignedCoach
    );
    
    if (isAssigned) {
      return {
        backgroundColor: '#E8F5E9', // Vert clair
        borderColor: '#4CAF50', // Vert
        iconColor: '#4CAF50',
        title: 'Rendez-vous assigné',
      };
    }
    
    // Jaune : Seulement à l'étape 4 quand le rendez-vous est créé mais en attente (PENDING)
    // Les étapes 1-3 gardent la couleur par défaut (blanc)
    if (hasRendezvous && rendezvous) {
      return {
        backgroundColor: '#FFF9C4', // Jaune clair
        borderColor: '#FBC02D', // Jaune
        iconColor: '#FBC02D',
        title: 'Rendez-vous en attente',
      };
    }
    
    // Par défaut : Couleur blanche pour les étapes 1-3 (comportement original)
    return {
      backgroundColor: '#FFFFFF', // Blanc (couleur par défaut)
      borderColor: '#E0E0E0', // Gris clair (couleur par défaut)
      iconColor: theme.colors.text.primary, // Couleur de texte par défaut
      title: 'Complétez votre profil',
    };
  };

  const handleCompleteProfile = () => {
    // On a toujours un plan FREE par défaut, donc pas besoin de vérifier le renouvellement
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

  // ✅ MODIFICATION: Obtenir les couleurs dynamiques
  const cardColors = getCardColor();
  
  // Vérifier si toutes les étapes sont complétées mais le rendez-vous est en attente
  const hasRendezvous = completedSteps.includes('rendezvous');
  const rendezvous = rendezvousData || dashboardData?.rendezvous || dashboardData?.rendezVous || null;
  
  // Un rendez-vous est assigné si :
  // - Le rendez-vous existe
  // - ET (statut ASSIGNED/CONFIRMED OU assignedCoach existe)
  // Vérifier aussi si le statut est une chaîne en minuscules
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
  
  // Si toutes les étapes sont complétées mais rendez-vous en attente, afficher un message minimal
  const allStepsCompleted = visibleSteps.length === 0;
  const showPendingMessage = allStepsCompleted && isRendezvousPending;
  
  // ✅ MODIFICATION: Si le rendez-vous est assigné, afficher un message de confirmation en vert
  const showAssignedMessage = allStepsCompleted && isRendezvousAssigned;
  
  // Debug log
  if (__DEV__) {
    console.log('📊 [ProfileCompletionCard] Rendezvous status:', {
      hasRendezvous,
      rendezvousExists: !!rendezvous,
      rendezvousStatus: rendezvous?.status,
      hasAssignedCoach: !!rendezvous?.assignedCoach,
      assignedCoachName: rendezvous?.assignedCoach?.name,
      isRendezvousAssigned,
      isRendezvousPending,
      allStepsCompleted,
      visibleStepsLength: visibleSteps.length,
      showPendingMessage,
      showAssignedMessage,
      cardColors,
    });
  }

  // Handler pour ouvrir le bottom sheet des détails du rendez-vous
  const handleCardPress = () => {
    console.log('🔵 [ProfileCompletionCard] handleCardPress called', {
      showPendingMessage,
      showAssignedMessage,
      rendezvousExists: !!rendezvous,
      rendezvous,
    });
    
    // Ouvrir le bottom sheet si le rendez-vous est en attente ou assigné
    if (showPendingMessage || showAssignedMessage) {
      console.log('✅ [ProfileCompletionCard] Opening rendezvous detail bottom sheet');
      setShowRendezvousDetailBottomSheet(true);
    } else {
      console.log('❌ [ProfileCompletionCard] Cannot open: showPendingMessage and showAssignedMessage are false');
    }
  };

  return (
    <View 
      style={[
        styles.container, 
        {
          backgroundColor: cardColors.backgroundColor,
          borderColor: cardColors.borderColor,
          borderWidth: 2,
        }
      ]} 
      key={`profile-completion-${JSON.stringify(completedSteps)}`}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="help-circle-outline" size={20} color={cardColors.iconColor} />
          <Text style={[styles.title, { color: cardColors.iconColor }]}>{cardColors.title}</Text>
        </View>
      </View>

      {/* Steps Cards - Only show incomplete steps */}
      {showAssignedMessage ? (
        // ✅ MODIFICATION: Afficher un message de confirmation en vert quand le rendez-vous est assigné
        <TouchableOpacity 
          style={styles.assignedRendezvousContainer}
          onPress={handleCardPress}
          activeOpacity={0.7}
        >
          <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
          <Text style={styles.assignedRendezvousText}>
            Coach assigné avec succès !
          </Text>
          {rendezvous?.assignedCoach?.name && (
            <Text style={styles.assignedRendezvousSubtext}>
              {rendezvous.assignedCoach.name}
            </Text>
          )}
          <Text style={styles.assignedRendezvousSubtext}>
            Appuyez pour voir les détails
          </Text>
        </TouchableOpacity>
      ) : showPendingMessage ? (
        // ✅ MODIFICATION: Afficher un message minimal en jaune quand le rendez-vous est en attente
        // PRIORITÉ: Afficher ce message AVANT de vérifier visibleSteps.length
        <TouchableOpacity 
          style={styles.pendingRendezvousContainer}
          onPress={handleCardPress}
          activeOpacity={0.7}
        >
          <Ionicons name="time-outline" size={32} color="#FBC02D" />
          <Text style={styles.pendingRendezvousText}>
            Rendez-vous en attente
          </Text>
          <Text style={styles.pendingRendezvousSubtext}>
            Appuyez pour voir les détails
          </Text>
        </TouchableOpacity>
      ) : visibleSteps.length > 0 ? (
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
      
      {/* ✅ MODIFICATION: Message minimal pour rendez-vous en attente */}
      {showPendingMessage && (
        <Text style={styles.pendingInstructionText}>
          Votre rendez-vous est en attente d'assignation. Appuyez sur la carte pour voir les détails.
        </Text>
      )}
      
      {/* ✅ MODIFICATION: Message pour rendez-vous assigné */}
      {showAssignedMessage && (
        <Text style={styles.assignedInstructionText}>
          Votre coach a été assigné avec succès. Appuyez sur la carte pour voir les détails.
        </Text>
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
    // backgroundColor et borderColor sont maintenant dynamiques (appliqués inline)
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2, // Augmenté à 2 pour correspondre à l'application inline
    // borderColor sera appliqué inline dynamiquement
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
