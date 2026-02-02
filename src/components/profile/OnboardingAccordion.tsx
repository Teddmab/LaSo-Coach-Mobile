import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
// Preload all bottom sheets at module level for instant availability
import ProfileStep1BottomSheet from '../dashboard/ProfileStep1BottomSheet';
import ProfileStep2BottomSheet from '../dashboard/ProfileStep2BottomSheet';
import ProfileStep3BottomSheet from '../dashboard/ProfileStep3BottomSheet';
import ProfileStep4BottomSheet from '../dashboard/ProfileStep4BottomSheet';

interface OnboardingAccordionProps {
  user: any;
  dashboardData: any;
  onStepComplete: () => void;
}

interface Step {
  id: number;
  title: string;
  key: string;
  points: number;
}

const STEPS: Step[] = [
  { id: 1, title: 'Mon profil', key: 'profile_setup', points: 100 },
  { id: 2, title: 'Mes Objectifs', key: 'goals_setup', points: 30 },
  { id: 3, title: 'Recommandations', key: 'recommendations', points: 20 },
  { id: 4, title: 'Rendez-vous', key: 'rendezvous', points: 25 },
];

const OnboardingAccordion: React.FC<OnboardingAccordionProps> = ({
  user,
  dashboardData,
  onStepComplete,
}) => {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [showStep1BottomSheet, setShowStep1BottomSheet] = useState(false);
  const [showStep2BottomSheet, setShowStep2BottomSheet] = useState(false);
  const [showStep3BottomSheet, setShowStep3BottomSheet] = useState(false);
  const [showStep4BottomSheet, setShowStep4BottomSheet] = useState(false);

  // Get onboarding data
  const onboardingData = dashboardData?.onboarding?.data || {};
  const completedSteps = onboardingData?.completedSteps || [];

  // Check if step is completed
  const isStepCompleted = (stepKey: string): boolean => {
    return completedSteps.includes(stepKey);
  };

  // Get current incomplete step
  const getCurrentIncompleteStep = (): number | null => {
    if (!completedSteps.includes('profile_setup')) return 1;
    if (!completedSteps.includes('goals_setup')) return 2;
    if (!completedSteps.includes('recommendations')) return 3;
    if (!completedSteps.includes('rendezvous')) return 4;
    return null;
  };

  // Check if previous steps are completed
  const arePreviousStepsCompleted = (stepId: number): boolean => {
    if (stepId === 1) return true;
    
    const stepMap: Record<number, string> = {
      1: 'profile_setup',
      2: 'goals_setup',
      3: 'recommendations',
      4: 'rendezvous',
    };
    
    for (let i = 1; i < stepId; i++) {
      if (!completedSteps.includes(stepMap[i])) {
        return false;
      }
    }
    return true;
  };

  const handleStepPress = (step: Step) => {
    // ✅ Empêcher l'ouverture du bottomsheet pour les étapes 1, 2, 3 si elles sont déjà complétées
    if (step.id === 1 && isStepCompleted(step.key)) {
      import('react-native-toast-message').then(({ default: Toast }) => {
        Toast.show({
          type: 'info',
          text1: 'Étape déjà complétée',
          text2: 'Cette étape ne peut plus être modifiée',
          visibilityTime: 2000,
        });
      });
      return;
    }
    
    if (step.id === 2 && isStepCompleted(step.key)) {
      import('react-native-toast-message').then(({ default: Toast }) => {
        Toast.show({
          type: 'info',
          text1: 'Étape déjà complétée',
          text2: 'Cette étape ne peut plus être modifiée',
          visibilityTime: 2000,
        });
      });
      return;
    }
    
    if (step.id === 3 && isStepCompleted(step.key)) {
      import('react-native-toast-message').then(({ default: Toast }) => {
        Toast.show({
          type: 'info',
          text1: 'Étape déjà complétée',
          text2: 'Cette étape ne peut plus être modifiée',
          visibilityTime: 2000,
        });
      });
      return;
    }

    // Check if previous steps are completed
    if (!arePreviousStepsCompleted(step.id)) {
      const currentStepId = getCurrentIncompleteStep();
      const currentStep = STEPS.find(s => s.id === currentStepId);
      
      // Show message to complete previous step (lazy load Toast)
      import('react-native-toast-message').then(({ default: Toast }) => {
        Toast.show({
          type: 'info',
          text1: 'Étape requise',
          text2: `Veuillez d'abord compléter l'étape: ${currentStep?.title || 'précédente'}`,
          visibilityTime: 3000,
        });
      });
      return;
    }

    // Open corresponding bottom sheet
    switch (step.id) {
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
    }
  };

  const handleStepComplete = (stepId: number) => {
    // Close bottom sheet
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
    
    // Refresh data
    onStepComplete();
  };

  const renderStepItem = (step: Step) => {
    const isCompleted = isStepCompleted(step.key);
    const canAccess = arePreviousStepsCompleted(step.id);
    const isExpanded = expandedStep === step.id;

    return (
      <View key={step.id} style={styles.stepContainer}>
        <TouchableOpacity
          style={[
            styles.stepHeader,
            isCompleted && styles.stepHeaderCompleted,
            !canAccess && !isCompleted && styles.stepHeaderDisabled,
          ]}
          onPress={() => {
            if (isCompleted) {
              // Toggle accordion for completed steps
              setExpandedStep(isExpanded ? null : step.id);
            } else {
              // Open bottom sheet for incomplete steps
              handleStepPress(step);
            }
          }}
          disabled={!canAccess && !isCompleted}
          activeOpacity={0.7}
        >
          <View style={styles.stepHeaderLeft}>
            <Text style={[
              styles.stepTitle,
              isCompleted && styles.stepTitleCompleted,
            ]}>
              Étape {step.id}: {step.title}
            </Text>
            {isCompleted && (
              <Text style={styles.stepPoints}>+{step.points} pts</Text>
            )}
          </View>
          
          <View style={styles.stepHeaderRight}>
            {isCompleted ? (
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            ) : canAccess ? (
              <Ionicons name="warning" size={24} color="#FF9800" />
            ) : (
              <Ionicons name="lock-closed" size={24} color="#9E9E9E" />
            )}
            {isCompleted && (
              <Ionicons
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                color={theme.colors.text.secondary}
                style={styles.chevronIcon}
              />
            )}
          </View>
        </TouchableOpacity>

        {/* Expanded content for completed steps */}
        {isCompleted && isExpanded && (
          <View style={styles.stepContent}>
            <View style={styles.completedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.completedText}>
                Cette étape a été complétée (+{step.points} points)
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Complétez votre profil</Text>
        <Text style={styles.sectionSubtitle}>
          Terminez les 4 étapes pour activer votre coaching personnalisé
        </Text>
        
        {STEPS.map(step => renderStepItem(step))}
      </View>

      {/* Bottom Sheets - Preloaded at module level */}
      <ProfileStep1BottomSheet
        visible={showStep1BottomSheet}
        onClose={() => setShowStep1BottomSheet(false)}
        onComplete={() => handleStepComplete(1)}
        user={user}
        dashboardData={dashboardData}
        isStepCompleted={isStepCompleted('profile_setup')}
      />
      
      <ProfileStep2BottomSheet
        visible={showStep2BottomSheet}
        onClose={() => setShowStep2BottomSheet(false)}
        onComplete={() => handleStepComplete(2)}
        dashboardData={dashboardData}
        isStepCompleted={isStepCompleted('goals_setup')}
      />
      
      <ProfileStep3BottomSheet
        visible={showStep3BottomSheet}
        onClose={() => setShowStep3BottomSheet(false)}
        onComplete={() => handleStepComplete(3)}
        isStepCompleted={isStepCompleted('recommendations')}
      />
      
      <ProfileStep4BottomSheet
        visible={showStep4BottomSheet}
        onClose={() => setShowStep4BottomSheet(false)}
        onComplete={() => handleStepComplete(4)}
        dashboardData={dashboardData}
      />
    </>
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  stepContainer: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  stepHeaderCompleted: {
    backgroundColor: '#F1F8F4',
  },
  stepHeaderDisabled: {
    opacity: 0.6,
  },
  stepHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  stepHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  stepTitleCompleted: {
    color: '#2E7D32',
  },
  stepPoints: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4CAF50',
  },
  chevronIcon: {
    marginLeft: 8,
  },
  stepContent: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
  },
  completedText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
});

export default OnboardingAccordion;

