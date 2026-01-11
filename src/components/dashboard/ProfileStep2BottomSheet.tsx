import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { useOnboarding } from '../../hooks/useOnboarding';
import Toast from 'react-native-toast-message';

interface ProfileStep2BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
  dashboardData?: any;
}

// Restrictions alimentaires en français
const DIETARY_RESTRICTIONS = [
  'Végétarien',
  'Vegan',
  'Sans lactose',
  'Sans gluten',
  'Sans noix',
  'Sans œufs',
  'Sans fruits de mer',
  'Halal',
  'Casher',
  'Aucune',
  'Autre'
];

const ProfileStep2BottomSheet: React.FC<ProfileStep2BottomSheetProps> = ({
  visible,
  onClose,
  onComplete,
  dashboardData,
}) => {
  const insets = useSafeAreaInsets();
  const { completeGoalsSetup, loading } = useOnboarding();
  
  // Form data
  const [formData, setFormData] = useState({
    targetWeight: '',
    targetWaistSize: '',
    goal: '',
    goals: [] as string[],
    dietaryRestrictions: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newSpecificGoal, setNewSpecificGoal] = useState('');

  // Initialize form with dashboard data if available
  useEffect(() => {
    if (visible && dashboardData) {
      const profile = dashboardData?.Profile || dashboardData?.profile || {};
      
      setFormData(prev => ({
        ...prev,
        targetWeight: profile.targetWeight?.toString() || '',
        targetWaistSize: profile.targetWaistSize?.toString() || '',
        goal: profile.goal || '',
        goals: profile.goals || [],
        dietaryRestrictions: profile.dietaryRestrictions || [],
      }));
    }
  }, [dashboardData, visible]);

  // Reset form when modal closes
  useEffect(() => {
    if (!visible) {
      setErrors({});
      setNewSpecificGoal('');
    }
  }, [visible]);

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const addSpecificGoal = () => {
    if (newSpecificGoal.trim()) {
      updateFormData('goals', [...formData.goals, newSpecificGoal.trim()]);
      setNewSpecificGoal('');
    }
  };

  const removeSpecificGoal = (index: number) => {
    updateFormData('goals', formData.goals.filter((_, i) => i !== index));
  };

  const toggleDietaryRestriction = (restriction: string) => {
    const current = formData.dietaryRestrictions;
    if (current.includes(restriction)) {
      updateFormData('dietaryRestrictions', current.filter(r => r !== restriction));
    } else {
      updateFormData('dietaryRestrictions', [...current, restriction]);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.targetWeight.trim()) {
      newErrors.targetWeight = 'Le poids cible est requis';
    } else if (isNaN(parseFloat(formData.targetWeight)) || parseFloat(formData.targetWeight) <= 0) {
      newErrors.targetWeight = 'Poids cible invalide';
    }

    if (!formData.targetWaistSize.trim()) {
      newErrors.targetWaistSize = 'Le tour de taille cible est requis';
    } else if (isNaN(parseFloat(formData.targetWaistSize)) || parseFloat(formData.targetWaistSize) <= 0) {
      newErrors.targetWaistSize = 'Tour de taille cible invalide';
    }

    if (!formData.goal.trim()) {
      newErrors.goal = 'L\'objectif général est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleComplete = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const result = await completeGoalsSetup({
        targetWeight: formData.targetWeight.trim(),
        targetWaistSize: formData.targetWaistSize.trim(),
        goal: formData.goal.trim(),
        goals: formData.goals,
        dietaryRestrictions: formData.dietaryRestrictions,
      });

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Étape 2 complétée !',
          text2: '+30 points obtenus',
          visibilityTime: 3000,
        });
        onComplete();
        onClose();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: result.error || 'Impossible de compléter l\'étape 2',
          visibilityTime: 3000,
        });
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.message || 'Une erreur est survenue',
        visibilityTime: 3000,
      });
    }
  };

  // Get initial values from dashboard data - check multiple possible locations
  // dashboardData structure: { onboarding, profile, measurements, tascc, fetchedAt }
  // profile can be: { Profile: { height, initialWeight, ... }, ... } or { height, initialWeight, ... }
  const getInitialHeight = () => {
    if (!dashboardData) return 0;
    
    // Check multiple possible locations for height
    // Priority: profile.Profile.height > profile.height > Profile.height > profileHeight
    const profile = dashboardData.profile || dashboardData.Profile || dashboardData;
    const height = 
      profile?.Profile?.height ||
      profile?.height ||
      dashboardData?.Profile?.height ||
      dashboardData?.height ||
      dashboardData?.profileHeight ||
      dashboardData?.data?.Profile?.height ||
      dashboardData?.data?.profile?.height ||
      dashboardData?.data?.profile?.Profile?.height ||
      0;
    
    // Height is stored in meters (e.g., 1.75) in the database
    // Return as-is if it's a valid number
    if (height && typeof height === 'number' && height > 0) {
      // If height is > 3, it might be in cm, convert to meters
      // Otherwise, assume it's already in meters
      return height > 3 ? height / 100 : height;
    }
    return 0;
  };

  const getInitialWeight = () => {
    if (!dashboardData) return 0;
    
    const profile = dashboardData.profile || dashboardData.Profile || dashboardData;
    return (
      profile?.Profile?.initialWeight ||
      profile?.initialWeight ||
      dashboardData?.Profile?.initialWeight ||
      dashboardData?.initialWeight ||
      dashboardData?.data?.Profile?.initialWeight ||
      dashboardData?.data?.profile?.initialWeight ||
      dashboardData?.data?.profile?.Profile?.initialWeight ||
      0
    );
  };

  const getInitialWaistSize = () => {
    if (!dashboardData) return 0;
    
    const profile = dashboardData.profile || dashboardData.Profile || dashboardData;
    return (
      profile?.Profile?.initialWaistSize ||
      profile?.initialWaistSize ||
      dashboardData?.Profile?.initialWaistSize ||
      dashboardData?.initialWaistSize ||
      dashboardData?.data?.Profile?.initialWaistSize ||
      dashboardData?.data?.profile?.initialWaistSize ||
      dashboardData?.data?.profile?.Profile?.initialWaistSize ||
      0
    );
  };

  const initialHeight = getInitialHeight();
  const initialWeight = getInitialWeight();
  const initialWaistSize = getInitialWaistSize();
  
  // Debug log to help troubleshoot
  if (__DEV__ && visible) {
    console.log('📏 [ProfileStep2BottomSheet] Initial values:', {
      initialHeight,
      initialWeight,
      initialWaistSize,
      dashboardDataKeys: dashboardData ? Object.keys(dashboardData) : [],
      hasProfile: !!dashboardData?.Profile,
      hasProfileLowercase: !!dashboardData?.profile,
      profileHeight: dashboardData?.Profile?.height,
      profileHeightLowercase: dashboardData?.profile?.height,
    });
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={onClose}
          />
          <View style={[styles.container, { paddingBottom: insets.bottom }]}>
            {/* Handle */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Étape 2: Définir les objectifs</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView 
              style={styles.content} 
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.contentContainer}
            >
              {/* Valeurs initiales */}
              <View style={styles.initialValuesSection}>
                <Text style={styles.sectionTitle}>Valeurs initiales</Text>
                <View style={styles.initialValuesRow}>
                  <View style={styles.initialValueCard}>
                    <Ionicons name="resize-outline" size={24} color={theme.colors.primary} />
                    <Text style={styles.initialValueLabel}>Taille</Text>
                    <Text style={styles.initialValueText}>
                      {initialHeight > 0 ? `${initialHeight}m` : 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.initialValueCard}>
                    <Ionicons name="scale-outline" size={24} color={theme.colors.primary} />
                    <Text style={styles.initialValueLabel}>Poids</Text>
                    <Text style={styles.initialValueText}>
                      {initialWeight > 0 ? `${initialWeight}kg` : 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.initialValueCard}>
                    <Ionicons name="ellipse-outline" size={24} color={theme.colors.primary} />
                    <Text style={styles.initialValueLabel}>Tour de taille</Text>
                    <Text style={styles.initialValueText}>
                      {initialWaistSize > 0 ? `${initialWaistSize}cm` : 'N/A'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Objectifs cibles */}
              <View style={styles.goalsSection}>
                <Text style={styles.sectionTitle}>Objectifs cibles</Text>

                {/* Poids cible et Tour de taille cible côte à côte */}
                <View style={styles.rowContainer}>
                  <View style={[styles.inputContainer, styles.halfWidth]}>
                    <Text style={styles.label}>Poids cible (kg) *</Text>
                    <TextInput
                      style={[styles.input, errors.targetWeight && styles.inputError]}
                      placeholder="Ex: 65"
                      value={formData.targetWeight}
                      onChangeText={(text) => updateFormData('targetWeight', text.replace(/[^0-9.]/g, ''))}
                      keyboardType="decimal-pad"
                    />
                    {errors.targetWeight && <Text style={styles.errorText}>{errors.targetWeight}</Text>}
                  </View>

                  <View style={[styles.inputContainer, styles.halfWidth]}>
                    <Text style={styles.label}>Tour de taille cible (cm) *</Text>
                    <TextInput
                      style={[styles.input, errors.targetWaistSize && styles.inputError]}
                      placeholder="Ex: 75"
                      value={formData.targetWaistSize}
                      onChangeText={(text) => updateFormData('targetWaistSize', text.replace(/[^0-9.]/g, ''))}
                      keyboardType="decimal-pad"
                    />
                    {errors.targetWaistSize && <Text style={styles.errorText}>{errors.targetWaistSize}</Text>}
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Objectif général *</Text>
                  <TextInput
                    style={[styles.input, styles.textArea, errors.goal && styles.inputError]}
                    placeholder="Décrivez votre objectif principal"
                    value={formData.goal}
                    onChangeText={(text) => updateFormData('goal', text)}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                  {errors.goal && <Text style={styles.errorText}>{errors.goal}</Text>}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Objectifs spécifiques</Text>
                  {formData.goals.map((goal, index) => (
                    <View key={index} style={styles.goalTag}>
                      <Text style={styles.goalTagText}>{goal}</Text>
                      <TouchableOpacity onPress={() => removeSpecificGoal(index)}>
                        <Ionicons name="close-circle" size={20} color={theme.colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <View style={styles.addGoalContainer}>
                    <TextInput
                      style={styles.addGoalInput}
                      placeholder="Ajouter un objectif spécifique"
                      value={newSpecificGoal}
                      onChangeText={setNewSpecificGoal}
                      onSubmitEditing={addSpecificGoal}
                    />
                    <TouchableOpacity style={styles.addGoalButton} onPress={addSpecificGoal}>
                      <Ionicons name="add-circle" size={24} color={theme.colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Restrictions alimentaires</Text>
                  <View style={styles.restrictionsContainer}>
                    {DIETARY_RESTRICTIONS.map((restriction) => (
                      <TouchableOpacity
                        key={restriction}
                        style={[
                          styles.restrictionChip,
                          formData.dietaryRestrictions.includes(restriction) && styles.restrictionChipSelected
                        ]}
                        onPress={() => toggleDietaryRestriction(restriction)}
                      >
                        <Text style={[
                          styles.restrictionChipText,
                          formData.dietaryRestrictions.includes(restriction) && styles.restrictionChipTextSelected
                        ]}>
                          {restriction}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Footer Button */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.completeButton, loading && styles.completeButtonDisabled]}
                onPress={handleComplete}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.completeButtonText}>Compléter</Text>
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '95%',
    minHeight: '85%',
    paddingTop: 12,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  initialValuesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  initialValuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  initialValueCard: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  initialValueLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 8,
    marginBottom: 4,
  },
  initialValueText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  goalsSection: {
    marginTop: 8,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  halfWidth: {
    flex: 1,
    marginBottom: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  goalTag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  goalTagText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    flex: 1,
  },
  addGoalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  addGoalInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  addGoalButton: {
    padding: 4,
  },
  restrictionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  restrictionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  restrictionChipSelected: {
    backgroundColor: theme.colors.primary + '20',
    borderColor: theme.colors.primary,
  },
  restrictionChipText: {
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  restrictionChipTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  completeButtonDisabled: {
    opacity: 0.6,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ProfileStep2BottomSheet;

