import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
  Dimensions,
  Modal,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, theme } from '../constants/theme';
import { validateEmail, validatePassword } from '../constants/utils';
import { useAuth } from '../context/FirebaseAuthContext';
import useGoogleAuthHybrid from '../hooks/useGoogleAuthHybrid';
import { useIOSSimulation } from '../hooks/useIOSSimulation';
import useCompanionMode from '../hooks/useCompanionMode';
import type { LoginScreenNavigationProp } from '../types/navigation';
import type { RouteProp } from '@react-navigation/native';
import HelpBottomSheet from '../components/auth/HelpBottomSheet';
import imageCache from '../utils/imageCache';
import ImagePersistent from '../components/ImagePersistent';

const { width: screenWidth } = Dimensions.get('window');

// Précharger le logo au chargement du module
const LOGO_SOURCE = require('../../assets/logo.png');
imageCache.preloadLocalImage('logo', LOGO_SOURCE);

interface WelcomeSlide {
  id: number;
  image: any;
}

interface LoginScreenRouteParams {
  skipWelcomeSlides?: boolean;
  forceShowWelcomeSlides?: boolean;
  token?: string;
}

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
  route: RouteProp<{ Login: LoginScreenRouteParams }, 'Login'>;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
  [key: string]: string | undefined;
}

// Welcome slides data
const welcomeSlides: WelcomeSlide[] = [
  {
    id: 1,
    image: require('../../assets/welcome/slide onboarding 1.png'),
  },
  {
    id: 2,
    image: require('../../assets/welcome/slide onboarding 2.png'),
  },
  {
    id: 3,
    image: require('../../assets/welcome/slide onboarding 3.png'),
  },
  {
    id: 4,
    image: require('../../assets/welcome/slide onboarding 4.png'),
  },
];

export default function LoginScreen({ navigation, route }: LoginScreenProps): React.JSX.Element {
  // Multi-step form state
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);


  const [showWelcomeSlides, setShowWelcomeSlides] = useState<boolean>(false);
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [showHelpBottomSheet, setShowHelpBottomSheet] = useState<boolean>(false);

  const { login, register, forgotPassword, loading } = useAuth();
  const {
    signInWithGoogle: triggerGoogleSignIn,
    isAvailable: isGoogleAvailable,
    isPrompting: isGooglePrompting,
  } = useGoogleAuthHybrid(); // SDK natif sur iOS et Android
  const { isIOSSimulationEnabled } = useIOSSimulation(); // Pour simuler l'apparence iOS
  const { isCompanionMode } = useCompanionMode(); // Pour vérifier le mode compagnon
  
  /**
   * Handle Google login
   */
  const handleGoogleLogin = async (): Promise<void> => {
    setErrors({});
    const result = await triggerGoogleSignIn();
    if (result?.error) {
      setErrors({ general: result.error });
    }
  };

  const flatListRef = useRef<FlatList<WelcomeSlide> | null>(null);
  const hasUserTyped = useRef<boolean>(false);

  // Check if we should show welcome slides
  useEffect(() => {
    const checkWelcomeSlides = async () => {
      try {
        const skipWelcomeSlides = route.params?.skipWelcomeSlides || false;
        const hasSeenWelcomeSlides = await AsyncStorage.getItem('hasSeenWelcomeSlides');
        
        // For debugging: Always show welcome slides for now
        // TODO: Remove this after testing
        const forceShowWelcomeSlides = route.params?.forceShowWelcomeSlides || false;
        
        // Show welcome slides if:
        // 1. User hasn't seen them AND not skipping, OR
        // 2. Force show is enabled
        if ((!hasSeenWelcomeSlides && !skipWelcomeSlides) || forceShowWelcomeSlides) {
          setShowWelcomeSlides(true);
        } else {
          setShowWelcomeSlides(false);
        }
      } catch (error) {
        setShowWelcomeSlides(false);
      }
    };
    
    checkWelcomeSlides();
  }, [route.params]);

  /**
   * Validate form inputs
   * @returns {boolean} True if form is valid
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Adresse e-mail invalide';
    }

    if (!password.trim()) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (!validatePassword(password)) {
      newErrors.password = 'Le mot de passe ne respecte pas les critères de sécurité';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle user login
   */
  const handleLogin = async (): Promise<void> => {
    if (!validateForm()) {
      return;
    }

    // Reset user typing flag and clear any previous errors
    hasUserTyped.current = false;
    setErrors({});

    try {
      const result = await login(email.trim(), password.trim());
      
      if (result.user) {
        // Navigation will be handled by the authentication flow
        // The app will automatically redirect to dashboard
      } else if (result.error) {
        // Set the error message under the password field
        setErrors({ password: result.error });
      } else {
        setErrors({ general: 'Une erreur inattendue est survenue. Veuillez réessayer.' });
      }
    } catch (error: any) {
      
      // Handle specific error types
      if (error.message?.includes('Network Error') || error.code === 'ERR_NETWORK') {
        setErrors({ general: 'Erreur de connexion. Vérifiez votre connexion internet.' });
      } else if (error.message?.includes('Transform') || error.message?.includes('invariant')) {
        // Don't show this error to user as it's a technical issue
      } else {
        // Set a general error for other types
        setErrors({ general: 'Une erreur est survenue. Veuillez réessayer.' });
      }
    }
  };

  /**
   * Handle forgot password
   */
  const handleForgotPassword = async (): Promise<void> => {
    if (!email.trim()) {
      setErrors({ email: 'Veuillez entrer votre email pour réinitialiser le mot de passe' });
      return;
    }

    if (!validateEmail(email)) {
      setErrors({ email: 'Veuillez entrer un email valide' });
      return;
    }

    try {
      await forgotPassword(email.trim());
      
      // Navigate to password reset screen
      navigation.navigate('PasswordReset');
    } catch (error: any) {
    }
  };

  /**
   * Navigate to register screen
   */
  const handleRegister = (): void => {
    navigation.navigate('Register');
  };

  /**
   * Clear field error when user starts typing
   * @param {string} field 
   */
  const clearError = (field: string): void => {
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  /**
   * Update form data for multi-step form
   */
  const updateFormData = (field: keyof typeof formData, value: string): void => {
    // Limit phone to 10 characters
    if (field === 'phone' && value.length > 10) {
      return;
    }
    setFormData(prev => ({ ...prev, [field]: value }));
    clearError(field);
  };

  /**
   * Check if step 1 is valid (email format)
   */
  const isStep1Valid = (): boolean => {
    return formData.email.trim() !== '' && validateEmail(formData.email);
  };

  /**
   * Check if step 2 is valid (all fields filled)
   */
  const isStep2Valid = (): boolean => {
    return (
      formData.firstName.trim() !== '' &&
      formData.lastName.trim() !== '' &&
      formData.phone.trim() !== '' &&
      formData.phone.trim().length === 10
    );
  };

  /**
   * Check if password itself meets security requirements (without confirmation check)
   */
  const isPasswordValid = (): boolean => {
    const passwordReqs = getPasswordRequirements();
    return (
      formData.password.trim() !== '' &&
      passwordReqs.minLength &&
      passwordReqs.hasLowercase &&
      passwordReqs.hasUppercase &&
      passwordReqs.hasNumber &&
      passwordReqs.hasSpecial
    );
  };

  /**
   * Check if step 3 is valid (password meets requirements AND confirmation matches)
   */
  const isStep3Valid = (): boolean => {
    return (
      isPasswordValid() &&
      formData.confirmPassword.trim() !== '' &&
      formData.password === formData.confirmPassword
    );
  };

  /**
   * Validate step 1 (Email)
   */
  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Adresse e-mail invalide';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Validate step 2 (Personal info)
   */
  const validateStep2 = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom est requis';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Le numéro de téléphone est requis';
    } else if (formData.phone.trim().length !== 10) {
      newErrors.phone = 'Le numéro de téléphone doit contenir 10 chiffres';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Validate step 3 (Password)
   */
  const validateStep3 = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.password.trim()) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Le mot de passe ne respecte pas les critères de sécurité';
    }
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'La confirmation du mot de passe est requise';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Navigate to next step
   */
  const handleNextStep = (): void => {
    let isValid = false;
    
    if (currentStep === 1) {
      isValid = validateStep1();
    } else if (currentStep === 2) {
      isValid = validateStep2();
    } else if (currentStep === 3) {
      isValid = validateStep3();
    }

    if (isValid && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  /**
   * Navigate to previous step
   */
  const handlePreviousStep = (): void => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  /**
   * Handle final registration
   * 
   * Note: Plan assignment logic:
   * - Android: No default plan - user must manually subscribe
   * - iOS: Default iOS plan may be assigned by backend (companion mode)
   */
  const handleFinalRegistration = async (): Promise<void> => {
    if (!validateStep3()) {
      return;
    }

    try {
      const registrationData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
        role: 'USER'
      };

      // Register user (platform info is sent automatically by firebaseAuthService)
      await register(registrationData);
    } catch (error: any) {
      // Améliorer la gestion d'erreur pour mieux afficher les erreurs réseau
      let errorMessage = 'Une erreur est survenue lors de l\'inscription';
      
      // Vérifier les erreurs réseau spécifiques
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.code === 'ERR_NETWORK' || error?.message?.includes('Network')) {
        errorMessage = 'Erreur de connexion. Vérifiez votre connexion internet et réessayez.';
      } else if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
        errorMessage = 'Délai de connexion dépassé. Vérifiez votre connexion internet et réessayez.';
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      setErrors({ general: errorMessage });
    }
  };

  /**
   * Get password requirements status
   */
  const getPasswordRequirements = () => {
    const password = formData.password;
    return {
      minLength: password.length >= 8,
      hasLowercase: /[a-z]/.test(password),
      hasUppercase: /[A-Z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
  };

  /**
   * Handle slide change
   */
  const handleSlideChange = (event: NativeSyntheticEvent<NativeScrollEvent>): void => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    setCurrentSlideIndex(slideIndex);
    
    // Auto-transition to login on last slide
    if (slideIndex === welcomeSlides.length - 1) {
      setTimeout(() => {
        handleSkipSlides();
      }, 2000); // Wait 2 seconds on last slide before transitioning
    }
  };

  /**
   * Skip welcome slides without animation
   */
  const handleSkipSlides = async (): Promise<void> => {
    try {
      await AsyncStorage.setItem('hasSeenWelcomeSlides', 'true');
      setShowWelcomeSlides(false);
      } catch (error: any) {
        setShowWelcomeSlides(false);
      }
    };


  /**
   * Render welcome slide item
   */
  const renderWelcomeSlide = ({ item }: { item: WelcomeSlide }): React.JSX.Element => (
    <View style={styles.slideContainer}>
      <Image source={item.image} style={styles.slideImage} resizeMode="contain" />
    </View>
  );

  /**
   * Render welcome slides
   */
  const renderWelcomeSlides = (): React.JSX.Element => (
    <View style={styles.welcomeContainer}>
      {/* Skip Button */}
      <TouchableOpacity style={styles.skipButton} onPress={handleSkipSlides}>
        <Text style={styles.skipButtonText}>Passer</Text>
      </TouchableOpacity>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={welcomeSlides}
        renderItem={renderWelcomeSlide}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleSlideChange}
        style={styles.slidesContainer}
        decelerationRate="fast"
        snapToInterval={screenWidth}
        snapToAlignment="center"
      />

      {/* Pagination Dots */}
      <View style={styles.paginationContainer}>
        {welcomeSlides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index === currentSlideIndex && styles.paginationDotActive
            ]}
          />
        ))}
      </View>
    </View>
  );

  /**
   * Render terms of service modal
   */
  const renderTermsModal = (): React.JSX.Element => (
    <Modal
      visible={showTermsModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowTermsModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Termes de services</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowTermsModal(false)}
            >
              <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Modal Content */}
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.termsContent}>
              <Text style={styles.termsBold}>Bienvenue sur LaSo Coach !{'\n\n'}</Text>
              
              En utilisant notre plateforme, vous acceptez nos conditions d'utilisation.{'\n\n'}
              
              • Vos données sont protégées et utilisées uniquement pour améliorer votre expérience santé.{'\n'}
              • Respectez la communauté et les autres utilisateurs.{'\n'}
              • Les conseils fournis ne remplacent pas un avis médical professionnel.{'\n\n'}
              
              Pour toute question, contactez notre support.{'\n\n'}
              
              Merci de faire confiance à LaSo Coach !{'\n\n'}
              
              <Text style={styles.termsSeparator}>───────────────────────────────────────{'\n\n'}</Text>
              
              <Text style={styles.termsBold}>1. Introduction{'\n'}</Text>
              LaSo Coach est une plateforme dédiée à votre bien-être. En accédant à nos services, vous acceptez les présentes conditions générales d'utilisation.{'\n\n'}
              
              <Text style={styles.termsBold}>2. Utilisation des services{'\n'}</Text>
              Vous vous engagez à utiliser la plateforme de manière responsable et respectueuse. Toute utilisation abusive, frauduleuse ou contraire à l'éthique entraînera la suspension de votre compte.{'\n\n'}
              
              <Text style={styles.termsBold}>3. Protection des données{'\n'}</Text>
              Nous mettons tout en œuvre pour garantir la sécurité de vos informations personnelles. Vos données ne seront jamais vendues à des tiers sans votre consentement explicite.{'\n\n'}
              
              <Text style={styles.termsBold}>4. Contenu utilisateur{'\n'}</Text>
              Vous êtes responsable du contenu que vous publiez sur la plateforme. Veillez à ne pas partager d'informations sensibles ou confidentielles.{'\n\n'}
              
              <Text style={styles.termsBold}>5. Propriété intellectuelle{'\n'}</Text>
              Tous les contenus, logos, images et textes présents sur LaSo Coach sont protégés par le droit d'auteur. Toute reproduction ou utilisation sans autorisation est strictement interdite.{'\n\n'}
              
              <Text style={styles.termsBold}>6. Modifications des conditions{'\n'}</Text>
              LaSo Coach se réserve le droit de modifier les présentes conditions à tout moment. Vous serez informé de toute modification majeure par email ou notification sur la plateforme.{'\n\n'}
              
              <Text style={styles.termsBold}>7. Limitation de responsabilité{'\n'}</Text>
              LaSo Coach ne saurait être tenu responsable des dommages directs ou indirects résultant de l'utilisation de la plateforme.{'\n\n'}
              
              <Text style={styles.termsBold}>8. Résiliation{'\n'}</Text>
              Vous pouvez résilier votre compte à tout moment via les paramètres de votre profil.{'\n\n'}
              
              <Text style={styles.termsBold}>9. Contact{'\n'}</Text>
              Pour toute question ou réclamation, veuillez nous contacter à support@lasocoach.com.{'\n\n'}
              
              <Text style={styles.termsSeparator}>───────────────────────────────────────{'\n\n'}</Text>
              
              <Text style={styles.termsBold}>Merci de lire attentivement ces conditions. En continuant à utiliser LaSo Coach, vous confirmez votre acceptation de l'ensemble des termes ci-dessus.</Text>{'\n\n'}
              
              <Text style={styles.termsSeparator}>───────────────────────────────────────{'\n\n'}</Text>
              
              <Text style={styles.termsBold}>Fin des conditions.{'\n\n'}</Text>
              <Text style={styles.termsContent}>www.lasocoach.com</Text>
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );



  /**
   * Render step indicator (stepper) - Simplified: only numbers
   */
  const renderStepper = (): React.JSX.Element => (
    <View style={styles.stepperContainer}>
      {[1, 2, 3, 4].map((step) => (
        <React.Fragment key={step}>
          <View style={styles.stepperStep}>
            <View
              style={[
                styles.stepperCircle,
                currentStep >= step && styles.stepperCircleActive,
              ]}
            >
              {currentStep > step ? (
                <Ionicons name="checkmark" size={16} color={COLORS.white} />
              ) : (
                <Text style={styles.stepperNumber}>{step}</Text>
              )}
            </View>
          </View>
          {step < 4 && (
            <View
              style={[
                styles.stepperLine,
                currentStep > step && styles.stepperLineActive,
              ]}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  /**
   * Render Step 1: Email
   */
  const renderStep1 = (): React.JSX.Element => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Votre adresse e-mail</Text>
      <Text style={styles.stepSubtitle}>
        Nous utiliserons cette adresse pour vous contacter
      </Text>

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <View style={styles.inputIconLeft}>
            <Ionicons name="mail-outline" size={20} color={errors.email ? COLORS.error : '#666'} />
          </View>
          <TextInput
            style={[
              styles.input,
              styles.inputWithIcon,
              errors.email && styles.inputError,
              { color: '#424242' }
            ]}
            placeholder="E-mail *"
            placeholderTextColor="#999"
            value={formData.email}
            onChangeText={(text) => updateFormData('email', text)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            {...(Platform.OS === 'android' && {
              selectionColor: '#424242',
              underlineColorAndroid: 'transparent',
            })}
          />
        </View>
        {errors.email && (
          <Text style={styles.errorText}>{errors.email}</Text>
        )}
      </View>
    </View>
  );

  /**
   * Render Step 2: Personal Information
   */
  const renderStep2 = (): React.JSX.Element => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Vos informations personnelles</Text>
      <Text style={styles.stepSubtitle}>
        Ces informations nous aideront à personnaliser votre expérience
      </Text>

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <View style={styles.inputIconLeft}>
            <Ionicons name="person-outline" size={20} color={errors.firstName ? COLORS.error : '#666'} />
          </View>
          <TextInput
            style={[
              styles.input,
              styles.inputWithIcon,
              errors.firstName && styles.inputError,
              { color: '#424242' }
            ]}
            placeholder="Prénom *"
            placeholderTextColor="#999"
            value={formData.firstName}
            onChangeText={(text) => updateFormData('firstName', text)}
            autoCapitalize="words"
            autoCorrect={false}
            editable={!loading}
            {...(Platform.OS === 'android' && {
              selectionColor: '#424242',
              underlineColorAndroid: 'transparent',
            })}
          />
        </View>
        {errors.firstName && (
          <Text style={styles.errorText}>{errors.firstName}</Text>
        )}
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <View style={styles.inputIconLeft}>
            <Ionicons name="person-outline" size={20} color={errors.lastName ? COLORS.error : '#666'} />
          </View>
          <TextInput
            style={[
              styles.input,
              styles.inputWithIcon,
              errors.lastName && styles.inputError,
              { color: '#424242' }
            ]}
            placeholder="Nom *"
            placeholderTextColor="#999"
            value={formData.lastName}
            onChangeText={(text) => updateFormData('lastName', text)}
            autoCapitalize="words"
            autoCorrect={false}
            editable={!loading}
            {...(Platform.OS === 'android' && {
              selectionColor: '#424242',
              underlineColorAndroid: 'transparent',
            })}
          />
        </View>
        {errors.lastName && (
          <Text style={styles.errorText}>{errors.lastName}</Text>
        )}
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <View style={styles.inputIconLeft}>
            <Ionicons name="call-outline" size={20} color={errors.phone ? COLORS.error : '#666'} />
          </View>
          <TextInput
            style={[
              styles.input,
              styles.inputWithIcon,
              errors.phone && styles.inputError,
              { color: '#424242' }
            ]}
            placeholder="Téléphone * (10 chiffres)"
            placeholderTextColor="#999"
            value={formData.phone}
            onChangeText={(text) => {
              // Only allow digits and limit to 10 characters
              const digitsOnly = text.replace(/[^0-9]/g, '');
              if (digitsOnly.length <= 10) {
                updateFormData('phone', digitsOnly);
              }
            }}
            keyboardType="phone-pad"
            autoCorrect={false}
            maxLength={10}
            editable={!loading}
            {...(Platform.OS === 'android' && {
              selectionColor: '#424242',
              underlineColorAndroid: 'transparent',
            })}
          />
        </View>
        {errors.phone && (
          <Text style={styles.errorText}>{errors.phone}</Text>
        )}
        {formData.phone.length > 0 && formData.phone.length < 10 && (
          <Text style={styles.helperText}>
            {formData.phone.length}/10 caractères
          </Text>
        )}
      </View>
    </View>
  );

  /**
   * Render Step 3: Password Creation
   */
  const renderStep3 = (): React.JSX.Element => {
    const passwordReqs = getPasswordRequirements();

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Créez votre mot de passe</Text>
        <Text style={styles.stepSubtitle}>
          Choisissez un mot de passe sécurisé pour protéger votre compte
        </Text>

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <View style={styles.inputIconLeft}>
              <Ionicons name="lock-closed-outline" size={20} color={errors.password ? COLORS.error : '#666'} />
            </View>
            <TextInput
              style={[
                styles.input,
                styles.inputWithIcon,
                styles.passwordInput,
                errors.password && styles.inputError,
                formData.password.length > 0 && !isPasswordValid() && styles.inputError,
                formData.password.length > 0 && isPasswordValid() && styles.inputValid,
                { color: '#424242' }
              ]}
              placeholder="Mot de passe *"
              placeholderTextColor="#999"
              value={formData.password}
              onChangeText={(text) => updateFormData('password', text)}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              textContentType="password"
              autoComplete="password"
              {...(Platform.OS === 'android' && {
                selectionColor: '#424242',
                underlineColorAndroid: 'transparent',
              })}
            />
            <TouchableOpacity
              style={styles.inputIconRight}
              onPress={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>
          {errors.password && (
            <Text style={styles.errorText}>{errors.password}</Text>
          )}
          {formData.password.length > 0 && !isPasswordValid() && (
            <Text style={styles.errorText}>
              Le mot de passe ne respecte pas les critères de sécurité
            </Text>
          )}
          {formData.password.length > 0 && isPasswordValid() && formData.password !== formData.confirmPassword && formData.confirmPassword.length > 0 && (
            <Text style={styles.errorText}>
              Les mots de passe ne correspondent pas
            </Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <View style={styles.inputIconLeft}>
              <Ionicons name="lock-closed-outline" size={20} color={errors.confirmPassword ? COLORS.error : '#666'} />
            </View>
            <TextInput
              style={[
                styles.input,
                styles.inputWithIcon,
                styles.passwordInput,
                errors.confirmPassword && styles.inputError,
                { color: '#424242' }
              ]}
              placeholder="Confirmer le mot de passe *"
              placeholderTextColor="#999"
              value={formData.confirmPassword}
              onChangeText={(text) => updateFormData('confirmPassword', text)}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              textContentType="password"
              autoComplete="password"
              {...(Platform.OS === 'android' && {
                selectionColor: '#424242',
                underlineColorAndroid: 'transparent',
              })}
            />
            <TouchableOpacity
              style={styles.inputIconRight}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={loading}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off" : "eye"}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>
          {errors.confirmPassword && (
            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
          )}
        </View>

        {/* Password Requirements */}
        <View style={styles.passwordRequirementsContainer}>
          <Text style={styles.passwordRequirementsTitle}>
            Votre mot de passe doit contenir :
          </Text>
          <View style={styles.passwordRequirementsList}>
            <View style={styles.passwordRequirementItem}>
              <Ionicons
                name={passwordReqs.minLength ? "checkmark-circle" : "ellipse-outline"}
                size={18}
                color={passwordReqs.minLength ? COLORS.success : '#999'}
              />
              <Text
                style={[
                  styles.passwordRequirementText,
                  passwordReqs.minLength && styles.passwordRequirementTextMet,
                ]}
              >
                Au moins 8 caractères
              </Text>
            </View>
            <View style={styles.passwordRequirementItem}>
              <Ionicons
                name={passwordReqs.hasLowercase ? "checkmark-circle" : "ellipse-outline"}
                size={18}
                color={passwordReqs.hasLowercase ? COLORS.success : '#999'}
              />
              <Text
                style={[
                  styles.passwordRequirementText,
                  passwordReqs.hasLowercase && styles.passwordRequirementTextMet,
                ]}
              >
                Au moins 1 lettre minuscule
              </Text>
            </View>
            <View style={styles.passwordRequirementItem}>
              <Ionicons
                name={passwordReqs.hasUppercase ? "checkmark-circle" : "ellipse-outline"}
                size={18}
                color={passwordReqs.hasUppercase ? COLORS.success : '#999'}
              />
              <Text
                style={[
                  styles.passwordRequirementText,
                  passwordReqs.hasUppercase && styles.passwordRequirementTextMet,
                ]}
              >
                Au moins 1 lettre majuscule
              </Text>
            </View>
            <View style={styles.passwordRequirementItem}>
              <Ionicons
                name={passwordReqs.hasNumber ? "checkmark-circle" : "ellipse-outline"}
                size={18}
                color={passwordReqs.hasNumber ? COLORS.success : '#999'}
              />
              <Text
                style={[
                  styles.passwordRequirementText,
                  passwordReqs.hasNumber && styles.passwordRequirementTextMet,
                ]}
              >
                Au moins 1 chiffre
              </Text>
            </View>
            <View style={styles.passwordRequirementItem}>
              <Ionicons
                name={passwordReqs.hasSpecial ? "checkmark-circle" : "ellipse-outline"}
                size={18}
                color={passwordReqs.hasSpecial ? COLORS.success : '#999'}
              />
              <Text
                style={[
                  styles.passwordRequirementText,
                  passwordReqs.hasSpecial && styles.passwordRequirementTextMet,
                ]}
              >
                Au moins 1 caractère spécial (!@#$%^&*...)
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  /**
   * Render Step 4: Summary
   */
  const renderStep4 = (): React.JSX.Element => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Récapitulatif</Text>
      <Text style={styles.stepSubtitle}>
        Vérifiez vos informations avant de finaliser votre inscription
      </Text>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <View style={styles.summaryItemHeader}>
            <Ionicons name="mail-outline" size={20} color={COLORS.primary} />
            <Text style={styles.summaryItemLabel}>E-mail</Text>
          </View>
          <Text style={styles.summaryItemValue}>{formData.email}</Text>
        </View>

        <View style={styles.summaryItem}>
          <View style={styles.summaryItemHeader}>
            <Ionicons name="person-outline" size={20} color={COLORS.primary} />
            <Text style={styles.summaryItemLabel}>Nom complet</Text>
          </View>
          <Text style={styles.summaryItemValue}>
            {formData.firstName} {formData.lastName}
          </Text>
        </View>

        <View style={styles.summaryItem}>
          <View style={styles.summaryItemHeader}>
            <Ionicons name="call-outline" size={20} color={COLORS.primary} />
            <Text style={styles.summaryItemLabel}>Téléphone</Text>
          </View>
          <Text style={styles.summaryItemValue}>{formData.phone}</Text>
        </View>
      </View>
    </View>
  );

  /**
   * Render current step content
   */
  const renderCurrentStep = (): React.JSX.Element => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return renderStep1();
    }
  };

  /**
   * Render login form (multi-step)
   * Garde les deux formulaires montés pour éviter la disparition des images
   */
  const renderLoginForm = (): React.JSX.Element => {
    // Rendre les deux formulaires mais n'afficher que celui qui est actif
    // Cela garde les images en mémoire
    return (
      <View style={styles.loginContainer}>
        {/* Formulaire de connexion - toujours monté */}
        <View style={[styles.formContainer, !isRegisterMode && styles.formContainerActive]}>
          <LinearGradient
            colors={['#8BC34A', '#9CCC65']}
            style={styles.container}
          >
            <SafeAreaView style={styles.container}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
              >
                <ScrollView
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Main Content Card */}
                  <View style={styles.mainCard}>
                    {/* Logo Section */}
                    <View style={styles.logoSection}>
                      <ImagePersistent
                        source={imageCache.getLocalImage('logo') || LOGO_SOURCE}
                        style={styles.logo}
                        resizeMode="contain"
                        fallbackSource={LOGO_SOURCE}
                      />
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>Connexion à votre compte</Text>

                    {/* Form */}
                    <View style={styles.form}>
                      {/* Email Input */}
                      <View style={styles.inputContainer}>
                        <View style={styles.inputWrapper}>
                          <View style={styles.inputIconLeft}>
                            <Ionicons name="mail-outline" size={20} color="#000" />
                          </View>
                          <TextInput
                            style={[
                              styles.input,
                              styles.inputWithIcon,
                              errors.email && styles.inputError,
                              { color: '#424242' }
                            ]}
                            placeholder="E-mail *"
                            placeholderTextColor="#999"
                            value={email}
                            onChangeText={(text) => {
                              setEmail(text);
                              clearError('email');
                            }}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!loading}
                            {...(Platform.OS === 'android' && {
                              selectionColor: '#424242',
                              underlineColorAndroid: 'transparent',
                            })}
                          />
                        </View>
                        {errors.email && (
                          <Text style={styles.errorText}>{errors.email}</Text>
                        )}
                      </View>

                      {/* Password Input */}
                      <View style={styles.inputContainer}>
                        <View style={styles.inputWrapper}>
                          <View style={styles.inputIconLeft}>
                            <Ionicons name="lock-closed-outline" size={20} color="#000" />
                          </View>
                          <TextInput
                            style={[
                              styles.input,
                              styles.inputWithIcon,
                              styles.passwordInput,
                              errors.password && styles.inputError,
                              { color: '#424242' }
                            ]}
                            placeholder="Mot de passe *"
                            placeholderTextColor="#999"
                            value={password}
                            onChangeText={(text) => {
                              setPassword(text);
                              if (hasUserTyped.current) {
                                clearError('password');
                              }
                              hasUserTyped.current = true;
                            }}
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!loading}
                            textContentType="password"
                            autoComplete="password"
                            {...(Platform.OS === 'android' && {
                              selectionColor: '#424242',
                              underlineColorAndroid: 'transparent',
                            })}
                          />
                          <TouchableOpacity
                            style={styles.inputIconRight}
                            onPress={() => setShowPassword(!showPassword)}
                            disabled={loading}
                          >
                            <Ionicons
                              name={showPassword ? "eye-off" : "eye"}
                              size={20}
                              color="#000"
                            />
                          </TouchableOpacity>
                        </View>
                        {errors.password && (
                          <Text style={styles.errorText}>{errors.password}</Text>
                        )}
                      </View>

                      {/* Login Button */}
                      <TouchableOpacity
                        style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.8}
                      >
                        {loading ? (
                          <View style={styles.buttonContent}>
                            <ActivityIndicator
                              size="small"
                              color={COLORS.white}
                              style={styles.spinner}
                            />
                            <Text style={styles.loginButtonText}>Connexion...</Text>
                          </View>
                        ) : (
                          <Text style={styles.loginButtonText}>Se connecter</Text>
                        )}
                      </TouchableOpacity>

                      {/* Google Login Button - Masqué sur iOS et en mode compagnon */}
                      {Platform.OS !== 'ios' && !isCompanionMode && (
                        <TouchableOpacity
                          style={[styles.googleButton, loading && styles.loginButtonDisabled]}
                          onPress={handleGoogleLogin}
                          disabled={loading || isGooglePrompting || !isGoogleAvailable}
                          activeOpacity={0.8}
                        >
                          {loading || isGooglePrompting ? (
                            <View style={styles.buttonContent}>
                              <ActivityIndicator
                                size="small"
                                color="#000"
                                style={styles.spinner}
                              />
                              <Text style={styles.googleButtonText}>Connexion...</Text>
                            </View>
                          ) : (
                            <View style={styles.buttonContent}>
                              <AntDesign name="google" size={18} color="#000" style={styles.googleIcon} />
                              <Text style={styles.googleButtonText}>Continuer avec Google</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      )}

                      {errors.general && (
                        <Text style={styles.generalErrorText}>{errors.general}</Text>
                      )}

                      {/* Forgot Password */}
                      <TouchableOpacity
                        style={styles.forgotPasswordButton}
                        onPress={handleForgotPassword}
                        disabled={loading}
                      >
                        <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
                      </TouchableOpacity>

                      {/* Register Link */}
                      <View style={styles.registerContainer}>
                        <Text style={styles.registerText}>Vous n'avez pas de compte ? </Text>
                        <TouchableOpacity
                          onPress={() => setIsRegisterMode(true)}
                          disabled={loading}
                        >
                          <Text style={styles.registerLink}>Inscrivez-vous</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {/* Terms */}
                  <View style={styles.termsContainer}>
                    <Text style={styles.termsText}>
                      Sous réserve de conditions d'utilisation,{' '}
                      <Text 
                        style={styles.termsLink}
                        onPress={() => setShowTermsModal(true)}
                      >
                        Lire nos Termes de services
                      </Text>
                    </Text>
                  </View>
                </ScrollView>
              </KeyboardAvoidingView>
            </SafeAreaView>
          </LinearGradient>
        </View>

        {/* Formulaire d'inscription - toujours monté */}
        <View style={[styles.formContainer, isRegisterMode && styles.formContainerActive]}>
          <LinearGradient
            colors={['#8BC34A', '#9CCC65']}
            style={styles.container}
          >
            <SafeAreaView style={styles.container}>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
              >
                <ScrollView
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                {/* Main Content Card */}
                <View style={styles.mainCard}>
                  {/* Back Button */}
                  {currentStep === 4 ? (
                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={handlePreviousStep}
                      disabled={loading}
                    >
                      <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={() => setIsRegisterMode(false)}
                    >
                      <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                  )}

                  {/* Logo Section */}
                  <View style={styles.logoSection}>
                    <ImagePersistent
                      source={imageCache.getLocalImage('logo') || LOGO_SOURCE}
                      style={styles.logo}
                      resizeMode="contain"
                      fallbackSource={LOGO_SOURCE}
                    />
                  </View>

                  {/* Title */}
                  <Text style={styles.title}>Création de votre compte</Text>

                  {/* Stepper */}
                  {renderStepper()}

                  {/* Current Step Content */}
                  <View style={styles.form}>
                    {renderCurrentStep()}
                  </View>

                  {/* Navigation Buttons */}
                  {currentStep < 4 ? (
                    <View style={styles.navigationButtons}>
                      {currentStep > 1 && (
                        <TouchableOpacity
                          style={styles.navButtonSecondary}
                          onPress={handlePreviousStep}
                          disabled={loading}
                        >
                          <Ionicons name="arrow-back" size={18} color={COLORS.primary} />
                          <Text style={styles.navButtonSecondaryText}>Précédent</Text>
                        </TouchableOpacity>
                      )}
                      
                      <TouchableOpacity
                        style={[
                          styles.navButtonPrimary,
                          currentStep === 1 && styles.navButtonPrimaryFull,
                          loading && styles.navButtonDisabled,
                          // Green when valid and enabled
                          (currentStep === 1 && isStep1Valid()) && styles.navButtonPrimaryValid,
                          (currentStep === 2 && isStep2Valid()) && styles.navButtonPrimaryValid,
                          (currentStep === 3 && isStep3Valid()) && styles.navButtonPrimaryValid,
                        ]}
                        onPress={handleNextStep}
                        disabled={
                          loading ||
                          (currentStep === 1 && !isStep1Valid()) ||
                          (currentStep === 2 && !isStep2Valid()) ||
                          (currentStep === 3 && !isStep3Valid())
                        }
                        activeOpacity={0.8}
                      >
                        <Text style={styles.navButtonPrimaryText}>Suivant</Text>
                        <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.navButtonCreateAccount,
                        styles.navButtonCreateAccountActive,
                        loading && styles.navButtonDisabled,
                      ]}
                      onPress={handleFinalRegistration}
                      disabled={loading}
                      activeOpacity={0.8}
                    >
                      {loading ? (
                        <View style={styles.buttonContent}>
                          <ActivityIndicator
                            size="small"
                            color={COLORS.white}
                            style={styles.spinner}
                          />
                          <Text style={styles.navButtonPrimaryText}>Création...</Text>
                        </View>
                      ) : (
                        <>
                          <Text style={styles.navButtonPrimaryText}>Créer mon compte</Text>
                          <Ionicons name="checkmark" size={18} color={COLORS.white} />
                        </>
                      )}
                    </TouchableOpacity>
                  )}

                  {/* Google Sign Up Button - Masqué sur iOS et en mode compagnon */}
                  {currentStep < 4 && Platform.OS !== 'ios' && !isCompanionMode && (
                    <>
                      {/* Divider */}
                      <View style={styles.dividerContainer}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>ou</Text>
                        <View style={styles.dividerLine} />
                      </View>

                      {/* Google Button */}
                      <TouchableOpacity
                        style={[styles.googleButton, loading && styles.loginButtonDisabled]}
                        onPress={handleGoogleLogin}
                        disabled={loading || isGooglePrompting || !isGoogleAvailable}
                        activeOpacity={0.8}
                      >
                        {loading || isGooglePrompting ? (
                          <View style={styles.buttonContent}>
                            <ActivityIndicator
                              size="small"
                              color="#000"
                              style={styles.spinner}
                            />
                            <Text style={styles.googleButtonText}>Connexion...</Text>
                          </View>
                        ) : (
                          <View style={styles.buttonContent}>
                            <AntDesign name="google" size={18} color="#000" style={styles.googleIcon} />
                            <Text style={styles.googleButtonText}>Continuer avec Google</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    </>
                  )}

                  {errors.general && (
                    <Text style={styles.generalErrorText}>{errors.general}</Text>
                  )}

                  {/* Login Link */}
                  <View style={styles.registerContainer}>
                    <Text style={styles.registerText}>Vous avez déjà un compte ? </Text>
                    <TouchableOpacity
                      onPress={() => setIsRegisterMode(false)}
                      disabled={loading}
                    >
                      <Text style={styles.registerLink}>Connectez-vous</Text>
                    </TouchableOpacity>
                  </View>
              </View>

              {/* Terms */}
              <View style={styles.termsContainer}>
                <Text style={styles.termsText}>
                  Sous réserve de conditions d'utilisation,{' '}
                  <Text 
                    style={styles.termsLink}
                    onPress={() => setShowTermsModal(true)}
                  >
                    Lire nos Termes de services
                  </Text>
                </Text>
              </View>
                </ScrollView>
              </KeyboardAvoidingView>
            </SafeAreaView>
          </LinearGradient>
        </View>
      </View>
    );
  };

  
  return (
    <View style={styles.rootContainer}>
      {showWelcomeSlides ? renderWelcomeSlides() : renderLoginForm()}
      {renderTermsModal()}
      
      {/* Google Authentication Loader Overlay - Grisé avec spinner */}
      {isGooglePrompting && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      )}

      {/* Help Floating Button - Only show when not in welcome slides */}
      {!showWelcomeSlides && (
        <TouchableOpacity
          style={styles.helpFloatingButton}
          onPress={() => setShowHelpBottomSheet(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="help-circle" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Help Bottom Sheet */}
      <HelpBottomSheet
        visible={showHelpBottomSheet}
        onClose={() => setShowHelpBottomSheet(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  // Welcome Slides Styles
  welcomeContainer: {
    flex: 1,
    backgroundColor: '#8BC34A',
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  skipButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  slidesContainer: {
    flex: 1,
  },
  slideContainer: {
    width: screenWidth,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 150,
  },
  slideImage: {
    width: screenWidth * 1.8,
    height: screenWidth * 1.8,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: 'white',
  },
  // Login Form Styles
  loginContainer: {
    flex: 1,
    position: 'relative',
  },
  formContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    pointerEvents: 'none',
  },
  formContainerActive: {
    opacity: 1,
    pointerEvents: 'auto',
    zIndex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 40,
    paddingBottom: SPACING.xl,
  },
  mainCard: {
    backgroundColor: COLORS.white,
    margin: 20,
    borderRadius: 20,
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    width: 150,
    height: 100,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: 'serif',
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  inputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#424242',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flex: 1,
  },
  inputWithIcon: {
    paddingLeft: 48, // Space for left icon
  },
  passwordInput: {
    color: '#424242',
    ...(Platform.OS === 'android' && {
      textAlignVertical: 'center',
      includeFontPadding: false,
    }),
  },
  inputError: {
    borderColor: COLORS.error,
  },
  inputValid: {
    borderColor: COLORS.success,
  },
  inputIconLeft: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputIconRight: {
    position: 'absolute',
    right: 16,
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  helperText: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },

  loginButton: {
    backgroundColor: '#000',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loginButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spinner: {
    marginRight: SPACING.sm,
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  forgotPasswordButton: {
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  googleButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 20,
  },
  googleButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '500',
  },
  googleIcon: {
    marginRight: 10,
  },
  generalErrorText: {
    color: COLORS.error,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#000',
    fontSize: 16,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 0,
  },
  registerText: {
    color: '#999',
    fontSize: 16,
  },
  registerLink: {
    color: '#FF9800',
    fontSize: 16,
    fontWeight: '600',
  },
  termsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  termsText: {
    color: '#6B8E23',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#4A5D23',
    fontWeight: '500',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  termsContent: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text.primary,
  },
  termsBold: {
    fontWeight: 'bold',
  },
  termsSeparator: {
    color: '#999',
  },
  // Loader Overlay Styles - Overlay grisé avec spinner
  loaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Overlay grisé semi-transparent
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  // Multi-step form styles
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 30,
    paddingHorizontal: 10,
  },
  stepperStep: {
    alignItems: 'center',
    flex: 1,
  },
  stepperCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepperCircleActive: {
    backgroundColor: COLORS.primary,
  },
  stepperNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  stepperLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
    marginBottom: 26,
  },
  stepperLineActive: {
    backgroundColor: COLORS.primary,
  },
  stepContainer: {
    width: '100%',
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'serif',
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  passwordRequirementsContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  passwordRequirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  passwordRequirementsList: {
    gap: 10,
  },
  passwordRequirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  passwordRequirementText: {
    fontSize: 13,
    color: '#999',
  },
  passwordRequirementTextMet: {
    color: COLORS.success,
    fontWeight: '500',
  },
  summaryContainer: {
    marginTop: 20,
    gap: 16,
  },
  summaryItem: {
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  summaryItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  summaryItemLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
  },
  summaryItemValue: {
    fontSize: 16,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 30,
  },
  navButtonPrimary: {
    flex: 1,
    backgroundColor: '#CCCCCC', // Gray when disabled
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  navButtonPrimaryValid: {
    backgroundColor: COLORS.success, // Green when valid and enabled
  },
  navButtonPrimaryFull: {
    flex: 1,
  },
  navButtonCreateAccount: {
    width: '100%',
    marginTop: 30,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  navButtonCreateAccountActive: {
    backgroundColor: COLORS.success, // Always green/active for step 4
  },
  navButtonPrimaryText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  navButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  navButtonSecondaryText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    marginTop: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
    color: '#666',
  },
  helpFloatingButton: {
    position: 'absolute',
    bottom: 215,
    right: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    zIndex: 1000,
  },
}); 