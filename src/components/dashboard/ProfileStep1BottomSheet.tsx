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
import { useAuth } from '../../context/FirebaseAuthContext';
import Toast from 'react-native-toast-message';

interface ProfileStep1BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
  user?: any;
  dashboardData?: any;
}

// Liste des pays en ordre alphabétique avec RDC en premier
const COUNTRIES = [
  'République démocratique du Congo',
  'Algérie',
  'Andorre',
  'Bénin',
  'Belgique',
  'Burkina Faso',
  'Cameroun',
  'Canada',
  'Congo',
  'Côte d\'Ivoire',
  'Comores',
  'Djibouti',
  'France',
  'Gabon',
  'Guinée',
  'Guinée-Bissau',
  'Haïti',
  'Luxembourg',
  'Madagascar',
  'Mali',
  'Maroc',
  'Maurice',
  'Mauritanie',
  'Monaco',
  'Niger',
  'République centrafricaine',
  'Sénégal',
  'Seychelles',
  'Suisse',
  'Tchad',
  'Togo',
  'Tunisie',
  'Vanuatu',
  'Autre'
];

// Occupations en français
const OCCUPATIONS = [
  'Ingénieur logiciel',
  'Enseignant',
  'Étudiant',
  'Professionnel de la santé',
  'Manager',
  'Travailleur indépendant',
  'Sans emploi',
  'Retraité',
  'Autre'
];

const GENDERS = [
  'Homme',
  'Femme',
  'Autre'
];

const ProfileStep1BottomSheet: React.FC<ProfileStep1BottomSheetProps> = ({
  visible,
  onClose,
  onComplete,
  user,
  dashboardData,
}) => {
  const insets = useSafeAreaInsets();
  const { completeProfileSetup, loading } = useOnboarding();
  const [currentSubStep, setCurrentSubStep] = useState(1);
  
  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Informations personnelles
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    // Step 2: Adresse
    addressLine1: '',
    addressLine2: '',
    city: '',
    postalCode: '',
    country: 'République démocratique du Congo',
    // Step 3: Profil
    height: '',
    initialWeight: '',
    initialWaistSize: '',
    gender: '',
    occupation: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showOccupationPicker, setShowOccupationPicker] = useState(false);

  // Initialize form with user data if available
  useEffect(() => {
    if (visible) {
      // Récupérer le numéro de téléphone depuis plusieurs sources possibles
      const phoneNumber = 
        user?.phoneNumber || 
        user?.phone || 
        dashboardData?.Profile?.phoneNumber ||
        dashboardData?.profile?.phoneNumber ||
        dashboardData?.phoneNumber ||
        '';
      
      // Récupérer les autres données
      const firstName = user?.firstName || dashboardData?.Profile?.firstName || dashboardData?.profile?.firstName || '';
      const lastName = user?.lastName || dashboardData?.Profile?.lastName || dashboardData?.profile?.lastName || user?.name?.split(' ')[1] || '';
      const email = user?.email || dashboardData?.email || '';
      
      // Récupérer l'adresse depuis dashboardData si disponible
      const address = dashboardData?.Profile?.address || dashboardData?.profile?.address || dashboardData?.address || '';
      let addressLine1 = '';
      let addressLine2 = '';
      let city = '';
      let postalCode = '';
      let country = 'République démocratique du Congo';
      
      if (address) {
        // Parser l'adresse (format: "line1; line2; city; postalCode; country")
        const addressParts = address.split(';').map((part: string) => part.trim());
        addressLine1 = addressParts[0] || '';
        addressLine2 = addressParts[1] || '';
        city = addressParts[2] || '';
        postalCode = addressParts[3] || '';
        country = addressParts[4] || 'République démocratique du Congo';
      }
      
      // Récupérer les données du profil
      const height = dashboardData?.Profile?.height?.toString() || dashboardData?.profile?.height?.toString() || '';
      const initialWeight = dashboardData?.Profile?.initialWeight?.toString() || dashboardData?.profile?.initialWeight?.toString() || '';
      const initialWaistSize = dashboardData?.Profile?.initialWaistSize?.toString() || dashboardData?.profile?.initialWaistSize?.toString() || '';
      const gender = dashboardData?.Profile?.gender || dashboardData?.profile?.gender || '';
      const occupation = dashboardData?.Profile?.occupation || dashboardData?.profile?.occupation || '';
      
      setFormData(prev => ({
        ...prev,
        firstName,
        lastName,
        email,
        phoneNumber,
        addressLine1,
        addressLine2,
        city,
        postalCode,
        country: country || 'République démocratique du Congo',
        height,
        initialWeight,
        initialWaistSize,
        gender,
        occupation,
      }));
    }
  }, [user, dashboardData, visible]);

  // Reset form when modal closes
  useEffect(() => {
    if (!visible) {
      setCurrentSubStep(1);
      setErrors({});
      setShowCountryPicker(false);
      setShowGenderPicker(false);
      setShowOccupationPicker(false);
    }
  }, [visible]);

  const updateFormData = (field: string, value: string) => {
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

  const validateSubStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'Le prénom est requis';
      if (!formData.lastName.trim()) newErrors.lastName = 'Le nom est requis';
      if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Le numéro de téléphone est requis';
      if (!formData.email.trim()) newErrors.email = 'L\'email est requis';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Email invalide';
      }
    } else if (step === 2) {
      if (!formData.addressLine1.trim()) newErrors.addressLine1 = 'L\'adresse ligne 1 est requise';
      if (!formData.city.trim()) newErrors.city = 'La ville est requise';
      if (!formData.postalCode.trim()) newErrors.postalCode = 'Le code postal est requis';
      if (!formData.country.trim()) newErrors.country = 'Le pays est requis';
    } else if (step === 3) {
      if (!formData.height.trim()) newErrors.height = 'La taille est requise';
      else if (isNaN(parseFloat(formData.height)) || parseFloat(formData.height) <= 0) {
        newErrors.height = 'Taille invalide';
      }
      if (!formData.initialWeight.trim()) newErrors.initialWeight = 'Le poids initial est requis';
      else if (isNaN(parseFloat(formData.initialWeight)) || parseFloat(formData.initialWeight) <= 0) {
        newErrors.initialWeight = 'Poids invalide';
      }
      if (!formData.initialWaistSize.trim()) newErrors.initialWaistSize = 'Le tour de taille est requis';
      else if (isNaN(parseFloat(formData.initialWaistSize)) || parseFloat(formData.initialWaistSize) <= 0) {
        newErrors.initialWaistSize = 'Tour de taille invalide';
      }
      if (!formData.gender.trim()) newErrors.gender = 'Le genre est requis';
      if (!formData.occupation.trim()) newErrors.occupation = 'L\'occupation est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateSubStep(currentSubStep)) {
      if (currentSubStep < 3) {
        setCurrentSubStep(currentSubStep + 1);
      } else {
        handleComplete();
      }
    }
  };

  const handlePrevious = () => {
    if (currentSubStep > 1) {
      setCurrentSubStep(currentSubStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!validateSubStep(3)) {
      return;
    }

    try {
      const result = await completeProfileSetup({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        email: formData.email.trim(),
        addressLine1: formData.addressLine1.trim(),
        addressLine2: formData.addressLine2.trim(),
        city: formData.city.trim(),
        postalCode: formData.postalCode.trim(),
        country: formData.country,
        height: formData.height.trim(),
        initialWeight: formData.initialWeight.trim(),
        initialWaistSize: formData.initialWaistSize.trim(),
        gender: formData.gender,
        occupation: formData.occupation,
      });

      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Étape 1 complétée !',
          text2: '+100 points obtenus',
          visibilityTime: 3000,
        });
        onComplete();
        onClose();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: result.error || 'Impossible de compléter l\'étape 1',
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

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Informations personnelles</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Prénom *</Text>
        <TextInput
          style={[styles.input, errors.firstName && styles.inputError]}
          placeholder="Entrez votre prénom"
          value={formData.firstName}
          onChangeText={(text) => updateFormData('firstName', text)}
          autoCapitalize="words"
        />
        {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Nom de famille *</Text>
        <TextInput
          style={[styles.input, errors.lastName && styles.inputError]}
          placeholder="Entrez votre nom de famille"
          value={formData.lastName}
          onChangeText={(text) => updateFormData('lastName', text)}
          autoCapitalize="words"
        />
        {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Numéro de téléphone *</Text>
        <TextInput
          style={[styles.input, errors.phoneNumber && styles.inputError]}
          placeholder="Entrez votre numéro de téléphone"
          value={formData.phoneNumber}
          onChangeText={(text) => updateFormData('phoneNumber', text.replace(/[^0-9]/g, ''))}
          keyboardType="phone-pad"
          maxLength={15}
        />
        {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={[styles.input, errors.email && styles.inputError]}
          placeholder="Entrez votre email"
          value={formData.email}
          onChangeText={(text) => updateFormData('email', text)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Adresse</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Adresse ligne 1 *</Text>
        <TextInput
          style={[styles.input, errors.addressLine1 && styles.inputError]}
          placeholder="Entrez votre adresse"
          value={formData.addressLine1}
          onChangeText={(text) => updateFormData('addressLine1', text)}
        />
        {errors.addressLine1 && <Text style={styles.errorText}>{errors.addressLine1}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Adresse ligne 2 (optionnel)</Text>
        <TextInput
          style={styles.input}
          placeholder="Complément d'adresse"
          value={formData.addressLine2}
          onChangeText={(text) => updateFormData('addressLine2', text)}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Ville *</Text>
        <TextInput
          style={[styles.input, errors.city && styles.inputError]}
          placeholder="Entrez votre ville"
          value={formData.city}
          onChangeText={(text) => updateFormData('city', text)}
          autoCapitalize="words"
        />
        {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Code postal *</Text>
        <TextInput
          style={[styles.input, errors.postalCode && styles.inputError]}
          placeholder="Entrez votre code postal"
          value={formData.postalCode}
          onChangeText={(text) => updateFormData('postalCode', text)}
          keyboardType="default"
        />
        {errors.postalCode && <Text style={styles.errorText}>{errors.postalCode}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Pays *</Text>
        <TouchableOpacity
          style={[styles.pickerButton, errors.country && styles.inputError]}
          onPress={() => setShowCountryPicker(true)}
        >
          <Text style={[styles.pickerText, !formData.country && styles.pickerPlaceholder]}>
            {formData.country || 'Sélectionnez un pays'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
        {errors.country && <Text style={styles.errorText}>{errors.country}</Text>}
      </View>

      {/* Country Picker Modal */}
      <Modal
        visible={showCountryPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <View style={styles.pickerModal}>
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Sélectionnez un pays</Text>
              <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {COUNTRIES.map((country) => (
                <TouchableOpacity
                  key={country}
                  style={styles.pickerOption}
                  onPress={() => {
                    updateFormData('country', country);
                    setShowCountryPicker(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>{country}</Text>
                  {formData.country === country && (
                    <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Profil</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Taille (m) *</Text>
        <TextInput
          style={[styles.input, errors.height && styles.inputError]}
          placeholder="Ex: 1.75"
          value={formData.height}
          onChangeText={(text) => updateFormData('height', text.replace(/[^0-9.]/g, ''))}
          keyboardType="decimal-pad"
        />
        {errors.height && <Text style={styles.errorText}>{errors.height}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Poids initial (kg) *</Text>
        <TextInput
          style={[styles.input, errors.initialWeight && styles.inputError]}
          placeholder="Ex: 70"
          value={formData.initialWeight}
          onChangeText={(text) => updateFormData('initialWeight', text.replace(/[^0-9.]/g, ''))}
          keyboardType="decimal-pad"
        />
        {errors.initialWeight && <Text style={styles.errorText}>{errors.initialWeight}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Tour de taille initial (cm) *</Text>
        <TextInput
          style={[styles.input, errors.initialWaistSize && styles.inputError]}
          placeholder="Ex: 85"
          value={formData.initialWaistSize}
          onChangeText={(text) => updateFormData('initialWaistSize', text.replace(/[^0-9.]/g, ''))}
          keyboardType="decimal-pad"
        />
        {errors.initialWaistSize && <Text style={styles.errorText}>{errors.initialWaistSize}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Genre *</Text>
        <TouchableOpacity
          style={[styles.pickerButton, errors.gender && styles.inputError]}
          onPress={() => setShowGenderPicker(true)}
        >
          <Text style={[styles.pickerText, !formData.gender && styles.pickerPlaceholder]}>
            {formData.gender || 'Sélectionnez votre genre'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
        {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Occupation *</Text>
        <TouchableOpacity
          style={[styles.pickerButton, errors.occupation && styles.inputError]}
          onPress={() => setShowOccupationPicker(true)}
        >
          <Text style={[styles.pickerText, !formData.occupation && styles.pickerPlaceholder]}>
            {formData.occupation || 'Sélectionnez votre occupation'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>
        {errors.occupation && <Text style={styles.errorText}>{errors.occupation}</Text>}
      </View>

      {/* Gender Picker Modal */}
      <Modal
        visible={showGenderPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGenderPicker(false)}
      >
        <View style={styles.pickerModal}>
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Sélectionnez votre genre</Text>
              <TouchableOpacity onPress={() => setShowGenderPicker(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {GENDERS.map((gender) => (
                <TouchableOpacity
                  key={gender}
                  style={styles.pickerOption}
                  onPress={() => {
                    updateFormData('gender', gender);
                    setShowGenderPicker(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>{gender}</Text>
                  {formData.gender === gender && (
                    <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Occupation Picker Modal */}
      <Modal
        visible={showOccupationPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOccupationPicker(false)}
      >
        <View style={styles.pickerModal}>
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Sélectionnez votre occupation</Text>
              <TouchableOpacity onPress={() => setShowOccupationPicker(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {OCCUPATIONS.map((occupation) => (
                <TouchableOpacity
                  key={occupation}
                  style={styles.pickerOption}
                  onPress={() => {
                    updateFormData('occupation', occupation);
                    setShowOccupationPicker(false);
                  }}
                >
                  <Text style={styles.pickerOptionText}>{occupation}</Text>
                  {formData.occupation === occupation && (
                    <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );

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
              <Text style={styles.title}>Étape 1: Mon Profil</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>

            {/* Step Indicator */}
            <View style={styles.stepIndicator}>
              {[1, 2, 3].map((step) => (
                <React.Fragment key={step}>
                  <View style={[
                    styles.stepDot,
                    currentSubStep >= step && styles.stepDotActive,
                    currentSubStep === step && styles.stepDotCurrent
                  ]} />
                  {step < 3 && (
                    <View style={[
                      styles.stepLine,
                      currentSubStep > step && styles.stepLineActive
                    ]} />
                  )}
                </React.Fragment>
              ))}
            </View>

            {/* Content */}
            <ScrollView 
              style={styles.content} 
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.contentContainer}
            >
              {currentSubStep === 1 && renderStep1()}
              {currentSubStep === 2 && renderStep2()}
              {currentSubStep === 3 && renderStep3()}
            </ScrollView>

            {/* Footer Buttons */}
            <View style={styles.footer}>
              {currentSubStep > 1 && (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handlePrevious}
                  disabled={loading}
                >
                  <Ionicons name="arrow-back" size={20} color={theme.colors.primary} />
                  <Text style={styles.backButtonText}>Précédent</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[styles.completeButton, loading && styles.completeButtonDisabled]}
                onPress={currentSubStep === 3 ? handleComplete : handleNext}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.completeButtonText}>
                      {currentSubStep === 3 ? 'Compléter' : 'Suivant'}
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
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
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E0E0E0',
  },
  stepDotActive: {
    backgroundColor: theme.colors.primary,
  },
  stepDotCurrent: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: theme.colors.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  stepContent: {
    paddingBottom: 20,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
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
  inputError: {
    borderColor: theme.colors.error,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  pickerButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  pickerText: {
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  pickerPlaceholder: {
    color: '#999',
  },
  pickerModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingTop: 12,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  pickerOptionText: {
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.primary,
  },
  completeButton: {
    flex: 1,
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

export default ProfileStep1BottomSheet;

