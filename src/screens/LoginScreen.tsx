import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, theme } from '../constants/theme';
import { validateEmail, validatePassword } from '../constants/utils';
import { useAuth } from '../context/FirebaseAuthContext';
import useGoogleAuth from '../hooks/useGoogleAuth';
import type { LoginScreenNavigationProp } from '../types/navigation';
import type { RouteProp } from '@react-navigation/native';

const { width: screenWidth } = Dimensions.get('window');

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
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});


  const [showWelcomeSlides, setShowWelcomeSlides] = useState<boolean>(false);
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);

  const { login, forgotPassword, loading } = useAuth();
  const {
    signInWithGoogle: triggerGoogleSignIn,
    isAvailable: isGoogleAvailable,
    isPrompting: isGooglePrompting,
  } = useGoogleAuth();
  
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
      const result = await login(email.trim(), password);
      
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
              
              Merci de lire attentivement ces conditions. En continuant à utiliser LaSo Coach, vous confirmez votre acceptation de l'ensemble des termes ci-dessus.{'\n\n'}
              
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, urna eu tincidunt consectetur, nisi nisl aliquam nunc, eget aliquam massa nisi nec erat. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Etiam at risus et justo dignissim congue. Donec congue lacinia dui, a porttitor lectus condimentum laoreet. Nunc eu ullamcorper orci. Quisque eget odio ac lectus vestibulum faucibus eget in metus. In pellentesque faucibus vestibulum. Nulla at nulla justo, eget luctus tortor. Nulla facilisi. Duis aliquet egestas purus in blandit. Curabitur vulputate, ligula lacinia scelerisque tempor, lacus lacus ornare ante, ac egestas est urna sit amet arcu. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Sed molestie augue sit amet leo consequat posuere. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Proin vel ante a orci tempus eleifend ut et magna.{'\n\n'}
              
              <Text style={styles.termsSeparator}>───────────────────────────────────────{'\n\n'}</Text>
              
              <Text style={styles.termsBold}>Fin des conditions.</Text>
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );



  /**
   * Render login form
   */
  const renderLoginForm = (): React.JSX.Element => (
    <View style={styles.loginContainer}>
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
                  <Image
                    source={require('../../assets/logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
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
                          { color: '#424242' } // Explicit color for Android
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
                          { color: '#424242' } // Explicit color for Android
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

                  {/* Google Login Button */}
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
                      onPress={handleRegister}
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
  );

  
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
}); 