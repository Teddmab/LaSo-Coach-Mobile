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
  Modal,
  ActivityIndicator,
  Pressable,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { theme, TYPOGRAPHY } from '../constants/theme';
import SubscriptionBanner from '../components/SubscriptionBanner';
import SubscriptionService from '../services/subscriptionService';
import { ProfileApi } from '../services/profileApi';
import SubscriptionScreen from './SubscriptionScreen';
import Avatar from '../components/Avatar';
import NotificationBadge from '../components/NotificationBadge';
import * as ImagePicker from 'expo-image-picker';

const ProfileScreen = ({ user, onLogout, onTabPress, activeTab, onClose, initialStep = 1, navigation }) => {
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
  const [profileData, setProfileData] = useState(null);
  const [measurementsData, setMeasurementsData] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  // Old dropdown states removed - now using modals
  const [consentChecked, setConsentChecked] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [rendezvousData, setRendezvousData] = useState(null);
  const [rendezvousLoading, setRendezvousLoading] = useState(true);
  const [showDurationDropdown, setShowDurationDropdown] = useState(false);
  const [durationOptions] = useState(['30 minutes', '60 minutes', '90 minutes']);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  
  // Modal states for selection
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showOccupationModal, setShowOccupationModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [occupationOptions, setOccupationOptions] = useState([
    'Software Engineer',
    'Teacher',
    'Student',
    'Healthcare Professional',
    'Manager',
    'Self-employed',
    'Unemployed',
    'Retired',
    'Other'
  ]);
  const [genderOptions] = useState([
    'Homme',
    'Femme'
  ]);
  const [countryOptions] = useState([
    'Algérie',
    'Andorre',
    'Bénin',
    'Belgique',
    'Burkina Faso',
    'Cameroun',
    'Canada',
    'Congo',
    'Côte d\'Ivoire',
    'France',
    'Gabon',
    'Guinée',
    'Guinée-Bissau',
    'Luxembourg',
    'Madagascar',
    'Mali',
    'Maroc',
    'Mauritanie',
    'Monaco',
    'Niger',
    'République centrafricaine',
    'République démocratique du Congo',
    'Sénégal',
    'Suisse',
    'Tchad',
    'Togo',
    'Tunisie',
    'Comores',
    'Djibouti',
    'Haïti',
    'Vanuatu',
    'Seychelles',
    'Maurice',
    'Autre'
  ]);
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
    gender: 'Male',
    occupation: 'Software Engineer',
    // Step 2 - Objectives
    targetWeight: '60',
    targetWaist: '60',
    generalObjective: 'Perdre beaucoup en première semaine',
    specificObjectives: ['Obj spec 1', 'Obj spec 2', 'Obj spec 3', 'Obj spec 4'],
    dietaryRestrictions: ['Végétarien', 'Sans lactose', 'Sans gluten', 'Aucune'],
    acceptedTerms: true,
    // Step 3 - Photo consent
    photoConsent: true,
    // Step 4 - Appointment
    appointmentDate: '',
    appointmentDuration: '60 minutes',
    appointmentSubject: '',
    appointmentNotes: ''
  });

  // Update currentStep when initialStep changes
  useEffect(() => {
    setCurrentStep(initialStep);
  }, [initialStep]);

  useEffect(() => {
    fetchProfileData();
    checkSubscriptionStatus();
    loadConsentState();
    fetchRendezvousData();
  }, []);

  // Refresh data when step changes to ensure we have the latest information
  useEffect(() => {
    if (currentStep > 1) {
      console.log('🔄 Step changed to', currentStep, '- refreshing data...');
      fetchProfileData(false);
      fetchRendezvousData();
    }
  }, [currentStep]);

  const fetchProfileData = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      console.log('👤 Profile: Fetching profile data...');
      
      // Fetch profile data
      const profile = await ProfileApi.getProfile();
      setProfileData(profile);
      
      // Parse address if it exists
      if (profile.address) {
        const parsedAddress = ProfileApi.parseAddress(profile.address);
        console.log('👤 Parsed address:', parsedAddress);
                     const newFormData = {
               ...formData,
               firstName: profile.firstName || '',
               lastName: profile.lastName || '',
               phone: profile.phoneNumber || '',
               email: profile.email || '',
               address1: parsedAddress.address1 || '',
               address2: parsedAddress.address2 || '',
               city: parsedAddress.city || '',
               postalCode: parsedAddress.postalCode || '',
               country: parsedAddress.country || '',
               height: profile.profile?.height?.toString() || '',
               initialWeight: profile.profile?.initialWeight?.toString() || '',
               initialWaist: profile.profile?.initialWaistSize?.toString() || '',
               gender: profile.profile?.gender === 'male' ? 'Male' : profile.profile?.gender === 'female' ? 'Female' : 'Male',
               occupation: profile.profile?.occupation || 'Software Engineer',
               // Target objectives
               targetWeight: profile.profile?.targetWeight?.toString() || '',
               targetWaist: profile.profile?.targetWaistSize?.toString() || '',
               generalObjective: profile.profile?.goal || '',
               specificObjectives: profile.profile?.goals || ['Obj spec 1', 'Obj spec 2', 'Obj spec 3', 'Obj spec 4'],
               dietaryRestrictions: profile.profile?.dietaryRestrictions || ['Végétarien', 'Sans lactose', 'Sans gluten', 'Aucune']
             };
        console.log('👤 Setting form data with address:', newFormData);
        setFormData(newFormData);
      } else {
        // Set basic profile data even if no address
                 const newFormData = {
           ...formData,
           firstName: profile.firstName || '',
           lastName: profile.lastName || '',
           phone: profile.phoneNumber || '',
           email: profile.email || '',
           height: profile.profile?.height?.toString() || '',
           initialWeight: profile.profile?.initialWeight?.toString() || '',
           initialWaist: profile.profile?.initialWaistSize?.toString() || '',
           gender: profile.profile?.gender === 'male' ? 'Male' : profile.profile?.gender === 'female' ? 'Female' : 'Male',
           occupation: profile.profile?.occupation || 'Software Engineer',
           // Target objectives
           targetWeight: profile.profile?.targetWeight?.toString() || '',
           targetWaist: profile.profile?.targetWaistSize?.toString() || '',
           generalObjective: profile.profile?.goal || '',
           specificObjectives: profile.profile?.goals || ['Obj spec 1', 'Obj spec 2', 'Obj spec 3', 'Obj spec 4'],
                          dietaryRestrictions: profile.profile?.dietaryRestrictions || ['Végétarien', 'Sans lactose', 'Sans gluten', 'Aucune']
         };
        console.log('👤 Setting form data without address:', newFormData);
        setFormData(newFormData);
      }
      
      // Fetch measurements data
      try {
        const measurements = await ProfileApi.getMeasurements();
        setMeasurementsData(measurements);
      } catch (error) {
        console.log('📏 Profile: No measurements data available');
        setMeasurementsData(null);
      }
      
      // Fetch progress data
      try {
        const progress = await ProfileApi.getProgress();
        setProgressData(progress);
      } catch (error) {
        console.log('📊 Profile: No progress data available');
        setProgressData(null);
      }
      
      // Fetch occupation options
      // Set occupation options from the UI list
      setOccupationOptions([
        'Software Engineer',
        'Teacher',
        'Student',
        'Healthcare Professional',
        'Manager',
        'Self-employed',
        'Unemployed',
        'Retired',
        'Other'
      ]);
      console.log('👤 Profile: Using occupation options from UI');
      
      console.log('✅ Profile: All data fetched successfully');
    } catch (error) {
      console.error('❌ Profile: Error fetching profile data:', error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

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

  const fetchRendezvousData = async () => {
    try {
      setRendezvousLoading(true);
      console.log('📅 Profile: Fetching rendezvous data...');
      
      const rendezvous = await ProfileApi.getCurrentRendezvous();
      setRendezvousData(rendezvous);
      
      // Update hasExistingAppointment based on rendezvous data
      if (rendezvous) {
        setHasExistingAppointment(true);
        // Pre-fill form data with existing appointment
        const appointmentDate = new Date(rendezvous.scheduledAt);
        const formattedDate = `${appointmentDate.getDate().toString().padStart(2, '0')}/${(appointmentDate.getMonth() + 1).toString().padStart(2, '0')}/${appointmentDate.getFullYear()} ${appointmentDate.getHours().toString().padStart(2, '0')}:${appointmentDate.getMinutes().toString().padStart(2, '0')}:${appointmentDate.getSeconds().toString().padStart(2, '0')}`;
        
        setFormData(prev => ({
          ...prev,
          appointmentDate: formattedDate,
          appointmentDuration: `${rendezvous.duration} minutes`,
          appointmentSubject: rendezvous.subject,
          appointmentNotes: rendezvous.notes || ''
        }));
      }
      
      console.log('✅ Profile: Rendezvous data fetched successfully');
    } catch (error) {
      console.error('❌ Profile: Error fetching rendezvous data:', error);
      setRendezvousData(null);
    } finally {
      setRendezvousLoading(false);
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

  const getOccupationDisplayText = (occupation) => {
    // For the new occupation options, we can return them as-is since they're already in English
    return occupation || 'Sélectionner';
  };

  const getGenderDisplayText = (gender) => {
    return gender || 'Sélectionner';
  };

  const getRendezvousStatusText = (status) => {
    const statusMap = {
      'PENDING': 'En attente de confirmation du coach',
      'ACCEPTED': 'Accepté par le coach',
      'REJECTED': 'Refusé',
      'CANCELLED': 'Annulé',
      'COMPLETED': 'Terminé'
    };
    return statusMap[status] || status;
  };

  // Load consent state from localStorage
  const loadConsentState = async () => {
    try {
      const consent = await AsyncStorage.getItem('onboarding_consent');
      if (consent !== null) {
        setConsentChecked(JSON.parse(consent));
      }
    } catch (error) {
      console.log('📋 Could not load consent state:', error);
    }
  };

  // Save consent state to localStorage
  const saveConsentState = async (checked) => {
    try {
      await AsyncStorage.setItem('onboarding_consent', JSON.stringify(checked));
    } catch (error) {
      console.log('📋 Could not save consent state:', error);
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async () => {
    console.log('📸 Starting avatar upload...');
    
    // Prevent multiple uploads
    if (avatarUploading) {
      console.log('📸 Upload already in progress, ignoring...');
      return;
    }
    
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Permission refusée',
          text2: 'Veuillez autoriser l\'accès à votre galerie pour changer votre avatar',
        });
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setAvatarUploading(true);
        
        const formData = new FormData();
        formData.append('avatar', {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'avatar.jpg'
        });
        
        const response = await ProfileApi.uploadAvatar(formData);
        console.log('✅ Avatar uploaded successfully');
        
        // Update profile data with new avatar
        if (response.avatarUrl) {
          setProfileData(prev => ({
            ...prev,
            avatar: response.avatarUrl
          }));
        }
        
        Toast.show({
          type: 'success',
          text1: 'Avatar mis à jour',
          text2: 'Votre photo de profil a été mise à jour avec succès',
        });
      }
    } catch (error) {
      console.error('❌ Error uploading avatar:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur de téléchargement',
        text2: 'Impossible de télécharger votre avatar. Veuillez réessayer.',
      });
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      setShowSaveModal(true);
    } else if (currentStep === 2) {
      setShowObjectivesModal(true);
    } else if (currentStep === 3) {
      // Check if consent is given before allowing to proceed
      if (!consentChecked) {
        Toast.show({
          type: 'error',
          text1: 'Consentement requis',
          text2: 'Veuillez accepter les recommandations pour continuer',
        });
        return;
      }
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

  const handleSaveProfile = async () => {
    try {
      console.log('👤 Profile: Saving profile data...');
      
      // Format address
      const addressString = ProfileApi.formatAddress({
        address1: formData.address1,
        address2: formData.address2,
        city: formData.city,
        postalCode: formData.postalCode,
        country: formData.country
      });
      
      // Prepare profile data for API
      const profileUpdateData = {
        name: `${formData.firstName} ${formData.lastName}`,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phone,
        address: addressString,
        profile: {
          height: parseFloat(formData.height.replace(',', '.')),
          gender: formData.gender === 'Male' ? 'male' : formData.gender === 'Female' ? 'female' : 'male',
          occupation: formData.occupation,
          initialWeight: parseFloat(formData.initialWeight),
          initialWaistSize: parseFloat(formData.initialWaist)
        }
      };
      
      console.log('👤 Profile: Update data:', profileUpdateData);
      
      // Update profile via API
      await ProfileApi.updateProfile(profileUpdateData);
      
      // Update progress if available
      if (progressData) {
        try {
          await ProfileApi.updateProgress({
            step: 'profile_setup',
            completed: true
          });
        } catch (error) {
          console.log('📊 Profile: Could not update progress');
        }
      }
      
      setShowSaveModal(false);
      setCurrentStep(2);
      console.log('✅ Profile saved successfully, moving to step 2');
      
      // Refresh data to show updated information (without loading indicator)
      await fetchProfileData(false);
      
      // Show success message to user
      Toast.show({
        type: 'success',
        text1: 'Profil sauvegardé',
        text2: 'Vos informations ont été mises à jour avec succès',
      });
    } catch (error) {
      console.error('❌ Profile: Error saving profile:', error);
      
      // Show error message to user
      Toast.show({
        type: 'error',
        text1: 'Erreur de sauvegarde',
        text2: 'Impossible de sauvegarder votre profil. Veuillez réessayer.',
      });
    }
  };

  const handleSaveObjectives = async () => {
    try {
      console.log('🎯 Objectives: Saving objectives data...');
      
      // Prepare objectives data for API
      const objectivesUpdateData = {
        profile: {
          height: parseFloat(profileData?.profile?.height || 0),
          initialWeight: parseFloat(profileData?.profile?.initialWeight || 0),
          initialWaistSize: parseFloat(profileData?.profile?.initialWaistSize || 0),
          targetWeight: parseFloat(formData.targetWeight || 0),
          targetWaistSize: parseFloat(formData.targetWaist || 0),
          goal: formData.generalObjective,
          goals: formData.specificObjectives,
          dietaryRestrictions: formData.dietaryRestrictions,
          gender: profileData?.profile?.gender || 'male',
          occupation: profileData?.profile?.occupation || 'Software Engineer',
          acceptedGuidelines: true
        }
      };
      
      console.log('🎯 Objectives: Update data:', objectivesUpdateData);
      
      // Update profile via API
      await ProfileApi.updateProfile(objectivesUpdateData);
      
      // Update progress if available
      if (progressData) {
        try {
          await ProfileApi.updateProgress({
            step: 'goals_setup',
            completed: true
          });
        } catch (error) {
          console.log('📊 Objectives: Could not update progress');
        }
      }
      
      setShowObjectivesModal(false);
      setCurrentStep(3);
      console.log('✅ Objectives saved successfully, moving to step 3');
      
      // Refresh data to show updated information (without loading indicator)
      await fetchProfileData(false);
      
      // Show success message to user
      Toast.show({
        type: 'success',
        text1: 'Objectifs sauvegardés',
        text2: 'Vos objectifs ont été enregistrés avec succès',
      });
    } catch (error) {
      console.error('❌ Objectives: Error saving objectives:', error);
      
      // Show error message to user
      Toast.show({
        type: 'error',
        text1: 'Erreur de sauvegarde',
        text2: 'Impossible de sauvegarder vos objectifs. Veuillez réessayer.',
      });
    }
  };

  const handleSaveRecommendations = async () => {
    try {
      console.log('📋 Recommendations: Saving recommendations data...');
      
      // Update progress if available
      if (progressData) {
        try {
          await ProfileApi.updateProgress({
            step: 'recommendations',
            completed: true
          });
        } catch (error) {
          console.log('📊 Recommendations: Could not update progress');
        }
      }
      
      setShowRecommendationsModal(false);
      setCurrentStep(4);
      console.log('✅ Recommendations saved successfully, moving to step 4');
      
      // Refresh data to show updated information (without loading indicator)
      await fetchProfileData(false);
      
      // Show success message to user
      Toast.show({
        type: 'success',
        text1: 'Recommandations sauvegardées',
        text2: 'Vos recommandations ont été enregistrées avec succès',
      });
    } catch (error) {
      console.error('❌ Recommendations: Error saving recommendations:', error);
      
      // Show error message to user
      Toast.show({
        type: 'error',
        text1: 'Erreur de sauvegarde',
        text2: 'Impossible de sauvegarder vos recommandations. Veuillez réessayer.',
      });
    }
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
    console.log('📅 handleBookAppointment called');
    
    // Reset form data to empty values for new appointment
    setFormData(prev => ({
      ...prev,
      appointmentDate: '',
      appointmentDuration: '60 minutes',
      appointmentSubject: '',
      appointmentNotes: ''
    }));
    
    setShowBookingForm(true);
    setShowAppointmentModal(true);
    console.log('📅 Opening appointment booking form');
  };

  const handleRescheduleAppointment = () => {
    console.log('📅 handleRescheduleAppointment called');
    console.log('📅 Current showBookingForm:', showBookingForm);
    console.log('📅 Current showAppointmentModal:', showAppointmentModal);
    console.log('📅 Current showSaveModal:', showSaveModal);
    console.log('📅 Current showObjectivesModal:', showObjectivesModal);
    console.log('📅 Current showRecommendationsModal:', showRecommendationsModal);
    
    // Close any other modals first
    setShowSaveModal(false);
    setShowObjectivesModal(false);
    setShowRecommendationsModal(false);
    
    // Reset form data to current appointment data or empty values
    if (rendezvousData) {
      const appointmentDate = new Date(rendezvousData.scheduledAt);
      const formattedDate = `${appointmentDate.getDate().toString().padStart(2, '0')}/${(appointmentDate.getMonth() + 1).toString().padStart(2, '0')}/${appointmentDate.getFullYear()} ${appointmentDate.getHours().toString().padStart(2, '0')}:${appointmentDate.getMinutes().toString().padStart(2, '0')}:${appointmentDate.getSeconds().toString().padStart(2, '0')}`;
      
      setFormData(prev => ({
        ...prev,
        appointmentDate: formattedDate,
        appointmentDuration: `${rendezvousData.duration} minutes`,
        appointmentSubject: rendezvousData.subject,
        appointmentNotes: rendezvousData.notes || ''
      }));
    } else {
      // Reset to empty values for new appointment
      setFormData(prev => ({
        ...prev,
        appointmentDate: '',
        appointmentDuration: '60 minutes',
        appointmentSubject: '',
        appointmentNotes: ''
      }));
    }
    
    // Set the appointment modal states
    setShowBookingForm(true);
    setShowAppointmentModal(true);
    console.log('📅 Opening reschedule appointment form');
    console.log('📅 showBookingForm set to true');
  };

  const handleConfirmAppointment = async () => {
    try {
      console.log('📅 Confirming appointment...');
      console.log('📅 Appointment date string:', formData.appointmentDate);
      
      // Validate required fields
      if (!formData.appointmentDate || !formData.appointmentSubject) {
        Toast.show({
          type: 'error',
          text1: 'Champs requis',
          text2: 'Veuillez remplir tous les champs obligatoires',
        });
        return;
      }

      // Parse date and validate it's at least 24 hours in advance
      let appointmentDate;
      try {
        // Check if date is empty
        if (!formData.appointmentDate || formData.appointmentDate.trim() === '') {
          Toast.show({
            type: 'error',
            text1: 'Date requise',
            text2: 'Veuillez saisir une date et heure de rendez-vous',
          });
          return;
        }
        
        // Handle different date formats
        if (formData.appointmentDate.includes('/')) {
          // Format: "12/07/2026 17:10:00" (DD/MM/YYYY HH:mm:ss)
          const [datePart, timePart] = formData.appointmentDate.split(' ');
          if (!datePart || !timePart) {
            throw new Error('Invalid date format - missing date or time part');
          }
          
          const [day, month, year] = datePart.split('/');
          const [hours, minutes, seconds] = timePart.split(':');
          
          if (!day || !month || !year || !hours || !minutes || !seconds) {
            throw new Error('Invalid date format - missing components');
          }
          
          // Create date with proper format (month is 0-indexed)
          appointmentDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), parseInt(seconds));
        } else {
          // Try standard date parsing
          appointmentDate = new Date(formData.appointmentDate);
        }
        
        // Validate the date is valid
        if (isNaN(appointmentDate.getTime())) {
          throw new Error('Invalid date format');
        }
        
        console.log('📅 Parsed appointment date:', appointmentDate);
        console.log('📅 Appointment date ISO string:', appointmentDate.toISOString());
      } catch (error) {
        console.error('❌ Date parsing error:', error);
        Toast.show({
          type: 'error',
          text1: 'Format de date invalide',
          text2: 'Veuillez utiliser le format DD/MM/YYYY HH:mm:ss',
        });
        return;
      }
      
      const now = new Date();
      const minDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
      
      if (appointmentDate <= minDate) {
        Toast.show({
          type: 'error',
          text1: 'Date invalide',
          text2: 'Le rendez-vous doit être prévu au moins 24h à l\'avance',
        });
        return;
      }

      // Extract duration from string (e.g., "60 minutes" -> 60)
      const duration = parseInt(formData.appointmentDuration.split(' ')[0]);

      // Prepare rendezvous data
      const rendezvousData = {
        scheduledAt: appointmentDate.toISOString(),
        subject: formData.appointmentSubject,
        duration: duration,
        notes: formData.appointmentNotes || ''
      };

      console.log('📅 Rendezvous data:', rendezvousData);
      console.log('📅 About to call ProfileApi.createRendezvous...');

      // Create rendezvous via API
      const response = await ProfileApi.createRendezvous(rendezvousData);
      console.log('✅ Rendezvous created successfully:', response);

      // Close the appointment form modal
      setShowAppointmentModal(false);
      setShowBookingForm(false);
      setShowDurationDropdown(false);

      // Show confirmation modal
      setShowConfirmationModal(true);

    } catch (error) {
      console.error('❌ Error confirming appointment:', error);
      
      // Handle specific API errors
      let errorMessage = 'Impossible de confirmer le rendez-vous. Veuillez réessayer.';
      
      if (error.response?.status === 422) {
        errorMessage = 'Le rendez-vous doit être prévu au moins 24h à l\'avance.';
      } else if (error.response?.status === 409) {
        errorMessage = 'Ce créneau n\'est plus disponible. Merci de choisir un autre horaire.';
      }

      Toast.show({
        type: 'error',
        text1: 'Erreur de confirmation',
        text2: errorMessage,
      });
    }
  };

  const handleCancelAppointmentModal = () => {
    setShowAppointmentModal(false);
    setShowBookingForm(false);
    setShowDurationDropdown(false);
    console.log('📅 Appointment modal cancelled');
  };

  const handleConfirmationModalAction = async () => {
    try {
      // Update progress if available
      if (progressData) {
        try {
          await ProfileApi.updateProgress({
            step: 'rendezvous',
            completed: true
          });
        } catch (error) {
          console.log('📊 Rendezvous: Could not update progress');
        }
      }

      // Close confirmation modal
      setShowConfirmationModal(false);

      // Move to step 5 (subscription)
      setCurrentStep(5);
      console.log('✅ Moving to subscription step');

      // Show success message
      Toast.show({
        type: 'success',
        text1: 'Rendez-vous confirmé',
        text2: 'Votre rendez-vous a été programmé avec succès',
      });

      // Refresh data to show updated information (without loading indicator)
      await fetchProfileData(false);
      await fetchRendezvousData();

    } catch (error) {
      console.error('❌ Error in confirmation modal action:', error);
    }
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

  const renderAppointmentModal = () => {
    console.log('📅 renderAppointmentModal - showAppointmentModal:', showAppointmentModal);
    console.log('📅 renderAppointmentModal - showBookingForm:', showBookingForm);
    console.log('📅 renderAppointmentModal - showSaveModal:', showSaveModal);
    console.log('📅 renderAppointmentModal - showObjectivesModal:', showObjectivesModal);
    console.log('📅 renderAppointmentModal - showRecommendationsModal:', showRecommendationsModal);
    
    return (
    <Modal
      visible={showAppointmentModal}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCancelAppointmentModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.saveModalContainer}>
          {showBookingForm ? (
            <>
              <Text style={styles.saveModalTitle}>
                {rendezvousData ? 'Reprogrammer le rendez-vous' : 'Prendre RDV avec Sonia'}
              </Text>
              
              {/* Date and Time Section */}
              <View style={styles.modalFormField}>
                <Text style={styles.modalInputLabel}>Date et heure du rendez-vous *</Text>
                <TouchableOpacity 
                  style={styles.dateTimeInputWrapper}
                  onPress={() => {
                    console.log('📅 Date input pressed, closing appointment modal and opening date modal');
                    setShowAppointmentModal(false);
                    setTimeout(() => {
                      setShowDateModal(true);
                    }, 300);
                  }}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Text style={styles.dateTimeInputText}>
                      {formData.appointmentDate || "Sélectionner une date"}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color="#666" />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Duration Section */}
              <View style={styles.modalFormField}>
                <Text style={styles.modalInputLabel}>Durée *</Text>
                <TouchableOpacity 
                  style={styles.modalDropdownInput}
                  onPress={() => setShowDurationDropdown(!showDurationDropdown)}
                >
                  <Text style={styles.modalDropdownText}>{formData.appointmentDuration}</Text>
                  <Ionicons name="chevron-down" size={20} color="#999" />
                </TouchableOpacity>
                
                {showDurationDropdown && (
                  <View style={styles.modalDropdownOptions}>
                    {durationOptions.map((option, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.modalDropdownOption}
                        onPress={() => {
                          updateFormData('appointmentDuration', option);
                          setShowDurationDropdown(false);
                        }}
                      >
                        <Text style={[
                          styles.modalDropdownOptionText,
                          formData.appointmentDuration === option && styles.modalDropdownOptionTextSelected
                        ]}>
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Subject Section */}
              <View style={styles.modalFormField}>
                <Text style={styles.modalInputLabel}>Sujet de la session *</Text>
                <TextInput
                  style={[styles.modalTextInput, styles.modalSubjectInput]}
                  value={formData.appointmentSubject}
                  onChangeText={(text) => updateFormData('appointmentSubject', text)}
                  placeholder="Décrivez l'objectif de votre session"
                  multiline={true}
                  numberOfLines={3}
                />
                <Text style={styles.modalCharacterCount}>
                  {formData.appointmentSubject ? formData.appointmentSubject.length : 0}/500
                </Text>
              </View>

              {/* Notes Section */}
              <View style={styles.modalFormField}>
                <Text style={styles.modalInputLabel}>Notes (optionnel)</Text>
                <TextInput
                  style={[styles.modalTextInput, styles.modalNotesInput]}
                  value={formData.appointmentNotes}
                  onChangeText={(text) => updateFormData('appointmentNotes', text)}
                  placeholder="Ajoutez des notes supplémentaires..."
                  multiline={true}
                  numberOfLines={4}
                />
                <Text style={styles.modalCharacterCount}>
                  {formData.appointmentNotes ? formData.appointmentNotes.length : 0}/1000
                </Text>
              </View>
              
              <View style={styles.saveModalButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancelAppointmentModal}>
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmAppointment}>
                  <Text style={styles.confirmButtonText}>OK</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
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
            </>
          )}
        </View>
      </View>
    </Modal>
    );
  };

  const renderConfirmationModal = () => (
    <Modal
      visible={showConfirmationModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowConfirmationModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.saveModalContainer}>
          <Text style={styles.saveModalTitle}>Rendez-vous créé avec succès</Text>
          <Text style={styles.saveModalText}>
            Votre rendez-vous a été programmé avec succès. Vous recevrez une confirmation par email.
          </Text>
          
          <View style={styles.saveModalButtons}>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmationModalAction}>
              <Text style={styles.confirmButtonText}>Continuer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Selection Modal Functions
  function renderCountryModal() {
    return (
    <Modal
      visible={showCountryModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowCountryModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.selectionModalContainer}>
          <View style={styles.selectionModalHeader}>
            <Text style={styles.selectionModalTitle}>Sélectionner un pays</Text>
            <TouchableOpacity 
              onPress={() => setShowCountryModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.selectionModalContent}>
            {countryOptions.map((country, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.selectionModalOption,
                  formData.country === country && styles.selectionModalOptionSelected
                ]}
                onPress={() => {
                  updateFormData('country', country);
                  setShowCountryModal(false);
                }}
              >
                <Text style={[
                  styles.selectionModalOptionText,
                  formData.country === country && styles.selectionModalOptionTextSelected
                ]}>
                  {country}
                </Text>
                {formData.country === country && (
                  <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
    );
  }

  function renderGenderModal() {
    return (
    <Modal
      visible={showGenderModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowGenderModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.selectionModalContainer}>
          <View style={styles.selectionModalHeader}>
            <Text style={styles.selectionModalTitle}>Sélectionner le genre</Text>
            <TouchableOpacity 
              onPress={() => setShowGenderModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.selectionModalContent}>
            {genderOptions.map((gender, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.selectionModalOption,
                  formData.gender === gender && styles.selectionModalOptionSelected
                ]}
                onPress={() => {
                  updateFormData('gender', gender);
                  setShowGenderModal(false);
                }}
              >
                <Text style={[
                  styles.selectionModalOptionText,
                  formData.gender === gender && styles.selectionModalOptionTextSelected
                ]}>
                  {getGenderDisplayText(gender)}
                </Text>
                {formData.gender === gender && (
                  <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
    );
  }

  function renderOccupationModal() {
    return (
    <Modal
      visible={showOccupationModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowOccupationModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.selectionModalContainer}>
          <View style={styles.selectionModalHeader}>
            <Text style={styles.selectionModalTitle}>Sélectionner l'occupation</Text>
            <TouchableOpacity 
              onPress={() => setShowOccupationModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.selectionModalContent}>
            {occupationOptions.map((occupation, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.selectionModalOption,
                  formData.occupation === occupation && styles.selectionModalOptionSelected
                ]}
                onPress={() => {
                  updateFormData('occupation', occupation);
                  setShowOccupationModal(false);
                }}
              >
                <Text style={[
                  styles.selectionModalOptionText,
                  formData.occupation === occupation && styles.selectionModalOptionTextSelected
                ]}>
                  {getOccupationDisplayText(occupation)}
                </Text>
                {formData.occupation === occupation && (
                  <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
    );
  }

  function renderDateModal() {
    console.log('📅 renderDateModal called, showDateModal:', showDateModal);
    return (
    <Modal
      visible={showDateModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => {
        setShowDateModal(false);
        setTimeout(() => {
          setShowAppointmentModal(true);
          setShowBookingForm(true);
        }, 300);
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.selectionModalContainer}>
          <View style={styles.selectionModalHeader}>
            <Text style={styles.selectionModalTitle}>Sélectionner la date et l'heure</Text>
            <TouchableOpacity 
              onPress={() => setShowDateModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.dateModalContent}>
            <Text style={styles.saveModalText}>
              Choisissez la date et l'heure de votre rendez-vous
            </Text>
            <View style={styles.datePickerContainer}>
              <Text style={styles.datePickerLabel}>Date</Text>
              <View style={styles.datePickerRow}>
                <TouchableOpacity 
                  style={styles.datePickerButton}
                  onPress={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setDate(newDate.getDate() - 1);
                    setSelectedDate(newDate);
                  }}
                >
                  <Ionicons name="chevron-back" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
                
                <Text style={styles.datePickerText}>
                  {selectedDate.toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </Text>
                
                <TouchableOpacity 
                  style={styles.datePickerButton}
                  onPress={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setDate(newDate.getDate() + 1);
                    setSelectedDate(newDate);
                  }}
                >
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.timePickerContainer}>
              <Text style={styles.datePickerLabel}>Heure</Text>
              <View style={styles.timePickerRow}>
                {[9, 10, 11, 14, 15, 16, 17].map((hour) => (
                  <TouchableOpacity
                    key={hour}
                    style={[
                      styles.timeSlotButton,
                      selectedDate.getHours() === hour && styles.timeSlotButtonSelected
                    ]}
                    onPress={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setHours(hour, 0, 0, 0);
                      setSelectedDate(newDate);
                    }}
                  >
                    <Text style={[
                      styles.timeSlotText,
                      selectedDate.getHours() === hour && styles.timeSlotTextSelected
                    ]}>
                      {hour.toString().padStart(2, '0')}:00
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.saveModalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => {
                setShowDateModal(false);
                setTimeout(() => {
                  setShowAppointmentModal(true);
                  setShowBookingForm(true);
                }, 300);
              }}>
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmButton}
                                  onPress={() => {
                    const formattedDate = selectedDate.toLocaleString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    });
                    console.log('📅 Date selected:', formattedDate);
                    updateFormData('appointmentDate', formattedDate);
                    setShowDateModal(false);
                    setTimeout(() => {
                      console.log('📅 Reopening appointment modal');
                      setShowAppointmentModal(true);
                      setShowBookingForm(true);
                    }, 300);
                  }}
              >
                <Text style={styles.confirmButtonText}>Confirmer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
    );
  }

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
          style={[styles.textInput, styles.disabledInput]}
          value={formData.email}
          placeholder="Email"
          keyboardType="email-address"
          editable={false}
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
        <TouchableOpacity 
          style={styles.dropdownInput}
          onPress={() => setShowCountryModal(true)}
        >
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
        <TouchableOpacity 
          style={styles.dropdownInput}
          onPress={() => setShowGenderModal(true)}
        >
          <Text style={styles.dropdownText}>{formData.gender}</Text>
          <Ionicons name="chevron-down" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      <View style={styles.fullWidthInput}>
        <Text style={styles.inputLabel}>Occupation</Text>
               <TouchableOpacity 
         style={styles.dropdownInput}
         onPress={() => setShowOccupationModal(true)}
       >
         <Text style={styles.dropdownText}>{getOccupationDisplayText(formData.occupation)}</Text>
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
            style={[styles.textInput, styles.disabledInput]}
            value={profileData?.profile?.height?.toString() || ''}
            placeholder="Taille en mètres"
            keyboardType="decimal-pad"
            editable={false}
          />
        </View>

        <View style={styles.fullWidthInput}>
          <Text style={styles.inputLabel}>Poids initial (kg)</Text>
          <TextInput
            style={[styles.textInput, styles.disabledInput]}
            value={profileData?.profile?.initialWeight?.toString() || ''}
            placeholder="Poids initial"
            keyboardType="numeric"
            editable={false}
          />
        </View>

        <View style={styles.fullWidthInput}>
          <Text style={styles.inputLabel}>Tour de taille initial (cm)</Text>
          <TextInput
            style={[styles.textInput, styles.disabledInput]}
            value={profileData?.profile?.initialWaistSize?.toString() || ''}
            placeholder="Tour de taille initial"
            keyboardType="numeric"
            editable={false}
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
          <TouchableOpacity 
            style={styles.dropdownInput}
            onPress={() => setShowGenderModal(true)}
          >
            <Text style={styles.dropdownText}>{getGenderDisplayText(formData.gender)}</Text>
            <Ionicons name="chevron-down" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={styles.fullWidthInput}>
          <Text style={styles.inputLabel}>Occupation</Text>
          <TouchableOpacity 
            style={styles.dropdownInput}
            onPress={() => setShowOccupationModal(true)}
          >
            <Text style={styles.dropdownText}>{getOccupationDisplayText(formData.occupation)}</Text>
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

      {/* Consent Checkbox */}
      <View style={styles.formSection}>
        <View style={styles.consentContainer}>
          <TouchableOpacity 
            style={styles.checkbox}
            onPress={() => {
              const newConsentState = !consentChecked;
              setConsentChecked(newConsentState);
              saveConsentState(newConsentState);
            }}
          >
            <Ionicons 
              name={consentChecked ? "checkbox" : "square-outline"} 
              size={20} 
              color={consentChecked ? "#2196F3" : "#999"}
            />
          </TouchableOpacity>
          <View style={styles.consentTextContainer}>
            <Text style={styles.consentText}>
              J'accepte de suivre les recommandations et instructions personnalisées fournies dans ce programme.
            </Text>
          </View>
        </View>
      </View>
    </>
  );

  const renderAppointmentForm = () => {
    const formatRendezvousDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      const options = { weekday: 'short', day: 'numeric', month: 'short' };
      return date.toLocaleDateString('fr-FR', options);
    };

    const formatRendezvousTime = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };

    const getDaysRemaining = (dateString) => {
      if (!dateString) return 0;
      const targetDate = new Date(dateString);
      const today = new Date();
      const diffTime = targetDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    };

    return (
      <>
        {rendezvousLoading ? (
          <View style={styles.formSection}>
            <ActivityIndicator size="large" color="#8BC34A" />
            <Text style={styles.loadingText}>Chargement du rendez-vous...</Text>
          </View>
        ) : rendezvousData ? (
          <>
            {/* Confirmation Message Banner */}
            <View style={styles.confirmationBanner}>
              <Text style={styles.confirmationText}>
                Votre session est confirmée pour le {formatRendezvousDate(rendezvousData.scheduledAt)} à {formatRendezvousTime(rendezvousData.scheduledAt)}. {getDaysRemaining(rendezvousData.scheduledAt)} jours restants. Ajoutez un rappel dans votre agenda.
              </Text>
            </View>

            {/* Main Appointment Card */}
            <View style={styles.confirmedAppointmentCard}>
              {/* Header with Status Badge */}
              <View style={styles.confirmedHeader}>
                <View style={styles.confirmedIconContainer}>
                  <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
                </View>
                <View style={styles.confirmedHeaderText}>
                  <Text style={styles.confirmedTitle}>Rendez-vous confirmé</Text>
                  <Text style={styles.confirmedSubtitle}>Tout est prêt pour votre session.</Text>
                </View>
                <View style={styles.confirmedBadge}>
                  <Text style={styles.confirmedBadgeText}>CONFIRMÉ</Text>
                </View>
              </View>

              {/* Message */}
              <Text style={styles.appointmentMessage}>
                Ajoutez l'événement à votre agenda et soyez prêt à vivre une session riche en conseils personnalisés.
              </Text>

              {/* Timeline Flow */}
              <View style={styles.timelineContainer}>
                {/* Today */}
                <View style={styles.timelineStep}>
                  <Text style={styles.timelineLabel}>AUJOURD'HUI</Text>
                  <Text style={styles.timelineDate}>{formatRendezvousDate(new Date())}</Text>
                </View>

                <View style={styles.timelineArrow}>
                  <Ionicons name="arrow-forward" size={20} color="#9CA3AF" />
                </View>

                {/* Coach Assigned */}
                <View style={[styles.timelineStep, styles.timelineStepHighlight]}>
                  <Text style={styles.timelineLabel}>COACH ASSIGNÉ</Text>
                  <Text style={styles.timelineName}>
                    {rendezvousData.assignedCoach?.name || 'Admin Eddy'}
                  </Text>
                </View>

                <View style={styles.timelineArrow}>
                  <Ionicons name="arrow-forward" size={20} color="#9CA3AF" />
                </View>

                {/* Rendezvous Date */}
                <View style={[styles.timelineStep, styles.timelineStepFinal]}>
                  <Text style={styles.timelineLabel}>RENDEZ-VOUS</Text>
                  <Text style={styles.timelineDate}>
                    {formatRendezvousDate(rendezvousData.scheduledAt)}
                  </Text>
                  <View style={styles.timelineTime}>
                    <Ionicons name="time-outline" size={14} color={theme.colors.success} />
                    <Text style={styles.timelineTimeText}>
                      {formatRendezvousTime(rendezvousData.scheduledAt)}
                    </Text>
                  </View>
                  <Text style={styles.timelineRemaining}>
                    {getDaysRemaining(rendezvousData.scheduledAt)} jours restants
                  </Text>
                </View>
              </View>

              {/* Subject Section */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionLabel}>SUJET</Text>
                <Text style={styles.detailSectionValue}>{rendezvousData.subject || 'Progress Review & Adjustments'}</Text>
              </View>

              {/* Coach Info Section */}
              <View style={styles.coachInfoSection}>
                <View style={styles.coachInfoRow}>
                  <View style={styles.coachInfoLeft}>
                    <Text style={styles.coachInfoLabel}>COACH ASSIGNÉ</Text>
                    <Text style={styles.coachInfoName}>
                      {rendezvousData.assignedCoach?.name || 'Admin Eddy'}
                    </Text>
                    <Text style={styles.coachInfoEmail}>
                      {rendezvousData.assignedCoach?.email || 'eddy@admin.com'}
                    </Text>
                  </View>

                  <View style={styles.coachInfoRight}>
                    <Text style={styles.coachInfoLabel}>LIEN DE RÉUNION</Text>
                    {rendezvousData.meetingLink ? (
                      <>
                        <TouchableOpacity onPress={() => rendezvousData.meetingLink && Linking.openURL(rendezvousData.meetingLink)}>
                          <Text style={styles.meetingLink} numberOfLines={2}>
                            {rendezvousData.meetingLink}
                          </Text>
                        </TouchableOpacity>
                        <View style={styles.meetingProviderBadge}>
                          <Text style={styles.meetingProviderText}>Google Meet</Text>
                        </View>
                      </>
                    ) : (
                      <Text style={styles.meetingLinkPending}>Lien à venir</Text>
                    )}
                  </View>
                </View>
              </View>

              {/* User Notes Section */}
              {rendezvousData.notes && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionLabel}>SOPHIE</Text>
                  <Text style={styles.detailSectionValue}>{rendezvousData.notes}</Text>
                </View>
              )}

              {/* Coach Message Section */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionLabel}>COACH ADMIN EDDY</Text>
                <Text style={styles.detailSectionValue}>Parfait, rendez vous confimer</Text>
              </View>

              {/* Date and Duration Footer */}
              <View style={styles.appointmentFooter}>
                <View style={styles.footerItem}>
                  <Text style={styles.footerLabel}>DATE</Text>
                  <Text style={styles.footerValue}>
                    {formatRendezvousDate(rendezvousData.scheduledAt)} · {formatRendezvousTime(rendezvousData.scheduledAt)}
                  </Text>
                </View>
                <View style={styles.footerItem}>
                  <Text style={styles.footerLabel}>DURÉE</Text>
                  <Text style={styles.footerValue}>{rendezvousData.duration || 60} minutes</Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.formSection}>
            <TouchableOpacity style={styles.bookAppointmentButton} onPress={handleBookAppointment}>
              <Text style={styles.bookAppointmentButtonText}>Prendre RDV avec Sonia</Text>
            </TouchableOpacity>
          </View>
        )}
      </>
    );
  };

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
          <Text style={styles.stepSummaryText}>Mon Profile</Text>
          <Text style={styles.stepStatusText}>Complété</Text>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsText}>+25pts</Text>
          </View>
        </View>
        
        <View style={styles.stepSummaryItem}>
          <View style={styles.stepCheckIcon}>
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.stepSummaryText}>2. Mes Objectifs</Text>
          <Text style={styles.stepStatusText}>Complété</Text>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsText}>+40pts</Text>
          </View>
        </View>
        
        <View style={styles.stepSummaryItem}>
          <View style={styles.stepCheckIcon}>
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.stepSummaryText}>3. Recommandations</Text>
          <Text style={styles.stepStatusText}>Complété</Text>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsText}>+20pts</Text>
          </View>
        </View>
        
        <View style={styles.stepSummaryItem}>
          <View style={styles.stepCheckIcon}>
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.stepSummaryText}>4. Rendez-vous</Text>
          <Text style={styles.stepStatusText}>Complété</Text>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsText}>+10pts</Text>
          </View>
        </View>
        
        <View style={styles.stepSummaryItem}>
          <View style={styles.stepCheckIcon}>
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.stepSummaryText}>5. Mon Abonnement</Text>
          <Text style={styles.stepStatusText}>Complété</Text>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsText}>+85pts</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return 'Mon Profile';
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
    // Use real progress data if available
    if (progressData && progressData.totalSteps) {
      const completedSteps = progressData.completedSteps?.length || 0;
      return (completedSteps / progressData.totalSteps) * 100;
    }
    
    // Fallback to step-based progress
    return (currentStep / 6) * 100;
  };

  const getPoints = () => {
    switch (currentStep) {
      case 1:
        return '+25pts';
      case 2:
        return '+40pts';
      case 3:
        return '+10pts';
      case 4:
        return '+3pts';
      case 5:
        return '+85pts';
      case 6:
        return '+100pts';
      default:
        return '+25pts';
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
    // Use real progress data if available
    if (progressData && progressData.completedSteps) {
      const stepNames = {
        'welcome': 'Accueil',
        'goals': 'Objectifs',
        'profile_setup': 'Profil',
        'measurements': 'Mesures',
        'appointment': 'Rendez-vous',
        'subscription': 'Abonnement'
      };
      
      const currentStepName = progressData.currentStep;
      const completedSteps = progressData.completedSteps;
      
      if (completedSteps.includes(currentStepName)) {
        return `${stepNames[currentStepName] || 'Étape'} complété`;
      }
    }
    
    // Fallback to step-based status
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
            <NotificationBadge />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.profileButton} onPress={() => {
            console.log('🔍 ProfileScreen: Header avatar clicked');
            console.log('🔍 ProfileScreen: onTabPress function:', onTabPress);
            console.log('🔍 ProfileScreen: onLogout function:', onLogout);
            console.log('🔍 ProfileScreen: navigation prop:', navigation);
            
            if (onTabPress && typeof onTabPress === 'function') {
              console.log('🔍 ProfileScreen: Calling onTabPress("settings")');
              onTabPress('settings');
            } else if (navigation && typeof navigation.navigate === 'function') {
              console.log('🔍 ProfileScreen: Using navigation.navigate("Settings")');
              navigation.navigate('Settings');
            } else {
              console.log('🔍 ProfileScreen: No navigation method available, doing nothing');
              // Don't call onLogout - just do nothing
            }
          }}>
            <Avatar 
              source={{ uri: profileData?.avatar || user?.avatar }} 
              size={40}
              style={styles.profileImage}
              fallbackText={user?.firstName?.charAt(0) || user?.name?.charAt(0)}
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
        onScrollBeginDrag={() => {
          // Clean up any open modals if needed
        }}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Chargement du profil...</Text>
          </View>
        ) : (
          <>
            {/* Profile Header */}
            <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <Pressable 
              onPress={handleAvatarUpload}
              style={({ pressed }) => [
                styles.avatarUploadButton,
                pressed && { opacity: 0.7 }
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Avatar 
                source={{ uri: profileData?.avatar || user?.avatar }} 
                size={80}
                style={styles.largeProfileImage}
                fallbackText={user?.firstName?.charAt(0) || user?.name?.charAt(0)}
              />
              <View style={styles.avatarUploadOverlay}>
                <Ionicons name="camera" size={24} color="#FFFFFF" />
              </View>
              {avatarUploading && (
                <View style={styles.avatarUploadingOverlay}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                </View>
              )}
            </Pressable>
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
          <SubscriptionScreen
            navigation={navigation}
            onClose={() => setCurrentStep(4)}
            onNext={() => setCurrentStep(6)}
          />
        ) : currentStep === 6 ? (
          renderOnboardingSummary()
        ) : null}
          </>
        )}
      </ScrollView>

      {/* Navigation Footer */}
      <View style={styles.navigationFooter}>
        <TouchableOpacity style={styles.prevButton} onPress={handlePrevious}>
          <Ionicons name="chevron-back" size={20} color="#666" />
        </TouchableOpacity>
        
        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>
            Étape {currentStep} sur 6
          </Text>
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
      {renderConfirmationModal()}
      
      {/* Selection Modals */}
      {renderCountryModal()}
      {renderGenderModal()}
      {renderOccupationModal()}
      {renderDateModal()}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.text.secondary,
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
  avatarUploadButton: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  largeProfileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarUploadOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarUploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  disabledInput: {
    backgroundColor: '#F5F5F5',
    color: theme.colors.text.secondary,
    borderColor: '#CCCCCC',
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
    minHeight: 48,
  },
  dropdownText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    flex: 1,
    marginRight: 8,
  },
  dropdownOptions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginTop: 4,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    maxHeight: 200,
  },
  dropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  dropdownOptionTextSelected: {
    color: theme.colors.primary,
    fontWeight: 'bold',
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
  consentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  consentText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    marginLeft: 10,
    flex: 1,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: 16,
  },
  modalFormField: {
    marginBottom: 16,
    width: '100%',
  },
  modalInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 6,
  },
  modalTextInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: theme.colors.text.primary,
    backgroundColor: '#FFFFFF',
    minHeight: 44,
  },
  modalDropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    minHeight: 44,
  },
  modalDropdownText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    flex: 1,
    marginRight: 8,
  },
  modalDropdownOptions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginTop: 2,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modalDropdownOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalDropdownOptionText: {
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  modalDropdownOptionTextSelected: {
    color: '#2196F3',
    fontWeight: '600',
  },
  modalSubjectInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  modalNotesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalCharacterCount: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    textAlign: 'right',
    marginTop: 2,
  },
  characterCount: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'right',
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
    paddingVertical: 10,
    minHeight: 44,
  },
  dateTimeInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text.primary,
    minHeight: 44,
    paddingVertical: 10,
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
  // New Confirmed Appointment Styles (matching web design)
  confirmationBanner: {
    backgroundColor: '#D1FAE5',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.success,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  confirmationText: {
    fontSize: 14,
    color: '#065F46',
    lineHeight: 20,
  },
  confirmedAppointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  confirmedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  confirmedIconContainer: {
    marginRight: 12,
  },
  confirmedHeaderText: {
    flex: 1,
  },
  confirmedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  confirmedSubtitle: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  confirmedBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  confirmedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
    letterSpacing: 0.5,
  },
  appointmentMessage: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  timelineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  timelineStep: {
    flex: 1,
    alignItems: 'center',
  },
  timelineStepHighlight: {
    backgroundColor: '#D1FAE5',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  timelineStepFinal: {
    backgroundColor: '#ECFDF5',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  timelineLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  timelineDate: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  timelineName: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.success,
  },
  timelineTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  timelineTimeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.success,
    marginLeft: 4,
  },
  timelineRemaining: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  timelineArrow: {
    marginHorizontal: 4,
  },
  detailSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  detailSectionValue: {
    fontSize: 14,
    color: theme.colors.text.primary,
    lineHeight: 20,
  },
  coachInfoSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  coachInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  coachInfoLeft: {
    flex: 1,
    paddingRight: 12,
  },
  coachInfoRight: {
    flex: 1,
    paddingLeft: 12,
  },
  coachInfoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  coachInfoName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  coachInfoEmail: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  meetingLink: {
    fontSize: 12,
    color: '#3B82F6',
    textDecorationLine: 'underline',
    marginBottom: 6,
  },
  meetingLinkPending: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  meetingProviderBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  meetingProviderText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E40AF',
  },
  appointmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  footerItem: {
    flex: 1,
  },
  footerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  footerValue: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.primary,
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
  
  // Selection Modal Styles
  selectionModalContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  selectionModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectionModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    flex: 1,
  },
  selectionModalContent: {
    maxHeight: 300,
  },
  selectionModalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: 'transparent',
    minHeight: 48,
  },
  selectionModalOptionText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    fontWeight: '400',
  },
  selectionModalOptionTextSelected: {
    color: theme.colors.primary,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  modalCloseButton: {
    padding: 4,
  },
  selectionModalOptionSelected: {
    backgroundColor: theme.colors.primaryLight,
  },
  
  // Date Modal Styles
  dateModalContent: {
    padding: 0,
    marginBottom: 24,
  },
  datePickerContainer: {
    marginBottom: 24,
  },
  datePickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  datePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  datePickerButton: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  datePickerText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    flex: 1,
    marginHorizontal: 16,
  },
  timePickerContainer: {
    marginBottom: 24,
  },
  timePickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  timeSlotButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minWidth: 80,
    alignItems: 'center',
  },
  timeSlotButtonSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  timeSlotText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  timeSlotTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  confirmDateButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  confirmDateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dateTimeInputText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    flex: 1,
    paddingVertical: 12,
  },
});

export default ProfileScreen; 