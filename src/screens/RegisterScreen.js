import React, { useState } from 'react';
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
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';
import { validateEmail, validatePassword } from '../constants/utils';
import { useAuth } from '../context/FirebaseAuthContext';
import useGoogleAuth from '../hooks/useGoogleAuth';

export default function RegisterScreen({ navigation }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);

  const { register, loading } = useAuth();
  const {
    signInWithGoogle: triggerGoogleSignIn,
    isAvailable: isGoogleAvailable,
    isPrompting: isGooglePrompting,
  } = useGoogleAuth();

  /**
   * Update form data
   * @param {string} field 
   * @param {string} value 
   */
  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  /**
   * Validate form inputs
   * @returns {boolean} True if form is valid
   */
  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom est requis';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Adresse e-mail invalide';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Le numéro de téléphone est requis';
    }

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
   * Handle Google registration (sign-in)
   */
  const handleGoogleSignup = async () => {
    setGeneralError(null);
    const result = await triggerGoogleSignIn();
    if (result?.error) {
      setGeneralError(result.error);
    }
  };

  /**
   * Handle user registration
   */
  const handleRegister = async () => {
    setGeneralError(null);

    if (!validateForm()) {
      return;
    }

    try {
      // Prepare the registration payload according to the API specification
      const registrationData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
        role: 'USER'
      };

      const user = await register(registrationData);
      console.log('✅ Registration successful:', user.firstName);
      
      // Show success modal
      setRegisteredUser(user);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('❌ Registration failed:', error.message);
      // Error handling is done in the AuthContext with Toast
    }
  };

  /**
   * Navigate to login screen
   */
  const handleLogin = () => {
    navigation.navigate('Login', { skipWelcomeSlides: true });
  };

  /**
   * Render terms of service modal
   */
  const renderTermsModal = () => (
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
              <Ionicons name="close" size={24} color={COLORS.text} />
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
   * Render success modal
   */
  const renderSuccessModal = () => (
    <Modal
      visible={showSuccessModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowSuccessModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.successModalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.successModalTitle}>Compte créé avec succès !</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowSuccessModal(false)}
            >
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {/* Success Icon */}
          <View style={styles.successIconContainer}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark" size={32} color="#4CAF50" />
            </View>
          </View>

          {/* Modal Content */}
          <View style={styles.modalContent}>
            <Text style={styles.successMainMessage}>
              Félicitations ! Votre compte a été créé avec succès.
            </Text>
            <Text style={styles.successDetailedMessage}>
              Bienvenue dans la communauté LaSo Coach ! Votre compte pour{' '}
              <Text style={styles.successEmail}>{registeredUser?.email}</Text> est maintenant actif.
            </Text>
          </View>

          {/* Modal Footer */}
          <View style={styles.successModalFooter}>
            <TouchableOpacity
              style={styles.successModalButton}
              onPress={() => {
                setShowSuccessModal(false);
                // Navigation will be handled by the authentication flow
                // The app will automatically redirect to dashboard
              }}
            >
              <LinearGradient
                colors={['#4CAF50', '#2196F3']}
                style={styles.successButtonGradient}
              >
                <Text style={styles.successModalButtonText}>Commencer mon parcours</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#8BC34A', '#9CCC65']}
        style={styles.container}
      >
        <SafeAreaView style={styles.container}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces={false}
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

                {/* Motto */}
                <Text style={styles.motto}>
                  Votre parcours pour le rééquilibrage alimentaire commence ici.
                </Text>

                {/* Title */}
                <Text style={styles.title}>Création de votre compte</Text>

                {/* Form */}
                <View style={styles.form}>
                  {/* First Name Input */}
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={[
                        styles.input,
                        errors.firstName && styles.inputError
                      ]}
                      placeholder="Prénom *"
                      placeholderTextColor="#999"
                      value={formData.firstName}
                      onChangeText={(text) => updateFormData('firstName', text)}
                      autoCapitalize="words"
                      autoCorrect={false}
                      editable={!loading}
                    />
                    <TouchableOpacity style={styles.inputIcon}>
                      <Ionicons name="lock-closed" size={16} color="#999" />
                    </TouchableOpacity>
                    {errors.firstName && (
                      <Text style={styles.errorText}>{errors.firstName}</Text>
                    )}
                  </View>

                  {/* Last Name Input */}
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={[
                        styles.input,
                        errors.lastName && styles.inputError
                      ]}
                      placeholder="Nom *"
                      placeholderTextColor="#999"
                      value={formData.lastName}
                      onChangeText={(text) => updateFormData('lastName', text)}
                      autoCapitalize="words"
                      autoCorrect={false}
                      editable={!loading}
                    />
                    {errors.lastName && (
                      <Text style={styles.errorText}>{errors.lastName}</Text>
                    )}
                  </View>

                  {/* Email Input */}
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={[
                        styles.input,
                        errors.email && styles.inputError
                      ]}
                      placeholder="E-mail *"
                      placeholderTextColor="#999"
                      value={formData.email}
                      onChangeText={(text) => updateFormData('email', text)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!loading}
                    />
                    {errors.email && (
                      <Text style={styles.errorText}>{errors.email}</Text>
                    )}
                  </View>

                  {/* Phone Input */}
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={[
                        styles.input,
                        errors.phone && styles.inputError
                      ]}
                      placeholder="Téléphone *"
                      placeholderTextColor="#999"
                      value={formData.phone}
                      onChangeText={(text) => updateFormData('phone', text)}
                      keyboardType="phone-pad"
                      autoCorrect={false}
                      editable={!loading}
                    />
                    {errors.phone && (
                      <Text style={styles.errorText}>{errors.phone}</Text>
                    )}
                  </View>

                  {/* Password Input */}
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={[
                        styles.input,
                        errors.password && styles.inputError
                      ]}
                      placeholder="Mot de passe *"
                      placeholderTextColor="#999"
                      value={formData.password}
                      onChangeText={(text) => updateFormData('password', text)}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!loading}
                    />
                    <View style={styles.passwordIcons}>
                      <TouchableOpacity style={styles.inputIcon}>
                        <Ionicons name="ellipsis-horizontal" size={16} color="#999" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.inputIcon}
                        onPress={() => setShowPassword(!showPassword)}
                        disabled={loading}
                      >
                        <Ionicons
                          name={showPassword ? "eye-off" : "eye"}
                          size={16}
                          color="#999"
                        />
                      </TouchableOpacity>
                    </View>
                    {errors.password && (
                      <Text style={styles.errorText}>{errors.password}</Text>
                    )}
                  </View>

                  {/* Confirm Password Input */}
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={[
                        styles.input,
                        errors.confirmPassword && styles.inputError
                      ]}
                      placeholder="Confirmer mot de passe *"
                      placeholderTextColor="#999"
                      value={formData.confirmPassword}
                      onChangeText={(text) => updateFormData('confirmPassword', text)}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!loading}
                    />
                    <View style={styles.passwordIcons}>
                      <TouchableOpacity style={styles.inputIcon}>
                        <Ionicons name="ellipsis-horizontal" size={16} color="#999" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.inputIcon}
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={loading}
                      >
                        <Ionicons
                          name={showConfirmPassword ? "eye-off" : "eye"}
                          size={16}
                          color="#999"
                        />
                      </TouchableOpacity>
                    </View>
                    {errors.confirmPassword && (
                      <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                    )}
                  </View>

                  {/* Register Button */}
                  <TouchableOpacity
                    style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                    onPress={handleRegister}
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
                        <Text style={styles.registerButtonText}>Création...</Text>
                      </View>
                    ) : (
                      <Text style={styles.registerButtonText}>Créer mon compte</Text>
                    )}
                  </TouchableOpacity>

                  {/* Google Signup Button */}
                  <TouchableOpacity
                    style={[styles.googleButton, loading && styles.registerButtonDisabled]}
                    onPress={handleGoogleSignup}
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

                  {generalError && (
                    <Text style={styles.generalErrorText}>{generalError}</Text>
                  )}

                  {/* Login Link */}
                  <View style={styles.loginContainer}>
                    <Text style={styles.loginText}>Vous avez déjà un compte ? </Text>
                    <TouchableOpacity
                      onPress={handleLogin}
                      disabled={loading}
                    >
                      <Text style={styles.loginLink}>Connectez vous</Text>
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
      {renderTermsModal()}
      {renderSuccessModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 40,
    paddingBottom: SPACING.xl,
    minHeight: '100%',
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
    minHeight: 600,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 150,
    height: 100,
  },
  motto: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: 'serif',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
    position: 'relative',
    minHeight: 60,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 52,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  inputIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  passwordIcons: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  registerButton: {
    backgroundColor: '#000',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  registerButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spinner: {
    marginRight: SPACING.sm,
  },
  registerButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 0,
  },
  loginText: {
    color: '#999',
    fontSize: 16,
  },
  loginLink: {
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
    color: COLORS.text,
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
    color: COLORS.text,
  },
  termsBold: {
    fontWeight: 'bold',
  },
  termsSeparator: {
    color: '#999',
  },
  // Success Modal Styles
  successModalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    margin: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  successModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A5D23',
    textAlign: 'center',
    flex: 1,
  },
  successIconContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  successIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successMainMessage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  successDetailedMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  successEmail: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  successModalFooter: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  successModalButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  successButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  successModalButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
}); 