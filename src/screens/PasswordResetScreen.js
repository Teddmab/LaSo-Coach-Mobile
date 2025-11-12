import React, { useState, useEffect } from 'react';
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
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../constants/theme';
import { validatePassword, getPasswordStrength } from '../constants/utils';
import { useAuth } from '../context/FirebaseAuthContext';

export default function PasswordResetScreen({ navigation, route }) {
  const [step, setStep] = useState(1); // 1: email, 2: token verification, 3: new password
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: [] });
  const [verifiedEmail, setVerifiedEmail] = useState('');

  const { forgotPassword, verifyResetToken, resetPassword, loading } = useAuth();

  // Extract token from route params if available (from email link)
  useEffect(() => {
    if (route.params?.token) {
      setToken(route.params.token);
      setStep(2);
    }
  }, [route.params]);

  /**
   * Update password strength when password changes
   */
  useEffect(() => {
    if (newPassword.length > 0) {
      setPasswordStrength(getPasswordStrength(newPassword));
    }
  }, [newPassword]);

  /**
   * Clear field error when user starts typing
   * @param {string} field 
   */
  const clearError = (field) => {
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  /**
   * Handle email submission for password reset
   */
  const handleEmailSubmit = async () => {
    if (!email.trim()) {
      setErrors({ email: 'Veuillez entrer votre adresse e-mail' });
      return;
    }

    try {
      await forgotPassword(email.trim());
      setStep(2);
    } catch (error) {
      console.error('❌ Email submission failed:', error.message);
      // Error handling is done in the AuthContext with Toast
    }
  };

  /**
   * Handle token verification
   */
  const handleTokenVerification = async () => {
    if (!token.trim()) {
      setErrors({ token: 'Veuillez entrer le code de réinitialisation' });
      return;
    }

    try {
      const response = await verifyResetToken(token.trim());
      if (response.data.isValid) {
        setVerifiedEmail(response.data.email);
        setStep(3);
      }
    } catch (error) {
      console.error('❌ Token verification failed:', error.message);
      // Error handling is done in the AuthContext with Toast
    }
  };

  /**
   * Validate new password form
   * @returns {boolean} True if form is valid
   */
  const validatePasswordForm = () => {
    const newErrors = {};

    if (!newPassword.trim()) {
      newErrors.newPassword = 'Le nouveau mot de passe est requis';
    } else if (!validatePassword(newPassword)) {
      newErrors.newPassword = 'Le mot de passe ne respecte pas les critères de sécurité';
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'La confirmation du mot de passe est requise';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle password reset completion
   */
  const handlePasswordReset = async () => {
    if (!validatePasswordForm()) {
      return;
    }

    try {
      await resetPassword(token.trim(), newPassword);
      
      Alert.alert(
        'Mot de passe réinitialisé',
        'Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (error) {
      console.error('❌ Password reset failed:', error.message);
      // Error handling is done in the AuthContext with Toast
    }
  };

  /**
   * Get password strength color
   * @param {number} score 
   * @returns {string} Color for password strength indicator
   */
  const getPasswordStrengthColor = (score) => {
    switch (score) {
      case 0:
      case 1:
        return '#FF4444';
      case 2:
        return '#FF8800';
      case 3:
        return '#FFCC00';
      case 4:
      case 5:
        return '#00CC00';
      default:
        return '#CCCCCC';
    }
  };

  /**
   * Get password strength text
   * @param {number} score 
   * @returns {string} Text for password strength indicator
   */
  const getPasswordStrengthText = (score) => {
    switch (score) {
      case 0:
      case 1:
        return 'Très faible';
      case 2:
        return 'Faible';
      case 3:
        return 'Moyen';
      case 4:
        return 'Fort';
      case 5:
        return 'Très fort';
      default:
        return '';
    }
  };

  /**
   * Render step 1: Email input
   */
  const renderEmailStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Mot de passe oublié</Text>
      <Text style={styles.stepDescription}>
        Entrez votre adresse e-mail pour recevoir un lien de réinitialisation
      </Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            errors.email && styles.inputError
          ]}
          placeholder="Adresse e-mail"
          placeholderTextColor={COLORS.gray}
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            clearError('email');
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />
        {errors.email && (
          <Text style={styles.errorText}>{errors.email}</Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
        onPress={handleEmailSubmit}
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
            <Text style={styles.primaryButtonText}>Envoi en cours...</Text>
          </View>
        ) : (
          <Text style={styles.primaryButtonText}>Envoyer le lien</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  /**
   * Render step 2: Token verification
   */
  const renderTokenStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Vérification</Text>
      <Text style={styles.stepDescription}>
        Entrez le code de réinitialisation envoyé à votre adresse e-mail
      </Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            errors.token && styles.inputError
          ]}
          placeholder="Code de réinitialisation"
          placeholderTextColor={COLORS.gray}
          value={token}
          onChangeText={(text) => {
            setToken(text);
            clearError('token');
          }}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />
        {errors.token && (
          <Text style={styles.errorText}>{errors.token}</Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
        onPress={handleTokenVerification}
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
            <Text style={styles.primaryButtonText}>Vérification...</Text>
          </View>
        ) : (
          <Text style={styles.primaryButtonText}>Vérifier le code</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  /**
   * Render step 3: New password
   */
  const renderPasswordStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Nouveau mot de passe</Text>
      <Text style={styles.stepDescription}>
        Créez un nouveau mot de passe sécurisé
      </Text>

      {/* New Password */}
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            errors.newPassword && styles.inputError
          ]}
          placeholder="Nouveau mot de passe"
          placeholderTextColor={COLORS.gray}
          value={newPassword}
          onChangeText={(text) => {
            setNewPassword(text);
            clearError('newPassword');
          }}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />
        <TouchableOpacity
          style={styles.passwordToggle}
          onPress={() => setShowPassword(!showPassword)}
          disabled={loading}
        >
          <Ionicons
            name={showPassword ? "eye-off" : "eye"}
            size={20}
            color={COLORS.gray}
          />
        </TouchableOpacity>
        {errors.newPassword && (
          <Text style={styles.errorText}>{errors.newPassword}</Text>
        )}
        
        {/* Password Strength Indicator */}
        {newPassword.length > 0 && (
          <View style={styles.passwordStrengthContainer}>
            <View style={styles.passwordStrengthBar}>
              <View
                style={[
                  styles.passwordStrengthFill,
                  {
                    width: `${(passwordStrength.score / 5) * 100}%`,
                    backgroundColor: getPasswordStrengthColor(passwordStrength.score),
                  },
                ]}
              />
            </View>
            <Text style={[
              styles.passwordStrengthText,
              { color: getPasswordStrengthColor(passwordStrength.score) }
            ]}>
              {getPasswordStrengthText(passwordStrength.score)}
            </Text>
          </View>
        )}
      </View>

      {/* Confirm Password */}
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            errors.confirmPassword && styles.inputError
          ]}
          placeholder="Confirmer le mot de passe"
          placeholderTextColor={COLORS.gray}
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            clearError('confirmPassword');
          }}
          secureTextEntry={!showConfirmPassword}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />
        <TouchableOpacity
          style={styles.passwordToggle}
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          disabled={loading}
        >
          <Ionicons
            name={showConfirmPassword ? "eye-off" : "eye"}
            size={20}
            color={COLORS.gray}
          />
        </TouchableOpacity>
        {errors.confirmPassword && (
          <Text style={styles.errorText}>{errors.confirmPassword}</Text>
        )}
      </View>

      {/* Password Requirements */}
      <View style={styles.passwordRequirements}>
        <Text style={styles.requirementsTitle}>Exigences du mot de passe :</Text>
        {passwordStrength.feedback.map((requirement, index) => (
          <View key={index} style={styles.requirementItem}>
            <Ionicons
              name={passwordStrength.score >= index + 1 ? "checkmark-circle" : "close-circle"}
              size={16}
              color={passwordStrength.score >= index + 1 ? COLORS.success : COLORS.error}
            />
            <Text style={[
              styles.requirementText,
              { color: passwordStrength.score >= index + 1 ? COLORS.success : COLORS.error }
            ]}>
              {requirement}
            </Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
        onPress={handlePasswordReset}
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
            <Text style={styles.primaryButtonText}>Réinitialisation...</Text>
          </View>
        ) : (
          <Text style={styles.primaryButtonText}>Réinitialiser le mot de passe</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
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
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
                disabled={loading}
              >
                <Ionicons name="arrow-back" size={24} color={COLORS.white} />
              </TouchableOpacity>
              
              <View style={styles.logoContainer}>
                <Image
                  source={require('../../assets/logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(step / 3) * 100}%` }
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                Étape {step} sur 3
              </Text>
            </View>

            {/* Step Content */}
            <View style={styles.contentContainer}>
              {step === 1 && renderEmailStep()}
              {step === 2 && renderTokenStep()}
              {step === 3 && renderPasswordStep()}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  backButton: {
    padding: SPACING.sm,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    marginRight: 40, // Compensate for back button
  },
  logo: {
    width: 120,
    height: 40,
  },
  progressContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 2,
  },
  progressText: {
    color: COLORS.white,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  stepDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  inputContainer: {
    marginBottom: SPACING.md,
    position: 'relative',
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  passwordToggle: {
    position: 'absolute',
    right: SPACING.lg,
    top: SPACING.lg,
    padding: SPACING.xs,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  passwordStrengthContainer: {
    marginTop: SPACING.sm,
  },
  passwordStrengthBar: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  passwordStrengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  passwordStrengthText: {
    fontSize: 12,
    marginTop: SPACING.xs,
    fontWeight: '500',
  },
  passwordRequirements: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  requirementText: {
    fontSize: 12,
    marginLeft: SPACING.xs,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  primaryButtonDisabled: {
    backgroundColor: COLORS.gray,
    shadowOpacity: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spinner: {
    marginRight: SPACING.sm,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
}); 