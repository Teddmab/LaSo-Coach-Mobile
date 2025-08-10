import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Image,
  StatusBar,
  TextInput,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import SubscriptionBanner from '../components/SubscriptionBanner';
import SubscriptionService from '../services/subscriptionService';

const ProfileScreen = ({ user, onLogout, onTabPress, activeTab, onClose, initialStep = 1 }) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showObjectivesModal, setShowObjectivesModal] = useState(false);
  const [showRecommendationsModal, setShowRecommendationsModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [hasExistingAppointment, setHasExistingAppointment] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedTab, setSelectedTab] = useState('subscriptions'); // subscriptions or transactions
  const [expandedPlan, setExpandedPlan] = useState(null); // which plan details are expanded
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    dailyInstructions: false,
    mandatoryRequirements: false,
    otherRecommendations: false
  });
  const [formData, setFormData] = useState({
    firstName: 'Teddy mabulay mabulay',
    lastName: 'Mabulay',
    phone: '56796774',
    email: 'teddmabulay@gmail.com',
    address1: 'Test',
    address2: '',
    city: 'Kinshasa',
    postalCode: '78686',
    country: 'Azerbaidjan',
    height: '1,75',
    initialWeight: '70',
    initialWaist: '80',
    gender: 'Homme',
    occupation: 'Sélectionner',
    // Step 2 - Objectives
    targetWeight: '60',
    targetWaist: '60',
    generalObjective: 'Perdre beaucoup en première semaine',
    specificObjectives: ['Obj spec 1', 'Obj spec 2', 'Obj spec 3', 'Obj spec 4'],
    dietaryRestrictions: ['Végétarien', 'Sans noix', 'Aucune', 'Autre'],
    acceptedTerms: true,
    // Step 3 - Photo consent
    photoConsent: true,
    // Step 4 - Appointment
    appointmentDate: '17.07.2025, 22:00',
    appointmentDuration: '60 minutes',
    appointmentSubject: 'Perdre du poid et retrouver une taille de gueppe',
    appointmentNotes: 'Je souhaite reprendre ma taille d avant mariage'
  });

  // Update currentStep when initialStep changes
  useEffect(() => {
    setCurrentStep(initialStep);
  }, [initialStep]);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      console.log('💳 Profile: Checking subscription status...');
      const data = await SubscriptionService.getSubscriptionStatus();
      setSubscriptionData(data);
    } catch (error) {
      console.error('❌ Profile: Error checking subscription status:', error);
      setSubscriptionData({
        status: 'EXPIRED',
        isExpired: true,
        requiresRenewal: true
      });
    }
  };

  const handleSubscriptionRenew = () => {
    console.log('🔄 Profile: Navigating to subscription renewal page');
    // Since we're already on the profile screen, just ensure we're on step 5
    setCurrentStep(5);
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    if (currentStep === 1) {
      setShowSaveModal(true);
    } else if (currentStep === 2) {
      setShowObjectivesModal(true);
    } else if (currentStep === 3) {
      setShowRecommendationsModal(true);
    } else if (currentStep === 4) {
      // Move to subscription step
      setCurrentStep(5);
    } else if (currentStep === 5) {
      // Move to summary step
      setCurrentStep(6);
    } else if (currentStep === 6) {
      // Onboarding completed - redirect to home
      console.log('Onboarding completed, redirecting to home');
      onClose(); // This will close the profile screen and return to dashboard
    } else {
      // Handle next step for other steps
      console.log('Next step from step:', currentStep);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
    console.log('Previous step to:', currentStep - 1);
  };

  const handleSaveProfile = () => {
    setShowSaveModal(false);
    setCurrentStep(2);
    console.log('Profile saved, moving to step 2');
  };

  const handleSaveObjectives = () => {
    setShowObjectivesModal(false);
    setCurrentStep(3);
    console.log('Objectives saved, moving to step 3');
  };

  const handleSaveRecommendations = () => {
    setShowRecommendationsModal(false);
    setCurrentStep(4);
    console.log('Recommendations saved, moving to step 4');
  };

  const handleCancelSave = () => {
    setShowSaveModal(false);
    console.log('Save cancelled');
  };

  const handleCancelObjectives = () => {
    setShowObjectivesModal(false);
    console.log('Objectives save cancelled');
  };

  const handleCancelRecommendations = () => {
    setShowRecommendationsModal(false);
    console.log('Recommendations save cancelled');
  };

  const handleBookAppointment = () => {
    setHasExistingAppointment(true);
    setShowBookingForm(true);
    setShowAppointmentModal(true);
    console.log('Appointment booked');
  };

  const handleRescheduleAppointment = () => {
    setShowAppointmentModal(true);
    console.log('Reschedule appointment');
  };

  const handleConfirmAppointment = () => {
    setShowAppointmentModal(false);
    setCurrentStep(5); // Move to subscription step
    console.log('Appointment confirmed, moving to subscription');
  };

  const handleCancelAppointmentModal = () => {
    setShowAppointmentModal(false);
    console.log('Appointment modal cancelled');
  };

  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const addSpecificObjective = () => {
    const newObjectives = [...formData.specificObjectives, `Obj spec ${formData.specificObjectives.length + 1}`];
    updateFormData('specificObjectives', newObjectives);
  };

  const removeSpecificObjective = (index) => {
    const newObjectives = formData.specificObjectives.filter((_, i) => i !== index);
    updateFormData('specificObjectives', newObjectives);
  };

  const toggleDietaryRestriction = (restriction) => {
    const current = formData.dietaryRestrictions;
    if (current.includes(restriction)) {
      updateFormData('dietaryRestrictions', current.filter(r => r !== restriction));
    } else {
      updateFormData('dietaryRestrictions', [...current, restriction]);
    }
  };

  const togglePlanDetails = (planId) => {
    setExpandedPlan(expandedPlan === planId ? null : planId);
  };

  const handleSubscribe = (planType) => {
    console.log('Subscribe to:', planType);
    // Handle subscription logic
  };

  const renderSaveModal = () => (
    <Modal
      visible={showSaveModal}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCancelSave}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.saveModalContainer}>
          <Text style={styles.saveModalTitle}>Confirmer la sauvegarde du profil</Text>
          <Text style={styles.saveModalText}>
            Êtes-vous sûr de vouloir enregistrer ces informations ?
          </Text>
          
          <View style={styles.saveModalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelSave}>
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={handleSaveProfile}>
              <Text style={styles.confirmButtonText}>Confirmer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderObjectivesModal = () => (
    <Modal
      visible={showObjectivesModal}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCancelObjectives}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.saveModalContainer}>
          <Text style={styles.saveModalTitle}>Confirmer la sauvegarde des objectifs</Text>
          <Text style={styles.saveModalText}>
            Êtes-vous sûr de vouloir enregistrer vos objectifs ?
          </Text>
          
          <View style={styles.saveModalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelObjectives}>
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={handleSaveObjectives}>
              <Text style={styles.confirmButtonText}>Confirmer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderRecommendationsModal = () => (
    <Modal
      visible={showRecommendationsModal}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCancelRecommendations}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.saveModalContainer}>
          <Text style={styles.saveModalTitle}>Confirmer la validation des recommandations</Text>
          <Text style={styles.saveModalText}>
            Êtes-vous sûr de vouloir valider cette étape ?
          </Text>
          
          <View style={styles.saveModalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelRecommendations}>
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={handleSaveRecommendations}>
              <Text style={styles.confirmButtonText}>Confirmer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderAppointmentModal = () => (
    <Modal
      visible={showAppointmentModal}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCancelAppointmentModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.saveModalContainer}>
          <Text style={styles.saveModalTitle}>Confirmation de rendez-vous</Text>
          <Text style={styles.saveModalText}>
            {hasExistingAppointment ? 'Voulez-vous réserver un nouveau rendez-vous ?' : 'Voulez-vous réserver un nouveau rendez-vous ?'}
          </Text>
          
          <View style={styles.saveModalButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelAppointmentModal}>
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmAppointment}>
              <Text style={styles.confirmButtonText}>Confirmer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderPersonalInfo = () => (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>Informations Personnelles</Text>
      
      <View style={styles.fullWidthInput}>
        <Text style={styles.inputLabel}>Prénom</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            value={formData.firstName}
            onChangeText={(text) => updateFormData('firstName', text)}
            placeholder="Prénom"
          />
          <TouchableOpacity style={styles.inputIcon}>
            <Ionicons name="ellipsis-horizontal" size={16} color="#999" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.fullWidthInput}>
        <Text style={styles.inputLabel}>Nom de famille</Text>
        <TextInput
          style={styles.textInput}
          value={formData.lastName}
          onChangeText={(text) => updateFormData('lastName', text)}
          placeholder="Nom de famille"
        />
      </View>

      <View style={styles.fullWidthInput}>
        <Text style={styles.inputLabel}>Numéro de téléphone</Text>
        <TextInput
          style={styles.textInput}
          value={formData.phone}
          onChangeText={(text) => updateFormData('phone', text)}
          placeholder="Numéro de téléphone"
          keyboardType="phone-pad"
        />
      </View>
      
      <View style={styles.fullWidthInput}>
        <Text style={styles.inputLabel}>Email</Text>
        <TextInput
          style={styles.textInput}
          value={formData.email}
          onChangeText={(text) => updateFormData('email', text)}
          placeholder="Email"
          keyboardType="email-address"
        />
      </View>

      <View style={styles.fullWidthInput}>
        <Text style={styles.inputLabel}>Adresse ligne 1</Text>
        <TextInput
          style={styles.textInput}
          value={formData.address1}
          onChangeText={(text) => updateFormData('address1', text)}
          placeholder="Adresse ligne 1"
        />
      </View>

      <View style={styles.fullWidthInput}>
        <Text style={styles.inputLabel}>Adresse ligne 2 (optionnel)</Text>
        <TextInput
          style={styles.textInput}
          value={formData.address2}
          onChangeText={(text) => updateFormData('address2', text)}
          placeholder="Adresse ligne 2"
        />
      </View>

      <View style={styles.fullWidthInput}>
        <Text style={styles.inputLabel}>Ville</Text>
        <TextInput
          style={styles.textInput}
          value={formData.city}
          onChangeText={(text) => updateFormData('city', text)}
          placeholder="Ville"
        />
      </View>
      
      <View style={styles.fullWidthInput}>
        <Text style={styles.inputLabel}>Code postal</Text>
        <TextInput
          style={styles.textInput}
          value={formData.postalCode}
          onChangeText={(text) => updateFormData('postalCode', text)}
          placeholder="Code postal"
        />
      </View>

      <View style={styles.fullWidthInput}>
        <Text style={styles.inputLabel}>Pays</Text>
        <TouchableOpacity style={styles.dropdownInput}>
          <Text style={styles.dropdownText}>{formData.country}</Text>
          <Ionicons name="chevron-down" size={20} color="#999" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderProfileInfo = () => (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>Profil</Text>
      
      <View style={styles.fullWidthInput}>
        <Text style={styles.inputLabel}>Taille (m)</Text>
        <TextInput
          style={styles.textInput}
          value={formData.height}
          onChangeText={(text) => updateFormData('height', text)}
          placeholder="Taille en mètres"
          keyboardType="decimal-pad"
        />
      </View>

      <View style={styles.inputRow}>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Poids Initial (kg)</Text>
          <TextInput
            style={styles.textInput}
            value={formData.initialWeight}
            onChangeText={(text) => updateFormData('initialWeight', text)}
            placeholder="Poids initial"
            keyboardType="numeric"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Tour de taille initial (cm)</Text>
          <TextInput
            style={styles.textInput}
            value={formData.initialWaist}
            onChangeText={(text) => updateFormData('initialWaist', text)}
            placeholder="Tour de taille initial"
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.fullWidthInput}>
        <Text style={styles.inputLabel}>Genre</Text>
        <TouchableOpacity style={styles.dropdownInput}>
          <Text style={styles.dropdownText}>{formData.gender}</Text>
          <Ionicons name="chevron-down" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      <View style={styles.fullWidthInput}>
        <Text style={styles.inputLabel}>Occupation</Text>
        <TouchableOpacity style={styles.dropdownInput}>
          <Text style={styles.dropdownText}>{formData.occupation}</Text>
          <Ionicons name="chevron-down" size={20} color="#999" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderObjectivesForm = () => (
    <>
      {/* Initial Values Section */}
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Définissez vos objectifs santé et bien-être</Text>
        
        <Text style={styles.subsectionTitle}>Valeurs initiales</Text>
        
        <View style={styles.fullWidthInput}>
          <Text style={styles.inputLabel}>Taille (m)</Text>
          <TextInput
            style={styles.textInput}
            value={formData.height}
            onChangeText={(text) => updateFormData('height', text)}
            placeholder="Taille en mètres"
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.fullWidthInput}>
          <Text style={styles.inputLabel}>Poids initial (kg)</Text>
          <TextInput
            style={styles.textInput}
            value={formData.initialWeight}
            onChangeText={(text) => updateFormData('initialWeight', text)}
            placeholder="Poids initial"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.fullWidthInput}>
          <Text style={styles.inputLabel}>Tour de taille initial (cm)</Text>
          <TextInput
            style={styles.textInput}
            value={formData.initialWaist}
            onChangeText={(text) => updateFormData('initialWaist', text)}
            placeholder="Tour de taille initial"
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Target Objectives */}
      <View style={styles.formSection}>
        <Text style={styles.subsectionTitle}>Objectifs cibles</Text>
        
        <View style={styles.fullWidthInput}>
          <Text style={styles.inputLabel}>Poids cible (kg)</Text>
          <TextInput
            style={styles.textInput}
            value={formData.targetWeight}
            onChangeText={(text) => updateFormData('targetWeight', text)}
            placeholder="Poids cible"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.fullWidthInput}>
          <Text style={styles.inputLabel}>Tour de taille cible (cm)</Text>
          <TextInput
            style={styles.textInput}
            value={formData.targetWaist}
            onChangeText={(text) => updateFormData('targetWaist', text)}
            placeholder="Tour de taille cible"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.fullWidthInput}>
          <Text style={styles.inputLabel}>Objectif général</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={formData.generalObjective}
            onChangeText={(text) => updateFormData('generalObjective', text)}
            placeholder="Décrivez votre objectif général"
            multiline={true}
            numberOfLines={3}
          />
        </View>

        <View style={styles.fullWidthInput}>
          <Text style={styles.inputLabel}>Objectifs spécifiques</Text>
          {formData.specificObjectives.map((objective, index) => (
            <View key={index} style={styles.specificObjectiveRow}>
              <TextInput
                style={[styles.textInput, styles.specificObjectiveInput]}
                value={objective}
                onChangeText={(text) => {
                  const newObjectives = [...formData.specificObjectives];
                  newObjectives[index] = text;
                  updateFormData('specificObjectives', newObjectives);
                }}
                placeholder={`Objectif spécifique ${index + 1}`}
              />
              <TouchableOpacity 
                style={styles.removeObjectiveButton}
                onPress={() => removeSpecificObjective(index)}
              >
                <Ionicons name="close" size={20} color="#F44336" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.addObjectiveButton} onPress={addSpecificObjective}>
            <Text style={styles.addObjectiveText}>+ Ajouter un objectif</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.fullWidthInput}>
          <Text style={styles.inputLabel}>Restrictions alimentaires</Text>
          <View style={styles.restrictionsContainer}>
            {[
              'Végétarien', 'Vegan', 'Sans lactose', 'Sans gluten', 'Sans noix',
              'Sans œufs', 'Sans fruits de mer', 'Halal', 'Casher', 'Aucune', 'Autre'
            ].map((restriction) => (
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

        <View style={styles.fullWidthInput}>
          <Text style={styles.inputLabel}>Genre</Text>
          <TouchableOpacity style={styles.dropdownInput}>
            <Text style={styles.dropdownText}>Male</Text>
            <Ionicons name="chevron-down" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={styles.fullWidthInput}>
          <Text style={styles.inputLabel}>Occupation</Text>
          <TouchableOpacity style={styles.dropdownInput}>
            <Text style={styles.dropdownText}>Manager</Text>
            <Ionicons name="chevron-down" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={styles.termsContainer}>
          <TouchableOpacity 
            style={styles.checkbox}
            onPress={() => updateFormData('acceptedTerms', !formData.acceptedTerms)}
          >
            <Ionicons 
              name={formData.acceptedTerms ? "checkbox" : "square-outline"} 
              size={20} 
              color={formData.acceptedTerms ? "#2196F3" : "#999"}
            />
          </TouchableOpacity>
          <Text style={styles.termsText}>
            J'ai lu et j'accepte les{' '}
            <Text style={styles.termsLink}>règles et conditions</Text>
          </Text>
        </View>
      </View>
    </>
  );

  const renderRecommendationsForm = () => (
    <>
      {/* General Recommendations */}
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Recommandations générales</Text>
        
        <View style={styles.recommendationItem}>
          <Text style={styles.recommendationText}>
            Restez motivé et honnête avec vous-même tout au long du programme.
          </Text>
        </View>
        
        <View style={styles.recommendationItem}>
          <Text style={styles.recommendationText}>
            Hydratez-vous régulièrement et privilégiez une alimentation équilibrée.
          </Text>
        </View>
        
        <View style={styles.recommendationItem}>
          <Text style={styles.recommendationText}>
            Écoutez votre corps et respectez vos limites.
          </Text>
        </View>
      </View>

      {/* Collapsible Sections */}
      <View style={styles.formSection}>
        {/* Daily Instructions */}
        <TouchableOpacity 
          style={styles.collapsibleHeader}
          onPress={() => toggleSection('dailyInstructions')}
        >
          <Text style={styles.collapsibleTitle}>Instructions quotidiennes & hebdomadaires</Text>
          <Ionicons 
            name={expandedSections.dailyInstructions ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#666" 
          />
        </TouchableOpacity>
        
        {expandedSections.dailyInstructions && (
          <View style={styles.collapsibleContent}>
            <View style={styles.requirementItem}>
              <Ionicons name="cafe-outline" size={20} color="#2196F3" />
              <Text style={styles.requirementText}>
                À partir de maintenant, préparez 2L d'eau avec jus de citron frais, cela pour vous accompagner toute la journée
              </Text>
            </View>
            
            <View style={styles.requirementItem}>
              <Ionicons name="time-outline" size={20} color="#2196F3" />
              <Text style={styles.requirementText}>Ne sautez pas les heures de repas</Text>
            </View>
            
            <View style={styles.requirementItem}>
              <Ionicons name="restaurant-outline" size={20} color="#2196F3" />
              <Text style={styles.requirementText}>Ne grignotez pas entre les repas</Text>
            </View>
            
            <View style={styles.requirementItem}>
              <Ionicons name="close-circle-outline" size={20} color="#2196F3" />
              <Text style={styles.requirementText}>Pas de sucre</Text>
            </View>
            
            <View style={styles.requirementItem}>
              <Ionicons name="close-circle-outline" size={20} color="#2196F3" />
              <Text style={styles.requirementText}>Moins de sel, Si possible pas du tout</Text>
            </View>
            
            <View style={styles.requirementItem}>
              <Ionicons name="close-circle-outline" size={20} color="#2196F3" />
              <Text style={styles.requirementText}>Pas de féculents !</Text>
            </View>
            
            <View style={styles.requirementItem}>
              <Ionicons name="close-circle-outline" size={20} color="#2196F3" />
              <Text style={styles.requirementText}>Pas de bananes pendant ce régime</Text>
            </View>
            
            <View style={styles.requirementItem}>
              <Ionicons name="close-circle-outline" size={20} color="#2196F3" />
              <Text style={styles.requirementText}>Pas de sport pendant ce régime</Text>
            </View>
            
            <View style={styles.requirementItem}>
              <Ionicons name="close-circle-outline" size={20} color="#2196F3" />
              <Text style={styles.requirementText}>Pas une goutte d'alcool !</Text>
            </View>
            
            <View style={styles.requirementItem}>
              <Ionicons name="heart-outline" size={20} color="#2196F3" />
              <Text style={styles.requirementText}>
                Priorisez l'utilisation de l'huile d'olive ou huile de Coco dans vos cuissons
              </Text>
            </View>
            
            <View style={styles.requirementItem}>
              <Ionicons name="time-outline" size={20} color="#2196F3" />
              <Text style={styles.requirementText}>Sommeil obligatoire de 8 heures du temps ou plus</Text>
            </View>
            
            <View style={styles.requirementItem}>
              <Ionicons name="cafe-outline" size={20} color="#2196F3" />
              <Text style={styles.requirementText}>
                Boissons avant petit-déjeuner et avant de se coucher (obligatoires)
              </Text>
            </View>
            
            <View style={styles.requirementItem}>
              <Ionicons name="restaurant-outline" size={20} color="#2196F3" />
              <Text style={styles.requirementText}>
                Si vous travaillez, Rien ne vous empêche de préparer un lunch box et de manger ce qui est instruit, de manière équilibrée
              </Text>
            </View>
          </View>
        )}

        {/* Mandatory Requirements */}
        <TouchableOpacity 
          style={styles.collapsibleHeader}
          onPress={() => toggleSection('mandatoryRequirements')}
        >
          <Text style={styles.collapsibleTitle}>Exigences obligatoires</Text>
          <Ionicons 
            name={expandedSections.mandatoryRequirements ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#666" 
          />
        </TouchableOpacity>
        
        {expandedSections.mandatoryRequirements && (
          <View style={styles.collapsibleContent}>
            <View style={styles.requirementItem}>
              <Ionicons name="scale-outline" size={20} color="#FF6B35" />
              <Text style={styles.requirementText}>Achetez une balance digitale (Obligatoire)</Text>
            </View>
            
            <View style={styles.requirementItem}>
              <Ionicons name="basket-outline" size={20} color="#FF6B35" />
              <Text style={styles.requirementText}>Achetez une centrifugeuse (Obligatoire)</Text>
            </View>
            
            <View style={styles.requirementItem}>
              <Ionicons name="basket-outline" size={20} color="#FF6B35" />
              <Text style={styles.requirementText}>Achetez un presse-agrume (Obligatoire)</Text>
            </View>
            
            <View style={styles.requirementItem}>
              <Ionicons name="scale-outline" size={20} color="#FF6B35" />
              <Text style={styles.requirementText}>Me présenter votre poids tous les jours (Obligatoire)</Text>
            </View>
          </View>
        )}

        {/* Other Recommendations */}
        <TouchableOpacity 
          style={styles.collapsibleHeader}
          onPress={() => toggleSection('otherRecommendations')}
        >
          <Text style={styles.collapsibleTitle}>Autres recommandations</Text>
          <Ionicons 
            name={expandedSections.otherRecommendations ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#666" 
          />
        </TouchableOpacity>
        
        {expandedSections.otherRecommendations && (
          <View style={styles.collapsibleContent}>
            <View style={styles.requirementItem}>
              <Ionicons name="basket-outline" size={20} color="#FF6B35" />
              <Text style={styles.requirementText}>Achetez des graines de Chia, si possible</Text>
            </View>
            
            <View style={styles.requirementItem}>
              <Ionicons name="scale-outline" size={20} color="#FF6B35" />
              <Text style={styles.requirementText}>
                Faites attention à la quantité de la nourriture ! Dans cette phase test, vous apprenez à gérer votre quantité
              </Text>
            </View>
            
            <View style={styles.requirementItem}>
              <Ionicons name="cafe-outline" size={20} color="#FF6B35" />
              <Text style={styles.requirementText}>
                Coupe-faim ? Du thé vert sans sucre et sans miel ou une pomme ou deux fruits moyens – Ex : pomme ou poire
              </Text>
            </View>
            
            <View style={styles.requirementItem}>
              <Ionicons name="warning-outline" size={20} color="#FF6B35" />
              <Text style={styles.requirementText}>Surtout ne pas faire ce programme pendant l'allaitement !</Text>
            </View>
            
            <View style={styles.requirementItem}>
              <Ionicons name="chatbubble-outline" size={20} color="#FF6B35" />
              <Text style={styles.requirementText}>Me contacter uniquement si vous êtes déterminé !</Text>
            </View>
            
            <View style={styles.requirementItem}>
              <Ionicons name="chatbubble-outline" size={20} color="#FF6B35" />
              <Text style={styles.requirementText}>
                Restez honnête, même lorsque vous ne suivez pas les instructions, dites-le.
              </Text>
            </View>
            
            <View style={styles.requirementItem}>
              <Ionicons name="lock-closed-outline" size={20} color="#FF6B35" />
              <Text style={styles.requirementText}>Surtout ne pas partager les menus LaSo'Coach (ils sont confidentiels)</Text>
            </View>
            
            <View style={styles.requirementItem}>
              <Ionicons name="chatbubble-outline" size={20} color="#FF6B35" />
              <Text style={styles.requirementText}>
                Merci de me citer vos restrictions alimentaires et vos habitudes dans la semaine
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Photo Consent */}
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Consentement photo</Text>
        
        <View style={styles.photoConsentContainer}>
          <Ionicons name="lock-closed" size={20} color="#7B68EE" />
          <Text style={styles.photoConsentQuestion}>
            Autorisez-vous LASO'COACH à utiliser votre image, dans sa rubrique des sessions photos avant et après sur les réseaux sociaux et le site web ?
          </Text>
        </View>
        
        <View style={styles.consentAnswerContainer}>
          <TouchableOpacity 
            style={styles.checkbox}
            onPress={() => updateFormData('photoConsent', !formData.photoConsent)}
          >
            <Ionicons 
              name={formData.photoConsent ? "checkbox" : "square-outline"} 
              size={20} 
              color={formData.photoConsent ? "#2196F3" : "#999"}
            />
          </TouchableOpacity>
          <View style={styles.consentTextContainer}>
            <Text style={styles.consentAnswerText}>Oui, j'accepte.</Text>
            <Text style={styles.consentDetailText}>
              * Si vous cochez "Oui , j'accepte!" , Envoyez une photo avant de commencer le programme avec des vêtements serrés, debout face et debout profil. Envoyez la capture de votre poids sur la balance digitale tous les matins au réveil ( Après premières toilettes de préférence, capture du poids uniquement ).
            </Text>
          </View>
        </View>
      </View>
    </>
  );

  const renderAppointmentForm = () => (
    <>
      {hasExistingAppointment ? (
        <>
          {/* Existing Appointment Display */}
          <View style={styles.appointmentCard}>
            <Text style={styles.appointmentCardTitle}>Rendez-vous programmé</Text>
            <View style={styles.appointmentStatus}>
              <Text style={styles.appointmentStatusText}>En attente de confirmation du coach</Text>
            </View>
            
            <View style={styles.appointmentDetails}>
              <Text style={styles.appointmentDetailLabel}>Date:</Text>
              <Text style={styles.appointmentDetailValue}>8/17/2025, 10:00:00 PM</Text>
            </View>
            
            <View style={styles.appointmentDetails}>
              <Text style={styles.appointmentDetailLabel}>Durée:</Text>
              <Text style={styles.appointmentDetailValue}>60 minutes</Text>
            </View>
            
            <View style={styles.appointmentDetails}>
              <Text style={styles.appointmentDetailLabel}>Sujet:</Text>
              <Text style={styles.appointmentDetailValue}>Perdre du poid et retrouver une taille de gueppe</Text>
            </View>
            
            <View style={styles.appointmentDetails}>
              <Text style={styles.appointmentDetailLabel}>Notes:</Text>
              <Text style={styles.appointmentDetailValue}>Je souhaite reprendre ma taille d avant mariage</Text>
            </View>
            
            <TouchableOpacity style={styles.rescheduleButton} onPress={handleRescheduleAppointment}>
              <Text style={styles.rescheduleButtonText}>Reprogrammer le rendez-vous</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.formSection}>
          <TouchableOpacity style={styles.bookAppointmentButton} onPress={handleBookAppointment}>
            <Text style={styles.bookAppointmentButtonText}>Prendre RDV avec Sonia</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Appointment Booking Form - Only show after clicking book appointment */}
      {showBookingForm && (
        <View style={styles.formSection}>
          <View style={styles.fullWidthInput}>
            <Text style={styles.inputLabel}>Date et heure du rendez-vous *</Text>
            <View style={styles.dateTimeInputWrapper}>
              <TextInput
                style={[styles.textInput, styles.dateTimeInput]}
                value={formData.appointmentDate}
                onChangeText={(text) => updateFormData('appointmentDate', text)}
                placeholder="DD.MM.YYYY, HH:MM"
              />
              <TouchableOpacity style={styles.calendarIcon}>
                <Ionicons name="calendar-outline" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fullWidthInput}>
            <Text style={styles.inputLabel}>Durée *</Text>
            <TouchableOpacity style={styles.dropdownInput}>
              <Text style={styles.dropdownText}>{formData.appointmentDuration}</Text>
              <Ionicons name="chevron-down" size={20} color="#999" />
            </TouchableOpacity>
          </View>

          <View style={styles.fullWidthInput}>
            <Text style={styles.inputLabel}>Sujet de la session *</Text>
            <TextInput
              style={[styles.textInput, styles.subjectInput]}
              value={formData.appointmentSubject}
              onChangeText={(text) => updateFormData('appointmentSubject', text)}
              placeholder="Décrivez l'objectif de votre session"
              multiline={true}
              numberOfLines={3}
            />
            <Text style={styles.characterCount}>48/500</Text>
          </View>

          <View style={styles.fullWidthInput}>
            <Text style={styles.inputLabel}>Notes (optionnel)</Text>
            <TextInput
              style={[styles.textInput, styles.notesInput]}
              value={formData.appointmentNotes}
              onChangeText={(text) => updateFormData('appointmentNotes', text)}
              placeholder="Ajoutez des notes supplémentaires..."
              multiline={true}
              numberOfLines={4}
            />
            <Text style={styles.characterCount}>46/1000</Text>
          </View>

          <View style={styles.appointmentActions}>
            <TouchableOpacity style={styles.confirmAppointmentButton} onPress={handleBookAppointment}>
              <Text style={styles.confirmAppointmentButtonText}>Reprogrammer le rendez-vous</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );

  const renderSubscriptionForm = () => (
    <>
      {/* Current Subscription - Flexy */}
      <View style={styles.currentSubscriptionCard}>
        <View style={styles.planBadge}>
          <Text style={styles.planBadgeText}>Flexy</Text>
        </View>
        
        <View style={styles.priceContainer}>
          <Text style={styles.oldPrice}>15€</Text>
          <Text style={styles.currentPrice}>5€ / mois</Text>
          <Text style={styles.discount}>-67%</Text>
        </View>
        
        <View style={styles.billingInfo}>
          <Text style={styles.billingText}>Date de paiement : 7/12/2025</Text>
          <Text style={styles.billingText}>Méthode : paypal</Text>
          <Text style={styles.billingText}>Montant : 5 USD</Text>
        </View>
      </View>

      {/* Billing Section */}
      <View style={styles.billingSection}>
        <Text style={styles.billingSectionTitle}>Facturation</Text>
        <Text style={styles.billingStatus}>Gratuit</Text>
        <Text style={styles.billingPeriod}>Période de facturation: Mensuelle</Text>
        <Text style={styles.renewalDate}>Date de Renouvellement: 16 juillet 2025</Text>
        
        <TouchableOpacity style={styles.viewInvoicesButton}>
          <Text style={styles.viewInvoicesButtonText}>Voir les factures</Text>
        </TouchableOpacity>
      </View>

      {/* Subscription Plans */}
      <View style={styles.subscriptionPlansContainer}>
        {/* Flexy Plan */}
        <View style={styles.subscriptionPlan}>
          <View style={styles.planHeader}>
            <View style={styles.planImageContainer}>
              <Image 
                source={{ uri: 'https://via.placeholder.com/300x150?text=Gym+Equipment' }}
                style={styles.planImage}
              />
            </View>
            <View style={styles.planDetails}>
              <Text style={styles.planName}>Flexy</Text>
              <View style={styles.planPricing}>
                <Text style={styles.planOldPrice}>15$</Text>
                <Text style={styles.planCurrentPrice}>5$</Text>
              </View>
              <Text style={styles.planBilling}>Facturé mensuellement</Text>
              <Text style={styles.planStatus}>Vous êtes actuellement abonné à cette formule.</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.planDetailsButton}
            onPress={() => togglePlanDetails('flexy')}
          >
            <Text style={styles.planDetailsButtonText}>Détails</Text>
            <Ionicons name="arrow-forward" size={16} color="#666" />
          </TouchableOpacity>
          
          {expandedPlan === 'flexy' && (
            <View style={styles.planDetailsExpanded}>
              <Text style={styles.planDetailsText}>
                Plan Flexy - Accès complet aux fonctionnalités de base avec suivi personnalisé et recommandations nutritionnelles.
              </Text>
            </View>
          )}
        </View>

        {/* Premium Plan */}
        <View style={styles.subscriptionPlan}>
          <View style={styles.planHeader}>
            <View style={styles.planImageContainer}>
              <Image 
                source={{ uri: 'https://via.placeholder.com/300x150?text=Healthy+Food' }}
                style={styles.planImage}
              />
            </View>
            <View style={styles.planDetails}>
              <Text style={styles.planName}>Premium</Text>
              <View style={styles.planPricing}>
                <Text style={styles.planOldPrice}>85$</Text>
                <Text style={styles.planCurrentPrice}>50$</Text>
              </View>
              <Text style={styles.planBilling}>Facturé mensuellement</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.subscribeButton} onPress={() => handleSubscribe('premium')}>
            <Text style={styles.subscribeButtonText}>S'abonner</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.planDetailsButton}
            onPress={() => togglePlanDetails('premium')}
          >
            <Text style={styles.planDetailsButtonText}>Détails</Text>
            <Ionicons name="arrow-forward" size={16} color="#666" />
          </TouchableOpacity>
          
          {expandedPlan === 'premium' && (
            <View style={styles.planDetailsExpanded}>
              <Text style={styles.planDetailsText}>
                Plan Premium - Accès complet avec coaching personnalisé, plans de repas avancés, suivi en temps réel et sessions vidéo illimitées.
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Tabs Section */}
      <View style={styles.tabsSection}>
        <TouchableOpacity 
          style={[styles.tabButton, selectedTab === 'subscriptions' && styles.activeTabButton]}
          onPress={() => setSelectedTab('subscriptions')}
        >
          <Text style={[styles.tabButtonText, selectedTab === 'subscriptions' && styles.activeTabButtonText]}>
            Abonnements
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabButton, selectedTab === 'transactions' && styles.activeTabButton]}
          onPress={() => setSelectedTab('transactions')}
        >
          <Text style={[styles.tabButtonText, selectedTab === 'transactions' && styles.activeTabButtonText]}>
            Transactions
          </Text>
        </TouchableOpacity>
      </View>

      {/* Subscription Table */}
      {selectedTab === 'subscriptions' && (
        <View style={styles.subscriptionTable}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderText}>Plan</Text>
            <Text style={styles.tableHeaderText}>Statut</Text>
            <Text style={styles.tableHeaderText}>Début</Text>
            <Text style={styles.tableHeaderText}>Fin</Text>
          </View>
          
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Flexy</Text>
            <Text style={[styles.tableCell, styles.activeStatus]}>ACTIVE</Text>
            <Text style={styles.tableCell}>12/07/2025</Text>
            <Text style={styles.tableCell}>16/07/2025</Text>
          </View>
        </View>
      )}
    </>
  );

  const renderOnboardingSummary = () => (
    <View style={styles.summaryContainer}>
      <Text style={styles.summaryTitle}>Résumé de votre onboarding</Text>
      
      <View style={styles.stepsContainer}>
        <View style={styles.stepSummaryItem}>
          <View style={styles.stepCheckIcon}>
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.stepSummaryText}>1. Mon Profil</Text>
          <Text style={styles.stepStatusText}>Complété</Text>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsText}>+250pts</Text>
          </View>
        </View>
        
        <View style={styles.stepSummaryItem}>
          <View style={styles.stepCheckIcon}>
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.stepSummaryText}>2. Mes Objectifs</Text>
          <Text style={styles.stepStatusText}>Complété</Text>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsText}>+400pts</Text>
          </View>
        </View>
        
        <View style={styles.stepSummaryItem}>
          <View style={styles.stepCheckIcon}>
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.stepSummaryText}>3. Recommandations</Text>
          <Text style={styles.stepStatusText}>Complété</Text>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsText}>+200pts</Text>
          </View>
        </View>
        
        <View style={styles.stepSummaryItem}>
          <View style={styles.stepCheckIcon}>
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.stepSummaryText}>4. Rendez-vous</Text>
          <Text style={styles.stepStatusText}>Complété</Text>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsText}>+100pts</Text>
          </View>
        </View>
        
        <View style={styles.stepSummaryItem}>
          <View style={styles.stepCheckIcon}>
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.stepSummaryText}>5. Mon Abonnement</Text>
          <Text style={styles.stepStatusText}>Complété</Text>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsText}>+850pts</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return '1. Mon Profil';
      case 2:
        return '2. Mes Objectifs';
      case 3:
        return '3. Recommandations';
      case 4:
        return '4. Rendez-vous';
      case 5:
        return '5. Mon Abonnement';
      case 6:
        return 'Onboarding Terminé';
      default:
        return `${currentStep}. Étape ${currentStep}`;
    }
  };

  const getStepSubtitle = () => {
    switch (currentStep) {
      case 1:
        return 'Complétez ou mettez à jour vos informations personnelles.';
      case 2:
        return 'Définissez vos objectifs santé et bien-être.';
      case 3:
        return 'Prenez connaissance des recommandations et instructions personnalisées.';
      case 4:
        return 'Planifiez votre première session de coaching.';
      case 5:
        return 'Choisissez et activez votre formule d\'abonnement.';
      case 6:
        return 'Félicitations ! Votre parcours d\'onboarding est terminé.';
      default:
        return 'Continuez votre parcours.';
    }
  };

  const getStepProgress = () => {
    return (currentStep / 6) * 100;
  };

  const getPoints = () => {
    switch (currentStep) {
      case 1:
        return '+250pts';
      case 2:
        return '+400pts';
      case 3:
        return '+100pts';
      case 4:
        return '+25pts';
      case 5:
        return '+850pts';
      case 6:
        return '+1000pts';
      default:
        return '+250pts';
    }
  };

  const getHeaderTitle = () => {
    switch (currentStep) {
      case 1:
        return 'Profil';
      case 2:
        return 'Objectifs';
      case 3:
        return 'Recommandations';
      case 4:
        return 'Rendez-vous';
      case 5:
        return 'Abonnement';
      case 6:
        return 'Abonnement';
      default:
        return 'Profil';
    }
  };

  const getInfoBannerText = () => {
    switch (currentStep) {
      case 1:
        return 'Chaque parcours commence par une première étape. Remplissez votre profil pour personnaliser votre expérience et avancer vers vos objectifs !';
      case 2:
        return 'Fixer un objectif, c\'est déjà faire un pas vers sa réussite. Définissez vos ambitions et engagez-vous envers vous-même !';
      case 3:
        return 'Chaque conseil est une graine pour votre réussite. Découvrez les recommandations et engagez-vous à suivre les bonnes pratiques !';
      case 4:
        return 'Un premier rendez-vous, c\'est le début d\'un vrai changement. Choisissez un créneau et lancez-vous vers vos objectifs !';
      case 5:
        return 'Un abonnement, c\'est investir en vous-même. Choisissez la formule qui vous accompagnera vers vos objectifs !';
      case 6:
        return 'Bravo ! Vous avez terminé votre onboarding. Votre parcours LaSo Coach peut maintenant commencer !';
      default:
        return 'Continuez votre parcours.';
    }
  };

  const getStatusText = () => {
    switch (currentStep) {
      case 1:
        return 'Profil complété';
      case 2:
        return 'Objectifs complété';
      case 3:
        return 'Recommandations complété';
      case 4:
        return 'Rendez-vous complété';
      case 5:
        return 'Abonnement complété';
      case 6:
        return 'Onboarding terminé';
      default:
        return 'Étape complétée';
    }
  };

  const getNextButtonText = () => {
    if (currentStep === 6) {
      return 'Terminé';
    }
    return currentStep === 2 ? 'Suivant' : '';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {getHeaderTitle()}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.helpButton}>
            <Ionicons name="help-circle-outline" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.profileButton} onPress={onLogout}>
            <Image 
              source={{ uri: user?.avatar || 'https://via.placeholder.com/40' }} 
              style={styles.profileImage}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Subscription Banner */}
      <SubscriptionBanner 
        subscriptionData={subscriptionData}
        onRenew={handleSubscriptionRenew}
      />

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <Image 
              source={{ uri: user?.avatar || 'https://via.placeholder.com/80' }} 
              style={styles.largeProfileImage}
            />
            <View style={styles.profileImageBorder} />
          </View>
          <View style={styles.profileHeaderText}>
            <Text style={styles.profileTitle}>{getStepTitle()}</Text>
            <Text style={styles.profileSubtitle}>
              {getStepSubtitle()}
            </Text>
          </View>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerText}>
            {getInfoBannerText()}
          </Text>
        </View>

        {/* Profile Complete Status */}
        <View style={styles.statusContainer}>
          <View style={styles.statusIcon}>
            <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
          </View>
          <Text style={styles.statusText}>
            {getStatusText()}
          </Text>
        </View>

        {/* Form Content */}
        {currentStep === 1 ? (
          <>
            {renderPersonalInfo()}
            {renderProfileInfo()}
          </>
        ) : currentStep === 2 ? (
          renderObjectivesForm()
        ) : currentStep === 3 ? (
          renderRecommendationsForm()
        ) : currentStep === 4 ? (
          renderAppointmentForm()
        ) : currentStep === 5 ? (
          renderSubscriptionForm()
        ) : currentStep === 6 ? (
          renderOnboardingSummary()
        ) : null}
      </ScrollView>

      {/* Navigation Footer */}
      <View style={styles.navigationFooter}>
        <TouchableOpacity style={styles.prevButton} onPress={handlePrevious}>
          <Ionicons name="chevron-back" size={20} color="#666" />
        </TouchableOpacity>
        
        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>Étape {currentStep} sur 6</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${getStepProgress()}%` }]} />
          </View>
        </View>
        
        <View style={styles.pointsContainer}>
          <Text style={styles.pointsLabel}>Points:</Text>
          <Text style={styles.pointsValue}>{getPoints()}</Text>
        </View>
        
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {getNextButtonText()}
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('home')}>
          <Ionicons name="home" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('progress')}>
          <Ionicons name="trending-up-outline" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('nutrition')}>
          <Ionicons name="restaurant" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('achievements')}>
          <Ionicons name="trophy-outline" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('more')}>
          <Ionicons name="add-outline" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Save Confirmation Modal */}
      {renderSaveModal()}
      {renderObjectivesModal()}
      {renderRecommendationsModal()}
      {renderAppointmentModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  helpButton: {
    padding: 4,
  },
  notificationButton: {
    padding: 4,
  },
  profileButton: {
    padding: 2,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 12,
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  largeProfileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileImageBorder: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  profileHeaderText: {
    flex: 1,
  },
  profileTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  profileSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  infoBanner: {
    backgroundColor: '#FFF8E1',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFB300',
  },
  infoBannerText: {
    fontSize: 14,
    color: '#F57C00',
    lineHeight: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  statusIcon: {
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 20,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  inputContainer: {
    flex: 1,
  },
  fullWidthInput: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  inputIcon: {
    paddingHorizontal: 12,
  },
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  dropdownText: {
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  specificObjectiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  specificObjectiveInput: {
    flex: 1,
    marginRight: 8,
  },
  removeObjectiveButton: {
    padding: 4,
  },
  addObjectiveButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0E0E0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  addObjectiveText: {
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  restrictionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  restrictionChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
  },
  restrictionChipSelected: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  restrictionChipText: {
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  restrictionChipTextSelected: {
    color: '#2196F3',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  checkbox: {
    marginRight: 8,
  },
  termsText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  termsLink: {
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
  recommendationItem: {
    marginBottom: 16,
  },
  recommendationText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  consentTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  navigationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  prevButton: {
    padding: 8,
  },
  stepIndicator: {
    flex: 1,
    marginHorizontal: 16,
  },
  stepText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  pointsLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginRight: 4,
  },
  pointsValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  nextButton: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  saveModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    width: '80%',
  },
  saveModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  saveModalText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  saveModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  collapsibleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    flex: 1,
    paddingRight: 16,
  },
  collapsibleContent: {
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  collapsibleText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  requirementText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    marginLeft: 10,
    flex: 1,
  },
  photoConsentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  photoConsentQuestion: {
    fontSize: 14,
    color: theme.colors.text.primary,
    marginLeft: 10,
    flex: 1,
  },
  consentAnswerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
  },
  consentAnswerText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    marginRight: 8,
  },
  consentDetailText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  appointmentCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    marginBottom: 16,
  },
  appointmentCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  appointmentStatus: {
    backgroundColor: '#E0F2F7',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  appointmentStatusText: {
    fontSize: 14,
    color: '#007BFF',
    fontWeight: '600',
  },
  appointmentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  appointmentDetailLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  appointmentDetailValue: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  rescheduleButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  rescheduleButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  bookAppointmentButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  bookAppointmentButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  dateTimeInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateTimeInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  calendarIcon: {
    paddingLeft: 12,
  },
  subjectInput: {
    minHeight: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'right',
  },
  notesInput: {
    minHeight: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  appointmentActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  cancelAppointmentButton: {
    backgroundColor: '#E0E0E0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  cancelAppointmentButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  confirmAppointmentButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  confirmAppointmentButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  currentSubscriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  planBadge: {
    backgroundColor: '#E0F2F7',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  planBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  oldPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  currentPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  discount: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
    backgroundColor: '#E8F5E9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  billingInfo: {
    marginTop: 16,
    marginBottom: 20,
  },
  billingText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  billingSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    marginBottom: 16,
  },
  billingSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  billingStatus: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  billingPeriod: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  renewalDate: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 20,
  },
  viewInvoicesButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  viewInvoicesButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subscriptionPlansContainer: {
    marginTop: 16,
  },
  subscriptionPlan: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  planImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    marginRight: 16,
  },
  planImage: {
    width: '100%',
    height: '100%',
  },
  planDetails: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  planPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  planOldPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  planCurrentPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  planBilling: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  planStatus: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  planDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  planDetailsButtonText: {
    fontSize: 14,
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
  planDetailsExpanded: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  planDetailsText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
  subscribeButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 16,
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tabsSection: {
    flexDirection: 'row',
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: theme.colors.primary,
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.secondary,
  },
  activeTabButtonText: {
    color: theme.colors.primary,
  },
  subscriptionTable: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tableCell: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  activeStatus: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  stepsContainer: {
    marginBottom: 16,
  },
  stepSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 8,
  },
  stepCheckIcon: {
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepSummaryText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    fontWeight: 'bold',
    flex: 1,
  },
  stepStatusText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginRight: 12,
  },
  pointsBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  pointsText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});

export default ProfileScreen; 