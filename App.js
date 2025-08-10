import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  Alert, 
  TextInput,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { authAPI } from './src/services/api';
import Config from './src/config/env';
import DashboardScreen from './src/screens/DashboardScreen';

// Simple auth state management
function useSimpleAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  const login = async (email, password) => {
    try {
      console.log('🔐 Starting login process...');
      console.log('📍 API Configuration:', {
        API_BASE_URL: Config.API_BASE_URL,
        OFFLINE_MODE: Config.OFFLINE_MODE,
        DEBUG_MODE: Config.DEBUG_MODE,
      });
      
      // Try real API login
      const response = await authAPI.login(email, password);
      
      console.log('✅ Login response received:', response);
      console.log('🔍 Response keys:', Object.keys(response));
      console.log('🔍 Token in response:', response.token ? 'YES' : 'NO');
      console.log('🔍 RefreshToken in response:', response.refreshToken ? 'YES' : 'NO');
      
      // Store tokens for subsequent API calls
      if (response.token) {
        console.log('🔑 Token found in response, storing...');
        const { TokenManager } = await import('./src/services/tokenManager');
        await TokenManager.storeTokens(response.token, response.refreshToken || '');
        console.log('✅ Tokens stored successfully');
        
        // Verify tokens were stored
        const verification = await TokenManager.getTokens();
        console.log('🔍 Verification - tokens stored:', {
          hasToken: !!verification.token,
          hasRefreshToken: !!verification.refreshToken,
          tokenMatch: verification.token === response.token
        });
      } else {
        console.warn('⚠️ No token found in login response:', Object.keys(response));
      }
      
      setUser({
        name: response.name || 'API User',
        email: response.email,
        ...response
      });
      setIsLoggedIn(true);
      return true;
    } catch (error) {
      console.error('❌ Login error:', error);
      Alert.alert('Login Failed', error.message);
      return false;
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Starting logout process...');
      
      // Call backend logout endpoint
      await authAPI.logout();
      console.log('✅ Backend logout successful');
      
      // Clear stored tokens
      const { TokenManager } = await import('./src/services/tokenManager');
      await TokenManager.clearTokens();
      console.log('✅ Tokens cleared from storage');
      
      // Clear local state
      setUser(null);
      setIsLoggedIn(false);
      
      Alert.alert('Déconnexion', 'À bientôt !');
      console.log('✅ Logout completed successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
      
      // Even if API call fails, clear local state and tokens
      try {
        const { TokenManager } = await import('./src/services/tokenManager');
        await TokenManager.clearTokens();
        console.log('✅ Tokens cleared from storage (fallback)');
      } catch (tokenError) {
        console.error('❌ Error clearing tokens:', tokenError);
      }
      
      setUser(null);
      setIsLoggedIn(false);
      Alert.alert('Déconnexion', 'Déconnecté localement');
      console.log('⚠️ Logout completed with errors');
    }
  };

  return { isLoggedIn, user, login, logout };
}

// Beautiful LaSo Coach Login component
function LasoCoachLogin({ onLogin }) {
  const [email, setEmail] = useState('test@example.com'); // Pre-fill for testing
  const [password, setPassword] = useState('password'); // Pre-fill for testing
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  
  // Sign up form states
  const [signUpForm, setSignUpForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] = useState(false);
  const [signUpLoading, setSignUpLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await onLogin(email, password);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
    setForgotPasswordEmail('');
    setForgotPasswordSuccess(false);
  };

  const handleForgotPasswordSubmit = async () => {
    if (!forgotPasswordEmail.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre adresse e-mail.');
      return;
    }
    
    setForgotPasswordLoading(true);
    try {
      // Simulate API call for password reset
      await new Promise(resolve => setTimeout(resolve, 1000));
      setForgotPasswordSuccess(true);
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur s\'est produite. Veuillez réessayer.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleSignUp = () => {
    setShowSignUp(true);
    setSignUpForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: ''
    });
  };

  const handleSignUpSubmit = async () => {
    // Validate form
    if (!signUpForm.firstName.trim() || !signUpForm.lastName.trim() || 
        !signUpForm.email.trim() || !signUpForm.password.trim() || 
        !signUpForm.confirmPassword.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }
    
    if (signUpForm.password !== signUpForm.confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }
    
    if (signUpForm.password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    
    setSignUpLoading(true);
    try {
      // Simulate API call for registration
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert('Succès', 'Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
      setShowSignUp(false);
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur s\'est produite lors de la création du compte.');
    } finally {
      setSignUpLoading(false);
    }
  };

  const updateSignUpForm = (field, value) => {
    setSignUpForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <LinearGradient
      colors={['#8BC34A', '#9CCC65']} // Light green gradient
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Login Card */}
            <View style={styles.loginCard}>
              {/* Logo */}
              <View style={styles.logoContainer}>
                <Image 
                  source={require('./assets/logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

              {/* Title */}
              <Text style={styles.title}>Connexion à votre compte</Text>

              {/* Email Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="E-mail *"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <View style={styles.inputIcon}>
                  <Ionicons name="ellipsis-horizontal" size={20} color="#999" />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Mot de passe *"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <View style={styles.inputIconsRow}>
                  <TouchableOpacity style={styles.inputIcon}>
                    <Ionicons name="ellipsis-horizontal" size={20} color="#999" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.inputIcon}
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    <Ionicons 
                      name={showPassword ? "eye-off" : "eye"} 
                      size={20} 
                      color="#999" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Login Button */}
              <TouchableOpacity 
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.loginButtonText}>Se connecter</Text>
                )}
              </TouchableOpacity>

              {/* Forgot Password */}
              <TouchableOpacity 
                style={styles.forgotPasswordButton}
                onPress={handleForgotPassword}
                disabled={isLoading}
              >
                <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
              </TouchableOpacity>

              {/* Register Link */}
              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>Vous n'avez pas de compte ? </Text>
                <TouchableOpacity 
                  onPress={handleSignUp}
                  disabled={isLoading}
                >
                  <Text style={styles.registerLink}>Inscrivez-vous</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms */}
            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                Sous réserve de conditions d'utilisation, Lire nos{' '}
                <Text style={styles.termsLink}>Termes de services</Text>
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Réinitialiser le mot de passe</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowForgotPassword(false)}
              >
                <Ionicons name="close" size={24} color="#424242" />
              </TouchableOpacity>
            </View>

            {!forgotPasswordSuccess ? (
              <>
                <Text style={styles.modalDescription}>
                  Entrez votre adresse e-mail ci-dessous. Nous vous enverrons un lien pour réinitialiser votre mot de passe.
                </Text>

                <View style={styles.modalInputContainer}>
                  <Text style={styles.inputLabel}>Adresse e-mail *</Text>
                  <View style={styles.modalInputWrapper}>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="Votre adresse e-mail"
                      placeholderTextColor="#999"
                      value={forgotPasswordEmail}
                      onChangeText={setForgotPasswordEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!forgotPasswordLoading}
                    />
                    <View style={styles.modalInputIcons}>
                      <Ionicons name="chevron-down" size={16} color="#999" />
                      <Ionicons name="information-circle" size={16} color="#999" />
                    </View>
                  </View>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={styles.modalButtonSecondary}
                    onPress={() => setShowForgotPassword(false)}
                    disabled={forgotPasswordLoading}
                  >
                    <Text style={styles.modalButtonSecondaryText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButtonPrimary, forgotPasswordLoading && styles.modalButtonDisabled]}
                    onPress={handleForgotPasswordSubmit}
                    disabled={forgotPasswordLoading}
                  >
                    {forgotPasswordLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.modalButtonPrimaryText}>Envoyer</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
                </View>
                <Text style={styles.successTitle}>Email envoyé avec succès !</Text>
                <Text style={styles.successDescription}>
                  Si un compte existe avec l'adresse{' '}
                  <Text style={styles.successEmail}>{forgotPasswordEmail}</Text>,{' '}
                  un email de réinitialisation a été envoyé.{'\n'}
                  Vérifiez votre boîte de réception et suivez les instructions.
                </Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={styles.modalButtonSecondary}
                    onPress={() => {
                      setForgotPasswordSuccess(false);
                      setForgotPasswordEmail('');
                    }}
                  >
                    <Text style={styles.modalButtonSecondaryText}>Réessayer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.modalButtonPrimary}
                    onPress={() => setShowForgotPassword(false)}
                  >
                    <Text style={styles.modalButtonPrimaryText}>Fermer</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      )}

      {/* Sign Up Modal */}
      {showSignUp && (
        <View style={styles.modalOverlay}>
          <View style={styles.signUpModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Création de votre compte</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowSignUp(false)}
              >
                <Ionicons name="close" size={24} color="#424242" />
              </TouchableOpacity>
            </View>

            {/* Logo */}
            <View style={styles.signUpLogoContainer}>
              <Image 
                source={require('./assets/logo.png')}
                style={styles.signUpLogo}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.signUpDescription}>
              Votre parcours pour le rééquilibrage alimentaire commence ici.
            </Text>

            <ScrollView style={styles.signUpForm} showsVerticalScrollIndicator={false}>
              {/* First Name */}
              <View style={styles.modalInputContainer}>
                <Text style={styles.inputLabel}>Prénom *</Text>
                <View style={styles.modalInputWrapper}>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Votre prénom"
                    placeholderTextColor="#999"
                    value={signUpForm.firstName}
                    onChangeText={(value) => updateSignUpForm('firstName', value)}
                    autoCapitalize="words"
                    autoCorrect={false}
                    editable={!signUpLoading}
                  />
                  <View style={styles.modalInputIcon}>
                    <Ionicons name="ellipsis-horizontal" size={16} color="#999" />
                  </View>
                </View>
              </View>

              {/* Last Name */}
              <View style={styles.modalInputContainer}>
                <Text style={styles.inputLabel}>Nom *</Text>
                <View style={styles.modalInputWrapper}>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Votre nom"
                    placeholderTextColor="#999"
                    value={signUpForm.lastName}
                    onChangeText={(value) => updateSignUpForm('lastName', value)}
                    autoCapitalize="words"
                    autoCorrect={false}
                    editable={!signUpLoading}
                  />
                  <View style={styles.modalInputIcon}>
                    <Ionicons name="ellipsis-horizontal" size={16} color="#999" />
                  </View>
                </View>
              </View>

              {/* Email */}
              <View style={styles.modalInputContainer}>
                <Text style={styles.inputLabel}>E-mail *</Text>
                <View style={styles.modalInputWrapper}>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Votre adresse e-mail"
                    placeholderTextColor="#999"
                    value={signUpForm.email}
                    onChangeText={(value) => updateSignUpForm('email', value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!signUpLoading}
                  />
                  <View style={styles.modalInputIcon}>
                    <Ionicons name="ellipsis-horizontal" size={16} color="#999" />
                  </View>
                </View>
              </View>

              {/* Phone */}
              <View style={styles.modalInputContainer}>
                <Text style={styles.inputLabel}>Téléphone</Text>
                <View style={styles.modalInputWrapper}>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Votre numéro de téléphone"
                    placeholderTextColor="#999"
                    value={signUpForm.phone}
                    onChangeText={(value) => updateSignUpForm('phone', value)}
                    keyboardType="phone-pad"
                    editable={!signUpLoading}
                  />
                  <View style={styles.modalInputIcon}>
                    <Ionicons name="ellipsis-horizontal" size={16} color="#999" />
                  </View>
                </View>
              </View>

              {/* Password */}
              <View style={styles.modalInputContainer}>
                <Text style={styles.inputLabel}>Mot de passe *</Text>
                <View style={styles.modalInputWrapper}>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Votre mot de passe"
                    placeholderTextColor="#999"
                    value={signUpForm.password}
                    onChangeText={(value) => updateSignUpForm('password', value)}
                    secureTextEntry={!showSignUpPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!signUpLoading}
                  />
                  <View style={styles.modalInputIcons}>
                    <Ionicons name="ellipsis-horizontal" size={16} color="#999" />
                    <TouchableOpacity onPress={() => setShowSignUpPassword(!showSignUpPassword)}>
                      <Ionicons 
                        name={showSignUpPassword ? "eye-off" : "eye"} 
                        size={16} 
                        color="#999" 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Confirm Password */}
              <View style={styles.modalInputContainer}>
                <Text style={styles.inputLabel}>Confirmer mot de passe *</Text>
                <View style={styles.modalInputWrapper}>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Confirmez votre mot de passe"
                    placeholderTextColor="#999"
                    value={signUpForm.confirmPassword}
                    onChangeText={(value) => updateSignUpForm('confirmPassword', value)}
                    secureTextEntry={!showSignUpConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!signUpLoading}
                  />
                  <View style={styles.modalInputIcons}>
                    <Ionicons name="ellipsis-horizontal" size={16} color="#999" />
                    <TouchableOpacity onPress={() => setShowSignUpConfirmPassword(!showSignUpConfirmPassword)}>
                      <Ionicons 
                        name={showSignUpConfirmPassword ? "eye-off" : "eye"} 
                        size={16} 
                        color="#999" 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity 
              style={[styles.signUpButton, signUpLoading && styles.signUpButtonDisabled]}
              onPress={handleSignUpSubmit}
              disabled={signUpLoading}
            >
              {signUpLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.signUpButtonText}>Créer mon compte</Text>
              )}
            </TouchableOpacity>

            <View style={styles.signUpLoginLink}>
              <Text style={styles.signUpLoginText}>Vous avez déjà un compte ? </Text>
              <TouchableOpacity onPress={() => setShowSignUp(false)}>
                <Text style={styles.signUpLoginLinkText}>Connectez vous</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </LinearGradient>
  );
}

// Main App component
export default function App() {
  console.log('📱 LaSo Coach App starting...');
  
  // Log current configuration immediately
  console.log('🔧 Current Configuration:', {
    API_BASE_URL: Config.API_BASE_URL,
    OFFLINE_MODE: Config.OFFLINE_MODE,
    DEBUG_MODE: Config.DEBUG_MODE,
    NODE_ENV: Config.NODE_ENV,
  });
  
  // Check for existing tokens on app start
  useEffect(() => {
    const checkExistingTokens = async () => {
      try {
        const { TokenManager } = await import('./src/services/tokenManager');
        const tokens = await TokenManager.getTokens();
        console.log('🔍 App startup - checking existing tokens:', {
          hasToken: !!tokens.token,
          hasRefreshToken: !!tokens.refreshToken,
          tokenPreview: tokens.token ? tokens.token.substring(0, 20) + '...' : 'null'
        });
      } catch (error) {
        console.error('❌ Error checking existing tokens:', error);
      }
    };
    
    checkExistingTokens();
  }, []);
  
  const { isLoggedIn, user, login, logout } = useSimpleAuth();

  return (
    <>
      {isLoggedIn ? (
        <DashboardScreen user={user} onLogout={logout} />
      ) : (
        <LasoCoachLogin onLogin={login} />
      )}
      <StatusBar style="light" />
    </>
  );
}

const styles = StyleSheet.create({
  // Login Styles
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  loginCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    marginVertical: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 120,
    height: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#424242',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  input: {
    borderWidth: 2,
    borderColor: '#424242',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#424242',
    backgroundColor: '#FFFFFF',
    paddingRight: 60,
  },
  inputIcon: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
    padding: 4,
  },
  inputIconsRow: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    minHeight: 56,
  },
  loginButtonDisabled: {
    backgroundColor: '#757575',
    shadowOpacity: 0,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  forgotPasswordButton: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 8,
  },
  forgotPasswordText: {
    color: '#757575',
    fontSize: 16,
    fontWeight: '500',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  registerText: {
    color: '#424242',
    fontSize: 16,
    fontWeight: '500',
  },
  registerLink: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
  termsContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 24,
  },
  termsText: {
    color: '#424242',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
    color: '#4CAF50',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },

  // Dashboard Styles
  dashboardContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  dashboardContent: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  headerLogo: {
    width: 80,
    height: 50,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  welcomeSection: {
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#424242',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#757575',
  },
  actionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  status: {
    fontSize: 16,
    color: '#4CAF50',
    textAlign: 'center',
    fontWeight: '500',
  },
  userInfo: {
    fontSize: 16,
    color: '#424242',
    marginBottom: 8,
  },

  // Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    width: '90%',
    maxWidth: 450,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#424242',
  },
  closeButton: {
    padding: 8,
  },
  modalDescription: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalInputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#424242',
    marginBottom: 8,
    fontWeight: '500',
  },
  modalInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#424242',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  modalInput: {
    flex: 1,
    fontSize: 16,
    color: '#424242',
    paddingRight: 10,
  },
  modalInputIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
  },
  modalInputIcon: {
    paddingLeft: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
  },
  modalButtonPrimary: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  modalButtonSecondary: {
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  modalButtonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonSecondaryText: {
    color: '#424242',
    fontSize: 16,
    fontWeight: '500',
  },
  modalButtonDisabled: {
    backgroundColor: '#757575',
    shadowOpacity: 0,
  },
  successIcon: {
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 10,
  },
  successDescription: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 24,
  },
  successEmail: {
    fontWeight: '600',
  },
  signUpModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    width: '90%',
    maxWidth: 450,
    maxHeight: '90%',
    marginTop: 60, // Add top margin to avoid status bar
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  signUpDescription: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 24,
  },
  signUpForm: {
    marginBottom: 24,
  },
  signUpButton: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    minHeight: 56,
  },
  signUpButtonDisabled: {
    backgroundColor: '#757575',
    shadowOpacity: 0,
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  signUpLoginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  signUpLoginText: {
    color: '#424242',
    fontSize: 16,
    fontWeight: '500',
  },
  signUpLoginLinkText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
  signUpLogoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  signUpLogo: {
    width: 100,
    height: 60,
  },
});
